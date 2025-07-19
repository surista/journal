// High-Quality Pitch Shifter using SoundTouch algorithm
// This provides much better quality than simple delay-based pitch shifting

export class HighQualityPitchShifter {
    constructor() {
        this.audioContext = null;
        this.sourceNode = null;
        this.scriptNode = null;
        this.outputGain = null;
        
        // SoundTouch parameters
        this.pitchSemitones = 0;
        this.tempo = 1.0;
        this.rate = 1.0;
        
        // Processing parameters
        this.BUFFER_SIZE = 4096;
        this.SAMPLE_RATE = 44100;
        
        // Initialize the SoundTouch filter
        this.initializeSoundTouch();
        
        // Processing buffers
        this.inputBuffer = [];
        this.outputBuffer = [];
        this.samples = new Float32Array(this.BUFFER_SIZE * 2);
    }
    
    initializeSoundTouch() {
        // Load SoundTouch library dynamically
        if (typeof SoundTouch === 'undefined') {
            console.warn('SoundTouch library not loaded. Loading from CDN...');
            this.loadSoundTouchLibrary();
            return;
        }
        
        this.createSoundTouchFilter();
    }
    
    async loadSoundTouchLibrary() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/soundtouchjs@0.1.30/dist/soundtouch.min.js';
            script.onload = () => {
                console.log('SoundTouch library loaded successfully');
                this.createSoundTouchFilter();
                resolve();
            };
            script.onerror = () => {
                console.error('Failed to load SoundTouch library');
                reject(new Error('Failed to load SoundTouch library'));
            };
            document.head.appendChild(script);
        });
    }
    
    createSoundTouchFilter() {
        if (typeof SoundTouch !== 'undefined') {
            this.soundTouch = new SoundTouch();
            this.soundTouch.tempo = this.tempo;
            this.soundTouch.pitch = this.pitchSemitones;
            this.soundTouch.rate = this.rate;
            
            this.filter = new SimpleFilter(this.soundTouch, this.BUFFER_SIZE);
            console.log('SoundTouch filter initialized');
        }
    }
    
    async initialize(audioContext) {
        this.audioContext = audioContext;
        this.SAMPLE_RATE = audioContext.sampleRate;
        
        // Ensure SoundTouch is loaded
        if (!this.soundTouch && typeof SoundTouch === 'undefined') {
            await this.loadSoundTouchLibrary();
        }
        
        // Create audio nodes
        this.outputGain = this.audioContext.createGain();
        this.outputGain.gain.value = 1.0;
        
        // Create ScriptProcessorNode for real-time processing
        this.scriptNode = this.audioContext.createScriptProcessor(this.BUFFER_SIZE, 2, 2);
        this.scriptNode.onaudioprocess = this.processAudio.bind(this);
        
        return this;
    }
    
    processAudio(audioProcessingEvent) {
        if (!this.filter || !this.soundTouch) {
            // Pass through if SoundTouch not initialized
            const inputBuffer = audioProcessingEvent.inputBuffer;
            const outputBuffer = audioProcessingEvent.outputBuffer;
            
            for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
                const inputData = inputBuffer.getChannelData(channel);
                const outputData = outputBuffer.getChannelData(channel);
                outputData.set(inputData);
            }
            return;
        }
        
        const inputBuffer = audioProcessingEvent.inputBuffer;
        const outputBuffer = audioProcessingEvent.outputBuffer;
        
        // Extract samples from input
        const left = inputBuffer.getChannelData(0);
        const right = inputBuffer.numberOfChannels > 1 ? inputBuffer.getChannelData(1) : left;
        
        // Interleave samples for SoundTouch
        for (let i = 0; i < left.length; i++) {
            this.samples[i * 2] = left[i];
            this.samples[i * 2 + 1] = right[i];
        }
        
        // Process through SoundTouch
        this.filter.sourceSound.extract(this.samples, left.length);
        this.filter.putSource(this.samples, left.length);
        
        // Extract processed samples
        const extractedSamples = new Float32Array(this.BUFFER_SIZE * 2);
        const framesExtracted = this.filter.extract(extractedSamples, this.BUFFER_SIZE);
        
        // De-interleave and write to output
        const outputLeft = outputBuffer.getChannelData(0);
        const outputRight = outputBuffer.numberOfChannels > 1 ? outputBuffer.getChannelData(1) : outputLeft;
        
        for (let i = 0; i < framesExtracted; i++) {
            outputLeft[i] = extractedSamples[i * 2];
            outputRight[i] = extractedSamples[i * 2 + 1];
        }
        
        // Fill any remaining samples with silence
        for (let i = framesExtracted; i < outputLeft.length; i++) {
            outputLeft[i] = 0;
            outputRight[i] = 0;
        }
    }
    
    connect(destination) {
        this.scriptNode.connect(this.outputGain);
        this.outputGain.connect(destination);
    }
    
    disconnect() {
        try {
            this.scriptNode.disconnect();
            this.outputGain.disconnect();
        } catch (e) {
            // Already disconnected
        }
    }
    
    setPitchSemitones(semitones) {
        this.pitchSemitones = Math.max(-12, Math.min(12, semitones));
        if (this.soundTouch) {
            this.soundTouch.pitch = this.pitchSemitones;
        }
    }
    
    setTempo(tempo) {
        this.tempo = Math.max(0.25, Math.min(4.0, tempo));
        if (this.soundTouch) {
            this.soundTouch.tempo = this.tempo;
        }
    }
    
    setRate(rate) {
        this.rate = Math.max(0.25, Math.min(4.0, rate));
        if (this.soundTouch) {
            this.soundTouch.rate = this.rate;
        }
    }
    
    getInputNode() {
        return this.scriptNode;
    }
    
    getOutputNode() {
        return this.outputGain;
    }
}

// Alternative implementation using native Web Audio API with better quality
export class NativePitchShifter {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.pitchRatio = 1.0;
        
        // Create nodes
        this.inputGain = this.audioContext.createGain();
        this.outputGain = this.audioContext.createGain();
        
        // Use multiple delay lines for better quality
        this.delayTime = 0.100; // 100ms
        this.delayNodes = [];
        this.modulatorNodes = [];
        this.gainNodes = [];
        
        // Create 4 delay lines for smoother processing
        for (let i = 0; i < 4; i++) {
            const delay = this.audioContext.createDelay(1.0);
            const modulator = this.audioContext.createOscillator();
            const modulatorGain = this.audioContext.createGain();
            const gain = this.audioContext.createGain();
            
            // Configure delay
            delay.delayTime.value = this.delayTime;
            
            // Configure modulator for pitch shifting
            modulator.frequency.value = (i + 1) * 0.5; // Different frequencies for each line
            modulatorGain.gain.value = 0.002; // Small modulation depth
            
            // Configure gain envelope
            gain.gain.value = 0.25; // Each contributes 25% to the output
            
            // Connect modulator to delay time
            modulator.connect(modulatorGain);
            modulatorGain.connect(delay.delayTime);
            
            // Connect audio path
            this.inputGain.connect(delay);
            delay.connect(gain);
            gain.connect(this.outputGain);
            
            // Start modulator
            modulator.start();
            
            // Store references
            this.delayNodes.push(delay);
            this.modulatorNodes.push(modulator);
            this.gainNodes.push(gain);
        }
        
        // Add dry signal for blend
        this.dryGain = this.audioContext.createGain();
        this.wetGain = this.audioContext.createGain();
        
        this.dryGain.gain.value = 0.0; // 0% dry signal
        this.wetGain.gain.value = 1.0; // 100% wet signal
        
        this.inputGain.connect(this.dryGain);
        this.dryGain.connect(this.outputGain);
        
        // Apply crossfade to reduce artifacts
        this.setupCrossfade();
    }
    
    setupCrossfade() {
        const now = this.audioContext.currentTime;
        const fadeTime = 0.05; // 50ms crossfade
        
        this.gainNodes.forEach((gain, i) => {
            const phase = (i / this.gainNodes.length) * 2 * Math.PI;
            const lfo = this.audioContext.createOscillator();
            const lfoGain = this.audioContext.createGain();
            
            lfo.frequency.value = 2; // 2Hz crossfade
            lfoGain.gain.value = 0.5;
            
            lfo.connect(lfoGain);
            lfoGain.connect(gain.gain);
            
            gain.gain.value = 0.5 + 0.5 * Math.sin(phase);
            
            lfo.start();
        });
    }
    
    setPitchShift(semitones) {
        const pitchRatio = Math.pow(2, semitones / 12);
        this.pitchRatio = pitchRatio;
        
        // Adjust delay modulation based on pitch shift
        this.modulatorNodes.forEach((modulator, i) => {
            const baseFreq = (i + 1) * 0.5;
            modulator.frequency.value = baseFreq * pitchRatio;
        });
        
        // Adjust wet/dry mix based on pitch shift amount
        const shiftAmount = Math.abs(semitones);
        if (shiftAmount < 0.1) {
            // No pitch shift, use dry signal
            this.dryGain.gain.value = 1.0;
            this.wetGain.gain.value = 0.0;
        } else {
            // Apply pitch shift with some dry signal for naturalness
            this.dryGain.gain.value = 0.0;
            this.wetGain.gain.value = 1.0;
        }
    }
    
    connect(destination) {
        this.outputGain.connect(destination);
    }
    
    disconnect() {
        try {
            this.inputGain.disconnect();
            this.outputGain.disconnect();
            this.delayNodes.forEach(node => node.disconnect());
            this.modulatorNodes.forEach(node => node.disconnect());
            this.gainNodes.forEach(node => node.disconnect());
            this.dryGain.disconnect();
        } catch (e) {
            // Already disconnected
        }
    }
    
    getInputNode() {
        return this.inputGain;
    }
    
    getOutputNode() {
        return this.outputGain;
    }
}

// Simple filter wrapper for SoundTouch
class SimpleFilter {
    constructor(soundTouch, bufferSize) {
        this.soundTouch = soundTouch;
        this.bufferSize = bufferSize;
        this.sourceSound = new SoundTouch.WebAudioBufferSource(bufferSize);
        this.sourceSound.connect(soundTouch);
    }
    
    putSource(samples, numFrames) {
        this.sourceSound.putSource(samples, numFrames);
    }
    
    extract(target, numFrames) {
        return this.soundTouch.extract(target, numFrames);
    }
}
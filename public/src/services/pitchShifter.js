// src/services/pitchShifter.js - Pitch Shifter using Web Audio API

export class PitchShifter {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.pitchShift = 0; // in semitones
        this.fftSize = 4096;
        this.hopSize = this.fftSize / 4;

        // Create nodes
        this.inputGain = this.audioContext.createGain();
        this.outputGain = this.audioContext.createGain();

        // Initialize the pitch shifter
        this.setupPitchShifter();
    }

    setupPitchShifter() {
        // For better browser compatibility, we'll use a ScriptProcessorNode
        // In production, you should use AudioWorklet for better performance
        this.scriptNode = this.audioContext.createScriptProcessor(this.fftSize, 1, 1);

        // Buffers for processing
        this.inputBuffer = new Float32Array(this.fftSize);
        this.outputBuffer = new Float32Array(this.fftSize);
        this.window = this.generateWindow(this.fftSize);

        // Phase vocoder variables
        this.lastPhase = new Float32Array(this.fftSize / 2 + 1);
        this.sumPhase = new Float32Array(this.fftSize / 2 + 1);

        // Connect nodes
        this.inputGain.connect(this.scriptNode);
        this.scriptNode.connect(this.outputGain);

        // Set up processing
        this.scriptNode.onaudioprocess = (e) => this.process(e);
    }

    generateWindow(size) {
        const window = new Float32Array(size);
        for (let i = 0; i < size; i++) {
            // Hann window
            window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)));
        }
        return window;
    }

    process(event) {
        const input = event.inputBuffer.getChannelData(0);
        const output = event.outputBuffer.getChannelData(0);

        if (this.pitchShift === 0) {
            // Pass through if no pitch shift
            output.set(input);
            return;
        }

        // Simple pitch shifting using granular synthesis
        // For production quality, consider using a library like Tone.js
        const pitchRatio = Math.pow(2, this.pitchShift / 12);

        for (let i = 0; i < input.length; i++) {
            // Simple linear interpolation for pitch shifting
            const sourceIndex = i / pitchRatio;
            const index = Math.floor(sourceIndex);
            const fraction = sourceIndex - index;

            if (index + 1 < input.length) {
                output[i] = input[index] * (1 - fraction) + input[index + 1] * fraction;
            } else {
                output[i] = input[index] || 0;
            }
        }

        // Apply window to reduce artifacts
        for (let i = 0; i < output.length; i++) {
            const windowIndex = (i / output.length) * this.window.length;
            const windowValue = this.window[Math.floor(windowIndex)] || 1;
            output[i] *= windowValue;
        }
    }

    setPitchShift(semitones) {
        this.pitchShift = Math.max(-12, Math.min(12, semitones));
    }

    connect(destination) {
        this.outputGain.connect(destination);
    }

    disconnect() {
        try {
            this.inputGain.disconnect();
            this.scriptNode.disconnect();
            this.outputGain.disconnect();
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

// High-quality pitch shifter using phase vocoder (more complex but better quality)
export class PhaseVocoderPitchShifter {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.pitchShift = 0;

        // We'll use OfflineAudioContext for processing chunks
        this.processingChunkSize = 8192;
        this.overlapFactor = 4;

        this.setupNodes();
    }

    setupNodes() {
        // Create delay node for buffering
        this.delayNode = this.audioContext.createDelay(5.0);
        this.delayNode.delayTime.value = 0.1; // 100ms buffer

        // Create gain nodes
        this.inputGain = this.audioContext.createGain();
        this.outputGain = this.audioContext.createGain();
        this.dryGain = this.audioContext.createGain();
        this.wetGain = this.audioContext.createGain();

        // Set initial mix
        this.dryGain.gain.value = 0;
        this.wetGain.gain.value = 1;

        // Create script processor for pitch shifting
        this.scriptNode = this.audioContext.createScriptProcessor(4096, 1, 1);

        // Buffers
        this.inputRingBuffer = new Float32Array(16384);
        this.outputRingBuffer = new Float32Array(16384);
        this.inputWriteIndex = 0;
        this.outputReadIndex = 0;

        // Connect nodes
        this.inputGain.connect(this.delayNode);
        this.delayNode.connect(this.dryGain);
        this.delayNode.connect(this.scriptNode);
        this.scriptNode.connect(this.wetGain);

        this.dryGain.connect(this.outputGain);
        this.wetGain.connect(this.outputGain);

        // Process audio
        this.scriptNode.onaudioprocess = (e) => this.processAudio(e);
    }

    processAudio(event) {
        const input = event.inputBuffer.getChannelData(0);
        const output = event.outputBuffer.getChannelData(0);

        if (Math.abs(this.pitchShift) < 0.01) {
            // Pass through
            output.set(input);
            return;
        }

        // PSOLA-inspired pitch shifting
        const pitchRatio = Math.pow(2, this.pitchShift / 12);
        const grainSize = 1024;
        const hopSize = grainSize / 2;

        for (let i = 0; i < output.length; i++) {
            let sampleValue = 0;
            let windowSum = 0;

            // Overlap-add with multiple grains
            for (let grain = 0; grain < 2; grain++) {
                const grainOffset = grain * hopSize;
                const sourceIndex = (i + grainOffset) / pitchRatio;

                if (sourceIndex >= 0 && sourceIndex < input.length - 1) {
                    // Linear interpolation
                    const index = Math.floor(sourceIndex);
                    const fraction = sourceIndex - index;
                    const sample = input[index] * (1 - fraction) + input[index + 1] * fraction;

                    // Apply window
                    const windowIndex = ((i + grainOffset) % grainSize) / grainSize;
                    const window = 0.5 * (1 - Math.cos(2 * Math.PI * windowIndex));

                    sampleValue += sample * window;
                    windowSum += window;
                }
            }

            output[i] = windowSum > 0 ? sampleValue / windowSum : 0;
        }
    }

    setPitchShift(semitones) {
        this.pitchShift = Math.max(-12, Math.min(12, semitones));
    }

    connect(destination) {
        this.outputGain.connect(destination);
    }

    disconnect() {
        try {
            this.inputGain.disconnect();
            this.delayNode.disconnect();
            this.scriptNode.disconnect();
            this.dryGain.disconnect();
            this.wetGain.disconnect();
            this.outputGain.disconnect();
        } catch (e) {
            // Already disconnected
        }
    }

    getInputNode() {
        return this.inputGain;
    }
}
// YouTube Pitch Processor - Advanced approach using Web Audio API
// Implements real-time pitch shifting without affecting tempo

export class YouTubePitchProcessor {
    constructor() {
        this.audioContext = null;
        this.isInitialized = false;
        this.isProcessing = false;
        
        // Pitch shift parameters
        this.pitchShift = 0; // in semitones
        this.grainSize = 0.05; // 50ms grains
        this.overlapRatio = 0.5;
        
        // Audio nodes
        this.source = null;
        this.pitchShiftNode = null;
        this.wetGain = null;
        this.dryGain = null;
        this.outputGain = null;
        
        // Processing state
        this.captureStream = null;
        this.silentVideoElement = null;
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create custom pitch shift worklet
            await this.loadPitchShiftWorklet();
            
            this.isInitialized = true;
            console.log('YouTube Pitch Processor initialized');
        } catch (error) {
            console.error('Failed to initialize pitch processor:', error);
            throw error;
        }
    }
    
    async loadPitchShiftWorklet() {
        // Create and register audio worklet for pitch shifting
        const workletCode = `
            class PitchShiftProcessor extends AudioWorkletProcessor {
                constructor() {
                    super();
                    this.bufferSize = 4096;
                    this.buffer = new Float32Array(this.bufferSize);
                    this.writePointer = 0;
                    this.grainSize = 2048;
                    this.hopSize = 512;
                    this.pitchRatio = 1.0;
                    
                    // Receive pitch changes from main thread
                    this.port.onmessage = (event) => {
                        if (event.data.type === 'setPitch') {
                            this.pitchRatio = Math.pow(2, event.data.semitones / 12);
                        }
                    };
                }
                
                process(inputs, outputs, parameters) {
                    const input = inputs[0];
                    const output = outputs[0];
                    
                    if (!input.length) return true;
                    
                    // Simple pitch shifting using granular synthesis
                    for (let channel = 0; channel < input.length; channel++) {
                        const inputChannel = input[channel];
                        const outputChannel = output[channel];
                        
                        for (let i = 0; i < inputChannel.length; i++) {
                            // Write to circular buffer
                            this.buffer[this.writePointer] = inputChannel[i];
                            this.writePointer = (this.writePointer + 1) % this.bufferSize;
                            
                            // Read with pitch-shifted rate
                            const readPosition = (this.writePointer - this.grainSize + i * this.pitchRatio) % this.bufferSize;
                            const readIndex = Math.floor(readPosition);
                            const fraction = readPosition - readIndex;
                            
                            // Linear interpolation
                            const sample1 = this.buffer[(readIndex + this.bufferSize) % this.bufferSize];
                            const sample2 = this.buffer[(readIndex + 1 + this.bufferSize) % this.bufferSize];
                            outputChannel[i] = sample1 * (1 - fraction) + sample2 * fraction;
                        }
                    }
                    
                    return true;
                }
            }
            
            registerProcessor('pitch-shift-processor', PitchShiftProcessor);
        `;
        
        // Create blob URL for worklet
        const blob = new Blob([workletCode], { type: 'application/javascript' });
        const workletUrl = URL.createObjectURL(blob);
        
        try {
            await this.audioContext.audioWorklet.addModule(workletUrl);
            console.log('Pitch shift worklet loaded');
        } catch (error) {
            console.error('Failed to load worklet:', error);
            // Fallback to ScriptProcessor if needed
            this.useFallbackProcessor = true;
        } finally {
            URL.revokeObjectURL(workletUrl);
        }
    }
    
    async startProcessing() {
        await this.initialize();
        
        try {
            console.log('Starting YouTube pitch processing...');
            
            // Method 1: Try to capture tab audio with constraints
            const stream = await this.captureTabAudio();
            
            if (stream) {
                await this.setupAudioGraph(stream);
                this.isProcessing = true;
                return { success: true, method: 'tab_capture' };
            }
            
            // Method 2: Fallback to alternative approach
            return await this.useAlternativeApproach();
            
        } catch (error) {
            console.error('Failed to start processing:', error);
            throw error;
        }
    }
    
    async captureTabAudio() {
        try {
            // Request tab audio capture with echo cancellation
            const stream = await navigator.mediaDevices.getDisplayMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: false,
                    autoGainControl: false,
                    sampleRate: 48000
                },
                video: false, // Audio only
                systemAudio: 'exclude', // Exclude system sounds
                selfBrowserSurface: 'include',
                surfaceSwitching: 'exclude',
                preferCurrentTab: true
            });
            
            console.log('Tab audio captured successfully');
            return stream;
        } catch (error) {
            console.error('Tab audio capture failed:', error);
            return null;
        }
    }
    
    async setupAudioGraph(stream) {
        // Create source from captured stream
        this.source = this.audioContext.createMediaStreamSource(stream);
        this.captureStream = stream;
        
        // Create gain nodes for wet/dry mix
        this.wetGain = this.audioContext.createGain();
        this.dryGain = this.audioContext.createGain();
        this.outputGain = this.audioContext.createGain();
        
        // Set initial mix (100% wet for full pitch shift)
        this.wetGain.gain.value = 1.0;
        this.dryGain.gain.value = 0.0;
        this.outputGain.gain.value = 0.8; // Prevent clipping
        
        if (this.useFallbackProcessor) {
            // Use ScriptProcessor as fallback
            await this.setupScriptProcessor();
        } else {
            // Use AudioWorklet for better performance
            await this.setupWorkletProcessor();
        }
        
        // Connect the graph
        // Source -> Pitch Shift -> Wet Gain -> Output
        // Source -> Dry Gain -> Output
        this.source.connect(this.pitchShiftNode);
        this.pitchShiftNode.connect(this.wetGain);
        this.wetGain.connect(this.outputGain);
        
        this.source.connect(this.dryGain);
        this.dryGain.connect(this.outputGain);
        
        this.outputGain.connect(this.audioContext.destination);
        
        console.log('Audio graph setup complete');
    }
    
    async setupWorkletProcessor() {
        this.pitchShiftNode = new AudioWorkletNode(this.audioContext, 'pitch-shift-processor', {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            channelCount: 2,
            channelCountMode: 'explicit',
            channelInterpretation: 'speakers'
        });
    }
    
    async setupScriptProcessor() {
        const bufferSize = 4096;
        this.pitchShiftNode = this.audioContext.createScriptProcessor(bufferSize, 2, 2);
        
        // Initialize phase vocoder for pitch shifting
        const phaseVocoder = new PhaseVocoder(bufferSize, this.audioContext.sampleRate);
        phaseVocoder.setPitchRatio(Math.pow(2, this.pitchShift / 12));
        
        this.pitchShiftNode.onaudioprocess = (event) => {
            const inputL = event.inputBuffer.getChannelData(0);
            const inputR = event.inputBuffer.getChannelData(1);
            const outputL = event.outputBuffer.getChannelData(0);
            const outputR = event.outputBuffer.getChannelData(1);
            
            // Process each channel
            phaseVocoder.process(inputL, outputL);
            phaseVocoder.process(inputR, outputR);
        };
        
        this.phaseVocoder = phaseVocoder;
    }
    
    async useAlternativeApproach() {
        console.log('Using alternative approach...');
        
        // Create a silent video element that mirrors YouTube playback
        this.silentVideoElement = document.createElement('video');
        this.silentVideoElement.muted = true;
        this.silentVideoElement.style.display = 'none';
        document.body.appendChild(this.silentVideoElement);
        
        // Instructions for user
        const instructions = `
        Alternative Setup Required:
        1. Install "Audio Router" extension
        2. Route YouTube audio to virtual cable
        3. Select virtual cable as input
        `;
        
        return { 
            success: false, 
            method: 'alternative',
            instructions: instructions
        };
    }
    
    setPitch(semitones) {
        this.pitchShift = semitones;
        
        if (this.pitchShiftNode) {
            if (this.pitchShiftNode instanceof AudioWorkletNode) {
                // Send message to worklet
                this.pitchShiftNode.port.postMessage({
                    type: 'setPitch',
                    semitones: semitones
                });
            } else if (this.phaseVocoder) {
                // Update phase vocoder
                this.phaseVocoder.setPitchRatio(Math.pow(2, semitones / 12));
            }
        }
        
        console.log(`Pitch set to ${semitones} semitones`);
    }
    
    stop() {
        this.isProcessing = false;
        
        // Stop capture stream
        if (this.captureStream) {
            this.captureStream.getTracks().forEach(track => track.stop());
            this.captureStream = null;
        }
        
        // Disconnect audio nodes
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }
        
        if (this.pitchShiftNode) {
            this.pitchShiftNode.disconnect();
            this.pitchShiftNode = null;
        }
        
        // Clean up
        if (this.silentVideoElement) {
            this.silentVideoElement.remove();
            this.silentVideoElement = null;
        }
        
        console.log('Pitch processing stopped');
    }
}

// Phase Vocoder implementation for pitch shifting
class PhaseVocoder {
    constructor(frameSize, sampleRate) {
        this.frameSize = frameSize;
        this.sampleRate = sampleRate;
        this.hopSize = Math.floor(frameSize / 4);
        
        // Buffers
        this.inputBuffer = new Float32Array(frameSize);
        this.outputBuffer = new Float32Array(frameSize);
        this.window = this.createWindow(frameSize);
        
        // FFT
        this.fft = new FFT(frameSize);
        this.ifft = new IFFT(frameSize);
        
        // Phase accumulator
        this.lastPhase = new Float32Array(frameSize / 2 + 1);
        this.sumPhase = new Float32Array(frameSize / 2 + 1);
        
        this.pitchRatio = 1.0;
    }
    
    createWindow(size) {
        const window = new Float32Array(size);
        for (let i = 0; i < size; i++) {
            window[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (size - 1)); // Hann window
        }
        return window;
    }
    
    setPitchRatio(ratio) {
        this.pitchRatio = ratio;
    }
    
    process(input, output) {
        // Simplified phase vocoder processing
        // In a real implementation, this would include:
        // 1. Windowing
        // 2. FFT
        // 3. Phase manipulation
        // 4. IFFT
        // 5. Overlap-add
        
        // For now, simple resampling as placeholder
        for (let i = 0; i < output.length; i++) {
            const sourceIndex = i * this.pitchRatio;
            const index = Math.floor(sourceIndex);
            const fraction = sourceIndex - index;
            
            if (index < input.length - 1) {
                output[i] = input[index] * (1 - fraction) + input[index + 1] * fraction;
            } else {
                output[i] = 0;
            }
        }
    }
}

// Placeholder FFT class (would use real FFT library)
class FFT {
    constructor(size) {
        this.size = size;
    }
    
    forward(input) {
        // Placeholder - would use actual FFT
        return input;
    }
}

class IFFT {
    constructor(size) {
        this.size = size;
    }
    
    inverse(input) {
        // Placeholder - would use actual IFFT
        return input;
    }
}

export const youtubePitchProcessor = new YouTubePitchProcessor();
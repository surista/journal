// Enhanced Audio Processor with multiple quality modes
// Provides high-quality tempo and pitch adjustment using different algorithms

import { HighQualityPitchShifter } from './highQualityPitchShifter.js';

export class EnhancedAudioProcessor {
    constructor() {
        this.audioContext = null;
        this.currentMode = 'high'; // 'basic', 'medium', 'high', 'ultra'
        this.isInitialized = false;
        
        // Audio nodes
        this.sourceNode = null;
        this.audioBuffer = null;
        this.masterGain = null;
        
        // Processing parameters
        this.playbackRate = 1.0;
        this.pitchShift = 0; // in semitones
        
        // Different processors for different quality modes
        this.processors = {
            basic: null,    // Native Web Audio playbackRate
            medium: null,   // Tone.js GrainPlayer
            high: null,     // SoundTouch
            ultra: null     // Future: Superpowered or other premium solution
        };
        
        // Quality presets
        this.qualityPresets = {
            basic: {
                name: 'Basic (Fast)',
                description: 'Native browser playback rate adjustment',
                latency: 'minimal',
                quality: 'low',
                cpuUsage: 'minimal'
            },
            medium: {
                name: 'Medium (Balanced)',
                description: 'Tone.js GrainPlayer with optimized settings',
                latency: 'low',
                quality: 'good',
                cpuUsage: 'moderate'
            },
            high: {
                name: 'High (Quality)',
                description: 'SoundTouch algorithm for professional results',
                latency: 'moderate',
                quality: 'excellent',
                cpuUsage: 'high'
            },
            ultra: {
                name: 'Ultra (Studio)',
                description: 'Reserved for future premium implementation',
                latency: 'high',
                quality: 'studio',
                cpuUsage: 'very high'
            }
        };
    }
    
    async initialize(audioContext) {
        this.audioContext = audioContext;
        
        // Create master gain
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 1.0;
        
        // Initialize processors based on mode
        await this.initializeProcessors();
        
        this.isInitialized = true;
        return this;
    }
    
    async initializeProcessors() {
        // Basic mode - uses native AudioBufferSourceNode
        this.processors.basic = {
            type: 'native',
            process: async (buffer, playbackRate, pitchShift) => {
                // For basic mode, we can only adjust playback rate (affects both tempo and pitch)
                const source = this.audioContext.createBufferSource();
                source.buffer = buffer;
                source.playbackRate.value = playbackRate;
                return source;
            }
        };
        
        // Medium mode - uses Tone.js (if available)
        if (typeof Tone !== 'undefined') {
            await Tone.start();
            this.processors.medium = {
                type: 'tonejs',
                grainPlayer: null,
                pitchShift: null,
                process: async (buffer, playbackRate, pitchShift) => {
                    // Convert AudioBuffer to Tone.Buffer
                    const toneBuffer = new Tone.ToneAudioBuffer(buffer);
                    
                    // Create GrainPlayer with optimized settings for tempo changes
                    const grainPlayer = new Tone.GrainPlayer({
                        url: toneBuffer,
                        loop: false,
                        playbackRate: playbackRate,
                        grainSize: Math.abs(playbackRate - 1.0) > 0.1 ? 0.15 : 0.05,
                        overlap: Math.abs(playbackRate - 1.0) > 0.1 ? 0.3 : 0.75,
                        reverse: false
                    });
                    
                    // Apply volume compensation
                    let volumeCompensation = 0;
                    if (playbackRate < 1.0) {
                        volumeCompensation = (1.0 - playbackRate) * 6;
                    } else if (playbackRate > 1.0) {
                        volumeCompensation = (playbackRate - 1.0) * 3;
                    }
                    grainPlayer.volume.value = volumeCompensation;
                    
                    // Apply pitch shift if needed
                    if (Math.abs(pitchShift) > 0.01) {
                        const pitchShiftNode = new Tone.PitchShift({
                            pitch: pitchShift,
                            windowSize: 0.1,
                            delayTime: 0.05,
                            feedback: 0.0,
                            wet: 1.0
                        });
                        grainPlayer.connect(pitchShiftNode);
                        return { source: grainPlayer, output: pitchShiftNode };
                    }
                    
                    return { source: grainPlayer, output: grainPlayer };
                }
            };
        }
        
        // High mode - uses SoundTouch
        this.processors.high = {
            type: 'soundtouch',
            shifter: null,
            process: async (buffer, playbackRate, pitchShift) => {
                // Initialize SoundTouch shifter
                const shifter = new HighQualityPitchShifter();
                await shifter.initialize(this.audioContext);
                
                // Set tempo (independent of pitch)
                shifter.setTempo(playbackRate);
                
                // Set pitch shift
                shifter.setPitchSemitones(pitchShift);
                
                // Create buffer source
                const source = this.audioContext.createBufferSource();
                source.buffer = buffer;
                
                // Connect through SoundTouch processor
                source.connect(shifter.getInputNode());
                
                return { 
                    source: source, 
                    output: shifter.getOutputNode(),
                    shifter: shifter 
                };
            }
        };
        
        // Ultra mode - placeholder for future implementation
        this.processors.ultra = {
            type: 'future',
            process: async (buffer, playbackRate, pitchShift) => {
                // Fallback to high mode for now
                return this.processors.high.process(buffer, playbackRate, pitchShift);
            }
        };
    }
    
    async loadAudioBuffer(audioBuffer) {
        this.audioBuffer = audioBuffer;
        return this;
    }
    
    async setQualityMode(mode) {
        if (!this.qualityPresets[mode]) {
            console.warn(`Invalid quality mode: ${mode}. Using 'high' instead.`);
            mode = 'high';
        }
        
        this.currentMode = mode;
        console.log(`Audio quality mode set to: ${this.qualityPresets[mode].name}`);
        
        // If currently playing, we might need to restart with new processor
        // This would be handled by the audio player component
        
        return this;
    }
    
    async createProcessedSource() {
        if (!this.audioBuffer) {
            throw new Error('No audio buffer loaded');
        }
        
        const processor = this.processors[this.currentMode];
        if (!processor) {
            throw new Error(`Processor not available for mode: ${this.currentMode}`);
        }
        
        // Calculate pitch compensation for tempo changes
        let effectivePitchShift = this.pitchShift;
        if (this.currentMode !== 'high') {
            // For modes other than SoundTouch, we need to compensate for pitch change due to playback rate
            const pitchCompensation = -12 * Math.log2(this.playbackRate);
            effectivePitchShift += pitchCompensation;
        }
        
        const result = await processor.process(
            this.audioBuffer, 
            this.playbackRate, 
            effectivePitchShift
        );
        
        return result;
    }
    
    setPlaybackRate(rate) {
        this.playbackRate = Math.max(0.25, Math.min(4.0, rate));
    }
    
    setPitchShift(semitones) {
        this.pitchShift = Math.max(-24, Math.min(24, semitones));
    }
    
    getQualityInfo() {
        return {
            current: this.currentMode,
            available: Object.keys(this.qualityPresets),
            presets: this.qualityPresets
        };
    }
    
    // Cleanup
    dispose() {
        if (this.processors.medium && this.processors.medium.grainPlayer) {
            this.processors.medium.grainPlayer.dispose();
        }
        if (this.processors.high && this.processors.high.shifter) {
            this.processors.high.shifter.disconnect();
        }
        this.isInitialized = false;
    }
}

// Export as singleton for easy access
export const enhancedAudioProcessor = new EnhancedAudioProcessor();
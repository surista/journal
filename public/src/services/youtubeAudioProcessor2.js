// YouTube Audio Processor v2 - Implements pitch shifting without feedback
// Uses advanced audio routing to prevent feedback loops

import { PitchShifter } from './pitchShifter.js';

export class YouTubeAudioProcessor2 {
    constructor() {
        this.audioContext = null;
        this.isProcessing = false;
        this.originalVolume = 1;
        
        // Audio nodes
        this.source = null;
        this.pitchShifter = null;
        this.gainNode = null;
        
        // Stream management
        this.captureStream = null;
        this.outputStream = null;
        
        // Feedback prevention
        this.feedbackPreventer = null;
        this.monitorNode = null;
    }
    
    async initialize() {
        if (this.audioContext) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Initialize pitch shifter
            this.pitchShifter = new PitchShifter(this.audioContext);
            await this.pitchShifter.initialize();
            
            console.log('YouTube Audio Processor v2 initialized');
        } catch (error) {
            console.error('Failed to initialize:', error);
            throw error;
        }
    }
    
    async startProcessing(youtubePlayer) {
        await this.initialize();
        
        try {
            // Step 1: Mute YouTube player first
            this.muteYouTubePlayer(youtubePlayer);
            
            // Step 2: Create separate audio context for output
            // This prevents the processed audio from being captured
            const outputContext = new AudioContext();
            
            // Step 3: Capture tab audio
            const stream = await this.captureTabAudioSafely();
            
            // Step 4: Setup processing chain with feedback prevention
            await this.setupProcessingChain(stream, outputContext);
            
            this.isProcessing = true;
            return true;
            
        } catch (error) {
            console.error('Failed to start processing:', error);
            this.unmuteYouTubePlayer(youtubePlayer);
            throw error;
        }
    }
    
    muteYouTubePlayer(player) {
        if (player && player.getVolume) {
            this.originalVolume = player.getVolume();
            player.mute();
            console.log('YouTube player muted');
        }
    }
    
    unmuteYouTubePlayer(player) {
        if (player && player.unMute) {
            player.unMute();
            player.setVolume(this.originalVolume);
            console.log('YouTube player unmuted');
        }
    }
    
    async captureTabAudioSafely() {
        // Use specific constraints to minimize feedback
        const constraints = {
            audio: {
                echoCancellation: true, // Important for feedback prevention
                noiseSuppression: true,
                autoGainControl: false,
                googEchoCancellation: true,
                googAutoGainControl: false,
                googNoiseSuppression: true,
                googHighpassFilter: true
            },
            video: false,
            preferCurrentTab: true,
            selfBrowserSurface: 'include',
            systemAudio: 'exclude' // Exclude system audio
        };
        
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
            console.log('Tab audio captured with feedback prevention');
            return stream;
        } catch (error) {
            console.error('Failed to capture tab audio:', error);
            throw error;
        }
    }
    
    async setupProcessingChain(inputStream, outputContext) {
        // Create source from captured stream
        this.source = this.audioContext.createMediaStreamSource(inputStream);
        this.captureStream = inputStream;
        
        // Create gain node for volume control
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 0.8; // Prevent clipping
        
        // Create feedback preventer (dynamics compressor + limiter)
        this.feedbackPreventer = this.audioContext.createDynamicsCompressor();
        this.feedbackPreventer.threshold.value = -12;
        this.feedbackPreventer.knee.value = 0;
        this.feedbackPreventer.ratio.value = 20;
        this.feedbackPreventer.attack.value = 0.003;
        this.feedbackPreventer.release.value = 0.25;
        
        // Setup monitoring to detect feedback
        this.monitorNode = this.audioContext.createAnalyser();
        this.monitorNode.fftSize = 256;
        this.startFeedbackMonitoring();
        
        // Connect processing chain
        this.source.connect(this.gainNode);
        this.gainNode.connect(this.feedbackPreventer);
        this.feedbackPreventer.connect(this.pitchShifter.input);
        
        // Connect to monitor
        this.pitchShifter.output.connect(this.monitorNode);
        
        // Use MediaStreamDestination to create output stream
        const streamDestination = this.audioContext.createMediaStreamDestination();
        this.monitorNode.connect(streamDestination);
        
        // Play through speakers using separate context
        const outputSource = outputContext.createMediaStreamSource(streamDestination.stream);
        outputSource.connect(outputContext.destination);
        
        console.log('Processing chain setup with feedback prevention');
    }
    
    startFeedbackMonitoring() {
        const bufferLength = this.monitorNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        let feedbackCount = 0;
        
        const checkFeedback = () => {
            if (!this.isProcessing) return;
            
            this.monitorNode.getByteFrequencyData(dataArray);
            
            // Detect potential feedback (sustained high frequencies)
            let highFreqEnergy = 0;
            for (let i = bufferLength * 0.7; i < bufferLength; i++) {
                highFreqEnergy += dataArray[i];
            }
            
            const avgHighFreq = highFreqEnergy / (bufferLength * 0.3);
            
            if (avgHighFreq > 200) {
                feedbackCount++;
                if (feedbackCount > 10) {
                    console.warn('Feedback detected! Reducing gain...');
                    this.gainNode.gain.exponentialRampToValueAtTime(
                        0.3,
                        this.audioContext.currentTime + 0.1
                    );
                    feedbackCount = 0;
                }
            } else {
                feedbackCount = Math.max(0, feedbackCount - 1);
                // Restore gain if no feedback
                if (this.gainNode.gain.value < 0.8) {
                    this.gainNode.gain.exponentialRampToValueAtTime(
                        0.8,
                        this.audioContext.currentTime + 1
                    );
                }
            }
            
            requestAnimationFrame(checkFeedback);
        };
        
        checkFeedback();
    }
    
    setPitch(semitones) {
        if (this.pitchShifter) {
            this.pitchShifter.setPitch(semitones);
            console.log(`Pitch set to ${semitones} semitones`);
        }
    }
    
    setVolume(value) {
        if (this.gainNode) {
            this.gainNode.gain.value = value * 0.8; // Max 0.8 to prevent feedback
        }
    }
    
    stop(youtubePlayer) {
        this.isProcessing = false;
        
        // Stop capture stream
        if (this.captureStream) {
            this.captureStream.getTracks().forEach(track => track.stop());
            this.captureStream = null;
        }
        
        // Disconnect nodes
        if (this.source) {
            this.source.disconnect();
        }
        
        // Unmute YouTube player
        this.unmuteYouTubePlayer(youtubePlayer);
        
        // Clean up
        if (this.pitchShifter) {
            this.pitchShifter.destroy();
        }
        
        console.log('Processing stopped');
    }
    
    isCurrentlyProcessing() {
        return this.isProcessing;
    }
    
    getStatus() {
        return {
            processing: this.isProcessing,
            pitch: this.pitchShifter?.getPitch() || 0
        };
    }
}

// Singleton instance
export const youtubeAudioProcessor2 = new YouTubeAudioProcessor2();
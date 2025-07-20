// YouTube Audio Processor - Enables pitch shifting for YouTube videos
export class YouTubeAudioProcessor {
    constructor() {
        this.audioContext = null;
        this.source = null;
        this.pitchShifter = null;
        this.gainNode = null;
        this.isInitialized = false;
        this.pitchShift = 0; // in semitones
        this.streamSource = null;
        this.mediaStream = null;
        this.isProcessing = false;
        this.toneInitialized = false;
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Check if Tone.js is available
            if (typeof Tone === 'undefined') {
                // Load Tone.js dynamically if not already loaded
                await this.loadToneJS();
            }
            
            // Initialize Tone.js
            await Tone.start();
            this.toneInitialized = true;
            console.log('Tone.js initialized for YouTube audio processing');
            
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize YouTube audio processor:', error);
            throw error;
        }
    }
    
    async loadToneJS() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/tone@14.7.77/build/Tone.js';
            script.onload = () => {
                console.log('Tone.js loaded dynamically');
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    async startTabAudioCapture() {
        await this.initialize();
        
        try {
            // Request tab audio capture with specific constraints
            const stream = await navigator.mediaDevices.getDisplayMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    sampleRate: 48000
                },
                video: false,
                preferCurrentTab: true
            });
            
            // Check if audio track exists
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length === 0) {
                throw new Error('No audio track available in the captured stream');
            }
            
            this.mediaStream = stream;
            
            // Create audio processing chain
            await this.setupAudioProcessing(stream);
            
            // Handle stream end
            stream.getAudioTracks()[0].onended = () => {
                console.log('Audio capture ended');
                this.stopProcessing();
            };
            
            this.isProcessing = true;
            return true;
        } catch (error) {
            console.error('Failed to capture tab audio:', error);
            if (error.name === 'NotAllowedError') {
                throw new Error('Please allow audio capture permission to use pitch shifting');
            }
            throw error;
        }
    }
    
    async setupAudioProcessing(stream) {
        try {
            // Create Tone.js nodes for pitch shifting
            this.pitchShifter = new Tone.PitchShift({
                pitch: this.pitchShift,
                windowSize: 0.1,
                delayTime: 0
            });
            
            // Create gain node for volume control
            this.gainNode = new Tone.Gain(1);
            
            // Create effects chain
            this.gainNode.connect(this.pitchShifter);
            this.pitchShifter.toDestination();
            
            // Connect the media stream to Tone.js
            this.source = new Tone.UserMedia();
            await this.source.open(stream);
            this.source.connect(this.gainNode);
            
            console.log('Audio processing chain established with pitch shift');
        } catch (error) {
            console.error('Failed to setup audio processing:', error);
            throw error;
        }
    }
    
    async stopProcessing() {
        this.isProcessing = false;
        
        // Stop media stream
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        
        // Disconnect audio nodes
        this.disconnect();
        
        console.log('Audio processing stopped');
    }
    
    isCurrentlyProcessing() {
        return this.isProcessing;
    }
    
    setPitch(semitones) {
        this.pitchShift = semitones;
        if (this.pitchShifter) {
            // Tone.js PitchShift uses semitones directly
            this.pitchShifter.pitch = semitones;
            console.log(`YouTube pitch set to ${semitones} semitones`);
        }
    }
    
    setVolume(value) {
        if (this.gainNode) {
            this.gainNode.gain.value = value;
        }
    }
    
    disconnect() {
        if (this.source) {
            this.source.close();
            this.source.disconnect();
            this.source.dispose();
            this.source = null;
        }
        
        if (this.pitchShifter) {
            this.pitchShifter.disconnect();
            this.pitchShifter.dispose();
            this.pitchShifter = null;
        }
        
        if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode.dispose();
            this.gainNode = null;
        }
        
        if (this.streamSource) {
            this.streamSource.disconnect();
            this.streamSource = null;
        }
    }
    
    // Get current status
    getStatus() {
        return {
            initialized: this.isInitialized,
            processing: this.isProcessing,
            pitch: this.pitchShift,
            volume: this.gainNode ? this.gainNode.gain.value : 1
        };
    }
    
    // Check if browser supports required APIs
    static isSupported() {
        return !!(navigator.mediaDevices && 
                  navigator.mediaDevices.getDisplayMedia && 
                  window.AudioContext);
    }
}

// Singleton instance
export const youtubeAudioProcessor = new YouTubeAudioProcessor();
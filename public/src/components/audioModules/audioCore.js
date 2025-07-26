// Audio Core Module - Handles core audio processing functionality
// Tone is loaded globally via script tag in index.html

// Helper function to get Tone.js
function getTone() {
    if (window.Tone) {
        return window.Tone;
    }
    console.warn('Tone.js not yet loaded, waiting...');
    return null;
}

let Tone = getTone();

export class AudioCore {
    constructor(audioService) {
        this.audioService = audioService;

        // Tone.js components
        this.grainPlayer = null;
        this.pitchShift = null;
        this.limiter = null;
        this.isInitialized = false;

        // Audio state
        this.audioBuffer = null;
        this.audioLoaded = false;
        this.duration = 0;
        this.currentTime = 0;
        this.startTime = 0;
        this.startOffset = 0;
        this.isPlaying = false;

        // Playback parameters
        this.playbackRate = 1.0;
        this.pitchShiftAmount = 0;
        this.volume = 0; // in dB

        // Quality settings
        this.qualityMode = 'medium'; // 'low', 'medium', 'high'
        this.grainSize = 0.05; // Default grain size for medium quality
        this.overlap = 0.1; // Default overlap for medium quality
    }

    async initialize() {
        if (this.isInitialized) return true;

        try {
            // Wait for Tone.js to load
            let attempts = 0;
            while (!window.Tone && attempts < 50) {
                // Wait up to 5 seconds
                await new Promise((resolve) => setTimeout(resolve, 100));
                attempts++;
            }

            Tone = window.Tone;
            if (!Tone) {
                throw new Error('Tone.js failed to load after 5 seconds');
            }

            console.log('Tone.js loaded successfully');

            // Initialize audio context
            if (Tone.context.state !== 'running') {
                await Tone.context.resume();
                await Tone.start();
            }

            // Create audio processing chain
            this.createAudioChain();

            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize audio core:', error);
            return false;
        }
    }

    createAudioChain() {
        if (!Tone) {
            console.error('Tone.js not available in createAudioChain');
            return;
        }

        // Create pitch shifter with optimized settings
        this.pitchShift = new Tone.PitchShift({
            pitch: 0,
            windowSize: 0.1, // Fixed larger window for better quality
            delayTime: 0,
            feedback: 0, // No feedback to avoid artifacts
            wet: 0 // Start with dry signal (no pitch shift)
        });

        // Create limiter to prevent clipping
        this.limiter = new Tone.Limiter(-3);

        // Connect the chain: grainPlayer -> pitchShift -> limiter -> destination
        // (grainPlayer will be created when audio is loaded)
    }

    getWindowSize() {
        // Window size affects quality and latency
        switch (this.qualityMode) {
            case 'low':
                return 0.03;
            case 'high':
                return 0.1;
            default:
                return 0.05; // medium
        }
    }

    getGrainSettings() {
        switch (this.qualityMode) {
            case 'low':
                return { grainSize: 0.03, overlap: 0.05 };
            case 'high':
                return { grainSize: 0.1, overlap: 0.2 };
            default: // medium
                return { grainSize: 0.05, overlap: 0.1 };
        }
    }

    async loadAudioBuffer(buffer, fileName = 'audio.mp3') {
        try {
            console.log('AudioCore.loadAudioBuffer called, buffer:', buffer, 'fileName:', fileName);

            if (!this.isInitialized) {
                console.log('AudioCore not initialized, initializing...');
                await this.initialize();
            }

            // Stop any currently playing audio
            if (this.isPlaying) {
                this.stop();
            }

            // Clean up previous grain player
            if (this.grainPlayer) {
                this.grainPlayer.dispose();
            }

            // Store the audio buffer
            this.audioBuffer = buffer;
            this.duration = buffer.duration;
            this.currentFileName = fileName;

            console.log('Buffer stored, duration:', this.duration);

            // Ensure Tone is available
            if (!Tone) {
                console.error('Tone.js not available in loadAudioBuffer');
                return false;
            }

            console.log('Tone.js available, creating GrainPlayer...');

            // Create new grain player with the buffer
            const { grainSize, overlap } = this.getGrainSettings();
            this.grainPlayer = new Tone.GrainPlayer({
                url: buffer,
                grainSize: grainSize,
                overlap: overlap,
                reverse: false,
                loop: false,
                playbackRate: this.playbackRate,
                onload: () => {
                    console.log('GrainPlayer loaded successfully');
                }
            });

            console.log('GrainPlayer created, waiting for load...');

            // Connect audio chain
            this.grainPlayer.connect(this.pitchShift);
            this.pitchShift.connect(this.limiter);
            this.limiter.toDestination();

            // Wait for the grainPlayer to load
            await this.grainPlayer.loaded;
            console.log('GrainPlayer fully loaded');

            this.audioLoaded = true;
            return true;
        } catch (error) {
            console.error('Failed to load audio buffer:', error);
            this.audioLoaded = false;
            return false;
        }
    }

    async play(startTime = null) {
        console.log(
            'AudioCore play() called, audioLoaded:',
            this.audioLoaded,
            'grainPlayer:',
            !!this.grainPlayer
        );

        if (!this.audioLoaded || !this.grainPlayer) {
            console.warn(
                'No audio loaded - audioLoaded:',
                this.audioLoaded,
                'grainPlayer exists:',
                !!this.grainPlayer
            );
            return false;
        }

        try {
            console.log('Starting Tone.js...');
            await Tone.start();
            console.log('Tone.js started, context state:', Tone.context.state);

            // Check if grainPlayer is loaded
            if (this.grainPlayer.loaded) {
                console.log('GrainPlayer is loaded and ready');
            } else {
                console.log('GrainPlayer not loaded, waiting...');
                await this.grainPlayer.loaded;
                console.log('GrainPlayer loaded after waiting');
            }

            if (startTime !== null) {
                this.currentTime = startTime;
                this.startOffset = startTime;
            } else if (!this.isPlaying) {
                this.startOffset = this.currentTime;
            }

            console.log('Starting grainPlayer at offset:', this.startOffset);
            console.log('GrainPlayer state before start:', this.grainPlayer.state);
            this.grainPlayer.start(0, this.startOffset);
            this.startTime = Tone.now();
            this.isPlaying = true;
            console.log('Audio playback started successfully');
            console.log('GrainPlayer state after start:', this.grainPlayer.state);

            return true;
        } catch (error) {
            console.error('Error playing audio:', error);
            console.error('Error stack:', error.stack);
            return false;
        }
    }

    pause() {
        if (!this.isPlaying || !this.grainPlayer) return;

        try {
            // Calculate current position before stopping
            const elapsed = Tone.now() - this.startTime;
            this.currentTime = this.startOffset + elapsed * this.playbackRate;

            this.grainPlayer.stop();
            this.isPlaying = false;
        } catch (error) {
            console.error('Error pausing audio:', error);
        }
    }

    stop() {
        if (!this.grainPlayer) return;

        try {
            this.grainPlayer.stop();
            this.isPlaying = false;
            this.currentTime = 0;
            this.startOffset = 0;
        } catch (error) {
            console.error('Error stopping audio:', error);
        }
    }

    seek(time) {
        const wasPlaying = this.isPlaying;

        if (wasPlaying) {
            this.pause();
        }

        this.currentTime = Math.max(0, Math.min(time, this.duration));

        if (wasPlaying) {
            this.play();
        }
    }

    setPlaybackRate(rate) {
        this.playbackRate = Math.max(0.25, Math.min(4.0, rate));

        if (this.grainPlayer) {
            this.grainPlayer.playbackRate = this.playbackRate;
        }
    }

    setPitchShift(semitones) {
        this.pitchShiftAmount = Math.max(-24, Math.min(24, semitones));

        if (this.pitchShift) {
            this.pitchShift.pitch = this.pitchShiftAmount;

            // If pitch is 0, bypass the pitch shifter to avoid quality degradation
            if (this.pitchShiftAmount === 0) {
                this.pitchShift.wet.value = 0; // Dry signal only
            } else {
                this.pitchShift.wet.value = 1; // Wet signal
            }
        }
    }

    setVolume(db) {
        this.volume = Math.max(-60, Math.min(12, db));

        if (this.grainPlayer) {
            this.grainPlayer.volume.value = this.volume;
        }
    }

    setQuality(mode) {
        if (this.qualityMode === mode) return;

        this.qualityMode = mode;

        // Update window size for pitch shifter
        if (this.pitchShift) {
            this.pitchShift.windowSize = this.getWindowSize();
        }

        // If audio is loaded, recreate grain player with new settings
        if (this.audioLoaded && this.audioBuffer) {
            const wasPlaying = this.isPlaying;
            const currentPos = this.currentTime;

            this.loadAudioBuffer(this.audioBuffer, this.currentFileName).then(() => {
                if (wasPlaying) {
                    this.play(currentPos);
                }
            });
        }
    }

    getCurrentTime() {
        if (!this.isPlaying) {
            return this.currentTime;
        }

        const elapsed = Tone.now() - this.startTime;
        return Math.min(this.startOffset + elapsed * this.playbackRate, this.duration);
    }

    getDuration() {
        return this.duration;
    }

    getState() {
        return {
            isPlaying: this.isPlaying,
            currentTime: this.getCurrentTime(),
            duration: this.duration,
            playbackRate: this.playbackRate,
            pitchShift: this.pitchShiftAmount,
            volume: this.volume,
            qualityMode: this.qualityMode,
            audioLoaded: this.audioLoaded,
            fileName: this.currentFileName
        };
    }

    destroy() {
        if (this.isPlaying) {
            this.stop();
        }

        if (this.grainPlayer) {
            this.grainPlayer.dispose();
            this.grainPlayer = null;
        }

        if (this.pitchShift) {
            this.pitchShift.dispose();
            this.pitchShift = null;
        }

        if (this.limiter) {
            this.limiter.dispose();
            this.limiter = null;
        }

        this.audioBuffer = null;
        this.audioLoaded = false;
        this.isInitialized = false;
    }
}

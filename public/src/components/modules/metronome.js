// Metronome Module - Handles metronome functionality
import { AudioService } from '../../services/audioService.js';

export class MetronomeController {
    constructor(audioService, storageService = null) {
        this.audioService = audioService || new AudioService();
        this.storageService = storageService;
        this.audioContext = null;
        this.state = {
            bpm: 80,
            isPlaying: false,
            timeSignature: 4,
            accentPattern: [true, false, false, false],
            sound: 'click', // Default until loaded
            currentBeat: 0,
            interval: null,
            audioReady: false,
            tempoProgression: { enabled: false },
            beatDropout: { enabled: false }
        };

        this.nextBeatTime = 0;
        this.beatDuration = 60 / this.state.bpm;
        this.lookAheadTime = 0.1; // How far ahead to schedule (in seconds)
        this.scheduleInterval = 25; // How often to call scheduler (in ms)
        this.timerID = null;
        this.beatCallbacks = [];

        // Load preferences
        this.loadPreferences();
    }

    async loadPreferences() {
        try {
            if (this.storageService) {
                const prefs = await this.storageService.getMetronomePreferences();
                this.state.sound = prefs.defaultSound || 'click';
            } else {
                // Fallback to localStorage
                this.state.sound = localStorage.getItem('defaultMetronomeSound') || 'click';
            }
        } catch (error) {
            console.error('Error loading metronome preferences:', error);
            this.state.sound = 'click';
        }
    }

    async savePreferences() {
        try {
            if (this.storageService) {
                await this.storageService.saveMetronomePreferences({
                    defaultSound: this.state.sound
                });
            } else {
                // Fallback to localStorage
                localStorage.setItem('defaultMetronomeSound', this.state.sound);
            }
        } catch (error) {
            console.error('Error saving metronome preferences:', error);
            // Fallback to localStorage on error
            localStorage.setItem('defaultMetronomeSound', this.state.sound);
        }
    }

    initialize() {
        this.checkAudioReady();
    }

    checkAudioReady() {
        // Audio is ready when the service exists
        // The actual AudioContext will be created on first user interaction
        this.state.audioReady = !!this.audioService;
    }

    onBeat(callback) {
        if (typeof callback === 'function') {
            this.beatCallbacks.push(callback);
        }
    }

    removeOnBeat(callback) {
        const index = this.beatCallbacks.indexOf(callback);
        if (index > -1) {
            this.beatCallbacks.splice(index, 1);
        }
    }

    setBpm(newBpm) {
        console.log('Metronome setBpm called with:', newBpm, 'current BPM:', this.state.bpm);
        newBpm = Math.max(30, Math.min(300, newBpm));

        this.state.bpm = newBpm;
        this.beatDuration = 60 / newBpm;
        console.log('Metronome BPM set to:', this.state.bpm, 'beatDuration:', this.beatDuration);

        // Note: We don't need to track currentBpm separately
        // We use this.state.bpm directly for progression calculations

        // Update UI to reflect new BPM
        if (this.onBpmChange) {
            this.onBpmChange(newBpm);
        }

        // Don't restart - just update the beat duration
        // The scheduler will pick up the new duration on the next beat
    }

    setTimeSignature(beats) {
        this.state.timeSignature = beats;

        // Update accent pattern
        this.state.accentPattern = new Array(beats).fill(false);
        this.state.accentPattern[0] = true;

        // Reset current beat
        this.state.currentBeat = 0;
    }

    toggleAccent(beat) {
        if (beat < this.state.accentPattern.length) {
            this.state.accentPattern[beat] = !this.state.accentPattern[beat];
        }
    }

    async setSound(sound) {
        this.state.sound = sound;
        await this.savePreferences();
    }

    async start(timerCallback) {
        if (!this.state.audioReady || !this.audioService) {
            console.warn('Audio not ready or service not available');
            return;
        }

        if (this.state.isPlaying) return;

        // Ensure audio context is initialized
        this.audioContext = await this.audioService.getAudioContext();
        if (!this.audioContext) {
            console.error('Failed to get audio context');
            return;
        }

        this.state.isPlaying = true;
        this.state.currentBeat = 0;

        // Reset tempo progression
        if (this.state.tempoProgression?.enabled) {
            this.state.tempoProgression.currentMeasure = 0;
            // Set BPM to the start BPM
            this.setBpm(this.state.tempoProgression.startBpm);
        }

        // Initialize timing
        this.nextBeatTime = this.audioContext.currentTime;

        // Start the timer if callback provided
        if (timerCallback) {
            timerCallback();
        }

        // Start scheduler
        this.scheduler();
        this.timerID = setInterval(() => this.scheduler(), this.scheduleInterval);
    }

    stop() {
        this.state.isPlaying = false;
        if (this.timerID) {
            clearInterval(this.timerID);
            this.timerID = null;
        }
        this.state.currentBeat = 0;
        // Don't clear audioContext - keep it for next start
    }

    pause() {
        this.stop();
    }

    scheduler() {
        if (!this.audioService || !this.audioContext) return;

        const audioContext = this.audioContext;

        while (this.nextBeatTime < audioContext.currentTime + this.lookAheadTime) {
            this.scheduleBeat(this.nextBeatTime);
            this.nextBeatTime += this.beatDuration;

            // Update beat counter
            this.state.currentBeat = (this.state.currentBeat + 1) % this.state.timeSignature;

            // Handle tempo progression
            if (this.state.currentBeat === 0 && this.state.tempoProgression?.enabled) {
                this.handleTempoProgression();
            }
        }
    }

    scheduleBeat(time) {
        const isAccent = this.state.accentPattern[this.state.currentBeat];

        // Handle beat dropout
        if (this.state.beatDropout?.enabled) {
            if (this.shouldDropBeat()) return;
        }

        // Play the beat
        this.playBeatSound(time, isAccent);

        // Trigger beat callbacks
        if (this.audioContext) {
            const currentTime = this.audioContext.currentTime;
            const delay = Math.max(0, (time - currentTime) * 1000); // Convert to milliseconds

            setTimeout(() => {
                this.beatCallbacks.forEach((callback) => {
                    callback(this.state.currentBeat, isAccent);
                });
            }, delay);
        }
    }

    playBeatSound(time, isAccent) {
        if (!this.audioContext) return;

        const audioContext = this.audioContext;
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        const frequency = this.getFrequencyForSound(this.state.sound, isAccent);
        oscillator.frequency.value = frequency;

        // Set oscillator type based on sound
        oscillator.type = this.getOscillatorType(this.state.sound);

        // Volume envelope
        const volume = isAccent ? 0.3 : 0.15;
        gainNode.gain.setValueAtTime(volume, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

        oscillator.start(time);
        oscillator.stop(time + 0.05);
    }

    shouldDropBeat() {
        if (!this.state.beatDropout) return false;

        if (this.state.beatDropout.mode === 'random') {
            return Math.random() < (this.state.beatDropout.dropoutProbability || 0.3);
        } else if (this.state.beatDropout.mode === 'pattern') {
            return this.state.beatDropout.pattern?.includes(this.state.currentBeat);
        }

        return false;
    }

    handleTempoProgression() {
        const prog = this.state.tempoProgression;
        if (!prog || !prog.enabled) return;

        prog.currentMeasure++;

        // Notify UI of measure progress
        if (this.onProgressionUpdate) {
            this.onProgressionUpdate({
                currentMeasure: prog.currentMeasure,
                measuresPerStep: prog.measuresPerStep,
                currentBpm: this.state.bpm,
                targetBpm: prog.endBpm
            });
        }

        if (prog.currentMeasure >= prog.measuresPerStep) {
            prog.currentMeasure = 0;
            const currentBpm = this.state.bpm;
            const newBpm = Math.min(currentBpm + prog.increment, prog.endBpm);

            if (newBpm !== currentBpm) {
                this.setBpm(newBpm);

                // Notify UI of BPM increase
                if (this.onBpmIncrease) {
                    this.onBpmIncrease({
                        oldBpm: currentBpm,
                        newBpm: newBpm,
                        increment: prog.increment
                    });
                }
            }
        }
    }

    getFrequencyForSound(sound, isAccent) {
        const frequencies = {
            click: isAccent ? 1000 : 800,
            beep: isAccent ? 880 : 440,
            tick: isAccent ? 2000 : 1500,
            wood: isAccent ? 1500 : 1000,
            cowbell: isAccent ? 800 : 640,
            clave: isAccent ? 2500 : 2000,
            rim: isAccent ? 500 : 400,
            hihat: isAccent ? 8000 : 6000,
            kick: isAccent ? 60 : 50,
            snare: isAccent ? 200 : 150,
            triangle: isAccent ? 4000 : 3000,
            shaker: isAccent ? 10000 : 8000
        };

        return frequencies[sound] || frequencies.click;
    }

    getOscillatorType(sound) {
        const types = {
            click: 'square',
            beep: 'sine',
            tick: 'square',
            wood: 'square',
            cowbell: 'square',
            clave: 'square',
            rim: 'triangle',
            hihat: 'square',
            kick: 'sine',
            snare: 'sawtooth',
            triangle: 'sine',
            shaker: 'sawtooth'
        };

        return types[sound] || 'square';
    }

    getState() {
        return { ...this.state };
    }

    setState(newState) {
        if (newState) {
            Object.assign(this.state, newState);
        }
    }

    // Set callbacks for UI updates
    setCallbacks(callbacks) {
        if (callbacks.onBpmChange) {
            this.onBpmChange = callbacks.onBpmChange;
        }
        if (callbacks.onProgressionUpdate) {
            this.onProgressionUpdate = callbacks.onProgressionUpdate;
        }
        if (callbacks.onBpmIncrease) {
            this.onBpmIncrease = callbacks.onBpmIncrease;
        }
    }

    destroy() {
        this.stop();
        this.onBpmChange = null;
        this.onProgressionUpdate = null;
        this.onBpmIncrease = null;
    }
}

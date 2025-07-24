// Metronome Module - Handles metronome functionality
import { AudioService } from '../../services/audioService.js';

export class MetronomeController {
    constructor(audioService) {
        this.audioService = audioService || new AudioService();
        this.state = {
            bpm: 120,
            isPlaying: false,
            timeSignature: 4,
            accentPattern: [true, false, false, false],
            sound: localStorage.getItem('defaultMetronomeSound') || 'click',
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
    }

    initialize() {
        this.checkAudioReady();
    }

    checkAudioReady() {
        const checkInterval = setInterval(() => {
            if (this.audioService && this.audioService.isReady && this.audioService.isReady()) {
                this.state.audioReady = true;
                clearInterval(checkInterval);
            }
        }, 100);
    }

    setBpm(newBpm) {
        newBpm = Math.max(30, Math.min(300, newBpm));
        this.state.bpm = newBpm;
        this.beatDuration = 60 / newBpm;
        
        // Update tempo progression if enabled
        if (this.state.tempoProgression?.enabled) {
            this.state.tempoProgression.currentBpm = newBpm;
        }
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

    setSound(sound) {
        this.state.sound = sound;
    }

    async start(timerCallback) {
        if (!this.state.audioReady || !this.audioService) {
            console.warn('Audio not ready or service not available');
            return;
        }

        if (this.state.isPlaying) return;

        this.state.isPlaying = true;
        this.state.currentBeat = 0;
        
        // Reset tempo progression
        if (this.state.tempoProgression?.enabled) {
            this.state.tempoProgression.currentMeasure = 0;
            this.state.tempoProgression.currentBpm = this.state.tempoProgression.startBpm;
            this.setBpm(this.state.tempoProgression.currentBpm);
        }

        // Initialize timing
        const audioContext = this.audioService.audioContext;
        this.nextBeatTime = audioContext.currentTime;
        
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
    }

    pause() {
        this.stop();
    }

    scheduler() {
        if (!this.audioService || !this.audioService.audioContext) return;
        
        const audioContext = this.audioService.audioContext;
        
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
    }

    playBeatSound(time, isAccent) {
        if (!this.audioService || !this.audioService.audioContext) return;
        
        const audioContext = this.audioService.audioContext;
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
        
        if (prog.currentMeasure >= prog.measuresPerStep) {
            prog.currentMeasure = 0;
            const newBpm = Math.min(prog.currentBpm + prog.increment, prog.endBpm);
            
            if (newBpm !== prog.currentBpm) {
                this.setBpm(newBpm);
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

    destroy() {
        this.stop();
    }
}
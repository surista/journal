// services/audioService.js - Fixed Audio Service with Proper Seek

export class AudioService {
    constructor() {
        this.audioContext = null;
        this.audioBuffer = null;
        this.sourceNode = null;
        this.gainNode = null;
        this.analyserNode = null;

        // Playback state
        this.isPlaying = false;
        this.isPaused = false;
        this.pausedAt = 0;
        this.startedAt = 0;
        this.currentTime = 0;
        this.seekTime = 0; // Track where we want to seek to

        // Audio settings
        this.playbackRate = 1.0;
        this.volume = 1.0;
        this.pitch = 0; // semitones
        // Always preserve pitch for tempo changes
        // For pitch changes, we'll use a pitch shifter when available

        // Loop settings
        this.loopEnabled = false;
        this.loopStart = null;
        this.loopEnd = null;
        this.loopCount = 0;

        // Tempo progression
        this.tempoProgression = {
            enabled: false,
            incrementType: 'percentage',
            incrementValue: 1,
            loopInterval: 1,
            currentLoopCount: 0,
            maxTempo: 300
        };

        // Callbacks
        this.onTimeUpdate = null;
        this.onLoadComplete = null;
        this.onPlayStateChange = null;
        this.onLoopCountUpdate = null;
        this.onTempoChange = null;

        // Animation frame for time updates
        this.animationFrame = null;

        // Audio file metadata
        this.currentFileName = '';
        this.audioFileData = null;

        this.init();
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create audio nodes
            this.gainNode = this.audioContext.createGain();
            this.analyserNode = this.audioContext.createAnalyser();

            // Configure analyser
            this.analyserNode.fftSize = 2048;
            this.analyserNode.smoothingTimeConstant = 0.8;

            // Connect nodes
            this.gainNode.connect(this.analyserNode);
            this.analyserNode.connect(this.audioContext.destination);

            console.log('AudioService initialized successfully');
        } catch (error) {
            console.error('Failed to initialize AudioService:', error);
            throw error;
        }
    }

    async loadAudioFile(file) {
        try {
            console.log('Loading audio file:', file.name);

            // Store file metadata
            this.currentFileName = file.name;
            this.audioFileData = file;

            // Read file as array buffer
            const arrayBuffer = await file.arrayBuffer();

            // Decode audio data
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            console.log('Audio file loaded successfully:', {
                name: file.name,
                duration: this.audioBuffer.duration,
                sampleRate: this.audioBuffer.sampleRate,
                channels: this.audioBuffer.numberOfChannels
            });

            // Reset playback state
            this.resetPlaybackState();

            // Load saved loop points for this file
            this.loadSavedLoopPoints();

            // Trigger callback
            if (this.onLoadComplete) {
                this.onLoadComplete();
            }

            return this.audioBuffer;
        } catch (error) {
            console.error('Error loading audio file:', error);
            throw error;
        }
    }

    resetPlaybackState() {
        this.stop();
        this.pausedAt = 0;
        this.seekTime = 0;
        this.currentTime = 0;
        this.loopCount = 0;
        this.tempoProgression.currentLoopCount = 0;

        // Clear any existing loops
        this.clearLoop();
    }

    play() {
        if (!this.audioBuffer) {
            console.warn('No audio buffer loaded');
            return;
        }

        // Resume audio context if suspended
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        // Stop current playback if any
        if (this.sourceNode) {
            try {
                this.sourceNode.stop();
                this.sourceNode.disconnect();
            } catch (e) {
                // Source may already be stopped
            }
        }

        try {
            // Create new source node
            this.sourceNode = this.audioContext.createBufferSource();
            this.sourceNode.buffer = this.audioBuffer;

            // Apply playback rate (tempo only, no pitch)
            this.sourceNode.playbackRate.value = this.playbackRate;

            // Connect audio chain
            this.sourceNode.connect(this.gainNode);

            // Set up loop if enabled
            if (this.loopEnabled && this.loopStart !== null && this.loopEnd !== null) {
                this.sourceNode.loop = true;
                this.sourceNode.loopStart = this.loopStart;
                this.sourceNode.loopEnd = this.loopEnd;
            }

            // Handle playback end
            this.sourceNode.onended = () => {
                if (this.isPlaying) {
                    this.handlePlaybackEnd();
                }
            };

            // Determine start time - use seekTime if set, otherwise pausedAt
            const startTime = this.seekTime > 0 ? this.seekTime : this.pausedAt;

            // Start playback
            this.sourceNode.start(0, startTime);

            // Update state
            this.isPlaying = true;
            this.isPaused = false;
            this.startedAt = this.audioContext.currentTime - startTime;
            this.seekTime = 0; // Reset seek time after using it

            // Start time updates
            this.startTimeUpdates();

            // Trigger callback
            if (this.onPlayStateChange) {
                this.onPlayStateChange(true);
            }

            console.log('Audio playback started at:', startTime);
        } catch (error) {
            console.error('Error starting playback:', error);
        }
    }

    pause() {
        if (this.sourceNode && this.isPlaying) {
            this.sourceNode.stop();
            this.pausedAt = this.getCurrentTime();
            this.isPlaying = false;
            this.isPaused = true;

            this.stopTimeUpdates();

            if (this.onPlayStateChange) {
                this.onPlayStateChange(false);
            }

            console.log('Audio playback paused at:', this.pausedAt);
        }
    }

    stop() {
        if (this.sourceNode) {
            try {
                this.sourceNode.stop();
                this.sourceNode.disconnect();
            } catch (error) {
                // Source may already be stopped
            }
            this.sourceNode = null;
        }

        this.isPlaying = false;
        this.isPaused = false;
        this.pausedAt = 0;
        this.startedAt = 0;
        this.seekTime = 0;

        this.stopTimeUpdates();

        if (this.onPlayStateChange) {
            this.onPlayStateChange(false);
        }
    }

    seek(time) {
        const duration = this.getDuration();
        const clampedTime = Math.max(0, Math.min(time, duration));

        console.log('Seeking to:', clampedTime);

        if (this.isPlaying) {
            // If playing, stop and restart at new position
            this.seekTime = clampedTime; // Store the seek position
            this.play(); // This will now use seekTime
        } else {
            // If not playing, just update the paused position
            this.pausedAt = clampedTime;
            this.seekTime = clampedTime;

            // Update time display
            if (this.onTimeUpdate) {
                this.onTimeUpdate(clampedTime);
            }
        }
    }

    getCurrentTime() {
        if (this.isPlaying) {
            const elapsed = (this.audioContext.currentTime - this.startedAt) * this.playbackRate;
            return Math.min(elapsed, this.getDuration());
        } else {
            return this.pausedAt;
        }
    }

    getDuration() {
        return this.audioBuffer ? this.audioBuffer.duration : 0;
    }

    setPlaybackSpeed(rate) {
        this.playbackRate = Math.max(0.25, Math.min(4.0, rate));

        if (this.sourceNode) {
            this.sourceNode.playbackRate.value = this.playbackRate;
        }

        console.log('Playback speed set to:', this.playbackRate);
    }

    setPitch(semitones) {
        // Store pitch value for future implementation
        this.pitch = Math.max(-12, Math.min(12, semitones));

        // For now, pitch shifting with preserved tempo requires additional libraries
        // like Tone.js or a custom pitch shifter implementation
        console.log('Pitch shift set to:', this.pitch, 'semitones (requires pitch shifter implementation)');

        // TODO: Implement actual pitch shifting using:
        // - Tone.js PitchShift
        // - Custom phase vocoder
        // - Web Audio API AudioWorklet
    }

    setPreservePitch(preserve) {
        // This is no longer needed since we always preserve pitch for tempo
        // and always preserve tempo for pitch
        console.log('Preserve pitch setting ignored - always preserving');
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));

        if (this.gainNode) {
            this.gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
        }
    }

    getVolume() {
        return this.volume;
    }

    // Loop control methods
    setLoopEnabled(enabled) {
        this.loopEnabled = enabled;
        console.log('Loop enabled:', enabled);
    }

    setLoopPoints(start, end) {
        this.loopStart = start;
        this.loopEnd = end;
        this.saveLoopPoints();
        console.log('Loop points set:', start, 'to', end);
    }

    setLoopStart(time) {
        this.loopStart = Math.max(0, Math.min(time, this.getDuration()));
        this.saveLoopPoints();
    }

    setLoopEnd(time) {
        this.loopEnd = Math.max(0, Math.min(time, this.getDuration()));
        this.saveLoopPoints();
    }

    getLoopStart() {
        return this.loopStart;
    }

    getLoopEnd() {
        return this.loopEnd;
    }

    clearLoop() {
        this.loopStart = null;
        this.loopEnd = null;
        this.loopEnabled = false;
        this.loopCount = 0;
        this.saveLoopPoints();
        console.log('Loop cleared');
    }

    // Tempo progression for practice
    setTempoProgression(enabled, config = {}) {
        this.tempoProgression.enabled = enabled;

        if (config.incrementType) this.tempoProgression.incrementType = config.incrementType;
        if (config.incrementValue) this.tempoProgression.incrementValue = config.incrementValue;
        if (config.loopInterval) this.tempoProgression.loopInterval = config.loopInterval;
        if (config.maxTempo) this.tempoProgression.maxTempo = config.maxTempo;

        console.log('Tempo progression:', this.tempoProgression);
    }

    handleLoopComplete() {
        this.loopCount++;
        this.tempoProgression.currentLoopCount++;

        if (this.onLoopCountUpdate) {
            this.onLoopCountUpdate(this.loopCount);
        }

        // Check for tempo progression
        if (this.tempoProgression.enabled &&
            this.tempoProgression.currentLoopCount % this.tempoProgression.loopInterval === 0) {
            this.applyTempoProgression();
        }
    }

    applyTempoProgression() {
        let newRate = this.playbackRate;

        if (this.tempoProgression.incrementType === 'percentage') {
            newRate = this.playbackRate * (1 + this.tempoProgression.incrementValue / 100);
        } else {
            // BPM increment - approximate conversion
            const bpmIncrease = this.tempoProgression.incrementValue;
            const currentBPM = 120 * this.playbackRate; // Assume 120 BPM base
            const newBPM = Math.min(currentBPM + bpmIncrease, this.tempoProgression.maxTempo);
            newRate = newBPM / 120;
        }

        newRate = Math.min(newRate, this.tempoProgression.maxTempo / 120);

        if (newRate !== this.playbackRate) {
            this.setPlaybackSpeed(newRate);

            if (this.onTempoChange) {
                this.onTempoChange(newRate);
            }

            console.log('Tempo increased to:', newRate);
        }
    }

    handlePlaybackEnd() {
        if (this.loopEnabled && this.loopStart !== null && this.loopEnd !== null) {
            this.handleLoopComplete();
        } else {
            this.stop();
        }
    }

    // Time update loop
    startTimeUpdates() {
        this.stopTimeUpdates();

        const updateTime = () => {
            if (this.isPlaying) {
                const currentTime = this.getCurrentTime();

                if (this.onTimeUpdate) {
                    this.onTimeUpdate(currentTime);
                }

                this.animationFrame = requestAnimationFrame(updateTime);
            }
        };

        updateTime();
    }

    stopTimeUpdates() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    // Audio analysis
    getFrequencyData() {
        if (!this.analyserNode) return null;

        const bufferLength = this.analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyserNode.getByteFrequencyData(dataArray);

        return dataArray;
    }

    getTimeDomainData() {
        if (!this.analyserNode) return null;

        const bufferLength = this.analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyserNode.getByteTimeDomainData(dataArray);

        return dataArray;
    }

    // Session management
    async saveSession(sessionData) {
        try {
            const sessions = JSON.parse(localStorage.getItem('audioSessions') || '[]');

            const session = {
                ...sessionData,
                id: Date.now(),
                timestamp: new Date().toISOString(),
                fileName: this.currentFileName,
                duration: this.getDuration(),
                currentTime: this.getCurrentTime(),
                loopPoints: {
                    start: this.loopStart,
                    end: this.loopEnd,
                    enabled: this.loopEnabled
                }
            };

            sessions.unshift(session);

            // Keep only last 50 sessions
            if (sessions.length > 50) {
                sessions.splice(50);
            }

            localStorage.setItem('audioSessions', JSON.stringify(sessions));
            console.log('Audio session saved:', session);

            return session;
        } catch (error) {
            console.error('Error saving audio session:', error);
            throw error;
        }
    }

    getSessions() {
        try {
            return JSON.parse(localStorage.getItem('audioSessions') || '[]');
        } catch (error) {
            console.error('Error loading audio sessions:', error);
            return [];
        }
    }

    loadSession(session) {
        // Load session settings
        if (session.speed !== undefined) {
            this.setPlaybackSpeed(session.speed);
        }
        if (session.pitch !== undefined) {
            this.setPitch(session.pitch);
        }
        if (session.volume !== undefined) {
            this.setVolume(session.volume);
        }
        if (session.loopPoints) {
            if (session.loopPoints.start !== null && session.loopPoints.end !== null) {
                this.setLoopPoints(session.loopPoints.start, session.loopPoints.end);
                this.setLoopEnabled(session.loopPoints.enabled || false);
            }
        }

        console.log('Session loaded:', session);
    }

    // Loop points persistence
    saveLoopPoints() {
        if (!this.currentFileName) return;

        try {
            const loopData = {
                start: this.loopStart,
                end: this.loopEnd,
                enabled: this.loopEnabled
            };

            const key = `audioLoopPoints_${this.currentFileName}`;
            localStorage.setItem(key, JSON.stringify(loopData));
        } catch (error) {
            console.error('Error saving loop points:', error);
        }
    }

    loadSavedLoopPoints() {
        if (!this.currentFileName) return null;

        try {
            const key = `audioLoopPoints_${this.currentFileName}`;
            const saved = localStorage.getItem(key);

            if (saved) {
                const loopData = JSON.parse(saved);
                // Don't automatically apply saved loop points
                // Just return them so the UI can show them as an option
                console.log('Found saved loop points for this file:', loopData);
                return loopData;
            }
        } catch (error) {
            console.error('Error loading saved loop points:', error);
        }

        return null;
    }

    getSavedLoopPoints() {
        return this.loadSavedLoopPoints();
    }

    // Audio context state management
    resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            return this.audioContext.resume();
        }
    }

    // Export audio buffer data
    exportAudioData() {
        if (!this.audioBuffer) return null;

        const channelData = [];
        for (let i = 0; i < this.audioBuffer.numberOfChannels; i++) {
            channelData.push(this.audioBuffer.getChannelData(i));
        }

        return {
            sampleRate: this.audioBuffer.sampleRate,
            length: this.audioBuffer.length,
            duration: this.audioBuffer.duration,
            numberOfChannels: this.audioBuffer.numberOfChannels,
            channelData: channelData
        };
    }

    // Cleanup
    destroy() {
        console.log('Destroying AudioService...');

        this.stop();
        this.stopTimeUpdates();

        if (this.gainNode) {
            this.gainNode.disconnect();
        }

        if (this.analyserNode) {
            this.analyserNode.disconnect();
        }

        if (this.sourceNode) {
            try {
                this.sourceNode.disconnect();
            } catch (e) {
                // Already disconnected
            }
        }

        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }

        // Clear references
        this.audioBuffer = null;
        this.audioContext = null;
        this.sourceNode = null;
        this.gainNode = null;
        this.analyserNode = null;

        console.log('AudioService destroyed');
    }
}
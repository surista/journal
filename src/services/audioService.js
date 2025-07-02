// Audio Service - Handles all audio playback and processing
export class AudioService {
    constructor() {
        this.audioContext = null;
        this.audioBuffer = null;
        this.audioSource = null;
        this.pitchShifter = null;

        this.currentAudioURL = null;
        this.isPlaying = false;
        this.pausedAt = 0;
        this.startTime = 0;
        this.playbackRate = 1.0;

        this.loopStart = null;
        this.loopEnd = null;
        this.loopCount = 0;
        this.maxLoops = 0;

        this.usePitchPreservation = true;
        this.animationId = null;

        this.onTimeUpdate = null;
        this.onLoopCountUpdate = null;
    }

    async loadAudioFile(file) {
        // Clean up previous resources
        this.cleanup();

        // Initialize audio context if needed
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Resume context if suspended
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        // Read file as array buffer
        const arrayBuffer = await file.arrayBuffer();

        // Decode audio data
        try {
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            return this.audioBuffer;
        } catch (error) {
            throw new Error('Failed to decode audio file');
        }
    }

    play() {
        if (!this.audioBuffer || this.isPlaying) return;

        this.isPlaying = true;

        // Resume context if needed
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        // Use pitch-preserving playback for non-standard speeds
        if (this.playbackRate !== 1.0 && this.usePitchPreservation) {
            this.playWithPitchShift();
        } else {
            this.playStandard();
        }

        // Start animation loop
        this.startAnimationLoop();
    }

    playStandard() {
        this.audioSource = this.audioContext.createBufferSource();
        this.audioSource.buffer = this.audioBuffer;
        this.audioSource.playbackRate.value = this.playbackRate;
        this.audioSource.connect(this.audioContext.destination);

        this.startTime = this.audioContext.currentTime - this.pausedAt / this.playbackRate;

        // Handle loops if set
        if (this.loopStart !== null && this.loopEnd !== null) {
            if (this.maxLoops > 0) {
                // Finite loops
                const actualStart = Math.max(this.pausedAt, this.loopStart);
                this.audioSource.start(0, actualStart, this.loopEnd - actualStart);

                this.audioSource.onended = () => {
                    if (this.isPlaying && this.loopCount < this.maxLoops) {
                        this.loopCount++;
                        this.pausedAt = this.loopStart;
                        this.playStandard();
                    } else {
                        this.stop();
                    }
                };
            } else {
                // Infinite loops
                this.audioSource.loopStart = this.loopStart;
                this.audioSource.loopEnd = this.loopEnd;
                this.audioSource.loop = true;

                const actualStart = Math.max(this.pausedAt, this.loopStart);
                this.audioSource.start(0, actualStart);
            }
        } else {
            // No loops
            this.audioSource.start(0, this.pausedAt);

            this.audioSource.onended = () => {
                this.stop();
            };
        }
    }

    playWithPitchShift() {
        // Initialize pitch shifter if needed
        if (!this.pitchShifter) {
            this.pitchShifter = new PitchPreservingPlayer(this.audioContext, this.audioBuffer);
        }

        this.pitchShifter.playbackRate = this.playbackRate;
        this.pitchShifter.loopStart = this.loopStart;
        this.pitchShifter.loopEnd = this.loopEnd;
        this.pitchShifter.start(0, this.pausedAt);
    }

    pause() {
        if (!this.isPlaying) return;

        // Calculate paused position
        if (this.pitchShifter && this.pitchShifter.isPlaying) {
            this.pausedAt = this.pitchShifter.getCurrentTime();
            this.pitchShifter.stop();
        } else if (this.audioSource) {
            const elapsed = (this.audioContext.currentTime - this.startTime) * this.playbackRate;
            this.pausedAt = elapsed;
            this.audioSource.stop();
            this.audioSource = null;
        }

        this.isPlaying = false;
        this.stopAnimationLoop();
    }

    stop() {
        if (this.audioSource) {
            this.audioSource.stop();
            this.audioSource = null;
        }

        if (this.pitchShifter && this.pitchShifter.isPlaying) {
            this.pitchShifter.stop();
        }

        this.isPlaying = false;
        this.pausedAt = 0;
        this.loopCount = 0;

        this.stopAnimationLoop();

        // Update UI
        if (this.onTimeUpdate) {
            this.onTimeUpdate(0);
        }
        if (this.onLoopCountUpdate) {
            this.onLoopCountUpdate(0);
        }
    }

    setPlaybackRate(rate) {
        const wasPlaying = this.isPlaying;

        if (wasPlaying) {
            this.pause();
        }

        this.playbackRate = rate;

        if (wasPlaying) {
            // Resume playback with new rate
            setTimeout(() => this.play(), 50);
        }
    }

    setLoopPoint(type) {
        if (!this.audioBuffer) return null;

        const currentTime = this.getCurrentTime();

        if (type === 'start') {
            // Validate minimum boundary
            const adjustedTime = Math.max(0.01, currentTime);

            // Check if valid compared to end point
            if (this.loopEnd !== null && adjustedTime > this.loopEnd) {
                return null;
            }

            this.loopStart = adjustedTime;
            return adjustedTime;
        } else {
            // Validate maximum boundary
            const adjustedTime = Math.min(this.audioBuffer.duration - 0.01, currentTime);

            // Check if valid compared to start point
            if (this.loopStart !== null && adjustedTime < this.loopStart) {
                return null;
            }

            this.loopEnd = adjustedTime;
            return adjustedTime;
        }
    }

    clearLoop() {
        this.loopStart = null;
        this.loopEnd = null;
        this.loopCount = 0;

        // If currently playing with loops, restart without them
        if (this.isPlaying && this.audioSource && this.audioSource.loop) {
            const currentTime = this.getCurrentTime();
            this.stop();
            this.pausedAt = currentTime;
            this.play();
        }
    }

    setMaxLoops(count) {
        this.maxLoops = parseInt(count) || 0;
    }

    setUsePitchPreservation(value) {
        this.usePitchPreservation = value;

        // If currently playing at non-standard speed, restart with new setting
        if (this.isPlaying && this.playbackRate !== 1.0) {
            const currentTime = this.getCurrentTime();
            this.stop();
            this.pausedAt = currentTime;
            this.play();
        }
    }

    getCurrentTime() {
        if (!this.isPlaying) return this.pausedAt;

        if (this.pitchShifter && this.pitchShifter.isPlaying) {
            return this.pitchShifter.getCurrentTime();
        } else if (this.audioSource) {
            const elapsed = (this.audioContext.currentTime - this.startTime) * this.playbackRate;

            // Handle loop time calculation
            if (this.loopStart !== null && this.loopEnd !== null && elapsed >= this.loopStart) {
                const loopDuration = this.loopEnd - this.loopStart;
                const timeIntoLoop = (elapsed - this.loopStart) % loopDuration;
                return this.loopStart + timeIntoLoop;
            }

            return Math.min(elapsed, this.audioBuffer.duration);
        }

        return 0;
    }

    getDuration() {
        return this.audioBuffer ? this.audioBuffer.duration : 0;
    }

    isPlaying() {
        return this.isPlaying;
    }

    startAnimationLoop() {
        const update = () => {
            if (!this.isPlaying) return;

            const currentTime = this.getCurrentTime();

            // Update time callback
            if (this.onTimeUpdate) {
                this.onTimeUpdate(currentTime);
            }

            // Check for loop completion in infinite mode
            if (this.loopStart !== null && this.loopEnd !== null && this.maxLoops === 0) {
                // Track loop count for infinite loops
                const loopDuration = this.loopEnd - this.loopStart;
                const possibleLoops = Math.floor((currentTime - this.loopStart) / loopDuration);
                if (possibleLoops > this.loopCount) {
                    this.loopCount = possibleLoops;
                    if (this.onLoopCountUpdate) {
                        this.onLoopCountUpdate(this.loopCount);
                    }
                }
            }

            this.animationId = requestAnimationFrame(update);
        };

        update();
    }

    stopAnimationLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    cleanup() {
        // Stop playback
        this.stop();

        // Clean up audio source
        if (this.audioSource) {
            this.audioSource.disconnect();
            this.audioSource = null;
        }

        // Clean up pitch shifter
        if (this.pitchShifter) {
            this.pitchShifter.cleanup();
            this.pitchShifter = null;
        }

        // Revoke object URL if exists
        if (this.currentAudioURL) {
            URL.revokeObjectURL(this.currentAudioURL);
            this.currentAudioURL = null;
        }

        // Clear buffer reference
        this.audioBuffer = null;

        // Reset state
        this.pausedAt = 0;
        this.loopStart = null;
        this.loopEnd = null;
        this.loopCount = 0;
    }
}

// Pitch-preserving player implementation
class PitchPreservingPlayer {
    constructor(audioContext, buffer) {
        this.context = audioContext;
        this.buffer = buffer;
        this.grainSize = 0.05; // 50ms
        this.overlap = 0.5;
        this.grains = [];
        this.isPlaying = false;
        this.startTime = 0;
        this.pausedAt = 0;
        this.playbackRate = 1.0;
        this.schedulerTimer = null;
        this.lastScheduledTime = 0;
        this.currentSourceOffset = 0;

        this.loopStart = null;
        this.loopEnd = null;
    }

    start(when = 0, offset = 0) {
        this.isPlaying = true;
        this.startTime = this.context.currentTime - offset / this.playbackRate;
        this.pausedAt = offset;
        this.currentSourceOffset = offset;
        this.lastScheduledTime = this.context.currentTime;

        this.scheduleGrains();
    }

    stop() {
        this.isPlaying = false;

        if (this.schedulerTimer) {
            clearTimeout(this.schedulerTimer);
            this.schedulerTimer = null;
        }

        // Stop all grains
        this.grains.forEach(grain => {
            try {
                grain.source.stop();
                grain.source.disconnect();
            } catch (e) {}
        });
        this.grains = [];

        this.pausedAt = this.getCurrentTime();
    }

    scheduleGrains() {
        if (!this.isPlaying || !this.buffer) return;

        const grainDuration = this.grainSize;
        const grainSpacing = grainDuration * (1 - this.overlap) / this.playbackRate;
        const scheduleAhead = 0.1;
        const currentTime = this.context.currentTime;
        const endTime = currentTime + scheduleAhead;

        let nextGrainTime = this.lastScheduledTime;

        if (nextGrainTime < currentTime) {
            nextGrainTime = currentTime;
        }

        while (nextGrainTime < endTime && this.isPlaying) {
            // Handle looping
            if (this.loopStart !== null && this.loopEnd !== null) {
                if (this.currentSourceOffset >= this.loopEnd) {
                    const loopLength = this.loopEnd - this.loopStart;
                    this.currentSourceOffset = this.loopStart + ((this.currentSourceOffset - this.loopStart) % loopLength);
                }
            } else if (this.currentSourceOffset >= this.buffer.duration) {
                this.stop();
                return;
            }

            try {
                const source = this.context.createBufferSource();
                source.buffer = this.buffer;

                const gain = this.context.createGain();
                source.connect(gain);
                gain.connect(this.context.destination);

                // Apply envelope
                const fadeTime = grainDuration * 0.1;
                gain.gain.setValueAtTime(0, nextGrainTime);
                gain.gain.linearRampToValueAtTime(0.5, nextGrainTime + fadeTime);
                gain.gain.setValueAtTime(0.5, nextGrainTime + grainDuration - fadeTime);
                gain.gain.linearRampToValueAtTime(0, nextGrainTime + grainDuration);

                const remainingBuffer = this.buffer.duration - this.currentSourceOffset;
                const actualDuration = Math.min(grainDuration, remainingBuffer);

                source.start(nextGrainTime, this.currentSourceOffset, actualDuration);

                this.grains.push({
                    source: source,
                    gain: gain,
                    startTime: nextGrainTime,
                    endTime: nextGrainTime + grainDuration
                });

                nextGrainTime += grainSpacing;
                this.currentSourceOffset += grainSpacing * this.playbackRate;

            } catch (error) {
                console.error('Error creating grain:', error);
                break;
            }
        }

        this.lastScheduledTime = nextGrainTime;

        // Clean up old grains
        const now = this.context.currentTime;
        this.grains = this.grains.filter(grain => {
            if (grain.endTime < now) {
                try {
                    grain.source.disconnect();
                    grain.gain.disconnect();
                } catch (e) {}
                return false;
            }
            return true;
        });

        // Schedule next batch
        if (this.isPlaying) {
            this.schedulerTimer = setTimeout(() => {
                this.scheduleGrains();
            }, 25);
        }
    }

    getCurrentTime() {
        if (!this.isPlaying) return this.pausedAt;
        const elapsed = (this.context.currentTime - this.startTime) * this.playbackRate;
        return Math.min(elapsed, this.buffer.duration);
    }

    cleanup() {
        this.stop();
    }
}
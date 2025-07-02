// Audio Service - Final Fix: Prevent stop() from interfering with tempo changes
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
        this.pitchShift = 0; // in semitones

        this.loopStart = null;
        this.loopEnd = null;
        this.loopCount = 0;
        this.maxLoops = 0;

        this.usePitchPreservation = true;
        this.animationId = null;

        // Track which mode we're using
        this.usingPitchShifter = false;

        // For accurate position tracking during standard playback
        this.standardPlaybackStartTime = 0;
        this.standardPlaybackStartOffset = 0;

        // CRITICAL: Track if we're in the middle of a tempo/pitch change
        this.isChangingSettings = false;

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

            // Reset state for new file
            this.pausedAt = 0;
            this.playbackRate = 1.0;
            this.pitchShift = 0;
            this.usingPitchShifter = false;
            this.isChangingSettings = false;

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

        // Determine if we need pitch shifter
        const needsPitchShifter = (this.playbackRate !== 1.0 && this.usePitchPreservation) || this.pitchShift !== 0;

        if (needsPitchShifter) {
            this.usingPitchShifter = true;
            this.playWithEffects();
        } else {
            this.usingPitchShifter = false;
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

        // Store accurate timing info for position calculation
        this.standardPlaybackStartTime = this.audioContext.currentTime;
        this.standardPlaybackStartOffset = this.pausedAt;

        // Handle loops if set
        if (this.loopStart !== null && this.loopEnd !== null) {
            if (this.maxLoops > 0) {
                // Finite loops
                const actualStart = Math.max(this.pausedAt, this.loopStart);
                this.audioSource.start(0, actualStart, this.loopEnd - actualStart);

                this.audioSource.onended = () => {
                    // CRITICAL: Don't call stop() if we're changing settings
                    if (!this.isChangingSettings && this.isPlaying && this.loopCount < this.maxLoops) {
                        this.loopCount++;
                        if (this.onLoopCountUpdate) {
                            this.onLoopCountUpdate(this.loopCount);
                        }
                        this.pausedAt = this.loopStart;
                        this.playStandard();
                    } else if (!this.isChangingSettings) {
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
                // CRITICAL: Don't call stop() if we're changing settings
                if (!this.isChangingSettings) {
                    this.stop();
                }
            };
        }
    }

    playWithEffects() {
        // Initialize the enhanced pitch shifter if needed
        if (!this.pitchShifter) {
            this.pitchShifter = new EnhancedPitchShifter(this.audioContext, this.audioBuffer);
        }

        this.pitchShifter.playbackRate = this.playbackRate;
        this.pitchShifter.pitchShift = this.pitchShift;
        this.pitchShifter.loopStart = this.loopStart;
        this.pitchShifter.loopEnd = this.loopEnd;
        this.pitchShifter.maxLoops = this.maxLoops;
        this.pitchShifter.onLoopComplete = () => {
            this.loopCount++;
            if (this.onLoopCountUpdate) {
                this.onLoopCountUpdate(this.loopCount);
            }
        };

        this.pitchShifter.start(0, this.pausedAt);
    }

    pause() {
        if (!this.isPlaying) return;

        // Get current position before stopping
        const currentPosition = this.getCurrentTime();

        // Stop the appropriate player
        if (this.usingPitchShifter && this.pitchShifter && this.pitchShifter.isPlaying) {
            this.pitchShifter.stop();
        } else if (this.audioSource) {
            this.audioSource.stop();
            this.audioSource = null;
        }

        this.pausedAt = currentPosition;
        this.isPlaying = false;
        this.stopAnimationLoop();

        // Update UI with the paused position
        if (this.onTimeUpdate) {
            this.onTimeUpdate(this.pausedAt);
        }
    }

    stop() {
        // Don't reset pausedAt if we're in the middle of changing settings
        if (this.isChangingSettings) {
            return;
        }

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
        if (!this.audioBuffer) return;

        // CRITICAL: Set flag to prevent stop() from resetting position
        this.isChangingSettings = true;

        const wasPlaying = this.isPlaying;
        let currentPosition = this.pausedAt;

        // If playing, get the actual current position
        if (wasPlaying) {
            currentPosition = this.getCurrentTime();
        }

        // Stop current playback if playing
        if (wasPlaying) {
            this.isPlaying = false;
            this.stopAnimationLoop();

            if (this.usingPitchShifter && this.pitchShifter && this.pitchShifter.isPlaying) {
                this.pitchShifter.stop();
            } else if (this.audioSource) {
                this.audioSource.stop();
                this.audioSource = null;
            }
        }

        // Update the playback rate
        this.playbackRate = rate;

        // Set the position for resume
        this.pausedAt = currentPosition;

        // Resume if was playing
        if (wasPlaying) {
            // Small delay to ensure clean transition
            setTimeout(() => {
                this.isChangingSettings = false; // Clear flag before resuming
                this.play();
            }, 10);
        } else {
            this.isChangingSettings = false; // Clear flag immediately if not playing
        }
    }

    setPitchShift(semitones) {
        if (!this.audioBuffer) return;

        // CRITICAL: Set flag to prevent stop() from resetting position
        this.isChangingSettings = true;

        const wasPlaying = this.isPlaying;
        let currentPosition = this.pausedAt;

        // If playing, get the actual current position
        if (wasPlaying) {
            currentPosition = this.getCurrentTime();
        }

        // Stop current playback if playing
        if (wasPlaying) {
            this.isPlaying = false;
            this.stopAnimationLoop();

            if (this.usingPitchShifter && this.pitchShifter && this.pitchShifter.isPlaying) {
                this.pitchShifter.stop();
            } else if (this.audioSource) {
                this.audioSource.stop();
                this.audioSource = null;
            }
        }

        // Update the pitch shift
        this.pitchShift = semitones;

        // Set the position for resume
        this.pausedAt = currentPosition;

        // Resume if was playing
        if (wasPlaying) {
            // Small delay to ensure clean transition
            setTimeout(() => {
                this.isChangingSettings = false; // Clear flag before resuming
                this.play();
            }, 10);
        } else {
            this.isChangingSettings = false; // Clear flag immediately if not playing
        }
    }

    getCurrentTime() {
        if (!this.audioBuffer) return 0;

        if (!this.isPlaying) {
            return this.pausedAt;
        }

        // Use the appropriate method based on what's currently playing
        if (this.usingPitchShifter && this.pitchShifter && this.pitchShifter.isPlaying) {
            return this.pitchShifter.getCurrentTime();
        } else if (!this.usingPitchShifter && this.audioSource) {
            // Calculate time based on when we started this specific playback
            const elapsed = (this.audioContext.currentTime - this.standardPlaybackStartTime) * this.playbackRate;
            const currentTime = this.standardPlaybackStartOffset + elapsed;

            // Clamp to valid range
            const clampedTime = Math.max(0, Math.min(currentTime, this.audioBuffer.duration));

            // Handle loop time calculation
            if (this.loopStart !== null && this.loopEnd !== null && clampedTime >= this.loopStart) {
                const loopDuration = this.loopEnd - this.loopStart;
                const timeIntoLoop = (clampedTime - this.loopStart) % loopDuration;
                return this.loopStart + timeIntoLoop;
            }

            return clampedTime;
        }

        return this.pausedAt;
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
        if (this.pitchShifter) {
            this.pitchShifter.maxLoops = this.maxLoops;
        }
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

    getDuration() {
        return this.audioBuffer ? this.audioBuffer.duration : 0;
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
        this.pitchShift = 0;
        this.usingPitchShifter = false;
        this.standardPlaybackStartTime = 0;
        this.standardPlaybackStartOffset = 0;
        this.isChangingSettings = false;
    }
}

// Enhanced pitch shifter with better quality time stretching and pitch shifting
class EnhancedPitchShifter {
    constructor(audioContext, buffer) {
        this.context = audioContext;
        this.buffer = buffer;

        // Improved parameters for better quality
        this.grainSize = 0.08; // 80ms grains for better quality
        this.overlap = 0.75; // 75% overlap for smoother sound

        this.grains = [];
        this.isPlaying = false;
        this.startTime = 0;
        this.pausedAt = 0;
        this.playbackRate = 1.0;
        this.pitchShift = 0; // in semitones
        this.schedulerTimer = null;
        this.lastScheduledTime = 0;
        this.currentSourceOffset = 0;

        this.loopStart = null;
        this.loopEnd = null;
        this.maxLoops = 0;
        this.currentLoop = 0;
        this.onLoopComplete = null;

        // Create nodes for processing
        this.outputGain = this.context.createGain();
        this.outputGain.connect(this.context.destination);
    }

    start(when = 0, offset = 0) {
        this.isPlaying = true;
        this.pausedAt = offset;
        this.currentSourceOffset = offset;
        this.startTime = this.context.currentTime;
        this.lastScheduledTime = this.context.currentTime;
        this.currentLoop = 0;

        this.scheduleGrains();
    }

    stop() {
        this.isPlaying = false;

        if (this.schedulerTimer) {
            clearTimeout(this.schedulerTimer);
            this.schedulerTimer = null;
        }

        // Calculate final position before stopping
        this.pausedAt = this.getCurrentTime();

        // Stop all grains
        this.grains.forEach(grain => {
            try {
                grain.source.stop();
                grain.source.disconnect();
                grain.gain.disconnect();
            } catch (e) {}
        });
        this.grains = [];
    }

    scheduleGrains() {
        if (!this.isPlaying || !this.buffer) return;

        const grainDuration = this.grainSize;
        const grainSpacing = grainDuration * (1 - this.overlap) / this.playbackRate;
        const scheduleAhead = 0.15; // Schedule 150ms ahead for smoother playback
        const currentTime = this.context.currentTime;
        const endTime = currentTime + scheduleAhead;

        let nextGrainTime = this.lastScheduledTime;

        if (nextGrainTime < currentTime) {
            nextGrainTime = currentTime;
        }

        // Calculate pitch shift factor
        const pitchFactor = Math.pow(2, this.pitchShift / 12);

        while (nextGrainTime < endTime && this.isPlaying) {
            // Handle looping
            if (this.loopStart !== null && this.loopEnd !== null) {
                if (this.currentSourceOffset >= this.loopEnd) {
                    const loopLength = this.loopEnd - this.loopStart;
                    this.currentSourceOffset = this.loopStart + ((this.currentSourceOffset - this.loopStart) % loopLength);

                    // Check if we've completed a loop
                    if (this.maxLoops > 0) {
                        this.currentLoop++;
                        if (this.onLoopComplete) {
                            this.onLoopComplete();
                        }
                        if (this.currentLoop >= this.maxLoops) {
                            this.stop();
                            return;
                        }
                    }
                }
            } else if (this.currentSourceOffset >= this.buffer.duration) {
                this.stop();
                return;
            }

            try {
                const source = this.context.createBufferSource();
                source.buffer = this.buffer;

                // Apply pitch shift
                source.playbackRate.value = pitchFactor;

                const gain = this.context.createGain();
                source.connect(gain);
                gain.connect(this.outputGain);

                // Improved envelope for smoother transitions
                const fadeTime = grainDuration * 0.25; // 25% fade in/out
                const sustainTime = grainDuration - (fadeTime * 2);

                gain.gain.setValueAtTime(0, nextGrainTime);
                gain.gain.linearRampToValueAtTime(1, nextGrainTime + fadeTime);
                gain.gain.setValueAtTime(1, nextGrainTime + fadeTime + sustainTime);
                gain.gain.linearRampToValueAtTime(0, nextGrainTime + grainDuration);

                const remainingBuffer = this.buffer.duration - this.currentSourceOffset;
                const actualDuration = Math.min(grainDuration, remainingBuffer);

                // Start the grain
                source.start(nextGrainTime, this.currentSourceOffset, actualDuration * pitchFactor);

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

        // Calculate elapsed time since start
        const elapsed = (this.context.currentTime - this.startTime) * this.playbackRate;

        // Current position is paused position plus elapsed time
        const currentPosition = this.pausedAt + elapsed;

        // Clamp to buffer duration
        const clampedPosition = Math.min(currentPosition, this.buffer.duration);

        // Handle looping
        if (this.loopStart !== null && this.loopEnd !== null && clampedPosition >= this.loopStart) {
            const loopDuration = this.loopEnd - this.loopStart;
            const timeIntoLoop = (clampedPosition - this.loopStart) % loopDuration;
            return this.loopStart + timeIntoLoop;
        }

        return clampedPosition;
    }

    cleanup() {
        this.stop();
        if (this.outputGain) {
            this.outputGain.disconnect();
        }
    }
}
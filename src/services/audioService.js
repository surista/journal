// Enhanced Audio Service with Improved Quality for Tempo/Pitch Changes
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
        this.pitchShift = 0;

        this.loopStart = null;
        this.loopEnd = null;
        this.loopCount = 0;
        this.maxLoops = 0;

        this.usePitchPreservation = true;
        this.animationId = null;
        this.usingPitchShifter = false;
        this.standardPlaybackStartTime = 0;
        this.standardPlaybackStartOffset = 0;
        this.isChangingSettings = false;

        // Quality settings
        this.qualityMode = 'high'; // Default to high for better quality
        this.adaptiveQuality = true;

        this.onTimeUpdate = null;
        this.onLoopCountUpdate = null;
    }

    async loadAudioFile(file) {
        this.cleanup();

        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                // Higher sample rate for better quality
                sampleRate: 48000
            });
        }

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        const arrayBuffer = await file.arrayBuffer();

        try {
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
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

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const needsPitchShifter = (this.playbackRate !== 1.0 && this.usePitchPreservation) || this.pitchShift !== 0;

        if (needsPitchShifter) {
            this.usingPitchShifter = true;
            this.playWithEffects();
        } else {
            this.usingPitchShifter = false;
            this.playStandard();
        }

        this.startAnimationLoop();
    }

    playStandard() {
        this.audioSource = this.audioContext.createBufferSource();
        this.audioSource.buffer = this.audioBuffer;
        this.audioSource.playbackRate.value = this.playbackRate;
        this.audioSource.connect(this.audioContext.destination);

        this.standardPlaybackStartTime = this.audioContext.currentTime;
        this.standardPlaybackStartOffset = this.pausedAt;

        if (this.loopStart !== null && this.loopEnd !== null) {
            if (this.maxLoops > 0) {
                const actualStart = Math.max(this.pausedAt, this.loopStart);
                this.audioSource.start(0, actualStart, this.loopEnd - actualStart);

                this.audioSource.onended = () => {
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
                this.audioSource.loopStart = this.loopStart;
                this.audioSource.loopEnd = this.loopEnd;
                this.audioSource.loop = true;
                const actualStart = Math.max(this.pausedAt, this.loopStart);
                this.audioSource.start(0, actualStart);
            }
        } else {
            this.audioSource.start(0, this.pausedAt);
            this.audioSource.onended = () => {
                if (!this.isChangingSettings) {
                    this.stop();
                }
            };
        }
    }

    playWithEffects() {
        if (!this.pitchShifter) {
            this.pitchShifter = new ImprovedPitchShifter(this.audioContext, this.audioBuffer, {
                qualityMode: this.qualityMode,
                adaptiveQuality: this.adaptiveQuality
            });
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

    // Quality control methods
    setQualityMode(mode) {
        this.qualityMode = mode;
        if (this.pitchShifter) {
            this.pitchShifter.setQualityMode(mode);
        }
    }

    setAdaptiveQuality(enabled) {
        this.adaptiveQuality = enabled;
        if (this.pitchShifter) {
            this.pitchShifter.setAdaptiveQuality(enabled);
        }
    }

    pause() {
        if (!this.isPlaying) return;

        const currentPosition = this.getCurrentTime();

        if (this.usingPitchShifter && this.pitchShifter && this.pitchShifter.isPlaying) {
            this.pitchShifter.stop();
        } else if (this.audioSource) {
            this.audioSource.stop();
            this.audioSource = null;
        }

        this.pausedAt = currentPosition;
        this.isPlaying = false;
        this.stopAnimationLoop();

        if (this.onTimeUpdate) {
            this.onTimeUpdate(this.pausedAt);
        }
    }

    stop() {
        if (this.isChangingSettings) return;

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

        if (this.onTimeUpdate) {
            this.onTimeUpdate(0);
        }
        if (this.onLoopCountUpdate) {
            this.onLoopCountUpdate(0);
        }
    }

    setPlaybackRate(rate) {
        if (!this.audioBuffer) return;

        this.isChangingSettings = true;
        const wasPlaying = this.isPlaying;
        let currentPosition = this.pausedAt;

        if (wasPlaying) {
            currentPosition = this.getCurrentTime();
        }

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

        this.playbackRate = rate;
        this.pausedAt = currentPosition;

        if (wasPlaying) {
            setTimeout(() => {
                this.isChangingSettings = false;
                this.play();
            }, 10);
        } else {
            this.isChangingSettings = false;
        }
    }

    setPitchShift(semitones) {
        if (!this.audioBuffer) return;

        this.isChangingSettings = true;
        const wasPlaying = this.isPlaying;
        let currentPosition = this.pausedAt;

        if (wasPlaying) {
            currentPosition = this.getCurrentTime();
        }

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

        this.pitchShift = semitones;
        this.pausedAt = currentPosition;

        if (wasPlaying) {
            setTimeout(() => {
                this.isChangingSettings = false;
                this.play();
            }, 10);
        } else {
            this.isChangingSettings = false;
        }
    }

    getCurrentTime() {
        if (!this.audioBuffer) return 0;

        if (!this.isPlaying) {
            return this.pausedAt;
        }

        if (this.usingPitchShifter && this.pitchShifter && this.pitchShifter.isPlaying) {
            return this.pitchShifter.getCurrentTime();
        } else if (!this.usingPitchShifter && this.audioSource) {
            const elapsed = (this.audioContext.currentTime - this.standardPlaybackStartTime) * this.playbackRate;
            const currentTime = this.standardPlaybackStartOffset + elapsed;
            const clampedTime = Math.max(0, Math.min(currentTime, this.audioBuffer.duration));

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
            const adjustedTime = Math.max(0.01, currentTime);
            if (this.loopEnd !== null && adjustedTime > this.loopEnd) return null;
            this.loopStart = adjustedTime;
            return adjustedTime;
        } else {
            const adjustedTime = Math.min(this.audioBuffer.duration - 0.01, currentTime);
            if (this.loopStart !== null && adjustedTime < this.loopStart) return null;
            this.loopEnd = adjustedTime;
            return adjustedTime;
        }
    }

    clearLoop() {
        this.loopStart = null;
        this.loopEnd = null;
        this.loopCount = 0;
    }

    setMaxLoops(count) {
        this.maxLoops = parseInt(count) || 0;
        if (this.pitchShifter) {
            this.pitchShifter.maxLoops = this.maxLoops;
        }
    }

    setUsePitchPreservation(value) {
        this.usePitchPreservation = value;
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
            if (this.onTimeUpdate) {
                this.onTimeUpdate(currentTime);
            }

            if (this.loopStart !== null && this.loopEnd !== null && this.maxLoops === 0) {
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
        this.stop();

        if (this.audioSource) {
            this.audioSource.disconnect();
            this.audioSource = null;
        }

        if (this.pitchShifter) {
            this.pitchShifter.cleanup();
            this.pitchShifter = null;
        }

        if (this.currentAudioURL) {
            URL.revokeObjectURL(this.currentAudioURL);
            this.currentAudioURL = null;
        }

        this.audioBuffer = null;
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

// Improved Pitch Shifter with Better Quality Algorithms
class ImprovedPitchShifter {
    constructor(audioContext, buffer, options = {}) {
        this.context = audioContext;
        this.buffer = buffer;

        // Quality settings
        this.qualityMode = options.qualityMode || 'high';
        this.adaptiveQuality = options.adaptiveQuality || true;

        // Performance monitoring
        this.performanceMonitor = {
            averageFrameTime: 0,
            frameCount: 0,
            lastFrameTime: 0
        };

        // Base parameters
        this.playbackRate = 1.0;
        this.pitchShift = 0;
        this.isPlaying = false;
        this.startTime = 0;
        this.pausedAt = 0;

        // Improved algorithm parameters
        this.updateAlgorithmParams();

        // Audio processing
        this.grains = [];
        this.schedulerTimer = null;
        this.lastScheduledTime = 0;
        this.currentSourceOffset = 0;

        // Loop handling
        this.loopStart = null;
        this.loopEnd = null;
        this.maxLoops = 0;
        this.currentLoop = 0;
        this.onLoopComplete = null;

        // Audio graph with improved processing
        this.outputGain = this.context.createGain();
        this.outputGain.gain.value = 0.8; // Slight reduction to prevent clipping

        // Add compressor for better sound quality
        this.compressor = this.context.createDynamicsCompressor();
        this.compressor.threshold.value = -24;
        this.compressor.knee.value = 30;
        this.compressor.ratio.value = 12;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.25;

        this.outputGain.connect(this.compressor);
        this.compressor.connect(this.context.destination);

        // Phase accumulator for better phase coherence
        this.phaseAccumulator = 0;
        this.lastGrainPhase = 0;

        // Improved windowing
        this.windowCache = new Map();
    }

    updateAlgorithmParams() {
        switch (this.qualityMode) {
            case 'low':
                this.grainSize = 0.08;      // 80ms - larger for efficiency
                this.overlap = 0.5;         // 50% overlap
                this.crossfadeDuration = 0.015; // 15ms crossfade
                this.windowType = 'hann';
                this.usePhaseVocoder = false;
                break;
            case 'medium':
                this.grainSize = 0.06;      // 60ms
                this.overlap = 0.65;        // 65% overlap
                this.crossfadeDuration = 0.02;  // 20ms crossfade
                this.windowType = 'hann';
                this.usePhaseVocoder = false;
                break;
            case 'high':
                this.grainSize = 0.04;      // 40ms - smaller for quality
                this.overlap = 0.75;        // 75% overlap
                this.crossfadeDuration = 0.025; // 25ms crossfade
                this.windowType = 'blackman'; // Better frequency response
                this.usePhaseVocoder = true;   // Enable phase vocoder
                break;
        }

        // Adjust parameters based on playback rate for optimal quality
        if (this.playbackRate < 0.8) {
            // Slower playback needs larger grains
            this.grainSize *= 1.2;
        } else if (this.playbackRate > 1.2) {
            // Faster playback needs smaller grains
            this.grainSize *= 0.8;
        }
    }

    createWindow(size, type = 'hann') {
        // Check cache first
        const cacheKey = `${size}_${type}`;
        if (this.windowCache.has(cacheKey)) {
            return this.windowCache.get(cacheKey);
        }

        const window = new Float32Array(size);

        switch (type) {
            case 'hann':
                for (let i = 0; i < size; i++) {
                    window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)));
                }
                break;
            case 'blackman':
                // Blackman window has better frequency response
                const a0 = 0.42, a1 = 0.5, a2 = 0.08;
                for (let i = 0; i < size; i++) {
                    const n = i / (size - 1);
                    window[i] = a0 - a1 * Math.cos(2 * Math.PI * n) + a2 * Math.cos(4 * Math.PI * n);
                }
                break;
            case 'tukey':
                // Tukey window - flat top with tapered edges
                const alpha = 0.5;
                const halfAlpha = alpha / 2;
                for (let i = 0; i < size; i++) {
                    const n = i / (size - 1);
                    if (n < halfAlpha) {
                        window[i] = 0.5 * (1 + Math.cos(Math.PI * (2 * n / alpha - 1)));
                    } else if (n < 1 - halfAlpha) {
                        window[i] = 1;
                    } else {
                        window[i] = 0.5 * (1 + Math.cos(Math.PI * (2 * n / alpha - 2 / alpha + 1)));
                    }
                }
                break;
        }

        // Cache the window
        this.windowCache.set(cacheKey, window);
        return window;
    }

    start(when = 0, offset = 0) {
        this.isPlaying = true;
        this.pausedAt = offset;
        this.currentSourceOffset = offset;
        this.startTime = this.context.currentTime;
        this.lastScheduledTime = this.context.currentTime;
        this.currentLoop = 0;
        this.phaseAccumulator = 0;

        // Start performance monitoring
        this.performanceMonitor.frameCount = 0;
        this.performanceMonitor.lastFrameTime = performance.now();

        this.scheduleGrains();
    }

    stop() {
        this.isPlaying = false;

        if (this.schedulerTimer) {
            clearTimeout(this.schedulerTimer);
            this.schedulerTimer = null;
        }

        this.pausedAt = this.getCurrentTime();

        // Stop all grains with fade out
        this.grains.forEach(grain => {
            try {
                const now = this.context.currentTime;
                grain.gain.gain.cancelScheduledValues(now);
                grain.gain.gain.setValueAtTime(grain.gain.gain.value, now);
                grain.gain.gain.linearRampToValueAtTime(0, now + 0.05); // 50ms fade out
                grain.source.stop(now + 0.05);
            } catch (e) {}
        });
        this.grains = [];
    }

    scheduleGrains() {
        const frameStart = performance.now();

        if (!this.isPlaying || !this.buffer) return;

        const grainDuration = this.grainSize;
        const grainSpacing = grainDuration * (1 - this.overlap) / this.playbackRate;
        const scheduleAhead = this.getScheduleAhead();
        const currentTime = this.context.currentTime;
        const endTime = currentTime + scheduleAhead;

        let nextGrainTime = this.lastScheduledTime;
        if (nextGrainTime < currentTime) {
            nextGrainTime = currentTime;
        }

        const pitchFactor = Math.pow(2, this.pitchShift / 12);
        let grainsCreated = 0;
        const maxGrainsPerFrame = this.getMaxGrainsPerFrame();

        while (nextGrainTime < endTime && this.isPlaying && grainsCreated < maxGrainsPerFrame) {
            // Handle looping
            if (this.loopStart !== null && this.loopEnd !== null) {
                if (this.currentSourceOffset >= this.loopEnd) {
                    const loopLength = this.loopEnd - this.loopStart;
                    this.currentSourceOffset = this.loopStart + ((this.currentSourceOffset - this.loopStart) % loopLength);

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
                this.createImprovedGrain(nextGrainTime, grainDuration, pitchFactor);
                grainsCreated++;

                nextGrainTime += grainSpacing;
                this.currentSourceOffset += grainSpacing * this.playbackRate;

            } catch (error) {
                console.error('Error creating grain:', error);
                break;
            }
        }

        this.lastScheduledTime = nextGrainTime;

        // Clean up old grains
        this.cleanupOldGrains();

        // Update performance monitoring
        this.updatePerformanceMonitoring(frameStart);

        // Schedule next batch
        if (this.isPlaying) {
            const schedulerDelay = this.getSchedulerDelay();
            this.schedulerTimer = setTimeout(() => {
                this.scheduleGrains();
            }, schedulerDelay);
        }
    }

    createImprovedGrain(startTime, duration, pitchFactor) {
        const source = this.context.createBufferSource();
        source.buffer = this.buffer;
        source.playbackRate.value = pitchFactor;

        // Improved gain staging
        const grainGain = this.context.createGain();
        grainGain.gain.value = 0;

        // Create filter for better quality
        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';

        // Adjust filter frequency based on pitch
        const baseFreq = Math.min(this.context.sampleRate / 2 - 2000, 16000);
        filter.frequency.value = baseFreq / Math.max(1, pitchFactor * 0.8);
        filter.Q.value = 0.7;

        // Connect audio graph
        source.connect(filter);
        filter.connect(grainGain);
        grainGain.connect(this.outputGain);

        // Calculate phase-aligned grain position for better coherence
        let grainOffset = this.currentSourceOffset;

        // Phase alignment for better quality (only in high quality mode)
        if (this.qualityMode === 'high' && this.usePhaseVocoder) {
            const hopSize = duration * (1 - this.overlap);
            const phaseDiff = (this.currentSourceOffset - this.lastGrainPhase) * pitchFactor;
            this.phaseAccumulator += phaseDiff;

            // Wrap phase
            while (this.phaseAccumulator > hopSize) {
                this.phaseAccumulator -= hopSize;
            }

            grainOffset = this.currentSourceOffset + (this.phaseAccumulator * 0.1); // Subtle phase correction
            this.lastGrainPhase = this.currentSourceOffset;
        }

        // Apply improved windowing
        this.applyImprovedWindow(grainGain, startTime, duration);

        // Calculate actual duration considering buffer limits
        const remainingBuffer = this.buffer.duration - grainOffset;
        const actualDuration = Math.min(duration, remainingBuffer / pitchFactor);

        // Start the source
        source.start(startTime, grainOffset, actualDuration * pitchFactor);

        // Store grain info
        this.grains.push({
            source: source,
            gain: grainGain,
            filter: filter,
            startTime: startTime,
            endTime: startTime + duration
        });
    }

    applyImprovedWindow(gainNode, startTime, duration) {
        const now = this.context.currentTime;
        const fadeTime = this.crossfadeDuration;
        const sustainTime = Math.max(0, duration - (fadeTime * 2));

        // More precise envelope shaping
        gainNode.gain.setValueAtTime(0, startTime);

        if (this.windowType === 'tukey' || this.qualityMode === 'high') {
            // Smooth fade in
            const fadeInSteps = 8;
            const fadeInStepTime = fadeTime / fadeInSteps;

            for (let i = 0; i <= fadeInSteps; i++) {
                const t = i / fadeInSteps;
                const windowValue = 0.5 * (1 - Math.cos(Math.PI * t));
                gainNode.gain.linearRampToValueAtTime(
                    windowValue * 0.9, // Slight reduction to prevent clipping
                    startTime + (i * fadeInStepTime)
                );
            }

            // Sustain
            gainNode.gain.setValueAtTime(0.9, startTime + fadeTime + sustainTime);

            // Smooth fade out
            const fadeOutSteps = 8;
            const fadeOutStepTime = fadeTime / fadeOutSteps;

            for (let i = 0; i <= fadeOutSteps; i++) {
                const t = i / fadeOutSteps;
                const windowValue = 0.5 * (1 + Math.cos(Math.PI * t));
                gainNode.gain.linearRampToValueAtTime(
                    windowValue * 0.9,
                    startTime + fadeTime + sustainTime + (i * fadeOutStepTime)
                );
            }
        } else {
            // Simple linear envelope for lower quality modes
            gainNode.gain.linearRampToValueAtTime(0.9, startTime + fadeTime);
            gainNode.gain.setValueAtTime(0.9, startTime + fadeTime + sustainTime);
            gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        }
    }

    getScheduleAhead() {
        switch (this.qualityMode) {
            case 'low': return 0.1;     // 100ms
            case 'medium': return 0.15; // 150ms
            case 'high': return 0.2;    // 200ms
            default: return 0.15;
        }
    }

    getMaxGrainsPerFrame() {
        switch (this.qualityMode) {
            case 'low': return 4;
            case 'medium': return 8;
            case 'high': return 12;
            default: return 8;
        }
    }

    getSchedulerDelay() {
        switch (this.qualityMode) {
            case 'low': return 50;    // 50ms
            case 'medium': return 30; // 30ms
            case 'high': return 20;   // 20ms
            default: return 30;
        }
    }

    cleanupOldGrains() {
        const now = this.context.currentTime;
        const safetyMargin = 0.1; // 100ms safety margin

        this.grains = this.grains.filter(grain => {
            if (grain.endTime + safetyMargin < now) {
                try {
                    grain.source.disconnect();
                    grain.gain.disconnect();
                    grain.filter.disconnect();
                } catch (e) {}
                return false;
            }
            return true;
        });
    }

    updatePerformanceMonitoring(frameStart) {
        const frameEnd = performance.now();
        const frameTime = frameEnd - frameStart;

        this.performanceMonitor.frameCount++;
        this.performanceMonitor.averageFrameTime =
            (this.performanceMonitor.averageFrameTime * (this.performanceMonitor.frameCount - 1) + frameTime) /
            this.performanceMonitor.frameCount;

        // Adaptive quality adjustment
        if (this.adaptiveQuality && this.performanceMonitor.frameCount % 100 === 0) {
            this.adjustQualityBasedOnPerformance();
        }
    }

    adjustQualityBasedOnPerformance() {
        const avgFrameTime = this.performanceMonitor.averageFrameTime;

        if (avgFrameTime > 12 && this.qualityMode === 'high') {
            this.setQualityMode('medium');
            console.log('Audio quality auto-adjusted to medium due to performance');
        } else if (avgFrameTime > 20 && this.qualityMode === 'medium') {
            this.setQualityMode('low');
            console.log('Audio quality auto-adjusted to low due to performance');
        } else if (avgFrameTime < 5 && this.qualityMode === 'low') {
            this.setQualityMode('medium');
            console.log('Audio quality auto-adjusted to medium - performance improved');
        } else if (avgFrameTime < 8 && this.qualityMode === 'medium') {
            this.setQualityMode('high');
            console.log('Audio quality auto-adjusted to high - performance improved');
        }
    }

    setQualityMode(mode) {
        this.qualityMode = mode;
        this.updateAlgorithmParams();

        // Clear window cache when quality changes
        this.windowCache.clear();
    }

    setAdaptiveQuality(enabled) {
        this.adaptiveQuality = enabled;
    }

    getCurrentTime() {
        if (!this.isPlaying) return this.pausedAt;

        const elapsed = (this.context.currentTime - this.startTime) * this.playbackRate;
        const currentPosition = this.pausedAt + elapsed;
        const clampedPosition = Math.min(currentPosition, this.buffer.duration);

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
        if (this.compressor) {
            this.compressor.disconnect();
        }

        // Clear window cache
        this.windowCache.clear();
    }
}
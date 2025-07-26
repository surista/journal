// YouTube Player Module - Handles YouTube video playback
import { transposeAPI } from '../../services/transposeExtensionAPI.js';

export class YouTubePlayer {
    constructor(storageService) {
        this.storageService = storageService;
        this.player = null;
        this.videoId = null;
        this.videoUrl = null;
        this.videoTitle = null;
        this.ready = false;
        this.syncWithTimer = true;

        // Loop properties
        this.loopStart = null;
        this.loopEnd = null;
        this.looping = false;
        this.autoProgress = false;
        this.progressionSettings = {
            amount: 1,
            type: 'percentage',
            loops: 1
        };

        // Playback properties
        this.playbackRate = 1.0;
        this.pitchShift = 0;
        this.volume = 100;

        // UI update interval
        this.updateInterval = null;

        // Waveform properties
        this.waveformCanvas = null;
        this.waveformCtx = null;
        this.waveformImage = null;

        // Extension availability
        this.transposeAvailable = false;

        // Saved loops
        this.savedLoops = [];

        // Speed progression
        this.speedProgression = {
            enabled: false,
            startSpeed: 80,
            endSpeed: 100,
            increment: 5,
            loopsPerStep: 4,
            currentLoop: 0,
            currentSpeed: 100
        };
        this.loopCount = 0;

        // Callbacks
        this.onSpeedProgressionUpdate = null;
        this.onSpeedIncrease = null;
    }

    async initialize(containerId) {
        // Check if YouTube API is loaded
        if (!window.YT || !window.YT.Player) {
            console.error('YouTube API not loaded');
            return false;
        }

        // Check for Transpose extension
        this.checkTransposeExtension();

        return true;
    }

    async loadVideo(urlOrId) {
        // Reset pitch value
        this.pitchShift = 0;

        // Extract video ID
        const videoId = this.extractVideoId(urlOrId);
        if (!videoId) {
            throw new Error('Invalid YouTube URL or video ID');
        }

        this.videoId = videoId;
        this.videoUrl = urlOrId;
        this.videoTitle = null;

        // Create or update player
        if (!this.player) {
            await this.createPlayer(videoId);
        } else {
            this.player.cueVideoById(videoId);
            // Wait a bit for the video to be cued before calling onPlayerReady
            setTimeout(() => {
                this.onPlayerReady();
            }, 100);
        }

        return true;
    }

    extractVideoId(urlOrId) {
        // Enhanced regex patterns
        const patterns = [
            /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
            /youtube\.com\/shorts\/([^"&?\/\s]{11})/,
            /^([^"&?\/\s]{11})$/ // Just the video ID
        ];

        for (const pattern of patterns) {
            const match = urlOrId.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }

        return null;
    }

    findTimer() {
        // Use timer registry for standardized access
        if (window.timerRegistry) {
            return window.timerRegistry.getPrimary();
        }

        // Fallback to legacy patterns if registry not available
        if (window.currentTimer) {
            return window.currentTimer;
        } else if (window.app?.currentPage?.timer) {
            return window.app.currentPage.timer;
        } else if (window.unifiedPracticeMinimal?.timer) {
            return window.unifiedPracticeMinimal.timer;
        }

        return null;
    }

    async createPlayer(videoId) {
        return new Promise((resolve, reject) => {
            this.player = new YT.Player('youtubePlayer', {
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: {
                    controls: 0,
                    rel: 0,
                    modestbranding: 1,
                    enablejsapi: 1,
                    autoplay: 0,
                    fs: 0,
                    iv_load_policy: 3,
                    disablekb: 1
                },
                events: {
                    onReady: () => {
                        this.onPlayerReady();
                        resolve();
                    },
                    onStateChange: this.onPlayerStateChange.bind(this),
                    onError: (error) => {
                        console.error('YouTube player error:', error);
                        reject(error);
                    }
                }
            });
        });
    }

    onPlayerReady() {
        this.ready = true;

        // Ensure video is paused on load
        if (this.player) {
            this.player.pauseVideo();

            // Try to get video data
            try {
                const videoData = this.player.getVideoData();
                if (videoData && videoData.title) {
                    this.videoTitle = videoData.title;
                } else {
                    this.videoTitle = 'YouTube Video';
                }
            } catch (error) {
                this.videoTitle = 'YouTube Video';
            }
        }

        // Load saved loops for this video
        if (this.videoId) {
            this.loadSavedLoops();
        }

        // Start update interval
        this.startUpdateInterval();
    }

    onPlayerStateChange(event) {
        // Use numeric constants instead of YT.PlayerState
        // 1 = PLAYING, 2 = PAUSED
        if (event.data === 1) {
            // PLAYING
            console.log('YouTube playing, syncWithTimer:', this.syncWithTimer);
            // Handle timer sync if needed
            if (this.syncWithTimer) {
                const timer = this.findTimer();
                if (timer && !timer.isRunning) {
                    console.log('Starting timer from YouTube play');
                    timer.start();
                }
            }
        } else if (event.data === 2) {
            // PAUSED
            // Handle timer sync if needed
            if (this.syncWithTimer) {
                const timer = this.findTimer();
                if (timer && timer.isRunning) {
                    console.log('Pausing timer from YouTube pause');
                    timer.pause();
                }
            }
        }
    }

    startUpdateInterval() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(() => {
            if (this.player && this.player.getCurrentTime) {
                const currentTime = this.player.getCurrentTime();
                const duration = this.player.getDuration();

                // Handle looping
                if (this.looping && this.loopEnd !== null && currentTime >= this.loopEnd) {
                    this.handleLoopEnd();
                }

                // Notify UI updates via callback
                if (this.onUpdateCallback) {
                    this.onUpdateCallback({
                        currentTime,
                        duration,
                        isPlaying: this.player.getPlayerState() === 1 // 1 = PLAYING
                    });
                }
            }
        }, 100);
    }

    handleLoopEnd() {
        this.player.seekTo(this.loopStart || 0);

        // Handle speed progression
        if (this.speedProgression.enabled) {
            this.loopCount++;
            this.speedProgression.currentLoop++;

            // Update UI
            if (this.onSpeedProgressionUpdate) {
                this.onSpeedProgressionUpdate({
                    currentLoop: this.speedProgression.currentLoop,
                    loopsPerStep: this.speedProgression.loopsPerStep,
                    currentSpeed: Math.round(this.playbackRate * 100),
                    targetSpeed: this.speedProgression.endSpeed
                });
            }

            if (this.speedProgression.currentLoop >= this.speedProgression.loopsPerStep) {
                this.speedProgression.currentLoop = 0;

                const currentSpeedPercent = Math.round(this.playbackRate * 100);
                const newSpeedPercent = Math.min(
                    this.speedProgression.endSpeed,
                    currentSpeedPercent + this.speedProgression.increment
                );

                if (newSpeedPercent !== currentSpeedPercent) {
                    this.setSpeed(newSpeedPercent / 100);

                    // Notify UI of speed increase
                    if (this.onSpeedIncrease) {
                        this.onSpeedIncrease({
                            oldSpeed: currentSpeedPercent,
                            newSpeed: newSpeedPercent,
                            increment: this.speedProgression.increment
                        });
                    }
                }
            }
        }

        // Keep old auto progression for backward compatibility
        else if (this.autoProgress) {
            this.currentLoopCount = (this.currentLoopCount || 0) + 1;

            if (this.currentLoopCount >= this.progressionSettings.loops) {
                this.currentLoopCount = 0;

                if (this.progressionSettings.type === 'percentage') {
                    const newSpeed = Math.min(
                        1.5,
                        this.playbackRate + this.progressionSettings.amount / 100
                    );
                    this.setSpeed(newSpeed);
                } else if (this.progressionSettings.type === 'bpm') {
                    // BPM progression would require knowing the original BPM
                    // For now, just increase speed proportionally
                    const speedIncrease = this.progressionSettings.amount / 100;
                    const newSpeed = Math.min(1.5, this.playbackRate + speedIncrease);
                    this.setSpeed(newSpeed);
                }
            }
        }
    }

    play() {
        if (this.player && this.ready) {
            this.player.playVideo();

            // Manually trigger timer sync
            if (this.syncWithTimer) {
                console.log(
                    'YouTube play() - checking timer sync, syncWithTimer:',
                    this.syncWithTimer
                );
                const timer = this.findTimer();
                console.log('YouTube play() - found timer:', timer);
                if (timer && !timer.isRunning) {
                    console.log('YouTube play() - starting timer');
                    timer.start();
                }
            }
        }
    }

    pause() {
        if (this.player && this.ready) {
            this.player.pauseVideo();

            // Manually trigger timer sync
            if (this.syncWithTimer) {
                console.log(
                    'YouTube pause() - checking timer sync, syncWithTimer:',
                    this.syncWithTimer
                );
                const timer = this.findTimer();
                console.log('YouTube pause() - found timer:', timer);
                if (timer && timer.isRunning) {
                    console.log('YouTube pause() - pausing timer');
                    timer.pause();
                }
            }
        }
    }

    stop() {
        if (this.player && this.ready) {
            this.player.pauseVideo();
            this.player.seekTo(0);
        }
    }

    seekTo(time) {
        if (this.player && this.ready) {
            this.player.seekTo(time);
        }
    }

    setSpeed(speed) {
        this.playbackRate = speed;
        if (this.player && this.player.setPlaybackRate) {
            this.player.setPlaybackRate(speed);
        }
    }

    setVolume(volume) {
        this.volume = volume;
        if (this.player && this.player.setVolume) {
            this.player.setVolume(volume);
        }
    }

    async setPitch(semitones) {
        if (!this.transposeAvailable) {
            return false;
        }

        try {
            const success = await transposeAPI.setPitch(semitones);
            if (success) {
                this.pitchShift = semitones;
            }
            return success;
        } catch (error) {
            console.error('Error setting pitch:', error);
            return false;
        }
    }

    setLoop(start, end) {
        this.loopStart = start;
        this.loopEnd = end;
    }

    clearLoop() {
        this.loopStart = null;
        this.loopEnd = null;
        this.looping = false;
        this.currentLoopCount = 0;
    }

    setLooping(enabled) {
        this.looping = enabled;
        if (!enabled) {
            this.currentLoopCount = 0;
            this.loopCount = 0;
            if (this.speedProgression.enabled) {
                this.speedProgression.currentLoop = 0;
            }
        } else if (enabled && this.speedProgression.enabled) {
            // Reset speed to start speed when enabling loop with progression
            this.setSpeed(this.speedProgression.startSpeed / 100);
            this.speedProgression.currentLoop = 0;
            this.loopCount = 0;
        }
    }

    setAutoProgress(enabled, settings) {
        this.autoProgress = enabled;
        if (settings) {
            this.progressionSettings = settings;
        }
        this.currentLoopCount = 0;
    }

    async checkTransposeExtension() {
        // Check if Transpose extension is available
        this.transposeAvailable = true; // Assume it's available for now
        return this.transposeAvailable;
    }

    async saveLoop(name) {
        if (!this.videoId || this.loopStart === null || this.loopEnd === null) {
            return false;
        }

        const loop = {
            name: name,
            start: this.loopStart,
            end: this.loopEnd,
            timestamp: Date.now()
        };

        // Get existing loops
        const savedLoops = await this.loadSavedLoops();
        savedLoops.push(loop);

        // Save using StorageService for cloud sync
        const success = await this.storageService.saveYouTubeLoop(this.videoId, savedLoops);

        if (success) {
            this.savedLoops = savedLoops;
        }

        return success;
    }

    async loadSavedLoops() {
        if (!this.videoId) return [];

        try {
            // Use StorageService to get loops (with cloud sync)
            this.savedLoops = await this.storageService.getYouTubeLoops(this.videoId);
            return this.savedLoops;
        } catch (e) {
            console.error('Error loading saved loops:', e);
            this.savedLoops = [];
            return [];
        }
    }

    loadLoop(index) {
        if (index >= 0 && index < this.savedLoops.length) {
            const loop = this.savedLoops[index];
            this.loopStart = loop.start;
            this.loopEnd = loop.end;
            return true;
        }
        return false;
    }

    async deleteLoop(index) {
        if (index >= 0 && index < this.savedLoops.length) {
            this.savedLoops.splice(index, 1);

            // Update storage using StorageService
            await this.storageService.saveYouTubeLoop(this.videoId, this.savedLoops);
            return true;
        }
        return false;
    }

    getCurrentTime() {
        return this.player && this.ready ? this.player.getCurrentTime() : 0;
    }

    getDuration() {
        return this.player && this.ready ? this.player.getDuration() : 0;
    }

    get isPlaying() {
        return this.player && this.ready && this.player.getPlayerState() === 1; // 1 = PLAYING
    }

    getState() {
        return {
            videoId: this.videoId,
            videoUrl: this.videoUrl,
            videoTitle: this.videoTitle,
            currentTime: this.getCurrentTime(),
            duration: this.getDuration(),
            playbackRate: this.playbackRate,
            pitchShift: this.pitchShift,
            volume: this.volume,
            loopStart: this.loopStart,
            loopEnd: this.loopEnd,
            looping: this.looping,
            autoProgress: this.autoProgress,
            progressionSettings: this.progressionSettings
        };
    }

    setState(state) {
        if (!state) return;

        // Note: Cannot restore video automatically due to browser restrictions
        // Just save the state for reference
        if (state.videoId) {
            this.videoId = state.videoId;
            this.videoUrl = state.videoUrl;
            this.videoTitle = state.videoTitle;
        }

        if (state.loopStart !== undefined) this.loopStart = state.loopStart;
        if (state.loopEnd !== undefined) this.loopEnd = state.loopEnd;
        if (state.looping !== undefined) this.looping = state.looping;
        if (state.autoProgress !== undefined) this.autoProgress = state.autoProgress;
        if (state.progressionSettings) this.progressionSettings = state.progressionSettings;
    }

    setUpdateCallback(callback) {
        this.onUpdateCallback = callback;
    }

    setSpeedProgressionCallbacks(callbacks) {
        if (callbacks.onSpeedProgressionUpdate) {
            this.onSpeedProgressionUpdate = callbacks.onSpeedProgressionUpdate;
        }
        if (callbacks.onSpeedIncrease) {
            this.onSpeedIncrease = callbacks.onSpeedIncrease;
        }
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        if (this.player) {
            this.player.destroy();
            this.player = null;
        }

        this.ready = false;
        this.onUpdateCallback = null;
        this.onSpeedProgressionUpdate = null;
        this.onSpeedIncrease = null;
    }
}

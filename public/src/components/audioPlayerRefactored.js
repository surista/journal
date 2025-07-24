// Audio Player Component - Refactored with modular architecture
import { AudioCore } from './audioModules/audioCore.js';
import { LoopController } from './audioModules/loopController.js';
import { PitchTempoController } from './audioModules/pitchTempoController.js';
import { WaveformController } from './audioModules/waveformController.js';
import { UIControls } from './audioModules/uiControls.js';
import { SessionManager } from './audio/sessionManager.js';
import { youtubeAudioProcessor } from '../services/youtubeAudioProcessor.js';
import { StorageService } from '../services/storageService.js';

export class AudioPlayer {
    constructor(audioServiceOrContainer, storageServiceOrAudioService) {
        // Handle backward compatibility - support both constructor signatures
        if (audioServiceOrContainer && audioServiceOrContainer.nodeType) {
            // Old signature: (container, audioService)
            this.container = audioServiceOrContainer;
            this.audioService = storageServiceOrAudioService;
            this.storageService = null;
            // Schedule auto-render for backward compatibility
            setTimeout(() => {
                if (this.container && !this.isInitialized) {
                    this.render(this.container);
                }
            }, 0);
        } else {
            // New signature: (audioService, storageService)
            this.audioService = audioServiceOrContainer;
            this.storageService = storageServiceOrAudioService || this.ensureStorageService();
        }
        
        // Initialize modules
        this.audioCore = new AudioCore(this.audioService);
        this.loopController = new LoopController();
        this.pitchTempoController = new PitchTempoController();
        this.waveformController = new WaveformController();
        this.uiControls = new UIControls();
        this.sessionManager = new SessionManager(this);
        
        // State
        this.isInitialized = false;
        this.container = null;
        this.currentFileName = null;
        
        // YouTube support
        this.youtubePlayer = null;
        this.isYouTubeMode = false;
        this.youtubeVideoId = null;
        this.youtubeVideoTitle = null;
        this.youtubeVideoUrl = null;
        this.youtubeUpdateInterval = null;
        
        // Timer sync
        this.syncWithTimer = true;
        
        // Update interval for time display
        this.updateInterval = null;
        
        // Bind methods
        this.handlePlayPause = this.handlePlayPause.bind(this);
        this.handleStop = this.handleStop.bind(this);
        this.handleLoopStart = this.handleLoopStart.bind(this);
        this.handleLoopEnd = this.handleLoopEnd.bind(this);
        this.handleLoopToggle = this.handleLoopToggle.bind(this);
        this.handleLoopClear = this.handleLoopClear.bind(this);
        this.handleSeek = this.handleSeek.bind(this);
        this.handleSpeedChange = this.handleSpeedChange.bind(this);
        this.handlePitchChange = this.handlePitchChange.bind(this);
        this.updateTimeDisplay = this.updateTimeDisplay.bind(this);
    }

    ensureStorageService() {
        // Try multiple fallback locations
        if (window.app?.currentPage?.storageService) {
            return window.app.currentPage.storageService;
        } else if (window.app?.storageService) {
            return window.app.storageService;
        } else if (window.storageService) {
            return window.storageService;
        } else {
            // Try to create a new instance as a last resort
            try {
                const service = new StorageService();
                // Make it available globally for other components
                if (window.app) {
                    window.app.storageService = service;
                }
                return service;
            } catch (e) {
                console.error('Failed to create storage service instance:', e);
                return null;
            }
        }
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            // Ensure storageService is available (for backward compatibility)
            if (!this.storageService) {
                this.storageService = this.ensureStorageService();
            }
            
            // Initialize audio core
            await this.audioCore.initialize();
            
            // Set up module connections
            this.setupModuleConnections();
            
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize audio player:', error);
            console.error('Error stack:', error.stack);
            return false;
        }
    }

    setupModuleConnections() {
        // Connect loop controller callbacks
        this.loopController.onLoopUpdate = (state) => {
            this.uiControls.updateLoopInfo(state.loopStart, state.loopEnd, state.isLooping);
            this.waveformController.updateLoopRegion(state.loopStart, state.loopEnd);
        };
        
        this.loopController.onLoopComplete = (loopCount) => {
            this.uiControls.updateLoopCount(loopCount);
        };
        
        this.loopController.onLoopsLoaded = (savedLoops) => {
            // This will be handled by the unified practice component
            // which will update the saved loops UI
        };
        
        this.loopController.onTempoChange = (newTempo) => {
            this.pitchTempoController.setSpeed(newTempo);
            this.audioCore.setPlaybackRate(newTempo);
        };
        
        // Connect pitch/tempo controller callbacks
        this.pitchTempoController.onSpeedChange = (speed) => {
            this.audioCore.setPlaybackRate(speed);
            this.uiControls.updateSpeedDisplay(Math.round(speed * 100));
        };
        
        this.pitchTempoController.onPitchChange = (pitch) => {
            this.audioCore.setPitchShift(pitch);
            this.uiControls.updatePitchDisplay(pitch);
        };
        
        // Connect waveform controller callbacks
        this.waveformController.onSeek = this.handleSeek.bind(this);
        
        // Connect UI callbacks
        console.log('Setting up UI callbacks, handleLoopSave exists:', !!this.handleLoopSave);
        this.uiControls.setCallbacks({
            onPlayPause: this.handlePlayPause.bind(this),
            onStop: this.handleStop.bind(this),
            onLoopStart: this.handleLoopStart.bind(this),
            onLoopEnd: this.handleLoopEnd.bind(this),
            onLoopToggle: this.handleLoopToggle.bind(this),
            onLoopClear: this.handleLoopClear.bind(this),
            onLoopSave: this.handleLoopSave ? this.handleLoopSave.bind(this) : null,
            onSpeedChange: this.handleSpeedChange.bind(this),
            onPitchChange: this.handlePitchChange.bind(this)
        });
    }

    async render(container) {
        this.container = container;
        
        // Initialize UI
        this.uiControls.initialize(container);
        
        // Initialize waveform
        const canvas = this.uiControls.getWaveformCanvas();
        if (canvas) {
            this.waveformController.initialize(canvas);
        }
        
        // Initialize if not done
        if (!this.isInitialized) {
            await this.init();
        }
    }

    async loadAudioFile(file) {
        if (!file) return false;
        
        try {
            this.uiControls.showLoading(true);
            this.uiControls.disable();
            
            // Read file as array buffer
            const arrayBuffer = await file.arrayBuffer();
            
            // Decode audio data
            // Note: At this point, user has already interacted with file input
            let audioContext;
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (error) {
                console.error('Failed to create AudioContext:', error);
                throw new Error('Cannot create AudioContext. Please ensure you have interacted with the page first.');
            }
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            // Load into audio core
            const success = await this.audioCore.loadAudioBuffer(audioBuffer, file.name);
            
            if (success) {
                this.currentFileName = file.name;
                this.isYouTubeMode = false;
                
                // Set current file in loop controller and load saved loops
                this.loopController.setCurrentFile(file.name);
                
                // Generate waveform
                await this.waveformController.generateWaveform(audioBuffer);
                
                // Update UI
                this.uiControls.updateTime(0, audioBuffer.duration);
                this.uiControls.enable();
                
                // Start time update loop
                this.startTimeUpdates();
            }
            
            return success;
        } catch (error) {
            console.error('Error loading audio file:', error);
            return false;
        } finally {
            this.uiControls.showLoading(false);
        }
    }

    async loadAudioBuffer(audioBuffer, fileName = 'audio.mp3') {
        try {
            this.uiControls.showLoading(true);
            this.uiControls.disable();
            
            // Ensure we're initialized
            if (!this.isInitialized) {
                await this.init();
            }
            
            // Load into audio core
            const success = await this.audioCore.loadAudioBuffer(audioBuffer, fileName);
            
            if (success) {
                this.currentFileName = fileName;
                this.isYouTubeMode = false;
                
                // Set current file in loop controller and load saved loops
                this.loopController.setCurrentFile(fileName);
                
                // Generate waveform
                await this.waveformController.generateWaveform(audioBuffer);
                
                // Update UI
                this.uiControls.updateTime(0, audioBuffer.duration);
                this.uiControls.enable();
                
                // Start time update loop
                this.startTimeUpdates();
                
            }
            
            return success;
        } catch (error) {
            console.error('Error loading audio buffer:', error);
            console.error('Error stack:', error.stack);
            return false;
        } finally {
            this.uiControls.showLoading(false);
        }
    }

    // YouTube support methods
    async loadYouTubeVideo(url) {
        this.isYouTubeMode = true;
        this.youtubeVideoUrl = url;
        
        // Extract video ID
        this.youtubeVideoId = this.extractYouTubeVideoId(url);
        if (!this.youtubeVideoId) {
            console.error('Invalid YouTube URL');
            return false;
        }
        
        // Initialize YouTube player if needed
        if (!this.youtubePlayer) {
            await this.initializeYouTubePlayer();
        } else {
            this.youtubePlayer.loadVideoById(this.youtubeVideoId);
        }
        
        return true;
    }

    extractYouTubeVideoId(url) {
        const patterns = [
            /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
            /youtube\.com\/shorts\/([^"&?\/\s]{11})/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        
        return null;
    }

    async initializeYouTubePlayer() {
        // This would initialize YouTube player
        // For now, it's a placeholder
        console.log('YouTube player initialization would happen here');
    }

    // Playback control methods
    async handlePlayPause() {
        console.log('handlePlayPause called, isPlaying:', this.audioCore.isPlaying);
        try {
            if (this.audioCore.isPlaying) {
                this.pause();
            } else {
                await this.play();
            }
        } catch (error) {
            console.error('Error in handlePlayPause:', error);
        }
    }

    async play() {
        console.log('AudioPlayer.play() called, syncWithTimer:', this.syncWithTimer);
        try {
            const success = await this.audioCore.play();
            console.log('AudioCore.play() returned:', success);
            
            if (success) {
                this.uiControls.updatePlayPauseButton(true);
                this.startTimeUpdates();
                
                // Sync with timer if enabled
                console.log('Checking timer sync, syncWithTimer:', this.syncWithTimer);
                if (this.syncWithTimer) {
                    console.log('Timer sync enabled, calling syncTimerStart()');
                    this.syncTimerStart();
                } else {
                    console.log('Timer sync disabled, not starting timer');
                }
            }
            
            return success;
        } catch (error) {
            console.error('Error in play():', error);
            console.error('Error stack:', error.stack);
            return false;
        }
    }

    pause() {
        this.audioCore.pause();
        this.uiControls.updatePlayPauseButton(false);
        
        // Sync with timer if enabled
        if (this.syncWithTimer) {
            this.syncTimerStop();
        }
    }

    handleStop() {
        this.audioCore.stop();
        this.loopController.reset();
        this.uiControls.updatePlayPauseButton(false);
        this.uiControls.updateTime(0, this.audioCore.duration);
        this.waveformController.updateProgress(0);
        
        // Sync with timer
        if (this.syncWithTimer) {
            this.syncTimerStop();
        }
    }

    handleSeek(time) {
        this.audioCore.seek(time);
        this.uiControls.updateTime(time, this.audioCore.duration);
        this.waveformController.updateProgress(time);
    }

    // Loop control methods
    handleLoopStart() {
        const currentTime = this.audioCore.getCurrentTime();
        const success = this.loopController.setLoopStart(currentTime, this.audioCore.duration);
        
        if (success) {
            // Auto-save disabled for now
            // this.sessionManager.saveCurrentSession();
        }
    }

    handleLoopEnd() {
        const currentTime = this.audioCore.getCurrentTime();
        const success = this.loopController.setLoopEnd(currentTime, this.audioCore.duration);
        
        if (success) {
            // Auto-save disabled for now
            // this.sessionManager.saveCurrentSession();
        }
    }

    handleLoopToggle() {
        const isLooping = this.loopController.toggleLooping();
        // Auto-save disabled for now
            // this.sessionManager.saveCurrentSession();
        return isLooping;
    }

    handleLoopClear() {
        this.loopController.clearLoop();
        // Auto-save disabled for now
            // this.sessionManager.saveCurrentSession();
    }

    // Speed/Pitch control methods
    handleSpeedChange(speed) {
        this.pitchTempoController.setSpeed(speed);
        // Auto-save disabled for now
            // this.sessionManager.saveCurrentSession();
    }

    handlePitchChange(pitch) {
        this.pitchTempoController.setPitch(pitch);
        // Auto-save disabled for now
            // this.sessionManager.saveCurrentSession();
    }

    // Time update methods
    startTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(this.updateTimeDisplay.bind(this), 50);
    }

    stopTimeUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    updateTimeDisplay() {
        if (!this.audioCore.isPlaying) return;
        
        const currentTime = this.audioCore.getCurrentTime();
        const duration = this.audioCore.duration;
        
        // Update UI
        this.uiControls.updateTime(currentTime, duration);
        this.waveformController.updateProgress(currentTime);
        
        // Check loop boundary
        const seekTo = this.loopController.checkLoopBoundary(currentTime);
        if (seekTo !== null) {
            this.audioCore.seek(seekTo);
        }
    }

    // Timer sync methods
    syncTimerStart() {
        console.log('AudioPlayer.syncTimerStart() called, syncWithTimer:', this.syncWithTimer);
        const timer = this.findTimer();
        console.log('AudioPlayer found timer:', timer);
        if (timer && !timer.isRunning) {
            console.log('AudioPlayer starting timer');
            timer.start();
        } else if (timer && timer.isRunning) {
            console.log('AudioPlayer timer already running');
        } else if (!timer) {
            console.log('AudioPlayer could not find timer');
        }
    }

    syncTimerStop() {
        const timer = this.findTimer();
        if (timer && timer.isRunning) {
            timer.pause();
        }
    }

    findTimer() {
        console.log('AudioPlayer.findTimer() called');
        // Use timer registry for standardized access
        if (window.timerRegistry) {
            const timer = window.timerRegistry.getPrimary();
            console.log('AudioPlayer found timer via registry:', timer);
            return timer;
        }
        
        // Fallback to legacy patterns if registry not available
        if (window.currentTimer) {
            console.log('AudioPlayer found timer via window.currentTimer');
            return window.currentTimer;
        } else if (window.app?.currentPage?.timer) {
            console.log('AudioPlayer found timer via window.app.currentPage.timer');
            return window.app.currentPage.timer;
        } else if (window.unifiedPracticeMinimal?.timer) {
            console.log('AudioPlayer found timer via window.unifiedPracticeMinimal.timer');
            return window.unifiedPracticeMinimal.timer;
        }
        
        console.log('AudioPlayer could not find timer anywhere');
        return null;
    }

    // Settings methods
    setSyncWithTimer(enabled) {
        this.syncWithTimer = enabled;
    }

    setQuality(mode) {
        this.audioCore.setQuality(mode);
    }

    // State management
    getState() {
        return {
            audioCore: this.audioCore.getState(),
            loops: this.loopController.getState(),
            pitchTempo: this.pitchTempoController.getState(),
            fileName: this.currentFileName,
            isYouTubeMode: this.isYouTubeMode,
            youtubeVideoId: this.youtubeVideoId,
            syncWithTimer: this.syncWithTimer
        };
    }

    setState(state) {
        if (!state) return;
        
        if (state.loops) {
            this.loopController.setState(state.loops);
        }
        
        if (state.pitchTempo) {
            this.pitchTempoController.setState(state.pitchTempo);
        }
        
        if (state.syncWithTimer !== undefined) {
            this.syncWithTimer = state.syncWithTimer;
        }
    }

    // Getters for backward compatibility
    get isPlaying() {
        return this.audioCore.isPlaying;
    }

    get currentTime() {
        return this.audioCore.getCurrentTime();
    }

    get duration() {
        return this.audioCore.duration;
    }

    get playbackRate() {
        return this.pitchTempoController.playbackRate;
    }

    get pitchShiftAmount() {
        return this.pitchTempoController.pitchShift;
    }

    // Backward compatibility methods
    togglePlayPause() {
        return this.handlePlayPause();
    }

    stop() {
        return this.handleStop();
    }

    getSettings() {
        return {
            playbackRate: this.pitchTempoController.playbackRate,
            pitchShift: this.pitchTempoController.pitchShift,
            loopStart: this.loopController.loopStart,
            loopEnd: this.loopController.loopEnd,
            isLooping: this.loopController.isLooping
        };
    }

    // Expose waveformVisualizer for backward compatibility
    get waveformVisualizer() {
        // Return the waveform controller which has resizeCanvas and draw methods
        return this.waveformController;
    }

    // Clean up
    destroy() {
        this.stopTimeUpdates();
        
        if (this.youtubeUpdateInterval) {
            clearInterval(this.youtubeUpdateInterval);
        }
        
        // Destroy all modules
        this.audioCore.destroy();
        this.waveformController.destroy();
        this.uiControls.destroy();
        
        // Clear references
        this.container = null;
        this.youtubePlayer = null;
    }
}
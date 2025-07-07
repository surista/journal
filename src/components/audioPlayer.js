// Audio Player Component - Complete Updated Version
// Import the correct WaveformVisualizer class
import {WaveformVisualizer} from './waveform.js';

export class AudioPlayer {
    constructor(container, audioService) {
        this.container = container;
        this.audioService = audioService;
        this.storageService = null; // Will be set by dashboard
        this.audio = null;
        this.audioContext = null;
        this.sourceNode = null;
        this.isInitialized = false;
        this.currentFileName = null;
        this.waveformVisualizer = null;

        // Audio parameters
        this.playbackRate = 1.0;
        this.pitchShift = 0;
        this.loopStart = null;
        this.loopEnd = null;
        this.isLooping = false;

        // UI state
        this.isPlaying = false;
        this.duration = 0;
        this.currentTime = 0;
    }

    // Add this method after the constructor in audioPlayer.js:

    ensureStorageService() {
        // Try to get storage service from dashboard if not already set
        if (!this.storageService) {
            // Try multiple paths to find the storage service
            if (window.app?.currentPage?.storageService) {
                this.storageService = window.app.currentPage.storageService;
                console.log('Storage service obtained from dashboard');
            } else if (window.app?.storageService) {
                this.storageService = window.app.storageService;
                console.log('Storage service obtained from app');
            } else {
                console.error('Storage service not found in any expected location');
                return false;
            }
        }
        return true;
    }

    init() {
        if (this.isInitialized) {
            console.log('Audio player already initialized');
            return;
        }

        console.log('Initializing audio player...');

        try {
            // Render the UI
            this.render();

            // Initialize audio context
            this.initializeAudioContext();

            // Mark as initialized
            this.isInitialized = true;

            console.log('Audio player initialized successfully');
        } catch (error) {
            console.error('Error in audio player init:', error);
            throw error;
        }
    }

    initializeAudioContext() {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            console.log('Audio context created');
        } catch (error) {
            console.error('Failed to create audio context:', error);
        }
    }

    render() {
        if (!this.container) {
            console.error('No container for audio player');
            return;
        }

        this.container.innerHTML = `
            <div class="audio-player">
                <!-- File Selection -->
                <div class="audio-file-section">
                    <h3>Select Audio File</h3>
                    <input type="file" id="audioFileInput" accept="audio/*" class="file-input">
                    <div id="currentFileName" class="current-file-name"></div>
                </div>

                <!-- Audio Controls -->
                <div id="audioControlsSection" class="audio-controls-section" style="display: none;">
                    <!-- Waveform -->
                    <div class="waveform-container" style="position: relative; width: 100%; height: 150px; background: var(--bg-input); border-radius: 8px; overflow: hidden;">
                        <canvas id="waveformCanvas" style="width: 100%; height: 100%; display: block;"></canvas>
                        <div class="loop-region" id="loopRegion" style="position: absolute; top: 0; height: 100%; background: rgba(99, 102, 241, 0.2); pointer-events: none; display: none;"></div>
                    </div>

                    <!-- Playback Controls -->
                    <div class="playback-controls">
                        <button id="playPauseBtn" class="btn btn-primary">
                            <i class="icon">▶️</i> Play
                        </button>
                        <button id="stopBtn" class="btn btn-secondary">
                            <i class="icon">⏹️</i> Stop
                        </button>
                        <div class="time-display">
                            <span id="currentTime">0:00</span> / <span id="duration">0:00</span>
                        </div>
                    </div>

                <!-- Loop Controls -->
                    <div class="loop-controls">
                        <h4>Loop Section</h4>
                        <div class="loop-content">
                            <div class="loop-main-controls">
                                <button id="setLoopStartBtn" class="btn btn-sm btn-secondary">Set Start</button>
                                <button id="setLoopEndBtn" class="btn btn-sm btn-secondary">Set End</button>
                                <button id="clearLoopBtn" class="btn btn-sm btn-secondary">Clear</button>
                                <div class="loop-info">
                                    <span id="loopStart">--:--</span> - <span id="loopEnd">--:--</span>
                                </div>
                            </div>
                            <label class="checkbox-label loop-enable">
                                <input type="checkbox" id="loopEnabled">
                                <span>Enable Loop</span>
                            </label>
                        </div>
                    </div>

                    <!-- Saved Sessions - Moved here after Loop Controls -->
                    <div class="saved-sessions-section" id="savedSessionsSection">
                        <h4>Saved Sessions</h4>
                        <div id="savedSessionsList" class="saved-sessions-list">
                            <p class="empty-state">No saved sessions for this file</p>
                        </div>
                        <button id="saveSessionBtn" class="btn btn-primary">
                            <i class="icon">💾</i> Save Current Session
                        </button>
                    </div>

                    <!-- Speed Control -->
                    <div class="speed-control">
                        <h4>Playback Speed: <span id="speedValue">100%</span></h4>
                        <div class="speed-buttons">
                            <button class="speed-btn" data-speed="-10">-10%</button>
                            <button class="speed-btn" data-speed="-5">-5%</button>
                            <button class="speed-btn" data-speed="-1">-1%</button>
                            <button class="speed-btn" data-speed="+1">+1%</button>
                            <button class="speed-btn" data-speed="+5">+5%</button>
                            <button class="speed-btn" data-speed="+10">+10%</button>
                        </div>
                        <input type="range" id="speedSlider" min="50" max="150" value="100" step="1" class="slider">
                        <label class="checkbox-label">
                            <input type="checkbox" id="preservePitch" checked>
                            <span>Preserve pitch when changing tempo</span>
                        </label>
                        <button id="resetSpeedBtn" class="btn btn-secondary">
                            <i class="icon">↻</i> Reset to 100%
                        </button>
                    </div>

                    <!-- Pitch Control -->
                    <div class="pitch-control">
                        <h4>Pitch Adjustment: <span id="pitchValue">0 semitones</span></h4>
                        <div class="pitch-buttons">
                            <button class="pitch-btn" data-pitch="-1">-1</button>
                            <button class="pitch-btn" data-pitch="-0.5">-½</button>
                            <input type="range" id="pitchSlider" min="-12" max="12" value="0" step="0.5" class="slider">
                            <button class="pitch-btn" data-pitch="+0.5">+½</button>
                            <button class="pitch-btn" data-pitch="+1">+1</button>
                        </div>
                        <button id="resetPitchBtn" class="btn btn-secondary">
                            <i class="icon">↻</i> Reset to Original Pitch
                        </button>
                        
                        <!-- Common Transpositions -->
                        <div class="common-transpositions">
                            <p>Common Transpositions:</p>
                            <div class="transposition-buttons">
                                <button class="trans-btn" data-pitch="-5">-5 (P4↓)</button>
                                <button class="trans-btn" data-pitch="-3">-3 (m3↓)</button>
                                <button class="trans-btn" data-pitch="-2">-2 (M2↓)</button>
                                <button class="trans-btn" data-pitch="-1">-1 (m2↓)</button>
                                <button class="trans-btn active" data-pitch="0">Original</button>
                                <button class="trans-btn" data-pitch="+1">+1 (m2↑)</button>
                                <button class="trans-btn" data-pitch="+2">+2 (M2↑)</button>
                                <button class="trans-btn" data-pitch="+3">+3 (m3↑)</button>
                                <button class="trans-btn" data-pitch="+5">+5 (P4↑)</button>
                            </div>
                        </div>
                    </div>

                    <!-- Volume Control -->
                    <div class="volume-control">
                        <h4>Volume Control</h4>
                        <div class="volume-slider-container">
                            <i class="icon">🔊</i>
                            <input type="range" id="volumeSlider" min="0" max="100" value="100" class="slider">
                            <span id="volumeValue">100%</span>
                        </div>
                    </div>

                    <!-- Info Text -->
                    <div class="save-info">
                        <p>💡 Tip: Use the "Save Current Session" button to save your loop points and settings</p>
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    attachEventListeners() {
        // File input
        const fileInput = document.getElementById('audioFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        // Playback controls
        const playPauseBtn = document.getElementById('playPauseBtn');
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        }

        const stopBtn = document.getElementById('stopBtn');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stop());
        }

        // Loop controls
        document.getElementById('setLoopStartBtn')?.addEventListener('click', () => this.setLoopStart());
        document.getElementById('setLoopEndBtn')?.addEventListener('click', () => this.setLoopEnd());
        document.getElementById('clearLoopBtn')?.addEventListener('click', () => this.clearLoop());
        document.getElementById('loopEnabled')?.addEventListener('change', (e) => {
            this.isLooping = e.target.checked;
        });

        // Save session button
        document.getElementById('saveSessionBtn')?.addEventListener('click', () => this.saveCurrentSession());

        // Speed controls
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const change = parseInt(e.target.dataset.speed);
                this.adjustSpeed(change);
            });
        });

        const speedSlider = document.getElementById('speedSlider');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                this.setSpeed(parseInt(e.target.value));
            });
        }

        document.getElementById('resetSpeedBtn')?.addEventListener('click', () => {
            this.setSpeed(100);
            if (speedSlider) speedSlider.value = 100;
        });

        // Pitch controls
        document.querySelectorAll('.pitch-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const change = parseFloat(e.target.dataset.pitch);
                this.adjustPitch(change);
            });
        });

        const pitchSlider = document.getElementById('pitchSlider');
        if (pitchSlider) {
            pitchSlider.addEventListener('input', (e) => {
                this.setPitch(parseFloat(e.target.value));
            });
        }

        document.getElementById('resetPitchBtn')?.addEventListener('click', () => {
            this.setPitch(0);
            if (pitchSlider) pitchSlider.value = 0;
        });

        // Transposition buttons
        document.querySelectorAll('.trans-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pitch = parseFloat(e.target.dataset.pitch);
                this.setPitch(pitch);
                if (pitchSlider) pitchSlider.value = pitch;

                // Update active state
                document.querySelectorAll('.trans-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Volume control
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                document.getElementById('volumeValue').textContent = value + '%';
                if (this.audio) {
                    this.audio.volume = value / 100;
                }
            });
        }

        // Note: Waveform click handlers will be set up when waveform is initialized
        // No need to set them up here - the waveform handles its own clicks
    }

    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        console.log('Loading audio file:', file.name);

        try {
            // Stop any playing audio and clear waveform animation first
            if (this.audio) {
                this.audio.pause();
                this.isPlaying = false;
                this.updatePlayPauseButton();

                // Stop waveform animation if it exists
                if (this.waveformVisualizer && this.waveformVisualizer.stopAnimation) {
                    this.waveformVisualizer.stopAnimation();
                }
            }

            // Store filename
            this.currentFileName = file.name;
            document.getElementById('currentFileName').textContent = file.name;

            // Clear previous audio if exists
            if (this.audio) {
                // Remove event listeners before clearing
                this.audio.removeEventListener('timeupdate', this.handleTimeUpdate);
                this.audio.removeEventListener('play', this.handlePlay);
                this.audio.removeEventListener('pause', this.handlePause);
                this.audio.removeEventListener('ended', this.handleEnded);

                this.audio.pause();
                this.audio.src = '';
                this.audio = null;
            }

            // IMPORTANT: Clear audioService references to prevent null access
            if (this.audioService) {
                this.audioService.audio = null;
                this.audioService.pausedAt = 0;
                this.audioService.currentTime = 0;

                // Clear any existing timeupdate callback
                this.audioService.onTimeUpdate = null;
            }

            // Clear any existing loops from previous file
            this.clearLoop();

            // Reset current time
            this.currentTime = 0;

            // Create new audio element
            this.audio = new Audio();
            const audioUrl = URL.createObjectURL(file);

            // Set up promise for when metadata is loaded
            const metadataLoaded = new Promise((resolve, reject) => {
                this.audio.addEventListener('loadedmetadata', () => {
                    console.log('Audio metadata loaded, duration:', this.audio.duration);
                    resolve();
                }, {once: true});

                this.audio.addEventListener('error', (e) => {
                    console.error('Audio loading error:', e);
                    reject(new Error('Failed to load audio file'));
                }, {once: true});

                // Set timeout for loading
                setTimeout(() => reject(new Error('Audio loading timeout')), 10000);
            });

            // Set the source after event listeners are attached
            this.audio.src = audioUrl;

            // Load the audio to trigger metadata loading
            this.audio.load();

            // Wait for metadata
            await metadataLoaded;

            // Verify duration is available
            if (!this.audio.duration || isNaN(this.audio.duration)) {
                throw new Error('Invalid audio duration');
            }

            // IMPORTANT: Update audioService with new audio element AFTER it's loaded
            if (this.audioService) {
                this.audioService.audio = this.audio;
                this.audioService.pausedAt = 0;
                this.audioService.currentTime = 0;
            }

            // Show controls
            document.getElementById('audioControlsSection').style.display = 'block';

            // Update duration display
            this.duration = this.audio.duration;
            document.getElementById('duration').textContent = this.formatTime(this.duration);

            // Set up audio event listeners
            this.setupAudioEventListeners();

            // Initialize playhead at start position
            this.currentTime = 0;
            document.getElementById('currentTime').textContent = this.formatTime(0);

            // Initialize waveform
            await this.initializeWaveform(file);

            // Load saved sessions for this file
            this.loadSavedSessions();

            console.log('Audio file loaded successfully');

        } catch (error) {
            console.error('Error loading audio file:', error);
            this.showNotification('Failed to load audio file: ' + error.message, 'error');

            // Clean up on error
            if (this.audio) {
                this.audio.src = '';
                this.audio = null;
            }

            // Clean up audioService on error too
            if (this.audioService) {
                this.audioService.audio = null;
                this.audioService.pausedAt = 0;
                this.audioService.currentTime = 0;
            }

            // Hide controls on error
            document.getElementById('audioControlsSection').style.display = 'none';
        }
    }

    setupAudioEventListeners() {
        if (!this.audio) return;

        // Create bound event handlers so we can remove them later
        this.handleTimeUpdate = () => {
            if (!this.audio) return; // Safety check

            this.currentTime = this.audio.currentTime;
            document.getElementById('currentTime').textContent = this.formatTime(this.currentTime);

            // Update waveform progress
            if (this.waveformVisualizer) {
                this.waveformVisualizer.updateProgress(this.currentTime);
            }

            // Handle looping
            if (this.isLooping && this.loopEnd !== null && this.currentTime >= this.loopEnd) {
                this.audio.currentTime = this.loopStart || 0;
                // Force update after loop jump
                if (this.waveformVisualizer) {
                    this.waveformVisualizer.updateProgress(this.loopStart || 0);
                }
            }
        };

        this.handlePlay = () => {
            this.isPlaying = true;
            this.updatePlayPauseButton();

            // Start timer if sync is enabled - try multiple paths
            let timer = null;

            // Try different ways to find the timer
            if (window.app?.currentPage?.components?.timer) {
                timer = window.app.currentPage.components.timer;
                console.log('Found timer via components');
            } else if (window.app?.currentPage?.timer) {
                timer = window.app.currentPage.timer;
                console.log('Found timer via currentPage');
            }

            console.log('Timer sync check:', {
                timerFound: !!timer,
                syncEnabled: timer?.syncWithAudio,
                isRunning: timer?.isRunning,
                timerObject: timer
            });

            if (timer && timer.syncWithAudio) {
                console.log('Timer state before start:', {
                    isRunning: timer.isRunning,
                    elapsedTime: timer.elapsedTime,
                    displayId: timer.displayId,
                    container: timer.container
                });

                // Small delay to ensure timer state is properly initialized
                setTimeout(() => {
                    if (!timer.isRunning) {
                        console.log('Starting timer from audio play');
                        timer.start();

                        // Force update display after a short delay
                        setTimeout(() => {
                            timer.updateDisplay();
                            console.log('Forced display update');
                        }, 100);
                    } else {
                        console.log('Timer already running');
                    }
                }, 50);
            }

            // Start waveform animation with a small delay to ensure proper sync
            setTimeout(() => {
                if (this.waveformVisualizer && this.waveformVisualizer.startAnimation) {
                    this.waveformVisualizer.startAnimation();
                }
            }, 50);
        };

        this.handlePause = () => {
            this.isPlaying = false;
            this.updatePlayPauseButton();

            // Pause timer if sync is enabled - try multiple paths
            let timer = null;

            // Try different ways to find the timer
            if (window.app?.currentPage?.components?.timer) {
                timer = window.app.currentPage.components.timer;
            } else if (window.app?.currentPage?.timer) {
                timer = window.app.currentPage.timer;
            }

            if (timer && timer.syncWithAudio && timer.isRunning) {
                console.log('Pausing timer from audio pause');
                timer.pause();
            }

            // Stop waveform animation
            if (this.waveformVisualizer && this.waveformVisualizer.stopAnimation) {
                this.waveformVisualizer.stopAnimation();
            }
        };

        this.handleEnded = () => {
            if (!this.isLooping) {
                this.isPlaying = false;
                this.updatePlayPauseButton();

                // Stop waveform animation
                if (this.waveformVisualizer && this.waveformVisualizer.stopAnimation) {
                    this.waveformVisualizer.stopAnimation();
                }
            }
        };

        // Ensure time is synced when metadata loads
        this.audio.addEventListener('loadedmetadata', () => {
            if (this.audio) {
                this.audio.currentTime = 0;
                this.currentTime = 0;
            }
        });

        // Add event listeners
        this.audio.addEventListener('timeupdate', this.handleTimeUpdate);
        this.audio.addEventListener('play', this.handlePlay);
        this.audio.addEventListener('pause', this.handlePause);
        this.audio.addEventListener('ended', this.handleEnded);
    }

    async initializeWaveform(file) {
        const canvas = document.getElementById('waveformCanvas');
        if (!canvas) return;

        try {
            // Initialize audio context if not already done
            if (!this.audioContext) {
                this.initializeAudioContext();
            }

            // Decode audio data for waveform
            if (this.audioContext) {
                const arrayBuffer = await file.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer.slice(0));

                // Store the buffer in audioService if available
                if (this.audioService) {
                    this.audioService.audioBuffer = audioBuffer;

                    // Also ensure audioService has reference to the audio element
                    this.audioService.audio = this.audio;

                    // Ensure the audio element is properly referenced
                    if (!this.audioService.audio) {
                        console.error('Audio element not set in audioService');
                    }

                    // Set up audioService methods if they don't exist
                    if (!this.audioService.getDuration) {
                        this.audioService.getDuration = () => this.duration || 0;
                    }
                    if (!this.audioService.getCurrentTime) {
                        this.audioService.getCurrentTime = () => this.audio ? this.audio.currentTime : 0;
                    }
                    if (!this.audioService.isPlaying) {
                        Object.defineProperty(this.audioService, 'isPlaying', {
                            get: () => this.isPlaying
                        });
                    }

                    // Add isLooping property to audioService
                    Object.defineProperty(this.audioService, 'isLooping', {
                        get: () => this.isLooping
                    });

                    // Override the audioService pausedAt to sync with our audio element
                    Object.defineProperty(this.audioService, 'pausedAt', {
                        get: () => {
                            // Add null check
                            if (!this.audio) return 0;
                            return this.audio.currentTime || 0;
                        },
                        set: (value) => {
                            // Add null check
                            if (!this.audio) {
                                console.warn('Cannot set pausedAt - no audio element');
                                return;
                            }
                            this.audio.currentTime = value;
                            this.currentTime = value;
                            // Update waveform visualizer directly
                            if (this.waveformVisualizer) {
                                this.waveformVisualizer.updateProgress(value);
                            }
                            const currentTimeEl = document.getElementById('currentTime');
                            if (currentTimeEl) {
                                currentTimeEl.textContent = this.formatTime(value);
                            }
                        }
                    });
                }

                // Create waveform visualizer with audioService
                this.waveformVisualizer = new WaveformVisualizer(canvas, this.audioService);

                // Re-attach click handlers after canvas setup
                this.waveformVisualizer.canvas.addEventListener('click', (e) => {
                    this.waveformVisualizer.handleClick(e);
                });
                this.waveformVisualizer.canvas.addEventListener('touchstart', (e) => {
                    this.waveformVisualizer.handleTouch(e);
                });

                // Force resize to ensure full width
                setTimeout(() => {
                    if (this.waveformVisualizer.resizeCanvas) {
                        this.waveformVisualizer.resizeCanvas();
                    }

                    // Draw the waveform
                    if (this.waveformVisualizer.draw) {
                        this.waveformVisualizer.draw();
                    }
                }, 100);

                console.log('Waveform visualizer initialized');
            } else {
                console.warn('AudioContext not available, waveform disabled');
            }
        } catch (error) {
            console.error('Error initializing waveform:', error);
            // Continue without waveform on error
        }
    }

    togglePlayPause() {
        if (!this.audio) return;

        if (this.isPlaying) {
            this.audio.pause();
        } else {
            // Resume audio context if suspended
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            // If looping is enabled and we have loop points, start from loop start
            if (this.isLooping && this.loopStart !== null) {
                // Check if current time is outside the loop region
                if (this.audio.currentTime < this.loopStart ||
                    (this.loopEnd !== null && this.audio.currentTime > this.loopEnd)) {
                    // Jump to loop start
                    this.audio.currentTime = this.loopStart;
                }
            }

            // Audio will play from its current currentTime position
            this.audio.play().catch(error => {
                console.error('Error playing audio:', error);
                this.showNotification('Failed to play audio', 'error');
            });
        }
    }

    stop() {
        if (!this.audio) return;

        this.audio.pause();

        // If looping is enabled, reset to loop start instead of beginning
        if (this.isLooping && this.loopStart !== null) {
            this.audio.currentTime = this.loopStart;
            this.currentTime = this.loopStart;

            // Update waveform to show loop start position
            if (this.waveformVisualizer) {
                this.waveformVisualizer.updateProgress(this.loopStart);
            }
        } else {
            this.audio.currentTime = 0;
            this.currentTime = 0;

            // Update waveform to show start position
            if (this.waveformVisualizer) {
                this.waveformVisualizer.updateProgress(0);
            }
        }

        this.isPlaying = false;
        this.updatePlayPauseButton();
    }

    updatePlayPauseButton() {
        const btn = document.getElementById('playPauseBtn');
        if (btn) {
            btn.innerHTML = this.isPlaying ?
                '<i class="icon">⏸️</i> Pause' :
                '<i class="icon">▶️</i> Play';
        }
    }

    // updatePlayhead() {
    //     if (!this.audio || !this.duration) return;
    //
    //     // Don't update the HTML playhead - let the canvas handle it
    //     // Just update the waveform visualizer if it exists
    //     if (this.waveformVisualizer) {
    //         this.waveformVisualizer.updateProgress(this.currentTime);
    //     }
    // }

    handleWaveformClick(event) {
        if (!this.audio || !this.duration) return;

        const canvas = event.target;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const percentage = x / rect.width;
        const time = percentage * this.duration;

        // Update the audio element's current time directly
        this.audio.currentTime = time;
        this.currentTime = time;

        // Update UI elements
        // this.updatePlayhead();
        document.getElementById('currentTime').textContent = this.formatTime(time);

        // If waveform visualizer exists, update it
        if (this.waveformVisualizer) {
            this.waveformVisualizer.updateProgress(time);
        }
    }


    // Loop control methods
    setLoopStart() {
        this.loopStart = this.currentTime;
        document.getElementById('loopStart').textContent = this.formatTime(this.loopStart);

        // Force update of loop region to show start marker immediately
        this.updateLoopRegion();

        // Also update waveform visualizer
        if (this.waveformVisualizer) {
            this.waveformVisualizer.updateLoopMarkers(this.loopStart, this.loopEnd);
        }

        this.showNotification('Loop start set', 'success');
    }

    setLoopEnd() {
        this.loopEnd = this.currentTime;
        document.getElementById('loopEnd').textContent = this.formatTime(this.loopEnd);
        this.updateLoopRegion();
        this.showNotification('Loop end set', 'success');
    }

    clearLoop() {
        this.loopStart = null;
        this.loopEnd = null;
        document.getElementById('loopStart').textContent = '--:--';
        document.getElementById('loopEnd').textContent = '--:--';
        document.getElementById('loopEnabled').checked = false;
        this.isLooping = false;
        this.updateLoopRegion();
        this.showNotification('Loop cleared', 'info');
    }

    updateLoopRegion() {
        const loopRegion = document.getElementById('loopRegion');
        if (!loopRegion || !this.duration) return;

        // Show loop region only when BOTH markers are set
        if (this.loopStart !== null && this.loopEnd !== null) {
            const startPercent = (this.loopStart / this.duration) * 100;
            const endPercent = (this.loopEnd / this.duration) * 100;

            loopRegion.style.left = startPercent + '%';
            loopRegion.style.width = (endPercent - startPercent) + '%';
            loopRegion.style.display = 'block';
        } else {
            loopRegion.style.display = 'none';
        }

        // Always update waveform markers if at least one is set
        if (this.waveformVisualizer) {
            this.waveformVisualizer.updateLoopMarkers(this.loopStart, this.loopEnd);
        }
    }

    // Speed control methods
    adjustSpeed(change) {
        const currentSpeed = this.playbackRate * 100;
        const newSpeed = Math.max(50, Math.min(150, currentSpeed + change));
        this.setSpeed(newSpeed);
        document.getElementById('speedSlider').value = newSpeed;
    }

    setSpeed(speed) {
        this.playbackRate = speed / 100;

        if (this.audio) {
            const preservePitch = document.getElementById('preservePitch');
            if (preservePitch && !preservePitch.checked && this.pitchShift !== 0) {
                // Apply both speed and pitch changes
                const pitchFactor = Math.pow(2, this.pitchShift / 12);
                this.audio.playbackRate = this.playbackRate * pitchFactor;
            } else {
                // Just apply speed change
                this.audio.playbackRate = this.playbackRate;
            }
        }

        document.getElementById('speedValue').textContent = speed + '%';
    }

    // Pitch control methods
    adjustPitch(change) {
        const newPitch = Math.max(-12, Math.min(12, this.pitchShift + change));
        this.setPitch(newPitch);
        document.getElementById('pitchSlider').value = newPitch;
    }

    setPitch(pitch) {
        this.pitchShift = pitch;
        document.getElementById('pitchValue').textContent =
            pitch > 0 ? `+${pitch} semitones` : `${pitch} semitones`;

        // Apply actual pitch shifting using playback rate
        // Note: This changes tempo too unless we implement a proper pitch shifter
        if (this.audio) {
            const preservePitch = document.getElementById('preservePitch');
            if (preservePitch && !preservePitch.checked) {
                // When preserve pitch is OFF, we can use playback rate for pitch
                const pitchFactor = Math.pow(2, pitch / 12);
                const combinedRate = this.playbackRate * pitchFactor;
                this.audio.playbackRate = combinedRate;
                console.log('Pitch applied via playback rate:', combinedRate);
            } else {
                // When preserve pitch is ON, we need the Web Audio API (not implemented yet)
                // For now, just apply the playback rate without pitch
                this.audio.playbackRate = this.playbackRate;
                console.log('Pitch shift requested:', pitch, 'semitones (preserve pitch mode - not implemented)');

                // Show notification that pitch shifting with preserved tempo isn't implemented
                if (pitch !== 0) {
                    this.showNotification('Note: Pitch shifting while preserving tempo requires advanced audio processing (not yet implemented)', 'info');
                }
            }
        }

        // Update transposition button states
        document.querySelectorAll('.trans-btn').forEach(btn => {
            const btnPitch = parseFloat(btn.dataset.pitch);
            btn.classList.toggle('active', btnPitch === pitch);
        });
    }

    // Session management methods
    loadSavedSessions() {
        if (!this.currentFileName || !this.storageService) return;

        const sessions = this.storageService.getAudioSessions?.(this.currentFileName) || [];
        const container = document.getElementById('savedSessionsList');

        if (!container) return;

        if (sessions.length === 0) {
            container.innerHTML = '<p class="empty-state">No saved sessions for this file</p>';
            return;
        }

        container.innerHTML = sessions.map((session, index) => `
        <div class="saved-session-item" style="
            background: var(--bg-input);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: var(--space-md);
            margin-bottom: var(--space-md);
            transition: all var(--transition-fast);
        ">
            <div class="session-info">
                <strong style="color: var(--text-primary); display: block; margin-bottom: var(--space-xs);">
                    ${session.name || `Session ${index + 1}`}
                </strong>
                <span class="session-date" style="color: var(--text-secondary); font-size: var(--text-sm);">
                    ${new Date(session.timestamp).toLocaleDateString()} ${new Date(session.timestamp).toLocaleTimeString()}
                </span>
                <div class="session-details" style="margin-top: var(--space-xs); font-size: var(--text-sm); color: var(--text-secondary);">
                    Speed: ${session.speed}% | Pitch: ${session.pitch > 0 ? '+' : ''}${session.pitch} semitones
                    ${session.loopStart !== null ? ` | Loop: ${this.formatTime(session.loopStart)} - ${this.formatTime(session.loopEnd)}` : ''}
                </div>
                ${session.notes ? `
                    <div style="
                        margin-top: var(--space-sm);
                        padding-top: var(--space-sm);
                        border-top: 1px solid var(--border);
                        font-size: var(--text-sm);
                        color: var(--text-primary);
                        font-style: italic;
                    ">
                        📝 ${session.notes}
                    </div>
                ` : ''}
            </div>
            <div class="session-actions" style="display: flex; gap: var(--space-sm); margin-top: var(--space-md);">
                <button class="btn btn-sm btn-primary" onclick="window.app.currentPage.components.audioPlayer.loadSession(${index})">
                    Load
                </button>
                <button class="btn btn-sm btn-danger" onclick="window.app.currentPage.components.audioPlayer.deleteSession(${index})">
                    Delete
                </button>
            </div>
        </div>
    `).join('');
    }

    saveCurrentSession() {
        if (!this.currentFileName) {
            this.showNotification('No audio file loaded', 'error');
            return;
        }

        // Ensure storage service is available
        if (!this.ensureStorageService()) {
            this.showNotification('Storage service not available. Please refresh the page.', 'error');
            return;
        }

        // Generate default session name with file name and loop timestamps
        let defaultSessionName = this.currentFileName.replace(/\.[^/.]+$/, ''); // Remove file extension

        // Add loop timestamps if they exist
        if (this.loopStart !== null && this.loopEnd !== null) {
            const startTime = this.formatTime(this.loopStart);
            const endTime = this.formatTime(this.loopEnd);
            defaultSessionName += ` (${startTime} - ${endTime})`;
        }

        // Create a modal dialog for session details
        const modalHtml = `
        <div class="session-save-modal" style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--bg-card);
            padding: var(--space-xl);
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-2xl);
            z-index: 10001;
            min-width: 400px;
            max-width: 90vw;
            border: 1px solid var(--border);
        ">
            <h3 style="margin-bottom: var(--space-lg); color: var(--text-primary);">Save Session</h3>
            
            <div style="margin-bottom: var(--space-lg);">
                <label style="display: block; margin-bottom: var(--space-sm); color: var(--text-secondary); font-size: var(--text-sm);">
                    Session Name:
                </label>
                <input type="text" id="sessionNameInput" value="${defaultSessionName}" style="
                    width: 100%;
                    padding: var(--space-sm) var(--space-md);
                    background: var(--bg-input);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    color: var(--text-primary);
                    font-size: var(--text-base);
                ">
            </div>
            
            <div style="margin-bottom: var(--space-xl);">
                <label style="display: block; margin-bottom: var(--space-sm); color: var(--text-secondary); font-size: var(--text-sm);">
                    Notes (optional):
                </label>
                <textarea id="sessionNotesInput" placeholder="e.g., Worked on first solo section" style="
                    width: 100%;
                    min-height: 80px;
                    padding: var(--space-sm) var(--space-md);
                    background: var(--bg-input);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    color: var(--text-primary);
                    font-size: var(--text-base);
                    resize: vertical;
                "></textarea>
            </div>
            
            <div style="display: flex; gap: var(--space-md); justify-content: flex-end;">
                <button id="cancelSessionSave" class="btn btn-secondary">Cancel</button>
                <button id="confirmSessionSave" class="btn btn-primary">Save Session</button>
            </div>
        </div>
        <div class="modal-backdrop" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
        "></div>
    `;

        // Add modal to body
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);

        // Focus on the input
        const nameInput = document.getElementById('sessionNameInput');
        nameInput.focus();
        nameInput.select();

        // Handle save
        const handleSave = () => {
            const sessionName = document.getElementById('sessionNameInput').value.trim();
            const sessionNotes = document.getElementById('sessionNotesInput').value.trim();

            if (!sessionName) {
                this.showNotification('Please enter a session name', 'error');
                return;
            }

            const session = {
                name: sessionName,
                notes: sessionNotes,
                timestamp: Date.now(),
                fileName: this.currentFileName,
                speed: this.playbackRate * 100,
                pitch: this.pitchShift,
                loopStart: this.loopStart,
                loopEnd: this.loopEnd,
                loopEnabled: document.getElementById('loopEnabled').checked
            };

            if (this.storageService && this.storageService.saveAudioSession) {
                this.storageService.saveAudioSession(this.currentFileName, session);
                this.loadSavedSessions();
                this.showNotification('Session saved successfully', 'success');
            } else {
                this.showNotification('Storage service not available', 'error');
            }

            // Remove modal
            document.body.removeChild(modalContainer);
        };

        // Handle cancel
        const handleCancel = () => {
            document.body.removeChild(modalContainer);
        };

        // Add event listeners
        document.getElementById('confirmSessionSave').addEventListener('click', handleSave);
        document.getElementById('cancelSessionSave').addEventListener('click', handleCancel);
        document.querySelector('.modal-backdrop').addEventListener('click', handleCancel);

        // Handle Enter key for save
        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSave();
            }
        });

        // Handle Escape key for cancel
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    loadSession(index) {
        if (!this.storageService || !this.currentFileName) return;

        const sessions = this.storageService.getAudioSessions?.(this.currentFileName) || [];
        const session = sessions[index];

        if (!session) return;

        // Apply session settings
        this.setSpeed(session.speed);
        document.getElementById('speedSlider').value = session.speed;

        this.setPitch(session.pitch);
        document.getElementById('pitchSlider').value = session.pitch;

        this.loopStart = session.loopStart;
        this.loopEnd = session.loopEnd;
        document.getElementById('loopStart').textContent =
            session.loopStart !== null ? this.formatTime(session.loopStart) : '--:--';
        document.getElementById('loopEnd').textContent =
            session.loopEnd !== null ? this.formatTime(session.loopEnd) : '--:--';
        document.getElementById('loopEnabled').checked = session.loopEnabled || false;
        this.isLooping = session.loopEnabled || false;

        this.updateLoopRegion();
        this.showNotification('Session loaded', 'success');
    }

    deleteSession(index) {
        if (!confirm('Are you sure you want to delete this session?')) return;

        if (this.storageService && this.storageService.deleteAudioSession && this.currentFileName) {
            this.storageService.deleteAudioSession(this.currentFileName, index);
            this.loadSavedSessions();
            this.showNotification('Session deleted', 'info');
        }
    }

    // Utility methods
    formatTime(seconds) {
        if (isNaN(seconds) || seconds === null) return '--:--';

        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    showNotification(message, type = 'info') {
        // Try to use dashboard's notification system if available
        if (window.app?.currentPage?.showNotification) {
            window.app.currentPage.showNotification(message, type);
        } else {
            // Fallback to console
            console.log(`[${type}] ${message}`);
        }
    }

    // Cleanup method
    destroy() {
        console.log('Destroying audio player...');

        if (this.audio) {
            this.audio.pause();
            this.audio.src = '';
            this.audio = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        if (this.waveformVisualizer) {
            this.waveformVisualizer.destroy?.();
            this.waveformVisualizer = null;
        }

        this.isInitialized = false;
    }
}
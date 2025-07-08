// Audio Player Component - With High-Quality Pitch Shifting using Tone.js
import {WaveformVisualizer} from './waveform.js';

export class AudioPlayer {
    constructor(container, audioService) {
        this.container = container;
        this.audioService = audioService;
        this.storageService = null;
        this.audio = null;
        this.tonePlayer = null;
        this.pitchShift = null;
        this.isInitialized = false;
        this.currentFileName = null;
        this.waveformVisualizer = null;

        // Audio parameters
        this.playbackRate = 1.0;
        this.pitchShiftAmount = 0;
        this.loopStart = null;
        this.loopEnd = null;
        this.isLooping = false;

        // UI state
        this.isPlaying = false;
        this.duration = 0;
        this.currentTime = 0;
    }

    ensureStorageService() {
        if (!this.storageService) {
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
            this.render();
            this.initializeTone();
            this.isInitialized = true;
            console.log('Audio player initialized successfully');
        } catch (error) {
            console.error('Error in audio player init:', error);
            throw error;
        }
    }

    async initializeTone() {
        try {
            // Start Tone.js
            await Tone.start();
            console.log('Tone.js initialized');

            // Create pitch shift effect
            this.pitchShift = new Tone.PitchShift({
                pitch: 0,
                windowSize: 0.1,
                delayTime: 0,
                feedback: 0
            }).toDestination();

            // Create time stretcher for tempo changes without pitch changes
            this.timeStretch = new Tone.GrainPlayer().toDestination();
            this.timeStretch.playbackRate = 1;
            this.timeStretch.overlap = 0.1; // For smoother stretching

            // Set high quality settings
            this.pitchShift.windowSize = 0.1; // Larger window for better quality
            this.pitchShift.wet.value = 1; // 100% wet signal

        } catch (error) {
            console.error('Failed to initialize Tone.js:', error);
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

                    <!-- Saved Sessions -->
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
        document.getElementById('playPauseBtn')?.addEventListener('click', () => this.togglePlayPause());
        document.getElementById('stopBtn')?.addEventListener('click', () => this.stop());

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

        // Volume control
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                document.getElementById('volumeValue').textContent = value + '%';
                if (this.tonePlayer) {
                    this.tonePlayer.volume.value = Tone.gainToDb(value / 100);
                }
            });
        }
    }

    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        console.log('Loading audio file:', file.name);

        try {
            // Stop any current playback
            this.stop();

            // Store filename
            this.currentFileName = file.name;
            document.getElementById('currentFileName').textContent = file.name;

            // Dispose of previous player
            if (this.tonePlayer) {
                this.tonePlayer.stop();
                this.tonePlayer.dispose();
            }

            // Convert file to URL
            const audioUrl = URL.createObjectURL(file);

            // Create Tone.js player
            this.tonePlayer = new Tone.Player({
                url: audioUrl,
                loop: false,
                onload: () => {
                    console.log('Audio loaded in Tone.js');
                    this.duration = this.tonePlayer.buffer.duration;

                    // Connect audio chain: Player -> PitchShift -> Destination
                    this.tonePlayer.connect(this.pitchShift);

                    // Also load the buffer into the time stretcher for tempo changes
                    this.timeStretch.buffer = this.tonePlayer.buffer;

                    // Show controls
                    document.getElementById('audioControlsSection').style.display = 'block';
                    document.getElementById('duration').textContent = this.formatTime(this.duration);
                    document.getElementById('currentTime').textContent = this.formatTime(0);

                    // Initialize waveform
                    this.initializeWaveform(file);

                    // Load saved sessions
                    this.loadSavedSessions();

                    // Set up time update
                    this.setupTimeUpdate();
                }
            });

        } catch (error) {
            console.error('Error loading audio file:', error);
            this.showNotification('Failed to load audio file: ' + error.message, 'error');
            document.getElementById('audioControlsSection').style.display = 'none';
        }
    }

    setupTimeUpdate() {
        // Create a loop to update time display
        const updateTime = () => {
            if (this.tonePlayer && this.tonePlayer.state === 'started') {
                // Calculate elapsed real time since playback started
                const realElapsed = Tone.now() - this.startTime;

                // Apply playback rate to get scaled time + starting offset
                this.currentTime = (realElapsed * this.playbackRate) + (this.startOffset || 0);

                // Handle looping
                if (this.isLooping && this.loopEnd !== null && this.currentTime >= this.loopEnd) {
                    this.startOffset = this.loopStart || 0;
                    this.tonePlayer.stop();
                    this.tonePlayer.playbackRate = 1.0; // Keep at 1.0
                    this.tonePlayer.start(undefined, this.startOffset);
                    this.startTime = Tone.now();
                    this.currentTime = this.startOffset;
                }

                document.getElementById('currentTime').textContent = this.formatTime(this.currentTime);

                // Update waveform progress
                if (this.waveformVisualizer) {
                    this.waveformVisualizer.updateProgress(this.currentTime);
                }
            }

            if (this.isPlaying) {
                requestAnimationFrame(updateTime);
            }
        };

        if (this.isPlaying) {
            updateTime();
        }
    }

    async initializeWaveform(file) {
        const canvas = document.getElementById('waveformCanvas');
        if (!canvas || !this.audioService) return;

        try {
            // Load file into audioService for visualization
            await this.audioService.loadAudioFile(file);

            // Create waveform visualizer
            this.waveformVisualizer = new WaveformVisualizer(canvas, this.audioService);

            // Override audioService methods
            this.audioService.getDuration = () => this.duration;
            this.audioService.getCurrentTime = () => this.currentTime;
            this.audioService.seek = (time) => {
                if (this.tonePlayer) {
                    // Store whether we were playing
                    const wasPlaying = this.isPlaying;

                    // Stop current playback if playing
                    if (this.tonePlayer.state === 'started') {
                        this.tonePlayer.stop();
                    }

                    // Update current time
                    this.currentTime = time;
                    this.startOffset = time;

                    // Update display
                    document.getElementById('currentTime').textContent = this.formatTime(time);

                    // Update waveform progress immediately
                    if (this.waveformVisualizer) {
                        this.waveformVisualizer.updateProgress(time);
                    }

                    // Resume playback if we were playing
                    if (wasPlaying) {
                        this.tonePlayer.playbackRate = 1.0; // Always keep at 1.0
                        this.tonePlayer.start(undefined, time);
                        this.startTime = Tone.now();
                        this.isPlaying = true;

                        // Restart time updates
                        this.setupTimeUpdate();

                        // Restart waveform animation
                        if (this.waveformVisualizer) {
                            this.waveformVisualizer.startAnimation();
                        }
                    }
                }
            };

            setTimeout(() => {
                if (this.waveformVisualizer.resizeCanvas) {
                    this.waveformVisualizer.resizeCanvas();
                }
                if (this.waveformVisualizer.draw) {
                    this.waveformVisualizer.draw();
                }
            }, 100);

            console.log('Waveform visualizer initialized');
        } catch (error) {
            console.error('Error initializing waveform:', error);
        }
    }

    togglePlayPause() {
        if (!this.tonePlayer || !this.tonePlayer.loaded) return;

        if (this.isPlaying) {
            this.tonePlayer.stop();
            this.isPlaying = false;
        } else {
            // Handle loop boundaries
            let startPosition = this.currentTime;
            if (this.isLooping && this.loopStart !== null) {
                if (startPosition < this.loopStart ||
                    (this.loopEnd !== null && startPosition > this.loopEnd)) {
                    startPosition = this.loopStart;
                }
            }

            // For tempo changes without pitch changes, we keep playbackRate at 1.0
            // and handle tempo in our time calculations
            this.tonePlayer.playbackRate = 1.0; // Always keep at normal speed
            this.tonePlayer.start(undefined, startPosition);
            this.startTime = Tone.now();
            this.startOffset = startPosition;
            this.isPlaying = true;

            // Start time updates
            this.setupTimeUpdate();

            // Start timer if sync is enabled
            const timer = window.app?.currentPage?.components?.timer || window.app?.currentPage?.timer;
            if (timer && timer.syncWithAudio && !timer.isRunning) {
                timer.start();
            }

            // Start waveform animation
            if (this.waveformVisualizer) {
                this.waveformVisualizer.startAnimation();
            }
        }

        this.updatePlayPauseButton();
    }

    stop() {
        if (!this.tonePlayer) return;

        this.tonePlayer.stop();
        this.isPlaying = false;

        if (this.isLooping && this.loopStart !== null) {
            this.currentTime = this.loopStart;
        } else {
            this.currentTime = 0;
        }

        this.startOffset = this.currentTime;
        document.getElementById('currentTime').textContent = this.formatTime(this.currentTime);

        this.updatePlayPauseButton();

        // Stop timer if sync is enabled
        const timer = window.app?.currentPage?.components?.timer || window.app?.currentPage?.timer;
        if (timer && timer.syncWithAudio && timer.isRunning) {
            timer.pause();
        }

        // Stop waveform animation
        if (this.waveformVisualizer) {
            this.waveformVisualizer.stopAnimation();
        }
    }

    updatePlayPauseButton() {
        const btn = document.getElementById('playPauseBtn');
        if (btn) {
            btn.innerHTML = this.isPlaying ?
                '<i class="icon">⏸️</i> Pause' :
                '<i class="icon">▶️</i> Play';
        }
    }

    // Loop control methods
    setLoopStart() {
        if (!this.tonePlayer) return;

        this.loopStart = this.currentTime;
        document.getElementById('loopStart').textContent = this.formatTime(this.loopStart);
        this.updateLoopRegion();

        if (this.waveformVisualizer) {
            this.waveformVisualizer.updateLoopMarkers(this.loopStart, this.loopEnd);
        }

        this.showNotification('Loop start set', 'success');
    }

    setLoopEnd() {
        if (!this.tonePlayer) return;

        this.loopEnd = this.currentTime;
        document.getElementById('loopEnd').textContent = this.formatTime(this.loopEnd);
        this.updateLoopRegion();

        if (this.waveformVisualizer) {
            this.waveformVisualizer.updateLoopMarkers(this.loopStart, this.loopEnd);
        }

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

        if (this.waveformVisualizer) {
            this.waveformVisualizer.updateLoopMarkers(null, null);
        }

        this.showNotification('Loop cleared', 'info');
    }

    updateLoopRegion() {
        const loopRegion = document.getElementById('loopRegion');
        if (!loopRegion || !this.duration) return;

        if (this.loopStart !== null && this.loopEnd !== null) {
            const startPercent = (this.loopStart / this.duration) * 100;
            const endPercent = (this.loopEnd / this.duration) * 100;

            loopRegion.style.left = startPercent + '%';
            loopRegion.style.width = (endPercent - startPercent) + '%';
            loopRegion.style.display = 'block';
        } else {
            loopRegion.style.display = 'none';
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
        document.getElementById('speedValue').textContent = speed + '%';

        // If currently playing, restart with new speed calculation
        if (this.isPlaying && this.tonePlayer) {
            const currentPos = this.currentTime;
            this.tonePlayer.stop();

            // Restart playback - ALWAYS keep playbackRate at 1.0
            this.tonePlayer.playbackRate = 1.0;
            this.tonePlayer.start(undefined, currentPos);
            this.startTime = Tone.now();
            this.startOffset = currentPos;

            // Restart time updates with new playback rate
            this.setupTimeUpdate();
        }
    }

    // Pitch control methods
    adjustPitch(change) {
        const newPitch = Math.max(-12, Math.min(12, this.pitchShiftAmount + change));
        this.setPitch(newPitch);
        document.getElementById('pitchSlider').value = newPitch;
    }

    setPitch(pitch) {
        this.pitchShiftAmount = pitch;
        document.getElementById('pitchValue').textContent =
            pitch > 0 ? `+${pitch} semitones` : `${pitch} semitones`;

        // Apply pitch shift using Tone.js
        if (this.pitchShift) {
            this.pitchShift.pitch = pitch;
        }

        // Update transposition button states
        document.querySelectorAll('.trans-btn').forEach(btn => {
            const btnPitch = parseFloat(btn.dataset.pitch);
            btn.classList.toggle('active', btnPitch === pitch);
        });
    }

    // Rest of the methods remain the same...
    formatTime(seconds) {
        if (isNaN(seconds) || seconds === null) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    showNotification(message, type = 'info') {
        if (window.app?.currentPage?.showNotification) {
            window.app.currentPage.showNotification(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }

    // Session management methods remain the same...
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

    loadSession(index) {
        if (!this.storageService || !this.currentFileName) return;

        const sessions = this.storageService.getAudioSessions?.(this.currentFileName) || [];
        const session = sessions[index];

        if (!session) return;

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

    saveCurrentSession() {
        if (!this.currentFileName) {
            this.showNotification('No audio file loaded', 'error');
            return;
        }

        if (!this.ensureStorageService()) {
            this.showNotification('Storage service not available. Please refresh the page.', 'error');
            return;
        }

        let defaultSessionName = this.currentFileName.replace(/\.[^/.]+$/, '');

        if (this.loopStart !== null && this.loopEnd !== null) {
            const startTime = this.formatTime(this.loopStart);
            const endTime = this.formatTime(this.loopEnd);
            defaultSessionName += ` (${startTime} - ${endTime})`;
        }

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

        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHtml;
        document.body.appendChild(modalContainer);

        const nameInput = document.getElementById('sessionNameInput');
        nameInput.focus();
        nameInput.select();

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
                pitch: this.pitchShiftAmount,
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

            document.body.removeChild(modalContainer);
        };

        const handleCancel = () => {
            document.body.removeChild(modalContainer);
        };

        document.getElementById('confirmSessionSave').addEventListener('click', handleSave);
        document.getElementById('cancelSessionSave').addEventListener('click', handleCancel);
        document.querySelector('.modal-backdrop').addEventListener('click', handleCancel);

        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSave();
            }
        });

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    deleteSession(index) {
        if (!confirm('Are you sure you want to delete this session?')) return;

        if (this.storageService && this.storageService.deleteAudioSession && this.currentFileName) {
            this.storageService.deleteAudioSession(this.currentFileName, index);
            this.loadSavedSessions();
            this.showNotification('Session deleted', 'info');
        }
    }

    destroy() {
        console.log('Destroying audio player...');

        if (this.tonePlayer) {
            this.tonePlayer.stop();
            this.tonePlayer.dispose();
            this.tonePlayer = null;
        }

        if (this.pitchShift) {
            this.pitchShift.dispose();
            this.pitchShift = null;
        }

        if (this.waveformVisualizer) {
            this.waveformVisualizer.destroy?.();
            this.waveformVisualizer = null;
        }

        this.isInitialized = false;
    }
}
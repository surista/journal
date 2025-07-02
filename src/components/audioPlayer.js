// Audio Player Component - Complete working version
import { AudioService } from '../services/audioService.js';
import { WaveformVisualizer } from './waveform.js';
import { Metronome } from './metronome.js';
import { throttle, TimeUtils } from '../utils/helpers.js';
import { notificationManager } from '../services/notificationManager.js';

export class AudioPlayer {
    constructor(container, storageService) {
        this.container = container;
        this.storageService = storageService;
        this.audioService = new AudioService();
        this.waveform = null;
        this.metronome = null;
        this.timer = null; // Reference to timer component

        this.currentFileName = null;
        this.loopStartTime = null;
        this.loopEndTime = null;
        this.currentLoopCount = 0;

        this.savedSessions = [];

        // Throttle time display updates for performance
        this.throttledUpdateTime = throttle((time) => {
            this.updateTimeDisplay(time);
        }, 100); // Update at most 10 times per second
    }

    setTimer(timer) {
        this.timer = timer;
    }

    render() {
        this.container.innerHTML = `
            <div class="audio-section">
                <h2 style="text-align: center; margin-bottom: 20px; color: var(--text-secondary);">Audio Practice Tool</h2>

                <div class="audio-upload">
                    <label for="audioFile" class="btn btn-primary" style="cursor: pointer;">
                        🎵 Upload Audio File (MP3, max 20MB)
                        <input type="file" id="audioFile" accept=".mp3,audio/mp3,audio/mpeg" style="display: none;">
                    </label>
                    <div id="audioFileName" style="margin-top: 10px; color: var(--text-secondary);"></div>
                    <div id="audioError" style="margin-top: 10px; color: var(--danger); display: none;"></div>
                </div>

                <div id="practiceSessionsSection" style="display: none;">
                    <div class="saved-sessions-header">
                        <h3>Saved Loop Sessions</h3>
                        <button class="btn btn-danger btn-small" id="clearAllSessionsBtn">Clear All</button>
                    </div>
                    <div id="savedSessionsList" class="saved-sessions-list"></div>
                </div>

                <div id="audioControls" style="display: none;">
                    <audio id="audioPlayer" style="display: none;"></audio>

                    <div class="save-session-controls">
                        <button class="btn btn-success" id="saveSessionBtn">
                            💾 Save This Session
                        </button>
                        <span style="margin-left: 10px; color: var(--text-secondary); font-size: 0.9em;">
                            Save current audio with loop points
                        </span>
                    </div>

                    <div class="audio-waveform">
                        <canvas id="waveform" height="100"></canvas>
                        <div class="loop-markers">
                            <div id="loopStart" class="loop-marker loop-start">A</div>
                            <div id="loopEnd" class="loop-marker loop-end">B</div>
                        </div>
                    </div>

                    <div class="audio-time-display">
                        <span id="currentTime">0:00</span> / <span id="duration">0:00</span>
                    </div>

                    <div class="audio-controls-row">
                        <button class="btn btn-success" id="playBtn">▶️ Play</button>
                        <button class="btn btn-warning" id="pauseBtn" style="display: none;">⏸️ Pause</button>
                        <button class="btn btn-danger" id="stopBtn">⏹️ Stop</button>
                    </div>

                    <div class="loop-controls">
                        <h3>Loop Settings</h3>
                        <div class="loop-buttons">
                            <button class="btn btn-primary" id="setLoopStartBtn">
                                📍 Set Loop Start (A)
                            </button>
                            <button class="btn btn-primary" id="setLoopEndBtn">
                                📍 Set Loop End (B)
                            </button>
                            <button class="btn btn-danger" id="clearLoopBtn">
                                ❌ Clear Loop
                            </button>
                        </div>

                        <div class="loop-info">
                            <div>Loop Start: <span id="loopStartTime">Not set</span></div>
                            <div>Loop End: <span id="loopEndTime">Not set</span></div>
                        </div>

                        <div class="loop-count-control">
                            <label for="loopCount">Number of Loops:</label>
                            <select id="loopCount">
                                <option value="0">Infinite</option>
                                <option value="1">1 time</option>
                                <option value="2">2 times</option>
                                <option value="3">3 times</option>
                                <option value="5">5 times</option>
                                <option value="10">10 times</option>
                                <option value="20">20 times</option>
                            </select>
                            <div style="margin-top: 10px; display: flex; align-items: center; justify-content: center; gap: 15px;">
                                <div>Current Loop: <span id="currentLoop" style="font-weight: bold; color: var(--primary);">0</span></div>
                                <button class="btn btn-primary btn-small" id="resetLoopCounterBtn" title="Reset loop counter">
                                    🔄 Reset
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="speed-control">
                        <label>Playback Speed: <span id="speedValue">100%</span></label>
                        <div class="speed-controls-row">
                            <div class="speed-buttons-left">
                                <button class="btn btn-primary speed-btn" data-speed="-10">-10%</button>
                                <button class="btn btn-primary speed-btn" data-speed="-5">-5%</button>
                                <button class="btn btn-primary speed-btn" data-speed="-1">-1%</button>
                            </div>
                            <div class="speed-buttons-right">
                                <button class="btn btn-primary speed-btn" data-speed="1">+1%</button>
                                <button class="btn btn-primary speed-btn" data-speed="5">+5%</button>
                                <button class="btn btn-primary speed-btn" data-speed="10">+10%</button>
                            </div>
                        </div>
                        <input type="range" id="speedSlider" min="50" max="150" value="100">
                        <div style="margin-top: 15px; text-align: center;">
                            <label style="display: inline-flex; align-items: center; gap: 10px; cursor: pointer;">
                                <input type="checkbox" id="pitchPreserve" checked style="width: 20px; height: 20px; cursor: pointer;">
                                <span>Preserve pitch when changing tempo</span>
                            </label>
                        </div>
                        <button class="btn btn-primary" id="resetSpeedBtn" style="margin-top: 10px;">
                            🔄 Reset to 100%
                        </button>
                    </div>

                    <div class="pitch-control">
                        <label>Pitch Adjustment: <span id="pitchValue">0</span> semitones</label>
                        <div class="pitch-controls-row">
                            <div class="pitch-buttons-left">
                                <button class="btn btn-primary pitch-btn" data-pitch="-1">-1</button>
                                <button class="btn btn-primary pitch-btn" data-pitch="-0.5">-½</button>
                            </div>
                            <div class="pitch-slider-container">
                                <input type="range" id="pitchSlider" min="-12" max="12" value="0" step="0.5">
                                <div class="pitch-markers">
                                    <span class="pitch-marker" style="left: 0%">-12</span>
                                    <span class="pitch-marker" style="left: 25%">-6</span>
                                    <span class="pitch-marker center" style="left: 50%">0</span>
                                    <span class="pitch-marker" style="left: 75%">+6</span>
                                    <span class="pitch-marker" style="left: 100%">+12</span>
                                </div>
                            </div>
                            <div class="pitch-buttons-right">
                                <button class="btn btn-primary pitch-btn" data-pitch="0.5">+½</button>
                                <button class="btn btn-primary pitch-btn" data-pitch="1">+1</button>
                            </div>
                        </div>
                        <button class="btn btn-primary" id="resetPitchBtn" style="margin-top: 10px;">
                            🔄 Reset to Original Pitch
                        </button>
                        <div class="pitch-presets">
                            <label>Common Transpositions:</label>
                            <div class="preset-buttons">
                                <button class="btn btn-small pitch-preset" data-semitones="-5">-5 (P4↓)</button>
                                <button class="btn btn-small pitch-preset" data-semitones="-3">-3 (m3↓)</button>
                                <button class="btn btn-small pitch-preset" data-semitones="-2">-2 (M2↓)</button>
                                <button class="btn btn-small pitch-preset" data-semitones="-1">-1 (m2↓)</button>
                                <button class="btn btn-small pitch-preset" data-semitones="0">Original</button>
                                <button class="btn btn-small pitch-preset" data-semitones="1">+1 (m2↑)</button>
                                <button class="btn btn-small pitch-preset" data-semitones="2">+2 (M2↑)</button>
                                <button class="btn btn-small pitch-preset" data-semitones="3">+3 (m3↑)</button>
                                <button class="btn btn-small pitch-preset" data-semitones="5">+5 (P4↑)</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Metronome Section -->
                <div id="metronomeSection" style="margin-top: 20px;"></div>
            </div>

            <!-- Save Session Modal -->
            <div id="saveSessionModal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Save Loop Session</h3>
                        <button class="modal-close" onclick="this.closest('.modal').style.display='none'">✕</button>
                    </div>
                    <div class="form-group">
                        <label for="sessionName">Session Name</label>
                        <input type="text" id="sessionName" placeholder="e.g., Intro Solo Practice" required>
                    </div>
                    <div class="form-group">
                        <label for="sessionNotes">Notes (optional)</label>
                        <textarea id="sessionNotes" placeholder="What are you working on with this loop?"></textarea>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-primary" onclick="this.closest('.modal').style.display='none'">Cancel</button>
                        <button class="btn btn-success" id="confirmSaveBtn">💾 Save Session</button>
                    </div>
                </div>
            </div>

            <style>
                .btn-warning {
                    background: linear-gradient(135deg, var(--warning) 0%, #d97706 100%);
                    color: white;
                }

                .btn-warning:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(245, 158, 11, 0.3);
                }
            </style>
        `;

        // Initialize metronome
        const metronomeContainer = document.getElementById('metronomeSection');
        if (metronomeContainer) {
            this.metronome = new Metronome(metronomeContainer);
            this.metronome.render();

            // Sync metronome with audio loops
            this.metronome.syncWithAudioLoop(this.audioService);

            // Pass timer reference to metronome
            if (this.timer) {
                this.metronome.setTimer(this.timer);
            }
        }

        this.attachEventListeners();
        this.loadSavedSessions();
    }

    attachEventListeners() {
        // File upload with detailed error handling
        const fileInput = this.container.querySelector('#audioFile');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }

        // Playback controls
        const playBtn = this.container.querySelector('#playBtn');
        const pauseBtn = this.container.querySelector('#pauseBtn');
        const stopBtn = this.container.querySelector('#stopBtn');

        if (playBtn) playBtn.addEventListener('click', () => this.play());
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.pause());
        if (stopBtn) stopBtn.addEventListener('click', () => this.stop());

        // Update time display with throttled updates
        this.audioService.onTimeUpdate = (time) => {
            this.throttledUpdateTime(time);
        };

        // Speed controls
        const speedSlider = this.container.querySelector('#speedSlider');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => this.setSpeed(e.target.value));
        }

        const speedBtns = this.container.querySelectorAll('.speed-btn');
        speedBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const change = parseInt(btn.dataset.speed);
                this.adjustSpeed(change);
            });
        });

        const resetSpeedBtn = this.container.querySelector('#resetSpeedBtn');
        if (resetSpeedBtn) {
            resetSpeedBtn.addEventListener('click', () => this.resetSpeed());
        }

        // Pitch preservation
        const pitchCheckbox = this.container.querySelector('#pitchPreserve');
        if (pitchCheckbox) {
            pitchCheckbox.addEventListener('change', (e) => {
                this.audioService.setUsePitchPreservation(e.target.checked);
            });
        }

        // Pitch controls
        const pitchSlider = this.container.querySelector('#pitchSlider');
        if (pitchSlider) {
            pitchSlider.addEventListener('input', (e) => this.setPitch(parseFloat(e.target.value)));
        }

        const pitchBtns = this.container.querySelectorAll('.pitch-btn');
        pitchBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const change = parseFloat(btn.dataset.pitch);
                this.adjustPitch(change);
            });
        });

        const resetPitchBtn = this.container.querySelector('#resetPitchBtn');
        if (resetPitchBtn) {
            resetPitchBtn.addEventListener('click', () => this.resetPitch());
        }

        const presetBtns = this.container.querySelectorAll('.pitch-preset');
        presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const semitones = parseInt(btn.dataset.semitones);
                this.setPitch(semitones);
                const slider = document.getElementById('pitchSlider');
                if (slider) slider.value = semitones;
            });
        });

        // Loop controls
        const setStartBtn = this.container.querySelector('#setLoopStartBtn');
        const setEndBtn = this.container.querySelector('#setLoopEndBtn');
        const clearLoopBtn = this.container.querySelector('#clearLoopBtn');

        if (setStartBtn) setStartBtn.addEventListener('click', () => this.setLoopPoint('start'));
        if (setEndBtn) setEndBtn.addEventListener('click', () => this.setLoopPoint('end'));
        if (clearLoopBtn) clearLoopBtn.addEventListener('click', () => this.clearLoop());

        // Loop count
        const loopCountSelect = this.container.querySelector('#loopCount');
        if (loopCountSelect) {
            loopCountSelect.addEventListener('change', (e) => {
                this.audioService.setMaxLoops(e.target.value);
            });
        }

        // Save session
        const saveBtn = this.container.querySelector('#saveSessionBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.showSaveSessionModal());
        }

        // Clear all sessions
        const clearAllBtn = this.container.querySelector('#clearAllSessionsBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAllSessions());
        }

        // Confirm save in modal
        const confirmSaveBtn = document.getElementById('confirmSaveBtn');
        if (confirmSaveBtn) {
            confirmSaveBtn.addEventListener('click', () => this.saveSession());
        }

        // Loop counter
        const resetCounterBtn = this.container.querySelector('#resetLoopCounterBtn');
        if (resetCounterBtn) {
            resetCounterBtn.addEventListener('click', () => this.resetLoopCounter());
        }

        // Loop count update - modified to trigger metronome tempo progression
        this.audioService.onLoopCountUpdate = (count) => {
            const loopElement = document.getElementById('currentLoop');
            if (loopElement) {
                loopElement.textContent = count;
            }

            // Trigger metronome tempo progression
            if (this.metronome && count > 0) {
                this.metronome.onLoopComplete();

                // Update audio playback speed if metronome tempo changed
                if (this.metronome.tempoProgression && this.metronome.tempoProgression.enabled) {
                    const speedPercentage = (this.metronome.tempo / this.metronome.originalTempo) * 100;
                    this.setSpeed(speedPercentage);
                }
            }
        };

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isInputFocused()) {
                e.preventDefault();
                if (this.audioService.isPlaying) {
                    this.pause();
                } else {
                    this.play();
                }
            }
        });
    }

    play() {
        try {
            this.audioService.play();

            // Update button visibility
            const playBtn = this.container.querySelector('#playBtn');
            const pauseBtn = this.container.querySelector('#pauseBtn');

            if (playBtn) playBtn.style.display = 'none';
            if (pauseBtn) pauseBtn.style.display = 'inline-flex';

            // Notify timer to start sync
            if (this.timer) {
                this.timer.syncStart('Audio Player');
            }
        } catch (error) {
            console.error('Playback error:', error);
            notificationManager.error('Error during playback');
        }
    }

    pause() {
        try {
            this.audioService.pause();

            // Update button visibility
            const playBtn = this.container.querySelector('#playBtn');
            const pauseBtn = this.container.querySelector('#pauseBtn');

            if (playBtn) playBtn.style.display = 'inline-flex';
            if (pauseBtn) pauseBtn.style.display = 'none';

            // Notify timer to stop sync
            if (this.timer) {
                this.timer.syncStop('Audio Player');
            }
        } catch (error) {
            console.error('Pause error:', error);
        }
    }

    stop() {
        try {
            this.audioService.stop();

            // Update button visibility
            const playBtn = this.container.querySelector('#playBtn');
            const pauseBtn = this.container.querySelector('#pauseBtn');

            if (playBtn) playBtn.style.display = 'inline-flex';
            if (pauseBtn) pauseBtn.style.display = 'none';

            // Notify timer to stop sync
            if (this.timer) {
                this.timer.syncStop('Audio Player');
            }

            // Update time display to show 0:00
            this.updateTimeDisplay(0);
        } catch (error) {
            console.error('Stop error:', error);
        }
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Show/hide error message
        const errorDiv = document.getElementById('audioError');
        const fileNameDisplay = document.getElementById('audioFileName');

        if (errorDiv) errorDiv.style.display = 'none';

        console.log('File selected:', {
            name: file.name,
            type: file.type,
            size: file.size,
            sizeInMB: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
        });

        // Validate file size
        if (file.size > 20 * 1024 * 1024) {
            const error = `File too large! ${(file.size / (1024 * 1024)).toFixed(2)} MB exceeds 20MB limit.`;
            console.error(error);
            if (errorDiv) {
                errorDiv.textContent = error;
                errorDiv.style.display = 'block';
            }
            notificationManager.error(error);
            event.target.value = '';
            return;
        }

        // Validate file type - be more lenient
        const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/x-mp3', 'audio/mp4'];
        const fileExtension = file.name.toLowerCase().split('.').pop();

        if (!validTypes.includes(file.type) && fileExtension !== 'mp3') {
            const error = `Invalid file type: ${file.type}. Please upload an MP3 file.`;
            console.error(error);
            if (errorDiv) {
                errorDiv.textContent = error;
                errorDiv.style.display = 'block';
            }
            notificationManager.error('Please upload an MP3 file.');
            event.target.value = '';
            return;
        }

        this.currentFileName = file.name;
        if (fileNameDisplay) {
            fileNameDisplay.textContent = `Loading: ${file.name}...`;
        }

        try {
            console.log('Loading audio file...');
            await this.audioService.loadAudioFile(file);
            console.log('Audio file loaded successfully');

            if (fileNameDisplay) {
                fileNameDisplay.textContent = `Loaded: ${file.name}`;
            }

            // Show controls
            const controls = this.container.querySelector('#audioControls');
            if (controls) {
                controls.style.display = 'block';
            }

            // Initialize waveform
            const canvas = this.container.querySelector('#waveform');
            if (canvas) {
                if (this.waveform) {
                    this.waveform.destroy();
                }
                this.waveform = new WaveformVisualizer(canvas, this.audioService);
                this.waveform.draw();
            }

            // Update duration
            const duration = this.audioService.getDuration();
            const durationElement = this.container.querySelector('#duration');
            if (durationElement) {
                durationElement.textContent = TimeUtils.formatTime(duration);
            }

            // Clear any existing loops from previous file
            this.clearLoop();

            // Reset playback speed and pitch
            this.resetSpeed();
            this.resetPitch();

            // Reset loop counter
            this.resetLoopCounter();

            // Store original tempo for metronome sync
            if (this.metronome) {
                this.metronome.originalTempo = this.metronome.tempo;
            }

            // Update saved sessions display to reflect new file
            this.renderSavedSessions();

            // Check for saved sessions
            this.checkSavedSessions();

            notificationManager.success('Audio loaded successfully! 🎵');

        } catch (error) {
            console.error('Error loading audio file:', error);
            console.error('Error stack:', error.stack);
            const errorMessage = error.message || 'Unknown error occurred';

            if (errorDiv) {
                errorDiv.textContent = `Error: ${errorMessage}`;
                errorDiv.style.display = 'block';
            }

            if (fileNameDisplay) {
                fileNameDisplay.textContent = 'Error loading file';
            }

            notificationManager.error(`Error loading audio: ${errorMessage}`);

            // Reset file input
            event.target.value = '';
        }
    }

    setLoopPoint(type) {
        const time = this.audioService.setLoopPoint(type);
        if (time !== null) {
            if (type === 'start') {
                this.loopStartTime = time;
                const element = this.container.querySelector('#loopStartTime');
                if (element) element.textContent = TimeUtils.formatTime(time);
            } else {
                this.loopEndTime = time;
                const element = this.container.querySelector('#loopEndTime');
                if (element) element.textContent = TimeUtils.formatTime(time);
            }

            // Update markers on waveform
            if (this.waveform) {
                this.waveform.updateLoopMarkers(this.loopStartTime, this.loopEndTime);
            }

            notificationManager.info(`Loop ${type} set at ${TimeUtils.formatTime(time)}`);
        } else {
            notificationManager.error('Invalid loop point. End must be after start.');
        }
    }

    clearLoop() {
        this.audioService.clearLoop();
        this.loopStartTime = null;
        this.loopEndTime = null;

        const startElement = this.container.querySelector('#loopStartTime');
        const endElement = this.container.querySelector('#loopEndTime');
        const loopElement = this.container.querySelector('#currentLoop');

        if (startElement) startElement.textContent = 'Not set';
        if (endElement) endElement.textContent = 'Not set';
        if (loopElement) loopElement.textContent = '0';

        if (this.waveform) {
            this.waveform.clearLoopMarkers();
        }

        notificationManager.info('Loop cleared');
    }

    showSaveSessionModal() {
        if (!this.currentFileName) {
            notificationManager.error('Please load an audio file first.');
            return;
        }

        const modal = document.getElementById('saveSessionModal');
        const sessionNameInput = document.getElementById('sessionName');
        const sessionNotesInput = document.getElementById('sessionNotes');

        if (!modal || !sessionNameInput || !sessionNotesInput) return;

        // Clear previous values
        sessionNameInput.value = '';
        sessionNotesInput.value = '';

        // Pre-fill with file name
        const baseName = this.currentFileName.replace('.mp3', '');
        if (this.loopStartTime !== null && this.loopEndTime !== null) {
            sessionNameInput.value = `${baseName} - Loop ${TimeUtils.formatTime(this.loopStartTime)} to ${TimeUtils.formatTime(this.loopEndTime)}`;
        } else {
            sessionNameInput.value = `${baseName} - Full Track`;
        }

        modal.style.display = 'block';
        sessionNameInput.focus();
        sessionNameInput.select();
    }

    saveSession() {
        const modal = document.getElementById('saveSessionModal');
        const sessionName = document.getElementById('sessionName').value.trim();
        const sessionNotes = document.getElementById('sessionNotes').value.trim();

        if (!sessionName) {
            notificationManager.error('Please enter a session name.');
            return;
        }

        const session = {
            id: Date.now(),
            name: sessionName,
            fileName: this.currentFileName,
            notes: sessionNotes,
            loopStart: this.loopStartTime,
            loopEnd: this.loopEndTime,
            playbackSpeed: parseFloat(document.getElementById('speedSlider').value) / 100,
            pitchShift: parseFloat(document.getElementById('pitchSlider').value),
            createdAt: new Date().toISOString()
        };

        this.storageService.savePracticeSession(session);
        if (modal) modal.style.display = 'none';

        notificationManager.success('Session saved successfully! 🎉');
        this.loadSavedSessions();
        this.renderSavedSessions();
    }

    loadSavedSessions() {
        this.savedSessions = this.storageService.getPracticeSessions();
        this.renderSavedSessions();
    }

    renderSavedSessions() {
        const sessionsSection = document.getElementById('practiceSessionsSection');
        const sessionsList = document.getElementById('savedSessionsList');

        if (!sessionsSection || !sessionsList) return;

        if (!this.savedSessions || this.savedSessions.length === 0) {
            sessionsSection.style.display = 'none';
            return;
        }

        sessionsSection.style.display = 'block';

        // Show all sessions, but highlight ones for current file
        sessionsList.innerHTML = this.savedSessions.map((session, index) => {
            const date = new Date(session.createdAt);
            const hasLoop = session.loopStart !== null && session.loopEnd !== null;
            const isCurrentFile = this.currentFileName && session.fileName === this.currentFileName;

            // Format pitch display
            let pitchDisplay = '';
            if (session.pitchShift !== undefined && session.pitchShift !== 0) {
                const pitchValue = session.pitchShift > 0 ? `+${session.pitchShift}` : session.pitchShift;
                pitchDisplay = `<span class="pitch-info">🎵 ${pitchValue} semitones</span>`;
            }

            return `
                <div class="saved-session-item ${isCurrentFile ? 'current-file' : 'different-file'}">
                    <div class="session-item-header">
                        <h4>${session.name}</h4>
                        <button class="btn-icon" onclick="window.deleteSession(${session.id})">🗑️</button>
                    </div>
                    <div class="session-item-details">
                        <div class="session-meta">
                            <span class="${isCurrentFile ? 'file-match' : 'file-mismatch'}">📁 ${session.fileName}</span>
                            ${hasLoop ? `<span>🔁 ${TimeUtils.formatTime(session.loopStart)} - ${TimeUtils.formatTime(session.loopEnd)}</span>` : '<span>🎵 Full Track</span>'}
                            <span>⚡ ${Math.round(session.playbackSpeed * 100)}% speed</span>
                            ${pitchDisplay}
                        </div>
                        ${session.notes ? `<div class="session-notes">${session.notes}</div>` : ''}
                        <div class="session-date">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</div>
                    </div>
                    <button class="btn ${isCurrentFile ? 'btn-primary' : 'btn-secondary'} btn-small" 
                            onclick="${isCurrentFile ? `window.loadSession(${session.id})` : `window.showFileNeededMessage('${session.fileName}')`}"
                            ${!isCurrentFile ? 'title="Load the matching audio file first"' : ''}>
                        ${isCurrentFile ? '▶️ Load Session' : '🔒 Different File'}
                    </button>
                </div>
            `;
        }).join('');

        // Expose methods to window
        window.deleteSession = (id) => this.deleteSession(id);
        window.loadSession = (id) => this.loadSessionById(id);
        window.showFileNeededMessage = (fileName) => this.showFileNeededMessage(fileName);
    }

    loadSessionById(sessionId) {
        const session = this.savedSessions.find(s => s.id === sessionId);
        if (!session) return;

        // Check if any file is loaded
        if (!this.currentFileName) {
            notificationManager.error(`Please load the audio file "${session.fileName}" first to use this session.`);
            return;
        }

        // Check if the correct file is loaded
        if (session.fileName !== this.currentFileName) {
            notificationManager.error(`Wrong file loaded! This session requires "${session.fileName}" but you have "${this.currentFileName}" loaded.`);
            return;
        }

        // Clear existing loops first
        this.clearLoop();

        // Set loop points
        if (session.loopStart !== null) {
            this.audioService.loopStart = session.loopStart;
            this.loopStartTime = session.loopStart;
            const element = this.container.querySelector('#loopStartTime');
            if (element) element.textContent = TimeUtils.formatTime(session.loopStart);
        }

        if (session.loopEnd !== null) {
            this.audioService.loopEnd = session.loopEnd;
            this.loopEndTime = session.loopEnd;
            const element = this.container.querySelector('#loopEndTime');
            if (element) element.textContent = TimeUtils.formatTime(session.loopEnd);
        }

        // Update waveform markers
        if (this.waveform) {
            this.waveform.updateLoopMarkers(this.loopStartTime, this.loopEndTime);
        }

        // Set playback speed
        const speedPercent = Math.round(session.playbackSpeed * 100);
        const speedSlider = document.getElementById('speedSlider');
        if (speedSlider) {
            speedSlider.value = speedPercent;
            this.setSpeed(speedPercent);
        }

        // Set pitch if available
        if (session.pitchShift !== undefined) {
            const pitchSlider = document.getElementById('pitchSlider');
            if (pitchSlider) {
                pitchSlider.value = session.pitchShift;
                this.setPitch(session.pitchShift);
            }
        }

        notificationManager.success(`Loaded session: ${session.name}`);
    }

    deleteSession(sessionId) {
        if (confirm('Delete this saved session?')) {
            const sessionIndex = this.savedSessions.findIndex(s => s.id === sessionId);
            if (sessionIndex !== -1) {
                this.storageService.deletePracticeSession(sessionIndex);
                this.loadSavedSessions();
                notificationManager.info('Session deleted');
            }
        }
    }

    clearAllSessions() {
        if (confirm('Delete all saved sessions? This cannot be undone.')) {
            // Clear all sessions
            while (this.savedSessions.length > 0) {
                this.storageService.deletePracticeSession(0);
            }
            this.loadSavedSessions();
            notificationManager.info('All sessions cleared');
        }
    }

    checkSavedSessions() {
        const sessionsForFile = this.savedSessions.filter(s => s.fileName === this.currentFileName);
        if (sessionsForFile.length > 0) {
            notificationManager.info(`Found ${sessionsForFile.length} saved session${sessionsForFile.length > 1 ? 's' : ''} for this file!`);
            this.renderSavedSessions();
        }
    }

    setSpeed(value) {
        const speed = value / 100;
        this.audioService.setPlaybackRate(speed);
        const element = this.container.querySelector('#speedValue');
        if (element) element.textContent = value + '%';
    }

    adjustSpeed(change) {
        const slider = this.container.querySelector('#speedSlider');
        if (slider) {
            const newValue = parseInt(slider.value) + change;
            const clampedValue = Math.max(50, Math.min(150, newValue));
            slider.value = clampedValue;
            this.setSpeed(clampedValue);
        }
    }

    resetSpeed() {
        const slider = this.container.querySelector('#speedSlider');
        if (slider) {
            slider.value = 100;
            this.setSpeed(100);
        }
    }

setPitch(semitones) {
    // Check if the setPitchShift method exists
    if (this.audioService && typeof this.audioService.setPitchShift === 'function') {
        this.audioService.setPitchShift(semitones);
    } else {
        console.warn('setPitchShift method not available in audioService - pitch adjustment will not work until audioService is updated');
        // Store the value for display purposes
        this.currentPitchShift = semitones;
    }

    const element = this.container.querySelector('#pitchValue');
    if (element) {
        element.textContent = semitones > 0 ? `+${semitones}` : semitones;
    }

    // Update preset button styles
    const presetBtns = this.container.querySelectorAll('.pitch-preset');
    presetBtns.forEach(btn => {
        const btnValue = parseInt(btn.dataset.semitones);
        if (btnValue === Math.round(semitones)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

resetPitch() {
    const slider = this.container.querySelector('#pitchSlider');
    if (slider) {
        slider.value = 0;
        this.setPitch(0);
    }

    // Reset the stored value
    this.currentPitchShift = 0;
}

// Also update adjustPitch to be safe
adjustPitch(change) {
    const slider = this.container.querySelector('#pitchSlider');
    if (slider) {
        const newValue = parseFloat(slider.value) + change;
        const clampedValue = Math.max(-12, Math.min(12, newValue));
        slider.value = clampedValue;
        this.setPitch(clampedValue);
    }
}

    updateTimeDisplay(currentTime) {
        const timeElement = this.container.querySelector('#currentTime');
        if (timeElement) {
            timeElement.textContent = TimeUtils.formatTime(currentTime);
        }
    }

    showFileNeededMessage(fileName) {
        notificationManager.error(`Please load "${fileName}" to use this session.`);
    }

    resetLoopCounter() {
        this.currentLoopCount = 0;
        const element = this.container.querySelector('#currentLoop');
        if (element) element.textContent = '0';
        this.audioService.loopCount = 0;

        // Reset metronome tempo progression
        if (this.metronome && this.metronome.tempoProgression) {
            this.metronome.tempoProgression.currentLoopCount = 0;
            this.metronome.updateProgressionStatus();
        }

        notificationManager.info('Loop counter reset');
    }

    isInputFocused() {
        const activeElement = document.activeElement;
        const inputTypes = ['input', 'textarea', 'select'];
        return inputTypes.includes(activeElement.tagName.toLowerCase());
    }

    destroy() {
        // Remove callbacks before cleanup
        if (this.audioService) {
            this.audioService.onTimeUpdate = null;
            this.audioService.onLoopCountUpdate = null;
            this.audioService.cleanup();

            // Make sure timer is notified if audio was playing
            if (this.audioService.isPlaying && this.timer) {
                this.timer.syncStop('Audio Player');
            }
        }

        if (this.waveform) {
            this.waveform.destroy();
        }

        if (this.metronome) {
            this.metronome.destroy();
        }

        // Remove global window methods
        window.deleteSession = null;
        window.loadSession = null;
        window.showFileNeededMessage = null;
    }
}
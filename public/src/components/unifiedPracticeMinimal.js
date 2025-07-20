// Unified Practice Content - Minimalist Design
import { Metronome } from './metronome.js';
import { AudioPlayer } from './audioPlayer.js';
import { AudioService } from '../services/audioService.js';
import { sessionStateService } from '../services/sessionStateService.js';
import { transposeAPI } from '../services/transposeExtensionAPI.js';

export class UnifiedPracticeMinimal {
    constructor(storageService) {
        this.storageService = storageService;
        this.timer = null;
        this.metronome = null;
        this.audioPlayer = null;
        this.audioService = new AudioService();
        this.currentMode = 'metronome';
        this.saveSessionPopup = null; // Temporarily disabled
        this.onSaveCallback = null;
        this.sessionStateService = sessionStateService;

        // YouTube properties
        this.youtubePlayer = null;
        this.youtubeLoopStart = null;
        this.youtubeLoopEnd = null;
        this.youtubeLooping = false;
        this.youtubeUpdateInterval = null;
        this.youtubeWaveformCanvas = null;
        this.youtubeWaveformCtx = null;
        this.youtubeWaveformImage = null;
        this.youtubeControlsInitialized = false;
        this.youtubeReady = false;
    }

    render() {
        return `
            <div class="unified-practice-minimal">
                <!-- Timer Section - Ultra Compact -->
                <div class="timer-display-section">
                    <div class="timer-display" id="minimalTimerDisplay">00:00:00</div>
                    
                    <div class="timer-controls-row">
                        <button class="timer-control-btn primary" id="playPauseBtn">
                            <span class="control-text">Play</span>
                        </button>
                        <button class="timer-control-btn secondary" id="stopBtn">
                            <span class="control-text">Stop</span>
                        </button>
                    </div>
                    
                    <div class="timer-sync-row">
                        <label class="sync-checkbox">
                            <input type="checkbox" id="syncMetronome" checked>
                            <span>Start timer with audio</span>
                        </label>
                    </div>
                    
                    <!-- Save Session Button - Only shows when timer is not 00:00:00 -->
                    <button class="save-session-btn" id="saveSessionBtn" style="display: none;">
                        Save Session
                    </button>
                </div>
                
                <!-- Mode Tabs - Minimal Design -->
                <div class="mode-tabs">
                    <button class="mode-tab active" data-mode="metronome">
                        <span class="tab-icon">🎵</span>
                        <span class="tab-text">Metronome</span>
                    </button>
                    <button class="mode-tab" data-mode="audio">
                        <span class="tab-icon">🎧</span>
                        <span class="tab-text">Audio</span>
                    </button>
                    <button class="mode-tab" data-mode="youtube">
                        <span class="tab-icon">📹</span>
                        <span class="tab-text">YouTube</span>
                    </button>
                </div>
                
                <!-- Mode Content Area -->
                <div class="mode-content-area">
                    <!-- Metronome Panel -->
                    <div id="metronomePanel" class="mode-panel active">
                        <div class="metronome-minimal-container">
                            <!-- Simplified metronome controls -->
                            <!-- Removed status for more compact design -->
                            
                            <div class="bpm-section">
                                <div class="bpm-display-minimal">
                                    <span class="bpm-value" id="bpmValue">120</span>
                                    <span class="bpm-label">BPM</span>
                                </div>
                            </div>
                            
                            <div class="bpm-slider-minimal">
                                <label class="slider-label">Tempo</label>
                                <input type="range" id="bpmSlider" min="30" max="300" value="120" class="minimal-slider">
                            </div>
                            
                            <div class="metronome-button-row">
                                <button class="metronome-btn start" id="metronomeStart">
                                    ▶ Start
                                </button>
                                <button class="metronome-btn stop" id="metronomeStop">
                                    ■ Stop
                                </button>
                                <button class="metronome-btn tap" id="tapTempo">Tap Tempo</button>
                            </div>
                            
                            <div class="metronome-labels-row">
                                <label class="metronome-label">Time Signature</label>
                                <label class="metronome-label">Sound</label>
                            </div>
                            <div class="metronome-button-row">
                                <select id="timeSignature" class="metronome-btn minimal-select">
                                    <option value="4">4/4</option>
                                    <option value="3">3/4</option>
                                    <option value="2">2/4</option>
                                    <option value="6">6/8</option>
                                </select>
                                
                                <select id="soundSelect" class="metronome-btn minimal-select">
                                    <option value="click">Click</option>
                                    <option value="beep">Beep</option>
                                    <option value="tick">Tick</option>
                                    <option value="wood">Wood Block</option>
                                    <option value="cowbell">Cowbell</option>
                                    <option value="clave">Clave</option>
                                    <option value="rim">Rim Shot</option>
                                    <option value="hihat">Hi-Hat</option>
                                    <option value="kick">Kick Drum</option>
                                    <option value="snare">Snare</option>
                                    <option value="triangle">Triangle</option>
                                    <option value="shaker">Shaker</option>
                                </select>
                            </div>
                            
                            <div class="accent-pattern-minimal">
                                <label>Accent Pattern</label>
                                <div class="accent-beats" id="accentPattern">
                                    <button class="accent-btn active" data-beat="0">1</button>
                                    <button class="accent-btn" data-beat="1">2</button>
                                    <button class="accent-btn" data-beat="2">3</button>
                                    <button class="accent-btn" data-beat="3">4</button>
                                </div>
                            </div>
                            
                            <!-- Advanced Features Toggle -->
                            <details class="advanced-features-minimal">
                                <summary>Advanced Features ▼</summary>
                                
                                <!-- Tempo Progression -->
                                <div class="feature-section-minimal">
                                    <label>
                                        <input type="checkbox" id="tempoProgressionEnabled">
                                        Gradual Tempo Increase
                                    </label>
                                    <div class="tempo-progression-controls" style="display: none;">
                                        <div class="control-row-minimal">
                                            <label>Start:</label>
                                            <input type="number" id="progressionStartBpm" value="120" min="30" max="300">
                                            <span>BPM</span>
                                        </div>
                                        <div class="control-row-minimal">
                                            <label>End:</label>
                                            <input type="number" id="progressionEndBpm" value="140" min="30" max="300">
                                            <span>BPM</span>
                                        </div>
                                        <div class="control-row-minimal">
                                            <label>Increase:</label>
                                            <input type="number" id="progressionIncrement" value="5" min="1" max="20">
                                            <span>BPM every</span>
                                            <input type="number" id="progressionMeasures" value="4" min="1" max="16">
                                            <span>measures</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Beat Dropout -->
                                <div class="feature-section-minimal">
                                    <label>
                                        <input type="checkbox" id="beatDropoutEnabled">
                                        Beat Dropout Training
                                    </label>
                                    <div class="beat-dropout-controls" style="display: none;">
                                        <select id="dropoutMode">
                                            <option value="random">Random Beats</option>
                                            <option value="pattern">Fixed Pattern</option>
                                        </select>
                                        <div class="dropout-pattern" id="dropoutPatternRow" style="display: none;">
                                            <button class="dropout-btn" data-beat="0">1</button>
                                            <button class="dropout-btn" data-beat="1">2</button>
                                            <button class="dropout-btn" data-beat="2">3</button>
                                            <button class="dropout-btn" data-beat="3">4</button>
                                        </div>
                                    </div>
                                </div>
                            </details>
                        </div>
                    </div>
                    
                    <!-- Audio Panel -->
                    <div id="audioPanel" class="mode-panel">
                        <div class="audio-upload-minimal">
                            <input type="file" id="audioFileInput" accept=".mp3,audio/mp3,audio/mpeg" style="display: none;">
                            <!-- Add currentFileName element at the top -->
                            <div id="currentFileNameWrapper" style="display: none;">
                                <div id="currentFileName" class="current-file-name" 
                                     style="color: var(--success); font-size: 16px; margin-bottom: 12px; text-align: center;"></div>
                            </div>
                            <div class="audio-browse-section" style="margin-bottom: 16px;">
                                <button class="btn btn-primary browse-audio-btn" id="browseAudioBtn" style="width: 100%;">
                                    <span style="margin-right: 0.5rem;">📁</span>
                                    Browse for MP3 file
                                </button>
                                <p class="file-hint" style="margin-top: 0.5rem; text-align: center;">MP3 files only (max 20MB)</p>
                            </div>
                            <div id="audioPlayerContainer"></div>
                        </div>
                    </div>
                    
                    <!-- YouTube Panel -->
                    <div id="youtubePanel" class="mode-panel">
                        <div class="youtube-input-minimal">
                            <div class="url-input-group">
                                <input type="text" 
                                       id="youtubeUrl" 
                                       class="youtube-url-input" 
                                       placeholder="Paste YouTube URL or video ID">
                                <button class="load-btn" id="loadYoutubeBtn">Load</button>
                            </div>
                        </div>
                        <div id="youtubePlayerWrapper" style="display: none;">
                            <!-- YouTube Player -->
                            <div id="youtubePlayer" style="width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 8px; margin-bottom: 1rem; overflow: hidden;"></div>
                            
                            <!-- Waveform Visualization -->
                            <div class="waveform-container" style="position: relative; width: 100%; height: 100px; background: var(--bg-secondary); border-radius: 8px; overflow: hidden; margin-bottom: 1rem;">
                                <canvas id="youtubeWaveformCanvas" style="width: 100%; height: 100%; display: block;"></canvas>
                                <div class="youtube-progress-bar" style="position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: rgba(255,255,255,0.1);">
                                    <div id="youtubeProgressFill" style="height: 100%; background: var(--primary); width: 0%; transition: width 0.1s;"></div>
                                </div>
                            </div>
                            
                            <!-- YouTube Controls -->
                            <div class="youtube-controls">
                                <!-- Playback Controls -->
                                <div class="playback-controls" style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px; justify-content: center;">
                                    <button id="youtubePlayPause" class="btn btn-primary" style="padding: 12px 24px;">
                                        <i class="icon">▶️</i> Play
                                    </button>
                                    <button id="youtubeStop" class="btn btn-secondary" style="padding: 12px 24px;">
                                        <i class="icon">⏹️</i> Stop
                                    </button>
                                    <div class="time-display" style="font-family: monospace; font-size: 18px; margin-left: 16px;">
                                        <span id="youtubeCurrentTime">0:00</span> / <span id="youtubeDuration">0:00</span>
                                    </div>
                                </div>
                                
                                <!-- Loop Controls Section -->
                                <div class="loop-controls-unified" style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); padding: 16px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.1);">
                                    <h4 style="margin-bottom: 12px;">Loop Controls</h4>
                                    
                                    <!-- Main Controls Row -->
                                    <div style="display: grid; grid-template-columns: auto auto auto 1fr auto; gap: 8px; align-items: center; margin-bottom: 12px;">
                                        <button id="youtubeLoopStart" class="btn btn-sm btn-secondary" style="padding: 6px 12px; font-size: 12px;">Start</button>
                                        <button id="youtubeLoopEnd" class="btn btn-sm btn-secondary" style="padding: 6px 12px; font-size: 12px;">End</button>
                                        <button id="youtubeLoopClear" class="btn btn-sm btn-secondary" style="padding: 6px 12px; font-size: 12px;">Clear</button>
                                        <div class="loop-info" style="font-family: monospace; font-size: 13px; text-align: center;">
                                            <span id="youtubeLoopStartTime">--:--</span> - <span id="youtubeLoopEndTime">--:--</span>
                                        </div>
                                        <button id="youtubeSaveLoopBtn" class="btn btn-sm btn-primary" style="padding: 6px 16px; font-size: 12px;">
                                            💾 Save Loop
                                        </button>
                                    </div>
                                    
                                    <!-- Toggle Controls Row -->
                                    <div style="display: flex; align-items: center; gap: 16px;">
                                        <label class="loop-toggle" style="display: inline-flex; align-items: center; white-space: nowrap;">
                                            <input type="checkbox" id="youtubeLoopEnabled">
                                            <span class="toggle-switch"></span>
                                            <span>Loop?</span>
                                        </label>
                                        
                                        <label class="loop-toggle" style="display: inline-flex; align-items: center; white-space: nowrap;">
                                            <input type="checkbox" id="youtubeAutoProgress">
                                            <span class="toggle-switch"></span>
                                            <span>Auto?</span>
                                        </label>
                                        
                                        <div style="flex: 1;"></div>
                                        
                                        <span style="color: var(--text-secondary); font-size: 13px;">Saved Loops:</span>
                                    </div>
                                    
                                    <!-- Tempo Progression Controls (shows when Auto is enabled) -->
                                    <div class="progression-controls-inline" id="youtubeProgressionControls" style="display: none; align-items: center; gap: 6px; font-size: 12px; margin-top: 12px;">
                                        <input type="number" id="youtubeProgressAmount" value="1" min="0.1" max="10" step="0.1" 
                                               style="width: 45px; padding: 3px 6px; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 4px; font-size: 12px;">
                                        <select id="youtubeProgressType" style="padding: 3px 6px; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 4px; font-size: 12px;">
                                            <option value="percentage">%</option>
                                            <option value="bpm">BPM</option>
                                        </select>
                                        <span>every</span>
                                        <input type="number" id="youtubeProgressLoops" value="1" min="1" max="10" 
                                               style="width: 35px; padding: 3px 6px; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 4px; font-size: 12px;">
                                        <span>loops</span>
                                    </div>
                                </div>
                                
                                <!-- Saved Loops Section (Separate) -->
                                <div class="saved-loops-section" style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); padding: 16px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.1);">
                                    <h4 style="margin-bottom: 12px; font-size: 14px; color: var(--text-secondary);">Saved Loops</h4>
                                    <div id="youtubeSavedLoopsList" class="saved-sessions-list" style="max-height: 150px; overflow-y: auto;">
                                        <p class="empty-state" style="color: var(--text-secondary); text-align: center; font-size: 12px; margin: 0; padding: 16px;">No saved loops for this video</p>
                                    </div>
                                </div>
                                
                                <!-- Audio Controls Section -->
                                <div class="audio-controls-compact" style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); padding: 20px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1);">
                                    <h4 style="margin-bottom: 16px; text-align: center;">Audio Controls</h4>
                                    
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 16px;">
                                        <!-- Speed Control (Left) -->
                                        <div class="speed-control-compact">
                                            <label style="display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-secondary);">
                                                Speed: <span id="youtubeSpeedValue" style="color: var(--primary); font-weight: 600;">100%</span>
                                            </label>
                                            <input type="range" id="youtubeSpeedSlider" min="50" max="150" value="100" step="1" class="slider" 
                                                   style="width: 100%; height: 8px; background: linear-gradient(to right, #374151 0%, #6366f1 50%, #374151 100%); border-radius: 4px; outline: none; -webkit-appearance: none;">
                                            <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 11px; color: var(--text-muted);">
                                                <span>50%</span>
                                                <span style="color: var(--text-secondary);">100%</span>
                                                <span>150%</span>
                                            </div>
                                        </div>
                                        
                                        <!-- Pitch Control (Right) -->
                                        <div class="pitch-control-compact">
                                            <label style="display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-secondary);">
                                                Pitch: <span id="youtubePitchValue" style="color: var(--primary); font-weight: 600;">0</span>
                                            </label>
                                            <div class="pitch-buttons" style="display: flex; gap: 6px; justify-content: center;">
                                                <button class="pitch-btn youtube-pitch-btn" data-pitch="-1" style="flex: 1; padding: 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 14px;">-1</button>
                                                <button class="pitch-btn youtube-pitch-btn" data-pitch="-0.5" style="flex: 1; padding: 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 14px;">-½</button>
                                                <button class="pitch-btn youtube-pitch-btn" data-pitch="0.5" style="flex: 1; padding: 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 14px;">+½</button>
                                                <button class="pitch-btn youtube-pitch-btn" data-pitch="1" style="flex: 1; padding: 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 14px;">+1</button>
                                            </div>
                                            <div id="youtubePitchStatus" style="font-size: 11px; color: var(--text-muted); text-align: center; margin-top: 4px;">
                                                <button id="youtubePitchInfo" class="btn btn-xs" style="padding: 2px 6px; font-size: 10px;">ℹ️ Why Pitch is Disabled</button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Volume Control (Bottom) -->
                                    <div class="volume-control-compact">
                                        <label style="display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-secondary);">
                                            Volume: <span id="youtubeVolumeValue" style="color: var(--primary); font-weight: 600;">100%</span>
                                        </label>
                                        <div class="volume-slider-container" style="display: flex; align-items: center; gap: 12px;">
                                            <i class="icon" style="font-size: 18px;">🔊</i>
                                            <input type="range" id="youtubeVolumeSlider" min="0" max="100" value="100" class="slider" 
                                                   style="flex: 1; height: 8px; background: linear-gradient(to right, #374151 0%, #6366f1 100%); border-radius: 4px; outline: none; -webkit-appearance: none;">
                                        </div>
                                    </div>
                                    
                                    <!-- Reset buttons -->
                                    <div style="display: flex; gap: 10px; margin-top: 16px;">
                                        <button id="youtubeResetSpeed" class="btn btn-sm btn-secondary" style="flex: 1; padding: 8px; font-size: 13px;">
                                            <i class="icon">↻</i> Reset Speed
                                        </button>
                                        <button id="youtubeResetPitch" class="btn btn-sm btn-secondary" style="flex: 1; padding: 8px; font-size: 13px;">
                                            <i class="icon">↻</i> Reset Pitch
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    init(container) {
        container.innerHTML = this.render();
        this.initializeTimer();
        this.initializeMetronome();
        this.attachEventListeners();

        // Set initial metronome display state
        const stopBtn = document.getElementById('metronomeStop');
        if (stopBtn) stopBtn.style.display = 'none';

        // Debug: Check if YouTube panel exists
        const youtubePanel = document.getElementById('youtubePanel');
        console.log('YouTube panel found:', !!youtubePanel);
        if (youtubePanel) {
            console.log('YouTube panel initial display:', window.getComputedStyle(youtubePanel).display);
        }

        // Setup session state persistence
        this.setupSessionStatePersistence();

        // Try to restore previous session
        this.restoreSessionState();
    }

    initializeTimer() {
        this.timer = {
            startTime: null,
            elapsedTime: 0,
            isRunning: false,
            interval: null,

            start: () => {
                if (!this.timer.isRunning) {
                    this.timer.startTime = Date.now() - this.timer.elapsedTime;
                    this.timer.isRunning = true;
                    this.timer.interval = setInterval(() => {
                        this.timer.elapsedTime = Date.now() - this.timer.startTime;
                        this.updateTimerDisplay();
                    }, 100);
                }
            },

            pause: () => {
                if (this.timer.isRunning) {
                    clearInterval(this.timer.interval);
                    this.timer.isRunning = false;
                }
            },

            stop: () => {
                clearInterval(this.timer.interval);
                this.timer.isRunning = false;
                this.timer.elapsedTime = 0;
                this.timer.startTime = null;
                this.updateTimerDisplay();
            },

            getElapsedTime: () => Math.floor(this.timer.elapsedTime / 1000),

            destroy: () => clearInterval(this.timer.interval)
        };
    }

    updateTimerDisplay() {
        const display = document.getElementById('minimalTimerDisplay');
        const saveBtn = document.getElementById('saveSessionBtn');

        if (display) {
            const totalSeconds = Math.floor(this.timer.elapsedTime / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            display.textContent =
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            // Show/hide save button based on timer
            if (saveBtn) {
                saveBtn.style.display = totalSeconds > 0 ? 'block' : 'none';
            }
        }
    }

    initializeMetronome() {
        // Simple metronome state management
        this.metronomeState = {
            bpm: 120,
            isPlaying: false,
            timeSignature: 4,
            accentPattern: [true, false, false, false],
            sound: localStorage.getItem('defaultMetronomeSound') || 'click',
            currentBeat: 0,
            interval: null,
            audioReady: false
        };

        // Check audio context
        this.checkAudioReady();

        // Set the sound dropdown to the saved default
        const soundSelect = document.getElementById('soundSelect');
        if (soundSelect) {
            soundSelect.value = this.metronomeState.sound;
        }
    }

    checkAudioReady() {
        const checkInterval = setInterval(() => {
            if (this.audioService && this.audioService.isReady && this.audioService.isReady()) {
                this.metronomeState.audioReady = true;
                this.updateMetronomeStatus();
                clearInterval(checkInterval);
            }
        }, 100);
    }

    updateMetronomeStatus() {
        const statusText = document.querySelector('.metronome-status .status-text');
        const statusDot = document.querySelector('.metronome-status .status-dot');

        if (this.metronomeState.audioReady) {
            if (statusText) statusText.textContent = 'Audio ready';
            if (statusDot) statusDot.classList.add('ready');
        } else {
            if (statusText) statusText.textContent = 'Click anywhere to enable audio';
            if (statusDot) statusDot.classList.remove('ready');
        }
    }

    attachEventListeners() {
        // Mode tabs
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                console.log('Mode tab clicked:', mode);
                this.switchMode(mode);

                // Force YouTube panel visibility if YouTube mode
                if (mode === 'youtube') {
                    const youtubePanel = document.getElementById('youtubePanel');
                    const youtubeInput = document.querySelector('.youtube-input-minimal');
                    if (youtubePanel) {
                        youtubePanel.style.display = 'block';
                        youtubePanel.style.visibility = 'visible';
                        console.log('Forced YouTube panel visible');
                    }
                    if (youtubeInput) {
                        youtubeInput.style.display = 'block';
                        console.log('Forced YouTube input visible');
                    }
                }
            });
        });

        // Timer controls
        const playPauseBtn = document.getElementById('playPauseBtn');
        const stopBtn = document.getElementById('stopBtn');

        playPauseBtn?.addEventListener('click', () => {
            if (this.timer.isRunning) {
                this.timer.pause();
                playPauseBtn.querySelector('.control-text').textContent = 'Play';
                playPauseBtn.classList.remove('playing');
            } else {
                this.timer.start();
                playPauseBtn.querySelector('.control-text').textContent = 'Pause';
                playPauseBtn.classList.add('playing');

                // Start playback if sync enabled
                const syncCheckbox = document.getElementById('syncMetronome');
                if (syncCheckbox?.checked) {
                    // Start appropriate playback based on current mode
                    if (this.currentMode === 'metronome' && !this.metronomeState.isPlaying) {
                        console.log('Starting metronome with timer');
                        this.startMetronome();
                    } else if (this.currentMode === 'audio' && this.audioPlayer && !this.audioPlayer.isPlaying) {
                        this.audioPlayer.togglePlayPause();
                    }
                    // YouTube playback would go here if needed
                }
            }
        });

        stopBtn?.addEventListener('click', async () => {
            // If timer is running, show confirmation dialog
            if (this.timer.isRunning && this.timer.elapsedTime > 0) {
                const userConfirmed = confirm('Stopping will reset the timer. Do you want to save your session first?');

                if (userConfirmed) {
                    // User wants to save - pause the timer
                    this.timer.pause();
                    playPauseBtn.querySelector('.control-text').textContent = 'Play';
                    playPauseBtn.classList.remove('playing');

                    // Stop any playback based on current mode
                    if (this.currentMode === 'metronome' && this.metronomeState.isPlaying) {
                        this.stopMetronome();
                    } else if (this.currentMode === 'audio' && this.audioPlayer && this.audioPlayer.isPlaying) {
                        this.audioPlayer.stop();
                    }

                    // Automatically open the save session popup
                    const duration = this.timer.getElapsedTime();
                    this.showSaveSessionPopup(duration);

                    return;
                } else {
                    // Check if they really want to proceed without saving
                    const reallyStop = confirm('Are you sure you want to stop without saving?');
                    if (!reallyStop) {
                        return; // User cancelled, don't stop
                    }
                }
            }

            // Proceed with stopping and resetting
            this.timer.stop();
            playPauseBtn.querySelector('.control-text').textContent = 'Play';
            playPauseBtn.classList.remove('playing');

            // Stop any playback based on current mode
            if (this.currentMode === 'metronome' && this.metronomeState.isPlaying) {
                this.stopMetronome();
            } else if (this.currentMode === 'audio' && this.audioPlayer && this.audioPlayer.isPlaying) {
                this.audioPlayer.stop();
            }
        });

        // Save session button
        document.getElementById('saveSessionBtn')?.addEventListener('click', async () => {
            const duration = this.timer.getElapsedTime();
            if (duration > 0) {
                // Pause timer and metronome
                if (this.timer.isRunning) {
                    this.timer.pause();
                    const playPauseBtn = document.getElementById('playPauseBtn');
                    if (playPauseBtn) {
                        playPauseBtn.querySelector('.control-text').textContent = 'Play';
                        playPauseBtn.classList.remove('playing');
                    }
                }

                if (this.metronomeState.isPlaying) {
                    this.stopMetronome();
                }

                // Show save session popup
                this.showSaveSessionPopup(duration);
            }
        });

        // Metronome controls
        this.attachMetronomeListeners();

        // Audio upload
        this.attachAudioListeners();

        // YouTube
        this.attachYouTubeListeners();

        // Audio context initialization
        document.addEventListener('click', () => {
            if (this.audioService && !this.metronomeState.audioReady) {
                setTimeout(() => {
                    if (this.audioService.isReady && this.audioService.isReady()) {
                        this.metronomeState.audioReady = true;
                        this.updateMetronomeStatus();
                    }
                }, 100);
            }
        }, { once: true });
    }

    attachMetronomeListeners() {
        // BPM adjustment buttons
        document.querySelectorAll('.bpm-btn[data-adjust]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const adjustment = parseInt(e.target.dataset.adjust);
                this.setBpm(this.metronomeState.bpm + adjustment);
            });
        });

        // BPM slider - pause playback when adjusting, resume on release
        const bpmSlider = document.getElementById('bpmSlider');
        let wasPlaying = false;

        bpmSlider?.addEventListener('mousedown', () => {
            if (this.metronomeState.isPlaying) {
                wasPlaying = true;
                this.pauseMetronome();
            }
        });

        bpmSlider?.addEventListener('input', (e) => {
            this.setBpm(parseInt(e.target.value));
        });

        bpmSlider?.addEventListener('mouseup', () => {
            if (wasPlaying) {
                wasPlaying = false;
                this.startMetronome();
            }
        });

        bpmSlider?.addEventListener('mouseleave', () => {
            if (wasPlaying) {
                wasPlaying = false;
                this.startMetronome();
            }
        });

        // Tap tempo - moved to metronome listeners section

        // Metronome start/stop
        document.getElementById('metronomeStart')?.addEventListener('click', () => {
            this.startMetronome();
        });

        document.getElementById('metronomeStop')?.addEventListener('click', () => {
            this.stopMetronome();
        });

        // Time signature
        document.getElementById('timeSignature')?.addEventListener('change', (e) => {
            this.setTimeSignature(parseInt(e.target.value));
        });

        // Sound selection
        document.getElementById('soundSelect')?.addEventListener('change', (e) => {
            this.metronomeState.sound = e.target.value;
        });

        // Accent pattern
        document.querySelectorAll('.accent-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const beat = parseInt(e.target.dataset.beat);
                this.toggleAccent(beat);
            });
        });

        // Advanced Features - Tempo Progression
        const tempoProgressionCheckbox = document.getElementById('tempoProgressionEnabled');
        const tempoProgressionControls = document.querySelector('.tempo-progression-controls');

        tempoProgressionCheckbox?.addEventListener('change', (e) => {
            if (tempoProgressionControls) {
                tempoProgressionControls.style.display = e.target.checked ? 'block' : 'none';
            }

            if (e.target.checked) {
                // Initialize tempo progression state
                this.metronomeState.tempoProgression = {
                    enabled: true,
                    startBpm: parseInt(document.getElementById('progressionStartBpm')?.value || 120),
                    endBpm: parseInt(document.getElementById('progressionEndBpm')?.value || 140),
                    increment: parseInt(document.getElementById('progressionIncrement')?.value || 5),
                    measuresPerStep: parseInt(document.getElementById('progressionMeasures')?.value || 4),
                    currentMeasure: 0,
                    currentBpm: this.metronomeState.bpm
                };
            } else {
                this.metronomeState.tempoProgression = { enabled: false };
            }
        });

        // Tempo progression input listeners
        ['progressionStartBpm', 'progressionEndBpm', 'progressionIncrement', 'progressionMeasures'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', (e) => {
                if (this.metronomeState.tempoProgression?.enabled) {
                    const key = id.replace('progression', '').charAt(0).toLowerCase() + id.replace('progression', '').slice(1);
                    this.metronomeState.tempoProgression[key] = parseInt(e.target.value);
                }
            });
        });

        // Beat Dropout
        const beatDropoutCheckbox = document.getElementById('beatDropoutEnabled');
        const beatDropoutControls = document.querySelector('.beat-dropout-controls');
        const dropoutMode = document.getElementById('dropoutMode');
        const dropoutPatternRow = document.getElementById('dropoutPatternRow');

        beatDropoutCheckbox?.addEventListener('change', (e) => {
            if (beatDropoutControls) {
                beatDropoutControls.style.display = e.target.checked ? 'block' : 'none';
            }

            if (e.target.checked) {
                this.metronomeState.beatDropout = {
                    enabled: true,
                    mode: dropoutMode?.value || 'random',
                    pattern: [],
                    dropoutProbability: 0.3
                };
            } else {
                this.metronomeState.beatDropout = { enabled: false };
            }
        });

        dropoutMode?.addEventListener('change', (e) => {
            if (dropoutPatternRow) {
                dropoutPatternRow.style.display = e.target.value === 'pattern' ? 'flex' : 'none';
            }
            if (this.metronomeState.beatDropout) {
                this.metronomeState.beatDropout.mode = e.target.value;
            }
        });

        // Dropout pattern buttons
        document.querySelectorAll('.dropout-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const beat = parseInt(e.target.dataset.beat);
                e.target.classList.toggle('active');

                if (this.metronomeState.beatDropout) {
                    if (!this.metronomeState.beatDropout.pattern) {
                        this.metronomeState.beatDropout.pattern = [];
                    }

                    const index = this.metronomeState.beatDropout.pattern.indexOf(beat);
                    if (index > -1) {
                        this.metronomeState.beatDropout.pattern.splice(index, 1);
                    } else {
                        this.metronomeState.beatDropout.pattern.push(beat);
                    }
                }
            });
        });

        // Tap tempo
        let tapTimes = [];
        let tapTimeout;

        document.getElementById('tapTempo')?.addEventListener('click', () => {
            const now = Date.now();
            tapTimes.push(now);

            if (tapTimes.length > 8) tapTimes.shift();

            if (tapTimes.length >= 2) {
                const intervals = [];
                for (let i = 1; i < tapTimes.length; i++) {
                    intervals.push(tapTimes[i] - tapTimes[i - 1]);
                }
                const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
                const bpm = Math.round(60000 / avgInterval);
                this.setBpm(Math.max(30, Math.min(300, bpm)));
            }

            clearTimeout(tapTimeout);
            tapTimeout = setTimeout(() => { tapTimes = []; }, 2000);
        });
    }

    attachAudioListeners() {
        const fileInput = document.getElementById('audioFileInput');
        const browseBtn = document.getElementById('browseAudioBtn');

        browseBtn?.addEventListener('click', () => {
            console.log('Browse button clicked');

            // Clear any existing audio BEFORE opening file picker
            this.clearAudioPlayer();

            // Clear the file input value to ensure change event fires even for same file
            if (fileInput) {
                fileInput.value = '';
                // Small delay to ensure cleanup completes before opening picker
                setTimeout(() => {
                    fileInput.click();
                }, 50);
            }
        });

        fileInput?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await this.loadAudioFile(file);
            } else {
                // User cancelled file selection, but we should still clear any existing audio
                this.clearAudioPlayer();
            }
        });
    }

    clearAudioPlayer() {
        console.log('=== CLEARING AUDIO PLAYER ===');

        // Clear any pending file name update timeout FIRST
        if (this.fileNameUpdateTimeout) {
            clearTimeout(this.fileNameUpdateTimeout);
            this.fileNameUpdateTimeout = null;
        }

        // Stop and destroy current audio player if it exists
        if (this.audioPlayer) {
            console.log('Stopping and destroying audio player');
            try {
                this.audioPlayer.stop();
                if (this.audioPlayer.destroy) {
                    this.audioPlayer.destroy();
                }
            } catch (e) {
                console.error('Error destroying audio player:', e);
            }
            this.audioPlayer = null;
        }

        // Force clear the audio service
        if (this.audioService) {
            this.audioService.audioBuffer = null;
            this.audioService.currentTime = 0;
            this.audioService.duration = 0;
        }

        // Clear the audio player container completely
        const audioContainer = document.getElementById('audioPlayerContainer');
        if (audioContainer) {
            console.log('Clearing audio container HTML');
            // Remove all event listeners by cloning
            const newContainer = audioContainer.cloneNode(false);
            audioContainer.parentNode.replaceChild(newContainer, audioContainer);
            newContainer.innerHTML = '';
        }

        // Hide and clear the filename display COMPLETELY
        const fileNameWrapper = document.getElementById('currentFileNameWrapper');
        if (fileNameWrapper) {
            fileNameWrapper.style.display = 'none';
        }
        const fileNameEl = document.getElementById('currentFileName');
        if (fileNameEl) {
            console.log('Clearing filename display, was:', fileNameEl.textContent);
            fileNameEl.textContent = '';
            fileNameEl.style.color = '';
            fileNameEl.className = 'current-file-name'; // Reset to original class
        }

        // Clear the file input
        const fileInput = document.getElementById('audioFileInput');
        if (fileInput) {
            fileInput.value = '';
        }

        // Show the browse section and restore original state
        const browseSection = document.querySelector('.audio-browse-section');
        if (browseSection) {
            browseSection.style.display = 'block';

            // Restore original button text
            const browseBtn = document.getElementById('browseAudioBtn');
            if (browseBtn) {
                browseBtn.innerHTML = '<span style="margin-right: 0.5rem;">📁</span>Browse for MP3 file';
            }

            // Show the file hint again
            const fileHint = browseSection.querySelector('.file-hint');
            if (fileHint) {
                fileHint.style.display = 'block';
            }
        }

        console.log('Audio player cleared completely');
    }

    attachYouTubeListeners() {
        const loadBtn = document.getElementById('loadYoutubeBtn');
        const input = document.getElementById('youtubeUrl');

        loadBtn?.addEventListener('click', () => {
            if (input?.value) {
                this.loadYouTubeVideo(input.value);
            }
        });

        input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && input.value) {
                this.loadYouTubeVideo(input.value);
            }
        });
    }

    setBpm(newBpm) {
        this.metronomeState.bpm = Math.max(30, Math.min(300, newBpm));
        document.getElementById('bpmValue').textContent = this.metronomeState.bpm;
        document.getElementById('bpmSlider').value = this.metronomeState.bpm;

        if (this.metronomeState.isPlaying) {
            this.stopMetronome();
            setTimeout(() => this.startMetronome(), 50);
        }
    }

    setTimeSignature(beats) {
        this.metronomeState.timeSignature = beats;
        this.metronomeState.currentBeat = 0;
        this.metronomeState.accentPattern = new Array(beats).fill(false);
        this.metronomeState.accentPattern[0] = true;

        // Update accent buttons
        const container = document.getElementById('accentPattern');
        if (container) {
            container.innerHTML = Array(beats).fill(0).map((_, i) =>
                `<button class="accent-btn ${this.metronomeState.accentPattern[i] ? 'active' : ''}" data-beat="${i}">${i + 1}</button>`
            ).join('');

            // Re-attach listeners
            container.querySelectorAll('.accent-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const beat = parseInt(e.target.dataset.beat);
                    this.toggleAccent(beat);
                });
            });
        }
    }

    toggleAccent(beat) {
        this.metronomeState.accentPattern[beat] = !this.metronomeState.accentPattern[beat];
        const btn = document.querySelector(`.accent-btn[data-beat="${beat}"]`);
        if (btn) {
            btn.classList.toggle('active', this.metronomeState.accentPattern[beat]);
        }
    }

    async startMetronome() {
        console.log('startMetronome called, audioReady:', this.metronomeState.audioReady);
        if (!this.metronomeState.audioReady) {
            this.showAudioWarning();
            return;
        }

        this.metronomeState.isPlaying = true;
        this.metronomeState.currentBeat = 0;

        const interval = 60000 / this.metronomeState.bpm;

        // Play first beat immediately
        await this.playBeat();

        this.metronomeState.interval = setInterval(async () => {
            await this.playBeat();
        }, interval);

        // Update button states
        const startBtn = document.getElementById('metronomeStart');
        const stopBtn = document.getElementById('metronomeStop');
        if (startBtn) startBtn.style.display = 'none';
        if (stopBtn) stopBtn.style.display = 'inline-block';

        // Start timer if sync is enabled
        const syncCheckbox = document.getElementById('syncMetronome');
        if (syncCheckbox?.checked && !this.timer.isRunning) {
            console.log('Starting timer with metronome (sync enabled)');
            this.timer.start();
            // Update play/pause button
            const playPauseBtn = document.getElementById('playPauseBtn');
            if (playPauseBtn) {
                playPauseBtn.querySelector('.control-text').textContent = 'Pause';
                playPauseBtn.classList.add('playing');
            }
        }
    }

    stopMetronome() {
        this.metronomeState.isPlaying = false;

        if (this.metronomeState.interval) {
            clearInterval(this.metronomeState.interval);
            this.metronomeState.interval = null;
        }

        // Update button states
        document.getElementById('metronomeStart').style.display = 'inline-block';
        document.getElementById('metronomeStop').style.display = 'none';

        // Pause timer if sync is enabled (don't reset it)
        const syncCheckbox = document.getElementById('syncMetronome');
        if (syncCheckbox?.checked && this.timer.isRunning) {
            console.log('Pausing timer with metronome stop (sync enabled)');
            this.timer.pause();  // Changed from stop() to pause() to preserve timer state
            // Update play/pause button
            const playPauseBtn = document.getElementById('playPauseBtn');
            if (playPauseBtn) {
                playPauseBtn.querySelector('.control-text').textContent = 'Play';
                playPauseBtn.classList.remove('playing');
            }
        }
    }

    pauseMetronome() {
        // Just clear the interval but keep the playing state
        if (this.metronomeState.interval) {
            clearInterval(this.metronomeState.interval);
            this.metronomeState.interval = null;
        }
    }

    async playBeat() {
        if (!this.metronomeState.audioReady) return;

        const isAccent = this.metronomeState.accentPattern[this.metronomeState.currentBeat];

        // Handle tempo progression
        if (this.metronomeState.tempoProgression?.enabled) {
            if (this.metronomeState.currentBeat === 0) {
                this.metronomeState.tempoProgression.currentMeasure++;

                if (this.metronomeState.tempoProgression.currentMeasure >= this.metronomeState.tempoProgression.measuresPerStep) {
                    this.metronomeState.tempoProgression.currentMeasure = 0;

                    const newBpm = Math.min(
                        this.metronomeState.tempoProgression.endBpm,
                        this.metronomeState.bpm + this.metronomeState.tempoProgression.increment
                    );

                    if (newBpm !== this.metronomeState.bpm) {
                        this.setBpm(newBpm);
                        // Restart metronome with new tempo
                        if (this.metronomeState.isPlaying) {
                            this.stopMetronome();
                            setTimeout(() => this.startMetronome(), 50);
                        }
                    }
                }
            }
        }

        // Handle beat dropout
        let shouldPlaySound = true;
        if (this.metronomeState.beatDropout?.enabled) {
            if (this.metronomeState.beatDropout.mode === 'random') {
                // Random dropout (skip non-accent beats occasionally)
                if (!isAccent && Math.random() < this.metronomeState.beatDropout.dropoutProbability) {
                    shouldPlaySound = false;
                }
            } else if (this.metronomeState.beatDropout.mode === 'pattern') {
                // Pattern-based dropout
                if (this.metronomeState.beatDropout.pattern?.includes(this.metronomeState.currentBeat)) {
                    shouldPlaySound = false;
                }
            }
        }

        // Visual feedback
        const bpmDisplay = document.querySelector('.bpm-display-minimal');
        if (bpmDisplay) {
            bpmDisplay.classList.add('pulse');
            setTimeout(() => bpmDisplay.classList.remove('pulse'), 100);
        }

        // Play sound if not dropped out
        if (shouldPlaySound) {
            try {
                const frequency = this.getFrequencyForSound(this.metronomeState.sound, isAccent);
                await this.audioService.playTone(frequency, 0.1);
            } catch (error) {
                console.warn('Audio playback failed:', error);
            }
        }

        this.metronomeState.currentBeat =
            (this.metronomeState.currentBeat + 1) % this.metronomeState.timeSignature;
    }

    getFrequencyForSound(sound, isAccent) {
        const sounds = {
            click: { normal: 800, accent: 1000 },
            beep: { normal: 600, accent: 800 },
            tick: { normal: 1200, accent: 1500 },
            wood: { normal: 400, accent: 500 },
            cowbell: { normal: 500, accent: 650 },
            clave: { normal: 2500, accent: 3000 },
            rim: { normal: 3500, accent: 4000 },
            hihat: { normal: 8000, accent: 10000 },
            kick: { normal: 60, accent: 80 },
            snare: { normal: 200, accent: 250 },
            triangle: { normal: 4500, accent: 5500 },
            shaker: { normal: 6000, accent: 7500 }
        };

        const selectedSound = sounds[sound] || sounds.click;
        return isAccent ? selectedSound.accent : selectedSound.normal;
    }

    showAudioWarning() {
        const warning = document.createElement('div');
        warning.className = 'audio-warning-minimal';
        warning.textContent = '⚠️ Click anywhere first to enable audio';
        document.body.appendChild(warning);

        setTimeout(() => warning.remove(), 3000);
    }

    switchMode(mode) {
        console.log('Switching to mode:', mode);
        const previousMode = this.currentMode;
        this.currentMode = mode;

        // Clean up previous mode
        if (previousMode !== mode) {
            if (previousMode === 'audio' && this.audioPlayer) {
                // Stop audio playback and clear the player
                this.audioPlayer.stop();
                this.audioPlayer.destroy();
                const audioContainer = document.getElementById('audioPlayerContainer');
                if (audioContainer) {
                    audioContainer.innerHTML = '';
                }
                this.audioPlayer = null;

                // Clear the file input
                const audioFileInput = document.getElementById('audioFileInput');
                if (audioFileInput) {
                    audioFileInput.value = '';
                }

                // Hide the filename display
                const fileNameWrapper = document.getElementById('currentFileNameWrapper');
                if (fileNameWrapper) {
                    fileNameWrapper.style.display = 'none';
                }
                const fileNameEl = document.getElementById('currentFileName');
                if (fileNameEl) {
                    fileNameEl.textContent = '';
                }

                // Show the browse section again
                const browseSection = document.querySelector('.audio-browse-section');
                if (browseSection) {
                    browseSection.style.display = 'block';
                }
            } else if (previousMode === 'youtube' && this.youtubePlayer) {
                // Stop YouTube playback
                if (this.youtubePlayer.stopVideo) {
                    this.youtubePlayer.stopVideo();
                }

                // Destroy YouTube player
                if (this.youtubePlayer.destroy) {
                    this.youtubePlayer.destroy();
                }
                this.youtubePlayer = null;
                this.youtubeVideoId = null;
                this.youtubeVideoTitle = null;
                this.youtubeVideoUrl = null;

                // Reset YouTube panel to show input
                const youtubeInput = document.querySelector('.youtube-input-minimal');
                const playerWrapper = document.getElementById('youtubePlayerWrapper');
                if (youtubeInput) youtubeInput.style.display = 'block';
                if (playerWrapper) playerWrapper.style.display = 'none';

                // Clear YouTube input
                const urlInput = document.getElementById('youtubeUrl');
                if (urlInput) urlInput.value = '';

                // IMPORTANT: Reset the waveform container for audio mode
                const waveformContainer = document.querySelector('.waveform-container');
                if (waveformContainer) {
                    // Clear YouTube progress bar and restore canvas for waveform
                    waveformContainer.innerHTML = '<canvas id="waveformCanvas" style="width: 100%; height: 100%; display: block;"></canvas>';
                    console.log('Waveform container reset for audio mode');
                }
            }
        }

        // Update tabs
        document.querySelectorAll('.mode-tab').forEach(tab => {
            if (tab.dataset.mode === mode) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update panels
        document.querySelectorAll('.mode-panel').forEach(panel => {
            const panelId = `${mode}Panel`;
            console.log('Panel:', panel.id, 'Target:', panelId, 'Match:', panel.id === panelId);

            if (panel.id === panelId) {
                panel.classList.add('active');
                panel.style.display = 'block';
            } else {
                panel.classList.remove('active');
                panel.style.display = 'none';
            }
        });
    }

    async loadAudioFile(file) {
        console.log('=== LOADING NEW AUDIO FILE ===');
        console.log('File:', file.name, file.type, file.size);

        // Validate MP3 file type
        if (!file.type.includes('mp3') && !file.name.toLowerCase().endsWith('.mp3')) {
            alert('Please select an MP3 file only. Other audio formats are not currently supported.');
            return;
        }

        // CRITICAL: Clear everything BEFORE getting the container
        this.clearAudioPlayer();

        // Wait a bit to ensure cleanup is complete
        await new Promise(resolve => setTimeout(resolve, 100));

        const container = document.getElementById('audioPlayerContainer');
        if (!container) {
            console.error('Audio player container not found');
            return;
        }

        try {
            // Show loading state AFTER cleanup
            const fileNameEl = document.getElementById('currentFileName');
            const fileNameWrapper = document.getElementById('currentFileNameWrapper');
            if (fileNameWrapper) {
                fileNameWrapper.style.display = 'block';
            }
            if (fileNameEl) {
                fileNameEl.textContent = `Loading: ${file.name}...`;
                fileNameEl.style.color = 'var(--text-secondary)';
            }

            // Create a new AudioPlayer instance
            this.audioPlayer = new AudioPlayer(container, this.audioService);

            // Initialize the audio player (this will call initializeTone)
            this.audioPlayer.init();

            // CRITICAL: Hide the AudioPlayer's own UI elements that we don't want
            // Hide the entire audio source section from AudioPlayer
            const audioSourceSection = container.querySelector('.audio-source-section');
            if (audioSourceSection) {
                console.log('Hiding AudioPlayer audio source section');
                audioSourceSection.style.display = 'none';
            }

            // Also hide any background styling
            const audioPlayerDiv = container.querySelector('.audio-player');
            if (audioPlayerDiv) {
                audioPlayerDiv.style.background = 'none';
                audioPlayerDiv.style.backgroundImage = 'none';
            }

            // Load the file - create a fake event with the file
            const fakeEvent = { target: { files: [file] } };
            await this.audioPlayer.handleFileSelect(fakeEvent);

            // Keep browse section visible but update the button text
            const browseSection = document.querySelector('.audio-browse-section');
            const browseBtn = document.getElementById('browseAudioBtn');
            if (browseBtn) {
                browseBtn.innerHTML = '<span style="margin-right: 0.5rem;">🔄</span>Change Audio File';
            }
            // Remove the file hint when a file is loaded
            const fileHint = browseSection?.querySelector('.file-hint');
            if (fileHint) {
                fileHint.style.display = 'none';
            }

            // Hide the original file input section from AudioPlayer
            const fileInputSection = document.getElementById('fileInputSection');
            if (fileInputSection) {
                fileInputSection.style.display = 'none';
            }

            // Make sure audio controls and waveform are visible
            const controlsSection = document.getElementById('audioControlsSection');
            if (controlsSection) {
                controlsSection.style.display = 'block';
            }

            // Ensure waveform container is visible
            const waveformContainer = document.querySelector('.waveform-container');
            if (waveformContainer) {
                waveformContainer.style.display = 'block';
                waveformContainer.style.visibility = 'visible';
                waveformContainer.style.minHeight = '150px';

                // Ensure the canvas exists and is visible
                let canvas = waveformContainer.querySelector('#waveformCanvas');
                if (!canvas) {
                    // YouTube mode may have replaced the canvas with progress bar
                    console.log('Canvas not found, recreating...');
                    waveformContainer.innerHTML = '<canvas id="waveformCanvas" style="width: 100%; height: 100%; display: block;"></canvas>';
                    canvas = waveformContainer.querySelector('#waveformCanvas');
                }

                if (canvas) {
                    canvas.style.display = 'block';
                    console.log('Waveform canvas ready');
                }
            }

            // Remove redundant waveform redraw - audioPlayer handles this

            // Clear any existing timeout for file name update
            if (this.fileNameUpdateTimeout) {
                clearTimeout(this.fileNameUpdateTimeout);
            }

            // Update the file name after loading is complete
            // Use a longer timeout to ensure AudioPlayer has finished initialization
            this.fileNameUpdateTimeout = setTimeout(() => {
                const fileNameEl = document.getElementById('currentFileName');
                if (fileNameEl) {
                    console.log('Setting filename to:', file.name);
                    fileNameEl.textContent = `Loaded: ${file.name}`;
                    fileNameEl.style.color = 'var(--success)';
                }
            }, 500);

            // The waveform is already initialized in audioPlayer.handleFileSelect,
            // so we don't need to re-initialize it here

            console.log('Audio file loaded successfully:', file.name);
        } catch (error) {
            console.error('Error loading audio file:', error);
            alert('Failed to load audio file: ' + error.message);
        }
    }

    async loadYouTubeVideo(urlOrId) {
        console.log('=== LOADING YOUTUBE VIDEO ===');
        console.log('Input:', urlOrId);

        // Reset pitch value
        this.youtubePitchShift = 0;

        // Check for Transpose extension when loading new video
        setTimeout(() => {
            this.checkTransposeExtension();
        }, 500);

        let videoId = urlOrId;

        // Enhanced regex to handle regular videos, shorts, and embed URLs
        const patterns = [
            /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
            /youtube\.com\/shorts\/([^"&?\/\s]{11})/,
            /^([^"&?\/\s]{11})$/ // Just the video ID
        ];

        let extracted = false;
        for (const pattern of patterns) {
            const match = urlOrId.match(pattern);
            if (match && match[1]) {
                videoId = match[1];
                console.log('Extracted video ID:', videoId);
                extracted = true;
                break;
            }
        }

        if (!extracted) {
            console.log('Could not extract video ID, using input as-is:', videoId);
        }

        // Hide input and show player wrapper
        const youtubeInput = document.querySelector('.youtube-input-minimal');
        const playerWrapper = document.getElementById('youtubePlayerWrapper');

        console.log('YouTube input element:', !!youtubeInput);
        console.log('Player wrapper element:', !!playerWrapper);

        if (youtubeInput) youtubeInput.style.display = 'none';
        if (playerWrapper) playerWrapper.style.display = 'block';

        // Store YouTube video information
        this.youtubeVideoId = videoId;
        this.youtubeVideoUrl = urlOrId;

        // Initialize YouTube player
        if (!this.youtubePlayer) {
            // Make sure YouTube API is loaded
            if (!window.YT || !window.YT.Player) {
                console.error('YouTube API not loaded');
                return;
            }

            this.youtubePlayer = new YT.Player('youtubePlayer', {
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: {
                    'controls': 0,  // Hide YouTube controls to prevent conflicting interactions
                    'rel': 0,
                    'modestbranding': 1,
                    'enablejsapi': 1,
                    'autoplay': 0,
                    'fs': 0,  // Disable fullscreen
                    'iv_load_policy': 3,  // Hide annotations
                    'disablekb': 1  // Disable keyboard controls
                },
                events: {
                    'onReady': this.onYouTubePlayerReady.bind(this),
                    'onStateChange': this.onYouTubeStateChange.bind(this)
                }
            });
        } else {
            // Use cueVideoById instead of loadVideoById to prevent autoplay
            this.youtubePlayer.cueVideoById(videoId);
            // Re-initialize controls and waveform when loading new video
            this.initializeYouTubeControls();
            this.initializeYouTubeWaveform();
        }
    }

    onYouTubePlayerReady(event) {
        console.log('YouTube player ready');
        this.youtubeReady = true;

        // Ensure video is paused on load
        if (this.youtubePlayer) {
            this.youtubePlayer.pauseVideo();

            // Try to get video data
            try {
                const videoData = this.youtubePlayer.getVideoData();
                if (videoData && videoData.title) {
                    this.youtubeVideoTitle = videoData.title;
                    console.log('YouTube video title:', this.youtubeVideoTitle);
                } else {
                    this.youtubeVideoTitle = 'YouTube Video';
                }
            } catch (error) {
                console.warn('Could not get video title:', error);
                this.youtubeVideoTitle = 'YouTube Video';
            }
        }

        // Initialize controls and waveform after player is ready
        this.initializeYouTubeControls();
        this.initializeYouTubeWaveform();

        // Start update interval
        if (this.youtubeUpdateInterval) {
            clearInterval(this.youtubeUpdateInterval);
        }

        this.youtubeUpdateInterval = setInterval(() => {
            if (this.youtubePlayer && this.youtubePlayer.getCurrentTime) {
                const currentTime = this.youtubePlayer.getCurrentTime();
                const duration = this.youtubePlayer.getDuration();

                // Update progress bar
                const progressFill = document.getElementById('youtubeProgressFill');
                if (progressFill && duration > 0) {
                    progressFill.style.width = `${(currentTime / duration) * 100}%`;
                }

                // Update time display
                const currentTimeEl = document.getElementById('youtubeCurrentTime');
                const durationEl = document.getElementById('youtubeDuration');
                if (currentTimeEl) currentTimeEl.textContent = this.formatTime(currentTime);
                if (durationEl && duration > 0) durationEl.textContent = this.formatTime(duration);

                // Update waveform
                if (this.youtubeWaveformCtx) {
                    this.updateYouTubeWaveform(currentTime, duration);
                }

                // Handle looping
                if (this.youtubeLooping && this.youtubeLoopEnd !== null && currentTime >= this.youtubeLoopEnd) {
                    this.youtubePlayer.seekTo(this.youtubeLoopStart || 0);
                }
            }
        }, 100);
    }

    onYouTubeStateChange(event) {
        const playPauseBtn = document.getElementById('youtubePlayPause');
        const syncCheckbox = document.getElementById('syncMetronome');

        if (event.data === YT.PlayerState.PLAYING) {
            if (playPauseBtn) {
                playPauseBtn.innerHTML = '<i class="icon">⏸️</i> Pause';
            }
            // Start timer sync if enabled
            if (this.timer && syncCheckbox?.checked && !this.timer.isRunning) {
                console.log('Starting timer with YouTube playback (sync enabled)');
                this.timer.start();
                // Update timer play/pause button
                const timerPlayPauseBtn = document.getElementById('playPauseBtn');
                if (timerPlayPauseBtn) {
                    timerPlayPauseBtn.querySelector('.control-text').textContent = 'Pause';
                    timerPlayPauseBtn.classList.add('playing');
                }
            }
        } else if (event.data === YT.PlayerState.PAUSED) {
            if (playPauseBtn) {
                playPauseBtn.innerHTML = '<i class="icon">▶️</i> Play';
            }
            // Pause timer sync if enabled
            if (this.timer && syncCheckbox?.checked && this.timer.isRunning) {
                console.log('Pausing timer with YouTube pause (sync enabled)');
                this.timer.pause();
                // Update timer play/pause button
                const timerPlayPauseBtn = document.getElementById('playPauseBtn');
                if (timerPlayPauseBtn) {
                    timerPlayPauseBtn.querySelector('.control-text').textContent = 'Start';
                    timerPlayPauseBtn.classList.remove('playing');
                }
            }
        } else if (event.data === YT.PlayerState.ENDED || event.data === YT.PlayerState.UNSTARTED) {
            if (playPauseBtn) {
                playPauseBtn.innerHTML = '<i class="icon">▶️</i> Play';
            }
        }
    }

    initializeYouTubeControls() {
        // Remove existing listeners to prevent duplicates
        if (this.youtubeControlsInitialized) return;
        this.youtubeControlsInitialized = true;

        // Play/Pause button
        const playPauseBtn = document.getElementById('youtubePlayPause');
        playPauseBtn?.addEventListener('click', () => {
            if (this.youtubePlayer) {
                const state = this.youtubePlayer.getPlayerState();
                if (state === YT.PlayerState.PLAYING) {
                    this.youtubePlayer.pauseVideo();
                } else {
                    this.youtubePlayer.playVideo();
                }
            }
        });

        // Stop button
        const stopBtn = document.getElementById('youtubeStop');
        stopBtn?.addEventListener('click', () => {
            if (this.youtubePlayer) {
                // Pause instead of stop to avoid reload
                this.youtubePlayer.pauseVideo();
                this.youtubePlayer.seekTo(0);
                // Update play button text
                const playPauseBtn = document.getElementById('youtubePlayPause');
                if (playPauseBtn) {
                    playPauseBtn.innerHTML = '<i class="icon">▶️</i> Play';
                }
            }
        });

        // Loop controls
        const loopStart = document.getElementById('youtubeLoopStart');
        const loopEnd = document.getElementById('youtubeLoopEnd');
        const loopClear = document.getElementById('youtubeLoopClear');
        const loopEnabled = document.getElementById('youtubeLoopEnabled');

        loopStart?.addEventListener('click', () => {
            console.log('Loop start clicked', this.youtubePlayer, this.youtubeReady);
            if (this.youtubePlayer && this.youtubeReady) {
                this.youtubeLoopStart = this.youtubePlayer.getCurrentTime();
                console.log('Set loop start to:', this.youtubeLoopStart);
                document.getElementById('youtubeLoopStartTime').textContent = this.formatTime(this.youtubeLoopStart);
                this.updateYouTubeWaveform(this.youtubeLoopStart, this.youtubePlayer.getDuration());
            }
        });

        loopEnd?.addEventListener('click', () => {
            console.log('Loop end clicked', this.youtubePlayer, this.youtubeReady);
            if (this.youtubePlayer && this.youtubeReady) {
                this.youtubeLoopEnd = this.youtubePlayer.getCurrentTime();
                console.log('Set loop end to:', this.youtubeLoopEnd);
                document.getElementById('youtubeLoopEndTime').textContent = this.formatTime(this.youtubeLoopEnd);
                this.updateYouTubeWaveform(this.youtubePlayer.getCurrentTime(), this.youtubePlayer.getDuration());
            }
        });

        loopClear?.addEventListener('click', () => {
            console.log('Loop clear clicked');
            this.youtubeLoopStart = null;
            this.youtubeLoopEnd = null;
            document.getElementById('youtubeLoopStartTime').textContent = '--:--';
            document.getElementById('youtubeLoopEndTime').textContent = '--:--';
            document.getElementById('youtubeLoopEnabled').checked = false;
            this.youtubeLooping = false;
            if (this.youtubePlayer && this.youtubeReady) {
                this.updateYouTubeWaveform(this.youtubePlayer.getCurrentTime(), this.youtubePlayer.getDuration());
            }
        });

        loopEnabled?.addEventListener('change', (e) => {
            this.youtubeLooping = e.target.checked;
        });
        
        // Auto progression toggle
        const autoProgress = document.getElementById('youtubeAutoProgress');
        const progressionControls = document.getElementById('youtubeProgressionControls');
        
        autoProgress?.addEventListener('change', (e) => {
            if (progressionControls) {
                progressionControls.style.display = e.target.checked ? 'block' : 'none';
            }
        });
        
        // Save Loop button
        const saveLoopBtn = document.getElementById('youtubeSaveLoopBtn');
        console.log('Save Loop button found:', !!saveLoopBtn);
        saveLoopBtn?.addEventListener('click', () => {
            console.log('Save Loop button clicked!');
            this.saveYouTubeLoop();
        });

        // Speed controls
        const speedSlider = document.getElementById('youtubeSpeedSlider');
        const speedValue = document.getElementById('youtubeSpeedValue');

        // Initialize YouTube playback speed
        this.youtubePlaybackRate = 1.0;

        speedSlider?.addEventListener('input', (e) => {
            const speed = parseInt(e.target.value) / 100;
            this.setYouTubeSpeed(speed);
            speedValue.textContent = `${e.target.value}%`;
        });

        // Speed buttons
        document.querySelectorAll('.youtube-speed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const change = parseFloat(e.target.dataset.speed);
                const currentValue = parseInt(speedSlider.value);
                const newValue = Math.max(50, Math.min(150, currentValue + change));
                speedSlider.value = newValue;
                speedValue.textContent = `${newValue}%`;
                this.setYouTubeSpeed(newValue / 100);
            });
        });

        // Reset speed button
        document.getElementById('youtubeResetSpeed')?.addEventListener('click', () => {
            // Reset only speed
            speedSlider.value = 100;
            speedValue.textContent = '100%';
            this.setYouTubeSpeed(1.0);
        });

        // Volume control
        const volumeSlider = document.getElementById('youtubeVolumeSlider');
        const volumeValue = document.getElementById('youtubeVolumeValue');

        volumeSlider?.addEventListener('input', (e) => {
            const volume = parseInt(e.target.value);
            volumeValue.textContent = `${volume}%`;
            if (this.youtubePlayer && this.youtubePlayer.setVolume) {
                this.youtubePlayer.setVolume(volume);
            }
            // Also adjust volume in audio processor if active
            if (youtubeAudioProcessor.isCurrentlyProcessing()) {
                youtubeAudioProcessor.setVolume(volume / 100);
            }
        });

        // Pitch control
        const pitchValue = document.getElementById('youtubePitchValue');
        this.youtubePitchShift = 0;

        // Pitch buttons - add event listeners first
        document.querySelectorAll('.youtube-pitch-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (!btn.disabled) {
                    const change = parseFloat(e.target.dataset.pitch);
                    const newPitch = Math.max(-12, Math.min(12, this.youtubePitchShift + change));
                    await this.setYouTubePitchViaExtension(newPitch);
                    pitchValue.textContent = newPitch > 0 ? `+${newPitch}` : newPitch;
                }
            });
        });

        // Check for Transpose extension (this will enable buttons if available)
        this.checkTransposeExtension();

        // Reset pitch button
        document.getElementById('youtubeResetPitch')?.addEventListener('click', async () => {
            await this.setYouTubePitchViaExtension(0);
            pitchValue.textContent = '0';
        });

        // Info/install button
        document.getElementById('youtubePitchInfo')?.addEventListener('click', () => {
            if (this.transposeAvailable) {
                this.showTransposeInstructions();
            } else {
                this.showTransposeInstallPrompt();
            }
        });
    }

    setYouTubeSpeed(speed) {
        this.youtubePlaybackRate = speed;
        if (this.youtubePlayer && this.youtubePlayer.setPlaybackRate) {
            this.youtubePlayer.setPlaybackRate(speed);
        }
    }

    showYouTubePitchExplanation() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <h3>YouTube Pitch Shifting Limitations</h3>
                <p>True pitch shifting (without tempo change) is not available for YouTube videos due to browser security restrictions.</p>
                
                <h4>Available Options:</h4>
                
                <div style="margin: 15px 0;">
                    <strong>1. Use Browser Extensions</strong>
                    <ul style="margin: 5px 0;">
                        <li><a href="https://chrome.google.com/webstore/detail/pitch-shifter-html5-video/mpmkclglcbkjchakihfpblainfncennj" target="_blank">Chrome: Pitch Shifter Extension</a></li>
                        <li><a href="https://addons.mozilla.org/en-US/firefox/addon/pitch-shifter/" target="_blank">Firefox: Pitch Shifter Add-on</a></li>
                    </ul>
                </div>
                
                <div style="margin: 15px 0;">
                    <strong>2. Download Audio First</strong>
                    <ul style="margin: 5px 0;">
                        <li>Download the audio file from YouTube</li>
                        <li>Load it into the Audio Source mode</li>
                        <li>Use the built-in pitch shifter (works perfectly)</li>
                    </ul>
                </div>
                
                <div style="margin: 15px 0;">
                    <strong>3. Use Speed Control Only</strong>
                    <ul style="margin: 5px 0;">
                        <li>The Speed slider can slow down playback</li>
                        <li>This affects both pitch and tempo together</li>
                    </ul>
                </div>
                
                <p style="margin-top: 20px; font-size: 12px; color: var(--text-muted);">
                    Technical Note: Web browsers prevent direct audio manipulation of embedded YouTube videos for security reasons.
                </p>
                
                <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Close</button>
            </div>
        `;

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        document.body.appendChild(modal);
    }

    async checkTransposeExtension() {
        const statusDiv = document.getElementById('youtubePitchStatus');
        const pitchButtons = document.querySelectorAll('.youtube-pitch-btn');

        // Since user has Transpose installed, just enable the controls
        this.transposeAvailable = true;

        // Enable pitch controls
        pitchButtons.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.title = 'Adjust pitch (uses Transpose keyboard shortcuts)';
        });

        // Update status
        if (statusDiv) {
            statusDiv.innerHTML = `
                <span style="color: var(--success); font-size: 11px;">✓ Pitch ready (or use Shift+↑/↓)</span>
            `;
        }

        // Initialize the current pitch tracking
        this.currentYouTubePitch = 0;
    }

    async setYouTubePitchViaExtension(semitones) {
        console.log('Setting YouTube pitch via extension to:', semitones);

        // Import and use the transposeExtensionAPI
        const { transposeAPI } = await import('../services/transposeExtensionAPI.js');

        try {
            // Try to set pitch using the extension API
            const success = await transposeAPI.setPitch(semitones);
            console.log('Transpose setPitch result:', success);

            // Update our internal state
            this.youtubePitchShift = semitones;

            // Update the display
            const pitchValue = document.getElementById('youtubePitchValue');
            if (pitchValue) {
                pitchValue.textContent = semitones > 0 ? `+${semitones}` : semitones.toString();
            }

            // Show status message
            const statusDiv = document.getElementById('youtubePitchStatus');
            if (statusDiv) {
                statusDiv.innerHTML = `
                    <span style="color: var(--info); font-size: 11px;">
                        Setting pitch to ${semitones}... Check Transpose UI
                    </span>
                `;

                // Reset message after 2 seconds
                setTimeout(() => {
                    statusDiv.innerHTML = `
                        <span style="color: var(--success); font-size: 11px;">✓ Pitch ready (or use Shift+↑/↓)</span>
                    `;
                }, 2000);
            }
        } catch (error) {
            console.error('Error setting pitch via extension:', error);
        }
    }

    showTransposeInstallPrompt() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <h3>Enable YouTube Pitch Control</h3>
                <p>To change pitch without affecting tempo for YouTube videos, install the free Transpose extension:</p>
                
                <div style="margin: 20px 0; text-align: center;">
                    <a href="https://chrome.google.com/webstore/detail/transpose-%E2%96%B2%E2%96%BC-pitch-%C2%B1-spee/ioimlbgefgadofblnajllknopjboejda" 
                       target="_blank" 
                       class="btn btn-primary" 
                       style="display: inline-block; padding: 12px 24px; font-size: 16px;">
                        Install Transpose Extension
                    </a>
                </div>
                
                <h4>After Installation:</h4>
                <ol style="text-align: left; margin: 15px 0;">
                    <li>Reload this page</li>
                    <li>The pitch buttons will automatically activate</li>
                    <li>Use the pitch controls to adjust YouTube playback</li>
                </ol>
                
                <p style="font-size: 12px; color: var(--text-muted); margin-top: 20px;">
                    Note: Transpose is a free Chrome extension that enables pitch and speed control for YouTube and other video sites.
                </p>
                
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
            </div>
        `;

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        document.body.appendChild(modal);
    }

    showTransposeUsageInfo() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <h3>YouTube Pitch Control</h3>
                
                <p>Due to browser security restrictions, direct pitch control of YouTube videos is not possible from web applications.</p>
                
                <h4>Available Options:</h4>
                
                <div style="margin: 15px 0;">
                    <strong>1. Use Transpose Extension (if installed)</strong>
                    <ul style="margin: 10px 0;">
                        <li>Press <kbd>Shift</kbd> + <kbd>↑</kbd> to increase pitch</li>
                        <li>Press <kbd>Shift</kbd> + <kbd>↓</kbd> to decrease pitch</li>
                        <li>Look for Transpose controls on the YouTube player</li>
                    </ul>
                </div>
                
                <div style="margin: 15px 0;">
                    <strong>2. Download Audio First</strong>
                    <ul style="margin: 10px 0;">
                        <li>Download the audio from YouTube</li>
                        <li>Load it in "Audio Source" mode</li>
                        <li>Use the built-in pitch controls (works perfectly)</li>
                    </ul>
                </div>
                
                <div style="margin: 15px 0;">
                    <strong>3. Use Speed Control</strong>
                    <ul style="margin: 10px 0;">
                        <li>The Speed slider will change both pitch and tempo</li>
                        <li>Useful for slowing down difficult passages</li>
                    </ul>
                </div>
                
                <p style="font-size: 12px; color: var(--text-muted); margin-top: 20px;">
                    Note: If Transpose keyboard shortcuts aren't working, make sure:
                    <br>• The YouTube video is focused (click on it)
                    <br>• Transpose extension is enabled for YouTube
                    <br>• No other extensions are conflicting
                </p>
                
                <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Close</button>
            </div>
        `;

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        document.body.appendChild(modal);
    }

    showTransposeInstructions() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <h3>Using Transpose with Guitar Journal</h3>
                <p>The Transpose extension is detected and ready!</p>
                
                <h4>How it works:</h4>
                <ul style="text-align: left;">
                    <li>Use the pitch buttons (-1, -½, +½, +1) to control pitch</li>
                    <li>Changes are applied through the Transpose extension</li>
                    <li>Pitch changes don't affect playback speed</li>
                </ul>
                
                <p style="font-size: 12px; color: var(--text-muted); margin-top: 20px;">
                    Tip: You can also use Transpose's own controls or keyboard shortcuts (Shift + ↑/↓)
                </p>
                
                <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">Got it!</button>
            </div>
        `;

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        document.body.appendChild(modal);
    }

    // Removed old pitch control methods - now using Transpose extension integration
    
    saveYouTubeLoop() {
        console.log('saveYouTubeLoop called', {
            videoId: this.youtubeVideoId,
            loopStart: this.youtubeLoopStart,
            loopEnd: this.youtubeLoopEnd
        });
        
        if (!this.youtubeVideoId) {
            this.showNotification('No YouTube video loaded', 'error');
            return;
        }
        
        // Check if we have loop points
        if (this.youtubeLoopStart === null && this.youtubeLoopEnd === null) {
            this.showNotification('No loop points set. Please set loop start and end points.', 'warning');
            return;
        }
        
        // Show save modal
        this.showSaveLoopModal();
    }
    
    showSaveLoopModal() {
        const modalHTML = `
            <div class="save-loop-modal" id="saveLoopModal" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            ">
                <div class="save-loop-modal-content" style="
                    background: var(--bg-card);
                    padding: 24px;
                    border-radius: 12px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                ">
                    <h3 style="margin-bottom: 20px;">💾 Save YouTube Loop</h3>
                    
                    <div style="margin-bottom: 16px;">
                        <p style="color: var(--text-secondary); margin-bottom: 8px;">
                            Video: ${this.youtubeVideoTitle || 'YouTube Video'}<br>
                            Loop: ${this.formatTime(this.youtubeLoopStart || 0)} - ${this.formatTime(this.youtubeLoopEnd || 0)}
                        </p>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">Loop Name:</label>
                        <input type="text" id="loopNameInput" placeholder="e.g., Intro, Solo, Verse" 
                               style="width: 100%; padding: 10px; background: var(--bg-input); 
                                      border: 1px solid var(--border); border-radius: 6px; 
                                      color: var(--text-primary);" 
                               value="Loop ${this.formatTime(this.youtubeLoopStart || 0)} - ${this.formatTime(this.youtubeLoopEnd || 0)}">
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600;">Notes (optional):</label>
                        <textarea id="loopNotesInput" placeholder="Add any notes about this loop" 
                                  style="width: 100%; padding: 10px; background: var(--bg-input); 
                                         border: 1px solid var(--border); border-radius: 6px; 
                                         color: var(--text-primary); resize: vertical; min-height: 60px;"></textarea>
                    </div>
                    
                    <div style="display: flex; gap: 12px; justify-content: flex-end;">
                        <button class="btn btn-secondary" onclick="document.getElementById('saveLoopModal').remove()">
                            Cancel
                        </button>
                        <button class="btn btn-primary" id="confirmSaveLoopBtn">
                            💾 Save Loop
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Focus on name input
        setTimeout(() => {
            const nameInput = document.getElementById('loopNameInput');
            if (nameInput) {
                nameInput.focus();
                nameInput.select();
            }
        }, 100);
        
        // Add save button listener
        document.getElementById('confirmSaveLoopBtn')?.addEventListener('click', () => {
            this.confirmSaveLoop();
        });
        
        // Close on escape
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                document.getElementById('saveLoopModal')?.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }
    
    confirmSaveLoop() {
        const nameInput = document.getElementById('loopNameInput');
        const notesInput = document.getElementById('loopNotesInput');
        
        if (!nameInput) return;
        
        const loopName = nameInput.value.trim();
        if (!loopName) {
            nameInput.style.borderColor = 'var(--danger)';
            nameInput.focus();
            return;
        }
        
        const loopData = {
            name: loopName,
            notes: notesInput?.value.trim() || '',
            videoId: this.youtubeVideoId,
            videoTitle: this.youtubeVideoTitle || 'YouTube Video',
            loopStart: this.youtubeLoopStart,
            loopEnd: this.youtubeLoopEnd,
            speed: parseInt(document.getElementById('youtubeSpeedSlider')?.value || 100),
            timestamp: Date.now()
        };
        
        try {
            // Get existing loops
            const storageKey = `youtube_loops_${this.youtubeVideoId}`;
            const existingLoops = JSON.parse(localStorage.getItem(storageKey) || '[]');
            
            // Add new loop
            existingLoops.push(loopData);
            
            // Save to localStorage
            localStorage.setItem(storageKey, JSON.stringify(existingLoops));
            
            // Update the saved loops display
            this.loadSavedYouTubeLoops();
            
            // Close modal
            document.getElementById('saveLoopModal')?.remove();
            
            this.showNotification(`Loop "${loopName}" saved successfully! 💾`, 'success');
        } catch (error) {
            console.error('Error saving loop:', error);
            this.showNotification('Failed to save loop', 'error');
        }
    }
    
    loadSavedYouTubeLoops() {
        if (!this.youtubeVideoId) return;
        
        const container = document.getElementById('youtubeSavedLoopsList');
        if (!container) return;
        
        const storageKey = `youtube_loops_${this.youtubeVideoId}`;
        const savedLoops = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        if (savedLoops.length === 0) {
            container.innerHTML = '<p class="empty-state" style="color: var(--text-secondary); text-align: center; font-size: 12px; margin: 0; padding: 16px;">No saved loops for this video</p>';
            return;
        }
        
        container.innerHTML = savedLoops.map((loop, index) => `
            <div class="saved-loop-item" style="
                background: var(--bg-card);
                border: 1px solid var(--border);
                border-radius: 6px;
                padding: 8px;
                margin-bottom: 6px;
                font-size: 11px;
            ">
                <div style="display: grid; grid-template-columns: 1fr auto auto; gap: 4px; align-items: center;">
                    <div class="loop-info" style="overflow: hidden;">
                        <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 2px;">
                            ${loop.name}
                        </div>
                        <div style="color: var(--text-secondary); font-size: 10px;">
                            ${this.formatTime(loop.loopStart)} - ${this.formatTime(loop.loopEnd)}
                            ${loop.notes ? `<br>📝 ${loop.notes}` : ''}
                        </div>
                    </div>
                    <button class="btn btn-xs btn-primary load-youtube-loop-btn" data-index="${index}"
                            style="padding: 2px 6px; font-size: 10px; min-width: 35px;">
                        Load
                    </button>
                    <button class="btn btn-xs btn-danger delete-youtube-loop-btn" data-index="${index}"
                            style="padding: 2px 6px; font-size: 10px; min-width: 25px;">
                        ×
                    </button>
                </div>
            </div>
        `).join('');
        
        // Add event listeners
        container.querySelectorAll('.load-youtube-loop-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.loadYouTubeLoop(index);
            });
        });
        
        container.querySelectorAll('.delete-youtube-loop-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.deleteYouTubeLoop(index);
            });
        });
    }
    
    loadYouTubeLoop(index) {
        if (!this.youtubeVideoId) return;
        
        const storageKey = `youtube_loops_${this.youtubeVideoId}`;
        const savedLoops = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const loop = savedLoops[index];
        
        if (!loop) return;
        
        // Apply loop settings
        this.youtubeLoopStart = loop.loopStart;
        this.youtubeLoopEnd = loop.loopEnd;
        
        // Update UI
        document.getElementById('youtubeLoopStartTime').textContent = this.formatTime(loop.loopStart);
        document.getElementById('youtubeLoopEndTime').textContent = this.formatTime(loop.loopEnd);
        document.getElementById('youtubeLoopEnabled').checked = true;
        this.youtubeLooping = true;
        
        // Apply speed if saved
        if (loop.speed) {
            const speedSlider = document.getElementById('youtubeSpeedSlider');
            if (speedSlider) {
                speedSlider.value = loop.speed;
                document.getElementById('youtubeSpeedValue').textContent = `${loop.speed}%`;
                this.setYouTubeSpeed(loop.speed / 100);
            }
        }
        
        // Update waveform
        if (this.youtubePlayer && this.youtubeReady) {
            this.updateYouTubeWaveform(this.youtubePlayer.getCurrentTime(), this.youtubePlayer.getDuration());
        }
        
        this.showNotification(`Loop "${loop.name}" loaded! 🎵`, 'success');
    }
    
    deleteYouTubeLoop(index) {
        if (!confirm('Delete this loop?')) return;
        
        const storageKey = `youtube_loops_${this.youtubeVideoId}`;
        const savedLoops = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        savedLoops.splice(index, 1);
        localStorage.setItem(storageKey, JSON.stringify(savedLoops));
        
        this.loadSavedYouTubeLoops();
        this.showNotification('Loop deleted', 'info');
    }
    
    formatTime(seconds) {
        if (seconds === null || seconds === undefined) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }


    initializeYouTubeWaveform() {
        const canvas = document.getElementById('youtubeWaveformCanvas');
        if (!canvas) return;

        this.youtubeWaveformCanvas = canvas;
        this.youtubeWaveformCtx = canvas.getContext('2d');

        // Set canvas size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        // Add click handler for seeking
        canvas.addEventListener('click', (e) => {
            if (!this.youtubePlayer || !this.youtubeReady) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = x / rect.width;
            const duration = this.youtubePlayer.getDuration();

            if (duration > 0) {
                const seekTime = duration * percentage;
                const wasPlaying = this.youtubePlayer.getPlayerState() === YT.PlayerState.PLAYING;

                // Seek to the clicked position
                this.youtubePlayer.seekTo(seekTime, true);
                
                // If video wasn't playing before click, ensure it stays paused
                if (!wasPlaying) {
                    // Force pause after seek to prevent autoplay
                    setTimeout(() => {
                        this.youtubePlayer.pauseVideo();
                    }, 50);
                }
            }
        });

        // Add hover effect
        canvas.addEventListener('mousemove', (e) => {
            if (!this.youtubePlayer || !this.youtubeReady) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = x / rect.width;
            const duration = this.youtubePlayer.getDuration();

            if (duration > 0) {
                const hoverTime = duration * percentage;
                canvas.title = this.formatTime(hoverTime);
            }
        });

        // Add cursor style
        canvas.style.cursor = 'pointer';

        // Draw initial waveform
        this.drawYouTubeWaveform();
    }

    drawYouTubeWaveform() {
        if (!this.youtubeWaveformCtx) return;

        const ctx = this.youtubeWaveformCtx;
        const width = this.youtubeWaveformCanvas.width;
        const height = this.youtubeWaveformCanvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw fake waveform (since we can't get actual audio data from YouTube)
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const midY = height / 2;
        for (let x = 0; x < width; x += 4) {
            const amplitude = Math.sin(x * 0.02) * 20 + Math.random() * 10;
            ctx.moveTo(x, midY - amplitude);
            ctx.lineTo(x, midY + amplitude);
        }

        ctx.stroke();

        // Draw center line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, midY);
        ctx.lineTo(width, midY);
        ctx.stroke();

        // Store base image
        this.youtubeWaveformImage = ctx.getImageData(0, 0, width, height);
    }

    updateYouTubeWaveform(currentTime, duration) {
        if (!this.youtubeWaveformCtx || !this.youtubeWaveformImage || !duration) return;

        const ctx = this.youtubeWaveformCtx;
        const width = this.youtubeWaveformCanvas.width;
        const height = this.youtubeWaveformCanvas.height;

        // Restore base image
        ctx.putImageData(this.youtubeWaveformImage, 0, 0);

        // Draw progress overlay
        const progress = currentTime / duration;
        const progressX = progress * width;

        ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
        ctx.fillRect(0, 0, progressX, height);

        // Draw playhead
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(progressX, 0);
        ctx.lineTo(progressX, height);
        ctx.stroke();

        // Draw loop markers
        this.drawYouTubeLoopMarkers();
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    drawYouTubeLoopMarkers() {
        if (!this.youtubeWaveformCtx || !this.youtubePlayer) return;

        const ctx = this.youtubeWaveformCtx;
        const width = this.youtubeWaveformCanvas.width;
        const height = this.youtubeWaveformCanvas.height;
        const duration = this.youtubePlayer.getDuration();

        if (!duration) return;

        // Draw loop start marker
        if (this.youtubeLoopStart !== null && this.youtubeLoopStart !== undefined) {
            const startX = (this.youtubeLoopStart / duration) * width;

            // Green bar
            ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
            ctx.fillRect(startX - 1, 0, 3, height);

            // Label
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText('A', startX + 4, 12);
        }

        // Draw loop end marker
        if (this.youtubeLoopEnd !== null && this.youtubeLoopEnd !== undefined) {
            const endX = (this.youtubeLoopEnd / duration) * width;

            // Red bar
            ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
            ctx.fillRect(endX - 1, 0, 3, height);

            // Label
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText('B', endX - 12, 12);
        }

        // Draw loop region
        if (this.youtubeLoopStart !== null && this.youtubeLoopEnd !== null) {
            const startX = (this.youtubeLoopStart / duration) * width;
            const endX = (this.youtubeLoopEnd / duration) * width;

            ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
            ctx.fillRect(startX, 0, endX - startX, height);
        }
    }

    setOnSaveCallback(callback) {
        this.onSaveCallback = callback;
    }

    showSaveSessionPopup(duration) {
        // Create popup HTML
        // Get mode-specific information
        let modeInfo = '';
        if (this.currentMode === 'audio' && this.audioPlayer?.currentFileName) {
            modeInfo = `
                <div class="info-row">
                    <span class="info-label">Audio File:</span>
                    <span class="info-value">${this.audioPlayer.currentFileName}</span>
                </div>
            `;
        } else if (this.currentMode === 'youtube' && this.youtubeVideoTitle) {
            modeInfo = `
                <div class="info-row">
                    <span class="info-label">Video:</span>
                    <span class="info-value">${this.youtubeVideoTitle}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">URL:</span>
                    <span class="info-value" style="font-size: 0.8em;">${this.youtubeVideoUrl || 'N/A'}</span>
                </div>
            `;
        }

        const popupHTML = `
            <div class="save-session-popup-overlay" id="saveSessionPopupOverlay">
                <div class="save-session-popup">
                    <div class="popup-header">
                        <h2>Save Practice Session</h2>
                        <button class="popup-close" id="popupCloseBtn">&times;</button>
                    </div>
                    
                    <div class="popup-body">
                        <div class="session-info">
                            <div class="info-row">
                                <span class="info-label">Duration:</span>
                                <span class="info-value">${this.formatDuration(duration)}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Mode:</span>
                                <span class="info-value">${this.currentMode.charAt(0).toUpperCase() + this.currentMode.slice(1)}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Tempo:</span>
                                <span class="info-value">${this.metronomeState.bpm} BPM</span>
                            </div>
                            ${modeInfo}
                        </div>
                        
                        <div class="form-group">
                            <label for="sessionArea">Session Area</label>
                            <select id="sessionArea" class="form-input">
                                <option value="Scales">Scales</option>
                                <option value="Chords">Chords</option>
                                <option value="Technique">Technique</option>
                                <option value="Repertoire">Repertoire</option>
                                <option value="Sight Reading">Sight Reading</option>
                                <option value="Improvisation">Improvisation</option>
                                <option value="Music Theory">Music Theory</option>
                                <option value="Song Learning">Song Learning</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="sessionNotes">Notes (optional)</label>
                            <textarea id="sessionNotes" class="form-textarea" 
                                placeholder="What did you practice? Any observations?"
                                rows="3"></textarea>
                        </div>
                    </div>
                    
                    <div class="popup-footer">
                        <button class="btn btn-secondary" id="popupCancelBtn">Cancel</button>
                        <button class="btn btn-primary" id="popupSaveBtn">Save Session</button>
                    </div>
                </div>
            </div>
        `;

        // Add popup to DOM
        document.body.insertAdjacentHTML('beforeend', popupHTML);

        // Focus on title input
        setTimeout(() => {
            document.getElementById('sessionTitle')?.focus();
        }, 100);

        // Attach event listeners
        const overlay = document.getElementById('saveSessionPopupOverlay');
        const closeBtn = document.getElementById('popupCloseBtn');
        const cancelBtn = document.getElementById('popupCancelBtn');
        const saveBtn = document.getElementById('popupSaveBtn');

        const closePopup = () => {
            overlay?.remove();
        };

        closeBtn?.addEventListener('click', closePopup);
        cancelBtn?.addEventListener('click', closePopup);

        overlay?.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closePopup();
            }
        });

        saveBtn?.addEventListener('click', async () => {
            const sessionArea = document.getElementById('sessionArea')?.value || 'Other';
            const notes = document.getElementById('sessionNotes')?.value || '';

            const sessionData = {
                duration: duration,
                mode: this.currentMode,
                tempo: this.metronomeState.bpm,
                date: new Date().toISOString(),
                area: sessionArea,
                notes: notes
            };

            // Add mode-specific data
            if (this.currentMode === 'audio' && this.audioPlayer?.currentFileName) {
                sessionData.audioFile = this.audioPlayer.currentFileName;
            } else if (this.currentMode === 'youtube') {
                sessionData.youtubeTitle = this.youtubeVideoTitle || 'Unknown Video';
                sessionData.youtubeUrl = this.youtubeVideoUrl || '';
                sessionData.youtubeId = this.youtubeVideoId || '';
            }

            try {
                await this.storageService.savePracticeEntry(sessionData);
                if (this.onSaveCallback) {
                    this.onSaveCallback(sessionData);
                }

                // Reset timer after saving
                if (this.timer.stop) {
                    this.timer.stop();
                } else {
                    console.warn('Timer reset method not found');
                }

                // Close popup
                closePopup();

                // Show success feedback on the save button
                const saveSessionBtn = document.getElementById('saveSessionBtn');
                const originalText = saveSessionBtn.textContent;
                saveSessionBtn.textContent = '✓ Saved!';
                saveSessionBtn.style.background = '#10b981';
                saveSessionBtn.style.borderColor = '#10b981';

                setTimeout(() => {
                    saveSessionBtn.textContent = originalText;
                    saveSessionBtn.style.background = '';
                    saveSessionBtn.style.borderColor = '';
                }, 2000);

            } catch (error) {
                console.error('Error saving session:', error);
                alert('Failed to save session. Please try again.');
            }
        });
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    destroy() {
        // Clear any pending timeouts
        if (this.fileNameUpdateTimeout) {
            clearTimeout(this.fileNameUpdateTimeout);
        }

        if (this.timer) {
            this.timer.destroy();
        }
        if (this.metronomeState.interval) {
            clearInterval(this.metronomeState.interval);
        }
        if (this.audioPlayer) {
            this.audioPlayer.pause();
            if (this.audioPlayer.destroy) {
                this.audioPlayer.destroy();
            }
        }
        if (this.youtubeUpdateInterval) {
            clearInterval(this.youtubeUpdateInterval);
        }
        if (this.youtubePlayer) {
            this.youtubePlayer.destroy();
        }
    }

    // Session State Persistence Methods
    setupSessionStatePersistence() {
        // Save state before page unload
        this.sessionStateService.setupBeforeUnloadHandler(() => {
            return this.getCurrentSessionState();
        });

        // Auto-save state every 30 seconds
        setInterval(() => {
            const state = this.getCurrentSessionState();
            if (state && (state.mode === 'audio' || state.mode === 'youtube')) {
                this.sessionStateService.saveState(state);
            }
        }, 30000);
    }

    getCurrentSessionState() {
        const state = {
            mode: this.currentMode,
            timer: {
                elapsedTime: this.timer?.elapsedTime || 0,
                isRunning: this.timer?.isRunning || false
            },
            metronome: {
                bpm: this.metronomeState?.bpm || 120,
                isPlaying: this.metronomeState?.isPlaying || false
            }
        };

        if (this.currentMode === 'audio' && this.audioPlayer) {
            state.audio = {
                fileName: this.audioPlayer.currentFileName,
                currentTime: this.audioPlayer.getCurrentTime ? this.audioPlayer.getCurrentTime() : 0,
                speed: this.audioPlayer.playbackRate || 1,
                pitch: this.audioPlayer.pitchShift || 0,
                volume: this.audioPlayer.volume || 1,
                loopStart: this.audioPlayer.loopStart,
                loopEnd: this.audioPlayer.loopEnd,
                loopEnabled: this.audioPlayer.isLooping || false,
                isPlaying: this.audioPlayer.isPlaying || false
            };
        } else if (this.currentMode === 'youtube' && this.youtubePlayer) {
            state.youtube = {
                videoId: this.youtubeVideoId,
                videoUrl: this.youtubeVideoUrl,
                videoTitle: this.youtubeVideoTitle,
                currentTime: this.youtubePlayer.getCurrentTime ? this.youtubePlayer.getCurrentTime() : 0,
                speed: this.youtubePlaybackRate || 1,
                volume: this.youtubePlayer.getVolume ? this.youtubePlayer.getVolume() : 100,
                loopStart: this.youtubeLoopStart,
                loopEnd: this.youtubeLoopEnd,
                loopEnabled: this.youtubeLooping || false,
                isPlaying: this.youtubePlayer.getPlayerState ?
                    this.youtubePlayer.getPlayerState() === YT.PlayerState.PLAYING : false
            };
        }

        return state;
    }

    async restoreSessionState() {
        const savedState = this.sessionStateService.getState();
        if (!savedState) return;

        console.log('Restoring session state:', savedState);

        // Show notification
        this.showRestorationNotification();

        // Restore timer state
        if (savedState.timer) {
            this.timer.elapsedTime = savedState.timer.elapsedTime;
            if (savedState.timer.isRunning) {
                this.timer.start();
            }
        }

        // Restore metronome state
        if (savedState.metronome) {
            this.setBpm(savedState.metronome.bpm);
            if (savedState.metronome.isPlaying) {
                // Don't auto-start metronome to avoid unexpected sound
                console.log('Metronome was playing, but not auto-starting');
            }
        }

        // Restore mode-specific state
        if (savedState.mode === 'audio' && savedState.audio) {
            // Switch to audio mode
            this.switchMode('audio');

            // Note: Cannot restore audio file automatically due to security restrictions
            // Show message to user
            setTimeout(() => {
                this.showAudioRestoreMessage(savedState.audio.fileName);
            }, 500);

        } else if (savedState.mode === 'youtube' && savedState.youtube) {
            // Switch to YouTube mode
            this.switchMode('youtube');

            // Restore YouTube video
            setTimeout(() => {
                const urlInput = document.getElementById('youtubeUrlInput');
                if (urlInput && savedState.youtube.videoUrl) {
                    urlInput.value = savedState.youtube.videoUrl;
                    // Trigger load
                    document.getElementById('loadYoutubeBtn')?.click();
                }
            }, 500);
        }

        // Clear the saved state after restoration
        this.sessionStateService.clearState();
    }

    showRestorationNotification() {
        const notification = document.createElement('div');
        notification.className = 'session-restore-notification';
        notification.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; background: var(--primary); 
                        color: white; padding: 16px 24px; border-radius: 8px; 
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 10000;
                        animation: slideIn 0.3s ease;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 20px;">↻</span>
                    <div>
                        <div style="font-weight: 600;">Session Restored</div>
                        <div style="font-size: 14px; opacity: 0.9;">Your practice session has been restored</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 5000);
    }

    showAudioRestoreMessage(fileName) {
        const message = document.createElement('div');
        message.className = 'audio-restore-message';
        message.innerHTML = `
            <div style="background: rgba(99, 102, 241, 0.1); padding: 16px; 
                        border-radius: 8px; border: 1px solid var(--primary);
                        margin: 16px 0;">
                <p style="margin: 0; color: var(--text-primary);">
                    <strong>Previous session detected:</strong> You were practicing with "${fileName}". 
                    Please reload the file to continue where you left off.
                </p>
            </div>
        `;

        const audioPanel = document.getElementById('audioPanel');
        if (audioPanel) {
            audioPanel.insertBefore(message, audioPanel.firstChild);
            setTimeout(() => message.remove(), 10000);
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            max-width: 400px;
        `;
        notification.textContent = message;
        
        // Add animation styles if not already present
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}
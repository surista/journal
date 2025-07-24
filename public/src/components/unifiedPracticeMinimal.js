// Unified Practice Content - Minimalist Design (Refactored)
import { Timer } from './modules/timer.js';
import { MetronomeController } from './modules/metronome.js';
import { AudioFilePlayer } from './modules/audioFilePlayer.js';
import { YouTubePlayer } from './modules/youtubePlayer.js';
import { SessionManager } from './modules/sessionManager.js';
import { ImageManager } from './modules/imageManager.js';
import { UIController } from './modules/uiController.js';
import { AudioService } from '../services/audioService.js';

export class UnifiedPracticeMinimal {
    constructor(storageService) {
        this.storageService = storageService;
        this.audioService = new AudioService();
        
        // Initialize modules
        this.timer = new Timer();
        this.metronome = new MetronomeController(this.audioService);
        this.audioPlayer = new AudioFilePlayer(storageService);
        this.youtubePlayer = new YouTubePlayer(storageService);
        this.sessionManager = new SessionManager(storageService);
        this.imageManager = new ImageManager();
        this.uiController = new UIController();
        
        // State
        this.currentMode = 'metronome';
        this.onSaveCallback = null;
        
        // Tap tempo state
        this.tapTimes = [];
        this.tapTimeout = null;
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
                            
                            <!-- Image upload section -->
                            <div class="metronome-image-section">
                                <div id="imagePreview" class="image-preview" style="display: none;">
                                    <img id="previewImg" src="" alt="Practice sheet" />
                                    <button class="remove-image-btn" id="removeImageBtn">×</button>
                                </div>
                                <div class="image-upload-controls">
                                    <input type="file" id="imageUpload" accept="image/jpeg,image/jpg,image/png" style="display: none;">
                                    <button class="upload-image-btn" id="uploadImageBtn" title="Upload sheet music (JPEG/PNG, max 5MB)">
                                        <span>📷</span> Add Sheet Music
                                    </button>
                                    <div class="paste-hint">or paste screenshot (Ctrl+V) • Max 5MB</div>
                                </div>
                            </div>
                            
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
                        ${this.renderYouTubePanel()}
                    </div>
                </div>
            </div>
        `;
    }

    renderYouTubePanel() {
        return `
            <div class="youtube-input-minimal">
                <div class="url-input-group">
                    <input type="text" 
                           id="youtubeUrl" 
                           class="youtube-url-input" 
                           placeholder="Paste YouTube URL">
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
                    
                    ${this.renderYouTubeLoopControls()}
                    ${this.renderYouTubeAudioControls()}
                </div>
            </div>
        `;
    }

    renderYouTubeLoopControls() {
        return `
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
        `;
    }

    renderYouTubeAudioControls() {
        return `
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
        `;
    }

    init(container) {
        container.innerHTML = this.render();
        
        // Initialize all modules
        this.initializeModules();
        
        // Set up event listeners
        this.attachEventListeners();
        
        // Set initial states
        this.setInitialStates();
        
        // Check for session to restore
        this.checkForSessionToLoad();
        
        // Make timer globally accessible
        window.currentTimer = this.timer;
        if (window.app && window.app.currentPage) {
            window.app.currentPage.timer = this.timer;
        }
    }

    initializeModules() {
        // Initialize UI Controller
        this.uiController.initialize();
        
        // Initialize Timer with callback
        this.timer.setUpdateCallback(() => this.updateTimerDisplay());
        
        // Initialize Metronome
        this.metronome.initialize();
        
        // Initialize Audio Player
        this.audioPlayer.initialize(document.getElementById('audioPlayerContainer'));
        
        // Initialize YouTube Player
        this.youtubePlayer.initialize('youtubePlayer');
        
        // Initialize Session Manager
        this.sessionManager.initialize();
        this.sessionManager.setAutoSaveCallback(() => {
            this.sessionManager.persistCurrentState(this.getComponentsState());
        });
        
        // Initialize Image Manager
        this.imageManager.initialize();
        this.imageManager.setCurrentMode(this.currentMode);
        this.imageManager.setImageLoadCallback((imageSrc) => {
            this.uiController.showImagePreview(imageSrc);
        });
        this.imageManager.setImageClearCallback(() => {
            this.uiController.hideImagePreview();
        });
    }

    setInitialStates() {
        // Hide metronome stop button initially
        const stopBtn = document.getElementById('metronomeStop');
        if (stopBtn) stopBtn.style.display = 'none';
        
        // Set initial sound from saved preference
        const soundSelect = document.getElementById('soundSelect');
        if (soundSelect) {
            soundSelect.value = this.metronome.state.sound;
        }
        
        // Set up mode change callback
        this.uiController.onModeChange((newMode, oldMode) => {
            this.currentMode = newMode;
            this.imageManager.setCurrentMode(newMode);
            
            // Stop any playing audio when switching modes
            if (oldMode === 'metronome' && this.metronome.state.isPlaying) {
                this.metronome.stop();
            } else if (oldMode === 'audio' && this.audioPlayer.isPlaying()) {
                this.audioPlayer.stop();
            } else if (oldMode === 'youtube') {
                this.youtubePlayer.pause();
            }
        });
    }

    attachEventListeners() {
        // Timer Controls
        this.attachTimerListeners();
        
        // Metronome Controls
        this.attachMetronomeListeners();
        
        // Audio Controls
        this.attachAudioListeners();
        
        // YouTube Controls
        this.attachYouTubeListeners();
        
        // Audio context initialization
        document.addEventListener('click', () => {
            if (this.audioService && !this.metronome.state.audioReady) {
                setTimeout(() => {
                    if (this.audioService.isReady && this.audioService.isReady()) {
                        this.metronome.state.audioReady = true;
                    }
                }, 100);
            }
        }, { once: true });
    }

    attachTimerListeners() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        const syncCheckbox = document.getElementById('syncMetronome');

        playPauseBtn?.addEventListener('click', () => {
            if (this.timer.isRunning) {
                this.timer.pause();
                this.uiController.updateTimerControls(false);
            } else {
                this.timer.start();
                this.uiController.updateTimerControls(true);

                // Start playback if sync enabled
                if (syncCheckbox?.checked) {
                    if (this.currentMode === 'metronome' && !this.metronome.state.isPlaying) {
                        this.startMetronome();
                    } else if (this.currentMode === 'audio' && !this.audioPlayer.isPlaying()) {
                        this.audioPlayer.play();
                    } else if (this.currentMode === 'youtube') {
                        this.youtubePlayer.play();
                    }
                }
            }
        });

        stopBtn?.addEventListener('click', async () => {
            if (this.timer.isRunning && this.timer.elapsedTime > 0) {
                const userConfirmed = confirm('Stopping will reset the timer. Do you want to save your session first?');

                if (userConfirmed) {
                    this.timer.pause();
                    this.uiController.updateTimerControls(false);
                    
                    // Stop playback
                    this.stopAllPlayback();
                    
                    // Show save session popup
                    const duration = this.timer.getElapsedTime();
                    this.showSaveSessionPopup(duration);
                    return;
                } else {
                    const reallyStop = confirm('Are you sure you want to stop without saving?');
                    if (!reallyStop) return;
                }
            }

            // Stop and reset
            this.timer.stop();
            this.uiController.updateTimerControls(false);
            this.stopAllPlayback();
        });

        // Save session button
        document.getElementById('saveSessionBtn')?.addEventListener('click', async () => {
            const duration = this.timer.getElapsedTime();
            if (duration > 0) {
                if (this.timer.isRunning) {
                    this.timer.pause();
                    this.uiController.updateTimerControls(false);
                }
                this.stopAllPlayback();
                this.showSaveSessionPopup(duration);
            }
        });
    }

    attachMetronomeListeners() {
        // BPM Controls
        const bpmSlider = document.getElementById('bpmSlider');
        let wasPlaying = false;

        bpmSlider?.addEventListener('mousedown', () => {
            if (this.metronome.state.isPlaying) {
                wasPlaying = true;
                this.metronome.pause();
            }
        });

        bpmSlider?.addEventListener('input', (e) => {
            const bpm = parseInt(e.target.value);
            this.metronome.setBpm(bpm);
            this.uiController.updateBpmDisplay(bpm);
        });

        bpmSlider?.addEventListener('mouseup', () => {
            if (wasPlaying) {
                wasPlaying = false;
                this.startMetronome();
            }
        });

        // Start/Stop buttons
        document.getElementById('metronomeStart')?.addEventListener('click', () => {
            this.startMetronome();
        });

        document.getElementById('metronomeStop')?.addEventListener('click', () => {
            this.stopMetronome();
        });

        // Time signature
        document.getElementById('timeSignature')?.addEventListener('change', (e) => {
            const beats = parseInt(e.target.value);
            this.metronome.setTimeSignature(beats);
            this.uiController.updateAccentPattern(this.metronome.state.accentPattern);
        });

        // Sound selection
        document.getElementById('soundSelect')?.addEventListener('change', (e) => {
            this.metronome.setSound(e.target.value);
            localStorage.setItem('defaultMetronomeSound', e.target.value);
        });

        // Accent pattern
        document.querySelectorAll('.accent-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const beat = parseInt(e.target.dataset.beat);
                this.metronome.toggleAccent(beat);
                e.target.classList.toggle('active');
            });
        });

        // Tap tempo
        document.getElementById('tapTempo')?.addEventListener('click', () => {
            this.handleTapTempo();
        });

        // Image controls
        this.attachImageListeners();

        // Advanced features
        this.attachAdvancedFeatureListeners();
    }

    attachImageListeners() {
        const imageUpload = document.getElementById('imageUpload');
        const uploadBtn = document.getElementById('uploadImageBtn');
        const removeBtn = document.getElementById('removeImageBtn');
        const previewImg = document.getElementById('previewImg');

        uploadBtn?.addEventListener('click', () => {
            imageUpload?.click();
        });

        imageUpload?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.imageManager.handleImageFile(file);
            }
        });

        removeBtn?.addEventListener('click', () => {
            this.imageManager.clearImage();
        });

        previewImg?.addEventListener('click', () => {
            if (this.imageManager.currentImage) {
                this.imageManager.showLightbox(this.imageManager.currentImage);
            }
        });
    }

    attachAdvancedFeatureListeners() {
        // Tempo Progression
        const tempoProgressionCheckbox = document.getElementById('tempoProgressionEnabled');
        const tempoProgressionControls = document.querySelector('.tempo-progression-controls');

        tempoProgressionCheckbox?.addEventListener('change', (e) => {
            if (tempoProgressionControls) {
                tempoProgressionControls.style.display = e.target.checked ? 'block' : 'none';
            }

            if (e.target.checked) {
                this.metronome.state.tempoProgression = {
                    enabled: true,
                    startBpm: parseInt(document.getElementById('progressionStartBpm')?.value || 120),
                    endBpm: parseInt(document.getElementById('progressionEndBpm')?.value || 140),
                    increment: parseInt(document.getElementById('progressionIncrement')?.value || 5),
                    measuresPerStep: parseInt(document.getElementById('progressionMeasures')?.value || 4),
                    currentMeasure: 0,
                    currentBpm: this.metronome.state.bpm
                };
            } else {
                this.metronome.state.tempoProgression = { enabled: false };
            }
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
                this.metronome.state.beatDropout = {
                    enabled: true,
                    mode: dropoutMode?.value || 'random',
                    pattern: [],
                    dropoutProbability: 0.3
                };
            } else {
                this.metronome.state.beatDropout = { enabled: false };
            }
        });

        dropoutMode?.addEventListener('change', (e) => {
            if (dropoutPatternRow) {
                dropoutPatternRow.style.display = e.target.value === 'pattern' ? 'flex' : 'none';
            }
            if (this.metronome.state.beatDropout) {
                this.metronome.state.beatDropout.mode = e.target.value;
            }
        });
    }

    attachAudioListeners() {
        const fileInput = document.getElementById('audioFileInput');
        const browseBtn = document.getElementById('browseAudioBtn');

        browseBtn?.addEventListener('click', () => {
            this.audioPlayer.clear();
            if (fileInput) {
                fileInput.value = '';
                setTimeout(() => fileInput.click(), 50);
            }
        });

        fileInput?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const success = await this.audioPlayer.loadFile(file);
                if (success) {
                    this.uiController.showAudioFileName(file.name);
                }
            }
        });
    }

    attachYouTubeListeners() {
        const loadBtn = document.getElementById('loadYoutubeBtn');
        const urlInput = document.getElementById('youtubeUrl');

        loadBtn?.addEventListener('click', async () => {
            const url = urlInput?.value.trim();
            if (url) {
                try {
                    await this.youtubePlayer.loadVideo(url);
                    this.uiController.showYouTubePlayer();
                    this.initializeYouTubeUI();
                } catch (error) {
                    this.uiController.showNotification('Failed to load YouTube video', 'error');
                }
            }
        });

        urlInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loadBtn?.click();
            }
        });
    }

    initializeYouTubeUI() {
        // Set up YouTube-specific UI callbacks and controls
        this.youtubePlayer.setUpdateCallback((state) => {
            this.updateYouTubeUI(state);
        });

        // Initialize YouTube control listeners
        this.attachYouTubeControlListeners();
    }

    attachYouTubeControlListeners() {
        // Play/Pause
        document.getElementById('youtubePlayPause')?.addEventListener('click', () => {
            const btn = document.getElementById('youtubePlayPause');
            if (this.youtubePlayer.player?.getPlayerState() === YT.PlayerState.PLAYING) {
                this.youtubePlayer.pause();
                btn.innerHTML = '<i class="icon">▶️</i> Play';
            } else {
                this.youtubePlayer.play();
                btn.innerHTML = '<i class="icon">⏸️</i> Pause';
            }
        });

        // Stop
        document.getElementById('youtubeStop')?.addEventListener('click', () => {
            this.youtubePlayer.stop();
            document.getElementById('youtubePlayPause').innerHTML = '<i class="icon">▶️</i> Play';
        });

        // Loop controls
        document.getElementById('youtubeLoopStart')?.addEventListener('click', () => {
            const time = this.youtubePlayer.getCurrentTime();
            this.youtubePlayer.loopStart = time;
            document.getElementById('youtubeLoopStartTime').textContent = this.formatTime(time);
        });

        document.getElementById('youtubeLoopEnd')?.addEventListener('click', () => {
            const time = this.youtubePlayer.getCurrentTime();
            this.youtubePlayer.loopEnd = time;
            document.getElementById('youtubeLoopEndTime').textContent = this.formatTime(time);
        });

        document.getElementById('youtubeLoopClear')?.addEventListener('click', () => {
            this.youtubePlayer.clearLoop();
            document.getElementById('youtubeLoopStartTime').textContent = '--:--';
            document.getElementById('youtubeLoopEndTime').textContent = '--:--';
            document.getElementById('youtubeLoopEnabled').checked = false;
        });

        document.getElementById('youtubeLoopEnabled')?.addEventListener('change', (e) => {
            this.youtubePlayer.setLooping(e.target.checked);
        });

        // Speed control
        const speedSlider = document.getElementById('youtubeSpeedSlider');
        speedSlider?.addEventListener('input', (e) => {
            const speed = parseInt(e.target.value) / 100;
            this.youtubePlayer.setSpeed(speed);
            document.getElementById('youtubeSpeedValue').textContent = `${e.target.value}%`;
        });

        // Volume control
        const volumeSlider = document.getElementById('youtubeVolumeSlider');
        volumeSlider?.addEventListener('input', (e) => {
            const volume = parseInt(e.target.value);
            this.youtubePlayer.setVolume(volume);
            document.getElementById('youtubeVolumeValue').textContent = `${volume}%`;
        });

        // Save loop
        document.getElementById('youtubeSaveLoopBtn')?.addEventListener('click', () => {
            this.showSaveLoopModal();
        });
        
        // Add event delegation for saved loops list
        document.getElementById('youtubeSavedLoopsList')?.addEventListener('click', (e) => {
            const loopItem = e.target.closest('.youtube-loop-item');
            const deleteBtn = e.target.closest('.youtube-loop-delete');
            
            if (loopItem) {
                const index = parseInt(loopItem.dataset.index);
                this.loadYouTubeLoop(index);
            } else if (deleteBtn) {
                const index = parseInt(deleteBtn.dataset.index);
                this.deleteYouTubeLoop(index);
            }
        });
    }

    updateYouTubeUI(state) {
        // Update progress
        const progressFill = document.getElementById('youtubeProgressFill');
        if (progressFill && state.duration > 0) {
            progressFill.style.width = `${(state.currentTime / state.duration) * 100}%`;
        }

        // Update time display
        document.getElementById('youtubeCurrentTime').textContent = this.formatTime(state.currentTime);
        document.getElementById('youtubeDuration').textContent = this.formatTime(state.duration);
    }

    updateTimerDisplay() {
        const timeString = this.timer.getFormattedTime();
        this.uiController.updateTimerDisplay(timeString);
        
        // Show/hide save button
        const totalSeconds = this.timer.getElapsedTime();
        this.uiController.showSaveButton(totalSeconds > 0);
    }

    startMetronome() {
        this.metronome.start(() => {
            if (this.uiController.getElement('syncCheckbox')?.checked && !this.timer.isRunning) {
                this.timer.start();
                this.uiController.updateTimerControls(true);
            }
        });
        this.uiController.updateMetronomeControls(true);
    }

    stopMetronome() {
        this.metronome.stop();
        this.uiController.updateMetronomeControls(false);
    }

    stopAllPlayback() {
        if (this.metronome.state.isPlaying) {
            this.stopMetronome();
        }
        if (this.audioPlayer.isPlaying()) {
            this.audioPlayer.stop();
        }
        if (this.youtubePlayer.player) {
            this.youtubePlayer.pause();
        }
    }

    handleTapTempo() {
        const now = Date.now();
        this.tapTimes.push(now);

        if (this.tapTimes.length > 8) this.tapTimes.shift();

        if (this.tapTimes.length >= 2) {
            const intervals = [];
            for (let i = 1; i < this.tapTimes.length; i++) {
                intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
            }
            const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
            const bpm = Math.round(60000 / avgInterval);
            const constrainedBpm = Math.max(30, Math.min(300, bpm));
            this.metronome.setBpm(constrainedBpm);
            this.uiController.updateBpmDisplay(constrainedBpm);
        }

        clearTimeout(this.tapTimeout);
        this.tapTimeout = setTimeout(() => { this.tapTimes = []; }, 2000);
    }

    showSaveSessionPopup(duration) {
        const modal = this.uiController.showModal(this.renderSaveSessionModal(duration), {
            onClose: () => {
                // Resume timer if it was paused
                if (!this.timer.isRunning && this.timer.elapsedTime > 0) {
                    this.timer.start();
                    this.uiController.updateTimerControls(true);
                }
            }
        });

        // Attach save handlers
        this.attachSaveSessionHandlers(modal, duration);
    }

    renderSaveSessionModal(duration) {
        const defaultName = this.sessionManager.generateSessionName();
        const formattedDuration = this.sessionManager.formatDuration(duration);
        
        return `
            <h3>Save Practice Session</h3>
            <div class="save-session-form">
                <div class="session-info">
                    <p>Duration: <strong>${formattedDuration}</strong></p>
                    ${this.currentMode === 'metronome' ? `<p>BPM: <strong>${this.metronome.state.bpm}</strong></p>` : ''}
                </div>
                
                <div class="form-group">
                    <label for="sessionName">Session Name:</label>
                    <input type="text" id="sessionName" value="${defaultName}" 
                           placeholder="Enter session name..." 
                           style="width: 100%; padding: 8px; margin-top: 8px;">
                </div>
                
                <div class="button-group" style="margin-top: 16px;">
                    <button class="btn btn-primary" id="confirmSaveBtn">Save Session</button>
                    <button class="btn btn-secondary" id="cancelSaveBtn">Cancel</button>
                </div>
            </div>
        `;
    }

    attachSaveSessionHandlers(modal, duration) {
        const nameInput = modal.querySelector('#sessionName');
        const confirmBtn = modal.querySelector('#confirmSaveBtn');
        const cancelBtn = modal.querySelector('#cancelSaveBtn');

        confirmBtn?.addEventListener('click', async () => {
            const name = nameInput?.value.trim() || this.sessionManager.generateSessionName();
            const session = await this.sessionManager.saveSession(name, duration, this.getComponentsState());
            
            if (session && this.onSaveCallback) {
                this.onSaveCallback(session);
            }
            
            // Reset timer after saving
            this.timer.stop();
            this.uiController.updateTimerControls(false);
            modal.remove();
        });

        cancelBtn?.addEventListener('click', () => {
            modal.remove();
        });

        // Save on Enter
        nameInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                confirmBtn?.click();
            }
        });

        // Focus input
        nameInput?.focus();
        nameInput?.select();
    }

    showSaveLoopModal() {
        if (this.youtubePlayer.loopStart === null || this.youtubePlayer.loopEnd === null) {
            this.uiController.showNotification('Please set loop start and end points first', 'error');
            return;
        }

        const modal = this.uiController.showModal(this.renderSaveLoopModal());
        this.attachSaveLoopHandlers(modal);
    }

    renderSaveLoopModal() {
        const loopDuration = this.youtubePlayer.loopEnd - this.youtubePlayer.loopStart;
        return `
            <h3>Save Loop</h3>
            <div class="save-loop-form">
                <p>Loop: ${this.formatTime(this.youtubePlayer.loopStart)} - ${this.formatTime(this.youtubePlayer.loopEnd)} 
                   (${this.formatTime(loopDuration)})</p>
                
                <div class="form-group">
                    <label for="loopName">Loop Name:</label>
                    <input type="text" id="loopName" 
                           placeholder="e.g., Intro, Verse 1, Chorus..." 
                           style="width: 100%; padding: 8px; margin-top: 8px;">
                </div>
                
                <div class="button-group" style="margin-top: 16px;">
                    <button class="btn btn-primary" id="confirmLoopSaveBtn">Save Loop</button>
                    <button class="btn btn-secondary" id="cancelLoopSaveBtn">Cancel</button>
                </div>
            </div>
        `;
    }

    attachSaveLoopHandlers(modal) {
        const nameInput = modal.querySelector('#loopName');
        const confirmBtn = modal.querySelector('#confirmLoopSaveBtn');
        const cancelBtn = modal.querySelector('#cancelLoopSaveBtn');

        confirmBtn?.addEventListener('click', () => {
            const name = nameInput?.value.trim();
            if (name) {
                this.youtubePlayer.saveLoop(name);
                this.updateSavedLoopsList();
                modal.remove();
                this.uiController.showNotification('Loop saved successfully', 'success');
            } else {
                this.uiController.showNotification('Please enter a loop name', 'error');
            }
        });

        cancelBtn?.addEventListener('click', () => {
            modal.remove();
        });

        nameInput?.focus();
    }

    updateSavedLoopsList() {
        const loops = this.youtubePlayer.loadSavedLoops();
        const container = document.getElementById('youtubeSavedLoopsList');
        
        if (!container) return;
        
        if (loops.length === 0) {
            container.innerHTML = '<p class="empty-state" style="color: var(--text-secondary); text-align: center; font-size: 12px; margin: 0; padding: 16px;">No saved loops for this video</p>';
        } else {
            container.innerHTML = loops.map((loop, index) => `
                <div class="saved-loop-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid var(--border); cursor: pointer;">
                    <div class="youtube-loop-item" data-index="${index}" style="flex: 1;">
                        <div style="font-weight: 500;">${loop.name}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">
                            ${this.formatTime(loop.start)} - ${this.formatTime(loop.end)}
                        </div>
                    </div>
                    <button class="youtube-loop-delete" data-index="${index}" 
                            class="btn btn-xs btn-danger" 
                            style="padding: 2px 8px; font-size: 11px;">
                        Delete
                    </button>
                </div>
            `).join('');
        }
    }

    loadYouTubeLoop(index) {
        if (this.youtubePlayer.loadLoop(index)) {
            const loop = this.youtubePlayer.savedLoops[index];
            document.getElementById('youtubeLoopStartTime').textContent = this.formatTime(loop.start);
            document.getElementById('youtubeLoopEndTime').textContent = this.formatTime(loop.end);
            document.getElementById('youtubeLoopEnabled').checked = true;
            this.youtubePlayer.setLooping(true);
            this.uiController.showNotification(`Loaded loop: ${loop.name}`, 'success');
        }
    }

    deleteYouTubeLoop(index) {
        if (confirm('Delete this saved loop?')) {
            this.youtubePlayer.deleteLoop(index);
            this.updateSavedLoopsList();
            this.uiController.showNotification('Loop deleted', 'info');
        }
    }

    formatTime(seconds) {
        if (!seconds || seconds < 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    checkForSessionToLoad() {
        // Check URL params
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session');
        
        if (sessionId) {
            this.sessionManager.restoreSession(parseInt(sessionId), this.getComponentsState());
        } else {
            // Check for auto-restore
            this.sessionManager.checkForRestorable(this.getComponentsState());
        }
    }

    getComponentsState() {
        return {
            timer: this.timer,
            metronome: this.metronome,
            audioPlayer: this.audioPlayer,
            youtubePlayer: this.youtubePlayer,
            imageManager: this.imageManager,
            currentMode: this.currentMode,
            switchMode: (mode) => this.uiController.switchMode(mode),
            updateTimerDisplay: () => this.updateTimerDisplay()
        };
    }

    setOnSaveCallback(callback) {
        this.onSaveCallback = callback;
    }

    destroy() {
        // Destroy all modules
        this.timer.destroy();
        this.metronome.destroy();
        this.audioPlayer.destroy();
        this.youtubePlayer.destroy();
        this.sessionManager.destroy();
        this.imageManager.destroy();
        this.uiController.destroy();
        
        // Clear timeouts
        if (this.tapTimeout) {
            clearTimeout(this.tapTimeout);
        }
        
        // Clear global references
        if (window.currentTimer === this.timer) {
            window.currentTimer = null;
        }
    }
}
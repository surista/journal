// Unified Practice Content - Minimalist Design
import { Metronome } from './metronome.js';
import { AudioPlayer } from './audioPlayer.js';
import { AudioService } from '../services/audioService.js';
import { SaveSessionPopup } from './saveSessionPopup.js';

export class UnifiedPracticeMinimal {
    constructor(storageService) {
        this.storageService = storageService;
        this.timer = null;
        this.metronome = null;
        this.audioPlayer = null;
        this.audioService = new AudioService();
        this.currentMode = 'metronome';
        this.saveSessionPopup = new SaveSessionPopup(storageService);
        this.onSaveCallback = null;
        
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
                            <span>Start timer with metronome</span>
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
                            
                            <div class="metronome-options">
                                <div class="option-group">
                                    <label>Time Signature</label>
                                    <select id="timeSignature" class="minimal-select">
                                        <option value="4">4/4</option>
                                        <option value="3">3/4</option>
                                        <option value="2">2/4</option>
                                        <option value="6">6/8</option>
                                    </select>
                                </div>
                                
                                <div class="option-group">
                                    <label>Sound</label>
                                    <select id="soundSelect" class="minimal-select">
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
                            <div class="upload-area" id="uploadArea">
                                <span class="upload-icon">🎵</span>
                                <h3>Drop MP3 file here</h3>
                                <p>or <button class="link-btn" id="browseBtn">browse</button> to choose</p>
                                <p class="file-hint">MP3 files only (max 20MB)</p>
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
                            <div class="youtube-controls" style="display: flex; flex-direction: column; gap: 0.75rem;">
                                <!-- Playback Controls -->
                                <div style="display: flex; gap: 0.5rem; justify-content: center;">
                                    <button id="youtubePlayPause" class="timer-control-btn primary">Play</button>
                                    <button id="youtubeStop" class="timer-control-btn secondary">Stop</button>
                                </div>
                                
                                <!-- Loop Controls -->
                                <div style="background: var(--bg-secondary); padding: 0.75rem; border-radius: 8px;">
                                    <div style="font-size: 0.75rem; font-weight: 600; margin-bottom: 0.5rem;">Loop Controls</div>
                                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
                                        <button id="youtubeLoopStart" class="timer-control-btn secondary" style="min-width: 60px; padding: 0.375rem 0.75rem; font-size: 0.8125rem;">Start</button>
                                        <button id="youtubeLoopEnd" class="timer-control-btn secondary" style="min-width: 60px; padding: 0.375rem 0.75rem; font-size: 0.8125rem;">End</button>
                                        <button id="youtubeLoopClear" class="timer-control-btn secondary" style="min-width: 60px; padding: 0.375rem 0.75rem; font-size: 0.8125rem;">Clear</button>
                                        <div style="font-family: monospace; font-size: 0.75rem;">
                                            <span id="youtubeLoopStartTime">--:--</span> - <span id="youtubeLoopEndTime">--:--</span>
                                        </div>
                                        <label class="sync-checkbox" style="font-size: 0.75rem;">
                                            <input type="checkbox" id="youtubeLoopEnabled">
                                            <span>Loop</span>
                                        </label>
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
                this.switchMode(mode);
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
                        this.audioPlayer.play();
                    }
                    // YouTube playback would go here if needed
                }
            }
        });
        
        stopBtn?.addEventListener('click', () => {
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
        document.getElementById('saveSessionBtn')?.addEventListener('click', () => {
            const duration = this.timer.getElapsedTime();
            if (duration > 0) {
                this.saveSessionPopup.show({
                    duration: duration,
                    mode: this.currentMode,
                    tempo: this.metronomeState.bpm
                });
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
        const uploadArea = document.getElementById('uploadArea');
        const browseBtn = document.getElementById('browseBtn');
        
        browseBtn?.addEventListener('click', () => fileInput?.click());
        
        fileInput?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await this.loadAudioFile(file);
            }
        });
        
        // Drag and drop
        uploadArea?.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea?.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea?.addEventListener('drop', async (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const file = e.dataTransfer.files[0];
            if (file) {
                // Validate MP3 file type for drag and drop
                if (!file.type.includes('mp3') && !file.name.toLowerCase().endsWith('.mp3')) {
                    alert('Please drop an MP3 file only. Other audio formats are not currently supported.');
                    return;
                }
                await this.loadAudioFile(file);
            }
        });
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
        this.currentMode = mode;
        
        // Update tabs
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });
        
        // Update panels
        document.querySelectorAll('.mode-panel').forEach(panel => {
            panel.classList.toggle('active', 
                panel.id === `${mode}Panel`);
        });
    }
    
    async loadAudioFile(file) {
        console.log('Loading audio file:', file.name, file.type, file.size);
        
        // Validate MP3 file type
        if (!file.type.includes('mp3') && !file.name.toLowerCase().endsWith('.mp3')) {
            alert('Please select an MP3 file only. Other audio formats are not currently supported.');
            return;
        }
        
        const container = document.getElementById('audioPlayerContainer');
        if (!container) {
            console.error('Audio player container not found');
            return;
        }
        
        try {
            // If AudioPlayer already exists, reset it for new file
            if (this.audioPlayer) {
                this.audioPlayer.stop();
                this.audioPlayer.currentTime = 0;
                this.audioPlayer.isYouTubeMode = false;
                this.audioPlayer.clearLoop();
            } else {
                this.audioPlayer = new AudioPlayer(container, this.audioService);
            }
            
            // The AudioPlayer.render() method directly sets container.innerHTML
            this.audioPlayer.render();
            this.audioPlayer.attachEventListeners();
            
            // Load the file - create a fake event with the file
            const fakeEvent = { target: { files: [file] } };
            await this.audioPlayer.handleFileSelect(fakeEvent);
            
            // Hide upload area completely
            const uploadArea = document.getElementById('uploadArea');
            if (uploadArea) {
                uploadArea.style.display = 'none';
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
            }
            
            // Show the file name
            const fileNameEl = document.getElementById('currentFileName');
            if (fileNameEl) {
                fileNameEl.textContent = `Loaded: ${file.name}`;
                fileNameEl.style.color = 'var(--success)';
                fileNameEl.style.display = 'block';
                fileNameEl.style.marginBottom = '1rem';
            }
            
            // Debug and ensure waveform initializes
            const fileRef = file; // Capture file reference
            setTimeout(() => {
                const canvas = document.getElementById('waveformCanvas');
                const waveformContainer = document.querySelector('.waveform-container');
                
                console.log('Debug waveform elements:', {
                    canvas: !!canvas,
                    container: !!waveformContainer,
                    audioPlayer: !!this.audioPlayer,
                    visualizer: !!this.audioPlayer?.waveformVisualizer,
                    audioService: !!this.audioService
                });
                
                if (canvas) {
                    console.log('Canvas dimensions:', canvas.offsetWidth, 'x', canvas.offsetHeight);
                    
                    // Force re-initialization of waveform if it failed
                    if (this.audioPlayer && !this.audioPlayer.waveformVisualizer) {
                        console.log('Re-initializing waveform...');
                        this.audioPlayer.initializeWaveform(fileRef);
                    } else if (this.audioPlayer && this.audioPlayer.waveformVisualizer) {
                        console.log('Waveform exists, forcing redraw...');
                        if (this.audioPlayer.waveformVisualizer.resizeCanvas) {
                            this.audioPlayer.waveformVisualizer.resizeCanvas();
                        }
                        if (this.audioPlayer.waveformVisualizer.draw) {
                            this.audioPlayer.waveformVisualizer.draw();
                        }
                    }
                } else {
                    console.error('Waveform canvas not found!');
                }
            }, 1000);
            
            console.log('Audio file loaded successfully:', file.name);
        } catch (error) {
            console.error('Error loading audio file:', error);
            alert('Failed to load audio file: ' + error.message);
        }
    }
    
    async loadYouTubeVideo(urlOrId) {
        let videoId = urlOrId;
        const match = urlOrId.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (match) {
            videoId = match[1];
        }
        
        // Hide input and show player wrapper
        const youtubeInput = document.querySelector('.youtube-input-minimal');
        const playerWrapper = document.getElementById('youtubePlayerWrapper');
        
        if (youtubeInput) youtubeInput.style.display = 'none';
        if (playerWrapper) playerWrapper.style.display = 'block';
        
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
        
        if (event.data === YT.PlayerState.PLAYING) {
            if (playPauseBtn) playPauseBtn.textContent = 'Pause';
            // Start timer sync if enabled
            if (this.timer && this.timer.syncWithPlayback) {
                this.timer.start();
            }
        } else {
            if (playPauseBtn) playPauseBtn.textContent = 'Play';
            // Stop timer sync if enabled
            if (this.timer && this.timer.syncWithPlayback && event.data !== YT.PlayerState.BUFFERING) {
                this.timer.pause();
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
                if (playPauseBtn) playPauseBtn.textContent = 'Play';
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
                
                // Seek to the position
                this.youtubePlayer.seekTo(seekTime, true);
                
                // If video wasn't playing, pause it after seeking
                if (!wasPlaying) {
                    // Small delay to ensure seek completes before pausing
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
        this.saveSessionPopup.setOnSaveCallback(callback);
    }
    
    destroy() {
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
}
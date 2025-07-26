// Unified Practice Content - Minimalist Design (Refactored)
import { Timer } from './modules/timer.js';
import { MetronomeController } from './modules/metronome.js';
import { AudioFilePlayer } from './modules/audioFilePlayer.js';
import { YouTubePlayer } from './modules/youtubePlayer.js';
import { SessionManager } from './modules/sessionManager.js';
import { ImageManager } from './modules/imageManager.js';
import { UIController } from './modules/uiController.js';
import { AudioService } from '../services/audioService.js';
import { escapeHtml } from '../utils/sanitizer.js';

export class UnifiedPracticeMinimal {
    constructor(storageService) {
        this.storageService = storageService;
        this.audioService = new AudioService();

        // Initialize modules
        this.timer = new Timer(null, storageService);
        this.metronome = new MetronomeController(this.audioService, storageService);
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
                                    <span class="bpm-value" id="bpmValue">80</span>
                                    <span class="bpm-label">BPM</span>
                                </div>
                                <!-- Tempo Progression Status -->
                                <div id="tempoProgressionStatus" class="tempo-progression-status" style="display: none;">
                                    <div class="measure-progress">
                                        Measure <span id="currentMeasure">1</span> of <span id="measuresPerStep">4</span>
                                    </div>
                                    <div class="tempo-range">
                                        <span id="currentProgressBpm">120</span> → <span id="targetProgressBpm">140</span> BPM
                                    </div>
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
                                    <option value="5">5/4</option>
                                    <option value="6">6/8</option>
                                    <option value="7">7/8</option>
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
                            
                            <!-- Saved Loops Section -->
                            <div class="saved-loops-section" id="audioSavedLoopsSection" style="display: none; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); padding: 16px; border-radius: 12px; margin-top: 20px; border: 1px solid rgba(255, 255, 255, 0.1);">
                                <h4 style="margin-bottom: 12px; font-size: 14px; color: var(--text-secondary);">Saved Loops</h4>
                                <div id="audioSavedLoopsList" class="saved-sessions-list" style="max-height: 150px; overflow-y: auto;">
                                    <p class="no-loops-message" style="text-align: center; color: var(--text-muted); font-size: 14px;">No saved loops yet</p>
                                </div>
                            </div>
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
                <!-- YouTube Player Container with Resize Button -->
                <div style="position: relative;">
                    <button id="youtubeResizeBtn" class="btn-resize" title="Toggle Size" style="position: absolute; top: 10px; right: 10px; z-index: 10; background: rgba(0,0,0,0.7); color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 14px;">
                        <span class="resize-icon">⛶</span> <span class="resize-text">Expand</span>
                    </button>
                    <!-- YouTube Player -->
                    <div id="youtubePlayer" style="width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 8px; margin-bottom: 1rem; overflow: hidden; transition: all 0.3s ease;"></div>
                </div>
                
                <!-- Progress Bar (waveform placeholder for YouTube) -->
                <div class="waveform-container" style="position: relative; width: 100%; height: 100px; background: var(--bg-secondary); border-radius: 8px; overflow: hidden; margin-bottom: 1rem;">
                    <canvas id="youtubeWaveformCanvas" style="width: 100%; height: 100%; display: block;"></canvas>
                    <div class="youtube-progress-bar" style="position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: rgba(255,255,255,0.1);">
                        <div id="youtubeProgressFill" style="height: 100%; background: var(--primary); width: 0%; transition: width 0.1s;"></div>
                    </div>
                </div>
                
                <!-- YouTube Controls -->
                <div class="youtube-controls">
                    <!-- Time Display -->
                    <div class="time-display" style="text-align: center; font-size: 24px; margin-bottom: 20px; color: var(--text-primary, #e5e7eb);">
                        <span id="youtubeCurrentTime" class="time-current">0:00</span>
                        <span class="time-separator">/</span>
                        <span id="youtubeDuration" class="time-duration">0:00</span>
                    </div>

                    <!-- Play/Stop and Loop Controls Combined (EXACTLY like audio player) -->
                    <div class="controls-playback-loop" style="display: flex; justify-content: center; align-items: center; gap: 20px; margin-bottom: 20px;">
                        <div class="controls-main" style="display: flex; gap: 10px;">
                            <button id="youtubePlayPauseBtn" class="btn-control btn-play-pause" title="Play/Pause (Space)">
                                <svg class="icon-play" viewBox="0 0 24 24" style="width: 24px; height: 24px;">
                                    <path d="M8 5v14l11-7z"/>
                                </svg>
                                <svg class="icon-pause" style="display: none; width: 24px; height: 24px;" viewBox="0 0 24 24">
                                    <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
                                </svg>
                            </button>
                            <button id="youtubeStopBtn" class="btn-control btn-stop" title="Stop">
                                <svg viewBox="0 0 24 24" style="width: 24px; height: 24px;">
                                    <path d="M6 6h12v12H6z"/>
                                </svg>
                            </button>
                        </div>
                        
                        <div class="controls-separator" style="color: var(--text-secondary, #9ca3af); font-size: 24px; line-height: 1; opacity: 0.5;">|</div>
                        
                        <div class="controls-loop" style="display: flex; gap: 10px;">
                            <button id="youtubeLoopStartBtn" class="btn-control btn-loop-start" title="Set Loop Start (I)">
                                <span>[</span>
                            </button>
                            <button id="youtubeLoopEndBtn" class="btn-control btn-loop-end" title="Set Loop End (O)">
                                <span>]</span>
                            </button>
                            <button id="youtubeLoopToggleBtn" class="btn-control btn-loop-toggle" title="Toggle Loop (L)">
                                <svg viewBox="0 0 24 24" style="width: 24px; height: 24px;">
                                    <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
                                </svg>
                            </button>
                            <button id="youtubeLoopClearBtn" class="btn-control btn-loop-clear" title="Clear Loop">
                                <span>×</span>
                            </button>
                            <button id="youtubeSaveLoopBtn" class="btn-control btn-loop-save" title="Save Loop" style="display: none;">
                                <span>💾</span>
                            </button>
                        </div>
                    </div>

                    <!-- Loop Info Display -->
                    <div id="youtubeLoopInfo" class="loop-info" style="display: none; text-align: center; margin-bottom: 20px;">
                        <span class="loop-label">Loop:</span>
                        <span id="youtubeLoopStartTime" class="loop-time">--:--</span>
                        <span class="loop-separator">→</span>
                        <span id="youtubeLoopEndTime" class="loop-time">--:--</span>
                        <span id="youtubeLoopDuration" class="loop-duration">(--:--)</span>
                    </div>
                    
                    ${this.renderYouTubeAudioControls()}
                    
                    ${this.renderYouTubeLoopControls()}
                    
                    <!-- Advanced Features for YouTube -->
                    <details class="advanced-features-minimal" style="margin-top: 20px;">
                        <summary>Advanced Features ▼</summary>
                        
                        <!-- Speed Progression -->
                        <div class="feature-section-minimal">
                            <label>
                                <input type="checkbox" id="youtubeSpeedProgressionEnabled">
                                Gradual Speed Increase
                            </label>
                            <div class="youtube-speed-progression-controls" style="display: none;">
                                <div class="control-row-minimal">
                                    <label>Start:</label>
                                    <input type="number" id="youtubeProgressionStartSpeed" value="80" min="25" max="200">
                                    <span>%</span>
                                </div>
                                <div class="control-row-minimal">
                                    <label>End:</label>
                                    <input type="number" id="youtubeProgressionEndSpeed" value="100" min="25" max="200">
                                    <span>%</span>
                                </div>
                                <div class="control-row-minimal">
                                    <label>Increase:</label>
                                    <input type="number" id="youtubeProgressionIncrement" value="5" min="1" max="20">
                                    <span>% every</span>
                                    <input type="number" id="youtubeProgressionLoops" value="4" min="1" max="16">
                                    <span>loops</span>
                                </div>
                            </div>
                        </div>
                    </details>
                    
                    <!-- Speed Progression Status -->
                    <div id="youtubeSpeedProgressionStatus" class="tempo-progression-status" style="display: none;">
                        <div class="measure-progress">
                            Loop <span id="youtubeCurrentLoop">1</span> of <span id="youtubeLoopsPerStep">4</span>
                        </div>
                        <div class="tempo-range">
                            <span id="youtubeCurrentProgressSpeed">80</span>% → <span id="youtubeTargetProgressSpeed">100</span>%
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderYouTubeLoopControls() {
        return `
            <!-- Saved Loops Section (simplified like audio player) -->
            <div class="saved-loops-section" style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); padding: 16px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.1);">
                <h4 style="margin-bottom: 12px; font-size: 14px; color: var(--text-secondary);">Saved Loops</h4>
                <div id="youtubeSavedLoopsList" class="saved-sessions-list" style="max-height: 150px; overflow-y: auto;">
                    <p class="empty-state" style="color: var(--text-secondary); text-align: center; font-size: 12px; margin: 0; padding: 16px;">No saved loops for this video</p>
                </div>
            </div>
        `;
    }

    renderYouTubeAudioControls() {
        // Extract the exact same controls HTML from UIControls but with youtube IDs
        return `
            <!-- Audio Controls Section -->
            <div class="audio-controls-compact" style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); padding: 20px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1);">
                <!-- Speed and Pitch Controls Combined (exact same as audio player) -->
                <div class="controls-speed-pitch">
                    <label class="control-label">Speed</label>
                    <div class="speed-controls-group">
                        <input type="range" id="youtubeSpeedSlider" class="slider slider-speed" 
                               min="25" max="200" value="100" step="1">
                        <span id="youtubeSpeedValue" class="value-display">100%</span>
                    </div>
                    <button id="youtubeResetSpeed" class="btn-reset" title="Reset Speed">Reset</button>
                    
                    <label class="control-label pitch-label">Pitch</label>
                    <div class="pitch-controls-group">
                        <button id="youtubePitchDown" class="btn-adjust" title="Lower Pitch (-)" disabled>-</button>
                        <span id="youtubePitchValue" class="value-display">0</span>
                        <button id="youtubePitchUp" class="btn-adjust" title="Raise Pitch (+)" disabled>+</button>
                    </div>
                    <button id="youtubeResetPitch" class="btn-reset" title="Reset Pitch" disabled>Reset</button>
                </div>
                
                <div style="text-align: center; margin-top: 10px;">
                    <button id="youtubePitchInfo" class="btn btn-xs">ℹ️ Why Pitch is Disabled</button>
                </div>
                
                <style>
                    .controls-speed-pitch {
                        display: flex;
                        gap: 15px;
                        margin-bottom: 20px;
                        align-items: center;
                    }

                    .pitch-label {
                        margin-left: 20px;
                    }

                    .speed-controls-group,
                    .pitch-controls-group {
                        display: inline-flex;
                        align-items: center;
                        gap: 10px;
                    }

                    .control-label {
                        display: inline-block;
                        margin-bottom: 0;
                        color: var(--text-secondary, #9ca3af);
                        font-size: 14px;
                    }

                    .slider {
                        width: 200px;
                        margin: 0 10px;
                    }

                    .btn-adjust {
                        width: 32px;
                        height: 32px;
                        border-radius: 6px;
                        border: 1px solid var(--border, #374151);
                        background: var(--bg-card, #374151);
                        color: var(--text-primary, #e5e7eb);
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: 600;
                        transition: all 0.2s;
                    }

                    .btn-adjust:hover:not(:disabled) {
                        background: var(--bg-hover, #4b5563);
                    }

                    .btn-adjust:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }

                    .btn-reset {
                        padding: 4px 12px;
                        border-radius: 4px;
                        border: 1px solid var(--border, #374151);
                        background: var(--bg-secondary, #1f2937);
                        color: var(--text-secondary, #9ca3af);
                        cursor: pointer;
                        font-size: 12px;
                        transition: all 0.2s;
                        text-align: center;
                        display: inline-block;
                        line-height: 1.2;
                    }

                    .btn-reset:hover:not(:disabled) {
                        background: var(--bg-hover, #374151);
                        color: var(--text-primary, #e5e7eb);
                    }

                    .btn-reset:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
                    }

                    .value-display {
                        min-width: 50px;
                        text-align: center;
                        font-weight: 600;
                        color: var(--primary, #6366f1);
                    }

                    .btn-xs {
                        padding: 6px 12px;
                        font-size: 13px;
                        background: var(--bg-card, #374151);
                        border: 1px solid var(--border, #4b5563);
                        border-radius: 6px;
                        cursor: pointer;
                        color: var(--text-primary, #e5e7eb);
                        transition: all 0.2s;
                    }
                    
                    .btn-xs:hover {
                        background: var(--bg-hover, #4b5563);
                        border-color: var(--primary, #6366f1);
                        transform: translateY(-1px);
                    }

                    @media (max-width: 768px) {
                        .controls-speed-pitch {
                            flex-wrap: wrap;
                            gap: 10px;
                        }
                        
                        .pitch-label {
                            margin-left: 0;
                            width: 100%;
                        }

                        .slider {
                            width: 150px;
                        }
                    }

                    /* Playback and Loop Control Styles (same as audio player) */
                    .controls-playback-loop {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        gap: 20px;
                        margin-bottom: 20px;
                    }

                    .controls-main {
                        display: flex;
                        gap: 10px;
                    }

                    .btn-control {
                        width: 48px;
                        height: 48px;
                        border-radius: 8px;
                        border: 1px solid var(--border, #374151);
                        background: var(--bg-card, #374151);
                        color: var(--text-primary, #e5e7eb);
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s;
                    }

                    .btn-control:hover {
                        background: var(--bg-hover, #4b5563);
                        transform: scale(1.05);
                    }

                    .btn-control svg {
                        width: 24px;
                        height: 24px;
                        fill: currentColor;
                    }

                    .controls-loop {
                        display: flex;
                        gap: 10px;
                    }

                    .controls-separator {
                        color: var(--text-secondary, #9ca3af);
                        font-size: 24px;
                        line-height: 1;
                        opacity: 0.5;
                    }

                    .loop-info {
                        text-align: center;
                        padding: 10px;
                        background: var(--bg-dark, #111827);
                        border-radius: 8px;
                        font-family: monospace;
                    }

                    .loop-time {
                        color: var(--primary, #6366f1);
                        font-weight: 600;
                    }

                    .loop-duration {
                        color: var(--text-secondary, #9ca3af);
                        font-size: 14px;
                    }
                    
                    /* Tempo Progression Styles */
                    .tempo-progression-status {
                        margin-top: 10px;
                        padding: 12px;
                        background: rgba(0, 0, 0, 0.3);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 8px;
                        font-size: 14px;
                        animation: fadeIn 0.3s ease-in-out;
                        backdrop-filter: blur(10px);
                    }
                    
                    .measure-progress {
                        color: #ffffff;
                        margin-bottom: 5px;
                        font-weight: 500;
                        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
                    }
                    
                    .tempo-range {
                        color: #e5e7eb;
                        font-size: 13px;
                        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
                    }
                    
                    #currentProgressBpm {
                        color: #6366f1;
                        font-weight: 600;
                        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
                    }
                    
                    .bpm-increase-animation {
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        font-size: 48px;
                        font-weight: bold;
                        color: var(--primary, #6366f1);
                        z-index: 1000;
                        animation: bpmIncrease 1s ease-out forwards;
                    }
                    
                    @keyframes bpmIncrease {
                        0% {
                            opacity: 0;
                            transform: translate(-50%, -50%) scale(0.5);
                        }
                        50% {
                            opacity: 1;
                            transform: translate(-50%, -50%) scale(1.2);
                        }
                        100% {
                            opacity: 0;
                            transform: translate(-50%, -50%) scale(1.5);
                        }
                    }
                    
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }

                    @media (max-width: 768px) {
                        .controls-playback-loop {
                            flex-wrap: wrap;
                            gap: 15px;
                        }
                        
                        .controls-separator {
                            display: none;
                        }
                    }
                </style>
            </div>
        `;
    }

    init(container) {
        container.innerHTML = this.render();

        // Make this instance globally accessible for timer discovery
        window.unifiedPracticeMinimal = this;

        // Initialize all modules
        this.initializeModules();

        // Set up event listeners
        this.attachEventListeners();

        // Set initial states
        this.setInitialStates();

        // Check and prompt for audio initialization
        this.checkAudioInitialization();

        // Check for session to restore
        this.checkForSessionToLoad();

        // Timer is now registered via the Timer constructor
        // Just update the app reference for backward compatibility
        if (window.app && window.app.currentPage) {
            window.app.currentPage.timer = this.timer;
        }
    }

    initializeModules() {
        // Initialize UI Controller
        this.uiController.initialize();

        // Initialize Timer with callback
        this.timer.setUpdateCallback(() => this.updateTimerDisplay());

        // Initial timer display update to show save button if needed
        this.updateTimerDisplay();

        // Initialize sync settings from checkbox
        const syncCheckbox = document.getElementById('syncMetronome');
        if (syncCheckbox) {
            const isChecked = syncCheckbox.checked;
            if (this.audioPlayer) {
                this.audioPlayer.setSyncWithTimer(isChecked);
            }
            if (this.youtubePlayer) {
                this.youtubePlayer.syncWithTimer = isChecked;
            }
        }

        // Initialize Metronome
        this.metronome.initialize();

        // Set up metronome callbacks for tempo progression
        this.metronome.setCallbacks({
            onBpmChange: (bpm) => {
                this.uiController.updateBpmDisplay(bpm);
                // Update progression display if active
                const prog = this.metronome.state.tempoProgression;
                if (prog?.enabled) {
                    document.getElementById('currentProgressBpm').textContent = bpm;
                }
            },
            onProgressionUpdate: (data) => {
                const statusDiv = document.getElementById('tempoProgressionStatus');
                if (statusDiv) {
                    statusDiv.style.display = 'block';
                    document.getElementById('currentMeasure').textContent = data.currentMeasure;
                    document.getElementById('measuresPerStep').textContent = data.measuresPerStep;
                    document.getElementById('currentProgressBpm').textContent = data.currentBpm;
                    document.getElementById('targetProgressBpm').textContent = data.targetBpm;
                }
            },
            onBpmIncrease: (data) => {
                // Show animation for BPM increase
                this.showBpmIncreaseAnimation(data.increment);
                // Reset measure display
                document.getElementById('currentMeasure').textContent = '0';
            }
        });

        // Set up BPM pulse animation
        this.setupBpmPulseAnimation();

        // Initialize Audio Player
        this.audioPlayer.initialize(document.getElementById('audioPlayerContainer'));

        // Initialize YouTube Player
        this.youtubePlayer.initialize('youtubePlayer');
        // Sync the timer preference
        if (this.timer && this.timer.syncWithAudio !== undefined) {
            this.youtubePlayer.syncWithTimer = this.timer.syncWithAudio;
            console.log('YouTube initialization: syncWithTimer set to', this.timer.syncWithAudio);
        }

        // Set up YouTube speed progression callbacks
        this.youtubePlayer.setSpeedProgressionCallbacks({
            onSpeedProgressionUpdate: (data) => {
                const statusDiv = document.getElementById('youtubeSpeedProgressionStatus');
                if (statusDiv) {
                    statusDiv.style.display = 'block';
                    document.getElementById('youtubeCurrentLoop').textContent = data.currentLoop;
                    document.getElementById('youtubeLoopsPerStep').textContent = data.loopsPerStep;
                    document.getElementById('youtubeCurrentProgressSpeed').textContent =
                        data.currentSpeed;
                    document.getElementById('youtubeTargetProgressSpeed').textContent =
                        data.targetSpeed;
                }
            },
            onSpeedIncrease: (data) => {
                // Show animation for speed increase
                this.showSpeedIncreaseAnimation(data.increment);
                // Reset loop display
                document.getElementById('youtubeCurrentLoop').textContent = '0';
            }
        });

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

        // Listen for loadPracticeSession events
        window.addEventListener('loadPracticeSession', (event) => {
            this.handleLoadPracticeSession(event.detail);
        });

        // Handle drill sessions from Drills page
        window.addEventListener('startDrillSession', (event) => {
            this.handleStartDrillSession(event.detail);
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

        // Keyboard Shortcuts
        this.setupKeyboardShortcuts();

        // Audio context initialization is now handled by checkAudioInitialization()
    }

    setupBpmPulseAnimation() {
        // Add CSS for the pulse animation
        if (!document.getElementById('bpm-pulse-styles')) {
            const style = document.createElement('style');
            style.id = 'bpm-pulse-styles';
            style.textContent = `
                @keyframes bpmPulse {
                    0% { 
                        transform: scale(1);
                        text-shadow: 0 0 0 rgba(99, 102, 241, 0);
                    }
                    20% { 
                        transform: scale(1.1);
                        text-shadow: 0 0 20px rgba(99, 102, 241, 0.8);
                    }
                    40% {
                        transform: scale(1);
                        text-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
                    }
                    100% { 
                        transform: scale(1);
                        text-shadow: 0 0 0 rgba(99, 102, 241, 0);
                    }
                }
                
                .bpm-value.pulsing {
                    animation: bpmPulse 0.3s ease-out;
                }
            `;
            document.head.appendChild(style);
        }

        // Register beat callback
        this.metronome.onBeat((beat, isAccent) => {
            const bpmElement = document.getElementById('bpmValue');
            if (bpmElement && this.metronome.state.isPlaying) {
                // Remove and re-add the class to restart animation
                bpmElement.classList.remove('pulsing');
                void bpmElement.offsetWidth; // Trigger reflow
                bpmElement.classList.add('pulsing');

                // Remove class after animation completes
                setTimeout(() => {
                    bpmElement.classList.remove('pulsing');
                }, 300);
            }
        });
    }

    setupKeyboardShortcuts() {
        // Remove any existing keyboard handler to prevent duplicates
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
        }

        // Create keyboard shortcut handler
        this.keyboardHandler = (e) => {
            // Don't handle shortcuts when typing in input fields
            if (
                e.target.tagName === 'INPUT' ||
                e.target.tagName === 'TEXTAREA' ||
                e.target.isContentEditable
            ) {
                return;
            }

            // Space bar - Play/Pause timer and current audio/metronome
            if (e.code === 'Space') {
                e.preventDefault();
                const playPauseBtn = document.getElementById('playPauseBtn');
                if (playPauseBtn) {
                    playPauseBtn.click();
                }
            }

            // M key - Toggle metronome
            else if (e.key.toLowerCase() === 'm' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                if (this.currentMode === 'metronome') {
                    const metronomePlayBtn = document.getElementById('metronomePlay');
                    if (metronomePlayBtn) {
                        metronomePlayBtn.click();
                    }
                }
            }

            // L key - Set loop points in audio
            else if (e.key.toLowerCase() === 'l' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                if (this.currentMode === 'audio') {
                    const loopToggleBtn = document.getElementById('loopToggleBtn');
                    if (loopToggleBtn) {
                        loopToggleBtn.click();
                    }
                } else if (this.currentMode === 'youtube') {
                    const youtubeLoopEnabled = document.getElementById('youtubeLoopEnabled');
                    if (youtubeLoopEnabled) {
                        youtubeLoopEnabled.checked = !youtubeLoopEnabled.checked;
                        youtubeLoopEnabled.dispatchEvent(new Event('change'));
                    }
                }
            }

            // Arrow Up/Down - Adjust BPM
            else if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
                if (this.currentMode === 'metronome') {
                    e.preventDefault();
                    const bpmSlider = document.getElementById('bpmSlider');
                    if (bpmSlider) {
                        const currentValue = parseInt(bpmSlider.value);
                        const step = e.shiftKey ? 10 : 1; // Hold shift for larger steps
                        const newValue =
                            e.code === 'ArrowUp'
                                ? Math.min(currentValue + step, 250)
                                : Math.max(currentValue - step, 30);
                        bpmSlider.value = newValue;
                        bpmSlider.dispatchEvent(new Event('input'));
                    }
                }
            }

            // Number keys 1-9 - Quick BPM presets
            else if (e.key >= '1' && e.key <= '9' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                if (this.currentMode === 'metronome') {
                    e.preventDefault();
                    const presets = [60, 80, 100, 120, 140, 160, 180, 200, 220];
                    const presetIndex = parseInt(e.key) - 1;
                    const bpmSlider = document.getElementById('bpmSlider');
                    if (bpmSlider && presets[presetIndex]) {
                        bpmSlider.value = presets[presetIndex];
                        bpmSlider.dispatchEvent(new Event('input'));
                    }
                }
            }

            // L key - Toggle loop for YouTube
            else if (e.code === 'KeyL') {
                if (this.currentMode === 'youtube') {
                    e.preventDefault();
                    const loopToggleBtn = document.getElementById('youtubeLoopToggleBtn');
                    if (loopToggleBtn) {
                        loopToggleBtn.click();
                    }
                }
            }

            // Escape key - Close modals
            else if (e.key === 'Escape' || e.key === 'Esc') {
                // Close any open modals
                const modals = document.querySelectorAll('.modal-overlay, .practice-log-modal');
                modals.forEach((modal) => {
                    const closeBtn = modal.querySelector('.btn-secondary');
                    if (closeBtn) {
                        closeBtn.click();
                    } else {
                        modal.remove();
                    }
                });
            }
        };

        // Attach keyboard handler
        document.addEventListener('keydown', this.keyboardHandler);

        // Add visual keyboard shortcut guide
        this.addKeyboardShortcutGuide();
    }

    addKeyboardShortcutGuide() {
        // Check if guide already exists
        if (document.getElementById('keyboard-shortcuts-guide')) {
            return;
        }

        // Create keyboard shortcuts guide button
        const guideButton = document.createElement('button');
        guideButton.id = 'keyboard-shortcuts-toggle';
        guideButton.className = 'keyboard-guide-btn';
        guideButton.innerHTML = '⌨️';
        guideButton.title = 'Keyboard Shortcuts';
        guideButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--bg-card, #374151);
            border: 1px solid var(--border, #4b5563);
            color: var(--text-primary, #e5e7eb);
            cursor: pointer;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            transition: all 0.2s;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        `;

        // Create shortcuts guide panel
        const guidePanel = document.createElement('div');
        guidePanel.id = 'keyboard-shortcuts-guide';
        guidePanel.className = 'keyboard-shortcuts-panel';
        guidePanel.style.cssText = `
            position: fixed;
            bottom: 70px;
            right: 20px;
            width: 300px;
            background: var(--bg-card, #374151);
            border: 1px solid var(--border, #4b5563);
            border-radius: 12px;
            padding: 20px;
            z-index: 999;
            display: none;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        `;

        guidePanel.innerHTML = `
            <h3 style="margin: 0 0 15px 0; font-size: 16px; color: var(--text-primary);">
                Keyboard Shortcuts
            </h3>
            <div class="shortcuts-list" style="font-size: 14px; line-height: 1.8;">
                <div class="shortcut-item" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: var(--text-secondary);">Play/Pause</span>
                    <kbd style="background: var(--bg-dark); padding: 2px 8px; border-radius: 4px; font-family: monospace;">Space</kbd>
                </div>
                <div class="shortcut-item" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: var(--text-secondary);">Toggle Metronome</span>
                    <kbd style="background: var(--bg-dark); padding: 2px 8px; border-radius: 4px; font-family: monospace;">M</kbd>
                </div>
                <div class="shortcut-item" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: var(--text-secondary);">Toggle Loop</span>
                    <kbd style="background: var(--bg-dark); padding: 2px 8px; border-radius: 4px; font-family: monospace;">L</kbd>
                </div>
                <div class="shortcut-item" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: var(--text-secondary);">BPM Up/Down</span>
                    <kbd style="background: var(--bg-dark); padding: 2px 8px; border-radius: 4px; font-family: monospace;">↑ ↓</kbd>
                </div>
                <div class="shortcut-item" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: var(--text-secondary);">BPM Presets</span>
                    <kbd style="background: var(--bg-dark); padding: 2px 8px; border-radius: 4px; font-family: monospace;">1-9</kbd>
                </div>
                <div class="shortcut-item" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: var(--text-secondary);">Close Modals</span>
                    <kbd style="background: var(--bg-dark); padding: 2px 8px; border-radius: 4px; font-family: monospace;">Esc</kbd>
                </div>
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); font-size: 12px; color: var(--text-secondary);">
                    <div>• Hold Shift with ↑↓ for ±10 BPM</div>
                    <div>• Number keys: 1=60, 2=80, 3=100...</div>
                </div>
            </div>
        `;

        // Toggle guide visibility
        guideButton.addEventListener('click', () => {
            const isVisible = guidePanel.style.display === 'block';
            guidePanel.style.display = isVisible ? 'none' : 'block';
            guideButton.style.transform = isVisible ? '' : 'scale(1.1)';
        });

        // Close guide when clicking outside
        document.addEventListener('click', (e) => {
            if (!guideButton.contains(e.target) && !guidePanel.contains(e.target)) {
                guidePanel.style.display = 'none';
                guideButton.style.transform = '';
            }
        });

        // Append to document
        document.body.appendChild(guideButton);
        document.body.appendChild(guidePanel);
    }

    checkAudioInitialization() {
        // Check if audio context is already initialized
        if (
            this.audioService &&
            this.audioService.audioContext &&
            this.audioService.audioContext.state === 'running'
        ) {
            this.metronome.audioReady = true;
            return;
        }

        // Create a subtle prompt that appears above the metronome
        const promptDiv = document.createElement('div');
        promptDiv.className = 'audio-init-prompt';
        promptDiv.style.cssText = `
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--primary, #6366f1);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 1000;
            cursor: pointer;
            animation: pulse 2s infinite;
            box-shadow: 0 2px 10px rgba(99, 102, 241, 0.3);
        `;
        promptDiv.innerHTML = '🎵 Click anywhere to enable audio';

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { opacity: 0.8; transform: translateX(-50%) scale(1); }
                50% { opacity: 1; transform: translateX(-50%) scale(1.05); }
                100% { opacity: 0.8; transform: translateX(-50%) scale(1); }
            }
        `;
        document.head.appendChild(style);

        // Find the metronome panel and add the prompt
        const metronomePanel = document.getElementById('metronomePanel');
        if (metronomePanel) {
            metronomePanel.style.position = 'relative';
            metronomePanel.appendChild(promptDiv);
        }

        // Remove prompt once audio is initialized
        const removePrompt = () => {
            promptDiv.remove();
            style.remove();
        };

        // Enhanced click handler that initializes audio and removes prompt
        const initAudio = async () => {
            if (this.audioService) {
                this.audioService.userGestureReceived = true;
                await this.audioService.initializeAudioContext();

                if (this.metronome) {
                    this.metronome.audioReady = true;
                }

                removePrompt();
                document.removeEventListener('click', initAudio);
            }
        };

        // Add click listener
        document.addEventListener('click', initAudio);

        // Also remove the prompt if clicked directly
        promptDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            initAudio();
        });
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
                const userConfirmed = confirm(
                    'Stopping will reset the timer. Do you want to save your session first?'
                );

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

        // Sync checkbox change handler
        syncCheckbox?.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            // Update audio player sync setting
            if (this.audioPlayer) {
                this.audioPlayer.setSyncWithTimer(isChecked);
            }
            // Update YouTube player sync setting
            if (this.youtubePlayer) {
                this.youtubePlayer.syncWithTimer = isChecked;
            }
            // Save preference
            localStorage.setItem('timerSyncWithAudio', isChecked ? 'true' : 'false');
        });

        // Save session button
        const saveBtn = document.getElementById('saveSessionBtn');
        saveBtn?.addEventListener('click', async () => {
            const duration = this.timer.getElapsedTime();
            if (duration > 0) {
                if (this.timer.isRunning) {
                    this.timer.pause();
                    this.uiController.updateTimerControls(false);
                }
                this.stopAllPlayback();
                this.showSaveSessionPopup(duration);
            } else {
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
        document.getElementById('soundSelect')?.addEventListener('change', async (e) => {
            await this.metronome.setSound(e.target.value);
            // No need to save to localStorage - metronome.setSound handles it
        });

        // Accent pattern
        document.querySelectorAll('.accent-btn').forEach((btn) => {
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
                    startBpm: parseInt(
                        document.getElementById('progressionStartBpm')?.value || 120
                    ),
                    endBpm: parseInt(document.getElementById('progressionEndBpm')?.value || 140),
                    increment: parseInt(
                        document.getElementById('progressionIncrement')?.value || 5
                    ),
                    measuresPerStep: parseInt(
                        document.getElementById('progressionMeasures')?.value || 4
                    ),
                    currentMeasure: 0
                    // Don't set currentBpm here - let the metronome set it to startBpm when it starts
                };
                // Show the progression status if metronome is playing
                if (this.metronome.state.isPlaying) {
                    const statusDiv = document.getElementById('tempoProgressionStatus');
                    if (statusDiv) {
                        statusDiv.style.display = 'block';
                        document.getElementById('currentMeasure').textContent = '0';
                        document.getElementById('measuresPerStep').textContent =
                            this.metronome.state.tempoProgression.measuresPerStep;
                        document.getElementById('currentProgressBpm').textContent =
                            this.metronome.state.tempoProgression.startBpm;
                        document.getElementById('targetProgressBpm').textContent =
                            this.metronome.state.tempoProgression.endBpm;
                    }
                }
            } else {
                this.metronome.state.tempoProgression = { enabled: false };
                // Hide the progression status
                const statusDiv = document.getElementById('tempoProgressionStatus');
                if (statusDiv) {
                    statusDiv.style.display = 'none';
                }
            }
        });

        // Update tempo progression when input values change
        const updateTempoProgression = () => {
            if (this.metronome.state.tempoProgression?.enabled) {
                this.metronome.state.tempoProgression.startBpm = parseInt(
                    document.getElementById('progressionStartBpm')?.value || 60
                );
                this.metronome.state.tempoProgression.endBpm = parseInt(
                    document.getElementById('progressionEndBpm')?.value || 100
                );
                this.metronome.state.tempoProgression.increment = parseInt(
                    document.getElementById('progressionIncrement')?.value || 5
                );
                this.metronome.state.tempoProgression.measuresPerStep = parseInt(
                    document.getElementById('progressionMeasures')?.value || 4
                );

                // Update display if visible
                const statusDiv = document.getElementById('tempoProgressionStatus');
                if (statusDiv && statusDiv.style.display !== 'none') {
                    document.getElementById('targetProgressBpm').textContent =
                        this.metronome.state.tempoProgression.endBpm;
                }
            }
        };

        document
            .getElementById('progressionStartBpm')
            ?.addEventListener('change', updateTempoProgression);
        document
            .getElementById('progressionEndBpm')
            ?.addEventListener('change', updateTempoProgression);
        document
            .getElementById('progressionIncrement')
            ?.addEventListener('change', updateTempoProgression);
        document
            .getElementById('progressionMeasures')
            ?.addEventListener('change', updateTempoProgression);

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
            // Ensure AudioService registers this user gesture
            if (this.audioPlayer?.audioService) {
                this.audioPlayer.audioService.userGestureReceived = true;
            }
            this.audioPlayer.clear();
            if (fileInput) {
                fileInput.value = '';
                setTimeout(() => fileInput.click(), 50);
            }
        });

        fileInput?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                // Update sync setting before loading - check timer's sync state
                if (this.timer && this.timer.syncWithAudio !== undefined) {
                    this.audioPlayer.setSyncWithTimer(this.timer.syncWithAudio);
                    console.log(
                        'Audio: Setting syncWithTimer from timer.syncWithAudio:',
                        this.timer.syncWithAudio
                    );
                } else {
                    // Fallback to the syncMetronome checkbox
                    const syncCheckbox = document.getElementById('syncMetronome');
                    if (syncCheckbox) {
                        this.audioPlayer.setSyncWithTimer(syncCheckbox.checked);
                        console.log(
                            'Audio: Setting syncWithTimer from checkbox:',
                            syncCheckbox.checked
                        );
                    }
                }

                const success = await this.audioPlayer.loadFile(file);
                if (success) {
                    this.uiController.showAudioFileName(file.name);
                    // Update saved loops list when a new file is loaded
                    this.updateAudioSavedLoopsList();

                    // Initialize audio loop save functionality
                    this.initializeAudioLoopSaveFeature();
                }
            }
        });

        // Add event delegation for saved loops list
        document.getElementById('audioSavedLoopsList')?.addEventListener('click', (e) => {
            const loopItem = e.target.closest('.audio-loop-item');
            const deleteBtn = e.target.closest('.audio-loop-delete');
            const editBtn = e.target.closest('.audio-loop-edit');

            if (editBtn) {
                e.stopPropagation();
                const index = parseInt(editBtn.dataset.index);
                this.editAudioLoop(index);
            } else if (deleteBtn) {
                e.stopPropagation();
                const index = parseInt(deleteBtn.dataset.index);
                this.deleteAudioLoop(index);
            } else if (loopItem) {
                const index = parseInt(loopItem.dataset.index);
                this.loadAudioLoop(index);
            }
        });
    }

    attachYouTubeListeners() {
        const loadBtn = document.getElementById('loadYoutubeBtn');
        const urlInput = document.getElementById('youtubeUrl');

        loadBtn?.addEventListener('click', async () => {
            const url = urlInput?.value.trim();
            if (url) {
                // Show loading notification
                this.uiController.showNotification('Loading YouTube video...', 'info');

                try {
                    // Update sync setting before loading - check timer's sync state
                    if (this.timer && this.timer.syncWithAudio !== undefined) {
                        this.youtubePlayer.syncWithTimer = this.timer.syncWithAudio;
                        console.log(
                            'YouTube: Setting syncWithTimer from timer.syncWithAudio:',
                            this.timer.syncWithAudio
                        );
                    } else {
                        // Fallback to the syncMetronome checkbox
                        const syncCheckbox = document.getElementById('syncMetronome');
                        if (syncCheckbox) {
                            this.youtubePlayer.syncWithTimer = syncCheckbox.checked;
                            console.log(
                                'YouTube: Setting syncWithTimer from checkbox:',
                                syncCheckbox.checked
                            );
                        }
                    }

                    await this.youtubePlayer.loadVideo(url);
                    this.uiController.showYouTubePlayer();
                    this.initializeYouTubeUI();

                    // Ensure play button shows correct initial state
                    const playPauseBtn = document.getElementById('youtubePlayPauseBtn');
                    if (playPauseBtn) {
                        const iconPlay = playPauseBtn.querySelector('.icon-play');
                        const iconPause = playPauseBtn.querySelector('.icon-pause');
                        if (iconPlay) iconPlay.style.display = 'block';
                        if (iconPause) iconPause.style.display = 'none';
                    }
                } catch (error) {
                    // Only show error if it's not a postMessage origin error
                    // These errors are common when YouTube player is initializing
                    if (
                        !error.message?.includes('postMessage') &&
                        !error.message?.includes('origin')
                    ) {
                        console.error('YouTube load error:', error);
                        this.uiController.showNotification('Failed to load YouTube video', 'error');
                    }
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

        // Add resize button listener
        const resizeBtn = document.getElementById('youtubeResizeBtn');
        if (resizeBtn && !resizeBtn.hasAttribute('data-listener-attached')) {
            resizeBtn.setAttribute('data-listener-attached', 'true');
            // Function to toggle video size
            const toggleVideoSize = (expand) => {
                const playerContainer = document.getElementById('youtubePlayer').parentElement;
                const youtubePlayer = document.getElementById('youtubePlayer');
                const resizeText = resizeBtn.querySelector('.resize-text');
                const modePanels = document.querySelector('.mode-panels');
                const youtubePlayerWrapper = document.getElementById('youtubePlayerWrapper');

                if (playerContainer && youtubePlayer) {
                    if (!expand) {
                        // Restore normal size
                        playerContainer.removeAttribute('data-expanded');
                        // Reset all styles completely
                        playerContainer.removeAttribute('style');
                        playerContainer.style.position = 'relative';

                        // Reset YouTube player with important to override any lingering styles
                        youtubePlayer.removeAttribute('style');
                        youtubePlayer.style.cssText =
                            'width: 100% !important; aspect-ratio: 16/9 !important; background: #000; border-radius: 8px; margin-bottom: 1rem; overflow: hidden; transition: all 0.3s ease; height: auto !important;';

                        // Reset the wrapper completely
                        if (youtubePlayerWrapper) {
                            youtubePlayerWrapper.removeAttribute('style');
                            youtubePlayerWrapper.style.display = 'block';
                        }

                        // Find and reset ALL parent containers up to the mode panel
                        let parent = playerContainer.parentElement;
                        while (parent && !parent.classList.contains('mode-panel')) {
                            parent.style.height = '';
                            parent.style.minHeight = '';
                            parent.style.maxHeight = '';
                            parent = parent.parentElement;
                        }

                        // Restore normal layout for panels
                        if (modePanels) {
                            modePanels.removeAttribute('style');
                        }

                        if (resizeText) resizeText.textContent = 'Expand';

                        // Remove ESC key handler
                        if (this.youtubeEscHandler) {
                            document.removeEventListener('keydown', this.youtubeEscHandler);
                            this.youtubeEscHandler = null;
                        }

                        // Force a reflow to ensure styles are applied
                        youtubePlayer.offsetHeight;
                    } else {
                        // Expand video
                        playerContainer.setAttribute('data-expanded', 'true');

                        // Set fixed positioning for the video container
                        playerContainer.style.cssText = `
                            position: fixed;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            width: 90vw;
                            max-width: 1600px;
                            z-index: 100;
                            background: var(--bg-dark, #1a1a1a);
                            padding: 20px;
                            border-radius: 12px;
                            box-shadow: 0 10px 50px rgba(0,0,0,0.5);
                        `;

                        // Expand the video player itself
                        const newHeight = Math.min(
                            window.innerWidth * 0.9 * (9 / 16),
                            window.innerHeight * 0.8
                        );
                        youtubePlayer.style.cssText = `
                            width: 100%;
                            height: ${newHeight}px;
                            background: #000;
                            border-radius: 8px;
                            overflow: hidden;
                        `;

                        // Add a semi-transparent backdrop
                        if (modePanels) {
                            modePanels.style.cssText = 'position: relative; z-index: 1;';
                        }

                        if (resizeText) resizeText.textContent = 'Shrink';

                        // Add ESC key handler for expanded state
                        this.youtubeEscHandler = (e) => {
                            if (
                                e.key === 'Escape' &&
                                playerContainer.hasAttribute('data-expanded')
                            ) {
                                e.stopPropagation(); // Prevent other ESC handlers
                                toggleVideoSize(false);
                            }
                        };
                        document.addEventListener('keydown', this.youtubeEscHandler);
                    }

                    // Force YouTube iframe to resize
                    if (
                        this.youtubePlayer &&
                        this.youtubePlayer.player &&
                        this.youtubePlayer.player.setSize
                    ) {
                        setTimeout(() => {
                            const width = youtubePlayer.offsetWidth;
                            const height = youtubePlayer.offsetHeight;
                            this.youtubePlayer.player.setSize(width, height);
                        }, 100);
                    }
                }
            };

            resizeBtn.addEventListener('click', () => {
                const playerContainer = document.getElementById('youtubePlayer').parentElement;
                const isExpanded = playerContainer && playerContainer.hasAttribute('data-expanded');
                toggleVideoSize(!isExpanded);
            });
        }

        // Draw YouTube waveform visualization
        this.drawYouTubeWaveform();

        // Load and display saved loops for this video
        // Add a small delay to ensure the player is ready
        setTimeout(async () => {
            await this.updateSavedLoopsList();
        }, 500);

        // Also update when player is fully ready
        if (this.youtubePlayer && this.youtubePlayer.player) {
            const originalStateChange = this.youtubePlayer.onPlayerStateChange.bind(
                this.youtubePlayer
            );
            this.youtubePlayer.onPlayerStateChange = async (event) => {
                originalStateChange(event);
                // Update loops list when video is cued (5) or unstarted (-1)
                if (event.data === 5 || event.data === -1) {
                    await this.updateSavedLoopsList();
                }
            };
        }
    }

    drawYouTubeWaveform() {
        const canvas = document.getElementById('youtubeWaveformCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = (canvas.width = canvas.offsetWidth);
        const height = (canvas.height = canvas.offsetHeight);

        // Store dimensions for position updates
        this.youtubeWaveformDimensions = { width, height };

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw a simple waveform visualization
        const barCount = 100;
        const barWidth = width / barCount;
        const barGap = 1;

        ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';

        for (let i = 0; i < barCount; i++) {
            // Create a simple wave pattern
            const barHeight = (Math.sin(i * 0.1) * 0.3 + 0.7) * height * 0.8;
            const x = i * barWidth;
            const y = (height - barHeight) / 2;

            ctx.fillRect(x + barGap / 2, y, barWidth - barGap, barHeight);
        }

        // Add click handler for seeking
        if (!canvas.hasAttribute('data-click-handler')) {
            canvas.setAttribute('data-click-handler', 'true');
            canvas.addEventListener('click', (e) => {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const clickPercent = x / width;

                if (this.youtubePlayer && this.youtubePlayer.player) {
                    const duration = this.youtubePlayer.getDuration();
                    const seekTime = clickPercent * duration;

                    // Simply seek to the clicked position without affecting play state
                    this.youtubePlayer.seekTo(seekTime);

                    // Immediately update the position line
                    this.updateYouTubeWaveformPosition(seekTime, duration);
                }
            });

            // Change cursor on hover
            canvas.style.cursor = 'pointer';
        }

        // Draw loop markers
        this.drawYouTubeLoopMarkers(ctx, width, height);

        // Draw current playback position
        if (this.youtubePlayer && this.youtubePlayer.player) {
            const currentTime = this.youtubePlayer.getCurrentTime();
            const duration = this.youtubePlayer.getDuration();
            this.drawYouTubePlaybackPosition(ctx, currentTime, duration, width, height);
        }
    }

    drawYouTubeLoopMarkers(ctx, width, height) {
        if (!this.youtubePlayer) return;

        const duration = this.youtubePlayer.getDuration();
        if (duration <= 0) return;

        // Draw loop start marker if set
        if (this.youtubePlayer.loopStart !== null) {
            const loopStartX = (this.youtubePlayer.loopStart / duration) * width;

            // Draw loop start marker (green)
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(loopStartX, 0);
            ctx.lineTo(loopStartX, height);
            ctx.stroke();
        }

        // Draw loop end marker if set
        if (this.youtubePlayer.loopEnd !== null) {
            const loopEndX = (this.youtubePlayer.loopEnd / duration) * width;

            // Draw loop end marker (red)
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(loopEndX, 0);
            ctx.lineTo(loopEndX, height);
            ctx.stroke();
        }

        // Draw loop region if both markers are set
        if (this.youtubePlayer.loopStart !== null && this.youtubePlayer.loopEnd !== null) {
            const loopStartX = (this.youtubePlayer.loopStart / duration) * width;
            const loopEndX = (this.youtubePlayer.loopEnd / duration) * width;

            // Draw loop region
            ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
            ctx.fillRect(loopStartX, 0, loopEndX - loopStartX, height);
        }
    }

    drawYouTubePlaybackPosition(ctx, currentTime, duration, width, height) {
        if (duration > 0) {
            const posX = (currentTime / duration) * width;

            // Draw position line
            ctx.strokeStyle = 'rgba(229, 231, 235, 0.8)'; // Light grey line for current position
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(posX, 0);
            ctx.lineTo(posX, height);
            ctx.stroke();
        }
    }

    updateYouTubeWaveformPosition(currentTime, duration) {
        const canvas = document.getElementById('youtubeWaveformCanvas');
        if (!canvas || !this.youtubeWaveformDimensions) return;

        const ctx = canvas.getContext('2d');
        const { width, height } = this.youtubeWaveformDimensions;

        // Redraw the waveform
        this.drawYouTubeWaveform();
    }

    attachYouTubeControlListeners() {
        // Play/Pause
        const playPauseBtn = document.getElementById('youtubePlayPauseBtn');
        playPauseBtn?.addEventListener('click', () => {
            const iconPlay = playPauseBtn.querySelector('.icon-play');
            const iconPause = playPauseBtn.querySelector('.icon-pause');

            // Check if player is ready and get current state
            if (this.youtubePlayer.player && this.youtubePlayer.ready) {
                try {
                    const playerState = this.youtubePlayer.player.getPlayerState();

                    if (playerState === 1) {
                        // 1 = YT.PlayerState.PLAYING
                        this.youtubePlayer.pause();
                        iconPlay.style.display = 'block';
                        iconPause.style.display = 'none';
                    } else {
                        this.youtubePlayer.play();
                        iconPlay.style.display = 'none';
                        iconPause.style.display = 'block';
                    }
                } catch (e) {
                    console.error('Error toggling play/pause:', e);
                }
            }
        });

        // Stop
        document.getElementById('youtubeStopBtn')?.addEventListener('click', () => {
            this.youtubePlayer.stop();
            const playPauseBtn = document.getElementById('youtubePlayPauseBtn');
            const iconPlay = playPauseBtn?.querySelector('.icon-play');
            const iconPause = playPauseBtn?.querySelector('.icon-pause');
            if (iconPlay) iconPlay.style.display = 'block';
            if (iconPause) iconPause.style.display = 'none';
        });

        // Loop controls (in main control area)
        document.getElementById('youtubeLoopStartBtn')?.addEventListener('click', () => {
            const time = this.youtubePlayer.getCurrentTime();

            // If setting start after current end, clear the loop and make this the new start
            if (this.youtubePlayer.loopEnd !== null && time > this.youtubePlayer.loopEnd) {
                this.youtubePlayer.loopEnd = null;
                document.getElementById('youtubeLoopEndTime').textContent = '--:--';
            }

            this.youtubePlayer.loopStart = time;
            document.getElementById('youtubeLoopStartTime').textContent = this.formatTime(time);
            this.updateYouTubeLoopInfo();
            this.drawYouTubeWaveform();
        });

        document.getElementById('youtubeLoopEndBtn')?.addEventListener('click', () => {
            const time = this.youtubePlayer.getCurrentTime();

            // If setting end before current start, clear the loop and make this the new start
            if (this.youtubePlayer.loopStart !== null && time < this.youtubePlayer.loopStart) {
                this.youtubePlayer.loopStart = time;
                this.youtubePlayer.loopEnd = null;
                document.getElementById('youtubeLoopStartTime').textContent = this.formatTime(time);
                document.getElementById('youtubeLoopEndTime').textContent = '--:--';
            } else {
                this.youtubePlayer.loopEnd = time;
                document.getElementById('youtubeLoopEndTime').textContent = this.formatTime(time);
            }

            this.updateYouTubeLoopInfo();
            this.drawYouTubeWaveform();
        });

        document.getElementById('youtubeLoopToggleBtn')?.addEventListener('click', () => {
            const isLooping = !this.youtubePlayer.looping;
            this.youtubePlayer.setLooping(isLooping);
            const toggleBtn = document.getElementById('youtubeLoopToggleBtn');
            if (toggleBtn) {
                toggleBtn.style.background = isLooping
                    ? 'var(--primary, #6366f1)'
                    : 'var(--bg-card, #374151)';
            }

            // Show/hide speed progression status if enabled
            if (this.youtubePlayer.speedProgression?.enabled) {
                const statusDiv = document.getElementById('youtubeSpeedProgressionStatus');
                if (statusDiv) {
                    if (isLooping) {
                        statusDiv.style.display = 'block';
                        document.getElementById('youtubeCurrentLoop').textContent = '0';
                        document.getElementById('youtubeLoopsPerStep').textContent =
                            this.youtubePlayer.speedProgression.loopsPerStep;
                        document.getElementById('youtubeCurrentProgressSpeed').textContent =
                            Math.round(this.youtubePlayer.playbackRate * 100);
                        document.getElementById('youtubeTargetProgressSpeed').textContent =
                            this.youtubePlayer.speedProgression.endSpeed;
                    } else {
                        statusDiv.style.display = 'none';
                    }
                }
            }
        });

        document.getElementById('youtubeLoopClearBtn')?.addEventListener('click', () => {
            this.youtubePlayer.clearLoop();
            document.getElementById('youtubeLoopStartTime').textContent = '--:--';
            document.getElementById('youtubeLoopEndTime').textContent = '--:--';
            document.getElementById('youtubeLoopInfo').style.display = 'none';
            const toggleBtn = document.getElementById('youtubeLoopToggleBtn');
            if (toggleBtn) {
                toggleBtn.style.background = 'var(--bg-card, #374151)';
            }
            this.drawYouTubeWaveform();
        });

        // Speed control
        const speedSlider = document.getElementById('youtubeSpeedSlider');
        speedSlider?.addEventListener('input', (e) => {
            const speed = parseInt(e.target.value) / 100;
            this.youtubePlayer.setSpeed(speed);
            document.getElementById('youtubeSpeedValue').textContent = `${e.target.value}%`;
        });

        // Speed reset button
        document.getElementById('youtubeResetSpeed')?.addEventListener('click', () => {
            const slider = document.getElementById('youtubeSpeedSlider');
            slider.value = 100;
            this.youtubePlayer.setSpeed(1.0);
            document.getElementById('youtubeSpeedValue').textContent = '100%';
        });

        // Pitch controls (disabled for YouTube)
        const currentPitch = 0;

        document.getElementById('youtubePitchDown')?.addEventListener('click', () => {
            // Pitch is disabled for YouTube
        });

        document.getElementById('youtubePitchUp')?.addEventListener('click', () => {
            // Pitch is disabled for YouTube
        });

        document.getElementById('youtubeResetPitch')?.addEventListener('click', () => {
            // Pitch is disabled for YouTube
        });

        // Pitch info button
        document.getElementById('youtubePitchInfo')?.addEventListener('click', () => {
            this.uiController.showNotification(
                'Pitch control requires the Transpose Chrome Extension for YouTube videos',
                'info'
            );
        });

        // Removed duplicate loop controls event listeners - now using only the main control buttons

        // Save loop
        document.getElementById('youtubeSaveLoopBtn')?.addEventListener('click', () => {
            this.showSaveLoopModal();
        });

        // Add event delegation for saved loops list
        document.getElementById('youtubeSavedLoopsList')?.addEventListener('click', (e) => {
            const loopItem = e.target.closest('.youtube-loop-item');
            const deleteBtn = e.target.closest('.youtube-loop-delete');
            const editBtn = e.target.closest('.youtube-loop-edit');

            if (editBtn) {
                e.stopPropagation();
                const index = parseInt(editBtn.dataset.index);
                this.editYouTubeLoop(index);
            } else if (deleteBtn) {
                e.stopPropagation();
                const index = parseInt(deleteBtn.dataset.index);
                this.deleteYouTubeLoop(index);
            } else if (loopItem) {
                const index = parseInt(loopItem.dataset.index);
                this.loadYouTubeLoop(index);
            }
        });

        // Speed Progression
        const speedProgressionCheckbox = document.getElementById('youtubeSpeedProgressionEnabled');
        const speedProgressionControls = document.querySelector(
            '.youtube-speed-progression-controls'
        );

        speedProgressionCheckbox?.addEventListener('change', (e) => {
            if (speedProgressionControls) {
                speedProgressionControls.style.display = e.target.checked ? 'block' : 'none';
            }

            if (e.target.checked) {
                this.youtubePlayer.speedProgression = {
                    enabled: true,
                    startSpeed: parseInt(
                        document.getElementById('youtubeProgressionStartSpeed')?.value || 80
                    ),
                    endSpeed: parseInt(
                        document.getElementById('youtubeProgressionEndSpeed')?.value || 100
                    ),
                    increment: parseInt(
                        document.getElementById('youtubeProgressionIncrement')?.value || 5
                    ),
                    loopsPerStep: parseInt(
                        document.getElementById('youtubeProgressionLoops')?.value || 4
                    ),
                    currentLoop: 0
                };

                // Show the progression status if loop is active
                if (this.youtubePlayer.looping) {
                    const statusDiv = document.getElementById('youtubeSpeedProgressionStatus');
                    if (statusDiv) {
                        statusDiv.style.display = 'block';
                        document.getElementById('youtubeCurrentLoop').textContent = '0';
                        document.getElementById('youtubeLoopsPerStep').textContent =
                            this.youtubePlayer.speedProgression.loopsPerStep;
                        document.getElementById('youtubeCurrentProgressSpeed').textContent =
                            this.youtubePlayer.speedProgression.startSpeed;
                        document.getElementById('youtubeTargetProgressSpeed').textContent =
                            this.youtubePlayer.speedProgression.endSpeed;
                    }
                }
            } else {
                this.youtubePlayer.speedProgression = { enabled: false };
                // Hide the progression status
                const statusDiv = document.getElementById('youtubeSpeedProgressionStatus');
                if (statusDiv) {
                    statusDiv.style.display = 'none';
                }
            }
        });

        // Update speed progression when input values change
        const updateSpeedProgression = () => {
            if (this.youtubePlayer.speedProgression?.enabled) {
                this.youtubePlayer.speedProgression.startSpeed = parseInt(
                    document.getElementById('youtubeProgressionStartSpeed')?.value || 80
                );
                this.youtubePlayer.speedProgression.endSpeed = parseInt(
                    document.getElementById('youtubeProgressionEndSpeed')?.value || 100
                );
                this.youtubePlayer.speedProgression.increment = parseInt(
                    document.getElementById('youtubeProgressionIncrement')?.value || 5
                );
                this.youtubePlayer.speedProgression.loopsPerStep = parseInt(
                    document.getElementById('youtubeProgressionLoops')?.value || 4
                );

                // Update display if visible
                const statusDiv = document.getElementById('youtubeSpeedProgressionStatus');
                if (statusDiv && statusDiv.style.display !== 'none') {
                    document.getElementById('youtubeTargetProgressSpeed').textContent =
                        this.youtubePlayer.speedProgression.endSpeed;
                }
            }
        };

        document
            .getElementById('youtubeProgressionStartSpeed')
            ?.addEventListener('change', updateSpeedProgression);
        document
            .getElementById('youtubeProgressionEndSpeed')
            ?.addEventListener('change', updateSpeedProgression);
        document
            .getElementById('youtubeProgressionIncrement')
            ?.addEventListener('change', updateSpeedProgression);
        document
            .getElementById('youtubeProgressionLoops')
            ?.addEventListener('change', updateSpeedProgression);
    }

    updateYouTubeUI(state) {
        // Update progress
        const progressFill = document.getElementById('youtubeProgressFill');
        if (progressFill && state.duration > 0) {
            progressFill.style.width = `${(state.currentTime / state.duration) * 100}%`;
        }

        // Update time display
        document.getElementById('youtubeCurrentTime').textContent = this.formatTime(
            state.currentTime
        );
        document.getElementById('youtubeDuration').textContent = this.formatTime(state.duration);

        // Update play/pause button state
        const playPauseBtn = document.getElementById('youtubePlayPauseBtn');
        if (playPauseBtn) {
            const iconPlay = playPauseBtn.querySelector('.icon-play');
            const iconPause = playPauseBtn.querySelector('.icon-pause');

            if (state.isPlaying) {
                if (iconPlay) iconPlay.style.display = 'none';
                if (iconPause) iconPause.style.display = 'block';
            } else {
                if (iconPlay) iconPlay.style.display = 'block';
                if (iconPause) iconPause.style.display = 'none';
            }
        }

        // Update waveform position immediately
        this.updateYouTubeWaveformPosition(state.currentTime, state.duration);
    }

    updateYouTubeLoopInfo() {
        const loopInfo = document.getElementById('youtubeLoopInfo');
        const saveBtn = document.getElementById('youtubeSaveLoopBtn');

        // Update all elements with loop time info (there might be multiple)
        const allStartTimeElements = document.querySelectorAll('[id="youtubeLoopStartTime"]');
        const allEndTimeElements = document.querySelectorAll('[id="youtubeLoopEndTime"]');

        if (this.youtubePlayer.loopStart !== null && this.youtubePlayer.loopEnd !== null) {
            if (loopInfo) loopInfo.style.display = 'block';

            // Update all instances of loop times
            allStartTimeElements.forEach((el) => {
                el.textContent = this.formatTime(this.youtubePlayer.loopStart);
            });
            allEndTimeElements.forEach((el) => {
                el.textContent = this.formatTime(this.youtubePlayer.loopEnd);
            });

            const duration = this.youtubePlayer.loopEnd - this.youtubePlayer.loopStart;
            const durationEl = document.getElementById('youtubeLoopDuration');
            if (durationEl) {
                durationEl.textContent = `(${this.formatTime(duration)})`;
            }

            // Show save button when we have a valid loop
            if (saveBtn) {
                saveBtn.style.display = 'inline-block';
                console.log('Showing YouTube save loop button');
            } else {
                console.log('YouTube save loop button not found!');
            }
        } else {
            if (loopInfo) loopInfo.style.display = 'none';

            // Reset all instances
            allStartTimeElements.forEach((el) => {
                el.textContent = '--:--';
            });
            allEndTimeElements.forEach((el) => {
                el.textContent = '--:--';
            });

            // Hide save button when no loop
            if (saveBtn) {
                saveBtn.style.display = 'none';
            }
        }
    }

    updateTimerDisplay() {
        const timeString = this.timer.getFormattedTime();
        this.uiController.updateTimerDisplay(timeString);

        // Show/hide save button
        const totalSeconds = this.timer.getElapsedTime();
        this.uiController.showSaveButton(totalSeconds > 0);
    }

    startMetronome() {
        // Update tempo progression values before starting
        if (this.metronome.state.tempoProgression?.enabled) {
            this.metronome.state.tempoProgression.startBpm = parseInt(
                document.getElementById('progressionStartBpm')?.value || 60
            );
            this.metronome.state.tempoProgression.endBpm = parseInt(
                document.getElementById('progressionEndBpm')?.value || 100
            );
            this.metronome.state.tempoProgression.increment = parseInt(
                document.getElementById('progressionIncrement')?.value || 5
            );
            this.metronome.state.tempoProgression.measuresPerStep = parseInt(
                document.getElementById('progressionMeasures')?.value || 4
            );
        }

        this.metronome.start(() => {
            if (this.uiController.getElement('syncCheckbox')?.checked && !this.timer.isRunning) {
                this.timer.start();
                this.uiController.updateTimerControls(true);
            }
        });
        this.uiController.updateMetronomeControls(true);

        // Show tempo progression status if enabled
        if (this.metronome.state.tempoProgression?.enabled) {
            const statusDiv = document.getElementById('tempoProgressionStatus');
            if (statusDiv) {
                statusDiv.style.display = 'block';
                const prog = this.metronome.state.tempoProgression;
                console.log('Starting metronome with progression:', prog);
                document.getElementById('currentMeasure').textContent = '0';
                document.getElementById('measuresPerStep').textContent = prog.measuresPerStep;
                // Show the start BPM since that's what it will start at
                document.getElementById('currentProgressBpm').textContent = prog.startBpm;
                document.getElementById('targetProgressBpm').textContent = prog.endBpm;
            }
        }
    }

    stopMetronome() {
        this.metronome.stop();
        this.uiController.updateMetronomeControls(false);

        // Hide tempo progression status
        const statusDiv = document.getElementById('tempoProgressionStatus');
        if (statusDiv) {
            statusDiv.style.display = 'none';
        }
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
        this.tapTimeout = setTimeout(() => {
            this.tapTimes = [];
        }, 2000);
    }

    async showSaveSessionPopup(duration) {
        try {
            console.log('showSaveSessionPopup called with duration:', duration);

            // Check if uiController exists
            if (!this.uiController) {
                console.error('UIController not initialized!');
                return;
            }

            const modalContent = await this.renderSaveSessionModal(duration);
            // console.log('Modal content generated:', modalContent);

            const modal = this.uiController.showModal(modalContent, {
                onClose: () => {
                    // Resume timer if it was paused
                    if (!this.timer.isRunning && this.timer.elapsedTime > 0) {
                        this.timer.start();
                        this.uiController.updateTimerControls(true);
                    }
                }
            });

            console.log('Modal created:', modal);
            console.log('Modal in DOM:', document.body.contains(modal));
            console.log('Modal styles:', {
                display: modal.style.display,
                visibility: modal.style.visibility,
                opacity: modal.style.opacity,
                zIndex: modal.style.zIndex
            });

            // Attach save handlers
            this.attachSaveSessionHandlers(modal, duration);
        } catch (error) {
            console.error('Error in showSaveSessionPopup:', error);
            console.error('Error stack:', error.stack);
        }
    }

    async renderSaveSessionModal(duration) {
        const defaultName = this.sessionManager.generateSessionName();
        const formattedDuration = this.sessionManager.formatDuration(duration);

        // Get practice areas from storage service
        const practiceAreas = await this.storageService.getSessionAreas();

        // Get current media info
        let mediaInfo = '';
        let defaultPracticeArea = '';

        if (this.currentMode === 'audio' && this.audioPlayer.currentFileName) {
            const truncatedFileName =
                this.audioPlayer.currentFileName.length > 50
                    ? this.audioPlayer.currentFileName.substring(0, 47) + '...'
                    : this.audioPlayer.currentFileName;
            mediaInfo = `<p>Audio File: <strong>${truncatedFileName}</strong></p>`;
            // Try to find previous practice area for this file
            try {
                const previousSessions = (await this.storageService.getPracticeEntries()) || [];
                const previousSession = previousSessions.find(
                    (s) => s.audioFile === this.audioPlayer.currentFileName
                );
                if (previousSession?.practiceArea) {
                    defaultPracticeArea = previousSession.practiceArea;
                }
            } catch (e) {
                console.log('Could not load previous sessions:', e);
            }
        } else if (this.currentMode === 'youtube' && this.youtubePlayer.videoTitle) {
            const truncatedTitle =
                this.youtubePlayer.videoTitle.length > 50
                    ? this.youtubePlayer.videoTitle.substring(0, 47) + '...'
                    : this.youtubePlayer.videoTitle;
            const videoUrl = this.youtubePlayer.videoId
                ? `https://youtube.com/watch?v=${this.youtubePlayer.videoId}`
                : '';
            mediaInfo = `
                <p>YouTube: <strong>${truncatedTitle}</strong></p>
                ${videoUrl ? `<p style="font-size: 0.875rem; color: var(--text-secondary); word-break: break-all;">URL: ${videoUrl}</p>` : ''}
            `;
        }

        return `
            <h3>Save Practice Session</h3>
            <div class="save-session-form">
                <div class="session-info">
                    <p>Duration: <strong>${formattedDuration}</strong></p>
                    ${this.currentMode === 'metronome' ? `<p>BPM: <strong>${this.metronome.state.bpm}</strong></p>` : ''}
                    ${mediaInfo}
                </div>
                
                <div class="form-group">
                    <label for="sessionName">Session Name:</label>
                    <input type="text" id="sessionName" value="${defaultName}" 
                           placeholder="Enter session name..." 
                           style="width: 100%; padding: 8px; margin-top: 8px;">
                </div>
                
                <div class="form-group" style="margin-top: 12px;">
                    <label for="practiceArea">Practice Area:</label>
                    <select id="practiceArea" style="width: 100%; padding: 8px; margin-top: 8px;">
                        <option value="">Select practice area...</option>
                        ${practiceAreas
                            .map(
                                (area) =>
                                    `<option value="${area}" ${area === defaultPracticeArea ? 'selected' : ''}>${area}</option>`
                            )
                            .join('')}
                    </select>
                </div>
                
                <div class="form-group" style="margin-top: 12px;">
                    <label>Musical Key:</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 8px;">
                        <select id="sessionKeyNote" style="padding: 8px;">
                            <option value="">Key...</option>
                            <option value="C">C</option>
                            <option value="C#/Db">C# / Db</option>
                            <option value="D">D</option>
                            <option value="D#/Eb">D# / Eb</option>
                            <option value="E">E</option>
                            <option value="F">F</option>
                            <option value="F#/Gb">F# / Gb</option>
                            <option value="G">G</option>
                            <option value="G#/Ab">G# / Ab</option>
                            <option value="A">A</option>
                            <option value="A#/Bb">A# / Bb</option>
                            <option value="B">B</option>
                        </select>
                        <select id="sessionKeyType" style="padding: 8px;">
                            <option value="">Major/Minor...</option>
                            <option value="Major">Major</option>
                            <option value="Minor">Minor</option>
                        </select>
                        <select id="sessionKeyMode" style="padding: 8px;">
                            <option value="">Mode...</option>
                            <option value="Ionian">Ionian</option>
                            <option value="Dorian">Dorian</option>
                            <option value="Phrygian">Phrygian</option>
                            <option value="Lydian">Lydian</option>
                            <option value="Mixolydian">Mixolydian</option>
                            <option value="Aeolian">Aeolian</option>
                            <option value="Locrian">Locrian</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group" style="margin-top: 12px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="favoriteSession" style="width: auto; margin: 0;">
                        <span style="display: flex; align-items: center; gap: 4px;">
                            <span style="color: #facc15;">⭐</span>
                            Mark as favorite
                        </span>
                    </label>
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
        const practiceAreaSelect = modal.querySelector('#practiceArea');
        const keyNoteSelect = modal.querySelector('#sessionKeyNote');
        const keyTypeSelect = modal.querySelector('#sessionKeyType');
        const keyModeSelect = modal.querySelector('#sessionKeyMode');
        const favoriteCheckbox = modal.querySelector('#favoriteSession');
        const confirmBtn = modal.querySelector('#confirmSaveBtn');
        const cancelBtn = modal.querySelector('#cancelSaveBtn');

        confirmBtn?.addEventListener('click', async () => {
            // Collect all form data immediately
            const name = nameInput?.value.trim() || this.sessionManager.generateSessionName();
            const practiceArea = practiceAreaSelect?.value || '';

            // Combine key information
            const keyNote = keyNoteSelect?.value || '';
            const keyType = keyTypeSelect?.value || '';
            const keyMode = keyModeSelect?.value || '';
            let key = '';

            if (keyNote) {
                key = keyNote;
                if (keyType) {
                    key += ` ${keyType}`;
                }
                if (keyMode && keyMode !== 'Ionian' && keyMode !== 'Aeolian') {
                    key += ` ${keyMode}`;
                }
            }

            const isFavorite = favoriteCheckbox?.checked || false;
            
            // Close modal immediately for better UX
            modal.remove();
            this.uiController.isModalOpen = false;
            
            // Show quick saving notification
            this.uiController.showNotification('Saving session...', 'info');

            // Create enhanced session data
            const sessionData = {
                name,
                duration,
                date: new Date().toISOString(),
                practiceArea,
                key,
                mode: this.currentMode,
                isFavorite
            };

            // Add media-specific information
            if (this.currentMode === 'audio' && this.audioPlayer.currentFileName) {
                sessionData.audioFile = this.audioPlayer.currentFileName;
            } else if (this.currentMode === 'youtube') {
                if (this.youtubePlayer.videoTitle) {
                    sessionData.youtubeTitle = this.youtubePlayer.videoTitle.substring(0, 50);
                }
                if (this.youtubePlayer.videoId) {
                    sessionData.youtubeUrl = `https://youtube.com/watch?v=${this.youtubePlayer.videoId}`;
                }
            } else if (this.currentMode === 'metronome') {
                sessionData.bpm = this.metronome.state.bpm;
                sessionData.timeSignature = this.metronome.state.timeSignature;
            }

            // Add image data if present (but not thumbnail yet)
            if (this.imageManager.getCurrentImage()) {
                sessionData.sheetMusicImage = this.imageManager.getCurrentImage();
            }

            // Create the practice entry
            const practiceEntry = {
                ...sessionData,
                id: Date.now() + Math.random()
            };
            
            // Save with image but without thumbnail first for immediate response
            await this.storageService.savePracticeEntry(practiceEntry);
            
            // Process thumbnail in background if image is present
            if (practiceEntry.sheetMusicImage) {
                // Generate thumbnail asynchronously
                this.imageManager.generateThumbnail(
                    practiceEntry.sheetMusicImage,
                    200, // max width
                    200 // max height
                ).then(async (thumbnail) => {
                    practiceEntry.sheetMusicThumbnail = thumbnail;
                    // Update the entry with thumbnail
                    await this.storageService.updatePracticeEntry(practiceEntry.id, practiceEntry);
                }).catch(error => {
                    console.error('Failed to generate thumbnail:', error);
                    // Still save without thumbnail
                });
            }

            const session = practiceEntry;

            if (session && this.onSaveCallback) {
                this.onSaveCallback(session);
            }

            // Show success notification
            this.uiController.showNotification('Practice session saved!', 'success');

            // Reset timer after saving
            this.timer.stop();
            this.uiController.updateTimerControls(false);
        });

        cancelBtn?.addEventListener('click', () => {
            modal.remove();
            this.uiController.isModalOpen = false;
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
            this.uiController.showNotification(
                'Please set loop start and end points first',
                'error'
            );
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

        confirmBtn?.addEventListener('click', async () => {
            const inputValue = nameInput?.value.trim();
            let name = inputValue;
            if (!name) {
                // Generate default name if none provided
                name = `Loop ${this.formatTime(this.youtubePlayer.loopStart)} - ${this.formatTime(this.youtubePlayer.loopEnd)}`;
            }
            await this.youtubePlayer.saveLoop(name);
            await this.updateSavedLoopsList();
            this.uiController.showNotification(
                inputValue ? 'Loop saved successfully' : 'Loop saved with default name',
                'success'
            );
            modal.remove();
        });

        cancelBtn?.addEventListener('click', () => {
            modal.remove();
        });

        nameInput?.focus();
    }

    async updateSavedLoopsList() {
        const loops = await this.youtubePlayer.loadSavedLoops();
        const container = document.getElementById('youtubeSavedLoopsList');

        if (!container) return;

        if (!loops || loops.length === 0) {
            container.innerHTML =
                '<p class="empty-state" style="color: var(--text-secondary); text-align: center; font-size: 12px; margin: 0; padding: 16px;">No saved loops for this video</p>';
        } else {
            container.innerHTML = loops
                .map(
                    (loop, index) => `
                <div class="saved-loop-item" style="display: flex; align-items: center; padding: 8px 12px; border-bottom: 1px solid var(--border);">
                    <span class="youtube-loop-item" data-index="${index}" style="font-weight: 500; flex: 1; cursor: pointer; text-align: left;">${escapeHtml(loop.name)}</span>
                    <span style="font-size: 12px; color: var(--text-secondary); margin-right: 16px;">
                        ${this.formatTime(loop.start)} - ${this.formatTime(loop.end)}
                    </span>
                    <div class="loop-actions" style="display: flex; gap: 8px;">
                        <button class="youtube-loop-edit" data-index="${index}" 
                                title="Edit loop name"
                                style="background: none; border: none; padding: 4px 8px; cursor: pointer; color: var(--text-muted); transition: color 0.2s;">
                            ✏️
                        </button>
                        <button class="youtube-loop-delete" data-index="${index}" 
                                title="Delete loop"
                                style="background: none; border: none; padding: 4px 8px; cursor: pointer; color: var(--text-muted); transition: color 0.2s;">
                            🗑️
                        </button>
                    </div>
                </div>
            `
                )
                .join('');
        }
    }

    loadYouTubeLoop(index) {
        if (this.youtubePlayer.loadLoop(index)) {
            const loop = this.youtubePlayer.savedLoops[index];
            document.getElementById('youtubeLoopStartTime').textContent = this.formatTime(
                loop.start
            );
            document.getElementById('youtubeLoopEndTime').textContent = this.formatTime(loop.end);
            document.getElementById('youtubeLoopEnabled').checked = true;
            this.youtubePlayer.setLooping(true);
            this.uiController.showNotification(`Loaded loop: ${loop.name}`, 'success');
        }
    }

    async deleteYouTubeLoop(index) {
        if (confirm('Delete this saved loop?')) {
            await this.youtubePlayer.deleteLoop(index);
            await this.updateSavedLoopsList();
            this.uiController.showNotification('Loop deleted', 'info');
        }
    }

    async editYouTubeLoop(index) {
        const loops = this.youtubePlayer.savedLoops;
        if (!loops || !loops[index]) return;

        const loop = loops[index];
        const newName = prompt('Edit loop name:', loop.name);

        if (newName && newName.trim() && newName !== loop.name) {
            loop.name = newName.trim();

            // Save updated loops using StorageService
            await this.storageService.saveYouTubeLoop(this.youtubePlayer.videoId, loops);

            await this.updateSavedLoopsList();
            this.uiController.showNotification('Loop name updated', 'success');
        }
    }

    // Audio Loop Methods
    updateAudioSavedLoopsList() {
        const loopController = this.audioPlayer?.audioPlayer?.loopController;
        if (!loopController) return;

        const container = document.getElementById('audioSavedLoopsList');
        const section = document.getElementById('audioSavedLoopsSection');

        if (!container || !section) return;

        const loops = loopController.savedLoops || [];

        if (loops.length === 0) {
            container.innerHTML =
                '<p class="no-loops-message" style="text-align: center; color: var(--text-muted); font-size: 14px;">No saved loops yet</p>';
            section.style.display = 'none';
        } else {
            section.style.display = 'block';
            container.innerHTML = loops
                .map(
                    (loop, index) => `
                <div class="saved-loop-item" style="display: flex; align-items: center; padding: 8px 12px; border-bottom: 1px solid var(--border);">
                    <span class="audio-loop-item" data-index="${index}" style="font-weight: 500; flex: 1; cursor: pointer; text-align: left;">${escapeHtml(loop.name)}</span>
                    <span style="font-size: 12px; color: var(--text-secondary); margin-right: 16px;">
                        ${this.formatTime(loop.start)} - ${this.formatTime(loop.end)}
                    </span>
                    <div class="loop-actions" style="display: flex; gap: 8px;">
                        <button class="audio-loop-edit" data-index="${index}" 
                                title="Edit loop name"
                                style="background: none; border: none; padding: 4px 8px; cursor: pointer; color: var(--text-muted); transition: color 0.2s;">
                            ✏️
                        </button>
                        <button class="audio-loop-delete" data-index="${index}" 
                                title="Delete loop"
                                style="background: none; border: none; padding: 4px 8px; cursor: pointer; color: var(--text-muted); transition: color 0.2s;">
                            🗑️
                        </button>
                    </div>
                </div>
            `
                )
                .join('');
        }
    }

    loadAudioLoop(index) {
        const loopController = this.audioPlayer?.audioPlayer?.loopController;
        if (!loopController || !loopController.savedLoops[index]) return;

        const loop = loopController.savedLoops[index];
        loopController.setLoopStart(loop.start);
        loopController.setLoopEnd(loop.end);
        loopController.setLooping(true);

        this.uiController.showNotification(`Loaded loop: ${loop.name}`, 'success');
    }

    async deleteAudioLoop(index) {
        if (confirm('Delete this saved loop?')) {
            const loopController = this.audioPlayer?.audioPlayer?.loopController;
            if (loopController) {
                await loopController.deleteLoop(index);
                this.updateAudioSavedLoopsList();
                this.uiController.showNotification('Loop deleted', 'info');
            }
        }
    }

    editAudioLoop(index) {
        const loopController = this.audioPlayer?.audioPlayer?.loopController;
        if (!loopController || !loopController.savedLoops[index]) return;

        const loop = loopController.savedLoops[index];
        const newName = prompt('Edit loop name:', loop.name);

        if (newName && newName.trim() && newName !== loop.name) {
            loop.name = newName.trim();

            // Save updated loops back to localStorage
            const storageKey = `audio_loops_${loopController.currentFileName}`;
            localStorage.setItem(storageKey, JSON.stringify(loopController.savedLoops));

            this.updateAudioSavedLoopsList();
            this.uiController.showNotification('Loop name updated', 'success');
        }
    }

    initializeAudioLoopSaveFeature() {
        // Get the audio player's loop controller
        const audioPlayer = this.audioPlayer?.audioPlayer;
        if (!audioPlayer || !audioPlayer.loopController) return;

        // Set callback for when loops are loaded
        audioPlayer.loopController.onLoopsLoaded = (savedLoops) => {
            this.updateAudioSavedLoopsList();
        };

        // Add save loop handler to the audio player
        audioPlayer.handleLoopSave = () => {
            this.showAudioSaveLoopModal();
        };

        // Re-set the UI callbacks to include the save handler
        if (audioPlayer.uiControls) {
            audioPlayer.uiControls.setCallbacks({
                onLoopSave: audioPlayer.handleLoopSave.bind(audioPlayer)
            });
        }
    }

    showAudioSaveLoopModal() {
        const loopController = this.audioPlayer?.audioPlayer?.loopController;
        if (
            !loopController ||
            loopController.loopStart === null ||
            loopController.loopEnd === null
        ) {
            this.uiController.showNotification(
                'Please set loop start and end points first',
                'error'
            );
            return;
        }

        const modal = this.uiController.showModal(this.renderAudioSaveLoopModal());
        this.attachAudioSaveLoopHandlers(modal);
    }

    renderAudioSaveLoopModal() {
        const loopController = this.audioPlayer?.audioPlayer?.loopController;
        const loopDuration = loopController.loopEnd - loopController.loopStart;
        return `
            <h3>Save Loop</h3>
            <div class="save-loop-form">
                <p>Loop: ${this.formatTime(loopController.loopStart)} - ${this.formatTime(loopController.loopEnd)} 
                   (${this.formatTime(loopDuration)})</p>
                
                <div class="form-group">
                    <label for="audioLoopName">Loop Name:</label>
                    <input type="text" id="audioLoopName" 
                           placeholder="e.g., Intro, Verse 1, Chorus..." 
                           style="width: 100%; padding: 8px; margin-top: 8px;">
                </div>
                
                <div class="button-group" style="margin-top: 16px;">
                    <button class="btn btn-primary" id="confirmAudioLoopSaveBtn">Save Loop</button>
                    <button class="btn btn-secondary" id="cancelAudioLoopSaveBtn">Cancel</button>
                </div>
            </div>
        `;
    }

    attachAudioSaveLoopHandlers(modal) {
        const nameInput = modal.querySelector('#audioLoopName');
        const confirmBtn = modal.querySelector('#confirmAudioLoopSaveBtn');
        const cancelBtn = modal.querySelector('#cancelAudioLoopSaveBtn');

        confirmBtn?.addEventListener('click', async () => {
            const loopController = this.audioPlayer?.audioPlayer?.loopController;
            if (loopController) {
                const inputValue = nameInput?.value.trim();
                let name = inputValue;
                if (!name) {
                    // Generate default name if none provided
                    name = `Loop ${this.formatTime(loopController.loopStart)} - ${this.formatTime(loopController.loopEnd)}`;
                }
                await loopController.saveLoop(name);
                this.updateAudioSavedLoopsList();
                this.uiController.showNotification(
                    inputValue ? 'Loop saved successfully' : 'Loop saved with default name',
                    'success'
                );
                modal.remove();
            }
        });

        cancelBtn?.addEventListener('click', () => {
            modal.remove();
        });

        nameInput?.focus();
    }

    formatTime(seconds) {
        if (!seconds || seconds < 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    showBpmIncreaseAnimation(increment) {
        // Create and show the BPM increase animation
        const animDiv = document.createElement('div');
        animDiv.className = 'bpm-increase-animation';
        animDiv.textContent = `+${increment} BPM!`;
        document.body.appendChild(animDiv);

        // Remove after animation completes
        setTimeout(() => {
            animDiv.remove();
        }, 1000);

        // Also pulse the BPM display
        const bpmValue = document.getElementById('bpmValue');
        if (bpmValue) {
            bpmValue.style.animation = 'none';
            setTimeout(() => {
                bpmValue.style.animation = 'bpmPulse 0.5s ease-out';
            }, 10);
        }
    }

    showSpeedIncreaseAnimation(increment) {
        // Create and show the speed increase animation
        const animDiv = document.createElement('div');
        animDiv.className = 'bpm-increase-animation';
        animDiv.textContent = `+${increment}% Speed!`;
        document.body.appendChild(animDiv);

        // Remove after animation completes
        setTimeout(() => {
            animDiv.remove();
        }, 1000);
    }

    checkForSessionToLoad() {
        // Check sessionStorage for practice session data
        const sessionData = sessionStorage.getItem('loadPracticeSession');
        if (sessionData) {
            try {
                const data = JSON.parse(sessionData);
                sessionStorage.removeItem('loadPracticeSession'); // Clear it after reading
                this.loadPracticeSessionData(data);
                return; // Don't check other sources if we loaded from sessionStorage
            } catch (error) {
                console.error('Error loading session from sessionStorage:', error);
            }
        }

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

    handleLoadPracticeSession(detail) {
        // Load session data from event detail
        const sessionData = sessionStorage.getItem('loadPracticeSession');
        if (sessionData) {
            try {
                const data = JSON.parse(sessionData);
                sessionStorage.removeItem('loadPracticeSession');
                this.loadPracticeSessionData(data);
            } catch (error) {
                console.error('Error loading practice session:', error);
            }
        }
    }

    handleStartDrillSession(drillData) {
        // Clear any existing session
        this.clearSession();

        // Switch to metronome mode for drills
        this.uiController.switchMode('metronome');

        // Set practice area
        const practiceAreaInput = document.getElementById('practiceArea');
        if (practiceAreaInput) {
            practiceAreaInput.value = drillData.practiceArea || 'Drills';
        }

        // Set notes with drill instructions
        const notesInput = document.getElementById('notes');
        if (notesInput) {
            notesInput.value = drillData.notes || '';
        }

        // Set tempo if provided
        if (drillData.tempo && drillData.tempo > 0) {
            const tempoSlider = document.getElementById('bpmSlider');
            const tempoDisplay = document.getElementById('bpmDisplay');
            if (tempoSlider && tempoDisplay) {
                tempoSlider.value = drillData.tempo;
                tempoDisplay.textContent = drillData.tempo;
                this.metronome.setBpm(drillData.tempo);
            }
        }

        // Store drill ID for tracking
        this.currentDrillId = drillData.drillId;
        this.currentDrillData = drillData.drillData;

        // Show notification
        if (window.notificationManager) {
            window.notificationManager.show({
                message: `Starting drill: ${drillData.drillData?.title || 'Practice Drill'}`,
                type: 'info',
                duration: 3000
            });
        }
    }

    loadPracticeSessionData(data) {
        // Switch to the appropriate mode
        if (data.mode) {
            this.uiController.switchMode(data.mode);
        }

        // Load image if present
        if (data.sheetMusicImage && this.imageManager) {
            // Set the image directly
            this.imageManager.currentImage = data.sheetMusicImage;
            // Call the UI controller to show the image preview
            this.uiController.showImagePreview(data.sheetMusicImage);
        }

        // Set metronome settings if in metronome mode
        if (data.mode === 'metronome' && this.metronome) {
            if (data.tempo || data.bpm) {
                this.metronome.setBpm(data.tempo || data.bpm);
            }
            if (data.timeSignature) {
                // Parse time signature like "4/4" to beats per measure
                const [beats] = data.timeSignature.split('/').map(Number);
                if (beats) {
                    this.metronome.setTimeSignature(beats);
                }
            }
        }

        // Show notification
        this.uiController.showNotification('Practice session loaded successfully', 'success');
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

        // Remove keyboard shortcuts
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
            this.keyboardHandler = null;
        }

        // Remove keyboard guide UI
        const guideButton = document.getElementById('keyboard-shortcuts-toggle');
        const guidePanel = document.getElementById('keyboard-shortcuts-guide');
        if (guideButton) guideButton.remove();
        if (guidePanel) guidePanel.remove();

        // Clear global references
        if (window.currentTimer === this.timer) {
            window.currentTimer = null;
        }
    }
}

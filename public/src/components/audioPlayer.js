// Audio Player Component - Fixed Complete Version with High-Quality Tempo Control
import {WaveformVisualizer} from './waveform.js';

export class AudioPlayer {
    constructor(container, audioService) {
        this.container = container;
        this.audioService = audioService;
        this.storageService = null;
        this.audio = null;

        // YouTube player
        this.youtubePlayer = null;
        this.isYouTubeMode = false;
        this.youtubeVideoId = null;
        this.youtubeUpdateInterval = null;
        this.youtubeVideoTitle = null;
        this.youtubeVideoUrl = null;

        // Tone.js components for high-quality playback
        this.grainPlayer = null;
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

        // Tempo progression for loops
        this.tempoProgression = {
            enabled: false,
            incrementType: 'percentage', // 'percentage' or 'bpm'
            incrementValue: 1,
            loopInterval: 1, // After every N loops
            currentLoopCount: 0,
            maxTempo: 200 // 200% max speed
        };
        this.loopCount = 0;

        // UI state
        this.isPlaying = false;
        this.duration = 0;
        this.currentTime = 0;
        this.startTime = 0;
        this.startOffset = 0;
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

            // Create pitch shift effect for independent pitch control
            this.pitchShift = new Tone.PitchShift({
                pitch: 0,
                windowSize: 0.1,
                delayTime: 0,
                feedback: 0,
                wet: 1.0
            }).toDestination();

            // Set high quality settings for pitch shifter
            this.pitchShift.windowSize = 0.1; // Larger window for better quality

        } catch (error) {
            console.error('Failed to initialize Tone.js:', error);
        }
    }

    render() {
        if (!this.container) {
            console.error('No container for audio player');
            return;
        }

        console.log('Rendering audio player UI...');

        this.container.innerHTML = `
            <div class="audio-player" style="
                background-image: url('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAEsASwDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAP==');
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                position: relative;
            ">
                <!-- Background overlay for readability -->
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(26, 26, 46, 0.85);
                    border-radius: 12px;
                "></div>
                
                <!-- Content wrapper -->
                <div style="position: relative; z-index: 1;">
<!-- Audio Source Selection -->
<div class="audio-source-section">
    <h3>Audio Source</h3>
    
    <!-- Source Type Tabs -->
    <div class="source-tabs" style="display: flex; gap: 8px; margin-bottom: 16px;">
        <button class="source-tab active" data-source="file" 
                style="flex: 1; padding: 10px; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
            📁 Local File
        </button>
        <button class="source-tab" data-source="youtube" 
                style="flex: 1; padding: 10px; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border); border-radius: 8px; cursor: pointer; transition: all 0.2s;">
            🎬 YouTube
        </button>
    </div>
    
    <!-- File Input Section -->
    <div id="fileInputSection" class="source-section">
        <input type="file" id="audioFileInput" accept="audio/*" class="file-input" 
               style="padding: 12px; background: var(--bg-input); border: 1px solid var(--border); 
                      border-radius: 8px; color: var(--text-primary); width: 100%; margin-bottom: 16px;">
    </div>
    
    <!-- YouTube Input Section -->
    <div id="youtubeInputSection" class="source-section" style="display: none;">
        <div style="display: flex; gap: 8px; margin-bottom: 16px;">
            <input type="text" id="youtubeUrlInput" placeholder="Enter YouTube URL or Video ID" 
                   style="flex: 1; padding: 12px; background: var(--bg-input); border: 1px solid var(--border); 
                          border-radius: 8px; color: var(--text-primary);">
            <button id="loadYoutubeBtn" class="btn btn-primary" style="padding: 12px 20px;">
                Load Video
            </button>
        </div>
        <div id="youtubePlayerContainer" style="display: none; margin-bottom: 16px;">
            <div id="youtubePlayer" style="width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 8px;"></div>
        </div>
    </div>
    
    <div id="currentFileName" class="current-file-name" 
         style="color: var(--text-secondary); font-size: 14px; margin-top: 8px;"></div>
</div>

                    <!-- Audio Controls -->
                    <div id="audioControlsSection" class="audio-controls-section" style="display: none;">
                        <!-- Waveform -->
                        <div class="waveform-container" style="position: relative; width: 100%; height: 150px; background: var(--bg-input); border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
                            <canvas id="waveformCanvas" style="width: 100%; height: 100%; display: block;"></canvas>
                            <div class="loop-region" id="loopRegion" style="position: absolute; top: 0; height: 100%; background: rgba(99, 102, 241, 0.2); pointer-events: none; display: none;"></div>
                        </div>

                        <!-- Playback Controls -->
                        <div class="playback-controls" style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px; justify-content: center;">
                            <button id="playPauseBtn" class="btn btn-primary" style="padding: 12px 24px;">
                                <i class="icon">▶️</i> Play
                            </button>
                            <button id="stopBtn" class="btn btn-secondary" style="padding: 12px 24px;">
                                <i class="icon">⏹️</i> Stop
                            </button>
                            <div class="time-display" style="font-family: monospace; font-size: 18px; margin-left: 16px;">
                                <span id="currentTime">0:00</span> / <span id="duration">0:00</span>
                            </div>
                        </div>

                        <!-- Loop Controls -->
                        <div class="loop-controls" style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.1);">
                            <h4 style="margin-bottom: 16px;">Loop Section</h4>
                            <div class="loop-content">
                                <div class="loop-main-controls" style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px; flex-wrap: wrap;">
                                    <button id="setLoopStartBtn" class="btn btn-sm btn-secondary" style="padding: 8px 16px;">Set Start</button>
                                    <button id="setLoopEndBtn" class="btn btn-sm btn-secondary" style="padding: 8px 16px;">Set End</button>
                                    <button id="clearLoopBtn" class="btn btn-sm btn-secondary" style="padding: 8px 16px;">Clear</button>
                                    <div class="loop-info" style="margin-left: 16px; font-family: monospace;">
                                        <span id="loopStart">--:--</span> - <span id="loopEnd">--:--</span>
                                    </div>
                                </div>
                                <label class="checkbox-label loop-enable" style="display: flex; align-items: center; gap: 8px;">
                                    <input type="checkbox" id="loopEnabled">
                                    <span>Enable Loop</span>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Tempo Progression for Loops -->
<div class="tempo-progression-section" style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.1);">
    <h4 style="margin-bottom: 16px;">Tempo Progression (Loop Mode)</h4>
    <label class="checkbox-label" style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
        <input type="checkbox" id="progressionEnabled">
        <span>Enable tempo increase after loops</span>
    </label>
    
    <div class="progression-controls" id="progressionControls" style="display: none;">
        <div class="progression-row" style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
            <label>Increase by:</label>
            <input type="number" id="incrementValue" value="1" min="0.1" max="10" step="0.1" 
                   style="width: 80px; padding: 6px 10px; background: var(--bg-dark); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-primary);">
            <select id="incrementType" class="small-select" style="padding: 6px 10px; background: var(--bg-dark); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-primary);">
                <option value="percentage">%</option>
                <option value="bpm">BPM</option>
            </select>
        </div>
        <div class="progression-row" style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
            <label>After every:</label>
            <input type="number" id="loopInterval" value="1" min="1" max="10" 
                   style="width: 80px; padding: 6px 10px; background: var(--bg-dark); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-primary);">
            <span>loop(s)</span>
        </div>
        <div class="progression-status" id="progressionStatus" 
             style="padding: 10px; background: var(--bg-dark); border-radius: 6px; font-size: 0.875rem; color: var(--text-secondary);">
            Current: 100% | Loops: 0 | Next increase: +1% after 1 loop(s)
        </div>
    </div>
</div>

                        <!-- Compact Audio Controls -->
                        <div class="audio-controls-compact" style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.1);">
                            <h4 style="margin-bottom: 16px; text-align: center;">Audio Controls</h4>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 16px;">
                                <!-- Speed Control (Left) -->
                                <div class="speed-control-compact">
                                    <label style="display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-secondary);">
                                        Speed: <span id="speedValue" style="color: var(--primary); font-weight: 600;">100%</span>
                                    </label>
                                    <input type="range" id="speedSlider" min="50" max="150" value="100" step="1" class="slider" 
                                           style="width: 100%; height: 8px; background: linear-gradient(to right, #374151 0%, #6366f1 50%, #374151 100%); border-radius: 4px; outline: none; -webkit-appearance: none; -moz-appearance: none; appearance: none;">
                                    <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 11px; color: var(--text-muted);">
                                        <span>50%</span>
                                        <span style="color: var(--text-secondary);">100%</span>
                                        <span>150%</span>
                                    </div>
                                </div>
                                
                                <!-- Pitch Control (Right) -->
                                <div class="pitch-control-compact">
                                    <label style="display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-secondary);">
                                        Pitch: <span id="pitchValue" style="color: var(--primary); font-weight: 600;">0</span>
                                    </label>
                                    <div class="pitch-buttons" style="display: flex; gap: 6px; justify-content: center;">
                                        <button class="pitch-btn" data-pitch="-1" style="flex: 1; padding: 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 14px;">-1</button>
                                        <button class="pitch-btn" data-pitch="-0.5" style="flex: 1; padding: 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 14px;">-½</button>
                                        <button class="pitch-btn" data-pitch="+0.5" style="flex: 1; padding: 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 14px;">+½</button>
                                        <button class="pitch-btn" data-pitch="+1" style="flex: 1; padding: 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 14px;">+1</button>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Volume Control (Bottom) -->
                            <div class="volume-control-compact">
                                <label style="display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-secondary);">
                                    Volume: <span id="volumeValue" style="color: var(--primary); font-weight: 600;">100%</span>
                                </label>
                                <div class="volume-slider-container" style="display: flex; align-items: center; gap: 12px;">
                                    <i class="icon" style="font-size: 18px;">🔊</i>
                                    <input type="range" id="volumeSlider" min="0" max="100" value="100" class="slider" 
                                           style="flex: 1; height: 8px; background: linear-gradient(to right, #374151 0%, #6366f1 100%); border-radius: 4px; outline: none; -webkit-appearance: none; -moz-appearance: none; appearance: none;">
                                </div>
                            </div>
                            
                            <!-- Reset buttons -->
                            <div style="display: flex; gap: 10px; margin-top: 16px;">
                                <button id="resetSpeedBtn" class="btn btn-sm btn-secondary" style="flex: 1; padding: 8px; font-size: 13px;">
                                    <i class="icon">↻</i> Reset Speed
                                </button>
                                <button id="resetPitchBtn" class="btn btn-sm btn-secondary" style="flex: 1; padding: 8px; font-size: 13px;">
                                    <i class="icon">↻</i> Reset Pitch
                                </button>
                            </div>
                        </div>

                        <!-- Saved Sessions -->
                        <div class="saved-sessions-section" id="savedSessionsSection" style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.1);">
                            <h4 style="margin-bottom: 16px;">Saved Sessions</h4>
                            <div id="savedSessionsList" class="saved-sessions-list" style="margin-bottom: 16px;">
                                <p class="empty-state" style="color: var(--text-secondary); text-align: center; padding: 20px;">No saved sessions for this file</p>
                            </div>
                            <button id="saveSessionBtn" class="btn btn-primary" style="width: 100%; padding: 12px;">
                                <i class="icon">💾</i> Save Current Session
                            </button>
                        </div>

                        <!-- Info Text -->
                        <div class="save-info" style="background: rgba(99, 102, 241, 0.1); padding: 16px; border-radius: 8px; border-left: 4px solid var(--primary);">
                            <p style="margin: 0; color: var(--text-secondary);">💡 Tip: Use the "Save Current Session" button to save your loop points and settings</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
                /* Enhanced slider styles */
                .slider {
                    cursor: pointer !important;
                }
                
                /* WebKit browsers (Chrome, Safari, newer Edge) */
                .slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    height: 20px;
                    width: 20px;
                    border-radius: 50%;
                    background: #6366f1;
                    border: 2px solid #ffffff;
                    cursor: pointer;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
                    transition: all 0.2s ease;
                }
                
                .slider::-webkit-slider-thumb:hover {
                    background: #5856eb;
                    transform: scale(1.1);
                    box-shadow: 0 3px 8px rgba(99, 102, 241, 0.4);
                }
                
                /* Firefox */
                .slider::-moz-range-thumb {
                    height: 20px;
                    width: 20px;
                    border-radius: 50%;
                    background: #6366f1;
                    border: 2px solid #ffffff;
                    cursor: pointer;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
                    transition: all 0.2s ease;
                    -moz-appearance: none;
                    appearance: none;
                }
                
                .slider::-moz-range-thumb:hover {
                    background: #5856eb;
                    transform: scale(1.1);
                    box-shadow: 0 3px 8px rgba(99, 102, 241, 0.4);
                }
                
                /* Remove default track styling */
                .slider::-webkit-slider-track {
                    -webkit-appearance: none;
                    appearance: none;
                }
                
                .slider::-moz-range-track {
                    background: transparent;
                    border: none;
                }
                
                /* Add focus styles */
                .slider:focus {
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
                    border-radius: 4px;
                }
            </style>
        `;

        console.log('Audio player UI rendered successfully');
        this.attachEventListeners();
    }

    attachEventListeners() {
        console.log('Attaching event listeners...');

        // File input
        const fileInput = document.getElementById('audioFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
            console.log('File input listener attached');
        } else {
            console.error('File input element not found');
        }

        // Source tab switching
        document.querySelectorAll('.source-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                // Update active tab
                document.querySelectorAll('.source-tab').forEach(t => {
                    t.classList.remove('active');
                    t.style.background = 'var(--bg-input)';
                    t.style.color = 'var(--text-primary)';
                    t.style.border = '1px solid var(--border)';
                });

                e.target.classList.add('active');
                e.target.style.background = 'var(--primary)';
                e.target.style.color = 'white';
                e.target.style.border = 'none';

                // Show/hide sections
                const source = e.target.dataset.source;
                document.getElementById('fileInputSection').style.display =
                    source === 'file' ? 'block' : 'none';
                document.getElementById('youtubeInputSection').style.display =
                    source === 'youtube' ? 'block' : 'none';

                // Show/hide waveform
                const waveformCanvas = document.getElementById('waveformCanvas');
                if (waveformCanvas) {
                    waveformCanvas.style.display = source === 'file' ? 'block' : 'none';
                }
            });
        });

        // YouTube load button
        document.getElementById('loadYoutubeBtn')?.addEventListener('click', () => {
            const input = document.getElementById('youtubeUrlInput');
            if (input && input.value.trim()) {
                this.loadYouTubeVideo(input.value.trim());
            }
        });

        // YouTube URL input enter key
        document.getElementById('youtubeUrlInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const input = e.target;
                if (input.value.trim()) {
                    this.loadYouTubeVideo(input.value.trim());
                }
            }
        });

        // Playback controls
        const playPauseBtn = document.getElementById('playPauseBtn');
        const stopBtn = document.getElementById('stopBtn');

        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        }
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


        // Tempo progression controls
        document.getElementById('progressionEnabled')?.addEventListener('change', (e) => {
            this.tempoProgression.enabled = e.target.checked;
            document.getElementById('progressionControls').style.display =
                e.target.checked ? 'block' : 'none';
            this.updateProgressionStatus();
        });

        document.getElementById('incrementValue')?.addEventListener('change', (e) => {
            this.tempoProgression.incrementValue = parseFloat(e.target.value);
            this.updateProgressionStatus();
        });

        document.getElementById('incrementType')?.addEventListener('change', (e) => {
            this.tempoProgression.incrementType = e.target.value;
            this.updateProgressionStatus();
        });

        document.getElementById('loopInterval')?.addEventListener('change', (e) => {
            this.tempoProgression.loopInterval = parseInt(e.target.value);
            this.updateProgressionStatus();
        });

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

        document.getElementById('resetPitchBtn')?.addEventListener('click', () => {
            this.setPitch(0);
        });

        // Volume control
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                document.getElementById('volumeValue').textContent = value + '%';
                if (this.pitchShift) {
                    this.pitchShift.volume.value = Tone.gainToDb(value / 100);
                }
            });
        }

        console.log('All event listeners attached successfully');
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
            const fileNameEl = document.getElementById('currentFileName');
            if (fileNameEl) {
                fileNameEl.textContent = `Loaded: ${file.name}`;
                fileNameEl.style.color = 'var(--success)';
            }

            // Dispose of previous player
            if (this.grainPlayer) {
                this.grainPlayer.stop();
                this.grainPlayer.dispose();
            }

            // Convert file to URL
            const audioUrl = URL.createObjectURL(file);

            // Create GrainPlayer for high-quality tempo stretching
            this.grainPlayer = new Tone.GrainPlayer({
                url: audioUrl,
                loop: false,
                playbackRate: 1.0,
                grainSize: 0.2,    // Larger grain size for better quality
                overlap: 0.1,      // Smooth overlap
                reverse: false,
                onload: () => {
                    console.log('Audio loaded in Tone.js GrainPlayer');
                    this.duration = this.grainPlayer.buffer.duration;

                    // Connect audio chain: GrainPlayer -> PitchShift -> Destination
                    this.grainPlayer.connect(this.pitchShift);

                    // Show controls
                    const controlsSection = document.getElementById('audioControlsSection');
                    if (controlsSection) {
                        controlsSection.style.display = 'block';
                    }

                    const durationEl = document.getElementById('duration');
                    const currentTimeEl = document.getElementById('currentTime');

                    if (durationEl) durationEl.textContent = this.formatTime(this.duration);
                    if (currentTimeEl) currentTimeEl.textContent = this.formatTime(0);

                    // Initialize waveform
                    this.initializeWaveform(file);

                    // Load saved sessions
                    this.loadSavedSessions();

                    // Dispatch event for practice form
                    window.dispatchEvent(new CustomEvent('audioFileLoaded', {
                        detail: {fileName: file.name}
                    }));

                    console.log('Audio player setup complete');
                },
                onerror: (error) => {
                    console.error('Error loading audio:', error);
                    this.showNotification('Failed to load audio file', 'error');
                }
            });

        } catch (error) {
            console.error('Error loading audio file:', error);
            this.showNotification('Failed to load audio file: ' + error.message, 'error');
            const controlsSection = document.getElementById('audioControlsSection');
            if (controlsSection) {
                controlsSection.style.display = 'none';
            }
        }
    }

    initializeYouTubePlayer() {
        // Ensure YouTube API is loaded
        if (!window.YT || !window.YT.Player) {
            console.error('YouTube API not loaded');
            setTimeout(() => this.initializeYouTubePlayer(), 1000);
            return;
        }

        // Create YouTube player
        this.youtubePlayer = new YT.Player('youtubePlayer', {
            height: '100%',
            width: '100%',
            videoId: '',
            playerVars: {
                'controls': 1,
                'rel': 0,
                'modestbranding': 1,
                'enablejsapi': 1,
                'autoplay': 0,  // Prevent autoplay
                'origin': window.location.origin
            },
            events: {
                'onReady': this.onYouTubePlayerReady.bind(this),
                'onStateChange': this.onYouTubeStateChange.bind(this)
            }
        });
    }

    onYouTubePlayerReady(event) {
        console.log('YouTube player ready');

        // Enable controls
        const controlsSection = document.getElementById('audioControlsSection');
        if (controlsSection) {
            controlsSection.style.display = 'block';
        }

        // Fetch video title after a short delay
        setTimeout(() => this.fetchYouTubeTitle(), 1000);
    }

    onYouTubeStateChange(event) {
        if (event.data === YT.PlayerState.PLAYING) {
            this.isPlaying = true;
            this.startYouTubeTimeUpdates();

            // Start timer if sync is enabled
            this.syncTimerStart();
        } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
            this.isPlaying = false;
            this.stopYouTubeTimeUpdates();

            // Stop timer if sync is enabled
            this.syncTimerStop();

            // Handle loop if enabled
            if (event.data === YT.PlayerState.ENDED && this.isLooping && this.loopStart !== null && this.loopEnd !== null) {
                this.youtubePlayer.seekTo(this.loopStart);
                this.youtubePlayer.playVideo();
                this.handleLoopComplete();
            }
        }

        this.updatePlayPauseButton();
    }

    loadYouTubeVideo(url) {
        // Extract video ID from URL
        const videoId = this.extractYouTubeVideoId(url);
        if (!videoId) {
            this.showNotification('Invalid YouTube URL', 'error');
            return;
        }

        this.youtubeVideoId = videoId;
        this.isYouTubeMode = true;

        // Reset state
        this.stop();
        this.currentTime = 0;
        this.loopCount = 0;
        this.tempoProgression.currentLoopCount = 0;

        // Show YouTube player
        const container = document.getElementById('youtubePlayerContainer');
        if (container) {
            container.style.display = 'block';
        }

        // Initialize player if not already done
        if (!this.youtubePlayer) {
            this.initializeYouTubePlayer();
            // Load video after player is ready (cue instead of load to prevent autoplay)
            setTimeout(() => {
                this.youtubePlayer.cueVideoById(videoId);
                this.onVideoLoaded();
            }, 1000);
        } else {
            this.youtubePlayer.cueVideoById(videoId);
            this.onVideoLoaded();
        }

        // Store the URL
        this.youtubeVideoUrl = url;

        // Update UI
        const fileNameEl = document.getElementById('currentFileName');
        if (fileNameEl) {
            fileNameEl.textContent = `YouTube: ${videoId}`;
            fileNameEl.style.color = 'var(--success)';
        }

        // Dispatch event for practice form
        window.dispatchEvent(new CustomEvent('youtubeVideoLoaded', {
            detail: {
                videoId: videoId,
                url: url,
                mode: 'youtube'
            }
        }));

        // Replace waveform with YouTube progress bar that supports loop markers
        const waveformContainer = document.querySelector('.waveform-container');
        if (waveformContainer) {
            waveformContainer.innerHTML = `
        <div style="
            width: 100%; 
            height: 100%; 
            position: relative;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            overflow: hidden;
        ">
            <!-- YouTube label -->
            <div style="
                position: absolute;
                top: 10px;
                left: 10px;
                z-index: 10;
                background: rgba(0, 0, 0, 0.7);
                padding: 4px 12px;
                border-radius: 4px;
                font-size: 12px;
                color: var(--text-secondary);
            ">
                🎬 YouTube Mode
            </div>
            
            <!-- Progress bar background -->
            <div id="youtubeProgressBar" style="
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 60%;
                background: rgba(255, 255, 255, 0.1);
                cursor: pointer;
            ">
                <!-- Progress fill -->
                <div id="youtubeProgressFill" style="
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 0%;
                    background: var(--primary);
                    opacity: 0.5;
                    transition: none;
                "></div>
                
                <!-- Current position indicator -->
                <div id="youtubePositionIndicator" style="
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    width: 2px;
                    background: var(--primary);
                    left: 0%;
                    box-shadow: 0 0 4px rgba(99, 102, 241, 0.5);
                "></div>
            </div>
            
            <!-- Loop region overlay (reuse existing ID) -->
            <div class="loop-region" id="loopRegion" style="
                position: absolute;
                bottom: 0;
                height: 60%;
                background: rgba(99, 102, 241, 0.2);
                pointer-events: none;
                display: none;
                border-left: 2px solid var(--success);
                border-right: 2px solid var(--danger);
            "></div>
            
            <!-- Time display -->
            <div style="
                position: absolute;
                bottom: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.7);
                padding: 4px 12px;
                border-radius: 4px;
                font-size: 13px;
                color: var(--text-primary);
                font-family: monospace;
            ">
                <span id="youtubeCurrentTime">0:00</span> / <span id="youtubeDuration">0:00</span>
            </div>
        </div>
    `;

            // Add click handler for seeking
            const progressBar = document.getElementById('youtubeProgressBar');
            if (progressBar) {
                progressBar.addEventListener('click', (e) => {
                    const rect = progressBar.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percentage = x / rect.width;
                    const seekTime = percentage * this.duration;

                    if (this.youtubePlayer && this.youtubePlayer.seekTo) {
                        this.youtubePlayer.seekTo(seekTime, true);
                    }
                });
            }
        }

        // Show controls
        const controlsSection = document.getElementById('audioControlsSection');
        if (controlsSection) {
            controlsSection.style.display = 'block';
        }

        // Update duration when available
        setTimeout(() => {
            if (this.youtubePlayer && this.youtubePlayer.getDuration) {
                this.duration = this.youtubePlayer.getDuration();
                const durationEl = document.getElementById('duration');
                if (durationEl) durationEl.textContent = this.formatTime(this.duration);
            }
        }, 2000);
    }

    onVideoLoaded() {
        // Update duration
        setTimeout(() => {
            if (this.youtubePlayer && this.youtubePlayer.getDuration) {
                this.duration = this.youtubePlayer.getDuration();
                const durationEl = document.getElementById('duration');
                if (durationEl) durationEl.textContent = this.formatTime(this.duration);

                // Update current time to 0
                const currentTimeEl = document.getElementById('currentTime');
                if (currentTimeEl) currentTimeEl.textContent = this.formatTime(0);
            }
        }, 500);
    }

    async fetchYouTubeTitle() {
        if (!this.youtubePlayer || !this.youtubeVideoId) return;

        try {
            // Get video data from player
            const videoData = this.youtubePlayer.getVideoData();
            if (videoData && videoData.title) {
                this.youtubeVideoTitle = videoData.title;

                // Update display
                const fileNameEl = document.getElementById('currentFileName');
                if (fileNameEl) {
                    fileNameEl.textContent = `YouTube: ${this.youtubeVideoTitle}`;
                }

                // Update practice form
                window.dispatchEvent(new CustomEvent('youtubeVideoLoaded', {
                    detail: {
                        videoId: this.youtubeVideoId,
                        title: this.youtubeVideoTitle,
                        url: this.youtubeVideoUrl,
                        mode: 'youtube'
                    }
                }));
            }
        } catch (error) {
            console.error('Error fetching YouTube title:', error);
        }
    }

    extractYouTubeVideoId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
            /^([a-zA-Z0-9_-]{11})$/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }

        return null;
    }

    startYouTubeTimeUpdates() {
        this.stopYouTubeTimeUpdates();

        this.youtubeUpdateInterval = setInterval(() => {
            if (this.youtubePlayer && this.youtubePlayer.getCurrentTime) {
                this.currentTime = this.youtubePlayer.getCurrentTime();

                // Update time display
                const currentTimeEl = document.getElementById('currentTime');
                if (currentTimeEl) {
                    currentTimeEl.textContent = this.formatTime(this.currentTime);
                }

                // Update YouTube progress bar
                const progressFill = document.getElementById('youtubeProgressFill');
                const positionIndicator = document.getElementById('youtubePositionIndicator');
                const youtubeCurrentTimeEl = document.getElementById('youtubeCurrentTime');
                const youtubeDurationEl = document.getElementById('youtubeDuration');

                if (this.duration > 0) {
                    const percentage = (this.currentTime / this.duration) * 100;

                    if (progressFill) {
                        progressFill.style.width = percentage + '%';
                    }
                    if (positionIndicator) {
                        positionIndicator.style.left = percentage + '%';
                    }
                }

                if (youtubeCurrentTimeEl) {
                    youtubeCurrentTimeEl.textContent = this.formatTime(this.currentTime);
                }
                if (youtubeDurationEl && this.duration) {
                    youtubeDurationEl.textContent = this.formatTime(this.duration);
                }

                // Update loop region position (it will use the existing updateLoopRegion method)
                this.updateLoopRegion();

                // Update YouTube loop markers
                this.updateYouTubeLoopMarkers();

                // Handle looping
                if (this.isLooping && this.loopEnd !== null && this.currentTime >= this.loopEnd) {
                    this.youtubePlayer.seekTo(this.loopStart || 0);
                    this.handleLoopComplete();
                }
            }
        }, 100);
    }

    stopYouTubeTimeUpdates() {
        if (this.youtubeUpdateInterval) {
            clearInterval(this.youtubeUpdateInterval);
            this.youtubeUpdateInterval = null;
        }
    }

    setupTimeUpdate() {
        // Create a loop to update time display
        const updateTime = () => {
            if (this.grainPlayer && this.grainPlayer.state === 'started') {
                // Calculate elapsed real time since playback started
                const realElapsed = Tone.now() - this.startTime;

                // Apply playback rate to get scaled time + starting offset
                this.currentTime = (realElapsed * this.playbackRate) + (this.startOffset || 0);

                // Handle looping
                if (this.isLooping && this.loopEnd !== null && this.currentTime >= this.loopEnd) {
                    this.startOffset = this.loopStart || 0;
                    this.grainPlayer.stop();
                    this.grainPlayer.playbackRate = this.playbackRate;
                    this.grainPlayer.start(undefined, this.startOffset);
                    this.startTime = Tone.now();
                    this.currentTime = this.startOffset;

                    // Handle loop completion for tempo progression
                    this.handleLoopComplete();
                }

                const currentTimeEl = document.getElementById('currentTime');
                if (currentTimeEl) {
                    currentTimeEl.textContent = this.formatTime(this.currentTime);
                }

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
                if (this.grainPlayer) {
                    // Store whether we were playing
                    const wasPlaying = this.isPlaying;

                    // Stop current playback if playing
                    if (this.grainPlayer.state === 'started') {
                        this.grainPlayer.stop();
                    }

                    // Update current time
                    this.currentTime = time;
                    this.startOffset = time;

                    // Update display
                    const currentTimeEl = document.getElementById('currentTime');
                    if (currentTimeEl) {
                        currentTimeEl.textContent = this.formatTime(time);
                    }

                    // Update waveform progress immediately
                    if (this.waveformVisualizer) {
                        this.waveformVisualizer.updateProgress(time);
                    }

                    // Resume playback if we were playing
                    if (wasPlaying) {
                        this.grainPlayer.playbackRate = this.playbackRate;
                        this.grainPlayer.start(undefined, time);
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
        if (this.isYouTubeMode) {
            if (this.youtubePlayer) {
                if (this.isPlaying) {
                    this.youtubePlayer.pauseVideo();
                } else {
                    this.youtubePlayer.playVideo();
                }
            }
            return;
        }

        // Original file-based code
        if (!this.grainPlayer || !this.grainPlayer.loaded) return;

        if (this.isPlaying) {
            this.grainPlayer.stop();
            this.isPlaying = false;

            // Stop timer if sync is enabled
            this.syncTimerStop();
        } else {
            // Handle loop boundaries
            let startPosition = this.currentTime;
            if (this.isLooping && this.loopStart !== null) {
                if (startPosition < this.loopStart ||
                    (this.loopEnd !== null && startPosition > this.loopEnd)) {
                    startPosition = this.loopStart;
                }
            }

            // Start playback with current tempo setting
            this.grainPlayer.playbackRate = this.playbackRate;
            this.grainPlayer.start(undefined, startPosition);
            this.startTime = Tone.now();
            this.startOffset = startPosition;
            this.isPlaying = true;

            // Start time updates
            this.setupTimeUpdate();

            // Start timer if sync is enabled
            this.syncTimerStart();

            // Start waveform animation
            if (this.waveformVisualizer) {
                this.waveformVisualizer.startAnimation();
            }
        }

        this.updatePlayPauseButton();
    }

    syncTimerStart() {
        console.log('Audio player: Attempting to sync timer start...');

        // Try multiple ways to find the timer
        let timer = null;

        // First check the global reference
        if (window.currentTimer) {
            timer = window.currentTimer;
            console.log('Found timer via window.currentTimer');
        } else if (window.app?.currentPage?.timer) {
            timer = window.app.currentPage.timer;
        } else if (window.app?.currentPage?.components?.timer) {
            timer = window.app.currentPage.components.timer;
        } else if (window.app?.currentPage?.sharedTimer) {
            timer = window.app.currentPage.sharedTimer;
        }

        if (timer) {
            // Check if sync is enabled by reading the checkbox directly
            const syncCheckbox = document.getElementById('timerSyncCheckbox');
            const syncEnabled = syncCheckbox ? syncCheckbox.checked : timer.syncWithAudio;

            console.log('Timer found, sync enabled:', syncEnabled, 'Timer running:', timer.isRunning);

            if (syncEnabled && !timer.isRunning) {
                console.log('Starting timer due to audio sync');
                timer.start();
            } else if (syncEnabled && timer.isRunning) {
                console.log('Timer already running, no action needed');
            } else if (!syncEnabled) {
                console.log('Timer sync is disabled');
            }
        } else {
            console.warn('Timer component not found for sync');
            console.log('Available references:', {
                'window.currentTimer': window.currentTimer,
                'window.app': window.app,
                'window.app.currentPage': window.app?.currentPage,
                'window.app.currentPage.components': window.app?.currentPage?.components
            });
        }
    }

    syncTimerStop() {
    console.log('Audio player: Attempting to sync timer stop...');

    // Try multiple ways to find the timer
    let timer = null;

    // First check the global reference
    if (window.currentTimer) {
        timer = window.currentTimer;
        console.log('Found timer via window.currentTimer');
    } else if (window.app?.currentPage?.timer) {
        timer = window.app.currentPage.timer;
    } else if (window.app?.currentPage?.components?.timer) {
        timer = window.app.currentPage.components.timer;
    } else if (window.app?.currentPage?.sharedTimer) {
        timer = window.app.currentPage.sharedTimer;
    }

    if (timer) {
        // Check if sync is enabled by reading the checkbox directly
        const syncCheckbox = document.getElementById('timerSyncCheckbox');
        const syncEnabled = syncCheckbox ? syncCheckbox.checked : timer.syncWithAudio;

        console.log('Timer found for stop, sync enabled:', syncEnabled, 'Timer running:', timer.isRunning);

        if (syncEnabled && timer.isRunning) {
            console.log('Pausing timer due to audio sync');
            timer.pause();
        } else if (!syncEnabled) {
            console.log('Timer sync is disabled, not stopping timer');
        } else if (!timer.isRunning) {
            console.log('Timer already stopped');
        }
    } else {
        console.warn('Timer component not found for sync stop');
    }
}

    stop() {
        if (this.isYouTubeMode && this.youtubePlayer) {
            this.youtubePlayer.stopVideo();
            this.stopYouTubeTimeUpdates();
        } else if (this.grainPlayer) {
            this.grainPlayer.stop();
        }

        this.isPlaying = false;

        if (this.isLooping && this.loopStart !== null) {
            this.currentTime = this.loopStart;
        } else {
            this.currentTime = 0;
        }

        this.startOffset = this.currentTime;

        const currentTimeEl = document.getElementById('currentTime');
        if (currentTimeEl) {
            currentTimeEl.textContent = this.formatTime(this.currentTime);
        }

        // Reset YouTube progress display
        if (this.isYouTubeMode) {
            const progressFill = document.getElementById('youtubeProgressFill');
            const positionIndicator = document.getElementById('youtubePositionIndicator');
            const youtubeCurrentTimeEl = document.getElementById('youtubeCurrentTime');

            if (progressFill) {
                progressFill.style.width = '0%';
            }
            if (positionIndicator) {
                positionIndicator.style.left = '0%';
            }
            if (youtubeCurrentTimeEl) {
                youtubeCurrentTimeEl.textContent = this.formatTime(0);
            }
        }

        this.updatePlayPauseButton();

        // Stop timer if sync is enabled
        this.syncTimerStop();

        // Stop waveform animation
        if (this.waveformVisualizer) {
            this.waveformVisualizer.stopAnimation();
        }

        // Reset loop and tempo progression
        this.loopCount = 0;
        this.tempoProgression.currentLoopCount = 0;
        this.updateProgressionStatus();
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
        let newStartTime;

        if (this.isYouTubeMode && this.youtubePlayer) {
            newStartTime = this.youtubePlayer.getCurrentTime();
        } else if (this.grainPlayer) {
            newStartTime = this.currentTime;
        } else {
            return;
        }

        // Check if new start point is after existing end point
        if (this.loopEnd !== null && newStartTime > this.loopEnd) {
            // Clear the loop and set this as new start point
            this.loopEnd = null;
            const loopEndEl = document.getElementById('loopEnd');
            if (loopEndEl) loopEndEl.textContent = '--:--';

            this.showNotification('Loop cleared - new start point set', 'info');
        }

        this.loopStart = newStartTime;

        const loopStartEl = document.getElementById('loopStart');
        if (loopStartEl) {
            loopStartEl.textContent = this.formatTime(this.loopStart);
        }

        this.updateLoopRegion();

        if (this.waveformVisualizer && !this.isYouTubeMode) {
            this.waveformVisualizer.updateLoopMarkers(this.loopStart, this.loopEnd);
        }

        // Show loop start marker immediately for YouTube mode
        if (this.isYouTubeMode) {
            this.updateYouTubeLoopMarkers();
        }

        this.showNotification('Loop start set', 'success');
    }

    setLoopEnd() {
        let newEndTime;

        if (this.isYouTubeMode && this.youtubePlayer) {
            newEndTime = this.youtubePlayer.getCurrentTime();
        } else if (this.grainPlayer) {
            newEndTime = this.currentTime;
        } else {
            return;
        }

        // Check if new end point is before existing start point
        if (this.loopStart !== null && newEndTime < this.loopStart) {
            // Clear the loop and set this as new start point
            this.loopStart = newEndTime;
            this.loopEnd = null;

            const loopStartEl = document.getElementById('loopStart');
            const loopEndEl = document.getElementById('loopEnd');
            if (loopStartEl) loopStartEl.textContent = this.formatTime(this.loopStart);
            if (loopEndEl) loopEndEl.textContent = '--:--';

            this.showNotification('Loop cleared - point set as new start', 'info');
        } else {
            // Normal case - set as end point
            this.loopEnd = newEndTime;

            const loopEndEl = document.getElementById('loopEnd');
            if (loopEndEl) {
                loopEndEl.textContent = this.formatTime(this.loopEnd);
            }

            this.showNotification('Loop end set', 'success');
        }

        this.updateLoopRegion();

        if (this.waveformVisualizer && !this.isYouTubeMode) {
            this.waveformVisualizer.updateLoopMarkers(this.loopStart, this.loopEnd);
        }

        // Show loop markers immediately for YouTube mode
        if (this.isYouTubeMode) {
            this.updateYouTubeLoopMarkers();
        }
    }

    clearLoop() {
        this.loopStart = null;
        this.loopEnd = null;

        const loopStartEl = document.getElementById('loopStart');
        const loopEndEl = document.getElementById('loopEnd');
        const loopEnabledEl = document.getElementById('loopEnabled');

        if (loopStartEl) loopStartEl.textContent = '--:--';
        if (loopEndEl) loopEndEl.textContent = '--:--';
        if (loopEnabledEl) loopEnabledEl.checked = false;

        this.isLooping = false;

        this.updateLoopRegion();

        if (this.waveformVisualizer && !this.isYouTubeMode) {
            this.waveformVisualizer.updateLoopMarkers(null, null);
        }

        // Clear YouTube loop markers
        if (this.isYouTubeMode) {
            this.updateYouTubeLoopMarkers();
        }

        // Reset tempo progression
        this.loopCount = 0;
        this.tempoProgression.currentLoopCount = 0;
        this.updateProgressionStatus();

        this.showNotification('Loop cleared', 'info');
    }

    updateLoopRegion() {
        const loopRegion = document.getElementById('loopRegion');
        if (!loopRegion) return;

        // For YouTube mode, we handle markers separately
        if (this.isYouTubeMode) {
            // Hide the standard loop region for YouTube
            loopRegion.style.display = 'none';
            return;
        }

        let duration = this.duration;
        if (!duration || duration === 0) {
            loopRegion.style.display = 'none';
            return;
        }

        if (this.loopStart !== null && this.loopEnd !== null) {
            const startPercent = (this.loopStart / duration) * 100;
            const endPercent = (this.loopEnd / duration) * 100;

            loopRegion.style.left = startPercent + '%';
            loopRegion.style.width = (endPercent - startPercent) + '%';
            loopRegion.style.display = 'block';
        } else {
            loopRegion.style.display = 'none';
        }
    }

    updateYouTubeLoopMarkers() {
        const container = document.querySelector('.waveform-container');
        if (!container || !this.isYouTubeMode) return;

        // Remove ALL loop-related elements first
        const existingMarkers = container.querySelectorAll('.youtube-loop-marker, .loop-start-marker, .loop-end-marker, .youtube-loop-region');
        existingMarkers.forEach(marker => marker.remove());

        // Also ensure the standard loop region is hidden
        const standardLoopRegion = document.getElementById('loopRegion');
        if (standardLoopRegion) {
            standardLoopRegion.style.display = 'none';
        }

        // Get duration
        let duration = this.duration;
        if (this.isYouTubeMode && this.youtubePlayer && this.youtubePlayer.getDuration) {
            duration = this.youtubePlayer.getDuration();
        }

        if (!duration || duration === 0) return;

        // Add shaded region if both markers are set
        if (this.loopStart !== null && this.loopEnd !== null) {
            const startPercent = Math.max(0, Math.min(100, (this.loopStart / duration) * 100));
            const endPercent = Math.max(0, Math.min(100, (this.loopEnd / duration) * 100));

            const loopRegion = document.createElement('div');
            loopRegion.className = 'youtube-loop-region';
            loopRegion.style.cssText = `
            position: absolute;
            bottom: 0;
            height: 60%;
            background: rgba(99, 102, 241, 0.2);
            left: ${startPercent}%;
            width: ${endPercent - startPercent}%;
            pointer-events: none;
            z-index: 5;
        `;
            container.appendChild(loopRegion);
        }

        // Add start marker if set
        if (this.loopStart !== null) {
            const startPercent = Math.max(0, Math.min(100, (this.loopStart / duration) * 100));
            const startMarker = document.createElement('div');
            startMarker.className = 'youtube-loop-marker youtube-loop-start';
            startMarker.style.cssText = `
            position: absolute;
            bottom: 0;
            height: 60%;
            width: 3px;
            background: #22c55e;
            left: ${startPercent}%;
            z-index: 10;
            box-shadow: 0 0 4px rgba(34, 197, 94, 0.5);
        `;
            container.appendChild(startMarker);
        }

        // Add end marker if set
        if (this.loopEnd !== null) {
            const endPercent = Math.max(0, Math.min(100, (this.loopEnd / duration) * 100));
            const endMarker = document.createElement('div');
            endMarker.className = 'youtube-loop-marker youtube-loop-end';
            endMarker.style.cssText = `
            position: absolute;
            bottom: 0;
            height: 60%;
            width: 3px;
            background: #ef4444;
            left: ${endPercent}%;
            z-index: 10;
            box-shadow: 0 0 4px rgba(239, 68, 68, 0.5);
        `;
            container.appendChild(endMarker);
        }
    }

    // Speed control methods - now with pitch preservation
    adjustSpeed(change) {
        const currentSpeed = this.playbackRate * 100;
        const newSpeed = Math.max(25, Math.min(300, currentSpeed + change));
        this.setSpeed(newSpeed);
        const speedSlider = document.getElementById('speedSlider');
        if (speedSlider) speedSlider.value = newSpeed;
    }

    setSpeed(speed) {
        this.playbackRate = speed / 100;
        const speedValueEl = document.getElementById('speedValue');
        if (speedValueEl) {
            speedValueEl.textContent = speed + '%';
        }

        if (this.isYouTubeMode && this.youtubePlayer) {
            // YouTube player supports playback rates
            this.youtubePlayer.setPlaybackRate(this.playbackRate);
        } else if (this.grainPlayer) {
            // Apply tempo change to GrainPlayer (preserves pitch)
            this.grainPlayer.playbackRate = this.playbackRate;
        }
    }

    // Pitch control methods - independent of tempo
    adjustPitch(change) {
        const newPitch = Math.max(-12, Math.min(12, this.pitchShiftAmount + change));
        this.setPitch(newPitch);
        const pitchSlider = document.getElementById('pitchSlider');
        if (pitchSlider) pitchSlider.value = newPitch;
    }

    setPitch(pitch) {
        this.pitchShiftAmount = pitch;
        const pitchValueEl = document.getElementById('pitchValue');
        if (pitchValueEl) {
            if (pitch === 0) {
                pitchValueEl.textContent = '0';
            } else if (pitch > 0) {
                pitchValueEl.textContent = `+${pitch}`;
            } else {
                pitchValueEl.textContent = `${pitch}`;
            }
        }

        // Apply pitch shift using Tone.js PitchShift
        if (this.pitchShift) {
            this.pitchShift.pitch = pitch;
        }
    }

    handleLoopComplete() {
        this.loopCount++;

        if (!this.tempoProgression.enabled) return;

        this.tempoProgression.currentLoopCount++;

        if (this.tempoProgression.currentLoopCount % this.tempoProgression.loopInterval === 0) {
            let newSpeed = this.playbackRate * 100; // Convert to percentage

            if (this.tempoProgression.incrementType === 'percentage') {
                newSpeed = newSpeed * (1 + this.tempoProgression.incrementValue / 100);
            } else {
                // For BPM mode, we need to calculate relative change
                // Assuming 100% = original BPM
                newSpeed = newSpeed + this.tempoProgression.incrementValue;
            }

            // Limit to max tempo
            newSpeed = Math.min(newSpeed, this.tempoProgression.maxTempo);

            if (newSpeed !== this.playbackRate * 100) {
                this.setSpeed(Math.round(newSpeed));
                const speedSlider = document.getElementById('speedSlider');
                if (speedSlider) speedSlider.value = newSpeed;
                this.showNotification(`Tempo increased to ${Math.round(newSpeed)}%`, 'info');
            }
        }

        this.updateProgressionStatus();
    }

    updateProgressionStatus() {
        const status = document.getElementById('progressionStatus');
        if (!status) return;

        if (this.tempoProgression.enabled) {
            const currentSpeed = Math.round(this.playbackRate * 100);
            const increment = this.tempoProgression.incrementType === 'percentage'
                ? `${this.tempoProgression.incrementValue}%`
                : `${this.tempoProgression.incrementValue} BPM`;

            const loopsUntilNext = this.tempoProgression.loopInterval -
                (this.tempoProgression.currentLoopCount % this.tempoProgression.loopInterval);

            status.textContent = `Current: ${currentSpeed}% | Loops: ${this.tempoProgression.currentLoopCount} | Next increase: +${increment} after ${loopsUntilNext} loop(s)`;
        } else {
            status.textContent = '';
        }
    }

    getDuration() {
        return this.grainPlayer ? this.grainPlayer.buffer.duration : 0;
    }

    getCurrentTime() {
        return this.currentTime;
    }

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

    // Session management methods
    loadSavedSessions() {
        if (!this.currentFileName || !this.storageService) return;

        const sessions = this.storageService.getAudioSessions?.(this.currentFileName) || [];
        const container = document.getElementById('savedSessionsList');

        if (!container) return;

        if (sessions.length === 0) {
            container.innerHTML = '<p class="empty-state" style="color: var(--text-secondary); text-align: center; padding: 20px;">No saved sessions for this file</p>';
            return;
        }

        container.innerHTML = sessions.map((session, index) => `
        <div class="saved-session-item" style="
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            transition: all 0.2s ease;
        ">
            <div class="session-info">
                <strong style="color: var(--text-primary); display: block; margin-bottom: 8px;">
                    ${session.name || `Session ${index + 1}`}
                </strong>
                <span class="session-date" style="color: var(--text-secondary); font-size: 14px;">
                    ${new Date(session.timestamp).toLocaleDateString()} ${new Date(session.timestamp).toLocaleTimeString()}
                </span>
                <div class="session-details" style="margin-top: 8px; font-size: 14px; color: var(--text-secondary);">
                    Speed: ${session.speed}% | Pitch: ${session.pitch > 0 ? '+' : ''}${session.pitch} semitones
                    ${session.loopStart !== null ? ` | Loop: ${this.formatTime(session.loopStart)} - ${this.formatTime(session.loopEnd)}` : ''}
                </div>
                ${session.notes ? `
                    <div style="
                        margin-top: 12px;
                        padding-top: 12px;
                        border-top: 1px solid var(--border);
                        font-size: 14px;
                        color: var(--text-primary);
                        font-style: italic;
                    ">
                        📝 ${session.notes}
                    </div>
                ` : ''}
            </div>
            <div class="session-actions" style="display: flex; gap: 8px; margin-top: 16px;">
                <button class="btn btn-sm btn-primary" onclick="window.app.currentPage.components.audioPlayer.loadSession(${index})" 
                        style="padding: 6px 12px; font-size: 14px;">
                    Load
                </button>
                <button class="btn btn-sm btn-danger" onclick="window.app.currentPage.components.audioPlayer.deleteSession(${index})"
                        style="padding: 6px 12px; font-size: 14px;">
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
        const speedSlider = document.getElementById('speedSlider');
        if (speedSlider) speedSlider.value = session.speed;

        this.setPitch(session.pitch);
        const pitchSlider = document.getElementById('pitchSlider');
        if (pitchSlider) pitchSlider.value = session.pitch;

        this.loopStart = session.loopStart;
        this.loopEnd = session.loopEnd;

        const loopStartEl = document.getElementById('loopStart');
        const loopEndEl = document.getElementById('loopEnd');
        const loopEnabledEl = document.getElementById('loopEnabled');

        if (loopStartEl) {
            loopStartEl.textContent = session.loopStart !== null ? this.formatTime(session.loopStart) : '--:--';
        }
        if (loopEndEl) {
            loopEndEl.textContent = session.loopEnd !== null ? this.formatTime(session.loopEnd) : '--:--';
        }
        if (loopEnabledEl) {
            loopEnabledEl.checked = session.loopEnabled || false;
        }

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

        // Simple session save for now
        const session = {
            name: `${this.currentFileName} - ${new Date().toLocaleTimeString()}`,
            timestamp: Date.now(),
            fileName: this.currentFileName,
            speed: this.playbackRate * 100,
            pitch: this.pitchShiftAmount,
            loopStart: this.loopStart,
            loopEnd: this.loopEnd,
            loopEnabled: this.isLooping
        };

        if (this.storageService && this.storageService.saveAudioSession) {
            this.storageService.saveAudioSession(this.currentFileName, session);
            this.loadSavedSessions();
            this.showNotification('Session saved successfully', 'success');
        } else {
            this.showNotification('Storage service not available', 'error');
        }
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

        if (this.grainPlayer) {
            this.grainPlayer.stop();
            this.grainPlayer.dispose();
            this.grainPlayer = null;
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
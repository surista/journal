// Audio Player Component - Fixed Complete Version with High-Quality Tempo Control
import {WaveformVisualizer} from './waveform.js';

export class AudioPlayer {
    constructor(container, audioService) {
        this.container = container;
        this.audioService = audioService;
        this.storageService = null;
        this.audio = null;

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
                    <!-- File Selection -->
                    <div class="audio-file-section">
                        <h3>Select Audio File</h3>
                        <input type="file" id="audioFileInput" accept="audio/*" class="file-input" 
                               style="padding: 12px; background: var(--bg-input); border: 1px solid var(--border); 
                                      border-radius: 8px; color: var(--text-primary); width: 100%; margin-bottom: 16px;">
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

                        <!-- Speed Control -->
                        <div class="speed-control" style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.1);">
                            <h4 style="margin-bottom: 16px;">Playback Speed: <span id="speedValue">100%</span></h4>
                            <div class="speed-info" style="margin-bottom: 16px;">
                                <p class="speed-note" style="color: var(--text-secondary); font-size: 14px; margin: 0;">🎯 High-quality tempo adjustment with pitch preservation</p>
                            </div>
                            <div class="speed-buttons" style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; justify-content: center;">
                                <button class="speed-btn" data-speed="-25" style="padding: 6px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; cursor: pointer;">-25%</button>
                                <button class="speed-btn" data-speed="-10" style="padding: 6px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; cursor: pointer;">-10%</button>
                                <button class="speed-btn" data-speed="-5" style="padding: 6px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; cursor: pointer;">-5%</button>
                                <button class="speed-btn" data-speed="-1" style="padding: 6px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; cursor: pointer;">-1%</button>
                                <button class="speed-btn" data-speed="+1" style="padding: 6px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; cursor: pointer;">+1%</button>
                                <button class="speed-btn" data-speed="+5" style="padding: 6px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; cursor: pointer;">+5%</button>
                                <button class="speed-btn" data-speed="+10" style="padding: 6px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; cursor: pointer;">+10%</button>
                                <button class="speed-btn" data-speed="+25" style="padding: 6px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; cursor: pointer;">+25%</button>
                            </div>
                            <div style="margin-bottom: 16px;">
                                <input type="range" id="speedSlider" min="50" max="150" value="100" step="1" class="slider" 
                                       style="width: 100%; height: 8px; background: linear-gradient(to right, #374151 0%, #6366f1 50%, #374151 100%); border-radius: 4px; outline: none; -webkit-appearance: none; -moz-appearance: none; appearance: none;">
                                <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 12px; color: var(--text-secondary);">
                                    <span>50%</span>
                                    <span>100%</span>
                                    <span>150%</span>
                                </div>
                            </div>
                            <button id="resetSpeedBtn" class="btn btn-secondary" style="width: 100%; padding: 10px;">
                                <i class="icon">↻</i> Reset to 100%
                            </button>
                        </div>

                        <!-- Pitch Control -->
                        <div class="pitch-control" style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.1);">
                            <h4 style="margin-bottom: 16px;">Pitch Adjustment: <span id="pitchValue">0 semitones</span></h4>
                            <div class="pitch-buttons" style="display: flex; gap: 8px; align-items: center; margin-bottom: 16px; justify-content: center;">
                                <button class="pitch-btn" data-pitch="-1" style="padding: 8px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; cursor: pointer;">-1</button>
                                <button class="pitch-btn" data-pitch="-0.5" style="padding: 8px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; cursor: pointer;">-½</button>
                                <input type="range" id="pitchSlider" min="-12" max="12" value="0" step="0.5" class="slider" 
                                       style="flex: 1; margin: 0 16px; height: 8px; background: linear-gradient(to right, #ef4444 0%, #6366f1 50%, #10b981 100%); border-radius: 4px; outline: none; -webkit-appearance: none; -moz-appearance: none; appearance: none;">
                                <button class="pitch-btn" data-pitch="+0.5" style="padding: 8px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; cursor: pointer;">+½</button>
                                <button class="pitch-btn" data-pitch="+1" style="padding: 8px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; cursor: pointer;">+1</button>
                            </div>
                            <button id="resetPitchBtn" class="btn btn-secondary" style="width: 100%; padding: 10px;">
                                <i class="icon">↻</i> Reset to Original Pitch
                            </button>
                        </div>

                        <!-- Volume Control -->
                        <div class="volume-control" style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.1);">
                            <h4 style="margin-bottom: 16px;">Volume Control</h4>
                            <div class="volume-slider-container" style="display: flex; align-items: center; gap: 12px;">
                                <i class="icon">🔊</i>
                                <input type="range" id="volumeSlider" min="0" max="100" value="100" class="slider" 
                                       style="flex: 1; height: 8px; background: linear-gradient(to right, #374151 0%, #6366f1 100%); border-radius: 4px; outline: none; -webkit-appearance: none; -moz-appearance: none; appearance: none;">
                                <span id="volumeValue" style="min-width: 40px; text-align: right;">100%</span>
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
                        detail: { fileName: file.name }
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
        if (!this.grainPlayer || !this.grainPlayer.loaded) return;

        if (this.isPlaying) {
            this.grainPlayer.stop();
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

            // Start playback with current tempo setting
            this.grainPlayer.playbackRate = this.playbackRate;
            this.grainPlayer.start(undefined, startPosition);
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
        if (this.grainPlayer) {
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
        if (!this.grainPlayer) return;

        this.loopStart = this.currentTime;
        const loopStartEl = document.getElementById('loopStart');
        if (loopStartEl) {
            loopStartEl.textContent = this.formatTime(this.loopStart);
        }
        this.updateLoopRegion();

        if (this.waveformVisualizer) {
            this.waveformVisualizer.updateLoopMarkers(this.loopStart, this.loopEnd);
        }

        this.showNotification('Loop start set', 'success');
    }

    setLoopEnd() {
        if (!this.grainPlayer) return;

        this.loopEnd = this.currentTime;
        const loopEndEl = document.getElementById('loopEnd');
        if (loopEndEl) {
            loopEndEl.textContent = this.formatTime(this.loopEnd);
        }
        this.updateLoopRegion();

        if (this.waveformVisualizer) {
            this.waveformVisualizer.updateLoopMarkers(this.loopStart, this.loopEnd);
        }

        this.showNotification('Loop end set', 'success');
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

        // Apply tempo change to GrainPlayer (preserves pitch)
        if (this.grainPlayer) {
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
            pitchValueEl.textContent = pitch > 0 ? `+${pitch} semitones` : `${pitch} semitones`;
        }

        // Apply pitch shift using Tone.js PitchShift
        if (this.pitchShift) {
            this.pitchShift.pitch = pitch;
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
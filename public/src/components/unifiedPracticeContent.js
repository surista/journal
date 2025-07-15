// Unified Practice Content Component (inline version)
import { Timer } from './timer.js';
import { Metronome } from './metronome.js';
import { AudioPlayer } from './audioPlayer.js';
import { AudioService } from '../services/audioService.js';

export class UnifiedPracticeContent {
    constructor(storageService) {
        this.storageService = storageService;
        this.timer = null;
        this.metronome = null;
        this.audioPlayer = null;
        this.audioService = new AudioService();
        this.currentMode = 'metronome'; // metronome, audio, youtube
        this.onSaveCallback = null;
    }

    render() {
        return `
            <div class="unified-practice-content">
                <!-- Timer Section -->
                <div class="timer-section">
                    <div class="unified-timer-display" id="unifiedTimerDisplay">00:00:00</div>
                    <div class="timer-controls">
                        <button class="btn btn-primary" id="playPauseBtn">
                            <span class="btn-icon">▶</span>
                            <span class="btn-text">Play</span>
                        </button>
                        <button class="btn btn-secondary" id="stopBtn">
                            <span class="btn-icon">■</span>
                            <span class="btn-text">Stop</span>
                        </button>
                    </div>
                    <label class="sync-metronome-label">
                        <input type="checkbox" id="syncMetronome" checked>
                        Start timer with metronome
                    </label>
                </div>
                
                <!-- Mode Selection -->
                <div class="mode-selection">
                    <button class="mode-btn active" data-mode="metronome">
                        <span class="mode-icon">🎵</span>
                        <span class="mode-text">Metronome</span>
                    </button>
                    <button class="mode-btn" data-mode="audio">
                        <span class="mode-icon">🎵</span>
                        <span class="mode-text">Audio</span>
                    </button>
                    <button class="mode-btn" data-mode="youtube">
                        <span class="mode-icon">📹</span>
                        <span class="mode-text">YouTube</span>
                    </button>
                </div>
                
                <!-- Mode Content -->
                <div class="mode-content">
                    <!-- Metronome Content -->
                    <div id="metronomeContent" class="mode-panel active">
                        <div id="metronomeContainer"></div>
                    </div>
                    
                    <!-- Audio File Content -->
                    <div id="audioContent" class="mode-panel">
                        <div class="audio-upload-section">
                            <input type="file" id="audioFileInput" accept="audio/*" style="display: none;">
                            <button class="btn btn-secondary" id="uploadAudioBtn">
                                <span class="btn-icon">📁</span>
                                Choose Audio File
                            </button>
                            <p class="upload-hint">or drag and drop an audio file here</p>
                        </div>
                        <div id="audioPlayerContainer"></div>
                    </div>
                    
                    <!-- YouTube Content -->
                    <div id="youtubeContent" class="mode-panel">
                        <div class="youtube-input-section">
                            <input type="text" 
                                   id="youtubeUrl" 
                                   class="youtube-input" 
                                   placeholder="Enter YouTube URL or ID">
                            <button class="btn btn-primary" id="loadYoutubeBtn">Load Video</button>
                        </div>
                        <div id="youtubePlayerContainer"></div>
                    </div>
                </div>
                
                <!-- Practice Form -->
                <div class="practice-form-section">
                    <h3>Session Details</h3>
                    <form id="practiceDetailsForm">
                        <div class="form-group">
                            <label for="practiceTitle">Title</label>
                            <input type="text" 
                                   id="practiceTitle" 
                                   class="form-control" 
                                   placeholder="What are you practicing?">
                        </div>
                        
                        <div class="form-group">
                            <label for="practiceNotes">Notes</label>
                            <textarea id="practiceNotes" 
                                      class="form-control" 
                                      rows="2"
                                      placeholder="Add notes about this session..."></textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="practiceTempo">Tempo (BPM)</label>
                                <input type="number" 
                                       id="practiceTempo" 
                                       class="form-control" 
                                       min="40" 
                                       max="300"
                                       placeholder="120">
                            </div>
                            
                            <div class="form-group">
                                <label for="practiceKey">Key</label>
                                <select id="practiceKey" class="form-control">
                                    <option value="">Select key...</option>
                                    <option value="C">C Major</option>
                                    <option value="G">G Major</option>
                                    <option value="D">D Major</option>
                                    <option value="A">A Major</option>
                                    <option value="E">E Major</option>
                                    <option value="B">B Major</option>
                                    <option value="F">F Major</option>
                                    <option value="Bb">Bb Major</option>
                                    <option value="Eb">Eb Major</option>
                                    <option value="Ab">Ab Major</option>
                                    <option value="Db">Db Major</option>
                                    <option value="Gb">Gb Major</option>
                                    <option value="Am">A Minor</option>
                                    <option value="Em">E Minor</option>
                                    <option value="Bm">B Minor</option>
                                    <option value="F#m">F# Minor</option>
                                    <option value="C#m">C# Minor</option>
                                    <option value="G#m">G# Minor</option>
                                    <option value="Dm">D Minor</option>
                                    <option value="Gm">G Minor</option>
                                    <option value="Cm">C Minor</option>
                                    <option value="Fm">F Minor</option>
                                    <option value="Bbm">Bb Minor</option>
                                    <option value="Ebm">Eb Minor</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" id="clearBtn">Clear</button>
                            <button type="submit" class="btn btn-primary" id="saveSessionBtn">Save Session</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    init(container) {
        container.innerHTML = this.render();
        
        // Initialize simple timer
        this.initializeTimer();
        
        this.attachEventListeners();
        
        // Show default mode
        this.switchMode('metronome');
    }
    
    initializeTimer() {
        // Simple timer implementation
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
            
            reset: () => {
                this.timer.stop();
            },
            
            getElapsedTime: () => {
                return Math.floor(this.timer.elapsedTime / 1000); // Return seconds
            },
            
            destroy: () => {
                clearInterval(this.timer.interval);
            }
        };
    }
    
    updateTimerDisplay() {
        const display = document.getElementById('unifiedTimerDisplay');
        if (display) {
            const totalSeconds = Math.floor(this.timer.elapsedTime / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            
            display.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    attachEventListeners() {
        // Mode switching
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.switchMode(mode);
            });
        });
        
        // Timer controls
        const playPauseBtn = document.getElementById('playPauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        playPauseBtn?.addEventListener('click', () => {
            if (this.timer && this.timer.isRunning) {
                this.timer.pause();
                playPauseBtn.querySelector('.btn-icon').textContent = '▶';
                playPauseBtn.querySelector('.btn-text').textContent = 'Play';
            } else if (this.timer) {
                this.timer.start();
                playPauseBtn.querySelector('.btn-icon').textContent = '⏸';
                playPauseBtn.querySelector('.btn-text').textContent = 'Pause';
                
                // Start metronome if sync is enabled
                const syncCheckbox = document.getElementById('syncMetronome');
                if (syncCheckbox?.checked && this.currentMode === 'metronome' && this.metronome) {
                    this.metronome.start();
                }
            }
        });
        
        stopBtn?.addEventListener('click', () => {
            if (this.timer) {
                this.timer.stop();
            }
            playPauseBtn.querySelector('.btn-icon').textContent = '▶';
            playPauseBtn.querySelector('.btn-text').textContent = 'Play';
            
            // Stop metronome
            if (this.metronome) {
                this.metronome.stop();
            }
        });
        
        // Audio file upload
        const uploadBtn = document.getElementById('uploadAudioBtn');
        const fileInput = document.getElementById('audioFileInput');
        
        uploadBtn?.addEventListener('click', () => fileInput?.click());
        
        fileInput?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await this.loadAudioFile(file);
            }
        });
        
        // YouTube load
        document.getElementById('loadYoutubeBtn')?.addEventListener('click', () => {
            const input = document.getElementById('youtubeUrl');
            if (input?.value) {
                this.loadYouTubeVideo(input.value);
            }
        });
        
        // Form submission
        document.getElementById('practiceDetailsForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSession();
        });
        
        // Clear button
        document.getElementById('clearBtn')?.addEventListener('click', () => {
            document.getElementById('practiceDetailsForm').reset();
            if (this.timer) {
                this.timer.reset();
            }
        });
    }

    switchMode(mode) {
        this.currentMode = mode;
        
        // Update active states
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        document.querySelectorAll('.mode-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${mode}Content`);
        });
        
        // Initialize mode-specific components
        switch (mode) {
            case 'metronome':
                this.initializeMetronome();
                break;
            case 'audio':
                this.initializeAudioPlayer();
                break;
            case 'youtube':
                this.initializeYouTubePlayer();
                break;
        }
    }

    initializeMetronome() {
        const container = document.getElementById('metronomeContainer');
        if (container) {
            if (!this.metronome) {
                this.metronome = new Metronome(container);
            }
            // Metronome already renders itself in init()
        }
    }

    initializeAudioPlayer() {
        if (!this.audioPlayer) {
            this.audioPlayer = new AudioPlayer(this.audioService);
        }
        // Audio player will be initialized when file is selected
    }

    initializeYouTubePlayer() {
        // YouTube player initialization will be handled when URL is entered
    }

    async loadAudioFile(file) {
        const container = document.getElementById('audioPlayerContainer');
        if (container && this.audioPlayer) {
            container.innerHTML = this.audioPlayer.render();
            this.audioPlayer.attachEventListeners();
            await this.audioPlayer.loadFile(file);
        }
    }

    loadYouTubeVideo(urlOrId) {
        // Extract video ID from URL if needed
        let videoId = urlOrId;
        const match = urlOrId.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (match) {
            videoId = match[1];
        }
        
        const container = document.getElementById('youtubePlayerContainer');
        if (container) {
            container.innerHTML = `
                <div class="youtube-player-wrapper">
                    <iframe 
                        width="100%" 
                        height="315" 
                        src="https://www.youtube.com/embed/${videoId}?enablejsapi=1" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
            `;
        }
    }

    async saveSession() {
        const duration = this.timer ? this.timer.getElapsedTime() : 0;
        if (duration === 0) {
            alert('Please record some practice time before saving.');
            return;
        }
        
        const sessionData = {
            date: new Date().toISOString(),
            duration: duration,
            title: document.getElementById('practiceTitle')?.value || 'Practice Session',
            notes: document.getElementById('practiceNotes')?.value || '',
            tempo: parseInt(document.getElementById('practiceTempo')?.value) || null,
            key: document.getElementById('practiceKey')?.value || '',
            mode: this.currentMode,
            timestamp: Date.now()
        };
        
        // Add mode-specific data
        if (this.currentMode === 'metronome' && this.metronome) {
            sessionData.metronomeSettings = {
                tempo: this.metronome.tempo,
                timeSignature: this.metronome.timeSignature,
                sound: this.metronome.sound
            };
        }
        
        await this.storageService.savePracticeEntry(sessionData);
        
        // Show success message (we'll update the header from dashboard)
        if (this.onSaveCallback) {
            this.onSaveCallback(sessionData);
        }
        
        // Reset form but keep timer running
        document.getElementById('practiceDetailsForm').reset();
        
        // Show success feedback
        const saveBtn = document.getElementById('saveSessionBtn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '✓ Saved!';
        saveBtn.disabled = true;
        
        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        }, 2000);
    }

    setOnSaveCallback(callback) {
        this.onSaveCallback = callback;
    }

    destroy() {
        // Clean up
        if (this.timer) {
            this.timer.stop();
            this.timer.destroy();
        }
        if (this.metronome) {
            this.metronome.stop();
            if (this.metronome.destroy) {
                this.metronome.destroy();
            }
        }
        if (this.audioPlayer) {
            this.audioPlayer.pause();
            if (this.audioPlayer.destroy) {
                this.audioPlayer.destroy();
            }
        }
    }
}
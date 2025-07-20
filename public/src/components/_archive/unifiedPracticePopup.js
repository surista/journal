// Unified Practice Popup Component
import { Timer } from './timer.js';
import { Metronome } from './metronome.js';
import { AudioPlayer } from './audioPlayer.js';
import { AudioService } from '../services/audioService.js';

export class UnifiedPracticePopup {
    constructor(storageService) {
        this.storageService = storageService;
        this.timer = new Timer();
        this.metronome = null;
        this.audioPlayer = null;
        this.audioService = new AudioService();
        this.currentMode = 'metronome'; // metronome, audio, youtube
        this.isOpen = false;
        this.onSaveCallback = null;
    }

    open(onSave) {
        this.isOpen = true;
        this.onSaveCallback = onSave;
        this.render();
        this.attachEventListeners();
        
        // Initialize timer
        this.timer.init(document.getElementById('unifiedTimer'));
        
        // Show default mode
        this.switchMode('metronome');
    }

    close() {
        this.isOpen = false;
        
        // Stop everything
        if (this.timer) this.timer.stop();
        if (this.metronome) this.metronome.stop();
        if (this.audioPlayer) this.audioPlayer.pause();
        
        // Remove popup
        const popup = document.getElementById('unifiedPracticePopup');
        if (popup) {
            popup.remove();
        }
    }

    render() {
        const popup = document.createElement('div');
        popup.id = 'unifiedPracticePopup';
        popup.className = 'unified-popup-overlay';
        popup.innerHTML = `
            <div class="unified-popup">
                <div class="popup-header">
                    <h2>Practice Session</h2>
                    <button class="popup-close" id="closePopup">&times;</button>
                </div>
                
                <div class="popup-content">
                    <!-- Timer Section -->
                    <div class="timer-section">
                        <div id="unifiedTimer" class="unified-timer">00:00</div>
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
                            Start timer with audio
                        </label>
                    </div>
                    
                    <!-- Mode Selection -->
                    <div class="mode-selection">
                        <button class="mode-btn active" data-mode="metronome">
                            <span class="mode-icon">🎵</span>
                            <span class="mode-text">Metronome</span>
                        </button>
                        <button class="mode-btn" data-mode="audio">
                            <span class="mode-icon">📁</span>
                            <span class="mode-text">Audio File</span>
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
                                          rows="3"
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
                                <button type="button" class="btn btn-secondary" id="cancelBtn">Cancel</button>
                                <button type="submit" class="btn btn-primary" id="saveSessionBtn">Save Session</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
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
        if (!this.metronome) {
            this.metronome = new Metronome();
        }
        const container = document.getElementById('metronomeContainer');
        if (container) {
            container.innerHTML = this.metronome.render();
            this.metronome.attachEventListeners();
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

    attachEventListeners() {
        // Close button
        document.getElementById('closePopup')?.addEventListener('click', () => this.close());
        
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
            if (this.timer.isRunning) {
                this.timer.pause();
                playPauseBtn.querySelector('.btn-icon').textContent = '▶';
                playPauseBtn.querySelector('.btn-text').textContent = 'Play';
            } else {
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
            this.timer.stop();
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
        
        // Cancel button
        document.getElementById('cancelBtn')?.addEventListener('click', () => this.close());
        
        // Close on overlay click
        document.getElementById('unifiedPracticePopup')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('unified-popup-overlay')) {
                this.close();
            }
        });
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
        const duration = this.timer.getElapsedTime();
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
        
        if (this.onSaveCallback) {
            this.onSaveCallback(sessionData);
        }
        
        this.close();
    }
}
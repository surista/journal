// UI Controller Module - Handles UI interactions and mode switching
export class UIController {
    constructor() {
        this.currentMode = 'metronome';
        this.modeChangeCallbacks = [];
        this.elements = {};
    }

    initialize() {
        this.cacheElements();
        this.attachModeListeners();
    }

    cacheElements() {
        // Timer elements
        this.elements.timerDisplay = document.getElementById('minimalTimerDisplay');
        this.elements.playPauseBtn = document.getElementById('playPauseBtn');
        this.elements.stopBtn = document.getElementById('stopBtn');
        this.elements.saveSessionBtn = document.getElementById('saveSessionBtn');
        this.elements.syncCheckbox = document.getElementById('syncMetronome');
        
        // Mode tabs
        this.elements.modeTabs = document.querySelectorAll('.mode-tab');
        this.elements.modePanels = {
            metronome: document.getElementById('metronomePanel'),
            audio: document.getElementById('audioPanel'),
            youtube: document.getElementById('youtubePanel')
        };
        
        // Metronome elements
        this.elements.bpmValue = document.getElementById('bpmValue');
        this.elements.bpmSlider = document.getElementById('bpmSlider');
        this.elements.metronomeStart = document.getElementById('metronomeStart');
        this.elements.metronomeStop = document.getElementById('metronomeStop');
        this.elements.timeSignature = document.getElementById('timeSignature');
        this.elements.soundSelect = document.getElementById('soundSelect');
        this.elements.tapTempo = document.getElementById('tapTempo');
        
        // Image elements
        this.elements.imageUpload = document.getElementById('imageUpload');
        this.elements.uploadImageBtn = document.getElementById('uploadImageBtn');
        this.elements.removeImageBtn = document.getElementById('removeImageBtn');
        this.elements.imagePreview = document.getElementById('imagePreview');
        this.elements.previewImg = document.getElementById('previewImg');
        
        // Audio elements
        this.elements.audioFileInput = document.getElementById('audioFileInput');
        this.elements.browseAudioBtn = document.getElementById('browseAudioBtn');
        this.elements.audioPlayerContainer = document.getElementById('audioPlayerContainer');
        this.elements.currentFileName = document.getElementById('currentFileName');
        this.elements.currentFileNameWrapper = document.getElementById('currentFileNameWrapper');
        
        // YouTube elements
        this.elements.youtubeUrl = document.getElementById('youtubeUrl');
        this.elements.loadYoutubeBtn = document.getElementById('loadYoutubeBtn');
        this.elements.youtubePlayerWrapper = document.getElementById('youtubePlayerWrapper');
        this.elements.youtubePlayer = document.getElementById('youtubePlayer');
    }

    attachModeListeners() {
        this.elements.modeTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.switchMode(mode);
            });
        });
    }

    switchMode(mode) {
        if (this.currentMode === mode) return;
        
        // Update current mode
        this.currentMode = mode;
        
        // Update tab active states
        this.elements.modeTabs.forEach(tab => {
            if (tab.dataset.mode === mode) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Update panel visibility
        Object.keys(this.elements.modePanels).forEach(panelMode => {
            const panel = this.elements.modePanels[panelMode];
            if (panel) {
                if (panelMode === mode) {
                    panel.classList.add('active');
                    panel.style.display = 'block';
                } else {
                    panel.classList.remove('active');
                    panel.style.display = 'none';
                }
            }
        });
        
        // Special handling for YouTube mode
        if (mode === 'youtube') {
            const youtubeInput = document.querySelector('.youtube-input-minimal');
            if (youtubeInput) {
                youtubeInput.style.display = 'block';
            }
        }
        
        // Notify callbacks
        this.modeChangeCallbacks.forEach(callback => {
            callback(mode, this.currentMode);
        });
    }

    onModeChange(callback) {
        this.modeChangeCallbacks.push(callback);
    }

    // Timer UI methods
    updateTimerDisplay(timeString) {
        if (this.elements.timerDisplay) {
            this.elements.timerDisplay.textContent = timeString;
        }
    }

    updateTimerControls(isRunning) {
        if (this.elements.playPauseBtn) {
            const text = this.elements.playPauseBtn.querySelector('.control-text');
            if (text) {
                text.textContent = isRunning ? 'Pause' : 'Play';
            }
            if (isRunning) {
                this.elements.playPauseBtn.classList.add('playing');
            } else {
                this.elements.playPauseBtn.classList.remove('playing');
            }
        }
    }

    showSaveButton(show) {
        if (this.elements.saveSessionBtn) {
            this.elements.saveSessionBtn.style.display = show ? 'block' : 'none';
        }
    }

    // Metronome UI methods
    updateBpmDisplay(bpm) {
        if (this.elements.bpmValue) {
            this.elements.bpmValue.textContent = bpm;
        }
        if (this.elements.bpmSlider) {
            this.elements.bpmSlider.value = bpm;
        }
    }

    updateMetronomeControls(isPlaying) {
        if (this.elements.metronomeStart) {
            this.elements.metronomeStart.style.display = isPlaying ? 'none' : 'block';
        }
        if (this.elements.metronomeStop) {
            this.elements.metronomeStop.style.display = isPlaying ? 'block' : 'none';
        }
    }

    updateAccentPattern(pattern) {
        document.querySelectorAll('.accent-btn').forEach((btn, index) => {
            if (index < pattern.length) {
                btn.style.display = 'block';
                if (pattern[index]) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            } else {
                btn.style.display = 'none';
            }
        });
    }

    // Image UI methods
    showImagePreview(imageSrc) {
        if (this.elements.previewImg) {
            this.elements.previewImg.src = imageSrc;
        }
        if (this.elements.imagePreview) {
            this.elements.imagePreview.style.display = 'block';
        }
        if (this.elements.uploadImageBtn) {
            this.elements.uploadImageBtn.style.display = 'none';
        }
        const pasteHint = document.querySelector('.paste-hint');
        if (pasteHint) {
            pasteHint.style.display = 'none';
        }
    }

    hideImagePreview() {
        if (this.elements.previewImg) {
            this.elements.previewImg.src = '';
        }
        if (this.elements.imagePreview) {
            this.elements.imagePreview.style.display = 'none';
        }
        if (this.elements.uploadImageBtn) {
            this.elements.uploadImageBtn.style.display = 'block';
        }
        if (this.elements.imageUpload) {
            this.elements.imageUpload.value = '';
        }
        const pasteHint = document.querySelector('.paste-hint');
        if (pasteHint) {
            pasteHint.style.display = 'block';
        }
    }

    // Audio UI methods
    showAudioFileName(fileName) {
        if (this.elements.currentFileName) {
            this.elements.currentFileName.textContent = `Current: ${fileName}`;
        }
        if (this.elements.currentFileNameWrapper) {
            this.elements.currentFileNameWrapper.style.display = 'block';
        }
    }

    hideAudioFileName() {
        if (this.elements.currentFileNameWrapper) {
            this.elements.currentFileNameWrapper.style.display = 'none';
        }
    }

    // YouTube UI methods
    showYouTubePlayer() {
        const youtubeInput = document.querySelector('.youtube-input-minimal');
        if (youtubeInput) {
            youtubeInput.style.display = 'none';
        }
        if (this.elements.youtubePlayerWrapper) {
            this.elements.youtubePlayerWrapper.style.display = 'block';
        }
    }

    hideYouTubePlayer() {
        const youtubeInput = document.querySelector('.youtube-input-minimal');
        if (youtubeInput) {
            youtubeInput.style.display = 'block';
        }
        if (this.elements.youtubePlayerWrapper) {
            this.elements.youtubePlayerWrapper.style.display = 'none';
        }
    }

    // Notification methods
    showNotification(message, type = 'info') {
        if (window.notificationManager) {
            window.notificationManager.show(message, type);
        } else {
            // Fallback notification
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
    }

    // Modal methods
    showModal(content, options = {}) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                ${content}
            </div>
        `;

        if (options.onClose) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                    options.onClose();
                }
            });
        }

        document.body.appendChild(modal);
        return modal;
    }

    // Get element references
    getElement(key) {
        return this.elements[key];
    }

    // Get current mode
    getCurrentMode() {
        return this.currentMode;
    }

    destroy() {
        // Remove event listeners if needed
        this.modeChangeCallbacks = [];
        this.elements = {};
    }
}
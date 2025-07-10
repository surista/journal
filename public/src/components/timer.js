// Timer Component - Fixed with proper DOM handling and error recovery
export class Timer {
    constructor(container) {
        this.container = container;
        this.startTime = null;
        this.elapsedTime = 0;
        this.isRunning = false;
        this.interval = null;
        this.lastActiveTime = Date.now();
        this.keyboardHandler = null;
        this.isDestroyed = false;

        // Load saved sync preference with fallback
        const savedSyncPref = localStorage.getItem('timerSyncWithAudio');
        this.syncWithAudio = savedSyncPref === 'true';

        // Bind methods to ensure correct context
        this.start = this.start.bind(this);
        this.pause = this.pause.bind(this);
        this.reset = this.reset.bind(this);
        this.toggleTimer = this.toggleTimer.bind(this);

        // Make timer instance globally accessible
        window.currentTimer = this;

        this.init();
    }

    init() {
        if (this.isDestroyed) return;

        this.render();
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
            if (!this.isDestroyed) {
                this.attachEventListeners();
                this.setupKeyboardShortcuts();
            }
        }, 100);
    }

    render() {
        if (this.isDestroyed || !this.container) return;

        const uniqueId = `timerDisplay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.displayId = uniqueId;

        this.container.innerHTML = `
        <div class="timer-widget">
            <div class="timer-main-row">
                <h3 class="timer-title">
                    <i class="icon">⏱️</i> Practice Timer
                </h3>
                <div class="timer-display" id="${uniqueId}">00:00:00</div>
                <div class="timer-controls">
                    <button id="timerStartBtn_${uniqueId}" class="btn btn-primary" type="button">
                        <i class="icon">▶️</i> Start
                    </button>
                    <button id="timerResetBtn_${uniqueId}" class="btn btn-secondary" type="button">
                        <i class="icon">↻</i> Reset
                    </button>
                </div>
            </div>
            <div class="timer-footer">
                <label class="timer-sync-label">
                    <input type="checkbox" id="timerSyncCheckbox_${uniqueId}" ${this.syncWithAudio ? 'checked' : ''} />
                    <span>Start timer with audio/metronome</span>
                </label>
                <div class="timer-hint">Press Space to start/stop</div>
            </div>
            
            <!-- Save Practice Log button (shows when timer has elapsed time) -->
            <div id="savePracticeLogSection_${uniqueId}" style="display: none; margin-top: 16px;">
                <button id="savePracticeLogBtn_${uniqueId}" class="btn btn-primary" style="width: 100%; padding: 12px;">
                    📝 Save Practice Log
                </button>
            </div>
        </div>
    `;
    }

    attachEventListeners() {
        if (this.isDestroyed) return;

        // Use unique IDs for all elements
        const startBtn = document.getElementById(`timerStartBtn_${this.displayId}`);
        const resetBtn = document.getElementById(`timerResetBtn_${this.displayId}`);
        const syncCheckbox = document.getElementById(`timerSyncCheckbox_${this.displayId}`);
        const savePracticeBtn = document.getElementById(`savePracticeLogBtn_${this.displayId}`);

        if (startBtn) {
            startBtn.removeEventListener('click', this.toggleTimer);
            startBtn.addEventListener('click', this.toggleTimer);
        } else {
            console.warn('Timer start button not found');
        }

        if (resetBtn) {
            resetBtn.removeEventListener('click', this.reset);
            resetBtn.addEventListener('click', this.reset);
        } else {
            console.warn('Timer reset button not found');
        }

        // Save Practice Log button
        if (savePracticeBtn) {
            savePracticeBtn.addEventListener('click', () => {
                this.openPracticeLogModal();
            });
        }

        // Handle sync checkbox with proper error handling
        if (syncCheckbox) {
            syncCheckbox.addEventListener('change', (e) => {
                this.syncWithAudio = e.target.checked;
                try {
                    localStorage.setItem('timerSyncWithAudio', String(this.syncWithAudio));
                    console.log('Timer sync preference saved:', this.syncWithAudio);
                } catch (error) {
                    console.warn('Failed to save timer sync preference:', error);
                }
            });

            // Set initial state
            syncCheckbox.checked = this.syncWithAudio;
            console.log('Timer sync checkbox initialized:', this.syncWithAudio);
        } else {
            console.error('Timer sync checkbox not found! ID:', `timerSyncCheckbox_${this.displayId}`);

            // Retry after a short delay
            setTimeout(() => {
                const retryCheckbox = document.getElementById(`timerSyncCheckbox_${this.displayId}`);
                if (retryCheckbox && !this.isDestroyed) {
                    retryCheckbox.addEventListener('change', (e) => {
                        this.syncWithAudio = e.target.checked;
                        try {
                            localStorage.setItem('timerSyncWithAudio', String(this.syncWithAudio));
                        } catch (error) {
                            console.warn('Failed to save timer sync preference:', error);
                        }
                    });
                    retryCheckbox.checked = this.syncWithAudio;
                    console.log('Timer sync checkbox found on retry');
                }
            }, 500);
        }
    }

    setupKeyboardShortcuts() {
        if (this.isDestroyed) return;

        // Remove any existing listener first
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
        }

        // Create new handler
        this.keyboardHandler = (e) => {
            if (this.isDestroyed) return;

            // Check if we're in an input field
            if (e.target.tagName === 'INPUT' ||
                e.target.tagName === 'TEXTAREA' ||
                e.target.isContentEditable) {
                return;
            }

            if (e.code === 'Space') {
                e.preventDefault();
                this.toggleTimer();
            } else if (e.code === 'KeyR' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.reset();
            }
        };

        // Attach to document
        document.addEventListener('keydown', this.keyboardHandler);
    }

    toggleTimer() {
        if (this.isDestroyed) return;

        if (this.isRunning) {
            this.pause();
        } else {
            this.start();
        }
    }

    start() {
        if (this.isDestroyed || this.isRunning) {
            return;
        }

        console.log('Starting timer - current state:', {
            isRunning: this.isRunning,
            elapsedTime: this.elapsedTime,
            startTime: this.startTime,
            displayId: this.displayId
        });

        this.isRunning = true;
        this.startTime = Date.now() - this.elapsedTime;

        this.interval = setInterval(() => {
            if (this.isDestroyed) {
                this.cleanup();
                return;
            }

            this.elapsedTime = Date.now() - this.startTime;
            this.updateDisplay();
            this.updateSavePracticeLogButton();
            this.lastActiveTime = Date.now();
        }, 100);

        this.updateButtonState();
        this.updateSavePracticeLogButton();

        // Dispatch custom event for sync
        if (this.syncWithAudio) {
            window.dispatchEvent(new CustomEvent('timerStarted', {
                detail: {source: 'timer', timestamp: Date.now()}
            }));
        }

        console.log('Timer started successfully');
    }

    pause() {
        if (this.isDestroyed || !this.isRunning) return;

        console.log('Pausing timer');
        this.isRunning = false;

        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        this.updateButtonState();
        // Don't hide the save button on pause - keep it visible if there's elapsed time

        // Dispatch custom event for sync
        if (this.syncWithAudio) {
            window.dispatchEvent(new CustomEvent('timerPaused', {
                detail: {source: 'timer', timestamp: Date.now()}
            }));
        }
    }

    stop() {
        this.pause();
    }

    reset() {
        if (this.isDestroyed) return;

        console.log('Resetting timer');
        this.pause();
        this.elapsedTime = 0;
        this.startTime = null;
        this.updateDisplay();
        this.updateButtonState();

        // Hide save practice log button only when reset to 00:00:00
        const saveSection = document.getElementById(`savePracticeLogSection_${this.displayId}`);
        if (saveSection) saveSection.style.display = 'none';

        // Dispatch custom event for sync
        window.dispatchEvent(new CustomEvent('timerReset', {
            detail: {source: 'timer', timestamp: Date.now()}
        }));
    }

    updateDisplay() {
        if (this.isDestroyed) return;

        const display = document.getElementById(this.displayId);
        if (display) {
            const hours = Math.floor(this.elapsedTime / 3600000);
            const minutes = Math.floor((this.elapsedTime % 3600000) / 60000);
            const seconds = Math.floor((this.elapsedTime % 60000) / 1000);

            display.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    updateButtonState() {
        if (this.isDestroyed) return;

        const startBtn = document.getElementById(`timerStartBtn_${this.displayId}`);
        if (startBtn) {
            if (this.isRunning) {
                startBtn.innerHTML = '<i class="icon">⏸️</i> Pause';
                startBtn.classList.remove('btn-primary');
                startBtn.classList.add('btn-warning');
            } else {
                startBtn.innerHTML = '<i class="icon">▶️</i> Start';
                startBtn.classList.remove('btn-warning');
                startBtn.classList.add('btn-primary');
            }
        }
    }

    updateSavePracticeLogButton() {
        const saveSection = document.getElementById(`savePracticeLogSection_${this.displayId}`);
        if (saveSection) {
            // Show button if there's any elapsed time (not 00:00:00)
            if (this.elapsedTime > 0) {
                saveSection.style.display = 'block';
            } else {
                saveSection.style.display = 'none';
            }
        }
    }

    openPracticeLogModal() {
        // Pause timer
        if (this.isRunning) {
            this.pause();
        }

        // Get current context and pause everything that's playing
        const currentTab = window.location.hash.slice(1) || 'practice';
        const duration = this.elapsedTime;

        let contextData = {
            duration: duration,
            tab: currentTab,
            audioFile: '',
            youtubeInfo: '',
            tempo: null,
            bpm: null
        };

        // Find audio player - try multiple locations
        let audioPlayer = null;

        // Try to find via dashboard components
        if (window.app?.currentPage?.components?.audioPlayer) {
            audioPlayer = window.app.currentPage.components.audioPlayer;
        }
        // Try to find via audio tab
        else if (window.app?.currentPage?.tabs?.audio?.audioPlayer) {
            audioPlayer = window.app.currentPage.tabs.audio.audioPlayer;
        }

        console.log('Found audio player:', audioPlayer);
        console.log('Audio player playing:', audioPlayer?.isPlaying);
        console.log('Current file:', audioPlayer?.currentFileName);
        console.log('YouTube mode:', audioPlayer?.isYouTubeMode);
        console.log('YouTube title:', audioPlayer?.youtubeVideoTitle);

        if (audioPlayer) {
            // Always capture current file info, whether playing or not
            if (audioPlayer.isYouTubeMode) {
                contextData.youtubeInfo = audioPlayer.youtubeVideoTitle || audioPlayer.youtubeVideoUrl || '';
                contextData.youtubeUrl = audioPlayer.youtubeVideoUrl || '';
                if (audioPlayer.playbackRate) {
                    contextData.tempo = Math.round(audioPlayer.playbackRate * 100);
                }
            } else if (audioPlayer.currentFileName) {  // Add this entire else if block
                contextData.audioFile = audioPlayer.currentFileName;
                if (audioPlayer.playbackRate) {
                    contextData.tempo = Math.round(audioPlayer.playbackRate * 100);
                }
            }

            // Pause if playing
            if (audioPlayer.isPlaying) {
                if (audioPlayer.isYouTubeMode && audioPlayer.youtubePlayer) {
                    audioPlayer.youtubePlayer.pauseVideo();
                } else if (audioPlayer.grainPlayer) {
                    audioPlayer.grainPlayer.stop();
                    audioPlayer.isPlaying = false;
                    audioPlayer.updatePlayPauseButton();
                }
            }
        }

        // Find metronome - try multiple locations
        let metronome = null;
        if (window.app?.currentPage?.components?.metronome) {
            metronome = window.app.currentPage.components.metronome;
        } else if (window.app?.currentPage?.tabs?.metronome?.metronome) {
            metronome = window.app.currentPage.tabs.metronome.metronome;
        }

        // Check and pause metronome
        if (metronome) {
            if (metronome.isPlaying) {
                metronome.stop();
            }
            // Only set BPM if we don't have audio file or YouTube (to avoid showing both tempo and BPM)
            if (!contextData.audioFile && !contextData.youtubeInfo) {
                contextData.bpm = metronome.currentBPM || metronome.bpm || '';
            }
        }

        console.log('Final context data:', contextData);

        // Create and show modal
        this.createPracticeLogModal(contextData);
    }

    createPracticeLogModal(contextData) {
        const modal = document.createElement('div');
        modal.className = 'practice-log-modal show';

        const minutes = Math.floor(contextData.duration / 60000);
        const seconds = Math.floor((contextData.duration % 60000) / 1000);
        const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        modal.innerHTML = `
    <div class="practice-log-content">
        <h2>Save Practice Log</h2>
        <form id="practiceLogForm">
            <div class="form-group">
                <label>Session Duration</label>
                <input type="text" value="${formattedDuration}" readonly>
            </div>
            
            <div class="form-group">
                <label>Audio File</label>
                <input type="text" value="${contextData.audioFile}" readonly>
            </div>
            
            <div class="form-group">
                <label>YouTube Video</label>
                <input type="text" value="${contextData.youtubeInfo}" readonly>
            </div>
            
            ${contextData.youtubeUrl ? `
                <div class="form-group">
                    <label>YouTube URL</label>
                    <input type="text" value="${contextData.youtubeUrl}" readonly>
                </div>
            ` : ''}
            
            ${contextData.tempo ? `
                <div class="form-group">
                    <label>Tempo</label>
                    <input type="text" value="${contextData.tempo}%" readonly>
                </div>
            ` : ''}
            
            ${contextData.bpm ? `
                <div class="form-group">
                    <label>${(contextData.audioFile || contextData.youtubeInfo) ? 'Tempo' : 'BPM'}</label>
                    <input type="text" value="${(contextData.audioFile || contextData.youtubeInfo) ? contextData.tempo + '%' : contextData.bpm}" readonly>
                </div>
            ` : ''}
            
            <div class="form-group">
                <label>Practice Area *</label>
                <select name="practiceArea" required>
                    <option value="">Select practice area...</option>
                    <option value="Scales">Scales</option>
                    <option value="Chords">Chords</option>
                    <option value="Arpeggios">Arpeggios</option>
                    <option value="Songs">Songs</option>
                    <option value="Technique">Technique</option>
                    <option value="Theory">Theory</option>
                    <option value="Improvisation">Improvisation</option>
                    <option value="Sight Reading">Sight Reading</option>
                    <option value="Ear Training">Ear Training</option>
                    <option value="Rhythm">Rhythm</option>
                    <option value="Audio Practice">Audio Practice</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Key (optional)</label>
                <select name="key">
                    <option value="">Select key...</option>
                    <option value="C Major">C Major</option>
                    <option value="D Major">D Major</option>
                    <option value="E Major">E Major</option>
                    <option value="F Major">F Major</option>
                    <option value="G Major">G Major</option>
                    <option value="A Major">A Major</option>
                    <option value="B Major">B Major</option>
                    <option value="C Minor">C Minor</option>
                    <option value="D Minor">D Minor</option>
                    <option value="E Minor">E Minor</option>
                    <option value="F Minor">F Minor</option>
                    <option value="G Minor">G Minor</option>
                    <option value="A Minor">A Minor</option>
                    <option value="B Minor">B Minor</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Notes (optional)</label>
                <textarea name="notes" placeholder="What did you work on?"></textarea>
            </div>
            
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Log</button>
            </div>
        </form>
    </div>
    `;

        // Handle form submission
        modal.querySelector('#practiceLogForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePracticeLog(new FormData(e.target), contextData);
            modal.remove();
        });

        // Handle cancel button
        modal.querySelector('.btn-secondary').addEventListener('click', () => {
            modal.remove();
        });

        document.body.appendChild(modal);

        // Handle ESC key to close modal
        const handleEscKey = (e) => {
            if (e.key === 'Escape' || e.key === 'Esc') {
                modal.remove();
                document.removeEventListener('keydown', handleEscKey);
            }
        };
        document.addEventListener('keydown', handleEscKey);

// Also remove the event listener when modal is closed via other methods
        modal.querySelector('.btn-secondary').addEventListener('click', () => {
            document.removeEventListener('keydown', handleEscKey);
            modal.remove();
        });

// Update form submission to also remove the ESC listener
        modal.querySelector('#practiceLogForm').addEventListener('submit', (e) => {
            e.preventDefault();
            document.removeEventListener('keydown', handleEscKey);
            this.savePracticeLog(new FormData(e.target), contextData);
            modal.remove();
        });
    }

    async savePracticeLog(formData, contextData) {
        const practiceEntry = {
            id: Date.now(),
            date: new Date().toISOString(),
            duration: Math.floor(contextData.duration / 1000), // Convert to seconds
            practiceArea: formData.get('practiceArea'),
            key: formData.get('key') || null,
            notes: formData.get('notes') || null,
            // Add context-specific data
            ...(contextData.audioFile && {audioFile: contextData.audioFile}),
            ...(contextData.youtubeInfo && {youtubeTitle: contextData.youtubeInfo}),
            ...(contextData.youtubeUrl && {youtubeUrl: contextData.youtubeUrl}), // Add this line
            ...(contextData.tempo && {tempoPercentage: contextData.tempo}),
            ...(contextData.bpm && {bpm: contextData.bpm})
        };

        try {
            // Get storage service
            const storageService = window.app?.currentPage?.storageService;
            if (storageService) {
                await storageService.savePracticeEntry(practiceEntry);

                // Reset/stop everything after successful save
                this.reset(); // Reset timer

                // Stop audio player
                const audioPlayer = window.app?.currentPage?.components?.audioPlayer;
                if (audioPlayer) {
                    audioPlayer.stop();
                }

                // Stop metronome
                const metronome = window.app?.currentPage?.components?.metronome;
                if (metronome && metronome.isPlaying) {
                    metronome.stop();
                }

                const minutes = Math.floor(contextData.duration / 60000);
                const message = `Saved ${minutes} minute${minutes !== 1 ? 's' : ''} practice session - rock on! 🎸✨`;

                // Show notification
                if (window.app?.currentPage?.showNotification) {
                    window.app.currentPage.showNotification(message, 'success');
                } else {
                    alert(message);
                }

                // Dispatch event for other components to update
                window.dispatchEvent(new CustomEvent('practiceSessionSaved', {
                    detail: practiceEntry
                }));
            } else {
                throw new Error('Storage service not available');
            }
        } catch (error) {
            console.error('Error saving practice session:', error);
            if (window.app?.currentPage?.showNotification) {
                window.app.currentPage.showNotification('Failed to save practice session. Please try again.', 'error');
            } else {
                alert('Failed to save practice session. Please try again.');
            }
        }
    }

    // Sync methods for metronome integration
    syncStart(source) {
        console.log(`Timer sync started by ${source}`);
        if (this.syncWithAudio && !this.isRunning) {
            this.start();
        }
    }

    syncStop(source) {
        console.log(`Timer sync stopped by ${source}`);
        if (this.syncWithAudio && this.isRunning) {
            this.pause();
        }
    }

    getElapsedTime() {
        return Math.floor(this.elapsedTime / 1000); // Return in seconds
    }

    getFormattedTime() {
        const hours = Math.floor(this.elapsedTime / 3600000);
        const minutes = Math.floor((this.elapsedTime % 3600000) / 60000);
        const seconds = Math.floor((this.elapsedTime % 60000) / 1000);

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    cleanup() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    destroy() {
        console.log('Destroying timer...');
        this.isDestroyed = true;

        this.cleanup();

        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
            this.keyboardHandler = null;
        }

        // Clean up global reference
        if (window.currentTimer === this) {
            window.currentTimer = null;
        }

        console.log('Timer destroyed successfully');
    }
}
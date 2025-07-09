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
        </div>
    `;
    }

    attachEventListeners() {
        if (this.isDestroyed) return;

        // Use unique IDs for all elements
        const startBtn = document.getElementById(`timerStartBtn_${this.displayId}`);
        const resetBtn = document.getElementById(`timerResetBtn_${this.displayId}`);
        const syncCheckbox = document.getElementById(`timerSyncCheckbox_${this.displayId}`);

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
            this.lastActiveTime = Date.now();
        }, 100);

        this.updateButtonState();

        // Dispatch custom event for sync
        if (this.syncWithAudio) {
            window.dispatchEvent(new CustomEvent('timerStarted', {
                detail: { source: 'timer', timestamp: Date.now() }
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

        // Dispatch custom event for sync
        if (this.syncWithAudio) {
            window.dispatchEvent(new CustomEvent('timerPaused', {
                detail: { source: 'timer', timestamp: Date.now() }
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

        // Dispatch custom event for sync
        window.dispatchEvent(new CustomEvent('timerReset', {
            detail: { source: 'timer', timestamp: Date.now() }
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
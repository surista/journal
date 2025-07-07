// Timer Component - Fixed button functionality
export class Timer {
    constructor(container) {
        this.container = container;
        this.startTime = null;
        this.elapsedTime = 0;
        this.isRunning = false;
        this.interval = null;
        this.lastActiveTime = Date.now();
        this.keyboardHandler = null;
        this.syncWithAudio = false;

        // Bind methods to ensure correct context
        this.start = this.start.bind(this);
        this.pause = this.pause.bind(this);
        this.reset = this.reset.bind(this);
        this.toggleTimer = this.toggleTimer.bind(this);

        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
        this.setupKeyboardShortcuts();
    }

    render() {
        const uniqueId = `timerDisplay_${Date.now()}`;
        this.displayId = uniqueId;

        this.container.innerHTML = `
            <div class="timer-widget">
                <h3 class="timer-title">
                    <i class="icon">⏱️</i> Practice Timer
                </h3>
                <div class="timer-display" id="${uniqueId}">00:00:00</div>
                <div class="timer-controls">
                    <button id="timerStartBtn_${uniqueId}" class="btn btn-primary">
                        <i class="icon">▶️</i> Start
                    </button>
                    <button id="timerResetBtn_${uniqueId}" class="btn btn-secondary">
                        <i class="icon">↻</i> Reset
                    </button>
                    <label class="timer-sync-label">
                        <input type="checkbox" id="timerSyncCheckbox" ${this.syncWithAudio ? 'checked' : ''} />
                        <span>Start timer with audio/metronome</span>
                    </label>
                    
                </div>
                <div class="timer-hint">Press Space to start/stop</div>
            </div>
        `;
    }

    attachEventListeners() {

// Timer sync checkbox - ensure we get the right element
        setTimeout(() => {
            const syncCheckbox = document.getElementById('timerSyncCheckbox');
            if (syncCheckbox) {
                // Remove any existing listeners first
                const newCheckbox = syncCheckbox.cloneNode(true);
                syncCheckbox.parentNode.replaceChild(newCheckbox, syncCheckbox);

                // Set up the new listener
                newCheckbox.addEventListener('change', (e) => {
                    this.syncWithAudio = e.target.checked;
                    localStorage.setItem('timerSyncWithAudio', String(this.syncWithAudio));
                    console.log('Timer sync changed to:', this.syncWithAudio);
                });

                // Load saved preference or use the current checkbox state
                const savedPref = localStorage.getItem('timerSyncWithAudio');
                if (savedPref !== null) {
                    this.syncWithAudio = savedPref === 'true';
                    newCheckbox.checked = this.syncWithAudio;
                } else {
                    // No saved preference, use current checkbox state
                    this.syncWithAudio = newCheckbox.checked;
                    localStorage.setItem('timerSyncWithAudio', String(this.syncWithAudio));
                }

                // Log the initial state
                console.log('Timer sync initialized to:', this.syncWithAudio, 'Checkbox checked:', newCheckbox.checked);
            } else {
                console.error('Timer sync checkbox not found!');
            }
        }, 100); // Small delay to ensure DOM is ready
        const startBtn = document.getElementById(`timerStartBtn_${this.displayId}`);
        const resetBtn = document.getElementById(`timerResetBtn_${this.displayId}`);

        if (startBtn) {
            startBtn.removeEventListener('click', this.toggleTimer);
            startBtn.addEventListener('click', this.toggleTimer);
        }

        if (resetBtn) {
            resetBtn.removeEventListener('click', this.reset);
            resetBtn.addEventListener('click', this.reset);
        }
    }

    setupKeyboardShortcuts() {
        // Remove any existing listener first
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
        }

        // Create new handler
        this.keyboardHandler = (e) => {
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
        if (this.isRunning) {
            this.pause();
        } else {
            this.start();
        }
    }

    start() {
        if (this.isRunning) {
            console.log('Timer already running, not starting again');
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
            this.elapsedTime = Date.now() - this.startTime;
            this.updateDisplay();
            this.lastActiveTime = Date.now();
        }, 100);

        this.updateButtonState();

        console.log('Timer started - new state:', {
            isRunning: this.isRunning,
            interval: !!this.interval
        });
    }

    pause() {
        if (!this.isRunning) return;

        console.log('Pausing timer');
        this.isRunning = false;

        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        this.updateButtonState();
    }

    stop() {
        this.pause();
    }

    reset() {
        console.log('Resetting timer');
        this.pause();
        this.elapsedTime = 0;
        this.startTime = null;
        this.updateDisplay();
        this.updateButtonState();
    }

    updateDisplay() {
        const display = document.getElementById(this.displayId);
        if (display) {
            const hours = Math.floor(this.elapsedTime / 3600000);
            const minutes = Math.floor((this.elapsedTime % 3600000) / 60000);
            const seconds = Math.floor((this.elapsedTime % 60000) / 1000);

            display.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    updateButtonState() {
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
        // Optionally start the timer when metronome starts
        // this.start();
    }

    syncStop(source) {
        console.log(`Timer sync stopped by ${source}`);
        // Optionally stop the timer when metronome stops
        // this.stop();
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

    destroy() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
        }
    }
}
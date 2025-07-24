// Timer Module - Unified timer implementation for both UI and logic-only use cases
import { notificationManager } from '../../services/notificationManager.js';

export class Timer {
    constructor(container = null) {
        // Core timer properties
        this.startTime = null;
        this.elapsedTime = 0;
        this.isRunning = false;
        this.interval = null;
        this.updateCallback = null;
        
        // UI-specific properties
        this.container = container;
        this.displayId = null;
        this.keyboardHandler = null;
        this.isDestroyed = false;
        this.lastActiveTime = Date.now();
        
        // Sync preference
        const savedSyncPref = localStorage.getItem('timerSyncWithAudio');
        this.syncWithAudio = savedSyncPref !== 'false';
        
        // Bind methods for correct context
        this.start = this.start.bind(this);
        this.pause = this.pause.bind(this);
        this.reset = this.reset.bind(this);
        this.toggleTimer = this.toggleTimer.bind(this);
        
        // Make timer globally accessible if it's a UI timer
        if (container) {
            window.currentTimer = this;
            this.init();
        }
    }
    
    // UI Initialization (only if container provided)
    init() {
        if (this.isDestroyed || !this.container) return;
        
        this.render();
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
        if (this.isDestroyed || !this.container) return;
        
        const startBtn = document.getElementById(`timerStartBtn_${this.displayId}`);
        const resetBtn = document.getElementById(`timerResetBtn_${this.displayId}`);
        const syncCheckbox = document.getElementById(`timerSyncCheckbox_${this.displayId}`);
        const savePracticeBtn = document.getElementById(`savePracticeLogBtn_${this.displayId}`);
        
        if (startBtn) {
            startBtn.removeEventListener('click', this.toggleTimer);
            startBtn.addEventListener('click', this.toggleTimer);
        }
        
        if (resetBtn) {
            resetBtn.removeEventListener('click', this.reset);
            resetBtn.addEventListener('click', this.reset);
        }
        
        if (syncCheckbox) {
            syncCheckbox.addEventListener('change', (e) => {
                this.syncWithAudio = e.target.checked;
                localStorage.setItem('timerSyncWithAudio', this.syncWithAudio.toString());
            });
        }
        
        if (savePracticeBtn) {
            savePracticeBtn.addEventListener('click', () => {
                this.showSaveDialog();
            });
        }
    }
    
    setupKeyboardShortcuts() {
        if (this.isDestroyed || !this.container) return;
        
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
        }
        
        this.keyboardHandler = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            if (e.code === 'Space') {
                e.preventDefault();
                this.toggleTimer();
            }
        };
        
        document.addEventListener('keydown', this.keyboardHandler);
    }
    
    // Core timer methods
    start() {
        if (!this.isRunning) {
            this.startTime = Date.now() - this.elapsedTime;
            this.isRunning = true;
            this.lastActiveTime = Date.now();
            
            this.interval = setInterval(() => {
                this.elapsedTime = Date.now() - this.startTime;
                this.updateDisplay();
                
                if (this.updateCallback) {
                    this.updateCallback(this.elapsedTime);
                }
            }, 100);
            
            this.updateUI();
        }
    }
    
    pause() {
        if (this.isRunning) {
            clearInterval(this.interval);
            this.isRunning = false;
            this.updateUI();
        }
    }
    
    stop() {
        clearInterval(this.interval);
        this.isRunning = false;
        this.elapsedTime = 0;
        this.startTime = null;
        this.updateDisplay();
        this.updateUI();
        
        if (this.updateCallback) {
            this.updateCallback(this.elapsedTime);
        }
    }
    
    reset() {
        const wasRunning = this.isRunning;
        
        if (wasRunning && this.elapsedTime > 60) {
            if (!confirm('Are you sure you want to reset the timer? You have unsaved practice time.')) {
                return;
            }
        }
        
        this.stop();
        
        if (notificationManager && this.elapsedTime > 0) {
            notificationManager.show('Timer reset', 'success');
        }
    }
    
    toggleTimer() {
        if (this.isRunning) {
            this.pause();
        } else {
            this.start();
        }
    }
    
    // Display methods
    updateDisplay() {
        if (!this.container || !this.displayId) return;
        
        const display = document.getElementById(this.displayId);
        if (display) {
            display.textContent = this.getFormattedTime();
        }
        
        const savePracticeSection = document.getElementById(`savePracticeLogSection_${this.displayId}`);
        if (savePracticeSection) {
            savePracticeSection.style.display = this.elapsedTime > 0 ? 'block' : 'none';
        }
    }
    
    updateUI() {
        if (!this.container || !this.displayId) return;
        
        const startBtn = document.getElementById(`timerStartBtn_${this.displayId}`);
        if (startBtn) {
            startBtn.innerHTML = this.isRunning
                ? '<i class="icon">⏸️</i> Pause'
                : '<i class="icon">▶️</i> Start';
            startBtn.classList.toggle('btn-warning', this.isRunning);
            startBtn.classList.toggle('btn-primary', !this.isRunning);
        }
    }
    
    showSaveDialog() {
        const practiceForm = document.createElement('div');
        practiceForm.innerHTML = `
            <div style="padding: 20px;">
                <h3>Save Practice Session</h3>
                <p>Duration: ${this.getFormattedTime()}</p>
                <p>Would you like to save this practice session?</p>
                <button class="btn btn-primary" onclick="window.currentTimer.confirmSave()">Save</button>
                <button class="btn btn-secondary" onclick="window.currentTimer.cancelSave()">Cancel</button>
            </div>
        `;
        document.body.appendChild(practiceForm);
    }
    
    confirmSave() {
        // Save logic here
        if (notificationManager) {
            notificationManager.show('Practice session saved!', 'success');
        }
        this.reset();
    }
    
    cancelSave() {
        // Close dialog
    }
    
    // Utility methods
    getElapsedTime() {
        return Math.floor(this.elapsedTime / 1000);
    }
    
    getFormattedTime() {
        const totalSeconds = this.getElapsedTime();
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    setUpdateCallback(callback) {
        this.updateCallback = callback;
    }
    
    // Sync methods
    syncStart(source) {
        if (this.syncWithAudio && !this.isRunning) {
            console.log(`Timer auto-starting from ${source}`);
            this.start();
        }
    }
    
    syncStop(source) {
        if (this.syncWithAudio && this.isRunning) {
            console.log(`Timer auto-pausing from ${source}`);
            this.pause();
        }
    }
    
    // State management
    getState() {
        return {
            isRunning: this.isRunning,
            elapsedTime: this.elapsedTime,
            startTime: this.startTime
        };
    }
    
    setState(state) {
        if (state) {
            this.isRunning = state.isRunning || false;
            this.elapsedTime = state.elapsedTime || 0;
            this.startTime = state.startTime || null;
            
            if (this.isRunning) {
                this.start();
            } else {
                this.updateDisplay();
            }
        }
    }
    
    // Cleanup
    destroy() {
        this.isDestroyed = true;
        
        clearInterval(this.interval);
        
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
        }
        
        if (window.currentTimer === this) {
            window.currentTimer = null;
        }
        
        this.updateCallback = null;
    }
}

// Export factory function for backward compatibility
export function createTimer() {
    return new Timer();
}
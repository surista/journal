// Timer Component - Fixed with inline styles for visibility
import { TimeUtils } from '../utils/helpers.js';
import { notificationManager } from '../services/notificationManager.js';

export class Timer {
    constructor(container) {
        this.container = container;
        this.interval = null;
        this.startTime = null;
        this.elapsedTime = 0;
        this.isRunning = false;
        this.isSyncEnabled = false;
        this.syncedComponents = new Set();

        this.onTimeUpdate = null;
        this.onTimerStateChange = null;

        // Performance optimization
        this.lastDisplayUpdate = 0;
        this.displayUpdateInterval = 100;
    }

    render() {
        // Make sure container exists
        if (!this.container) {
            console.error('Timer container not found');
            return;
        }

        // Clear container first
        this.container.innerHTML = '';

        // Create timer wrapper with explicit inline styles
        const timerWrapper = document.createElement('div');
        timerWrapper.className = 'timer-wrapper';
        timerWrapper.style.cssText = `
            padding: 2rem;
            background: var(--bg-card);
            border-radius: 1.25rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            border: 1px solid var(--border);
            display: block !important;
            opacity: 1 !important;
            visibility: visible !important;
        `;

        timerWrapper.innerHTML = `
            <h2 style="text-align: center; margin-bottom: 20px; color: var(--text-secondary);">Practice Timer</h2>
            
            <!-- Timer Display with explicit inline styles -->
            <div id="timerDisplay" class="timer-display" style="
                font-size: 4rem !important;
                font-weight: 300 !important;
                text-align: center !important;
                margin: 20px auto !important;
                padding: 10px !important;
                font-variant-numeric: tabular-nums !important;
                color: #6366f1 !important;
                line-height: 1.2 !important;
                display: block !important;
                opacity: 1 !important;
                visibility: visible !important;
                position: relative !important;
                z-index: 10 !important;
                background: none !important;
                -webkit-text-fill-color: initial !important;
                min-height: 80px !important;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            ">00:00:00</div>
            
            <div class="timer-subtitle" id="timerSubtitle" style="
                text-align: center;
                color: var(--text-secondary);
                margin-bottom: 20px;
                font-size: 1rem;
            ">Ready to practice</div>
            
            <div class="timer-controls" style="
                display: flex;
                justify-content: center;
                gap: 1rem;
                margin-bottom: 1.5rem;
                flex-wrap: wrap;
            ">
                <button class="btn btn-success" id="startTimer">
                    ▶️ Start Practice
                </button>
                <button class="btn btn-danger" id="stopTimer" style="display: none;">
                    ⏹️ Stop Practice
                </button>
                <button class="btn btn-primary" id="resetTimer">
                    🔄 Reset
                </button>
            </div>
            
            <!-- Timer Sync Toggle -->
            <div class="timer-sync-control" style="
                text-align: center;
                margin: 20px 0;
                padding: 20px;
                background: var(--bg-input);
                border-radius: 1rem;
                border: 1px solid var(--border);
            ">
                <label class="sync-toggle-label" style="
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    cursor: pointer;
                    padding: 10px 15px;
                    border-radius: 0.5rem;
                ">
                    <input type="checkbox" id="timerSyncToggle" ${this.isSyncEnabled ? 'checked' : ''} style="
                        width: 20px;
                        height: 20px;
                        cursor: pointer;
                        accent-color: #6366f1;
                    ">
                    <span style="
                        color: var(--text-primary);
                        font-weight: 500;
                        font-size: 1rem;
                        user-select: none;
                    ">🔗 Sync timer with audio/metronome</span>
                </label>
                <div class="sync-status" id="syncStatus" style="
                    margin-top: 10px;
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                ">
                    Timer runs independently
                </div>
            </div>
            
            <div class="timer-stats" style="
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1.5rem;
                margin-top: 1.5rem;
            ">
                <div class="timer-stat" style="text-align: center;">
                    <span class="stat-label" style="
                        display: block;
                        color: var(--text-secondary);
                        font-size: 0.875rem;
                        margin-bottom: 8px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    ">Session Goal:</span>
                    <select id="sessionGoal" class="timer-goal-select" style="
                        background: var(--bg-input);
                        border: 1px solid var(--border);
                        border-radius: 0.5rem;
                        padding: 8px 12px;
                        color: var(--text-primary);
                        font-size: 1rem;
                        width: 100%;
                        max-width: 150px;
                        cursor: pointer;
                    ">
                        <option value="0">No goal</option>
                        <option value="600">10 minutes</option>
                        <option value="900">15 minutes</option>
                        <option value="1200">20 minutes</option>
                        <option value="1800" selected>30 minutes</option>
                        <option value="2700">45 minutes</option>
                        <option value="3600">60 minutes</option>
                        <option value="5400">90 minutes</option>
                    </select>
                </div>
                <div class="timer-stat" style="text-align: center;">
                    <span class="stat-label" style="
                        display: block;
                        color: var(--text-secondary);
                        font-size: 0.875rem;
                        margin-bottom: 8px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    ">Progress:</span>
                    <div class="timer-progress" style="
                        background: var(--bg-input);
                        height: 20px;
                        border-radius: 10px;
                        overflow: hidden;
                        position: relative;
                        width: 100%;
                        margin-top: 8px;
                        border: 1px solid var(--border);
                    ">
                        <div class="timer-progress-bar" id="timerProgress" style="
                            height: 100%;
                            background: linear-gradient(90deg, #6366f1 0%, #a855f7 100%);
                            transition: width 0.3s ease;
                            width: 0%;
                        "></div>
                    </div>
                </div>
            </div>
        `;

        // Add wrapper to container
        this.container.appendChild(timerWrapper);

        // Verify the timer display element exists and log its properties
        const timerDisplay = document.getElementById('timerDisplay');
        if (timerDisplay) {
            console.log('Timer display element created:', {
                exists: true,
                visible: window.getComputedStyle(timerDisplay).display !== 'none',
                opacity: window.getComputedStyle(timerDisplay).opacity,
                color: window.getComputedStyle(timerDisplay).color,
                fontSize: window.getComputedStyle(timerDisplay).fontSize,
                textContent: timerDisplay.textContent
            });
        } else {
            console.error('Timer display element not found after render!');
        }

        // Attach event listeners
        this.attachEventListeners();

        // Load saved preferences
        this.loadTimerPreferences();

        // Force a display update
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const displayElement = document.getElementById('timerDisplay');
        if (displayElement) {
            const totalSeconds = Math.floor(this.elapsedTime / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            const display = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            displayElement.textContent = display;

            // Force repaint
            displayElement.style.display = 'none';
            displayElement.offsetHeight; // Trigger reflow
            displayElement.style.display = 'block';
        }
    }

    attachEventListeners() {
        const startBtn = document.getElementById('startTimer');
        const stopBtn = document.getElementById('stopTimer');
        const resetBtn = document.getElementById('resetTimer');
        const goalSelect = document.getElementById('sessionGoal');
        const syncToggle = document.getElementById('timerSyncToggle');

        if (startBtn) {
            startBtn.addEventListener('click', () => this.start());
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stop());
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }

        if (goalSelect) {
            goalSelect.addEventListener('change', () => {
                this.saveTimerPreferences();
                this.updateProgress();
            });
        }

        if (syncToggle) {
            syncToggle.addEventListener('change', (e) => {
                this.isSyncEnabled = e.target.checked;
                this.updateSyncStatus();
                this.saveTimerPreferences();

                if (this.isSyncEnabled) {
                    notificationManager.info('Timer will sync with audio player and metronome');
                } else {
                    notificationManager.info('Timer runs independently');
                }
            });
        }
    }

    updateSyncStatus() {
        const statusEl = document.getElementById('syncStatus');
        if (statusEl) {
            if (this.isSyncEnabled) {
                const syncedCount = this.syncedComponents.size;
                if (syncedCount > 0) {
                    const components = Array.from(this.syncedComponents).join(' & ');
                    statusEl.textContent = `Synced with ${components}`;
                    statusEl.style.color = '#10b981'; // var(--success)
                } else {
                    statusEl.textContent = 'Ready to sync with audio/metronome';
                    statusEl.style.color = '#6366f1'; // var(--primary)
                }
            } else {
                statusEl.textContent = 'Timer runs independently';
                statusEl.style.color = '#9ca3af'; // var(--text-secondary)
            }
        }
    }

    syncStart(componentName) {
        if (!this.isSyncEnabled) return;

        this.syncedComponents.add(componentName);
        this.updateSyncStatus();

        if (!this.isRunning) {
            this.start();
            notificationManager.info(`Timer started with ${componentName}`);
        }
    }

    syncStop(componentName) {
        if (!this.isSyncEnabled) return;

        this.syncedComponents.delete(componentName);
        this.updateSyncStatus();

        if (this.isRunning && this.syncedComponents.size === 0) {
            this.stop();
            notificationManager.info(`Timer paused - all synced components stopped`);
        }
    }

    start() {
        if (!this.isRunning) {
            this.startTime = Date.now() - this.elapsedTime;
            this.interval = setInterval(() => this.updateTimer(), 10);
            this.isRunning = true;

            const startBtn = document.getElementById('startTimer');
            const stopBtn = document.getElementById('stopTimer');
            const subtitle = document.getElementById('timerSubtitle');

            if (startBtn) startBtn.style.display = 'none';
            if (stopBtn) stopBtn.style.display = 'inline-flex';
            if (subtitle) subtitle.textContent = 'Practice in progress...';

            notificationManager.success('Practice timer started! 🎸');

            this.scheduleSessionNotifications();

            if (this.onTimerStateChange) {
                this.onTimerStateChange(true);
            }
        }
    }

    stop() {
        if (this.isRunning) {
            clearInterval(this.interval);
            this.isRunning = false;

            const startBtn = document.getElementById('startTimer');
            const stopBtn = document.getElementById('stopTimer');
            const subtitle = document.getElementById('timerSubtitle');

            if (startBtn) startBtn.style.display = 'inline-flex';
            if (stopBtn) stopBtn.style.display = 'none';

            const duration = TimeUtils.formatDuration(Math.floor(this.elapsedTime / 1000));
            if (subtitle) subtitle.textContent = `Paused at ${duration}`;

            notificationManager.success(`Timer stopped. Great practice! You practiced for ${duration} 🎉`);

            this.clearScheduledNotifications();

            this.syncedComponents.clear();
            this.updateSyncStatus();

            if (this.onTimerStateChange) {
                this.onTimerStateChange(false);
            }
        }
    }

    reset() {
        clearInterval(this.interval);
        this.elapsedTime = 0;
        this.isRunning = false;

        this.updateTimerDisplay();

        const subtitle = document.getElementById('timerSubtitle');
        const startBtn = document.getElementById('startTimer');
        const stopBtn = document.getElementById('stopTimer');

        if (subtitle) subtitle.textContent = 'Ready to practice';
        if (startBtn) startBtn.style.display = 'inline-flex';
        if (stopBtn) stopBtn.style.display = 'none';

        this.updateProgress();
        this.clearScheduledNotifications();

        this.syncedComponents.clear();
        this.updateSyncStatus();
    }

    updateTimer() {
        const currentTime = Date.now();
        this.elapsedTime = currentTime - this.startTime;

        if (currentTime - this.lastDisplayUpdate >= this.displayUpdateInterval) {
            this.updateTimerDisplay();
            this.lastDisplayUpdate = currentTime;
            this.updateProgress();
        }

        if (this.onTimeUpdate) {
            this.onTimeUpdate(this.elapsedTime);
        }
    }

    updateProgress() {
        const goalSelect = document.getElementById('sessionGoal');
        const progressBar = document.getElementById('timerProgress');

        if (!goalSelect || !progressBar) return;

        const goalSeconds = parseInt(goalSelect.value);
        const currentSeconds = Math.floor(this.elapsedTime / 1000);

        if (goalSeconds > 0) {
            const percentage = Math.min(100, (currentSeconds / goalSeconds) * 100);
            progressBar.style.width = `${percentage}%`;

            if (percentage >= 100) {
                progressBar.style.background = '#10b981'; // var(--success)
                if (this.isRunning && !this.goalReached) {
                    this.goalReached = true;
                    notificationManager.success('🎯 Session goal reached! Keep going or take a break.');
                }
            } else if (percentage >= 75) {
                progressBar.style.background = '#f59e0b'; // var(--warning)
            } else {
                progressBar.style.background = 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)';
            }
        } else {
            progressBar.style.width = '0%';
        }
    }

    scheduleSessionNotifications() {
        this.clearScheduledNotifications();

        this.notifications = [
            { time: 5 * 60 * 1000, message: "5 minutes in! You're doing great! 🎸" },
            { time: 10 * 60 * 1000, message: "10 minutes! Keep up the momentum! 💪" },
            { time: 15 * 60 * 1000, message: "15 minutes of practice! Excellent focus! 🌟" },
            { time: 30 * 60 * 1000, message: "30 minutes! You're in the zone! 🔥" },
            { time: 45 * 60 * 1000, message: "45 minutes! Professional level dedication! 🎯" },
            { time: 60 * 60 * 1000, message: "1 hour of practice! You're a guitar hero! 🏆" }
        ];

        this.notificationTimeouts = this.notifications.map(notification => {
            const timeUntilNotification = notification.time - this.elapsedTime;
            if (timeUntilNotification > 0) {
                return setTimeout(() => {
                    if (this.isRunning) {
                        notificationManager.info(notification.message);
                    }
                }, timeUntilNotification);
            }
            return null;
        }).filter(timeout => timeout !== null);
    }

    clearScheduledNotifications() {
        if (this.notificationTimeouts) {
            this.notificationTimeouts.forEach(timeout => clearTimeout(timeout));
            this.notificationTimeouts = [];
        }
        this.goalReached = false;
    }

    loadTimerPreferences() {
        try {
            const preferences = localStorage.getItem('timerPreferences');
            if (preferences) {
                const { sessionGoal, syncEnabled } = JSON.parse(preferences);
                const goalSelect = document.getElementById('sessionGoal');
                const syncToggle = document.getElementById('timerSyncToggle');

                if (goalSelect && sessionGoal) {
                    goalSelect.value = sessionGoal;
                }

                if (syncToggle && syncEnabled !== undefined) {
                    syncToggle.checked = syncEnabled;
                    this.isSyncEnabled = syncEnabled;
                    this.updateSyncStatus();
                }
            }
        } catch (error) {
            console.error('Failed to load timer preferences:', error);
        }
    }

    saveTimerPreferences() {
        try {
            const goalSelect = document.getElementById('sessionGoal');
            const syncToggle = document.getElementById('timerSyncToggle');

            if (goalSelect) {
                const preferences = {
                    sessionGoal: goalSelect.value,
                    syncEnabled: syncToggle ? syncToggle.checked : false
                };
                localStorage.setItem('timerPreferences', JSON.stringify(preferences));
            }
        } catch (error) {
            console.error('Failed to save timer preferences:', error);
        }
    }

    getElapsedTime() {
        return Math.floor(this.elapsedTime / 1000);
    }

    destroy() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        this.clearScheduledNotifications();
    }
}
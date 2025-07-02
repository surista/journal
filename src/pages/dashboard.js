// Dashboard Page - Fixed calendar navigation and timer sync visibility
import { Timer } from '../components/timer.js';
import { AudioPlayer } from '../components/audioPlayer.js';
import { PracticeForm } from '../components/practiceForm.js';
import { GoalsList } from '../components/goalsList.js';
import { StatsPanel } from '../components/statsPanel.js';
import { StreakHeatMap } from '../components/streakHeatMap.js';
import { AchievementBadges } from '../components/achievementBadges.js';
import { NotificationService } from '../services/notificationService.js';
import { ThemeService } from '../services/themeService.js';
import { PushNotificationService } from '../services/pushNotificationService.js';
import { VirtualSessionsList } from '../components/VirtualScrollList.js';
import { TimeUtils, debounce } from '../utils/helpers.js';
import { notificationManager } from '../services/notificationManager.js';

export class DashboardPage {
    constructor(storageService, authService) {
        this.storageService = storageService;
        this.authService = authService;
        this.themeService = new ThemeService();
        this.pushNotificationService = null;

        this.components = {};
        this.container = null;
        this.virtualSessionsList = null;

        // Debounced storage check
        this.debouncedCheckStorage = debounce(() => {
            this.checkStorageUsage();
        }, 5000);
    }

    async init() {
        try {
            // Initialize push notification service after storage is ready
            this.pushNotificationService = new PushNotificationService(this.storageService);

            // Create page structure
            this.render();

            // Initialize components
            await this.initializeComponents();

            // Wire up timer sync connections
            this.setupTimerSync();

            // Load initial data
            await this.loadData();

            // Set up auto-save
            this.setupAutoSave();

            // Check storage usage
            await this.checkStorageUsage();
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            notificationManager.error('Failed to initialize dashboard');
        }
    }

    setupTimerSync() {
        // Connect timer to audio player
        if (this.components.timer && this.components.audioPlayer) {
            this.components.audioPlayer.setTimer(this.components.timer);
            console.log('Connected timer to audio player');
        }

        // Connect timer to practice form
        if (this.components.timer && this.components.practiceForm) {
            this.components.practiceForm.setTimer(this.components.timer);
            console.log('Connected timer to practice form');
        }
    }

    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="dashboard-page">
                <header class="main-header">
                    <div class="header-content">
                        <h1>🎸 Guitar Practice Journal</h1>
                        <p class="subtitle">Track your progress, achieve your goals</p>
                    </div>
                    <div class="user-info">
                        <button class="btn btn-icon theme-toggle" id="themeToggle" title="Toggle theme">
                            ${this.themeService.getTheme() === 'dark' ? '☀️' : '🌙'}
                        </button>
                        <span>👤 ${this.authService.getCurrentUser().email}</span>
                        <button class="btn btn-danger btn-small" id="logoutBtn">Logout</button>
                    </div>
                </header>

                <nav class="main-nav">
                    <button class="btn btn-primary" id="viewCalendarBtn">📅 View Practice Calendar</button>
                    <div class="storage-indicator" id="storageIndicator"></div>
                </nav>

                <main class="dashboard-content">
                    <div class="dashboard-grid">
                        <!-- Stats Section -->
                        <section class="stats-section" id="statsContainer"></section>

                        <!-- Timer Section -->
                        <section class="timer-section" id="timerContainer"></section>

                        <!-- Audio Section -->
                        <section class="audio-section" id="audioContainer"></section>

                        <!-- Practice Form -->
                        <section class="form-section" id="formContainer"></section>

                        <!-- Goals Section -->
                        <section class="goals-section" id="goalsContainer"></section>

                        <!-- Recent Sessions -->
                        <section class="recent-section">
                            <h2>Recent Practice Sessions</h2>
                            <div id="recentSessions"></div>
                        </section>

                        <!-- Streak Heat Map -->
                        <section class="heatmap-section" id="heatmapContainer"></section>

                        <!-- Achievement Badges -->
                        <section class="achievements-container" id="achievementsContainer"></section>
                    </div>
                </main>

                <footer class="main-footer">
                    <div class="export-controls">
                        <button class="btn btn-primary" id="exportBtn">📥 Export Data</button>
                        <label for="importFile" class="btn btn-primary">
                            📤 Import Data
                            <input type="file" id="importFile" accept=".json" style="display: none;">
                        </label>
                    </div>
                </footer>
            </div>
        `;

        this.container = app.querySelector('.dashboard-page');
        this.attachEventListeners();
    }

    async initializeComponents() {
        try {
            // Initialize Timer
            const timerContainer = document.getElementById('timerContainer');
            if (timerContainer) {
                this.components.timer = new Timer(timerContainer);
                this.components.timer.render();
                console.log('Timer initialized successfully');
            }

            // Initialize Audio Player
            try {
                const audioContainer = document.getElementById('audioContainer');
                this.components.audioPlayer = new AudioPlayer(audioContainer, this.storageService);
                this.components.audioPlayer.render();
                console.log('Audio Player initialized successfully');
            } catch (error) {
                console.error('Audio Player initialization error:', error);
            }

            // Initialize Practice Form
            try {
                const formContainer = document.getElementById('formContainer');
                this.components.practiceForm = new PracticeForm(formContainer, this.storageService);
                this.components.practiceForm.render();
                console.log('Practice Form initialized successfully');
            } catch (error) {
                console.error('Practice Form initialization error:', error);
            }

            // Initialize Goals List
            try {
                const goalsContainer = document.getElementById('goalsContainer');
                this.components.goalsList = new GoalsList(goalsContainer, this.storageService);
                this.components.goalsList.render();
                console.log('Goals List initialized successfully');
            } catch (error) {
                console.error('Goals List initialization error:', error);
            }

            // Initialize Stats Panel
            try {
                const statsContainer = document.getElementById('statsContainer');
                this.components.statsPanel = new StatsPanel(statsContainer, this.storageService);
                this.components.statsPanel.render();
                console.log('Stats Panel initialized successfully');
            } catch (error) {
                console.error('Stats Panel initialization error:', error);
            }

            // Initialize Streak Heat Map
            try {
                const heatmapContainer = document.getElementById('heatmapContainer');
                this.components.streakHeatMap = new StreakHeatMap(heatmapContainer, this.storageService);
                await this.components.streakHeatMap.render();
                console.log('Streak Heat Map initialized successfully');
            } catch (error) {
                console.error('Streak Heat Map initialization error:', error);
            }

            // Initialize Achievement Badges
            try {
                const achievementsContainer = document.getElementById('achievementsContainer');
                this.components.achievementBadges = new AchievementBadges(achievementsContainer, this.storageService);
                await this.components.achievementBadges.render();
                console.log('Achievement Badges initialized successfully');
            } catch (error) {
                console.error('Achievement Badges initialization error:', error);
            }

        } catch (error) {
            console.error('Error initializing components:', error);
            notificationManager.error('Failed to initialize some components');
        }
    }

    async loadData() {
        try {
            await this.loadRecentSessions();

            if (this.components.statsPanel) {
                this.components.statsPanel.update();
            }

            this.checkPracticeReminder();
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    async loadRecentSessions() {
        try {
            const entries = await this.storageService.getPracticeEntries();
            const container = document.getElementById('recentSessions');

            if (!Array.isArray(entries) || entries.length === 0) {
                container.innerHTML = `
                    <p class="empty-state">No practice sessions yet. Start your first session!</p>
                `;
                return;
            }

            // Use virtual scrolling for large lists
            if (entries.length > 20) {
                container.innerHTML = '<div class="virtual-scroll-container" id="virtualSessions"></div>';
                const virtualContainer = document.getElementById('virtualSessions');

                if (this.virtualSessionsList) {
                    this.virtualSessionsList.destroy();
                }

                this.virtualSessionsList = new VirtualSessionsList(
                    virtualContainer,
                    entries,
                    TimeUtils
                );
            } else {
                // Regular rendering for small lists
                container.innerHTML = entries.slice(0, 10).map(entry => this.renderSessionCard(entry)).join('');
            }

            this.debouncedCheckStorage();
        } catch (error) {
            console.error('Error loading recent sessions:', error);
            const container = document.getElementById('recentSessions');
            container.innerHTML = `
                <p class="empty-state">Error loading sessions. Please refresh the page.</p>
            `;
        }
    }

    renderSessionCard(entry) {
        const date = new Date(entry.date);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        const duration = TimeUtils.formatDuration(entry.duration);

        return `
            <div class="session-card fade-in">
                <div class="session-header">
                    <span class="session-date">${formattedDate}</span>
                    <span class="session-duration">${duration}</span>
                </div>
                <div class="session-details">
                    <div class="session-detail">
                        <span class="detail-label">Practice Area</span>
                        <span class="detail-value">${entry.practiceArea}</span>
                    </div>
                    ${entry.bpm ? `
                        <div class="session-detail">
                            <span class="detail-label">BPM</span>
                            <span class="detail-value">${entry.bpm}</span>
                        </div>
                    ` : ''}
                    ${entry.key ? `
                        <div class="session-detail">
                            <span class="detail-label">Key</span>
                            <span class="detail-value">${entry.key}</span>
                        </div>
                    ` : ''}
                </div>
                ${entry.notes ? `<div class="session-notes">${entry.notes}</div>` : ''}
            </div>
        `;
    }

    checkPracticeReminder() {
        try {
            this.storageService.getPracticeEntries().then(entries => {
                if (!Array.isArray(entries)) return;

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const practicedToday = entries.some(entry => {
                    const entryDate = new Date(entry.date);
                    entryDate.setHours(0, 0, 0, 0);
                    return entryDate.getTime() === today.getTime();
                });

                const currentHour = new Date().getHours();
                if (!practicedToday && currentHour >= 18) {
                    this.showPracticeReminder();
                }
            });
        } catch (error) {
            console.error('Error checking practice reminder:', error);
        }
    }

    showPracticeReminder() {
        const modal = document.createElement('div');
        modal.className = 'reminder-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>🎸 Time to Practice!</h2>
                <p>You haven't practiced today. Even 10 minutes makes a difference!</p>
                <button class="btn btn-primary" onclick="this.closest('.reminder-modal').remove()">
                    Let's Practice!
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    attachEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const newTheme = this.themeService.toggleTheme();
                themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to logout?')) {
                    this.authService.logout();
                    window.location.reload();
                }
            });
        }

        // Export/Import
        const exportBtn = document.getElementById('exportBtn');
        const importFile = document.getElementById('importFile');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        if (importFile) {
            importFile.addEventListener('change', (e) => this.importData(e.target.files[0]));
        }

        // Fixed Calendar navigation
        const calendarBtn = document.getElementById('viewCalendarBtn');
        if (calendarBtn) {
            calendarBtn.addEventListener('click', async () => {
                console.log('Calendar button clicked');

                try {
                    // Clean up current page
                    this.destroy();

                    // Navigate to calendar using the app's router
                    if (window.app && window.app.loadCalendarPage) {
                        await window.app.loadCalendarPage();
                    } else {
                        // Fallback: direct import and initialization
                        const baseUrl = window.location.origin;
                        const basePath = window.location.pathname.includes('/journal/') ? '/journal/' : '/';
                        const modulePath = `${baseUrl}${basePath}src/pages/calendar.js`;

                        const { CalendarPage } = await import(modulePath);
                        const calendarPage = new CalendarPage(this.storageService, this.authService);
                        await calendarPage.init();

                        // Update window.app reference if it exists
                        if (window.app) {
                            window.app.currentPage = calendarPage;
                        }
                    }
                } catch (error) {
                    console.error('Error navigating to calendar:', error);
                    notificationManager.error('Failed to load calendar page. Please refresh and try again.');
                }
            });
        }

        // Listen for practice session saved events
        window.addEventListener('practiceSessionSaved', async () => {
            await this.loadRecentSessions();
        });
    }

    async exportData() {
        try {
            const exportResult = await this.storageService.exportData();

            let dataToExport;
            let filename;

            if (exportResult.compressed) {
                console.log(`Data compressed from ${exportResult.uncompressedSize} to ${exportResult.compressedSize} bytes (${exportResult.compressionRatio})`);

                dataToExport = JSON.stringify({
                    compressed: true,
                    data: exportResult.data,
                    compressionInfo: {
                        uncompressedSize: exportResult.uncompressedSize,
                        compressedSize: exportResult.compressedSize,
                        ratio: exportResult.compressionRatio
                    }
                });
                filename = `guitar-practice-compressed-${new Date().toISOString().split('T')[0]}.json`;
            } else {
                dataToExport = JSON.stringify(exportResult, null, 2);
                filename = `guitar-practice-backup-${new Date().toISOString().split('T')[0]}.json`;
            }

            const blob = new Blob([dataToExport], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();

            URL.revokeObjectURL(url);

            notificationManager.success('Data exported successfully! 📥');
        } catch (error) {
            notificationManager.error('Failed to export data. Please try again.');
            console.error('Export error:', error);
        }
    }

    async importData(file) {
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (confirm('This will replace all your current data. Are you sure?')) {
                await this.storageService.importData(data);
                await this.loadData();

                for (const component of Object.values(this.components)) {
                    if (component.render) {
                        component.render();
                    }
                }

                notificationManager.success('Data imported successfully! 📤');
            }
        } catch (error) {
            notificationManager.error('Error importing data. Please check the file.');
            console.error('Import error:', error);
        }
    }

    async checkStorageUsage() {
        try {
            const storageInfo = await this.storageService.getStorageInfo();
            const indicator = document.getElementById('storageIndicator');

            if (storageInfo && indicator) {
                if (storageInfo.indexedDB) {
                    const percentage = storageInfo.indexedDB.percentage || 0;
                    const usage = this.formatBytes(storageInfo.indexedDB.usage || 0);
                    const quota = this.formatBytes(storageInfo.indexedDB.quota || 0);

                    indicator.innerHTML = `
                        <div class="storage-usage">
                            <span>Storage: ${usage} / ${quota} (${percentage.toFixed(1)}%)</span>
                            <div class="storage-bar">
                                <div class="storage-fill" style="width: ${percentage}%"></div>
                            </div>
                        </div>
                    `;

                    if (percentage > 80) {
                        notificationManager.warning('Storage space running low. Consider exporting old data.');
                        indicator.classList.add('storage-warning');
                    } else if (percentage > 95) {
                        notificationManager.error('Storage space critical! Export data to free up space.');
                        indicator.classList.add('storage-critical');
                    }
                }
            }
        } catch (error) {
            console.error('Error checking storage:', error);
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    setupAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            if (this.components.practiceForm) {
                this.components.practiceForm.saveFormState();
            }
        }, 30000);
    }

    destroy() {
        // Clean up all components
        Object.values(this.components).forEach(component => {
            try {
                if (component && component.destroy) {
                    component.destroy();
                }
            } catch (error) {
                console.warn('Error destroying component:', error);
            }
        });

        if (this.virtualSessionsList) {
            this.virtualSessionsList.destroy();
        }

        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        window.removeEventListener('practiceSessionSaved', this.loadRecentSessions);

        if (this.container) {
            this.container.remove();
        }
    }
}
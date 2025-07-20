// Dashboard Page Component - Fixed version with better error handling
import {Timer} from '../components/timer.js';
import {PracticeForm} from '../components/practiceForm.js';
import {AudioPlayer} from '../components/audioPlayer.js';
import {Metronome} from '../components/metronome.js';
import {AudioService} from '../services/audioService.js';
import {cloudStorage} from '../services/firebaseService.js';
import {StatsTab} from '../components/tabs/StatsTab.js';
import {HistoryTab} from '../components/tabs/HistoryTab.js';
import {GoalsTab} from '../components/tabs/GoalsTab.js';
import {CalendarTab} from '../components/tabs/CalendarTab.js';
import {SettingsTab} from '../components/tabs/SettingsTab.js';
import {CloudSyncHandler} from '../services/cloudSyncHandler.js';
import {PracticeTab} from '../components/tabs/PracticeTab.js';
import {MetronomeTab} from '../components/tabs/MetronomeTab.js';
import {AudioTab} from '../components/tabs/AudioTab.js';


// Global function for YouTube link handling
window.loadYouTubeInAudioTool = function(urlOrId) {
    if (window.app && window.app.currentPage && window.app.currentPage.loadYouTubeInAudioTool) {
        window.app.currentPage.loadYouTubeInAudioTool(urlOrId);
    }
};
export class DashboardPage {
    constructor(storageService, authService) {
        this.storageService = storageService;
        this.authService = authService;
        this.currentTab = 'practice';
        this.components = {};
        this.tabs = {};
        this.audioService = new AudioService();
        this.themeService = null; // Will be set by app.js
        this.cloudSyncHandler = null;
        this.isDestroyed = false;
        this.initializationRetries = 0;
        this.maxRetries = 3;

        // Set up hash change listener for tab navigation
        this.setupHashNavigation();
    }

    setupHashNavigation() {
        // Listen for hash changes
        window.addEventListener('hashchange', () => {
            this.handleHashChange();
        });

        // Handle initial hash
        this.handleHashChange();
    }

    handleHashChange() {
        const hash = window.location.hash.slice(1); // Remove #
        const validTabs = ['practice', 'audio', 'metronome', 'repertoire', 'goals', 'stats', 'history', 'calendar', 'settings'];

        if (hash && validTabs.includes(hash)) {
            console.log('Hash changed to:', hash);
            this.switchTab(hash);
        } else if (!hash) {
            // Default to practice tab if no hash
            this.switchTab('practice');
        }
    }

    async render() {
        const app = document.getElementById('app');
        if (!app) {
            console.error('App container not found');
            return;
        }

        // Get current theme for icon
        const currentTheme = this.themeService?.getTheme() || 'dark';
        const themeIcon = currentTheme === 'dark' ? '🌙' : '☀️';

        app.innerHTML = `
        <div class="modern-dashboard">
            <!-- Sidebar Navigation -->
            <nav class="sidebar">
                <div class="sidebar-header">
                    <h2>🎸 Guitar Journal</h2>
                </div>
                
                <ul class="nav-menu">
                    <li class="nav-item active" data-tab="practice">
                        <i class="icon">📝</i>
                        <span>Practice</span>
                    </li>
                    <li class="nav-item" data-tab="audio">
                        <i class="icon">🎵</i>
                        <span>Audio Tool</span>
                    </li>
                    <li class="nav-item" data-tab="metronome">
                        <i class="icon">⏱️</i>
                        <span>Metronome</span>
                    </li>
                    <li class="nav-item" data-tab="repertoire">
                        <i class="icon">🎸</i>
                        <span>Repertoire</span>
                    </li>
                    <li class="nav-item" data-tab="goals">
                        <i class="icon">🎯</i>
                        <span>Goals</span>
                    </li>
                    <li class="nav-item" data-tab="stats">
                        <i class="icon">📊</i>
                        <span>Statistics</span>
                    </li>
                    <li class="nav-item" data-tab="history">
                        <i class="icon">📅</i>
                        <span>History</span>
                    </li>
                    <li class="nav-item" data-tab="calendar">
                        <i class="icon">📅</i>
                        <span>Calendar</span>
                    </li>
                    <li class="nav-item" data-tab="settings">
                        <i class="icon">⚙️</i>
                        <span>Settings</span>
                    </li>
                </ul>

                <div class="sidebar-footer">
                    <button class="btn btn-secondary logout-btn" id="logoutBtn">
                        <i class="icon">🚪</i> Logout
                    </button>
                </div>
            </nav>

            <!-- Main Content Area -->
            <main class="main-content">
                <!-- Header -->
                <header class="header">
                    <button class="menu-toggle" id="menuToggle">
                        <i class="icon">☰</i>
                    </button>
                    <h1 id="pageTitle">Practice Session</h1>
                      <div class="header-actions">
                <div class="sync-status" id="syncStatus">
                    <span class="sync-icon" id="syncIcon">🔄</span>
                    <span class="sync-text" id="syncText">Checking sync...</span>
                </div>
                <div class="theme-info">
                    <span id="currentThemeName">${this.themeService?.getThemeData()?.name || 'Dark'}</span>
                    <button class="btn btn-icon theme-toggle" id="themeToggle" title="Toggle theme">
                        <i class="icon">${themeIcon}</i>
                    </button>
                </div>
                </div>
                </header>

                <!-- Tab Content -->
                <div class="tab-content" id="tabContent">
                    <!-- Practice Tab -->
                    <div class="tab-pane active" id="practiceTab" data-tab="practice">
                        <div class="practice-layout">
                            <div class="practice-main">
                                <!-- Timer (Always visible, non-collapsible) -->
                                <div id="timerContainer" class="timer-section">
                                    <div class="loading-placeholder">
                                        <div class="loading-spinner"></div>
                                        <p>Loading timer...</p>
                                    </div>
                                </div>

                    
                                <!-- Recent Sessions -->
                                <div class="dashboard-widget">
                                    <div class="widget-header">
                                        <h3 class="widget-title">Recent Sessions</h3>
                                        <button class="widget-action" id="viewAllSessions">View All</button>
                                    </div>
                                    <div id="recentSessionsList" class="recent-sessions-widget">
                                        <div class="loading-placeholder">Loading recent sessions...</div>
                                    </div>
                                </div>
                            </div>

                            <aside class="practice-sidebar">
                                <!-- Practice Tips -->
                                <div class="practice-tips" id="practiceTips">
                                    <div class="practice-tip">
                                        <span class="tip-icon">💡</span>
                                        <div class="tip-text">
                                            <div class="tip-title">Today's Tip</div>
                                            <div class="tip-description" id="dailyTip">
                                                Focus on playing slowly and accurately before increasing speed.
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Quick Stats -->
                                <div class="dashboard-widget">
                                    <h3 class="widget-title">Quick Stats</h3>
                                    <div id="quickStats">
                                        <div class="loading-placeholder">Loading stats...</div>
                                    </div>
                                </div>

                                <!-- Streak Calendar -->
                                <div class="dashboard-widget">
                                    <h3 class="widget-title">Practice Streak</h3>
                                    <div id="streakCalendar">
                                        <div class="loading-placeholder">Loading calendar...</div>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </div>

                    <!-- Other tabs will be rendered by tab components -->
                    <div class="tab-pane" id="audioTab" data-tab="audio"></div>
                    <div class="tab-pane" id="metronomeTab" data-tab="metronome"></div>
                    <div class="tab-pane" id="repertoireTab" data-tab="repertoire"></div>
                    <div class="tab-pane" id="goalsTab" data-tab="goals"></div>
                    <div class="tab-pane" id="statsTab" data-tab="stats"></div>
                    <div class="tab-pane" id="historyTab" data-tab="history"></div>
                    <div class="tab-pane" id="calendarTab" data-tab="calendar"></div>
                    <div class="tab-pane" id="settingsTab" data-tab="settings"></div>
                </div>
            </main>

            <!-- Footer -->
            <footer id="appFooter"></footer>
        </div>

        <!-- Mobile FAB -->
        <button class="fab" id="fabBtn" title="Quick add practice session">
            <i class="icon">➕</i>
        </button>

        <!-- Loading Styles -->
        <style>
            .loading-placeholder {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 2rem;
                color: var(--text-secondary);
            }
            
            .loading-spinner {
                width: 32px;
                height: 32px;
                border: 3px solid var(--border);
                border-top: 3px solid var(--primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 1rem;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .error-state {
                padding: 2rem;
                text-align: center;
                color: var(--text-secondary);
                background: var(--bg-card);
                border-radius: 8px;
                border: 1px solid var(--border);
            }
            
            .retry-btn {
                margin-top: 1rem;
                padding: 0.5rem 1rem;
                background: var(--primary);
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
            }
        </style>
    `;

        this.attachEventListeners();

        // Initialize components with error handling
        try {
            await this.initializeComponents();
            await this.loadDashboardData();
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
            this.handleInitializationError(error);
        }
    }

    attachEventListeners() {
        // Tab navigation with error handling
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                try {
                    const tab = e.currentTarget.dataset.tab;
                    this.switchTab(tab);
                } catch (error) {
                    console.error('Error switching tab:', error);
                    this.showNotification('Failed to switch tab', 'error');
                }
            });
        });

        // Mobile menu toggle
        document.getElementById('menuToggle')?.addEventListener('click', () => {
            document.querySelector('.sidebar')?.classList.toggle('active');
        });

        // Theme toggle
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.handleLogout();
        });

        // View all sessions
        document.getElementById('viewAllSessions')?.addEventListener('click', () => {
            this.switchTab('history');
        });

        // Mobile FAB
        document.getElementById('fabBtn')?.addEventListener('click', () => {
            this.showQuickAddModal();
        });

        // Keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Global error handler
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
        });

        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
        });

        // Listen for practice session deletion to refresh dashboard data
        window.addEventListener('practiceSessionDeleted', () => {
            console.log('Practice session deleted, refreshing dashboard data...');
            this.loadDashboardData();

            // Also refresh streak calendar if it exists
            if (this.components.streakHeatMap) {
                this.components.streakHeatMap.render();
            }
        });

        // Also listen for new practice sessions to refresh
        window.addEventListener('practiceSessionSaved', () => {
            console.log('Practice session saved, refreshing dashboard data...');
            this.loadDashboardData();

            // Also refresh streak calendar if it exists
            if (this.components.streakHeatMap) {
                this.components.streakHeatMap.render();
            }
        });
    }


    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't interfere with form inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
                return;
            }

            try {
                // Ctrl/Cmd + K for quick search
                if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                    e.preventDefault();
                    this.showQuickSearch();
                }

                // Ctrl/Cmd + N for new practice session
                if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                    e.preventDefault();
                    this.showQuickAddModal();
                }
            } catch (error) {
                console.error('Error handling keyboard shortcut:', error);
            }
        });
    }

    async initializeComponents() {
        console.log('Initializing dashboard components...');

        try {
            // Initialize core components first
            await this.initializeCoreComponents();

            // Initialize cloud sync
            await this.initializeCloudSync();

            // Initialize tab components
            await this.initializeTabComponents();

            // Initialize footer
            await this.initializeFooter();

            console.log('✅ All dashboard components initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize components:', error);
            throw error;
        }
    }

    async initializeCoreComponents() {
        // Initialize Timer
        const timerContainer = document.getElementById('timerContainer');
        if (timerContainer) {
            try {
                console.log('Initializing Timer...');
                timerContainer.innerHTML = '';

                const timer = new Timer(timerContainer);
                this.timer = timer;
                this.components.timer = timer;

                // Make timer globally accessible
                window.currentTimer = timer;

                console.log('✅ Timer initialized successfully');
            } catch (error) {
                console.error('❌ Error initializing Timer:', error);
                timerContainer.innerHTML = this.createErrorState('Timer failed to load', () => this.initializeCoreComponents());
            }
        }

        // Initialize Practice Form
        const practiceFormContainer = document.getElementById('practiceFormContainer');
        if (practiceFormContainer) {
            try {
                console.log('Initializing Practice Form...');
                practiceFormContainer.innerHTML = '';

                this.components.practiceForm = new PracticeForm(practiceFormContainer, this.storageService);
                this.components.practiceForm.render();

                // Connect timer to practice form
                if (this.components.timer && this.components.practiceForm.setTimer) {
                    this.components.practiceForm.setTimer(this.components.timer);
                }

                console.log('✅ Practice Form initialized successfully');
            } catch (error) {
                console.error('❌ Error initializing Practice Form:', error);
                practiceFormContainer.innerHTML = this.createErrorState('Practice form failed to load', () => this.initializeCoreComponents());
            }
        }

        // Initialize Streak HeatMap
        const streakContainer = document.getElementById('streakCalendar');
        if (streakContainer) {
            try {
                console.log('Initializing Streak HeatMap...');
                const {StreakHeatMap} = await import('../components/streakHeatMap.js');
                this.components.streakHeatMap = new StreakHeatMap(streakContainer, this.storageService);
                this.components.streakHeatMap.render();
                console.log('✅ Streak HeatMap initialized successfully');
            } catch (error) {
                console.error('❌ Error initializing Streak HeatMap:', error);
                streakContainer.innerHTML = '<div class="empty-state">Calendar unavailable</div>';
            }
        }
    }

    async initializeCloudSync() {
        try {
            // Initialize cloud sync status
            this.updateSyncStatus(navigator.onLine ? 'syncing' : 'offline');

            // Initialize cloud sync handler
            this.cloudSyncHandler = new CloudSyncHandler(this.storageService, cloudStorage);
            // Force initial status update
            setTimeout(() => {
                this.cloudSyncHandler.updateCloudStatus();
            }, 1000);

            // Set up event listeners
            window.addEventListener('online', () => {
                this.updateSyncStatus('online');
                cloudStorage.attemptQueueSync();
            });

            window.addEventListener('offline', () => {
                this.updateSyncStatus('offline');
            });

            window.addEventListener('cloudSyncComplete', () => {
                this.updateSyncStatus('synced');
            });

            window.addEventListener('cloudSyncError', () => {
                this.updateSyncStatus('error');
            });

            console.log('✅ Cloud sync initialized');
        } catch (error) {
            console.error('❌ Failed to initialize cloud sync:', error);
            // Don't throw, as this is not critical for basic functionality
        }
    }

    async initializeTabComponents() {
        try {
            this.tabs.practice = new PracticeTab(this.storageService);
            this.tabs.audio = new AudioTab(this.storageService, this.audioService);
            this.tabs.metronome = new MetronomeTab(this.storageService);

            // Import and initialize RepertoireTab
            const { RepertoireTab } = await import('../components/tabs/RepertoireTab.js');
            this.tabs.repertoire = new RepertoireTab(this.storageService);

            this.tabs.stats = new StatsTab(this.storageService);
            this.tabs.history = new HistoryTab(this.storageService);
            this.tabs.goals = new GoalsTab(this.storageService);
            this.tabs.calendar = new CalendarTab(this.storageService);
            this.tabs.settings = new SettingsTab(this.storageService, this.authService);

            // Pass theme service to settings tab
            if (this.tabs.settings && this.themeService) {
                this.tabs.settings.setThemeService(this.themeService);
            }

            // Pass cloud sync handler to settings tab
            if (this.tabs.settings && this.cloudSyncHandler) {
                this.tabs.settings.setCloudSyncHandler(this.cloudSyncHandler);
            }

            console.log('✅ Tab components initialized');
        } catch (error) {
            console.error('❌ Failed to initialize tab components:', error);
            // Continue without tabs - basic functionality should still work
        }
    }

    async initializeFooter() {
        try {
            const footerModule = await import('../components/footer.js');
            const footer = new footerModule.Footer();
            const footerContainer = document.getElementById('appFooter');

            if (footerContainer) {
                footerContainer.innerHTML = footer.render();
                requestAnimationFrame(() => {
                    footer.attachEventListeners();
                });
            }
        } catch (error) {
            console.error('❌ Error loading footer:', error);
            // Footer is not critical, continue without it
        }
    }

    createErrorState(message, retryCallback) {
        return `
            <div class="error-state">
                <p>${message}</p>
                <button class="retry-btn" onclick="(${retryCallback.toString()})()">
                    Retry
                </button>
            </div>
        `;
    }

    handleInitializationError(error) {
        this.initializationRetries++;

        if (this.initializationRetries <= this.maxRetries) {
            console.log(`Retrying initialization (${this.initializationRetries}/${this.maxRetries})...`);
            setTimeout(() => {
                this.initializeComponents();
            }, 2000);
        } else {
            console.error('Max initialization retries reached');
            this.showNotification('Failed to load some components. Please refresh the page.', 'error');
        }
    }

    updateSyncStatus(status) {
        const syncIcon = document.getElementById('syncIcon');
        const syncText = document.getElementById('syncText');

        if (!syncIcon || !syncText) return;

        switch (status) {
            case 'synced':
                syncIcon.textContent = '✅';
                syncText.textContent = 'All data synced';
                break;
            case 'syncing':
                syncIcon.textContent = '🔄';
                syncText.textContent = 'Syncing...';
                break;
            case 'offline':
                syncIcon.textContent = '📴';
                syncText.textContent = 'Offline mode';
                break;
            case 'error':
                syncIcon.textContent = '❌';
                syncText.textContent = 'Sync error';
                break;
            case 'online':
                syncIcon.textContent = '🔄';
                syncText.textContent = 'Reconnecting...';
                break;
        }
    }



    switchTab(tabName) {
        console.log('Switching to tab:', tabName);

        try {
            // Update active nav item
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.toggle('active', item.dataset.tab === tabName);
            });

            // Update active tab pane
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.toggle('active', pane.dataset.tab === tabName);
            });

            // Update page title
            const titles = {
                practice: 'Practice Session',
                audio: 'Audio Practice Tool',
                metronome: 'Metronome',
                repertoire: 'My Repertoire',
                goals: 'Goals & Achievements',
                stats: 'Practice Statistics',
                history: 'Practice History',
                calendar: 'Practice Calendar',
                settings: 'Settings'
            };

            const titleElement = document.getElementById('pageTitle');
            if (titleElement) {
                titleElement.textContent = titles[tabName] || 'Dashboard';
            }

            this.currentTab = tabName;

            // Close mobile menu
            document.querySelector('.sidebar')?.classList.remove('active');

            // Handle tab-specific logic
            if (this.tabs[tabName] && this.tabs[tabName].render) {
                const tabContainer = document.querySelector(`#${tabName}Tab`);
                if (tabContainer) {
                    this.tabs[tabName].render(tabContainer);

                    if (this.tabs[tabName].onActivate) {
                        this.tabs[tabName].onActivate();
                    }
                }
            }

            // Update hash without triggering hashchange event
            window.location.hash = tabName;

            // Dispatch custom event
            document.dispatchEvent(new CustomEvent('tabSwitched', {
                detail: {tabName}
            }));

            console.log(`✅ Switched to ${tabName} tab`);
        } catch (error) {
            console.error('Error switching tab:', error);
            this.showNotification('Failed to switch tab', 'error');
        }
    }

    // IMPORTANT: Add this method for calendar navigation compatibility
    switchToTab(tabName) {
        console.log('switchToTab called with:', tabName);
        this.switchTab(tabName);
        // Update hash as well
        window.location.hash = tabName;
    }

    toggleTheme() {
        if (!this.themeService) {
            console.error('Theme service not initialized');
            return;
        }

        try {
            const newTheme = this.themeService.toggleTheme();
            const themeData = this.themeService.getThemeData();

            // Update theme toggle icon
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                themeToggle.innerHTML = `<i class="icon">${this.themeService.isDarkTheme() ? '🌙' : '☀️'}</i>`;
            }

            // Update theme name display
            const themeNameElement = document.getElementById('currentThemeName');
            if (themeNameElement) {
                themeNameElement.textContent = themeData.name;
            }

            // Save preference
            this.storageService.saveUserSettings({darkMode: this.themeService.isDarkTheme()});

            console.log(`Theme switched to: ${themeData.name}`);
        } catch (error) {
            console.error('Error toggling theme:', error);
        }
    }

    async loadDashboardData() {
        console.log('Loading dashboard data...');

        try {
            // Update cloud status
            if (this.cloudSyncHandler) {
                await this.cloudSyncHandler.updateCloudStatus();
            }

            // Load quick stats
            await this.loadQuickStats();

            // Load recent sessions
            await this.loadRecentSessions();

            console.log('✅ Dashboard data loaded');
        } catch (error) {
            console.error('❌ Error loading dashboard data:', error);
            // Don't throw, as basic functionality should still work
        }
    }

    async loadQuickStats() {
        const quickStatsContainer = document.getElementById('quickStats');
        if (!quickStatsContainer) return;

        try {
            const stats = await this.storageService.calculateStats();

            quickStatsContainer.innerHTML = `
                <div class="quick-stats-grid">
                    <div class="quick-stat">
                        <span class="stat-value">${stats.totalHours}h</span>
                        <span class="stat-label">Total</span>
                    </div>
                    <div class="quick-stat">
                        <span class="stat-value">${stats.currentStreak}</span>
                        <span class="stat-label">Streak</span>
                    </div>
                    <div class="quick-stat">
                        <span class="stat-value">${stats.totalSessions}</span>
                        <span class="stat-label">Sessions</span>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading quick stats:', error);
            quickStatsContainer.innerHTML = '<div class="empty-state">Stats unavailable</div>';
        }
    }

    async loadRecentSessions() {
        const recentSessionsContainer = document.getElementById('recentSessionsList');
        if (!recentSessionsContainer) return;

        try {
            const entries = await this.storageService.getPracticeEntries();
            const recentEntries = entries.slice(0, 3); // Show only 3 most recent

            if (recentEntries.length === 0) {
                recentSessionsContainer.innerHTML = '<div class="empty-state">No practice sessions yet</div>';
                return;
            }

            const sessionsList = recentEntries.map(entry => {
                const date = new Date(entry.date);
                const dateStr = date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                });
                const timeStr = date.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                });

                const duration = entry.duration || 0;
                const minutes = Math.floor(duration / 60);
                const seconds = duration % 60;
                const durationStr = seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;

                // Build details array like History tab
                const details = [];
                if (entry.bpm) details.push(`🎵 ${entry.bpm} BPM`);
                if (entry.tempoPercentage) details.push(`📊 ${entry.tempoPercentage}% speed`);
                if (entry.key) details.push(`🎼 ${entry.key}`);
                if (entry.audioFile) details.push(`🎧 ${entry.audioFile}`);
                if (entry.youtubeTitle) {
                    if (entry.youtubeUrl || entry.youtubeVideoId) {
                        // Ensure we have a proper YouTube URL
                        let youtubeUrl = entry.youtubeUrl;

                        // If URL contains the app domain, extract just the YouTube URL
                        if (youtubeUrl && youtubeUrl.includes('youtube.com') && youtubeUrl.includes('www.guitar-practice-journal.com')) {
                            // Extract the YouTube URL from the malformed URL
                            const match = youtubeUrl.match(/https:\/\/www\.youtube\.com\/watch\?v=[^&]+/);
                            if (match) {
                                youtubeUrl = match[0];
                            }
                        }

                        // If we only have video ID, construct the URL
                        if (!youtubeUrl && entry.youtubeVideoId) {
                            youtubeUrl = `https://www.youtube.com/watch?v=${entry.youtubeVideoId}`;
                        }

                        details.push(`📺 <a href="#" onclick="event.preventDefault(); window.loadYouTubeInAudioTool('${youtubeUrl || entry.youtubeVideoId}'); return false;" style="color: var(--primary); text-decoration: underline; cursor: pointer;" title="Load in Audio Tool">${entry.youtubeTitle}</a>`);
                    } else {
                        details.push(`📺 ${entry.youtubeTitle}`);
                    }
                }

                return `
                <div class="recent-session" style="background: var(--bg-input); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border); margin-bottom: 0.75rem;">
                    <div class="session-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <span class="session-area" style="font-weight: 600; color: var(--text-primary);">
                            ${entry.practiceArea || 'Practice'}
                        </span>
                        <span class="session-duration" style="color: var(--primary); font-weight: 600;">
                            ${durationStr}
                        </span>
                    </div>
                    ${details.length > 0 ? `
                        <div class="session-details" style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                            ${details.join(' • ')}
                        </div>
                    ` : ''}
                    <div class="session-time" style="font-size: 0.75rem; color: var(--text-muted);">
                        ${dateStr} at ${timeStr}
                    </div>
                </div>
            `;
            }).join('');

            recentSessionsContainer.innerHTML = sessionsList;
        } catch (error) {
            console.error('Error loading recent sessions:', error);
            recentSessionsContainer.innerHTML = '<div class="empty-state">Recent sessions unavailable</div>';
        }
    }

    async handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            try {
                console.log('Logout confirmed, processing...');

                // Stop any running components
                if (this.components.timer?.isRunning) {
                    this.components.timer.stop();
                }
                if (this.components.metronome?.isPlaying) {
                    this.components.metronome.stop();
                }
                if (this.components.audioPlayer?.audio) {
                    this.components.audioPlayer.audio.pause();
                }

                // Sign out through auth service
                await this.authService.logout();

                // Clear local storage
                localStorage.removeItem('currentUser');
                localStorage.removeItem('authToken');

                // Redirect to login page
                window.location.href = './login.html';

            } catch (error) {
                console.error('Error during logout:', error);
                // Force redirect even on error
                window.location.href = './login.html';
            }
        }
    }

    showQuickAddModal() {
        this.switchTab('practice');
        const section = document.querySelector('.log-practice-section');
        if (section) {
            section.classList.remove('collapsed');
            const icon = section.querySelector('.collapse-icon');
            if (icon) {
                icon.textContent = '▼';
            }
        }
    }

    showQuickSearch() {
        // TODO: Implement quick search functionality
        console.log('Quick search not yet implemented');
    }

    showNotification(message, type = 'info') {
        // Notifications disabled
    }

    destroy() {
        console.log('🧹 Cleaning up dashboard...');

        this.isDestroyed = true;

        // Remove hash change listener
        window.removeEventListener('hashchange', this.handleHashChange);

        // Clear intervals
        if (this.tipInterval) {
            clearInterval(this.tipInterval);
        }

        // Destroy all components
        Object.values(this.components).forEach(component => {
            if (component && typeof component.destroy === 'function') {
                try {
                    component.destroy();
                } catch (error) {
                    console.error('Error destroying component:', error);
                }
            }
        });

        // Destroy tab components
        Object.values(this.tabs).forEach(tab => {
            if (tab && typeof tab.destroy === 'function') {
                try {
                    tab.destroy();
                } catch (error) {
                    console.error('Error destroying tab:', error);
                }
            }
        });

        // Destroy cloud sync handler
        if (this.cloudSyncHandler) {
            this.cloudSyncHandler.destroy();
        }

        // Clear component references
        this.components = {};
        this.tabs = {};

        console.log('✅ Dashboard cleanup complete');
    }

    loadYouTubeInAudioTool(urlOrId) {
        console.log('Loading YouTube video in Audio Tool:', urlOrId);

        // Switch to audio tab
        this.switchTab('audio');

        // Wait for tab to load, then load the video
        setTimeout(() => {
            // Find the YouTube URL input
            const youtubeInput = document.getElementById('youtubeUrlInput');
            const loadButton = document.getElementById('loadYoutubeBtn');

            if (youtubeInput && loadButton) {
                // Click the YouTube source tab first
                const youtubeTab = document.querySelector('.source-tab[data-source="youtube"]');
                if (youtubeTab) {
                    youtubeTab.click();
                }

                // Set the URL and trigger load
                setTimeout(() => {
                    youtubeInput.value = urlOrId;
                    loadButton.click();
                }, 100);
            }
        }, 300);
    }



}
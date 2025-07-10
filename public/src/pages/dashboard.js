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
                        <button class="btn btn-icon theme-toggle" id="themeToggle" title="Toggle theme">
                            <i class="icon">${themeIcon}</i>
                        </button>
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
            this.tabs.stats = new StatsTab(this.storageService);
            this.tabs.history = new HistoryTab(this.storageService);
            this.tabs.goals = new GoalsTab(this.storageService);
            this.tabs.calendar = new CalendarTab(this.storageService);
            this.tabs.settings = new SettingsTab(this.storageService, this.authService, cloudStorage);

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

    toggleTheme() {
        if (!this.themeService) {
            console.error('Theme service not initialized');
            return;
        }

        try {
            const newTheme = this.themeService.toggleTheme();

            // Update theme toggle icon
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                themeToggle.innerHTML = `<i class="icon">${newTheme === 'dark' ? '🌙' : '☀️'}</i>`;
            }

            // Save preference
            this.storageService.saveUserSettings({darkMode: newTheme === 'dark'});

            console.log(`Theme switched to: ${newTheme}`);
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

            console.log('✅ Dashboard data loaded');
        } catch (error) {
            console.error('❌ Error loading dashboard data:', error);
            // Don't throw, as basic functionality should still work
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
        try {
            // Create notification element
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
               <div class="notification-content">
                   <span class="notification-icon">${
                type === 'success' ? '✅' :
                    type === 'error' ? '❌' :
                        type === 'warning' ? '⚠️' : 'ℹ️'
            }</span>
                   <span class="notification-message">${message}</span>
               </div>
           `;

            // Add to notification container or create one
            let container = document.querySelector('.notification-container');
            if (!container) {
                container = document.createElement('div');
                container.className = 'notification-container';
                container.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    pointer-events: none;
                `;
                document.body.appendChild(container);
            }

            container.appendChild(notification);

            // Animate in
            requestAnimationFrame(() => {
                notification.classList.add('show');
            });

            // Auto remove after 3 seconds
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }, 3000);
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }

    destroy() {
        console.log('🧹 Cleaning up dashboard...');

        this.isDestroyed = true;

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
}
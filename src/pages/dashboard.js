// Dashboard Page Component - Complete Updated Version
import {Timer} from '../components/timer.js';
import {PracticeForm} from '../components/practiceForm.js';
import {AudioPlayer} from '../components/audioPlayer.js';
import {Metronome} from '../components/metronome.js';
import {GoalsList} from '../components/goalsList.js';
import {StatsPanel} from '../components/statsPanel.js';
import {StreakHeatMap} from '../components/streakHeatMap.js';
import {AchievementBadges} from '../components/achievementBadges.js';
import {AudioService} from '../services/audioService.js';
import {TimeUtils} from '../utils/helpers.js';

export class DashboardPage {
    constructor(storageService, authService) {
        this.storageService = storageService;
        this.authService = authService;
        this.currentTab = 'practice';
        this.components = {};
        this.audioService = new AudioService();
        this.themeService = null; // Will be set by app.js
        this.isDestroyed = false;
    }

    async render() {
        const app = document.getElementById('app');

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
                           <button class="btn btn-icon theme-toggle" id="themeToggle" title="Toggle theme">
                               <i class="icon">${themeIcon}</i>
                           </button>
                       </div>
                   </header>

                   <!-- Tab Content -->
                   <div class="tab-content">
                       <!-- Practice Tab -->
                       <div class="tab-pane active" id="practiceTab" data-tab="practice">
                           <div class="practice-layout">
                               <div class="practice-main">
                                   <!-- Timer (Always visible, non-collapsible) -->
                                   <div id="timerContainer" class="timer-section"></div>

                                   <!-- Log Practice Section -->
                                   <div class="log-practice-section collapsed">
                                       <div class="log-practice-header">
                                           <div class="log-practice-title">
                                               <i class="icon">📝</i>
                                               <h3>Log Practice Session</h3>
                                           </div>
                                           <i class="icon collapse-icon">▶</i>
                                       </div>
                                       <div class="log-practice-content">
                                           <div class="log-practice-form-wrapper">
                                               <div id="practiceFormContainer"></div>
                                           </div>
                                       </div>
                                   </div>

                                   <!-- Recent Sessions -->
                                   <div class="dashboard-widget">
                                       <div class="widget-header">
                                           <h3 class="widget-title">Recent Sessions</h3>
                                           <button class="widget-action" id="viewAllSessions">View All</button>
                                       </div>
                                       <div id="recentSessionsList" class="recent-sessions-widget"></div>
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
                                       <div id="quickStats"></div>
                                   </div>

                                   <!-- Streak Calendar -->
                                   <div class="dashboard-widget">
                                       <h3 class="widget-title">Practice Streak</h3>
                                       <div id="streakCalendar"></div>
                                   </div>
                               </aside>
                           </div>
                       </div>

                       <!-- Audio Practice Tool Tab -->
                       <div class="tab-pane" id="audioTab" data-tab="audio">
                           <div class="audio-layout">
                               <!-- Timer (Always visible) -->
                               <div id="timerContainerAudio" class="timer-section"></div>
                               
                               <!-- Log Practice Section -->
                               <div class="log-practice-section collapsed">
                                   <div class="log-practice-header">
                                       <div class="log-practice-title">
                                           <i class="icon">📝</i>
                                           <h3>Log Practice Session</h3>
                                       </div>
                                       <i class="icon collapse-icon">▶</i>
                                   </div>
                                   <div class="log-practice-content">
                                       <div class="log-practice-form-wrapper">
                                           <div id="practiceFormContainerAudio"></div>
                                       </div>
                                   </div>
                               </div>
                               
                               <!-- Audio Player -->
                               <div id="audioPlayerContainer" class="audio-player-wrapper"></div>
                           </div>
                       </div>

                       <!-- Metronome Tab -->
                       <div class="tab-pane" id="metronomeTab" data-tab="metronome">
                           <div class="metronome-layout">
                               <!-- Timer (Always visible) -->
                               <div id="timerContainerMetronome" class="timer-section"></div>
                               
                               <!-- Log Practice Section -->
                               <div class="log-practice-section collapsed">
                                   <div class="log-practice-header">
                                       <div class="log-practice-title">
                                           <i class="icon">📝</i>
                                           <h3>Log Practice Session</h3>
                                       </div>
                                       <i class="icon collapse-icon">▶</i>
                                   </div>
                                   <div class="log-practice-content">
                                       <div class="log-practice-form-wrapper">
                                           <div id="practiceFormContainerMetronome"></div>
                                       </div>
                                   </div>
                               </div>
                               
                               <!-- Metronome -->
                               <div id="metronomeContainer" class="metronome-wrapper"></div>
                           </div>
                       </div>

                       <!-- Goals Tab -->
                       <div class="tab-pane" id="goalsTab" data-tab="goals">
                           <div class="goals-layout">
                               <div class="goals-main">
                                   <div id="goalsListContainer"></div>
                               </div>
                               <div class="goals-sidebar">
                                   <div id="achievementsContainer"></div>
                               </div>
                           </div>
                       </div>

                       <!-- Stats Tab -->
                       <div class="tab-pane" id="statsTab" data-tab="stats">
                           <div class="stats-layout">
                               <div id="statsContainer"></div>
                           </div>
                       </div>

                       <!-- History Tab -->
                       <div class="tab-pane" id="historyTab" data-tab="history">
                           <div class="history-layout">
                               <div class="history-header">
                                   <h2>Practice History</h2>
                                   <div class="history-filters">
                                       <select class="filter-select" id="historyFilter">
                                           <option value="all">All Sessions</option>
                                           <option value="week">This Week</option>
                                           <option value="month">This Month</option>
                                           <option value="year">This Year</option>
                                       </select>
                                       <button class="btn btn-secondary" id="exportHistoryBtn">
                                           Export History
                                       </button>
                                   </div>
                               </div>
                               <div id="historyList" class="history-list"></div>
                           </div>
                       </div>

                       <!-- Calendar Tab -->
                       <div class="tab-pane" id="calendarTab" data-tab="calendar">
                           <div class="calendar-layout">
                               <div id="calendarContainer"></div>
                           </div>
                       </div>

                       <!-- Settings Tab -->
                       <div class="tab-pane" id="settingsTab" data-tab="settings">
                           <div class="settings-layout">
                               <div class="settings-section">
                                   <h3>Account Settings</h3>
                                   <div class="form-group">
                                       <label>Email</label>
                                       <input type="email" id="settingsEmail" class="form-control" disabled>
                                   </div>
                                   <button class="btn btn-primary" id="changePasswordBtn">
                                       Change Password
                                   </button>
                               </div>

                               <div class="settings-section">
                                   <h3>Data Management</h3>
                                   <div id="storageIndicator" class="storage-indicator"></div>
                                   <div class="settings-actions">
                                       <button class="btn btn-secondary" id="exportDataBtn">
                                           <i class="icon">📥</i> Export Data
                                       </button>
                                       <button class="btn btn-secondary" id="importDataBtn">
                                           <i class="icon">📤</i> Import Data
                                       </button>
                                       <button class="btn btn-danger" id="clearDataBtn">
                                           <i class="icon">🗑️</i> Clear All Data
                                       </button>
                                   </div>
                               </div>

                               <div class="settings-section">
                                   <h3>Preferences</h3>
                                   <label class="checkbox-label">
                                       <input type="checkbox" id="notificationsEnabled">
                                       <span>Enable practice reminders</span>
                                   </label>
                                   <label class="checkbox-label">
                                       <input type="checkbox" id="darkModeEnabled">
                                       <span>Dark mode</span>
                                   </label>
                                   <label class="checkbox-label">
                                       <input type="checkbox" id="soundEnabled" checked>
                                       <span>Enable sound effects</span>
                                   </label>
                               </div>

                               <div class="settings-section">
                                   <h3>About</h3>
                                   <div class="about-info">
                                       <p>Guitar Practice Journal v${window.APP_VERSION || '7.6.2'}</p>
                                       <p class="text-muted">Created with ❤️ for musicians</p>
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>
               </main>
           </div>

           <!-- Mobile FAB -->
           <button class="fab" id="fabBtn" title="Quick add practice session">
               <i class="icon">➕</i>
           </button>
       `;

        this.attachEventListeners();
        this.initializeComponents();
        await this.loadDashboardData();
        this.startDailyTipRotation();
    }

    attachEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
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

        // Collapsible log practice sections - attach to ALL headers
        document.querySelectorAll('.log-practice-header').forEach(header => {
            header.addEventListener('click', () => {
                const section = header.closest('.log-practice-section');
                const icon = header.querySelector('.collapse-icon');
                if (section && icon) {
                    section.classList.toggle('collapsed');
                    icon.textContent = section.classList.contains('collapsed') ? '▶' : '▼';
                }
            });
        });

        // View all sessions
        document.getElementById('viewAllSessions')?.addEventListener('click', () => {
            this.switchTab('history');
        });

        // History filter
        document.getElementById('historyFilter')?.addEventListener('change', (e) => {
            this.filterHistory(e.target.value);
        });

        // Export history
        document.getElementById('exportHistoryBtn')?.addEventListener('click', () => {
            this.exportHistory();
        });

        // Settings actions
        document.getElementById('exportDataBtn')?.addEventListener('click', () => this.exportData());
        document.getElementById('importDataBtn')?.addEventListener('click', () => this.importData());
        document.getElementById('clearDataBtn')?.addEventListener('click', () => this.clearData());
        document.getElementById('changePasswordBtn')?.addEventListener('click', () => this.changePassword());

        // Preferences checkboxes
        document.getElementById('notificationsEnabled')?.addEventListener('change', (e) => {
            this.updatePreference('notificationsEnabled', e.target.checked);
        });

        document.getElementById('darkModeEnabled')?.addEventListener('change', (e) => {
            const shouldBeDark = e.target.checked;
            const currentTheme = this.themeService?.getTheme() || 'dark';

            // Only toggle if the desired state is different from current
            if ((shouldBeDark && currentTheme === 'light') || (!shouldBeDark && currentTheme === 'dark')) {
                this.toggleTheme();
            }
        });

        document.getElementById('soundEnabled')?.addEventListener('change', (e) => {
            this.updatePreference('soundEnabled', e.target.checked);
        });

        // Mobile FAB
        document.getElementById('fabBtn')?.addEventListener('click', () => {
            this.showQuickAddModal();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
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
        });
    }

    initializeComponents() {
        console.log('Initializing dashboard components...');

        try {
            // Initialize Timer FIRST (critical for Practice tab)
            const timerContainer = document.getElementById('timerContainer');
            if (timerContainer) {
                const timer = new Timer(timerContainer);

                // Store timer reference for audio sync
                this.timer = timer;
                this.components.timer = timer;

                // Ensure event listeners are properly attached after a short delay
                setTimeout(() => {
                    this.components.timer.attachEventListeners();
                }, 100);
            } else {
                console.error('Timer container not found!');
            }

            // Initialize Practice Form
            const practiceFormContainer = document.getElementById('practiceFormContainer');
            if (practiceFormContainer) {
                console.log('Initializing Practice Form...');
                try {
                    this.components.practiceForm = new PracticeForm(practiceFormContainer, this.storageService);
                    this.components.practiceForm.render();

                    // Connect timer to practice form
                    if (this.components.timer && this.components.practiceForm.setTimer) {
                        this.components.practiceForm.setTimer(this.components.timer);
                    }

                    // Set up a simple refresh mechanism
                    if (this.components.practiceForm) {
                        this.components.practiceForm.dashboardCallbacks = {
                            onSave: () => {
                                this.loadRecentSessions();
                                this.loadQuickStats();
                                if (this.components.streakHeatMap) {
                                    this.components.streakHeatMap.loadPracticeData();
                                }
                            }
                        };
                    }

                } catch (formError) {
                    console.error('Error initializing Practice Form:', formError);
                    practiceFormContainer.innerHTML = `
                       <div class="error-state" style="padding: 2rem; text-align: center;">
                           <p style="color: var(--text-secondary);">Unable to load practice form</p>
                           <button class="btn btn-primary" style="margin-top: 1rem;" onclick="location.reload()">
                               Reload Page
                           </button>
                       </div>
                   `;
                }
            }

            // Initialize Streak HeatMap
            const streakContainer = document.getElementById('streakCalendar');
            if (streakContainer) {
                console.log('Initializing Streak HeatMap...');
                try {
                    this.components.streakHeatMap = new StreakHeatMap(streakContainer, this.storageService);
                    this.components.streakHeatMap.render();
                } catch (heatmapError) {
                    console.error('Error initializing Streak HeatMap:', heatmapError);
                    streakContainer.innerHTML = '<div class="empty-state">Calendar unavailable</div>';
                }
            }

            // Initialize shared timer and form for other tabs
            this.initializeSharedComponents();

            // Lazy load other components
            this.lazyLoadComponents();

            // Set up a global practice saved handler
            this.setupGlobalPracticeHandler();

        } catch (error) {
            console.error('Error initializing components:', error);
            this.showNotification('Error loading some components', 'error');
        }
    }

    // Initialize shared components across tabs
    initializeSharedComponents() {
        // We'll use the same timer instance across all tabs
        // Just move its container when switching tabs
        this.sharedTimer = this.components.timer;
        this.sharedPracticeForm = this.components.practiceForm;
    }

    setupGlobalPracticeHandler() {
        // Listen for custom events on document
        document.addEventListener('practiceSaved', () => {
            console.log('Practice saved event detected');
            this.loadRecentSessions();
            this.loadQuickStats();
            if (this.components.streakHeatMap) {
                this.components.streakHeatMap.loadPracticeData();
            }
        });

        // Also listen for storage events (in case practice is saved directly)
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.includes('practice')) {
                console.log('Storage change detected, refreshing data...');
                this.loadRecentSessions();
                this.loadQuickStats();
            }
        });
    }


    lazyLoadComponents() {
        // Use IntersectionObserver for truly lazy loading
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const tabName = entry.target.dataset.tab;
                    // Only initialize if not already initialized
                    if (!this.isComponentInitialized(tabName)) {
                        this.initializeTabComponent(tabName);
                    }
                    observer.unobserve(entry.target);
                }
            });
        }, {threshold: 0.1});

        // Observe tab panes
        document.querySelectorAll('.tab-pane:not(.active)').forEach(pane => {
            observer.observe(pane);
        });
    }

    isComponentInitialized(tabName) {
        switch (tabName) {
            case 'audio':
                return !!this.components.audioPlayer;
            case 'metronome':
                return !!this.components.metronome;
            case 'goals':
                return !!this.components.goalsList;
            case 'stats':
                return !!this.components.statsPanel;
            default:
                return false;
        }
    }

    initializeTabComponent(tabName) {
        if (this.isDestroyed) return;

        switch (tabName) {
            case 'audio':
                const audioPlayerContainer = document.getElementById('audioPlayerContainer');
                if (!audioPlayerContainer) {
                    console.error('Audio player container not found');
                    return;
                }

                if (!this.components.audioPlayer) {
                    console.log('Initializing Audio Player...');
                    try {
                        // Ensure the container is visible and has dimensions
                        audioPlayerContainer.style.display = 'block';
                        audioPlayerContainer.style.minHeight = '600px';

                        // Create the audio player instance
                        this.components.audioPlayer = new AudioPlayer(audioPlayerContainer, this.audioService);

                        // Pass storage service
                        this.components.audioPlayer.storageService = this.storageService;

                        // Store reference to dashboard for timer access
                        this.components.audioPlayer.dashboard = this;

                        // Initialize immediately since the tab is now active
                        this.components.audioPlayer.init();
                        this.components.audioPlayer.isInitialized = true;

                        console.log('Audio Player initialized successfully');
                    } catch (error) {
                        console.error('Error initializing Audio Player:', error);
                        audioPlayerContainer.innerHTML = `
                           <div class="error-state" style="padding: 2rem; text-align: center; color: var(--text-secondary);">
                               <h3>Unable to load Audio Player</h3>
                               <p>${error.message}</p>
                               <button class="btn btn-primary" onclick="location.reload()">Reload Page</button>
                           </div>
                       `;
                    }
                } else {
                    // If already initialized, ensure it's properly displayed
                    console.log('Audio Player already initialized, ensuring visibility');
                    if (this.components.audioPlayer.render) {
                        this.components.audioPlayer.render();
                    }

                    // Resize waveform if it exists
                    if (this.components.audioPlayer.waveformVisualizer) {
                        requestAnimationFrame(() => {
                            this.components.audioPlayer.waveformVisualizer.resizeCanvas();
                        });
                    }
                }
                break;

            case 'calendar':
                if (!this.components.calendar) {
                    const calendarContainer = document.getElementById('calendarContainer');
                    if (calendarContainer) {
                        console.log('Loading calendar...');
                        import('../pages/calendar.js').then(CalendarModule => {
                            this.components.calendar = new CalendarModule.CalendarPage(this.storageService);
                            this.components.calendar.init(calendarContainer);
                        }).catch(error => {
                            console.error('Error loading calendar:', error);
                            calendarContainer.innerHTML = '<div class="error-state">Failed to load calendar</div>';
                        });
                    }
                }
                break;


            case 'metronome':
                if (!this.components.metronome) {
                    const metronomeContainer = document.getElementById('metronomeContainer');
                    if (metronomeContainer) {
                        console.log('Lazy loading Metronome...');
                        try {
                            this.components.metronome = new Metronome(metronomeContainer);
                            this.components.metronome.render();
                            if (this.components.timer) {
                                this.components.metronome.setTimer(this.components.timer);
                            }
                        } catch (error) {
                            console.error('Error initializing Metronome:', error);
                        }
                    }
                }
                break;

            case 'goals':
                if (!this.components.goalsList) {
                    const goalsContainer = document.getElementById('goalsListContainer');
                    if (goalsContainer) {
                        console.log('Lazy loading Goals List...');
                        try {
                            this.components.goalsList = new GoalsList(goalsContainer, this.storageService);
                            this.components.goalsList.render();
                        } catch (error) {
                            console.error('Error initializing Goals List:', error);
                        }
                    }
                }
                if (!this.components.achievements) {
                    const achievementsContainer = document.getElementById('achievementsContainer');
                    if (achievementsContainer) {
                        console.log('Lazy loading Achievement Badges...');
                        try {
                            this.components.achievements = new AchievementBadges(achievementsContainer, this.storageService);
                            this.components.achievements.render();
                        } catch (error) {
                            console.error('Error initializing Achievement Badges:', error);
                        }
                    }
                }
                break;

            case 'stats':
                if (!this.components.statsPanel) {
                    const statsContainer = document.getElementById('statsContainer');
                    if (statsContainer) {
                        console.log('Lazy loading Stats Panel...');
                        try {
                            this.components.statsPanel = new StatsPanel(statsContainer, this.storageService);
                            this.components.statsPanel.render();
                        } catch (error) {
                            console.error('Error initializing Stats Panel:', error);
                        }
                    }
                }
                break;
        }
    }

    switchTab(tabName) {
        console.log('Switching to tab:', tabName);

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
        document.getElementById('pageTitle').textContent = titles[tabName] || 'Dashboard';

        this.currentTab = tabName;

        // Close mobile menu
        document.querySelector('.sidebar')?.classList.remove('active');

        // Move timer and practice form to the new tab if needed
        if (tabName === 'audio' || tabName === 'metronome') {
            this.moveSharedComponentsToTab(tabName);
        }

        // Initialize component for the tab if not already initialized
        this.initializeTabComponent(tabName);

        // Special handling for certain tabs
        if (tabName === 'audio' && this.components.audioPlayer?.waveformVisualizer) {
            // Resize waveform when switching to audio tab
            requestAnimationFrame(() => {
                this.components.audioPlayer.waveformVisualizer.resizeCanvas();
            });
        }
    }

    // Move shared components to different tabs
    moveSharedComponentsToTab(tabName) {
        let timerContainerId, formContainerId;

        switch (tabName) {
            case 'audio':
                timerContainerId = 'timerContainerAudio';
                formContainerId = 'practiceFormContainerAudio';
                break;
            case 'metronome':
                timerContainerId = 'timerContainerMetronome';
                formContainerId = 'practiceFormContainerMetronome';
                break;
            default:
                timerContainerId = 'timerContainer';
                formContainerId = 'practiceFormContainer';
        }

// Move timer
        const timerContainer = document.getElementById(timerContainerId);
        if (timerContainer && this.components.timer) {
            // Save the current sync state before moving
            const currentSyncState = this.components.timer.syncWithAudio;

            // Clear the existing interval first
            if (this.components.timer.interval) {
                clearInterval(this.components.timer.interval);
                this.components.timer.interval = null;
            }

            timerContainer.innerHTML = '';
            this.components.timer.container = timerContainer;
            this.components.timer.init(); // Use init() instead of just render()

            // Restore the sync state after re-initialization
            this.components.timer.syncWithAudio = currentSyncState;
            const newCheckbox = document.getElementById('timerSyncCheckbox');
            if (newCheckbox) {
                newCheckbox.checked = currentSyncState;
            }

            console.log('Timer moved to new tab, sync state:', currentSyncState);
        }

        // Move practice form - use this.components.practiceForm
        const formContainer = document.getElementById(formContainerId);
        if (formContainer && this.components.practiceForm) {
            formContainer.innerHTML = '';
            this.components.practiceForm.container = formContainer;
            this.components.practiceForm.render();
        }

        // Re-attach collapse listeners
        setTimeout(() => {
            document.querySelectorAll('.log-practice-header').forEach(header => {
                const newHeader = header.cloneNode(true);
                header.parentNode.replaceChild(newHeader, header);

                newHeader.addEventListener('click', () => {
                    const section = newHeader.closest('.log-practice-section');
                    const icon = newHeader.querySelector('.collapse-icon');
                    if (section && icon) {
                        section.classList.toggle('collapsed');
                        icon.textContent = section.classList.contains('collapsed') ? '▶' : '▼';
                    }
                });
            });
        }, 100);
    }

    toggleTheme() {
        if (!this.themeService) {
            console.error('Theme service not initialized');
            return;
        }

        const newTheme = this.themeService.toggleTheme();

        // Update theme toggle icon
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.innerHTML = `<i class="icon">${newTheme === 'dark' ? '🌙' : '☀️'}</i>`;
        }

        // Update dark mode checkbox in settings
        const darkModeCheckbox = document.getElementById('darkModeEnabled');
        if (darkModeCheckbox) {
            darkModeCheckbox.checked = newTheme === 'dark';
        }

        // Save preference
        this.storageService.saveUserSettings({darkMode: newTheme === 'dark'});

        console.log(`Theme switched to: ${newTheme}`);
    }

    async loadDashboardData() {
        console.log('Loading dashboard data...');

        try {
            // Load data in parallel for better performance
            await Promise.all([
                this.loadRecentSessions(),
                this.loadQuickStats(),
                this.loadHistory(),
                this.loadUserSettings()
            ]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    async loadRecentSessions() {
        try {
            const entries = await this.storageService.getPracticeEntries();
            const recentSessions = entries.slice(0, 5);

            const container = document.getElementById('recentSessionsList');
            if (!container) return;

            if (recentSessions.length === 0) {
                container.innerHTML = `
                   <div class="empty-state">
                       <p>No practice sessions yet</p>
                       <p class="text-muted">Start practicing to see your progress here!</p>
                   </div>
               `;
                return;
            }

            container.innerHTML = recentSessions.map(session => {
                const duration = TimeUtils.formatDuration(session.duration || 0, true);
                const date = TimeUtils.getRelativeTime(session.date);

                return `
                   <div class="session-item">
                       <div class="session-header">
                           <span class="session-date">${date}</span>
                           <span class="session-duration">${duration}</span>
                       </div>
                       <div class="session-details">
                           <div class="session-detail">
                               <span class="detail-label">Practice Area:</span>
                               <span class="detail-value">${session.practiceArea || 'General Practice'}</span>
                           </div>
                           ${session.bpm ? `
                               <div class="session-detail">
                                   <span class="detail-label">BPM:</span>
                                   <span class="detail-value">${session.bpm}</span>
                               </div>
                           ` : ''}
                           ${session.key ? `
                               <div class="session-detail">
                                   <span class="detail-label">Key:</span>
                                   <span class="detail-value">${session.key}</span>
                               </div>
                           ` : ''}
                       </div>
                       ${session.notes ? `<div class="session-notes">${this.truncateText(session.notes, 100)}</div>` : ''}
                   </div>
               `;
            }).join('');
        } catch (error) {
            console.error('Error loading recent sessions:', error);
            const container = document.getElementById('recentSessionsList');
            if (container) {
                container.innerHTML = '<p class="empty-state text-danger">Error loading recent sessions</p>';
            }
        }
    }

    async loadQuickStats() {
        try {
            const stats = await this.storageService.getStats();

            const container = document.getElementById('quickStats');
            if (!container) return;

            // Calculate additional stats
            const todayPractice = await this.getTodayPracticeTime();
            const weeklyAverage = await this.getWeeklyAverage();

            container.innerHTML = `
               <div class="quick-stat">
                   <div class="stat-value">${stats.totalSessions || 0}</div>
                   <div class="stat-label">Total Sessions</div>
               </div>
               <div class="quick-stat">
                   <div class="stat-value">${stats.totalHours || 0}h</div>
                   <div class="stat-label">Total Practice</div>
               </div>
               <div class="quick-stat">
                   <div class="stat-value">${stats.currentStreak || 0}</div>
                   <div class="stat-label">Day Streak</div>
               </div>
               <div class="quick-stat">
                   <div class="stat-value">${todayPractice}m</div>
                   <div class="stat-label">Today</div>
               </div>
           `;
        } catch (error) {
            console.error('Error loading quick stats:', error);
        }
    }

    async getTodayPracticeTime() {
        try {
            const sessions = await this.storageService.getPracticeEntries();
            const today = new Date().toDateString();

            const todaySessions = sessions.filter(s =>
                new Date(s.date).toDateString() === today
            );

            const totalSeconds = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
            return Math.round(totalSeconds / 60);
        } catch (error) {
            console.error('Error calculating today practice time:', error);
            return 0;
        }
    }

    async getWeeklyAverage() {
        try {
            const sessions = await this.storageService.getPracticeEntries();
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            const weekSessions = sessions.filter(s =>
                new Date(s.date) >= weekAgo
            );

            const totalSeconds = weekSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
            return Math.round(totalSeconds / 60 / 7); // Average per day
        } catch (error) {
            console.error('Error calculating weekly average:', error);
            return 0;
        }
    }

    async loadHistory() {
        try {
            const sessions = await this.storageService.getPracticeEntries();
            this.allSessions = sessions;
            this.displayHistory(this.allSessions);
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }

    displayHistory(sessions) {
        const container = document.getElementById('historyList');
        if (!container) return;

        if (sessions.length === 0) {
            container.innerHTML = '<p class="empty-state">No practice sessions found</p>';
            return;
        }

        // Group sessions by month
        const groupedSessions = this.groupSessionsByMonth(sessions);

        container.innerHTML = Object.entries(groupedSessions).map(([month, monthSessions]) => `
           <div class="history-month-group">
               <h3 class="history-month-header">${month}</h3>
               ${monthSessions.map(session => {
            const duration = TimeUtils.formatDuration(session.duration || 0);
            const date = TimeUtils.formatDate(session.date, {
                weekday: 'short',
                day: 'numeric'
            });

            return `
                       <div class="history-item">
                           <div class="history-item-header">
                               <h4>${session.practiceArea || 'Practice Session'}</h4>
                               <span class="history-date">${date}</span>
                           </div>
                           <div class="history-item-details">
                               <span class="history-duration">
                                   <i class="icon">⏱️</i> ${duration}
                               </span>
                               ${session.bpm ? `<span class="history-tempo"><i class="icon">🎵</i> ${session.bpm} BPM</span>` : ''}
                               ${session.key ? `<span class="history-key"><i class="icon">🎼</i> ${session.key}</span>` : ''}
                               ${session.audioFile ? `<span class="history-audio"><i class="icon">🎧</i> Audio</span>` : ''}
                           </div>
                           ${session.notes ? `<div class="history-notes">${session.notes}</div>` : ''}
                       </div>
                   `;
        }).join('')}
           </div>
       `).join('');
    }

    groupSessionsByMonth(sessions) {
        const grouped = {};

        sessions.forEach(session => {
            const date = new Date(session.date);
            const monthKey = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long'
            });

            if (!grouped[monthKey]) {
                grouped[monthKey] = [];
            }

            grouped[monthKey].push(session);
        });

        return grouped;
    }

    filterHistory(filter) {
        if (!this.allSessions) return;

        const now = new Date();
        let filtered = this.allSessions;

        switch (filter) {
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filtered = this.allSessions.filter(s => new Date(s.date) >= weekAgo);
                break;
            case 'month':
                const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                filtered = this.allSessions.filter(s => new Date(s.date) >= monthAgo);
                break;
            case 'year':
                const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                filtered = this.allSessions.filter(s => new Date(s.date) >= yearAgo);
                break;
        }

        this.displayHistory(filtered);
    }

    async loadUserSettings() {
        try {
            const user = this.authService.getCurrentUser();
            const settings = await this.storageService.getUserSettings();

            // Update email display
            const emailInput = document.getElementById('settingsEmail');
            if (emailInput && user) {
                emailInput.value = user.email;
            }

            // Update preferences
            const notificationsCheckbox = document.getElementById('notificationsEnabled');
            if (notificationsCheckbox) {
                notificationsCheckbox.checked = settings?.notificationsEnabled || false;
            }

            const darkModeCheckbox = document.getElementById('darkModeEnabled');
            if (darkModeCheckbox) {
                const currentTheme = this.themeService?.getTheme() || 'dark';
                darkModeCheckbox.checked = currentTheme === 'dark';
            }

            const soundCheckbox = document.getElementById('soundEnabled');
            if (soundCheckbox) {
                soundCheckbox.checked = settings?.soundEnabled !== false;
            }

            // Update storage indicator
            await this.updateStorageIndicator();
        } catch (error) {
            console.error('Error loading user settings:', error);
        }
    }

    async updateStorageIndicator() {
        const indicator = document.getElementById('storageIndicator');
        if (!indicator) return;

        try {
            const usage = await this.storageService.getStorageUsage();
            const percentage = Math.min((usage.used / usage.total) * 100, 100);
            const usedMB = (usage.used / 1024 / 1024).toFixed(2);
            const totalMB = (usage.total / 1024 / 1024).toFixed(2);

            indicator.innerHTML = `
               <div class="storage-info">
                   <span>Storage Used: ${usedMB} MB / ${totalMB} MB</span>
                   <span class="storage-percentage ${percentage > 80 ? 'text-warning' : ''}">${percentage.toFixed(1)}%</span>
               </div>
               <div class="storage-bar">
                   <div class="storage-bar-fill" style="width: ${percentage}%; background: ${percentage > 80 ? 'var(--warning)' : 'var(--primary)'}"></div>
               </div>
               ${percentage > 80 ? '<p class="text-warning text-sm mt-2">⚠️ Storage space is running low</p>' : ''}
           `;
        } catch (error) {
            indicator.innerHTML = '<p class="text-muted">Storage information unavailable</p>';
        }
    }

    async handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            try {
                console.log('Logout confirmed, processing...');

                // Stop any running timers or audio
                if (this.components.timer?.isRunning) {
                    this.components.timer.stop();
                }
                if (this.components.metronome?.isPlaying) {
                    this.components.metronome.stop();
                }
                if (this.components.audioPlayer?.audio) {
                    this.components.audioPlayer.audio.pause();
                }

                // Clean up components
                this.destroy();

                // Call authService logout
                await this.authService.logout();

                // Redirect to login
                const currentPath = window.location.pathname;
                const basePath = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
                const loginUrl = `${window.location.origin}${basePath}login.html`;

                console.log('Redirecting to login:', loginUrl);
                window.location.href = loginUrl;

            } catch (error) {
                console.error('Error during logout:', error);
                // Force redirect even on error
                window.location.href = window.location.href.replace('index.html', 'login.html');
            }
        }
    }

    async exportData() {
        try {
            const data = await this.storageService.exportAllData();
            const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `guitar-practice-export-${new Date().toISOString().split('T')[0]}.json`;
            a.click();

            URL.revokeObjectURL(url);
            this.showNotification('Data exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showNotification('Error exporting data', 'error');
        }
    }

    async importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const data = JSON.parse(text);

                if (confirm('This will merge the imported data with your existing data. Continue?')) {
                    await this.storageService.importData(data);
                    this.showNotification('Data imported successfully', 'success');
                    await this.loadDashboardData();
                }
            } catch (error) {
                console.error('Error importing data:', error);
                this.showNotification('Error importing data. Please check the file format.', 'error');
            }
        });

        input.click();
    }

    async clearData() {
        if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            return;
        }

        if (!confirm('This will permanently delete all your practice sessions, goals, and settings. Are you absolutely sure?')) {
            return;
        }

        try {
            await this.storageService.clearAllData();
            this.showNotification('All data cleared', 'success');
            await this.loadDashboardData();
        } catch (error) {
            console.error('Error clearing data:', error);
            this.showNotification('Error clearing data', 'error');
        }
    }

    async exportHistory() {
        try {
            const sessions = this.allSessions || [];
            const csvContent = this.convertSessionsToCSV(sessions);

            const blob = new Blob([csvContent], {type: 'text/csv'});
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `practice-history-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();

            URL.revokeObjectURL(url);
            this.showNotification('History exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting history:', error);
            this.showNotification('Error exporting history', 'error');
        }
    }

    convertSessionsToCSV(sessions) {
        const headers = ['Date', 'Duration (minutes)', 'Practice Area', 'BPM', 'Key', 'Notes'];
        const rows = sessions.map(session => [
            new Date(session.date).toLocaleDateString(),
            Math.round((session.duration || 0) / 60),
            session.practiceArea || '',
            session.bpm || '',
            session.key || '',
            (session.notes || '').replace(/,/g, ';') // Replace commas to avoid CSV issues
        ]);

        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }

    changePassword() {
        // TODO: Implement password change functionality
        this.showNotification('Password change feature coming soon!', 'info');
    }

    updatePreference(key, value) {
        this.storageService.saveUserSettings({[key]: value});
        console.log(`Preference updated: ${key} = ${value}`);
    }

    showQuickAddModal() {
        // TODO: Implement quick add modal
        this.switchTab('practice');
        document.querySelector('.log-practice-section')?.classList.remove('collapsed');
        document.querySelector('.collapse-icon').textContent = '▼';
    }

    showQuickSearch() {
        // TODO: Implement quick search functionality
        console.log('Quick search not yet implemented');
    }

    showNotification(message, type = 'info') {
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
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    startDailyTipRotation() {
        const tips = [
            "Focus on playing slowly and accurately before increasing speed.",
            "Practice with a metronome to improve your timing and rhythm.",
            "Record yourself playing to identify areas for improvement.",
            "Set specific, measurable goals for each practice session.",
            "Take regular breaks to avoid fatigue and maintain focus.",
            "Practice scales in different positions to improve fretboard knowledge.",
            "Learn songs by ear to develop your musical listening skills.",
            "Focus on clean chord transitions before increasing strumming speed.",
            "Use a practice journal to track your progress over time.",
            "Experiment with different pick angles for varied tones.",
            "Practice both with and without effects to hear your true tone.",
            "Work on your weakest skills for balanced improvement.",
            "Learn the theory behind what you're playing for deeper understanding.",
            "Practice performing in front of others to build confidence.",
            "Use a timer to ensure focused, productive practice sessions."
        ];

        // Show a random tip
        const updateTip = () => {
            const tipElement = document.getElementById('dailyTip');
            if (tipElement) {
                const randomTip = tips[Math.floor(Math.random() * tips.length)];
                tipElement.textContent = randomTip;
            }
        };

        // Update immediately
        updateTip();

        // Update every 30 seconds while dashboard is active
        this.tipInterval = setInterval(updateTip, 30000);
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // Add retry method for audio player
    async retryAudioPlayer() {
        console.log('Retrying audio player initialization...');
        const container = document.getElementById('audioPlayerContainer');
        if (container) {
            container.innerHTML = '<div class="loading-spinner" style="margin: 2rem auto;"></div>';
            await new Promise(resolve => setTimeout(resolve, 500));
            this.initializeTabComponent('audio');
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

        // Clear component references
        this.components = {};

        // Remove event listeners
        document.removeEventListener('keydown', this.keyboardHandler);
    }
}
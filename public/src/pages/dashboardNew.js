// New Dashboard Page Component with Top Navigation and Unified Practice Content
import { Header } from '../components/header.js';
import { TopNavigation } from '../components/topNavigation.js';
import { UnifiedPracticeContent } from '../components/unifiedPracticeContent.js';
import { Footer } from '../components/footer.js';
import { CloudSyncHandler } from '../services/cloudSyncHandler.js';

export class DashboardPage {
    constructor(storageService, authService) {
        this.storageService = storageService;
        this.authService = authService;
        this.currentTab = 'practice';
        this.components = {};
        this.tabs = {};
        this.themeService = null;
        this.header = null;
        this.topNav = null;
        this.practiceContent = null;
        this.cloudSyncHandler = null;
        this.isDestroyed = false;
    }

    async render() {
        // Initialize cloud sync
        try {
            this.cloudSyncHandler = new CloudSyncHandler(this.storageService, this.authService);
            await this.cloudSyncHandler.initialize();
        } catch (error) {
            console.warn('Cloud sync initialization failed:', error);
        }

        // Tab titles for header
        const tabTitles = {
            practice: 'Practice',
            repertoire: 'Repertoire',
            goals: 'Goals',
            stats: 'Statistics',
            history: 'History',
            calendar: 'Calendar',
            settings: 'Settings'
        };

        // Create components - header needs theme service
        if (!this.themeService) {
            // Import theme service if not already set
            const { ThemeService } = await import('../services/themeService.js');
            this.themeService = new ThemeService();
        }
        
        this.header = new Header(this.themeService);
        this.topNav = new TopNavigation();
        this.practiceContent = new UnifiedPracticeContent(this.storageService);

        // Initial header setup
        this.header.setCurrentTab(tabTitles[this.currentTab]);

        // Build the new layout
        document.getElementById('app').innerHTML = `
            <div class="dashboard-container">
                <!-- Header -->
                ${this.header.render()}
                
                <!-- Top Navigation -->
                ${this.topNav.render()}
                
                <!-- Main Content Area -->
                <main class="main-content-new">
                    <div class="tab-content" id="tabContent">
                        <!-- Practice Tab -->
                        <div class="tab-pane active" id="practiceTab" data-tab="practice">
                            <div class="practice-page-layout">
                                <!-- Main Practice Content -->
                                <div id="practiceContentContainer" class="practice-main-content">
                                    <!-- Unified practice content will be rendered here -->
                                </div>
                                
                                <!-- Sidebar with Recent Sessions and Stats -->
                                <aside class="practice-sidebar">
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
                                    
                                    <!-- Quick Stats -->
                                    <div class="stats-mini-grid">
                                        <div class="stat-mini">
                                            <div class="stat-value" id="totalPracticeTime">0h 0m</div>
                                            <div class="stat-label">Total Time</div>
                                        </div>
                                        <div class="stat-mini">
                                            <div class="stat-value" id="currentStreak">0</div>
                                            <div class="stat-label">Day Streak</div>
                                        </div>
                                        <div class="stat-mini">
                                            <div class="stat-value" id="sessionsThisWeek">0</div>
                                            <div class="stat-label">This Week</div>
                                        </div>
                                    </div>
                                    
                                    <!-- Practice Tips -->
                                    <div class="practice-tips-widget">
                                        <h4>Today's Tip</h4>
                                        <p id="dailyTip">Focus on playing slowly and accurately before increasing speed.</p>
                                    </div>
                                </aside>
                            </div>
                        </div>
                        
                        <!-- Other tabs -->
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
        `;

        this.attachEventListeners();
        await this.initializeComponents();
        await this.loadDashboardData();
    }

    attachEventListeners() {
        // Header event listeners
        this.header.attachEventListeners();
        
        // Navigation event listeners
        this.topNav.attachEventListeners((tab) => {
            this.switchTab(tab);
        });
        
        // Initialize practice content
        this.initializePracticeContent();
        
        // View all sessions
        document.getElementById('viewAllSessions')?.addEventListener('click', () => {
            this.switchTab('history');
        });
        
        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            this.handleHashChange();
        });
    }

    initializePracticeContent() {
        const container = document.getElementById('practiceContentContainer');
        if (container && this.practiceContent) {
            this.practiceContent.init(container);
            
            // Set up save callback
            this.practiceContent.setOnSaveCallback((sessionData) => {
                // Refresh recent sessions after saving
                this.loadRecentSessions();
                this.loadQuickStats();
                
                // Show success message
                this.header.setStatus('Practice session saved!', 'success');
                setTimeout(() => {
                    this.header.setStatus('All systems go', 'success');
                }, 3000);
            });
        }
    }

    async switchTab(tab) {
        this.currentTab = tab;
        
        // Update URL hash
        window.location.hash = tab;
        
        // Update header
        const tabTitles = {
            practice: 'Practice',
            repertoire: 'Repertoire',
            goals: 'Goals',
            stats: 'Statistics',
            history: 'History',
            calendar: 'Calendar',
            settings: 'Settings'
        };
        this.header.setCurrentTab(tabTitles[tab]);
        
        // Update navigation active state
        this.topNav.setActiveTab(tab);
        
        // Show/hide tab panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.dataset.tab === tab);
        });
        
        // Load tab content if not already loaded
        if (!this.tabs[tab]) {
            await this.loadTabContent(tab);
        }
    }

    async loadTabContent(tab) {
        const tabContainer = document.querySelector(`#${tab}Tab`);
        if (!tabContainer) return;
        
        try {
            switch (tab) {
                case 'repertoire':
                    const { RepertoireTab } = await import('../components/tabs/RepertoireTab.js');
                    this.tabs[tab] = new RepertoireTab(this.storageService);
                    break;
                case 'goals':
                    const { GoalsTab } = await import('../components/tabs/GoalsTab.js');
                    this.tabs[tab] = new GoalsTab(this.storageService);
                    break;
                case 'stats':
                    const { StatsTab } = await import('../components/tabs/StatsTab.js');
                    this.tabs[tab] = new StatsTab(this.storageService);
                    break;
                case 'history':
                    const { HistoryTab } = await import('../components/tabs/HistoryTab.js');
                    this.tabs[tab] = new HistoryTab(this.storageService);
                    break;
                case 'calendar':
                    const { CalendarTab } = await import('../components/tabs/CalendarTab.js');
                    this.tabs[tab] = new CalendarTab(this.storageService);
                    break;
                case 'settings':
                    const { SettingsTab } = await import('../components/tabs/SettingsTab.js');
                    this.tabs[tab] = new SettingsTab(this.storageService, this.authService);
                    if (this.themeService) {
                        this.tabs[tab].setThemeService(this.themeService);
                    }
                    break;
            }
            
            if (this.tabs[tab]) {
                // All tabs use render(container) pattern
                await this.tabs[tab].render(tabContainer);
            }
        } catch (error) {
            console.error(`Failed to load ${tab} tab:`, error);
            tabContainer.innerHTML = `
                <div class="error-state">
                    <p>Failed to load ${tab} content</p>
                    <button class="retry-btn" onclick="location.reload()">Retry</button>
                </div>
            `;
        }
    }

    async initializeComponents() {
        // Initialize footer
        const footerContainer = document.getElementById('appFooter');
        if (footerContainer) {
            const footer = new Footer();
            footerContainer.innerHTML = footer.render();
            footer.attachEventListeners();
        }
        
        // Check initial hash
        this.handleHashChange();
    }

    handleHashChange() {
        const hash = window.location.hash.slice(1);
        if (hash && ['practice', 'repertoire', 'goals', 'stats', 'history', 'calendar', 'settings'].includes(hash)) {
            this.switchTab(hash);
        }
    }

    async loadDashboardData() {
        await Promise.all([
            this.loadRecentSessions(),
            this.loadQuickStats(),
            this.loadDailyTip()
        ]);
    }

    async loadRecentSessions() {
        const container = document.getElementById('recentSessionsList');
        if (!container) return;
        
        try {
            const sessions = await this.storageService.getAllPracticeEntries();
            const recentSessions = sessions.slice(-5).reverse();
            
            if (recentSessions.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>No practice sessions yet. Start your first session!</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = recentSessions.map(session => `
                <div class="recent-session-item">
                    <div class="session-icon">${session.mode === 'metronome' ? '🎵' : session.mode === 'audio' ? '🎵' : '📹'}</div>
                    <div class="session-details">
                        <div class="session-title">${session.title || 'Practice Session'}</div>
                        <div class="session-meta">
                            ${new Date(session.date).toLocaleDateString()} • 
                            ${Math.floor(session.duration / 60)}m ${session.duration % 60}s
                            ${session.tempo ? ` • ${session.tempo} BPM` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to load recent sessions:', error);
            container.innerHTML = '<p class="error-text">Failed to load sessions</p>';
        }
    }

    async loadQuickStats() {
        try {
            const stats = await this.storageService.getStatistics();
            
            // Update stat cards
            document.getElementById('totalPracticeTime').textContent = 
                `${Math.floor(stats.totalMinutes / 60)}h ${stats.totalMinutes % 60}m`;
            document.getElementById('currentStreak').textContent = stats.currentStreak || 0;
            document.getElementById('goalsCompleted').textContent = stats.goalsCompleted || 0;
            document.getElementById('sessionsThisWeek').textContent = stats.sessionsThisWeek || 0;
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }

    loadDailyTip() {
        const tips = [
            "Focus on playing slowly and accurately before increasing speed. Quality over quantity!",
            "Practice with a metronome to improve your timing and rhythm.",
            "Break difficult passages into smaller chunks and master each part.",
            "Record yourself playing to identify areas that need improvement.",
            "Set specific, measurable goals for each practice session.",
            "Warm up with scales and exercises before diving into repertoire.",
            "Take regular breaks to avoid fatigue and maintain focus.",
            "Practice the transitions between sections, not just the sections themselves.",
            "Use a practice journal to track your progress and insights.",
            "Listen to multiple interpretations of pieces you're learning."
        ];
        
        const tipElement = document.getElementById('dailyTip');
        if (tipElement) {
            const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
            tipElement.textContent = tips[dayOfYear % tips.length];
        }
    }

    setThemeService(themeService) {
        this.themeService = themeService;
        if (this.header) {
            this.header.themeService = themeService;
        }
        if (this.tabs.settings) {
            this.tabs.settings.setThemeService(themeService);
        }
    }

    destroy() {
        this.isDestroyed = true;
        
        // Clean up cloud sync
        if (this.cloudSyncHandler) {
            this.cloudSyncHandler.stopPeriodicSync();
        }
        
        // Clean up practice content
        if (this.practiceContent) {
            this.practiceContent.destroy();
        }
        
        // Clean up components
        Object.values(this.tabs).forEach(tab => {
            if (tab.destroy) tab.destroy();
        });
        
        // Remove event listeners
        window.removeEventListener('popstate', this.handleHashChange);
    }
}
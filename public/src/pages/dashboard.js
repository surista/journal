// New Dashboard Page Component with Top Navigation and Unified Practice Content
import { Header } from '../components/header.js';
import { TopNavigation } from '../components/topNavigation.js';
import { Footer } from '../components/footer.js';
// import { CloudSyncHandler } from '../services/cloudSyncHandler.js';

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
        this.cloudSyncHandler = null;
        this.isDestroyed = false;
        this.footer = null;
    }

    async render() {
        // DISABLED: Using firebaseSyncService instead of CloudSyncHandler
        // The new sync is handled automatically by storageService
        // try {
        //     this.cloudSyncHandler = new CloudSyncHandler(this.storageService, this.authService);
        //     await this.cloudSyncHandler.initialize();
        // } catch (error) {
        //     console.warn('Cloud sync initialization failed:', error);
        // }

        // Initialize mobile enhancements
        if (!this.mobileEnhancements) {
            const { mobileEnhancements } = await import('../utils/mobileEnhancements.js');
            this.mobileEnhancements = mobileEnhancements;
            this.mobileEnhancements.initialize();
            this.mobileEnhancements.setCurrentTab(this.currentTab);
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
                            <!-- Practice tab content will be loaded dynamically -->
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

        // Mobile navigation events
        window.addEventListener('mobile-tab-navigate', (e) => {
            this.switchTab(e.detail.tab);
        });

        // Pull to refresh event
        window.addEventListener('pull-refresh', async () => {
            await this.loadDashboardData();
            // Provide haptic feedback
            if (this.mobileEnhancements) {
                this.mobileEnhancements.vibrate();
            }
        });

        // Initialize practice tab
        this.loadTabContent('practice');

        // View all sessions
        document.getElementById('viewAllSessions')?.addEventListener('click', () => {
            this.switchTab('history');
        });

        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            this.handleHashChange();
        });
    }

    // Practice content is now handled by PracticeTabMinimal

    async switchTab(tab) {
        this.currentTab = tab;

        // Update mobile enhancements
        if (this.mobileEnhancements) {
            this.mobileEnhancements.setCurrentTab(tab);
            this.mobileEnhancements.vibrate();
        }

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
        if (!tabContainer) {
            console.error(`Tab container not found for tab: ${tab}`);
            return;
        }

        try {
            switch (tab) {
                case 'practice':
                    console.log('Loading PracticeTab module...');
                    try {
                        const practiceModule = await import('../components/tabs/PracticeTab.js');
                        console.log('PracticeTab module loaded:', practiceModule);
                        const { PracticeTab } = practiceModule;
                        console.log('Creating PracticeTab instance...');
                        this.tabs[tab] = new PracticeTab(this.storageService);
                        console.log('PracticeTab instance created');
                    } catch (innerError) {
                        console.error('Inner error loading practice tab:', innerError);
                        console.error('Inner error message:', innerError.message);
                        console.error('Inner error stack:', innerError.stack);
                        throw innerError;
                    }
                    break;
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
                    this.tabs[tab] = new SettingsTab(this.storageService, this.authService, this.cloudSyncHandler?.cloudSyncService);
                    break;
            }

            if (this.tabs[tab]) {
                // All tabs use render(container) pattern
                await this.tabs[tab].render(tabContainer);
            }
        } catch (error) {
            console.error(`Failed to load ${tab} tab:`, error);
            console.error('Error details:', error.message);
            if (error.stack) {
                console.error('Stack trace:', error.stack);
            }
            // Log the actual error type
            console.error('Error type:', error.constructor.name);
            console.error('Full error object:', error);
            tabContainer.innerHTML = `
                <div class="error-state">
                    <p>Failed to load ${tab} content</p>
                    <p class="error-details">${error.message || 'Unknown error'}</p>
                    <button class="retry-btn" onclick="location.reload()">Retry</button>
                </div>
            `;
        }
    }

    async initializeComponents() {
        // Initialize footer
        const footerContainer = document.getElementById('appFooter');
        if (footerContainer) {
            this.footer = new Footer();
            footerContainer.innerHTML = this.footer.render();
            this.footer.attachEventListeners();
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
        // Dashboard data loading removed - now handled by PracticeTabMinimal
    }
    // Dashboard data, stats and tips are now handled by PracticeTabMinimal

    setThemeService(themeService) {
        this.themeService = themeService;
        if (this.header) {
            this.header.themeService = themeService;
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

        // Clean up footer
        if (this.footer && this.footer.destroy) {
            this.footer.destroy();
        }

        // Clean up components
        Object.values(this.tabs).forEach(tab => {
            if (tab.destroy) tab.destroy();
        });

        // Remove event listeners
        window.removeEventListener('popstate', this.handleHashChange);
    }
}
// PracticeTab Component - Handles the main practice tab
import { TimeUtils } from '../../utils/helpers.js';
import { UnifiedPracticeMinimal } from '../unifiedPracticeMinimal.js';
import { DailyPracticeSuggestion } from '../dailyPracticeSuggestion.js';

export class PracticeTab {
    constructor(storageService) {
        this.storageService = storageService;
        this.container = null;
        this.unifiedPractice = null;
        this.dailySuggestion = null;
    }

    render(container) {
        this.container = container;

        this.container.innerHTML = `
            <div class="practice-page-layout-single">
                <div class="practice-main-content">
                    <!-- Daily Practice Suggestion -->
                    <div id="dailySuggestionContainer"></div>
                    
                    <!-- Unified Practice Component - Full Width -->
                    <div class="practice-container-wrapper">
                        <div id="unifiedPracticeContainer"></div>
                    </div>
                    
                    <!-- Stats at the bottom -->
                    <div class="practice-bottom-widgets">
                        <!-- Quick Stats -->
                        <div class="dashboard-widget compact" style="max-width: 100%;">
                            <h3 class="widget-title">Today's Stats</h3>
                            <div id="quickStats"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
        this.initializeComponents();
        this.loadPracticeData();
    }

    attachEventListeners() {
        // Listen for practice saved events
        document.addEventListener('practiceSaved', async () => {
            await this.loadPracticeData();
        });
    }

    async initializeComponents() {
        try {
            // Initialize daily suggestion
            const suggestionContainer = document.getElementById('dailySuggestionContainer');
            if (suggestionContainer) {
                this.dailySuggestion = new DailyPracticeSuggestion(this.storageService);
                await this.dailySuggestion.init(suggestionContainer);
            }

            // Initialize unified practice component
            const container = document.getElementById('unifiedPracticeContainer');
            if (container) {
                this.unifiedPractice = new UnifiedPracticeMinimal(this.storageService);
                this.unifiedPractice.init(container);

                // Set callback for when sessions are saved
                this.unifiedPractice.setOnSaveCallback(async (sessionData) => {
                    await this.loadPracticeData();
                    
                    // Refresh daily suggestion
                    if (this.dailySuggestion) {
                        await this.dailySuggestion.refresh();
                    }

                    // Update header status if available
                    const dashboard = window.app?.currentPage;
                    if (dashboard?.header) {
                        dashboard.header.updateStatus('Session saved!', 'success');
                    }
                });
            }
        } catch (error) {
            console.error('Error in initializeComponents:', error);
            throw error;
        }
    }

    async loadPracticeData() {
        await this.loadQuickStats();
    }

    async loadQuickStats() {
        try {
            const stats = await this.storageService.calculateStats();
            const todayMinutes = await this.getTodayPracticeTime();

            const container = document.getElementById('quickStats');
            if (!container) return;

            container.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value">${todayMinutes}m</div>
                        <div class="stat-label">Today</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.totalSessions || 0}</div>
                        <div class="stat-label">Sessions</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${stats.currentStreak || 0}</div>
                        <div class="stat-label">Day Streak</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${Math.round((stats.totalSeconds || 0) / 3600)}h</div>
                        <div class="stat-label">Total Time</div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async getTodayPracticeTime() {
        try {
            const entries = await this.storageService.getPracticeEntries();
            const today = new Date().toDateString();
            const todaySessions = entries.filter(entry =>
                new Date(entry.date).toDateString() === today
            );
            const totalSeconds = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
            return Math.round(totalSeconds / 60);
        } catch (error) {
            console.error('Error calculating today practice time:', error);
            return 0;
        }
    }

    onActivate() {
        // Refresh data when tab becomes active
        this.loadPracticeData();
    }

    destroy() {
        if (this.unifiedPractice && typeof this.unifiedPractice.destroy === 'function') {
            this.unifiedPractice.destroy();
        }
        
        if (this.recommendations && typeof this.recommendations.destroy === 'function') {
            this.recommendations.destroy();
        }

        this.unifiedPractice = null;
        this.recommendations = null;
        this.container = null;
    }
}
// PracticeTab Component - Handles the main practice tab
import { TimeUtils } from '../../utils/helpers.js';

export class PracticeTab {
    constructor(storageService) {
        this.storageService = storageService;
        this.container = null;
        this.timer = null;
        this.practiceForm = null;
        this.streakHeatMap = null;
        this.tipInterval = null;
    }

    render(container) {
        this.container = container;

        this.container.innerHTML = `
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
        `;

        this.attachEventListeners();
        this.initializeComponents();
        this.loadPracticeData();
        this.startDailyTipRotation();
    }

    attachEventListeners() {
        // Collapsible log practice section
        const header = this.container.querySelector('.log-practice-header');
        if (header) {
            header.addEventListener('click', () => {
                const section = header.closest('.log-practice-section');
                const icon = header.querySelector('.collapse-icon');
                if (section && icon) {
                    section.classList.toggle('collapsed');
                    icon.textContent = section.classList.contains('collapsed') ? '▶' : '▼';
                }
            });
        }

        // View all sessions
        document.getElementById('viewAllSessions')?.addEventListener('click', () => {
            // Switch to history tab
            window.app?.currentPage?.switchTab('history');
        });

        // Listen for practice saved events
        document.addEventListener('practiceSaved', () => {
            this.loadRecentSessions();
            this.loadQuickStats();
            if (this.streakHeatMap) {
                this.streakHeatMap.loadPracticeData();
            }
        });
    }

    async initializeComponents() {
        // Get shared timer and practice form from dashboard
        const dashboard = window.app?.currentPage;
        if (dashboard) {
            this.timer = dashboard.components?.timer;
            this.practiceForm = dashboard.components?.practiceForm;

            // Move them to this tab
            if (this.timer) {
                const timerContainer = document.getElementById('timerContainer');
                if (timerContainer) {
                    timerContainer.innerHTML = '';
                    this.timer.container = timerContainer;
                    this.timer.init();
                }
            }

            if (this.practiceForm) {
                const formContainer = document.getElementById('practiceFormContainer');
                if (formContainer) {
                    formContainer.innerHTML = '';
                    this.practiceForm.container = formContainer;
                    this.practiceForm.render();
                }
            }
        }

        // Initialize Streak HeatMap
        const streakContainer = document.getElementById('streakCalendar');
        if (streakContainer) {
            try {
                const { StreakHeatMap } = await import('../streakHeatMap.js');
                this.streakHeatMap = new StreakHeatMap(streakContainer, this.storageService);
                this.streakHeatMap.render();
            } catch (error) {
                console.error('Error initializing Streak HeatMap:', error);
                streakContainer.innerHTML = '<div class="empty-state">Calendar unavailable</div>';
            }
        }
    }

    async loadPracticeData() {
        await this.loadRecentSessions();
        await this.loadQuickStats();
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
            const stats = await this.storageService.calculateStats();
            const todayPractice = await this.getTodayPracticeTime();

            const container = document.getElementById('quickStats');
            if (!container) return;

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

        const updateTip = () => {
            const tipElement = document.getElementById('dailyTip');
            if (tipElement) {
                const randomTip = tips[Math.floor(Math.random() * tips.length)];
                tipElement.textContent = randomTip;
            }
        };

        updateTip();
        this.tipInterval = setInterval(updateTip, 30000);
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    onActivate() {
        // Refresh data when tab becomes active
        this.loadPracticeData();
    }

    onDeactivate() {
        // Clear tip rotation interval
        if (this.tipInterval) {
            clearInterval(this.tipInterval);
            this.tipInterval = null;
        }
    }

    destroy() {
        if (this.tipInterval) {
            clearInterval(this.tipInterval);
        }

        if (this.streakHeatMap && typeof this.streakHeatMap.destroy === 'function') {
            this.streakHeatMap.destroy();
        }

        this.streakHeatMap = null;
        this.timer = null;
        this.practiceForm = null;
        this.container = null;
    }
}
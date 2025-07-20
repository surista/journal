// Stats Panel Component
export class StatsPanel {
    constructor(container, storageService) {
        this.container = container;
        this.storageService = storageService;
        this.stats = null;
        this.updateInterval = null;
    }

    render() {
        this.container.innerHTML = `
            <div class="stats-panel">
                <div class="stat-card">
                    <div class="stat-value" id="totalTime">0h 0m</div>
                    <div class="stat-label">Total Practice Time</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="totalSessions">0</div>
                    <div class="stat-label">Practice Sessions</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="currentStreak">0</div>
                    <div class="stat-label">Day Streak</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="avgSession">0m</div>
                    <div class="stat-label">Average Session</div>
                </div>
            </div>
        `;

        this.attachEventListeners();
        this.update();

        // Update stats every minute
        this.updateInterval = setInterval(() => this.update(), 60000);
    }

    attachEventListeners() {
        // Listen for practice session saved events
        window.addEventListener('practiceSessionSaved', () => {
            this.update();
        });

        // Add click handlers for detailed views
        const cards = this.container.querySelectorAll('.stat-card');
        cards.forEach((card, index) => {
            card.addEventListener('click', () => this.showDetailedStats(index));
        });
    }

    async update() {
        try {
            // Get basic stats
            const stats = await this.storageService.getStats();

            // Get practice entries for additional calculations
            const entries = await this.storageService.getPracticeEntries();

            // Calculate average session
            let averageSession = 0;
            if (stats.totalSessions > 0 && stats.totalSeconds > 0) {
                averageSession = Math.floor(stats.totalSeconds / stats.totalSessions);
            }

            // Set the stats with calculated values
            this.stats = {
                totalTime: stats.totalSeconds || 0,
                totalSessions: stats.totalSessions || 0,
                averageSession: averageSession,
                currentStreak: stats.currentStreak || 0,
                longestStreak: stats.longestStreak || 0
            };

            this.updateDisplay();
        } catch (error) {
            console.error('Error updating stats:', error);
            // Set default values on error
            this.stats = {
                totalTime: 0,
                totalSessions: 0,
                averageSession: 0,
                currentStreak: 0,
                longestStreak: 0
            };
            this.updateDisplay();
        }
    }

    updateDisplay() {
        // Ensure stats exist and have valid values
        if (!this.stats) {
            console.error('No stats available for display');
            return;
        }

        // Total practice time
        const totalTimeEl = document.getElementById('totalTime');
        if (totalTimeEl) {
            totalTimeEl.textContent = this.formatDuration(this.stats.totalTime || 0);
        }

        // Total sessions
        const totalSessionsEl = document.getElementById('totalSessions');
        if (totalSessionsEl) {
            totalSessionsEl.textContent = this.stats.totalSessions || 0;
        }

        // Current streak
        const streakElement = document.getElementById('currentStreak');
        if (streakElement) {
            const streak = this.stats.currentStreak || 0;
            streakElement.textContent = streak;

            // Add fire emoji for streaks
            if (streak >= 7) {
                streakElement.innerHTML = `${streak} 🔥`;
            } else if (streak >= 3) {
                streakElement.innerHTML = `${streak} 🌟`;
            }
        }

        // Average session
        const avgSessionEl = document.getElementById('avgSession');
        if (avgSessionEl) {
            avgSessionEl.textContent = this.formatDuration(this.stats.averageSession || 0, true);
        }

        // Add visual indicators
        this.addVisualIndicators();
    }

    addVisualIndicators() {
        // Highlight achievements
        if (this.stats.totalSessions >= 100) {
            const sessionsCard = this.container.querySelector('.stat-card:nth-child(2)');
            sessionsCard.classList.add('achievement');
        }

        if (this.stats.currentStreak >= 7) {
            const streakCard = this.container.querySelector('.stat-card:nth-child(3)');
            streakCard.classList.add('achievement');
        }

        if (this.stats.totalTime >= 36000) { // 10+ hours
            const timeCard = this.container.querySelector('.stat-card:nth-child(1)');
            timeCard.classList.add('achievement');
        }
    }

    async showDetailedStats(statIndex) {
        const modal = document.createElement('div');
        modal.className = 'modal stats-detail-modal';

        let content = '';
        switch (statIndex) {
            case 0: // Total Time
                content = await this.getTimeBreakdown();
                break;
            case 1: // Sessions
                content = await this.getSessionsBreakdown();
                break;
            case 2: // Streak
                content = await this.getStreakBreakdown();
                break;
            case 3: // Average
                content = await this.getAverageBreakdown();
                break;
        }

        modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Detailed Statistics</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">✕</button>
            </div>
            <div class="stats-detail-content">
                ${content}
            </div>
        </div>
    `;

        document.body.appendChild(modal);
        modal.style.display = 'block';

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    async getTimeBreakdown() {
        const entries = await this.storageService.getPracticeEntries();

        // Ensure entries is an array
        if (!Array.isArray(entries)) {
            return '<p>Error loading practice data</p>';
        }

        const last7Days = await this.getLastNDaysStats(7);
        const last30Days = await this.getLastNDaysStats(30);

        // Practice time by area
        const timeByArea = {};
        entries.forEach(entry => {
            if (entry && entry.practiceArea && entry.duration) {
                const area = entry.practiceArea;
                const duration = entry.duration || 0;
                timeByArea[area] = (timeByArea[area] || 0) + duration;
            }
        });

        const sortedAreas = Object.entries(timeByArea)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const totalTime = this.stats?.totalTime || 1; // Prevent division by zero

        return `
        <h4>Practice Time Analysis</h4>
        <div class="stat-breakdown">
            <div class="breakdown-item">
                <span class="breakdown-label">Last 7 days:</span>
                <span class="breakdown-value">${this.formatDuration(last7Days.totalTime)}</span>
            </div>
            <div class="breakdown-item">
                <span class="breakdown-label">Last 30 days:</span>
                <span class="breakdown-value">${this.formatDuration(last30Days.totalTime)}</span>
            </div>
            <div class="breakdown-item">
                <span class="breakdown-label">All time:</span>
                <span class="breakdown-value">${this.formatDuration(this.stats.totalTime || 0)}</span>
            </div>
        </div>
        
        <h4>Top Practice Areas</h4>
        <div class="area-breakdown">
            ${sortedAreas.map(([area, time]) => `
                <div class="area-item">
                    <span class="area-name">${area}</span>
                    <div class="area-bar">
                        <div class="area-progress" style="width: ${(time / totalTime) * 100}%"></div>
                    </div>
                    <span class="area-time">${this.formatDuration(time)}</span>
                </div>
            `).join('')}
        </div>
    `;
    }

    async getSessionsBreakdown() {
        const entries = await this.storageService.getPracticeEntries();

        // Ensure entries is an array
        if (!Array.isArray(entries)) {
            return '<p>Error loading practice data</p>';
        }

        const sessionsByDay = {};

        entries.forEach(entry => {
            const date = new Date(entry.date);
            const dayName = date.toLocaleDateString('en-US', {weekday: 'long'});
            sessionsByDay[dayName] = (sessionsByDay[dayName] || 0) + 1;
        });

        const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const maxSessions = Math.max(...Object.values(sessionsByDay), 1);

        return `
            <h4>Sessions by Day of Week</h4>
            <div class="weekday-chart">
                ${dayOrder.map(day => {
            const count = sessionsByDay[day] || 0;
            const height = (count / maxSessions) * 100;
            return `
                        <div class="weekday-bar">
                            <div class="bar-fill" style="height: ${height}%">
                                <span class="bar-value">${count}</span>
                            </div>
                            <span class="bar-label">${day.substr(0, 3)}</span>
                        </div>
                    `;
        }).join('')}
            </div>
            
            <h4>Session Duration Distribution</h4>
            ${this.getSessionDurationChart(entries)}
        `;
    }

    async getStreakBreakdown() {
        const entries = await this.storageService.getPracticeEntries();
        const streaks = await this.calculateAllStreaks(entries);

        return `
        <h4>Streak History</h4>
        <div class="stat-breakdown">
            <div class="breakdown-item">
                <span class="breakdown-label">Current Streak:</span>
                <span class="breakdown-value">${this.stats.currentStreak || 0} days</span>
            </div>
            <div class="breakdown-item">
                <span class="breakdown-label">Longest Streak:</span>
                <span class="breakdown-value">${this.stats.longestStreak || 0} days</span>
            </div>
            <div class="breakdown-item">
                <span class="breakdown-label">Total Practice Days:</span>
                <span class="breakdown-value">${streaks.totalPracticeDays} days</span>
            </div>
        </div>
        
        <h4>Consistency Score</h4>
        <div class="consistency-meter">
            <div class="meter-fill" style="width: ${streaks.consistencyScore}%"></div>
            <span class="meter-label">${streaks.consistencyScore}%</span>
        </div>
        <p class="consistency-message">${this.getConsistencyMessage(streaks.consistencyScore)}</p>
    `;
    }

    async getAverageBreakdown() {
        const entries = await this.storageService.getPracticeEntries();
        const last7Days = await this.getLastNDaysStats(7);
        const last30Days = await this.getLastNDaysStats(30);

        return `
        <h4>Average Session Analysis</h4>
        <div class="stat-breakdown">
            <div class="breakdown-item">
                <span class="breakdown-label">Last 7 days avg:</span>
                <span class="breakdown-value">${this.formatDuration(last7Days.averageSession, true)}</span>
            </div>
            <div class="breakdown-item">
                <span class="breakdown-label">Last 30 days avg:</span>
                <span class="breakdown-value">${this.formatDuration(last30Days.averageSession, true)}</span>
            </div>
            <div class="breakdown-item">
                <span class="breakdown-label">All time avg:</span>
                <span class="breakdown-value">${this.formatDuration(this.stats.averageSession || 0, true)}</span>
            </div>
        </div>
        
        <h4>Recommended Session Length</h4>
        <p class="recommendation">
            ${this.getSessionRecommendation()}
        </p>
    `;
    }

    async getLastNDaysStats(days) {
        const entries = await this.storageService.getPracticeEntries();

        // Ensure entries is an array
        if (!Array.isArray(entries)) {
            return {
                totalTime: 0,
                totalSessions: 0,
                averageSession: 0
            };
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const recentEntries = entries.filter(entry =>
            new Date(entry.date) >= cutoffDate
        );

        const totalTime = recentEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
        const averageSession = recentEntries.length > 0 ?
            Math.floor(totalTime / recentEntries.length) : 0;

        return {
            totalTime,
            totalSessions: recentEntries.length,
            averageSession
        };
    }

    getSessionDurationChart(entries) {
        const ranges = {
            '0-15 min': 0,
            '15-30 min': 0,
            '30-45 min': 0,
            '45-60 min': 0,
            '60+ min': 0
        };

        entries.forEach(entry => {
            const minutes = Math.floor((entry.duration || 0) / 60);
            if (minutes < 15) ranges['0-15 min']++;
            else if (minutes < 30) ranges['15-30 min']++;
            else if (minutes < 45) ranges['30-45 min']++;
            else if (minutes < 60) ranges['45-60 min']++;
            else ranges['60+ min']++;
        });

        const maxCount = Math.max(...Object.values(ranges), 1);

        return `
            <div class="duration-chart">
                ${Object.entries(ranges).map(([range, count]) => `
                    <div class="duration-bar">
                        <span class="duration-label">${range}</span>
                        <div class="bar-container">
                            <div class="bar-fill" style="width: ${(count / maxCount) * 100}%">
                                <span class="bar-count">${count}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async calculateAllStreaks(entries) {
        // Ensure entries is an array
        if (!Array.isArray(entries)) {
            entries = await this.storageService.getPracticeEntries();
        }

        if (!Array.isArray(entries) || entries.length === 0) {
            return {
                totalPracticeDays: 0,
                consistencyScore: 0
            };
        }

        // Get unique practice days
        const practiceDays = new Set();
        entries.forEach(entry => {
            if (entry && entry.date) {
                const date = new Date(entry.date);
                const dateStr = date.toISOString().split('T')[0];
                practiceDays.add(dateStr);
            }
        });

        // Calculate consistency score
        const sortedEntries = entries.filter(e => e && e.date).sort((a, b) => new Date(a.date) - new Date(b.date));
        if (sortedEntries.length === 0) {
            return {
                totalPracticeDays: 0,
                consistencyScore: 0
            };
        }

        const firstEntry = new Date(sortedEntries[0].date);
        const today = new Date();
        const totalDays = Math.floor((today - firstEntry) / (1000 * 60 * 60 * 24)) + 1;
        const consistencyScore = totalDays > 0 ? Math.round((practiceDays.size / totalDays) * 100) : 0;

        return {
            totalPracticeDays: practiceDays.size,
            consistencyScore: Math.min(consistencyScore, 100)
        };
    }

    getConsistencyMessage(score) {
        if (score >= 90) return "Outstanding consistency! You're a practice champion! 🏆";
        if (score >= 70) return "Great consistency! Keep up the excellent work! 🌟";
        if (score >= 50) return "Good progress! Try to practice more regularly. 💪";
        if (score >= 30) return "Room for improvement. Set a daily reminder! 📅";
        return "Just getting started? Build the habit one day at a time! 🎸";
    }

    getSessionRecommendation() {
        const avg = Math.floor((this.stats.averageSession || 0) / 60);

        if (avg < 15) {
            return "Your sessions are quite short. Try to aim for at least 20-30 minutes to see better progress. Quality over quantity!";
        } else if (avg < 30) {
            return "Good session length! This is ideal for focused practice. Consider adding 5-10 minutes for warm-up.";
        } else if (avg < 60) {
            return "Excellent session length! You're in the sweet spot for productive practice. Keep it up!";
        } else {
            return "Long practice sessions! Make sure to take breaks every 25-30 minutes to avoid fatigue and maintain focus.";
        }
    }

    formatDuration(seconds, short = false) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (short && hours === 0) {
            return `${minutes}m`;
        }

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        window.removeEventListener('practiceSessionSaved', this.update);
    }
}
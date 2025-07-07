// Streak Heat Map Component
export class StreakHeatMap {
    constructor(container, storageService) {
        this.container = container;
        this.storageService = storageService;
        this.currentYear = new Date().getFullYear();
    }

    async render() {
        try {
            const entries = await this.storageService.getPracticeEntries();

            // Validate entries is an array
            if (!Array.isArray(entries)) {
                console.warn('getPracticeEntries did not return an array:', entries);
                this.renderEmpty();
                return;
            }

            const practiceData = this.processPracticeData(entries);

            this.container.innerHTML = `
                <div class="streak-heatmap">
                    <h3>Practice Activity</h3>
                    <div class="heatmap-container">
                        <div class="heatmap-controls">
                            <button class="btn btn-small" id="prevYear">◀</button>
                            <span class="year-display">${this.currentYear}</span>
                            <button class="btn btn-small" id="nextYear">▶</button>
                        </div>
                        <div class="heatmap-legend">
                            <span>Less</span>
                            <div class="legend-scale">
                                <div class="legend-box" data-level="0"></div>
                                <div class="legend-box" data-level="1"></div>
                                <div class="legend-box" data-level="2"></div>
                                <div class="legend-box" data-level="3"></div>
                                <div class="legend-box" data-level="4"></div>
                            </div>
                            <span>More</span>
                        </div>
                        <div class="heatmap-wrapper">
                            <div class="heatmap-months">
                                ${this.renderMonthLabels()}
                            </div>
                            <div class="heatmap-grid">
                                <div class="weekday-labels">
                                    <div>Sun</div>
                                    <div>Mon</div>
                                    <div>Tue</div>
                                    <div>Wed</div>
                                    <div>Thu</div>
                                    <div>Fri</div>
                                    <div>Sat</div>
                                </div>
                                <div class="heatmap-calendar-container">
                                    <div class="heatmap-calendar">
                                        ${this.renderHeatMap(practiceData)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="heatmap-stats">
                            <div class="stat">
                                <strong>${this.getTotalDays(practiceData)}</strong> days practiced this year
                            </div>
                            <div class="stat">
                                <strong>${await this.getLongestStreak(entries)}</strong> day longest streak
                            </div>
                        </div>
                    </div>
                </div>
            `;

            this.attachEventListeners();
        } catch (error) {
            console.error('Error rendering streak heatmap:', error);
            this.renderEmpty();
        }
    }

    renderEmpty() {
        this.container.innerHTML = `
            <div class="streak-heatmap">
                <h3>Practice Activity</h3>
                <div class="heatmap-container">
                    <p style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                        No practice data available yet. Start practicing to see your activity!
                    </p>
                </div>
            </div>
        `;
    }

    processPracticeData(entries) {
        const data = {};

        if (!Array.isArray(entries)) {
            return data;
        }

        entries.forEach(entry => {
            if (entry && entry.date) {
                const date = new Date(entry.date);
                if (date.getFullYear() === this.currentYear) {
                    const dateStr = date.toISOString().split('T')[0];
                    if (!data[dateStr]) {
                        data[dateStr] = {
                            count: 0,
                            totalMinutes: 0
                        };
                    }
                    data[dateStr].count++;
                    data[dateStr].totalMinutes += Math.floor((entry.duration || 0) / 60);
                }
            }
        });

        return data;
    }

    renderMonthLabels() {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Calculate approximate positions for month labels based on days
        const monthPositions = [];
        let dayCount = 0;

        for (let month = 0; month < 12; month++) {
            const daysInMonth = new Date(this.currentYear, month + 1, 0).getDate();
            const startDay = dayCount;
            const midPoint = startDay + (daysInMonth / 2);

            // Calculate week position (53 weeks total)
            const weekPosition = Math.floor((midPoint / 365) * 53);
            monthPositions.push({
                label: months[month],
                position: weekPosition
            });

            dayCount += daysInMonth;
        }

        // Create month labels with proper spacing
        let html = '';
        let lastPosition = -1;

        monthPositions.forEach((month, index) => {
            // Add spacers between months
            const spacerCount = month.position - lastPosition - 1;
            for (let i = 0; i < spacerCount; i++) {
                html += '<span class="month-spacer"></span>';
            }
            html += `<span class="month-label">${month.label}</span>`;
            lastPosition = month.position;
        });

        return html;
    }

    renderHeatMap(practiceData) {
        const startDate = new Date(this.currentYear, 0, 1);
        const endDate = new Date(this.currentYear, 11, 31);
        const days = [];

        // Add empty cells for days before the first Sunday
        const firstDayOfWeek = startDate.getDay();
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push('<div class="heatmap-day empty"></div>');
        }

        // Add all days of the year
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayData = practiceData[dateStr];
            const level = this.getActivityLevel(dayData);
            const tooltip = this.getTooltip(currentDate, dayData);

            days.push(`
                <div class="heatmap-day" 
                     data-level="${level}" 
                     data-date="${dateStr}"
                     title="${tooltip}">
                </div>
            `);

            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Add empty cells at the end to complete the last week
        const lastDayOfWeek = endDate.getDay();
        if (lastDayOfWeek < 6) {
            for (let i = lastDayOfWeek + 1; i <= 6; i++) {
                days.push('<div class="heatmap-day empty"></div>');
            }
        }

        return days.join('');
    }

    getActivityLevel(dayData) {
        if (!dayData) return 0;

        const minutes = dayData.totalMinutes;
        if (minutes >= 60) return 4;
        if (minutes >= 45) return 3;
        if (minutes >= 30) return 2;
        if (minutes >= 15) return 1;
        return 1;
    }

    getTooltip(date, dayData) {
        const dateStr = date.toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'});
        if (!dayData) {
            return `${dateStr}: No practice`;
        }
        const sessions = dayData.count === 1 ? 'session' : 'sessions';
        return `${dateStr}: ${dayData.count} ${sessions}, ${dayData.totalMinutes} minutes`;
    }

    getTotalDays(practiceData) {
        return Object.keys(practiceData).length;
    }

    async getLongestStreak(entries) {
        try {
            // Use getStats() instead of calculateStats()
            const stats = await this.storageService.getStats();
            return stats.longestStreak || 0;
        } catch (error) {
            console.error('Error getting longest streak:', error);
            return 0;
        }
    }

    attachEventListeners() {
        const prevBtn = document.getElementById('prevYear');
        const nextBtn = document.getElementById('nextYear');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentYear--;
                this.render();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.currentYear < new Date().getFullYear()) {
                    this.currentYear++;
                    this.render();
                }
            });
        }
    }

    destroy() {
        // Clean up any event listeners or resources
        this.container.innerHTML = '';
    }
}
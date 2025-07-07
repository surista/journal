// Calendar Page Component
import { TimeUtils } from '../utils/helpers.js';

export class CalendarPage {
    constructor(storageService) {
        this.storageService = storageService;
        this.currentDate = new Date();
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();
        this.practiceData = [];
        this.dailyGoals = [];
        this.practiceAreas = [
            'Scales',
            'Chords',
            'Arpeggios',
            'Songs',
            'Technique',
            'Theory',
            'Improvisation',
            'Sight Reading',
            'Ear Training',
            'Rhythm'
        ];
    }

    async init(container = null) {
        this.render(container);
        this.attachEventListeners();
        await this.loadPracticeData();
    }

    getMonthName(monthIndex) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[monthIndex];
    }

    render(container = null) {
        const targetContainer = container || document.getElementById('app');

        targetContainer.innerHTML = `
            <div class="calendar-page">
                <div class="calendar-header">
                    <button class="btn btn-secondary back-btn" id="backBtn">
                        ← Back to Dashboard
                    </button>
                    <h1>Practice Calendar</h1>
                    <div class="calendar-actions">
                        <button class="btn btn-primary" id="addGoalBtn">
                            <i class="icon">🎯</i> Set Daily Goals
                        </button>
                    </div>
                </div>

                <div class="calendar-container">
                    <div class="calendar-navigation">
                        <button class="nav-btn" id="prevMonthBtn">
                            <i class="icon">◀</i>
                        </button>
                        <h2 id="currentMonth">${this.getMonthName(this.currentMonth)} ${this.currentYear}</h2>
                        <button class="nav-btn" id="nextMonthBtn">
                            <i class="icon">▶</i>
                        </button>
                    </div>

                    <div class="calendar-grid" id="calendarGrid">
                        <!-- Calendar days will be generated here -->
                    </div>

                    <div class="calendar-legend">
                        <span class="legend-item">
                            <span class="legend-box" style="background: var(--success-light);"></span>
                            Practiced
                        </span>
                        <span class="legend-item">
                            <span class="legend-box" style="background: var(--primary-light);"></span>
                            Goal Met
                        </span>
                        <span class="legend-item">
                            <span class="legend-box" style="background: var(--warning-light);"></span>
                            Partial Goal
                        </span>
                    </div>
                </div>

                <div class="calendar-stats">
                    <div class="stat-card">
                        <h3>This Month</h3>
                        <div class="stat-value" id="monthPracticeDays">0 days</div>
                        <div class="stat-label">practiced</div>
                        <div class="stat-value" id="monthTotalTime">0h 0m</div>
                        <div class="stat-label">total time</div>
                    </div>
                    <div class="stat-card">
                        <h3>All Time</h3>
                        <div class="stat-value" id="totalPracticeDays">0 days</div>
                        <div class="stat-label">practiced</div>
                        <div class="stat-value" id="totalPracticeTime">0h 0m</div>
                        <div class="stat-label">total time</div>
                        <div class="stat-value" id="longestStreak">0 days</div>
                        <div class="stat-label">longest streak</div>
                    </div>
                </div>

                <div class="streak-display" id="streakDisplay">
                    <!-- Streak badges will be displayed here -->
                </div>
            </div>

            <!-- Day Detail Modal -->
            <div class="modal" id="dayDetailModal">
                <div class="modal-content">
                    <span class="close-btn" id="closeModalBtn">&times;</span>
                    <h3 id="modalDate"></h3>
                    <div id="modalContent"></div>
                </div>
            </div>

            <!-- Goal Setting Modal -->
            <div class="modal" id="goalModal">
                <div class="modal-content">
                    <span class="close-btn" id="closeGoalModalBtn">&times;</span>
                    <h3>Set Daily Practice Goals</h3>
                    <div id="goalForm">
                        <div class="goal-inputs" id="goalInputs">
                            <!-- Goal inputs will be generated here -->
                        </div>
                        <button class="btn btn-secondary" id="addGoalAreaBtn">
                            <i class="icon">➕</i> Add Practice Area
                        </button>
                        <div class="modal-actions">
                            <button class="btn btn-primary" id="saveGoalsBtn">Save Goals</button>
                            <button class="btn btn-secondary" id="cancelGoalsBtn">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Render calendar days after setting HTML
        this.renderCalendarDays();
        this.updateStreakDisplay();
    }

    renderCalendarDays() {
        const grid = document.getElementById('calendarGrid');
        if (!grid) return;

        // Clear existing days
        grid.innerHTML = '';

        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-day-header';
            header.textContent = day;
            grid.appendChild(header);
        });

        // Get first day of month and number of days
        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            grid.appendChild(emptyDay);
        }

        // Add days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            const dateStr = `${this.currentYear}-${(this.currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            dayElement.dataset.date = dateStr;

            // Check if today
            const today = new Date();
            if (day === today.getDate() &&
                this.currentMonth === today.getMonth() &&
                this.currentYear === today.getFullYear()) {
                dayElement.classList.add('today');
            }

            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;
            dayElement.appendChild(dayNumber);

            // Add practice indicators if data exists
            const practiceInfo = this.getPracticeInfoForDate(dateStr);
            if (practiceInfo.practiced) {
                dayElement.classList.add('practiced');

                // Add time indicator
                const timeIndicator = document.createElement('div');
                timeIndicator.className = 'time-indicator';
                timeIndicator.textContent = this.formatShortDuration(practiceInfo.totalTime);
                dayElement.appendChild(timeIndicator);

                // Add goal quadrants
                if (this.dailyGoals.length > 0 && practiceInfo.areas) {
                    const quadrants = document.createElement('div');
                    quadrants.className = 'goal-quadrants';

                    this.dailyGoals.slice(0, 4).forEach(goal => {
                        const quadrant = document.createElement('div');
                        quadrant.className = 'goal-quadrant';

                        const areaTime = practiceInfo.areas[goal.area] || 0;
                        const percentage = Math.min((areaTime / (goal.minutes * 60)) * 100, 100);

                        if (percentage >= 100) {
                            quadrant.classList.add('complete');
                        } else if (percentage > 0) {
                            quadrant.classList.add('partial');
                            quadrant.style.background = `linear-gradient(to top, var(--primary-light) ${percentage}%, transparent ${percentage}%)`;
                        }

                        quadrants.appendChild(quadrant);
                    });

                    dayElement.appendChild(quadrants);
                }
            }

            // Add click handler
            dayElement.addEventListener('click', () => this.showDayDetail(dateStr));

            grid.appendChild(dayElement);
        }
    }

    attachEventListeners() {
        // Back button - handle embedded context
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            // Hide back button if embedded in dashboard
            const isEmbedded = !document.getElementById('app').contains(backBtn);
            if (isEmbedded) {
                backBtn.style.display = 'none';
            } else {
                backBtn.addEventListener('click', () => this.navigateBack());
            }
        }

        // Month navigation
        document.getElementById('prevMonthBtn')?.addEventListener('click', () => {
            this.currentMonth--;
            if (this.currentMonth < 0) {
                this.currentMonth = 11;
                this.currentYear--;
            }
            this.updateCalendar();
        });

        document.getElementById('nextMonthBtn')?.addEventListener('click', () => {
            this.currentMonth++;
            if (this.currentMonth > 11) {
                this.currentMonth = 0;
                this.currentYear++;
            }
            this.updateCalendar();
        });

        // Goal setting
        document.getElementById('addGoalBtn')?.addEventListener('click', () => this.showGoalModal());
        document.getElementById('addGoalAreaBtn')?.addEventListener('click', () => this.addGoalInput());
        document.getElementById('saveGoalsBtn')?.addEventListener('click', () => this.saveGoals());
        document.getElementById('cancelGoalsBtn')?.addEventListener('click', () => this.hideGoalModal());
        document.getElementById('closeGoalModalBtn')?.addEventListener('click', () => this.hideGoalModal());

        // Modal close
        document.getElementById('closeModalBtn')?.addEventListener('click', () => this.hideDayModal());

        // Click outside modals to close
        window.addEventListener('click', (e) => {
            const dayModal = document.getElementById('dayDetailModal');
            const goalModal = document.getElementById('goalModal');
            if (e.target === dayModal) this.hideDayModal();
            if (e.target === goalModal) this.hideGoalModal();
        });
    }

    async loadPracticeData() {
        try {
            // Load practice entries
            this.practiceData = await this.storageService.getPracticeEntries();

            // Load daily goals
            const goals = await this.storageService.getGoals();
            this.dailyGoals = goals.filter(g => g.type === 'daily');

            // Update display
            this.updateCalendar();
            this.updateStats();
        } catch (error) {
            console.error('Error loading practice data:', error);
        }
    }

    updateCalendar() {
        // Update month display
        const monthDisplay = document.getElementById('currentMonth');
        if (monthDisplay) {
            monthDisplay.textContent = `${this.getMonthName(this.currentMonth)} ${this.currentYear}`;
        }

        // Re-render calendar days
        this.renderCalendarDays();

        // Update stats
        this.updateStats();
    }

    updateStats() {
        // Calculate stats for current month
        const monthStart = new Date(this.currentYear, this.currentMonth, 1);
        const monthEnd = new Date(this.currentYear, this.currentMonth + 1, 0);

        let monthDays = 0;
        let monthTime = 0;
        let allTimeDays = new Set();
        let allTimeTotal = 0;

        this.practiceData.forEach(session => {
            const sessionDate = new Date(session.date);
            const dateStr = sessionDate.toISOString().split('T')[0];

            // All time stats
            allTimeDays.add(dateStr);
            allTimeTotal += session.duration || 0;

            // Current month stats
            if (sessionDate >= monthStart && sessionDate <= monthEnd) {
                monthTime += session.duration || 0;
            }
        });

        // Count unique days in current month
        const monthDaysSet = new Set();
        this.practiceData.forEach(session => {
            const sessionDate = new Date(session.date);
            if (sessionDate >= monthStart && sessionDate <= monthEnd) {
                monthDaysSet.add(sessionDate.toISOString().split('T')[0]);
            }
        });
        monthDays = monthDaysSet.size;

        // Update display
        document.getElementById('monthPracticeDays').textContent = `${monthDays} days`;
        document.getElementById('monthTotalTime').textContent = this.formatDuration(monthTime);
        document.getElementById('totalPracticeDays').textContent = `${allTimeDays.size} days`;
        document.getElementById('totalPracticeTime').textContent = this.formatDuration(allTimeTotal);

        // Calculate longest streak
        const streak = this.calculateLongestStreak();
        document.getElementById('longestStreak').textContent = `${streak} days`;
    }

    calculateLongestStreak() {
        if (this.practiceData.length === 0) return 0;

        // Get unique practice dates
        const practiceDates = new Set();
        this.practiceData.forEach(session => {
            const date = new Date(session.date).toISOString().split('T')[0];
            practiceDates.add(date);
        });

        // Convert to sorted array
        const sortedDates = Array.from(practiceDates).sort();

        let maxStreak = 1;
        let currentStreak = 1;

        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(sortedDates[i - 1]);
            const currDate = new Date(sortedDates[i]);
            const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);

            if (dayDiff === 1) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 1;
            }
        }

        return maxStreak;
    }

    updateStreakDisplay() {
        const container = document.getElementById('streakDisplay');
        if (!container) return;

        const currentStreak = this.calculateCurrentStreak();
        const badges = this.getStreakBadges(currentStreak);

        container.innerHTML = `
            <h3>Current Streak: ${currentStreak} days</h3>
            <div class="badges">
                ${badges.map(badge => `
                    <div class="badge ${badge.earned ? 'earned' : 'unearned'}">
                        <span class="badge-icon">${badge.icon}</span>
                        <span class="badge-label">${badge.label}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    calculateCurrentStreak() {
        if (this.practiceData.length === 0) return 0;

        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        // Check if practiced today or yesterday
        const practiceDates = new Set();
        this.practiceData.forEach(session => {
            const date = new Date(session.date).toISOString().split('T')[0];
            practiceDates.add(date);
        });

        if (!practiceDates.has(today) && !practiceDates.has(yesterday)) {
            return 0;
        }

        // Count backwards from today or yesterday
        let streak = 0;
        let checkDate = practiceDates.has(today) ? new Date() : new Date(Date.now() - 86400000);

        while (true) {
            const dateStr = checkDate.toISOString().split('T')[0];
            if (practiceDates.has(dateStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }

    getStreakBadges(currentStreak) {
        const badges = [
            { days: 5, icon: '🔥', label: '5 Day Streak' },
            { days: 10, icon: '⚡', label: '10 Day Streak' },
            { days: 15, icon: '💎', label: '15 Day Streak' },
            { days: 30, icon: '🏆', label: '30 Day Streak' },
            { days: 60, icon: '👑', label: '60 Day Streak' },
            { days: 90, icon: '🌟', label: '90 Day Streak' }
        ];

        return badges.map(badge => ({
            ...badge,
            earned: currentStreak >= badge.days
        }));
    }

    getPracticeInfoForDate(dateStr) {
        const sessions = this.practiceData.filter(session => {
            const sessionDate = new Date(session.date).toISOString().split('T')[0];
            return sessionDate === dateStr;
        });

        if (sessions.length === 0) {
            return { practiced: false };
        }

        const totalTime = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
        const areas = {};

        sessions.forEach(session => {
            if (session.practiceArea) {
                areas[session.practiceArea] = (areas[session.practiceArea] || 0) + (session.duration || 0);
            }
        });

        return {
            practiced: true,
            totalTime,
            areas,
            sessions
        };
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }

    formatShortDuration(seconds) {
        const totalMinutes = Math.floor(seconds / 60);
        if (totalMinutes < 60) {
            return `${totalMinutes}m`;
        }
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`;
    }

    showDayDetail(dateStr) {
        const modal = document.getElementById('dayDetailModal');
        const modalDate = document.getElementById('modalDate');
        const modalContent = document.getElementById('modalContent');

        const date = new Date(dateStr + 'T00:00:00');
        modalDate.textContent = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const practiceInfo = this.getPracticeInfoForDate(dateStr);

        if (!practiceInfo.practiced) {
            modalContent.innerHTML = '<p class="empty-state">No practice recorded for this day</p>';
        } else {
            const sessionsHTML = practiceInfo.sessions.map(session => `
                <div class="session-detail">
                    <div class="session-header">
                        <span class="session-area">${session.practiceArea || 'General Practice'}</span>
                        <span class="session-duration">${this.formatDuration(session.duration || 0)}</span>
                    </div>
                    ${session.bpm ? `<div class="session-info">Tempo: ${session.bpm} BPM</div>` : ''}
                    ${session.key ? `<div class="session-info">Key: ${session.key}</div>` : ''}
                    ${session.notes ? `<div class="session-notes">${session.notes}</div>` : ''}
                </div>
            `).join('');

            modalContent.innerHTML = `
                <div class="day-summary">
                    <div class="summary-stat">
                        <span class="stat-label">Total Practice Time:</span>
                        <span class="stat-value">${this.formatDuration(practiceInfo.totalTime)}</span>
                    </div>
                    <div class="summary-stat">
                        <span class="stat-label">Sessions:</span>
                        <span class="stat-value">${practiceInfo.sessions.length}</span>
                    </div>
                </div>
                <h4>Sessions</h4>
                ${sessionsHTML}
            `;
        }

        modal.style.display = 'block';
    }

    hideDayModal() {
        document.getElementById('dayDetailModal').style.display = 'none';
    }

    showGoalModal() {
        const modal = document.getElementById('goalModal');
        const container = document.getElementById('goalInputs');

        // Clear existing inputs
        container.innerHTML = '';

        // Add inputs for existing goals or default
        if (this.dailyGoals.length > 0) {
            this.dailyGoals.forEach(goal => this.addGoalInput(goal));
        } else {
            this.addGoalInput();
        }

        modal.style.display = 'block';
    }

    hideGoalModal() {
        document.getElementById('goalModal').style.display = 'none';
    }

    addGoalInput(existingGoal = null) {
        const container = document.getElementById('goalInputs');
        const goalDiv = document.createElement('div');
        goalDiv.className = 'goal-input-row';

        const areaSelect = document.createElement('select');
        areaSelect.className = 'goal-area-select';

        // Add placeholder option
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Select practice area';
        areaSelect.appendChild(placeholder);

        // Add practice areas
        this.practiceAreas.forEach(area => {
            const option = document.createElement('option');
            option.value = area;
            option.textContent = area;
            if (existingGoal && existingGoal.area === area) {
                option.selected = true;
            }
            areaSelect.appendChild(option);
        });

        const minutesInput = document.createElement('input');
        minutesInput.type = 'number';
        minutesInput.className = 'goal-minutes-input';
        minutesInput.placeholder = 'Minutes';
        minutesInput.min = '1';
        minutesInput.max = '180';
        if (existingGoal) {
            minutesInput.value = existingGoal.minutes;
        }

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-sm btn-danger';
        removeBtn.innerHTML = '✕';
        removeBtn.onclick = () => goalDiv.remove();

        goalDiv.appendChild(areaSelect);
        goalDiv.appendChild(minutesInput);
        goalDiv.appendChild(removeBtn);
        container.appendChild(goalDiv);
    }

    async saveGoals() {
        const goalRows = document.querySelectorAll('.goal-input-row');
        const newGoals = [];

        goalRows.forEach(row => {
            const area = row.querySelector('.goal-area-select').value;
            const minutes = parseInt(row.querySelector('.goal-minutes-input').value);

            if (area && minutes > 0) {
                newGoals.push({
                    id: Date.now() + Math.random(),
                    type: 'daily',
                    area,
                    minutes,
                    createdAt: new Date().toISOString()
                });
            }
        });

        // Remove old daily goals and add new ones
        const otherGoals = (await this.storageService.getGoals()).filter(g => g.type !== 'daily');
        const allGoals = [...otherGoals, ...newGoals];

        await this.storageService.saveGoals(allGoals);
        this.dailyGoals = newGoals;

        this.hideGoalModal();
        this.renderCalendarDays();
        this.showNotification('Daily goals saved successfully', 'success');
    }

    showNotification(message, type = 'info') {
        // Try to use dashboard's notification system if available
        if (window.app?.currentPage?.showNotification) {
            window.app.currentPage.showNotification(message, type);
        } else {
            // Simple fallback
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 24px;
                background: var(--bg-card);
                border: 1px solid var(--border);
                border-radius: 8px;
                z-index: 9999;
            `;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        }
    }

    navigateBack() {
        // Try multiple navigation strategies
        if (window.app && window.app.loadDashboardPage) {
            window.app.loadDashboardPage();
        } else if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = './index.html';
        }
    }

    destroy() {
        // Clean up event listeners and resources
        window.removeEventListener('click', this.windowClickHandler);
    }
}
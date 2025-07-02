// Calendar Page - Updated with all-time statistics
export class CalendarPage {
    constructor(storageService, authService) {
        this.storageService = storageService;
        this.authService = authService;
        this.currentDate = new Date();
        this.practiceAreaGoals = [];
        this.container = null;
    }

    async init() {
        console.log('Calendar page initializing...');
        this.render();
        console.log('Calendar page rendered');
        this.attachEventListeners();
        console.log('Event listeners attached');
        this.loadPracticeAreaGoals();
        console.log('Practice goals loaded');

        // Add a small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));

        await this.renderCalendar();
        console.log('Calendar rendered');
        await this.updateStats();
        console.log('Stats updated');
    }

    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="calendar-page">
                <header class="main-header">
                    <div class="header-content">
                        <h1>📅 Practice Calendar</h1>
                        <p class="subtitle">Visualize your practice journey</p>
                    </div>
                    <div class="user-info">
                        <span>👤 ${this.authService.getCurrentUser().email}</span>
                        <button class="btn btn-danger btn-small" id="logoutBtn">Logout</button>
                    </div>
                </header>

                <nav class="main-nav">
                    <button class="btn btn-primary" id="backToDashboardBtn">← Back to Dashboard</button>
                </nav>

                <main class="calendar-content">
                    <!-- Practice Area Goals -->
                    <section class="goals-section">
                        <h2>Daily Practice Goals</h2>
                        <p class="text-secondary">Set up to 4 practice areas with time goals. Complete all 4 to fill the day!</p>
                        <div class="practice-area-goals" id="practiceAreaGoals"></div>
                    </section>

                    <!-- Calendar View -->
                    <section class="calendar-section">
                        <div class="calendar-controls">
                            <button class="btn btn-primary" id="prevMonth">◀</button>
                            <h3 id="calendarMonth">Loading...</h3>
                            <button class="btn btn-primary" id="nextMonth">▶</button>
                        </div>
                        <div id="calendar" class="calendar-grid">
                            <!-- Calendar will be rendered here -->
                            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-secondary);">
                                Initializing calendar...
                            </div>
                        </div>
                        <div class="streak-badges" id="streakBadges"></div>
                    </section>

                    <!-- Calendar Stats - Updated with all-time stats -->
                    <section class="calendar-stats-extended">
                        <div class="stats-row">
                            <h3>This Month</h3>
                            <div class="stats-group">
                                <div class="stat-card">
                                    <div class="stat-value" id="monthPracticeDays">0</div>
                                    <div class="stat-label">Days Practiced</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value" id="monthTotalTime">0h 0m</div>
                                    <div class="stat-label">Total Time</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="stats-row">
                            <h3>All Time</h3>
                            <div class="stats-group">
                                <div class="stat-card">
                                    <div class="stat-value" id="allTimePracticeDays">0</div>
                                    <div class="stat-label">Total Days</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value" id="allTimeTotalTime">0h 0m</div>
                                    <div class="stat-label">Total Time</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-value" id="longestStreak">0</div>
                                    <div class="stat-label">Longest Streak</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- Practice History -->
                    <section class="calendar-history">
                        <h2>Practice History</h2>
                        <div id="calendarEntries"></div>
                    </section>
                </main>
            </div>

            <!-- Practice Day Modal -->
            <div id="practiceDayModal" class="modal practice-day-modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="practiceDayTitle">Practice Sessions</h3>
                        <button class="modal-close" onclick="this.closest('.modal').style.display='none'">✕</button>
                    </div>
                    <div class="practice-day-summary" id="practiceDaySummary"></div>
                    <div class="practice-day-sessions" id="practiceDaySessions"></div>
                </div>
            </div>

            <style>
                .calendar-stats-extended {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                    margin-bottom: 2rem;
                }

                .stats-row {
                    background: var(--bg-card);
                    border-radius: var(--radius-xl);
                    padding: var(--space-xl);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                    border: 1px solid var(--border);
                }

                .stats-row h3 {
                    text-align: center;
                    margin-bottom: 1.5rem;
                    color: var(--text-primary);
                    font-size: 1.25rem;
                }

                .stats-group {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: var(--space-lg);
                }

                .stats-row .stat-card {
                    background: var(--bg-input);
                    padding: var(--space-lg);
                    border-radius: var(--radius-lg);
                    text-align: center;
                    transition: all var(--transition-base);
                    border: 1px solid var(--border);
                }

                .stats-row .stat-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                    border-color: var(--primary);
                }

                @media (max-width: 768px) {
                    .stats-group {
                        grid-template-columns: 1fr;
                    }
                    
                    .calendar-stats-extended {
                        gap: 1rem;
                    }
                }
            </style>
        `;

        this.container = app.querySelector('.calendar-page');
    }

    loadPracticeAreaGoals() {
        if (!this.storageService) {
            console.error('Storage service not available');
            this.practiceAreaGoals = [];
            return;
        }

        this.practiceAreaGoals = this.storageService.getPracticeAreaGoals() || [];
        this.renderPracticeAreaGoals();
    }

    renderPracticeAreaGoals() {
        const container = document.getElementById('practiceAreaGoals');
        if (!container) return;

        container.innerHTML = '';

        // Render existing goals
        this.practiceAreaGoals.forEach((goal, index) => {
            const goalElement = document.createElement('div');
            goalElement.className = 'practice-area-goal';
            goalElement.innerHTML = `
                <div class="goal-header">
                    <div class="goal-title">${goal.area}</div>
                    <button class="btn-icon" onclick="window.deletePracticeAreaGoal(${index})">🗑️</button>
                </div>
                <div class="goal-target">
                    <label>Daily Goal:</label>
                    <input type="number" value="${goal.targetMinutes}" min="1" max="999" 
                           onchange="window.updatePracticeAreaGoal(${index}, this.value)">
                    <span>minutes</span>
                </div>
            `;
            container.appendChild(goalElement);
        });

        // Add button if less than 4 goals
        if (this.practiceAreaGoals.length < 4) {
            const addButton = document.createElement('div');
            addButton.className = 'add-practice-area-goal';
            addButton.onclick = () => this.addPracticeAreaGoal();
            addButton.innerHTML = `
                <div class="add-icon">➕</div>
                <div class="add-text">Add Practice Area</div>
            `;
            container.appendChild(addButton);
        }

        // Expose methods to window for inline handlers
        window.deletePracticeAreaGoal = (index) => this.deletePracticeAreaGoal(index);
        window.updatePracticeAreaGoal = (index, value) => this.updatePracticeAreaGoal(index, value);
    }

    async addPracticeAreaGoal() {
        const areas = ['Scales', 'Chords', 'Arpeggios', 'Songs', 'Technique', 'Theory', 'Improvisation', 'Sight Reading', 'Ear Training', 'Rhythm'];
        const availableAreas = areas.filter(area => !this.practiceAreaGoals.some(goal => goal.area === area));

        if (availableAreas.length === 0) {
            alert('All practice areas are already added!');
            return;
        }

        const area = prompt('Select practice area:\n' + availableAreas.join(', '));
        if (!area || !availableAreas.includes(area)) {
            alert('Please select a valid practice area');
            return;
        }

        const targetMinutes = prompt('Daily goal in minutes:', '30');
        if (!targetMinutes || isNaN(targetMinutes) || targetMinutes < 1) {
            alert('Please enter a valid number of minutes');
            return;
        }

        this.practiceAreaGoals.push({
            area: area,
            targetMinutes: parseInt(targetMinutes)
        });

        this.storageService.savePracticeAreaGoal({
            area: area,
            targetMinutes: parseInt(targetMinutes)
        });

        this.renderPracticeAreaGoals();
        await this.renderCalendar();
    }

    async updatePracticeAreaGoal(index, targetMinutes) {
        if (targetMinutes && !isNaN(targetMinutes) && targetMinutes > 0) {
            this.storageService.updatePracticeAreaGoal(index, targetMinutes);
            await this.renderCalendar();
        }
    }

    async deletePracticeAreaGoal(index) {
        if (confirm('Delete this practice area goal?')) {
            this.storageService.deletePracticeAreaGoal(index);
            this.loadPracticeAreaGoals();
            await this.renderCalendar();
        }
    }

    async renderCalendar() {
        try {
            const calendar = document.getElementById('calendar');
            const monthDisplay = document.getElementById('calendarMonth');

            if (!calendar || !monthDisplay) {
                console.error('Calendar elements not found');
                return;
            }

            // Get practice entries - simplified approach
            let entries = [];
            try {
                const result = await this.storageService.getPracticeEntries();
                entries = Array.isArray(result) ? result : [];
            } catch (error) {
                console.error('Error getting entries:', error);
                entries = [];
            }

            // Group entries by date
            const practiceDays = {};
            entries.forEach(entry => {
                if (entry && entry.date) {
                    const date = new Date(entry.date);
                    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

                    if (!practiceDays[dateKey]) {
                        practiceDays[dateKey] = {
                            count: 0,
                            totalDuration: 0,
                            entries: []
                        };
                    }

                    practiceDays[dateKey].count++;
                    practiceDays[dateKey].totalDuration += (entry.duration || 0);
                    practiceDays[dateKey].entries.push(entry);
                }
            });

            // Set month display
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                               'July', 'August', 'September', 'October', 'November', 'December'];
            monthDisplay.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;

            // Clear calendar
            calendar.innerHTML = '';

            // Add day headers
            const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            dayHeaders.forEach(day => {
                const header = document.createElement('div');
                header.className = 'calendar-header';
                header.textContent = day;
                calendar.appendChild(header);
            });

            // Get calendar days
            const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
            const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
            const firstDayOfWeek = firstDay.getDay();
            const daysInMonth = lastDay.getDate();

            // Add empty cells for previous month
            for (let i = 0; i < firstDayOfWeek; i++) {
                const emptyDay = document.createElement('div');
                emptyDay.className = 'calendar-day other-month';
                calendar.appendChild(emptyDay);
            }

            // Add days of current month
            for (let day = 1; day <= daysInMonth; day++) {
                const dayDiv = this.createCalendarDay(
                    day,
                    this.currentDate.getMonth(),
                    this.currentDate.getFullYear(),
                    practiceDays,
                    entries
                );
                calendar.appendChild(dayDiv);
            }

            // Update streak badges
            await this.updateStreakBadges();

        } catch (error) {
            console.error('Error rendering calendar:', error);
            const calendar = document.getElementById('calendar');
            if (calendar) {
                calendar.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--danger);">
                    Error rendering calendar. Please refresh the page.
                </div>`;
            }
        }
    }

    createCalendarDay(day, month, year, practiceDays, allEntries) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';

        // Check if today
        const today = new Date();
        if (day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()) {
            dayDiv.classList.add('today');
        }

        // Add quadrants container
        const quadrants = document.createElement('div');
        quadrants.className = 'calendar-quadrants';

        // Create 4 quadrants
        for (let i = 0; i < 4; i++) {
            const quadrant = document.createElement('div');
            quadrant.className = 'calendar-quadrant';
            quadrants.appendChild(quadrant);
        }
        dayDiv.appendChild(quadrants);

        // Add day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'calendar-day-number';
        dayNumber.textContent = day;
        dayDiv.appendChild(dayNumber);

        // Check if practiced on this day
        const dateKey = `${year}-${month}-${day}`;
        if (practiceDays[dateKey]) {
            dayDiv.classList.add('has-practice');

            // Calculate completed quadrants (simplified)
            const dayEntries = allEntries.filter(entry => {
                if (!entry || !entry.date) return false;
                const entryDate = new Date(entry.date);
                return entryDate.getFullYear() === year &&
                       entryDate.getMonth() === month &&
                       entryDate.getDate() === day;
            });

            const practiceMinutesByArea = {};
            dayEntries.forEach(entry => {
                const area = entry.practiceArea;
                const minutes = Math.floor((entry.duration || 0) / 60);
                practiceMinutesByArea[area] = (practiceMinutesByArea[area] || 0) + minutes;
            });

            // Color quadrants based on goals
            this.practiceAreaGoals.forEach((goal, index) => {
                if (index < 4) {
                    const practicedMinutes = practiceMinutesByArea[goal.area] || 0;
                    if (practicedMinutes >= goal.targetMinutes) {
                        quadrants.children[index].classList.add('completed');
                    }
                }
            });

            // Add click handler
            dayDiv.onclick = () => this.showDayDetails(year, month, day, practiceDays[dateKey]);
        }

        return dayDiv;
    }

    showDayDetails(year, month, day, dayData) {
        const modal = document.getElementById('practiceDayModal');
        const date = new Date(year, month, day);
        const dateStr = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        document.getElementById('practiceDayTitle').textContent = dateStr;

        // Summary stats
        const summaryHtml = `
            <div class="day-stat">
                <div class="stat-value">${dayData.count}</div>
                <div class="stat-label">Sessions</div>
            </div>
            <div class="day-stat">
                <div class="stat-value">${this.formatDuration(dayData.totalDuration)}</div>
                <div class="stat-label">Total Time</div>
            </div>
        `;
        document.getElementById('practiceDaySummary').innerHTML = summaryHtml;

        // Individual sessions
        const sessionsHtml = dayData.entries.map(entry => {
            const time = new Date(entry.date);
            const timeStr = time.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
            });

            return `
                <div class="day-session">
                    <div class="session-time">${timeStr}</div>
                    <div class="session-info">
                        <div class="session-area">${entry.practiceArea}</div>
                        <div class="session-duration">${this.formatDuration(entry.duration)}</div>
                    </div>
                    ${entry.notes ? `<div class="session-notes">${entry.notes}</div>` : ''}
                </div>
            `;
        }).join('');

        document.getElementById('practiceDaySessions').innerHTML = sessionsHtml;
        modal.style.display = 'block';
    }

    async updateStats() {
        try {
            // Get entries
            let entries = [];
            try {
                const result = await this.storageService.getPracticeEntries();
                entries = Array.isArray(result) ? result : [];
            } catch (error) {
                console.error('Error getting entries for stats:', error);
                entries = [];
            }

            // Calculate all-time stats
            const allTimeDaysSet = new Set();
            let allTimeTotalSeconds = 0;

            entries.forEach(entry => {
                if (entry && entry.date) {
                    const date = new Date(entry.date);
                    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                    allTimeDaysSet.add(dateKey);
                    allTimeTotalSeconds += (entry.duration || 0);
                }
            });

            // Filter entries for current month
            const monthEntries = entries.filter(entry => {
                if (!entry || !entry.date) return false;
                const entryDate = new Date(entry.date);
                return entryDate.getMonth() === this.currentDate.getMonth() &&
                       entryDate.getFullYear() === this.currentDate.getFullYear();
            });

            // Days practiced this month
            const monthDaysSet = new Set();
            let monthTotalSeconds = 0;

            monthEntries.forEach(entry => {
                const date = new Date(entry.date);
                const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                monthDaysSet.add(dateKey);
                monthTotalSeconds += (entry.duration || 0);
            });

            // Update DOM - Monthly stats
            document.getElementById('monthPracticeDays').textContent = monthDaysSet.size;
            document.getElementById('monthTotalTime').textContent = this.formatDuration(monthTotalSeconds);

            // Update DOM - All-time stats
            document.getElementById('allTimePracticeDays').textContent = allTimeDaysSet.size;
            document.getElementById('allTimeTotalTime').textContent = this.formatDuration(allTimeTotalSeconds);

            // Calculate longest streak
            try {
                const stats = await this.storageService.calculateStats();
                document.getElementById('longestStreak').textContent = stats.longestStreak || 0;
            } catch (error) {
                console.error('Error calculating stats:', error);
                document.getElementById('longestStreak').textContent = 0;
            }

            // Load calendar entries
            await this.loadCalendarEntries();
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    async loadCalendarEntries() {
        try {
            let entries = [];
            try {
                const result = await this.storageService.getPracticeEntries();
                entries = Array.isArray(result) ? result : [];
            } catch (error) {
                console.error('Error getting entries for calendar entries:', error);
                entries = [];
            }

            const container = document.getElementById('calendarEntries');
            if (!container) return;

            // Filter entries for current month
            const monthEntries = entries.filter(entry => {
                if (!entry || !entry.date) return false;
                const entryDate = new Date(entry.date);
                return entryDate.getMonth() === this.currentDate.getMonth() &&
                       entryDate.getFullYear() === this.currentDate.getFullYear();
            }).sort((a, b) => new Date(b.date) - new Date(a.date));

            if (monthEntries.length === 0) {
                container.innerHTML = '<p class="empty-state">No practice sessions this month.</p>';
                return;
            }

            container.innerHTML = monthEntries.map(entry => {
                const date = new Date(entry.date);
                const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

                return `
                    <div class="calendar-entry">
                        <div class="entry-header">
                            <span class="entry-date">${formattedDate}</span>
                            <span class="entry-duration">${this.formatDuration(entry.duration || 0)}</span>
                        </div>
                        <div class="entry-area">${entry.practiceArea || 'Unknown'}</div>
                        ${entry.notes ? `<div class="entry-notes">${entry.notes}</div>` : ''}
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading calendar entries:', error);
        }
    }

    async updateStreakBadges() {
        try {
            const badges = [
                { days: 5, icon: '🔥', label: '5 Day Streak' },
                { days: 10, icon: '⚡', label: '10 Day Streak' },
                { days: 15, icon: '💎', label: '15 Day Streak' },
                { days: 30, icon: '🏆', label: '30 Day Streak' },
                { days: 60, icon: '👑', label: '60 Day Streak' },
                { days: 90, icon: '🌟', label: '90 Day Streak' }
            ];

            const stats = await this.storageService.calculateStats();
            const container = document.getElementById('streakBadges');

            if (container) {
                container.innerHTML = badges.map(badge => {
                    const earned = stats.longestStreak >= badge.days || stats.currentStreak >= badge.days;
                    return `
                        <div class="streak-badge ${earned ? 'earned' : ''}">
                            <div class="badge-icon">${badge.icon}</div>
                            <div class="badge-label">${badge.days} Days</div>
                        </div>
                    `;
                }).join('');
            }
        } catch (error) {
            console.error('Error updating streak badges:', error);
        }
    }

    attachEventListeners() {
        // Month navigation
        document.getElementById('prevMonth')?.addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth')?.addEventListener('click', () => this.changeMonth(1));

        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                this.authService.logout();
                window.location.reload();
            }
        });

        // Back to dashboard
        document.getElementById('backToDashboardBtn')?.addEventListener('click', async () => {
            this.destroy();
            if (window.app) {
                await window.app.loadDashboardPage();
            }
        });

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('practiceDayModal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    async changeMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        await this.renderCalendar();
        await this.updateStats();
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    destroy() {
        // Remove event listeners
        window.removeEventListener('click', this.modalClickHandler);

        // Clear any references
        window.deletePracticeAreaGoal = null;
        window.updatePracticeAreaGoal = null;

        if (this.container) {
            this.container.remove();
        }
    }
}
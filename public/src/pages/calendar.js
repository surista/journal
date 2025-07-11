// Calendar Page Component - Complete and Optimized
import {TimeUtils} from '../utils/helpers.js';

export class CalendarPage {
    constructor(storageService) {
        this.storageService = storageService;
        this.currentDate = new Date();
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();
        this.practiceData = [];
        this.dailyGoals = [];
        this.practiceAreas = [
            'Scales', 'Chords', 'Arpeggios', 'Songs', 'Technique',
            'Theory', 'Improvisation', 'Sight Reading', 'Ear Training', 'Rhythm'
        ];
        this.windowClickHandler = null;
    }

    async init(container = null) {
        this.render(container);
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
        `;

        this.renderCalendarDays();
        this.updateStreakDisplay();
        this.ensureModalsExist();
        this.attachEventListeners();
    }

    ensureModalsExist() {
        // Remove existing modal if it exists to avoid conflicts
        const existingModal = document.getElementById('goalModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create the goal modal with better structure
        const modalHTML = `
            <div class="modal" id="goalModal" style="display: none;">
                <div class="modal-content">
                    <span class="close-btn" id="closeGoalModalBtn">&times;</span>
                    <h3>Set Daily Practice Goals</h3>
                    <p>Set up to 4 practice area goals. Each completed goal will fill one quadrant of the calendar day.</p>
                    
                    <div id="goalForm">
                        <div class="goal-inputs" id="goalInputs">
                            <!-- Goal inputs will be generated here -->
                        </div>
                        
                        <div class="goal-form-actions">
                            <button class="btn btn-secondary" id="addGoalAreaBtn" type="button">
                                <i class="icon">➕</i> Add Practice Area
                            </button>
                        </div>
                        
                        <div class="modal-actions">
                            <button class="btn btn-primary" id="saveGoalsBtn" type="button">Save Goals</button>
                            <button class="btn btn-secondary" id="cancelGoalsBtn" type="button">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Ensure day detail modal exists too
        if (!document.getElementById('dayDetailModal')) {
            const dayModalHTML = `
                <div class="modal" id="dayDetailModal" style="display: none;">
                    <div class="modal-content">
                        <span class="close-btn" id="closeModalBtn">&times;</span>
                        <h3 id="modalDate"></h3>
                        <div id="modalContent"></div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', dayModalHTML);
        }

        // Reattach modal event listeners after creating new modal
        this.attachModalEventListeners();
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

            // Add day number
            const dayNumber = document.createElement('div');
            dayNumber.className = 'calendar-day-number';
            dayNumber.textContent = day;
            dayElement.appendChild(dayNumber);

            // Get practice info for this date
            const practiceInfo = this.getPracticeInfoForDate(dateStr);

            if (practiceInfo.practiced) {
                dayElement.classList.add('has-practice');

                // Add time indicator
                const timeIndicator = document.createElement('div');
                timeIndicator.className = 'time-indicator';
                timeIndicator.textContent = this.formatShortDuration(practiceInfo.totalTime);
                timeIndicator.style.cssText = `
                    position: absolute;
                    top: 4px;
                    left: 6px;
                    font-size: 0.7rem;
                    color: var(--primary);
                    background: rgba(255, 255, 255, 0.9);
                    padding: 2px 4px;
                    border-radius: 2px;
                    z-index: 2;
                `;
                dayElement.appendChild(timeIndicator);

                // Add goal quadrants if goals exist
                if (this.dailyGoals.length > 0 && practiceInfo.goalCompletions) {
                    const quadrants = document.createElement('div');
                    quadrants.className = 'calendar-quadrants';

                    // Create up to 4 quadrants
                    for (let i = 0; i < 4; i++) {
                        const quadrant = document.createElement('div');
                        quadrant.className = 'calendar-quadrant';

                        // Find goal completion for this quadrant
                        const completion = practiceInfo.goalCompletions.find(gc => gc.quadrant === i);

                        if (completion) {
                            if (completion.completed) {
                                quadrant.classList.add('completed');
                                quadrant.style.background = 'var(--primary)';
                                quadrant.style.opacity = '0.8';
                            } else if (completion.percentage > 0) {
                                quadrant.classList.add('partial');
                                quadrant.style.background = `linear-gradient(to top, var(--primary) ${completion.percentage}%, var(--bg-input) ${completion.percentage}%)`;
                                quadrant.style.opacity = '0.6';
                            }

                            // Add tooltip
                            quadrant.title = `${completion.area}: ${Math.round(completion.percentage)}% (${Math.floor(completion.practiceTime / 60)}/${completion.goalMinutes}min)`;
                        }

                        quadrants.appendChild(quadrant);
                    }

                    dayElement.appendChild(quadrants);
                }
            }

            // Add click handler
            dayElement.addEventListener('click', () => this.showDayDetail(dateStr));

            grid.appendChild(dayElement);
        }
    }

    attachEventListeners() {
        console.log('attachEventListeners called');

        // Goal setting with detailed debugging
        const addGoalBtn = document.getElementById('addGoalBtn');
        console.log('addGoalBtn element:', addGoalBtn);
        console.log('addGoalBtn exists:', !!addGoalBtn);

        if (addGoalBtn) {
            console.log('Adding click listener to addGoalBtn');
            addGoalBtn.addEventListener('click', (e) => {
                console.log('addGoalBtn CLICKED!');
                e.preventDefault();
                e.stopPropagation();
                this.showGoalModal();
            });

            // Test if the button is clickable
            console.log('Button style display:', addGoalBtn.style.display);
            console.log('Button computed style:', window.getComputedStyle(addGoalBtn).display);
        } else {
            console.error('addGoalBtn not found!');
        }

        // Back button
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
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

        // Attach modal event listeners
        this.attachModalEventListeners();

        // Window click handler for modal closing
        this.windowClickHandler = (e) => {
            const dayModal = document.getElementById('dayDetailModal');
            const goalModal = document.getElementById('goalModal');
            if (e.target === dayModal) this.hideDayModal();
            if (e.target === goalModal) this.hideGoalModal();
        };
        window.addEventListener('click', this.windowClickHandler);
    }

    attachModalEventListeners() {
        // Remove existing listeners to avoid duplicates
        const addBtn = document.getElementById('addGoalAreaBtn');
        const saveBtn = document.getElementById('saveGoalsBtn');
        const cancelBtn = document.getElementById('cancelGoalsBtn');
        const closeBtn = document.getElementById('closeGoalModalBtn');
        const dayCloseBtn = document.getElementById('closeModalBtn');

        // Add goal area button
        if (addBtn) {
            addBtn.replaceWith(addBtn.cloneNode(true));
            document.getElementById('addGoalAreaBtn').addEventListener('click', (e) => {
                e.preventDefault();
                this.addGoalInput();
            });
        }

        // Save goals button
        if (saveBtn) {
            saveBtn.replaceWith(saveBtn.cloneNode(true));
            document.getElementById('saveGoalsBtn').addEventListener('click', (e) => {
                e.preventDefault();
                this.saveGoals();
            });
        }

        // Cancel button
        if (cancelBtn) {
            cancelBtn.replaceWith(cancelBtn.cloneNode(true));
            document.getElementById('cancelGoalsBtn').addEventListener('click', (e) => {
                e.preventDefault();
                this.hideGoalModal();
            });
        }

        // Close button
        if (closeBtn) {
            closeBtn.replaceWith(closeBtn.cloneNode(true));
            document.getElementById('closeGoalModalBtn').addEventListener('click', (e) => {
                e.preventDefault();
                this.hideGoalModal();
            });
        }

        // Day modal close button
        if (dayCloseBtn) {
            dayCloseBtn.replaceWith(dayCloseBtn.cloneNode(true));
            document.getElementById('closeModalBtn').addEventListener('click', (e) => {
                e.preventDefault();
                this.hideDayModal();
            });
        }
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
        // Skip if we're in a tab container without stat elements
        if (!document.getElementById('monthPracticeDays')) {
            return;
        }

        // Calculate stats for current month
        const monthStart = new Date(this.currentYear, this.currentMonth, 1);
        const monthEnd = new Date(this.currentYear, this.currentMonth + 1, 0);

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

        // Update display with null checks
        const monthPracticeDaysEl = document.getElementById('monthPracticeDays');
        const monthTotalTimeEl = document.getElementById('monthTotalTime');
        const totalPracticeDaysEl = document.getElementById('totalPracticeDays');
        const totalPracticeTimeEl = document.getElementById('totalPracticeTime');
        const longestStreakEl = document.getElementById('longestStreak');

        if (monthPracticeDaysEl) monthPracticeDaysEl.textContent = `${monthDaysSet.size} days`;
        if (monthTotalTimeEl) monthTotalTimeEl.textContent = this.formatDuration(monthTime);
        if (totalPracticeDaysEl) totalPracticeDaysEl.textContent = `${allTimeDays.size} days`;
        if (totalPracticeTimeEl) totalPracticeTimeEl.textContent = this.formatDuration(allTimeTotal);

        // Calculate longest streak
        const streak = this.calculateLongestStreak();
        if (longestStreakEl) longestStreakEl.textContent = `${streak} days`;
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
            {days: 5, icon: '🔥', label: '5 Day Streak'},
            {days: 10, icon: '⚡', label: '10 Day Streak'},
            {days: 15, icon: '💎', label: '15 Day Streak'},
            {days: 30, icon: '🏆', label: '30 Day Streak'},
            {days: 60, icon: '👑', label: '60 Day Streak'},
            {days: 90, icon: '🌟', label: '90 Day Streak'}
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
            return {practiced: false};
        }

        const totalTime = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
        const areas = {};

        // Calculate total time per practice area
        sessions.forEach(session => {
            if (session.practiceArea) {
                areas[session.practiceArea] = (areas[session.practiceArea] || 0) + (session.duration || 0);
            }
        });

        // Calculate goal completion for quadrants
        const goalCompletions = this.calculateGoalCompletions(areas);

        return {
            practiced: true,
            totalTime,
            areas,
            sessions,
            goalCompletions
        };
    }

    calculateGoalCompletions(practiceAreas) {
        if (!this.dailyGoals || this.dailyGoals.length === 0) {
            return [];
        }

        return this.dailyGoals.map(goal => {
            const practiceTime = practiceAreas[goal.area] || 0;
            const goalTime = goal.minutes * 60; // Convert to seconds
            const percentage = Math.min((practiceTime / goalTime) * 100, 100);

            return {
                area: goal.area,
                goalMinutes: goal.minutes,
                practiceTime,
                percentage,
                completed: percentage >= 100,
                quadrant: goal.quadrant || 0
            };
        });
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

        if (!modal || !modalDate || !modalContent) {
            console.error('Day detail modal elements not found');
            return;
        }

        const date = new Date(dateStr + 'T00:00:00');
        modalDate.textContent = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const practiceInfo = this.getPracticeInfoForDate(dateStr);

        if (!practiceInfo.practiced) {
            modalContent.innerHTML = `
                <div class="empty-state">
                    <p>No practice recorded for this day</p>
                    ${this.dailyGoals.length > 0 ? `
                        <div class="daily-goals-preview">
                            <h4>Daily Goals:</h4>
                            <ul>
                                ${this.dailyGoals.map(goal =>
                `<li>${goal.area}: ${goal.minutes} minutes</li>`
            ).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            // Goal progress section
            let goalProgressHTML = '';
            if (this.dailyGoals.length > 0 && practiceInfo.goalCompletions) {
                goalProgressHTML = `
                    <div class="goal-progress-section">
                        <h4>Daily Goal Progress</h4>
                        <div class="goal-progress-grid">
                            ${practiceInfo.goalCompletions.map(completion => `
                                <div class="goal-progress-item ${completion.completed ? 'completed' : ''}">
                                    <div class="goal-progress-header">
                                        <span class="goal-area">${completion.area}</span>
                                        <span class="goal-percentage">${Math.round(completion.percentage)}%</span>
                                    </div>
                                    <div class="progress-bar-container">
                                        <div class="progress-bar" style="width: ${completion.percentage}%"></div>
                                    </div>
                                    <div class="goal-progress-text">
                                        ${Math.floor(completion.practiceTime / 60)} / ${completion.goalMinutes} minutes
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            // Sessions section
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
                
                ${goalProgressHTML}
                
                <h4>Practice Sessions</h4>
                <div class="sessions-list">
                    ${sessionsHTML}
                </div>
            `;
        }

        modal.style.display = 'block';
    }

    hideDayModal() {
        const modal = document.getElementById('dayDetailModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showGoalModal() {
        console.log('showGoalModal CALLED - REAL MODE');

        // First ensure the modal exists
        this.ensureModalsExist();

        const modal = document.getElementById('goalModal');


        if (!modal) {
            console.error('Modal not found after ensuring it exists');
            return;
        }

        const container = document.getElementById('goalInputs');
        if (!container) {
            console.error('Goal inputs container not found');
            return;
        }

        // Clear existing content
        container.innerHTML = '';

        // Add goal inputs
        if (this.dailyGoals.length > 0) {
            this.dailyGoals.forEach(goal => this.addGoalInput(goal));
        } else {
            // Add exactly 4 empty goal inputs
            for (let i = 0; i < 4; i++) {
                this.addGoalInput();
            }
        }

        // Always hide add button since 4 is max
        setTimeout(() => {
            const addBtn = document.getElementById('addGoalAreaBtn');
            if (addBtn) addBtn.style.display = 'none';
        }, 100);

        // Force modal to display with proper styling
        modal.style.cssText = `
            display: flex !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background-color: rgba(0, 0, 0, 0.5) !important;
            z-index: 999999 !important;
            align-items: center !important;
            justify-content: center !important;
        `;

        // Ensure modal content is visible
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.cssText = `
                background-color: var(--bg-card) !important;
                padding: 2rem !important;
                border-radius: var(--radius-lg) !important;
                max-width: 650px !important;
                width: 90% !important;
                max-height: 90vh !important;
                min-height: 750px !important;
                overflow-y: auto !important;
                position: relative !important;
                border: 1px solid var(--border) !important;
                z-index: 1000000 !important;
            `;
        }
    }

    hideGoalModal() {
        const modal = document.getElementById('goalModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    addGoalInput(existingGoal = null) {
        const container = document.getElementById('goalInputs');
        if (!container) {
            console.error('Goal inputs container not found');
            return;
        }

        // Limit to 4 goals maximum
        const existingInputs = container.querySelectorAll('.goal-input-row');
        if (existingInputs.length >= 4) {
            this.showNotification('Maximum of 4 daily goals allowed', 'warning');
            return;
        }

        const goalDiv = document.createElement('div');
        goalDiv.className = 'goal-input-row';

        // Generate unique IDs
        const selectId = `goalArea_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const inputId = `goalMinutes_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        goalDiv.innerHTML = `
            <select class="goal-area-select" id="${selectId}" name="${selectId}">
                <option value="">Select practice area</option>
                ${this.practiceAreas.map(area =>
            `<option value="${area}" ${existingGoal && existingGoal.area === area ? 'selected' : ''}>${area}</option>`
        ).join('')}
            </select>
            <input type="number" 
                   class="goal-minutes-input" 
                   id="${inputId}" 
                   name="${inputId}"
                   placeholder="Minutes" 
                   min="1" 
                   max="180" 
                   value="${existingGoal ? existingGoal.minutes : ''}" />
            <button class="btn btn-sm btn-danger remove-goal-btn" type="button">✕</button>
        `;

        // Add remove functionality
        const removeBtn = goalDiv.querySelector('.remove-goal-btn');
        removeBtn.addEventListener('click', () => {
            goalDiv.remove();
            // Show add button if under limit
            const addBtn = document.getElementById('addGoalAreaBtn');
            if (addBtn && container.querySelectorAll('.goal-input-row').length < 4) {
                addBtn.style.display = 'block';
            }
        });

        container.appendChild(goalDiv);

        // Hide add button if at limit
        const addBtn = document.getElementById('addGoalAreaBtn');
        if (addBtn && container.querySelectorAll('.goal-input-row').length >= 4) {
            addBtn.style.display = 'none';
        }
    }

    async saveGoals() {
        const goalRows = document.querySelectorAll('.goal-input-row');
        const newGoals = [];

        goalRows.forEach((row, index) => {
            const area = row.querySelector('.goal-area-select').value;
            const minutes = parseInt(row.querySelector('.goal-minutes-input').value);

            if (area && minutes > 0) {
                newGoals.push({
                    id: Date.now() + Math.random() + index,
                    type: 'daily',
                    area,
                    minutes,
                    quadrant: index, // Track which quadrant this goal represents (0-3)
                    createdAt: new Date().toISOString()
                });
            }
        });

        if (newGoals.length === 0) {
            this.showNotification('Please add at least one goal', 'warning');
            return;
        }

        try {
            // Remove old daily goals and add new ones
            const allGoals = await this.storageService.getGoals();
            const otherGoals = allGoals.filter(g => g.type !== 'daily');
            const updatedGoals = [...otherGoals, ...newGoals];

            await this.storageService.saveGoals(updatedGoals);
            this.dailyGoals = newGoals;

            this.hideGoalModal();
            this.renderCalendarDays();
            this.showNotification(`${newGoals.length} daily goals saved successfully`, 'success');
        } catch (error) {
            console.error('Error saving goals:', error);
            this.showNotification('Error saving goals', 'error');
        }
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
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
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

    refresh() {
        this.loadPracticeData();
    }

    destroy() {
        // Clean up event listeners and resources
        if (this.windowClickHandler) {
            window.removeEventListener('click', this.windowClickHandler);
        }

        // Remove modals created by this instance
        const goalModal = document.getElementById('goalModal');
        const dayModal = document.getElementById('dayDetailModal');
        if (goalModal) goalModal.remove();
        if (dayModal) dayModal.remove();
    }
}
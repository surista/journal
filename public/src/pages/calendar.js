// Calendar Page Component - Optimized and Cleaned
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
        this.isInitialized = false;
    }

    // Helper function to get local date string (YYYY-MM-DD) from a date
    getLocalDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    async init(container = null) {
        this.render(container);
        await this.loadPracticeData();
        this.isInitialized = true;
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
                    <h1>Practice Calendar</h1>
                    <div class="calendar-actions">
                        <button class="btn btn-primary" id="addGoalBtn" onclick="window.calendarInstance?.showGoalModal()">
                            <i class="icon">🎯</i> Set Daily Goals
                        </button>
                    </div>
                </div>

                <div class="calendar-container">
                    <div class="calendar-navigation">
                        <button class="nav-btn" onclick="window.calendarInstance?.previousMonth()">
                            <i class="icon">◀</i>
                        </button>
                        <h2 id="currentMonth">${this.getMonthName(this.currentMonth)} ${this.currentYear}</h2>
                        <button class="nav-btn" onclick="window.calendarInstance?.nextMonth()">
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

        // Set global reference for onclick handlers
        window.calendarInstance = this;

        this.renderCalendarDays();
        this.updateStreakDisplay();
        this.ensureModalsExist();
    }

    ensureModalsExist() {
        // Remove existing modals to avoid conflicts
        const existingGoalModal = document.getElementById('goalModal');
        const existingDayModal = document.getElementById('dayDetailModal');
        if (existingGoalModal) existingGoalModal.remove();
        if (existingDayModal) existingDayModal.remove();

        // Create fresh modals
        const modalHTML = `
            <div class="modal" id="goalModal">
                <div class="modal-content">
                    <span class="close-btn" onclick="window.calendarInstance?.hideGoalModal()">&times;</span>
                    <h3>Set Daily Practice Goals</h3>
                    <p>Set up to 4 practice area goals. Each completed goal will fill one quadrant of the calendar day.</p>
                    
                    <div id="goalForm">
                        <div class="goal-inputs" id="goalInputs">
                            <!-- Goal inputs will be generated here -->
                        </div>
                        
                        <div class="goal-form-actions">
                            <button class="btn btn-secondary" onclick="window.calendarInstance?.addGoalInput()" type="button">
                                <i class="icon">➕</i> Add Practice Area
                            </button>
                        </div>
                        
                        <div class="modal-actions">
                            <button class="btn btn-primary" onclick="window.calendarInstance?.saveGoals()" type="button">Save Goals</button>
                            <button class="btn btn-secondary" onclick="window.calendarInstance?.hideGoalModal()" type="button">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="modal" id="dayDetailModal">
                <div class="modal-content">
                    <span class="close-btn" onclick="window.calendarInstance?.hideDayModal()">&times;</span>
                    <h3 id="modalDate"></h3>
                    <div id="modalContent"></div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Navigation methods
    previousMonth() {
        this.currentMonth--;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.updateCalendar();
    }

    nextMonth() {
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.updateCalendar();
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

            // Get practice info for this date
            const practiceInfo = this.getPracticeInfoForDate(dateStr);

            // Calculate total daily goal minutes
            const totalGoalMinutes = this.dailyGoals.reduce((sum, goal) => sum + (goal.minutes || 0), 0);
            const totalPracticeMinutes = Math.floor(practiceInfo.totalTime / 60);

            // Calculate percentage for progress circle
            const progressPercentage = totalGoalMinutes > 0 ?
                Math.min((totalPracticeMinutes / totalGoalMinutes) * 100, 100) : 0;

            // Add day number (always at top-left, not in wrapper)
            const dayNumber = document.createElement('div');
            dayNumber.className = 'calendar-day-number';
            dayNumber.textContent = day;
            dayElement.appendChild(dayNumber);

            if (practiceInfo.practiced) {
                dayElement.classList.add('has-practice');

                // Add wrapper for practice minutes and progress circle
                const practiceWrapper = document.createElement('div');
                practiceWrapper.className = 'practice-wrapper';
                practiceWrapper.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                `;

                // Add progress circle (SVG) if has goals
                if (totalGoalMinutes > 0) {
                    const progressCircle = this.createProgressCircle(progressPercentage);
                    practiceWrapper.appendChild(progressCircle);
                }

                // Add practice minutes text in center
                const minutesText = document.createElement('div');
                minutesText.className = 'practice-minutes';
                minutesText.textContent = totalPracticeMinutes;
                minutesText.style.position = 'relative'; // Make it relative to wrapper
                minutesText.style.transform = 'none'; // Remove transform since wrapper handles positioning

                // Color based on goal completion
                if (totalGoalMinutes > 0) {
                    if (progressPercentage >= 100) {
                        minutesText.classList.add('goal-met');
                    } else if (progressPercentage >= 50) {
                        minutesText.classList.add('goal-partial');
                    } else {
                        minutesText.classList.add('goal-low');
                    }
                } else {
                    minutesText.classList.add('no-goal');
                }

                practiceWrapper.appendChild(minutesText);
                dayElement.appendChild(practiceWrapper);

                // Add goal quadrants if goals exist
                if (this.dailyGoals.length > 0) {
                    const quadrants = document.createElement('div');
                    quadrants.className = 'calendar-quadrants';

                    // Calculate goal completions with proper area matching
                    const goalCompletions = this.calculateGoalCompletions(practiceInfo.areas);

                    // Create up to 4 quadrants
                    for (let i = 0; i < 4; i++) {
                        const quadrant = document.createElement('div');
                        quadrant.className = 'calendar-quadrant';

                        // Check if there's a goal for this quadrant
                        if (i < this.dailyGoals.length) {
                            const goal = this.dailyGoals[i];
                            const completion = goalCompletions.find(gc => gc.area === goal.area);

                            if (completion) {
                                if (completion.completed) {
                                    quadrant.classList.add('completed');
                                } else if (completion.percentage > 0) {
                                    quadrant.classList.add('partial');
                                    quadrant.style.background = `linear-gradient(to top, var(--primary) ${completion.percentage}%, var(--bg-input) ${completion.percentage}%)`;
                                }

                                // Add tooltip
                                quadrant.title = `${completion.area}: ${Math.round(completion.percentage)}% (${Math.floor(completion.practiceTime / 60)}/${completion.goalMinutes}min)`;
                            }
                        }

                        quadrants.appendChild(quadrant);
                    }

                    dayElement.appendChild(quadrants);
                }
            }

            // Add click handler using onclick attribute
            dayElement.setAttribute('onclick', `window.calendarInstance?.showDayPopup('${dateStr}', event)`);

            grid.appendChild(dayElement);
        }
    }

    createProgressCircle(percentage) {
        const size = 40; // Size of the circle
        const strokeWidth = 3;
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percentage / 100) * circumference;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'progress-circle');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);

        // Background circle (gray)
        const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        bgCircle.setAttribute('cx', size / 2);
        bgCircle.setAttribute('cy', size / 2);
        bgCircle.setAttribute('r', radius);
        bgCircle.setAttribute('stroke', 'var(--border)');
        bgCircle.setAttribute('stroke-width', strokeWidth);
        bgCircle.setAttribute('fill', 'none');
        bgCircle.setAttribute('opacity', '0.3');

        // Progress circle (gold)
        const progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        progressCircle.setAttribute('cx', size / 2);
        progressCircle.setAttribute('cy', size / 2);
        progressCircle.setAttribute('r', radius);
        progressCircle.setAttribute('stroke', '#FFD700'); // Gold color
        progressCircle.setAttribute('stroke-width', strokeWidth);
        progressCircle.setAttribute('fill', 'none');
        progressCircle.setAttribute('stroke-dasharray', circumference);
        progressCircle.setAttribute('stroke-dashoffset', offset);
        progressCircle.setAttribute('stroke-linecap', 'round');
        progressCircle.setAttribute('transform', `rotate(-90 ${size / 2} ${size / 2})`);

        svg.appendChild(bgCircle);
        svg.appendChild(progressCircle);

        return svg;
    }

    showDayPopup(dateStr, event) {
        // Remove any existing popup
        const existingPopup = document.querySelector('.session-popup');
        if (existingPopup) {
            existingPopup.remove();
        }

        const practiceInfo = this.getPracticeInfoForDate(dateStr);
        const date = new Date(dateStr + 'T00:00:00');

        const popup = document.createElement('div');
        popup.className = 'session-popup';

        // Position popup near the clicked element
        const rect = event.currentTarget.getBoundingClientRect();
        popup.style.left = `${rect.left}px`;
        popup.style.top = `${rect.bottom + 10}px`;

        // Adjust if popup would go off screen
        setTimeout(() => {
            const popupRect = popup.getBoundingClientRect();
            if (popupRect.right > window.innerWidth) {
                popup.style.left = `${window.innerWidth - popupRect.width - 20}px`;
            }
            if (popupRect.bottom > window.innerHeight) {
                popup.style.top = `${rect.top - popupRect.height - 10}px`;
            }
        }, 0);

        const dateFormatted = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        if (!practiceInfo.practiced) {
            popup.innerHTML = `
                <div class="session-popup-header">
                    <h4>${dateFormatted}</h4>
                    <button class="session-popup-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
                </div>
                <p style="color: var(--text-secondary); text-align: center; padding: 1rem;">
                    No practice recorded for this day
                </p>
            `;
        } else {
            const sessionsHTML = practiceInfo.sessions.map(session => {
                const time = new Date(session.date).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                });

                return `
                    <div class="session-item">
                        <div class="session-time">${time} - ${this.formatDuration(session.duration || 0)}</div>
                        <div class="session-area">${session.practiceArea || 'General Practice'}</div>
                        ${session.notes ? `<div class="session-details">${session.notes}</div>` : ''}
                        ${session.bpm ? `<div class="session-details">Tempo: ${session.bpm} BPM</div>` : ''}
                    </div>
                `;
            }).join('');

            popup.innerHTML = `
                <div class="session-popup-header">
                    <h4>${dateFormatted}</h4>
                    <button class="session-popup-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
                </div>
                <div class="session-list">
                    <div style="margin-bottom: 1rem;">
                        <strong>Total: ${this.formatDuration(practiceInfo.totalTime)}</strong> 
                        (${practiceInfo.sessions.length} session${practiceInfo.sessions.length > 1 ? 's' : ''})
                    </div>
                    ${sessionsHTML}
                </div>
            `;
        }

        document.body.appendChild(popup);

        // Click outside to close with delay
        setTimeout(() => {
            const clickOutsideHandler = (e) => {
                if (!popup.contains(e.target)) {
                    popup.remove();
                    document.removeEventListener('click', clickOutsideHandler);
                }
            };
            document.addEventListener('click', clickOutsideHandler);
        }, 100);
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
            const dateStr = this.getLocalDateString(sessionDate);

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
                monthDaysSet.add(this.getLocalDateString(sessionDate));
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
            const date = this.getLocalDateString(new Date(session.date));
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

        const today = this.getLocalDateString(new Date());
        const yesterday = this.getLocalDateString(new Date(Date.now() - 86400000));

        // Check if practiced today or yesterday
        const practiceDates = new Set();
        this.practiceData.forEach(session => {
            const date = this.getLocalDateString(new Date(session.date));
            practiceDates.add(date);
        });

        if (!practiceDates.has(today) && !practiceDates.has(yesterday)) {
            return 0;
        }

        // Count backwards from today or yesterday
        let streak = 0;
        let checkDate = practiceDates.has(today) ? new Date() : new Date(Date.now() - 86400000);

        while (true) {
            const dateStr = this.getLocalDateString(checkDate);
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
            {days: 1, icon: '🎸', label: '1 Day Streak'},
            {days: 3, icon: '🔥', label: '3 Day Streak'},
            {days: 7, icon: '🗓️', label: '7 Day Streak'},
            {days: 14, icon: '💪', label: '14 Day Streak'},
            {days: 21, icon: '💎', label: '21 Day Streak'},
            {days: 30, icon: '📅', label: '30 Day Streak'},
            {days: 45, icon: '🌟', label: '45 Day Streak'},
            {days: 60, icon: '👑', label: '60 Day Streak'},
            {days: 90, icon: '🏆', label: '90 Day Streak'},
            {days: 365, icon: '🎖️', label: '365 Day Streak'}
        ];

        return badges.map(badge => ({
            ...badge,
            earned: currentStreak >= badge.days
        }));
    }

    getPracticeInfoForDate(dateStr) {
        const sessions = this.practiceData.filter(session => {
            const sessionDate = this.getLocalDateString(new Date(session.date));
            return sessionDate === dateStr;
        });

        if (sessions.length === 0) {
            return {practiced: false};
        }

        const totalTime = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
        const areas = {};

        // Calculate total time per practice area (case-insensitive)
        sessions.forEach(session => {
            if (session.practiceArea) {
                // Normalize the practice area name for comparison
                const normalizedArea = session.practiceArea.trim();
                areas[normalizedArea] = (areas[normalizedArea] || 0) + (session.duration || 0);
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

        return this.dailyGoals.map((goal, index) => {
            // Case-insensitive matching for practice areas
            let practiceTime = 0;
            Object.entries(practiceAreas).forEach(([area, time]) => {
                if (area.toLowerCase() === goal.area.toLowerCase()) {
                    practiceTime += time;
                }
            });

            const goalTime = goal.minutes * 60; // Convert to seconds
            const percentage = Math.min((practiceTime / goalTime) * 100, 100);

            return {
                area: goal.area,
                goalMinutes: goal.minutes,
                practiceTime,
                percentage,
                completed: percentage >= 100,
                quadrant: index // Use index as quadrant position
            };
        });
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }

    // Modal methods
    showGoalModal() {
        const modal = document.getElementById('goalModal');
        const container = document.getElementById('goalInputs');

        if (!modal || !container) {
            console.error('Goal modal elements not found');
            return;
        }

        // Clear and populate inputs
        container.innerHTML = '';

        // Add goal inputs
        if (this.dailyGoals.length > 0) {
            this.dailyGoals.forEach(goal => this.addGoalInput(goal));
        } else {
            // Add 4 empty goal inputs
            for (let i = 0; i < 4; i++) {
                this.addGoalInput();
            }
        }

        // Show modal with proper display style
        modal.style.display = 'flex';
        modal.classList.add('show');

        // Force reflow and add opacity
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
        });

        const addButton = document.querySelector('.goal-form-actions button');
        if (addButton && document.querySelectorAll('.goal-input-row').length >= 4) {
            addButton.style.display = 'none';
        }
    }

    hideGoalModal() {
        const modal = document.getElementById('goalModal');
        if (modal) {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.style.display = 'none';
                modal.classList.remove('show');
            }, 200);
        }
    }

    hideDayModal() {
        const modal = document.getElementById('dayDetailModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    addGoalInput(existingGoal = null) {
        const container = document.getElementById('goalInputs');
        if (!container) return;

        // Limit to 4 goals maximum
        const existingInputs = container.querySelectorAll('.goal-input-row');
        if (existingInputs.length >= 4) {
            this.showNotification('Maximum of 4 daily goals allowed', 'warning');
            return;
        }

        const goalDiv = document.createElement('div');
        goalDiv.className = 'goal-input-row';

        goalDiv.innerHTML = `
        <input type="number" 
               class="goal-minutes-input" 
               placeholder="Min" 
               min="1" 
               max="180" 
               value="${existingGoal ? existingGoal.minutes : ''}" />
        <select class="goal-area-select">
            <option value="">Select practice area</option>
            ${this.practiceAreas.map(area =>
            `<option value="${area}" ${existingGoal && existingGoal.area === area ? 'selected' : ''}>${area}</option>`
        ).join('')}
        </select>
        <button class="btn btn-sm btn-danger remove-goal-btn" type="button" onclick="this.parentElement.remove(); window.calendarInstance?.updateAddButton()">✕</button>
    `;

        container.appendChild(goalDiv);
        this.updateAddButton();
    }

    updateAddButton() {
        const container = document.getElementById('goalInputs');
        const addButton = document.querySelector('.goal-form-actions button');

        if (container && addButton) {
            const goalCount = container.querySelectorAll('.goal-input-row').length;
            addButton.style.display = goalCount >= 4 ? 'none' : 'block';
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
                    quadrant: index,
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
        if (this.isInitialized) {
            this.loadPracticeData();
        }
    }

    destroy() {
        // Clean up global reference
        if (window.calendarInstance === this) {
            window.calendarInstance = null;
        }

        // Remove modals created by this instance
        const goalModal = document.getElementById('goalModal');
        const dayModal = document.getElementById('dayDetailModal');
        if (goalModal) goalModal.remove();
        if (dayModal) dayModal.remove();

        this.isInitialized = false;
    }
}
// Calendar Page Component - Optimized and Cleaned
import { TimeUtils } from '../utils/helpers.js';

export class CalendarPage {
    constructor(storageService) {
        this.storageService = storageService;
        this.currentDate = new Date();
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();
        this.practiceData = [];
        this.dailyGoals = [];
        this.practiceAreas = []; // Will be loaded from storage
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
        await this.loadSessionAreas();
        await this.loadPracticeData();
        this.isInitialized = true;

        // Listen for session areas updates
        this.sessionAreasHandler = async () => {
            await this.loadSessionAreas();
        };
        window.addEventListener('sessionAreasUpdated', this.sessionAreasHandler);
    }

    async loadSessionAreas() {
        try {
            this.practiceAreas = await this.storageService.getSessionAreas();
        } catch (error) {
            console.error('Error loading session areas:', error);
            // Fallback to defaults if loading fails
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
                'Speed',
                'Rhythm'
            ];
        }
    }

    getMonthName(monthIndex) {
        const months = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December'
        ];
        return months[monthIndex];
    }

    render(container = null) {
        const targetContainer = container || document.getElementById('app');

        // Clear container
        targetContainer.textContent = '';

        // Create main calendar page
        const calendarPage = document.createElement('div');
        calendarPage.className = 'calendar-page';

        // Create header
        const header = document.createElement('div');
        header.className = 'calendar-header';

        const h1 = document.createElement('h1');
        h1.textContent = 'Practice Calendar';
        header.appendChild(h1);

        const actions = document.createElement('div');
        actions.className = 'calendar-actions';

        const addGoalBtn = document.createElement('button');
        addGoalBtn.className = 'btn btn-primary';
        addGoalBtn.id = 'addGoalBtn';
        addGoalBtn.onclick = () => window.calendarInstance?.showGoalModal();

        const icon = document.createElement('i');
        icon.className = 'icon';
        icon.textContent = '🎯';
        addGoalBtn.appendChild(icon);
        addGoalBtn.appendChild(document.createTextNode(' Set Daily Goals'));

        actions.appendChild(addGoalBtn);
        header.appendChild(actions);
        calendarPage.appendChild(header);

        // Create calendar container
        const calendarContainer = document.createElement('div');
        calendarContainer.className = 'calendar-container';

        // Create navigation
        const nav = document.createElement('div');
        nav.className = 'calendar-navigation';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'nav-btn';
        prevBtn.onclick = () => window.calendarInstance?.previousMonth();
        const prevIcon = document.createElement('i');
        prevIcon.className = 'icon';
        prevIcon.textContent = '◀';
        prevBtn.appendChild(prevIcon);

        const currentMonth = document.createElement('h2');
        currentMonth.id = 'currentMonth';
        currentMonth.textContent = `${this.getMonthName(this.currentMonth)} ${this.currentYear}`;

        const nextBtn = document.createElement('button');
        nextBtn.className = 'nav-btn';
        nextBtn.onclick = () => window.calendarInstance?.nextMonth();
        const nextIcon = document.createElement('i');
        nextIcon.className = 'icon';
        nextIcon.textContent = '▶';
        nextBtn.appendChild(nextIcon);

        nav.appendChild(prevBtn);
        nav.appendChild(currentMonth);
        nav.appendChild(nextBtn);
        calendarContainer.appendChild(nav);

        // Create calendar grid
        const grid = document.createElement('div');
        grid.className = 'calendar-grid';
        grid.id = 'calendarGrid';
        calendarContainer.appendChild(grid);

        // Create legend
        const legend = document.createElement('div');
        legend.className = 'calendar-legend';

        const legendItems = [
            { color: 'var(--success-light)', text: 'Practiced' },
            { color: 'var(--primary-light)', text: 'Goal Met' },
            { color: 'var(--warning-light)', text: 'Partial Goal' }
        ];

        legendItems.forEach((item) => {
            const span = document.createElement('span');
            span.className = 'legend-item';

            const box = document.createElement('span');
            box.className = 'legend-box';
            box.style.background = item.color;

            span.appendChild(box);
            span.appendChild(document.createTextNode(item.text));
            legend.appendChild(span);
        });

        calendarContainer.appendChild(legend);
        calendarPage.appendChild(calendarContainer);

        // Create stats section
        const stats = document.createElement('div');
        stats.className = 'calendar-stats';

        // Create headers row
        const statsHeaders = document.createElement('div');
        statsHeaders.className = 'stats-headers';

        const monthHeader = document.createElement('h3');
        monthHeader.className = 'stat-header-title';
        monthHeader.textContent = 'THIS MONTH';

        const allTimeHeader = document.createElement('h3');
        allTimeHeader.className = 'stat-header-title';
        allTimeHeader.textContent = 'ALL TIME';

        statsHeaders.appendChild(monthHeader);
        statsHeaders.appendChild(allTimeHeader);
        stats.appendChild(statsHeaders);

        // Create stats boxes row
        const statsBoxes = document.createElement('div');
        statsBoxes.className = 'stats-boxes';

        // Create stat box helper function
        const createStatBox = (daysId, hoursId, minutesId) => {
            const box = document.createElement('div');
            box.className = 'stat-box';

            // Days section
            const daysSection = document.createElement('div');
            daysSection.className = 'stat-days-section';

            const daysValue = document.createElement('span');
            daysValue.className = 'stat-days-value';
            daysValue.id = daysId;
            daysValue.textContent = '0';

            const daysLabel = document.createElement('span');
            daysLabel.className = 'stat-days-label';
            daysLabel.textContent = 'days';

            daysSection.appendChild(daysValue);
            daysSection.appendChild(daysLabel);

            const practicedLabel = document.createElement('div');
            practicedLabel.className = 'stat-practiced-label';
            practicedLabel.textContent = 'PRACTICED';

            // Time section
            const timeSection = document.createElement('div');
            timeSection.className = 'stat-time-section';

            const timeValue = document.createElement('div');
            timeValue.className = 'stat-time-value';

            const hours = document.createElement('span');
            hours.id = hoursId;
            hours.textContent = '0h';

            const minutes = document.createElement('span');
            minutes.id = minutesId;
            minutes.textContent = '0m';

            timeValue.appendChild(hours);
            timeValue.appendChild(document.createTextNode(' '));
            timeValue.appendChild(minutes);

            const totalTimeLabel = document.createElement('div');
            totalTimeLabel.className = 'stat-total-time-label';
            totalTimeLabel.textContent = 'TOTAL TIME';

            timeSection.appendChild(timeValue);
            timeSection.appendChild(totalTimeLabel);

            box.appendChild(daysSection);
            box.appendChild(practicedLabel);
            box.appendChild(timeSection);

            return box;
        };

        // Create This Month box
        statsBoxes.appendChild(createStatBox('monthPracticeDays', 'monthHours', 'monthMinutes'));

        // Create All Time box
        statsBoxes.appendChild(createStatBox('totalPracticeDays', 'totalHours', 'totalMinutes'));

        stats.appendChild(statsBoxes);
        calendarPage.appendChild(stats);

        // Create streak display
        const streakDisplay = document.createElement('div');
        streakDisplay.className = 'streak-display';
        streakDisplay.id = 'streakDisplay';
        calendarPage.appendChild(streakDisplay);

        // Append to container
        targetContainer.appendChild(calendarPage);

        // Set global reference for onclick handlers
        window.calendarInstance = this;

        // Don't render calendar days here - it will be rendered by loadPracticeData -> updateCalendar
        this.updateStreakDisplay();
        this.ensureModalsExist();
    }

    ensureModalsExist() {
        // Remove existing modals to avoid conflicts
        const existingGoalModal = document.getElementById('goalModal');
        const existingDayModal = document.getElementById('dayDetailModal');
        if (existingGoalModal) existingGoalModal.remove();
        if (existingDayModal) existingDayModal.remove();

        // Create goal modal
        const goalModal = document.createElement('div');
        goalModal.className = 'modal';
        goalModal.id = 'goalModal';

        const goalContent = document.createElement('div');
        goalContent.className = 'modal-content';

        const goalCloseBtn = document.createElement('span');
        goalCloseBtn.className = 'close-btn';
        goalCloseBtn.textContent = '×';
        goalCloseBtn.onclick = () => window.calendarInstance?.hideGoalModal();
        goalContent.appendChild(goalCloseBtn);

        const goalH3 = document.createElement('h3');
        goalH3.textContent = 'Set Daily Practice Goals';
        goalContent.appendChild(goalH3);

        const goalP = document.createElement('p');
        goalP.textContent =
            'Set up to 4 practice area goals. Each completed goal will fill one quadrant of the calendar day.';
        goalContent.appendChild(goalP);

        const goalForm = document.createElement('div');
        goalForm.id = 'goalForm';

        const goalInputs = document.createElement('div');
        goalInputs.className = 'goal-inputs';
        goalInputs.id = 'goalInputs';
        goalForm.appendChild(goalInputs);

        const goalFormActions = document.createElement('div');
        goalFormActions.className = 'goal-form-actions';

        const addBtn = document.createElement('button');
        addBtn.className = 'btn btn-secondary';
        addBtn.type = 'button';
        addBtn.onclick = () => window.calendarInstance?.addGoalInput();

        const addIcon = document.createElement('i');
        addIcon.className = 'icon';
        addIcon.textContent = '➕';
        addBtn.appendChild(addIcon);
        addBtn.appendChild(document.createTextNode(' Add Practice Area'));

        goalFormActions.appendChild(addBtn);
        goalForm.appendChild(goalFormActions);

        const modalActions = document.createElement('div');
        modalActions.className = 'modal-actions';

        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-primary';
        saveBtn.id = 'saveGoalsBtn';
        saveBtn.type = 'button';
        saveBtn.textContent = 'Save Goals';
        // Event handler will be attached in CalendarTab.js
        modalActions.appendChild(saveBtn);

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.id = 'cancelGoalsBtn';
        cancelBtn.type = 'button';
        cancelBtn.textContent = 'Cancel';
        // Event handler will be attached in CalendarTab.js
        modalActions.appendChild(cancelBtn);

        goalForm.appendChild(modalActions);
        goalContent.appendChild(goalForm);
        goalModal.appendChild(goalContent);

        // Create day detail modal
        const dayModal = document.createElement('div');
        dayModal.className = 'modal';
        dayModal.id = 'dayDetailModal';

        const dayContent = document.createElement('div');
        dayContent.className = 'modal-content';

        const dayCloseBtn = document.createElement('span');
        dayCloseBtn.className = 'close-btn';
        dayCloseBtn.textContent = '×';
        dayCloseBtn.onclick = () => window.calendarInstance?.hideDayModal();
        dayContent.appendChild(dayCloseBtn);

        const modalDate = document.createElement('h3');
        modalDate.id = 'modalDate';
        dayContent.appendChild(modalDate);

        const modalContent = document.createElement('div');
        modalContent.id = 'modalContent';
        dayContent.appendChild(modalContent);

        dayModal.appendChild(dayContent);

        // Append modals to body
        document.body.appendChild(goalModal);
        document.body.appendChild(dayModal);
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

    async renderCalendarDays() {
        const grid = document.getElementById('calendarGrid');
        if (!grid) return;

        // Clear existing days
        grid.textContent = '';

        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach((day) => {
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
            if (
                day === today.getDate() &&
                this.currentMonth === today.getMonth() &&
                this.currentYear === today.getFullYear()
            ) {
                dayElement.classList.add('today');
            }

            // Get practice info for this date
            const practiceInfo = this.getPracticeInfoForDate(dateStr);

            // Calculate total daily goal minutes
            const totalGoalMinutes = this.dailyGoals.reduce(
                (sum, goal) => sum + (goal.minutes || 0),
                0
            );
            const totalPracticeMinutes = Math.floor(practiceInfo.totalTime / 60);

            // Calculate percentage for progress circle
            const progressPercentage =
                totalGoalMinutes > 0
                    ? Math.min((totalPracticeMinutes / totalGoalMinutes) * 100, 100)
                    : 0;

            // Add day number (always at top-left, not in wrapper)
            const dayNumber = document.createElement('div');
            dayNumber.className = 'calendar-day-number';
            dayNumber.textContent = day;
            dayElement.appendChild(dayNumber);

            // Learning badges hidden until feature is ready
            // const hasLearningSession = await this.checkLearningSessionForDate(dateStr);
            // if (hasLearningSession) {
            //     const learningBadge = document.createElement('div');
            //     learningBadge.className = 'learning-badge';
            //     learningBadge.innerHTML = '🎓';
            //     learningBadge.title = 'Learning plan session scheduled';
            //     dayElement.appendChild(learningBadge);
            // }

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
                minutesText.style.cssText = `
                    position: relative;
                    z-index: 2;
                    font-weight: bold;
                    font-size: 14px;
                `;

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
                            const completion = goalCompletions.find((gc) => gc.area === goal.area);

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
            dayElement.setAttribute(
                'onclick',
                `window.calendarInstance?.showDayPopup('${dateStr}', event)`
            );

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
        svg.style.cssText = 'position: absolute; top: 0; left: 0; z-index: 1;';

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
        progressCircle.style.transition = 'stroke-dashoffset 0.3s ease';

        svg.appendChild(bgCircle);
        svg.appendChild(progressCircle);

        return svg;
    }

    showDayPopup(dateStr, event) {
        // Remove any existing popup and overlay
        const existingPopup = document.querySelector('.session-popup');
        const existingOverlay = document.querySelector('.session-popup-overlay');
        if (existingPopup) existingPopup.remove();
        if (existingOverlay) existingOverlay.remove();

        const practiceInfo = this.getPracticeInfoForDate(dateStr);
        const date = new Date(dateStr + 'T00:00:00');

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'session-popup-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
            animation: fadeIn 0.2s ease;
        `;
        overlay.onclick = () => {
            overlay.remove();
            popup.remove();
        };

        const popup = document.createElement('div');
        popup.className = 'session-popup';

        const dateFormatted = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        if (!practiceInfo.practiced) {
            // Clear popup
            popup.textContent = '';

            // Create header
            const header = document.createElement('div');
            header.className = 'session-popup-header';

            const h4 = document.createElement('h4');
            h4.textContent = dateFormatted;
            header.appendChild(h4);

            const closeBtn = document.createElement('button');
            closeBtn.className = 'session-popup-close';
            closeBtn.textContent = '×';
            closeBtn.onclick = () => {
                document.querySelector('.session-popup-overlay')?.remove();
                popup.remove();
            };
            header.appendChild(closeBtn);
            popup.appendChild(header);

            // Create no practice message
            const p = document.createElement('p');
            p.style.cssText = 'color: var(--text-secondary); text-align: center; padding: 1rem;';
            p.textContent = 'No practice recorded for this day';
            popup.appendChild(p);
        } else {
            // Clear popup
            popup.textContent = '';

            // Create header
            const header = document.createElement('div');
            header.className = 'session-popup-header';

            const h4 = document.createElement('h4');
            h4.textContent = dateFormatted;
            header.appendChild(h4);

            const closeBtn = document.createElement('button');
            closeBtn.className = 'session-popup-close';
            closeBtn.textContent = '×';
            closeBtn.onclick = () => {
                document.querySelector('.session-popup-overlay')?.remove();
                popup.remove();
            };
            header.appendChild(closeBtn);
            popup.appendChild(header);

            // Create session list
            const sessionList = document.createElement('div');
            sessionList.className = 'session-list';

            // Create summary
            const summary = document.createElement('div');
            summary.style.marginBottom = '1rem';

            const strong = document.createElement('strong');
            strong.textContent = `Total: ${TimeUtils.formatDuration(practiceInfo.totalTime, true)}`;
            summary.appendChild(strong);
            summary.appendChild(
                document.createTextNode(
                    ` (${practiceInfo.sessions.length} session${practiceInfo.sessions.length > 1 ? 's' : ''})`
                )
            );
            sessionList.appendChild(summary);

            // Create session items
            practiceInfo.sessions.forEach((session) => {
                const time = new Date(session.date).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                });

                const sessionItem = document.createElement('div');
                sessionItem.className = 'session-item';

                const sessionTime = document.createElement('div');
                sessionTime.className = 'session-time';
                sessionTime.textContent = `${time} - ${TimeUtils.formatDuration(session.duration || 0, true)}`;
                sessionItem.appendChild(sessionTime);

                const sessionArea = document.createElement('div');
                sessionArea.className = 'session-area';
                sessionArea.textContent = session.practiceArea || 'General Practice';
                sessionItem.appendChild(sessionArea);

                if (session.notes) {
                    const details = document.createElement('div');
                    details.className = 'session-details';
                    details.textContent = session.notes;
                    sessionItem.appendChild(details);
                }

                if (session.bpm) {
                    const tempoDetails = document.createElement('div');
                    tempoDetails.className = 'session-details';
                    tempoDetails.textContent = `Tempo: ${session.bpm} BPM`;
                    sessionItem.appendChild(tempoDetails);
                }

                sessionList.appendChild(sessionItem);
            });

            popup.appendChild(sessionList);
        }

        document.body.appendChild(overlay);
        document.body.appendChild(popup);

        // Remove the old click outside handler since we have overlay
    }

    async loadPracticeData() {
        try {
            // Load practice entries
            this.practiceData = await this.storageService.getPracticeEntries();

            // Load daily goals
            const goals = await this.storageService.getGoals();
            this.dailyGoals = goals.filter((g) => g.type === 'daily');

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
        const allTimeDays = new Set();
        let allTimeTotal = 0;

        this.practiceData.forEach((session) => {
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
        this.practiceData.forEach((session) => {
            const sessionDate = new Date(session.date);
            if (sessionDate >= monthStart && sessionDate <= monthEnd) {
                monthDaysSet.add(this.getLocalDateString(sessionDate));
            }
        });

        // Update display with null checks
        const monthPracticeDaysEl = document.getElementById('monthPracticeDays');
        const totalPracticeDaysEl = document.getElementById('totalPracticeDays');
        const longestStreakEl = document.getElementById('longestStreak');

        if (monthPracticeDaysEl) monthPracticeDaysEl.textContent = monthDaysSet.size;
        if (totalPracticeDaysEl) totalPracticeDaysEl.textContent = allTimeDays.size;

        // Update month time (convert seconds to hours and minutes)
        const monthHours = Math.floor(monthTime / 3600);
        const monthMins = Math.floor((monthTime % 3600) / 60);
        const monthHoursEl = document.getElementById('monthHours');
        const monthMinutesEl = document.getElementById('monthMinutes');
        if (monthHoursEl) monthHoursEl.textContent = `${monthHours}h`;
        if (monthMinutesEl) monthMinutesEl.textContent = `${monthMins}m`;

        // Update all time (convert seconds to hours and minutes)
        const totalHours = Math.floor(allTimeTotal / 3600);
        const totalMins = Math.floor((allTimeTotal % 3600) / 60);
        const totalHoursEl = document.getElementById('totalHours');
        const totalMinutesEl = document.getElementById('totalMinutes');
        if (totalHoursEl) totalHoursEl.textContent = `${totalHours}h`;
        if (totalMinutesEl) totalMinutesEl.textContent = `${totalMins}m`;

        // Calculate longest streak
        const streak = this.calculateLongestStreak();
        if (longestStreakEl) longestStreakEl.textContent = streak;

        // Update streak display
        this.updateStreakDisplay();
    }

    calculateLongestStreak() {
        if (this.practiceData.length === 0) return 0;

        // Get unique practice dates
        const practiceDates = new Set();
        this.practiceData.forEach((session) => {
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

        // Clear container
        container.textContent = '';

        // Create streak header
        const h3 = document.createElement('h3');
        h3.textContent = `Current Streak: ${currentStreak} days`;
        container.appendChild(h3);

        // Create badges container
        const badgesDiv = document.createElement('div');
        badgesDiv.className = 'badges';

        // Create each badge
        badges.forEach((badge) => {
            const badgeDiv = document.createElement('div');
            badgeDiv.className = 'badge';
            if (badge.earned) {
                badgeDiv.classList.add('earned');
            }

            const icon = document.createElement('span');
            icon.className = 'badge-icon';
            icon.textContent = badge.icon;
            badgeDiv.appendChild(icon);

            const labelSpan = document.createElement('span');
            labelSpan.className = 'badge-label';

            // Handle line breaks in label
            const labelParts = badge.label.split('\n');
            labelParts.forEach((part, index) => {
                if (index > 0) {
                    labelSpan.appendChild(document.createElement('br'));
                }
                labelSpan.appendChild(document.createTextNode(part));
            });

            badgeDiv.appendChild(labelSpan);
            badgesDiv.appendChild(badgeDiv);
        });

        container.appendChild(badgesDiv);
    }

    calculateCurrentStreak() {
        if (this.practiceData.length === 0) return 0;

        // Get all practice dates
        const practiceDates = new Set();
        this.practiceData.forEach((session) => {
            const date = this.getLocalDateString(new Date(session.date));
            practiceDates.add(date);
        });

        // Sort dates in descending order (most recent first)
        const sortedDates = Array.from(practiceDates).sort((a, b) => new Date(b) - new Date(a));

        if (sortedDates.length === 0) return 0;

        // Get today's date and yesterday's date
        const today = this.getLocalDateString(new Date());
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = this.getLocalDateString(yesterday);

        // Check if practiced today or yesterday
        const practicedToday = practiceDates.has(today);
        const practicedYesterday = practiceDates.has(yesterdayStr);

        // If didn't practice today or yesterday, streak is 0
        if (!practicedToday && !practicedYesterday) {
            return 0;
        }

        // Start counting from the most recent practice day (today or yesterday)
        let streak = 0;
        const checkDate = new Date();

        // If practiced today, start from today; otherwise start from yesterday
        if (!practicedToday) {
            checkDate.setDate(checkDate.getDate() - 1);
        }

        // Count backwards from the starting date
        while (practiceDates.has(this.getLocalDateString(checkDate))) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        }

        return streak;
    }

    getStreakBadges(currentStreak) {
        const badges = [
            { days: 1, icon: '🎸', label: '1 Day\nStreak' },
            { days: 3, icon: '🔥', label: '3 Day\nStreak' },
            { days: 7, icon: '🗓️', label: '7 Day\nStreak' },
            { days: 10, icon: '🔟', label: '10 Day\nStreak' },
            { days: 14, icon: '💪', label: '14 Day\nStreak' },
            { days: 21, icon: '💎', label: '21 Day\nStreak' },
            { days: 30, icon: '📅', label: '30 Day\nStreak' },
            { days: 45, icon: '🌟', label: '45 Day\nStreak' },
            { days: 60, icon: '👑', label: '60 Day\nStreak' },
            { days: 90, icon: '🏆', label: '90 Day\nStreak' },
            { days: 100, icon: '💫', label: '100 Day\nStreak' },
            { days: 150, icon: '🏅', label: '150 Day\nStreak' },
            { days: 180, icon: '🌟', label: '180 Day\nStreak' },
            { days: 200, icon: '⚡', label: '200 Day\nStreak' },
            { days: 250, icon: '🚀', label: '250 Day\nStreak' },
            { days: 300, icon: '🌠', label: '300 Day\nStreak' },
            { days: 365, icon: '🎖️', label: '365 Day\nStreak' },
            { days: 500, icon: '🧘', label: '500 Day\nStreak' }
        ];

        return badges.map((badge) => ({
            ...badge,
            earned: currentStreak >= badge.days
        }));
    }

    getPracticeInfoForDate(dateStr) {
        const sessions = this.practiceData.filter((session) => {
            const sessionDate = this.getLocalDateString(new Date(session.date));
            return sessionDate === dateStr;
        });

        if (sessions.length === 0) {
            return { practiced: false };
        }

        const totalTime = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
        const areas = {};

        // Calculate total time per practice area (case-insensitive)
        sessions.forEach((session) => {
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

    // Modal methods
    async showGoalModal() {
        const modal = document.getElementById('goalModal');
        const container = document.getElementById('goalInputs');

        if (!modal || !container) {
            console.error('Goal modal elements not found');
            return;
        }

        // Reload session areas to ensure they're up to date
        await this.loadSessionAreas();

        // Clear and populate inputs
        container.textContent = '';

        // Add goal inputs
        if (this.dailyGoals.length > 0) {
            this.dailyGoals.forEach((goal) => this.addGoalInput(goal));
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

        // Create minutes input
        const minutesInput = document.createElement('input');
        minutesInput.type = 'number';
        minutesInput.className = 'goal-minutes-input';
        minutesInput.placeholder = 'Min';
        minutesInput.min = '1';
        minutesInput.max = '180';
        if (existingGoal) {
            minutesInput.value = existingGoal.minutes;
        }
        goalDiv.appendChild(minutesInput);

        // Create select element
        const select = document.createElement('select');
        select.className = 'goal-area-select';

        // Create default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select practice area';
        select.appendChild(defaultOption);

        // Create options for each practice area
        this.practiceAreas.forEach((area) => {
            const option = document.createElement('option');
            option.value = area;
            option.textContent = area;
            if (existingGoal && existingGoal.area === area) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        goalDiv.appendChild(select);

        // Create remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-sm btn-danger remove-goal-btn';
        removeBtn.type = 'button';
        removeBtn.textContent = '✕';
        removeBtn.onclick = () => {
            goalDiv.remove();
            window.calendarInstance?.updateAddButton();
        };
        goalDiv.appendChild(removeBtn);

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
            const otherGoals = allGoals.filter((g) => g.type !== 'daily');
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

    async checkLearningSessionForDate(dateStr) {
        try {
            const currentPlan = await this.storageService.getCurrentLearningPlan();
            if (!currentPlan || !currentPlan.weeks) return false;

            // Get the start date of the plan
            const planStartDate = new Date(currentPlan.createdAt);
            const checkDate = new Date(dateStr);

            // Calculate which week and session this date would be
            const daysSinceStart = Math.floor((checkDate - planStartDate) / (1000 * 60 * 60 * 24));
            const weekIndex = Math.floor(daysSinceStart / 7);
            const sessionInWeek = daysSinceStart % currentPlan.sessionsPerWeek;

            // Check if this date falls within the plan and has a session
            if (weekIndex >= 0 && weekIndex < currentPlan.weeks.length) {
                const week = currentPlan.weeks[weekIndex];
                return sessionInWeek < week.sessions.length;
            }

            return false;
        } catch (error) {
            console.error('Error checking learning session:', error);
            return false;
        }
    }

    destroy() {
        // Clean up global reference
        if (window.calendarInstance === this) {
            window.calendarInstance = null;
        }

        // Remove event listener
        if (this.sessionAreasHandler) {
            window.removeEventListener('sessionAreasUpdated', this.sessionAreasHandler);
        }

        // Remove modals created by this instance
        const goalModal = document.getElementById('goalModal');
        const dayModal = document.getElementById('dayDetailModal');
        if (goalModal) goalModal.remove();
        if (dayModal) dayModal.remove();

        this.isInitialized = false;
    }
}

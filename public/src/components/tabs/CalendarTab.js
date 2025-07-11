// CalendarTab Component - Fixed version
export class CalendarTab {
    constructor(storageService) {
        this.storageService = storageService;
        this.container = null;
        this.calendar = null;
    }

    render(container) {
        this.container = container;
        this.container.innerHTML = `<div id="calendarContainer"></div>`;

        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
            this.initializeComponents();
        }, 0);
    }

    async initializeComponents() {
        const calendarContainer = document.getElementById('calendarContainer');
        if (calendarContainer) {
            try {
                // Fixed import path - calendar.js is in pages directory
                const { CalendarPage } = await import('../../pages/calendar.js');
                this.calendar = new CalendarPage(this.storageService);

                // Initialize calendar in the container
                await this.calendar.init(calendarContainer);

                // Force re-attach event listeners after a small delay
                setTimeout(() => {
                    if (this.calendar && this.calendar.attachEventListeners) {
                        this.calendar.attachEventListeners();
                    }
                }, 100);

            } catch (error) {
                console.error('Error loading calendar:', error);
                calendarContainer.innerHTML = '<div class="error-state">Failed to load calendar</div>';
            }
        }
    }

    attachModalEventListeners() {
        // Calendar.js doesn't have this method, so we'll handle it here
        const goalModal = document.getElementById('goalModal');
        const dayModal = document.getElementById('dayDetailModal');

        if (goalModal) {
            // Add event listeners for goal modal buttons
            const saveBtn = document.getElementById('saveGoalsBtn');
            const cancelBtn = document.getElementById('cancelGoalsBtn');
            const addGoalBtn = document.getElementById('addGoalAreaBtn');
            const closeBtn = document.getElementById('closeGoalModalBtn');

            if (saveBtn) saveBtn.onclick = () => this.calendar?.saveGoals();
            if (cancelBtn) cancelBtn.onclick = () => this.calendar?.hideGoalModal();
            if (closeBtn) closeBtn.onclick = () => this.calendar?.hideGoalModal();
            if (addGoalBtn) addGoalBtn.onclick = () => this.calendar?.addGoalInput();
        }

        if (dayModal) {
            const closeBtn = document.getElementById('closeModalBtn');
            if (closeBtn) closeBtn.onclick = () => this.calendar?.hideDayModal();
        }
    }

    // Fix for CalendarTab.js - attachEventListeners method
    attachEventListeners() {
        console.log('CalendarTab attachEventListeners called');
        // Don't attach listeners here - let the calendar handle its own
    }

    onActivate() {
        if (this.calendar?.refresh) {
            this.calendar.refresh();
        }

        // Re-attach event listeners when tab is activated
        setTimeout(() => {
            if (this.calendar && this.calendar.attachEventListeners) {
                this.calendar.attachEventListeners();
            }
        }, 100);
    }

    destroy() {
        if (this.calendar?.destroy) {
            this.calendar.destroy();
        }
        this.calendar = null;
        this.container = null;
    }
}
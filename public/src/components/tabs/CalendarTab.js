// CalendarTab Component - Handles the calendar view
export class CalendarTab {
    constructor(storageService) {
        this.storageService = storageService;
        this.container = null;
        this.calendar = null;
    }

    render(container) {
        this.container = container;

        this.container.innerHTML = `
            <div class="calendar-layout">
                <div id="calendarContainer"></div>
            </div>
        `;

        this.initializeComponents();
    }

    async initializeComponents() {
        const calendarContainer = document.getElementById('calendarContainer');
        if (calendarContainer) {
            console.log('Loading calendar...');
            try {
                const { CalendarPage } = await import('../../pages/calendar.js');
                this.calendar = new CalendarPage(this.storageService);
                this.calendar.init(calendarContainer);
            } catch (error) {
                console.error('Error loading calendar:', error);
                calendarContainer.innerHTML = '<div class="error-state">Failed to load calendar</div>';
            }
        }
    }

    onActivate() {
        // Refresh calendar when tab becomes active
        if (this.calendar && this.calendar.refresh) {
            this.calendar.refresh();
        }
    }

    onDeactivate() {
        // Called when leaving this tab
    }

    destroy() {
        if (this.calendar && typeof this.calendar.destroy === 'function') {
            this.calendar.destroy();
        }
        this.calendar = null;
        this.container = null;
    }
}
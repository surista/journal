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
        this.initializeComponents();
    }

    async initializeComponents() {
        const calendarContainer = document.getElementById('calendarContainer');
        if (calendarContainer) {
            try {
                const { CalendarPage } = await import('../../pages/calendar.js');
                this.calendar = new CalendarPage(this.storageService);

                // Initialize calendar in the container
                await this.calendar.init(calendarContainer);

                // Fix modal z-index for tab environment
                this.fixModalZIndex();

            } catch (error) {
                console.error('Error loading calendar:', error);
                calendarContainer.innerHTML = '<div class="error-state">Failed to load calendar</div>';
            }
        }
    }

    fixModalZIndex() {
        // Add styles to ensure modals work in tab environment
        const style = document.createElement('style');
        style.textContent = `
            .calendar-page .modal {
                z-index: 999999 !important;
                position: fixed !important;
            }
            .calendar-page .modal-content {
                z-index: 1000000 !important;
            }
        `;
        document.head.appendChild(style);
    }

    onActivate() {
        if (this.calendar?.refresh) {
            this.calendar.refresh();
        }
    }

    destroy() {
        if (this.calendar?.destroy) {
            this.calendar.destroy();
        }
        this.calendar = null;
        this.container = null;
    }
}
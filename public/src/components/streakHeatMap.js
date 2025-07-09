export class StreakHeatMap {
    constructor(container, storageService) {
        this.container = container;
        this.storageService = storageService;
        this.practiceData = {};
    }

    async render() {
        if (!this.container) return;
        await this.loadPracticeData();

        this.container.innerHTML = `
            <div class="streak-heatmap">
                <div class="heatmap-grid">
                    ${this.generateHeatmapGrid()}
                </div>
            </div>
        `;
    }

    async loadPracticeData() {
        try {
            const entries = await this.storageService.getPracticeEntries();
            this.practiceData = {};

            entries.forEach(entry => {
                const date = new Date(entry.date).toDateString();
                if (!this.practiceData[date]) {
                    this.practiceData[date] = { count: 0, duration: 0 };
                }
                this.practiceData[date].count++;
                this.practiceData[date].duration += entry.duration || 0;
            });
        } catch (error) {
            console.error('Error loading practice data:', error);
        }
    }

    generateHeatmapGrid() {
        const today = new Date();
        const days = [];

        for (let i = 83; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            days.push(date);
        }

        return days.map(date => {
            const dateStr = date.toDateString();
            const dayData = this.practiceData[dateStr];
            const hasPractice = dayData && dayData.count > 0;

            return `<div class="heatmap-day ${hasPractice ? 'has-practice' : ''}" title="${dateStr}${hasPractice ? ` - ${dayData.count} session(s)` : ' - No practice'}"></div>`;
        }).join('');
    }

    destroy() {}
}
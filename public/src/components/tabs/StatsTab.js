// StatsTab Component - Handles the statistics tab
export class StatsTab {
    constructor(storageService) {
        this.storageService = storageService;
        this.container = null;
        this.statsPanel = null;
    }

    render(container) {
        this.container = container;

        this.container.innerHTML = `
            <div class="stats-layout">
                <div id="statsContainer"></div>
            </div>
        `;

        this.initializeComponents();
    }

    async initializeComponents() {
        const statsContainer = document.getElementById('statsContainer');
        if (statsContainer) {
            try {
                // Lazy load the StatsPanel component
                const { StatsPanel } = await import('../statsPanel.js');
                this.statsPanel = new StatsPanel(statsContainer, this.storageService);
                this.statsPanel.render();
            } catch (error) {
                console.error('Error initializing Stats Panel:', error);
                statsContainer.innerHTML = '<div class="error-state">Failed to load statistics</div>';
            }
        }
    }

    onActivate() {
        // Called when tab becomes active
        if (this.statsPanel && this.statsPanel.refresh) {
            this.statsPanel.refresh();
        }
    }

    onDeactivate() {
        // Called when leaving this tab
        // Clean up if needed
    }

    destroy() {
        if (this.statsPanel && typeof this.statsPanel.destroy === 'function') {
            this.statsPanel.destroy();
        }
        this.statsPanel = null;
        this.container = null;
    }
}
// StatsTab Component - Handles the statistics tab
export class StatsTab {
    constructor(storageService) {
        this.storageService = storageService;
        this.container = null;
        this.statsPanel = null;
        this.achievementBadges = null;
    }

    render(container) {
        this.container = container;

        this.container.innerHTML = `
            <div class="stats-layout">
                <div id="statsContainer"></div>
                <div id="achievementsContainer"></div>
            </div>
        `;

        this.initializeComponents();
    }

    async initializeComponents() {
        const statsContainer = document.getElementById('statsContainer');
        const achievementsContainer = document.getElementById('achievementsContainer');

        // Load StatsPanel
        if (statsContainer) {
            try {
                // Lazy load the StatsPanel component
                const { StatsPanel } = await import('../statsPanel.js');
                this.statsPanel = new StatsPanel(statsContainer, this.storageService);
                this.statsPanel.render();
            } catch (error) {
                console.error('Error initializing Stats Panel:', error);
                statsContainer.innerHTML =
                    '<div class="error-state">Failed to load statistics</div>';
            }
        }

        // Load AchievementBadges
        if (achievementsContainer) {
            try {
                // Lazy load the AchievementBadges component
                const { AchievementBadges } = await import('../achievementBadges.js');
                this.achievementBadges = new AchievementBadges(
                    achievementsContainer,
                    this.storageService
                );
                await this.achievementBadges.render();
            } catch (error) {
                console.error('Error initializing Achievement Badges:', error);
                achievementsContainer.innerHTML =
                    '<div class="error-state">Failed to load achievements</div>';
            }
        }
    }

    onActivate() {
        // Called when tab becomes active
        if (this.statsPanel && this.statsPanel.refresh) {
            this.statsPanel.refresh();
        }
        if (this.achievementBadges && this.achievementBadges.render) {
            this.achievementBadges.render();
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
        if (this.achievementBadges && typeof this.achievementBadges.destroy === 'function') {
            this.achievementBadges.destroy();
        }
        this.statsPanel = null;
        this.achievementBadges = null;
        this.container = null;
    }
}

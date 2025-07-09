// GoalsTab Component - Handles the goals and achievements tab
export class GoalsTab {
    constructor(storageService) {
        this.storageService = storageService;
        this.container = null;
        this.goalsList = null;
        this.achievements = null;
    }

    render(container) {
        this.container = container;

        this.container.innerHTML = `
            <div class="goals-layout">
                <div class="goals-main">
                    <div id="goalsListContainer"></div>
                </div>
                <div class="goals-sidebar">
                    <div id="achievementsContainer"></div>
                </div>
            </div>
        `;

        this.initializeComponents();
    }

    async initializeComponents() {
        // Initialize Goals List
        const goalsContainer = document.getElementById('goalsListContainer');
        if (goalsContainer) {
            try {
                const { GoalsList } = await import('../goalsList.js');
                this.goalsList = new GoalsList(goalsContainer, this.storageService);
                this.goalsList.render();
            } catch (error) {
                console.error('Error initializing Goals List:', error);
                goalsContainer.innerHTML = '<div class="error-state">Failed to load goals</div>';
            }
        }

        // Initialize Achievements
        const achievementsContainer = document.getElementById('achievementsContainer');
        if (achievementsContainer) {
            try {
                const { AchievementBadges } = await import('../achievementBadges.js');
                this.achievements = new AchievementBadges(achievementsContainer, this.storageService);
                this.achievements.render();
            } catch (error) {
                console.error('Error initializing Achievement Badges:', error);
                achievementsContainer.innerHTML = '<div class="error-state">Failed to load achievements</div>';
            }
        }
    }

    onActivate() {
        // Refresh data when tab becomes active
        if (this.goalsList && this.goalsList.refresh) {
            this.goalsList.refresh();
        }
        if (this.achievements && this.achievements.checkAchievements) {
            this.achievements.checkAchievements();
        }
    }

    onDeactivate() {
        // Called when leaving this tab
    }

    destroy() {
        if (this.goalsList && typeof this.goalsList.destroy === 'function') {
            this.goalsList.destroy();
        }
        if (this.achievements && typeof this.achievements.destroy === 'function') {
            this.achievements.destroy();
        }
        this.goalsList = null;
        this.achievements = null;
        this.container = null;
    }
}
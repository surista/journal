// Practice Recommendations Component
import { getRecommendationService } from '../services/recommendationService.js';

export class PracticeRecommendations {
    constructor(storageService) {
        this.storageService = storageService;
        this.recommendationService = getRecommendationService(storageService);
        this.container = null;
        this.recommendations = null;
    }

    async init(container) {
        this.container = container;
        await this.loadRecommendations();
        this.render();
    }

    async loadRecommendations() {
        try {
            this.recommendations = await this.recommendationService.getRecommendations();
        } catch (error) {
            console.error('Error loading recommendations:', error);
            this.recommendations = { repertoire: [], goals: [], general: [] };
        }
    }

    render() {
        if (!this.container) return;

        const hasRecommendations =
            this.recommendations.repertoire.length > 0 ||
            this.recommendations.goals.length > 0 ||
            this.recommendations.general.length > 0;

        if (!hasRecommendations) {
            this.container.innerHTML = '';
            return;
        }

        this.container.innerHTML = `
            <div class="practice-recommendations">
                <h3 class="recommendations-title">
                    <span class="icon">💡</span> Today's Practice Suggestions
                </h3>
                
                ${this.renderRepertoireRecommendations()}
                ${this.renderGoalRecommendations()}
                ${this.renderGeneralRecommendations()}
            </div>
        `;

        this.attachEventListeners();
    }

    renderRepertoireRecommendations() {
        if (this.recommendations.repertoire.length === 0) return '';

        return `
            <div class="recommendation-section">
                <h4 class="section-title">📚 Repertoire Focus</h4>
                <div class="recommendation-cards">
                    ${this.recommendations.repertoire
                        .map(
                            (rec) => `
                        <div class="recommendation-card repertoire-card">
                            <h5>${rec.title}</h5>
                            <p class="recommendation-desc">${rec.description}</p>
                            <div class="exercise-list">
                                ${rec.exercises
                                    .map(
                                        (ex) => `
                                    <div class="exercise-item">
                                        <span class="exercise-name">${ex.name}</span>
                                        <span class="exercise-duration">${ex.duration}min</span>
                                    </div>
                                `
                                    )
                                    .join('')}
                            </div>
                            <button class="btn btn-sm btn-primary start-practice-btn" 
                                    data-type="repertoire" 
                                    data-item="${rec.relatedItem.id}">
                                Start Practice
                            </button>
                        </div>
                    `
                        )
                        .join('')}
                </div>
            </div>
        `;
    }

    renderGoalRecommendations() {
        if (this.recommendations.goals.length === 0) return '';

        return `
            <div class="recommendation-section">
                <h4 class="section-title">🎯 Goal Exercises</h4>
                <div class="recommendation-cards">
                    ${this.recommendations.goals
                        .map(
                            (rec) => `
                        <div class="recommendation-card goal-card">
                            <h5>${rec.title}</h5>
                            <p class="recommendation-desc">${rec.description}</p>
                            <div class="exercise-list">
                                ${rec.exercises
                                    .map(
                                        (ex) => `
                                    <div class="exercise-item">
                                        <span class="exercise-name">${ex.name}</span>
                                        <span class="exercise-duration">${ex.duration}min</span>
                                    </div>
                                `
                                    )
                                    .join('')}
                            </div>
                            <div class="recommendation-footer">
                                <span class="total-duration">Total: ${rec.estimatedDuration}min</span>
                                <button class="btn btn-sm btn-primary start-practice-btn" 
                                        data-type="goal" 
                                        data-exercises='${JSON.stringify(rec.exercises)}'>
                                    Start Routine
                                </button>
                            </div>
                        </div>
                    `
                        )
                        .join('')}
                </div>
            </div>
        `;
    }

    renderGeneralRecommendations() {
        if (this.recommendations.general.length === 0) return '';

        return `
            <div class="recommendation-section">
                <h4 class="section-title">🎸 General Practice</h4>
                <div class="recommendation-cards">
                    ${this.recommendations.general
                        .map(
                            (rec) => `
                        <div class="recommendation-card ${rec.type}-card">
                            <div class="card-header">
                                <h5>${rec.title}</h5>
                                ${rec.priority ? `<span class="priority priority-${rec.priority}">${rec.priority}</span>` : ''}
                            </div>
                            <p class="recommendation-desc">${rec.description}</p>
                            <div class="exercise-list">
                                ${rec.exercises
                                    .map(
                                        (ex) => `
                                    <div class="exercise-item">
                                        <span class="exercise-name">${ex.name}</span>
                                        <span class="exercise-meta">
                                            <span class="exercise-focus">${ex.focus}</span>
                                            <span class="exercise-duration">${ex.duration}min</span>
                                        </span>
                                    </div>
                                `
                                    )
                                    .join('')}
                            </div>
                        </div>
                    `
                        )
                        .join('')}
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Handle start practice buttons
        this.container.querySelectorAll('.start-practice-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;

                if (type === 'repertoire') {
                    // Navigate to repertoire tab with item selected
                    const itemId = e.target.dataset.item;
                    window.location.hash = '#repertoire';
                    // Dispatch event to select the item
                    window.dispatchEvent(
                        new CustomEvent('selectRepertoireItem', {
                            detail: { itemId }
                        })
                    );
                } else if (type === 'goal') {
                    // Start practice session with these exercises
                    const exercises = JSON.parse(e.target.dataset.exercises);
                    this.startExerciseRoutine(exercises);
                }
            });
        });
    }

    startExerciseRoutine(exercises) {
        // Create a practice session focused on these exercises
        window.dispatchEvent(
            new CustomEvent('startExerciseRoutine', {
                detail: { exercises }
            })
        );

        // Show notification
        this.showNotification('Exercise routine started! Check the timer.', 'success');
    }

    showNotification(message, type = 'info') {
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
            animation: slideInRight 0.3s ease;
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    async refresh() {
        await this.loadRecommendations();
        this.render();
    }

    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// CSS for recommendations (add to components.css)
const recommendationStyles = `
.practice-recommendations {
    margin-bottom: 2rem;
}

.recommendations-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    color: var(--text-primary);
}

.recommendation-section {
    margin-bottom: 2rem;
}

.section-title {
    margin-bottom: 1rem;
    color: var(--text-primary);
}

.recommendation-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
}

.recommendation-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.2s ease;
}

.recommendation-card:hover {
    border-color: var(--primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.repertoire-card {
    border-left: 4px solid var(--primary);
}

.goal-card {
    border-left: 4px solid var(--success);
}

.warmup-card {
    border-left: 4px solid var(--warning);
}

.balance-card {
    border-left: 4px solid var(--info);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.recommendation-card h5 {
    margin: 0 0 0.5rem 0;
    color: var(--text-primary);
}

.recommendation-desc {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin-bottom: 1rem;
}

.exercise-list {
    margin-bottom: 1rem;
}

.exercise-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border-subtle);
}

.exercise-item:last-child {
    border-bottom: none;
}

.exercise-name {
    color: var(--text-primary);
    font-weight: 500;
}

.exercise-meta {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.exercise-focus {
    color: var(--text-secondary);
    font-size: 0.85rem;
    text-transform: capitalize;
}

.exercise-duration {
    color: var(--primary);
    font-size: 0.85rem;
    font-weight: 600;
}

.recommendation-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
}

.total-duration {
    color: var(--text-secondary);
    font-size: 0.9rem;
}

.priority {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
}

.priority-high {
    background: var(--danger-bg);
    color: var(--danger);
}

.priority-medium {
    background: var(--warning-bg);
    color: var(--warning);
}

.priority-low {
    background: var(--info-bg);
    color: var(--info);
}

@media (max-width: 768px) {
    .recommendation-cards {
        grid-template-columns: 1fr;
    }
}
`;

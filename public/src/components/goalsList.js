// Goals List Component - Fixed to handle async storage properly
import {debounce, TimeUtils} from '../utils/helpers.js';
import {notificationManager} from '../services/notificationManager.js';

export class GoalsList {
    constructor(container, storageService) {
        this.container = container;
        this.storageService = storageService;
        this.goals = [];
        this.filteredGoals = [];

        // Debounced search function
        this.debouncedSearch = debounce((searchTerm) => {
            this.filterGoals(searchTerm);
        }, 300);
    }

    async render() {
        this.container.innerHTML = `
            <div class="goals-list">
                <h2 style="margin-bottom: 20px; color: var(--text-secondary);">Practice Goals</h2>
                <div class="goal-form">
                    <div class="goal-search">
                        <input type="text" id="goalSearch" placeholder="Search goals..." 
                               class="form-control" style="margin-bottom: 15px;">
                    </div>
                    <div class="form-group">
                        <input type="text" id="newGoal" placeholder="Add a new practice goal..."
                               onkeypress="if(event.key==='Enter'){this.closest('.goals-list').dispatchEvent(new Event('addGoal'))}">
                    </div>
                    <div class="goal-metrics-row">
                        <div class="form-group" style="flex: 1;">
                            <label for="goalTarget">Target (optional)</label>
                            <input type="number" id="goalTarget" placeholder="e.g., 120" min="0" max="999">
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label for="goalType">Type</label>
                            <select id="goalType">
                                <option value="">None</option>
                                <option value="bpm">BPM</option>
                                <option value="percent">Percent</option>
                                <option value="minutes">Minutes</option>
                                <option value="sessions">Sessions</option>
                            </select>
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label for="goalCurrent">Current</label>
                            <input type="number" id="goalCurrent" placeholder="e.g., 80" min="0" max="999">
                        </div>
                    </div>
                    <button class="btn btn-primary" id="addGoalBtn" style="width: 100%; margin-top: 10px;">
                        ➕ Add Goal
                    </button>
                </div>
                <div class="goals-stats">
                    <div class="goal-stat">
                        <span class="stat-label">Total Goals:</span>
                        <span class="stat-value" id="totalGoals">Loading...</span>
                    </div>
                    <div class="goal-stat">
                        <span class="stat-label">Completed:</span>
                        <span class="stat-value" id="completedGoals">Loading...</span>
                    </div>
                    <div class="goal-stat">
                        <span class="stat-label">Completion Rate:</span>
                        <span class="stat-value" id="completionRate">Loading...</span>
                    </div>
                </div>
                <div id="goalsList">
                    <div style="padding: 2rem; text-align: center; color: #9ca3af;">
                        Loading goals...
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
        await this.loadGoals();
    }

    attachEventListeners() {
        const addBtn = this.container.querySelector('#addGoalBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addGoal());
        }

        // Listen for custom add goal event
        this.container.addEventListener('addGoal', () => this.addGoal());

        // Attach debounced search
        const searchInput = document.getElementById('goalSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.debouncedSearch(e.target.value);
            });
        }

        // Listen for practice session saved events to update progress
        window.addEventListener('practiceSessionSaved', (e) => {
            this.checkGoalProgress(e.detail);
        });
    }

    async addGoal() {
        try {
            const input = document.getElementById('newGoal');
            const goalText = input?.value?.trim();
            const goalTarget = document.getElementById('goalTarget')?.value;
            const goalType = document.getElementById('goalType')?.value;
            const goalCurrent = document.getElementById('goalCurrent')?.value;

            if (!goalText) {
                // Use console.error instead of notificationManager if it's not available
                if (typeof notificationManager !== 'undefined') {
                    notificationManager.error('Please enter a goal!');
                } else {
                    alert('Please enter a goal!');
                }
                return;
            }

            if (goalType && !goalTarget) {
                if (typeof notificationManager !== 'undefined') {
                    notificationManager.error('Please enter a target value!');
                } else {
                    alert('Please enter a target value!');
                }
                return;
            }

            const newGoal = {
                id: Date.now(),
                text: goalText,
                completed: false,
                createdAt: new Date().toISOString(),
                target: goalTarget ? parseInt(goalTarget) : null,
                current: goalCurrent ? parseInt(goalCurrent) : 0,
                type: goalType || null,
                category: this.categorizeGoal(goalText),
                priority: this.calculatePriority(goalText, goalType)
            };

            // Use the fixed saveGoal method
            const success = await this.storageService.saveGoal(newGoal);

            if (!success) {
                throw new Error('Failed to save goal to storage');
            }

            // Reset form
            if (input) input.value = '';
            const targetInput = document.getElementById('goalTarget');
            if (targetInput) targetInput.value = '';
            const typeSelect = document.getElementById('goalType');
            if (typeSelect) typeSelect.value = '';
            const currentInput = document.getElementById('goalCurrent');
            if (currentInput) currentInput.value = '';

            await this.loadGoals();

            if (typeof notificationManager !== 'undefined') {
                notificationManager.success('Goal added! You got this! 🎯');
            } else {
                console.log('Goal added successfully!');
            }
        } catch (error) {
            console.error('Error adding goal:', error);
            if (typeof notificationManager !== 'undefined') {
                notificationManager.error('Failed to add goal. Please try again.');
            } else {
                alert('Failed to add goal: ' + error.message);
            }
        }
    }

    categorizeGoal(goalText) {
        const text = goalText.toLowerCase();
        if (text.includes('scale') || text.includes('mode')) return 'scales';
        if (text.includes('chord') || text.includes('progression')) return 'chords';
        if (text.includes('song') || text.includes('piece')) return 'songs';
        if (text.includes('technique') || text.includes('picking')) return 'technique';
        if (text.includes('theory') || text.includes('understand')) return 'theory';
        if (text.includes('speed') || text.includes('bpm')) return 'speed';
        return 'general';
    }

    calculatePriority(goalText, goalType) {
        // Higher priority for goals with metrics
        let priority = goalType ? 2 : 1;

        // Boost priority for time-sensitive keywords
        const urgentKeywords = ['today', 'this week', 'urgent', 'important', 'asap'];
        if (urgentKeywords.some(keyword => goalText.toLowerCase().includes(keyword))) {
            priority += 2;
        }

        return priority;
    }

    async loadGoals() {
        try {
            console.log('Loading goals...');

            // Get goals from storage (this is async)
            this.goals = await this.storageService.getGoals();

            // Ensure goals is an array
            if (!Array.isArray(this.goals)) {
                console.warn('Goals is not an array:', this.goals);
                this.goals = [];
            }

            console.log('Loaded goals:', this.goals);

            this.filteredGoals = [...this.goals];
            this.updateStats();
            this.renderGoalsList();
        } catch (error) {
            console.error('Error loading goals:', error);
            this.goals = [];
            this.filteredGoals = [];
            this.updateStats();
            this.renderGoalsList();

            // Show error in the goals list
            const goalsList = document.getElementById('goalsList');
            if (goalsList) {
                goalsList.innerHTML = `
                    <div style="padding: 2rem; text-align: center; color: #ef4444;">
                        Error loading goals: ${error.message}
                    </div>
                `;
            }
        }
    }

    updateStats() {
        try {
            const total = this.goals.length;
            const completed = this.goals.filter(g => g.completed).length;
            const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

            const totalElement = document.getElementById('totalGoals');
            if (totalElement) totalElement.textContent = total;

            const completedElement = document.getElementById('completedGoals');
            if (completedElement) completedElement.textContent = completed;

            const rateElement = document.getElementById('completionRate');
            if (rateElement) rateElement.textContent = `${rate}%`;
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    filterGoals(searchTerm) {
        try {
            if (!searchTerm.trim()) {
                this.filteredGoals = [...this.goals];
            } else {
                const term = searchTerm.toLowerCase();
                this.filteredGoals = this.goals.filter(goal =>
                    goal.text.toLowerCase().includes(term) ||
                    (goal.type && goal.type.includes(term)) ||
                    goal.category.includes(term)
                );
            }
            this.renderGoalsList();
        } catch (error) {
            console.error('Error filtering goals:', error);
        }
    }

    renderGoalsList() {
        try {
            const goalsList = document.getElementById('goalsList');
            if (!goalsList) return;

            if (this.filteredGoals.length === 0) {
                const message = this.goals.length === 0
                    ? 'No goals yet. Set your first practice goal!'
                    : 'No goals match your search.';
                goalsList.innerHTML = `<p style="text-align: center; color: var(--text-secondary);">${message}</p>`;
                return;
            }

            // Sort goals by priority and completion status
            const sortedGoals = [...this.filteredGoals].sort((a, b) => {
                // Incomplete goals first
                if (a.completed !== b.completed) return a.completed ? 1 : -1;
                // Then by priority
                if (a.priority !== b.priority) return b.priority - a.priority;
                // Then by creation date
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            goalsList.innerHTML = sortedGoals.map(goal => this.renderGoalItem(goal)).join('');

            // Attach event listeners to goal items
            this.attachGoalItemListeners();
        } catch (error) {
            console.error('Error rendering goals list:', error);
            const goalsList = document.getElementById('goalsList');
            if (goalsList) {
                goalsList.innerHTML = `
                    <div style="padding: 2rem; text-align: center; color: #ef4444;">
                        Error displaying goals
                    </div>
                `;
            }
        }
    }

    renderGoalItem(goal) {
        try {
            let progressHtml = '';
            let metricHtml = '';

            if (goal.type && goal.target) {
                const progress = Math.min(100, Math.round((goal.current / goal.target) * 100));
                const unit = this.getUnitLabel(goal.type);

                metricHtml = `<span class="goal-metric">${goal.current || 0}/${goal.target} ${unit}</span>`;

                progressHtml = `
                    <div class="goal-progress">
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${progress}%"></div>
                        </div>
                        <span class="progress-text">${progress}% complete</span>
                    </div>
                `;
            }

            const createdDate = goal.createdAt ? TimeUtils.getRelativeTime(goal.createdAt) : 'Unknown';
            const categoryIcon = this.getCategoryIcon(goal.category);

            return `
                <div class="goal-item fade-in ${goal.completed ? 'completed' : ''}" data-goal-id="${goal.id}" data-priority="${goal.priority}">
                    <div class="goal-content">
                        <input type="checkbox" 
                               class="goal-checkbox" 
                               ${goal.completed ? 'checked' : ''} 
                               data-goal-id="${goal.id}">
                        <div class="goal-info">
                            <div class="goal-header">
                                <span class="goal-category-icon">${categoryIcon}</span>
                                <span class="goal-text ${goal.completed ? 'completed' : ''}">
                                    ${goal.text}
                                </span>
                                ${metricHtml}
                            </div>
                            ${progressHtml}
                            <div class="goal-meta">
                                <span class="goal-date">Created ${createdDate}</span>
                            </div>
                        </div>
                        <div class="goal-actions">
                            ${goal.type ? `<button class="btn btn-update" data-goal-id="${goal.id}" title="Update progress">📈</button>` : ''}
                            <button class="btn btn-danger" style="padding: 8px 16px;" data-goal-id="${goal.id}" title="Delete goal">
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error rendering goal item:', error);
            return `<div style="color: #ef4444;">Error rendering goal</div>`;
        }
    }

    getUnitLabel(type) {
        const units = {
            bpm: 'BPM',
            percent: '%',
            minutes: 'min',
            sessions: 'sessions'
        };
        return units[type] || '';
    }

    getCategoryIcon(category) {
        const icons = {
            scales: '🎼',
            chords: '🎵',
            songs: '🎤',
            technique: '🎸',
            theory: '📚',
            speed: '🚀',
            general: '🎯'
        };
        return icons[category] || '🎯';
    }

    attachGoalItemListeners() {
        try {
            // Checkbox listeners
            const checkboxes = this.container.querySelectorAll('.goal-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const goalId = parseInt(e.target.dataset.goalId);
                    this.toggleGoal(goalId);
                });
            });

            // Update button listeners
            const updateBtns = this.container.querySelectorAll('.btn-update');
            updateBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const goalId = parseInt(e.target.dataset.goalId);
                    this.updateGoalProgress(goalId);
                });
            });

            // Delete button listeners
            const deleteBtns = this.container.querySelectorAll('.btn-danger');
            deleteBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const goalId = parseInt(e.target.dataset.goalId);
                    this.deleteGoal(goalId);
                });
            });
        } catch (error) {
            console.error('Error attaching goal item listeners:', error);
        }
    }

    async toggleGoal(goalId) {
        try {
            const goal = this.goals.find(g => g.id === goalId);
            if (goal) {
                goal.completed = !goal.completed;

                if (goal.completed) {
                    goal.completedAt = new Date().toISOString();
                } else {
                    delete goal.completedAt;
                }

                await this.storageService.updateGoal(goalId, {
                    completed: goal.completed,
                    completedAt: goal.completedAt
                });

                await this.loadGoals();

                if (goal.completed) {
                    notificationManager.success('Goal completed! Amazing work! 🎉');
                    this.celebrateCompletion();
                }
            }
        } catch (error) {
            console.error('Error toggling goal:', error);
            notificationManager.error('Failed to update goal. Please try again.');
        }
    }

    async updateGoalProgress(goalId) {
        try {
            const goal = this.goals.find(g => g.id === goalId);
            if (goal) {
                const unit = this.getUnitLabel(goal.type);
                const newValue = prompt(`Update current progress (${unit}):`, goal.current || 0);

                if (newValue !== null && !isNaN(newValue)) {
                    const current = parseInt(newValue);

                    // Auto-complete goal if target reached
                    let completed = goal.completed;
                    if (current >= goal.target) {
                        completed = true;
                        notificationManager.success('Goal target reached! Congratulations! 🎉🎸');
                        this.celebrateCompletion();
                    }

                    await this.storageService.updateGoal(goalId, {current, completed});
                    await this.loadGoals();
                    notificationManager.info('Progress updated! Keep going! 💪');
                }
            }
        } catch (error) {
            console.error('Error updating goal progress:', error);
            notificationManager.error('Failed to update progress. Please try again.');
        }
    }

    async deleteGoal(goalId) {
        try {
            const goal = this.goals.find(g => g.id === goalId);
            if (goal && confirm(`Delete goal "${goal.text}"?`)) {
                await this.storageService.deleteGoal(goalId);
                await this.loadGoals();
                notificationManager.info('Goal deleted');
            }
        } catch (error) {
            console.error('Error deleting goal:', error);
            notificationManager.error('Failed to delete goal. Please try again.');
        }
    }

    async checkGoalProgress(practiceEntry) {
        try {
            // Auto-update goals based on practice session
            let updated = false;

            for (const goal of this.goals) {
                // Update BPM goals
                if (goal.type === 'bpm' && practiceEntry.bpm) {
                    const bpm = parseInt(practiceEntry.bpm);

                    // Check if this practice session relates to the goal
                    if (practiceEntry.notes && practiceEntry.notes.toLowerCase().includes(goal.text.toLowerCase())) {
                        if (bpm > goal.current) {
                            goal.current = bpm;

                            if (bpm >= goal.target) {
                                goal.completed = true;
                                notificationManager.success(`Goal achieved: ${goal.text}! 🎉`);
                            }

                            await this.storageService.updateGoal(goal.id, {
                                current: goal.current,
                                completed: goal.completed
                            });

                            updated = true;
                        }
                    }
                }

                // Update time-based goals
                if (goal.type === 'minutes' && !goal.completed) {
                    // Add session duration to current progress
                    const minutesPracticed = Math.floor(practiceEntry.duration / 60);
                    goal.current = (goal.current || 0) + minutesPracticed;

                    if (goal.current >= goal.target) {
                        goal.completed = true;
                        notificationManager.success(`Goal achieved: ${goal.text}! 🎉`);
                    }

                    await this.storageService.updateGoal(goal.id, {
                        current: goal.current,
                        completed: goal.completed
                    });

                    updated = true;
                }

                // Update session-based goals
                if (goal.type === 'sessions' && !goal.completed) {
                    goal.current = (goal.current || 0) + 1;

                    if (goal.current >= goal.target) {
                        goal.completed = true;
                        notificationManager.success(`Goal achieved: ${goal.text}! 🎉`);
                    }

                    await this.storageService.updateGoal(goal.id, {
                        current: goal.current,
                        completed: goal.completed
                    });

                    updated = true;
                }
            }

            if (updated) {
                await this.loadGoals();
            }
        } catch (error) {
            console.error('Error checking goal progress:', error);
        }
    }

    celebrateCompletion() {
        // Simple celebration animation
        const colors = ['#6366f1', '#a855f7', '#10b981', '#f59e0b'];
        const particles = 20;

        for (let i = 0; i < particles; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: 8px;
                height: 8px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                left: 50%;
                top: 50%;
                border-radius: 50%;
                pointer-events: none;
                animation: goalParticle ${Math.random() * 1 + 0.5}s ease-out;
                z-index: 9999;
            `;

            document.body.appendChild(particle);
            setTimeout(() => particle.remove(), 1500);
        }

        // Add animation if not exists
        if (!document.getElementById('goalParticleStyle')) {
            const style = document.createElement('style');
            style.id = 'goalParticleStyle';
            style.textContent = `
                @keyframes goalParticle {
                    0% {
                        transform: translate(-50%, -50%) scale(0);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(
                            calc(-50% + ${Math.random() * 200 - 100}px),
                            calc(-50% - ${Math.random() * 100 + 50}px)
                        ) scale(1);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    destroy() {
        try {
            // Remove event listeners
            window.removeEventListener('practiceSessionSaved', this.checkGoalProgress);

            // Cancel any pending debounced searches
            if (this.debouncedSearch && this.debouncedSearch.cancel) {
                this.debouncedSearch.cancel();
            }
        } catch (error) {
            console.error('Error destroying GoalsList:', error);
        }
    }
}
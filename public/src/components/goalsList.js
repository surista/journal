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
                        <div class="form-group" style="flex: 1;">
                            <label for="goalTargetDate">Target Date</label>
                            <input type="date" id="goalTargetDate">
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
            const goalTargetDate = document.getElementById('goalTargetDate')?.value;

            if (!goalText) {
                // Use console.error instead of notificationManager if it's not available
                notificationManager.error('Please enter a goal!');
                return;
            }

            if (goalType && !goalTarget) {
                notificationManager.error('Please enter a target value!');
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
                priority: this.calculatePriority(goalText, goalType),
                targetDate: goalTargetDate || null
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
            const targetDateInput = document.getElementById('goalTargetDate');
            if (targetDateInput) targetDateInput.value = '';

            await this.loadGoals();

            if (typeof notificationManager !== 'undefined') {
                notificationManager.success('Goal added! You got this! 🎯');
            } else {
                console.log('Goal added successfully!');
            }
        } catch (error) {
            console.error('Error adding goal:', error);
            notificationManager.error('Failed to add goal. Please try again.');
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
            console.log('Rendering goal:', goal);
            
            // Format target date as dd-mmm-yy
            let targetDateFormatted = '';
            if (goal.targetDate) {
                const date = new Date(goal.targetDate);
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const day = date.getDate().toString().padStart(2, '0');
                const month = months[date.getMonth()];
                const year = date.getFullYear().toString().slice(-2);
                targetDateFormatted = `${day}-${month}-${year}`;
                console.log('Date formatting:', { original: goal.targetDate, formatted: targetDateFormatted });
            }

            // Get type symbol
            const typeSymbol = goal.type ? this.getTypeSymbol(goal.type) : '';

            // Category (area) - default to category or 'General'
            const area = goal.category ? goal.category.charAt(0).toUpperCase() + goal.category.slice(1) : 'General';
            
            console.log('Goal data:', {
                text: goal.text,
                area: area,
                type: goal.type,
                targetDate: targetDateFormatted
            });

            // Progress bar for measurable goals - we'll put this inline
            let progressHtml = '';
            if (goal.type && goal.target) {
                const progress = Math.min(100, Math.round((goal.current / goal.target) * 100));
                // For now, let's skip the progress bar to debug the layout
                // progressHtml = `...`;
            }

            const goalHtml = `
                <div class="goal-item fade-in ${goal.completed ? 'completed' : ''}" data-goal-id="${goal.id}" data-priority="${goal.priority}" style="background: #1a2744; border-radius: var(--radius-md); padding: 0.75rem 1.5rem; margin-bottom: 0.5rem;">
                    <div class="goal-content" style="display: flex; align-items: center; width: 100%;">
                        <span style="color: #ffffff; font-weight: 500; margin-right: 1.5rem;">${goal.text}</span>
                        <span style="color: #ffffff; margin-right: 1.5rem;">${area}</span>
                        <span style="color: #ffffff; margin-right: 1.5rem;">${goal.type ? this.getUnitLabel(goal.type) : '-'}</span>
                        <span style="color: #ffffff; display: flex; align-items: center; gap: 0.5rem;">
                            📅 ${targetDateFormatted || '-'}
                        </span>
                        <div style="flex: 1;"></div>
                        <div style="display: flex; gap: 0.5rem;">
                            ${goal.type ? `<button data-goal-id="${goal.id}" data-action="update" title="Update progress" style="background: transparent; border: none; color: #ffffff; cursor: pointer; padding: 0.25rem;">📊</button>` : ''}
                            <button data-goal-id="${goal.id}" data-action="complete" title="Mark complete" style="background: transparent; border: none; color: #ffffff; cursor: pointer; padding: 0.25rem;">⭕</button>
                            <button data-goal-id="${goal.id}" data-action="edit" title="Edit goal" style="background: transparent; border: none; color: #ffffff; cursor: pointer; padding: 0.25rem;">✏️</button>
                            <button data-goal-id="${goal.id}" data-action="delete" title="Delete goal" style="background: transparent; border: none; color: #ffffff; cursor: pointer; padding: 0.25rem;">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
            
            console.log('Generated HTML:', goalHtml);
            return goalHtml;
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

    getTypeLabel(type) {
        const labels = {
            bpm: 'Speed',
            percent: 'Accuracy',
            minutes: 'Duration',
            sessions: 'Practice'
        };
        return labels[type] || type;
    }

    getTypeSymbol(type) {
        const symbols = {
            bpm: '🎵',
            percent: '%',
            minutes: '⏱️',
            sessions: '📊'
        };
        return symbols[type] || '';
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
            // Action button listeners - use data-action attribute
            const actionBtns = this.container.querySelectorAll('.goal-actions button');
            actionBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const button = e.target.closest('button');
                    if (!button) return;
                    
                    const goalId = parseInt(button.dataset.goalId);
                    const action = button.dataset.action;
                    
                    switch(action) {
                        case 'update':
                            this.updateGoalProgress(goalId);
                            break;
                        case 'complete':
                            this.markGoalComplete(goalId);
                            break;
                        case 'edit':
                            this.editGoal(goalId);
                            break;
                        case 'delete':
                            this.deleteGoal(goalId);
                            break;
                    }
                });
            });

            // Legacy delete button listeners (for backward compatibility)
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

    async markGoalComplete(goalId) {
        try {
            const goal = this.goals.find(g => g.id === goalId);
            if (!goal) return;
            
            // Toggle completion status
            goal.completed = !goal.completed;
            goal.completedAt = goal.completed ? new Date().toISOString() : null;
            
            await this.storageService.updateGoal(goal);
            await this.loadGoals();
            
            notificationManager.success(goal.completed ? 'Goal marked as complete!' : 'Goal marked as incomplete');
        } catch (error) {
            console.error('Error marking goal complete:', error);
            notificationManager.error('Failed to update goal status');
        }
    }

    async editGoal(goalId) {
        try {
            const goal = this.goals.find(g => g.id === goalId);
            if (!goal) return;
            
            // For now, just allow editing the goal text
            const newText = prompt('Edit goal:', goal.text);
            if (newText && newText.trim() && newText !== goal.text) {
                goal.text = newText.trim();
                goal.category = this.categorizeGoal(newText);
                goal.priority = this.calculatePriority(newText, goal.type);
                
                await this.storageService.updateGoal(goal);
                await this.loadGoals();
                
                notificationManager.success('Goal updated successfully');
            }
        } catch (error) {
            console.error('Error editing goal:', error);
            notificationManager.error('Failed to edit goal');
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
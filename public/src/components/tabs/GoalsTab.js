// GoalsTab Component - Practice Goals Management with Progress Tracking
export class GoalsTab {
    constructor(storageService) {
        this.storageService = storageService;
        this.container = null;
        this.goals = [];
        this.filter = 'active'; // 'active', 'completed', 'all'
        this.editingGoalId = null;

        // Bind ESC key handler
        this.handleEscKey = this.handleEscKey.bind(this);
    }

    async render(container) {
        this.container = container;
        this.container.innerHTML = `
            <div class="goals-page">
                <div class="goals-header">
                    <h2>Practice Goals</h2>
                    <button class="btn btn-primary" id="addGoalBtn">
                        <i class="icon">➕</i> Add New Goal
                    </button>
                </div>

                <div class="goals-filters">
                    <button class="filter-btn active" data-filter="active">Active</button>
                    <button class="filter-btn" data-filter="completed">Completed</button>
                    <button class="filter-btn" data-filter="all">All Goals</button>
                </div>

                <div class="goals-stats">
                    <div class="stat-card">
                        <span class="stat-value" id="totalGoalsCount">0</span>
                        <span class="stat-label">Total Goals</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value" id="activeGoalsCount">0</span>
                        <span class="stat-label">Active</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value" id="completedGoalsCount">0</span>
                        <span class="stat-label">Completed</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value" id="completionRateValue">0%</span>
                        <span class="stat-label">Completion Rate</span>
                    </div>
                </div>

                <div class="goals-list" id="goalsList">
                    <div class="loading-placeholder">Loading goals...</div>
                </div>
            </div>

            <!-- Goal Modal -->
            <div class="modal" id="goalModal">
                <div class="modal-content">
                    <span class="close-btn" id="closeGoalModal">&times;</span>
                    <h3 id="goalModalTitle">Add New Goal</h3>
                    
                    <form id="goalForm">
                        <div class="form-group">
                            <label>Goal Title <span class="required">*</span></label>
                            <input type="text" id="goalTitle" class="form-control" required 
                                   placeholder="e.g., Play 'Stairway to Heaven' solo at full speed">
                        </div>
                        
                        <div class="form-group">
                            <label>Category</label>
                            <select id="goalCategory" class="form-control">
                                <!-- Options will be populated dynamically -->
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Measurement Type</label>
                            <select id="goalType" class="form-control">
                                <option value="">No measurement</option>
                                <option value="bpm">BPM (Beats per minute)</option>
                                <option value="tempo">Tempo % (Percentage of original)</option>
                                <option value="minutes">Practice Minutes</option>
                                <option value="sessions">Number of Sessions</option>
                            </select>
                        </div>
                        
                        <div id="measurementFields" style="display: none;">
                            <div class="form-group">
                                <label>Current Value <span class="required">*</span></label>
                                <input type="number" id="goalCurrent" class="form-control" min="0" max="999"
                                       placeholder="Your current level">
                            </div>
                            
                            <div class="form-group">
                                <label>Target Value <span class="required">*</span></label>
                                <input type="number" id="goalTarget" class="form-control" min="1" max="999"
                                       placeholder="Your goal">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Target Date (Optional)</label>
                            <input type="date" id="goalTargetDate" class="form-control">
                        </div>
                        
                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="goalDescription" class="form-control" rows="3" 
                                    placeholder="Add details about your goal, specific measures of success, etc."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>Success Criteria</label>
                            <input type="text" id="goalCriteria" class="form-control" 
                                   placeholder="e.g., Play at 120 BPM with no mistakes">
                        </div>
                        
                        <div class="modal-actions">
                            <button type="submit" class="btn btn-primary">Save Goal</button>
                            <button type="button" class="btn btn-secondary" id="cancelGoalBtn">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Progress Update Modal -->
            <div class="modal" id="progressModal">
                <div class="modal-content" style="max-width: 400px;">
                    <span class="close-btn" id="closeProgressModal">&times;</span>
                    <h3>Update Progress</h3>
                    
                    <div id="progressInfo">
                        <p id="progressGoalTitle" style="font-weight: 600; margin-bottom: 1rem;"></p>
                        <div class="progress-display" style="margin-bottom: 1.5rem;">
                            <div class="progress-bar-container" style="height: 20px;">
                                <div id="currentProgressBar" class="progress-bar"></div>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;">
                                <span id="progressCurrent"></span>
                                <span id="progressPercent" style="font-weight: 600;"></span>
                                <span id="progressTarget"></span>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>New Value</label>
                            <input type="number" id="newProgressValue" class="form-control" min="0" max="999">
                            <div style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">
                                <span id="progressHint"></span>
                            </div>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn btn-primary" id="saveProgressBtn">Update</button>
                            <button type="button" class="btn btn-secondary" id="cancelProgressBtn">Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        await this.loadGoals();
        this.attachEventListeners();
        this.populateCategories();
    }

    // Fix for GoalsTab.js - attachEventListeners method
    attachEventListeners() {
        console.log('🎯 GoalsTab attachEventListeners called');

        // Remove any existing click handler to prevent duplicates
        if (this.clickHandler) {
            this.container.removeEventListener('click', this.clickHandler);
        }

        // Create the click handler function
        this.clickHandler = async (e) => {
                console.log('🎯 Click detected on:', e.target);
                const target = e.target;

                // Add goal button - check for exact ID and nested elements
                if (target.id === 'addGoalBtn' || target.closest('#addGoalBtn')) {
                    console.log('🎯 Add New Goal button clicked');
                    console.log('Button element:', target);
                    console.log('Button position:', target.getBoundingClientRect());
                    console.log('Button z-index:', window.getComputedStyle(target).zIndex);
                    console.log('Button visibility:', window.getComputedStyle(target).visibility);
                    console.log('Button display:', window.getComputedStyle(target).display);
                    console.log('Event propagation stopped:', e.defaultPrevented);

                    e.preventDefault();
                    e.stopPropagation();

                    try {
                        console.log('🎯 Calling showGoalModal...');
                        this.showGoalModal();
                        console.log('🎯 showGoalModal completed');

                        // Double-check modal is visible
                        const modal = document.getElementById('goalModal');
                        if (modal && window.getComputedStyle(modal).display === 'none') {
                            console.error('🎯 Modal still hidden after showGoalModal!');
                            console.error('🎯 Modal classes:', modal.className);
                            console.error('🎯 Modal computed styles:', {
                                display: window.getComputedStyle(modal).display,
                                opacity: window.getComputedStyle(modal).opacity,
                                visibility: window.getComputedStyle(modal).visibility,
                                zIndex: window.getComputedStyle(modal).zIndex
                            });
                        }
                    } catch (error) {
                        console.error('🎯 Error in showGoalModal:', error);
                    }
                }

                // Filter buttons
                else if (target.classList.contains('filter-btn')) {
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    target.classList.add('active');
                    this.filter = target.dataset.filter;
                    this.renderGoals();
                }

                // Modal controls
                else if (target.id === 'closeGoalModal' || target.id === 'cancelGoalBtn') {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🎯 Close button clicked:', target.id);
                    this.hideGoalModal();
                } else if (target.id === 'closeProgressModal' || target.id === 'cancelProgressBtn') {
                    e.preventDefault();
                    this.hideProgressModal();
                } else if (target.id === 'saveProgressBtn') {
                    e.preventDefault();
                    await this.saveProgress();
                }

                // Goal actions with proper delegation
                else if (target.classList.contains('complete-goal-btn') || target.closest('.complete-goal-btn')) {
                    const btn = target.classList.contains('complete-goal-btn') ? target : target.closest('.complete-goal-btn');
                    const goalId = parseFloat(btn.dataset.id); // Use parseFloat to handle decimal IDs
                    await this.toggleGoalComplete(goalId);
                } else if (target.classList.contains('delete-goal-btn') || target.closest('.delete-goal-btn')) {
                    const btn = target.classList.contains('delete-goal-btn') ? target : target.closest('.delete-goal-btn');
                    const goalId = parseFloat(btn.dataset.id); // Use parseFloat to handle decimal IDs
                    await this.deleteGoal(goalId);
                } else if (target.classList.contains('edit-goal-btn') || target.closest('.edit-goal-btn')) {
                    const btn = target.classList.contains('edit-goal-btn') ? target : target.closest('.edit-goal-btn');
                    const goalId = parseFloat(btn.dataset.id); // Use parseFloat to handle decimal IDs
                    this.editGoal(goalId);
                } else if (target.classList.contains('update-progress-btn') || target.closest('.update-progress-btn')) {
                    const btn = target.classList.contains('update-progress-btn') ? target : target.closest('.update-progress-btn');
                    const goalId = parseFloat(btn.dataset.id); // Use parseFloat to handle decimal IDs
                    this.showProgressModal(goalId);
                }
            };

            // Form submission - remove old handler first
            if (this.submitHandler) {
                this.container.removeEventListener('submit', this.submitHandler);
            }
            
            this.submitHandler = async (e) => {
                if (e.target.id === 'goalForm') {
                    e.preventDefault();
                    await this.saveGoal();
                }
            };
            
            this.container.addEventListener('submit', this.submitHandler);

            // Goal type change for showing/hiding measurement fields
            this.container.addEventListener('change', (e) => {
                if (e.target.id === 'goalType') {
                    const measurementFields = document.getElementById('measurementFields');
                    if (e.target.value) {
                        measurementFields.style.display = 'block';
                        document.getElementById('goalCurrent').required = true;
                        document.getElementById('goalTarget').required = true;

                        // Update placeholders based on type
                        const currentInput = document.getElementById('goalCurrent');
                        const targetInput = document.getElementById('goalTarget');

                        switch (e.target.value) {
                            case 'bpm':
                                currentInput.placeholder = 'Current BPM (e.g., 80)';
                                targetInput.placeholder = 'Target BPM (e.g., 120)';
                                break;
                            case 'tempo':
                                currentInput.placeholder = 'Current tempo % (e.g., 75)';
                                targetInput.placeholder = 'Target tempo % (e.g., 100)';
                                break;
                            case 'minutes':
                                currentInput.placeholder = 'Minutes practiced so far';
                                targetInput.placeholder = 'Target minutes';
                                break;
                            case 'sessions':
                                currentInput.placeholder = 'Sessions completed';
                                targetInput.placeholder = 'Target sessions';
                                break;
                        }
                    } else {
                        measurementFields.style.display = 'none';
                        document.getElementById('goalCurrent').required = false;
                        document.getElementById('goalTarget').required = false;
                    }
                }
            });


        // Add the click handler to the container
        if (this.container) {
            this.container.addEventListener('click', this.clickHandler);
        }

        // Listen for practice sessions to auto-update progress
        window.addEventListener('practiceSessionSaved', (e) => {
            this.checkGoalProgress(e.detail);
        });

        // Listen for session areas updates
        window.addEventListener('sessionAreasUpdated', (e) => {
            this.populateCategories();
        });

        // Add ESC key handler
        document.addEventListener('keydown', this.handleEscKey);
    }

    handleEscKey(e) {
        if (e.key === 'Escape') {
            const goalModal = document.getElementById('goalModal');
            const progressModal = document.getElementById('progressModal');

            if (goalModal && goalModal.style.display !== 'none') {
                e.preventDefault();
                this.hideGoalModal();
            } else if (progressModal && progressModal.style.display !== 'none') {
                e.preventDefault();
                this.hideProgressModal();
            }
        }
    }

    async loadGoals() {
        try {
            // Get all goals
            const allGoals = await this.storageService.getGoals();

            // Filter out daily/calendar goals (they have type: 'daily')
            this.goals = allGoals.filter(g => g.type !== 'daily');

            // Sort by creation date (newest first) and completion status
            this.goals.sort((a, b) => {
                if (a.completed !== b.completed) return a.completed ? 1 : -1;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            this.updateStats();
            this.renderGoals();
        } catch (error) {
            console.error('Error loading goals:', error);
            this.showError('Failed to load goals');
        }
    }

    renderGoals() {
        const container = document.getElementById('goalsList');
        if (!container) return;

        // Filter goals based on current filter
        let filteredGoals = this.goals;
        if (this.filter === 'active') {
            filteredGoals = this.goals.filter(g => !g.completed);
        } else if (this.filter === 'completed') {
            filteredGoals = this.goals.filter(g => g.completed);
        }

        if (filteredGoals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="icon" style="font-size: 3rem;">🎯</i>
                    <p>No ${this.filter} goals found</p>
                    ${this.filter === 'active' ?
                '<button class="btn btn-primary" onclick="document.getElementById(\'addGoalBtn\').click()">Create Your First Goal</button>' :
                ''}
                </div>
            `;
            return;
        }

        container.innerHTML = filteredGoals.map(goal => {
            const isOverdue = goal.targetDate && new Date(goal.targetDate) < new Date() && !goal.completed;

            // Progress bar HTML
            let progressHTML = '';
            if (goal.type && goal.target) {
                const current = goal.current || 0;
                const progress = Math.min(100, Math.round((current / goal.target) * 100));
                const unit = this.getUnitLabel(goal.type);

                progressHTML = `
                    <div class="goal-progress" style="margin: 1rem 0;">
                        <div class="progress-bar-container" style="height: 8px;">
                            <div class="progress-bar" style="width: ${progress}%; background: ${progress >= 100 ? 'var(--success)' : 'var(--primary)'};"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 0.875rem;">
                            <span>${current} ${unit}</span>
                            <span style="font-weight: 600;">${progress}%</span>
                            <span>${goal.target} ${unit}</span>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="goal-card ${goal.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}" data-id="${goal.id}">
                    <div class="goal-header">
                        <h4 class="goal-title">${this.escapeHtml(goal.title || goal.text || 'Untitled Goal')}</h4>
                        <div class="goal-actions">
                            ${goal.type && !goal.completed ? `
                                <button class="btn-icon update-progress-btn" data-id="${goal.id}" 
                                        title="Update progress" style="background: var(--primary); color: white; padding: 4px 8px; border-radius: 4px;">
                                    📈
                                </button>
                            ` : ''}
                            <button class="btn-icon complete-goal-btn" data-id="${goal.id}" 
                                    title="${goal.completed ? 'Mark as incomplete' : 'Mark as complete'}">
                                ${goal.completed ? '✅' : '⭕'}
                            </button>
                            <button class="btn-icon edit-goal-btn" data-id="${goal.id}" title="Edit goal">
                                ✏️
                            </button>
                            <button class="btn-icon delete-goal-btn" data-id="${goal.id}" title="Delete goal">
                                🗑️
                            </button>
                        </div>
                    </div>
                    
                    <div class="goal-meta">
                        <span class="goal-category category-${goal.category || 'other'}">
                            ${this.formatCategory(goal.category)}
                        </span>
                        ${goal.targetDate ? `
                            <span class="goal-date ${isOverdue ? 'overdue' : ''}">
                                <i class="icon">📅</i> ${this.formatDate(goal.targetDate)}
                            </span>
                        ` : ''}
                        ${goal.type ? `
                            <span class="goal-type">
                                <i class="icon">📊</i> ${this.getUnitLabel(goal.type)}
                            </span>
                        ` : ''}
                    </div>
                    
                    ${progressHTML}
                    
                    ${goal.description ? `
                        <div class="goal-description">
                            ${this.escapeHtml(goal.description)}
                        </div>
                    ` : ''}
                    
                    ${goal.criteria ? `
                        <div class="goal-criteria">
                            <strong>Success Criteria:</strong> ${this.escapeHtml(goal.criteria)}
                        </div>
                    ` : ''}
                    
                    ${goal.completed && goal.completedAt ? `
                        <div class="goal-completed-info">
                            Completed on ${this.formatDate(goal.completedAt)}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    updateStats() {
        const totalGoals = this.goals.length;
        const activeGoals = this.goals.filter(g => !g.completed).length;
        const completedGoals = this.goals.filter(g => g.completed).length;
        const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

        const totalGoalsEl = document.getElementById('totalGoalsCount');
        const activeGoalsEl = document.getElementById('activeGoalsCount');
        const completedGoalsEl = document.getElementById('completedGoalsCount');
        const completionRateEl = document.getElementById('completionRateValue');

        if (totalGoalsEl) totalGoalsEl.textContent = totalGoals;
        if (activeGoalsEl) activeGoalsEl.textContent = activeGoals;
        if (completedGoalsEl) completedGoalsEl.textContent = completedGoals;
        if (completionRateEl) completionRateEl.textContent = `${completionRate}%`;
    }

    showGoalModal(goalId = null) {
        console.log('🎯 showGoalModal called with goalId:', goalId);

        const modal = document.getElementById('goalModal');
        const modalTitle = document.getElementById('goalModalTitle');
        const form = document.getElementById('goalForm');

        console.log('🎯 Modal elements found:', { modal, modalTitle, form });

        if (!modal || !modalTitle || !form) {
            console.error('Goal modal elements not found');
            return;
        }

        // Populate categories before showing modal
        this.populateCategories();

        // Force remove any conflicting styles
        modal.style.removeProperty('opacity');
        modal.style.removeProperty('visibility');

        // Reset and populate form
        if (goalId) {
            // Edit mode
            const goal = this.goals.find(g => g.id == goalId); // Use loose equality to handle number type differences
            if (!goal) {
                console.error('Goal not found:', goalId, 'Available goals:', this.goals.map(g => ({ id: g.id, title: g.title })));
                return;
            }

            this.editingGoalId = goalId;
            modalTitle.textContent = 'Edit Goal';

            // Populate form fields
            document.getElementById('goalTitle').value = goal.title || '';
            document.getElementById('goalCategory').value = goal.category || 'other';
            document.getElementById('goalType').value = goal.type || '';
            document.getElementById('goalTargetDate').value = goal.targetDate || '';
            document.getElementById('goalDescription').value = goal.description || '';
            document.getElementById('goalCriteria').value = goal.criteria || '';

            // Handle measurement fields
            if (goal.type) {
                document.getElementById('measurementFields').style.display = 'block';
                document.getElementById('goalCurrent').value = goal.current || 0;
                document.getElementById('goalTarget').value = goal.target || '';
                document.getElementById('goalCurrent').required = true;
                document.getElementById('goalTarget').required = true;
            } else {
                document.getElementById('measurementFields').style.display = 'none';
                document.getElementById('goalCurrent').required = false;
                document.getElementById('goalTarget').required = false;
            }
        } else {
            // Add mode
            this.editingGoalId = null;
            modalTitle.textContent = 'Add New Goal';
            form.reset();
            document.getElementById('measurementFields').style.display = 'none';
            document.getElementById('goalCurrent').required = false;
            document.getElementById('goalTarget').required = false;
        }

        // Show modal using the CSS class approach
        modal.style.display = 'flex';

        // Force reflow to ensure display is applied before adding class
        modal.offsetHeight;

        // Add the show class which handles opacity and visibility
        modal.classList.add('show');

        // Focus on first input after animation completes
        setTimeout(() => {
            const firstInput = document.getElementById('goalTitle');
            if (firstInput) {
                firstInput.focus();
            }
        }, 200);

        console.log('🎯 Modal display:', modal.style.display);
        console.log('🎯 Modal classes:', modal.className);
        console.log('🎯 Modal computed style:', window.getComputedStyle(modal).display);
        console.log('🎯 Modal should now be visible');
    }

    hideGoalModal() {
        const modal = document.getElementById('goalModal');
        if (modal) {
            // Remove the show class first
            modal.classList.remove('show');

            // Wait for transition to complete before hiding
            setTimeout(() => {
                modal.style.display = 'none';
            }, 200);
        }
        this.editingGoalId = null;
    }

    async saveGoal() {
        // Prevent double saves
        if (this.isSaving) {
            console.log('🎯 Save already in progress, ignoring duplicate request');
            return;
        }
        
        this.isSaving = true;
        
        try {
            const title = document.getElementById('goalTitle').value.trim();
            const category = document.getElementById('goalCategory').value;
            const type = document.getElementById('goalType').value;
            const current = document.getElementById('goalCurrent').value ? parseInt(document.getElementById('goalCurrent').value) : null;
            const target = document.getElementById('goalTarget').value ? parseInt(document.getElementById('goalTarget').value) : null;
            const targetDate = document.getElementById('goalTargetDate').value;
            const description = document.getElementById('goalDescription').value.trim();
            const criteria = document.getElementById('goalCriteria').value.trim();

            if (!title) {
                this.showError('Goal title is required');
                this.isSaving = false;
                return;
            }

            if (type && (!current && current !== 0 || !target)) {
                this.showError('Current and target values are required for measured goals');
                this.isSaving = false;
                return;
            }

            const goalData = {
                title,
                category,
                type: type || null,
                current: current,
                target: target,
                targetDate: targetDate || null,
                description,
                criteria,
                completed: false
            };

            if (this.editingGoalId) {
                await this.storageService.updateGoal(this.editingGoalId, goalData);
                this.showNotification('Goal updated successfully', 'success');
            } else {
                await this.storageService.saveGoal(goalData);
                this.showNotification('Goal created successfully', 'success');
            }

            this.hideGoalModal();
            await this.loadGoals();
        } catch (error) {
            console.error('Error saving goal:', error);
            this.showError('Failed to save goal');
        } finally {
            this.isSaving = false;
        }
    }

    editGoal(goalId) {
        this.showGoalModal(goalId);
    }

    async deleteGoal(goalId) {
        const goal = this.goals.find(g => g.id == goalId); // Use loose equality
        if (!goal) return;

        if (confirm(`Are you sure you want to delete "${goal.title || goal.text}"?`)) {
            try {
                await this.storageService.deleteGoal(goalId);
                this.showNotification('Goal deleted successfully', 'success');
                await this.loadGoals();
            } catch (error) {
                console.error('Error deleting goal:', error);
                this.showError('Failed to delete goal');
            }
        }
    }

    async toggleGoalComplete(goalId) {
        const goal = this.goals.find(g => g.id == goalId); // Use loose equality
        if (!goal) return;

        try {
            if (goal.completed) {
                // Marking as incomplete - no confirmation needed
                await this.storageService.markGoalIncomplete(goalId);
                this.showNotification('Goal marked as active', 'success');
            } else {
                // Marking as complete - ask for confirmation
                const confirmed = confirm(`Are you sure you want to mark "${goal.title || goal.text}" as complete?`);
                if (!confirmed) return;
                
                await this.storageService.markGoalComplete(goalId);
                this.showNotification('🎉 Congratulations! Goal completed!', 'success');
            }
            await this.loadGoals();
        } catch (error) {
            console.error('Error toggling goal completion:', error);
            this.showError('Failed to update goal');
        }
    }

    showProgressModal(goalId) {
        const goal = this.goals.find(g => g.id == goalId); // Use loose equality
        if (!goal || !goal.type) return;

        const modal = document.getElementById('progressModal');
        const goalTitle = document.getElementById('progressGoalTitle');
        const progressBar = document.getElementById('currentProgressBar');
        const progressCurrent = document.getElementById('progressCurrent');
        const progressTarget = document.getElementById('progressTarget');
        const progressPercent = document.getElementById('progressPercent');
        const newValueInput = document.getElementById('newProgressValue');
        const progressHint = document.getElementById('progressHint');

        if (!modal) return;

        const current = goal.current || 0;
        const target = goal.target || 1;
        const percentage = Math.min(100, Math.round((current / target) * 100));
        const unit = this.getUnitLabel(goal.type);

        goalTitle.textContent = goal.title;
        progressBar.style.width = `${percentage}%`;
        progressCurrent.textContent = `${current} ${unit}`;
        progressTarget.textContent = `${target} ${unit}`;
        progressPercent.textContent = `${percentage}%`;
        newValueInput.value = current;
        progressHint.textContent = `Enter your new ${unit.toLowerCase()} value`;

        modal.dataset.goalId = goalId;
        modal.style.display = 'flex';

        // Force reflow and add show class
        modal.offsetHeight;
        modal.classList.add('show');
    }

    hideProgressModal() {
        const modal = document.getElementById('progressModal');
        if (modal) {
            // Remove the show class first
            modal.classList.remove('show');

            // Wait for transition to complete before hiding
            setTimeout(() => {
                modal.style.display = 'none';
            }, 200);
        }
    }

    async saveProgress() {
        const modal = document.getElementById('progressModal');
        const goalId = parseFloat(modal.dataset.goalId); // Use parseFloat to handle decimal IDs
        const newValue = parseInt(document.getElementById('newProgressValue').value);

        if (isNaN(newValue) || newValue < 0) {
            this.showError('Please enter a valid number');
            return;
        }

        try {
            await this.storageService.updateGoal(goalId, { current: newValue });
            this.hideProgressModal();
            this.showNotification('Progress updated successfully', 'success');
            await this.loadGoals();
        } catch (error) {
            console.error('Error updating progress:', error);
            this.showError('Failed to update progress');
        }
    }

    getUnitLabel(type) {
        const units = {
            bpm: 'BPM',
            tempo: '%',
            minutes: 'minutes',
            sessions: 'sessions'
        };
        return units[type] || type;
    }

    formatCategory(category) {
        const categories = {
            technique: 'Technique',
            repertoire: 'Repertoire',
            theory: 'Theory',
            speed: 'Speed',
            accuracy: 'Accuracy',
            performance: 'Performance',
            other: 'Other'
        };
        return categories[category] || category;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    checkGoalProgress(sessionData) {
        // Auto-update goal progress based on practice sessions
        // This would be implemented based on your specific goal tracking logic
    }

    showNotification(message, type = 'info') {
        if (window.app?.currentPage?.showNotification) {
            window.app.currentPage.showNotification(message, type);
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    getSessionAreas() {
        // Same logic as in SettingsTab and PracticeForm
        const stored = localStorage.getItem('sessionAreas');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                return this.getDefaultSessionAreas();
            }
        }
        return this.getDefaultSessionAreas();
    }

    getDefaultSessionAreas() {
        return [
            'Scales',
            'Chords',
            'Arpeggios',
            'Songs',
            'Technique',
            'Theory',
            'Improvisation',
            'Sight Reading',
            'Ear Training',
            'Rhythm',
            'Audio Practice'
        ];
    }

    populateCategories() {
        const select = document.getElementById('goalCategory');
        if (!select) return;

        const sessionAreas = this.getSessionAreas();

        select.innerHTML = `
            <option value="">Select category...</option>
            ${sessionAreas.map(area => `<option value="${area.toLowerCase().replace(/\s+/g, '-')}">${area}</option>`).join('')}
            <option value="other">Other</option>
        `;
    }

    onActivate() {
        this.loadGoals();
        this.populateCategories();
    }

    destroy() {
        // Remove ESC key handler
        document.removeEventListener('keydown', this.handleEscKey);

        // Hide any open modals
        this.hideGoalModal();
        this.hideProgressModal();

        // Clear data
        this.goals = [];
        this.container = null;
        this.editingGoalId = null;
    }

}
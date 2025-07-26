// Drills Page - Browse and search guitar practice drills
// Provides filtering, search, and favorites management

import { drillsService } from '../services/drillsService.js';

export class DrillsPage {
    constructor() {
        this.drills = [];
        this.filteredDrills = [];
        this.currentFilters = {
            query: '',
            category: '',
            difficulty: '',
            favoritesOnly: false,
            maxDuration: null,
            sortBy: 'title'
        };
        this.debounceTimer = null;
        this.container = null;
    }

    async init() {
        console.log('Initializing Drills Page...');
        await this.loadDrills();
        console.log('Loaded drills:', this.drills.length);
        if (this.container) {
            this.render(this.container);
        }
    }

    async loadDrills() {
        this.drills = await drillsService.searchDrills('', this.currentFilters);
        this.filteredDrills = [...this.drills];
    }

    async render(container) {
        this.container = container;
        await this.loadDrills();
        
        const content = `
            <div class="drills-page">
                <div class="drills-nav-header">
                    <nav class="drills-nav-tabs">
                        <a href="#drills" class="nav-tab active">Drills Library</a>
                        <a href="#my-drills" class="nav-tab">Your Drills</a>
                    </nav>
                    <button class="add-drill-btn" id="addDrillBtn">Add New Drill</button>
                </div>

                <div class="drills-filters-section">
                    <div class="filter-row">
                        <div class="search-box">
                            <input 
                                type="text" 
                                id="drillSearch" 
                                class="search-input" 
                                placeholder="Search"
                                value="${this.currentFilters.query}"
                            >
                        </div>
                        
                        <div class="filter-group">
                            <label class="filter-label">Category</label>
                            <select id="categoryFilter" class="filter-select">
                                <option value="">All</option>
                                ${drillsService.getCategories().map(cat => 
                                    `<option value="${cat}" ${this.currentFilters.category === cat ? 'selected' : ''}>${cat}</option>`
                                ).join('')}
                            </select>
                        </div>

                        <div class="filter-group">
                            <label class="filter-label">Difficulty</label>
                            <select id="difficultyFilter" class="filter-select">
                                <option value="">All</option>
                                ${drillsService.getDifficulties().map(diff => 
                                    `<option value="${diff}" ${this.currentFilters.difficulty === diff ? 'selected' : ''}>${diff}</option>`
                                ).join('')}
                            </select>
                        </div>

                        <div class="filter-group">
                            <label class="filter-label">Duration</label>
                            <select id="durationFilter" class="filter-select">
                                <option value="">All</option>
                                <option value="10" ${this.currentFilters.maxDuration === 10 ? 'selected' : ''}>≤ 10 min</option>
                                <option value="15" ${this.currentFilters.maxDuration === 15 ? 'selected' : ''}>≤ 15 min</option>
                                <option value="20" ${this.currentFilters.maxDuration === 20 ? 'selected' : ''}>≤ 20 min</option>
                                <option value="30" ${this.currentFilters.maxDuration === 30 ? 'selected' : ''}>≤ 30 min</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="drills-grid" id="drillsGrid">
                    ${this.renderDrills()}
                </div>
            </div>
        `;

        this.container.innerHTML = content;
        this.attachEventListeners();
    }

    renderDrills() {
        if (this.filteredDrills.length === 0) {
            return `
                <div class="no-drills">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <h3>No drills found</h3>
                    <p>Try adjusting your filters or search terms</p>
                </div>
            `;
        }

        return `
            <table class="drills-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Drill Name</th>
                        <th>BPM</th>
                        <th>Link</th>
                        <th>Category</th>
                        <th>Difficulty</th>
                        <th>Duration</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${this.filteredDrills.map(drill => `
                        <tr data-drill-id="${drill.id}">
                            <td>${this.formatDate(drill.createdAt)}</td>
                            <td class="drill-name">
                                ${drill.isFavorite ? '<span class="favorite-star">★</span>' : ''}
                                ${this.escapeHtml(drill.title)}
                            </td>
                            <td>${drill.tempo ? drill.tempo.recommended : '-'}</td>
                            <td>
                                ${drill.videoUrl ? `<a href="${drill.videoUrl}" target="_blank">Video</a>` : '-'}
                            </td>
                            <td>${drill.category}</td>
                            <td>
                                <span class="difficulty-badge ${drill.difficulty.toLowerCase()}">${drill.difficulty}</span>
                            </td>
                            <td>${drill.duration} min</td>
                            <td class="drill-actions-cell">
                                <button class="action-btn start-drill-btn" data-drill-id="${drill.id}" title="Start Drill">
                                    ▶
                                </button>
                                <button class="action-btn favorite-btn ${drill.isFavorite ? 'active' : ''}" data-drill-id="${drill.id}" title="Toggle Favorite">
                                    ★
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    attachEventListeners() {
        // Search input
        const searchInput = document.getElementById('drillSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => {
                    this.currentFilters.query = e.target.value;
                    this.applyFilters();
                }, 300);
            });
        }

        // Filter selects
        document.getElementById('categoryFilter')?.addEventListener('change', (e) => {
            this.currentFilters.category = e.target.value;
            this.applyFilters();
        });

        document.getElementById('difficultyFilter')?.addEventListener('change', (e) => {
            this.currentFilters.difficulty = e.target.value;
            this.applyFilters();
        });

        document.getElementById('durationFilter')?.addEventListener('change', (e) => {
            this.currentFilters.maxDuration = e.target.value ? parseInt(e.target.value) : null;
            this.applyFilters();
        });

        document.getElementById('sortBy')?.addEventListener('change', (e) => {
            this.currentFilters.sortBy = e.target.value;
            this.applyFilters();
        });

        // Favorites toggle
        document.getElementById('favoritesToggle')?.addEventListener('click', () => {
            this.currentFilters.favoritesOnly = !this.currentFilters.favoritesOnly;
            document.getElementById('favoritesToggle').classList.toggle('active');
            this.applyFilters();
        });

        // Add drill button
        document.getElementById('addDrillBtn')?.addEventListener('click', () => {
            // TODO: Implement add drill functionality
            console.log('Add drill clicked');
        });

        // Drill table actions
        document.getElementById('drillsGrid')?.addEventListener('click', async (e) => {
            // Favorite button
            if (e.target.closest('.favorite-btn')) {
                const drillId = e.target.closest('.favorite-btn').dataset.drillId;
                await this.toggleFavorite(drillId);
                return;
            }

            // Start drill button
            if (e.target.closest('.start-drill-btn')) {
                const drillId = e.target.closest('.start-drill-btn').dataset.drillId;
                await this.startDrill(drillId);
                return;
            }

            // View details button
            if (e.target.closest('.view-details-btn')) {
                const drillId = e.target.closest('.view-details-btn').dataset.drillId;
                await this.viewDrillDetails(drillId);
                return;
            }
        });
    }

    async applyFilters() {
        this.filteredDrills = await drillsService.searchDrills(
            this.currentFilters.query,
            this.currentFilters
        );
        this.updateDrillsGrid();
    }

    updateDrillsGrid() {
        const grid = document.getElementById('drillsGrid');
        if (grid) {
            grid.innerHTML = this.renderDrills();
        }

        // Update stats
        const stats = document.querySelector('.drills-stats span');
        if (stats) {
            stats.textContent = `${this.filteredDrills.length} drill${this.filteredDrills.length !== 1 ? 's' : ''} found`;
        }
    }

    async toggleFavorite(drillId) {
        try {
            const drill = await drillsService.toggleFavorite(drillId);
            
            // Update the drill in our local arrays
            const updateDrill = (drillArray) => {
                const index = drillArray.findIndex(d => d.id === drillId);
                if (index !== -1) {
                    drillArray[index] = drill;
                }
            };
            
            updateDrill(this.drills);
            updateDrill(this.filteredDrills);
            
            // Update just the favorite button
            const btn = document.querySelector(`.favorite-btn[data-drill-id="${drillId}"]`);
            if (btn) {
                btn.classList.toggle('active');
                const svg = btn.querySelector('path');
                if (svg) {
                    svg.setAttribute('fill', drill.isFavorite ? 'currentColor' : 'none');
                }
            }
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
        }
    }

    async startDrill(drillId) {
        try {
            const sessionData = await drillsService.startDrillSession(drillId);
            
            // Navigate to practice page with drill data
            window.location.hash = '#practice';
            
            // Dispatch event with drill data
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('startDrillSession', { 
                    detail: sessionData 
                }));
            }, 100);
        } catch (error) {
            console.error('Failed to start drill:', error);
        }
    }

    async viewDrillDetails(drillId) {
        const drill = await drillsService.getDrillById(drillId);
        if (!drill) return;

        // Create modal with drill details
        const modal = document.createElement('div');
        modal.className = 'modal drill-details-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${this.escapeHtml(drill.title)}</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="drill-meta-detailed">
                        <span class="category-badge ${drill.category.toLowerCase().replace(/\s+/g, '-')}">${drill.category}</span>
                        <span class="difficulty-badge ${drill.difficulty.toLowerCase()}">${drill.difficulty}</span>
                        <span class="duration-badge">${drill.duration} minutes</span>
                    </div>

                    <div class="detail-section">
                        <h3>Description</h3>
                        <p>${this.escapeHtml(drill.description)}</p>
                    </div>

                    <div class="detail-section">
                        <h3>Instructions</h3>
                        <pre>${this.escapeHtml(drill.instructions)}</pre>
                    </div>

                    ${drill.tempo ? `
                        <div class="detail-section">
                            <h3>Tempo Range</h3>
                            <p>
                                <strong>Minimum:</strong> ${drill.tempo.min} BPM<br>
                                <strong>Maximum:</strong> ${drill.tempo.max} BPM<br>
                                <strong>Recommended:</strong> ${drill.tempo.recommended} BPM
                            </p>
                        </div>
                    ` : ''}

                    ${drill.tags && drill.tags.length > 0 ? `
                        <div class="detail-section">
                            <h3>Tags</h3>
                            <div class="drill-tags">
                                ${drill.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="start-drill-btn" data-drill-id="${drill.id}">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M5 3L17 10L5 17V3Z" fill="currentColor"/>
                        </svg>
                        Start This Drill
                    </button>
                    <button class="modal-close-btn">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('.modal-close-btn').addEventListener('click', () => modal.remove());
        modal.querySelector('.start-drill-btn').addEventListener('click', async () => {
            modal.remove();
            await this.startDrill(drillId);
        });

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    destroy() {
        clearTimeout(this.debounceTimer);
    }
}
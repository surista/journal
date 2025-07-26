// Drills Page - Browse and search guitar practice drills
// Provides filtering, search, and favorites management

import { drillsService } from '../services/drillsService.js';
import { StorageService } from '../services/storageService.js';

export class DrillsPage {
    constructor() {
        this.drills = [];
        this.filteredDrills = [];
        this.sessionAreas = [];
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
        // Get storage service from window.app or create new instance
        this.storageService = window.app?.storageService || new StorageService('default');
    }

    async init() {
        console.log('Initializing Drills Page...');
        await this.loadSessionAreas();
        await this.loadDrills();
        console.log('Loaded drills:', this.drills.length);
        if (this.container) {
            this.render(this.container);
        }
    }

    async loadSessionAreas() {
        try {
            this.sessionAreas = await this.storageService.getSessionAreas();
        } catch (error) {
            console.error('Failed to load session areas:', error);
            this.sessionAreas = [];
        }
    }

    async loadDrills() {
        this.drills = await drillsService.searchDrills('', this.currentFilters);
        this.filteredDrills = [...this.drills];
    }

    async render(container) {
        this.container = container;
        await this.loadDrills();
        
        // Inject critical styles inline - TEMPORARY FIX
        if (!document.getElementById('drills-critical-styles')) {
            const style = document.createElement('style');
            style.id = 'drills-critical-styles';
            style.textContent = `
                #drillsTab .drills-controls {
                    display: flex !important;
                    flex-direction: row !important;
                    flex-wrap: nowrap !important;
                    gap: 1rem !important;
                }
                
                #drillsTab .search-bar {
                    flex: 1 !important;
                }
                
                #drillsTab .drills-filters {
                    display: flex !important;
                    flex-direction: row !important;
                    gap: 1rem !important;
                }
                
                #drillsTab .drills-controls select.form-control {
                    width: auto !important;
                    min-width: 140px !important;
                }
                
                #drillsTab .search-bar input.form-control {
                    width: 100% !important;
                }
            `;
            document.head.appendChild(style);
        }
        
        const content = `
            <div class="drills-page">
                <div class="drills-header">
                    <h2>Practice Drills</h2>
                    <button class="btn btn-primary" id="addDrillBtn">
                        ➕ Add Drill
                    </button>
                </div>
                
                <div class="drills-controls">
                    <div class="search-bar">
                        <input type="text" 
                               id="drillSearch" 
                               class="form-control" 
                               placeholder="Search drills, categories, or notes..."
                               value="${this.currentFilters.query}">
                    </div>
                    
                    <div class="drills-filters">
                        <select id="categoryFilter" class="form-control">
                            <option value="">All Categories</option>
                            ${this.sessionAreas.map(area => 
                                `<option value="${area}" ${this.currentFilters.category === area ? 'selected' : ''}>${area}</option>`
                            ).join('')}
                        </select>
                        
                        <select id="difficultyFilter" class="form-control">
                            <option value="">All Difficulties</option>
                            ${drillsService.getDifficulties().map(diff => 
                                `<option value="${diff}" ${this.currentFilters.difficulty === diff ? 'selected' : ''}>${diff}</option>`
                            ).join('')}
                        </select>
                        
                        <select id="durationFilter" class="form-control">
                            <option value="">All Durations</option>
                            <option value="10" ${this.currentFilters.maxDuration === 10 ? 'selected' : ''}>≤ 10 min</option>
                            <option value="15" ${this.currentFilters.maxDuration === 15 ? 'selected' : ''}>≤ 15 min</option>
                            <option value="20" ${this.currentFilters.maxDuration === 20 ? 'selected' : ''}>≤ 20 min</option>
                            <option value="30" ${this.currentFilters.maxDuration === 30 ? 'selected' : ''}>≤ 30 min</option>
                        </select>
                    </div>
                </div>
                
                <div class="drills-stats">
                    <div class="stat-card">
                        <span class="stat-value">${this.drills.length}</span>
                        <span class="stat-label">TOTAL DRILLS</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${this.filteredDrills.length}</span>
                        <span class="stat-label">FILTERED</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">${this.sessionAreas.length}</span>
                        <span class="stat-label">CATEGORIES</span>
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
                        <th>Drill Name</th>
                        <th>Type</th>
                        <th>Category</th>
                        <th>Difficulty</th>
                        <th>Target Type</th>
                        <th>Current</th>
                        <th>Target</th>
                        <th>Progress</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${this.filteredDrills.map(drill => {
                        const drillType = this.getDrillType(drill);
                        const targetType = drill.tempo ? 'BPM' : '%';
                        const currentValue = drill.currentValue || (drill.tempo ? 60 : 0);
                        const targetValue = drill.targetValue || (drill.tempo ? drill.tempo.max : 100);
                        
                        return `
                            <tr data-drill-id="${drill.id}">
                                <td class="drill-name">
                                    ${this.escapeHtml(drill.title)}
                                </td>
                                <td>
                                    <span class="drill-type-icon" title="${drillType}">
                                        ${this.getDrillTypeIcon(drillType)}
                                    </span>
                                </td>
                                <td>${drill.category}</td>
                                <td>
                                    <span class="difficulty-badge ${drill.difficulty.toLowerCase()}">${drill.difficulty}</span>
                                </td>
                                <td>${targetType}</td>
                                <td>${currentValue}</td>
                                <td>${targetValue}</td>
                                <td>
                                    <button class="action-btn progress-btn" data-drill-id="${drill.id}" title="View Progress">
                                        📊
                                    </button>
                                </td>
                                <td class="drill-actions-cell">
                                    <button class="action-btn start-drill-btn" data-drill-id="${drill.id}" title="Start Drill">
                                        ▶
                                    </button>
                                    <button class="action-btn edit-drill-btn" data-drill-id="${drill.id}" title="Edit Drill">
                                        ✏️
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    getDrillType(drill) {
        // Determine drill type based on properties
        if (drill.videoUrl || drill.youtubeUrl) return 'youtube';
        if (drill.audioUrl || drill.audioFile) return 'audio';
        return 'metronome'; // Default type
    }

    getDrillTypeIcon(type) {
        switch(type) {
            case 'youtube': return '📹';
            case 'audio': return '🎵';
            case 'metronome': return '🎚️';
            default: return '🎸';
        }
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
            // Start drill button
            if (e.target.closest('.start-drill-btn')) {
                const drillId = e.target.closest('.start-drill-btn').dataset.drillId;
                await this.startDrill(drillId);
                return;
            }

            // Edit drill button
            if (e.target.closest('.edit-drill-btn')) {
                const drillId = e.target.closest('.edit-drill-btn').dataset.drillId;
                await this.editDrill(drillId);
                return;
            }

            // Progress button
            if (e.target.closest('.progress-btn')) {
                const drillId = e.target.closest('.progress-btn').dataset.drillId;
                await this.showProgressChart(drillId);
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

        // Update filtered count
        const filteredStat = document.querySelector('.drills-stats .stat-card:nth-child(3) .stat-value');
        if (filteredStat) {
            filteredStat.textContent = this.filteredDrills.length;
        }
    }


    async editDrill(drillId) {
        const drill = await drillsService.getDrillById(drillId);
        if (!drill) return;

        // Create edit modal
        const modal = document.createElement('div');
        modal.className = 'modal drill-edit-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit Drill</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="editDrillForm">
                        <div class="form-group">
                            <label>Drill Name</label>
                            <input type="text" id="drillTitle" class="form-control" value="${this.escapeHtml(drill.title)}" required>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Type</label>
                                <select id="drillType" class="form-control">
                                    <option value="metronome" ${this.getDrillType(drill) === 'metronome' ? 'selected' : ''}>Metronome</option>
                                    <option value="audio" ${this.getDrillType(drill) === 'audio' ? 'selected' : ''}>Audio</option>
                                    <option value="youtube" ${this.getDrillType(drill) === 'youtube' ? 'selected' : ''}>YouTube</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Category</label>
                                <select id="drillCategory" class="form-control">
                                    ${this.sessionAreas.map(area => 
                                        `<option value="${area}" ${drill.category === area ? 'selected' : ''}>${area}</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Difficulty</label>
                                <select id="drillDifficulty" class="form-control">
                                    ${drillsService.getDifficulties().map(diff => 
                                        `<option value="${diff}" ${drill.difficulty === diff ? 'selected' : ''}>${diff}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Target Type</label>
                                <select id="targetType" class="form-control">
                                    <option value="bpm" ${drill.tempo ? 'selected' : ''}>BPM</option>
                                    <option value="percent" ${!drill.tempo ? 'selected' : ''}>Percent</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Current Value</label>
                                <input type="number" id="currentValue" class="form-control" 
                                       value="${drill.currentValue || (drill.tempo ? 60 : 0)}" min="0">
                            </div>
                            
                            <div class="form-group">
                                <label>Target Value</label>
                                <input type="number" id="targetValue" class="form-control" 
                                       value="${drill.targetValue || (drill.tempo ? drill.tempo.max : 100)}" min="0">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Instructions</label>
                            <textarea id="drillInstructions" class="form-control" rows="4">${this.escapeHtml(drill.instructions || '')}</textarea>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="submit" class="btn btn-primary">Save Changes</button>
                            <button type="button" class="btn btn-secondary cancel-btn">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle form submission
        const form = modal.querySelector('#editDrillForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const updates = {
                title: document.getElementById('drillTitle').value,
                category: document.getElementById('drillCategory').value,
                difficulty: document.getElementById('drillDifficulty').value,
                instructions: document.getElementById('drillInstructions').value,
                currentValue: parseInt(document.getElementById('currentValue').value),
                targetValue: parseInt(document.getElementById('targetValue').value)
            };
            
            // Handle type-specific fields
            const drillType = document.getElementById('drillType').value;
            const targetType = document.getElementById('targetType').value;
            
            if (targetType === 'bpm') {
                updates.tempo = {
                    min: 40,
                    max: updates.targetValue,
                    recommended: updates.currentValue
                };
            } else {
                updates.tempo = null;
            }
            
            // Add type-specific URLs
            if (drillType === 'youtube') {
                updates.videoUrl = drill.videoUrl || '';
            } else if (drillType === 'audio') {
                updates.audioUrl = drill.audioUrl || '';
            }
            
            try {
                await drillsService.updateDrill(drillId, updates);
                modal.remove();
                await this.loadDrills();
                this.render(this.container);
            } catch (error) {
                console.error('Failed to update drill:', error);
                alert('Failed to update drill');
            }
        });

        // Handle close
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('.cancel-btn').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
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

    async showProgressChart(drillId) {
        const drill = await drillsService.getDrillById(drillId);
        if (!drill) return;

        // Get practice sessions for this drill
        const sessions = await this.getDrillSessions(drillId);
        
        // Create modal with chart
        const modal = document.createElement('div');
        modal.className = 'modal progress-chart-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${this.escapeHtml(drill.title)} - Progress</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="progress-chart-container">
                        <canvas id="progressChart" width="600" height="400"></canvas>
                    </div>
                    <div class="progress-stats">
                        <div class="stat">
                            <label>Current:</label>
                            <span>${drill.currentValue || (drill.tempo ? 60 : 0)} ${drill.tempo ? 'BPM' : '%'}</span>
                        </div>
                        <div class="stat">
                            <label>Target:</label>
                            <span>${drill.targetValue || (drill.tempo ? drill.tempo.max : 100)} ${drill.tempo ? 'BPM' : '%'}</span>
                        </div>
                        <div class="stat">
                            <label>Sessions:</label>
                            <span>${sessions.length}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Draw chart
        this.drawProgressChart(sessions, drill);

        // Event listeners
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    async getDrillSessions(drillId) {
        // Get all practice sessions that mention this drill
        try {
            const entries = await this.storageService.getEntries();
            return entries.filter(entry => 
                entry.drillId === drillId || 
                (entry.notes && entry.notes.includes(drillId))
            ).map(entry => ({
                date: entry.date,
                value: entry.tempo || entry.progress || 0
            }));
        } catch (error) {
            console.error('Failed to get drill sessions:', error);
            return [];
        }
    }

    drawProgressChart(sessions, drill) {
        const canvas = document.getElementById('progressChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Set up chart area
        const chartWidth = width - (padding * 2);
        const chartHeight = height - (padding * 2);
        const chartX = padding;
        const chartY = padding;

        // Draw axes
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(chartX, chartY + chartHeight);
        ctx.lineTo(chartX + chartWidth, chartY + chartHeight);
        ctx.moveTo(chartX, chartY);
        ctx.lineTo(chartX, chartY + chartHeight);
        ctx.stroke();

        if (sessions.length === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No practice sessions yet', width / 2, height / 2);
            return;
        }

        // Calculate scale
        const targetValue = drill.targetValue || (drill.tempo ? drill.tempo.max : 100);
        const maxValue = Math.max(targetValue * 1.1, ...sessions.map(s => s.value));
        const minValue = 0;
        const valueRange = maxValue - minValue;

        // Draw target line
        ctx.strokeStyle = '#00d9ff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        const targetY = chartY + chartHeight - ((targetValue - minValue) / valueRange * chartHeight);
        ctx.beginPath();
        ctx.moveTo(chartX, targetY);
        ctx.lineTo(chartX + chartWidth, targetY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw target label
        ctx.fillStyle = '#00d9ff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`Target: ${targetValue}`, chartX - 5, targetY + 3);

        // Sort sessions by date
        sessions.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Draw progress line
        ctx.strokeStyle = '#5b5fde';
        ctx.lineWidth = 2;
        ctx.beginPath();

        sessions.forEach((session, index) => {
            const x = chartX + (index / (sessions.length - 1)) * chartWidth;
            const y = chartY + chartHeight - ((session.value - minValue) / valueRange * chartHeight);

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            // Draw point
            ctx.fillStyle = '#5b5fde';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.stroke();

        // Draw date labels
        ctx.fillStyle = '#666';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        
        const labelInterval = Math.ceil(sessions.length / 5);
        sessions.forEach((session, index) => {
            if (index % labelInterval === 0 || index === sessions.length - 1) {
                const x = chartX + (index / (sessions.length - 1)) * chartWidth;
                const date = new Date(session.date);
                const label = `${date.getMonth() + 1}/${date.getDate()}`;
                ctx.fillText(label, x, chartY + chartHeight + 20);
            }
        });
    }

    destroy() {
        clearTimeout(this.debounceTimer);
    }
}
// Admin Page - User management and drill administration
// Only accessible to admin users

import { AuthService } from '../services/authService.js';
import { firebaseSyncService } from '../services/firebaseSyncService.js';
import { drillsService } from '../services/drillsService.js';
import { StorageService } from '../services/storageService.js';

export class AdminPage {
    constructor() {
        this.users = [];
        this.drills = [];
        this.sessionAreas = [];
        this.container = null;
        this.storageService = window.app?.storageService || new StorageService('default');
        this.authService = new AuthService();
    }

    async init() {
        // Check if user is admin
        if (!this.isUserAdmin()) {
            this.showUnauthorized();
            return;
        }

        await this.loadData();
        if (this.container) {
            this.render(this.container);
        }
    }

    isUserAdmin() {
        // Check if current user is admin
        const currentUser = this.authService.getCurrentUser();
        const adminFlag = localStorage.getItem('userIsAdmin') === 'true';
        return currentUser && (currentUser.email === 'admin@example.com' || currentUser.isAdmin || adminFlag);
    }

    async loadData() {
        try {
            // Load users from Firebase
            await this.loadUsers();
            // Load drills
            this.drills = await drillsService.searchDrills('');
            // Load session areas
            this.sessionAreas = await this.storageService.getSessionAreas();
        } catch (error) {
            console.error('Failed to load admin data:', error);
        }
    }

    async loadUsers() {
        console.log('Loading users...');
        try {
            // Check if current user is admin before querying users
            if (!this.isUserAdmin()) {
                console.log('Not admin - cannot load users');
                this.users = [];
                return;
            }

            console.log('Firebase auth status:', firebaseSyncService.isAuthenticated());
            console.log('Firebase db:', firebaseSyncService.db);
            
            if (!firebaseSyncService.isAuthenticated()) {
                this.users = [];
                console.log('Firebase not authenticated - showing empty user list');
                return;
            }

            console.log('Querying Firebase users collection...');
            // Get users from Firebase
            // Note: This requires proper Firestore security rules to allow admin access
            const snapshot = await firebaseSyncService.db
                .collection('users')
                .orderBy('createdAt', 'desc')
                .limit(100)
                .get();
            
            console.log('Users query result:', snapshot.size, 'users found');
            
            this.users = [];
            
            for (const doc of snapshot.docs) {
                const userData = doc.data();
                
                // Get session count for each user
                let sessionCount = 0;
                let totalPracticeTime = 0;
                
                try {
                    const sessionsSnapshot = await firebaseSyncService.db
                        .collection('users')
                        .doc(doc.id)
                        .collection('practice_sessions')
                        .get();
                    
                    sessionCount = sessionsSnapshot.size;
                    
                    // Calculate total practice time
                    sessionsSnapshot.forEach(sessionDoc => {
                        const session = sessionDoc.data();
                        if (session.duration) {
                            totalPracticeTime += session.duration;
                        }
                    });
                } catch (err) {
                    // User might not have practice_sessions collection
                    console.log(`No sessions found for user ${doc.id}`);
                }
                
                this.users.push({ 
                    id: doc.id, 
                    email: userData.email,
                    displayName: userData.displayName,
                    createdAt: userData.createdAt,
                    lastLoginAt: userData.lastLoginAt,
                    sessionCount,
                    totalPracticeTime,
                    lastActive: userData.lastLoginAt || userData.createdAt,
                    isAdmin: userData.isAdmin || false
                });
            }
        } catch (error) {
            console.error('Failed to load users:', error);
            // Check if it's a permission error
            if (error.code === 'permission-denied') {
                console.error('Admin permission required to view users');
            }
            this.users = [];
        }
    }

    async render(container) {
        this.container = container;
        
        if (!container) {
            console.error('AdminPage: No container provided');
            return;
        }
        
        if (!this.isUserAdmin()) {
            this.showUnauthorized();
            return;
        }

        const content = `
            <div class="settings-page">
                <div class="settings-header">
                    <h2>Admin Dashboard</h2>
                </div>
                
                <div class="settings-sections">
                    <div class="admin-tabs">
                        <button class="admin-tab active" data-tab="users">Users</button>
                        <button class="admin-tab" data-tab="drills">Drills Management</button>
                    </div>
                    
                    <div class="admin-panel active" id="usersPanel">
                        ${this.renderUsersPanel()}
                    </div>
                    
                    <div class="admin-panel" id="drillsPanel">
                        ${this.renderDrillsPanel()}
                    </div>
                </div>
            </div>
        `;

        this.container.innerHTML = content;
        this.attachEventListeners();
    }

    renderUsersPanel() {
        return `
            <div class="users-section">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3>Registered Users (${this.users.length})</h3>
                    <div style="display: flex; gap: 10px;">
                        ${this.users.some(u => !u.createdAt || !u.lastLoginAt) ? 
                            '<button class="btn btn-secondary" id="fixTimestampsBtn">Fix Missing Dates</button>' : ''}
                        <button class="btn btn-primary" id="refreshUsersBtn">Refresh Users</button>
                    </div>
                </div>
                ${this.users.length === 0 ? `
                    <div class="empty-state">
                        <p>No users found. This could be because:</p>
                        <ul style="text-align: left; display: inline-block;">
                            <li>Firebase is not connected</li>
                            <li>You don't have permission to read users</li>
                            <li>No users have registered yet</li>
                        </ul>
                        <p>Click "Refresh Users" to try loading again.</p>
                    </div>
                ` : `
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Name</th>
                            <th>Admin</th>
                            <th>Joined</th>
                            <th>Last Active</th>
                            <th>Sessions</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.users.map(user => {
                            const isCurrentUser = user.email === this.authService.getCurrentUser()?.email;
                            return `
                            <tr>
                                <td>${this.escapeHtml(user.email || 'N/A')}</td>
                                <td>${this.escapeHtml(user.displayName || 'N/A')}</td>
                                <td style="text-align: center;">
                                    ${user.isAdmin ? '✓' : ''}
                                </td>
                                <td>${this.formatDate(user.createdAt)}</td>
                                <td>${this.formatDate(user.lastActive)}</td>
                                <td style="text-align: center;">${user.sessionCount || 0}</td>
                                <td style="white-space: nowrap;">
                                    <button class="btn-icon view-user-btn" data-user-id="${user.id}" title="View details">👁️</button>
                                    <button class="btn-small reset-password-btn" data-user-email="${user.email}">Reset PW</button>
                                    ${!isCurrentUser ? 
                                        (user.isAdmin ? 
                                            `<button class="btn-small btn-danger revoke-admin-btn" data-user-id="${user.id}">Remove Admin</button>` :
                                            `<button class="btn-small btn-success grant-admin-btn" data-user-id="${user.id}">Make Admin</button>`)
                                        : ''}
                                </td>
                            </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
                `}
            </div>
        `;
    }

    renderDrillsPanel() {
        return `
            <div class="drills-admin-section">
                <div class="drills-admin-header">
                    <h3>Drill Management</h3>
                    <button class="btn btn-primary" id="createDrillBtn">Create New Drill</button>
                </div>
                
                <div class="drills-admin-stats">
                    <div class="stat">
                        <span class="stat-value">${this.drills.length}</span>
                        <span class="stat-label">Total Drills</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${this.sessionAreas.length}</span>
                        <span class="stat-label">Categories</span>
                    </div>
                </div>
                
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Category</th>
                            <th>Difficulty</th>
                            <th>Target</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.drills.map(drill => {
                            const drillType = this.getDrillType(drill);
                            const targetValue = drill.targetValue || (drill.tempo ? drill.tempo.max : 100);
                            const targetType = drill.tempo ? 'BPM' : '%';
                            
                            return `
                                <tr>
                                    <td>${this.escapeHtml(drill.title)}</td>
                                    <td>${drillType}</td>
                                    <td>${drill.category}</td>
                                    <td>${drill.difficulty}</td>
                                    <td>${targetValue} ${targetType}</td>
                                    <td>
                                        <button class="btn-small edit-admin-drill-btn" data-drill-id="${drill.id}">Edit</button>
                                        <button class="btn-small delete-drill-btn" data-drill-id="${drill.id}">Delete</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    attachEventListeners() {
        // Tab switching
        this.container.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Create drill button
        this.container.querySelector('#createDrillBtn')?.addEventListener('click', () => {
            this.createNewDrill();
        });

        // Refresh users button
        this.container.querySelector('#refreshUsersBtn')?.addEventListener('click', async () => {
            const btn = this.container.querySelector('#refreshUsersBtn');
            btn.textContent = 'Loading...';
            btn.disabled = true;
            
            await this.loadUsers();
            this.render(this.container);
        });

        // Fix timestamps button
        this.container.querySelector('#fixTimestampsBtn')?.addEventListener('click', async () => {
            const btn = this.container.querySelector('#fixTimestampsBtn');
            btn.textContent = 'Fixing...';
            btn.disabled = true;
            
            await this.updateMissingTimestamps();
        });

        // Drill actions
        this.container.addEventListener('click', async (e) => {
            // Get the actual button element (in case emoji was clicked)
            const target = e.target.closest('button');
            if (!target) return;
            
            if (target.classList.contains('edit-admin-drill-btn')) {
                const drillId = target.dataset.drillId;
                await this.editDrill(drillId);
            } else if (target.classList.contains('delete-drill-btn')) {
                const drillId = target.dataset.drillId;
                await this.deleteDrill(drillId);
            } else if (target.classList.contains('view-user-btn')) {
                const userId = target.dataset.userId;
                await this.viewUserDetails(userId);
            } else if (target.classList.contains('reset-password-btn')) {
                const userEmail = target.dataset.userEmail;
                await this.resetUserPassword(userEmail);
            } else if (target.classList.contains('grant-admin-btn')) {
                const userId = target.dataset.userId;
                await this.grantAdminPrivileges(userId);
            } else if (target.classList.contains('revoke-admin-btn')) {
                const userId = target.dataset.userId;
                await this.revokeAdminPrivileges(userId);
            }
        });
    }

    switchTab(tabName) {
        // Update active tab
        this.container.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update active panel
        this.container.querySelectorAll('.admin-panel').forEach(panel => {
            panel.classList.remove('active');
        });

        if (tabName === 'users') {
            this.container.querySelector('#usersPanel').classList.add('active');
        } else if (tabName === 'drills') {
            this.container.querySelector('#drillsPanel').classList.add('active');
        }
    }

    async createNewDrill() {
        // Create modal for new drill
        const modal = document.createElement('div');
        modal.className = 'modal admin-drill-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Create New Drill</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="createDrillForm">
                        <div class="form-group">
                            <label>Drill Name</label>
                            <input type="text" id="drillTitle" class="form-control" required>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Type</label>
                                <select id="drillType" class="form-control">
                                    <option value="metronome">Metronome</option>
                                    <option value="audio">Audio</option>
                                    <option value="youtube">YouTube</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Category</label>
                                <select id="drillCategory" class="form-control">
                                    ${this.sessionAreas.map(area => 
                                        `<option value="${area}">${area}</option>`
                                    ).join('')}
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Difficulty</label>
                                <select id="drillDifficulty" class="form-control">
                                    ${drillsService.getDifficulties().map(diff => 
                                        `<option value="${diff}">${diff}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Duration (minutes)</label>
                                <input type="number" id="drillDuration" class="form-control" value="15" min="1">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Description</label>
                            <textarea id="drillDescription" class="form-control" rows="3"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>Instructions</label>
                            <textarea id="drillInstructions" class="form-control" rows="4"></textarea>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="submit" class="btn btn-primary">Create Drill</button>
                            <button type="button" class="btn btn-secondary cancel-btn">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle form submission
        const form = modal.querySelector('#createDrillForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const drillData = {
                title: document.getElementById('drillTitle').value,
                category: document.getElementById('drillCategory').value,
                difficulty: document.getElementById('drillDifficulty').value,
                duration: parseInt(document.getElementById('drillDuration').value),
                description: document.getElementById('drillDescription').value,
                instructions: document.getElementById('drillInstructions').value,
                tempo: { min: 60, max: 120, recommended: 80 }, // Default tempo
                tags: []
            };
            
            try {
                await drillsService.createDrill(drillData);
                modal.remove();
                await this.loadData();
                this.render(this.container);
            } catch (error) {
                console.error('Failed to create drill:', error);
                alert('Failed to create drill');
            }
        });

        // Handle close
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('.cancel-btn').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    async editDrill(drillId) {
        const drill = await drillsService.getDrillById(drillId);
        if (!drill) return;

        // Create edit modal
        const modal = document.createElement('div');
        modal.className = 'modal admin-drill-modal';
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
                                    <option value="metronome" ${this.getDrillType(drill) === 'Metronome' ? 'selected' : ''}>Metronome</option>
                                    <option value="audio" ${this.getDrillType(drill) === 'Audio' ? 'selected' : ''}>Audio</option>
                                    <option value="youtube" ${this.getDrillType(drill) === 'YouTube' ? 'selected' : ''}>YouTube</option>
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
                                <label>Duration (minutes)</label>
                                <input type="number" id="drillDuration" class="form-control" value="${drill.duration || 15}" min="1">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Target Type</label>
                                <select id="targetType" class="form-control">
                                    <option value="bpm" ${drill.tempo ? 'selected' : ''}>BPM</option>
                                    <option value="percent" ${!drill.tempo ? 'selected' : ''}>Percent</option>
                                </select>
                            </div>
                            
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
                            <label>Description</label>
                            <textarea id="drillDescription" class="form-control" rows="3">${this.escapeHtml(drill.description || '')}</textarea>
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
                duration: parseInt(document.getElementById('drillDuration').value),
                description: document.getElementById('drillDescription').value,
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
            
            try {
                await drillsService.updateDrill(drillId, updates);
                modal.remove();
                await this.loadData();
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

    async deleteDrill(drillId) {
        if (!confirm('Are you sure you want to delete this drill?')) {
            return;
        }

        try {
            await drillsService.deleteDrill(drillId);
            await this.loadData();
            this.render(this.container);
        } catch (error) {
            console.error('Failed to delete drill:', error);
            alert('Failed to delete drill');
        }
    }

    async viewUserDetails(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        // Create modal to show user details
        const modal = document.createElement('div');
        modal.className = 'modal user-details-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>User Details</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="user-details-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                        <div class="detail-section">
                            <h3 style="margin-bottom: 1rem; color: var(--primary-color);">Account Information</h3>
                            <div class="detail-row" style="margin-bottom: 0.75rem;">
                                <strong style="color: var(--text-secondary);">Email:</strong>
                                <span style="color: var(--text-primary);">${this.escapeHtml(user.email || 'N/A')}</span>
                            </div>
                            <div class="detail-row" style="margin-bottom: 0.75rem;">
                                <strong style="color: var(--text-secondary);">Display Name:</strong>
                                <span style="color: var(--text-primary);">${this.escapeHtml(user.displayName || 'N/A')}</span>
                            </div>
                            <div class="detail-row" style="margin-bottom: 0.75rem;">
                                <strong style="color: var(--text-secondary);">User ID:</strong>
                                <span style="color: var(--text-primary); font-family: monospace; font-size: 0.875rem;">${user.id}</span>
                            </div>
                            <div class="detail-row" style="margin-bottom: 0.75rem;">
                                <strong style="color: var(--text-secondary);">Admin Status:</strong>
                                <span style="color: ${user.isAdmin ? 'var(--success-color)' : 'var(--text-primary)'};">
                                    ${user.isAdmin ? 'Yes ✓' : 'No'}
                                </span>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h3 style="margin-bottom: 1rem; color: var(--primary-color);">Activity Statistics</h3>
                            <div class="detail-row" style="margin-bottom: 0.75rem;">
                                <strong style="color: var(--text-secondary);">Account Created:</strong>
                                <span style="color: var(--text-primary);">${this.formatDate(user.createdAt)}</span>
                            </div>
                            <div class="detail-row" style="margin-bottom: 0.75rem;">
                                <strong style="color: var(--text-secondary);">Last Login:</strong>
                                <span style="color: var(--text-primary);">${this.formatDate(user.lastActive)}</span>
                            </div>
                            <div class="detail-row" style="margin-bottom: 0.75rem;">
                                <strong style="color: var(--text-secondary);">Total Sessions:</strong>
                                <span style="color: var(--text-primary);">${user.sessionCount || 0}</span>
                            </div>
                            <div class="detail-row" style="margin-bottom: 0.75rem;">
                                <strong style="color: var(--text-secondary);">Total Practice Time:</strong>
                                <span style="color: var(--text-primary);">${this.formatDuration(user.totalPracticeTime || 0)}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${user.sessionCount > 0 ? `
                    <div class="practice-summary" style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
                        <h3 style="margin-bottom: 1rem; color: var(--primary-color);">Practice Summary</h3>
                        <div class="summary-stats" style="display: flex; gap: 2rem; justify-content: center;">
                            <div style="text-align: center;">
                                <div style="font-size: 2rem; font-weight: bold; color: var(--primary-color);">
                                    ${Math.round((user.totalPracticeTime || 0) / (user.sessionCount || 1) / 60)}
                                </div>
                                <div style="color: var(--text-secondary);">Avg Minutes/Session</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 2rem; font-weight: bold; color: var(--primary-color);">
                                    ${Math.round((user.totalPracticeTime || 0) / 3600)}
                                </div>
                                <div style="color: var(--text-secondary);">Total Hours</div>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary close-btn">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle close
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('.close-btn').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    showUnauthorized() {
        this.container.innerHTML = `
            <div class="settings-page">
                <div class="settings-header">
                    <h2>Access Denied</h2>
                </div>
                
                <div class="settings-sections">
                    <div class="settings-section">
                        <p>You do not have permission to access this page.</p>
                        <p>Admin access is required.</p>
                        <a href="#dashboard" class="btn btn-primary">Return to Dashboard</a>
                    </div>
                </div>
            </div>
        `;
    }

    // Utility methods
    getDrillType(drill) {
        if (drill.videoUrl || drill.youtubeUrl) return 'YouTube';
        if (drill.audioUrl || drill.audioFile) return 'Audio';
        return 'Metronome';
    }

    formatDate(dateValue) {
        if (!dateValue) return 'N/A';
        
        let date;
        
        // Handle Firebase Timestamp objects
        if (dateValue && typeof dateValue.toDate === 'function') {
            date = dateValue.toDate();
        }
        // Handle Firebase Timestamp-like objects with seconds property
        else if (dateValue && dateValue.seconds) {
            date = new Date(dateValue.seconds * 1000);
        }
        // Handle regular date strings or Date objects
        else if (dateValue) {
            date = new Date(dateValue);
        }
        
        // Check if date is valid
        if (!date || isNaN(date.getTime())) {
            return 'N/A';
        }
        
        // Format as dd-mmm-yy
        const day = date.getDate().toString().padStart(2, '0');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getMonth()];
        const year = date.getFullYear().toString().slice(-2);
        
        return `${day}-${month}-${year}`;
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    async resetUserPassword(email) {
        if (!email) {
            alert('No email address provided');
            return;
        }

        if (!confirm(`Send password reset email to ${email}?`)) {
            return;
        }

        try {
            const result = await this.authService.resetPassword(email);
            
            if (result.success) {
                alert(`Password reset email sent to ${email}`);
            } else {
                alert(`Failed to send password reset: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Password reset error:', error);
            alert(`Error sending password reset: ${error.message}`);
        }
    }

    async updateMissingTimestamps() {
        // Add timestamps to users who don't have them
        try {
            const batch = firebaseSyncService.db.batch();
            let updateCount = 0;

            for (const user of this.users) {
                if (!user.createdAt || !user.lastLoginAt) {
                    const userRef = firebaseSyncService.db.collection('users').doc(user.id);
                    const updates = {};
                    
                    if (!user.createdAt) {
                        // Use account creation date or current date as fallback
                        updates.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                    }
                    
                    if (!user.lastLoginAt) {
                        updates.lastLoginAt = firebase.firestore.FieldValue.serverTimestamp();
                    }
                    
                    batch.update(userRef, updates);
                    updateCount++;
                }
            }

            if (updateCount > 0) {
                await batch.commit();
                console.log(`Updated timestamps for ${updateCount} users`);
                // Reload users to show updated data
                await this.loadUsers();
                this.render(this.container);
            }
        } catch (error) {
            console.error('Failed to update user timestamps:', error);
        }
    }

    async grantAdminPrivileges(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        if (!confirm(`Grant admin privileges to ${user.email}?`)) {
            return;
        }

        try {
            // Update in Firestore
            await firebaseSyncService.db
                .collection('users')
                .doc(userId)
                .update({
                    isAdmin: true
                });

            // Update local data
            user.isAdmin = true;
            
            // Re-render
            this.render(this.container);
            
            this.showNotification(`Admin privileges granted to ${user.email}`, 'success');
        } catch (error) {
            console.error('Failed to grant admin privileges:', error);
            alert('Failed to grant admin privileges. Check console for details.');
        }
    }

    async revokeAdminPrivileges(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        if (!confirm(`Remove admin privileges from ${user.email}?`)) {
            return;
        }

        try {
            // Update in Firestore
            await firebaseSyncService.db
                .collection('users')
                .doc(userId)
                .update({
                    isAdmin: false
                });

            // Update local data
            user.isAdmin = false;
            
            // Re-render
            this.render(this.container);
            
            this.showNotification(`Admin privileges removed from ${user.email}`, 'success');
        } catch (error) {
            console.error('Failed to revoke admin privileges:', error);
            alert('Failed to revoke admin privileges. Check console for details.');
        }
    }

    showNotification(message, type = 'info') {
        // Show a temporary notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? 'var(--success-color)' : 'var(--error-color)'};
            color: white;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    destroy() {
        // Cleanup if needed
    }
}

export default AdminPage;
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
                    ...userData,
                    sessionCount,
                    totalPracticeTime,
                    lastActive: userData.lastLoginAt || userData.createdAt
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
                    <button class="btn btn-primary" id="refreshUsersBtn">Refresh Users</button>
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
                            <th>Joined</th>
                            <th>Last Active</th>
                            <th>Sessions</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.users.map(user => `
                            <tr>
                                <td>${this.escapeHtml(user.email || 'N/A')}</td>
                                <td>${this.escapeHtml(user.displayName || 'N/A')}</td>
                                <td>${this.formatDate(user.createdAt)}</td>
                                <td>${this.formatDate(user.lastActive)}</td>
                                <td>${user.sessionCount || 0}</td>
                                <td>
                                    <button class="btn-small view-user-btn" data-user-id="${user.id}">View</button>
                                    <button class="btn-small reset-password-btn" data-user-email="${user.email}">Reset Password</button>
                                </td>
                            </tr>
                        `).join('')}
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

        // Drill actions
        this.container.addEventListener('click', async (e) => {
            if (e.target.classList.contains('edit-admin-drill-btn')) {
                const drillId = e.target.dataset.drillId;
                await this.editDrill(drillId);
            } else if (e.target.classList.contains('delete-drill-btn')) {
                const drillId = e.target.dataset.drillId;
                await this.deleteDrill(drillId);
            } else if (e.target.classList.contains('view-user-btn')) {
                const userId = e.target.dataset.userId;
                await this.viewUserDetails(userId);
            } else if (e.target.classList.contains('reset-password-btn')) {
                const userEmail = e.target.dataset.userEmail;
                await this.resetUserPassword(userEmail);
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
            <div class="modal-content">
                <div class="modal-header">
                    <h2>User Details</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="user-info">
                        <p><strong>Email:</strong> ${this.escapeHtml(user.email || 'N/A')}</p>
                        <p><strong>Name:</strong> ${this.escapeHtml(user.displayName || 'N/A')}</p>
                        <p><strong>User ID:</strong> ${user.id}</p>
                        <p><strong>Joined:</strong> ${this.formatDate(user.createdAt)}</p>
                        <p><strong>Last Active:</strong> ${this.formatDate(user.lastActive)}</p>
                        <p><strong>Total Sessions:</strong> ${user.sessionCount || 0}</p>
                        <p><strong>Total Practice Time:</strong> ${this.formatDuration(user.totalPracticeTime || 0)}</p>
                    </div>
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

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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

    destroy() {
        // Cleanup if needed
    }
}

export default AdminPage;
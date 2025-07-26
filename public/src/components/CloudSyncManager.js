// Cloud Sync Manager Component
import firebaseSyncService from '../services/firebaseSyncService.js';

export class CloudSyncManager {
    constructor(storageService) {
        this.storageService = storageService;
        this.firebaseSync = firebaseSyncService;
        this.isInitialized = false;
        this.syncStatus = 'idle';
        this.container = null;
    }

    async init() {
        // Wait for Firebase to initialize
        await this.firebaseSync.waitForInitialization();
        this.isInitialized = true;

        // Listen for auth state changes
        window.addEventListener('authStateChanged', () => {
            this.updateUI();
        });

        // Listen for data sync events
        window.addEventListener('practiceSessionSync', () => this.handleSyncEvent('practice'));
        window.addEventListener('goalSync', () => this.handleSyncEvent('goal'));
        window.addEventListener('repertoireSync', () => this.handleSyncEvent('repertoire'));
    }

    handleSyncEvent(type) {
        this.showNotification(`${type} data synced from cloud`, 'success');
        this.updateSyncStatus();
    }

    render(container) {
        this.container = container;
        this.updateUI();
    }

    updateUI() {
        if (!this.container) return;

        const isAuthenticated = this.firebaseSync.isAuthenticated();
        const pendingWrites = this.firebaseSync.getPendingWritesCount();

        this.container.innerHTML = `
            <div class="cloud-sync-manager">
                <h3>Cloud Sync Settings</h3>
                
                <div class="sync-status">
                    <div class="status-indicator ${isAuthenticated ? 'connected' : 'disconnected'}">
                        <i class="fas fa-circle"></i>
                        ${isAuthenticated ? 'Connected' : 'Not Connected'}
                    </div>
                    ${
                        pendingWrites > 0
                            ? `
                        <div class="pending-sync">
                            <i class="fas fa-sync-alt"></i>
                            ${pendingWrites} items pending sync
                        </div>
                    `
                            : ''
                    }
                </div>

                ${
                    isAuthenticated
                        ? `
                    <div class="sync-controls">
                        <div class="user-info">
                            <i class="fas fa-user"></i>
                            ${this.firebaseSync.getCurrentUser().email}
                        </div>
                        
                        <div class="sync-actions">
                            <button class="btn btn-primary" id="syncNowBtn">
                                <i class="fas fa-sync"></i>
                                Sync Now
                            </button>
                            
                            <button class="btn btn-secondary" id="migrateBtn">
                                <i class="fas fa-cloud-upload-alt"></i>
                                Upload Local Data
                            </button>
                            
                            <button class="btn btn-secondary" id="downloadBtn">
                                <i class="fas fa-cloud-download-alt"></i>
                                Download Cloud Data
                            </button>
                        </div>
                        
                        <div class="sync-settings">
                            <label class="checkbox-label">
                                <input type="checkbox" id="autoSyncToggle" ${this.storageService.cloudSyncEnabled ? 'checked' : ''}>
                                <span>Enable automatic sync</span>
                            </label>
                        </div>
                        
                        <div class="danger-zone">
                            <h4>Danger Zone</h4>
                            <button class="btn btn-danger" id="signOutBtn">
                                <i class="fas fa-sign-out-alt"></i>
                                Sign Out
                            </button>
                        </div>
                    </div>
                `
                        : `
                    <div class="sync-auth">
                        <p>Sign in to enable cloud sync and protect your practice data</p>
                        <button class="btn btn-primary" id="signInBtn">
                            <i class="fas fa-sign-in-alt"></i>
                            Sign In
                        </button>
                        <button class="btn btn-secondary" id="signUpBtn">
                            <i class="fas fa-user-plus"></i>
                            Create Account
                        </button>
                    </div>
                `
                }
                
                <div id="syncNotifications" class="sync-notifications"></div>
            </div>
        `;

        this.attachEventListeners();
    }

    attachEventListeners() {
        const syncNowBtn = this.container.querySelector('#syncNowBtn');
        const migrateBtn = this.container.querySelector('#migrateBtn');
        const downloadBtn = this.container.querySelector('#downloadBtn');
        const autoSyncToggle = this.container.querySelector('#autoSyncToggle');
        const signInBtn = this.container.querySelector('#signInBtn');
        const signUpBtn = this.container.querySelector('#signUpBtn');
        const signOutBtn = this.container.querySelector('#signOutBtn');

        if (syncNowBtn) {
            syncNowBtn.addEventListener('click', () => this.syncNow());
        }

        if (migrateBtn) {
            migrateBtn.addEventListener('click', () => this.migrateToCloud());
        }

        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadFromCloud());
        }

        if (autoSyncToggle) {
            autoSyncToggle.addEventListener('change', (e) => {
                this.storageService.cloudSyncEnabled = e.target.checked;
                localStorage.setItem('cloudSyncEnabled', e.target.checked);
                this.showNotification(
                    e.target.checked ? 'Auto-sync enabled' : 'Auto-sync disabled',
                    'info'
                );
            });
        }

        if (signInBtn) {
            signInBtn.addEventListener('click', () => this.showAuthModal('signin'));
        }

        if (signUpBtn) {
            signUpBtn.addEventListener('click', () => this.showAuthModal('signup'));
        }

        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => this.signOut());
        }
    }

    async syncNow() {
        this.showNotification('Starting sync...', 'info');
        this.setSyncStatus('syncing');

        try {
            // Sync both ways
            await this.storageService.syncFromFirebase();
            this.showNotification('Sync completed successfully!', 'success');
        } catch (error) {
            console.error('Sync failed:', error);
            this.showNotification('Sync failed: ' + error.message, 'error');
        } finally {
            this.setSyncStatus('idle');
        }
    }

    async migrateToCloud() {
        const confirmed = confirm(
            'This will upload all your local data to the cloud. ' +
                'Any existing cloud data will be merged. Continue?'
        );

        if (!confirmed) return;

        this.showNotification('Starting migration...', 'info');
        this.setSyncStatus('migrating');

        try {
            const success = await this.storageService.migrateToFirebase();
            if (success) {
                this.showNotification('Migration completed successfully!', 'success');
            } else {
                throw new Error('Migration failed');
            }
        } catch (error) {
            console.error('Migration failed:', error);
            this.showNotification('Migration failed: ' + error.message, 'error');
        } finally {
            this.setSyncStatus('idle');
        }
    }

    async downloadFromCloud() {
        const confirmed = confirm(
            'This will download all cloud data and merge with your local data. ' +
                'Newer versions will be kept. Continue?'
        );

        if (!confirmed) return;

        this.showNotification('Downloading from cloud...', 'info');
        this.setSyncStatus('downloading');

        try {
            const success = await this.storageService.syncFromFirebase();
            if (success) {
                this.showNotification('Download completed successfully!', 'success');
                // Refresh the page to show updated data
                setTimeout(() => window.location.reload(), 1000);
            } else {
                throw new Error('Download failed');
            }
        } catch (error) {
            console.error('Download failed:', error);
            this.showNotification('Download failed: ' + error.message, 'error');
        } finally {
            this.setSyncStatus('idle');
        }
    }

    async signOut() {
        const confirmed = confirm('Are you sure you want to sign out?');
        if (!confirmed) return;

        try {
            await this.firebaseSync.signOut();
            this.showNotification('Signed out successfully', 'success');
            this.updateUI();
        } catch (error) {
            console.error('Sign out failed:', error);
            this.showNotification('Sign out failed: ' + error.message, 'error');
        }
    }

    showAuthModal(mode) {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content auth-modal">
                <div class="modal-header">
                    <h2>${mode === 'signin' ? 'Sign In' : 'Create Account'}</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="authForm">
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" required class="form-control">
                        </div>
                        <div class="form-group">
                            <label for="password">Password</label>
                            <input type="password" id="password" required class="form-control">
                        </div>
                        ${
                            mode === 'signup'
                                ? `
                            <div class="form-group">
                                <label for="displayName">Display Name (optional)</label>
                                <input type="text" id="displayName" class="form-control">
                            </div>
                        `
                                : ''
                        }
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">
                                ${mode === 'signin' ? 'Sign In' : 'Create Account'}
                            </button>
                            <button type="button" class="btn btn-secondary modal-cancel">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Handle form submission
        const form = modal.querySelector('#authForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = form.email.value;
            const password = form.password.value;
            const displayName = form.displayName?.value;

            try {
                let result;
                if (mode === 'signin') {
                    result = await this.firebaseSync.signIn(email, password);
                } else {
                    result = await this.firebaseSync.signUp(email, password, displayName);
                }

                if (result.success) {
                    this.showNotification(
                        mode === 'signin'
                            ? 'Signed in successfully!'
                            : 'Account created successfully!',
                        'success'
                    );
                    modal.remove();
                    this.updateUI();

                    // Offer to migrate local data for new users
                    if (mode === 'signup') {
                        setTimeout(() => {
                            if (
                                confirm(
                                    'Would you like to upload your local practice data to the cloud?'
                                )
                            ) {
                                this.migrateToCloud();
                            }
                        }, 1000);
                    }
                } else {
                    throw new Error(result.error);
                }
            } catch (error) {
                this.showNotification(error.message, 'error');
            }
        });

        // Handle modal close
        modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('.modal-cancel').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    setSyncStatus(status) {
        this.syncStatus = status;
        this.updateSyncStatus();
    }

    updateSyncStatus() {
        const pendingWrites = this.firebaseSync.getPendingWritesCount();
        const statusElement = this.container.querySelector('.sync-status');

        if (statusElement && pendingWrites > 0) {
            const pendingElement = statusElement.querySelector('.pending-sync');
            if (pendingElement) {
                pendingElement.textContent = `${pendingWrites} items pending sync`;
            }
        }
    }

    showNotification(message, type = 'info') {
        const notifications = this.container.querySelector('#syncNotifications');
        if (!notifications) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${
                type === 'success'
                    ? 'check-circle'
                    : type === 'error'
                      ? 'exclamation-circle'
                      : 'info-circle'
            }"></i>
            <span>${message}</span>
        `;

        notifications.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

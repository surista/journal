// Enhanced cloudSyncHandler.js with real-time sync
import { cloudStorage } from './firebaseService.js';
import { SyncEngine } from './syncEngine.js';

export class CloudSyncHandler {
    constructor(storageService) {
        this.storageService = storageService;
        this.syncEngine = new SyncEngine(storageService);
        this.status = 'checking';
        this.lastSync = null;
        this.isInitialized = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Auth state changes
        window.addEventListener('authStateChanged', (event) => {
            const { user } = event.detail;
            if (user) {
                this.onUserLogin(user);
            } else {
                this.onUserLogout();
            }
        });

        // Sync events
        window.addEventListener('syncEnabled', () => {
            this.updateStatus('syncing');
        });

        window.addEventListener('syncinitialSyncComplete', () => {
            this.updateStatus('synced', new Date());
        });

        window.addEventListener('syncError', (event) => {
            this.updateStatus('error', null, event.detail.error);
        });

        window.addEventListener('syncconflictDetected', (event) => {
            this.updateStatus('conflict');
            this.showConflictNotification(event.detail);
        });

        window.addEventListener('syncrecordAdded', () => {
            this.refreshDashboard();
        });

        window.addEventListener('syncrecordUpdated', () => {
            this.refreshDashboard();
        });

        window.addEventListener('syncrecordDeleted', () => {
            this.refreshDashboard();
        });

        // Network status
        window.addEventListener('online', () => {
            if (cloudStorage.isAuthenticated()) {
                this.updateStatus('syncing');
            }
        });

        window.addEventListener('offline', () => {
            this.updateStatus('offline');
        });
    }

    async onUserLogin(user) {
        console.log('🔄 User logged in, initializing sync...');

        try {
            // Check if user has existing cloud data
            const hasCloudData = await this.checkForCloudData();

            if (!hasCloudData) {
                // First time user - migrate local data
                await this.migrateLocalDataToCloud();
            }

            // Enable real-time sync
            await this.syncEngine.enableSync();
            this.isInitialized = true;

        } catch (error) {
            console.error('❌ Sync initialization failed:', error);
            this.updateStatus('error', null, error.message);
        }
    }

    onUserLogout() {
        console.log('👋 User logged out, disabling sync...');
        this.syncEngine.disableSync();
        this.isInitialized = false;
        this.updateStatus('checking');
    }

    async checkForCloudData() {
        try {
            const sessions = await cloudStorage.getPracticeSessions();
            const goals = await cloudStorage.getGoals();
            const repertoire = await cloudStorage.getRepertoire();

            return sessions.length > 0 || goals.length > 0 || repertoire.length > 0;
        } catch (error) {
            console.error('Error checking cloud data:', error);
            return false;
        }
    }

    async migrateLocalDataToCloud() {
        console.log('📤 Migrating local data to cloud...');

        try {
            const localData = {
                practiceSessions: await this.storageService.getPracticeEntries(),
                goals: await this.storageService.getGoals(),
                repertoire: await this.storageService.getRepertoire()
            };

            await cloudStorage.migrateLocalData(localData);

            this.showMigrationCompleteNotification(localData);

        } catch (error) {
            console.error('❌ Migration failed:', error);
            throw error;
        }
    }

    // Status management
    updateStatus(status, lastSync = this.lastSync, errorMessage = null) {
        this.status = status;
        this.lastSync = lastSync;
        this.errorMessage = errorMessage;
        this.updateCloudStatus();
    }

    updateCloudStatus() {
        const syncStatus = this.getSyncStatusInfo();

        // Update UI elements
        this.updateSyncIndicator(syncStatus);

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('cloudStatusUpdated', {
            detail: syncStatus
        }));
    }

    getSyncStatusInfo() {
        const syncStatus = this.syncEngine.getStatus();

        return {
            status: this.status,
            lastSync: this.lastSync,
            errorMessage: this.errorMessage,
            isOnline: navigator.onLine,
            isAuthenticated: syncStatus.authenticated,
            queueSize: syncStatus.queueSize,
            conflictCount: syncStatus.conflictCount,
            deviceInfo: syncStatus.deviceInfo
        };
    }

    updateSyncIndicator(syncStatus) {
        const syncIcon = document.getElementById('syncIcon');
        const syncText = document.getElementById('syncText');

        if (!syncIcon || !syncText) return;

        const { icon, text, color } = this.getStatusDisplay(syncStatus);

        syncIcon.textContent = icon;
        syncText.textContent = text;
        syncIcon.style.color = color;
        syncText.style.color = color;

        // Add click handler for conflicts
        if (syncStatus.conflictCount > 0) {
            syncIcon.style.cursor = 'pointer';
            syncIcon.onclick = () => this.showConflictResolver();
        } else {
            syncIcon.style.cursor = 'default';
            syncIcon.onclick = null;
        }
    }

    getStatusDisplay(syncStatus) {
        if (!syncStatus.isOnline) {
            return {
                icon: '📴',
                text: 'Offline',
                color: '#9ca3af'
            };
        }

        if (!syncStatus.isAuthenticated) {
            return {
                icon: '👤',
                text: 'Sign in for sync',
                color: '#f59e0b'
            };
        }

        if (syncStatus.conflictCount > 0) {
            return {
                icon: '⚠️',
                text: `${syncStatus.conflictCount} conflicts`,
                color: '#f59e0b'
            };
        }

        if (syncStatus.queueSize > 0) {
            return {
                icon: '⏳',
                text: `${syncStatus.queueSize} pending`,
                color: '#6366f1'
            };
        }

        switch (this.status) {
            case 'synced':
                return {
                    icon: '✅',
                    text: `Synced ${this.getRelativeTime(this.lastSync)}`,
                    color: '#10b981'
                };
            case 'syncing':
                return {
                    icon: '🔄',
                    text: 'Syncing...',
                    color: '#6366f1'
                };
            case 'error':
                return {
                    icon: '❌',
                    text: 'Sync error',
                    color: '#ef4444'
                };
            default:
                return {
                    icon: '🔄',
                    text: 'Checking...',
                    color: '#6b7280'
                };
        }
    }

    getRelativeTime(date) {
        if (!date) return '';

        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }

    // Notifications
    showConflictNotification(conflictData) {
        if (window.notificationManager) {
            window.notificationManager.warning(
                'Sync conflict detected. Click sync status to resolve.',
                { duration: 0 }
            );
        }
    }

    showMigrationCompleteNotification(data) {
        const totalItems = data.practiceSessions.length + data.goals.length + data.repertoire.length;

        if (window.notificationManager) {
            window.notificationManager.success(
                `Successfully synced ${totalItems} items to cloud!`,
                { duration: 5000 }
            );
        }
    }

    showConflictResolver() {
        // Create or show conflict resolution UI
        window.dispatchEvent(new CustomEvent('showConflictResolver'));
    }

    refreshDashboard() {
        // Refresh dashboard data when sync changes occur
        if (window.app?.currentPage?.loadDashboardData) {
            window.app.currentPage.loadDashboardData();
        }
    }

    // Manual sync triggers
    async forceSyncUp() {
        if (!cloudStorage.isAuthenticated()) return;

        this.updateStatus('syncing');

        try {
            const localData = {
                practiceSessions: await this.storageService.getPracticeEntries(),
                goals: await this.storageService.getGoals(),
                repertoire: await this.storageService.getRepertoire()
            };

            await cloudStorage.migrateLocalData(localData);
            this.updateStatus('synced', new Date());

        } catch (error) {
            this.updateStatus('error', null, error.message);
        }
    }

    async forceSyncDown() {
        if (!cloudStorage.isAuthenticated()) return;

        this.updateStatus('syncing');

        try {
            await this.syncEngine.performInitialSync();
            this.updateStatus('synced', new Date());

        } catch (error) {
            this.updateStatus('error', null, error.message);
        }
    }

    // Public interface
    isEnabled() {
        return this.isInitialized && cloudStorage.isAuthenticated();
    }

    getConflicts() {
        return this.syncEngine.conflicts;
    }

    async resolveConflict(conflictIndex, choice) {
        await this.syncEngine.resolveConflict(conflictIndex, choice);
        this.updateCloudStatus();
    }

    destroy() {
        this.syncEngine.disableSync();
    }
}
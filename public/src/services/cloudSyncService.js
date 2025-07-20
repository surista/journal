// Cloud Sync Service using Firebase
export class CloudSyncService {
    constructor(authService) {
        this.authService = authService;
        this.db = null;
        this.syncEnabled = false;
        this.syncInProgress = false;
        this.lastSyncTime = null;
        this.syncInterval = null;
        this.conflictResolutionStrategy = 'latest'; // 'latest', 'merge', 'manual'
        
        this.init();
    }

    async init() {
        // Check if Firebase is available
        if (typeof firebase !== 'undefined') {
            try {
                this.db = firebase.firestore();
                this.setupRealtimeSync();
                this.loadSyncSettings();
                console.log('Cloud sync service initialized');
            } catch (error) {
                console.error('Failed to initialize cloud sync:', error);
            }
        } else {
            console.warn('Firebase not available. Cloud sync disabled.');
        }
    }

    loadSyncSettings() {
        const settings = localStorage.getItem('cloudSyncSettings');
        if (settings) {
            const parsed = JSON.parse(settings);
            this.syncEnabled = parsed.enabled || false;
            this.conflictResolutionStrategy = parsed.conflictResolution || 'latest';
            
            if (this.syncEnabled) {
                this.startAutoSync();
            }
        }
    }

    saveSyncSettings() {
        localStorage.setItem('cloudSyncSettings', JSON.stringify({
            enabled: this.syncEnabled,
            conflictResolution: this.conflictResolutionStrategy,
            lastSync: this.lastSyncTime
        }));
    }

    async enableSync() {
        if (!this.authService.isAuthenticated()) {
            throw new Error('Authentication required for cloud sync');
        }
        
        this.syncEnabled = true;
        this.saveSyncSettings();
        await this.performFullSync();
        this.startAutoSync();
    }

    disableSync() {
        this.syncEnabled = false;
        this.saveSyncSettings();
        this.stopAutoSync();
    }

    startAutoSync() {
        // Sync every 5 minutes
        this.syncInterval = setInterval(() => {
            if (this.syncEnabled && !this.syncInProgress) {
                this.performIncrementalSync();
            }
        }, 5 * 60 * 1000);
        
        // Also sync on visibility change
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        // Sync on online/offline status change
        window.addEventListener('online', this.handleOnline.bind(this));
        window.addEventListener('offline', this.handleOffline.bind(this));
    }

    stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    handleVisibilityChange() {
        if (!document.hidden && this.syncEnabled) {
            this.performIncrementalSync();
        }
    }

    handleOnline() {
        if (this.syncEnabled) {
            this.showNotification('Back online. Syncing...', 'info');
            this.performIncrementalSync();
        }
    }

    handleOffline() {
        this.showNotification('Offline mode. Changes will sync when connection restored.', 'warning');
    }

    async performFullSync() {
        if (!this.db || !this.authService.isAuthenticated()) return;
        
        this.syncInProgress = true;
        const userId = this.authService.getCurrentUser().uid;
        
        try {
            // Get all local data
            const localData = await this.getAllLocalData();
            
            // Get all cloud data
            const cloudData = await this.getAllCloudData(userId);
            
            // Merge data based on conflict resolution strategy
            const mergedData = await this.mergeData(localData, cloudData);
            
            // Update local storage
            await this.updateLocalData(mergedData);
            
            // Update cloud storage
            await this.updateCloudData(userId, mergedData);
            
            this.lastSyncTime = new Date().toISOString();
            this.saveSyncSettings();
            
            this.showNotification('Sync completed successfully', 'success');
        } catch (error) {
            console.error('Full sync failed:', error);
            this.showNotification('Sync failed. Will retry later.', 'error');
        } finally {
            this.syncInProgress = false;
        }
    }

    async performIncrementalSync() {
        if (!this.db || !this.authService.isAuthenticated() || this.syncInProgress) return;
        
        this.syncInProgress = true;
        const userId = this.authService.getCurrentUser().uid;
        
        try {
            // Get changes since last sync
            const localChanges = await this.getLocalChangesSince(this.lastSyncTime);
            const cloudChanges = await this.getCloudChangesSince(userId, this.lastSyncTime);
            
            // Apply cloud changes to local
            if (cloudChanges.length > 0) {
                await this.applyCloudChangesToLocal(cloudChanges);
            }
            
            // Push local changes to cloud
            if (localChanges.length > 0) {
                await this.pushLocalChangesToCloud(userId, localChanges);
            }
            
            this.lastSyncTime = new Date().toISOString();
            this.saveSyncSettings();
            
        } catch (error) {
            console.error('Incremental sync failed:', error);
        } finally {
            this.syncInProgress = false;
        }
    }

    async getAllLocalData() {
        const data = {
            practiceEntries: [],
            repertoire: [],
            goals: [],
            settings: {},
            statistics: {}
        };
        
        // Get from IndexedDB
        try {
            const db = await this.openIndexedDB();
            
            // Practice entries
            const practiceStore = db.transaction(['practiceEntries'], 'readonly').objectStore('practiceEntries');
            data.practiceEntries = await this.getAllFromStore(practiceStore);
            
            // Repertoire
            const repertoireStore = db.transaction(['repertoire'], 'readonly').objectStore('repertoire');
            data.repertoire = await this.getAllFromStore(repertoireStore);
            
            // Goals
            const goalsStore = db.transaction(['goals'], 'readonly').objectStore('goals');
            data.goals = await this.getAllFromStore(goalsStore);
            
        } catch (error) {
            console.error('Error reading local data:', error);
        }
        
        // Get settings from localStorage
        data.settings = {
            theme: localStorage.getItem('theme'),
            metronomeSettings: localStorage.getItem('metronomeSettings'),
            audioSettings: localStorage.getItem('audioSettings'),
            practiceReminders: localStorage.getItem('practiceReminders')
        };
        
        return data;
    }

    async getAllCloudData(userId) {
        const data = {
            practiceEntries: [],
            repertoire: [],
            goals: [],
            settings: {},
            statistics: {}
        };
        
        try {
            // Get user document
            const userDoc = await this.db.collection('users').doc(userId).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                data.settings = userData.settings || {};
                data.statistics = userData.statistics || {};
            }
            
            // Get practice entries
            const practiceSnapshot = await this.db
                .collection('users')
                .doc(userId)
                .collection('practiceEntries')
                .get();
            
            data.practiceEntries = practiceSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Get repertoire
            const repertoireSnapshot = await this.db
                .collection('users')
                .doc(userId)
                .collection('repertoire')
                .get();
            
            data.repertoire = repertoireSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Get goals
            const goalsSnapshot = await this.db
                .collection('users')
                .doc(userId)
                .collection('goals')
                .get();
            
            data.goals = goalsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
        } catch (error) {
            console.error('Error reading cloud data:', error);
        }
        
        return data;
    }

    async mergeData(localData, cloudData) {
        const merged = {
            practiceEntries: [],
            repertoire: [],
            goals: [],
            settings: {},
            statistics: {}
        };
        
        // Merge based on strategy
        if (this.conflictResolutionStrategy === 'latest') {
            // For each data type, keep the most recent version
            merged.practiceEntries = this.mergeByTimestamp([...localData.practiceEntries, ...cloudData.practiceEntries]);
            merged.repertoire = this.mergeByTimestamp([...localData.repertoire, ...cloudData.repertoire]);
            merged.goals = this.mergeByTimestamp([...localData.goals, ...cloudData.goals]);
            
            // Merge settings
            merged.settings = { ...cloudData.settings, ...localData.settings };
            
        } else if (this.conflictResolutionStrategy === 'merge') {
            // Intelligent merge - combine data without duplicates
            merged.practiceEntries = this.intelligentMerge(localData.practiceEntries, cloudData.practiceEntries);
            merged.repertoire = this.intelligentMerge(localData.repertoire, cloudData.repertoire);
            merged.goals = this.intelligentMerge(localData.goals, cloudData.goals);
            
            merged.settings = { ...cloudData.settings, ...localData.settings };
        }
        
        return merged;
    }

    mergeByTimestamp(items) {
        const itemMap = new Map();
        
        items.forEach(item => {
            const existing = itemMap.get(item.id);
            if (!existing || new Date(item.updatedAt) > new Date(existing.updatedAt)) {
                itemMap.set(item.id, item);
            }
        });
        
        return Array.from(itemMap.values());
    }

    intelligentMerge(localItems, cloudItems) {
        const merged = new Map();
        
        // Add all cloud items first
        cloudItems.forEach(item => {
            merged.set(item.id, item);
        });
        
        // Add or update with local items
        localItems.forEach(item => {
            const existing = merged.get(item.id);
            if (!existing) {
                merged.set(item.id, item);
            } else {
                // Compare timestamps and keep newer
                if (new Date(item.updatedAt) > new Date(existing.updatedAt)) {
                    merged.set(item.id, item);
                }
            }
        });
        
        return Array.from(merged.values());
    }

    async updateLocalData(mergedData) {
        try {
            const db = await this.openIndexedDB();
            
            // Update practice entries
            const practiceStore = db.transaction(['practiceEntries'], 'readwrite').objectStore('practiceEntries');
            for (const entry of mergedData.practiceEntries) {
                await practiceStore.put(entry);
            }
            
            // Update repertoire
            const repertoireStore = db.transaction(['repertoire'], 'readwrite').objectStore('repertoire');
            for (const song of mergedData.repertoire) {
                await repertoireStore.put(song);
            }
            
            // Update goals
            const goalsStore = db.transaction(['goals'], 'readwrite').objectStore('goals');
            for (const goal of mergedData.goals) {
                await goalsStore.put(goal);
            }
            
            // Update settings
            Object.entries(mergedData.settings).forEach(([key, value]) => {
                if (value) {
                    localStorage.setItem(key, value);
                }
            });
            
        } catch (error) {
            console.error('Error updating local data:', error);
            throw error;
        }
    }

    async updateCloudData(userId, mergedData) {
        try {
            const batch = this.db.batch();
            
            // Update user settings
            const userRef = this.db.collection('users').doc(userId);
            batch.set(userRef, {
                settings: mergedData.settings,
                lastSync: new Date().toISOString(),
                deviceInfo: this.getDeviceInfo()
            }, { merge: true });
            
            // Update practice entries
            for (const entry of mergedData.practiceEntries) {
                const ref = this.db
                    .collection('users')
                    .doc(userId)
                    .collection('practiceEntries')
                    .doc(entry.id);
                batch.set(ref, entry);
            }
            
            // Update repertoire
            for (const song of mergedData.repertoire) {
                const ref = this.db
                    .collection('users')
                    .doc(userId)
                    .collection('repertoire')
                    .doc(song.id);
                batch.set(ref, song);
            }
            
            // Update goals
            for (const goal of mergedData.goals) {
                const ref = this.db
                    .collection('users')
                    .doc(userId)
                    .collection('goals')
                    .doc(goal.id);
                batch.set(ref, goal);
            }
            
            await batch.commit();
            
        } catch (error) {
            console.error('Error updating cloud data:', error);
            throw error;
        }
    }

    async getLocalChangesSince(timestamp) {
        if (!timestamp) return [];
        
        const changes = [];
        const db = await this.openIndexedDB();
        
        // Get modified practice entries
        const practiceStore = db.transaction(['practiceEntries'], 'readonly').objectStore('practiceEntries');
        const practiceEntries = await this.getAllFromStore(practiceStore);
        
        practiceEntries.forEach(entry => {
            if (new Date(entry.updatedAt) > new Date(timestamp)) {
                changes.push({
                    type: 'practiceEntry',
                    action: 'update',
                    data: entry
                });
            }
        });
        
        // Similar for repertoire and goals...
        
        return changes;
    }

    async getCloudChangesSince(userId, timestamp) {
        if (!timestamp) return [];
        
        const changes = [];
        
        try {
            // Get modified practice entries
            const practiceSnapshot = await this.db
                .collection('users')
                .doc(userId)
                .collection('practiceEntries')
                .where('updatedAt', '>', timestamp)
                .get();
            
            practiceSnapshot.docs.forEach(doc => {
                changes.push({
                    type: 'practiceEntry',
                    action: 'update',
                    data: { id: doc.id, ...doc.data() }
                });
            });
            
            // Similar for repertoire and goals...
            
        } catch (error) {
            console.error('Error getting cloud changes:', error);
        }
        
        return changes;
    }

    setupRealtimeSync() {
        if (!this.authService.isAuthenticated()) return;
        
        const userId = this.authService.getCurrentUser().uid;
        
        // Listen for changes in cloud data
        this.db.collection('users').doc(userId)
            .onSnapshot((doc) => {
                if (doc.exists && this.syncEnabled) {
                    const data = doc.data();
                    if (data.lastSync && data.lastSync !== this.lastSyncTime) {
                        // Another device made changes
                        this.performIncrementalSync();
                    }
                }
            });
    }

    async openIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('GuitarPracticeJournal', 1);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('practiceEntries')) {
                    db.createObjectStore('practiceEntries', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('repertoire')) {
                    db.createObjectStore('repertoire', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('goals')) {
                    db.createObjectStore('goals', { keyPath: 'id' });
                }
            };
        });
    }

    getAllFromStore(store) {
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            lastSync: new Date().toISOString()
        };
    }

    showNotification(message, type = 'info') {
        // Use app's notification system if available
        if (window.app?.currentPage?.showNotification) {
            window.app.currentPage.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // Public API for manual sync
    async syncNow() {
        if (!this.syncEnabled) {
            throw new Error('Cloud sync is not enabled');
        }
        
        if (this.syncInProgress) {
            throw new Error('Sync already in progress');
        }
        
        await this.performFullSync();
    }

    getSyncStatus() {
        return {
            enabled: this.syncEnabled,
            inProgress: this.syncInProgress,
            lastSync: this.lastSyncTime,
            isAuthenticated: this.authService.isAuthenticated(),
            conflictResolution: this.conflictResolutionStrategy
        };
    }
}
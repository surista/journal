// Real-time sync engine with conflict resolution
import { cloudStorage } from './firebaseService.js';

export class SyncEngine {
    constructor(localStorageService) {
        this.localStorageService = localStorageService;
        this.isEnabled = false;
        this.conflicts = [];
        this.setupEventListeners();
    }

    // Initialize real-time sync
    async enableSync() {
        if (!cloudStorage.isAuthenticated()) {
            console.warn('Cannot enable sync - user not authenticated');
            return false;
        }

        this.isEnabled = true;
        this.startRealtimeListeners();
        await this.performInitialSync();

        console.log('✅ Real-time sync enabled');
        this.dispatchSyncEvent('syncEnabled');
        return true;
    }

    disableSync() {
        this.isEnabled = false;
        this.stopRealtimeListeners();
        console.log('⏹️ Real-time sync disabled');
        this.dispatchSyncEvent('syncDisabled');
    }

    // Start real-time listeners for all collections
    startRealtimeListeners() {
        // Practice Sessions
        cloudStorage.startRealtimeSync('practiceSessions', (type, id, data) => {
            this.handleRealtimeChange('practiceSessions', type, id, data);
        });

        // Goals
        cloudStorage.startRealtimeSync('goals', (type, id, data) => {
            this.handleRealtimeChange('goals', type, id, data);
        });

        // Repertoire
        cloudStorage.startRealtimeSync('repertoire', (type, id, data) => {
            this.handleRealtimeChange('repertoire', type, id, data);
        });
    }

    stopRealtimeListeners() {
        cloudStorage.stopAllListeners();
    }

    // Handle real-time changes from Firestore
    async handleRealtimeChange(collection, type, id, remoteData) {
        // Skip if change is from this device
        if (remoteData.metadata?.deviceId === cloudStorage.deviceId) {
            return;
        }

        try {
            switch (type) {
                case 'added':
                    await this.handleRemoteAdd(collection, id, remoteData);
                    break;
                case 'modified':
                    await this.handleRemoteModify(collection, id, remoteData);
                    break;
                case 'removed':
                    await this.handleRemoteDelete(collection, id);
                    break;
            }
        } catch (error) {
            console.error(`❌ Error handling ${type} for ${collection}:`, error);
        }
    }

    async handleRemoteAdd(collection, id, remoteData) {
        const localRecord = await this.getLocalRecord(collection, id);

        if (!localRecord) {
            // New record, add locally
            await this.updateLocalRecord(collection, remoteData);
            console.log(`✅ Added new ${collection} record: ${id}`);
            this.dispatchSyncEvent('recordAdded', { collection, record: remoteData });
        } else {
            // Conflict - record exists locally
            await this.handleConflict(collection, localRecord, remoteData);
        }
    }

    async handleRemoteModify(collection, id, remoteData) {
        const localRecord = await this.getLocalRecord(collection, id);

        if (!localRecord) {
            // Remote record doesn't exist locally, add it
            await this.updateLocalRecord(collection, remoteData);
        } else if (cloudStorage.hasConflict(localRecord, remoteData)) {
            // Conflict detected
            await this.handleConflict(collection, localRecord, remoteData);
        } else {
            // No conflict, update locally
            await this.updateLocalRecord(collection, remoteData);
            console.log(`✅ Updated ${collection} record: ${id}`);
            this.dispatchSyncEvent('recordUpdated', { collection, record: remoteData });
        }
    }

    async handleRemoteDelete(collection, id) {
        const localRecord = await this.getLocalRecord(collection, id);

        if (localRecord) {
            await this.deleteLocalRecord(collection, id);
            console.log(`✅ Deleted ${collection} record: ${id}`);
            this.dispatchSyncEvent('recordDeleted', { collection, id });
        }
    }

    // Conflict handling
    async handleConflict(collection, localRecord, remoteRecord) {
        console.warn(`⚠️ Conflict detected for ${collection}: ${localRecord.id}`);

        const resolved = cloudStorage.resolveConflict(localRecord, remoteRecord, 'auto');

        if (resolved.requiresUserInput) {
            // Store conflict for manual resolution
            this.conflicts.push({
                collection,
                local: localRecord,
                remote: remoteRecord,
                timestamp: new Date()
            });
            this.dispatchSyncEvent('conflictDetected', { collection, conflict: resolved });
        } else {
            // Auto-resolved
            await this.updateLocalRecord(collection, resolved);
            await this.updateRemoteRecord(collection, resolved);
            console.log(`✅ Auto-resolved conflict for ${collection}: ${localRecord.id}`);
            this.dispatchSyncEvent('conflictResolved', { collection, record: resolved });
        }
    }

    // Initial sync when user logs in or sync is first enabled
    async performInitialSync() {
        console.log('🔄 Performing initial sync...');

        try {
            // Download all remote data
            const remotePracticeSessions = await cloudStorage.getPracticeSessions();
            const remoteGoals = await cloudStorage.getGoals();
            const remoteRepertoire = await cloudStorage.getRepertoire();

            // Get local data
            const localPracticeSessions = await this.localStorageService.getPracticeEntries();
            const localGoals = await this.localStorageService.getGoals();
            const localRepertoire = await this.localStorageService.getRepertoire();

            // Merge and resolve conflicts
            await this.mergeCollections('practiceSessions', localPracticeSessions, remotePracticeSessions);
            await this.mergeCollections('goals', localGoals, remoteGoals);
            await this.mergeCollections('repertoire', localRepertoire, remoteRepertoire);

            console.log('✅ Initial sync completed');
            this.dispatchSyncEvent('initialSyncComplete');

        } catch (error) {
            console.error('❌ Initial sync failed:', error);
            this.dispatchSyncEvent('syncError', { error: error.message });
        }
    }

    async mergeCollections(collectionName, localRecords, remoteRecords) {
        const localMap = new Map(localRecords.map(r => [r.id, r]));
        const remoteMap = new Map(remoteRecords.map(r => [r.id, r]));
        const allIds = new Set([...localMap.keys(), ...remoteMap.keys()]);

        for (const id of allIds) {
            const local = localMap.get(id);
            const remote = remoteMap.get(id);

            if (local && remote) {
                // Both exist - check for conflicts
                if (cloudStorage.hasConflict(local, remote)) {
                    await this.handleConflict(collectionName, local, remote);
                } else {
                    // Use newer version
                    const newer = new Date(local.metadata?.updatedAt || local.date) >
                    new Date(remote.metadata?.updatedAt || remote.date) ? local : remote;
                    await this.updateLocalRecord(collectionName, newer);
                }
            } else if (local && !remote) {
                // Local only - upload to cloud
                await this.uploadLocalRecord(collectionName, local);
            } else if (!local && remote) {
                // Remote only - download to local
                await this.updateLocalRecord(collectionName, remote);
            }
        }
    }

    // Local storage interface
    async getLocalRecord(collection, id) {
        switch (collection) {
            case 'practiceSessions':
                const sessions = await this.localStorageService.getPracticeEntries();
                return sessions.find(s => s.id === id);
            case 'goals':
                const goals = await this.localStorageService.getGoals();
                return goals.find(g => g.id === id);
            case 'repertoire':
                const songs = await this.localStorageService.getRepertoire();
                return songs.find(s => s.id === id);
            default:
                return null;
        }
    }

    async updateLocalRecord(collection, record) {
        switch (collection) {
            case 'practiceSessions':
                await this.localStorageService.savePracticeEntry(record);
                break;
            case 'goals':
                await this.localStorageService.saveGoal(record);
                break;
            case 'repertoire':
                await this.localStorageService.updateRepertoireSong(record.id, record);
                break;
        }
    }

    async deleteLocalRecord(collection, id) {
        switch (collection) {
            case 'practiceSessions':
                await this.localStorageService.deletePracticeEntry(id);
                break;
            case 'goals':
                await this.localStorageService.deleteGoal(id);
                break;
            case 'repertoire':
                await this.localStorageService.deleteRepertoireSong(id);
                break;
        }
    }

    async uploadLocalRecord(collection, record) {
        switch (collection) {
            case 'practiceSessions':
                await cloudStorage.savePracticeSession(record);
                break;
            case 'goals':
                await cloudStorage.saveGoal(record);
                break;
            case 'repertoire':
                await cloudStorage.saveRepertoireSong(record);
                break;
        }
    }

    async updateRemoteRecord(collection, record) {
        switch (collection) {
            case 'practiceSessions':
                await cloudStorage.updatePracticeSession(record.id, record);
                break;
            case 'goals':
                await cloudStorage.updateGoal(record.id, record);
                break;
            case 'repertoire':
                await cloudStorage.updateRepertoireSong(record.id, record);
                break;
        }
    }

    // Manual conflict resolution
    async resolveConflict(conflictIndex, choice) {
        if (conflictIndex >= this.conflicts.length) return;

        const conflict = this.conflicts[conflictIndex];
        let resolved;

        switch (choice) {
            case 'local':
                resolved = conflict.local;
                break;
            case 'remote':
                resolved = conflict.remote;
                break;
            case 'merge':
                resolved = cloudStorage.smartMerge(conflict.local, conflict.remote);
                break;
            default:
                return;
        }

        // Apply resolution
        await this.updateLocalRecord(conflict.collection, resolved);
        await this.updateRemoteRecord(conflict.collection, resolved);

        // Remove from conflicts
        this.conflicts.splice(conflictIndex, 1);

        this.dispatchSyncEvent('conflictResolved', {
            collection: conflict.collection,
            record: resolved
        });
    }

    // Event handling
    setupEventListeners() {
        // Listen for local data changes to upload
        window.addEventListener('practiceSessionSaved', (event) => {
            if (this.isEnabled) {
                this.uploadLocalRecord('practiceSessions', event.detail);
            }
        });

        window.addEventListener('goalSaved', (event) => {
            if (this.isEnabled) {
                this.uploadLocalRecord('goals', event.detail);
            }
        });

        window.addEventListener('repertoireSongSaved', (event) => {
            if (this.isEnabled) {
                this.uploadLocalRecord('repertoire', event.detail);
            }
        });
    }

    dispatchSyncEvent(type, data = {}) {
        window.dispatchEvent(new CustomEvent(`sync${type}`, { detail: data }));
    }

    // Status methods
    getStatus() {
        return {
            enabled: this.isEnabled,
            authenticated: cloudStorage.isAuthenticated(),
            queueSize: cloudStorage.getQueueSize(),
            conflictCount: this.conflicts.length,
            deviceInfo: cloudStorage.getDeviceInfo()
        };
    }
}
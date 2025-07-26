// src/services/storageService.js - Complete fixed version with all goal methods
import { CompressionUtils, TimeUtils } from '../utils/helpers.js';
import { AuthService } from './authService.js';
import firebaseSyncService from './firebaseSyncService.js';

export class StorageService {
    constructor(userId) {
        this.userId = userId;
        this.prefix = `guitarpractice_${userId}_`;
        this.useCompression = false;
        this.autoBackupEnabled = true;
        this.backupDebounceTimer = null;
        this.backupDebounceDelay = 5000;
        this.cloudSyncEnabled = true;
        this.firebaseSync = firebaseSyncService;
        this.setupCloudSync();
    }

    // Error recovery method
    async recoverCorruptedData() {
        console.warn('Attempting to recover from corrupted data...');

        const backupKeys = [
            'practiceEntries_backup',
            'practiceEntries_v1',
            'practiceEntries_uncompressed',
            `${this.prefix}practice_entries_backup`
        ];

        for (const key of backupKeys) {
            try {
                const backup = localStorage.getItem(key);
                if (backup) {
                    const data = JSON.parse(backup);
                    if (Array.isArray(data)) {
                        return data;
                    }
                }
            } catch (e) {
                console.warn(`Backup ${key} also corrupted`);
            }
        }

        return [];
    }

    // Set up cloud sync
    async setupCloudSync() {
        if (!this.cloudSyncEnabled) return;

        try {
            // Wait for Firebase to initialize
            await this.firebaseSync.waitForInitialization();

            // Listen for sync events
            window.addEventListener('practiceSessionSync', (e) =>
                this.handleSyncEvent('practice', e)
            );
            window.addEventListener('goalSync', (e) => this.handleSyncEvent('goal', e));
            window.addEventListener('repertoireSync', (e) => this.handleSyncEvent('repertoire', e));
        } catch (error) {
            console.warn('Cloud sync setup failed, continuing in offline mode:', error);
        }
    }

    handleSyncEvent(type, event) {
        const { type: changeType, data } = event.detail;
        // For now, ignore sync events to prevent duplicates
        // The data is already saved locally when we add it
        // Real-time sync will be handled differently in the future
        return;

        // Dispatch UI update events
        // window.dispatchEvent(new CustomEvent('dataUpdated', {
        //     detail: { dataType: type, changeType, data }
        // }));
    }

    // ===================
    // GOAL MANAGEMENT METHODS - COMPLETE IMPLEMENTATION
    // ===================

    async saveGoal(goal) {
        try {
            const goals = await this.getGoals();

            // Ensure goal has required properties
            if (!goal.id) {
                goal.id = Date.now() + Math.random();
            }

            if (!goal.createdAt) {
                goal.createdAt = new Date().toISOString();
            }

            // Add new goal to the beginning of the array
            goals.unshift(goal);
            // Save back to storage
            const success = await this.saveGoals(goals);

            if (success) {
                // Sync individual goal to Firebase
                if (
                    this.cloudSyncEnabled &&
                    this.firebaseSync &&
                    this.firebaseSync.isAuthenticated()
                ) {
                    try {
                        await this.firebaseSync.saveGoal(goal);
                    } catch (cloudError) {
                        console.warn('Goal cloud sync failed, saved locally:', cloudError);
                    }
                }
                return true;
            } else {
                throw new Error('Failed to save goals to storage');
            }
        } catch (error) {
            console.error('Error saving goal:', error);
            return false;
        }
    }

    async updateGoal(goalId, updates) {
        try {
            const goals = await this.getGoals();
            const goalIndex = goals.findIndex((g) => g.id == goalId); // Use loose equality for number type compatibility

            if (goalIndex === -1) {
                throw new Error(`Goal with ID ${goalId} not found`);
            }

            // Update the goal with new properties
            goals[goalIndex] = { ...goals[goalIndex], ...updates };

            // Add updatedAt timestamp
            goals[goalIndex].updatedAt = new Date().toISOString();

            // Save back to storage
            const success = await this.saveGoals(goals);

            if (success) {
                // Sync update to Firebase
                if (
                    this.cloudSyncEnabled &&
                    this.firebaseSync &&
                    this.firebaseSync.isAuthenticated()
                ) {
                    try {
                        await this.firebaseSync.updateGoal(goalId, goals[goalIndex]);
                    } catch (cloudError) {
                        console.warn('Goal update cloud sync failed:', cloudError);
                    }
                }
                return true;
            } else {
                throw new Error('Failed to save updated goals to storage');
            }
        } catch (error) {
            console.error('Error updating goal:', error);
            return false;
        }
    }

    async deleteGoal(goalId) {
        try {
            const goals = await this.getGoals();
            const initialLength = goals.length;
            const filteredGoals = goals.filter((g) => g.id != goalId); // Use loose inequality for number type compatibility

            if (filteredGoals.length === initialLength) {
                console.warn(`Goal with ID ${goalId} not found for deletion`);
                return false;
            }

            // Save filtered goals back to storage
            const success = await this.saveGoals(filteredGoals);

            if (success) {
                // Sync deletion to Firebase
                if (
                    this.cloudSyncEnabled &&
                    this.firebaseSync &&
                    this.firebaseSync.isAuthenticated()
                ) {
                    try {
                        await this.firebaseSync.deleteGoal(goalId);
                    } catch (cloudError) {
                        console.warn('Goal deletion cloud sync failed:', cloudError);
                    }
                }
                return true;
            } else {
                throw new Error('Failed to save goals after deletion');
            }
        } catch (error) {
            console.error('Error deleting goal:', error);
            return false;
        }
    }

    // Core goals storage methods
    async saveGoals(goals) {
        try {
            // Validate goals array
            if (!Array.isArray(goals)) {
                throw new Error('Goals must be an array');
            }

            const key = `${this.prefix}goals`;
            const goalsJson = JSON.stringify(goals);

            // Save to localStorage
            localStorage.setItem(key, goalsJson);

            // Schedule backup
            this.scheduleBackup();

            // Sync to Firebase - save each goal individually
            if (this.cloudSyncEnabled && this.firebaseSync && this.firebaseSync.isAuthenticated()) {
                // Note: We don't sync all goals at once, individual saves handle their own sync
            }
            return true;
        } catch (error) {
            console.error('Error saving goals:', error);
            return false;
        }
    }

    async getGoals() {
        try {
            const key = `${this.prefix}goals`;
            const stored = localStorage.getItem(key);

            // If no local data but user is authenticated, try to load from Firebase
            if (
                !stored &&
                this.cloudSyncEnabled &&
                this.firebaseSync &&
                this.firebaseSync.isAuthenticated()
            ) {
                // Check if we're already loading to prevent duplicate loads
                if (this._loadingGoals) {
                    return this._loadingGoalsPromise || [];
                }

                this._loadingGoals = true;
                this._loadingGoalsPromise = (async () => {
                    try {
                        const cloudGoals = await this.firebaseSync.getGoals();
                        if (cloudGoals && cloudGoals.length > 0) {
                            // IMPORTANT: Check for local data again before saving
                            // to prevent race condition data loss
                            const currentStored = localStorage.getItem(key);
                            if (currentStored) {
                                // Local data appeared while we were loading from cloud
                                // Merge them properly
                                try {
                                    const localGoals = JSON.parse(currentStored);
                                    if (Array.isArray(localGoals) && localGoals.length > 0) {
                                        // Merge local and cloud data
                                        const merged = this.mergeData(localGoals, cloudGoals);
                                        await this.saveGoals(merged);
                                        return merged;
                                    }
                                } catch (e) {
                                    console.error('Error parsing local goals during merge:', e);
                                }
                            }

                            // Save to local storage for next time
                            await this.saveGoals(cloudGoals);
                            return cloudGoals;
                        }
                        return [];
                    } catch (cloudError) {
                        console.warn('Failed to load goals from cloud:', cloudError);
                        return [];
                    } finally {
                        this._loadingGoals = false;
                        this._loadingGoalsPromise = null;
                    }
                })();

                return this._loadingGoalsPromise;
            }

            if (!stored) {
                return [];
            }

            const goals = JSON.parse(stored);

            // Validate that it's an array
            if (!Array.isArray(goals)) {
                console.warn('Goals data is not an array, resetting to empty array');
                await this.saveGoals([]);
                return [];
            }

            return goals;
        } catch (error) {
            console.error('Error loading goals:', error);

            // Try to recover from corruption
            if (
                error.message.includes('JSON parse error') ||
                error.message.includes('SyntaxError') ||
                error.message.includes('Unexpected token')
            ) {
                console.warn('Goals data corrupted, clearing and starting fresh');
                const key = `${this.prefix}goals`;
                localStorage.removeItem(key);
                return [];
            }

            return [];
        }
    }

    // Additional goal utility methods
    async getGoalById(goalId) {
        try {
            const goals = await this.getGoals();
            return goals.find((g) => g.id === goalId) || null;
        } catch (error) {
            console.error('Error getting goal by ID:', error);
            return null;
        }
    }

    async getGoalsByType(type) {
        try {
            const goals = await this.getGoals();
            return goals.filter((g) => g.type === type);
        } catch (error) {
            console.error('Error getting goals by type:', error);
            return [];
        }
    }

    async getActiveGoals() {
        try {
            const goals = await this.getGoals();
            return goals.filter((g) => !g.completed);
        } catch (error) {
            console.error('Error getting active goals:', error);
            return [];
        }
    }

    async getCompletedGoals() {
        try {
            const goals = await this.getGoals();
            return goals.filter((g) => g.completed);
        } catch (error) {
            console.error('Error getting completed goals:', error);
            return [];
        }
    }

    async markGoalComplete(goalId) {
        try {
            const updates = {
                completed: true,
                completedAt: new Date().toISOString()
            };
            return await this.updateGoal(goalId, updates);
        } catch (error) {
            console.error('Error marking goal complete:', error);
            return false;
        }
    }

    async markGoalIncomplete(goalId) {
        try {
            const updates = {
                completed: false
            };

            const goal = await this.getGoalById(goalId);
            if (goal && goal.completedAt) {
                updates.completedAt = null;
            }

            return await this.updateGoal(goalId, updates);
        } catch (error) {
            console.error('Error marking goal incomplete:', error);
            return false;
        }
    }

    async getRepertoire() {
        try {
            const key = `${this.prefix}repertoire`;
            const stored = localStorage.getItem(key);

            // If no local data but user is authenticated, try to load from Firebase
            if (
                !stored &&
                this.cloudSyncEnabled &&
                this.firebaseSync &&
                this.firebaseSync.isAuthenticated()
            ) {
                // Check if we're already loading to prevent duplicate loads
                if (this._loadingRepertoire) {
                    return this._loadingRepertoirePromise || [];
                }

                this._loadingRepertoire = true;
                this._loadingRepertoirePromise = (async () => {
                    try {
                        const cloudRepertoire = await this.firebaseSync.getRepertoire();
                        if (cloudRepertoire && cloudRepertoire.length > 0) {
                            // IMPORTANT: Check for local data again before saving
                            // to prevent race condition data loss
                            const currentStored = localStorage.getItem(key);
                            if (currentStored) {
                                // Local data appeared while we were loading from cloud
                                // Merge them properly
                                try {
                                    const localRepertoire = JSON.parse(currentStored);
                                    if (
                                        Array.isArray(localRepertoire) &&
                                        localRepertoire.length > 0
                                    ) {
                                        // Merge local and cloud data
                                        const merged = this.mergeData(
                                            localRepertoire,
                                            cloudRepertoire
                                        );
                                        await this.saveRepertoire(merged);
                                        return merged;
                                    }
                                } catch (e) {
                                    console.error(
                                        'Error parsing local repertoire during merge:',
                                        e
                                    );
                                }
                            }

                            // Save to local storage for next time
                            await this.saveRepertoire(cloudRepertoire);
                            return cloudRepertoire;
                        }
                        return [];
                    } catch (cloudError) {
                        console.warn('Failed to load repertoire from cloud:', cloudError);
                        return [];
                    } finally {
                        this._loadingRepertoire = false;
                        this._loadingRepertoirePromise = null;
                    }
                })();

                return this._loadingRepertoirePromise;
            }

            if (!stored) {
                return [];
            }

            const repertoire = JSON.parse(stored);

            // Validate that it's an array
            if (!Array.isArray(repertoire)) {
                console.warn('Repertoire data is not an array, resetting to empty array');
                await this.saveRepertoire([]);
                return [];
            }

            return repertoire;
        } catch (error) {
            console.error('Error loading repertoire:', error);

            // Try to recover from corruption
            if (
                error.message.includes('JSON parse error') ||
                error.message.includes('SyntaxError') ||
                error.message.includes('Unexpected token')
            ) {
                console.warn('Repertoire data corrupted, clearing and starting fresh');
                const key = `${this.prefix}repertoire`;
                localStorage.removeItem(key);
                return [];
            }

            return [];
        }
    }

    async saveRepertoire(repertoire) {
        try {
            // Validate repertoire array
            if (!Array.isArray(repertoire)) {
                throw new Error('Repertoire must be an array');
            }

            const key = `${this.prefix}repertoire`;
            const repertoireJson = JSON.stringify(repertoire);

            // Save to localStorage
            localStorage.setItem(key, repertoireJson);

            // Schedule backup
            this.scheduleBackup();

            // Sync to Firebase handled by individual song saves
            if (this.cloudSyncEnabled && this.firebaseSync && this.firebaseSync.isAuthenticated()) {
            }
            return true;
        } catch (error) {
            console.error('Error saving repertoire:', error);
            return false;
        }
    }

    async addRepertoireSong(song) {
        try {
            const repertoire = await this.getRepertoire();

            // Ensure song has required properties
            if (!song.id) {
                song.id = Date.now().toString();
            }

            if (!song.createdAt) {
                song.createdAt = new Date().toISOString();
            }

            // Add new song to the beginning of the array
            repertoire.unshift(song);

            // Save back to storage
            const success = await this.saveRepertoire(repertoire);

            if (success) {
                // Sync individual song to Firebase
                if (
                    this.cloudSyncEnabled &&
                    this.firebaseSync &&
                    this.firebaseSync.isAuthenticated()
                ) {
                    try {
                        await this.firebaseSync.saveRepertoireSong(song);
                    } catch (cloudError) {
                        console.warn('Repertoire song cloud sync failed:', cloudError);
                    }
                }
                return true;
            } else {
                throw new Error('Failed to save repertoire to storage');
            }
        } catch (error) {
            console.error('Error adding song to repertoire:', error);
            return false;
        }
    }

    async updateRepertoireSong(songId, updates) {
        try {
            const repertoire = await this.getRepertoire();
            const songIndex = repertoire.findIndex((s) => s.id === songId);

            if (songIndex === -1) {
                throw new Error(`Song with ID ${songId} not found`);
            }

            // Update the song with new properties
            repertoire[songIndex] = { ...repertoire[songIndex], ...updates };

            // Add updatedAt timestamp
            repertoire[songIndex].updatedAt = new Date().toISOString();

            // Save back to storage
            const success = await this.saveRepertoire(repertoire);

            if (success) {
                return true;
            } else {
                throw new Error('Failed to save updated repertoire to storage');
            }
        } catch (error) {
            console.error('Error updating repertoire song:', error);
            return false;
        }
    }

    async deleteRepertoireSong(songId) {
        try {
            const repertoire = await this.getRepertoire();
            const initialLength = repertoire.length;
            const filteredRepertoire = repertoire.filter((s) => s.id !== songId);

            if (filteredRepertoire.length === initialLength) {
                console.warn(`Song with ID ${songId} not found for deletion`);
                return false;
            }

            // Save filtered repertoire back to storage
            const success = await this.saveRepertoire(filteredRepertoire);

            if (success) {
                // Sync deletion to Firebase
                if (
                    this.cloudSyncEnabled &&
                    this.firebaseSync &&
                    this.firebaseSync.isAuthenticated()
                ) {
                    try {
                        await this.firebaseSync.deleteRepertoireSong(songId);
                    } catch (cloudError) {
                        console.warn('Song deletion cloud sync failed:', cloudError);
                    }
                }
                return true;
            } else {
                throw new Error('Failed to save repertoire after deletion');
            }
        } catch (error) {
            console.error('Error deleting repertoire song:', error);
            return false;
        }
    }

    async updateSongPracticeStats(songId, practiceSession) {
        try {
            const repertoire = await this.getRepertoire();
            const songIndex = repertoire.findIndex((s) => s.id === songId);

            if (songIndex === -1) {
                console.warn(`Song with ID ${songId} not found for stats update`);
                return false;
            }

            const song = repertoire[songIndex];

            // Update practice stats
            song.practiceCount = (song.practiceCount || 0) + 1;
            song.totalPracticeTime =
                (song.totalPracticeTime || 0) + (practiceSession.duration || 0);
            song.lastPracticed = new Date().toISOString();

            // Save back to storage
            const success = await this.saveRepertoire(repertoire);

            if (success) {
                return true;
            } else {
                throw new Error('Failed to save updated song stats');
            }
        } catch (error) {
            console.error('Error updating song practice stats:', error);
            return false;
        }
    }

    // ===================
    // LOOPS
    // ===================

    async saveAudioLoop(fileName, loops) {
        try {
            const key = `${this.prefix}audio_loops_${fileName}`;
            localStorage.setItem(key, JSON.stringify(loops));

            // Sync to Firebase if enabled
            if (this.cloudSyncEnabled && this.firebaseSync && this.firebaseSync.isAuthenticated()) {
                try {
                    await this.firebaseSync.saveLoops('audio', fileName, loops);
                } catch (cloudError) {
                    console.warn('Audio loops cloud sync failed:', cloudError);
                }
            }

            return true;
        } catch (error) {
            console.error('Error saving audio loops:', error);
            return false;
        }
    }

    async getAudioLoops(fileName) {
        try {
            const key = `${this.prefix}audio_loops_${fileName}`;

            // Try cloud first if enabled
            if (this.cloudSyncEnabled && this.firebaseSync && this.firebaseSync.isAuthenticated()) {
                try {
                    const cloudLoops = await this.firebaseSync.getLoops('audio', fileName);
                    if (cloudLoops && cloudLoops.length > 0) {
                        // Save to local cache
                        localStorage.setItem(key, JSON.stringify(cloudLoops));
                        return cloudLoops;
                    }
                } catch (cloudError) {
                    console.warn('Failed to fetch audio loops from cloud:', cloudError);
                }
            }

            // Fallback to local
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error getting audio loops:', error);
            return [];
        }
    }

    async saveYouTubeLoop(videoId, loops) {
        try {
            const key = `${this.prefix}youtube_loops_${videoId}`;
            localStorage.setItem(key, JSON.stringify(loops));

            // Sync to Firebase if enabled
            if (this.cloudSyncEnabled && this.firebaseSync && this.firebaseSync.isAuthenticated()) {
                try {
                    await this.firebaseSync.saveLoops('youtube', videoId, loops);
                } catch (cloudError) {
                    console.warn('YouTube loops cloud sync failed:', cloudError);
                }
            }

            return true;
        } catch (error) {
            console.error('Error saving YouTube loops:', error);
            return false;
        }
    }

    async getYouTubeLoops(videoId) {
        try {
            const key = `${this.prefix}youtube_loops_${videoId}`;

            // Try cloud first if enabled
            if (this.cloudSyncEnabled && this.firebaseSync && this.firebaseSync.isAuthenticated()) {
                try {
                    const cloudLoops = await this.firebaseSync.getLoops('youtube', videoId);
                    if (cloudLoops && cloudLoops.length > 0) {
                        // Save to local cache
                        localStorage.setItem(key, JSON.stringify(cloudLoops));
                        return cloudLoops;
                    }
                } catch (cloudError) {
                    console.warn('Failed to fetch YouTube loops from cloud:', cloudError);
                }
            }

            // Fallback to local
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error getting YouTube loops:', error);
            return [];
        }
    }

    // ===================
    // PRACTICE ENTRIES
    // ===================

    // In storageService.js, update the savePracticeEntry method:

    cleanPracticeEntry(entry) {
        // Create a clean copy of the entry without circular references
        const cleanEntry = {};

        // Define allowed fields
        const allowedFields = [
            'id',
            'name',
            'date',
            'duration',
            'practiceArea',
            'key',
            'mode',
            'isFavorite',
            'audioFile',
            'youtubeTitle',
            'youtubeUrl',
            'bpm',
            'timeSignature',
            'sheetMusicImage',
            'sheetMusicThumbnail',
            'notes',
            'tempo',
            'area',
            'tempoPercentage'
        ];

        // Copy only allowed fields
        for (const field of allowedFields) {
            if (entry.hasOwnProperty(field) && entry[field] !== undefined) {
                // Make sure we're not copying objects that might have circular refs
                if (typeof entry[field] === 'object' && entry[field] !== null) {
                    // For now, just stringify and parse to break any references
                    try {
                        cleanEntry[field] = JSON.parse(JSON.stringify(entry[field]));
                    } catch (e) {
                        console.warn(`Could not clean field ${field}:`, e);
                        // Skip this field if it can't be stringified
                    }
                } else {
                    cleanEntry[field] = entry[field];
                }
            }
        }

        return cleanEntry;
    }

    async savePracticeEntry(entry) {
        try {
            // Clean the entry to remove any circular references
            const cleanedEntry = this.cleanPracticeEntry(entry);

            // Prevent duplicate entries by checking if an identical entry was just saved
            const entries = await this.getPracticeEntries();
            // Check for duplicate entry within the last 5 seconds
            if (entries.length > 0) {
                const lastEntry = entries[0];
                const lastEntryTime = new Date(lastEntry.date).getTime();
                const currentEntryTime = new Date(cleanedEntry.date).getTime();
                const timeDiff = Math.abs(currentEntryTime - lastEntryTime);

                // If the last entry has the same practice area and duration and was saved within 5 seconds, it's likely a duplicate
                if (
                    timeDiff < 5000 &&
                    lastEntry.practiceArea === cleanedEntry.practiceArea &&
                    lastEntry.duration === cleanedEntry.duration
                ) {
                    return true; // Return success but don't save
                }
            }

            // Ensure entry has required properties
            if (!cleanedEntry.id) {
                cleanedEntry.id = Date.now() + Math.random();
            }

            if (!cleanedEntry.date) {
                cleanedEntry.date = new Date().toISOString();
            }

            // Add userId for Firebase sync
            if (!cleanedEntry.userId && this.userId) {
                cleanedEntry.userId = this.userId;
            }

            entries.unshift(cleanedEntry);
            if (entries.length > 1000) {
                entries.length = 1000;
            }

            const key = `${this.prefix}practice_entries`;

            // Save backup before compression
            if (entries.length % 10 === 0) {
                try {
                    localStorage.setItem(
                        `${this.prefix}practice_entries_backup`,
                        JSON.stringify(entries)
                    );
                } catch (backupError) {
                    console.warn('Failed to save backup:', backupError);
                }
            }

            // Try saving without compression first to debug
            if (this.useCompression) {
                const compressed = CompressionUtils.compressObject(entries);
                if (!compressed) {
                    console.error('❌ Compression failed!');
                    // Fallback to uncompressed
                    localStorage.setItem(key, JSON.stringify(entries));
                } else {
                    localStorage.setItem(key, compressed);
                }
            } else {
                localStorage.setItem(key, JSON.stringify(entries));
            }

            // Verify save
            const savedData = localStorage.getItem(key);

            await this.updateStats(cleanedEntry);
            this.scheduleBackup();

            // Sync to Firebase
            if (this.cloudSyncEnabled && this.firebaseSync && this.firebaseSync.isAuthenticated()) {
                try {
                    await this.firebaseSync.savePracticeSession(cleanedEntry);
                } catch (cloudError) {
                    console.warn('Cloud sync failed, data saved locally:', cloudError);
                }
            }

            // Dispatch event to notify UI components
            window.dispatchEvent(
                new CustomEvent('practiceSessionSaved', {
                    detail: { entry: cleanedEntry }
                })
            );

            return true;
        } catch (error) {
            console.error('❌ Error saving practice entry:', error);
            throw error;
        }
    }

    async deletePracticeEntry(entryId) {
        try {
            // Get current entries
            const entries = await this.getPracticeEntries();
            const entryToDelete = entries.find((e) => e.id === entryId);

            if (!entryToDelete) {
                console.warn('Entry not found:', entryId);
                return false;
            }

            // Remove the entry
            const filteredEntries = entries.filter((e) => e.id !== entryId);

            // Save updated entries
            const key = `${this.prefix}practice_entries`;
            if (this.useCompression) {
                const compressed = CompressionUtils.compressObject(filteredEntries);
                localStorage.setItem(key, compressed);
            } else {
                localStorage.setItem(key, JSON.stringify(filteredEntries));
            }

            // Update stats by recalculating from remaining entries
            await this.recalculateStats();

            // If the deleted entry was linked to a repertoire song, update its stats
            if (entryToDelete.notes) {
                const repertoire = await this.getRepertoire();
                const notesLower = entryToDelete.notes.toLowerCase();

                for (const song of repertoire) {
                    if (notesLower.includes(song.title.toLowerCase())) {
                        // Recalculate song stats
                        await this.recalculateSongStats(song.id);
                        break;
                    }
                }
            }

            // Sync deletion to Firebase
            if (this.cloudSyncEnabled && this.firebaseSync && this.firebaseSync.isAuthenticated()) {
                try {
                    await this.firebaseSync.deletePracticeSession(entryId);
                } catch (cloudError) {
                    console.warn('Practice entry deletion cloud sync failed:', cloudError);
                }
            }

            // Dispatch event to notify UI components
            window.dispatchEvent(
                new CustomEvent('practiceSessionDeleted', {
                    detail: { entryId }
                })
            );

            return true;
        } catch (error) {
            console.error('❌ Error deleting practice entry:', error);
            return false;
        }
    }

    async updatePracticeEntry(entryId, updates) {
        try {
            // Get current entries
            const entries = await this.getPracticeEntries();
            const entryIndex = entries.findIndex((e) => e.id === entryId);

            if (entryIndex === -1) {
                console.warn('Entry not found:', entryId);
                return false;
            }

            // Update the entry
            entries[entryIndex] = { ...entries[entryIndex], ...updates };

            // Save updated entries
            const key = `${this.prefix}practice_entries`;
            if (this.useCompression) {
                const compressed = CompressionUtils.compressObject(entries);
                localStorage.setItem(key, compressed);
            } else {
                localStorage.setItem(key, JSON.stringify(entries));
            }

            // Sync to Firebase
            if (this.cloudSyncEnabled && this.firebaseSync && this.firebaseSync.isAuthenticated()) {
                try {
                    await this.firebaseSync.updatePracticeEntry(entryId, entries[entryIndex]);
                } catch (cloudError) {
                    console.warn('Practice entry update cloud sync failed:', cloudError);
                }
            }

            // Dispatch event to notify UI components
            window.dispatchEvent(
                new CustomEvent('practiceSessionUpdated', {
                    detail: { entryId, entry: entries[entryIndex] }
                })
            );

            return true;
        } catch (error) {
            console.error('❌ Error updating practice entry:', error);
            return false;
        }
    }

    async recalculateStats() {
        try {
            const entries = await this.getPracticeEntries();

            // Calculate totals
            const totalSeconds = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
            const totalHours = Math.floor(totalSeconds / 3600);

            // Calculate practice areas
            const practiceAreas = {};
            entries.forEach((entry) => {
                if (entry.practiceArea) {
                    practiceAreas[entry.practiceArea] =
                        (practiceAreas[entry.practiceArea] || 0) + 1;
                }
            });

            // Calculate streaks
            const currentStreak = await this.calculateCurrentStreak();
            const longestStreak = await this.calculateLongestStreak();

            const stats = {
                totalSessions: entries.length,
                totalSeconds: totalSeconds,
                totalHours: totalHours,
                currentStreak: currentStreak,
                longestStreak: longestStreak,
                practiceAreas: practiceAreas
            };

            // Save recalculated stats
            const key = `${this.prefix}stats`;
            localStorage.setItem(key, JSON.stringify(stats));

            // Sync stats to Firebase
            if (this.cloudSyncEnabled && this.firebaseSync && this.firebaseSync.isAuthenticated()) {
                try {
                    await this.firebaseSync.saveStats(stats);
                } catch (cloudError) {
                    console.warn('Stats cloud sync failed:', cloudError);
                }
            }

            return stats;
        } catch (error) {
            console.error('Error recalculating stats:', error);
        }
    }

    async calculateLongestStreak() {
        try {
            const sessions = await this.getPracticeEntries();
            if (sessions.length === 0) return 0;

            // Get unique practice dates
            const practiceDates = new Set();
            sessions.forEach((session) => {
                const date = new Date(session.date).toDateString();
                practiceDates.add(date);
            });

            // Convert to sorted array
            const sortedDates = Array.from(practiceDates)
                .map((d) => new Date(d))
                .sort((a, b) => a - b);

            let maxStreak = 1;
            let currentStreak = 1;

            for (let i = 1; i < sortedDates.length; i++) {
                const prevDate = sortedDates[i - 1];
                const currDate = sortedDates[i];
                const dayDiff = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));

                if (dayDiff === 1) {
                    currentStreak++;
                    maxStreak = Math.max(maxStreak, currentStreak);
                } else {
                    currentStreak = 1;
                }
            }

            return maxStreak;
        } catch (error) {
            console.error('Error calculating longest streak:', error);
            return 0;
        }
    }

    async recalculateSongStats(songId) {
        try {
            const repertoire = await this.getRepertoire();
            const song = repertoire.find((s) => s.id === songId);
            if (!song) return;

            const entries = await this.getPracticeEntries();

            // Reset stats
            song.practiceCount = 0;
            song.totalPracticeTime = 0;
            song.lastPracticed = null;

            // Recalculate based on entries that mention this song
            entries.forEach((entry) => {
                if (entry.notes && entry.notes.toLowerCase().includes(song.title.toLowerCase())) {
                    song.practiceCount++;
                    song.totalPracticeTime += entry.duration || 0;

                    if (
                        !song.lastPracticed ||
                        new Date(entry.date) > new Date(song.lastPracticed)
                    ) {
                        song.lastPracticed = entry.date;
                    }
                }
            });

            // Save updated repertoire
            await this.saveRepertoire(repertoire);
        } catch (error) {
            console.error('Error recalculating song stats:', error);
        }
    }

    async getPracticeEntries() {
        try {
            const key = `${this.prefix}practice_entries`;
            const stored = localStorage.getItem(key);

            // If no local data but user is authenticated, try to load from Firebase
            if (
                !stored &&
                this.cloudSyncEnabled &&
                this.firebaseSync &&
                this.firebaseSync.isAuthenticated()
            ) {
                // Check if we're already loading to prevent duplicate loads
                if (this._loadingPracticeEntries) {
                    return this._loadingPracticeEntriesPromise || [];
                }

                this._loadingPracticeEntries = true;
                this._loadingPracticeEntriesPromise = (async () => {
                    try {
                        const cloudSessions = await this.firebaseSync.getPracticeSessions();
                        if (cloudSessions && cloudSessions.length > 0) {
                            // IMPORTANT: Check for local data again before saving
                            // to prevent race condition data loss
                            const currentStored = localStorage.getItem(key);
                            if (currentStored) {
                                // Local data appeared while we were loading from cloud
                                // Merge them properly
                                let localEntries = [];
                                try {
                                    if (this.useCompression) {
                                        localEntries =
                                            CompressionUtils.decompressObject(currentStored) || [];
                                    } else {
                                        localEntries = JSON.parse(currentStored);
                                    }
                                } catch (e) {
                                    console.error('Error parsing local data during merge:', e);
                                }

                                if (Array.isArray(localEntries) && localEntries.length > 0) {
                                    // Merge local and cloud data
                                    const merged = this.mergeData(localEntries, cloudSessions);
                                    await this.savePracticeEntries(merged);
                                    return merged;
                                }
                            }

                            // Save to local storage for next time
                            await this.savePracticeEntries(cloudSessions);
                            return cloudSessions;
                        }
                        return [];
                    } catch (cloudError) {
                        console.warn('Failed to load practice sessions from cloud:', cloudError);
                        return [];
                    } finally {
                        this._loadingPracticeEntries = false;
                        this._loadingPracticeEntriesPromise = null;
                    }
                })();

                return this._loadingPracticeEntriesPromise;
            }

            if (!stored) {
                // Try to find data in backup locations
                console.log('No data found in primary key, checking backup locations...');
                const backupKeys = [
                    'practiceEntries', // Old key format
                    'guitarpractice_demo_user_practice_entries', // Demo user key
                    `guitarpractice_${this.userId.replace('@', '_').replace('.', '_')}_practice_entries`, // Email-based key
                    'practice_sessions', // Alternative key
                    `${this.prefix}practice_entries_backup`, // Backup key
                    `${key}_backup` // Direct backup
                ];

                for (const backupKey of backupKeys) {
                    try {
                        const backupData = localStorage.getItem(backupKey);
                        if (backupData) {
                            console.log(`Found backup data in key: ${backupKey}`);
                            const parsed = JSON.parse(backupData);
                            if (Array.isArray(parsed) && parsed.length > 0) {
                                // Restore from backup
                                localStorage.setItem(key, backupData);
                                return parsed;
                            }
                        }
                    } catch (e) {
                        console.warn(`Failed to parse backup key ${backupKey}:`, e);
                    }
                }

                console.warn('No backup data found, returning empty array');
                return [];
            }

            let entries;
            if (this.useCompression) {
                const decompressed = CompressionUtils.decompressObject(stored);
                if (!decompressed) {
                    console.warn('❌ Failed to decompress practice entries');

                    // Try parsing as regular JSON in case it's not compressed
                    try {
                        entries = JSON.parse(stored);
                    } catch (e) {
                        console.error('❌ Failed to parse as JSON:', e);
                        localStorage.removeItem(key);
                        return [];
                    }
                } else {
                    entries = decompressed;
                }
            } else {
                entries = JSON.parse(stored);
            }

            return entries;
        } catch (error) {
            console.error('❌ Error loading practice entries:', error);

            // Try to recover from corruption
            if (
                error.message.includes('JSON parse error') ||
                error.message.includes('SyntaxError') ||
                error.message.includes('Unterminated string')
            ) {
                console.warn('Data corruption detected, attempting recovery...');

                // Clear the corrupted data
                const key = `${this.prefix}practice_entries`;
                localStorage.removeItem(key);

                // Try to recover from backup
                return await this.recoverCorruptedData();
            }

            return [];
        }
    }

    // ===================
    // STATS
    // ===================

    async updateStats(entry) {
        try {
            const stats = await this.getStats();

            stats.totalSessions = (stats.totalSessions || 0) + 1;
            const totalSeconds = (stats.totalSeconds || 0) + (entry.duration || 0);
            stats.totalSeconds = totalSeconds;
            stats.totalHours = Math.floor(totalSeconds / 3600);
            stats.currentStreak = await this.calculateCurrentStreak();
            stats.longestStreak = Math.max(stats.longestStreak || 0, stats.currentStreak);

            if (entry.practiceArea) {
                stats.practiceAreas = stats.practiceAreas || {};
                stats.practiceAreas[entry.practiceArea] =
                    (stats.practiceAreas[entry.practiceArea] || 0) + 1;
            }

            const key = `${this.prefix}stats`;
            localStorage.setItem(key, JSON.stringify(stats));

            // Sync stats to Firebase
            if (this.cloudSyncEnabled && this.firebaseSync && this.firebaseSync.isAuthenticated()) {
                try {
                    await this.firebaseSync.saveStats(stats);
                } catch (cloudError) {
                    console.warn('Stats cloud sync failed:', cloudError);
                }
            }

            return stats;
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    async getStats() {
        try {
            const key = `${this.prefix}stats`;
            const stored = localStorage.getItem(key);

            // If no local stats but user is authenticated, try to load from Firebase
            if (
                !stored &&
                this.cloudSyncEnabled &&
                this.firebaseSync &&
                this.firebaseSync.isAuthenticated()
            ) {
                try {
                    const cloudStats = await this.firebaseSync.getStats();
                    if (cloudStats) {
                        // Save to local storage for next time
                        localStorage.setItem(key, JSON.stringify(cloudStats));
                        return cloudStats;
                    }
                } catch (cloudError) {
                    console.warn('Failed to load stats from cloud:', cloudError);
                }
            }

            if (stored) {
                return JSON.parse(stored);
            }

            // If no stats exist, calculate from practice entries
            const calculatedStats = await this.calculateStats();
            if (calculatedStats && calculatedStats.totalSessions > 0) {
                // Save calculated stats
                localStorage.setItem(key, JSON.stringify(calculatedStats));

                // Sync to Firebase
                if (
                    this.cloudSyncEnabled &&
                    this.firebaseSync &&
                    this.firebaseSync.isAuthenticated()
                ) {
                    try {
                        await this.firebaseSync.saveStats(calculatedStats);
                    } catch (cloudError) {
                        console.warn('Stats cloud sync failed:', cloudError);
                    }
                }

                return calculatedStats;
            }

            return {
                totalSessions: 0,
                totalSeconds: 0,
                totalHours: 0,
                currentStreak: 0,
                longestStreak: 0,
                practiceAreas: {}
            };
        } catch (error) {
            console.error('Error loading stats:', error);
            return {
                totalSessions: 0,
                totalSeconds: 0,
                totalHours: 0,
                currentStreak: 0,
                longestStreak: 0,
                practiceAreas: {}
            };
        }
    }

    async calculateCurrentStreak() {
        try {
            const sessions = await this.getPracticeEntries();
            if (sessions.length === 0) return 0;

            const today = new Date().toDateString();
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            const practiceDates = new Set(sessions.map((s) => new Date(s.date).toDateString()));

            if (!practiceDates.has(today) && !practiceDates.has(yesterday)) {
                return 0;
            }

            let streak = 0;
            const checkDate = practiceDates.has(today)
                ? new Date()
                : new Date(Date.now() - 86400000);

            while (practiceDates.has(checkDate.toDateString())) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            }

            return streak;
        } catch (error) {
            console.error('Error calculating streak:', error);
            return 0;
        }
    }

    async calculateStats() {
        try {
            const entries = await this.getPracticeEntries();
            const totalSeconds = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
            const totalHours = Math.floor(totalSeconds / 3600);
            const currentStreak = await this.calculateCurrentStreak();
            const longestStreak = await this.calculateLongestStreak();

            const practiceAreas = {};
            entries.forEach((entry) => {
                if (entry.practiceArea) {
                    practiceAreas[entry.practiceArea] =
                        (practiceAreas[entry.practiceArea] || 0) + 1;
                }
            });

            let mostPracticedArea = null;
            let maxCount = 0;
            Object.entries(practiceAreas).forEach(([area, count]) => {
                if (count > maxCount) {
                    maxCount = count;
                    mostPracticedArea = area;
                }
            });

            return {
                totalSessions: entries.length,
                totalHours,
                totalSeconds,
                currentStreak,
                longestStreak: Math.max(longestStreak, currentStreak),
                averageSessionLength:
                    entries.length > 0 ? Math.floor(totalSeconds / entries.length) : 0,
                practiceAreas,
                mostPracticedArea,
                totalDays: new Set(entries.map((e) => new Date(e.date).toDateString())).size
            };
        } catch (error) {
            console.error('Error calculating stats:', error);
            return {
                totalSessions: 0,
                totalHours: 0,
                totalSeconds: 0,
                currentStreak: 0,
                longestStreak: 0,
                averageSessionLength: 0,
                practiceAreas: {},
                mostPracticedArea: null,
                totalDays: 0
            };
        }
    }

    // ===================
    // AUDIO SESSIONS
    // ===================

    saveAudioSession(fileName, session) {
        try {
            const key = `${this.prefix}audio_sessions_${fileName}`;
            let sessions = this.getAudioSessions(fileName);
            sessions.push(session);

            if (sessions.length > 20) {
                sessions = sessions.slice(-20);
            }

            localStorage.setItem(key, JSON.stringify(sessions));
            this.scheduleBackup();
            return true;
        } catch (error) {
            console.error('Error saving audio session:', error);
            return false;
        }
    }

    getAudioSessions(fileName) {
        try {
            const key = `${this.prefix}audio_sessions_${fileName}`;
            const sessions = localStorage.getItem(key);
            return sessions ? JSON.parse(sessions) : [];
        } catch (error) {
            console.error('Error loading audio sessions:', error);
            return [];
        }
    }

    getAllAudioSessions() {
        try {
            const allSessions = {};
            const keys = Object.keys(localStorage);

            keys.forEach((key) => {
                if (key.startsWith(`${this.prefix}audio_sessions_`)) {
                    const fileName = key.replace(`${this.prefix}audio_sessions_`, '');
                    const sessions = localStorage.getItem(key);
                    if (sessions) {
                        allSessions[fileName] = JSON.parse(sessions);
                    }
                }
            });

            return allSessions;
        } catch (error) {
            console.error('Error loading all audio sessions:', error);
            return {};
        }
    }

    // ===================
    // USER SETTINGS
    // ===================

    async getUserSettings() {
        try {
            const key = `${this.prefix}settings`;
            const stored = localStorage.getItem(key);
            return stored
                ? JSON.parse(stored)
                : {
                      notificationsEnabled: true,
                      soundEnabled: true,
                      darkMode: true,
                      practiceReminders: {
                          enabled: false,
                          time: '19:00'
                      }
                  };
        } catch (error) {
            console.error('Error loading user settings:', error);
            return {};
        }
    }

    async saveUserSettings(settings) {
        try {
            const key = `${this.prefix}settings`;
            const currentSettings = await this.getUserSettings();
            const updatedSettings = { ...currentSettings, ...settings };
            localStorage.setItem(key, JSON.stringify(updatedSettings));

            // Sync to cloud if available
            if (this.cloudSyncEnabled && this.firebaseSync.isAuthenticated()) {
                try {
                    await this.firebaseSync.saveSettings(updatedSettings);
                } catch (syncError) {
                    console.warn('Failed to sync settings to cloud:', syncError);
                }
            }

            this.scheduleBackup();
            return true;
        } catch (error) {
            console.error('Error saving user settings:', error);
            return false;
        }
    }

    // ===================
    // SESSION AREAS
    // ===================

    async getSessionAreas() {
        try {
            const key = `${this.prefix}session_areas`;
            const stored = localStorage.getItem(key);

            if (stored) {
                return JSON.parse(stored);
            }

            // Return default areas if none stored
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
                'Repertoire',
                'Audio Practice'
            ];
        } catch (error) {
            console.error('Error loading session areas:', error);
            // Return defaults on error
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
                'Repertoire',
                'Audio Practice'
            ];
        }
    }

    async saveSessionAreas(areas) {
        try {
            // Validate input
            if (!Array.isArray(areas)) {
                console.error('Session areas must be an array');
                return false;
            }

            const key = `${this.prefix}session_areas`;
            localStorage.setItem(key, JSON.stringify(areas));

            // Dispatch event for other components
            window.dispatchEvent(
                new CustomEvent('sessionAreasUpdated', {
                    detail: { areas, userId: this.userId }
                })
            );

            // Schedule backup
            this.scheduleBackup();

            // Sync to Firebase if enabled
            if (this.cloudSyncEnabled && this.firebaseSync && this.firebaseSync.isAuthenticated()) {
                try {
                    await this.firebaseSync.saveSessionAreas(areas);
                } catch (syncError) {
                    console.warn('Failed to sync session areas to cloud:', syncError);
                }
            }

            return true;
        } catch (error) {
            console.error('Error saving session areas:', error);
            return false;
        }
    }

    async addSessionArea(area) {
        try {
            const areas = await this.getSessionAreas();
            if (!areas.includes(area)) {
                areas.push(area);
                areas.sort();
                return await this.saveSessionAreas(areas);
            }
            return true;
        } catch (error) {
            console.error('Error adding session area:', error);
            return false;
        }
    }

    async removeSessionArea(area) {
        try {
            const areas = await this.getSessionAreas();
            const index = areas.indexOf(area);
            if (index > -1) {
                areas.splice(index, 1);
                return await this.saveSessionAreas(areas);
            }
            return true;
        } catch (error) {
            console.error('Error removing session area:', error);
            return false;
        }
    }

    // ===================
    // BACKUP FUNCTIONALITY
    // ===================

    async createBackup(forceDownload = false) {
        if (!this.autoBackupEnabled) return;

        try {
            const authService = new AuthService();
            const user = authService.getCurrentUser();
            if (!user || !user.email) return;

            const backupData = {
                version: '2.0',
                email: user.email,
                userId: this.userId,
                backupDate: new Date().toISOString(),
                data: {
                    practiceEntries: await this.getPracticeEntries(),
                    goals: await this.getGoals(),
                    repertoire: await this.getRepertoire(),
                    stats: await this.getStats(),
                    settings: await this.getUserSettings(),
                    audioSessions: this.getAllAudioSessions()
                }
            };

            const safeEmail = user.email.replace(/[^a-z0-9]/gi, '_');
            const dateStr = new Date().toISOString().split('T')[0];
            const timeStr = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
            const filename = `guitar_practice_backup_${safeEmail}_${dateStr}_${timeStr}.json`;

            const backupKey = `${this.prefix}latest_backup`;
            try {
                localStorage.setItem(backupKey, JSON.stringify(backupData));
                localStorage.setItem(`${backupKey}_filename`, filename);
                localStorage.setItem(`${backupKey}_date`, new Date().toISOString());
            } catch (e) {
                console.warn('Could not store backup in localStorage:', e);
            }

            return { success: true, filename, data: backupData };
        } catch (error) {
            console.error('Error creating backup:', error);
            return { success: false, error };
        }
    }

    scheduleBackup() {
        if (!this.autoBackupEnabled) return;

        if (this.backupDebounceTimer) {
            clearTimeout(this.backupDebounceTimer);
        }

        this.backupDebounceTimer = setTimeout(async () => {
            await this.createBackup();
        }, this.backupDebounceDelay);
    }

    // ===================
    // EXPORT/IMPORT
    // ===================

    async exportAllData() {
        try {
            return {
                version: '1.0',
                exportDate: new Date().toISOString(),
                userId: this.userId,
                practiceEntries: await this.getPracticeEntries(),
                goals: await this.getGoals(),
                repertoire: await this.getRepertoire(), // Add this line
                stats: await this.getStats(),
                settings: await this.getUserSettings(),
                audioSessions: this.getAllAudioSessions()
            };
        } catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        }
    }

    async importData(data) {
        try {
            if (!data || !data.version) {
                throw new Error('Invalid import data format');
            }

            if (data.practiceEntries) {
                const key = `${this.prefix}practice_entries`;
                if (this.useCompression) {
                    const compressed = CompressionUtils.compressObject(data.practiceEntries);
                    localStorage.setItem(key, compressed);
                } else {
                    localStorage.setItem(key, JSON.stringify(data.practiceEntries));
                }
            }

            if (data.goals) await this.saveGoals(data.goals);
            if (data.repertoire) await this.saveRepertoire(data.repertoire);
            if (data.stats) localStorage.setItem(`${this.prefix}stats`, JSON.stringify(data.stats));
            if (data.settings) await this.saveUserSettings(data.settings);

            if (data.audioSessions) {
                Object.entries(data.audioSessions).forEach(([fileName, sessions]) => {
                    const key = `${this.prefix}audio_sessions_${fileName}`;
                    localStorage.setItem(key, JSON.stringify(sessions));
                });
            }

            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            throw error;
        }
    }

    async clearAllData() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach((key) => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    // ===================
    // LEARNING PLAN METHODS
    // ===================

    async saveLearningProfile(profile) {
        try {
            const key = `${this.prefix}learning_profile`;
            localStorage.setItem(key, JSON.stringify(profile));

            // Trigger backup if enabled
            if (this.autoBackupEnabled) {
                this.scheduleBackup();
            }

            return true;
        } catch (error) {
            console.error('Error saving learning profile:', error);
            return false;
        }
    }

    async getLearningProfile() {
        try {
            const key = `${this.prefix}learning_profile`;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting learning profile:', error);
            return null;
        }
    }

    async saveLearningPlan(plan) {
        try {
            // Add unique ID and timestamp
            plan.id = plan.id || Date.now().toString();
            plan.createdAt = plan.createdAt || new Date().toISOString();

            const key = `${this.prefix}learning_plan_current`;
            localStorage.setItem(key, JSON.stringify(plan));

            // Also save to plan history
            const historyKey = `${this.prefix}learning_plans`;
            const historyData = localStorage.getItem(historyKey);
            const history = historyData ? JSON.parse(historyData) : [];
            history.unshift(plan);
            // Keep only last 5 plans
            if (history.length > 5) {
                history.length = 5;
            }
            localStorage.setItem(historyKey, JSON.stringify(history));

            return true;
        } catch (error) {
            console.error('Error saving learning plan:', error);
            return false;
        }
    }

    async getCurrentLearningPlan() {
        try {
            const key = `${this.prefix}learning_plan_current`;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting current learning plan:', error);
            return null;
        }
    }

    async getLearningPlanHistory() {
        try {
            const key = `${this.prefix}learning_plans`;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting learning plan history:', error);
            return [];
        }
    }

    async updateLearningPlanProgress(planId, sessionId, completed = true) {
        try {
            const plan = await this.getCurrentLearningPlan();
            if (!plan || plan.id !== planId) return false;

            // Find and update the session
            let updated = false;
            plan.weeks.forEach((week) => {
                const session = week.sessions.find((s) => s.id === sessionId);
                if (session) {
                    session.completed = completed;
                    session.completedAt = completed ? new Date().toISOString() : null;
                    updated = true;

                    // Update week progress
                    week.completedSessions = week.sessions.filter((s) => s.completed).length;
                }
            });

            if (updated) {
                await this.saveLearningPlan(plan);
            }

            return updated;
        } catch (error) {
            console.error('Error updating learning plan progress:', error);
            return false;
        }
    }

    // ===================
    // CLOUD SYNC METHODS
    // ===================

    async syncFromCloud() {
        if (!cloudStorage || !cloudStorage.userId) return;

        try {
            // Only sync if methods are available
            if (typeof cloudStorage.getPracticeSessions === 'function') {
                const sessions = await cloudStorage.getPracticeSessions(100);
                if (sessions && sessions.length > 0) {
                    await this.mergeCloudSessions(sessions);
                }
            }
        } catch (error) {
            console.warn('Cloud sync failed, continuing in offline mode:', error);
        }
    }

    async mergeCloudSessions(cloudSessions) {
        const localSessions = await this.getPracticeEntries();
        const sessionMap = new Map();

        localSessions.forEach((session) => {
            const key = `${session.date}_${session.duration}`;
            sessionMap.set(key, session);
        });

        cloudSessions.forEach((session) => {
            const key = `${session.date}_${session.duration}`;
            sessionMap.set(key, session);
        });

        const mergedSessions = Array.from(sessionMap.values())
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 1000);

        const key = `${this.prefix}practice_entries`;
        if (this.useCompression) {
            const compressed = CompressionUtils.compressObject(mergedSessions);
            localStorage.setItem(key, compressed);
        } else {
            localStorage.setItem(key, JSON.stringify(mergedSessions));
        }
    }

    // ===================
    // DEBUG/UTILITY METHODS
    // ===================

    async getDataSummary() {
        try {
            const entries = await this.getPracticeEntries();
            const goals = await this.getGoals();
            const stats = await this.getStats();
            const audioSessions = this.getAllAudioSessions();

            const totalAudioSessions = Object.values(audioSessions).reduce((total, sessions) => {
                return total + (Array.isArray(sessions) ? sessions.length : 0);
            }, 0);

            return {
                practiceEntries: Array.isArray(entries) ? entries.length : 0,
                goals: Array.isArray(goals) ? goals.length : 0,
                audioSessions: totalAudioSessions,
                totalTime: stats.totalSeconds || 0,
                totalTimeFormatted: TimeUtils.formatDuration(stats.totalSeconds || 0, true)
            };
        } catch (error) {
            console.error('Error getting data summary:', error);
            return {
                practiceEntries: 0,
                goals: 0,
                audioSessions: 0,
                totalTime: 0,
                totalTimeFormatted: '0m'
            };
        }
    }

    async debugStorageState() {
        // Check all localStorage keys
        const allKeys = Object.keys(localStorage);
        const relevantKeys = allKeys.filter((key) => key.includes('guitarpractice'));

        // Try to load data with different approaches
        const key = `${this.prefix}practice_entries`;
        const rawData = localStorage.getItem(key);

        if (rawData) {
            // Try different parsing methods
            try {
                // Method 1: Direct JSON parse
                const parsed = JSON.parse(rawData);
                return parsed;
            } catch (e1) {
                try {
                    // Method 2: Decompress
                    const decompressed = CompressionUtils.decompressObject(rawData);
                    return decompressed;
                } catch (e2) {}
            }
        }

        // Check for backups
        const backupKey = `${this.prefix}practice_entries_backup`;
        const backupData = localStorage.getItem(backupKey);
        if (backupData) {
            try {
                const backup = JSON.parse(backupData);
                return backup;
            } catch (e) {}
        }

        return null;
    }

    // ===================
    // CLOUD SYNC METHODS
    // ===================

    async migrateToFirebase() {
        if (!this.firebaseSync || !this.firebaseSync.isAuthenticated()) {
            console.error('Cannot migrate: Firebase not initialized or user not authenticated');
            return false;
        }

        try {
            // Migrate practice sessions
            const sessions = await this.getPracticeEntries();
            let successCount = 0;
            for (const session of sessions) {
                try {
                    await this.firebaseSync.savePracticeSession(session);
                    successCount++;
                } catch (error) {
                    console.error('Failed to migrate session:', session.id, error);
                }
            }
            // Migrate goals
            const goals = await this.getGoals();
            successCount = 0;
            for (const goal of goals) {
                try {
                    await this.firebaseSync.saveGoal(goal);
                    successCount++;
                } catch (error) {
                    console.error('Failed to migrate goal:', goal.id, error);
                }
            }
            // Migrate repertoire
            const repertoire = await this.getRepertoire();
            successCount = 0;
            for (const song of repertoire) {
                try {
                    await this.firebaseSync.saveRepertoireSong(song);
                    successCount++;
                } catch (error) {
                    console.error('Failed to migrate song:', song.id, error);
                }
            }
            // Migrate settings
            const settings = {
                theme: localStorage.getItem('theme'),
                metronomeSettings: localStorage.getItem('metronomeSettings'),
                audioSettings: localStorage.getItem('audioSettings'),
                practiceReminders: localStorage.getItem('practiceReminders'),
                dailyGoal: localStorage.getItem('dailyGoal')
            };

            try {
                await this.firebaseSync.saveSettings(settings);
            } catch (error) {
                console.error('Failed to migrate settings:', error);
            }

            // Migrate stats
            const stats = await this.getStats();
            if (stats && stats.totalSessions > 0) {
                try {
                    await this.firebaseSync.saveStats(stats);
                } catch (error) {
                    console.error('Failed to migrate stats:', error);
                }
            }

            return true;
        } catch (error) {
            console.error('❌ Migration failed:', error);
            return false;
        }
    }

    async syncFromFirebase() {
        if (!this.firebaseSync || !this.firebaseSync.isAuthenticated()) {
            console.error('Cannot sync: Firebase not initialized or user not authenticated');
            return false;
        }

        try {
            // Get data from Firebase
            const cloudSessions = await this.firebaseSync.getPracticeSessions();
            const cloudGoals = await this.firebaseSync.getGoals();
            const cloudRepertoire = await this.firebaseSync.getRepertoire();
            const cloudSettings = await this.firebaseSync.getSettings();

            // Merge with local data (keeping newer versions)
            const localSessions = await this.getPracticeEntries();
            const localGoals = await this.getGoals();
            const localRepertoire = await this.getRepertoire();

            // Merge practice sessions
            const mergedSessions = this.mergeData(localSessions, cloudSessions);
            await this.savePracticeEntries(mergedSessions);

            // Merge goals
            const mergedGoals = this.mergeData(localGoals, cloudGoals);
            await this.saveGoals(mergedGoals);

            // Merge repertoire
            const mergedRepertoire = this.mergeData(localRepertoire, cloudRepertoire);
            await this.saveRepertoire(mergedRepertoire);

            // Apply cloud settings if newer
            if (cloudSettings && cloudSettings.updatedAt) {
                const localSettingsTime = localStorage.getItem('settingsUpdatedAt');
                if (
                    !localSettingsTime ||
                    new Date(cloudSettings.updatedAt) > new Date(localSettingsTime)
                ) {
                    Object.entries(cloudSettings).forEach(([key, value]) => {
                        if (value && key !== 'updatedAt') {
                            localStorage.setItem(key, value);
                        }
                    });
                    localStorage.setItem('settingsUpdatedAt', cloudSettings.updatedAt);
                }
            }

            // Sync stats from cloud
            const cloudStats = await this.firebaseSync.getStats();
            if (cloudStats) {
                const key = `${this.prefix}stats`;
                localStorage.setItem(key, JSON.stringify(cloudStats));
            }

            return true;
        } catch (error) {
            console.error('❌ Sync from Firebase failed:', error);
            return false;
        }
    }

    mergeData(localData, cloudData) {
        const merged = new Map();

        // Add all cloud data first
        cloudData.forEach((item) => {
            merged.set(item.id, item);
        });

        // Add or update with local data (keeping newer versions)
        localData.forEach((item) => {
            const existing = merged.get(item.id);
            if (!existing) {
                merged.set(item.id, item);
            } else {
                // Compare timestamps
                const localTime = new Date(item.updatedAt || item.date || item.createdAt);
                const cloudTime = new Date(
                    existing.updatedAt || existing.date || existing.createdAt
                );

                if (localTime > cloudTime) {
                    merged.set(item.id, item);
                }
            }
        });

        return Array.from(merged.values()).sort((a, b) => {
            const aTime = new Date(a.date || a.createdAt);
            const bTime = new Date(b.date || b.createdAt);
            return bTime - aTime; // Newest first
        });
    }

    // Save practice entries array (used by sync)
    async savePracticeEntries(entries) {
        try {
            const key = `${this.prefix}practice_entries`;

            if (this.useCompression) {
                const compressed = CompressionUtils.compressObject(entries);
                localStorage.setItem(key, compressed);
            } else {
                localStorage.setItem(key, JSON.stringify(entries));
            }

            return true;
        } catch (error) {
            console.error('Error saving practice entries:', error);
            return false;
        }
    }

    // ===================
    // THEME AND UI PREFERENCES
    // ===================
    async getTheme() {
        try {
            // First check user settings
            const settings = await this.getUserSettings();
            if (settings && settings.theme) {
                return settings.theme;
            }

            // Fallback to legacy localStorage keys
            const theme = localStorage.getItem('selectedTheme') || localStorage.getItem('theme');
            return theme || 'dark';
        } catch (error) {
            console.error('Error getting theme:', error);
            return 'dark';
        }
    }

    async saveTheme(theme) {
        try {
            // Save to user settings
            await this.saveUserSettings({ theme });

            // Also save to legacy keys for compatibility
            localStorage.setItem('selectedTheme', theme);
            localStorage.setItem('theme', theme);

            return true;
        } catch (error) {
            console.error('Error saving theme:', error);
            return false;
        }
    }

    // Timer preferences
    async getTimerPreferences() {
        try {
            const settings = await this.getUserSettings();
            return (
                settings?.timerPreferences || {
                    syncWithAudio: localStorage.getItem('timerSyncWithAudio') !== 'false'
                }
            );
        } catch (error) {
            console.error('Error getting timer preferences:', error);
            return { syncWithAudio: true };
        }
    }

    async saveTimerPreferences(preferences) {
        try {
            await this.saveUserSettings({ timerPreferences: preferences });

            // Also save to legacy key for compatibility
            if (preferences.syncWithAudio !== undefined) {
                localStorage.setItem('timerSyncWithAudio', preferences.syncWithAudio.toString());
            }

            return true;
        } catch (error) {
            console.error('Error saving timer preferences:', error);
            return false;
        }
    }

    // Metronome preferences
    async getMetronomePreferences() {
        try {
            const settings = await this.getUserSettings();
            return (
                settings?.metronomePreferences || {
                    defaultSound: localStorage.getItem('defaultMetronomeSound') || 'click'
                }
            );
        } catch (error) {
            console.error('Error getting metronome preferences:', error);
            return { defaultSound: 'click' };
        }
    }

    async saveMetronomePreferences(preferences) {
        try {
            await this.saveUserSettings({ metronomePreferences: preferences });

            // Also save to legacy key for compatibility
            if (preferences.defaultSound) {
                localStorage.setItem('defaultMetronomeSound', preferences.defaultSound);
            }

            return true;
        } catch (error) {
            console.error('Error saving metronome preferences:', error);
            return false;
        }
    }

    // Auth data (read-only from StorageService, managed by AuthService)
    async getCurrentUser() {
        try {
            const stored = localStorage.getItem('currentUser');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }
}

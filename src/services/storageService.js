// services/storageService.js - Fixed with proper class structure

import { CompressionUtils } from '../utils/helpers.js';
import { IndexedDBService } from './indexedDBService.js';

export class StorageService {
    constructor(userId) {
        this.userId = userId;
        this.prefix = userId ? `${userId}_` : '';
        this.indexedDB = new IndexedDBService(userId);
        this.compressionEnabled = true;
        this.useIndexedDB = true; // Enabled by default now
        this.dbInitialized = false;
        this.initPromise = null;

        // Cache for frequently accessed data
        this.cache = {
            recentEntries: null,
            stats: null,
            lastUpdate: 0,
            ttl: 60000 // 1 minute cache
        };

        // Initialize IndexedDB
        this.initializeDB();
    }

    async initializeDB() {
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = this._initializeDB();
        return this.initPromise;
    }

    async _initializeDB() {
        try {
            await this.indexedDB.init();
            this.dbInitialized = true;
            console.log('IndexedDB initialized successfully');

            // Attempt migration if needed
            await this.migrateToIndexedDB();

            return true;
        } catch (error) {
            console.error('Failed to initialize IndexedDB, falling back to localStorage:', error);
            this.useIndexedDB = false;
            this.dbInitialized = false;
            return false;
        }
    }

    async ensureDBReady() {
        if (!this.dbInitialized && this.useIndexedDB) {
            await this.initializeDB();
        }
    }

    async migrateToIndexedDB() {
        // Check if migration has already been done
        const migrationKey = `${this.prefix}migrated_to_indexeddb_v2`;
        if (localStorage.getItem(migrationKey)) {
            return;
        }

        try {
            console.log('Starting migration to IndexedDB...');

            // Migrate practice entries
            const entries = this.getItemFromLocalStorage('practiceEntries', []);
            if (entries.length > 0) {
                console.log(`Migrating ${entries.length} practice sessions...`);

                for (const entry of entries) {
                    try {
                        await this.indexedDB.savePracticeSession(entry);
                    } catch (error) {
                        console.warn('Failed to migrate entry:', error, entry);
                    }
                }

                console.log('Practice sessions migrated successfully');
            }

            // Migrate goals
            const goals = this.getItemFromLocalStorage('practiceGoals', []);
            if (goals.length > 0) {
                console.log(`Migrating ${goals.length} goals...`);

                for (const goal of goals) {
                    try {
                        await this.indexedDB.saveGoal(goal);
                    } catch (error) {
                        console.warn('Failed to migrate goal:', error, goal);
                    }
                }
            }

            // Mark migration as complete
            localStorage.setItem(migrationKey, 'true');
            console.log('Migration to IndexedDB completed');

        } catch (error) {
            console.error('Migration to IndexedDB failed:', error);
            // Don't mark as complete so it can be retried
        }
    }

    // Practice Entries - Hybrid approach with IndexedDB primary, localStorage fallback
    async getPracticeEntries() {
        try {
            // Check cache first
            if (this.cache.recentEntries && Date.now() - this.cache.lastUpdate < this.cache.ttl) {
                return this.cache.recentEntries;
            }

            await this.ensureDBReady();

            if (this.useIndexedDB && this.dbInitialized) {
                try {
                    const entries = await this.indexedDB.getPracticeSessions();

                    // Update cache
                    this.cache.recentEntries = entries;
                    this.cache.lastUpdate = Date.now();

                    // Also update localStorage for backup (just recent entries)
                    if (entries.length > 0) {
                        this.setItem('recentPracticeEntries', entries.slice(0, 20));
                    }

                    return entries;
                } catch (error) {
                    console.error('IndexedDB read error, falling back to localStorage:', error);
                    this.useIndexedDB = false;
                }
            }

            // Fallback to localStorage
            const localEntries = this.getItem('practiceEntries', []);

            // Ensure it's an array
            if (Array.isArray(localEntries)) {
                return localEntries;
            }

            console.error('Local entries is not an array:', localEntries);
            return [];

        } catch (error) {
            console.error('Error in getPracticeEntries:', error);
            return [];
        }
    }

    async savePracticeEntry(entry) {
        try {
            // Ensure entry has required fields
            if (!entry.id) {
                entry.id = Date.now();
            }
            if (!entry.date) {
                entry.date = new Date().toISOString();
            }

            // Clear cache
            this.cache.recentEntries = null;
            this.cache.stats = null;

            await this.ensureDBReady();

            // Try IndexedDB first
            if (this.useIndexedDB && this.dbInitialized) {
                try {
                    await this.indexedDB.savePracticeSession(entry);

                    // Also update localStorage recent entries for quick access
                    const recentEntries = this.getItem('recentPracticeEntries', []);
                    recentEntries.unshift(entry);
                    if (recentEntries.length > 20) {
                        recentEntries.splice(20);
                    }
                    this.setItem('recentPracticeEntries', recentEntries);

                    return await this.getPracticeEntries();
                } catch (error) {
                    console.error('IndexedDB save error, falling back to localStorage:', error);
                    this.useIndexedDB = false;
                }
            }

            // Fallback to localStorage
            const entries = await this.getPracticeEntries();
            entries.unshift(entry);

            // Keep only last 1000 entries in localStorage
            if (entries.length > 1000) {
                entries.splice(1000);
            }

            this.setItem('practiceEntries', entries);

            // Update recent entries
            const recentEntries = this.getItem('recentPracticeEntries', []);
            recentEntries.unshift(entry);
            if (recentEntries.length > 20) {
                recentEntries.splice(20);
            }
            this.setItem('recentPracticeEntries', recentEntries);

            return entries;
        } catch (error) {
            console.error('Error saving practice entry:', error);
            throw error;
        }
    }

    async getPracticeEntriesForDateRange(startDate, endDate) {
        await this.ensureDBReady();

        if (this.useIndexedDB && this.dbInitialized) {
            try {
                return await this.indexedDB.getSessionsByDateRange(startDate, endDate);
            } catch (error) {
                console.error('IndexedDB query error:', error);
            }
        }

        // Fallback to localStorage filtering
        const entries = await this.getPracticeEntries();
        return entries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= startDate && entryDate <= endDate;
        });
    }

    async getPracticeEntriesByArea(practiceArea, limit = null) {
        await this.ensureDBReady();

        if (this.useIndexedDB && this.dbInitialized) {
            try {
                return await this.indexedDB.getSessionsByArea(practiceArea, limit);
            } catch (error) {
                console.error('IndexedDB query error:', error);
            }
        }

        // Fallback to localStorage filtering
        const entries = await this.getPracticeEntries();
        const filtered = entries.filter(entry => entry.practiceArea === practiceArea);

        if (limit) {
            return filtered.slice(0, limit);
        }
        return filtered;
    }

    // Goals - Hybrid storage
    async getGoals() {
        await this.ensureDBReady();

        if (this.useIndexedDB && this.dbInitialized) {
            try {
                return await this.indexedDB.getGoals();
            } catch (error) {
                console.error('IndexedDB goals error:', error);
            }
        }

        return this.getItem('practiceGoals', []);
    }

    async saveGoal(goal) {
        if (!goal.id) {
            goal.id = `goal_${Date.now()}`;
        }
        if (!goal.createdAt) {
            goal.createdAt = new Date().toISOString();
        }

        await this.ensureDBReady();

        if (this.useIndexedDB && this.dbInitialized) {
            try {
                await this.indexedDB.saveGoal(goal);

                // Also update localStorage for backup
                const goals = await this.getGoals();
                this.setItem('practiceGoals', goals);

                return goals;
            } catch (error) {
                console.error('IndexedDB goal save error:', error);
            }
        }

        // Fallback to localStorage
        const goals = this.getGoals();
        goals.unshift(goal);
        this.setItem('practiceGoals', goals);
        return goals;
    }

    async updateGoal(goalId, updates) {
        await this.ensureDBReady();

        if (this.useIndexedDB && this.dbInitialized) {
            try {
                const updatedGoal = await this.indexedDB.updateGoal(goalId, updates);

                // Update localStorage backup
                const goals = await this.getGoals();
                this.setItem('practiceGoals', goals);

                return updatedGoal;
            } catch (error) {
                console.error('IndexedDB goal update error:', error);
            }
        }

        // Fallback to localStorage
        const goals = this.getGoals();
        const index = goals.findIndex(g => g.id === goalId);

        if (index !== -1) {
            goals[index] = { ...goals[index], ...updates };
            this.setItem('practiceGoals', goals);
            return goals[index];
        }

        return null;
    }

    async deleteGoal(goalId) {
        await this.ensureDBReady();

        if (this.useIndexedDB && this.dbInitialized) {
            try {
                await this.indexedDB.delete(this.indexedDB.stores.goals, goalId);

                // Update localStorage backup
                const goals = await this.getGoals();
                this.setItem('practiceGoals', goals);

                return goals;
            } catch (error) {
                console.error('IndexedDB goal delete error:', error);
            }
        }

        // Fallback to localStorage
        const goals = this.getGoals();
        const filtered = goals.filter(g => g.id !== goalId);
        this.setItem('practiceGoals', filtered);
        return filtered;
    }

    // Practice Sessions (Audio Loops) - Keep in localStorage for now
    getPracticeSessions() {
        return this.getItem('practiceSessions', []);
    }

    savePracticeSession(session) {
        const sessions = this.getPracticeSessions();
        sessions.unshift(session);

        // Keep only last 50 sessions
        if (sessions.length > 50) {
            sessions.splice(50);
        }

        this.setItem('practiceSessions', sessions);
        return sessions;
    }

    deletePracticeSession(index) {
        const sessions = this.getPracticeSessions();
        sessions.splice(index, 1);
        this.setItem('practiceSessions', sessions);
        return sessions;
    }

    // Practice Area Goals
    getPracticeAreaGoals() {
        return this.getItem('practiceAreaGoals', []);
    }

    savePracticeAreaGoal(goal) {
        const goals = this.getPracticeAreaGoals();
        goals.push(goal);
        this.setItem('practiceAreaGoals', goals);
        return goals;
    }

    updatePracticeAreaGoal(index, targetMinutes) {
        const goals = this.getPracticeAreaGoals();
        if (goals[index]) {
            goals[index].targetMinutes = parseInt(targetMinutes);
            this.setItem('practiceAreaGoals', goals);
            return goals;
        }
        return null;
    }

    deletePracticeAreaGoal(index) {
        const goals = this.getPracticeAreaGoals();
        goals.splice(index, 1);
        this.setItem('practiceAreaGoals', goals);
        return goals;
    }

    // Export/Import with IndexedDB support
    async exportData() {
        await this.ensureDBReady();

        let data;

        if (this.useIndexedDB && this.dbInitialized) {
            try {
                // Export from IndexedDB
                const dbData = await this.indexedDB.exportData();

                // Merge with any localStorage-only data
                data = {
                    ...dbData,
                    entries: dbData.sessions || [],
                    goals: dbData.goals || [],
                    practiceSessions: this.getPracticeSessions(),
                    practiceAreaGoals: this.getPracticeAreaGoals(),
                    exportDate: new Date().toISOString(),
                    userId: this.userId,
                    source: 'indexeddb'
                };
            } catch (error) {
                console.error('IndexedDB export error:', error);
                // Fall through to localStorage export
            }
        }

        if (!data) {
            // Export from localStorage
            data = {
                entries: await this.getPracticeEntries(),
                goals: this.getGoals(),
                practiceSessions: this.getPracticeSessions(),
                practiceAreaGoals: this.getPracticeAreaGoals(),
                exportDate: new Date().toISOString(),
                userId: this.userId,
                source: 'localstorage'
            };
        }

        // Compress the data
        if (this.compressionEnabled) {
            const compressed = CompressionUtils.compressObject(data);
            return {
                compressed: true,
                data: compressed,
                uncompressedSize: JSON.stringify(data).length,
                compressedSize: compressed.length,
                compressionRatio: (compressed.length / JSON.stringify(data).length * 100).toFixed(1) + '%'
            };
        }

        return data;
    }

    async importData(importedData) {
        let data = importedData;

        // Check if data is compressed
        if (importedData.compressed && importedData.data) {
            data = CompressionUtils.decompressObject(importedData.data);
        }

        await this.ensureDBReady();

        // Import to IndexedDB if available
        if (this.useIndexedDB && this.dbInitialized) {
            try {
                await this.indexedDB.importData({
                    sessions: data.entries || data.sessions || [],
                    goals: data.goals || [],
                    loops: data.practiceSessions || [],
                    areaGoals: data.practiceAreaGoals || [],
                    achievements: data.achievements || [],
                    settings: data.settings || []
                });

                console.log('Data imported to IndexedDB successfully');
            } catch (error) {
                console.error('Failed to import to IndexedDB:', error);
            }
        }

        // Also update localStorage for compatibility
        if (data.entries) {
            this.setItem('practiceEntries', data.entries);
        }
        if (data.goals) {
            this.setItem('practiceGoals', data.goals);
        }
        if (data.practiceSessions) {
            this.setItem('practiceSessions', data.practiceSessions);
        }
        if (data.practiceAreaGoals) {
            this.setItem('practiceAreaGoals', data.practiceAreaGoals);
        }

        // Clear cache
        this.cache.recentEntries = null;
        this.cache.stats = null;
    }

    // Helper methods with compression
    getItem(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            if (!item) return defaultValue;

            // Check if item is compressed
            if (item.startsWith('COMPRESSED:')) {
                const compressed = item.substring(11);
                const decompressed = CompressionUtils.decompress(compressed);
                return decompressed ? JSON.parse(decompressed) : defaultValue;
            }

            return JSON.parse(item);
        } catch (error) {
            console.error(`Error reading ${key}:`, error);
            return defaultValue;
        }
    }

    setItem(key, value) {
        try {
            const stringified = JSON.stringify(value);

            // Compress if data is large (> 10KB)
            if (this.compressionEnabled && stringified.length > 10240) {
                const compressed = CompressionUtils.compress(stringified);
                // Only use compressed version if it's actually smaller
                if (compressed.length < stringified.length * 0.8) {
                    localStorage.setItem(this.prefix + key, 'COMPRESSED:' + compressed);
                    return;
                }
            }

            localStorage.setItem(this.prefix + key, stringified);
        } catch (error) {
            // Handle quota exceeded error
            if (error.name === 'QuotaExceededError') {
                console.error('LocalStorage quota exceeded, attempting cleanup...');
                this.cleanupOldData();

                // Try again after cleanup
                try {
                    localStorage.setItem(this.prefix + key, JSON.stringify(value));
                } catch (retryError) {
                    throw new Error('Failed to save data even after cleanup. Storage might be full.');
                }
            } else {
                console.error(`Error saving ${key}:`, error);
                throw error;
            }
        }
    }

    getItemFromLocalStorage(key, defaultValue = null) {
        return this.getItem(key, defaultValue);
    }

    removeItem(key) {
        localStorage.removeItem(this.prefix + key);
    }

    // Cleanup old data when storage is full
    cleanupOldData() {
        // Remove old cache entries
        const cacheKeys = Object.keys(localStorage).filter(key =>
            key.startsWith(this.prefix) && key.includes('cache')
        );

        cacheKeys.forEach(key => localStorage.removeItem(key));

        // Keep only recent 50 practice entries in localStorage
        const entries = this.getItem('practiceEntries', []);
        if (entries.length > 50) {
            this.setItem('practiceEntries', entries.slice(0, 50));
        }
    }

    // Statistics helpers - Now uses cache
    async calculateStats() {
        try {
            // Check cache first
            if (this.cache.stats && Date.now() - this.cache.lastUpdate < this.cache.ttl) {
                return this.cache.stats;
            }

            const entries = await this.getPracticeEntries();

            // Ensure entries is an array
            if (!Array.isArray(entries)) {
                console.error('getPracticeEntries did not return an array in calculateStats:', entries);
                return {
                    totalTime: 0,
                    totalSessions: 0,
                    averageSession: 0,
                    currentStreak: 0,
                    longestStreak: 0
                };
            }

            const totalSeconds = entries.reduce((sum, entry) => {
                // Ensure duration is a valid number
                const duration = parseInt(entry.duration) || 0;
                return sum + duration;
            }, 0);

            const avgSeconds = entries.length > 0 ? Math.floor(totalSeconds / entries.length) : 0;
            const currentStreak = this.calculateStreak(entries);
            const longestStreak = this.calculateLongestStreak(entries);

            const stats = {
                totalTime: totalSeconds,
                totalSessions: entries.length,
                averageSession: avgSeconds,
                currentStreak,
                longestStreak
            };

            // Update cache
            this.cache.stats = stats;

            return stats;
        } catch (error) {
            console.error('Error in calculateStats:', error);
            return {
                totalTime: 0,
                totalSessions: 0,
                averageSession: 0,
                currentStreak: 0,
                longestStreak: 0
            };
        }
    }

    calculateStreak(entries) {
        if (!Array.isArray(entries) || entries.length === 0) return 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let streak = 0;
        let currentDate = new Date(today);

        const sortedEntries = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));

        const lastPractice = new Date(sortedEntries[0].date);
        lastPractice.setHours(0, 0, 0, 0);

        if (lastPractice.getTime() < today.getTime() - 86400000) {
            return 0;
        }

        while (true) {
            const dayEntries = sortedEntries.filter(entry => {
                const entryDate = new Date(entry.date);
                entryDate.setHours(0, 0, 0, 0);
                return entryDate.getTime() === currentDate.getTime();
            });

            if (dayEntries.length > 0) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }

    calculateLongestStreak(entries) {
        if (!Array.isArray(entries) || entries.length === 0) return 0;

        const practiceDates = new Set();
        entries.forEach(entry => {
            const date = new Date(entry.date);
            const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            practiceDates.add(dateStr);
        });

        const sortedDates = Array.from(practiceDates)
            .map(dateStr => {
                const [year, month, day] = dateStr.split('-').map(Number);
                return new Date(year, month, day);
            })
            .sort((a, b) => a - b);

        let longestStreak = 1;
        let currentStreak = 1;

        for (let i = 1; i < sortedDates.length; i++) {
            const diffDays = Math.floor((sortedDates[i] - sortedDates[i-1]) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                currentStreak++;
                longestStreak = Math.max(longestStreak, currentStreak);
            } else {
                currentStreak = 1;
            }
        }

        return longestStreak;
    }

    // Storage info
    async getStorageInfo() {
        const info = {
            localStorage: {
                used: new Blob(Object.values(localStorage)).size,
                keys: Object.keys(localStorage).filter(key => key.startsWith(this.prefix)).length
            }
        };

        if (this.useIndexedDB && this.dbInitialized) {
            try {
                info.indexedDB = await this.indexedDB.getStorageInfo();
            } catch (error) {
                console.error('Error getting IndexedDB storage info:', error);
                info.indexedDB = { error: error.message };
            }
        }

        return info;
    }

    // Adapter methods for dashboard compatibility
    async getAllSessions() {
        // Map getPracticeEntries to getAllSessions
        return await this.getPracticeEntries();
    }

    async getStats() {
        // Calculate and format stats for dashboard
        const stats = await this.calculateStats();

        return {
            totalSessions: stats.totalSessions || 0,
            totalHours: Math.floor((stats.totalTime || 0) / 3600),
            currentStreak: stats.currentStreak || 0,
            avgDuration: Math.floor((stats.averageSession || 0) / 60) // Convert seconds to minutes
        };
    }

    async getUserSettings() {
        // Get user settings from localStorage
        return this.getItem('userSettings', {
            notificationsEnabled: false,
            darkMode: true
        });
    }

    async saveUserSettings(settings) {
        // Save user settings to localStorage
        const currentSettings = await this.getUserSettings();
        const updatedSettings = { ...currentSettings, ...settings };
        this.setItem('userSettings', updatedSettings);
        return updatedSettings;
    }

    async getStorageUsage() {
        // Calculate storage usage
        try {
            // Get browser storage estimate if available
            if (navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                return {
                    used: estimate.usage || 0,
                    total: estimate.quota || 0
                };
            }

            // Fallback: estimate localStorage usage
            const used = new Blob(Object.values(localStorage)).size;
            const total = 5 * 1024 * 1024; // 5MB typical localStorage limit

            return {
                used: used,
                total: total
            };
        } catch (error) {
            console.error('Error getting storage usage:', error);
            return {
                used: 0,
                total: 5 * 1024 * 1024
            };
        }
    }

    async exportAllData() {
        // Map exportData to exportAllData
        return await this.exportData();
    }

    async clearAllData() {
        // Clear all data from both IndexedDB and localStorage
        try {
            // Clear IndexedDB if available
            if (this.useIndexedDB && this.dbInitialized) {
                const stores = Object.values(this.indexedDB.stores);
                for (const store of stores) {
                    try {
                        await this.indexedDB.clear(store);
                    } catch (error) {
                        console.error(`Error clearing store ${store}:`, error);
                    }
                }
            }

            // Clear localStorage data with user prefix
            const keysToRemove = Object.keys(localStorage)
                .filter(key => key.startsWith(this.prefix));

            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });

            // Clear cache
            this.cache = {
                recentEntries: null,
                stats: null,
                lastUpdate: 0,
                ttl: 60000
            };

            console.log('All data cleared successfully');
            return true;
        } catch (error) {
            console.error('Error clearing all data:', error);
            throw error;
        }
    }

    // Cleanup and maintenance
    async cleanup() {
        // Clear cache
        this.cache = {
            recentEntries: null,
            stats: null,
            lastUpdate: 0,
            ttl: 60000
        };

        // Close IndexedDB connection
        if (this.indexedDB) {
            this.indexedDB.close();
        }
    }
}
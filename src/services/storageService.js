// services/storageService.js - Updated with compression and IndexedDB support

import { CompressionUtils } from '../utils/helpers.js';
import { IndexedDBService } from './indexedDBService.js';

export class StorageService {
    constructor(userId) {
        this.userId = userId;
        this.prefix = userId ? `${userId}_` : '';
        this.indexedDB = new IndexedDBService(userId);
        this.compressionEnabled = true;
        this.useIndexedDB = false; // Disabled for now until we fix IndexedDB issues

        // Initialize IndexedDB
        this.initIndexedDB();
    }

    async initIndexedDB() {
        try {
            await this.indexedDB.init();
            console.log('IndexedDB initialized successfully');

            // Migrate existing localStorage data to IndexedDB
            await this.migrateToIndexedDB();
        } catch (error) {
            console.error('Failed to initialize IndexedDB, falling back to localStorage:', error);
            this.useIndexedDB = false;
        }
    }

    async migrateToIndexedDB() {
        // Check if migration has already been done
        const migrationKey = `${this.prefix}migrated_to_indexeddb`;
        if (localStorage.getItem(migrationKey)) {
            return;
        }

        try {
            // Migrate practice entries
            const entries = this.getItemFromLocalStorage('practiceEntries', []);
            if (entries.length > 0) {
                for (const entry of entries) {
                    await this.indexedDB.savePracticeSession(entry);
                }
                console.log(`Migrated ${entries.length} practice sessions to IndexedDB`);
            }

            // Mark migration as complete
            localStorage.setItem(migrationKey, 'true');
        } catch (error) {
            console.error('Migration to IndexedDB failed:', error);
        }
    }

    // Practice Entries - Fixed to always return an array
    async getPracticeEntries() {
        try {
            // Always try localStorage first for now to ensure compatibility
            const localEntries = this.getItem('practiceEntries', []);

            // Ensure it's an array
            if (Array.isArray(localEntries)) {
                return localEntries;
            }

            console.error('Local entries is not an array:', localEntries);
            return [];

            // IndexedDB code commented out until we fix it
            /*
            if (this.useIndexedDB && this.indexedDB) {
                try {
                    const sessions = await this.indexedDB.getPracticeSessions(1000, 0);
                    if (Array.isArray(sessions)) {
                        return sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
                    }
                } catch (error) {
                    console.error('IndexedDB error:', error);
                }
            }
            */
        } catch (error) {
            console.error('Error in getPracticeEntries:', error);
            return [];
        }
    }

    async savePracticeEntry(entry) {
        try {
            // Always save to localStorage for now
            const entries = await this.getPracticeEntries();
            entries.unshift(entry);

            // Keep only last 1000 entries
            if (entries.length > 1000) {
                entries.splice(1000);
            }

            this.setItem('practiceEntries', entries);

            // Also try to save to IndexedDB if available
            if (this.useIndexedDB && this.indexedDB) {
                try {
                    await this.indexedDB.savePracticeSession(entry);
                } catch (error) {
                    console.error('Failed to save to IndexedDB:', error);
                }
            }

            // Update recent entries for quick access
            const recentEntries = this.getItem('recentPracticeEntries', []);
            recentEntries.unshift(entry);
            if (recentEntries.length > 10) {
                recentEntries.splice(10);
            }
            this.setItem('recentPracticeEntries', recentEntries);

            return entries;
        } catch (error) {
            console.error('Error saving practice entry:', error);
            throw error;
        }
    }

    async getPracticeEntriesForDateRange(startDate, endDate) {
        if (this.useIndexedDB) {
            try {
                return await this.indexedDB.getSessionsByDateRange(startDate, endDate);
            } catch (error) {
                console.error('IndexedDB error:', error);
            }
        }

        const entries = await this.getPracticeEntries();
        return entries.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= startDate && entryDate <= endDate;
        });
    }

    // Goals - Keep in localStorage for quick access
    getGoals() {
        return this.getItem('practiceGoals', []);
    }

    saveGoal(goal) {
        const goals = this.getGoals();
        goals.unshift(goal);
        this.setItem('practiceGoals', goals);
        return goals;
    }

    updateGoal(goalId, updates) {
        const goals = this.getGoals();
        const index = goals.findIndex(g => g.id === goalId);

        if (index !== -1) {
            goals[index] = { ...goals[index], ...updates };
            this.setItem('practiceGoals', goals);
            return goals[index];
        }

        return null;
    }

    deleteGoal(goalId) {
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

    // Export/Import with compression
    async exportData() {
        const data = {
            entries: await this.getPracticeEntries(),
            goals: this.getGoals(),
            practiceSessions: this.getPracticeSessions(),
            practiceAreaGoals: this.getPracticeAreaGoals(),
            exportDate: new Date().toISOString(),
            userId: this.userId
        };

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

        // Import to IndexedDB if available
        if (this.useIndexedDB && data.entries) {
            try {
                await this.indexedDB.importData({
                    sessions: data.entries,
                    practiceLoops: data.practiceSessions
                });
            } catch (error) {
                console.error('Failed to import to IndexedDB:', error);
            }
        }

        // Also update localStorage
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
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error reading ${key} from localStorage:`, error);
            return defaultValue;
        }
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

    // Statistics helpers - Fixed with proper async handling
    async calculateStats() {
        try {
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

            return {
                totalTime: totalSeconds,
                totalSessions: entries.length,
                averageSession: avgSeconds,
                currentStreak,
                longestStreak
            };
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

        if (this.useIndexedDB) {
            info.indexedDB = await this.indexedDB.getStorageInfo();
        }

        return info;
    }
}
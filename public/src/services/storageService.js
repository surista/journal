// src/services/storageService.js - Complete fixed version with all goal methods
import {CompressionUtils} from '../utils/helpers.js';
import {AuthService} from './authService.js';
import {cloudStorage} from './firebaseService.js';

export class StorageService {
    constructor(userId) {
        this.userId = userId;
        this.prefix = `guitarpractice_${userId}_`;
        this.useCompression = true;
        this.autoBackupEnabled = true;
        this.backupDebounceTimer = null;
        this.backupDebounceDelay = 5000;
        this.cloudSyncEnabled = true;
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
                        console.log(`Recovered ${data.length} entries from ${key}`);
                        return data;
                    }
                }
            } catch (e) {
                console.warn(`Backup ${key} also corrupted`);
            }
        }

        console.log('No recoverable data found, starting fresh');
        return [];
    }

    // Simplified cloud sync without subscription
    async initializeCloudSync() {
        if (!this.cloudSyncEnabled) return;

        try {
            // Only sync if cloud storage is available
            if (cloudStorage && cloudStorage.userId) {
                await this.syncFromCloud();
            }
        } catch (error) {
            console.warn('Cloud sync initialization failed, continuing in offline mode:', error);
        }
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
                console.log('Goal saved successfully:', goal);
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
            const goalIndex = goals.findIndex(g => g.id === goalId);

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
                console.log('Goal updated successfully:', goals[goalIndex]);
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
            const filteredGoals = goals.filter(g => g.id !== goalId);

            if (filteredGoals.length === initialLength) {
                console.warn(`Goal with ID ${goalId} not found for deletion`);
                return false;
            }

            // Save filtered goals back to storage
            const success = await this.saveGoals(filteredGoals);

            if (success) {
                console.log('Goal deleted successfully:', goalId);
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

            // Simple cloud sync
            if (cloudStorage && cloudStorage.currentUser) {
                try {
                    await cloudStorage.saveData('goals', goals);
                    console.log('Goals synced to cloud');
                } catch (error) {
                    console.warn('Cloud goal sync failed:', error);
                    // Don't fail the entire operation if cloud sync fails
                }
            }

            console.log(`Successfully saved ${goals.length} goals`);
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

            if (!stored) {
                console.log('No goals found, returning empty array');
                return [];
            }

            const goals = JSON.parse(stored);

            // Validate that it's an array
            if (!Array.isArray(goals)) {
                console.warn('Goals data is not an array, resetting to empty array');
                await this.saveGoals([]);
                return [];
            }

            console.log(`Loaded ${goals.length} goals from storage`);
            return goals;
        } catch (error) {
            console.error('Error loading goals:', error);

            // Try to recover from corruption
            if (error.message.includes('JSON parse error') ||
                error.message.includes('SyntaxError') ||
                error.message.includes('Unexpected token')) {

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
            return goals.find(g => g.id === goalId) || null;
        } catch (error) {
            console.error('Error getting goal by ID:', error);
            return null;
        }
    }

    async getGoalsByType(type) {
        try {
            const goals = await this.getGoals();
            return goals.filter(g => g.type === type);
        } catch (error) {
            console.error('Error getting goals by type:', error);
            return [];
        }
    }

    async getActiveGoals() {
        try {
            const goals = await this.getGoals();
            return goals.filter(g => !g.completed);
        } catch (error) {
            console.error('Error getting active goals:', error);
            return [];
        }
    }

    async getCompletedGoals() {
        try {
            const goals = await this.getGoals();
            return goals.filter(g => g.completed);
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

    // ===================
    // PRACTICE ENTRIES
    // ===================

    async savePracticeEntry(entry) {
        try {
            const entries = await this.getPracticeEntries();

            // Ensure entry has required properties
            if (!entry.id) {
                entry.id = Date.now() + Math.random();
            }

            if (!entry.date) {
                entry.date = new Date().toISOString();
            }

            entries.unshift(entry);

            if (entries.length > 1000) {
                entries.length = 1000;
            }

            const key = `${this.prefix}practice_entries`;

            // Save backup before compression
            if (entries.length % 10 === 0) {
                try {
                    localStorage.setItem(`${this.prefix}practice_entries_backup`, JSON.stringify(entries));
                    console.log('Practice entries backup saved');
                } catch (backupError) {
                    console.warn('Failed to save backup:', backupError);
                }
            }

            if (this.useCompression) {
                const compressed = CompressionUtils.compressObject(entries);
                localStorage.setItem(key, compressed);
            } else {
                localStorage.setItem(key, JSON.stringify(entries));
            }

            await this.updateStats(entry);
            this.scheduleBackup();

            // Simple cloud sync without subscription
            if (this.cloudSyncEnabled && cloudStorage && cloudStorage.currentUser) {
                try {
                    await cloudStorage.savePracticeSession(entry);
                } catch (cloudError) {
                    console.warn('Cloud sync failed, data saved locally:', cloudError);
                }
            }

            console.log('Practice entry saved successfully:', entry);
            return true;
        } catch (error) {
            console.error('Error saving practice entry:', error);
            throw error;
        }
    }

    async getPracticeEntries() {
        try {
            const key = `${this.prefix}practice_entries`;
            const stored = localStorage.getItem(key);

            if (!stored) return [];

            if (this.useCompression) {
                const decompressed = CompressionUtils.decompressObject(stored);
                if (!decompressed) {
                    console.warn('Failed to decompress practice entries');
                    localStorage.removeItem(key);
                    return [];
                }
                return decompressed;
            } else {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading practice entries:', error);

            // Try to recover from corruption
            if (error.message.includes('JSON parse error') ||
                error.message.includes('SyntaxError') ||
                error.message.includes('Unterminated string')) {

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
                stats.practiceAreas[entry.practiceArea] = (stats.practiceAreas[entry.practiceArea] || 0) + 1;
            }

            const key = `${this.prefix}stats`;
            localStorage.setItem(key, JSON.stringify(stats));

            return stats;
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    async getStats() {
        try {
            const key = `${this.prefix}stats`;
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : {
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
            const practiceDates = new Set(sessions.map(s => new Date(s.date).toDateString()));

            if (!practiceDates.has(today) && !practiceDates.has(yesterday)) {
                return 0;
            }

            let streak = 0;
            let checkDate = practiceDates.has(today) ? new Date() : new Date(Date.now() - 86400000);

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

            const practiceAreas = {};
            entries.forEach(entry => {
                if (entry.practiceArea) {
                    practiceAreas[entry.practiceArea] = (practiceAreas[entry.practiceArea] || 0) + 1;
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
                longestStreak: currentStreak,
                averageSessionLength: entries.length > 0 ? Math.floor(totalSeconds / entries.length) : 0,
                practiceAreas,
                mostPracticedArea,
                totalDays: new Set(entries.map(e => new Date(e.date).toDateString())).size
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

            keys.forEach(key => {
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
            return stored ? JSON.parse(stored) : {
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
            this.scheduleBackup();
            return true;
        } catch (error) {
            console.error('Error saving user settings:', error);
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
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            console.log('All user data cleared successfully');
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    // ===================
    // CLOUD SYNC METHODS
    // ===================

    async syncFromCloud() {
        if (!cloudStorage || !cloudStorage.userId) return;

        try {
            console.log('Syncing data from cloud...');
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

        localSessions.forEach(session => {
            const key = `${session.date}_${session.duration}`;
            sessionMap.set(key, session);
        });

        cloudSessions.forEach(session => {
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
                totalTimeFormatted: this.formatDuration(stats.totalSeconds || 0)
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

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }
}
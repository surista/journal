// Storage Service - Handles all data persistence
import { CompressionUtils } from '../utils/helpers.js';
import { AuthService } from './authService.js';

export class StorageService {
    constructor(userId) {
        this.userId = userId;
        this.prefix = `guitarpractice_${userId}_`;
        this.useCompression = true;

        // Auto-backup properties
        this.autoBackupEnabled = true;
        this.backupDebounceTimer = null;
        this.backupDebounceDelay = 5000; // 5 seconds

        // Initialize IndexedDB if available
        this.initIndexedDB();
    }

    // Initialize IndexedDB for large data storage
    async initIndexedDB() {
        try {
            const { IndexedDBService } = await import('./indexedDBService.js');
            this.indexedDB = new IndexedDBService(this.userId);
            await this.indexedDB.init();
            console.log('IndexedDB initialized');
        } catch (error) {
            console.warn('IndexedDB not available, falling back to localStorage', error);
        }
    }

    // Practice Entries
    async savePracticeEntry(entry) {
        try {
            const entries = await this.getPracticeEntries();
            entries.unshift(entry); // Add to beginning

            // Keep only last 1000 entries in localStorage
            if (entries.length > 1000) {
                entries.length = 1000;
            }

            const key = `${this.prefix}practice_entries`;

            if (this.useCompression) {
                const compressed = CompressionUtils.compressObject(entries);
                localStorage.setItem(key, compressed);
            } else {
                localStorage.setItem(key, JSON.stringify(entries));
            }

            // Also save to IndexedDB if available
            if (this.indexedDB) {
                await this.indexedDB.savePracticeSession(entry);
            }

            // Update stats
            await this.updateStats(entry);

            // Schedule backup
            this.scheduleBackup();

            // Sync to cloud if available
            if (window.cloudStorage && window.cloudStorage.currentUser) {
                await window.cloudStorage.syncPracticeSession(entry);
            }

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
                return CompressionUtils.decompressObject(stored) || [];
            } else {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading practice entries:', error);
            return [];
        }
    }

    // Goals
    async saveGoals(goals) {
        try {
            const key = `${this.prefix}goals`;
            localStorage.setItem(key, JSON.stringify(goals));

            // Schedule backup
            this.scheduleBackup();

            // Sync to cloud if available
            if (window.cloudStorage && window.cloudStorage.currentUser) {
                const goalsRef = { goals, syncedAt: new Date().toISOString() };
                await window.cloudStorage.syncBatch('goals', [goalsRef]);
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
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading goals:', error);
            return [];
        }
    }

    // Stats
    async updateStats(entry) {
        try {
            const stats = await this.getStats();

            // Update total sessions
            stats.totalSessions = (stats.totalSessions || 0) + 1;

            // Update total time
            const totalSeconds = (stats.totalSeconds || 0) + (entry.duration || 0);
            stats.totalSeconds = totalSeconds;
            stats.totalHours = Math.floor(totalSeconds / 3600);

            // Update streak
            stats.currentStreak = await this.calculateCurrentStreak();
            stats.longestStreak = Math.max(stats.longestStreak || 0, stats.currentStreak);

            // Update practice areas
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
            const entries = await this.getPracticeEntries();
            if (entries.length === 0) return 0;

            const today = new Date().toDateString();
            const yesterday = new Date(Date.now() - 86400000).toDateString();

            // Check if practiced today or yesterday
            const practiceDates = new Set(entries.map(e => new Date(e.date).toDateString()));

            if (!practiceDates.has(today) && !practiceDates.has(yesterday)) {
                return 0;
            }

            // Count backwards from today or yesterday
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

    // Audio Sessions
    saveAudioSession(fileName, session) {
        try {
            const key = `${this.prefix}audio_sessions_${fileName}`;
            let sessions = this.getAudioSessions(fileName);

            // Add the new session
            sessions.push(session);

            // Keep only the last 20 sessions per file
            if (sessions.length > 20) {
                sessions = sessions.slice(-20);
            }

            localStorage.setItem(key, JSON.stringify(sessions));
            console.log('Audio session saved:', session.name);

            // Schedule backup
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

    deleteAudioSession(fileName, sessionIndex) {
        try {
            const key = `${this.prefix}audio_sessions_${fileName}`;
            let sessions = this.getAudioSessions(fileName);

            if (sessionIndex >= 0 && sessionIndex < sessions.length) {
                sessions.splice(sessionIndex, 1);
                localStorage.setItem(key, JSON.stringify(sessions));
                console.log('Audio session deleted');
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error deleting audio session:', error);
            return false;
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

    // Achievements
    async getAchievements() {
        try {
            const key = `${this.prefix}achievements`;
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error loading achievements:', error);
            return {};
        }
    }

    async saveAchievements(achievements) {
        try {
            const key = `${this.prefix}achievements`;
            localStorage.setItem(key, JSON.stringify(achievements));

            // Schedule backup
            this.scheduleBackup();

            return true;
        } catch (error) {
            console.error('Error saving achievements:', error);
            return false;
        }
    }

    // User Settings
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

            // Schedule backup
            this.scheduleBackup();

            return true;
        } catch (error) {
            console.error('Error saving user settings:', error);
            return false;
        }
    }

    // Auto-backup functionality
    async createBackup(forceDownload = false) {
        if (!this.autoBackupEnabled) return;

        try {
            // Get current user email
            const authService = new AuthService();
            const user = authService.getCurrentUser();
            if (!user || !user.email) return;

            // Create comprehensive backup data
            const backupData = {
                version: '2.0',
                email: user.email,
                userId: this.userId,
                backupDate: new Date().toISOString(),
                data: {
                    practiceEntries: await this.getPracticeEntries(),
                    goals: await this.getGoals(),
                    stats: await this.getStats(),
                    achievements: await this.getAchievements(),
                    settings: await this.getUserSettings(),
                    audioSessions: this.getAllAudioSessions(),
                    customPracticeAreas: this.getCustomPracticeAreas(),
                    streakData: await this.getStreakData()
                }
            };

            // Create filename with email and date
            const safeEmail = user.email.replace(/[^a-z0-9]/gi, '_');
            const dateStr = new Date().toISOString().split('T')[0];
            const timeStr = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
            const filename = `guitar_practice_backup_${safeEmail}_${dateStr}_${timeStr}.json`;

            // Store in localStorage for easy retrieval
            const backupKey = `${this.prefix}latest_backup`;
            try {
                localStorage.setItem(backupKey, JSON.stringify(backupData));
                localStorage.setItem(`${backupKey}_filename`, filename);
                localStorage.setItem(`${backupKey}_date`, new Date().toISOString());
            } catch (e) {
                console.warn('Could not store backup in localStorage:', e);
            }

            // Store in IndexedDB if available for better persistence
            if (this.indexedDB) {
                try {
                    await this.indexedDB.saveBackup(backupData);
                } catch (e) {
                    console.warn('Could not store backup in IndexedDB:', e);
                }
            }

            // Check if this is the first backup
            const hasSeenBackupNotice = localStorage.getItem(`${this.prefix}has_seen_backup_notice`);

            if (!hasSeenBackupNotice || forceDownload) {
                // For first backup or forced download, prompt user
                localStorage.setItem(`${this.prefix}has_seen_backup_notice`, 'true');

                // Return data for download
                return {
                    success: true,
                    filename,
                    data: backupData,
                    shouldPromptDownload: !hasSeenBackupNotice
                };
            }

            console.log('Backup created successfully:', filename);

            return { success: true, filename, data: backupData, shouldPromptDownload: false };
        } catch (error) {
            console.error('Error creating backup:', error);
            return { success: false, error };
        }
    }

    // Debounced backup to avoid too frequent saves
    scheduleBackup() {
        if (!this.autoBackupEnabled || !this.shouldCreateBackup()) return;

        // Clear existing timer
        if (this.backupDebounceTimer) {
            clearTimeout(this.backupDebounceTimer);
        }

        // Schedule new backup
        this.backupDebounceTimer = setTimeout(async () => {
            const result = await this.createBackup();

            // If this is the first backup, notify the user
            if (result && result.shouldPromptDownload) {
                // Dispatch event to notify dashboard
                window.dispatchEvent(new CustomEvent('firstBackupCreated', {
                    detail: result
                }));
            }
        }, this.backupDebounceDelay);
    }

    // Check if backup is needed based on frequency setting
    shouldCreateBackup() {
        const settings = this.getBackupSettings();

        if (!settings.autoBackup) return false;

        if (settings.backupFrequency === 'onChange') {
            return true; // Always backup on change
        }

        const lastCheck = settings.lastBackupCheck ? new Date(settings.lastBackupCheck) : null;
        const now = new Date();

        if (!lastCheck) {
            this.saveBackupSettings({ lastBackupCheck: now.toISOString() });
            return true;
        }

        const daysSinceLastBackup = (now - lastCheck) / (1000 * 60 * 60 * 24);

        if (settings.backupFrequency === 'daily' && daysSinceLastBackup >= 1) {
            this.saveBackupSettings({ lastBackupCheck: now.toISOString() });
            return true;
        }

        if (settings.backupFrequency === 'weekly' && daysSinceLastBackup >= 7) {
            this.saveBackupSettings({ lastBackupCheck: now.toISOString() });
            return true;
        }

        return false;
    }

    // Get custom practice areas
    getCustomPracticeAreas() {
        try {
            const stored = localStorage.getItem('customPracticeAreas');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error getting custom practice areas:', error);
            return [];
        }
    }

    // Get streak data
    async getStreakData() {
        try {
            const entries = await this.getPracticeEntries();
            const streakData = {};

            entries.forEach(entry => {
                const date = new Date(entry.date).toDateString();
                if (!streakData[date]) {
                    streakData[date] = {
                        count: 0,
                        totalDuration: 0,
                        practiceAreas: []
                    };
                }
                streakData[date].count++;
                streakData[date].totalDuration += entry.duration || 0;
                if (entry.practiceArea && !streakData[date].practiceAreas.includes(entry.practiceArea)) {
                    streakData[date].practiceAreas.push(entry.practiceArea);
                }
            });

            return streakData;
        } catch (error) {
            console.error('Error getting streak data:', error);
            return {};
        }
    }

    // Restore from backup
    async restoreFromBackup(backupData) {
        try {
            if (!backupData || !backupData.data) {
                throw new Error('Invalid backup data format');
            }

            const data = backupData.data;

            // Restore all data
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
            if (data.achievements) await this.saveAchievements(data.achievements);
            if (data.settings) await this.saveUserSettings(data.settings);

            if (data.audioSessions) {
                Object.entries(data.audioSessions).forEach(([fileName, sessions]) => {
                    const key = `${this.prefix}audio_sessions_${fileName}`;
                    localStorage.setItem(key, JSON.stringify(sessions));
                });
            }

            if (data.customPracticeAreas) {
                localStorage.setItem('customPracticeAreas', JSON.stringify(data.customPracticeAreas));
            }

            console.log('Data restored from backup successfully');
            return { success: true };
        } catch (error) {
            console.error('Error restoring from backup:', error);
            return { success: false, error };
        }
    }

    // Get backup settings
    getBackupSettings() {
        try {
            const settings = localStorage.getItem(`${this.prefix}backup_settings`);
            return settings ? JSON.parse(settings) : {
                autoBackup: true,
                backupFrequency: 'onChange', // 'onChange', 'daily', 'weekly'
                lastBackupCheck: null,
                showNotifications: true
            };
        } catch (error) {
            console.error('Error getting backup settings:', error);
            return {
                autoBackup: true,
                backupFrequency: 'onChange',
                lastBackupCheck: null,
                showNotifications: true
            };
        }
    }

    // Save backup settings
    saveBackupSettings(settings) {
        try {
            const currentSettings = this.getBackupSettings();
            const updatedSettings = { ...currentSettings, ...settings };
            localStorage.setItem(`${this.prefix}backup_settings`, JSON.stringify(updatedSettings));

            // Update auto backup enabled state
            this.autoBackupEnabled = updatedSettings.autoBackup;

            return true;
        } catch (error) {
            console.error('Error saving backup settings:', error);
            return false;
        }
    }

    // Check if user should be reminded to download backup
    checkBackupReminder() {
        const lastDownloadKey = `${this.prefix}last_backup_download`;
        const lastDownload = localStorage.getItem(lastDownloadKey);
        const now = Date.now();

        // Remind every 7 days
        const reminderInterval = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

        if (!lastDownload || (now - parseInt(lastDownload)) > reminderInterval) {
            // Dispatch event to show reminder
            window.dispatchEvent(new CustomEvent('backupReminderNeeded', {
                detail: {
                    lastDownload: lastDownload ? new Date(parseInt(lastDownload)) : null,
                    daysSince: lastDownload ? Math.floor((now - parseInt(lastDownload)) / (24 * 60 * 60 * 1000)) : null
                }
            }));
        }
    }

    // Mark that user downloaded a backup
    markBackupDownloaded() {
        const lastDownloadKey = `${this.prefix}last_backup_download`;
        localStorage.setItem(lastDownloadKey, Date.now().toString());
    }

    // Cloud sync integration
    async mergeCloudData(cloudData) {
        if (!cloudData) return;

        console.log('Merging cloud data with local data...');

        try {
            // Get current local data
            const localData = await this.exportAllData();

            // Merge practice entries
            if (cloudData.practiceEntries && cloudData.practiceEntries.length > 0) {
                const localEntries = localData.practiceEntries || [];
                const localIds = new Set(localEntries.map(e => e.id));

                // Add cloud entries that don't exist locally
                const newEntries = cloudData.practiceEntries.filter(e => !localIds.has(e.id));

                if (newEntries.length > 0) {
                    const merged = [...localEntries, ...newEntries]
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .slice(0, 1000); // Keep last 1000

                    const key = `${this.prefix}practice_entries`;
                    if (this.useCompression) {
                        const compressed = CompressionUtils.compressObject(merged);
                        localStorage.setItem(key, compressed);
                    } else {
                        localStorage.setItem(key, JSON.stringify(merged));
                    }
                }
            }

            // Merge other data types
            if (cloudData.goals) await this.saveGoals(cloudData.goals);
            if (cloudData.stats) {
                const key = `${this.prefix}stats`;
                localStorage.setItem(key, JSON.stringify(cloudData.stats));
            }
            if (cloudData.achievements) await this.saveAchievements(cloudData.achievements);
            if (cloudData.settings) await this.saveUserSettings(cloudData.settings);

            // Merge audio sessions
            if (cloudData.audioSessions) {
                Object.entries(cloudData.audioSessions).forEach(([fileName, sessions]) => {
                    const key = `${this.prefix}audio_sessions_${fileName}`;
                    const existing = this.getAudioSessions(fileName);

                    // Merge sessions by ID
                    const sessionMap = new Map();
                    existing.forEach(s => sessionMap.set(s.id || s.timestamp, s));
                    sessions.forEach(s => sessionMap.set(s.id || s.timestamp, s));

                    const merged = Array.from(sessionMap.values())
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .slice(0, 20); // Keep last 20

                    localStorage.setItem(key, JSON.stringify(merged));
                });
            }

            console.log('Cloud data merged successfully');

            // Trigger UI update
            window.dispatchEvent(new CustomEvent('dataUpdated', { detail: 'cloudSync' }));

        } catch (error) {
            console.error('Error merging cloud data:', error);
        }
    }

    // Export/Import Data
    async exportAllData() {
        try {
            const data = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                userId: this.userId,
                practiceEntries: await this.getPracticeEntries(),
                goals: await this.getGoals(),
                stats: await this.getStats(),
                achievements: await this.getAchievements(),
                settings: await this.getUserSettings(),
                audioSessions: this.getAllAudioSessions()
            };

            return data;
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

            // Import practice entries
            if (data.practiceEntries) {
                const key = `${this.prefix}practice_entries`;
                if (this.useCompression) {
                    const compressed = CompressionUtils.compressObject(data.practiceEntries);
                    localStorage.setItem(key, compressed);
                } else {
                    localStorage.setItem(key, JSON.stringify(data.practiceEntries));
                }
            }

            // Import other data
            if (data.goals) await this.saveGoals(data.goals);
            if (data.stats) localStorage.setItem(`${this.prefix}stats`, JSON.stringify(data.stats));
            if (data.achievements) await this.saveAchievements(data.achievements);
            if (data.settings) await this.saveUserSettings(data.settings);

            // Import audio sessions
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

    // Storage Management
    async getStorageUsage() {
        try {
            let totalSize = 0;

            // Calculate localStorage usage
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(this.prefix)) {
                    const item = localStorage.getItem(key);
                    totalSize += item ? item.length : 0;
                }
            });

            // Estimate total available (5MB for localStorage)
            const totalAvailable = 5 * 1024 * 1024;

            return {
                used: totalSize,
                total: totalAvailable,
                percentage: (totalSize / totalAvailable) * 100
            };
        } catch (error) {
            console.error('Error calculating storage usage:', error);
            return { used: 0, total: 0, percentage: 0 };
        }
    }

    async clearAllData() {
        try {
            // Clear localStorage
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });

            // Clear IndexedDB if available
            if (this.indexedDB) {
                await this.indexedDB.clearAll();
            }

            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }
}
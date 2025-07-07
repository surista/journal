// Storage Service - Handles all data persistence
import { CompressionUtils } from '../utils/helpers.js';

export class StorageService {
    constructor(userId) {
        this.userId = userId;
        this.prefix = `guitarpractice_${userId}_`;
        this.useCompression = true;

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
                await this.indexedDB.savePracticeEntry(entry);
            }

            // Update stats
            await this.updateStats(entry);

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
            return true;
        } catch (error) {
            console.error('Error saving user settings:', error);
            return false;
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
// src/components/tabs/SettingsTab.js - Complete Settings Tab with Data Management
import { TimeUtils } from '../../utils/helpers.js';
import { notificationManager } from '../../services/notificationManager.js';

export class SettingsTab {
    constructor(container, storageService, authService) {
        this.container = container;
        this.storageService = storageService;
        this.authService = authService;
        this.themeService = null;
        this.cloudSyncHandler = null;
    }

    setThemeService(themeService) {
        this.themeService = themeService;
    }

    setCloudSyncHandler(cloudSyncHandler) {
        this.cloudSyncHandler = cloudSyncHandler;
    }

    async render() {
        const user = this.authService.getCurrentUser();
        const settings = await this.storageService.getUserSettings();

        this.container.innerHTML = `
            <div class="settings-tab">
                <div class="settings-header">
                    <h2>Settings</h2>
                    <p class="settings-subtitle">Customize your practice experience</p>
                </div>

                <!-- User Account Section -->
                <div class="settings-section">
                    <h3>Account</h3>
                    <div class="setting-item">
                        <div class="setting-info">
                            <label>Signed in as</label>
                            <p class="setting-description">${user ? user.email : 'Not signed in'}</p>
                        </div>
                        <div class="setting-control">
                            ${user ? `
                                <button id="signOutBtn" class="btn btn-secondary">
                                    Sign Out
                                </button>
                            ` : `
                                <button id="signInBtn" class="btn btn-primary">
                                    Sign In
                                </button>
                            `}
                        </div>
                    </div>
                </div>

                <!-- Appearance Section -->
                <div class="settings-section">
                    <h3>Appearance</h3>
                    <div class="setting-item">
                        <div class="setting-info">
                            <label for="darkModeToggle">Dark Mode</label>
                            <p class="setting-description">Toggle between light and dark themes</p>
                        </div>
                        <div class="setting-control">
                            <label class="toggle-switch">
                                <input type="checkbox" id="darkModeToggle" ${settings.darkMode !== false ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Notifications Section -->
                <div class="settings-section">
                    <h3>Notifications</h3>
                    <div class="setting-item">
                        <div class="setting-info">
                            <label for="notificationsToggle">Enable Notifications</label>
                            <p class="setting-description">Show practice reminders and achievements</p>
                        </div>
                        <div class="setting-control">
                            <label class="toggle-switch">
                                <input type="checkbox" id="notificationsToggle" ${settings.notificationsEnabled !== false ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <label for="soundToggle">Sound Effects</label>
                            <p class="setting-description">Play sounds for notifications and interactions</p>
                        </div>
                        <div class="setting-control">
                            <label class="toggle-switch">
                                <input type="checkbox" id="soundToggle" ${settings.soundEnabled !== false ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <label for="practiceRemindersToggle">Practice Reminders</label>
                            <p class="setting-description">Daily reminders to practice</p>
                        </div>
                        <div class="setting-control">
                            <label class="toggle-switch">
                                <input type="checkbox" id="practiceRemindersToggle" ${settings.practiceReminders?.enabled ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                    <div class="setting-item" id="reminderTimeSection" style="${settings.practiceReminders?.enabled ? '' : 'display: none;'}">
                        <div class="setting-info">
                            <label for="reminderTime">Reminder Time</label>
                            <p class="setting-description">When to send practice reminders</p>
                        </div>
                        <div class="setting-control">
                            <input type="time" id="reminderTime" value="${settings.practiceReminders?.time || '19:00'}" 
                                   class="form-control" style="width: auto;">
                        </div>
                    </div>
                </div>

                <!-- Cloud Sync Section -->
                <div class="settings-section">
                    <h3>Cloud Sync</h3>
                    <div class="setting-item">
                        <div class="setting-info">
                            <label>Cloud Status</label>
                            <p class="setting-description" id="cloudStatusText">
                                ${user?.isCloudEnabled ? 'Connected and syncing' : 'Not connected'}
                            </p>
                        </div>
                        <div class="setting-control">
                            <div class="cloud-status ${user?.isCloudEnabled ? 'online' : 'offline'}" id="cloudStatus">
                                <span class="status-icon" id="syncIcon">${user?.isCloudEnabled ? '✅' : '❌'}</span>
                                <span class="status-text" id="syncText">
                                    ${user?.isCloudEnabled ? `Synced as ${user.email}` : 'Not synced'}
                                </span>
                            </div>
                        </div>
                    </div>

                    ${user?.isCloudEnabled ? `
                        <div class="setting-item">
                            <div class="setting-info">
                                <label>Sync Actions</label>
                                <p class="setting-description">Manual sync operations</p>
                            </div>
                            <div class="setting-control">
                                <div class="sync-buttons">
                                    <button id="syncNowBtn" class="btn btn-primary">
                                        <i class="icon">🔄</i> Sync Now
                                    </button>
                                    <button id="downloadFromCloudBtn" class="btn btn-secondary">
                                        <i class="icon">⬇️</i> Download from Cloud
                                    </button>
                                    <button id="uploadToCloudBtn" class="btn btn-secondary">
                                        <i class="icon">⬆️</i> Upload to Cloud
                                    </button>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>

                <!-- Data Management Section -->
                <div class="settings-section">
                    <h3>Data Management</h3>
                    <div class="setting-item">
                        <div class="setting-info">
                            <label>Data Summary</label>
                            <p class="setting-description">Current data stored in your account</p>
                        </div>
                        <div class="setting-control">
                            <div id="dataSummary" class="data-summary">
                                Loading...
                            </div>
                        </div>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <label>Export Data</label>
                            <p class="setting-description">Download your practice data as a backup</p>
                        </div>
                        <div class="setting-control">
                            <button id="exportDataBtn" class="btn btn-secondary">
                                📥 Export Data
                            </button>
                        </div>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <label>Import Data</label>
                            <p class="setting-description">Restore data from a backup file</p>
                        </div>
                        <div class="setting-control">
                            <input type="file" id="importDataFile" accept=".json" style="display: none;">
                            <button id="importDataBtn" class="btn btn-secondary">
                                📤 Import Data
                            </button>
                        </div>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <label>Clear Local Cache</label>
                            <p class="setting-description">Clear browser cache and reload (fixes display issues)</p>
                        </div>
                        <div class="setting-control">
                            <button id="clearCacheBtn" class="btn btn-secondary">
                                🔄 Clear Cache
                            </button>
                        </div>
                    </div>

                    <div class="setting-item danger-zone">
                        <div class="setting-info">
                            <label>Reset All Data</label>
                            <p class="setting-description">⚠️ Permanently delete all practice sessions, goals, stats, and settings. This cannot be undone.</p>
                        </div>
                        <div class="setting-control">
                            <button id="purgeDataBtn" class="btn btn-danger">
                                🗑️ Purge All Data
                            </button>
                        </div>
                    </div>
                </div>

                <!-- App Info Section -->
                <div class="settings-section">
                    <h3>About</h3>
                    <div class="setting-item">
                        <div class="setting-info">
                            <label>App Version</label>
                            <p class="setting-description">Guitar Practice Journal v${window.APP_VERSION || '8.8'}</p>
                        </div>
                        <div class="setting-control">
                            <span class="version-info">Build ${window.BUILD_NUMBER || 'dev'}</span>
                        </div>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <label>Last Updated</label>
                            <p class="setting-description">${window.BUILD_DATE ? new Date(window.BUILD_DATE).toLocaleDateString() : 'Unknown'}</p>
                        </div>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <label>Storage Used</label>
                            <p class="setting-description">Local browser storage usage</p>
                        </div>
                        <div class="setting-control">
                            <span id="storageUsage" class="storage-info">Calculating...</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
        await this.updateDataSummary();
        this.calculateStorageUsage();
    }

    attachEventListeners() {
        // Dark mode toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle && this.themeService) {
            darkModeToggle.addEventListener('change', (e) => {
                this.themeService.setTheme(e.target.checked ? 'dark' : 'light');
                this.saveUserSettings({ darkMode: e.target.checked });
            });
        }

        // Notifications toggle
        const notificationsToggle = document.getElementById('notificationsToggle');
        if (notificationsToggle) {
            notificationsToggle.addEventListener('change', (e) => {
                this.saveUserSettings({ notificationsEnabled: e.target.checked });
                if (e.target.checked) {
                    this.requestNotificationPermission();
                }
            });
        }

        // Sound toggle
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.addEventListener('change', (e) => {
                this.saveUserSettings({ soundEnabled: e.target.checked });
            });
        }

        // Practice reminders toggle
        const practiceRemindersToggle = document.getElementById('practiceRemindersToggle');
        if (practiceRemindersToggle) {
            practiceRemindersToggle.addEventListener('change', (e) => {
                const reminderTimeSection = document.getElementById('reminderTimeSection');
                if (reminderTimeSection) {
                    reminderTimeSection.style.display = e.target.checked ? 'flex' : 'none';
                }
                this.savePracticeReminderSettings();
            });
        }

        // Reminder time
        const reminderTime = document.getElementById('reminderTime');
        if (reminderTime) {
            reminderTime.addEventListener('change', () => {
                this.savePracticeReminderSettings();
            });
        }

        // Sign out button
        const signOutBtn = document.getElementById('signOutBtn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => this.handleSignOut());
        }

        // Sign in button
        const signInBtn = document.getElementById('signInBtn');
        if (signInBtn) {
            signInBtn.addEventListener('click', () => {
                window.location.href = './login.html';
            });
        }

        // Data management listeners
        this.attachDataManagementListeners();

        // Cloud sync listeners
        this.attachCloudSyncListeners();
    }

    async attachDataManagementListeners() {
        // Export data button
        const exportBtn = document.getElementById('exportDataBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', async () => {
                await this.handleExportData();
            });
        }

        // Import data button
        const importBtn = document.getElementById('importDataBtn');
        const importFile = document.getElementById('importDataFile');
        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => {
                importFile.click();
            });

            importFile.addEventListener('change', async (e) => {
                await this.handleImportData(e);
            });
        }

        // Purge all data button
        const purgeBtn = document.getElementById('purgeDataBtn');
        if (purgeBtn) {
            purgeBtn.addEventListener('click', async () => {
                await this.handlePurgeData();
            });
        }

        // Clear cache button
        const clearCacheBtn = document.getElementById('clearCacheBtn');
        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', () => {
                this.handleClearCache();
            });
        }
    }

    attachCloudSyncListeners() {
        if (!this.cloudSyncHandler) return;

        // Manual sync button
        const syncNowBtn = document.getElementById('syncNowBtn');
        if (syncNowBtn) {
            syncNowBtn.addEventListener('click', async () => {
                await this.cloudSyncHandler.performManualSync();
            });
        }

        // Download from cloud button
        const downloadBtn = document.getElementById('downloadFromCloudBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', async () => {
                await this.cloudSyncHandler.downloadFromCloud();
            });
        }

        // Upload to cloud button
        const uploadBtn = document.getElementById('uploadToCloudBtn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', async () => {
                await this.cloudSyncHandler.uploadToCloud();
            });
        }
    }

    async handleExportData() {
        try {
            const exportBtn = document.getElementById('exportDataBtn');
            if (exportBtn) {
                exportBtn.innerHTML = '⏳ Exporting...';
                exportBtn.disabled = true;
            }

            const data = await this.storageService.exportAllData();

            // Create filename with timestamp
            const user = this.authService.getCurrentUser();
            const safeEmail = user?.email ? user.email.replace(/[^a-z0-9]/gi, '_') : 'user';
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `guitar_practice_export_${safeEmail}_${timestamp}.json`;

            // Create download
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            notificationManager.success('Data exported successfully! 📥');
        } catch (error) {
            console.error('Export error:', error);
            notificationManager.error('Failed to export data: ' + error.message);
        } finally {
            const exportBtn = document.getElementById('exportDataBtn');
            if (exportBtn) {
                exportBtn.innerHTML = '📥 Export Data';
                exportBtn.disabled = false;
            }
        }
    }

    async handleImportData(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const importBtn = document.getElementById('importDataBtn');
            if (importBtn) {
                importBtn.innerHTML = '⏳ Importing...';
                importBtn.disabled = true;
            }

            const text = await file.text();
            const data = JSON.parse(text);

            // Validate data structure
            if (!data.version) {
                throw new Error('Invalid backup file format');
            }

            // Confirm import
            const confirm1 = confirm(`Import data from ${file.name}? This will replace your current data.`);
            if (!confirm1) return;

            await this.storageService.importData(data);

            notificationManager.success('Data imported successfully! The page will reload.');

            // Reload to refresh all components
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error) {
            console.error('Import error:', error);
            notificationManager.error('Failed to import data: ' + error.message);
        } finally {
            const importBtn = document.getElementById('importDataBtn');
            if (importBtn) {
                importBtn.innerHTML = '📤 Import Data';
                importBtn.disabled = false;
            }
            // Clear file input
            event.target.value = '';
        }
    }

    async handlePurgeData() {
        // Multiple confirmation to prevent accidents
        const confirm1 = confirm('⚠️ WARNING: This will delete ALL your practice data, goals, and settings permanently. Are you absolutely sure?');
        if (!confirm1) return;

        const confirm2 = confirm('🚨 FINAL WARNING: This action cannot be undone. All your practice history will be lost forever. Continue?');
        if (!confirm2) return;

        const confirm3 = prompt('Type "DELETE ALL DATA" to confirm (case sensitive):');
        if (confirm3 !== 'DELETE ALL DATA') {
            alert('Confirmation text did not match. Data purge cancelled.');
            return;
        }

        try {
            // Show loading state
            const purgeBtn = document.getElementById('purgeDataBtn');
            if (purgeBtn) {
                purgeBtn.innerHTML = '⏳ Purging...';
                purgeBtn.disabled = true;
            }

            // Clear local storage
            await this.storageService.clearAllData();

            // Clear additional local storage items
            const keysToRemove = [
                'currentUser',
                'authToken',
                'practiceFormState',
                'customPracticeAreas',
                'guitarJournalAchievements',
                'theme'
            ];

            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });

            // Clear session storage
            sessionStorage.clear();

            // Clear cloud data if signed in
            if (window.cloudStorage && window.cloudStorage.currentUser) {
                try {
                    // Note: This would require additional Firebase functions to delete cloud data
                    console.log('User is signed in to cloud - local data cleared, cloud data remains');
                } catch (error) {
                    console.warn('Could not clear cloud data:', error);
                }
            }

            // Show success message
            alert('✅ All data has been purged successfully. The page will now reload.');

            // Reload the page to reset everything
            window.location.reload();

        } catch (error) {
            console.error('Error purging data:', error);
            alert('❌ Error purging data: ' + error.message);

            // Reset button
            const purgeBtn = document.getElementById('purgeDataBtn');
            if (purgeBtn) {
                purgeBtn.innerHTML = '🗑️ Purge All Data';
                purgeBtn.disabled = false;
            }
        }
    }

    handleClearCache() {
        if (confirm('Clear browser cache and reload the page?')) {
            // Clear service worker cache
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    registrations.forEach(registration => {
                        registration.unregister();
                    });
                });
            }

            // Clear browser caches
            if ('caches' in window) {
                caches.keys().then(cacheNames => {
                    cacheNames.forEach(cacheName => {
                        caches.delete(cacheName);
                    });
                });
            }

            // Clear session storage
            sessionStorage.clear();

            // Reload with cache bypass
            window.location.reload(true);
        }
    }

    async updateDataSummary() {
        try {
            const summaryEl = document.getElementById('dataSummary');
            if (!summaryEl) return;

            // Get data counts
            const entries = await this.storageService.getPracticeEntries();
            const goals = await this.storageService.getGoals();
            const stats = await this.storageService.getStats();
            const audioSessions = this.storageService.getAllAudioSessions();

            // Calculate total audio sessions
            const totalAudioSessions = Object.values(audioSessions).reduce((total, sessions) => {
                return total + (Array.isArray(sessions) ? sessions.length : 0);
            }, 0);

            summaryEl.innerHTML = `
                <div class="data-summary-grid">
                    <div class="summary-item">
                        <span class="summary-label">Practice Sessions:</span>
                        <span class="summary-value">${Array.isArray(entries) ? entries.length : 0}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Goals:</span>
                        <span class="summary-value">${Array.isArray(goals) ? goals.length : 0}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Audio Sessions:</span>
                        <span class="summary-value">${totalAudioSessions}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Total Time:</span>
                        <span class="summary-value">${Math.floor((stats.totalSeconds || 0) / 60)}m</span>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error updating data summary:', error);
            const summaryEl = document.getElementById('dataSummary');
            if (summaryEl) {
                summaryEl.innerHTML = '<span style="color: var(--danger);">Error loading data summary</span>';
            }
        }
    }

    calculateStorageUsage() {
        try {
            let totalSize = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length + key.length;
                }
            }

            // Convert to human readable format
            const sizeInKB = (totalSize / 1024).toFixed(2);
            const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);

            const storageEl = document.getElementById('storageUsage');
            if (storageEl) {
                if (totalSize > 1024 * 1024) {
                    storageEl.textContent = `${sizeInMB} MB`;
                } else {
                    storageEl.textContent = `${sizeInKB} KB`;
                }
            }
        } catch (error) {
            console.error('Error calculating storage usage:', error);
            const storageEl = document.getElementById('storageUsage');
            if (storageEl) {
                storageEl.textContent = 'Unknown';
            }
        }
    }

    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                notificationManager.success('Notifications enabled! 🔔');
            } else {
                notificationManager.warning('Notifications permission denied');
            }
        }
    }

    async saveUserSettings(newSettings) {
        try {
            await this.storageService.saveUserSettings(newSettings);
        } catch (error) {
            console.error('Error saving settings:', error);
            notificationManager.error('Failed to save settings');
        }
    }

    async savePracticeReminderSettings() {
        const enabled = document.getElementById('practiceRemindersToggle')?.checked || false;
        const time = document.getElementById('reminderTime')?.value || '19:00';

        await this.saveUserSettings({
            practiceReminders: {
                enabled,
                time
            }
        });

        if (enabled) {
            notificationManager.info(`Practice reminders set for ${time}`);
        }
    }

    async handleSignOut() {
        if (confirm('Sign out of your account?')) {
            try {
                await this.authService.logout();
                notificationManager.success('Signed out successfully');
                window.location.href = './login.html';
            } catch (error) {
                console.error('Sign out error:', error);
                notificationManager.error('Failed to sign out');
            }
        }
    }

    destroy() {
        // Clean up any listeners or resources
    }
}
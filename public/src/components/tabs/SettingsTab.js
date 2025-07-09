// SettingsTab Component - Handles all settings
import { TimeUtils } from '../../utils/helpers.js';

export class SettingsTab {
    constructor(storageService, authService, cloudStorage) {
        this.storageService = storageService;
        this.authService = authService;
        this.cloudStorage = cloudStorage;
        this.container = null;
    }

    render(container) {
        this.container = container;

        this.container.innerHTML = `
            <div class="settings-layout">
                <!-- Account Settings -->
                <div class="settings-section">
                    <h3>Account Settings</h3>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="settingsEmail" class="form-control" disabled>
                    </div>
                    <button class="btn btn-primary" id="changePasswordBtn">
                        Change Password
                    </button>
                </div>

                <!-- Data Management -->
                <div class="settings-section">
                    <h3>Data Management</h3>
                    <div id="storageIndicator" class="storage-indicator"></div>
                    <div class="backup-status" id="backupStatus"></div>
                    
                    <!-- Backup Settings -->
                    <div class="backup-settings" style="background: var(--bg-input); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <h4 style="margin-top: 0;">Backup Settings</h4>
                        
                        <label class="checkbox-label">
                            <input type="checkbox" id="autoBackupEnabled" checked>
                            <span>Enable automatic backups</span>
                        </label>
                        
                        <div class="form-group" style="margin-top: 10px;">
                            <label>Backup frequency:</label>
                            <select id="backupFrequency" class="form-control">
                                <option value="onChange">After every change (recommended)</option>
                                <option value="daily">Once per day</option>
                                <option value="weekly">Once per week</option>
                            </select>
                        </div>
                        
                        <label class="checkbox-label">
                            <input type="checkbox" id="backupNotifications" checked>
                            <span>Show backup notifications</span>
                        </label>
                        
                        <div class="backup-info" style="margin-top: 10px; padding: 10px; background: var(--bg-card); border-radius: 6px; font-size: 0.875rem; color: var(--text-secondary);">
                            <strong>⚠️ Important:</strong> Browser storage can be lost if you clear cache or reset your browser. 
                            <strong style="color: var(--primary);">Always download backups regularly</strong> to protect your data permanently. 
                            Downloaded backup files can be stored on your computer or cloud storage and restored anytime.
                        </div>
                    </div>
                    
                    <!-- Cloud Sync Settings -->
                    <div class="settings-section">
                        <h3>☁️ Cloud Sync</h3>
                        <div class="cloud-status" id="cloudStatus">
                            <div class="sync-indicator">
                                <span class="sync-icon" id="syncIcon">🔄</span>
                                <span class="sync-text" id="syncText">Checking sync status...</span>
                            </div>
                        </div>
                        
                        <div class="sync-settings">
                            <label class="checkbox-label">
                                <input type="checkbox" id="enableCloudSync" checked>
                                <span>Enable automatic cloud sync</span>
                            </label>
                            
                            <div class="form-group" style="margin-top: 10px;">
                                <label>Conflict resolution:</label>
                                <select id="conflictResolution" class="form-control">
                                    <option value="newest">Keep newest version</option>
                                    <option value="local">Always keep local</option>
                                    <option value="cloud">Always keep cloud</option>
                                </select>
                            </div>
                            
                            <div class="sync-actions" style="margin-top: 15px;">
                                <button class="btn btn-primary" id="syncNowBtn">
                                    <i class="icon">🔄</i> Sync Now
                                </button>
                                <button class="btn btn-secondary" id="downloadFromCloudBtn">
                                    <i class="icon">⬇️</i> Download from Cloud
                                </button>
                                <button class="btn btn-secondary" id="uploadToCloudBtn">
                                    <i class="icon">⬆️</i> Upload to Cloud
                                </button>
                            </div>
                            
                            <div class="sync-info" style="margin-top: 15px;">
                                <p><strong>Last sync:</strong> <span id="lastSyncTime">Never</span></p>
                                <p><strong>Sync status:</strong> <span id="syncStatusText">Unknown</span></p>
                                <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 10px;">
                                    Your data automatically syncs every 5 minutes when you're signed in.
                                    All devices using the same account will stay in sync.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-actions">
                        <button class="btn btn-secondary" id="exportDataBtn">
                            <i class="icon">📥</i> Export All Data
                        </button>
                        <button class="btn btn-secondary" id="importDataBtn">
                            <i class="icon">📤</i> Import Data
                        </button>
                        <button class="btn btn-primary" id="downloadBackupBtn">
                            <i class="icon">💾</i> Download Backup Now
                        </button>
                        <button class="btn btn-secondary" id="restoreBackupBtn">
                            <i class="icon">🔄</i> Restore from File
                        </button>
                        <button class="btn btn-danger" id="clearDataBtn">
                            <i class="icon">🗑️</i> Clear All Data
                        </button>
                    </div>
                </div>

                <!-- Preferences -->
                <div class="settings-section">
                    <h3>Preferences</h3>
                    <label class="checkbox-label">
                        <input type="checkbox" id="notificationsEnabled">
                        <span>Enable practice reminders</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" id="darkModeEnabled">
                        <span>Dark mode</span>
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" id="soundEnabled" checked>
                        <span>Enable sound effects</span>
                    </label>
                </div>

                <!-- About -->
                <div class="settings-section">
                    <h3>About</h3>
                    <div class="about-info">
                        <p>Guitar Practice Journal v${window.APP_VERSION || '8.4'}</p>
                        <p class="text-muted">Created with ❤️ for musicians</p>
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
        this.loadSettings();
    }

    attachEventListeners() {
        // Account settings
        document.getElementById('changePasswordBtn')?.addEventListener('click', () => this.changePassword());

        // Data management
        document.getElementById('exportDataBtn')?.addEventListener('click', () => this.exportData());
        document.getElementById('importDataBtn')?.addEventListener('click', () => this.importData());
        document.getElementById('clearDataBtn')?.addEventListener('click', () => this.clearData());
        document.getElementById('downloadBackupBtn')?.addEventListener('click', () => this.downloadBackup());
        document.getElementById('restoreBackupBtn')?.addEventListener('click', () => this.restoreBackup());

        // Backup settings
        document.getElementById('autoBackupEnabled')?.addEventListener('change', (e) => {
            this.updateBackupSetting('autoBackup', e.target.checked);
        });

        document.getElementById('backupFrequency')?.addEventListener('change', (e) => {
            this.updateBackupSetting('backupFrequency', e.target.value);
        });

        document.getElementById('backupNotifications')?.addEventListener('change', (e) => {
            this.updateBackupSetting('showNotifications', e.target.checked);
        });

        // Cloud sync settings
        document.getElementById('enableCloudSync')?.addEventListener('change', (e) => {
            this.cloudStorage.setSyncEnabled(e.target.checked);
            this.updateCloudStatus();
        });

        document.getElementById('conflictResolution')?.addEventListener('change', (e) => {
            this.cloudStorage.setConflictResolution(e.target.value);
        });

        document.getElementById('syncNowBtn')?.addEventListener('click', () => this.performManualSync());
        document.getElementById('downloadFromCloudBtn')?.addEventListener('click', () => this.downloadFromCloud());
        document.getElementById('uploadToCloudBtn')?.addEventListener('click', () => this.uploadToCloud());

        // Preferences
        document.getElementById('notificationsEnabled')?.addEventListener('change', (e) => {
            this.updatePreference('notificationsEnabled', e.target.checked);
        });

        document.getElementById('darkModeEnabled')?.addEventListener('change', (e) => {
            this.handleDarkModeToggle(e.target.checked);
        });

        document.getElementById('soundEnabled')?.addEventListener('change', (e) => {
            this.updatePreference('soundEnabled', e.target.checked);
        });
    }

    async loadSettings() {
        try {
            // Load user info
            const user = this.authService.getCurrentUser();
            const emailInput = document.getElementById('settingsEmail');
            if (emailInput && user) {
                emailInput.value = user.email;
            }

            // Load preferences
            const settings = await this.storageService.getUserSettings();

            const notificationsCheckbox = document.getElementById('notificationsEnabled');
            if (notificationsCheckbox) {
                notificationsCheckbox.checked = settings?.notificationsEnabled || false;
            }

            const darkModeCheckbox = document.getElementById('darkModeEnabled');
            if (darkModeCheckbox && window.app?.themeService) {
                const currentTheme = window.app.themeService.getTheme();
                darkModeCheckbox.checked = currentTheme === 'dark';
            }

            const soundCheckbox = document.getElementById('soundEnabled');
            if (soundCheckbox) {
                soundCheckbox.checked = settings?.soundEnabled !== false;
            }

            // Update storage indicator
            await this.updateStorageIndicator();

            // Update backup status
            await this.updateBackupStatus();

            // Load backup settings
            await this.loadBackupSettings();

            // Update cloud status
            this.updateCloudStatus();

        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

async updateStorageIndicator() {
        const indicator = document.getElementById('storageIndicator');
        if (!indicator) return;

        try {
            const usage = await this.storageService.getStorageUsage();
            const percentage = Math.min((usage.used / usage.total) * 100, 100);
            const usedMB = (usage.used / 1024 / 1024).toFixed(2);
            const totalMB = (usage.total / 1024 / 1024).toFixed(2);

            indicator.innerHTML = `
                <div class="storage-info">
                    <span>Storage Used: ${usedMB} MB / ${totalMB} MB</span>
                    <span class="storage-percentage ${percentage > 80 ? 'text-warning' : ''}">${percentage.toFixed(1)}%</span>
                </div>
                <div class="storage-bar">
                    <div class="storage-bar-fill" style="width: ${percentage}%; background: ${percentage > 80 ? 'var(--warning)' : 'var(--primary)'}"></div>
                </div>
                ${percentage > 80 ? '<p class="text-warning text-sm mt-2">⚠️ Storage space is running low</p>' : ''}
            `;
        } catch (error) {
            indicator.innerHTML = '<p class="text-muted">Storage information unavailable</p>';
        }
    }

    async updateBackupStatus() {
        const statusEl = document.getElementById('backupStatus');
        if (!statusEl) return;

        try {
            const backupKey = `${this.storageService.prefix}latest_backup`;
            const backupData = localStorage.getItem(backupKey);
            const backupFilename = localStorage.getItem(`${backupKey}_filename`);

            if (backupData) {
                const backup = JSON.parse(backupData);
                const backupDate = new Date(backup.backupDate);
                const timeAgo = TimeUtils.getRelativeTime(backupDate);

                statusEl.innerHTML = `
                    <div style="padding: 10px; background: var(--bg-input); border-radius: 8px; margin-bottom: 10px;">
                        <strong>Last Backup:</strong> ${timeAgo}<br>
                        <small style="color: var(--text-secondary);">${backupFilename || 'Auto-backup'}</small>
                    </div>
                `;
            } else {
                statusEl.innerHTML = `
                    <div style="padding: 10px; background: var(--bg-input); border-radius: 8px; margin-bottom: 10px; color: var(--text-secondary);">
                        No backup found. Backups are created automatically when you save data.
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error updating backup status:', error);
        }
    }

    async loadBackupSettings() {
        const settings = this.storageService.getBackupSettings();

        const autoBackupCheckbox = document.getElementById('autoBackupEnabled');
        if (autoBackupCheckbox) {
            autoBackupCheckbox.checked = settings.autoBackup !== false;
        }

        const frequencySelect = document.getElementById('backupFrequency');
        if (frequencySelect) {
            frequencySelect.value = settings.backupFrequency || 'onChange';
        }

        const notificationsCheckbox = document.getElementById('backupNotifications');
        if (notificationsCheckbox) {
            notificationsCheckbox.checked = settings.showNotifications !== false;
        }
    }

    async updateCloudStatus() {
        const statusEl = document.getElementById('cloudStatus');
        const syncIcon = document.getElementById('syncIcon');
        const syncText = document.getElementById('syncText');

        if (!this.cloudStorage.currentUser) {
            syncIcon.textContent = '❌';
            syncText.textContent = 'Not signed in to cloud';
            statusEl.className = 'cloud-status offline';
            return;
        }

        syncIcon.textContent = '✅';
        syncText.textContent = `Signed in as ${this.cloudStorage.currentUser.email}`;
        statusEl.className = 'cloud-status online';

        // Update last sync time
        if (this.cloudStorage.lastSync) {
            document.getElementById('lastSyncTime').textContent =
                TimeUtils.getRelativeTime(this.cloudStorage.lastSync);
        }
    }

    updateBackupSetting(key, value) {
        const settings = {};
        settings[key] = value;
        this.storageService.saveBackupSettings(settings);
        this.showNotification(`Backup ${key === 'autoBackup' ? (value ? 'enabled' : 'disabled') : 'settings updated'}`, 'success');
    }

    updatePreference(key, value) {
        this.storageService.saveUserSettings({ [key]: value });
        console.log(`Preference updated: ${key} = ${value}`);
    }

    handleDarkModeToggle(shouldBeDark) {
        if (!window.app?.themeService) return;

        const currentTheme = window.app.themeService.getTheme();

        // Only toggle if the desired state is different from current
        if ((shouldBeDark && currentTheme === 'light') || (!shouldBeDark && currentTheme === 'dark')) {
            window.app.themeService.toggleTheme();

            // Update the icon in the header
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                const newTheme = window.app.themeService.getTheme();
                themeToggle.innerHTML = `<i class="icon">${newTheme === 'dark' ? '🌙' : '☀️'}</i>`;
            }
        }
    }

    async exportData() {
        try {
            const data = await this.storageService.exportAllData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `guitar-practice-export-${new Date().toISOString().split('T')[0]}.json`;
            a.click();

            URL.revokeObjectURL(url);
            this.showNotification('Data exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showNotification('Error exporting data', 'error');
        }
    }

    async importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const data = JSON.parse(text);

                if (confirm('This will merge the imported data with your existing data. Continue?')) {
                    await this.storageService.importData(data);
                    this.showNotification('Data imported successfully', 'success');
                    window.location.reload(); // Reload to show new data
                }
            } catch (error) {
                console.error('Error importing data:', error);
                this.showNotification('Error importing data. Please check the file format.', 'error');
            }
        });

        input.click();
    }

    async clearData() {
        if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            return;
        }

        if (!confirm('This will permanently delete all your practice sessions, goals, and settings. Are you absolutely sure?')) {
            return;
        }

        try {
            await this.storageService.clearAllData();
            this.showNotification('All data cleared', 'success');
            window.location.reload();
        } catch (error) {
            console.error('Error clearing data:', error);
            this.showNotification('Error clearing data', 'error');
        }
    }

    async downloadBackup() {
        try {
            const result = await this.storageService.createBackup(true);
            if (result.success) {
                const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = result.filename;
                a.click();
                URL.revokeObjectURL(url);

                this.showNotification('Backup downloaded successfully', 'success');
                this.updateBackupStatus();
            } else {
                this.showNotification('Failed to create backup', 'error');
            }
        } catch (error) {
            console.error('Error downloading backup:', error);
            this.showNotification('Error creating backup file', 'error');
        }
    }

    async restoreBackup() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const backupData = JSON.parse(text);

                if (!backupData.version || !backupData.data) {
                    throw new Error('Invalid backup file format');
                }

                const currentUser = this.authService.getCurrentUser();
                if (backupData.email !== currentUser.email) {
                    if (!confirm(`This backup is for ${backupData.email}. Are you sure you want to restore it to ${currentUser.email}?`)) {
                        return;
                    }
                }

                if (confirm('This will replace all current data with the backup. Continue?')) {
                    const result = await this.storageService.restoreFromBackup(backupData);
                    if (result.success) {
                        this.showNotification('Data restored successfully from backup', 'success');
                        setTimeout(() => location.reload(), 1500);
                    } else {
                        this.showNotification('Failed to restore backup', 'error');
                    }
                }
            } catch (error) {
                console.error('Error restoring backup:', error);
                this.showNotification('Error reading backup file. Please check the file format.', 'error');
            }
        });

        input.click();
    }

    async performManualSync() {
        const btn = document.getElementById('syncNowBtn');
        const originalText = btn.innerHTML;

        btn.innerHTML = '<i class="icon">⏳</i> Syncing...';
        btn.disabled = true;

        try {
            await this.cloudStorage.performAutoSync();
            this.showNotification('Data synced successfully', 'success');
        } catch (error) {
            this.showNotification('Sync failed: ' + error.message, 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
            this.updateCloudStatus();
        }
    }

    async downloadFromCloud() {
        if (!confirm('This will replace your local data with cloud data. Continue?')) {
            return;
        }

        try {
            const cloudData = await this.cloudStorage.downloadCloudData();
            if (cloudData) {
                await this.storageService.importData(cloudData);
                this.showNotification('Cloud data downloaded successfully', 'success');
                location.reload();
            } else {
                this.showNotification('No cloud data found', 'warning');
            }
        } catch (error) {
            this.showNotification('Download failed: ' + error.message, 'error');
        }
    }

    async uploadToCloud() {
        if (!confirm('This will replace cloud data with your local data. Continue?')) {
            return;
        }

        try {
            const localData = await this.storageService.exportAllData();
            await this.cloudStorage.syncAllData(localData);
            this.showNotification('Data uploaded to cloud successfully', 'success');
        } catch (error) {
            this.showNotification('Upload failed: ' + error.message, 'error');
        }
    }

    changePassword() {
        this.showNotification('Password change feature coming soon!', 'info');
    }

    showNotification(message, type = 'info') {
        if (window.app?.currentPage?.showNotification) {
            window.app.currentPage.showNotification(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }

    onActivate() {
        // Refresh data when tab becomes active
        this.loadSettings();
    }

    onDeactivate() {
        // Clean up when leaving tab
    }

    destroy() {
        this.container = null;
    }

}
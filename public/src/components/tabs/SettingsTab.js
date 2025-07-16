// Settings Tab Component
import { CloudSyncSettings } from '../cloudSyncSettings.js';

export class SettingsTab {
    constructor(storageService, authService, cloudSyncService) {
        this.storageService = storageService;
        this.authService = authService;
        this.cloudSyncService = cloudSyncService;
        this.container = null;
    }

    async render(container) {
        this.container = container;
        this.container.innerHTML = `
            <div class="settings-page">
                <div class="settings-header">
                    <h2>Settings</h2>
                </div>
                
                <div class="settings-sections">
                    <!-- Cloud Sync Section -->
                    <div class="settings-section" id="cloudSyncSection">
                        <!-- Cloud sync settings will be rendered here -->
                    </div>
                    
                    <!-- Keyboard Shortcuts Section -->
                    <div class="settings-section">
                        <h3>⌨️ Keyboard Shortcuts</h3>
                        <div class="settings-content">
                            <p>Use keyboard shortcuts to navigate and control the app more efficiently.</p>
                            <button class="btn btn-secondary" onclick="if(window.keyboardShortcuts) window.keyboardShortcuts.showHelp()">
                                View All Shortcuts
                            </button>
                        </div>
                    </div>
                    
                    <!-- Practice Settings -->
                    <div class="settings-section">
                        <h3>🎸 Practice Settings</h3>
                        <div class="settings-content">
                            <div class="setting-item">
                                <label>
                                    <input type="checkbox" id="autoStartTimer" ${this.getAutoStartTimer() ? 'checked' : ''}>
                                    Auto-start timer with metronome
                                </label>
                            </div>
                            <div class="setting-item">
                                <label>
                                    <input type="checkbox" id="saveDrafts" ${this.getSaveDrafts() ? 'checked' : ''}>
                                    Auto-save practice drafts
                                </label>
                            </div>
                            <div class="setting-item">
                                <label>Default practice duration (minutes):</label>
                                <input type="number" id="defaultDuration" value="${this.getDefaultDuration()}" min="5" max="120">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Audio Settings -->
                    <div class="settings-section">
                        <h3>🔊 Audio Settings</h3>
                        <div class="settings-content">
                            <div class="setting-item">
                                <label>Default metronome sound:</label>
                                <select id="defaultMetronomeSound">
                                    <option value="click">Click</option>
                                    <option value="beep">Beep</option>
                                    <option value="tick">Tick</option>
                                    <option value="wood">Wood Block</option>
                                    <option value="cowbell">Cowbell</option>
                                    <option value="clave">Clave</option>
                                    <option value="rim">Rim Shot</option>
                                    <option value="hihat">Hi-Hat</option>
                                </select>
                            </div>
                            <div class="setting-item">
                                <label>Audio buffer size:</label>
                                <select id="audioBufferSize">
                                    <option value="256">Low Latency (256)</option>
                                    <option value="512">Balanced (512)</option>
                                    <option value="1024">Stable (1024)</option>
                                    <option value="2048">High Stability (2048)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Theme Settings -->
                    <div class="settings-section">
                        <h3>🎨 Theme Settings</h3>
                        <div class="settings-content">
                            <div class="setting-item">
                                <label>
                                    <input type="checkbox" id="autoThemeSwitch" ${this.getAutoThemeSwitch() ? 'checked' : ''}>
                                    Auto-switch theme based on time of day
                                </label>
                            </div>
                            <div class="setting-item">
                                <label>Day theme starts at:</label>
                                <input type="time" id="dayThemeTime" value="${this.getDayThemeTime()}">
                            </div>
                            <div class="setting-item">
                                <label>Night theme starts at:</label>
                                <input type="time" id="nightThemeTime" value="${this.getNightThemeTime()}">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Data Management -->
                    <div class="settings-section">
                        <h3>💾 Data Management</h3>
                        <div class="settings-content">
                            <div class="data-actions">
                                <button class="btn btn-secondary" onclick="if(window.settingsTab) window.settingsTab.exportData()">
                                    📥 Export All Data
                                </button>
                                <button class="btn btn-secondary" onclick="if(window.settingsTab) window.settingsTab.importData()">
                                    📤 Import Data
                                </button>
                                <button class="btn btn-danger" onclick="if(window.settingsTab) window.settingsTab.clearData()">
                                    🗑️ Clear All Data
                                </button>
                            </div>
                            <div class="data-stats">
                                <p>Storage used: <span id="storageUsed">Calculating...</span></p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- About -->
                    <div class="settings-section">
                        <h3>ℹ️ About</h3>
                        <div class="settings-content">
                            <p>Guitar Practice Journal v<span id="appVersion">9.7.0</span></p>
                            <p>A Progressive Web App for tracking your guitar practice</p>
                            <div class="about-links">
                                <a href="#" onclick="if(window.settingsTab) window.settingsTab.showChangelog()">View Changelog</a>
                                <a href="https://github.com/yourusername/guitar-practice-journal" target="_blank">GitHub</a>
                                <a href="#" onclick="if(window.settingsTab) window.settingsTab.showPrivacyPolicy()">Privacy Policy</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Initialize cloud sync settings
        const cloudSyncSection = document.getElementById('cloudSyncSection');
        if (cloudSyncSection && this.cloudSyncService) {
            new CloudSyncSettings(cloudSyncSection, this.cloudSyncService, this.authService);
        }
        
        // Make this tab globally accessible
        window.settingsTab = this;
        
        // Attach event listeners
        this.attachEventListeners();
        
        // Calculate storage usage
        this.calculateStorageUsage();
    }
    
    attachEventListeners() {
        // Practice settings
        document.getElementById('autoStartTimer')?.addEventListener('change', (e) => {
            localStorage.setItem('autoStartTimer', e.target.checked);
        });
        
        document.getElementById('saveDrafts')?.addEventListener('change', (e) => {
            localStorage.setItem('saveDrafts', e.target.checked);
        });
        
        document.getElementById('defaultDuration')?.addEventListener('change', (e) => {
            localStorage.setItem('defaultDuration', e.target.value);
        });
        
        // Audio settings
        document.getElementById('defaultMetronomeSound')?.addEventListener('change', (e) => {
            localStorage.setItem('defaultMetronomeSound', e.target.value);
        });
        
        document.getElementById('audioBufferSize')?.addEventListener('change', (e) => {
            localStorage.setItem('audioBufferSize', e.target.value);
            this.showNotification('Audio buffer size updated. Reload the app for changes to take effect.', 'info');
        });
        
        // Theme settings
        document.getElementById('autoThemeSwitch')?.addEventListener('change', (e) => {
            localStorage.setItem('autoThemeSwitch', e.target.checked);
        });
        
        document.getElementById('dayThemeTime')?.addEventListener('change', (e) => {
            localStorage.setItem('dayThemeTime', e.target.value);
        });
        
        document.getElementById('nightThemeTime')?.addEventListener('change', (e) => {
            localStorage.setItem('nightThemeTime', e.target.value);
        });
    }
    
    // Settings getters
    getAutoStartTimer() {
        return localStorage.getItem('autoStartTimer') === 'true';
    }
    
    getSaveDrafts() {
        return localStorage.getItem('saveDrafts') !== 'false'; // Default true
    }
    
    getDefaultDuration() {
        return localStorage.getItem('defaultDuration') || '30';
    }
    
    getAutoThemeSwitch() {
        return localStorage.getItem('autoThemeSwitch') === 'true';
    }
    
    getDayThemeTime() {
        return localStorage.getItem('dayThemeTime') || '06:00';
    }
    
    getNightThemeTime() {
        return localStorage.getItem('nightThemeTime') || '18:00';
    }
    
    // Data management methods
    async exportData() {
        try {
            const data = await this.storageService.exportAllData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `guitar-practice-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.showNotification('Data exported successfully', 'success');
        } catch (error) {
            this.showNotification('Failed to export data: ' + error.message, 'error');
        }
    }
    
    async importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                if (confirm('This will merge the imported data with your existing data. Continue?')) {
                    await this.storageService.importData(data);
                    this.showNotification('Data imported successfully', 'success');
                    
                    // Reload the app to reflect changes
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                }
            } catch (error) {
                this.showNotification('Failed to import data: ' + error.message, 'error');
            }
        };
        
        input.click();
    }
    
    async clearData() {
        if (confirm('Are you sure you want to delete all your practice data? This cannot be undone!')) {
            if (confirm('This will permanently delete ALL your data including practice sessions, repertoire, and goals. Are you absolutely sure?')) {
                try {
                    await this.storageService.clearAllData();
                    localStorage.clear();
                    this.showNotification('All data cleared successfully', 'success');
                    
                    // Reload the app
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } catch (error) {
                    this.showNotification('Failed to clear data: ' + error.message, 'error');
                }
            }
        }
    }
    
    async calculateStorageUsage() {
        try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                const estimate = await navigator.storage.estimate();
                const used = estimate.usage || 0;
                const quota = estimate.quota || 0;
                
                const usedMB = (used / 1024 / 1024).toFixed(2);
                const quotaMB = (quota / 1024 / 1024).toFixed(0);
                const percentage = ((used / quota) * 100).toFixed(1);
                
                document.getElementById('storageUsed').textContent = 
                    `${usedMB} MB of ${quotaMB} MB (${percentage}%)`;
            }
        } catch (error) {
            document.getElementById('storageUsed').textContent = 'Unable to calculate';
        }
    }
    
    showChangelog() {
        // This would show a modal with version history
        alert('Changelog feature coming soon!');
    }
    
    showPrivacyPolicy() {
        // This would show a modal with privacy policy
        alert('Privacy Policy: Your data is stored locally on your device and only synced to the cloud if you enable cloud sync.');
    }
    
    showNotification(message, type = 'info') {
        if (window.app?.currentPage?.showNotification) {
            window.app.currentPage.showNotification(message, type);
        }
    }
    
    onActivate() {
        // Refresh data when tab is activated
        this.calculateStorageUsage();
    }
    
    destroy() {
        // Clean up
        window.settingsTab = null;
    }
}
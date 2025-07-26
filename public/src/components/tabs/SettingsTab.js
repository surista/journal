// Settings Tab Component
import { CloudSyncManager } from '../CloudSyncManager.js';

export class SettingsTab {
    constructor(storageService, authService, cloudSyncService) {
        this.storageService = storageService;
        this.authService = authService;
        this.cloudSyncService = cloudSyncService;
        this.container = null;
    }

    async render(container) {
        this.container = container;

        // Load version from build-info.json
        let appVersion = '9.8'; // Default fallback
        try {
            const response = await fetch('./build-info.json');
            if (response.ok) {
                const buildInfo = await response.json();
                appVersion = buildInfo.version;
            }
        } catch (error) {
            // Could not load build info, using default version
        }

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
                                    Auto-start timer with audio
                                </label>
                            </div>
                            <div class="setting-item">
                                <label>
                                    <input type="checkbox" id="ssaveDrafts" ${this.getSaveDrafts() ? 'checked' : ''}>
                                    Auto-save practice drafts
                                </label>
                            </div>
                            <div class="setting-item">
                                <label>Default practice duration (minutes):</label>
                                <input type="number" id="defaultDuration" value="${this.getDefaultDuration()}" min="5" max="120">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Session Areas Management -->
                    <div class="settings-section">
                        <h3>📚 Session Areas</h3>
                        <div class="settings-content">
                            <p class="settings-description">Manage practice areas that appear in practice sessions and goals.</p>
                            <div id="sessionAreasContainer" class="session-areas-container" style="margin-bottom: 12px;">
                                <!-- Session areas will be rendered here -->
                            </div>
                            <div class="add-session-area-form" style="margin-top: 16px;">
                                <div style="display: flex; gap: 8px; align-items: center;">
                                    <input type="text" id="newSessionArea" placeholder="Add new area..." class="form-control" style="flex: 1;">
                                    <button class="btn btn-primary" id="addSessionAreaBtn">Add</button>
                                </div>
                                <div style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center;">
                                    <p style="margin: 0; font-size: 12px; color: var(--text-secondary);">
                                        Click × to delete any session area.
                                    </p>
                                    <button class="btn btn-sm btn-secondary" id="resetSessionAreasBtn" style="font-size: 12px; padding: 4px 12px;">
                                        Reset to Defaults
                                    </button>
                                </div>
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
                                    <option value="kick">Kick Drum</option>
                                    <option value="snare">Snare</option>
                                    <option value="triangle">Triangle</option>
                                    <option value="shaker">Shaker</option>
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
                            <p>Guitar Practice Journal v<span id="appVersion">${appVersion}</span></p>
                            <p>A Progressive Web App for tracking your guitar practice</p>
                            <div class="about-links">
                                <a href="#" onclick="if(window.settingsTab) window.settingsTab.showChangelog()">View Changelog</a>
                                <a href="https://github.com/yourusername/guitar-practice-journal" target="_blank">GitHub</a>
                                <a href="#" onclick="if(window.settingsTab) window.settingsTab.showPrivacyPolicy()">Privacy Policy</a>
                            </div>
                            <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border);">
                                <p style="margin-bottom: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">Enjoying Guitar Practice Journal?</p>
                                <a href="https://coff.ee/guitar.practice.journal" 
                                   target="_blank" 
                                   rel="noopener noreferrer"
                                   style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: var(--bg-input); border: 1px solid var(--border); border-radius: 6px; text-decoration: none; color: var(--text-primary); transition: all 0.2s ease;"
                                   onmouseover="this.style.background='var(--primary)'; this.style.color='white'; this.style.borderColor='var(--primary)';"
                                   onmouseout="this.style.background='var(--bg-input)'; this.style.color='var(--text-primary)'; this.style.borderColor='var(--border)';">
                                    ☕ Buy Me a Coffee
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Initialize cloud sync manager
        const cloudSyncSection = document.getElementById('cloudSyncSection');
        if (cloudSyncSection) {
            const cloudSyncManager = new CloudSyncManager(this.storageService);
            await cloudSyncManager.init();
            cloudSyncManager.render(cloudSyncSection);
        }

        // Make this tab globally accessible
        window.settingsTab = this;

        // Attach event listeners
        this.attachEventListeners();

        // Load session areas
        this.loadSessionAreas().catch(console.error);

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
            this.showNotification(
                'Audio buffer size updated. Reload the app for changes to take effect.',
                'info'
            );
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

        // Session areas
        document.getElementById('addSessionAreaBtn')?.addEventListener('click', () => {
            this.addSessionArea();
        });

        document.getElementById('newSessionArea')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addSessionArea();
            }
        });

        // Delete session area buttons (using event delegation)
        document.getElementById('sessionAreasContainer')?.addEventListener('click', (e) => {
            // Check both the button and its parent in case of event target issues
            const deleteBtn = e.target.classList.contains('delete-area-btn')
                ? e.target
                : e.target.closest('.delete-area-btn');
            if (deleteBtn) {
                e.stopPropagation();
                const area = deleteBtn.dataset.area;
                if (area) {
                    this.deleteSessionArea(area);
                }
            }
        });

        // Reset to defaults button
        document.getElementById('resetSessionAreasBtn')?.addEventListener('click', () => {
            this.resetSessionAreasToDefaults();
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

                if (
                    confirm('This will merge the imported data with your existing data. Continue?')
                ) {
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
        if (
            confirm(
                'Are you sure you want to delete all your practice data? This cannot be undone!'
            )
        ) {
            if (
                confirm(
                    'This will permanently delete ALL your data including practice sessions, repertoire, and goals. Are you absolutely sure?'
                )
            ) {
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
        alert(
            'Privacy Policy: Your data is stored locally on your device and only synced to the cloud if you enable cloud sync.'
        );
    }

    showNotification(message, type = 'info') {
        if (window.app?.currentPage?.showNotification) {
            window.app.currentPage.showNotification(message, type);
        }
    }

    // Session Areas Management
    getDefaultSessionAreas() {
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
            'Audio Practice'
        ];
    }

    async getSessionAreas() {
        return await this.storageService.getSessionAreas();
    }

    async saveSessionAreas(areas) {
        await this.storageService.saveSessionAreas(areas);
    }

    async loadSessionAreas() {
        const areas = await this.getSessionAreas();
        const container = document.getElementById('sessionAreasContainer');
        if (!container) return;

        // Create a compact chip/tag layout
        container.innerHTML = `
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${areas
                    .map((area, index) => {
                        return `
                        <span class="session-area-chip" style="
                            display: inline-flex;
                            align-items: center;
                            gap: 6px;
                            padding: 6px 12px;
                            background: var(--bg-input);
                            border: 1px solid var(--border);
                            border-radius: 20px;
                            font-size: 14px;
                            color: var(--text-primary);
                        ">
                            ${this.escapeHtml(area)}
                            <button class="delete-area-btn" data-area="${this.escapeHtml(area)}" style="
                                background: none;
                                border: none;
                                padding: 0 0 0 4px;
                                cursor: pointer;
                                color: var(--text-secondary);
                                font-size: 18px;
                                line-height: 1;
                                display: flex;
                                align-items: center;
                                transition: color 0.2s;
                                margin: -2px 0;
                            " onmouseover="this.style.color='var(--danger)'" onmouseout="this.style.color='var(--text-secondary)'" title="Delete ${this.escapeHtml(area)}">
                                ×
                            </button>
                        </span>
                    `;
                    })
                    .join('')}
            </div>
        `;
    }

    async addSessionArea() {
        const input = document.getElementById('newSessionArea');
        if (!input) return;

        const newArea = input.value.trim();
        if (!newArea) {
            this.showNotification('Please enter a session area name', 'error');
            return;
        }

        const areas = await this.getSessionAreas();

        // Check if already exists
        if (areas.some((area) => area.toLowerCase() === newArea.toLowerCase())) {
            this.showNotification('This session area already exists', 'error');
            return;
        }

        // Add new area
        areas.push(newArea);
        await this.saveSessionAreas(areas);

        // Clear input and reload
        input.value = '';
        await this.loadSessionAreas();
        this.showNotification('Session area added successfully', 'success');
    }

    async deleteSessionArea(areaToDelete) {
        if (!confirm(`Are you sure you want to delete "${areaToDelete}"?`)) {
            return;
        }

        const areas = await this.getSessionAreas();
        const filtered = areas.filter((area) => area !== areaToDelete);
        await this.saveSessionAreas(filtered);

        await this.loadSessionAreas();
        this.showNotification('Session area deleted successfully', 'success');
    }

    async resetSessionAreasToDefaults() {
        if (confirm('This will reset all session areas to the default list. Are you sure?')) {
            const defaultAreas = this.getDefaultSessionAreas();
            await this.saveSessionAreas(defaultAreas);
            await this.loadSessionAreas();
            this.showNotification('Session areas reset to defaults', 'success');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    onActivate() {
        // Refresh data when tab is activated
        this.loadSessionAreas().catch(console.error);
        this.calculateStorageUsage();
    }

    destroy() {
        // Clean up
        window.settingsTab = null;
    }
}

// Cloud Sync Settings Component
export class CloudSyncSettings {
    constructor(container, cloudSyncService, authService) {
        this.container = container;
        this.cloudSyncService = cloudSyncService;
        this.authService = authService;
        this.render();
        this.attachEventListeners();
    }

    render() {
        const syncStatus = this.cloudSyncService.getSyncStatus();
        const isAuthenticated = syncStatus.isAuthenticated;

        this.container.innerHTML = `
            <div class="cloud-sync-settings">
                <div class="sync-header">
                    <h3>☁️ Cloud Sync</h3>
                    <div class="sync-status ${syncStatus.enabled ? 'active' : 'inactive'}">
                        ${syncStatus.enabled ? '🟢 Active' : '🔴 Inactive'}
                    </div>
                </div>
                
                ${
                    !isAuthenticated
                        ? `
                    <div class="auth-required">
                        <p>Sign in to enable cloud sync across all your devices</p>
                        <button class="btn btn-primary" id="signInForSync">
                            Sign In to Enable Sync
                        </button>
                    </div>
                `
                        : `
                    <div class="sync-controls">
                        <div class="sync-toggle">
                            <label class="toggle-switch">
                                <input type="checkbox" id="syncEnabled" ${syncStatus.enabled ? 'checked' : ''}>
                                <span class="toggle-slider"></span>
                            </label>
                            <label for="syncEnabled">Enable Cloud Sync</label>
                        </div>
                        
                        ${
                            syncStatus.enabled
                                ? `
                            <div class="sync-info">
                                <div class="info-item">
                                    <span class="info-label">Last Sync:</span>
                                    <span class="info-value">${this.formatLastSync(syncStatus.lastSync)}</span>
                                </div>
                                
                                <div class="info-item">
                                    <span class="info-label">Sync Status:</span>
                                    <span class="info-value ${syncStatus.inProgress ? 'syncing' : ''}">
                                        ${syncStatus.inProgress ? '🔄 Syncing...' : '✅ Up to date'}
                                    </span>
                                </div>
                                
                                <button class="btn btn-secondary" id="syncNowBtn" ${syncStatus.inProgress ? 'disabled' : ''}>
                                    ${syncStatus.inProgress ? 'Syncing...' : 'Sync Now'}
                                </button>
                            </div>
                            
                            <div class="sync-advanced">
                                <h4>Advanced Settings</h4>
                                
                                <div class="setting-group">
                                    <label>Conflict Resolution:</label>
                                    <select id="conflictResolution" class="form-control">
                                        <option value="latest" ${syncStatus.conflictResolution === 'latest' ? 'selected' : ''}>
                                            Keep Latest Changes
                                        </option>
                                        <option value="merge" ${syncStatus.conflictResolution === 'merge' ? 'selected' : ''}>
                                            Merge Changes
                                        </option>
                                    </select>
                                    <small class="help-text">
                                        How to handle conflicts when the same data is modified on multiple devices
                                    </small>
                                </div>
                                
                                <div class="sync-devices">
                                    <h5>Connected Devices</h5>
                                    <div id="deviceList" class="device-list">
                                        <div class="loading">Loading devices...</div>
                                    </div>
                                </div>
                            </div>
                        `
                                : ''
                        }
                    </div>
                `
                }
                
                <div class="sync-benefits">
                    <h4>Benefits of Cloud Sync</h4>
                    <ul>
                        <li>✅ Access your practice data from any device</li>
                        <li>✅ Automatic backup of all your data</li>
                        <li>✅ Seamless sync between phone, tablet, and computer</li>
                        <li>✅ Never lose your practice history</li>
                        <li>✅ Share repertoire between devices</li>
                    </ul>
                </div>
                
                <div class="sync-privacy">
                    <h4>Privacy & Security</h4>
                    <p>Your data is encrypted and stored securely in the cloud. Only you have access to your practice data.</p>
                </div>
            </div>
        `;

        // Load device list if sync is enabled
        if (syncStatus.enabled && isAuthenticated) {
            this.loadConnectedDevices();
        }
    }

    attachEventListeners() {
        // Sign in button
        document.getElementById('signInForSync')?.addEventListener('click', async () => {
            try {
                await this.authService.signIn();
                this.render();
            } catch (error) {
                this.showError('Failed to sign in');
            }
        });

        // Sync toggle
        document.getElementById('syncEnabled')?.addEventListener('change', async (e) => {
            try {
                if (e.target.checked) {
                    await this.cloudSyncService.enableSync();
                    this.showSuccess('Cloud sync enabled');
                } else {
                    this.cloudSyncService.disableSync();
                    this.showInfo('Cloud sync disabled');
                }
                this.render();
            } catch (error) {
                this.showError('Failed to change sync settings');
                e.target.checked = !e.target.checked;
            }
        });

        // Sync now button
        document.getElementById('syncNowBtn')?.addEventListener('click', async () => {
            try {
                const btn = document.getElementById('syncNowBtn');
                btn.disabled = true;
                btn.textContent = 'Syncing...';

                await this.cloudSyncService.syncNow();
                this.showSuccess('Sync completed successfully');
                this.render();
            } catch (error) {
                this.showError('Sync failed: ' + error.message);
                this.render();
            }
        });

        // Conflict resolution
        document.getElementById('conflictResolution')?.addEventListener('change', (e) => {
            this.cloudSyncService.conflictResolutionStrategy = e.target.value;
            this.cloudSyncService.saveSyncSettings();
            this.showInfo('Conflict resolution strategy updated');
        });
    }

    async loadConnectedDevices() {
        try {
            // This would fetch device info from Firebase
            const devices = await this.getConnectedDevices();
            const deviceList = document.getElementById('deviceList');

            if (deviceList) {
                if (devices.length === 0) {
                    deviceList.innerHTML = '<p class="no-devices">No other devices connected</p>';
                } else {
                    deviceList.innerHTML = devices
                        .map(
                            (device) => `
                        <div class="device-item">
                            <div class="device-icon">${this.getDeviceIcon(device.platform)}</div>
                            <div class="device-info">
                                <div class="device-name">${this.getDeviceName(device)}</div>
                                <div class="device-last-sync">Last sync: ${this.formatLastSync(device.lastSync)}</div>
                            </div>
                        </div>
                    `
                        )
                        .join('');
                }
            }
        } catch (error) {
            console.error('Failed to load devices:', error);
        }
    }

    async getConnectedDevices() {
        // Mock implementation - would actually fetch from Firebase
        return [
            {
                platform: 'Windows',
                userAgent: navigator.userAgent,
                lastSync: new Date().toISOString()
            }
        ];
    }

    getDeviceIcon(platform) {
        const icons = {
            Windows: '💻',
            Mac: '🖥️',
            iPhone: '📱',
            iPad: '📱',
            Android: '📱',
            Linux: '🐧'
        };

        for (const [key, icon] of Object.entries(icons)) {
            if (platform.includes(key)) {
                return icon;
            }
        }

        return '📱';
    }

    getDeviceName(device) {
        if (device.userAgent.includes('iPhone')) return 'iPhone';
        if (device.userAgent.includes('iPad')) return 'iPad';
        if (device.userAgent.includes('Android')) return 'Android Device';
        if (device.userAgent.includes('Windows')) return 'Windows PC';
        if (device.userAgent.includes('Mac')) return 'Mac';
        if (device.userAgent.includes('Linux')) return 'Linux PC';
        return 'Unknown Device';
    }

    formatLastSync(timestamp) {
        if (!timestamp) return 'Never';

        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;

        return date.toLocaleDateString();
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        if (window.app?.currentPage?.showNotification) {
            window.app.currentPage.showNotification(message, type);
        }
    }
}

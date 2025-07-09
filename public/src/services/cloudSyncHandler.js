// CloudSyncHandler - Manages all cloud synchronization operations
import { TimeUtils } from '../utils/helpers.js';

export class CloudSyncHandler {
   constructor(storageService, cloudStorage) {
       this.storageService = storageService;
       this.cloudStorage = cloudStorage;
   }

   async updateCloudStatus() {
       const statusEl = document.getElementById('cloudStatus');
       const syncIcon = document.getElementById('syncIcon');
       const syncText = document.getElementById('syncText');

       if (!this.cloudStorage.currentUser) {

           if (syncIcon) syncIcon.textContent = '❌';
           if (syncText) syncText.textContent = 'Not signed in to cloud';
           if (statusEl) statusEl.className = 'cloud-status offline';
           return;
       }

       if (syncIcon) syncIcon.textContent = '✅';
       if (syncText) syncText.textContent = `Signed in as ${this.cloudStorage.currentUser.email}`;
       if (statusEl) statusEl.className = 'cloud-status online';

       // Update last sync time
       if (this.cloudStorage.lastSync) {
           const lastSyncEl = document.getElementById('lastSyncTime');
           if (lastSyncEl) {
               lastSyncEl.textContent = TimeUtils.getRelativeTime(this.cloudStorage.lastSync);
           }
       }
   }

   async performManualSync() {
       const btn = document.getElementById('syncNowBtn');
       let originalText = '';

       if (btn) {
           originalText = btn.innerHTML;
           btn.innerHTML = '<i class="icon">⏳</i> Syncing...';
           btn.disabled = true;
       }

       try {
           await this.cloudStorage.performAutoSync();
           this.showNotification('Data synced successfully', 'success');
       } catch (error) {
           this.showNotification('Sync failed: ' + error.message, 'error');
       } finally {
           if (btn) {
               btn.innerHTML = originalText;
               btn.disabled = false;
           }
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
               location.reload(); // Reload to show new data
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

   updateSyncStatus(detail) {
       const statusEl = document.getElementById('syncStatus');
       const iconEl = document.getElementById('syncIcon');

       if (detail.status === 'success') {
           if (statusEl) {
               statusEl.textContent = 'Synced';
               statusEl.className = 'sync-success';
           }
           if (iconEl) iconEl.textContent = '✅';
       } else if (detail.status === 'error') {
           if (statusEl) {
               statusEl.textContent = 'Sync error';
               statusEl.className = 'sync-error';
           }
           if (iconEl) iconEl.textContent = '❌';
       } else if (detail.status === 'syncing') {
           if (statusEl) {
               statusEl.textContent = 'Syncing...';
               statusEl.className = 'sync-progress';
           }
           if (iconEl) iconEl.textContent = '🔄';
       }

       if (detail.lastSync) {
           const lastSyncEl = document.getElementById('lastSyncTime');
           if (lastSyncEl) {
               lastSyncEl.textContent = TimeUtils.getRelativeTime(detail.lastSync);
           }
       }
   }

   async handleCloudDataChange(detail) {
       console.log('Cloud data changed:', detail.type);

       // Merge changes with local data
       if (detail.type === 'settings' && detail.data) {
           await this.storageService.mergeCloudData({ settings: detail.data.settings });

           // Notify dashboard to refresh UI
           window.dispatchEvent(new CustomEvent('cloudDataMerged', {
               detail: { type: 'settings' }
           }));
       }
   }

   async handleUserLogin(user) {
       console.log('User logged in, syncing data...');

       // Download and merge cloud data
       const cloudData = await this.cloudStorage.downloadCloudData();
       if (cloudData) {
           await this.storageService.mergeCloudData(cloudData);

           // Notify dashboard to refresh
           window.dispatchEvent(new CustomEvent('cloudDataMerged', {
               detail: { type: 'all' }
           }));
       }

       // Upload any local data that's missing from cloud
       await this.cloudStorage.performAutoSync();

       this.updateCloudStatus();
   }

   showNotification(message, type = 'info') {
       if (window.app?.currentPage?.showNotification) {
           window.app.currentPage.showNotification(message, type);
       } else {
           console.log(`[${type}] ${message}`);
       }
   }

   // Set up event listeners for cloud sync
   initializeEventListeners() {
       // Cloud sync button listeners
       document.getElementById('enableCloudSync')?.addEventListener('change', (e) => {
           this.cloudStorage.setSyncEnabled(e.target.checked);
           this.updateCloudStatus();
       });

       document.getElementById('conflictResolution')?.addEventListener('change', (e) => {
           this.cloudStorage.setConflictResolution(e.target.value);
       });

       document.getElementById('syncNowBtn')?.addEventListener('click', () => {
           this.performManualSync();
       });

       document.getElementById('downloadFromCloudBtn')?.addEventListener('click', () => {
           this.downloadFromCloud();
       });

       document.getElementById('uploadToCloudBtn')?.addEventListener('click', () => {
           this.uploadToCloud();
       });

       // Listen for sync status changes
       window.addEventListener('syncStatusChanged', (e) => {
           this.updateSyncStatus(e.detail);
       });

       // Listen for cloud data changes
       window.addEventListener('cloudDataChanged', (e) => {
           this.handleCloudDataChange(e.detail);
       });

       // Listen for user login
       window.addEventListener('userLoggedIn', async (e) => {
           await this.handleUserLogin(e.detail);
       });

       // Listen for auth state changes
       window.addEventListener('authStateChanged', (e) => {
           this.updateCloudStatus();
       });
   }

   destroy() {
       // Remove event listeners if needed
       window.removeEventListener('syncStatusChanged', this.updateSyncStatus);
       window.removeEventListener('cloudDataChanged', this.handleCloudDataChange);
       window.removeEventListener('userLoggedIn', this.handleUserLogin);
       window.removeEventListener('authStateChanged', this.updateCloudStatus);
   }
}
// src/app.js - Optimized Application Entry Point with Theme Support
console.log('🎸 Loading app.js...');

// Import at the top of the file
import {APP_VERSION, APP_CONFIG, BUILD_DATE, BUILD_NUMBER} from './config/version.js';


// Import configuration and theme service first
import appConfig from './config.js';
import {ThemeService} from './services/themeService.js';
import firebaseSyncService from './services/firebaseSyncService.js';


class App {
    constructor() {
        console.log('🏗️ Creating App instance...');
        this.config = appConfig;
        this.authService = null;
        this.storageService = null;
        this.themeService = null;
        this.currentPage = null;
        this.isInitialized = false;
        this.version = APP_VERSION;
        this.buildDate = BUILD_DATE;
        this.buildNumber = BUILD_NUMBER;


        // Make version info globally available
        window.APP_VERSION = APP_VERSION;
        window.APP_CONFIG = APP_CONFIG;
        window.BUILD_DATE = BUILD_DATE;
        window.BUILD_NUMBER = BUILD_NUMBER;
        console.log('✅ App instance created with base path:', this.config.basePath);
    }

    async init() {
        console.log('🚀 Starting app initialization...');
        console.log('Current location:', window.location.href);

        // Check for mobile test mode
        const urlParams = new URLSearchParams(window.location.search);
        const isMobileTest = urlParams.get('mobile-test') === 'true' || window.MOBILE_TEST_MODE;
        
        if (isMobileTest) {
            console.log('📱 Mobile test mode enabled');
            // Load mobile improvements CSS
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `${this.config.basePath}styles/mobile-improvements.css`;
            document.head.appendChild(link);
            
            // Add test mode indicator
            document.body.classList.add('mobile-test-mode');
            
            // Add mobile device class if applicable
            const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()) || window.innerWidth <= 768;
            if (isMobile) {
                document.body.classList.add('is-mobile-device');
                // Set a global flag that components can check
                window.IS_MOBILE_DEVICE = true;
            }
        }

        // Initialize cloud storage
        window.cloudStorage = firebaseSyncService;

        // Make storage service available globally for cloud sync
        window.app = this;

        try {
            // Initialize theme service FIRST to apply saved theme immediately
            console.log('🎨 Initializing theme service...');
            this.themeService = new ThemeService();
            console.log('✅ Theme initialized:', this.themeService.getTheme());

            // Add global ESC key handler for modals
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' || e.keyCode === 27) {
                    // Close any open modals
                    const openModals = document.querySelectorAll('.modal[style*="display: flex"], .modal[style*="display: block"]');
                    openModals.forEach(modal => {
                        modal.style.display = 'none';
                    });

                    // Also check for any modals with .show class
                    const showModals = document.querySelectorAll('.modal.show');
                    showModals.forEach(modal => {
                        modal.classList.remove('show');
                        modal.style.display = 'none';
                    });
                }
            });

            // Step 1: Load authentication service
            console.log('🔐 Loading authentication service...');
            const authModule = await import('./services/authService.js');
            console.log('Auth module loaded:', authModule);

            // Check if AuthService exists in the module
            if (!authModule.AuthService) {
                console.error('AuthService not found in module. Available exports:', Object.keys(authModule));
                throw new Error('AuthService class not found in authService.js module');
            }

            this.authService = new authModule.AuthService();
            console.log('✅ Authentication service instantiated');

            // Verify authService has required methods
            if (typeof this.authService.getCurrentUser !== 'function') {
                console.error('AuthService instance methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this.authService)));
                throw new Error('getCurrentUser method not found on AuthService instance');
            }

            // Step 2: Check if user is logged in - wait for Firebase auth state
            let user = null;
            try {
                if (this.authService && typeof this.authService.waitForAuthState === 'function') {
                    console.log('⏳ Waiting for Firebase auth state...');
                    user = await this.authService.waitForAuthState();
                } else if (this.authService && typeof this.authService.getCurrentUser === 'function') {
                    user = this.authService.getCurrentUser();
                } else {
                    console.warn('getCurrentUser method not available, using demo mode');
                    user = null;
                }
            } catch (e) {
                console.error('Error checking auth state:', e);
                user = null;
            }
            console.log('👤 Current user:', user ? `Logged in as ${user.email}` : 'Not logged in');

            if (!user) {
                console.log('🔓 No user found, loading auth page');
                await this.loadAuthPage();
                return;
            }

            // Step 3: Load storage service
            console.log('💾 Loading storage service...');
            const storageModule = await import('./services/storageService.js');
            this.storageService = new storageModule.StorageService(user.id);
            console.log('✅ Storage service loaded');

            // // Step 4: Load notification service
            try {
                console.log('🔔 Loading notification service...');
                const notificationModule = await import('./services/notificationManager.js');
                this.notificationManager = new notificationModule.NotificationManager();
                window.notificationManager = this.notificationManager; // Make globally accessible
                console.log('✅ Notification service loaded');
            } catch (error) {
                console.warn('⚠️ Notification service failed to load:', error);
            }

            // Step 5: Load main dashboard
            console.log('🏠 Loading dashboard...');
            await this.loadDashboardPage();

            // Step 6: Mark as initialized
            this.isInitialized = true;
            console.log('🎉 App initialization complete!');

            // Step 7: Check for service worker updates
            this.checkForUpdates();

        } catch (error) {
            console.error('💥 App initialization failed:', error);
            this.handleInitError(error);
            throw error;
        }
    }

    async loadAuthPage() {
        console.log('🔓 No user found, redirecting to login page...');
        window.location.replace('./login.html');
    }

    async loadDashboardPage() {
        console.log('🏠 Loading dashboard page...');

        try {
            // Clean up any existing page
            if (this.currentPage && typeof this.currentPage.destroy === 'function') {
                console.log('🧹 Cleaning up previous page...');
                this.currentPage.destroy();
            }

            // Show loading state
            const app = document.getElementById('app');
            app.textContent = ''; // Clear content safely
            
            const loadingContainer = document.createElement('div');
            loadingContainer.style.cssText = 'display: flex; align-items: center; justify-content: center; min-height: 100vh;';
            
            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner';
            spinner.style.cssText = 'width: 50px; height: 50px;';
            
            loadingContainer.appendChild(spinner);
            app.appendChild(loadingContainer);

            // Load dashboard module - using new dashboard
            const dashboardModule = await import('./pages/dashboard.js');
            const dashboard = new dashboardModule.DashboardPage(this.storageService, this.authService);

            // Pass theme service to dashboard
            dashboard.themeService = this.themeService;

            // Render dashboard
            await dashboard.render();
            this.currentPage = dashboard;

            console.log('✅ Dashboard loaded successfully');

        } catch (error) {
            console.error('❌ Failed to load dashboard:', error);
            this.showError('Failed to load dashboard', error);
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 8px;
            box-shadow: var(--shadow-lg);
            z-index: 9999;
            animation: slideIn 0.3s ease;
            max-width: 400px;
        `;

        const colors = {
            success: 'var(--success)',
            error: 'var(--danger)',
            info: 'var(--info)',
            warning: 'var(--warning)'
        };

        toast.style.borderLeftWidth = '4px';
        toast.style.borderLeftColor = colors[type] || colors.info;

        const toastContent = document.createElement('div');
        toastContent.style.cssText = 'display: flex; align-items: center; gap: 0.75rem;';
        
        const icon = document.createElement('span');
        icon.style.fontSize = '1.25rem';
        icon.textContent = type === 'success' ? '✅' :
            type === 'error' ? '❌' :
            type === 'warning' ? '⚠️' : 'ℹ️';
        
        const messageSpan = document.createElement('span');
        messageSpan.style.color = 'var(--text-primary)';
        messageSpan.textContent = message;
        
        toastContent.appendChild(icon);
        toastContent.appendChild(messageSpan);
        toast.appendChild(toastContent);

        document.body.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    async checkForUpdates() {
        if ('serviceWorker' in navigator && this.config.features.serviceWorker) {
            try {
                const registration = await navigator.serviceWorker.ready;

                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateNotification();
                        }
                    });
                });
            } catch (error) {
                console.warn('Service worker update check failed:', error);
            }
        }
    }

    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            right: 20px;
            max-width: 500px;
            margin: 0 auto;
            padding: 1rem;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 8px;
            box-shadow: var(--shadow-xl);
            z-index: 9999;
        `;

        const notificationContent = document.createElement('div');
        notificationContent.style.cssText = 'display: flex; align-items: center; justify-content: space-between;';
        
        const textContainer = document.createElement('div');
        
        const title = document.createElement('h4');
        title.style.cssText = 'margin: 0 0 0.25rem 0; color: var(--text-primary);';
        title.textContent = 'Update Available';
        
        const description = document.createElement('p');
        description.style.cssText = 'margin: 0; color: var(--text-secondary); font-size: 0.875rem;';
        description.textContent = 'A new version of Guitar Practice Journal is available.';
        
        textContainer.appendChild(title);
        textContainer.appendChild(description);
        
        const updateButton = document.createElement('button');
        updateButton.textContent = 'Update Now';
        updateButton.style.cssText = 'padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;';
        updateButton.addEventListener('click', () => location.reload());
        
        notificationContent.appendChild(textContainer);
        notificationContent.appendChild(updateButton);
        notification.appendChild(notificationContent);

        document.body.appendChild(notification);
    }

    handleInitError(error) {
        console.error('💥 Handling initialization error:', error);
        this.showError('App initialization failed', error);
    }

    showError(message, error = null) {
        console.error('❌ Showing error:', message, error);

        const app = document.getElementById('app');
        app.textContent = ''; // Clear content safely
        
        const errorContainer = document.createElement('div');
        errorContainer.style.cssText = 'min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-dark); padding: 20px;';
        
        const errorCard = document.createElement('div');
        errorCard.style.cssText = 'background: var(--bg-card); padding: 2rem; border-radius: 12px; border: 1px solid var(--danger); max-width: 600px; width: 100%;';
        
        const title = document.createElement('h2');
        title.style.cssText = 'color: var(--danger); margin-bottom: 1rem;';
        title.textContent = '⚠️ Application Error';
        
        const messageP = document.createElement('p');
        messageP.style.cssText = 'color: var(--text-primary); margin-bottom: 1rem;';
        messageP.textContent = message;
        
        errorCard.appendChild(title);
        errorCard.appendChild(messageP);
        
        if (error) {
            const details = document.createElement('details');
            details.style.cssText = 'margin-bottom: 1rem;';
            
            const summary = document.createElement('summary');
            summary.style.cssText = 'color: var(--text-secondary); cursor: pointer;';
            summary.textContent = 'Technical Details';
            
            const pre = document.createElement('pre');
            pre.style.cssText = 'background: var(--bg-input); padding: 1rem; border-radius: 6px; overflow-x: auto; margin-top: 1rem; color: var(--text-primary); font-size: 0.875rem;';
            pre.textContent = error.stack || error.message || String(error);
            
            details.appendChild(summary);
            details.appendChild(pre);
            errorCard.appendChild(details);
        }
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = 'display: flex; gap: 1rem; margin-top: 1.5rem;';
        
        const reloadButton = document.createElement('button');
        reloadButton.textContent = 'Reload Page';
        reloadButton.style.cssText = 'padding: 0.75rem 1.5rem; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer;';
        reloadButton.addEventListener('click', () => location.reload());
        
        const clearCacheButton = document.createElement('button');
        clearCacheButton.textContent = 'Clear Cache & Reload';
        clearCacheButton.style.cssText = 'padding: 0.75rem 1.5rem; background: var(--danger); color: white; border: none; border-radius: 6px; cursor: pointer;';
        clearCacheButton.addEventListener('click', () => {
            if (typeof clearCacheAndReload === 'function') {
                clearCacheAndReload();
            } else {
                // Fallback if function not available
                if ('caches' in window) {
                    caches.keys().then(names => {
                        Promise.all(names.map(name => caches.delete(name)))
                            .then(() => location.reload());
                    });
                } else {
                    location.reload();
                }
            }
        });
        
        buttonContainer.appendChild(reloadButton);
        buttonContainer.appendChild(clearCacheButton);
        errorCard.appendChild(buttonContainer);
        
        errorContainer.appendChild(errorCard);
        app.appendChild(errorContainer);

        // Add animation styles if not present
        if (!document.getElementById('appAnimations')) {
            const style = document.createElement('style');
            style.id = 'appAnimations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    destroy() {
        console.log('🧹 Cleaning up app...');
        if (this.currentPage && typeof this.currentPage.destroy === 'function') {
            this.currentPage.destroy();
        }
    }
}

console.log('✅ App class defined successfully');

// Export the App class
export {App};
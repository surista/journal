// src/app.js - Optimized Application Entry Point with Theme Support
console.log('🎸 Loading app.js...');

// Import configuration and theme service first
import appConfig from './config.js';
import {ThemeService} from './services/themeService.js';
import {cloudStorage} from './services/firebaseService.js';


class App {
    constructor() {
        console.log('🏗️ Creating App instance...');
        this.config = appConfig;
        this.authService = null;
        this.storageService = null;
        this.themeService = null;
        this.currentPage = null;
        this.isInitialized = false;

        console.log('✅ App instance created with base path:', this.config.basePath);
    }

    async init() {
        console.log('🚀 Starting app initialization...');
        console.log('Current location:', window.location.href);

        // Initialize cloud storage
        window.cloudStorage = cloudStorage;

        // Make storage service available globally for cloud sync
        window.app = this;

        try {
            // Initialize theme service FIRST to apply saved theme immediately
            console.log('🎨 Initializing theme service...');
            this.themeService = new ThemeService();
            console.log('✅ Theme initialized:', this.themeService.getTheme());

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

            // Step 2: Check if user is logged in
            let user = null;
            try {
                if (this.authService && typeof this.authService.getCurrentUser === 'function') {
                    user = this.authService.getCurrentUser();
                } else {
                    console.warn('getCurrentUser method not available, using demo mode');
                    user = null;
                }
            } catch (e) {
                console.error('Error calling getCurrentUser:', e);
                user = null;
            }
            console.log('👤 Current user:', user ? 'Logged in' : 'Not logged in');

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

            // Step 4: Load notification service
            try {
                console.log('🔔 Loading notification service...');
                const notificationModule = await import('./services/notificationManager.js');
                this.notificationManager = new notificationModule.NotificationManager();
                console.log('✅ Notification service loaded');
            } catch (error) {
                console.warn('⚠️ Notification service failed to load:', error);
                // Continue without notifications
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
        console.log('🔓 Loading authentication page...');

        try {
            const app = document.getElementById('app');
            app.innerHTML = `
                <div class="auth-container" style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-dark); padding: 20px;">
                    <div class="auth-card" style="background: var(--bg-card); padding: 2rem; border-radius: 12px; box-shadow: var(--shadow-xl); max-width: 400px; width: 100%; border: 1px solid var(--border);">
                        <h1 style="text-align: center; color: var(--primary); margin-bottom: 2rem; font-size: 2rem;">
                            🎸 Guitar Practice Journal
                        </h1>
                        
                        <form id="loginForm" style="display: flex; flex-direction: column; gap: 1.25rem;">
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary); font-weight: 500;">Email:</label>
                                <input 
                                    type="email" 
                                    id="email" 
                                    value="demo@example.com" 
                                    style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-input); color: var(--text-primary); font-size: 1rem;" 
                                    placeholder="Enter your email"
                                    required
                                >
                            </div>
                            <div class="form-group">
                                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary); font-weight: 500;">Password:</label>
                                <input 
                                    type="password" 
                                    id="password" 
                                    value="demo123" 
                                    style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-input); color: var(--text-primary); font-size: 1rem;" 
                                    placeholder="Enter your password"
                                    required
                                >
                            </div>
                            <button 
                                type="submit" 
                                id="loginBtn"
                                style="padding: 0.875rem; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 1rem; margin-top: 0.5rem; transition: all 0.2s ease;"
                                onmouseover="this.style.background='var(--primary-dark)'"
                                onmouseout="this.style.background='var(--primary)'"
                            >
                                <span id="loginBtnText">Login</span>
                            </button>
                        </form>
                        
                        <div style="text-align: center; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border);">
                            <p style="color: var(--text-tertiary); font-size: 0.875rem; margin-bottom: 0.5rem;">
                                Demo credentials are pre-filled
                            </p>
                            <p style="color: var(--text-tertiary); font-size: 0.75rem;">
                                Version: ${this.config.version} | Build: ${new Date(this.config.buildTimestamp).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
            `;

            // Add login handler
            const loginForm = document.getElementById('loginForm');
            const loginBtn = document.getElementById('loginBtn');
            const loginBtnText = document.getElementById('loginBtnText');

            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;

                if (!email || !password) {
                    this.showToast('Please fill in all fields', 'error');
                    return;
                }

                try {
                    // Disable form during login
                    loginBtn.disabled = true;
                    loginBtnText.textContent = 'Logging in...';

                    console.log('🔐 Attempting login...');
                    const result = await this.authService.login(email, password);

                    if (result.success) {
                        console.log('✅ Login successful');
                        loginBtnText.textContent = 'Success! Redirecting...';

                        // Initialize storage service
                        const user = this.authService.getCurrentUser();
                        const storageModule = await import('./services/storageService.js');
                        this.storageService = new storageModule.StorageService(user.id);

                        // Small delay for UI feedback
                        await new Promise(resolve => setTimeout(resolve, 500));

                        // Load dashboard
                        await this.loadDashboardPage();

                    } else {
                        loginBtn.disabled = false;
                        loginBtnText.textContent = 'Login';
                        this.showToast(result.error || 'Login failed', 'error');
                    }

                } catch (error) {
                    console.error('❌ Login error:', error);
                    loginBtn.disabled = false;
                    loginBtnText.textContent = 'Login';
                    this.showToast('Login error: ' + error.message, 'error');
                }
            });

        } catch (error) {
            console.error('❌ Failed to load auth page:', error);
            this.showError('Failed to load login page', error);
        }
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
            app.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh;">
                    <div class="loading-spinner" style="width: 50px; height: 50px;"></div>
                </div>
            `;

            // Load dashboard module
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

        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="font-size: 1.25rem;">${
            type === 'success' ? '✅' :
                type === 'error' ? '❌' :
                    type === 'warning' ? '⚠️' : 'ℹ️'
        }</span>
                <span style="color: var(--text-primary);">${message}</span>
            </div>
        `;

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

        notification.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <h4 style="margin: 0 0 0.25rem 0; color: var(--text-primary);">Update Available</h4>
                    <p style="margin: 0; color: var(--text-secondary); font-size: 0.875rem;">
                        A new version of Guitar Practice Journal is available.
                    </p>
                </div>
                <button 
                    onclick="location.reload()" 
                    style="padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;"
                >
                    Update Now
                </button>
            </div>
        `;

        document.body.appendChild(notification);
    }

    handleInitError(error) {
        console.error('💥 Handling initialization error:', error);
        this.showError('App initialization failed', error);
    }

    showError(message, error = null) {
        console.error('❌ Showing error:', message, error);

        const app = document.getElementById('app');
        app.innerHTML = `
            <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-dark); padding: 20px;">
                <div style="background: var(--bg-card); padding: 2rem; border-radius: 12px; border: 1px solid var(--danger); max-width: 600px; width: 100%;">
                    <h2 style="color: var(--danger); margin-bottom: 1rem;">⚠️ Application Error</h2>
                    <p style="color: var(--text-primary); margin-bottom: 1rem;">${message}</p>
                    
                    ${error ? `
                    <details style="margin-bottom: 1rem;">
                        <summary style="color: var(--text-secondary); cursor: pointer;">Technical Details</summary>
                        <pre style="background: var(--bg-input); padding: 1rem; border-radius: 6px; overflow-x: auto; margin-top: 1rem; color: var(--text-primary); font-size: 0.875rem;">${error.stack || error.message}</pre>
                    </details>
                    ` : ''}
                    
                    <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                        <button onclick="location.reload()" style="padding: 0.75rem 1.5rem; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer;">
                            Reload Page
                        </button>
                        <button onclick="clearCacheAndReload()" style="padding: 0.75rem 1.5rem; background: var(--danger); color: white; border: none; border-radius: 6px; cursor: pointer;">
                            Clear Cache & Reload
                        </button>
                    </div>
                </div>
            </div>
        `;

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
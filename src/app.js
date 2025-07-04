// Main Application Entry Point with corrected import paths
import { AuthService } from './services/authService.js';
import { StorageService } from './services/storageService.js';
import { Router } from './utils/router.js';
import { notificationManager } from './services/notificationManager.js';

class App {
    constructor() {
        this.authService = new AuthService();
        this.storageService = null;
        this.router = new Router();
        this.currentPage = null;
        this.isInitialized = false;

        // Determine base path from current location
        this.basePath = this.getBasePath();
        console.log('App base path:', this.basePath);
    }

    getBasePath() {
        // Get the current path
        const path = window.location.pathname;

        // Check if we're in a subdirectory
        if (path.includes('/journal/')) {
            // Extract base path up to and including /journal/
            const match = path.match(/(.*\/journal\/)/);
            return match ? match[1] : '/journal/';
        }

        // Default to root
        return '/';
    }

    async init() {
        console.log('App init started');

        try {
            // Check authentication
            const user = this.authService.getCurrentUser();
            console.log('Current user:', user);

            if (!user) {
                console.log('No user found, loading auth page');
                await this.loadAuthPage();
                return;
            }

            // Initialize storage service with user context
            console.log('Initializing storage service for user:', user.id);
            this.storageService = new StorageService(user.id);

            // Wait a bit for storage to initialize
            await new Promise(resolve => setTimeout(resolve, 100));

            // Set up routing
            this.setupRoutes();

            // Load initial page based on URL
            const path = window.location.pathname;
            console.log('Current path:', path);

            if (path.includes('calendar')) {
                await this.loadCalendarPage();
            } else {
                await this.loadDashboardPage();
            }

            // Mark as initialized
            this.isInitialized = true;

            // Hide loading screen
            this.hideLoading();

        } catch (error) {
            console.error('Failed to initialize app:', error);
            console.error('Error stack:', error.stack);
            this.handleInitError(error);
        }
    }

    setupRoutes() {
        console.log('Setting up routes with base path:', this.basePath);

        // Define routes with base path
        this.router.on(this.basePath, () => this.loadDashboardPage());
        this.router.on(this.basePath + 'index.html', () => this.loadDashboardPage());
        this.router.on(this.basePath + 'calendar', () => this.loadCalendarPage());
        this.router.on(this.basePath + 'login', () => this.loadAuthPage());

        // Also handle without trailing slash
        if (this.basePath.endsWith('/')) {
            const baseWithoutSlash = this.basePath.slice(0, -1);
            this.router.on(baseWithoutSlash, () => this.loadDashboardPage());
        }

        // Set default route
        this.router.on('*', () => this.loadDashboardPage());

        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            this.router.resolve();
        });
    }

    async loadDashboardPage() {
        console.log('loadDashboardPage called');

        this.showLoading();

        try {
            // Clean up current page
            if (this.currentPage && typeof this.currentPage.destroy === 'function') {
                console.log('Destroying current page');
                this.currentPage.destroy();
            }

            // Dynamic import with better error handling
            console.log('Attempting to import dashboard module...');
            let DashboardPage;

            try {
                // Use relative import path - this should work better
                const module = await import('./pages/dashboard.js');
                console.log('Dashboard module imported successfully:', module);

                DashboardPage = module.DashboardPage;

                if (!DashboardPage) {
                    throw new Error('DashboardPage not found in module exports');
                }

            } catch (importError) {
                console.error('Import error details:', {
                    message: importError.message,
                    stack: importError.stack,
                    type: importError.constructor.name
                });

                // If relative import fails, try other approaches
                try {
                    // Try with explicit base path
                    const basePath = this.basePath.endsWith('/') ? this.basePath : this.basePath + '/';
                    const modulePath = `${basePath}src/pages/dashboard.js`;
                    console.log('Trying alternate import path:', modulePath);

                    const module = await import(modulePath);
                    DashboardPage = module.DashboardPage;

                } catch (secondError) {
                    console.error('Second import attempt failed:', secondError);

                    // Last resort - check if the file exists and has correct syntax
                    try {
                        // This will help identify if it's a syntax error in dashboard.js
                        const response = await fetch(`${this.basePath}src/pages/dashboard.js`);
                        const text = await response.text();
                        console.log('Dashboard.js file exists, first 500 chars:', text.substring(0, 500));

                        // Check for common syntax errors
                        if (text.includes('export class DashboardPage')) {
                            console.log('Dashboard class export found');
                        } else {
                            console.error('Dashboard class export NOT found');
                        }

                        // Re-throw the original error with more context
                        throw new Error(`Failed to import dashboard module. Original error: ${importError.message}. The file exists but may have a syntax error.`);
                    } catch (fetchError) {
                        throw new Error(`Failed to import dashboard module: ${importError.message}`);
                    }
                }
            }

            // Create dashboard instance
            console.log('Creating DashboardPage instance...');
            const dashboard = new DashboardPage(this.storageService, this.authService);
            console.log('DashboardPage instance created:', dashboard);

            // Initialize the dashboard
            console.log('Initializing dashboard...');
            await dashboard.init();
            console.log('Dashboard initialized successfully');

            this.currentPage = dashboard;

        } catch (error) {
            console.error('Failed to load dashboard:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });

            notificationManager.error(`Failed to load dashboard. Error: ${error.message}`);

            // Show more detailed error to user
            const errorDiv = document.getElementById('app');
            if (errorDiv) {
                errorDiv.innerHTML = `
                    <div style="padding: 2rem; text-align: center;">
                        <h2 style="color: var(--danger);">Failed to load dashboard</h2>
                        <p style="color: var(--text-secondary); margin: 1rem 0;">
                            Error: ${error.message}
                        </p>
                        <details style="margin: 2rem auto; max-width: 600px; text-align: left;">
                            <summary style="cursor: pointer; color: var(--primary);">Technical Details</summary>
                            <pre style="background: var(--bg-input); padding: 1rem; border-radius: 8px; overflow-x: auto; margin-top: 1rem;">
${error.stack || 'No stack trace available'}

Base Path: ${this.basePath}
Current URL: ${window.location.href}
Import attempts:
1. ./pages/dashboard.js
2. ${this.basePath}src/pages/dashboard.js
                            </pre>
                        </details>
                        <button onclick="location.reload()" class="btn btn-primary">
                            Reload Page
                        </button>
                    </div>
                `;
            }
        } finally {
            this.hideLoading();
        }
    }

    async loadCalendarPage() {
        console.log('loadCalendarPage called');

        // Ensure we have required services
        if (!this.storageService) {
            console.error('No storage service available');
            await this.loadAuthPage();
            return;
        }

        this.showLoading();

        try {
            // Clean up current page
            if (this.currentPage && typeof this.currentPage.destroy === 'function') {
                this.currentPage.destroy();
            }

            // Dynamic import with proper error handling
            let CalendarPage;

            try {
                // Use relative import path
                const module = await import('./pages/calendar.js');
                console.log('Calendar module imported:', module);
                CalendarPage = module.CalendarPage;
            } catch (importError) {
                console.error('Calendar import error:', importError);

                // Try alternate path
                try {
                    const basePath = this.basePath.endsWith('/') ? this.basePath : this.basePath + '/';
                    const modulePath = `${basePath}src/pages/calendar.js`;
                    const module = await import(modulePath);
                    CalendarPage = module.CalendarPage;
                } catch (fallbackError) {
                    throw new Error(`Failed to import calendar module: ${importError.message}`);
                }
            }

            const calendar = new CalendarPage(this.storageService, this.authService);
            await calendar.init();

            this.currentPage = calendar;

        } catch (error) {
            console.error('Failed to load calendar:', error);
            notificationManager.error('Failed to load calendar page: ' + error.message);

            // Show error in UI
            const errorDiv = document.getElementById('app');
            if (errorDiv) {
                errorDiv.innerHTML = `
                    <div style="padding: 2rem; text-align: center;">
                        <h2 style="color: var(--danger);">Failed to load calendar</h2>
                        <p style="color: var(--text-secondary); margin: 1rem 0;">
                            Error: ${error.message}
                        </p>
                        <button onclick="location.reload()" class="btn btn-primary">
                            Reload Page
                        </button>
                    </div>
                `;
            }
        } finally {
            this.hideLoading();
        }
    }

    async loadAuthPage() {
        console.log('loadAuthPage called');

        this.showLoading();

        try {
            // Clean up current page
            if (this.currentPage && typeof this.currentPage.destroy === 'function') {
                this.currentPage.destroy();
            }

            // Dynamic import with proper error handling
            let AuthPage;

            try {
                // Use relative import path
                const module = await import('./pages/auth.js');
                console.log('Auth module imported:', module);
                AuthPage = module.AuthPage;
            } catch (importError) {
                console.error('Auth import error:', importError);

                // Try alternate path
                try {
                    const basePath = this.basePath.endsWith('/') ? this.basePath : this.basePath + '/';
                    const modulePath = `${basePath}src/pages/auth.js`;
                    const module = await import(modulePath);
                    AuthPage = module.AuthPage;
                } catch (fallbackError) {
                    throw new Error(`Failed to import auth module: ${importError.message}`);
                }
            }

            const authPage = new AuthPage(this.authService);

            // Set up login success handler
            authPage.onLoginSuccess = async (user) => {
                console.log('Login successful for user:', user);

                try {
                    // Initialize storage with new user
                    this.storageService = new StorageService(user.id);

                    // Wait for storage to initialize
                    await new Promise(resolve => setTimeout(resolve, 100));

                    // Set up routes if not already done
                    if (!this.isInitialized) {
                        this.setupRoutes();
                        this.isInitialized = true;
                    }

                    // Navigate to dashboard
                    await this.loadDashboardPage();

                } catch (error) {
                    console.error('Error after login:', error);
                    notificationManager.error('Login successful but failed to load dashboard.');
                }
            };

            await authPage.init();
            this.currentPage = authPage;

        } catch (error) {
            console.error('Failed to load auth page:', error);
            notificationManager.error('Failed to load login page: ' + error.message);

            // Show error in UI
            const errorDiv = document.getElementById('app');
            if (errorDiv) {
                errorDiv.innerHTML = `
                    <div style="padding: 2rem; text-align: center;">
                        <h2 style="color: var(--danger);">Failed to load login page</h2>
                        <p style="color: var(--text-secondary); margin: 1rem 0;">
                            Error: ${error.message}
                        </p>
                        <button onclick="location.reload()" class="btn btn-primary">
                            Reload Page
                        </button>
                    </div>
                `;
            }
        } finally {
            this.hideLoading();
        }
    }

    showLoading() {
        const loader = document.querySelector('.app-loading');
        if (loader) {
            loader.style.display = 'flex';
        }
    }

    hideLoading() {
        const loader = document.querySelector('.app-loading');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    handleInitError(error) {
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.style.display = 'block';
            errorDiv.innerHTML = `
                <strong>Initialization Error</strong><br>
                ${error.message}<br><br>
                <strong>Possible causes:</strong><br>
                1. Missing JavaScript files in src/ directory<br>
                2. Incorrect file paths or structure<br>
                3. Module loading errors<br><br>
                Check the browser console for detailed error information.
            `;
        }

        this.hideLoading();
    }
}

// Export for use in other modules
export { App };
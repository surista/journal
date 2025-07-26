// Application loader and error handling
import {
    handleDomainRedirect,
    handleAuthRedirect,
    detectBasePath,
    setAppVersion
} from './utils/init.js';

// Initialize early setup
handleDomainRedirect();
handleAuthRedirect();
detectBasePath();
setAppVersion();

const debugInfo = document.getElementById('debug-info');
const errorDiv = document.getElementById('error-message');

function showDebugInfo(message) {
    if (debugInfo) {
        debugInfo.style.display = 'block';
        debugInfo.textContent = `Debug: ${message}`;
    }
}

function showError(message, error = null) {
    console.error('❌ Error:', message, error);
    if (errorDiv) {
        errorDiv.style.display = 'block';
        errorDiv.innerHTML = `
            <strong>Application Error</strong><br>
            ${message}<br><br>
            <button onclick="location.reload()">Reload Page</button>
            <button onclick="clearCacheAndReload()">Clear Cache & Reload</button>
        `;
    }
}

// Cache clearing function
window.clearCacheAndReload = async function () {
    try {
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map((name) => caches.delete(name)));
        }
        localStorage.clear();
        sessionStorage.clear();
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
                await registration.unregister();
            }
        }
        location.reload(true);
    } catch (error) {
        console.error('Cache clear error:', error);
        location.reload(true);
    }
};

// Global error handler
window.addEventListener('error', (e) => {
    showError(`Script error: ${e.message}`, e);
});

window.addEventListener('unhandledrejection', (e) => {
    showError(`Promise rejection: ${e.reason}`, e);
});

// Set version in loading text
(async function setLoadingVersion() {
    try {
        const versionModule = await import('./config/version.js');
        const loadingText = document.getElementById('loadingVersionText');
        if (loadingText) {
            loadingText.textContent = `Loading Guitar Practice Journal v${versionModule.APP_VERSION}...`;
        }
    } catch (error) {
        console.warn('Could not load version for loading screen:', error);
        // Fallback to default text if version loading fails
        const loadingText = document.getElementById('loadingVersionText');
        if (loadingText) {
            loadingText.textContent = 'Loading Guitar Practice Journal v9.7...';
        }
    }
})();

// Initialize app
async function initializeApp() {
    try {
        showDebugInfo('Loading configuration...');

        // Import config with timeout
        const configPromise = import('./config.js');
        const configTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Config loading timeout')), 10000)
        );

        const configModule = await Promise.race([configPromise, configTimeout]);
        const appConfig = configModule.default;

        showDebugInfo('Configuration loaded successfully');

        showDebugInfo('Loading main application...');

        // Import app with timeout
        const appPromise = import('./app.js');
        const appTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('App loading timeout')), 10000)
        );

        const appModule = await Promise.race([appPromise, appTimeout]);
        const { App } = appModule;

        showDebugInfo('Application module loaded, initializing...');

        // Create and initialize app
        window.app = new App();

        showDebugInfo('Calling app.init()...');
        await window.app.init();

        // Hide loading screen
        const loader = document.querySelector('.app-loading');
        if (loader) {
            loader.style.display = 'none';
        }
    } catch (error) {
        console.error('❌ App initialization failed:', error);

        if (error.message.includes('timeout')) {
            showError('App loading timed out. This might be a network issue or missing files.');
        } else if (error.message.includes('Failed to resolve module specifier')) {
            showError(
                `Module not found: ${error.message}. Check that all files exist in the src/ directory.`
            );
        } else if (error.message.includes('Failed to fetch')) {
            showError(
                'Failed to load required files. Check your internet connection and file structure.'
            );
        } else {
            showError(`Initialization failed: ${error.message}`);
        }
    }
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Fallback timeout - if app doesn't load in 30 seconds, show error
setTimeout(() => {
    const loader = document.querySelector('.app-loading');
    if (loader && loader.style.display !== 'none') {
        showError(
            'App failed to load within 30 seconds. There may be a problem with the application files.'
        );
    }
}, 30000);

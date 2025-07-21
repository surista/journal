// src/config.js - Simplified and Robust Configuration
console.log('📋 Loading config.js...');

const APP_VERSION = '9.94';

// Simple and reliable base path detection
function getBasePath() {
    try {
        // Use the already detected base path if available
        if (window.__APP_BASE_PATH__) {
            return window.__APP_BASE_PATH__;
        }

        // Fallback detection
        const path = window.location.pathname;
        const segments = path.split('/').filter(s => s.length > 0);

        // Remove filename if present
        if (segments.length > 0 && segments[segments.length - 1].includes('.')) {
            segments.pop();
        }

        return segments.length > 0 ? '/' + segments.join('/') + '/' : '/';
    } catch (error) {
        console.error('Error detecting base path:', error);
        return '/';
    }
}

// Main configuration object
const appConfig = {
    // Core settings
    version: APP_VERSION,
    basePath: getBasePath(),
    buildTimestamp: new Date().toISOString(),
    isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',

    // Routes
    routes: {
        home: '',
        dashboard: 'dashboard',
        calendar: 'calendar',
        audio: 'audio',
        metronome: 'metronome',
        goals: 'goals',
        stats: 'stats',
        history: 'history',
        settings: 'settings',
        login: 'login'
    },

    // Feature flags
    features: {
        audioPlayer: true,
        metronome: true,
        calendar: true,
        achievements: true,
        export: true,
        notifications: true,
        serviceWorker: true
    },

    // Service Worker config
    serviceWorkerConfig: {
        path: null, // Will be set in init()
        scope: null // Will be set in init()
    },

    // Storage config
    storage: {
        prefix: 'guitarpractice_',
        useIndexedDB: true,
        useCompression: true
    },

    // Audio config
    audio: {
        supportedFormats: ['mp3', 'wav', 'ogg', 'webm', 'm4a'],
        maxFileSize: 100 * 1024 * 1024 // 100MB
    },

    // Initialize dynamic config
    init() {
        console.log('🔧 Initializing app config...');

        // Set service worker paths
        this.serviceWorkerConfig.path = this.basePath + 'service-worker.js';
        this.serviceWorkerConfig.scope = this.basePath;

        // Log important info
        console.log('📍 Base path:', this.basePath);
        console.log('🏠 Environment:', this.isDevelopment ? 'Development' : 'Production');
        console.log('📦 Version:', this.version);

        return this;
    },

    // Generate route URL
    getRouteUrl(routeName) {
        const route = this.routes[routeName];
        if (route === undefined) {
            console.warn(`Route "${routeName}" not found`);
            return this.basePath;
        }
        return this.basePath + route;
    },

    // Check if feature is enabled
    isFeatureEnabled(featureName) {
        return this.features[featureName] === true;
    },

    // Simple export for debugging
    exportConfig() {
        return {
            version: this.version,
            basePath: this.basePath,
            isDevelopment: this.isDevelopment,
            routes: this.routes,
            features: this.features
        };
    }
};

// Initialize immediately
console.log('⚙️ Initializing config...');
appConfig.init();

console.log('✅ Config loaded successfully');

// Export as default
export default appConfig;
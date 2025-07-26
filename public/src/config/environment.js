// Environment configuration management
// This module handles environment-specific configurations

/**
 * Detects the current environment based on hostname
 * @returns {string} Environment name (development, staging, production)
 */
export const detectEnvironment = () => {
    const hostname = window.location.hostname;

    // Production domains
    if (
        hostname === 'www.guitar-practice-journal.com' ||
        hostname === 'guitar-practice-journal.com' ||
        hostname === 'guitar-practice-journal-9f064.web.app' ||
        hostname === 'guitar-practice-journal-9f064.firebaseapp.com'
    ) {
        return 'production';
    }

    // Staging domain (if you have one)
    if (hostname.includes('staging') || hostname.includes('test')) {
        return 'staging';
    }

    // Local development
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '') {
        return 'development';
    }

    // Default to production for safety
    return 'production';
};

/**
 * Environment-specific configurations
 *
 * IMPORTANT: To set up your development environment:
 * 1. Create a new Firebase project for development (e.g., guitar-practice-journal-dev)
 * 2. Replace the development firebaseConfig below with your dev project's config
 * 3. Keep the production config as-is for your live environment
 */
const environments = {
    development: {
        firebaseConfig: {
            // TODO: Replace with your development Firebase project config
            // You can get this from Firebase Console > Project Settings > Your apps
            apiKey: 'AIzaSyBiSOuGubepEGG8HvtIqJtse7bQV0zHuz4',
            authDomain: 'journal-dev-b6257.firebaseapp.com',
            projectId: 'journal-dev-b6257',
            storageBucket: 'journal-dev-b6257.firebasestorage.app',
            messagingSenderId: '1065114454297',
            appId: '1:1065114454297:web:ab8fdc716da6fcf40fdd88',
            measurementId: 'G-JR43EPFK26'
        },
        // Development-specific settings
        environmentName: 'Development',
        environmentColor: '#10b981', // Green
        enableDebugLogging: true,
        enableAppCheck: false, // Disable App Check in development for easier testing
        authRateLimit: {
            maxAttempts: 10,
            windowMs: 15 * 60 * 1000 // 15 minutes
        },
        features: {
            showEnvironmentBadge: true,
            enableExperimentalFeatures: true,
            enableDetailedLogging: true
        }
    },
    staging: {
        // Staging environment (optional - can use dev project with different settings)
        firebaseConfig: {
            apiKey: 'YOUR_DEV_API_KEY',
            authDomain: 'YOUR_DEV_PROJECT.firebaseapp.com',
            projectId: 'YOUR_DEV_PROJECT',
            storageBucket: 'YOUR_DEV_PROJECT.appspot.com',
            messagingSenderId: 'YOUR_DEV_SENDER_ID',
            appId: 'YOUR_DEV_APP_ID',
            measurementId: 'YOUR_DEV_MEASUREMENT_ID'
        },
        environmentName: 'Staging',
        environmentColor: '#f59e0b', // Amber
        enableDebugLogging: false,
        enableAppCheck: true,
        authRateLimit: {
            maxAttempts: 5,
            windowMs: 15 * 60 * 1000
        },
        features: {
            showEnvironmentBadge: true,
            enableExperimentalFeatures: false,
            enableDetailedLogging: false
        }
    },
    production: {
        firebaseConfig: {
            // Production Firebase project config (current live environment)
            apiKey: 'AIzaSyACB5lnRzzgIKR1toEXVKGkBfadk6KB_g0',
            authDomain: 'guitar-practice-journal-9f064.firebaseapp.com',
            projectId: 'guitar-practice-journal-9f064',
            storageBucket: 'guitar-practice-journal-9f064.appspot.com',
            messagingSenderId: '192212928966',
            appId: '1:192212928966:web:7f3b6bf36d2db950fa3767',
            measurementId: 'G-9HCN5FFKK0'
        },
        environmentName: 'Production',
        environmentColor: '#ef4444', // Red
        enableDebugLogging: false,
        enableAppCheck: true,
        authRateLimit: {
            maxAttempts: 3,
            windowMs: 30 * 60 * 1000 // 30 minutes
        },
        features: {
            showEnvironmentBadge: false, // Don't show badge in production
            enableExperimentalFeatures: false,
            enableDetailedLogging: false
        }
    }
};

/**
 * Gets configuration for the current environment
 * @returns {Object} Environment configuration
 */
export const getEnvironmentConfig = () => {
    const env = detectEnvironment();
    const config = environments[env];

    // Allow override from global config if available (for CI/CD)
    if (window.__ENV_CONFIG__) {
        return {
            ...config,
            ...window.__ENV_CONFIG__
        };
    }

    return config;
};

/**
 * Gets Firebase configuration for the current environment
 * @returns {Object} Firebase configuration
 */
export const getFirebaseConfig = () => {
    const config = getEnvironmentConfig();
    return config.firebaseConfig;
};

/**
 * Checks if debug logging is enabled
 * @returns {boolean}
 */
export const isDebugEnabled = () => {
    const config = getEnvironmentConfig();
    return config.enableDebugLogging || false;
};

/**
 * Checks if App Check should be enabled
 * @returns {boolean}
 */
export const isAppCheckEnabled = () => {
    const config = getEnvironmentConfig();
    return config.enableAppCheck || false;
};

/**
 * Gets auth rate limit configuration
 * @returns {Object} Rate limit configuration
 */
export const getAuthRateLimit = () => {
    const config = getEnvironmentConfig();
    return config.authRateLimit;
};

/**
 * Gets environment name
 * @returns {string} Environment name
 */
export const getEnvironmentName = () => {
    const config = getEnvironmentConfig();
    return config.environmentName || 'Unknown';
};

/**
 * Gets environment color
 * @returns {string} Environment color (hex)
 */
export const getEnvironmentColor = () => {
    const config = getEnvironmentConfig();
    return config.environmentColor || '#6b7280';
};

/**
 * Checks if environment badge should be shown
 * @returns {boolean}
 */
export const shouldShowEnvironmentBadge = () => {
    const config = getEnvironmentConfig();
    return config.features?.showEnvironmentBadge || false;
};

/**
 * Checks if experimental features are enabled
 * @returns {boolean}
 */
export const areExperimentalFeaturesEnabled = () => {
    const config = getEnvironmentConfig();
    return config.features?.enableExperimentalFeatures || false;
};

// Export current environment for debugging
export const currentEnvironment = detectEnvironment();

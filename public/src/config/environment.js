// Environment configuration management
// This module handles environment-specific configurations

/**
 * Detects the current environment based on hostname
 * @returns {string} Environment name (development, staging, production)
 */
export const detectEnvironment = () => {
    const hostname = window.location.hostname;
    
    // Production domains
    if (hostname === 'www.guitar-practice-journal.com' || 
        hostname === 'guitar-practice-journal.com' ||
        hostname === 'guitar-practice-journal-9f064.web.app' ||
        hostname === 'guitar-practice-journal-9f064.firebaseapp.com') {
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
 */
const environments = {
    development: {
        firebaseConfig: {
            apiKey: "AIzaSyACB5lnRzzgIKR1toEXVKGkBfadk6KB_g0",
            authDomain: "guitar-practice-journal-9f064.firebaseapp.com",
            projectId: "guitar-practice-journal-9f064",
            storageBucket: "guitar-practice-journal-9f064.appspot.com",
            messagingSenderId: "192212928966",
            appId: "1:192212928966:web:7f3b6bf36d2db950fa3767",
            measurementId: "G-9HCN5FFKK0"
        },
        // Development-specific settings
        enableDebugLogging: true,
        enableAppCheck: false, // Disable App Check in development for easier testing
        authRateLimit: {
            maxAttempts: 10,
            windowMs: 15 * 60 * 1000 // 15 minutes
        }
    },
    staging: {
        // Same Firebase project but with different settings
        firebaseConfig: {
            apiKey: "AIzaSyACB5lnRzzgIKR1toEXVKGkBfadk6KB_g0",
            authDomain: "guitar-practice-journal-9f064.firebaseapp.com",
            projectId: "guitar-practice-journal-9f064",
            storageBucket: "guitar-practice-journal-9f064.appspot.com",
            messagingSenderId: "192212928966",
            appId: "1:192212928966:web:7f3b6bf36d2db950fa3767",
            measurementId: "G-9HCN5FFKK0"
        },
        enableDebugLogging: false,
        enableAppCheck: true,
        authRateLimit: {
            maxAttempts: 5,
            windowMs: 15 * 60 * 1000
        }
    },
    production: {
        firebaseConfig: {
            apiKey: "AIzaSyACB5lnRzzgIKR1toEXVKGkBfadk6KB_g0",
            authDomain: "guitar-practice-journal-9f064.firebaseapp.com",
            projectId: "guitar-practice-journal-9f064",
            storageBucket: "guitar-practice-journal-9f064.appspot.com",
            messagingSenderId: "192212928966",
            appId: "1:192212928966:web:7f3b6bf36d2db950fa3767",
            measurementId: "G-9HCN5FFKK0"
        },
        enableDebugLogging: false,
        enableAppCheck: true,
        authRateLimit: {
            maxAttempts: 3,
            windowMs: 30 * 60 * 1000 // 30 minutes
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

// Export current environment for debugging
export const currentEnvironment = detectEnvironment();
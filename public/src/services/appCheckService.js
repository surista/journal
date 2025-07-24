// Firebase App Check Service
// Provides attestation to protect backend resources from abuse

import { isAppCheckEnabled, isDebugEnabled } from '../config/environment.js';

class AppCheckService {
    constructor() {
        this.appCheck = null;
        this.isInitialized = false;
        this.token = null;
        this.tokenRefreshTimer = null;
    }

    /**
     * Initialize App Check with reCAPTCHA V3 provider
     * @param {Object} app - Firebase app instance
     * @param {string} siteKey - reCAPTCHA V3 site key
     */
    async initialize(app, siteKey) {
        try {
            // Only initialize if App Check is enabled for this environment
            if (!isAppCheckEnabled()) {
                if (isDebugEnabled()) {
                    console.log('ℹ️ App Check is disabled for this environment');
                }
                return;
            }

            // Check if App Check is available
            if (typeof firebase === 'undefined' || !firebase.appCheck) {
                console.warn('⚠️ Firebase App Check SDK not available');
                return;
            }

            // Create reCAPTCHA V3 provider
            const provider = new firebase.appCheck.ReCaptchaV3Provider(siteKey);

            // Initialize App Check
            this.appCheck = firebase.appCheck(app);
            
            // Activate App Check with the provider
            await this.appCheck.activate(provider, true); // true for automatic token refresh
            
            // Get initial token with error handling
            try {
                const tokenResponse = await this.appCheck.getToken();
                this.token = tokenResponse.token;
            } catch (tokenError) {
                // Only log in debug mode to reduce console noise
                if (isDebugEnabled()) {
                    console.warn('⚠️ Failed to get initial App Check token:', tokenError.message);
                }
                // Continue without token - app will still work
            }
            
            // Set up token refresh listener
            this.setupTokenRefresh();
            
            this.isInitialized = true;
            console.log('✅ Firebase App Check initialized (token may be pending)');
            
            if (isDebugEnabled()) {
                console.log('🔐 App Check setup complete');
            }
        } catch (error) {
            // Log the error but don't let it break the app
            if (error.message && error.message.includes('ReCAPTCHA')) {
                console.warn('⚠️ App Check ReCAPTCHA initialization failed. This is normal if the domain is not configured in the ReCAPTCHA admin console.');
            } else {
                console.warn('⚠️ App Check initialization error:', error.message);
            }
            // Don't throw - App Check is optional and shouldn't break the app
        }
    }

    /**
     * Set up automatic token refresh
     */
    setupTokenRefresh() {
        if (!this.appCheck) return;

        // Listen for token changes
        this.appCheck.onTokenChanged((tokenResponse) => {
            this.token = tokenResponse.token;
            if (isDebugEnabled()) {
                console.log('🔄 App Check token refreshed');
            }
        });
    }

    /**
     * Get current App Check token
     * @returns {Promise<string|null>} The App Check token or null
     */
    async getToken() {
        if (!this.isInitialized || !this.appCheck) {
            return null;
        }

        try {
            const tokenResponse = await this.appCheck.getToken();
            return tokenResponse.token;
        } catch (error) {
            console.warn('⚠️ Failed to get App Check token:', error);
            return null;
        }
    }

    /**
     * Check if App Check is available and initialized
     * @returns {boolean}
     */
    isAvailable() {
        return this.isInitialized && this.appCheck !== null;
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (this.tokenRefreshTimer) {
            clearInterval(this.tokenRefreshTimer);
            this.tokenRefreshTimer = null;
        }
        this.appCheck = null;
        this.isInitialized = false;
        this.token = null;
    }
}

// Export singleton instance
export const appCheckService = new AppCheckService();

// Helper function to initialize App Check with Firebase app
export const initializeAppCheck = async (app) => {
    // Production reCAPTCHA V3 site key
    // You should replace this with your actual reCAPTCHA V3 site key
    const RECAPTCHA_SITE_KEY = '6LcPxC0qAAAAAJZx_gQ1sLc6RmI4Z8YvHeVQX64A';
    
    await appCheckService.initialize(app, RECAPTCHA_SITE_KEY);
};

// Export for testing
export default AppCheckService;
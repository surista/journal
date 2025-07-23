// Firebase configuration with environment support
import { getFirebaseConfig as getEnvFirebaseConfig, currentEnvironment, isDebugEnabled } from './environment.js';

// Security note: While Firebase API keys are designed to be public and are safe to expose
// in client-side code, they should always be used in conjunction with:
// 1. Proper Firebase Security Rules to protect your data
// 2. Authorized domains configuration in Firebase Console
// 3. App Check for additional security (recommended for production)
// 4. Environment-based configuration for better security practices

// Get Firebase configuration from environment
export const firebaseConfig = getEnvFirebaseConfig();

// Log environment info in development
if (isDebugEnabled()) {
    console.log(`🔥 Firebase configured for ${currentEnvironment} environment`);
}

// Helper to validate Firebase is properly configured
export const validateFirebaseConfig = () => {
    const config = firebaseConfig;
    const requiredFields = ['apiKey', 'authDomain', 'projectId'];
    
    for (const field of requiredFields) {
        if (!config[field]) {
            console.error(`Firebase configuration missing required field: ${field}`);
            return false;
        }
    }
    
    return true;
};
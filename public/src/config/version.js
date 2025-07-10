// src/config/version.js - Version and build information
export const APP_VERSION = '8.6';
export const BUILD_DATE = new Date().toISOString();
export const BUILD_NUMBER = Math.floor(Date.now() / 1000);

export const APP_CONFIG = {
    version: APP_VERSION,
    buildDate: BUILD_DATE,
    buildNumber: BUILD_NUMBER,
    features: {
        youtubeIntegration: true,
        compactAudioControls: true,
        enhancedLoopMarkers: true,
        smartLoopValidation: true,
        footerNavigation: true,
        cloudSync: true,
        autoUpdates: true
    }
};

console.log(`🎸 Guitar Practice Journal v${APP_VERSION} (Build ${BUILD_NUMBER})`);
console.log(`📅 Built: ${BUILD_DATE}`);
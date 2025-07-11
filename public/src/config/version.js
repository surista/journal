// src/config/version.js - Version and build information
export const APP_VERSION = '9.4';
export const BUILD_DATE = '2025-07-11T23:39:10.894Z';
export const BUILD_NUMBER = 1752277150;

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
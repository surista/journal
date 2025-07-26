// App configuration and version tracking
// Sets up global configuration variables

// Simple version tracking
window.APP_VERSION = '10.98';
console.log('🎸 Loading Guitar Practice Journal version:', window.APP_VERSION);

// Simplified base path detection
const scriptUrl = document.currentScript?.src || '';
let basePath = '';
if (scriptUrl) {
    const url = new URL(scriptUrl);
    basePath = url.pathname.substring(0, url.pathname.lastIndexOf('/') + 1);
}
if (!basePath || basePath === '/') {
    basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
}
window.BASE_PATH = basePath || './';
console.log('Base path detected:', window.BASE_PATH);

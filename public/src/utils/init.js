// Early initialization utilities

export function handleDomainRedirect() {
    // Domain redirect handled by Firebase hosting
}

export function handleAuthRedirect() {
    // Immediately redirect to login page if not logged in
    const currentPath = window.location.pathname;
    const isIndexPage = currentPath === '/' || currentPath === '/index.html';
    const hasUser = localStorage.getItem('currentUser');

    if (isIndexPage && !hasUser) {
        window.location.replace('./login.html');
    }
}

export function detectBasePath() {
    // Simple version tracking
    window.APP_VERSION = '9.7';

    // Simplified base path detection
    const currentPath = window.location.pathname;
    const pathParts = currentPath.split('/').filter((p) => p.length > 0);

    // Remove filename if present
    if (pathParts.length > 0 && pathParts[pathParts.length - 1].includes('.')) {
        pathParts.pop();
    }

    // Construct base path
    let basePath = '/';
    if (pathParts.length > 0) {
        basePath = '/' + pathParts.join('/') + '/';
    }

    window.__APP_BASE_PATH__ = basePath;
}

export function setAppVersion() {
    // Version is already set in detectBasePath
}

// Script to calculate CSP hashes for inline scripts
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Inline scripts from index.html
const inlineScripts = {
    domainRedirect: `if (location.hostname === 'guitar-practice-journal.com') {
            location.replace('https://www.guitar-practice-journal.com' + location.pathname + location.search + location.hash);
        }`,
    
    promiseHandler: `// Catch all promise rejections as early as possible
        window.addEventListener('unhandledrejection', function(event) {
            // Always prevent the default error handling for null rejections
            if (event.reason === null || event.reason === undefined || event.reason === 'null') {
                console.warn('⚠️ Unhandled promise rejection: null (suppressed)');
                event.preventDefault();
                return;
            }
            
            // Log other unhandled rejections without preventing default
            console.warn('⚠️ Unhandled promise rejection:', event.reason);
        });`,
    
    authCheck: `// Immediately redirect to login page if not logged in
        (function () {
            const currentPath = window.location.pathname;
            const isIndexPage = currentPath === '/' || currentPath === '/index.html';
            const hasUser = localStorage.getItem('currentUser');
            
            if (isIndexPage && !hasUser) {
                // console.log('No user found, redirecting to login page');
                window.location.replace('./login.html');
            }
        })();`,
    
    versionTracking: `// Simple version tracking
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
        console.log('Base path detected:', window.BASE_PATH);`
};

// Calculate SHA-256 hashes
function calculateHash(script) {
    return crypto.createHash('sha256').update(script).digest('base64');
}

// Generate hashes
const hashes = {};
for (const [name, script] of Object.entries(inlineScripts)) {
    const hash = calculateHash(script);
    hashes[name] = `'sha256-${hash}'`;
    console.log(`${name}: ${hashes[name]}`);
}

console.log('\nCSP script-src directive:');
console.log(`script-src 'self' ${Object.values(hashes).join(' ')} https://www.gstatic.com/firebasejs/9.22.0/ https://unpkg.com/tone@14.8.49/ https://cdn.jsdelivr.net/npm/soundtouchjs@0.1.30/ https://www.youtube.com/iframe_api https://s.ytimg.com;`);

// Write hashes to a file
const output = {
    hashes,
    cspDirective: `script-src 'self' ${Object.values(hashes).join(' ')} https://www.gstatic.com/firebasejs/9.22.0/ https://unpkg.com/tone@14.8.49/ https://cdn.jsdelivr.net/npm/soundtouchjs@0.1.30/ https://www.youtube.com/iframe_api https://s.ytimg.com;`
};

fs.writeFileSync(path.join(__dirname, 'csp-hashes.json'), JSON.stringify(output, null, 2));
console.log('\nHashes saved to csp-hashes.json');
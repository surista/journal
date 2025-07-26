// Security Configuration
// This file contains nonces and hashes for inline scripts that cannot be moved to external files

export const SCRIPT_HASHES = {
    // Hash for domain redirect script
    domainRedirect: '\'sha256-YOUR_HASH_HERE\'', // Will be calculated

    // Hash for promise rejection handler
    promiseHandler: '\'sha256-YOUR_HASH_HERE\'', // Will be calculated

    // Hash for auth check script
    authCheck: '\'sha256-YOUR_HASH_HERE\'', // Will be calculated

    // Hash for version tracking script
    versionTracking: '\'sha256-YOUR_HASH_HERE\'' // Will be calculated
};

// SRI hashes for external scripts
export const SRI_HASHES = {
    // Firebase SDKs
    firebaseApp: 'sha384-YOUR_HASH_HERE',
    firebaseAuth: 'sha384-YOUR_HASH_HERE',
    firebaseFirestore: 'sha384-YOUR_HASH_HERE',
    firebaseAppCheck: 'sha384-YOUR_HASH_HERE',

    // Tone.js
    toneJs: 'sha384-YOUR_HASH_HERE',

    // SoundTouch
    soundTouch: 'sha384-YOUR_HASH_HERE'
};

// CSP configuration
export const CSP_CONFIG = {
    'default-src': ['\'self\''],
    'script-src': [
        '\'self\'',
        // Add hashes for inline scripts here
        // External sources with specific versions
        'https://www.gstatic.com/firebasejs/9.22.0/',
        'https://unpkg.com/tone@14.8.49/',
        'https://cdn.jsdelivr.net/npm/soundtouchjs@0.1.30/',
        'https://www.youtube.com/iframe_api',
        'https://s.ytimg.com'
    ],
    'style-src': [
        '\'self\'',
        '\'unsafe-inline\'', // Will work on removing this in future update
        'https://fonts.googleapis.com'
    ],
    'font-src': ['\'self\'', 'https://fonts.gstatic.com'],
    'img-src': [
        '\'self\'',
        'data:', // Required for thumbnails and waveforms
        'blob:',
        'https:'
    ],
    'connect-src': [
        '\'self\'',
        'blob:',
        'https://*.firebaseapp.com',
        'https://*.firebaseio.com',
        'https://*.googleapis.com',
        'https://*.firebasestorage.googleapis.com',
        'https://securetoken.googleapis.com',
        'wss://*.firebaseio.com',
        'https://recaptchaenterprise.googleapis.com'
    ],
    'frame-src': [
        '\'self\'',
        'https://www.youtube.com',
        'https://accounts.google.com',
        'https://*.firebaseapp.com'
    ],
    'frame-ancestors': ['\'self\''],
    'object-src': ['\'none\''],
    'worker-src': ['\'self\'', 'blob:'],
    'media-src': ['\'self\'', 'blob:'],
    'base-uri': ['\'self\''],
    'form-action': ['\'self\''],
    'upgrade-insecure-requests': []
};

// Security headers configuration for Firebase
export const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

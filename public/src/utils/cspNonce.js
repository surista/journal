// CSP Nonce Generator Utility
// This utility helps generate and manage Content Security Policy nonces

/**
 * Generates a cryptographically secure random nonce
 * @returns {string} Base64 encoded nonce
 */
export function generateNonce() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, array));
}

/**
 * Stores the current nonce in sessionStorage for use across modules
 * @param {string} nonce - The nonce to store
 */
export function storeNonce(nonce) {
    sessionStorage.setItem('csp-nonce', nonce);
}

/**
 * Retrieves the current nonce from sessionStorage
 * @returns {string|null} The stored nonce or null if not found
 */
export function getNonce() {
    return sessionStorage.getItem('csp-nonce');
}

/**
 * Creates a script element with the proper nonce attribute
 * @param {string} src - The script source URL
 * @param {Object} attributes - Additional attributes for the script element
 * @returns {HTMLScriptElement} The created script element
 */
export function createNoncedScript(src, attributes = {}) {
    const script = document.createElement('script');
    const nonce = getNonce();
    
    if (nonce) {
        script.nonce = nonce;
    }
    
    if (src) {
        script.src = src;
    }
    
    // Add any additional attributes
    Object.entries(attributes).forEach(([key, value]) => {
        script.setAttribute(key, value);
    });
    
    return script;
}

/**
 * Creates a style element with the proper nonce attribute
 * @param {string} cssText - The CSS text content
 * @returns {HTMLStyleElement} The created style element
 */
export function createNoncedStyle(cssText) {
    const style = document.createElement('style');
    const nonce = getNonce();
    
    if (nonce) {
        style.nonce = nonce;
    }
    
    style.textContent = cssText;
    return style;
}

/**
 * Updates all inline scripts and styles to use nonces
 * This should be called early in the page load process
 */
export function applyNoncesToInlineElements() {
    const nonce = getNonce();
    if (!nonce) return;
    
    // Apply nonce to existing inline scripts
    document.querySelectorAll('script:not([src])').forEach(script => {
        if (!script.nonce) {
            script.nonce = nonce;
        }
    });
    
    // Apply nonce to existing inline styles
    document.querySelectorAll('style').forEach(style => {
        if (!style.nonce) {
            style.nonce = nonce;
        }
    });
}
// Sanitization utilities to prevent XSS attacks

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} str - The string to escape
 * @returns {string} - The escaped string
 */
export function escapeHtml(str) {
    if (typeof str !== 'string') return '';

    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Sanitizes user input to prevent XSS attacks
 * @param {string} input - The user input to sanitize
 * @returns {string} - The sanitized input
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') return '';

    // Remove any script tags and their content
    let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove any on* event handlers
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Escape remaining HTML
    return escapeHtml(sanitized);
}

/**
 * Creates a text node with the given content
 * Safe alternative to innerHTML for plain text
 * @param {string} text - The text content
 * @returns {Text} - A text node
 */
export function createTextNode(text) {
    return document.createTextNode(text || '');
}

/**
 * Safely sets text content of an element
 * @param {HTMLElement} element - The element to update
 * @param {string} text - The text content
 */
export function setTextContent(element, text) {
    if (element && element.nodeType === Node.ELEMENT_NODE) {
        element.textContent = text || '';
    }
}

/**
 * Creates an element with safe text content
 * @param {string} tagName - The tag name
 * @param {string} textContent - The text content
 * @param {Object} attributes - Optional attributes
 * @returns {HTMLElement} - The created element
 */
export function createElement(tagName, textContent = '', attributes = {}) {
    const element = document.createElement(tagName);

    if (textContent) {
        element.textContent = textContent;
    }

    // Safely set attributes
    for (const [key, value] of Object.entries(attributes)) {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (!key.startsWith('on')) {
            // Don't allow event handlers through attributes
            element.setAttribute(key, value);
        }
    }

    return element;
}

/**
 * Sanitizes HTML content using a whitelist approach
 * Only allows specific tags and attributes
 * @param {string} html - The HTML to sanitize
 * @returns {string} - The sanitized HTML
 */
export function sanitizeHtml(html) {
    if (typeof html !== 'string') return '';

    // Create a temporary container
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Define allowed tags and attributes
    const allowedTags = [
        'p',
        'br',
        'strong',
        'em',
        'u',
        'span',
        'div',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'ul',
        'ol',
        'li',
        'a'
    ];
    const allowedAttributes = {
        a: ['href', 'title'],
        span: ['class'],
        div: ['class']
    };

    // Recursively clean the DOM tree
    function cleanNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            return node;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return null;
        }

        const tagName = node.tagName.toLowerCase();

        if (!allowedTags.includes(tagName)) {
            return null;
        }

        // Create a clean copy of the node
        const cleanElement = document.createElement(tagName);

        // Copy allowed attributes
        const allowed = allowedAttributes[tagName] || [];
        for (const attr of allowed) {
            if (node.hasAttribute(attr)) {
                const value = node.getAttribute(attr);

                // Special handling for href to prevent javascript:
                if (attr === 'href') {
                    if (value.startsWith('javascript:') || value.startsWith('data:')) {
                        continue;
                    }
                }

                cleanElement.setAttribute(attr, value);
            }
        }

        // Recursively clean children
        for (const child of node.childNodes) {
            const cleanChild = cleanNode(child);
            if (cleanChild) {
                cleanElement.appendChild(cleanChild);
            }
        }

        return cleanElement;
    }

    // Clean all children
    const cleaned = document.createElement('div');
    for (const child of temp.childNodes) {
        const cleanChild = cleanNode(child);
        if (cleanChild) {
            cleaned.appendChild(cleanChild);
        }
    }

    return cleaned.innerHTML;
}

/**
 * Validates and sanitizes a URL
 * @param {string} url - The URL to validate
 * @returns {string|null} - The sanitized URL or null if invalid
 */
export function sanitizeUrl(url) {
    if (typeof url !== 'string') return null;

    try {
        const parsed = new URL(url);

        // Only allow http, https, and mailto protocols
        const allowedProtocols = ['http:', 'https:', 'mailto:'];
        if (!allowedProtocols.includes(parsed.protocol)) {
            return null;
        }

        return parsed.href;
    } catch (e) {
        // Try to parse as relative URL
        try {
            const parsed = new URL(url, window.location.origin);
            return parsed.href;
        } catch (e2) {
            return null;
        }
    }
}

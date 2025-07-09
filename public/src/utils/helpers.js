// utils/helpers.js - Centralized utility functions

/**
 * Debounce function - delays execution until after wait milliseconds have elapsed since last call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @param {boolean} immediate - Execute on leading edge instead of trailing
 */
export function debounce(func, wait, immediate = false) {
    let timeout;

    function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func.apply(this, args);
        };

        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);

        if (callNow) func.apply(this, args);
    }

    // Add cancel method to the debounced function
    executedFunction.cancel = function () {
        clearTimeout(timeout);
        timeout = null;
    };

    return executedFunction;
}

/**
 * Throttle function - ensures function is called at most once per specified period
 * @param {Function} func - Function to throttle
 * @param {number} limit - Milliseconds between calls
 */
export function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Time formatting utilities
 */
export const TimeUtils = {
    /**
     * Format duration in seconds to human readable format
     * @param {number} seconds - Duration in seconds
     * @param {boolean} short - Use short format (e.g., "5m" vs "5 minutes")
     */
    formatDuration(seconds, short = false) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (short) {
            if (hours > 0) {
                return `${hours}h ${minutes}m`;
            }
            return `${minutes}m`;
        }

        const parts = [];
        if (hours > 0) {
            parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
        }
        if (minutes > 0) {
            parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
        }
        if (secs > 0 && hours === 0) {
            parts.push(`${secs} second${secs !== 1 ? 's' : ''}`);
        }

        return parts.join(' ') || '0 seconds';
    },

    /**
     * Format time in seconds to MM:SS or HH:MM:SS format
     * @param {number} seconds - Time in seconds
     */
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * Format date to locale string
     * @param {Date|string} date - Date to format
     * @param {Object} options - Intl.DateTimeFormat options
     */
    formatDate(date, options = {}) {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            ...options
        });
    },

    /**
     * Get relative time string (e.g., "2 hours ago", "yesterday")
     * @param {Date|string} date - Date to compare
     */
    getRelativeTime(date) {
        const d = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        const diffInSeconds = Math.floor((now - d) / 1000);

        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 172800) return 'yesterday';
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

        return this.formatDate(d);
    }
};

/**
 * Compression utilities using LZ-String algorithm
 */
export const CompressionUtils = {
    /**
     * Compress a string using LZ compression
     * @param {string} string - String to compress
     */
    compress(string) {
        return this.LZString.compressToUTF16(string);
    },

    /**
     * Decompress a string
     * @param {string} compressed - Compressed string
     */
    decompress(compressed) {
        return this.LZString.decompressFromUTF16(compressed);
    },

    /**
     * Compress object to string
     * @param {Object} obj - Object to compress
     */
    compressObject(obj) {
        return this.compress(JSON.stringify(obj));
    },

    /**
     * Decompress string to object
     * @param {string} compressed - Compressed string
     */
    decompressObject(compressed) {
        if (!compressed) return null;

        try {
            const decompressed = this.decompress(compressed);
            if (!decompressed) {
                console.error('Decompression returned null - data may be corrupted');
                return null;
            }

            // Parse the JSON with error handling
            try {
                return JSON.parse(decompressed);
            } catch (parseError) {
                console.error('JSON parse error after decompression:', parseError);
                console.error('Decompressed string preview:', decompressed.substring(0, 200));
                return null;
            }
        } catch (error) {
            console.error('Error in decompressObject:', error);
            return null;
        }
    },

    // Minimal LZ-String implementation
    LZString: {
        compressToUTF16(input) {
            if (input == null) return "";
            return this._compress(input, 15) + " ";
        },

        decompressFromUTF16(compressed) {
            if (compressed == null) return "";
            if (compressed == "") return null;
            return this._decompress(compressed.length, 16384, compressed);
        },

        _compress(uncompressed, bitsPerChar) {
            let i, value;
            const context_dictionary = {};
            const context_dictionaryToCreate = {};
            let context_c = "";
            let context_wc = "";
            let context_w = "";
            let context_enlargeIn = 2;
            let context_dictSize = 3;
            let context_numBits = 2;
            const context_data = [];
            let context_data_val = 0;
            let context_data_position = 0;

            for (let ii = 0; ii < uncompressed.length; ii += 1) {
                context_c = uncompressed.charAt(ii);
                if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
                    context_dictionary[context_c] = context_dictSize++;
                    context_dictionaryToCreate[context_c] = true;
                }

                context_wc = context_w + context_c;
                if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
                    context_w = context_wc;
                } else {
                    if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                        if (context_w.charCodeAt(0) < 256) {
                            for (i = 0; i < context_numBits; i++) {
                                context_data_val = (context_data_val << 1);
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(String.fromCharCode(context_data_val));
                                    context_data_val = 0;
                                } else {
                                    context_data_position++;
                                }
                            }
                            value = context_w.charCodeAt(0);
                            for (i = 0; i < 8; i++) {
                                context_data_val = (context_data_val << 1) | (value & 1);
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(String.fromCharCode(context_data_val));
                                    context_data_val = 0;
                                } else {
                                    context_data_position++;
                                }
                                value = value >> 1;
                            }
                        } else {
                            value = 1;
                            for (i = 0; i < context_numBits; i++) {
                                context_data_val = (context_data_val << 1) | value;
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(String.fromCharCode(context_data_val));
                                    context_data_val = 0;
                                } else {
                                    context_data_position++;
                                }
                                value = 0;
                            }
                            value = context_w.charCodeAt(0);
                            for (i = 0; i < 16; i++) {
                                context_data_val = (context_data_val << 1) | (value & 1);
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(String.fromCharCode(context_data_val));
                                    context_data_val = 0;
                                } else {
                                    context_data_position++;
                                }
                                value = value >> 1;
                            }
                        }
                        context_enlargeIn--;
                        if (context_enlargeIn == 0) {
                            context_enlargeIn = Math.pow(2, context_numBits);
                            context_numBits++;
                        }
                        delete context_dictionaryToCreate[context_w];
                    } else {
                        value = context_dictionary[context_w];
                        for (i = 0; i < context_numBits; i++) {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(String.fromCharCode(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                    }
                    context_enlargeIn--;
                    if (context_enlargeIn == 0) {
                        context_enlargeIn = Math.pow(2, context_numBits);
                        context_numBits++;
                    }
                    context_dictionary[context_wc] = context_dictSize++;
                    context_w = String(context_c);
                }
            }

            if (context_w !== "") {
                if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                    if (context_w.charCodeAt(0) < 256) {
                        for (i = 0; i < context_numBits; i++) {
                            context_data_val = (context_data_val << 1);
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(String.fromCharCode(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                        }
                        value = context_w.charCodeAt(0);
                        for (i = 0; i < 8; i++) {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(String.fromCharCode(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                    } else {
                        value = 1;
                        for (i = 0; i < context_numBits; i++) {
                            context_data_val = (context_data_val << 1) | value;
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(String.fromCharCode(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                            value = 0;
                        }
                        value = context_w.charCodeAt(0);
                        for (i = 0; i < 16; i++) {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(String.fromCharCode(context_data_val));
                                context_data_val = 0;
                            } else {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                    }
                    context_enlargeIn--;
                    if (context_enlargeIn == 0) {
                        context_enlargeIn = Math.pow(2, context_numBits);
                        context_numBits++;
                    }
                    delete context_dictionaryToCreate[context_w];
                } else {
                    value = context_dictionary[context_w];
                    for (i = 0; i < context_numBits; i++) {
                        context_data_val = (context_data_val << 1) | (value & 1);
                        if (context_data_position == bitsPerChar - 1) {
                            context_data_position = 0;
                            context_data.push(String.fromCharCode(context_data_val));
                            context_data_val = 0;
                        } else {
                            context_data_position++;
                        }
                        value = value >> 1;
                    }
                }
                context_enlargeIn--;
                if (context_enlargeIn == 0) {
                    context_enlargeIn = Math.pow(2, context_numBits);
                    context_numBits++;
                }
            }

            value = 2;
            for (i = 0; i < context_numBits; i++) {
                context_data_val = (context_data_val << 1) | (value & 1);
                if (context_data_position == bitsPerChar - 1) {
                    context_data_position = 0;
                    context_data.push(String.fromCharCode(context_data_val));
                    context_data_val = 0;
                } else {
                    context_data_position++;
                }
                value = value >> 1;
            }

            while (true) {
                context_data_val = (context_data_val << 1);
                if (context_data_position == bitsPerChar - 1) {
                    context_data.push(String.fromCharCode(context_data_val));
                    break;
                } else context_data_position++;
            }
            return context_data.join('');
        },

        _decompress(length, resetValue, getNextValue) {
            const dictionary = [];
            let enlargeIn = 4;
            let dictSize = 4;
            let numBits = 3;
            let entry = "";
            const result = [];
            let i;
            let w;
            let bits, resb, maxpower, power;
            let c;
            const data = {val: getNextValue.charCodeAt(0), position: resetValue, index: 1};

            for (i = 0; i < 3; i += 1) {
                dictionary[i] = i;
            }

            bits = 0;
            maxpower = Math.pow(2, 2);
            power = 1;
            while (power != maxpower) {
                resb = data.val & data.position;
                data.position >>= 1;
                if (data.position == 0) {
                    data.position = resetValue;
                    data.val = getNextValue.charCodeAt(data.index++);
                }
                bits |= (resb > 0 ? 1 : 0) * power;
                power <<= 1;
            }

            const next = bits;
            switch (next) {
                case 0:
                    bits = 0;
                    maxpower = Math.pow(2, 8);
                    power = 1;
                    while (power != maxpower) {
                        resb = data.val & data.position;
                        data.position >>= 1;
                        if (data.position == 0) {
                            data.position = resetValue;
                            data.val = getNextValue.charCodeAt(data.index++);
                        }
                        bits |= (resb > 0 ? 1 : 0) * power;
                        power <<= 1;
                    }
                    c = String.fromCharCode(bits);
                    break;
                case 1:
                    bits = 0;
                    maxpower = Math.pow(2, 16);
                    power = 1;
                    while (power != maxpower) {
                        resb = data.val & data.position;
                        data.position >>= 1;
                        if (data.position == 0) {
                            data.position = resetValue;
                            data.val = getNextValue.charCodeAt(data.index++);
                        }
                        bits |= (resb > 0 ? 1 : 0) * power;
                        power <<= 1;
                    }
                    c = String.fromCharCode(bits);
                    break;
                case 2:
                    return "";
            }
            dictionary[3] = c;
            w = c;
            result.push(c);
            while (true) {
                if (data.index > length) {
                    return "";
                }

                bits = 0;
                maxpower = Math.pow(2, numBits);
                power = 1;
                while (power != maxpower) {
                    resb = data.val & data.position;
                    data.position >>= 1;
                    if (data.position == 0) {
                        data.position = resetValue;
                        data.val = getNextValue.charCodeAt(data.index++);
                    }
                    bits |= (resb > 0 ? 1 : 0) * power;
                    power <<= 1;
                }

                const cc = bits;
                switch (cc) {
                    case 0:
                        bits = 0;
                        maxpower = Math.pow(2, 8);
                        power = 1;
                        while (power != maxpower) {
                            resb = data.val & data.position;
                            data.position >>= 1;
                            if (data.position == 0) {
                                data.position = resetValue;
                                data.val = getNextValue.charCodeAt(data.index++);
                            }
                            bits |= (resb > 0 ? 1 : 0) * power;
                            power <<= 1;
                        }

                        dictionary[dictSize++] = String.fromCharCode(bits);
                        c = dictSize - 1;
                        enlargeIn--;
                        break;
                    case 1:
                        bits = 0;
                        maxpower = Math.pow(2, 16);
                        power = 1;
                        while (power != maxpower) {
                            resb = data.val & data.position;
                            data.position >>= 1;
                            if (data.position == 0) {
                                data.position = resetValue;
                                data.val = getNextValue.charCodeAt(data.index++);
                            }
                            bits |= (resb > 0 ? 1 : 0) * power;
                            power <<= 1;
                        }
                        dictionary[dictSize++] = String.fromCharCode(bits);
                        c = dictSize - 1;
                        enlargeIn--;
                        break;
                    case 2:
                        return result.join('');
                }

                if (enlargeIn == 0) {
                    enlargeIn = Math.pow(2, numBits);
                    numBits++;
                }

                if (dictionary[c]) {
                    entry = dictionary[c];
                } else {
                    if (c === dictSize) {
                        entry = w + w.charAt(0);
                    } else {
                        return null;
                    }
                }
                result.push(entry);

                dictionary[dictSize++] = w + entry.charAt(0);
                enlargeIn--;

                w = entry;

                if (enlargeIn == 0) {
                    enlargeIn = Math.pow(2, numBits);
                    numBits++;
                }
            }
        }
    }
};

/**
 * Array utilities
 */
export const ArrayUtils = {
    /**
     * Remove duplicates from array
     * @param {Array} array - Array to deduplicate
     * @param {Function|string} key - Key function or property name for comparison
     */
    unique(array, key) {
        if (!key) {
            return [...new Set(array)];
        }

        const keyFn = typeof key === 'function' ? key : item => item[key];
        const seen = new Set();
        return array.filter(item => {
            const k = keyFn(item);
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
        });
    },

    /**
     * Group array items by key
     * @param {Array} array - Array to group
     * @param {Function|string} key - Key function or property name
     */
    groupBy(array, key) {
        const keyFn = typeof key === 'function' ? key : item => item[key];
        return array.reduce((groups, item) => {
            const k = keyFn(item);
            (groups[k] = groups[k] || []).push(item);
            return groups;
        }, {});
    },

    /**
     * Chunk array into smaller arrays
     * @param {Array} array - Array to chunk
     * @param {number} size - Chunk size
     */
    chunk(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
};

/**
 * Storage utilities
 */
export const StorageUtils = {
    /**
     * Get available storage quota
     */
    async getStorageQuota() {
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            return {
                usage: estimate.usage || 0,
                quota: estimate.quota || 0,
                usageInMB: ((estimate.usage || 0) / 1024 / 1024).toFixed(2),
                quotaInMB: ((estimate.quota || 0) / 1024 / 1024).toFixed(2),
                percentUsed: estimate.quota ? ((estimate.usage / estimate.quota) * 100).toFixed(2) : 0
            };
        }
        return null;
    },

    /**
     * Request persistent storage
     */
    async requestPersistentStorage() {
        if (navigator.storage && navigator.storage.persist) {
            const isPersisted = await navigator.storage.persist();
            return isPersisted;
        }
        return false;
    }
};

/**
 * Validation utilities
 */
export const ValidationUtils = {
    /**
     * Check if email is valid
     * @param {string} email - Email to validate
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Check if URL is valid
     * @param {string} url - URL to validate
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Sanitize HTML string
     * @param {string} html - HTML to sanitize
     */
    sanitizeHtml(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }
};

/**
 * Performance utilities
 */
export const PerformanceUtils = {
    /**
     * Measure function execution time
     * @param {Function} fn - Function to measure
     * @param {string} label - Label for console output
     */
    async measureTime(fn, label = 'Execution time') {
        const start = performance.now();
        const result = await fn();
        const end = performance.now();
        console.log(`${label}: ${(end - start).toFixed(2)}ms`);
        return result;
    },

    /**
     * Create a performance observer
     * @param {Function} callback - Callback for performance entries
     */
    observePerformance(callback) {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    callback(entry);
                }
            });
            observer.observe({entryTypes: ['measure', 'navigation']});
            return observer;
        }
        return null;
    }
};

// Export individual functions for convenience
export const formatTime = TimeUtils.formatTime;
export const formatDate = TimeUtils.formatDate;
export const formatDuration = TimeUtils.formatDuration;
export const getRelativeTime = TimeUtils.getRelativeTime;
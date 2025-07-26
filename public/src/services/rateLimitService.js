// Rate Limit Service
// Implements client-side rate limiting for authentication attempts

import { getAuthRateLimit } from '../config/environment.js';

class RateLimitService {
    constructor() {
        this.attempts = new Map(); // Track attempts by key
        this.blacklist = new Map(); // Track temporary blacklisted keys
    }

    /**
     * Check if an action is allowed based on rate limits
     * @param {string} key - Unique key for the action (e.g., email, IP)
     * @param {string} action - Action type (e.g., 'login', 'register')
     * @returns {Object} { allowed: boolean, remainingAttempts: number, resetTime: Date }
     */
    checkRateLimit(key, action = 'default') {
        const config = getAuthRateLimit();
        const attemptKey = `${action}:${key}`;
        const now = Date.now();

        // Check if key is blacklisted
        const blacklistEntry = this.blacklist.get(attemptKey);
        if (blacklistEntry && blacklistEntry.until > now) {
            return {
                allowed: false,
                remainingAttempts: 0,
                resetTime: new Date(blacklistEntry.until),
                message: `Too many attempts. Please try again after ${new Date(blacklistEntry.until).toLocaleTimeString()}`
            };
        }

        // Get or create attempt record
        let attemptRecord = this.attempts.get(attemptKey);
        if (!attemptRecord || attemptRecord.windowStart + config.windowMs < now) {
            // Create new window
            attemptRecord = {
                count: 0,
                windowStart: now
            };
            this.attempts.set(attemptKey, attemptRecord);
        }

        // Check if limit exceeded
        if (attemptRecord.count >= config.maxAttempts) {
            // Add to blacklist
            const blacklistDuration = config.windowMs * 2; // Double the window for blacklist
            this.blacklist.set(attemptKey, {
                until: now + blacklistDuration
            });

            return {
                allowed: false,
                remainingAttempts: 0,
                resetTime: new Date(now + blacklistDuration),
                message: `Maximum attempts exceeded. Account temporarily locked.`
            };
        }

        // Calculate remaining attempts
        const remainingAttempts = config.maxAttempts - attemptRecord.count;
        const resetTime = new Date(attemptRecord.windowStart + config.windowMs);

        return {
            allowed: true,
            remainingAttempts,
            resetTime,
            message: remainingAttempts <= 2 ? `${remainingAttempts} attempts remaining` : null
        };
    }

    /**
     * Record an attempt
     * @param {string} key - Unique key for the action
     * @param {string} action - Action type
     * @param {boolean} success - Whether the attempt was successful
     */
    recordAttempt(key, action = 'default', success = false) {
        const attemptKey = `${action}:${key}`;
        const now = Date.now();
        const config = getAuthRateLimit();

        // If successful, clear the attempts
        if (success) {
            this.attempts.delete(attemptKey);
            this.blacklist.delete(attemptKey);
            return;
        }

        // Get or create attempt record
        let attemptRecord = this.attempts.get(attemptKey);
        if (!attemptRecord || attemptRecord.windowStart + config.windowMs < now) {
            attemptRecord = {
                count: 0,
                windowStart: now
            };
        }

        // Increment attempt count
        attemptRecord.count++;
        this.attempts.set(attemptKey, attemptRecord);

        // Store in localStorage for persistence across page reloads
        this.persistToStorage();
    }

    /**
     * Clear rate limit for a specific key
     * @param {string} key - Unique key for the action
     * @param {string} action - Action type
     */
    clearRateLimit(key, action = 'default') {
        const attemptKey = `${action}:${key}`;
        this.attempts.delete(attemptKey);
        this.blacklist.delete(attemptKey);
        this.persistToStorage();
    }

    /**
     * Persist rate limit data to localStorage
     */
    persistToStorage() {
        try {
            const data = {
                attempts: Array.from(this.attempts.entries()),
                blacklist: Array.from(this.blacklist.entries()),
                timestamp: Date.now()
            };
            localStorage.setItem('rateLimitData', JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to persist rate limit data:', error);
        }
    }

    /**
     * Load rate limit data from localStorage
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('rateLimitData');
            if (!stored) return;

            const data = JSON.parse(stored);
            const now = Date.now();
            const config = getAuthRateLimit();

            // Restore attempts (filter out expired windows)
            if (data.attempts) {
                data.attempts.forEach(([key, record]) => {
                    if (record.windowStart + config.windowMs > now) {
                        this.attempts.set(key, record);
                    }
                });
            }

            // Restore blacklist (filter out expired entries)
            if (data.blacklist) {
                data.blacklist.forEach(([key, entry]) => {
                    if (entry.until > now) {
                        this.blacklist.set(key, entry);
                    }
                });
            }
        } catch (error) {
            console.warn('Failed to load rate limit data:', error);
        }
    }

    /**
     * Clean up expired entries
     */
    cleanup() {
        const now = Date.now();
        const config = getAuthRateLimit();

        // Clean up expired attempts
        for (const [key, record] of this.attempts.entries()) {
            if (record.windowStart + config.windowMs < now) {
                this.attempts.delete(key);
            }
        }

        // Clean up expired blacklist entries
        for (const [key, entry] of this.blacklist.entries()) {
            if (entry.until < now) {
                this.blacklist.delete(key);
            }
        }

        this.persistToStorage();
    }

    /**
     * Get human-readable time until reset
     * @param {Date} resetTime - Reset time
     * @returns {string} Human-readable time string
     */
    getTimeUntilReset(resetTime) {
        const now = new Date();
        const diff = resetTime - now;

        if (diff <= 0) return 'now';

        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        if (minutes > 0) {
            return `${minutes} minute${minutes > 1 ? 's' : ''} ${seconds} second${seconds > 1 ? 's' : ''}`;
        }

        return `${seconds} second${seconds > 1 ? 's' : ''}`;
    }
}

// Create singleton instance
const rateLimitService = new RateLimitService();

// Load persisted data on initialization
rateLimitService.loadFromStorage();

// Set up periodic cleanup
setInterval(() => rateLimitService.cleanup(), 60000); // Clean up every minute

// Export service
export default rateLimitService;

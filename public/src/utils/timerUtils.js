// Timer Utilities - Helper functions for timer access
import { timerRegistry } from '../services/timerRegistry.js';

/**
 * Get the primary practice timer
 * @returns {Timer|null} The primary timer instance or null if not found
 */
export function getTimer() {
    // First try the registry
    const timer = timerRegistry.getPrimary();
    if (timer) return timer;
    
    // Try to migrate legacy timer if registry is empty
    if (timerRegistry.migrateLegacyTimer()) {
        return timerRegistry.getPrimary();
    }
    
    return null;
}

/**
 * Get a specific timer by ID
 * @param {string} id - The timer ID
 * @returns {Timer|null} The timer instance or null if not found
 */
export function getTimerById(id) {
    return timerRegistry.get(id);
}

/**
 * Register a new timer
 * @param {string} id - The timer ID
 * @param {Timer} timer - The timer instance
 * @returns {boolean} Success status
 */
export function registerTimer(id, timer) {
    return timerRegistry.register(id, timer);
}

/**
 * Check if timer sync is enabled
 * @returns {boolean} Whether timer sync is enabled
 */
export function isTimerSyncEnabled() {
    const timer = getTimer();
    return timer ? timer.syncWithAudio : false;
}

/**
 * Start the timer if it exists and isn't running
 * @returns {boolean} Whether the timer was started
 */
export function startTimerIfNeeded() {
    const timer = getTimer();
    if (timer && !timer.isRunning) {
        timer.start();
        return true;
    }
    return false;
}

/**
 * Pause the timer if it exists and is running
 * @returns {boolean} Whether the timer was paused
 */
export function pauseTimerIfNeeded() {
    const timer = getTimer();
    if (timer && timer.isRunning) {
        timer.pause();
        return true;
    }
    return false;
}

/**
 * Get timer state
 * @returns {object|null} Timer state object or null
 */
export function getTimerState() {
    const timer = getTimer();
    if (!timer) return null;
    
    return {
        isRunning: timer.isRunning,
        elapsedTime: timer.elapsedTime,
        formattedTime: timer.getFormattedTime ? timer.getFormattedTime() : '00:00:00',
        syncWithAudio: timer.syncWithAudio
    };
}

/**
 * Sync an audio component with the timer
 * @param {string} source - The source component name (e.g., 'audio', 'youtube', 'metronome')
 * @param {boolean} shouldStart - Whether to start or stop the timer
 */
export function syncTimerWithAudio(source, shouldStart) {
    const timer = getTimer();
    if (!timer || !timer.syncWithAudio) return;
    
    if (shouldStart) {
        if (!timer.isRunning) {
            console.log(`Timer sync: Starting timer from ${source}`);
            timer.start();
        }
    } else {
        if (timer.isRunning) {
            console.log(`Timer sync: Pausing timer from ${source}`);
            timer.pause();
        }
    }
}

// Export registry instance for advanced use cases
export { timerRegistry };
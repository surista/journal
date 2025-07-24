// Timer Registry Service - Centralized timer instance management
// Provides a standardized way to register, access, and manage timer instances

class TimerRegistry {
    constructor() {
        this.timers = new Map();
        this.primaryTimerId = 'practice'; // Default primary timer
        
        // For backward compatibility
        this.setupLegacyAccess();
    }
    
    // Register a timer instance with an identifier
    register(id, timerInstance) {
        if (!id || !timerInstance) {
            console.error('TimerRegistry: Invalid timer registration', { id, timerInstance });
            return false;
        }
        
        this.timers.set(id, timerInstance);
        
        // If this is the primary timer, update legacy references
        if (id === this.primaryTimerId) {
            this.updateLegacyReferences(timerInstance);
        }
        
        console.log(`TimerRegistry: Registered timer '${id}'`);
        return true;
    }
    
    // Get a timer by ID
    get(id) {
        return this.timers.get(id);
    }
    
    // Get the primary timer (most commonly used)
    getPrimary() {
        return this.timers.get(this.primaryTimerId);
    }
    
    // Set which timer should be considered primary
    setPrimary(id) {
        if (this.timers.has(id)) {
            this.primaryTimerId = id;
            this.updateLegacyReferences(this.timers.get(id));
            return true;
        }
        return false;
    }
    
    // Unregister a timer
    unregister(id) {
        const timer = this.timers.get(id);
        if (timer) {
            this.timers.delete(id);
            
            // Clean up legacy references if this was the primary timer
            if (id === this.primaryTimerId) {
                this.updateLegacyReferences(null);
            }
            
            console.log(`TimerRegistry: Unregistered timer '${id}'`);
            return true;
        }
        return false;
    }
    
    // Get all registered timers
    getAll() {
        return Array.from(this.timers.entries()).map(([id, timer]) => ({
            id,
            timer,
            isPrimary: id === this.primaryTimerId
        }));
    }
    
    // Check if a timer is registered
    has(id) {
        return this.timers.has(id);
    }
    
    // Clear all timers
    clear() {
        this.timers.clear();
        this.updateLegacyReferences(null);
    }
    
    // Setup backward compatibility with legacy timer access patterns
    setupLegacyAccess() {
        // Intercept window.currentTimer access
        Object.defineProperty(window, 'currentTimer', {
            get: () => this.getPrimary(),
            set: (timer) => {
                console.warn('Direct assignment to window.currentTimer is deprecated. Use timerRegistry.register() instead.');
                if (timer) {
                    this.register(this.primaryTimerId, timer);
                }
            },
            configurable: true
        });
    }
    
    // Update legacy references for backward compatibility
    updateLegacyReferences(timer) {
        // Update app.currentPage.timer if it exists
        if (window.app?.currentPage) {
            window.app.currentPage.timer = timer;
        }
        
        // Update unifiedPracticeMinimal.timer if it exists
        if (window.unifiedPracticeMinimal) {
            window.unifiedPracticeMinimal.timer = timer;
        }
    }
    
    // Find timer using legacy patterns (for migration)
    findTimerLegacy() {
        // Check all the old locations
        const locations = [
            () => window.currentTimer,
            () => window.app?.currentPage?.timer,
            () => window.unifiedPracticeMinimal?.timer,
            () => window.app?.currentPage?.components?.timer,
            () => window.app?.currentPage?.sharedTimer
        ];
        
        for (const getTimer of locations) {
            try {
                const timer = getTimer();
                if (timer) {
                    console.log('Found timer via legacy pattern:', getTimer.toString());
                    return timer;
                }
            } catch (e) {
                // Continue checking other locations
            }
        }
        
        return null;
    }
    
    // Helper to migrate from legacy to registry
    migrateLegacyTimer() {
        const legacyTimer = this.findTimerLegacy();
        if (legacyTimer && !this.has(this.primaryTimerId)) {
            this.register(this.primaryTimerId, legacyTimer);
            console.log('Migrated legacy timer to registry');
            return true;
        }
        return false;
    }
}

// Create singleton instance
const timerRegistry = new TimerRegistry();

// Export both the class and the singleton instance
export { TimerRegistry, timerRegistry };

// Also make it globally accessible for debugging and migration
window.timerRegistry = timerRegistry;
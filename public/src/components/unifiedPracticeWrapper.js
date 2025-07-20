// Unified Practice Wrapper - Provides a seamless integration between basic timer and unified practice
import { UnifiedPracticeMinimal } from './unifiedPracticeMinimal.js';

export class UnifiedPracticeWrapper {
    constructor(storageService, existingTimer = null) {
        this.storageService = storageService;
        this.existingTimer = existingTimer;
        this.unifiedPractice = null;
        this.container = null;
        this.useUnified = true; // Flag to control which implementation to use
    }

    init(container) {
        this.container = container;
        
        if (this.useUnified) {
            try {
                // Try to use unified practice
                this.unifiedPractice = new UnifiedPracticeMinimal(this.storageService);
                this.unifiedPractice.init(container);
                
                // If we have an existing timer, sync its state
                if (this.existingTimer && this.existingTimer.isRunning) {
                    this.unifiedPractice.timer.elapsedTime = this.existingTimer.elapsedTime;
                    this.unifiedPractice.timer.startTime = this.existingTimer.startTime;
                    this.unifiedPractice.timer.start();
                }
            } catch (error) {
                console.error('Failed to initialize unified practice:', error);
                // Fall back to basic timer
                this.useUnified = false;
                this.initBasicTimer();
            }
        } else {
            this.initBasicTimer();
        }
    }

    initBasicTimer() {
        if (this.existingTimer && this.container) {
            this.container.innerHTML = '';
            this.existingTimer.container = this.container;
            this.existingTimer.init();
        }
    }

    destroy() {
        if (this.unifiedPractice && typeof this.unifiedPractice.destroy === 'function') {
            this.unifiedPractice.destroy();
        }
        this.unifiedPractice = null;
        this.container = null;
    }

    // Proxy methods to underlying implementation
    get timer() {
        return this.useUnified && this.unifiedPractice ? this.unifiedPractice.timer : this.existingTimer;
    }
}
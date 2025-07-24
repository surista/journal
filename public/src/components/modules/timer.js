// Timer Module - Handles practice session timing
export class Timer {
    constructor() {
        this.startTime = null;
        this.elapsedTime = 0;
        this.isRunning = false;
        this.interval = null;
        this.updateCallback = null;
    }

    start() {
        if (!this.isRunning) {
            this.startTime = Date.now() - this.elapsedTime;
            this.isRunning = true;
            this.interval = setInterval(() => {
                this.elapsedTime = Date.now() - this.startTime;
                if (this.updateCallback) {
                    this.updateCallback(this.elapsedTime);
                }
            }, 100);
        }
    }

    pause() {
        if (this.isRunning) {
            clearInterval(this.interval);
            this.isRunning = false;
        }
    }

    stop() {
        clearInterval(this.interval);
        this.isRunning = false;
        this.elapsedTime = 0;
        this.startTime = null;
        if (this.updateCallback) {
            this.updateCallback(this.elapsedTime);
        }
    }

    getElapsedTime() {
        return Math.floor(this.elapsedTime / 1000);
    }

    getFormattedTime() {
        const totalSeconds = this.getElapsedTime();
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    setUpdateCallback(callback) {
        this.updateCallback = callback;
    }

    destroy() {
        clearInterval(this.interval);
        this.updateCallback = null;
    }

    // For compatibility with existing code
    getState() {
        return {
            isRunning: this.isRunning,
            elapsedTime: this.elapsedTime,
            startTime: this.startTime
        };
    }

    setState(state) {
        if (state) {
            this.isRunning = state.isRunning || false;
            this.elapsedTime = state.elapsedTime || 0;
            this.startTime = state.startTime || null;
        }
    }
}

// Export a factory function for backward compatibility
export function createTimer() {
    return new Timer();
}
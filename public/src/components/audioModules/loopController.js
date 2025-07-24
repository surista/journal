// Loop Controller Module - Handles A-B loop functionality
export class LoopController {
    constructor() {
        this.loopStart = null;
        this.loopEnd = null;
        this.isLooping = false;
        this.loopCount = 0;
        
        // Saved loops for current file
        this.savedLoops = [];
        this.currentFileName = null;
        
        // Tempo progression for loops
        this.tempoProgression = {
            enabled: false,
            incrementType: 'percentage', // 'percentage' or 'bpm'
            incrementValue: 1,
            loopInterval: 1, // After every N loops
            currentLoopCount: 0,
            maxTempo: 200, // 200% max speed
            originalTempo: 100
        };
        
        // Callbacks
        this.onLoopUpdate = null;
        this.onLoopComplete = null;
        this.onTempoChange = null;
        this.onLoopsLoaded = null;
    }

    setLoopStart(time, duration) {
        if (time < 0 || time >= duration) {
            return false;
        }

        // If setting start after current end, clear the loop and make this the new start
        if (this.loopEnd !== null && time > this.loopEnd) {
            this.loopEnd = null;
        }
        
        this.loopStart = time;
        this.updateLoopState();
        return true;
    }

    setLoopEnd(time, duration) {
        if (time <= 0 || time > duration) {
            return false;
        }

        // If setting end before current start, clear the loop and make this the new start
        if (this.loopStart !== null && time < this.loopStart) {
            this.loopStart = time;
            this.loopEnd = null;
        } else {
            this.loopEnd = time;
        }
        
        this.updateLoopState();
        return true;
    }

    clearLoop() {
        this.loopStart = null;
        this.loopEnd = null;
        this.isLooping = false;
        this.loopCount = 0;
        this.resetTempoProgression();
        this.updateLoopState();
    }

    toggleLooping() {
        if (!this.hasValidLoop()) {
            return false;
        }
        
        this.isLooping = !this.isLooping;
        
        if (!this.isLooping) {
            this.resetTempoProgression();
        }
        
        return this.isLooping;
    }

    setLooping(enabled) {
        if (enabled && !this.hasValidLoop()) {
            return false;
        }
        
        this.isLooping = enabled;
        
        if (!enabled) {
            this.resetTempoProgression();
        }
        
        return true;
    }

    hasValidLoop() {
        return this.loopStart !== null && 
               this.loopEnd !== null && 
               this.loopEnd > this.loopStart;
    }

    checkLoopBoundary(currentTime) {
        if (!this.isLooping || !this.hasValidLoop()) {
            return null;
        }

        // Check if we've passed the loop end point
        if (currentTime >= this.loopEnd) {
            this.loopCount++;
            this.handleLoopComplete();
            return this.loopStart; // Return position to seek to
        }

        // Check if we're before the loop start (e.g., after seeking)
        if (currentTime < this.loopStart) {
            return this.loopStart;
        }

        return null; // No action needed
    }

    handleLoopComplete() {
        // Notify about loop completion
        if (this.onLoopComplete) {
            this.onLoopComplete(this.loopCount);
        }

        // Handle tempo progression
        if (this.tempoProgression.enabled) {
            this.tempoProgression.currentLoopCount++;
            
            if (this.tempoProgression.currentLoopCount >= this.tempoProgression.loopInterval) {
                this.tempoProgression.currentLoopCount = 0;
                this.applyTempoProgression();
            }
        }
    }

    applyTempoProgression() {
        if (!this.onTempoChange) return;

        const currentTempo = this.getCurrentTempo();
        let newTempo = currentTempo;

        if (this.tempoProgression.incrementType === 'percentage') {
            newTempo = currentTempo * (1 + this.tempoProgression.incrementValue / 100);
        } else if (this.tempoProgression.incrementType === 'bpm') {
            // For BPM mode, we need to know the original BPM
            // This is a simplified calculation
            const bpmIncrease = this.tempoProgression.incrementValue;
            const percentIncrease = bpmIncrease / this.tempoProgression.originalTempo;
            newTempo = currentTempo * (1 + percentIncrease);
        }

        // Apply max tempo limit
        newTempo = Math.min(newTempo, this.tempoProgression.maxTempo / 100);

        if (newTempo !== currentTempo) {
            this.onTempoChange(newTempo);
        }
    }

    getCurrentTempo() {
        // This will be set by the audio player
        return 1.0; // Default 100%
    }

    setTempoProgression(settings) {
        Object.assign(this.tempoProgression, settings);
        
        if (!settings.enabled) {
            this.resetTempoProgression();
        }
    }

    resetTempoProgression() {
        this.tempoProgression.currentLoopCount = 0;
        
        // Reset tempo to original if callback is available
        if (this.onTempoChange && this.getCurrentTempo() !== 1.0) {
            this.onTempoChange(1.0);
        }
    }

    updateLoopState() {
        if (this.onLoopUpdate) {
            this.onLoopUpdate({
                loopStart: this.loopStart,
                loopEnd: this.loopEnd,
                isLooping: this.isLooping,
                hasValidLoop: this.hasValidLoop(),
                loopCount: this.loopCount
            });
        }
    }

    getLoopDuration() {
        if (!this.hasValidLoop()) {
            return 0;
        }
        return this.loopEnd - this.loopStart;
    }

    getLoopProgress(currentTime) {
        if (!this.hasValidLoop() || currentTime < this.loopStart) {
            return 0;
        }
        
        if (currentTime >= this.loopEnd) {
            return 1;
        }
        
        return (currentTime - this.loopStart) / this.getLoopDuration();
    }

    getState() {
        return {
            loopStart: this.loopStart,
            loopEnd: this.loopEnd,
            isLooping: this.isLooping,
            loopCount: this.loopCount,
            tempoProgression: { ...this.tempoProgression }
        };
    }

    setState(state) {
        if (state.loopStart !== undefined) this.loopStart = state.loopStart;
        if (state.loopEnd !== undefined) this.loopEnd = state.loopEnd;
        if (state.isLooping !== undefined) this.isLooping = state.isLooping;
        if (state.loopCount !== undefined) this.loopCount = state.loopCount;
        if (state.tempoProgression) {
            Object.assign(this.tempoProgression, state.tempoProgression);
        }
        
        this.updateLoopState();
    }

    // Format time for display
    formatTime(seconds) {
        if (seconds === null || seconds === undefined) return '--:--';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        
        return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }

    // Get loop info for display
    getLoopInfo() {
        return {
            startFormatted: this.formatTime(this.loopStart),
            endFormatted: this.formatTime(this.loopEnd),
            durationFormatted: this.formatTime(this.getLoopDuration()),
            loopCount: this.loopCount,
            isActive: this.isLooping && this.hasValidLoop()
        };
    }

    reset() {
        this.clearLoop();
        this.loopCount = 0;
        this.resetTempoProgression();
    }
    
    // Save/Load functionality
    setCurrentFile(fileName) {
        this.currentFileName = fileName;
        this.loadSavedLoops();
    }
    
    saveLoop(name) {
        if (!this.currentFileName || this.loopStart === null || this.loopEnd === null) {
            return false;
        }
        
        const loop = {
            name: name,
            start: this.loopStart,
            end: this.loopEnd,
            timestamp: Date.now()
        };
        
        // Save to storage
        const storageKey = `audio_loops_${this.currentFileName}`;
        let savedLoops = [];
        try {
            const stored = localStorage.getItem(storageKey);
            savedLoops = stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading saved loops:', e);
        }
        savedLoops.push(loop);
        localStorage.setItem(storageKey, JSON.stringify(savedLoops));
        
        this.savedLoops = savedLoops;
        
        if (this.onLoopsLoaded) {
            this.onLoopsLoaded(this.savedLoops);
        }
        
        return true;
    }
    
    loadSavedLoops() {
        if (!this.currentFileName) return;
        
        const storageKey = `audio_loops_${this.currentFileName}`;
        try {
            const stored = localStorage.getItem(storageKey);
            this.savedLoops = stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading saved loops:', e);
            this.savedLoops = [];
        }
        
        if (this.onLoopsLoaded) {
            this.onLoopsLoaded(this.savedLoops);
        }
        
        return this.savedLoops;
    }
    
    loadLoop(index) {
        if (index >= 0 && index < this.savedLoops.length) {
            const loop = this.savedLoops[index];
            this.loopStart = loop.start;
            this.loopEnd = loop.end;
            this.updateLoopState();
            return loop;
        }
        return null;
    }
    
    deleteLoop(index) {
        if (index >= 0 && index < this.savedLoops.length) {
            this.savedLoops.splice(index, 1);
            
            // Update storage
            const storageKey = `audio_loops_${this.currentFileName}`;
            localStorage.setItem(storageKey, JSON.stringify(this.savedLoops));
            
            if (this.onLoopsLoaded) {
                this.onLoopsLoaded(this.savedLoops);
            }
            
            return true;
        }
        return false;
    }
}
// Pitch and Tempo Controller Module - Handles pitch shifting and tempo adjustment
export class PitchTempoController {
    constructor() {
        // Current values
        this.playbackRate = 1.0; // 1.0 = 100% speed
        this.pitchShift = 0; // in semitones
        this.preservePitch = true; // Whether to preserve pitch when changing tempo
        
        // Limits
        this.minSpeed = 0.25; // 25%
        this.maxSpeed = 4.0; // 400%
        this.minPitch = -24; // -2 octaves
        this.maxPitch = 24; // +2 octaves
        
        // Presets
        this.speedPresets = [0.5, 0.75, 1.0, 1.25, 1.5];
        this.pitchPresets = [-12, -7, -5, -3, -2, -1, 0, 1, 2, 3, 5, 7, 12];
        
        // Callbacks
        this.onSpeedChange = null;
        this.onPitchChange = null;
        this.onPreservePitchChange = null;
    }

    // Speed/Tempo controls
    setSpeed(speed) {
        const newSpeed = this.clampSpeed(speed);
        if (newSpeed !== this.playbackRate) {
            this.playbackRate = newSpeed;
            if (this.onSpeedChange) {
                this.onSpeedChange(newSpeed);
            }
        }
        return newSpeed;
    }

    adjustSpeed(delta) {
        return this.setSpeed(this.playbackRate + delta);
    }

    increaseSpeed(amount = 0.05) {
        return this.adjustSpeed(amount);
    }

    decreaseSpeed(amount = 0.05) {
        return this.adjustSpeed(-amount);
    }

    resetSpeed() {
        return this.setSpeed(1.0);
    }

    setSpeedPercent(percent) {
        return this.setSpeed(percent / 100);
    }

    getSpeedPercent() {
        return Math.round(this.playbackRate * 100);
    }

    // Pitch controls
    setPitch(semitones) {
        const newPitch = this.clampPitch(semitones);
        if (newPitch !== this.pitchShift) {
            this.pitchShift = newPitch;
            if (this.onPitchChange) {
                this.onPitchChange(newPitch);
            }
        }
        return newPitch;
    }

    adjustPitch(delta) {
        return this.setPitch(this.pitchShift + delta);
    }

    increasePitch(semitones = 1) {
        return this.adjustPitch(semitones);
    }

    decreasePitch(semitones = 1) {
        return this.adjustPitch(-semitones);
    }

    resetPitch() {
        return this.setPitch(0);
    }

    transposeUp() {
        return this.increasePitch(1);
    }

    transposeDown() {
        return this.decreasePitch(1);
    }

    // Octave controls
    octaveUp() {
        return this.increasePitch(12);
    }

    octaveDown() {
        return this.decreasePitch(12);
    }

    // Preset controls
    applySpeedPreset(presetIndex) {
        if (presetIndex >= 0 && presetIndex < this.speedPresets.length) {
            return this.setSpeed(this.speedPresets[presetIndex]);
        }
        return this.playbackRate;
    }

    applyPitchPreset(presetIndex) {
        if (presetIndex >= 0 && presetIndex < this.pitchPresets.length) {
            return this.setPitch(this.pitchPresets[presetIndex]);
        }
        return this.pitchShift;
    }

    // Find nearest preset
    getNearestSpeedPreset() {
        let nearest = 0;
        let minDiff = Math.abs(this.playbackRate - this.speedPresets[0]);
        
        for (let i = 1; i < this.speedPresets.length; i++) {
            const diff = Math.abs(this.playbackRate - this.speedPresets[i]);
            if (diff < minDiff) {
                minDiff = diff;
                nearest = i;
            }
        }
        
        return nearest;
    }

    getNearestPitchPreset() {
        let nearest = 0;
        let minDiff = Math.abs(this.pitchShift - this.pitchPresets[0]);
        
        for (let i = 1; i < this.pitchPresets.length; i++) {
            const diff = Math.abs(this.pitchShift - this.pitchPresets[i]);
            if (diff < minDiff) {
                minDiff = diff;
                nearest = i;
            }
        }
        
        return nearest;
    }

    // Preserve pitch toggle
    setPreservePitch(preserve) {
        if (this.preservePitch !== preserve) {
            this.preservePitch = preserve;
            if (this.onPreservePitchChange) {
                this.onPreservePitchChange(preserve);
            }
        }
    }

    togglePreservePitch() {
        this.setPreservePitch(!this.preservePitch);
        return this.preservePitch;
    }

    // Utility methods
    clampSpeed(speed) {
        return Math.max(this.minSpeed, Math.min(this.maxSpeed, speed));
    }

    clampPitch(pitch) {
        return Math.max(this.minPitch, Math.min(this.maxPitch, pitch));
    }

    // Get formatted values for display
    getSpeedDisplay() {
        const percent = this.getSpeedPercent();
        return `${percent}%`;
    }

    getPitchDisplay() {
        if (this.pitchShift === 0) return '0';
        return this.pitchShift > 0 ? `+${this.pitchShift}` : `${this.pitchShift}`;
    }

    getPitchNote() {
        // Convert semitones to musical notation
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const octaveShift = Math.floor(Math.abs(this.pitchShift) / 12);
        const noteShift = Math.abs(this.pitchShift) % 12;
        
        if (this.pitchShift === 0) return '';
        
        const direction = this.pitchShift > 0 ? '↑' : '↓';
        let notation = direction;
        
        if (octaveShift > 0) {
            notation += ` ${octaveShift} oct`;
        }
        
        if (noteShift > 0) {
            if (octaveShift > 0) notation += ' + ';
            notation += `${noteShift} st`;
        }
        
        return notation;
    }

    // Calculate combined pitch effect (when tempo affects pitch)
    getCombinedPitch() {
        if (this.preservePitch) {
            return this.pitchShift;
        }
        
        // When pitch is not preserved, tempo change affects pitch
        // This is a simplified calculation - actual relationship is complex
        const tempoRatio = this.playbackRate;
        const tempoPitchShift = 12 * Math.log2(tempoRatio);
        
        return this.pitchShift + tempoPitchShift;
    }

    // State management
    getState() {
        return {
            playbackRate: this.playbackRate,
            pitchShift: this.pitchShift,
            preservePitch: this.preservePitch
        };
    }

    setState(state) {
        if (state.playbackRate !== undefined) {
            this.setSpeed(state.playbackRate);
        }
        if (state.pitchShift !== undefined) {
            this.setPitch(state.pitchShift);
        }
        if (state.preservePitch !== undefined) {
            this.setPreservePitch(state.preservePitch);
        }
    }

    // Reset all values
    reset() {
        this.resetSpeed();
        this.resetPitch();
        this.setPreservePitch(true);
    }

    // Get info for display
    getInfo() {
        return {
            speed: this.playbackRate,
            speedPercent: this.getSpeedPercent(),
            speedDisplay: this.getSpeedDisplay(),
            pitch: this.pitchShift,
            pitchDisplay: this.getPitchDisplay(),
            pitchNote: this.getPitchNote(),
            preservePitch: this.preservePitch,
            isDefaultSpeed: this.playbackRate === 1.0,
            isDefaultPitch: this.pitchShift === 0
        };
    }
}
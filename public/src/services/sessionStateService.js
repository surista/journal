// Session State Service - Preserves practice session state across refreshes
export class SessionStateService {
    constructor() {
        this.STATE_KEY = 'practiceSessionState';
        this.EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes
    }

    // Save current session state
    saveState(state) {
        const sessionData = {
            ...state,
            timestamp: Date.now(),
            version: '1.0'
        };

        try {
            sessionStorage.setItem(this.STATE_KEY, JSON.stringify(sessionData));
            return true;
        } catch (error) {
            console.error('Failed to save session state:', error);
            return false;
        }
    }

    // Restore session state
    getState() {
        try {
            const savedState = sessionStorage.getItem(this.STATE_KEY);
            if (!savedState) return null;

            const state = JSON.parse(savedState);

            // Check if state is expired
            if (Date.now() - state.timestamp > this.EXPIRY_TIME) {
                this.clearState();
                return null;
            }

            return state;
        } catch (error) {
            console.error('Failed to restore session state:', error);
            return null;
        }
    }

    // Clear session state
    clearState() {
        try {
            sessionStorage.removeItem(this.STATE_KEY);
        } catch (error) {
            console.error('Failed to clear session state:', error);
        }
    }

    // Save audio session state
    saveAudioState(audioData) {
        const state = {
            mode: 'audio',
            audio: {
                fileName: audioData.fileName,
                fileUrl: audioData.fileUrl,
                currentTime: audioData.currentTime || 0,
                speed: audioData.speed || 1,
                pitch: audioData.pitch || 0,
                volume: audioData.volume || 1,
                loopStart: audioData.loopStart,
                loopEnd: audioData.loopEnd,
                loopEnabled: audioData.loopEnabled || false,
                isPlaying: audioData.isPlaying || false
            },
            timer: {
                elapsedTime: audioData.timerElapsedTime || 0,
                isRunning: audioData.timerRunning || false
            },
            metronome: {
                bpm: audioData.metronomeBpm || 120,
                isPlaying: audioData.metronomeIsPlaying || false
            }
        };

        return this.saveState(state);
    }

    // Save YouTube session state
    saveYouTubeState(youtubeData) {
        const state = {
            mode: 'youtube',
            youtube: {
                videoId: youtubeData.videoId,
                videoUrl: youtubeData.videoUrl,
                videoTitle: youtubeData.videoTitle,
                currentTime: youtubeData.currentTime || 0,
                speed: youtubeData.speed || 1,
                volume: youtubeData.volume || 1,
                loopStart: youtubeData.loopStart,
                loopEnd: youtubeData.loopEnd,
                loopEnabled: youtubeData.loopEnabled || false,
                isPlaying: youtubeData.isPlaying || false
            },
            timer: {
                elapsedTime: youtubeData.timerElapsedTime || 0,
                isRunning: youtubeData.timerRunning || false
            },
            metronome: {
                bpm: youtubeData.metronomeBpm || 120,
                isPlaying: youtubeData.metronomeIsPlaying || false
            }
        };

        return this.saveState(state);
    }

    // Monitor for refresh/navigation
    setupBeforeUnloadHandler(getStateCallback) {
        window.addEventListener('beforeunload', (event) => {
            // Save current state before page unloads
            if (getStateCallback && typeof getStateCallback === 'function') {
                const currentState = getStateCallback();
                if (currentState) {
                    this.saveState(currentState);
                }
            }

            // Don't show confirmation dialog unless there's active content
            const state = this.getState();
            if (state && (state.mode === 'audio' || state.mode === 'youtube')) {
                // Note: Modern browsers may ignore custom messages
                event.preventDefault();
                event.returnValue = '';
            }
        });
    }
}

// Export singleton instance
export const sessionStateService = new SessionStateService();

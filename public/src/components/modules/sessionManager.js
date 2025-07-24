// Session Manager Module - Handles saving and restoring practice sessions
import { sessionStateService } from '../../services/sessionStateService.js';
import { notificationManager } from '../../services/notificationManager.js';

export class SessionManager {
    constructor(storageService) {
        this.storageService = storageService;
        this.sessionStateService = sessionStateService;
        this.currentSessionData = null;
        this.autoSaveEnabled = true;
        this.autoSaveInterval = null;
    }

    initialize() {
        // Set up auto-save if enabled
        if (this.autoSaveEnabled) {
            this.startAutoSave();
        }
    }

    getCurrentSessionState(components) {
        const state = {
            timestamp: Date.now(),
            duration: components.timer ? components.timer.getElapsedTime() : 0,
            mode: components.currentMode || 'metronome',
            data: {}
        };

        // Timer state
        if (components.timer) {
            state.data.timer = components.timer.getState();
        }

        // Mode-specific state
        switch (state.mode) {
            case 'metronome':
                if (components.metronome) {
                    state.data.metronome = components.metronome.getState();
                }
                if (components.imageManager) {
                    state.data.image = components.imageManager.getState();
                }
                break;
                
            case 'audio':
                if (components.audioPlayer) {
                    state.data.audio = components.audioPlayer.getState();
                }
                break;
                
            case 'youtube':
                if (components.youtubePlayer) {
                    state.data.youtube = components.youtubePlayer.getState();
                }
                break;
        }

        return state;
    }

    async saveSession(name, duration, components) {
        try {
            const session = {
                id: Date.now(),
                name: name || this.generateSessionName(),
                date: new Date().toISOString(),
                duration: duration,
                state: this.getCurrentSessionState(components)
            };

            // Add session-specific data based on current mode
            if (components.currentMode === 'metronome' && components.metronome) {
                session.bpm = components.metronome.state.bpm;
                session.timeSignature = components.metronome.state.timeSignature;
                
                // Include image if present
                if (components.imageManager && components.imageManager.currentImage) {
                    session.image = components.imageManager.currentImage;
                }
            } else if (components.currentMode === 'audio' && components.audioPlayer) {
                session.audioFileName = components.audioPlayer.currentFile?.name;
            } else if (components.currentMode === 'youtube' && components.youtubePlayer) {
                session.youtubeVideoId = components.youtubePlayer.videoId;
                session.youtubeVideoTitle = components.youtubePlayer.videoTitle;
            }

            // Save to storage
            await this.storageService.addSession(session);

            // Show success notification
            this.showNotification(`Session "${session.name}" saved successfully!`, 'success');

            return session;
        } catch (error) {
            console.error('Error saving session:', error);
            this.showNotification('Failed to save session', 'error');
            return null;
        }
    }

    async restoreSession(sessionId, components) {
        try {
            const sessions = await this.storageService.getSessions();
            const session = sessions.find(s => s.id === sessionId);
            
            if (!session || !session.state) {
                throw new Error('Session not found or invalid');
            }

            const state = session.state;

            // Restore timer
            if (state.data.timer && components.timer) {
                components.timer.setState(state.data.timer);
            }

            // Restore mode
            if (state.mode && components.switchMode) {
                components.switchMode(state.mode);
            }

            // Restore mode-specific state
            switch (state.mode) {
                case 'metronome':
                    if (state.data.metronome && components.metronome) {
                        components.metronome.setState(state.data.metronome);
                    }
                    if (state.data.image && components.imageManager) {
                        components.imageManager.setState(state.data.image);
                    }
                    break;
                    
                case 'audio':
                    if (state.data.audio && components.audioPlayer) {
                        components.audioPlayer.setState(state.data.audio);
                    }
                    break;
                    
                case 'youtube':
                    if (state.data.youtube && components.youtubePlayer) {
                        components.youtubePlayer.setState(state.data.youtube);
                    }
                    break;
            }

            this.showNotification('Session restored successfully', 'success');
            return true;
        } catch (error) {
            console.error('Error restoring session:', error);
            this.showNotification('Failed to restore session', 'error');
            return false;
        }
    }

    persistCurrentState(components) {
        if (!this.sessionStateService || !this.sessionStateService.saveState) {
            console.warn('SessionStateService not available');
            return;
        }
        
        const state = this.getCurrentSessionState(components);
        this.sessionStateService.saveState(state);
    }

    async checkForRestorable(components) {
        if (!this.sessionStateService || !this.sessionStateService.getState) {
            console.warn('SessionStateService not available');
            return;
        }
        
        const savedState = this.sessionStateService.getState();
        
        if (savedState && savedState.duration > 0) {
            const timeSinceSession = Date.now() - savedState.timestamp;
            const fiveMinutes = 5 * 60 * 1000;
            
            if (timeSinceSession < fiveMinutes) {
                const shouldRestore = await this.showRestorePrompt(savedState.duration);
                
                if (shouldRestore) {
                    this.restorePersistedState(savedState, components);
                } else {
                    this.sessionStateService.clearState();
                }
            }
        }
    }

    restorePersistedState(state, components) {
        if (!state || !state.data) return;

        // Restore timer
        if (state.data.timer && components.timer) {
            components.timer.setState(state.data.timer);
            components.updateTimerDisplay();
        }

        // Restore mode
        if (state.mode && components.switchMode) {
            components.switchMode(state.mode);
        }

        // Restore mode-specific state
        switch (state.mode) {
            case 'metronome':
                if (state.data.metronome && components.metronome) {
                    components.metronome.setState(state.data.metronome);
                }
                if (state.data.image && components.imageManager) {
                    components.imageManager.setState(state.data.image);
                }
                break;
                
            case 'audio':
                if (state.data.audio && components.audioPlayer) {
                    components.audioPlayer.setState(state.data.audio);
                }
                break;
                
            case 'youtube':
                if (state.data.youtube && components.youtubePlayer) {
                    components.youtubePlayer.setState(state.data.youtube);
                }
                break;
        }

        this.showNotification('Previous session restored', 'info');
    }

    async showRestorePrompt(duration) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'restore-session-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3>Restore Previous Session?</h3>
                    <p>You had a session in progress (${this.formatDuration(duration)} elapsed).</p>
                    <p>Would you like to continue where you left off?</p>
                    <div class="button-group">
                        <button class="btn btn-primary" id="restoreYes">Yes, Restore</button>
                        <button class="btn btn-secondary" id="restoreNo">No, Start Fresh</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            document.getElementById('restoreYes').addEventListener('click', () => {
                modal.remove();
                resolve(true);
            });

            document.getElementById('restoreNo').addEventListener('click', () => {
                modal.remove();
                resolve(false);
            });
        });
    }

    startAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        // Auto-save every 30 seconds
        this.autoSaveInterval = setInterval(() => {
            if (this.onAutoSaveCallback) {
                this.onAutoSaveCallback();
            }
        }, 30000);
    }

    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    generateSessionName() {
        const date = new Date();
        const timeStr = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        return `Practice ${timeStr}`;
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    showNotification(message, type = 'info') {
        if (notificationManager) {
            notificationManager.show(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }

    setAutoSaveCallback(callback) {
        this.onAutoSaveCallback = callback;
    }

    destroy() {
        this.stopAutoSave();
        this.onAutoSaveCallback = null;
    }
}
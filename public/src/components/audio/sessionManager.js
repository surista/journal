// src/components/audio/sessionManager.js
import { escapeHtml } from '../../utils/sanitizer.js';

export class SessionManager {
    constructor(audioPlayer) {
        this.player = audioPlayer;
    }

    attachEventListeners() {
        // Event listener is now attached in audioPlayer.js to avoid duplication
        console.log('SessionManager event listeners ready');
    }

    loadSavedSessions() {
        if (!this.player.storageService) {
            if (!this.player.ensureStorageService()) {
                return;
            }
        }

        // Determine current file name - MUST MATCH saving logic exactly
        let fileName;
        if (this.player.isYouTubeMode) {
            // Use the same logic as saving: video ID as primary key
            fileName = this.player.youtubeVideoId || 'youtube_video';
            console.log('Loading sessions for YouTube video ID:', fileName);
        } else if (this.player.currentFileName) {
            fileName = this.player.currentFileName;
            console.log('Loading sessions for file:', fileName);
        } else {
            console.log('No file loaded, cannot load sessions');
            return; // No file loaded
        }

        console.log('Attempting to load sessions for fileName:', fileName);
        const sessions = this.player.storageService.getAudioSessions?.(fileName) || [];
        console.log('Found sessions:', sessions);

        const container = document.getElementById('savedSessionsList');
        if (!container) {
            console.error('savedSessionsList container not found');
            return;
        }

        if (sessions.length === 0) {
            console.log('No sessions found, showing empty state');
            container.innerHTML = '<p class="empty-state" style="color: var(--text-secondary); text-align: center; font-size: 11px; margin: 0; padding: 8px;">No saved loops</p>';
            return;
        }

        console.log('Rendering', sessions.length, 'sessions');

        // Create compact session display
        container.innerHTML = sessions.map((session, index) => `
        <div class="saved-session-item" style="
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 8px;
            margin-bottom: 6px;
            font-size: 11px;
        ">
            <div style="display: grid; grid-template-columns: 1fr auto auto; gap: 4px; align-items: center;">
                <div class="session-info" style="overflow: hidden;">
                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left;">
                        ${session.name || `Session ${index + 1}`}
                    </div>
                 <div style="color: var(--text-secondary); font-size: 10px;">
                Speed: ${session.speed}% | Pitch: ${session.pitch > 0 ? '+' : ''}${session.pitch}
                ${session.loopStart !== null ? ` | ${this.player.formatTime(session.loopStart)}-${this.player.formatTime(session.loopEnd)}` : ''}
                ${session.notes ? `<br>📝 ${session.notes}` : ''}
                ${session.isYouTubeMode && session.youtubeVideoUrl ? `<br>🔗 <a href="${session.youtubeVideoUrl}" target="_blank" style="color: var(--primary); text-decoration: none; font-size: 9px;">${session.youtubeVideoUrl}</a>` : ''}
                </div>
                </div>
                <button class="btn btn-xs btn-primary load-session-btn" data-index="${index}"
                        style="padding: 2px 6px; font-size: 10px; min-width: 35px;">
                    Load
                </button>
                <button class="btn btn-xs btn-danger delete-session-btn" data-index="${index}"
                        style="padding: 2px 6px; font-size: 10px; min-width: 25px;">
                    ×
                </button>
            </div>
        </div>
    `).join('');

        // Attach event listeners to the dynamically created buttons
        container.querySelectorAll('.load-session-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                console.log('Loading session at index:', index);
                this.loadSession(index);
            });
        });

        container.querySelectorAll('.delete-session-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                console.log('Deleting session at index:', index);
                this.deleteSession(index);
            });
        });

        console.log('Sessions rendered and event listeners attached');
    }

    loadSession(index) {
        if (!this.player.storageService || (!this.player.currentFileName && !this.player.isYouTubeMode)) {
            this.player.showNotification('Storage service not available', 'error');
            return;
        }

        // Handle both YouTube and file mode
        const fileName = this.player.isYouTubeMode ?
            (this.player.youtubeVideoTitle || this.player.youtubeVideoId || 'youtube_video') :
            this.player.currentFileName;

        const sessions = this.player.storageService.getAudioSessions?.(fileName) || [];
        const session = sessions[index];

        if (!session) {
            this.player.showNotification('Session not found', 'error');
            return;
        }

        console.log('Loading session:', session);

        // Stop current playback
        this.player.stop();

        // Apply speed/tempo settings
        if (session.speed !== undefined) {
            this.player.setSpeed(session.speed);
            const speedSlider = document.getElementById('speedSlider');
            if (speedSlider) speedSlider.value = session.speed;
        }

        // Apply pitch settings
        if (session.pitch !== undefined) {
            this.player.setPitch(session.pitch);
        }

        // Apply loop settings
        this.player.loopStart = session.loopStart !== undefined ? session.loopStart : null;
        this.player.loopEnd = session.loopEnd !== undefined ? session.loopEnd : null;
        this.player.isLooping = session.loopEnabled || false;

        // Update UI elements
        const loopStartEl = document.getElementById('loopStart');
        const loopEndEl = document.getElementById('loopEnd');
        const loopEnabledEl = document.getElementById('loopEnabled');

        if (loopStartEl) {
            loopStartEl.textContent = this.player.loopStart !== null ? this.player.formatTime(this.player.loopStart) : '--:--';
        }
        if (loopEndEl) {
            loopEndEl.textContent = this.player.loopEnd !== null ? this.player.formatTime(this.player.loopEnd) : '--:--';
        }
        if (loopEnabledEl) {
            loopEnabledEl.checked = this.player.isLooping;
        }

        // Update tempo progression settings if they exist
        if (session.tempoProgression) {
            const progressionEnabledEl = document.getElementById('progressionEnabled');
            const incrementValueEl = document.getElementById('incrementValue');
            const incrementTypeEl = document.getElementById('incrementType');
            const loopIntervalEl = document.getElementById('loopInterval');
            const progressionControlsEl = document.getElementById('progressionControls');

            if (progressionEnabledEl) {
                progressionEnabledEl.checked = session.tempoProgression.enabled || false;
                this.player.tempoProgression.enabled = session.tempoProgression.enabled || false;
            }
            if (incrementValueEl && session.tempoProgression.incrementValue !== undefined) {
                incrementValueEl.value = session.tempoProgression.incrementValue;
                this.player.tempoProgression.incrementValue = session.tempoProgression.incrementValue;
            }
            if (incrementTypeEl && session.tempoProgression.incrementType) {
                incrementTypeEl.value = session.tempoProgression.incrementType;
                this.player.tempoProgression.incrementType = session.tempoProgression.incrementType;
            }
            if (loopIntervalEl && session.tempoProgression.loopInterval !== undefined) {
                loopIntervalEl.value = session.tempoProgression.loopInterval;
                this.player.tempoProgression.loopInterval = session.tempoProgression.loopInterval;
            }
            if (progressionControlsEl) {
                progressionControlsEl.style.display = this.player.tempoProgression.enabled ? 'grid' : 'none';
            }
        }

        // Update visual indicators
        this.player.updateLoopRegion();

        if (this.player.waveformVisualizer && !this.player.isYouTubeMode) {
            this.player.waveformVisualizer.updateLoopMarkers(this.player.loopStart, this.player.loopEnd);
        }

        if (this.player.isYouTubeMode) {
            this.player.updateYouTubeLoopMarkers();
        }

        // Update progression status
        this.player.updateProgressionStatus();

        this.player.showNotification(`Session "${session.name || 'Unnamed'}" loaded successfully! 🎵`, 'success');
    }

    saveCurrentSession() {
        console.log('Save button clicked - starting saveCurrentSession');
        console.log('Current state:', {
            loopStart: this.player.loopStart,
            loopEnd: this.player.loopEnd,
            currentFileName: this.player.currentFileName,
            isYouTubeMode: this.player.isYouTubeMode,
            storageService: !!this.player.storageService
        });

        // Check if we have any audio source loaded
        const hasAudioSource = this.player.currentFileName || this.player.isYouTubeMode;

        if (!hasAudioSource) {
            this.player.showNotification('No audio file or YouTube video loaded', 'error');
            return;
        }

        // Loop validation - now optional
        if (this.player.loopStart === null && this.player.loopEnd === null) {
            this.player.showNotification('No loop points set. Setting full track as loop.', 'info');
            console.log('No loop points set, will use full track');
            // Don't return - allow saving without loop points
        }

        if (!this.player.ensureStorageService()) {
            this.player.showNotification('Storage service not available. Please refresh the page.', 'error');
            console.error('Storage service check failed');
            return;
        }
        
        console.log('Storage service check passed, showing modal...');

        // Show save modal for BOTH audio files AND YouTube videos
        this.showSaveLoopModal();
    }

    showSaveLoopModal() {
        console.log('showSaveLoopModal called');
        // Get current source information (works for both audio files and YouTube)
        const isYouTubeMode = this.player.isYouTubeMode;
        const sourceName = escapeHtml(isYouTubeMode
            ? (this.player.youtubeVideoTitle || `YouTube: ${this.player.youtubeVideoId}` || 'YouTube Video')
            : (this.player.currentFileName || 'Unknown'));

        const sourceType = isYouTubeMode ? 'YouTube Video' : 'Audio File';
        const sourceIcon = isYouTubeMode ? '🎬' : '🎵';

        const loopStart = this.player.loopStart;
        const loopEnd = this.player.loopEnd;
        const currentSpeed = Math.round(this.player.playbackRate * 100);
        const currentPitch = this.player.pitchShiftAmount;
        
        console.log('Modal info:', {
            isYouTubeMode,
            sourceName,
            loopStart,
            loopEnd,
            currentSpeed,
            currentPitch,
            playbackRate: this.player.playbackRate,
            pitchShiftAmount: this.player.pitchShiftAmount
        });

        // Create modal HTML with inline styles as fallback
        const modalHTML = `
        <div class="save-loop-modal" id="saveLoopModal" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(4px);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <div class="save-loop-modal-content" style="
                background: var(--bg-card, #1f2937);
                border: 1px solid var(--border, #374151);
                border-radius: 12px;
                padding: 2rem;
                width: 90%;
                max-width: 500px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            ">
                <h3>💾 Save Loop Session</h3>
                
                <div class="save-loop-info">
                     <div class="save-loop-info-row">
                        <span class="save-loop-info-label">${sourceType}:</span>
                        <span class="save-loop-info-value" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 300px;" title="${sourceName}">${sourceIcon} ${sourceName}</span>
                    </div>
                    ${isYouTubeMode ? `
                    <div class="save-loop-info-row">
                        <span class="save-loop-info-label">URL:</span>
                        <span class="save-loop-info-value" style="font-size: 9px; word-break: break-all;">${escapeHtml(this.player.youtubeVideoUrl || 'Unknown')}</span>
                    </div>
                    ` : ''}
                    <div class="save-loop-info-row">
                        <span class="save-loop-info-label">Loop Start:</span>
                        <span class="save-loop-info-value">${loopStart !== null ? escapeHtml(this.player.formatTime(loopStart)) : 'Not set'}</span>
                    </div>
                    <div class="save-loop-info-row">
                        <span class="save-loop-info-label">Loop End:</span>
                        <span class="save-loop-info-value">${loopEnd !== null ? escapeHtml(this.player.formatTime(loopEnd)) : 'Not set'}</span>
                    </div>
                    <div class="save-loop-info-row">
                        <span class="save-loop-info-label">Speed:</span>
                        <span class="save-loop-info-value">${escapeHtml(currentSpeed)}%</span>
                    </div>
                    <div class="save-loop-info-row">
                        <span class="save-loop-info-label">Pitch:</span>
                        <span class="save-loop-info-value">${currentPitch > 0 ? '+' : ''}${escapeHtml(currentPitch)} semitones</span>
                    </div>
                </div>

                <div class="save-loop-form-group">
                    <label for="loopSessionName">Session Name:</label>
                    <input type="text" id="loopSessionName" placeholder="e.g., Intro, Solo, Verse, Chorus" 
                           value="${escapeHtml(this.generateDefaultSessionName())}" maxlength="50">
                </div>

                <div class="save-loop-form-group">
                    <label for="loopSessionNotes">Notes (optional):</label>
                    <textarea id="loopSessionNotes" placeholder="Add any notes about this loop section (tempo changes, techniques, etc.)" maxlength="200"></textarea>
                </div>

                <div class="save-loop-buttons">
                    <button class="btn btn-secondary" id="cancelSaveLoop">
                        Cancel
                    </button>
                    <button class="btn btn-primary" id="confirmSaveLoop">
                        💾 Save Loop
                    </button>
                </div>
            </div>
        </div>
    `;

        try {
            // Remove any existing modal first
            const existingModal = document.getElementById('saveLoopModal');
            if (existingModal) {
                existingModal.remove();
                console.log('Removed existing modal');
            }
            
            // Add modal to page
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            console.log('Modal HTML inserted');
            
            // Verify modal was added
            const newModal = document.getElementById('saveLoopModal');
            console.log('Modal found after insert:', !!newModal);

            // Add event listeners
            this.attachModalEventListeners();

            // Focus on the name input
            setTimeout(() => {
                const nameInput = document.getElementById('loopSessionName');
                if (nameInput) {
                    nameInput.focus();
                    nameInput.select();
                }
            }, 100);
        } catch (error) {
            console.error('Error creating save loop modal:', error);
            console.error('Modal HTML:', modalHTML);
        }
    }

    attachModalEventListeners() {
        const modal = document.getElementById('saveLoopModal');
        const confirmBtn = document.getElementById('confirmSaveLoop');
        const nameInput = document.getElementById('loopSessionName');

        console.log('Attaching modal event listeners:', {
            modal: !!modal,
            confirmBtn: !!confirmBtn,
            nameInput: !!nameInput
        });

        if (!modal || !confirmBtn || !nameInput) {
            console.error('Modal elements not found');
            return;
        }

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('saveLoopModal')) {
                modal.remove();
            }
        });

        // Save on Enter key in name input
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.confirmSaveLoop();
            }
        });

        // Save button click
        confirmBtn.addEventListener('click', () => {
            console.log('Save button clicked in modal');
            this.confirmSaveLoop();
        });
        
        // Cancel button
        const cancelBtn = document.getElementById('cancelSaveLoop');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modal.remove();
            });
        }
    }

    confirmSaveLoop() {
        // Loop points are now optional - we can save without them
        console.log('Confirming save loop...');
        const modal = document.getElementById('saveLoopModal');
        const nameInput = document.getElementById('loopSessionName');
        const notesInput = document.getElementById('loopSessionNotes');

        console.log('Modal elements in confirmSaveLoop:', {
            modal: !!modal,
            nameInput: !!nameInput,
            notesInput: !!notesInput
        });

        if (!modal || !nameInput) {
            console.error('Required modal elements not found');
            return;
        }

        const sessionName = nameInput.value.trim();
        const sessionNotes = notesInput ? notesInput.value.trim() : '';

        console.log('Session details:', { sessionName, sessionNotes });

        if (!sessionName) {
            console.log('No session name provided');
            nameInput.focus();
            nameInput.style.borderColor = 'var(--danger)';
            setTimeout(() => {
                nameInput.style.borderColor = '';
            }, 2000);
            return;
        }

        // Create session object for BOTH audio files and YouTube videos
        let fileName, displayName;

        if (this.player.isYouTubeMode) {
            // YouTube video
            fileName = this.player.youtubeVideoId || 'youtube_unknown';
            displayName = this.player.youtubeVideoTitle || `YouTube: ${this.player.youtubeVideoId}` || 'YouTube Video';
        } else {
            // Audio file
            fileName = this.player.currentFileName;
            displayName = this.player.currentFileName;
        }

        const session = {
            name: sessionName,
            notes: sessionNotes,
            timestamp: Date.now(),
            fileName: fileName,
            speed: Math.round(this.player.playbackRate * 100),
            pitch: this.player.pitchShiftAmount,
            loopStart: this.player.loopStart,
            loopEnd: this.player.loopEnd,
            loopEnabled: this.player.isLooping,
            tempoProgression: {
                enabled: this.player.tempoProgression.enabled,
                incrementValue: this.player.tempoProgression.incrementValue,
                incrementType: this.player.tempoProgression.incrementType,
                loopInterval: this.player.tempoProgression.loopInterval
            },
            // Include YouTube-specific data if applicable
            isYouTubeMode: this.player.isYouTubeMode,
            youtubeVideoId: this.player.youtubeVideoId || null,
            youtubeVideoTitle: this.player.youtubeVideoTitle || null,
            youtubeVideoUrl: this.player.youtubeVideoUrl || null
        };

        if (!fileName || fileName === 'youtube_unknown') {
            this.player.showNotification('Unable to save - source information not available', 'error');
            return;
        }

        try {
            console.log('Attempting to save session:', {
                fileName,
                session,
                hasStorageService: !!this.player.storageService,
                hasSaveMethod: !!(this.player.storageService?.saveAudioSession)
            });
            
            if (this.player.storageService && this.player.storageService.saveAudioSession) {
                const result = this.player.storageService.saveAudioSession(fileName, session);
                console.log('Save result:', result);
                
                this.loadSavedSessions();

                const sourceType = this.player.isYouTubeMode ? 'YouTube loop' : 'Audio loop';
                this.player.showNotification(`${sourceType} "${sessionName}" saved successfully! 💾`, 'success');
                modal.remove();
            } else {
                console.error('Storage service or save method not available:', {
                    storageService: this.player.storageService,
                    saveMethod: this.player.storageService?.saveAudioSession
                });
                throw new Error('Storage service not available');
            }
        } catch (error) {
            console.error('Error saving session:', error);
            this.player.showNotification('Failed to save session: ' + error.message, 'error');
        }
    }

    generateDefaultSessionName() {
        const loopStart = this.player.loopStart;
        const loopEnd = this.player.loopEnd;
        const isYouTubeMode = this.player.isYouTubeMode;

        // Create appropriate default name based on source type
        const prefix = isYouTubeMode ? 'YouTube Loop' : 'Practice Loop';

        if (loopStart !== null && loopEnd !== null) {
            const startTime = this.player.formatTime(loopStart);
            const endTime = this.player.formatTime(loopEnd);
            return `${prefix} ${startTime} - ${endTime}`;
        } else if (loopStart !== null) {
            return `${prefix} from ${this.player.formatTime(loopStart)}`;
        } else {
            return prefix;
        }
    }


    deleteSession(index) {
        if (!confirm('Are you sure you want to delete this session?')) return;

        // Determine current file name
        let fileName;
        if (this.player.isYouTubeMode) {
            fileName = this.player.youtubeVideoTitle || this.player.youtubeVideoId || 'youtube_video';
        } else if (this.player.currentFileName) {
            fileName = this.player.currentFileName;
        } else {
            return;
        }

        if (this.player.storageService && this.player.storageService.deleteAudioSession) {
            this.player.storageService.deleteAudioSession(fileName, index);
            this.loadSavedSessions();
            this.player.showNotification('Session deleted', 'info');
        }
    }

    // Add this method to SessionManager for debugging
    debugStoredSessions() {
        if (!this.player.storageService) {
            console.log('No storage service available');
            return;
        }

        // Check what's actually stored
        console.log('=== STORAGE DEBUG ===');

        // Get all audio sessions
        const allSessions = this.player.storageService.getAllAudioSessions?.() || {};
        console.log('All stored audio sessions:', allSessions);

        // Check for various possible keys
        const possibleKeys = [
            this.player.youtubeVideoId,
            this.player.youtubeVideoTitle,
            '3f575s4hbu0',
            'Pearl Jam - Once (Official Audio)',
            'youtube_video'
        ];

        possibleKeys.forEach(key => {
            if (key) {
                const sessions = this.player.storageService.getAudioSessions?.(key) || [];
                console.log(`Sessions for key "${key}":`, sessions);
            }
        });
    }

    destroy() {
        // Remove event listeners from dynamically created buttons
        const container = document.getElementById('savedSessionsList');
        if (container) {
            container.querySelectorAll('.load-session-btn').forEach(btn => {
                btn.removeEventListener('click', () => {});
            });
            container.querySelectorAll('.delete-session-btn').forEach(btn => {
                btn.removeEventListener('click', () => {});
            });
        }
    }
}
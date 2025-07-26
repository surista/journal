// HistoryTab Component - Handles the practice history tab
import { TimeUtils } from '../../utils/helpers.js';
import { sanitizeUrl, escapeHtml, sanitizeInput } from '../../utils/sanitizer.js';

export class HistoryTab {
    constructor(storageService) {
        this.storageService = storageService;
        this.container = null;
        this.allSessions = [];
        this.currentFilter = 'all';
    }

    render(container) {
        this.container = container;

        this.container.innerHTML = `
            <div class="history-layout">
                <div class="history-header">
                    <h2>Practice History</h2>
                    <div class="history-filters">
                        <div style="position: relative; display: inline-block; margin-right: 0.5rem;">
                            <input 
                                type="text" 
                                id="historySearch" 
                                class="search-input" 
                                placeholder="Search sessions..."
                                style="padding: 0.5rem 2rem 0.5rem 0.5rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-primary); width: 200px;">
                            <button 
                                id="clearSearchBtn"
                                style="position: absolute; right: 5px; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: var(--text-secondary); cursor: pointer; padding: 0.25rem; display: none;"
                                title="Clear search">
                                ✕
                            </button>
                        </div>
                        <select class="filter-select" id="historyFilter">
                            <option value="all">All Sessions</option>
                            <option value="favorites">⭐ Favorites</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="year">This Year</option>
                        </select>
                        <select class="filter-select" id="keyFilter">
                            <option value="">All Keys</option>
                            <optgroup label="Major Keys">
                                <option value="C Major">C Major</option>
                                <option value="C#/Db Major">C# / Db Major</option>
                                <option value="D Major">D Major</option>
                                <option value="D#/Eb Major">D# / Eb Major</option>
                                <option value="E Major">E Major</option>
                                <option value="F Major">F Major</option>
                                <option value="F#/Gb Major">F# / Gb Major</option>
                                <option value="G Major">G Major</option>
                                <option value="G#/Ab Major">G# / Ab Major</option>
                                <option value="A Major">A Major</option>
                                <option value="A#/Bb Major">A# / Bb Major</option>
                                <option value="B Major">B Major</option>
                            </optgroup>
                            <optgroup label="Minor Keys">
                                <option value="C Minor">C Minor</option>
                                <option value="C#/Db Minor">C# / Db Minor</option>
                                <option value="D Minor">D Minor</option>
                                <option value="D#/Eb Minor">D# / Eb Minor</option>
                                <option value="E Minor">E Minor</option>
                                <option value="F Minor">F Minor</option>
                                <option value="F#/Gb Minor">F# / Gb Minor</option>
                                <option value="G Minor">G Minor</option>
                                <option value="G#/Ab Minor">G# / Ab Minor</option>
                                <option value="A Minor">A Minor</option>
                                <option value="A#/Bb Minor">A# / Bb Minor</option>
                                <option value="B Minor">B Minor</option>
                            </optgroup>
                            <optgroup label="Modes">
                                <option value="Dorian">Any Dorian</option>
                                <option value="Phrygian">Any Phrygian</option>
                                <option value="Lydian">Any Lydian</option>
                                <option value="Mixolydian">Any Mixolydian</option>
                                <option value="Locrian">Any Locrian</option>
                            </optgroup>
                        </select>
                        <button class="btn btn-secondary" id="exportHistoryBtn">
                            Export History
                        </button>
                    </div>
                </div>
                <div id="historyList" class="history-list"></div>
            </div>
        `;

        this.attachEventListeners();
        this.loadHistory();
    }

    attachEventListeners() {
        // Search input
        const searchInput = document.getElementById('historySearch');
        const clearBtn = document.getElementById('clearSearchBtn');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                // Show/hide clear button based on input
                if (clearBtn) {
                    clearBtn.style.display = e.target.value ? 'block' : 'none';
                }
                this.filterHistory(this.currentFilter);
            });
            
            // Clear search on ESC key
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    searchInput.value = '';
                    if (clearBtn) clearBtn.style.display = 'none';
                    this.filterHistory(this.currentFilter);
                }
            });
        }
        
        // Clear button
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                searchInput.value = '';
                clearBtn.style.display = 'none';
                this.filterHistory(this.currentFilter);
            });
        }

        // History filter
        document.getElementById('historyFilter')?.addEventListener('change', (e) => {
            this.filterHistory(e.target.value);
        });

        // Key filter
        document.getElementById('keyFilter')?.addEventListener('change', (e) => {
            this.filterHistory(this.currentFilter);
        });

        // Export history
        document.getElementById('exportHistoryBtn')?.addEventListener('click', () => {
            this.exportHistory();
        });

        // Listen for new practice sessions
        this.practiceSessionListener = (e) => {
            // Reload history when a new session is saved
            this.loadHistory();
        };
        window.addEventListener('practiceSessionSaved', this.practiceSessionListener);

        // Delete session buttons using event delegation on the container
        this.container.addEventListener('click', async (e) => {
            // Handle YouTube practice links
            const youtubeLink = e.target.closest('.youtube-practice-link');
            if (youtubeLink) {
                e.preventDefault();
                const youtubeUrl = youtubeLink.dataset.url;
                if (youtubeUrl) {
                    this.loadYouTubeInPracticeTab(youtubeUrl);
                }
                return;
            }

            const editBtn = e.target.closest('.edit-session-btn');
            if (editBtn) {
                e.preventDefault();
                e.stopPropagation();
                const sessionId = editBtn.dataset.id;
                console.log('Edit button clicked, sessionId:', sessionId);
                if (sessionId) {
                    const numericId = Number(sessionId);
                    if (!isNaN(numericId)) {
                        await this.handleEditSession(numericId);
                    } else {
                        console.error('Invalid session ID:', sessionId);
                    }
                } else {
                    console.error('No session ID found on edit button');
                }
            }

            const deleteBtn = e.target.closest('.delete-session-btn');
            if (deleteBtn) {
                e.preventDefault();
                e.stopPropagation();
                // Don't parse as int since IDs might be floats (Date.now() + Math.random())
                const sessionId = deleteBtn.dataset.id;
                if (sessionId) {
                    // Convert to number for consistency
                    const numericId = Number(sessionId);
                    if (!isNaN(numericId)) {
                        await this.handleDeleteSession(numericId);
                    }
                }
            }

            const favoriteBtn = e.target.closest('.toggle-favorite-btn');
            if (favoriteBtn) {
                e.preventDefault();
                e.stopPropagation();
                const sessionId = favoriteBtn.dataset.id;
                if (sessionId) {
                    const numericId = Number(sessionId);
                    if (!isNaN(numericId)) {
                        await this.handleToggleFavorite(numericId);
                    }
                }
            }

            const practiceBtn = e.target.closest('.practice-again-btn');
            if (practiceBtn) {
                e.preventDefault();
                e.stopPropagation();
                const sessionId = practiceBtn.dataset.id;
                if (sessionId) {
                    const numericId = Number(sessionId);
                    if (!isNaN(numericId)) {
                        await this.handlePracticeAgain(numericId);
                    }
                }
            }

            // Handle clicking on session item (but not on buttons or links)
            const sessionItem = e.target.closest('.history-item');
            if (sessionItem && !e.target.closest('button') && !e.target.closest('a')) {
                const sessionId = sessionItem.dataset.id;
                if (sessionId) {
                    const numericId = Number(sessionId);
                    if (!isNaN(numericId)) {
                        // Check if this session has an image
                        const session = this.allSessions.find((s) => s.id === numericId);
                        if (session && session.sheetMusicImage) {
                            // If it has an image, load it into metronome
                            await this.handlePracticeAgain(numericId);
                        } else {
                            // Otherwise, do the normal load
                            await this.handleLoadSession(numericId);
                        }
                    }
                }
            }
        });
    }

    async handleDeleteSession(sessionId) {
        console.log('handleDeleteSession called with sessionId:', sessionId);

        // Find the session to get details for confirmation
        // Use == instead of === to handle potential type mismatches
        const session = this.allSessions.find((s) => s.id == sessionId);
        if (!session) {
            console.error(
                'Session not found:',
                sessionId,
                'Available IDs:',
                this.allSessions.map((s) => s.id)
            );
            return;
        }

        // Format session info for confirmation
        const date = new Date(session.date).toLocaleDateString();
        const duration = this.formatDuration(session.duration || 0);
        const area = session.practiceArea || 'Practice Session';

        // Show confirmation dialog
        const confirmMessage =
            `Are you sure you want to delete this practice session?\n\n` +
            `${area}\n` +
            `Date: ${date}\n` +
            `Duration: ${duration}`;

        const userConfirmed = confirm(confirmMessage);
        console.log('User confirmation result:', userConfirmed);

        if (userConfirmed) {
            try {
                // Show loading state
                const deleteBtn = document.querySelector(
                    `.delete-session-btn[data-id="${sessionId}"]`
                );
                if (deleteBtn) {
                    deleteBtn.textContent = '⏳';
                    deleteBtn.disabled = true;
                }

                // Delete from storage
                const success = await this.storageService.deletePracticeEntry(sessionId);

                if (success) {
                    // Remove from local array
                    this.allSessions = this.allSessions.filter((s) => s.id !== sessionId);

                    // Re-render the list
                    this.displayHistory(this.allSessions);

                    // Show notification
                    this.showNotification('Practice session deleted successfully', 'success');

                    // Emit event for other components to update
                    window.dispatchEvent(
                        new CustomEvent('practiceSessionDeleted', {
                            detail: { sessionId }
                        })
                    );
                } else {
                    throw new Error('Failed to delete session');
                }
            } catch (error) {
                console.error('Error deleting session:', error);
                this.showNotification('Failed to delete practice session', 'error');

                // Re-enable button on error
                const deleteBtn = document.querySelector(
                    `.delete-session-btn[data-id="${sessionId}"]`
                );
                if (deleteBtn) {
                    deleteBtn.textContent = '🗑️';
                    deleteBtn.disabled = false;
                }
            }
        }
    }

    async handleEditSession(sessionId) {
        console.log('handleEditSession called with ID:', sessionId);
        try {
            // Find the session in our list
            const session = this.allSessions.find((s) => s.id === sessionId);
            console.log('Found session:', session);
            if (!session) {
                console.error('Session not found in allSessions:', sessionId);
                console.log(
                    'Available session IDs:',
                    this.allSessions.map((s) => s.id)
                );
                this.showNotification('Session not found', 'error');
                return;
            }

            // Get session areas from storage service
            const sessionAreas = await this.storageService.getSessionAreas();

            // Build practice area options dynamically
            let practiceAreaOptions = '<option value="">Select practice area...</option>';
            sessionAreas.forEach(area => {
                const selected = session.practiceArea === area ? 'selected' : '';
                practiceAreaOptions += `<option value="${escapeHtml(area)}" ${selected}>${escapeHtml(area)}</option>`;
            });

            // If the session has a practice area that's not in the list, add it as an option
            if (session.practiceArea && !sessionAreas.includes(session.practiceArea)) {
                practiceAreaOptions += `<option value="${escapeHtml(session.practiceArea)}" selected>${escapeHtml(session.practiceArea)}</option>`;
            }

            // Create edit modal
            const modal = document.createElement('div');
            modal.className = 'modal-overlay modal-overlay-active';
            modal.innerHTML = `
                <div class="modal-content edit-session-modal" style="max-width: 500px; padding: 2rem;">
                    <h3 style="color: var(--text-primary); margin-bottom: 1.5rem; margin-top: 0;">Edit Practice Session</h3>
                    <form id="editSessionForm">
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; color: var(--text-primary); font-weight: 500;">Session Name</label>
                            <input type="text" name="name" value="${escapeHtml(session.name || '')}" placeholder="Session name" class="modal-input" style="width: 100%; padding: 0.75rem; background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text-primary);">
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label style="display: block; margin-bottom: 0.5rem; color: var(--text-primary); font-weight: 500;">Practice Area</label>
                            <select name="practiceArea" class="modal-input" style="width: 100%; padding: 0.75rem; background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text-primary);">
                                ${practiceAreaOptions}
                            </select>
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 1.5rem;">
                            <label style="display: block; margin-bottom: 0.5rem; color: var(--text-primary); font-weight: 500;">Media</label>
                            <input type="text" name="media" value="${escapeHtml(session.youtubeUrl || session.audioFile || '')}" readonly style="width: 100%; padding: 0.75rem; background: var(--bg-secondary); color: var(--text-secondary); border: 1px solid var(--border); border-radius: var(--radius);" class="modal-input">
                            <small style="color: var(--text-muted); display: block; margin-top: 0.25rem;">Media cannot be changed</small>
                        </div>
                        
                        <div class="modal-actions" style="display: flex; gap: 1rem; justify-content: flex-end;">
                            <button type="button" class="btn btn-secondary cancel-btn" style="padding: 0.75rem 1.5rem;">Cancel</button>
                            <button type="submit" class="btn btn-primary" style="padding: 0.75rem 1.5rem;">Save Changes</button>
                        </div>
                    </form>
                </div>
            `;

            document.body.appendChild(modal);

            // Handle form submission
            const form = modal.querySelector('#editSessionForm');
            let isSubmitting = false; // Prevent double submission

            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                // Prevent double submission
                if (isSubmitting) return;
                isSubmitting = true;

                const submitBtn = form.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Saving...';
                submitBtn.disabled = true;

                try {
                    const formData = new FormData(form);
                    const updatedSession = {
                        ...session,
                        name: formData.get('name') || session.name,
                        practiceArea: formData.get('practiceArea') || session.practiceArea
                    };

                    // Update in storage
                    console.log('Updating practice entry:', sessionId, updatedSession);
                    const success = await this.storageService.updatePracticeEntry(
                        sessionId,
                        updatedSession
                    );
                    console.log('Update result:', success);

                    if (success) {
                        // Update local array
                        const index = this.allSessions.findIndex((s) => s.id === sessionId);
                        if (index !== -1) {
                            this.allSessions[index] = updatedSession;
                        }

                        // Re-render the list
                        this.displayHistory(this.allSessions);

                        this.showNotification('Session updated successfully', 'success');
                        
                        // Close modal after showing notification
                        setTimeout(() => {
                            modal.remove();
                        }, 100);
                    } else {
                        this.showNotification('Failed to update session', 'error');
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                        isSubmitting = false;
                    }
                } catch (error) {
                    console.error('Error updating session:', error);
                    this.showNotification('Failed to update session', 'error');
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    isSubmitting = false;
                }
            });

            // Handle cancel
            modal.querySelector('.cancel-btn').addEventListener('click', () => modal.remove());
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
        } catch (error) {
            console.error('Error editing session:', error);
            this.showNotification('Failed to edit session', 'error');
        }
    }

    async handleToggleFavorite(sessionId) {
        try {
            // Find the session in our list
            const session = this.allSessions.find((s) => s.id === sessionId);
            if (!session) {
                this.showNotification('Session not found', 'error');
                return;
            }

            // Toggle the favorite status
            session.isFavorite = !session.isFavorite;

            // Update in storage
            const success = await this.storageService.updatePracticeEntry(sessionId, {
                isFavorite: session.isFavorite
            });

            if (success) {
                // Update the UI
                const favoriteBtn = document.querySelector(
                    `.toggle-favorite-btn[data-id="${sessionId}"]`
                );
                if (favoriteBtn) {
                    favoriteBtn.textContent = session.isFavorite ? '⭐' : '☆';
                    favoriteBtn.title = session.isFavorite
                        ? 'Remove from favorites'
                        : 'Add to favorites';
                }

                // Update the header star if present
                const sessionEl = document.querySelector(
                    `.history-item[data-id="${sessionId}"] h4`
                );
                if (sessionEl) {
                    const starSpan = sessionEl.querySelector('span');
                    if (session.isFavorite && !starSpan) {
                        sessionEl.insertAdjacentHTML(
                            'afterbegin',
                            '<span style="color: #facc15; margin-right: 4px;">⭐</span>'
                        );
                    } else if (!session.isFavorite && starSpan) {
                        starSpan.remove();
                    }
                }

                this.showNotification(
                    session.isFavorite ? 'Added to favorites' : 'Removed from favorites',
                    'success'
                );
            } else {
                // Revert on failure
                session.isFavorite = !session.isFavorite;
                this.showNotification('Failed to update favorite status', 'error');
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            this.showNotification('Failed to update favorite status', 'error');
        }
    }

    async handlePracticeAgain(sessionId) {
        try {
            // Find the session in our list
            const session = this.allSessions.find((s) => s.id === sessionId);
            if (!session || !session.sheetMusicImage) {
                this.showNotification('Session or sheet music not found', 'error');
                return;
            }

            // Store the session data in sessionStorage for the practice tab to pick up
            sessionStorage.setItem(
                'loadPracticeSession',
                JSON.stringify({
                    mode: 'metronome',
                    sheetMusicImage: session.sheetMusicImage,
                    tempo: session.tempo || session.bpm || 80,
                    timeSignature: session.timeSignature || '4/4',
                    practiceArea: session.practiceArea || session.area || ''
                })
            );

            // Navigate to practice tab
            window.location.hash = '#practice';

            // Dispatch event to load the session
            setTimeout(() => {
                window.dispatchEvent(
                    new CustomEvent('loadPracticeSession', {
                        detail: { sessionId }
                    })
                );
            }, 100);
        } catch (error) {
            console.error('Error loading practice session:', error);
            this.showNotification('Failed to load practice session', 'error');
        }
    }

    async handleLoadSession(sessionId) {
        try {
            // Find the session in our list
            const session = this.allSessions.find((s) => s.id === sessionId);
            if (!session) {
                this.showNotification('Session not found', 'error');
                return;
            }

            // Determine the mode based on session data
            let mode = 'metronome'; // default
            if (session.audioFile) {
                mode = 'audio';
            } else if (session.youtubeUrl) {
                mode = 'youtube';
            }

            // Prepare session data for loading
            const loadData = {
                mode: mode,
                tempo: session.tempo || session.bpm || 80,
                timeSignature: session.timeSignature || '4/4',
                practiceArea: session.practiceArea || session.area || ''
            };

            // Add mode-specific data
            if (session.sheetMusicImage) {
                loadData.sheetMusicImage = session.sheetMusicImage;
            }
            if (session.audioFile) {
                loadData.audioFile = session.audioFile;
            }
            if (session.youtubeUrl) {
                loadData.youtubeUrl = session.youtubeUrl;
                loadData.youtubeTitle = session.youtubeTitle;
            }

            // Store the session data in sessionStorage
            sessionStorage.setItem('loadPracticeSession', JSON.stringify(loadData));

            // Navigate to practice tab
            window.location.hash = '#practice';

            // Dispatch event to load the session
            setTimeout(() => {
                window.dispatchEvent(
                    new CustomEvent('loadPracticeSession', {
                        detail: { sessionId }
                    })
                );
            }, 100);
        } catch (error) {
            console.error('Error loading session:', error);
            this.showNotification('Failed to load session', 'error');
        }
    }

    async loadHistory() {
        try {
            const sessions = await this.storageService.getPracticeEntries();

            // Sort sessions by date (newest first)
            this.allSessions = sessions.sort((a, b) => {
                return new Date(b.date) - new Date(a.date);
            });

            this.displayHistory(this.allSessions);
        } catch (error) {
            console.error('Error loading history:', error);
            const container = document.getElementById('historyList');
            if (container) {
                container.innerHTML =
                    '<p class="error-state">Error loading practice history. Please try refreshing the page.</p>';
            }
        }
    }

    displayHistory(sessions) {
        const container = document.getElementById('historyList');
        if (!container) return;

        if (sessions.length === 0) {
            container.innerHTML = '<p class="empty-state">No practice sessions found</p>';
            return;
        }

        // Group sessions by month
        const groupedSessions = this.groupSessionsByMonth(sessions);

        container.innerHTML = Object.entries(groupedSessions)
            .map(
                ([month, monthSessions]) => `
            <div class="history-month-group">
                <h3 class="history-month-header">${month}</h3>
                ${monthSessions
                    .map((session) => {
                        const duration = this.formatDuration(session.duration || 0);

                        // Format date with fallback
                        let dateStr = '';
                        try {
                            const date = new Date(session.date);
                            // Use native JS date formatting as fallback
                            dateStr = date.toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                            });
                        } catch (e) {
                            console.error('Date formatting error:', e);
                            dateStr = session.date;
                        }

                        return `
                        <div class="history-item ${session.sheetMusicImage ? 'has-image' : ''}" data-id="${session.id}">
                            ${
                                session.sheetMusicImage
                                    ? `
                                <div class="history-item-thumbnail">
                                    <img src="${sanitizeUrl(session.sheetMusicThumbnail || session.sheetMusicImage) || ''}" 
                                         alt="Sheet music" 
                                         class="history-thumbnail"
                                         data-fallback="${sanitizeUrl(session.sheetMusicImage) || ''}" />
                                </div>
                            `
                                    : ''
                            }
                            <div class="history-item-content">
                                <div class="history-item-header">
                                    <h4>
                                        ${session.isFavorite ? '<span style="color: #facc15; margin-right: 4px;">⭐</span>' : ''}
                                        ${escapeHtml(session.name || session.practiceArea || 'Practice Session')}
                                    </h4>
                                    ${
                                        session.practiceArea &&
                                        session.name &&
                                        session.practiceArea !== session.name
                                            ? `<div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">📚 ${escapeHtml(session.practiceArea)}</div>`
                                            : ''
                                    }
                                <div class="history-item-actions">
                                    <span class="history-date">${dateStr}</span>
                                    <button class="btn-icon toggle-favorite-btn" data-id="${session.id}" title="${session.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                                        ${session.isFavorite ? '⭐' : '☆'}
                                    </button>
                                    ${
                                        session.sheetMusicImage
                                            ? `
                                        <button class="btn-icon practice-again-btn" data-id="${session.id}" title="Practice again with this sheet music">
                                            🎸
                                        </button>
                                    `
                                            : ''
                                    }
                                    <button class="btn-icon edit-session-btn" data-id="${session.id}" title="Edit session">
                                        ✏️
                                    </button>
                                    <button class="btn-icon delete-session-btn" data-id="${session.id}" title="Delete session">
                                        🗑️
                                    </button>
                                </div>
                            </div>
                            <div class="history-item-details">
                                <span class="history-duration">
                                    <i class="icon">⏱️</i> ${duration}
                                </span>
                                ${session.bpm ? `<span class="history-tempo"><i class="icon">🎵</i> ${session.bpm} BPM</span>` : ''}
                                ${session.tempoPercentage ? `<span class="history-tempo"><i class="icon">📊</i> ${session.tempoPercentage}% speed</span>` : ''}
                                ${session.key ? `<span class="history-key"><i class="icon">🎼</i> ${escapeHtml(session.key)}</span>` : ''}
                                ${session.audioFile ? `<span class="history-audio"><i class="icon">🎧</i> Audio: ${escapeHtml(session.audioFile.length > 50 ? session.audioFile.substring(0, 47) + '...' : session.audioFile)}</span>` : ''}
                                ${session.sheetMusicImage ? `<span class="history-sheet-music"><i class="icon">📄</i> Sheet Music</span>` : ''}
                                ${
                                    session.youtubeTitle
                                        ? `
                                <span class="history-audio">
                                    <i class="icon">📺</i> YouTube: ${
                                        session.youtubeUrl
                                            ? `<a href="#" class="youtube-practice-link" data-url="${sanitizeUrl(session.youtubeUrl) || ''}" style="color: var(--primary); text-decoration: underline;">${escapeHtml(session.youtubeTitle.length > 50 ? session.youtubeTitle.substring(0, 50) + '...' : session.youtubeTitle)}</a>`
                                            : escapeHtml(
                                                  session.youtubeTitle.length > 50
                                                      ? session.youtubeTitle.substring(0, 50) +
                                                            '...'
                                                      : session.youtubeTitle
                                              )
                                    }
                                </span>
                            `
                                        : ''
                                }
                                </div>
                                ${session.notes ? `<div class="history-notes">${escapeHtml(session.notes)}</div>` : ''}
                            </div>
                        </div>
                    `;
                    })
                    .join('')}
            </div>
        `
            )
            .join('');
            
        // Add error handlers for thumbnails
        setTimeout(() => {
            container.querySelectorAll('.history-thumbnail').forEach(img => {
                img.addEventListener('error', function() {
                    const fallback = this.getAttribute('data-fallback');
                    if (fallback && this.src !== fallback) {
                        this.src = fallback;
                    }
                });
            });
        }, 0);
    }

    formatDuration(seconds) {
        if (!seconds || seconds === 0) return '0m';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
        } else {
            return `${secs}s`;
        }
    }

    // Using imported escapeHtml from sanitizer.js instead of local implementation

    groupSessionsByMonth(sessions) {
        const grouped = {};

        sessions.forEach((session) => {
            try {
                const date = new Date(session.date);

                // Check if date is valid
                if (isNaN(date.getTime())) {
                    console.error('Invalid date:', session.date);
                    return;
                }

                const monthKey = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long'
                });

                if (!grouped[monthKey]) {
                    grouped[monthKey] = [];
                }

                grouped[monthKey].push(session);
            } catch (error) {
                console.error('Error processing session date:', error, session);
            }
        });

        // Sort months in reverse chronological order
        const sortedGrouped = {};
        Object.keys(grouped)
            .sort((a, b) => new Date(b) - new Date(a))
            .forEach((key) => {
                sortedGrouped[key] = grouped[key];
            });

        return sortedGrouped;
    }

    filterHistory(filter) {
        if (!this.allSessions) return;

        this.currentFilter = filter;
        const now = new Date();
        let filtered = this.allSessions;

        // Apply time-based filters
        switch (filter) {
            case 'favorites':
                filtered = this.allSessions.filter((s) => s.isFavorite === true);
                break;
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filtered = this.allSessions.filter((s) => new Date(s.date) >= weekAgo);
                break;
            case 'month':
                const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                filtered = this.allSessions.filter((s) => new Date(s.date) >= monthAgo);
                break;
            case 'year':
                const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                filtered = this.allSessions.filter((s) => new Date(s.date) >= yearAgo);
                break;
        }

        // Apply search filter
        const searchTerm = document.getElementById('historySearch')?.value.toLowerCase().trim();
        if (searchTerm) {
            filtered = filtered.filter(session => {
                // Search in session name
                if (session.name && session.name.toLowerCase().includes(searchTerm)) {
                    return true;
                }
                
                // Search in audio file name
                if (session.audioFile && session.audioFile.toLowerCase().includes(searchTerm)) {
                    return true;
                }
                
                // Search in YouTube URL
                if (session.youtubeUrl && session.youtubeUrl.toLowerCase().includes(searchTerm)) {
                    return true;
                }
                
                // Search in notes
                if (session.notes && session.notes.toLowerCase().includes(searchTerm)) {
                    return true;
                }
                
                // Search in practice area
                if (session.practiceArea && session.practiceArea.toLowerCase().includes(searchTerm)) {
                    return true;
                }
                
                return false;
            });
        }

        // Apply key filter if selected
        const keyFilter = document.getElementById('keyFilter')?.value;
        if (keyFilter) {
            // Check if filtering by mode only
            if (['Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Locrian'].includes(keyFilter)) {
                filtered = filtered.filter((s) => s.key && s.key.includes(keyFilter));
            } else {
                filtered = filtered.filter((s) => s.key === keyFilter);
            }
        }

        this.displayHistory(filtered);
    }

    async exportHistory() {
        try {
            const sessions = this.allSessions || [];
            const csvContent = this.convertSessionsToCSV(sessions);

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `practice-history-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();

            URL.revokeObjectURL(url);
            this.showNotification('History exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting history:', error);
            this.showNotification('Error exporting history', 'error');
        }
    }

    convertSessionsToCSV(sessions) {
        const headers = [
            'Date',
            'Duration (minutes)',
            'Practice Area',
            'Audio File',
            'BPM',
            'Key',
            'Notes'
        ];
        const rows = sessions.map((session) => [
            new Date(session.date).toLocaleDateString(),
            Math.round((session.duration || 0) / 60),
            session.practiceArea || '',
            session.audioFile || '',
            session.bpm || '',
            session.key || '',
            (session.notes || '').replace(/,/g, ';') // Replace commas to avoid CSV issues
        ]);

        return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    }

    showImageLightbox(imageSrc) {
        // Create lightbox elements
        const lightbox = document.createElement('div');
        lightbox.className = 'image-lightbox';

        const img = document.createElement('img');
        img.src = imageSrc;
        img.alt = 'Sheet music';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'image-lightbox-close';
        closeBtn.innerHTML = '×';

        // Close on click
        const closeLightbox = () => {
            lightbox.remove();
        };

        closeBtn.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });

        // Close on escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                closeLightbox();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Assemble and show
        lightbox.appendChild(img);
        lightbox.appendChild(closeBtn);
        document.body.appendChild(lightbox);
    }

    showNotification(message, type = 'info') {
        if (window.app?.currentPage?.showNotification) {
            window.app.currentPage.showNotification(message, type);
        }
    }

    loadYouTubeInPracticeTab(youtubeUrl) {
        // Switch to practice tab
        if (window.app?.currentPage?.switchTab) {
            window.app.currentPage.switchTab('practice');

            // Wait for tab to load, then load the YouTube URL
            setTimeout(() => {
                // Find the YouTube panel and load the URL
                const youtubeInput = document.querySelector('#youtubeUrl');
                const loadBtn = document.querySelector('#loadYoutubeBtn');

                if (youtubeInput && loadBtn) {
                    // First, switch to YouTube mode if needed
                    const youtubeTab = document.querySelector('.mode-tab[data-mode="youtube"]');
                    if (youtubeTab && !youtubeTab.classList.contains('active')) {
                        youtubeTab.click();
                    }

                    // Set the URL and trigger load
                    setTimeout(() => {
                        youtubeInput.value = youtubeUrl;
                        loadBtn.click();
                    }, 100);
                }
            }, 300);
        }
    }

    onActivate() {
        // Refresh data when tab becomes active
        this.loadHistory();
    }

    onDeactivate() {
        // Clean up when leaving tab
        this.currentFilter = 'all';
    }

    destroy() {
        // Remove event listeners
        if (this.practiceSessionListener) {
            window.removeEventListener('practiceSessionSaved', this.practiceSessionListener);
            this.practiceSessionListener = null;
        }

        this.allSessions = [];
        this.container = null;
    }
}

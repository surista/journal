// HistoryTab Component - Handles the practice history tab
import { TimeUtils } from '../../utils/helpers.js';
import { sanitizeUrl, escapeHtml } from '../../utils/sanitizer.js';

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
                        <select class="filter-select" id="historyFilter">
                            <option value="all">All Sessions</option>
                            <option value="favorites">⭐ Favorites</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="year">This Year</option>
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
        // History filter
        document.getElementById('historyFilter')?.addEventListener('change', (e) => {
            this.filterHistory(e.target.value);
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
                if (sessionId) {
                    const numericId = Number(sessionId);
                    if (!isNaN(numericId)) {
                        await this.handleEditSession(numericId);
                    }
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
            if (sessionItem && !e.target.closest('button') && !e.target.closest('a') && !e.target.closest('.history-thumbnail')) {
                const sessionId = sessionItem.dataset.id;
                if (sessionId) {
                    const numericId = Number(sessionId);
                    if (!isNaN(numericId)) {
                        await this.handleLoadSession(numericId);
                    }
                }
            }
            
            // Handle thumbnail clicks
            const thumbnail = e.target.closest('.history-thumbnail');
            if (thumbnail) {
                e.preventDefault();
                this.showImageLightbox(thumbnail.src);
            }
        });
    }


    async handleDeleteSession(sessionId) {

        // Find the session to get details for confirmation
        // Use == instead of === to handle potential type mismatches
        const session = this.allSessions.find(s => s.id == sessionId);
        if (!session) {
            console.error('Session not found:', sessionId, 'Available IDs:', this.allSessions.map(s => s.id));
            return;
        }

        // Format session info for confirmation
        const date = new Date(session.date).toLocaleDateString();
        const duration = this.formatDuration(session.duration || 0);
        const area = session.practiceArea || 'Practice Session';

        // Show confirmation dialog
        const confirmMessage = `Are you sure you want to delete this practice session?\n\n` +
            `${area}\n` +
            `Date: ${date}\n` +
            `Duration: ${duration}\n` +
            `${session.notes ? `Notes: ${session.notes.substring(0, 50)}...` : ''}`;

        if (confirm(confirmMessage)) {
            try {
                // Show loading state
                const deleteBtn = document.querySelector(`.delete-session-btn[data-id="${sessionId}"]`);
                if (deleteBtn) {
                    deleteBtn.textContent = '⏳';
                    deleteBtn.disabled = true;
                }

                // Delete from storage
                const success = await this.storageService.deletePracticeEntry(sessionId);

                if (success) {
                    // Remove from local array
                    this.allSessions = this.allSessions.filter(s => s.id !== sessionId);

                    // Re-render the list
                    this.displayHistory(this.allSessions);

                    // Show notification
                    this.showNotification('Practice session deleted successfully', 'success');

                    // Emit event for other components to update
                    window.dispatchEvent(new CustomEvent('practiceSessionDeleted', {
                        detail: { sessionId }
                    }));
                } else {
                    throw new Error('Failed to delete session');
                }
            } catch (error) {
                console.error('Error deleting session:', error);
                this.showNotification('Failed to delete practice session', 'error');

                // Re-enable button on error
                const deleteBtn = document.querySelector(`.delete-session-btn[data-id="${sessionId}"]`);
                if (deleteBtn) {
                    deleteBtn.textContent = '🗑️';
                    deleteBtn.disabled = false;
                }
            }
        }
    }

    async handleEditSession(sessionId) {
        try {
            // Find the session in our list
            const session = this.allSessions.find(s => s.id === sessionId);
            if (!session) {
                this.showNotification('Session not found', 'error');
                return;
            }

            // Create edit modal
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal edit-session-modal">
                    <h3>Edit Practice Session</h3>
                    <form id="editSessionForm">
                        <div class="form-group">
                            <label>Session Name</label>
                            <input type="text" name="name" value="${escapeHtml(session.name || '')}" placeholder="Session name">
                        </div>
                        
                        <div class="form-group">
                            <label>Practice Area</label>
                            <input type="text" name="practiceArea" value="${escapeHtml(session.practiceArea || '')}" placeholder="What did you practice?">
                        </div>
                        
                        <div class="form-group">
                            <label>Media</label>
                            <input type="text" name="media" value="${escapeHtml(session.youtubeUrl || session.audioFile || '')}" readonly style="background: var(--bg-secondary); color: var(--text-secondary);">
                            <small style="color: var(--text-muted);">Media cannot be changed</small>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary cancel-btn">Cancel</button>
                            <button type="submit" class="btn btn-primary">Save Changes</button>
                        </div>
                    </form>
                </div>
            `;

            document.body.appendChild(modal);

            // Handle form submission
            const form = modal.querySelector('#editSessionForm');
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(form);
                const updatedSession = {
                    ...session,
                    name: formData.get('name') || session.name,
                    practiceArea: formData.get('practiceArea') || session.practiceArea
                };

                // Update in storage
                const success = await this.storageService.updatePracticeEntry(sessionId, updatedSession);
                
                if (success) {
                    // Update local array
                    const index = this.allSessions.findIndex(s => s.id === sessionId);
                    if (index !== -1) {
                        this.allSessions[index] = updatedSession;
                    }
                    
                    // Re-render the list
                    this.displayHistory(this.allSessions);
                    
                    this.showNotification('Session updated successfully', 'success');
                    modal.remove();
                } else {
                    this.showNotification('Failed to update session', 'error');
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
            const session = this.allSessions.find(s => s.id === sessionId);
            if (!session) {
                this.showNotification('Session not found', 'error');
                return;
            }

            // Toggle the favorite status
            session.isFavorite = !session.isFavorite;

            // Update in storage
            const success = await this.storageService.updatePracticeEntry(sessionId, { isFavorite: session.isFavorite });
            
            if (success) {
                // Update the UI
                const favoriteBtn = document.querySelector(`.toggle-favorite-btn[data-id="${sessionId}"]`);
                if (favoriteBtn) {
                    favoriteBtn.textContent = session.isFavorite ? '⭐' : '☆';
                    favoriteBtn.title = session.isFavorite ? 'Remove from favorites' : 'Add to favorites';
                }

                // Update the header star if present
                const sessionEl = document.querySelector(`.history-item[data-id="${sessionId}"] h4`);
                if (sessionEl) {
                    const starSpan = sessionEl.querySelector('span');
                    if (session.isFavorite && !starSpan) {
                        sessionEl.insertAdjacentHTML('afterbegin', '<span style="color: #facc15; margin-right: 4px;">⭐</span>');
                    } else if (!session.isFavorite && starSpan) {
                        starSpan.remove();
                    }
                }

                this.showNotification(session.isFavorite ? 'Added to favorites' : 'Removed from favorites', 'success');
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
            const session = this.allSessions.find(s => s.id === sessionId);
            if (!session || !session.sheetMusicImage) {
                this.showNotification('Session or sheet music not found', 'error');
                return;
            }

            // Store the session data in sessionStorage for the practice tab to pick up
            sessionStorage.setItem('loadPracticeSession', JSON.stringify({
                mode: 'metronome',
                sheetMusicImage: session.sheetMusicImage,
                tempo: session.tempo || session.bpm || 80,
                timeSignature: session.timeSignature || '4/4',
                practiceArea: session.practiceArea || session.area || ''
            }));

            // Navigate to practice tab
            window.location.hash = '#practice';
            
            // Dispatch event to load the session
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('loadPracticeSession', {
                    detail: { sessionId }
                }));
            }, 100);
            
        } catch (error) {
            console.error('Error loading practice session:', error);
            this.showNotification('Failed to load practice session', 'error');
        }
    }

    async handleLoadSession(sessionId) {
        try {
            // Find the session in our list
            const session = this.allSessions.find(s => s.id === sessionId);
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
                window.dispatchEvent(new CustomEvent('loadPracticeSession', {
                    detail: { sessionId }
                }));
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
                container.innerHTML = '<p class="error-state">Error loading practice history. Please try refreshing the page.</p>';
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

        container.innerHTML = Object.entries(groupedSessions).map(([month, monthSessions]) => `
            <div class="history-month-group">
                <h3 class="history-month-header">${month}</h3>
                ${monthSessions.map(session => {
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
                            ${session.sheetMusicImage ? `
                                <div class="history-item-thumbnail">
                                    <img src="${session.sheetMusicImage}" alt="Sheet music" class="history-thumbnail" />
                                </div>
                            ` : ''}
                            <div class="history-item-content">
                                <div class="history-item-header">
                                    <h4>
                                        ${session.isFavorite ? '<span style="color: #facc15; margin-right: 4px;">⭐</span>' : ''}
                                        ${escapeHtml(session.name || session.practiceArea || 'Practice Session')}
                                    </h4>
                                    ${session.practiceArea && session.name && session.practiceArea !== session.name ? 
                                        `<div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">📚 ${escapeHtml(session.practiceArea)}</div>` : ''}
                                <div class="history-item-actions">
                                    <span class="history-date">${dateStr}</span>
                                    <button class="btn-icon toggle-favorite-btn" data-id="${session.id}" title="${session.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                                        ${session.isFavorite ? '⭐' : '☆'}
                                    </button>
                                    ${session.sheetMusicImage ? `
                                        <button class="btn-icon practice-again-btn" data-id="${session.id}" title="Practice again with this sheet music">
                                            🎸
                                        </button>
                                    ` : ''}
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
                                ${session.youtubeTitle ? `
                                <span class="history-audio">
                                    <i class="icon">📺</i> YouTube: ${session.youtubeUrl ?
                `<a href="#" class="youtube-practice-link" data-url="${sanitizeUrl(session.youtubeUrl) || ''}" style="color: var(--primary); text-decoration: underline;">${escapeHtml(session.youtubeTitle.length > 50 ? session.youtubeTitle.substring(0, 50) + '...' : session.youtubeTitle)}</a>` :
                escapeHtml(session.youtubeTitle.length > 50 ? session.youtubeTitle.substring(0, 50) + '...' : session.youtubeTitle)
            }
                                </span>
                            ` : ''}
                                </div>
                                ${session.notes ? `<div class="history-notes">${escapeHtml(session.notes)}</div>` : ''}
                            </div>
                        </div>
                    `;
        }).join('')}
            </div>
        `).join('');

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

        sessions.forEach(session => {
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
            .forEach(key => {
                sortedGrouped[key] = grouped[key];
            });

        return sortedGrouped;
    }

    filterHistory(filter) {
        if (!this.allSessions) return;

        const now = new Date();
        let filtered = this.allSessions;

        switch (filter) {
            case 'favorites':
                filtered = this.allSessions.filter(s => s.isFavorite === true);
                break;
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filtered = this.allSessions.filter(s => new Date(s.date) >= weekAgo);
                break;
            case 'month':
                const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                filtered = this.allSessions.filter(s => new Date(s.date) >= monthAgo);
                break;
            case 'year':
                const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                filtered = this.allSessions.filter(s => new Date(s.date) >= yearAgo);
                break;
        }

        this.displayHistory(filtered);
    }

    async exportHistory() {
        try {
            const sessions = this.allSessions || [];
            const csvContent = this.convertSessionsToCSV(sessions);

            const blob = new Blob([csvContent], {type: 'text/csv'});
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
        const headers = ['Date', 'Duration (minutes)', 'Practice Area', 'Audio File', 'BPM', 'Key', 'Notes'];
        const rows = sessions.map(session => [
            new Date(session.date).toLocaleDateString(),
            Math.round((session.duration || 0) / 60),
            session.practiceArea || '',
            session.audioFile || '',
            session.bpm || '',
            session.key || '',
            (session.notes || '').replace(/,/g, ';') // Replace commas to avoid CSV issues
        ]);

        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
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
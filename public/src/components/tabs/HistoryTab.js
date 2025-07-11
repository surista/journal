// HistoryTab Component - Handles the practice history tab
import { TimeUtils } from '../../utils/helpers.js';

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

        // Delete session buttons (using event delegation)
        document.getElementById('historyList')?.addEventListener('click', async (e) => {
            if (e.target.classList.contains('delete-session-btn')) {
                const sessionId = parseInt(e.target.dataset.id);
                await this.handleDeleteSession(sessionId);
            }
        });
    }

    async handleDeleteSession(sessionId) {
        // Find the session to get details for confirmation
        const session = this.allSessions.find(s => s.id === sessionId);
        if (!session) return;

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
                const deleteBtn = document.querySelector(`[data-id="${sessionId}"] .delete-session-btn`);
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
                const deleteBtn = document.querySelector(`[data-id="${sessionId}"] .delete-session-btn`);
                if (deleteBtn) {
                    deleteBtn.textContent = '🗑️';
                    deleteBtn.disabled = false;
                }
            }
        }
    }

    async loadHistory() {
        try {
            console.log('Loading practice history...');
            const sessions = await this.storageService.getPracticeEntries();
            console.log('Loaded sessions:', sessions);

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

        console.log('Displaying sessions:', sessions.length);

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
                        <div class="history-item" data-id="${session.id}">
                            <div class="history-item-header">
                                <h4>${this.escapeHtml(session.practiceArea || 'Practice Session')}</h4>
                                <div class="history-item-actions">
                                    <span class="history-date">${dateStr}</span>
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
                                ${session.key ? `<span class="history-key"><i class="icon">🎼</i> ${this.escapeHtml(session.key)}</span>` : ''}
                                ${session.audioFile ? `<span class="history-audio"><i class="icon">🎧</i> Audio: ${this.escapeHtml(session.audioFile)}</span>` : ''}
                                ${session.youtubeTitle ? `<span class="history-audio"><i class="icon">📺</i> YouTube: ${this.escapeHtml(session.youtubeTitle)}</span>` : ''}
                            </div>
                            ${session.notes ? `<div class="history-notes">${this.escapeHtml(session.notes)}</div>` : ''}
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

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

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
        const headers = ['Date', 'Duration (minutes)', 'Practice Area', 'BPM', 'Key', 'Notes'];
        const rows = sessions.map(session => [
            new Date(session.date).toLocaleDateString(),
            Math.round((session.duration || 0) / 60),
            session.practiceArea || '',
            session.bpm || '',
            session.key || '',
            (session.notes || '').replace(/,/g, ';') // Replace commas to avoid CSV issues
        ]);

        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }

    showNotification(message, type = 'info') {
        if (window.app?.currentPage?.showNotification) {
            window.app.currentPage.showNotification(message, type);
        } else {
            console.log(`[${type}] ${message}`);
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
        this.allSessions = [];
        this.container = null;
    }
}
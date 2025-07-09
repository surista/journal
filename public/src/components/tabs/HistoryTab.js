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
    }

    async loadHistory() {
        try {
            const sessions = await this.storageService.getPracticeEntries();
            this.allSessions = sessions;
            this.displayHistory(this.allSessions);
        } catch (error) {
            console.error('Error loading history:', error);
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
                    const duration = TimeUtils.formatDuration(session.duration || 0);
                    const date = TimeUtils.formatDate(session.date, {
                        weekday: 'short',
                        day: 'numeric'
                    });

                    return `
                        <div class="history-item">
                            <div class="history-item-header">
                                <h4>${session.practiceArea || 'Practice Session'}</h4>
                                <span class="history-date">${date}</span>
                            </div>
                            <div class="history-item-details">
                                <span class="history-duration">
                                    <i class="icon">⏱️</i> ${duration}
                                </span>
                                ${session.bpm ? `<span class="history-tempo"><i class="icon">🎵</i> ${session.bpm} BPM</span>` : ''}
                                ${session.key ? `<span class="history-key"><i class="icon">🎼</i> ${session.key}</span>` : ''}
                                ${session.audioFile ? `<span class="history-audio"><i class="icon">🎧</i> Audio</span>` : ''}
                            </div>
                            ${session.notes ? `<div class="history-notes">${session.notes}</div>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `).join('');
    }

    groupSessionsByMonth(sessions) {
        const grouped = {};

        sessions.forEach(session => {
            const date = new Date(session.date);
            const monthKey = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long'
            });

            if (!grouped[monthKey]) {
                grouped[monthKey] = [];
            }

            grouped[monthKey].push(session);
        });

        return grouped;
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
// src/components/tabs/RepertoireTab.js
export class RepertoireTab {
    constructor(storageService) {
        this.storageService = storageService;
        this.container = null;
        this.repertoire = [];
        this.filteredRepertoire = [];
        this.currentFilter = {
            difficulty: '',
            status: '',
            search: ''
        };
    }

    async render(container) {
        this.container = container;
        this.container.innerHTML = `
            <div class="repertoire-page">
                <div class="repertoire-header">
                    <h2>My Repertoire</h2>
                    <button class="btn btn-primary" id="addSongBtn">
                        <i class="icon">➕</i> Add Song
                    </button>
                </div>
                
                <div class="repertoire-controls">
                    <div class="search-bar">
                        <input type="text" 
                               id="repertoireSearch" 
                               class="form-control" 
                               placeholder="Search songs, artists, or notes...">
                    </div>
                    
                    <div class="repertoire-filters">
                        <select id="difficultyFilter" class="form-control">
                            <option value="">All Difficulties</option>
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                        
                        <select id="statusFilter" class="form-control">
                            <option value="">All Status</option>
                            <option value="learning">Learning</option>
                            <option value="polishing">Polishing</option>
                            <option value="performance-ready">Performance Ready</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
                
                <div class="repertoire-stats">
                    <div class="stat-card">
                        <span class="stat-value" id="totalSongsCount">0</span>
                        <span class="stat-label">Total Songs</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value" id="performanceReadyCount">0</span>
                        <span class="stat-label">Performance Ready</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value" id="learningCount">0</span>
                        <span class="stat-label">Learning</span>
                    </div>
                </div>
                
                <div class="repertoire-grid" id="repertoireGrid">
                    <div class="loading-placeholder">Loading repertoire...</div>
                </div>
            </div>

            <!-- Add/Edit Song Modal -->
            <div class="modal" id="songModal" style="display: none;">
                <div class="modal-content">
                    <span class="close-btn" id="closeSongModal">&times;</span>
                    <h3 id="songModalTitle">Add New Song</h3>
                    
                    <form id="songForm">
                        <div class="form-group">
                            <label>Song Title <span class="required">*</span></label>
                            <input type="text" id="songTitle" class="form-control" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Artist/Composer</label>
                            <input type="text" id="songArtist" class="form-control">
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Difficulty</label>
                                <select id="songDifficulty" class="form-control">
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Status</label>
                                <select id="songStatus" class="form-control">
                                    <option value="learning">Learning</option>
                                    <option value="polishing">Polishing</option>
                                    <option value="performance-ready">Performance Ready</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label>Key</label>
                                <select id="songKey" class="form-control">
                                    <option value="">Select key</option>
                                    <option value="C">C Major</option>
                                    <option value="G">G Major</option>
                                    <option value="D">D Major</option>
                                    <option value="A">A Major</option>
                                    <option value="E">E Major</option>
                                    <option value="B">B Major</option>
                                    <option value="F">F Major</option>
                                    <option value="Bb">B♭ Major</option>
                                    <option value="Eb">E♭ Major</option>
                                    <option value="Ab">A♭ Major</option>
                                    <option value="Db">D♭ Major</option>
                                    <option value="Gb">G♭ Major</option>
                                    <option value="Am">A Minor</option>
                                    <option value="Em">E Minor</option>
                                    <option value="Bm">B Minor</option>
                                    <option value="F#m">F# Minor</option>
                                    <option value="C#m">C# Minor</option>
                                    <option value="G#m">G# Minor</option>
                                    <option value="Dm">D Minor</option>
                                    <option value="Gm">G Minor</option>
                                    <option value="Cm">C Minor</option>
                                    <option value="Fm">F Minor</option>
                                    <option value="Bbm">B♭ Minor</option>
                                    <option value="Ebm">E♭ Minor</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Tempo (BPM)</label>
                                <input type="number" id="songTempo" class="form-control" min="40" max="240">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Notes</label>
                            <textarea id="songNotes" class="form-control" rows="3" 
                                    placeholder="Technical challenges, performance notes, etc."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>YouTube/Video Link</label>
                            <input type="url" id="songVideoLink" class="form-control" 
                                   placeholder="https://youtube.com/watch?v=...">
                        </div>
                        
                        <div class="form-group">
                            <label>Sheet Music/Tab Link</label>
                            <input type="url" id="songSheetLink" class="form-control" 
                                   placeholder="Link to sheet music or tabs">
                        </div>
                        
                        <div class="modal-actions">
                            <button type="submit" class="btn btn-primary">Save Song</button>
                            <button type="button" class="btn btn-secondary" id="cancelSongBtn">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        await this.loadRepertoire();
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Add song button
        document.getElementById('addSongBtn')?.addEventListener('click', () => {
            this.showSongModal();
        });

        // Search
        document.getElementById('repertoireSearch')?.addEventListener('input', (e) => {
            this.currentFilter.search = e.target.value.toLowerCase();
            this.applyFilters();
        });

        // Filters
        document.getElementById('difficultyFilter')?.addEventListener('change', (e) => {
            this.currentFilter.difficulty = e.target.value;
            this.applyFilters();
        });

        document.getElementById('statusFilter')?.addEventListener('change', (e) => {
            this.currentFilter.status = e.target.value;
            this.applyFilters();
        });

        // Modal controls
        document.getElementById('closeSongModal')?.addEventListener('click', () => {
            this.hideSongModal();
        });

        document.getElementById('cancelSongBtn')?.addEventListener('click', () => {
            this.hideSongModal();
        });

        // Form submission
        document.getElementById('songForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveSong();
        });

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('songModal');
            if (e.target === modal) {
                this.hideSongModal();
            }
        });
    }

    async loadRepertoire() {
        try {
            this.repertoire = await this.storageService.getRepertoire();
            this.filteredRepertoire = [...this.repertoire];
            this.renderRepertoire();
            this.updateStats();
        } catch (error) {
            console.error('Error loading repertoire:', error);
            this.showError('Failed to load repertoire');
        }
    }

    applyFilters() {
        this.filteredRepertoire = this.repertoire.filter(song => {
            // Search filter
            if (this.currentFilter.search) {
                const searchTerm = this.currentFilter.search.toLowerCase();
                const matchesSearch =
                    song.title.toLowerCase().includes(searchTerm) ||
                    (song.artist && song.artist.toLowerCase().includes(searchTerm)) ||
                    (song.notes && song.notes.toLowerCase().includes(searchTerm));

                if (!matchesSearch) return false;
            }

            // Difficulty filter
            if (this.currentFilter.difficulty && song.difficulty !== this.currentFilter.difficulty) {
                return false;
            }

            // Status filter
            if (this.currentFilter.status && song.status !== this.currentFilter.status) {
                return false;
            }

            return true;
        });

        this.renderRepertoire();
    }

    renderRepertoire() {
        const grid = document.getElementById('repertoireGrid');
        if (!grid) return;

        if (this.filteredRepertoire.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="icon" style="font-size: 3rem;">🎵</i>
                    <p>No songs found</p>
                    <button class="btn btn-primary" onclick="document.getElementById('addSongBtn').click()">
                        Add Your First Song
                    </button>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.filteredRepertoire.map(song => `
            <div class="song-card" data-id="${song.id}">
                <div class="song-header">
                    <h4 class="song-title">${this.escapeHtml(song.title)}</h4>
                    <span class="song-status status-${song.status}">${this.formatStatus(song.status)}</span>
                </div>
                
                ${song.artist ? `<p class="song-artist">${this.escapeHtml(song.artist)}</p>` : ''}
                
                <div class="song-details">
                    <span class="difficulty difficulty-${song.difficulty}">${this.capitalize(song.difficulty)}</span>
                    ${song.key ? `<span class="song-key">Key: ${song.key}</span>` : ''}
                    ${song.tempo ? `<span class="song-tempo">${song.tempo} BPM</span>` : ''}
                </div>
                
                ${song.lastPracticed ? `
                    <div class="last-practiced">
                        Last practiced: ${this.formatRelativeDate(song.lastPracticed)}
                    </div>
                ` : ''}
                
                <div class="song-stats">
                    <span><i class="icon">📅</i> ${song.practiceCount || 0} sessions</span>
                    <span><i class="icon">⏱️</i> ${this.formatDuration(song.totalPracticeTime || 0)}</span>
                </div>
                
                <div class="song-actions">
                    <button class="btn btn-sm btn-secondary" onclick="window.repertoireTab.logPractice('${song.id}')">
                        Log Practice
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="window.repertoireTab.editSong('${song.id}')">
                        Edit
                    </button>
                    ${song.videoLink ? `
                        <a href="${song.videoLink}" target="_blank" class="btn btn-sm btn-secondary">
                            Video
                        </a>
                    ` : ''}
                </div>
            </div>
        `).join('');

        // Make this tab accessible globally for onclick handlers
        window.repertoireTab = this;
    }

    updateStats() {
        const totalSongs = this.repertoire.length;
        const performanceReady = this.repertoire.filter(s => s.status === 'performance-ready').length;
        const learning = this.repertoire.filter(s => s.status === 'learning').length;

        document.getElementById('totalSongsCount').textContent = totalSongs;
        document.getElementById('performanceReadyCount').textContent = performanceReady;
        document.getElementById('learningCount').textContent = learning;
    }

    showSongModal(songId = null) {
        const modal = document.getElementById('songModal');
        const modalTitle = document.getElementById('songModalTitle');
        const form = document.getElementById('songForm');

        if (songId) {
            // Edit mode
            modalTitle.textContent = 'Edit Song';
            const song = this.repertoire.find(s => s.id === songId);
            if (song) {
                document.getElementById('songTitle').value = song.title || '';
                document.getElementById('songArtist').value = song.artist || '';
                document.getElementById('songDifficulty').value = song.difficulty || 'beginner';
                document.getElementById('songStatus').value = song.status || 'learning';
                document.getElementById('songKey').value = song.key || '';
                document.getElementById('songTempo').value = song.tempo || '';
                document.getElementById('songNotes').value = song.notes || '';
                document.getElementById('songVideoLink').value = song.videoLink || '';
                document.getElementById('songSheetLink').value = song.sheetLink || '';
                form.dataset.songId = songId;
            }
        } else {
            // Add mode
            modalTitle.textContent = 'Add New Song';
            form.reset();
            delete form.dataset.songId;
        }

        modal.style.display = 'flex';
    }

    hideSongModal() {
        const modal = document.getElementById('songModal');
        modal.style.display = 'none';
        document.getElementById('songForm').reset();
    }

    async saveSong() {
        const form = document.getElementById('songForm');
        const songId = form.dataset.songId;

        const songData = {
            title: document.getElementById('songTitle').value.trim(),
            artist: document.getElementById('songArtist').value.trim(),
            difficulty: document.getElementById('songDifficulty').value,
            status: document.getElementById('songStatus').value,
            key: document.getElementById('songKey').value,
            tempo: document.getElementById('songTempo').value ? parseInt(document.getElementById('songTempo').value) : null,
            notes: document.getElementById('songNotes').value.trim(),
            videoLink: document.getElementById('songVideoLink').value.trim(),
            sheetLink: document.getElementById('songSheetLink').value.trim(),
            updatedAt: new Date().toISOString()
        };

        try {
            if (songId) {
                // Update existing song
                await this.storageService.updateRepertoireSong(songId, songData);
                this.showNotification('Song updated successfully', 'success');
            } else {
                // Add new song
                songData.id = Date.now().toString();
                songData.createdAt = new Date().toISOString();
                songData.practiceCount = 0;
                songData.totalPracticeTime = 0;
                songData.lastPracticed = null;

                await this.storageService.addRepertoireSong(songData);
                this.showNotification('Song added successfully', 'success');
            }

            this.hideSongModal();
            await this.loadRepertoire();
        } catch (error) {
            console.error('Error saving song:', error);
            this.showNotification('Failed to save song', 'error');
        }
    }

    editSong(songId) {
        this.showSongModal(songId);
    }

    async logPractice(songId) {
        const song = this.repertoire.find(s => s.id === songId);
        if (!song) return;

        // Switch to practice tab with pre-filled song info
        if (window.app && window.app.currentPage) {
            window.app.currentPage.switchTab('practice');

            // Pre-fill the practice form
            setTimeout(() => {
                const notesField = document.getElementById('notes');
                if (notesField) {
                    notesField.value = `Practiced: ${song.title}${song.artist ? ' by ' + song.artist : ''}`;
                }

                // If there's a timer, you might want to start it
                const timer = window.app.currentPage.components.timer;
                if (timer && !timer.isRunning) {
                    timer.start();
                }

                // Update the song's last practiced time
                this.storageService.updateRepertoireSong(songId, {
                    lastPracticed: new Date().toISOString()
                });
            }, 100);
        }
    }

    // Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatStatus(status) {
        const statusMap = {
            'learning': 'Learning',
            'polishing': 'Polishing',
            'performance-ready': 'Performance Ready',
            'inactive': 'Inactive'
        };
        return statusMap[status] || status;
    }

    capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    formatRelativeDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    }

    showNotification(message, type = 'info') {
        if (window.app?.currentPage?.showNotification) {
            window.app.currentPage.showNotification(message, type);
        }
    }

    showError(message) {
        const grid = document.getElementById('repertoireGrid');
        if (grid) {
            grid.innerHTML = `<div class="error-state">${message}</div>`;
        }
    }

    onActivate() {
        // Refresh data when tab is activated
        this.loadRepertoire();
    }

    destroy() {
        // Clean up
        window.repertoireTab = null;
    }
}
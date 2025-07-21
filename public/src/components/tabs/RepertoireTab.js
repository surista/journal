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
                            <option value="performance-ready">Performance</option>
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
                        <span class="stat-label">Performance</span>
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
                                    <option value="performance-ready">Performance</option>
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

    // Fix for RepertoireTab.js - attachEventListeners method
    attachEventListeners() {
        console.log('🎸 RepertoireTab: attachEventListeners called');
        console.log('🎸 Container exists:', !!this.container);

        if (this.container) {
            // Remove previous event listener if it exists
            if (this.addSongClickHandler) {
                const oldBtn = this.container.querySelector('#addSongBtn');
                if (oldBtn) {
                    oldBtn.removeEventListener('click', this.addSongClickHandler);
                }
            }

            // Add debugging for the Add Song button
            const addSongBtn = this.container.querySelector('#addSongBtn');
            console.log('🎸 Add Song button found:', !!addSongBtn);
            if (addSongBtn) {
                console.log('🎸 Add Song button element:', addSongBtn);
                this.addSongClickHandler = (e) => {
                    console.log('🎸 Add Song button clicked directly!');
                    e.preventDefault();
                    this.showSongModal();
                };
                addSongBtn.addEventListener('click', this.addSongClickHandler);
            }

            // ESC key handler for modal - store reference for cleanup
            this.escKeyHandler = (e) => {
                if (e.key === 'Escape') {
                    const modal = document.getElementById('songModal');
                    if (modal && (modal.style.display === 'flex' || modal.style.visibility === 'visible')) {
                        console.log('🎸 ESC key pressed, closing modal');
                        this.hideSongModal();
                    }
                }
            };
            document.addEventListener('keydown', this.escKeyHandler);

            // Event delegation with extensive debugging
            this.container.addEventListener('click', async (e) => {
                console.log('🎸 Container click detected:', e.target);
                console.log('🎸 Target ID:', e.target.id);
                console.log('🎸 Target classes:', e.target.className);

                const target = e.target;

                // Handle YouTube link click
                if (target.classList.contains('load-youtube-link') || target.closest('.load-youtube-link')) {
                    console.log('🎸 YouTube link clicked');
                    e.preventDefault();
                    e.stopPropagation();
                    const link = target.classList.contains('load-youtube-link') ? target : target.closest('.load-youtube-link');
                    const url = link.dataset.url;
                    if (url) {
                        this.loadYouTubeInPracticeTab(url);
                    }
                    return;
                }

                // Handle quick edit button
                if (target.classList.contains('edit-song-quick') || target.closest('.edit-song-quick')) {
                    console.log('🎸 Quick edit button clicked');
                    e.stopPropagation();
                    const btn = target.classList.contains('edit-song-quick') ? target : target.closest('.edit-song-quick');
                    const songId = btn.dataset.id;
                    this.editSong(songId);
                    return;
                }

                // Handle quick delete button
                if (target.classList.contains('delete-song-quick') || target.closest('.delete-song-quick')) {
                    console.log('🎸 Quick delete button clicked');
                    e.stopPropagation();
                    const btn = target.classList.contains('delete-song-quick') ? target : target.closest('.delete-song-quick');
                    const songId = btn.dataset.id;
                    await this.deleteSong(songId);
                    return;
                }

                // Handle collapsible song cards
                const songHeaderContent = target.closest('.song-header-content[data-toggle="collapse"]');
                if (songHeaderContent) {
                    console.log('🎸 Song header clicked');
                    const targetId = songHeaderContent.getAttribute('data-target');
                    const targetElement = document.getElementById(targetId);
                    const songHeader = songHeaderContent.closest('.song-header');

                    if (targetElement) {
                        if (targetElement.style.display === 'none' || !targetElement.style.display) {
                            targetElement.style.display = 'block';
                            songHeader.classList.add('expanded');
                        } else {
                            targetElement.style.display = 'none';
                            songHeader.classList.remove('expanded');
                        }
                    }
                    e.stopPropagation();
                    return;
                }

                // Add Song button - improved detection with debugging
                if (target.id === 'addSongBtn') {
                    console.log('🎸 Add Song button clicked via event delegation (direct match)!');
                    e.preventDefault();
                    this.showSongModal();
                    return;
                }

                if (target.closest('#addSongBtn')) {
                    console.log('🎸 Add Song button clicked via event delegation (closest match)!');
                    e.preventDefault();
                    this.showSongModal();
                    return;
                }

                // Debug other potential matches
                if (target.textContent && target.textContent.includes('Add Song')) {
                    console.log('🎸 Found element with "Add Song" text:', target);
                    e.preventDefault();
                    this.showSongModal();
                    return;
                }

                // Close modal buttons - check for close button or its parent
                if (target.id === 'closeSongModal' ||
                    target.id === 'cancelSongBtn' ||
                    target.classList.contains('close-btn') ||
                    target.classList.contains('close-modal')) {
                    console.log('🎸 Close modal button clicked');
                    e.preventDefault();
                    this.hideSongModal();
                    return;
                }

                // Song actions
                if (target.classList.contains('edit-song-btn') || target.closest('.edit-song-btn')) {
                    console.log('🎸 Edit song button clicked');
                    const btn = target.classList.contains('edit-song-btn') ? target : target.closest('.edit-song-btn');
                    const songId = btn.dataset.id;
                    this.editSong(songId);
                    return;
                }

                if (target.classList.contains('delete-song-btn') || target.closest('.delete-song-btn')) {
                    console.log('🎸 Delete song button clicked');
                    const btn = target.classList.contains('delete-song-btn') ? target : target.closest('.delete-song-btn');
                    const songId = btn.dataset.id;
                    await this.deleteSong(songId);
                    return;
                }

                if (target.classList.contains('practice-song-btn') || target.closest('.practice-song-btn')) {
                    console.log('🎸 Practice song button clicked');
                    const btn = target.classList.contains('practice-song-btn') ? target : target.closest('.practice-song-btn');
                    const songId = btn.dataset.id;
                    this.logPractice(songId);
                    return;
                }
            });

            // Form submission - remove old handler first
            if (this.submitHandler) {
                this.container.removeEventListener('submit', this.submitHandler);
            }
            
            this.submitHandler = async (e) => {
                console.log('🎸 Form submission detected:', e.target.id);
                if (e.target.id === 'songForm') {
                    e.preventDefault();
                    await this.saveSong();
                }
            };
            
            this.container.addEventListener('submit', this.submitHandler);

            // Filter and search changes
            this.container.addEventListener('change', (e) => {
                console.log('🎸 Change event:', e.target.id, e.target.value);
                if (e.target.id === 'difficultyFilter') {
                    this.currentFilter.difficulty = e.target.value;
                    this.applyFilters();
                } else if (e.target.id === 'statusFilter') {
                    this.currentFilter.status = e.target.value;
                    this.applyFilters();
                }
            });

            this.container.addEventListener('input', (e) => {
                console.log('🎸 Input event:', e.target.id, e.target.value);
                if (e.target.id === 'repertoireSearch') {
                    this.currentFilter.search = e.target.value;
                    this.applyFilters();
                }
            });
        }
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
            <div class="song-card" data-id="${song.id}" style="padding: 10px 20px; border-bottom: 1px solid var(--border);">
                <div class="song-row" style="display: flex; align-items: center; gap: 16px;">
                    <span class="song-title" style="font-weight: 600; color: var(--text-primary); white-space: nowrap;">
                        ${this.escapeHtml(song.title)}
                    </span>
                    <span class="song-artist" style="color: var(--text-secondary); white-space: nowrap; opacity: 0.8;">
                        ${song.artist ? this.escapeHtml(song.artist) : ''}
                    </span>
                    ${song.videoLink ? `
                        <a href="#" class="youtube-link load-youtube-link" data-url="${song.videoLink}" style="color: var(--primary); text-decoration: none; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; display: inline-block; opacity: 0.9;" title="${song.videoLink}">
                            🔗 ${this.extractYouTubeDomain(song.videoLink)}
                        </a>
                    ` : ''}
                    <span class="song-status status-${song.status}" style="padding: 3px 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; border-radius: 4px; white-space: nowrap;">
                        ${this.formatStatus(song.status)}
                    </span>
                    <div style="flex: 1;"></div>
                    <button class="btn-icon edit-song-quick" data-id="${song.id}" title="Edit song" style="background: none; border: none; cursor: pointer; font-size: 18px; opacity: 0.7; transition: opacity 0.2s; padding: 4px;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">
                        ✏️
                    </button>
                    <button class="btn-icon delete-song-quick" data-id="${song.id}" title="Delete song" style="background: none; border: none; cursor: pointer; font-size: 18px; opacity: 0.7; transition: opacity 0.2s; padding: 4px;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">
                        🗑️
                    </button>
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
        console.log('🎸 showSongModal called with songId:', songId);

        const modal = document.getElementById('songModal');
        if (!modal) {
            console.error('🎸 Modal not found!');
            return;
        }

        // Apply the centering styles
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        modal.style.zIndex = '9999';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';

        const modalTitle = document.getElementById('songModalTitle');
        const form = document.getElementById('songForm');

        if (songId) {
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
            modalTitle.textContent = 'Add New Song';
            form.reset();
            delete form.dataset.songId;
        }
    }

    hideSongModal() {
        console.log('🎸 hideSongModal called');
        const modal = document.getElementById('songModal');
        if (modal) {
            modal.style.display = 'none';
            modal.style.visibility = 'hidden';
            modal.style.opacity = '0';
            const form = document.getElementById('songForm');
            if (form) {
                form.reset();
                delete form.dataset.songId;
            }
        }
    }

    async saveSong() {
        // Prevent double saves
        if (this.isSaving) {
            console.log('🎸 Save already in progress, ignoring duplicate request');
            return;
        }
        
        this.isSaving = true;
        
        try {
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
            
            // Validate required fields
            if (!songData.title) {
                this.showNotification('Song title is required', 'error');
                this.isSaving = false;
                return;
            }
            
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
        } finally {
            this.isSaving = false;
        }
    }

    editSong(songId) {
        this.showSongModal(songId);
    }

    async deleteSong(songId) {
        if (!confirm('Are you sure you want to delete this song?')) {
            return;
        }

        try {
            await this.storageService.deleteRepertoireSong(songId);
            this.showNotification('Song deleted successfully', 'success');
            await this.loadRepertoire();
        } catch (error) {
            console.error('Error deleting song:', error);
            this.showNotification('Failed to delete song', 'error');
        }
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

    loadYouTubeInPracticeTab(url) {
        console.log('🎸 Loading YouTube URL in practice tab:', url);
        
        // Switch to practice tab
        if (window.app && window.app.currentPage) {
            window.app.currentPage.switchTab('practice');
            
            // Wait for tab to load, then switch to YouTube mode and load the video
            setTimeout(() => {
                // Find and click the YouTube source tab
                const youtubeTab = document.querySelector('.source-tab[data-source="youtube"]');
                if (youtubeTab) {
                    youtubeTab.click();
                    
                    // Wait for YouTube input to be visible
                    setTimeout(() => {
                        // Set the URL in the input field
                        const youtubeInput = document.getElementById('youtubeUrlInput');
                        const loadBtn = document.getElementById('loadYoutubeBtn');
                        
                        if (youtubeInput && loadBtn) {
                            youtubeInput.value = url;
                            loadBtn.click();
                            
                            this.showNotification('Loading YouTube video in practice tab...', 'info');
                        } else {
                            console.error('YouTube input elements not found');
                            // Try again with longer delay
                            setTimeout(() => {
                                const retryInput = document.getElementById('youtubeUrlInput');
                                const retryBtn = document.getElementById('loadYoutubeBtn');
                                if (retryInput && retryBtn) {
                                    retryInput.value = url;
                                    retryBtn.click();
                                    this.showNotification('Loading YouTube video...', 'info');
                                }
                            }, 500);
                        }
                    }, 200);
                } else {
                    console.error('YouTube source tab not found');
                }
            }, 500);
        }
    }

    // Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    extractYouTubeDomain(url) {
        try {
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                return 'YouTube';
            }
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch (error) {
            return url.substring(0, 30) + '...';
        }
    }

    formatStatus(status) {
        const statusMap = {
            'learning': 'Learning',
            'polishing': 'Polishing',
            'performance-ready': 'Performance',
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
        // Clean up event listeners
        if (this.escKeyHandler) {
            document.removeEventListener('keydown', this.escKeyHandler);
        }
        // Clean up global reference
        window.repertoireTab = null;
    }
}
// Practice Form Component - Fixed with proper form synchronization
import {debounce, TimeUtils} from '../utils/helpers.js';
import {notificationManager} from '../services/notificationManager.js';
import { sanitizeInput, escapeHtml } from '../utils/sanitizer.js';

export class PracticeForm {
    constructor(container, storageService) {
        this.container = container;
        this.storageService = storageService;
        this.timer = null;
        this.formState = this.loadFormState();
        this.isPercentageMode = false;
        this.baseTempo = 120; // Default base tempo for percentage calculations
        this.tabSuffix = ''; // Will be set based on container
        this.currentAudioFileName = ''; // Track current audio file
        this.currentYouTubeInfo = null; // Track YouTube video info
        this.currentMediaType = 'file'; // 'file' or 'youtube'
        this.isSubmitting = false; // Add this flag to prevent duplicate submissions

        // Determine tab suffix from container
        if (container) {
            const containerId = container.id || '';
            if (containerId.includes('Audio')) {
                this.tabSuffix = 'Audio';
            } else if (containerId.includes('Metronome')) {
                this.tabSuffix = 'Metronome';
            } else {
                this.tabSuffix = 'Practice';
            }
        }

        // Debounced save function
        this.debouncedSaveFormState = debounce(() => {
            this.saveFormState();
        }, 1000); // Save after 1 second of inactivity
    }

    render() {
        // Generate unique IDs for this instance
        const formId = `practiceForm${this.tabSuffix}`;
        const practiceAreaId = `practiceArea${this.tabSuffix}`;
        const customAreaId = `customArea${this.tabSuffix}`;
        const customAreaWrapperId = `customAreaWrapper${this.tabSuffix}`;
        const tempoValueId = `tempoValue${this.tabSuffix}`;
        const tempoLabelId = `tempoLabel${this.tabSuffix}`;
        const tempoToggleId = `tempoToggle${this.tabSuffix}`;
        const tempoSuffixId = `tempoSuffix${this.tabSuffix}`;
        const tempoHintId = `tempoHint${this.tabSuffix}`;
        const hintTextId = `hintText${this.tabSuffix}`;
        const keyId = `key${this.tabSuffix}`;
        const audioFileSectionId = `audioFileSection${this.tabSuffix}`;
        const audioFileNameId = `audioFileName${this.tabSuffix}`;
        const audioFileNameDisplayId = `audioFileNameDisplay${this.tabSuffix}`;
        const notesId = `notes${this.tabSuffix}`;
        const sessionDurationId = `sessionDuration${this.tabSuffix}`;
        const autoSaveStatusId = `autoSaveStatus${this.tabSuffix}`;

        this.container.innerHTML = `
            <div class="practice-form">
                <form id="${formId}">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="${practiceAreaId}">Practice Area *</label>
                            <select id="${practiceAreaId}" name="practiceArea" required>
                                <option value="">Select practice area...</option>
                                <option value="Scales">Scales</option>
                                <option value="Chords">Chords</option>
                                <option value="Arpeggios">Arpeggios</option>
                                <option value="Songs">Songs</option>
                                <option value="Technique">Technique</option>
                                <option value="Theory">Theory</option>
                                <option value="Improvisation">Improvisation</option>
                                <option value="Sight Reading">Sight Reading</option>
                                <option value="Ear Training">Ear Training</option>
                                <option value="Rhythm">Rhythm</option>
                                <option value="Audio Practice">Audio Practice</option>
                                <option value="custom">+ Add Custom Area...</option>
                            </select>
                            
                            <!-- Custom area input, hidden by default -->
                            <div id="${customAreaWrapperId}" style="display: none; margin-top: 10px;">
                                <input type="text" id="${customAreaId}" name="customArea" placeholder="Enter custom practice area" 
                                       style="width: 100%; padding: 8px; background: var(--bg-input); 
                                              border: 1px solid var(--border); border-radius: var(--radius-md); 
                                              color: var(--text-primary);">
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="${tempoValueId}">
                                <span id="${tempoLabelId}">BPM (TEMPO)</span>
                                <button type="button" class="tempo-toggle-btn" id="${tempoToggleId}" title="Toggle between BPM and percentage">
                                    <span class="toggle-icon">🔄</span>
                                </button>
                            </label>
                            <div class="tempo-input-group">
                                <input type="text" id="${tempoValueId}" name="tempoValue" placeholder="Enter value" 
                                       pattern="[0-9]*\\.?[0-9]*" inputmode="decimal">
                                <span class="tempo-suffix" id="${tempoSuffixId}">BPM</span>
                            </div>
                            <div class="tempo-hint" id="${tempoHintId}">
                                <span id="${hintTextId}">Range: 40-300 BPM</span>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="${keyId}">Key</label>
                            <select id="${keyId}" name="key">
                                <option value="">Select key (optional)...</option>
                                <optgroup label="Major Keys">
                                    <option value="C Major">C Major</option>
                                    <option value="C# / Db Major">C# / Db Major</option>
                                    <option value="D Major">D Major</option>
                                    <option value="D# / Eb Major">D# / Eb Major</option>
                                    <option value="E Major">E Major</option>
                                    <option value="F Major">F Major</option>
                                    <option value="F# / Gb Major">F# / Gb Major</option>
                                    <option value="G Major">G Major</option>
                                    <option value="G# / Ab Major">G# / Ab Major</option>
                                    <option value="A Major">A Major</option>
                                    <option value="A# / Bb Major">A# / Bb Major</option>
                                    <option value="B Major">B Major</option>
                                </optgroup>
                                <optgroup label="Minor Keys">
                                    <option value="C Minor">C Minor</option>
                                    <option value="C# / Db Minor">C# / Db Minor</option>
                                    <option value="D Minor">D Minor</option>
                                    <option value="D# / Eb Minor">D# / Eb Minor</option>
                                    <option value="E Minor">E Minor</option>
                                    <option value="F Minor">F Minor</option>
                                    <option value="F# / Gb Minor">F# / Gb Minor</option>
                                    <option value="G Minor">G Minor</option>
                                    <option value="G# / Ab Minor">G# / Ab Minor</option>
                                    <option value="A Minor">A Minor</option>
                                    <option value="A# / Bb Minor">A# / Bb Minor</option>
                                    <option value="B Minor">B Minor</option>
                                </optgroup>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Audio file display section - visible when audio file is loaded -->
                    <div id="${audioFileSectionId}" class="audio-file-section" style="display: none;">
                        <div class="audio-file-info">
                            <span class="audio-file-label">🎵 Audio File:</span>
                            <span class="audio-file-name" id="${audioFileNameDisplayId}">No file loaded</span>
                        </div>
                    </div>
                    
                    <!-- Hidden field to store audio file name -->
                    <input type="hidden" id="${audioFileNameId}" name="audioFileName" value="">
                    
                    <div class="form-group">
                        <label for="${notesId}">Notes</label>
                        <textarea id="${notesId}" name="notes" placeholder="What did you work on? Any breakthroughs or challenges?"></textarea>
                    </div>
                    <div class="form-stats">
                        <div class="stat-item">
                            <span class="stat-label">Session Duration:</span>
                            <span class="stat-value" id="${sessionDurationId}">0m</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Form Auto-saved:</span>
                            <span class="stat-value" id="${autoSaveStatusId}">✓</span>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">
                        💾 Save Practice Session
                    </button>
                </form>
            </div>            
        `;

        this.attachEventListeners();
        this.restoreFormState();

        // Don't show audio file on initial render unless conditions are met
        this.updateAudioFileDisplay();

        // Sync form state across tabs
        this.syncFormWithOtherTabs();
    }

    attachEventListeners() {
        const form = this.container.querySelector(`#practiceForm${this.tabSuffix}`);
        if (form && !form.hasAttribute('data-listeners-attached')) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
            form.setAttribute('data-listeners-attached', 'true');
        }

        // Collapsible header with audio check
        const header = this.container.querySelector('.log-practice-header');
        if (header) {
            header.addEventListener('click', () => {
                const section = header.closest('.log-practice-section');
                const icon = header.querySelector('.collapse-icon');

                if (section && icon) {
                    // Check if any audio is playing globally
                    let isAudioPlaying = false;

                    // Check via audio player
                    if (window.app?.currentPage?.components?.audioPlayer?.isPlaying) {
                        isAudioPlaying = true;
                    }

                    // Check via metronome
                    if (window.app?.currentPage?.components?.metronome?.isPlaying) {
                        isAudioPlaying = true;
                    }

                    if (isAudioPlaying) {
                        notificationManager.error("Can't save while audio is playing");
                        return;
                    }

                    section.classList.toggle('collapsed');
                    icon.textContent = section.classList.contains('collapsed') ? '▶' : '▼';
                }
            });
        }

        // Handle practice area selection
        const practiceAreaSelect = document.getElementById(`practiceArea${this.tabSuffix}`);
        if (practiceAreaSelect) {
            practiceAreaSelect.addEventListener('change', (e) => {
                const customWrapper = document.getElementById(`customAreaWrapper${this.tabSuffix}`);
                const customInput = document.getElementById(`customArea${this.tabSuffix}`);

                if (e.target.value === 'custom') {
                    customWrapper.style.display = 'block';
                    customInput.required = true;
                    customInput.focus();
                } else {
                    customWrapper.style.display = 'none';
                    customInput.required = false;
                    customInput.value = '';
                }

                this.debouncedSaveFormState();
                this.syncFormToOtherTabs();
            });
        }

        // Auto-save form state on input with debouncing
        const form_inputs = form.querySelectorAll('input, select, textarea');
        form_inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.debouncedSaveFormState();
                this.updateAutoSaveStatus();
                this.syncFormToOtherTabs();
            });
        });

        // Tempo toggle button - Fixed with proper event handling
        const tempoToggle = document.getElementById(`tempoToggle${this.tabSuffix}`);
        if (tempoToggle) {
            tempoToggle.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent any default button behavior
                e.stopPropagation(); // Stop event bubbling
                this.toggleTempoMode();
            });
        }

        // Tempo input validation
        const tempoInput = this.container.querySelector(`#tempoValue${this.tabSuffix}`);
        if (tempoInput) {
            tempoInput.addEventListener('input', (e) => this.validateTempoInput(e));
            tempoInput.addEventListener('blur', (e) => this.formatTempoValue(e));
        }

        // Update session duration display
        if (this.timer) {
            this.timer.onTimeUpdate = (elapsedTime) => {
                const seconds = Math.floor(elapsedTime / 1000);
                const durationEl = document.getElementById(`sessionDuration${this.tabSuffix}`);
                if (durationEl) {
                    durationEl.textContent = TimeUtils.formatDuration(seconds, true);
                }

                // Update audio file display based on timer
                this.updateAudioFileDisplay();
            };
        }

        // Listen for audio file changes
        window.addEventListener('audioFileLoaded', (e) => {
            this.handleAudioFileLoaded(e);
        });

        // Listen for YouTube video changes
        window.addEventListener('youtubeVideoLoaded', (e) => {
            this.handleYouTubeVideoLoaded(e);
        });

        // Listen for form sync events from other tabs
        window.addEventListener('practiceFormSync', (e) => {
            if (e.detail.source !== this.tabSuffix) {
                this.syncFromFormData(e.detail.formData);
            }
        });

        // Listen for tab changes to clear audio file name when not in Audio tab
        window.addEventListener('hashchange', () => {
            this.handleTabChange();
        });
    }

    handleAudioFileLoaded(e) {
        if (e.detail && e.detail.fileName) {
            this.currentAudioFileName = e.detail.fileName;
            this.currentMediaType = 'file';

            // Only show audio file if we're in the Audio tab
            if (this.tabSuffix === 'Audio') {
                this.updateAudioFileDisplay();
            }

            // Sync to other tabs (but they won't show it unless conditions are met)
            this.syncFormToOtherTabs();
        }
    }

    handleYouTubeVideoLoaded(e) {
        if (e.detail) {
            this.currentYouTubeInfo = e.detail;
            this.currentMediaType = 'youtube';

            // Only show in Audio tab
            if (this.tabSuffix === 'Audio') {
                this.updateAudioFileDisplay();
            }

            // Sync to other tabs
            this.syncFormToOtherTabs();
        }
    }

    updateAudioFileDisplay() {
        const fileNameInput = document.getElementById(`audioFileName${this.tabSuffix}`);
        const audioFileSection = document.getElementById(`audioFileSection${this.tabSuffix}`);
        const audioFileNameDisplay = document.getElementById(`audioFileNameDisplay${this.tabSuffix}`);

        // Only show audio file if we're in the Audio tab and have media loaded
        const shouldShowAudio = this.tabSuffix === 'Audio' && (this.currentAudioFileName || this.currentYouTubeInfo);

        if (shouldShowAudio) {
            let displayText = '';
            let hiddenValue = '';

            if (this.currentMediaType === 'youtube' && this.currentYouTubeInfo) {
                displayText = `YouTube: ${this.currentYouTubeInfo.title || this.currentYouTubeInfo.videoId}`;
                hiddenValue = `youtube:${this.currentYouTubeInfo.url}|${this.currentYouTubeInfo.title || this.currentYouTubeInfo.videoId}`;
            } else if (this.currentAudioFileName) {
                displayText = this.currentAudioFileName;
                hiddenValue = `file:${this.currentAudioFileName}`;
            }

            if (fileNameInput) fileNameInput.value = hiddenValue;
            if (audioFileSection) audioFileSection.style.display = 'block';
            if (audioFileNameDisplay) audioFileNameDisplay.textContent = displayText;
        } else {
            if (fileNameInput) fileNameInput.value = '';
            if (audioFileSection) audioFileSection.style.display = 'none';
            if (audioFileNameDisplay) audioFileNameDisplay.textContent = 'No file loaded';
        }
    }

    handleTabChange() {
        // Clear audio file display when switching away from Audio tab
        const currentHash = window.location.hash.slice(1);
        if (currentHash !== 'audio' && this.tabSuffix !== 'Audio') {
            this.currentAudioFileName = '';
            this.currentYouTubeInfo = null;
            this.updateAudioFileDisplay();
        }
    }

    syncFormToOtherTabs() {
        const formData = this.getFormData();

        // Dispatch event for other tabs to sync
        window.dispatchEvent(new CustomEvent('practiceFormSync', {
            detail: {
                source: this.tabSuffix,
                formData: formData
            }
        }));
    }

    syncFromFormData(formData) {
        // Sync practice area
        const practiceAreaEl = document.getElementById(`practiceArea${this.tabSuffix}`);
        if (practiceAreaEl && formData.practiceArea !== undefined) {
            practiceAreaEl.value = formData.practiceArea;

            // Handle custom area visibility
            if (formData.practiceArea === 'custom') {
                const customWrapper = document.getElementById(`customAreaWrapper${this.tabSuffix}`);
                const customInput = document.getElementById(`customArea${this.tabSuffix}`);
                if (customWrapper) customWrapper.style.display = 'block';
                if (customInput) customInput.value = formData.customArea || '';
            }
        }

        // Sync tempo
        const tempoValueEl = document.getElementById(`tempoValue${this.tabSuffix}`);
        if (tempoValueEl && formData.tempoValue !== undefined) {
            tempoValueEl.value = formData.tempoValue;
        }

        // Sync percentage mode
        if (formData.isPercentageMode !== undefined && formData.isPercentageMode !== this.isPercentageMode) {
            this.isPercentageMode = formData.isPercentageMode;
            this.updateTempoModeDisplay();
        }

        // Sync key
        const keyEl = document.getElementById(`key${this.tabSuffix}`);
        if (keyEl && formData.key !== undefined) {
            keyEl.value = formData.key;
        }

        // Sync notes
        const notesEl = document.getElementById(`notes${this.tabSuffix}`);
        if (notesEl && formData.notes !== undefined) {
            notesEl.value = formData.notes;
        }

        // Sync audio file
        if (formData.audioFileName) {
            const fileNameInput = document.getElementById(`audioFileName${this.tabSuffix}`);
            const audioFileSection = document.getElementById(`audioFileSection${this.tabSuffix}`);
            const audioFileNameDisplay = document.getElementById(`audioFileNameDisplay${this.tabSuffix}`);

            if (fileNameInput) fileNameInput.value = formData.audioFileName;
            if (audioFileSection) audioFileSection.style.display = 'block';
            if (audioFileNameDisplay) audioFileNameDisplay.textContent = formData.audioFileName;
        }
    }

    getFormData() {
        const practiceAreaEl = document.getElementById(`practiceArea${this.tabSuffix}`);
        const customAreaEl = document.getElementById(`customArea${this.tabSuffix}`);
        const tempoValueEl = document.getElementById(`tempoValue${this.tabSuffix}`);
        const keyEl = document.getElementById(`key${this.tabSuffix}`);
        const notesEl = document.getElementById(`notes${this.tabSuffix}`);
        const audioFileNameEl = document.getElementById(`audioFileName${this.tabSuffix}`);

        return {
            practiceArea: practiceAreaEl ? practiceAreaEl.value : '',
            customArea: customAreaEl ? customAreaEl.value : '',
            tempoValue: tempoValueEl ? tempoValueEl.value : '',
            isPercentageMode: this.isPercentageMode,
            key: keyEl ? keyEl.value : '',
            notes: notesEl ? notesEl.value : '',
            audioFileName: audioFileNameEl ? audioFileNameEl.value : ''
        };
    }

    syncFormWithOtherTabs() {
        // Check if there's saved form state and sync from it
        const savedState = this.loadFormState();
        if (savedState) {
            this.syncFromFormData(savedState);
        }
    }

    toggleTempoMode() {
        this.isPercentageMode = !this.isPercentageMode;
        this.updateTempoModeDisplay();
        this.syncFormToOtherTabs();

        // Clear the input when switching modes to avoid confusion
        const tempoInput = document.getElementById(`tempoValue${this.tabSuffix}`);
        if (tempoInput) {
            tempoInput.value = '';
        }
    }

    updateTempoModeDisplay() {
        const tempoLabel = document.getElementById(`tempoLabel${this.tabSuffix}`);
        const tempoSuffix = document.getElementById(`tempoSuffix${this.tabSuffix}`);
        const hintText = document.getElementById(`hintText${this.tabSuffix}`);
        const tempoInput = document.getElementById(`tempoValue${this.tabSuffix}`);
        const formGroup = tempoInput ? tempoInput.closest('.form-group') : null;

        if (this.isPercentageMode) {
            if (tempoLabel) tempoLabel.textContent = 'TEMPO';
            if (tempoSuffix) tempoSuffix.textContent = 'TEMPO';
            if (hintText) hintText.textContent = 'Percentage of original tempo (e.g., 75% = slower, 125% = faster)';
            if (formGroup) formGroup.classList.add('percentage-mode');
            if (tempoInput) tempoInput.placeholder = 'Enter percentage';
        } else {
            if (tempoLabel) tempoLabel.textContent = 'BPM (TEMPO)';
            if (tempoSuffix) tempoSuffix.textContent = 'BPM';
            if (hintText) hintText.textContent = 'Range: 40-300 BPM';
            if (formGroup) formGroup.classList.remove('percentage-mode');
            if (tempoInput) tempoInput.placeholder = 'Enter BPM';
        }

        // Clear the input value when switching modes
        if (tempoInput) {
            tempoInput.value = '';
        }
    }

    validateTempoInput(event) {
        const input = event.target;
        const value = input.value;

        // Allow empty value
        if (value === '') {
            input.setCustomValidity('');
            return;
        }

        // Remove any non-numeric characters except decimal point
        const cleanValue = value.replace(/[^\d.]/g, '');

        // Ensure only one decimal point
        const parts = cleanValue.split('.');
        if (parts.length > 2) {
            input.value = parts[0] + '.' + parts.slice(1).join('');
        } else {
            input.value = cleanValue;
        }

        // Validate based on mode
        const numValue = parseFloat(input.value);

        if (isNaN(numValue)) {
            input.setCustomValidity('Please enter a valid number');
        } else if (this.isPercentageMode) {
            // Percentage mode: allow 10% to 200%
            if (numValue < 10 || numValue > 200) {
                input.setCustomValidity('Percentage must be between 10% and 200%');
            } else {
                input.setCustomValidity('');
            }
        } else {
            // BPM mode: allow 40 to 300 BPM
            if (numValue < 40 || numValue > 300) {
                input.setCustomValidity('BPM must be between 40 and 300');
            } else {
                input.setCustomValidity('');
            }
        }
    }

    formatTempoValue(event) {
        const input = event.target;
        const value = parseFloat(input.value);

        if (!isNaN(value)) {
            // Format to remove unnecessary decimal places
            input.value = value.toString();
        }
    }

    async handleSubmit(event) {
        event.preventDefault();

        // Prevent duplicate submissions
        if (this.isSubmitting) {
            return;
        }

        // Get the submit button and disable it
        const submitButton = event.target.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Saving...';
        }

        this.isSubmitting = true;

        try {
            // Try to get form data using the form itself
            const form = event.target;
            const formData = new FormData(form);

            // Get values from form data and sanitize
            let practiceArea = sanitizeInput(formData.get('practiceArea') || '');
            const customArea = sanitizeInput(formData.get('customArea') || '');
            const audioFileValue = sanitizeInput(formData.get('audioFileName') || '');
            const tempoValue = sanitizeInput(formData.get('tempoValue') || '');
            const key = sanitizeInput(formData.get('key') || '');
            const notes = sanitizeInput(formData.get('notes') || '');

            // Parse media info
            let audioFile = null;
            let youtubeUrl = null;
            let youtubeTitle = null;

            if (audioFileValue) {
                if (audioFileValue.startsWith('youtube:')) {
                    // Parse YouTube info
                    const youtubeData = audioFileValue.substring(8); // Remove 'youtube:'
                    const [url, title] = youtubeData.split('|');
                    youtubeUrl = url || '';
                    youtubeTitle = title || '';
                    // Don't set audioFile for YouTube videos
                    audioFile = null;
                } else if (audioFileValue.startsWith('file:')) {
                    // Parse file info
                    audioFile = audioFileValue.substring(5); // Remove 'file:'
                    // Clear YouTube fields for file mode
                    youtubeUrl = null;
                    youtubeTitle = null;
                } else {
                    // Legacy format - assume it's a file
                    audioFile = audioFileValue;
                    youtubeUrl = null;
                    youtubeTitle = null;
                }
            }

            // Use custom area if selected
            if (practiceArea === 'custom') {
                if (customArea && customArea.trim() !== '') {
                    practiceArea = customArea.trim();
                    // Validate length
                    if (practiceArea.length > 50) {
                        notificationManager.error('Practice area name must be less than 50 characters!');
                        return;
                    }
                    // Add the custom area to localStorage for future use
                    this.addCustomPracticeArea(practiceArea);
                } else {
                    notificationManager.error('Please enter a custom practice area!');
                    const customAreaEl = document.getElementById(`customArea${this.tabSuffix}`);
                    if (customAreaEl) customAreaEl.focus();
                    return;
                }
            }

            // Validate practice area
            if (!practiceArea || practiceArea === '' || practiceArea === 'custom') {
                notificationManager.error('Please select or enter a practice area!');
                // Focus on the practice area select
                const practiceAreaEl = document.getElementById(`practiceArea${this.tabSuffix}`);
                if (practiceAreaEl) {
                    practiceAreaEl.focus();
                    // Highlight the select element
                    practiceAreaEl.style.border = '2px solid var(--danger)';
                    setTimeout(() => {
                        practiceAreaEl.style.border = '';
                    }, 3000);
                }
                return;
            }

            // Get duration from timer
            let duration = 0;
            if (this.timer) {
                duration = this.timer.getElapsedTime();
            }

            // Validate duration - must have used the timer
            if (duration <= 0) {
                notificationManager.error('Please use the timer to track your practice session!');
                // Highlight the timer
                const timerDisplay = document.querySelector('.timer-display');
                if (timerDisplay) {
                    timerDisplay.style.animation = 'pulse 1s ease-in-out 3';
                    setTimeout(() => {
                        timerDisplay.style.animation = '';
                    }, 3000);
                }
                return;
            }

            // Warn if session is very short
            if (duration < 60) {
                if (!confirm('This practice session is less than 1 minute. Are you sure you want to save it?')) {
                    return;
                }
            }

            // Process tempo value
            let bpm = null;
            let tempoPercentage = null;

            if (tempoValue) {
                const numValue = parseFloat(tempoValue);

                if (isNaN(numValue)) {
                    notificationManager.error('Please enter a valid tempo value!');
                    return;
                }

                if (this.isPercentageMode) {
                    // Convert percentage to BPM (assuming base tempo)
                    tempoPercentage = numValue;
                    bpm = Math.round(this.baseTempo * (numValue / 100));

                    if (numValue < 10 || numValue > 200) {
                        notificationManager.error('Tempo percentage must be between 10% and 200%!');
                        return;
                    }
                } else {
                    // Direct BPM value
                    bpm = Math.round(numValue);

                    if (bpm < 40 || bpm > 300) {
                        notificationManager.error('BPM must be between 40 and 300!');
                        return;
                    }
                }
            }
            
            // Validate notes length
            if (notes && notes.length > 500) {
                notificationManager.error('Notes must be less than 500 characters!');
                return;
            }

            const practiceEntry = {
                id: Date.now(),
                date: new Date().toISOString(),
                duration: duration,
                practiceArea: practiceArea,
                bpm: bpm,
                tempoPercentage: tempoPercentage,
                key: key || null,
                notes: notes || null,
                audioFile: audioFile || null,
                youtubeUrl: youtubeUrl || null,
                youtubeTitle: youtubeTitle || null
            };

            // Ensure YouTube URL is clean (defensive programming)
            if (practiceEntry.youtubeUrl && practiceEntry.youtubeUrl.includes('youtube.com')) {
                // Extract just the YouTube URL if it somehow got concatenated
                const match = practiceEntry.youtubeUrl.match(/https:\/\/www\.youtube\.com\/watch\?v=[^&]+/);
                if (match) {
                    practiceEntry.youtubeUrl = match[0];
                }
            }

            // Save entry
            await this.storageService.savePracticeEntry(practiceEntry);

            // Check if notes mention a repertoire song
            if (notes) {
                const repertoire = await this.storageService.getRepertoire();

                // Look for song titles in notes (case-insensitive)
                const notesLower = notes.toLowerCase();
                for (const song of repertoire) {
                    if (notesLower.includes(song.title.toLowerCase())) {
                        // Update song practice stats
                        await this.storageService.updateSongPracticeStats(song.id, practiceEntry);
                        break; // Only match first song found
                    }
                }
            }

            // Reset form and timer
            this.resetForm();
            if (this.timer) {
                this.timer.reset();
            }

            // Clear saved form state
            this.clearFormState();

            const minutes = Math.floor(duration / 60);
            notificationManager.success(`Saved ${minutes} minute${minutes !== 1 ? 's' : ''} practice session - rock on! 🎸✨`);

            // Show confetti animation
            this.showConfetti();

            // Emit event for other components to update
            window.dispatchEvent(new CustomEvent('practiceSessionSaved', {
                detail: practiceEntry
            }));

            // Close the practice form after a short delay
            setTimeout(() => {
                this.closeForm();
            }, 1500); // Give time for confetti animation

        } catch (error) {
            console.error('Error saving practice session:', error);
            notificationManager.error('Failed to save practice session. Please try again.');
        } finally {
            // Re-enable the submit button
            this.isSubmitting = false;
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = '💾 Save Practice Session';
            }
        }
    }

    showConfetti() {
        // Create confetti container
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        confettiContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
        `;
        document.body.appendChild(confettiContainer);

        // Create confetti pieces
        const colors = ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ef4444'];
        const confettiCount = 50;

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: absolute;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                left: ${Math.random() * 100}%;
                top: -10px;
                opacity: ${Math.random() * 0.5 + 0.5};
                transform: rotate(${Math.random() * 360}deg);
                animation: confettiFall ${Math.random() * 3 + 2}s ease-out;
            `;
            confettiContainer.appendChild(confetti);
        }

        // Remove confetti after animation
        setTimeout(() => {
            confettiContainer.remove();
        }, 5000);
    }

    closeForm() {
        // Find the collapsible section
        const section = this.container.closest('.log-practice-section');
        if (section) {
            section.classList.add('collapsed');
            const icon = section.querySelector('.collapse-icon');
            if (icon) {
                icon.textContent = '▶';
            }
        }
    }

    addCustomPracticeArea(area) {
        const customAreasKey = 'customPracticeAreas';
        let customAreas = [];

        try {
            const stored = localStorage.getItem(customAreasKey);
            if (stored) {
                customAreas = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading custom areas:', error);
        }

        // Add if not already exists
        if (!customAreas.includes(area)) {
            customAreas.push(area);
            customAreas.sort(); // Keep alphabetical

            try {
                localStorage.setItem(customAreasKey, JSON.stringify(customAreas));

                // Update the select options
                this.updatePracticeAreaOptions();
            } catch (error) {
                console.error('Error saving custom areas:', error);
            }
        }
    }

    updatePracticeAreaOptions() {
        const select = document.getElementById(`practiceArea${this.tabSuffix}`);
        if (!select) return;

        // Store current value
        const currentValue = select.value;

        // Get custom areas
        let customAreas = [];
        try {
            const stored = localStorage.getItem('customPracticeAreas');
            if (stored) {
                customAreas = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading custom areas:', error);
        }

        // Rebuild options
        select.innerHTML = `
            <option value="">Select practice area...</option>
            <option value="Scales">Scales</option>
            <option value="Chords">Chords</option>
            <option value="Arpeggios">Arpeggios</option>
            <option value="Songs">Songs</option>
            <option value="Technique">Technique</option>
            <option value="Theory">Theory</option>
            <option value="Improvisation">Improvisation</option>
            <option value="Sight Reading">Sight Reading</option>
            <option value="Ear Training">Ear Training</option>
            <option value="Rhythm">Rhythm</option>
            <option value="Audio Practice">Audio Practice</option>
            ${customAreas.map(area => `<option value="${area}">${area}</option>`).join('')}
            <option value="custom">+ Add Custom Area...</option>
        `;

        // Restore value
        select.value = currentValue;
    }

    setTimer(timer) {
        this.timer = timer;

        // Set up timer callback for duration display
        if (this.timer) {
            this.timer.onTimeUpdate = (elapsedTime) => {
                const seconds = Math.floor(elapsedTime / 1000);
                const durationEl = document.getElementById(`sessionDuration${this.tabSuffix}`);
                if (durationEl) {
                    durationEl.textContent = TimeUtils.formatDuration(seconds, true);
                }
            };
        }
    }

    resetForm() {
        const form = this.container.querySelector(`#practiceForm${this.tabSuffix}`);
        if (form) {
            form.reset();
        }

        // Reset duration display
        const durationEl = document.getElementById(`sessionDuration${this.tabSuffix}`);
        if (durationEl) {
            durationEl.textContent = '0m';
        }

        // Reset to BPM mode
        this.isPercentageMode = false;
        this.updateTempoModeDisplay();

        // Reset custom area visibility
        const customWrapper = document.getElementById(`customAreaWrapper${this.tabSuffix}`);
        if (customWrapper) {
            customWrapper.style.display = 'none';
        }

        // Clear audio file display
        const audioFileSection = document.getElementById(`audioFileSection${this.tabSuffix}`);
        if (audioFileSection) {
            audioFileSection.style.display = 'none';
        }

        // Clear current audio file name and YouTube info
        this.currentAudioFileName = '';
        this.currentYouTubeInfo = null;
        this.currentMediaType = 'file';

        // Clear audio file input
        const audioFileNameEl = document.getElementById(`audioFileName${this.tabSuffix}`);
        if (audioFileNameEl) {
            audioFileNameEl.value = '';
        }
    }

    saveFormState() {
        const formData = this.getFormData();
        formData.savedAt = new Date().toISOString();

        try {
            localStorage.setItem('practiceFormState', JSON.stringify(formData));
        } catch (error) {
            console.error('Failed to save form state:', error);
        }
    }

    loadFormState() {
        try {
            const saved = localStorage.getItem('practiceFormState');
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            console.error('Failed to load form state:', error);
            return null;
        }
    }

    restoreFormState() {
        // Load custom areas first
        this.updatePracticeAreaOptions();

        if (!this.formState) return;

        this.syncFromFormData(this.formState);

        // Show when form was last saved
        if (this.formState.savedAt) {
            const savedTime = TimeUtils.getRelativeTime(this.formState.savedAt);
            notificationManager.info(`Form restored from ${savedTime}`);
        }
    }

    clearFormState() {
        localStorage.removeItem('practiceFormState');
        this.formState = null;
    }

    updateAutoSaveStatus() {
        const statusEl = document.getElementById(`autoSaveStatus${this.tabSuffix}`);
        if (statusEl) {
            statusEl.textContent = '...';
            statusEl.style.color = 'var(--warning)';

            // Reset to saved state after debounce period
            setTimeout(() => {
                if (statusEl) {
                    statusEl.textContent = '✓';
                    statusEl.style.color = 'var(--success)';
                }
            }, 1100);
        }
    }

    setAudioContext(audioInfo) {
        if (this.tabSuffix === 'Audio') {
            if (audioInfo) {
                // Determine if it's a file or YouTube
                if (audioInfo.includes('youtube:') || audioInfo.includes('YouTube:')) {
                    this.currentYouTubeInfo = {title: audioInfo};
                    this.currentMediaType = 'youtube';
                    this.currentAudioFileName = '';
                } else {
                    this.currentAudioFileName = audioInfo;
                    this.currentMediaType = 'file';
                    this.currentYouTubeInfo = null;
                }
            } else {
                this.currentAudioFileName = '';
                this.currentYouTubeInfo = null;
            }

            this.updateAudioFileDisplay();
        }
    }

    destroy() {
        // Clear any pending debounced saves
        if (this.debouncedSaveFormState) {
            this.debouncedSaveFormState.cancel && this.debouncedSaveFormState.cancel();
        }

        // Clear form state reference
        this.formState = null;

        // Clear timer reference
        this.timer = null;
    }
}
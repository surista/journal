// Practice Form Component - Updated with direct BPM entry and tempo percentage toggle
import { debounce, TimeUtils } from '../utils/helpers.js';
import { notificationManager } from '../services/notificationManager.js';

export class PracticeForm {
    constructor(container, storageService) {
        this.container = container;
        this.storageService = storageService;
        this.timer = null;
        this.formState = this.loadFormState();
        this.isPercentageMode = false;
        this.baseTempo = 120; // Default base tempo for percentage calculations

        // Debounced save function
        this.debouncedSaveFormState = debounce(() => {
            this.saveFormState();
        }, 1000); // Save after 1 second of inactivity
    }

    render() {
        this.container.innerHTML = `
            <div class="practice-form">
                <h2 style="margin-bottom: 20px; color: var(--text-secondary);">Log Practice Session</h2>
                <form id="practiceForm">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="practiceArea">Practice Area *</label>
                            <select id="practiceArea" required>
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
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="tempoValue">
                                <span id="tempoLabel">BPM (Tempo)</span>
                                <button type="button" class="tempo-toggle-btn" id="tempoToggle" title="Toggle between BPM and percentage">
                                    <span class="toggle-icon">🔄</span>
                                </button>
                            </label>
                            <div class="tempo-input-group">
                                <input type="text" id="tempoValue" placeholder="Enter value" 
                                       pattern="[0-9]*\.?[0-9]*" inputmode="decimal">
                                <span class="tempo-suffix" id="tempoSuffix">BPM</span>
                            </div>
                            <div class="tempo-hint" id="tempoHint">
                                <span id="hintText">Range: 40-300 BPM</span>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="key">Key</label>
                            <select id="key">
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
                    <div class="form-group">
                        <label for="notes">Notes</label>
                        <textarea id="notes" placeholder="What did you work on? Any breakthroughs or challenges?"></textarea>
                    </div>
                    <div class="form-stats">
                        <div class="stat-item">
                            <span class="stat-label">Session Duration:</span>
                            <span class="stat-value" id="sessionDuration">0m</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Form Auto-saved:</span>
                            <span class="stat-value" id="autoSaveStatus">✓</span>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">
                        💾 Save Practice Session
                    </button>
                </form>
            </div>

            <style>
                .tempo-input-group {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    position: relative;
                }

                #tempoValue {
                    flex: 1;
                    padding-right: 60px;
                }

                .tempo-suffix {
                    position: absolute;
                    right: 15px;
                    color: var(--text-secondary);
                    font-weight: 500;
                    pointer-events: none;
                }

                .tempo-toggle-btn {
                    background: none;
                    border: none;
                    color: var(--primary);
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                    margin-left: 10px;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }

                .tempo-toggle-btn:hover {
                    background: var(--bg-input);
                    transform: scale(1.05);
                }

                .toggle-icon {
                    font-size: 0.9em;
                    display: inline-block;
                    transition: transform 0.3s ease;
                }

                .tempo-toggle-btn:hover .toggle-icon {
                    transform: rotate(180deg);
                }

                .tempo-hint {
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                    margin-top: 4px;
                }

                .tempo-input-group input:invalid {
                    border-color: var(--danger);
                }

                .percentage-mode .tempo-suffix {
                    color: var(--secondary);
                }

                .percentage-mode #tempoValue {
                    border-color: var(--secondary);
                }

                .percentage-mode #tempoToggle {
                    color: var(--secondary);
                }
            </style>
        `;

        this.attachEventListeners();
        this.restoreFormState();
    }

    attachEventListeners() {
        const form = this.container.querySelector('#practiceForm');
        form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Auto-save form state on input with debouncing
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.debouncedSaveFormState();
                this.updateAutoSaveStatus();
            });
        });

        // Tempo toggle button
        const tempoToggle = this.container.querySelector('#tempoToggle');
        if (tempoToggle) {
            tempoToggle.addEventListener('click', () => this.toggleTempoMode());
        }

        // Tempo input validation
        const tempoInput = this.container.querySelector('#tempoValue');
        if (tempoInput) {
            tempoInput.addEventListener('input', (e) => this.validateTempoInput(e));
            tempoInput.addEventListener('blur', (e) => this.formatTempoValue(e));
        }

        // Update session duration display
        if (this.timer) {
            this.timer.onTimeUpdate = (elapsedTime) => {
                const seconds = Math.floor(elapsedTime / 1000);
                const durationEl = document.getElementById('sessionDuration');
                if (durationEl) {
                    durationEl.textContent = TimeUtils.formatDuration(seconds, true);
                }
            };
        }
    }

    toggleTempoMode() {
        this.isPercentageMode = !this.isPercentageMode;

        const tempoLabel = document.getElementById('tempoLabel');
        const tempoSuffix = document.getElementById('tempoSuffix');
        const hintText = document.getElementById('hintText');
        const tempoInput = document.getElementById('tempoValue');
        const formGroup = tempoInput.closest('.form-group');

        if (this.isPercentageMode) {
            tempoLabel.textContent = 'Tempo (Percentage)';
            tempoSuffix.textContent = '%';
            hintText.textContent = 'Percentage of original tempo (e.g., 75% = slower, 125% = faster)';
            formGroup.classList.add('percentage-mode');
            tempoInput.placeholder = 'Enter percentage';
        } else {
            tempoLabel.textContent = 'BPM (Tempo)';
            tempoSuffix.textContent = 'BPM';
            hintText.textContent = 'Range: 40-300 BPM';
            formGroup.classList.remove('percentage-mode');
            tempoInput.placeholder = 'Enter BPM';
        }

        // Clear the input when switching modes
        tempoInput.value = '';
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

        const practiceArea = document.getElementById('practiceArea').value;
        const tempoValue = document.getElementById('tempoValue').value;
        const key = document.getElementById('key').value;
        const notes = document.getElementById('notes').value;

        if (!practiceArea) {
            notificationManager.error('Please select a practice area!');
            return;
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

        // Get duration from timer
        let duration = 0;
        if (this.timer) {
            duration = this.timer.getElapsedTime();

            // Stop timer if running
            if (this.timer.isRunning) {
                this.timer.stop();
            }
        }

        // Validate duration
        if (duration <= 0) {
            notificationManager.error('Invalid practice duration. Please use the timer!');
            return;
        }

        if (duration < 60) {
            notificationManager.warning('Practice session too short. Keep going! 💪');
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
            notes: notes || null
        };

        try {
            // Save entry
            await this.storageService.savePracticeEntry(practiceEntry);

            // Reset form and timer
            this.resetForm();
            if (this.timer) {
                this.timer.reset();
            }

            // Clear saved form state
            this.clearFormState();

            notificationManager.success('Practice session saved! Great job! 🎸✨');

            // Emit event for other components to update
            window.dispatchEvent(new CustomEvent('practiceSessionSaved', {
                detail: practiceEntry
            }));
        } catch (error) {
            console.error('Error saving practice session:', error);
            notificationManager.error('Failed to save practice session. Please try again.');
        }
    }

    setTimer(timer) {
        this.timer = timer;

        // Set up timer callback for duration display
        if (this.timer) {
            this.timer.onTimeUpdate = (elapsedTime) => {
                const seconds = Math.floor(elapsedTime / 1000);
                const durationEl = document.getElementById('sessionDuration');
                if (durationEl) {
                    durationEl.textContent = TimeUtils.formatDuration(seconds, true);
                }
            };
        }
    }

    resetForm() {
        const form = this.container.querySelector('#practiceForm');
        form.reset();

        // Reset duration display
        const durationEl = document.getElementById('sessionDuration');
        if (durationEl) {
            durationEl.textContent = '0m';
        }

        // Reset to BPM mode
        this.isPercentageMode = false;
        const formGroup = document.querySelector('.percentage-mode');
        if (formGroup) {
            formGroup.classList.remove('percentage-mode');
        }
    }

    saveFormState() {
        // Check if elements exist before trying to save
        const practiceAreaEl = document.getElementById('practiceArea');
        const tempoValueEl = document.getElementById('tempoValue');
        const keyEl = document.getElementById('key');
        const notesEl = document.getElementById('notes');

        // Only save if all elements exist
        if (practiceAreaEl && tempoValueEl && keyEl && notesEl) {
            const formData = {
                practiceArea: practiceAreaEl.value,
                tempoValue: tempoValueEl.value,
                isPercentageMode: this.isPercentageMode,
                key: keyEl.value,
                notes: notesEl.value,
                savedAt: new Date().toISOString()
            };

            try {
                localStorage.setItem('practiceFormState', JSON.stringify(formData));
                console.log('Form state saved');
            } catch (error) {
                console.error('Failed to save form state:', error);
            }
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
        if (!this.formState) return;

        // Check if elements exist before restoring
        const practiceAreaEl = document.getElementById('practiceArea');
        const tempoValueEl = document.getElementById('tempoValue');
        const keyEl = document.getElementById('key');
        const notesEl = document.getElementById('notes');

        if (this.formState.practiceArea && practiceAreaEl) {
            practiceAreaEl.value = this.formState.practiceArea;
        }
        if (this.formState.tempoValue && tempoValueEl) {
            tempoValueEl.value = this.formState.tempoValue;
        }
        if (this.formState.key && keyEl) {
            keyEl.value = this.formState.key;
        }
        if (this.formState.notes && notesEl) {
            notesEl.value = this.formState.notes;
        }

        // Restore tempo mode
        if (this.formState.isPercentageMode) {
            this.toggleTempoMode();
        }

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
        const statusEl = document.getElementById('autoSaveStatus');
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
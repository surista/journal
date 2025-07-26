// UI Controls Module - Handles all UI elements and interactions for the audio player
export class UIControls {
    constructor() {
        this.container = null;
        this.elements = {};
        this.callbacks = {};

        // UI state
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        this.loopStart = null;
        this.loopEnd = null;
        this.isLooping = false;

        // Display formats
        this.timeFormat = 'mm:ss'; // or 'mm:ss.ms'
    }

    initialize(container) {
        console.log('UIControls.initialize called with container:', container);
        this.container = container;
        this.render();
        this.cacheElements();
        console.log('Elements cached:', {
            playPauseBtn: !!this.elements.playPauseBtn,
            stopBtn: !!this.elements.stopBtn,
            speedSlider: !!this.elements.speedSlider
        });
        this.attachEventListeners();
        console.log('Event listeners attached');
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = this.getHTML();
        this.addStyles();
    }

    getHTML() {
        return `
            <div class="audio-player-wrapper">
                <!-- Waveform Container -->
                <div class="waveform-container">
                    <canvas id="waveformCanvas" class="waveform-canvas"></canvas>
                    <div class="loading-overlay" id="loadingOverlay" style="display: none;">
                        <div class="loading-spinner"></div>
                    </div>
                </div>

                <!-- Time Display -->
                <div class="time-display">
                    <span id="currentTime" class="time-current">0:00</span>
                    <span class="time-separator">/</span>
                    <span id="duration" class="time-duration">0:00</span>
                </div>

                <!-- Play/Stop and Loop Controls Combined -->
                <div class="controls-playback-loop">
                    <div class="controls-main">
                        <button id="playPauseBtn" class="btn-control btn-play-pause" title="Play/Pause (Space)">
                            <svg class="icon-play" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                            <svg class="icon-pause" style="display: none;" viewBox="0 0 24 24">
                                <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
                            </svg>
                        </button>
                        <button id="stopBtn" class="btn-control btn-stop" title="Stop">
                            <svg viewBox="0 0 24 24">
                                <path d="M6 6h12v12H6z"/>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="controls-separator">|</div>
                    
                    <div class="controls-loop">
                        <button id="loopStartBtn" class="btn-control btn-loop-start" title="Set Loop Start (I)">
                            <span>[</span>
                        </button>
                        <button id="loopEndBtn" class="btn-control btn-loop-end" title="Set Loop End (O)">
                            <span>]</span>
                        </button>
                        <button id="loopToggleBtn" class="btn-control btn-loop-toggle" title="Toggle Loop (L)">
                            <svg viewBox="0 0 24 24">
                                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>
                            </svg>
                        </button>
                        <button id="loopClearBtn" class="btn-control btn-loop-clear" title="Clear Loop">
                            <span>×</span>
                        </button>
                        <button id="loopSaveBtn" class="btn-control btn-loop-save" title="Save Loop" style="display: none;">
                            <span>💾</span>
                        </button>
                    </div>
                </div>

                <!-- Speed and Pitch Controls Combined -->
                <div class="controls-speed-pitch">
                    <label class="control-label">Speed</label>
                    <div class="speed-controls-group">
                        <input type="range" id="speedSlider" class="slider slider-speed" 
                               min="25" max="200" value="100" step="1">
                        <span id="speedValue" class="value-display">100%</span>
                    </div>
                    <button id="speedResetBtn" class="btn-reset" title="Reset Speed">Reset</button>
                    
                    <label class="control-label pitch-label">Pitch</label>
                    <div class="pitch-controls-group">
                        <button id="pitchDownBtn" class="btn-adjust" title="Lower Pitch (-)">-</button>
                        <span id="pitchValue" class="value-display">0</span>
                        <button id="pitchUpBtn" class="btn-adjust" title="Raise Pitch (+)">+</button>
                    </div>
                    <button id="pitchResetBtn" class="btn-reset" title="Reset Pitch">Reset</button>
                </div>

                <!-- Loop Info Display -->
                <div id="loopInfo" class="loop-info" style="display: none;">
                    <span class="loop-label">Loop:</span>
                    <span id="loopStartTime" class="loop-time">--:--</span>
                    <span class="loop-separator">→</span>
                    <span id="loopEndTime" class="loop-time">--:--</span>
                    <span id="loopDuration" class="loop-duration">(--:--)</span>
                </div>

                <!-- Progress Display -->
                <div id="progressInfo" class="progress-info" style="display: none;">
                    <div class="progress-item">
                        <span class="progress-label">Loops:</span>
                        <span id="loopCount" class="progress-value">0</span>
                    </div>
                    <div id="tempoProgressInfo" class="progress-item" style="display: none;">
                        <span class="progress-label">Tempo:</span>
                        <span id="tempoProgressValue" class="progress-value">100%</span>
                    </div>
                </div>
            </div>
        `;
    }

    addStyles() {
        if (document.getElementById('audioPlayerUIStyles')) return;

        const style = document.createElement('style');
        style.id = 'audioPlayerUIStyles';
        style.textContent = `
            .audio-player-wrapper {
                background: var(--bg-secondary, #1f2937);
                border-radius: 12px;
                padding: 20px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }

            .waveform-container {
                position: relative;
                width: 100%;
                height: 120px;
                background: var(--bg-dark, #111827);
                border-radius: 8px;
                margin-bottom: 20px;
                overflow: hidden;
            }

            .waveform-canvas {
                width: 100%;
                height: 100%;
                cursor: pointer;
            }

            .loading-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .time-display {
                text-align: center;
                font-family: monospace;
                font-size: 18px;
                margin-bottom: 20px;
                color: var(--text-primary, #e5e7eb);
            }

            .controls-playback-loop {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 20px;
                margin-bottom: 20px;
            }

            .controls-main {
                display: flex;
                gap: 10px;
            }

            .btn-control {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                border: none;
                background: var(--primary, #6366f1);
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }

            .btn-control:hover {
                background: var(--primary-hover, #4f46e5);
                transform: scale(1.05);
            }

            .btn-control svg {
                width: 24px;
                height: 24px;
                fill: currentColor;
            }

            .controls-loop {
                display: flex;
                gap: 10px;
            }

            .controls-separator {
                color: var(--text-secondary, #9ca3af);
                font-size: 24px;
                line-height: 1;
                opacity: 0.5;
            }

            .controls-speed-pitch {
                display: flex;
                gap: 15px;
                margin-bottom: 20px;
                align-items: center;
            }

            .pitch-label {
                margin-left: 20px;
            }

            .speed-controls-group,
            .pitch-controls-group {
                display: inline-flex;
                align-items: center;
                gap: 10px;
            }

            .control-label {
                display: inline-block;
                margin-bottom: 0;
                color: var(--text-secondary, #9ca3af);
                font-size: 14px;
            }

            .slider {
                width: 200px;
                margin: 0 10px;
            }

            .btn-adjust {
                width: 32px;
                height: 32px;
                border-radius: 6px;
                border: 1px solid var(--border, #374151);
                background: var(--bg-card, #374151);
                color: var(--text-primary, #e5e7eb);
                cursor: pointer;
                font-size: 18px;
            }

            .btn-reset {
                margin-left: 10px;
                padding: 6px 12px;
                border-radius: 6px;
                border: 1px solid var(--border, #374151);
                background: var(--bg-secondary, #1f2937);
                color: var(--text-primary, #e5e7eb);
                cursor: pointer;
                font-size: 12px;
            }

            .value-display {
                min-width: 50px;
                display: inline-block;
                text-align: center;
                color: var(--primary, #6366f1);
                font-weight: 600;
            }


            .loop-info {
                text-align: center;
                padding: 10px;
                background: var(--bg-dark, #111827);
                border-radius: 6px;
                margin-bottom: 10px;
                color: var(--text-secondary, #9ca3af);
            }

            .progress-info {
                display: flex;
                justify-content: center;
                gap: 20px;
                color: var(--text-secondary, #9ca3af);
                font-size: 14px;
            }

            @media (max-width: 768px) {
                .controls-playback-loop {
                    flex-wrap: wrap;
                    gap: 15px;
                }
                
                .controls-separator {
                    display: none;
                }
                
                .controls-speed-pitch {
                    flex-wrap: wrap;
                    gap: 10px;
                }
                
                .pitch-label {
                    margin-left: 0;
                    width: 100%;
                }

                .slider {
                    width: 150px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    cacheElements() {
        // Look for elements within the container first, then fallback to document
        const findElement = (id) => {
            return this.container?.querySelector(`#${id}`) || document.getElementById(id);
        };

        // Main controls
        this.elements.playPauseBtn = findElement('playPauseBtn');
        this.elements.stopBtn = findElement('stopBtn');

        // Debug: Check if elements exist
        if (!this.elements.playPauseBtn) {
            console.error('playPauseBtn not found!');
            console.log('Container:', this.container);
            console.log('Container HTML:', this.container?.innerHTML?.substring(0, 200));
        }

        // Time display
        this.elements.currentTime = findElement('currentTime');
        this.elements.duration = findElement('duration');

        // Loop controls
        this.elements.loopStartBtn = findElement('loopStartBtn');
        this.elements.loopEndBtn = findElement('loopEndBtn');
        this.elements.loopToggleBtn = findElement('loopToggleBtn');
        this.elements.loopClearBtn = findElement('loopClearBtn');
        this.elements.loopSaveBtn = findElement('loopSaveBtn');

        // Speed controls
        this.elements.speedSlider = findElement('speedSlider');
        this.elements.speedValue = findElement('speedValue');
        this.elements.speedResetBtn = findElement('speedResetBtn');

        // Pitch controls
        this.elements.pitchValue = findElement('pitchValue');
        this.elements.pitchUpBtn = findElement('pitchUpBtn');
        this.elements.pitchDownBtn = findElement('pitchDownBtn');
        this.elements.pitchResetBtn = findElement('pitchResetBtn');

        // Track current pitch value internally
        this.currentPitchValue = 0;

        // Loop info
        this.elements.loopInfo = findElement('loopInfo');
        this.elements.loopStartTime = findElement('loopStartTime');
        this.elements.loopEndTime = findElement('loopEndTime');
        this.elements.loopDuration = findElement('loopDuration');

        // Progress info
        this.elements.progressInfo = findElement('progressInfo');
        this.elements.loopCount = document.getElementById('loopCount');

        // Waveform
        this.elements.waveformCanvas = document.getElementById('waveformCanvas');
        this.elements.loadingOverlay = document.getElementById('loadingOverlay');
    }

    attachEventListeners() {
        // Play/Pause
        this.elements.playPauseBtn?.addEventListener('click', () => {
            console.log('Play/Pause button clicked');
            if (this.callbacks.onPlayPause) {
                console.log('Calling onPlayPause callback');
                this.callbacks.onPlayPause();
            } else {
                console.log('No onPlayPause callback set!');
            }
        });

        // Stop
        this.elements.stopBtn?.addEventListener('click', () => {
            if (this.callbacks.onStop) {
                this.callbacks.onStop();
            }
        });

        // Loop controls
        this.elements.loopStartBtn?.addEventListener('click', () => {
            if (this.callbacks.onLoopStart) {
                this.callbacks.onLoopStart();
            }
        });

        this.elements.loopEndBtn?.addEventListener('click', () => {
            if (this.callbacks.onLoopEnd) {
                this.callbacks.onLoopEnd();
            }
        });

        this.elements.loopToggleBtn?.addEventListener('click', () => {
            if (this.callbacks.onLoopToggle) {
                this.callbacks.onLoopToggle();
            }
        });

        this.elements.loopClearBtn?.addEventListener('click', () => {
            if (this.callbacks.onLoopClear) {
                this.callbacks.onLoopClear();
            }
        });

        this.elements.loopSaveBtn?.addEventListener('click', () => {
            console.log('Loop save button clicked');
            if (this.callbacks.onLoopSave) {
                console.log('Calling onLoopSave callback');
                this.callbacks.onLoopSave();
            } else {
                console.log('No onLoopSave callback set');
            }
        });

        // Speed controls
        this.elements.speedSlider?.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            this.updateSpeedDisplay(value);
            if (this.callbacks.onSpeedChange) {
                this.callbacks.onSpeedChange(value / 100);
            }
        });

        this.elements.speedResetBtn?.addEventListener('click', () => {
            this.elements.speedSlider.value = 100;
            this.updateSpeedDisplay(100);
            if (this.callbacks.onSpeedChange) {
                this.callbacks.onSpeedChange(1.0);
            }
        });

        // Pitch controls
        this.elements.pitchUpBtn?.addEventListener('click', () => {
            const newValue = Math.min(12, this.currentPitchValue + 1);
            this.currentPitchValue = newValue;
            this.updatePitchDisplay(newValue);
            if (this.callbacks.onPitchChange) {
                this.callbacks.onPitchChange(newValue);
            }
        });

        this.elements.pitchDownBtn?.addEventListener('click', () => {
            const newValue = Math.max(-12, this.currentPitchValue - 1);
            this.currentPitchValue = newValue;
            this.updatePitchDisplay(newValue);
            if (this.callbacks.onPitchChange) {
                this.callbacks.onPitchChange(newValue);
            }
        });

        this.elements.pitchResetBtn?.addEventListener('click', () => {
            this.currentPitchValue = 0;
            this.updatePitchDisplay(0);
            if (this.callbacks.onPitchChange) {
                this.callbacks.onPitchChange(0);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Only handle if audio player is focused
            if (!this.container.contains(document.activeElement)) return;

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    if (this.callbacks.onPlayPause) {
                        this.callbacks.onPlayPause();
                    }
                    break;
                case 'KeyI':
                    if (this.callbacks.onLoopStart) {
                        this.callbacks.onLoopStart();
                    }
                    break;
                case 'KeyO':
                    if (this.callbacks.onLoopEnd) {
                        this.callbacks.onLoopEnd();
                    }
                    break;
                case 'KeyL':
                    if (this.callbacks.onLoopToggle) {
                        this.callbacks.onLoopToggle();
                    }
                    break;
            }
        });
    }

    setCallbacks(callbacks) {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    updatePlayPauseButton(isPlaying) {
        this.isPlaying = isPlaying;
        if (this.elements.playPauseBtn) {
            const playIcon = this.elements.playPauseBtn.querySelector('.icon-play');
            const pauseIcon = this.elements.playPauseBtn.querySelector('.icon-pause');

            if (isPlaying) {
                playIcon.style.display = 'none';
                pauseIcon.style.display = 'block';
            } else {
                playIcon.style.display = 'block';
                pauseIcon.style.display = 'none';
            }
        }
    }

    updateTime(currentTime, duration) {
        this.currentTime = currentTime;
        this.duration = duration;

        if (this.elements.currentTime) {
            this.elements.currentTime.textContent = this.formatTime(currentTime);
        }

        if (this.elements.duration) {
            this.elements.duration.textContent = this.formatTime(duration);
        }
    }

    updateLoopInfo(loopStart, loopEnd, isLooping) {
        this.loopStart = loopStart;
        this.loopEnd = loopEnd;
        this.isLooping = isLooping;

        if (loopStart !== null && loopEnd !== null) {
            this.elements.loopInfo.style.display = 'block';
            this.elements.loopStartTime.textContent = this.formatTime(loopStart);
            this.elements.loopEndTime.textContent = this.formatTime(loopEnd);
            this.elements.loopDuration.textContent = `(${this.formatTime(loopEnd - loopStart)})`;

            if (this.elements.loopToggleBtn) {
                this.elements.loopToggleBtn.classList.toggle('active', isLooping);
            }

            // Show save button when we have a valid loop
            if (this.elements.loopSaveBtn) {
                this.elements.loopSaveBtn.style.display = 'inline-block';
            }
        } else {
            this.elements.loopInfo.style.display = 'none';
            if (this.elements.loopToggleBtn) {
                this.elements.loopToggleBtn.classList.remove('active');
            }

            // Hide save button when no loop
            if (this.elements.loopSaveBtn) {
                this.elements.loopSaveBtn.style.display = 'none';
            }
        }
    }

    updateSpeedDisplay(percent) {
        if (this.elements.speedValue) {
            this.elements.speedValue.textContent = `${percent}%`;
        }
    }

    updatePitchDisplay(semitones) {
        if (this.elements.pitchValue) {
            const display =
                semitones === 0 ? '0' : semitones > 0 ? `+${semitones}` : `${semitones}`;
            this.elements.pitchValue.textContent = display;
        }
    }

    updateLoopCount(count) {
        if (count > 0) {
            this.elements.progressInfo.style.display = 'flex';
            this.elements.loopCount.textContent = count;
        } else {
            this.elements.progressInfo.style.display = 'none';
        }
    }

    showLoading(show) {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    }

    formatTime(seconds) {
        if (!seconds || seconds < 0) return '0:00';

        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);

        if (this.timeFormat === 'mm:ss.ms') {
            const ms = Math.floor((seconds % 1) * 100);
            return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
        }

        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    setTimeFormat(format) {
        this.timeFormat = format;
        this.updateTime(this.currentTime, this.duration);
    }

    getWaveformCanvas() {
        return this.elements.waveformCanvas;
    }

    enable() {
        Object.values(this.elements).forEach((el) => {
            if ((el && el.tagName === 'BUTTON') || el.tagName === 'INPUT') {
                el.disabled = false;
            }
        });
    }

    disable() {
        Object.values(this.elements).forEach((el) => {
            if ((el && el.tagName === 'BUTTON') || el.tagName === 'INPUT') {
                el.disabled = true;
            }
        });
    }

    destroy() {
        // Remove event listeners by cloning and replacing elements
        Object.values(this.elements).forEach((el) => {
            if (el && el.parentNode) {
                const clone = el.cloneNode(true);
                el.parentNode.replaceChild(clone, el);
            }
        });

        this.elements = {};
        this.callbacks = {};

        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

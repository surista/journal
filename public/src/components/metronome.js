// Metronome Component - Modern UI Design


export class Metronome {
    constructor(container, audioService) {
        this.container = container;
        this.audioService = audioService;
        this.isPlaying = false;
        this.bpm = 80;
        this.currentBeat = 0;
        this.beatsPerMeasure = 4;
        this.interval = null;
        this.timer = null;
        this.audioReady = false;
        this.accentPattern = [true, false, false, false]; // Default accent on first beat

        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
        this.checkAudioReady();
    }

    async checkAudioReady() {
        // Check if audio is ready every 100ms
        const checkInterval = setInterval(() => {
            if (this.audioService && this.audioService.isReady && this.audioService.isReady()) {
                this.audioReady = true;
                this.updateUI();
                clearInterval(checkInterval);
            }
        }, 100);
    }

    render() {
        this.container.innerHTML = `
            <div class="metronome-widget">
                <div class="audio-status" id="audioStatus">
                    <span class="status-indicator">🔇</span>
                    <span class="status-text">Click anywhere to enable audio</span>
                </div>
                
                <div class="metronome-header">
                    <h3>🎵 Metronome</h3>
                </div>
                
                <!-- Beat indicator -->
                <div class="beat-indicator">
                    <div class="beat-lights">
                        ${Array(this.beatsPerMeasure).fill(0).map((_, i) =>
            `<div class="beat-light ${this.accentPattern[i] ? 'accent' : ''}" data-beat="${i}"></div>`
        ).join('')}
                    </div>
                    <div class="beat-counter">
                        <span id="currentBeat">1</span> / <span id="totalBeats">${this.beatsPerMeasure}</span>
                    </div>
                </div>
                
                <!-- BPM Display - Compact -->
                <div class="bpm-display-container">
                    <div class="bpm-display" id="bpmDisplay">
                        <div class="bpm-value" id="bpmValue">${this.bpm}</div>
                        <div class="bpm-label">BPM</div>
                    </div>
                </div>

                <!-- BPM Controls -->
                <div class="bpm-controls">
                    <button class="bpm-adjust-btn" data-adjust="-10">-10</button>
                    <button class="bpm-adjust-btn" data-adjust="-5">-5</button>
                    <button class="bpm-adjust-btn" data-adjust="-1">-1</button>
                    <button class="bpm-adjust-btn stop" id="tapTempo">TAP</button>
                    <button class="bpm-adjust-btn" data-adjust="+1">+1</button>
                    <button class="bpm-adjust-btn" data-adjust="+5">+5</button>
                    <button class="bpm-adjust-btn" data-adjust="+10">+10</button>
                </div>
                
                <!-- BPM Slider -->
                <div class="bpm-slider-container">
                    <input type="range" id="bpmSlider" min="30" max="300" value="${this.bpm}" class="bpm-slider">
                    <div class="bpm-range-labels">
                        <span>30</span>
                        <span>165</span>
                        <span>300</span>
                    </div>
                </div>
                
                <!-- Playback Controls -->
                <div class="playback-controls">
                    <button class="play-pause-btn" id="playPauseBtn">
                        <i class="icon">▶️</i> <span>Start</span>
                    </button>
                    <button class="stop-btn" id="stopBtn">
                        <i class="icon">⏹️</i> <span>Stop</span>
                    </button>
                </div>

                <!-- Settings -->
                <div class="metronome-settings">
                    <div class="setting-group">
                        <label>Time Signature:</label>
                        <select id="timeSignature">
                            <option value="4">4/4</option>
                            <option value="3">3/4</option>
                            <option value="2">2/4</option>
                            <option value="6">6/8</option>
                        </select>
                    </div>
                    
                    <div class="setting-group">
                        <label>Accent Pattern:</label>
                        <div class="accent-pattern" id="accentPattern">
                            ${Array(this.beatsPerMeasure).fill(0).map((_, i) =>
            `<button class="accent-beat-btn ${this.accentPattern[i] ? 'accented' : ''}" data-beat="${i}">${i + 1}</button>`
        ).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="metronome-settings" style="grid-template-columns: 1fr;">
                    <div class="setting-group">
                        <label for="soundSelect">Sound:</label>
                        <select id="soundSelect">
                            <option value="click">Click</option>
                            <option value="beep">Beep</option>
                            <option value="tick">Tick</option>
                            <option value="wood">Wood Block</option>
                        </select>
                    </div>
                </div>
            </div>
        `;

        this.updateSliderBackground();
    }

    attachEventListeners() {
        // Play/Pause button
        document.getElementById('playPauseBtn')?.addEventListener('click', () => {
            this.togglePlayback();
        });

        // Stop button
        document.getElementById('stopBtn')?.addEventListener('click', () => {
            this.stop();
        });

        // BPM adjustment buttons
        document.querySelectorAll('.bpm-adjust-btn[data-adjust]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const adjustment = parseInt(e.target.dataset.adjust);
                this.setBpm(this.bpm + adjustment);
            });
        });

        // BPM slider
        document.getElementById('bpmSlider')?.addEventListener('input', (e) => {
            this.setBpm(parseInt(e.target.value));
        });

        // Time signature
        document.getElementById('timeSignature')?.addEventListener('change', (e) => {
            this.setTimeSignature(parseInt(e.target.value));
        });

        // Accent pattern buttons
        document.querySelectorAll('.accent-beat-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const beat = parseInt(e.target.dataset.beat);
                this.toggleAccent(beat);
            });
        });

        // Tap tempo
        let tapTimes = [];
        document.getElementById('tapTempo')?.addEventListener('click', () => {
            const now = Date.now();
            tapTimes.push(now);

            // Keep only the last 8 taps
            if (tapTimes.length > 8) {
                tapTimes.shift();
            }

            // Calculate average interval
            if (tapTimes.length >= 2) {
                const intervals = [];
                for (let i = 1; i < tapTimes.length; i++) {
                    intervals.push(tapTimes[i] - tapTimes[i - 1]);
                }
                const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
                const bpm = Math.round(60000 / avgInterval);
                this.setBpm(Math.max(30, Math.min(300, bpm)));
            }

            // Clear taps after 2 seconds of inactivity
            clearTimeout(this.tapTimeout);
            this.tapTimeout = setTimeout(() => {
                tapTimes = [];
            }, 2000);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.code === 'Space') {
                e.preventDefault();
                this.togglePlayback();
            } else if (e.code === 'ArrowUp') {
                e.preventDefault();
                this.setBpm(this.bpm + 1);
            } else if (e.code === 'ArrowDown') {
                e.preventDefault();
                this.setBpm(this.bpm - 1);
            }
        });

        // Listen for audio service ready
        document.addEventListener('click', () => {
            setTimeout(() => {
                if (this.audioService && this.audioService.isReady && this.audioService.isReady()) {
                    this.audioReady = true;
                    this.updateUI();
                }
            }, 100);
        }, {once: true});
    }

    async togglePlayback() {
        if (!this.audioReady) {
            this.showAudioWarning();
            return;
        }

        if (this.isPlaying) {
            this.pause();
        } else {
            await this.start();
        }
    }

    async start() {
        if (!this.audioReady) {
            this.showAudioWarning();
            return;
        }

        this.isPlaying = true;
        this.currentBeat = 0;

        // Calculate interval in milliseconds
        const interval = 60000 / this.bpm;

        // Start immediately with first beat
        await this.playBeat();

        // Set up interval for subsequent beats
        this.interval = setInterval(async () => {
            await this.playBeat();
        }, interval);

        this.updateUI();

        // Notify timer if sync is enabled
        if (window.currentTimer?.syncWithAudio) {
            window.currentTimer.syncStart('metronome');
        }
    }

    pause() {
        this.isPlaying = false;

        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        this.updateUI();

        // Notify timer if sync is enabled
        if (window.currentTimer?.syncWithAudio) {
            window.currentTimer.syncStop('metronome');
        }
    }

    stop() {
        this.pause();
        this.currentBeat = 0;
        this.updateBeatDisplay();
    }

    getCurrentBPM() {
        return this.bpm;
    }

    async playBeat() {
        if (!this.audioReady) return;

        const isAccent = this.accentPattern[this.currentBeat];

        // Pulse the BPM display
        const bpmDisplay = document.getElementById('bpmDisplay');
        if (bpmDisplay) {
            bpmDisplay.classList.add('pulse');
            setTimeout(() => {
                bpmDisplay.classList.remove('pulse');
            }, 100);
        }

        try {
            const sound = document.getElementById('soundSelect')?.value || 'click';
            const frequency = this.getFrequencyForSound(sound, isAccent);
            await this.audioService.playTone(frequency, 0.1);
        } catch (error) {
            console.warn('Audio playback failed:', error);
        }

        this.currentBeat = (this.currentBeat + 1) % this.beatsPerMeasure;
        this.updateBeatDisplay();
    }

    getFrequencyForSound(sound, isAccent) {
        const sounds = {
            click: { normal: 800, accent: 1000 },
            beep: { normal: 600, accent: 800 },
            tick: { normal: 1200, accent: 1500 },
            wood: { normal: 400, accent: 500 }
        };

        const selectedSound = sounds[sound] || sounds.click;
        return isAccent ? selectedSound.accent : selectedSound.normal;
    }

    setBpm(newBpm) {
        this.bpm = Math.max(30, Math.min(300, newBpm));

        // Update UI
        document.getElementById('bpmValue').textContent = this.bpm;
        document.getElementById('bpmSlider').value = this.bpm;
        this.updateSliderBackground();

        // Restart if currently playing
        if (this.isPlaying) {
            this.pause();
            setTimeout(() => this.start(), 50);
        }
    }

    updateSliderBackground() {
        const slider = document.getElementById('bpmSlider');
        if (slider) {
            const percentage = ((this.bpm - 30) / (300 - 30)) * 100;
            slider.style.setProperty('--progress', percentage + '%');
        }
    }

    setTimeSignature(beats) {
        this.beatsPerMeasure = beats;
        this.currentBeat = 0;

        // Reset accent pattern
        this.accentPattern = new Array(beats).fill(false);
        this.accentPattern[0] = true; // Default accent on first beat

        // Re-render beat lights and accent pattern
        this.render();
        this.attachEventListeners();
        this.updateBeatDisplay();
    }

    toggleAccent(beat) {
        this.accentPattern[beat] = !this.accentPattern[beat];

        // Update UI
        const btn = document.querySelector(`.accent-beat-btn[data-beat="${beat}"]`);
        if (btn) {
            btn.classList.toggle('accented', this.accentPattern[beat]);
        }

        // Update beat lights
        const beatLight = document.querySelector(`.beat-light[data-beat="${beat}"]`);
        if (beatLight) {
            beatLight.classList.toggle('accent', this.accentPattern[beat]);
        }
    }

    updateBeatDisplay() {
        // Update beat counter
        document.getElementById('currentBeat').textContent = this.currentBeat + 1;

        // Update beat lights
        document.querySelectorAll('.beat-light').forEach((light, index) => {
            light.classList.toggle('active', index === this.currentBeat);
        });
    }

    updateUI() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        const audioStatus = document.getElementById('audioStatus');

        if (playPauseBtn) {
            if (this.isPlaying) {
                playPauseBtn.innerHTML = '<i class="icon">⏸️</i> <span>Pause</span>';
                playPauseBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
            } else {
                playPauseBtn.innerHTML = '<i class="icon">▶️</i> <span>Start</span>';
                playPauseBtn.style.background = 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)';
            }
        }

        if (audioStatus) {
            if (this.audioReady) {
                audioStatus.innerHTML = `
                    <span class="status-indicator">🔊</span>
                    <span class="status-text">Audio ready</span>
                `;
                audioStatus.classList.add('ready');
            } else {
                audioStatus.innerHTML = `
                    <span class="status-indicator">🔇</span>
                    <span class="status-text">Click anywhere to enable audio</span>
                `;
                audioStatus.classList.remove('ready');
            }
        }
    }

    showAudioWarning() {
        const warning = document.createElement('div');
        warning.className = 'audio-warning';
        warning.innerHTML = `
            <div class="warning-content">
                <span class="warning-icon">⚠️</span>
                <span class="warning-text">Click anywhere first to enable audio</span>
            </div>
        `;

        this.container.appendChild(warning);

        setTimeout(() => {
            warning.remove();
        }, 3000);
    }

    setTimer(timer) {
        this.timer = timer;
    }

    destroy() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        this.isPlaying = false;
    }
}
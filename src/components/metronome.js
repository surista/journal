// Metronome Component - Updated with Timer Sync
export class Metronome {
    constructor(container) {
        this.container = container;
        this.audioContext = null;
        this.isPlaying = false;
        this.currentBeat = 0;
        this.nextNoteTime = 0;
        this.lookahead = 25.0; // How frequently to call scheduling function (in milliseconds)
        this.scheduleAheadTime = 0.1; // How far ahead to schedule audio (sec)
        this.timerID = null;
        this.timer = null; // Reference to timer component

        // Metronome settings
        this.tempo = 120;
        this.timeSignature = { beats: 4, noteValue: 4 };
        this.accentPattern = [true, false, false, false]; // Default: accent first beat
        this.volume = 0.7;
        this.soundType = 'click';
        this.preCount = false;
        this.preCountMeasures = 1;
        this.isInPreCount = false;
        this.preCountBeats = 0;

        // Tempo progression for loops
        this.tempoProgression = {
            enabled: false,
            incrementType: 'percentage', // 'percentage' or 'bpm'
            incrementValue: 1,
            loopInterval: 1, // After every N loops
            currentLoopCount: 0,
            maxTempo: 300
        };

        // Visual settings
        this.visualElements = {};
        this.beatIndicators = [];

        // Sound buffers
        this.soundBuffers = {};
        this.loadSounds();

        // Bind methods
        this.scheduler = this.scheduler.bind(this);
        this.draw = this.draw.bind(this);
    }

    setTimer(timer) {
        this.timer = timer;
    }

    async loadSounds() {
        // Initialize audio context
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Define sound types with their frequencies and characteristics
        this.soundDefinitions = {
            click: { high: 1000, low: 800, duration: 0.03 },
            beep: { high: 880, low: 440, duration: 0.05 },
            woodblock: { high: 1200, low: 600, duration: 0.02 },
            cowbell: { high: 800, low: 400, duration: 0.04 },
            rimshot: { high: 2000, low: 200, duration: 0.01 },
            clave: { high: 1500, low: 750, duration: 0.015 },
            tick: { high: 4000, low: 2000, duration: 0.005 },
            pop: { high: 600, low: 300, duration: 0.02 },
            blip: { high: 2400, low: 1200, duration: 0.01 },
            ping: { high: 3000, low: 1500, duration: 0.08 }
        };
    }

    render() {
        this.container.innerHTML = `
            <div class="metronome-container">
                <h3 class="metronome-title">🎵 Metronome</h3>
                
                <!-- Visual Metronome -->
                <div class="metronome-visual">
                    <div class="pulsating-circle" id="metronomeCircle">
                        <div class="tempo-display" id="tempoDisplay">${this.tempo}</div>
                        <div class="bpm-label">BPM</div>
                    </div>
                    <div class="beat-indicators" id="beatIndicators"></div>
                </div>

                <!-- Tempo Controls -->
                <div class="tempo-controls">
                    <button class="tempo-btn" data-change="-10">-10</button>
                    <button class="tempo-btn" data-change="-5">-5</button>
                    <button class="tempo-btn" data-change="-1">-1</button>
                    <button class="play-btn" id="metronomePlayBtn">▶️</button>
                    <button class="tempo-btn" data-change="+1">+1</button>
                    <button class="tempo-btn" data-change="+5">+5</button>
                    <button class="tempo-btn" data-change="+10">+10</button>
                </div>

                <!-- Tempo Slider -->
                <div class="tempo-slider-container">
                    <input type="range" id="tempoSlider" min="30" max="300" value="${this.tempo}" class="tempo-slider">
                    <div class="tempo-marks">
                        <span>30</span>
                        <span>120</span>
                        <span>300</span>
                    </div>
                </div>

                <!-- Time Signature -->
                <div class="time-signature-section">
                    <label>Time Signature</label>
                    <select id="timeSignature" class="metronome-select">
                        <option value="2/4">2/4</option>
                        <option value="3/4">3/4</option>
                        <option value="4/4" selected>4/4</option>
                        <option value="5/4">5/4</option>
                        <option value="6/8">6/8</option>
                        <option value="7/8">7/8</option>
                    </select>
                </div>

                <!-- Accent Pattern -->
                <div class="accent-pattern-section">
                    <label>Accent Pattern</label>
                    <div class="accent-toggles" id="accentToggles"></div>
                </div>

                <!-- Sound Selection -->
                <div class="sound-selection">
                    <label>Sound</label>
                    <select id="soundType" class="metronome-select">
                        <option value="click">Click</option>
                        <option value="beep">Beep</option>
                        <option value="woodblock">Woodblock</option>
                        <option value="cowbell">Cowbell</option>
                        <option value="rimshot">Rimshot</option>
                        <option value="clave">Clave</option>
                        <option value="tick">Tick</option>
                        <option value="pop">Pop</option>
                        <option value="blip">Blip</option>
                        <option value="ping">Ping</option>
                    </select>
                </div>

                <!-- Volume Control -->
                <div class="volume-control">
                    <label>Volume</label>
                    <input type="range" id="volumeSlider" min="0" max="100" value="${this.volume * 100}" class="volume-slider">
                    <span id="volumeDisplay">${Math.round(this.volume * 100)}%</span>
                </div>

                <!-- Pre-count -->
                <div class="precount-section">
                    <label class="checkbox-label">
                        <input type="checkbox" id="preCountToggle">
                        <span>Pre-count (1 measure)</span>
                    </label>
                </div>

                <!-- Tempo Progression (for loops) -->
                <div class="tempo-progression-section">
                    <h4>Tempo Progression (Loop Mode)</h4>
                    <label class="checkbox-label">
                        <input type="checkbox" id="progressionEnabled">
                        <span>Enable tempo increase after loops</span>
                    </label>
                    
                    <div class="progression-controls" id="progressionControls" style="display: none;">
                        <div class="progression-row">
                            <label>Increase by:</label>
                            <input type="number" id="incrementValue" value="1" min="0.1" max="10" step="0.1">
                            <select id="incrementType" class="small-select">
                                <option value="percentage">%</option>
                                <option value="bpm">BPM</option>
                            </select>
                        </div>
                        <div class="progression-row">
                            <label>After every:</label>
                            <input type="number" id="loopInterval" value="1" min="1" max="10">
                            <span>loop(s)</span>
                        </div>
                        <div class="progression-status" id="progressionStatus"></div>
                    </div>
                </div>

                <!-- Tap Tempo -->
                <div class="tap-tempo-section">
                    <button class="tap-tempo-btn" id="tapTempoBtn">Tap Tempo</button>
                    <span class="tap-tempo-hint">Tap 4+ times to set tempo</span>
                </div>
            </div>

            <style>
                .metronome-container {
                    background: var(--bg-card);
                    border-radius: var(--radius-xl);
                    padding: var(--space-xl);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                    border: 1px solid var(--border);
                }

                .metronome-title {
                    text-align: center;
                    margin-bottom: var(--space-lg);
                    color: var(--text-primary);
                }

                .metronome-visual {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-bottom: var(--space-xl);
                }

                .pulsating-circle {
                    width: 150px;
                    height: 150px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    transition: transform 0.1s ease;
                    box-shadow: 0 0 30px rgba(99, 102, 241, 0.5);
                }

                .pulsating-circle.pulse {
                    transform: scale(1.1);
                    box-shadow: 0 0 50px rgba(99, 102, 241, 0.8);
                }

                .tempo-display {
                    font-size: 2.5rem;
                    font-weight: bold;
                    color: white;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
                }

                .bpm-label {
                    font-size: 0.875rem;
                    color: white;
                    opacity: 0.9;
                }

                .beat-indicators {
                    display: flex;
                    gap: 10px;
                    margin-top: var(--space-lg);
                }

                .beat-indicator {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: var(--bg-input);
                    border: 2px solid var(--border);
                    transition: all 0.1s ease;
                }

                .beat-indicator.accent {
                    border-color: var(--primary);
                }

                .beat-indicator.active {
                    background: var(--primary);
                    transform: scale(1.3);
                    box-shadow: 0 0 15px rgba(99, 102, 241, 0.6);
                }

                .beat-indicator.active.accent {
                    background: var(--secondary);
                    box-shadow: 0 0 20px rgba(168, 85, 247, 0.8);
                }

                .tempo-controls {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                    margin-bottom: var(--space-lg);
                }

                .tempo-btn {
                    padding: 8px 12px;
                    background: var(--bg-input);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    color: var(--text-primary);
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .tempo-btn:hover {
                    background: var(--primary);
                    border-color: var(--primary);
                    transform: translateY(-2px);
                }

                .play-btn {
                    padding: 12px 24px;
                    background: var(--success);
                    border: none;
                    border-radius: var(--radius-lg);
                    color: white;
                    font-size: 1.2rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .play-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(16, 185, 129, 0.4);
                }

                .play-btn.playing {
                    background: var(--danger);
                }

                .tempo-slider-container {
                    margin-bottom: var(--space-lg);
                }

                .tempo-slider {
                    width: 100%;
                    margin-bottom: var(--space-sm);
                }

                .tempo-marks {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                }

                .time-signature-section,
                .sound-selection,
                .volume-control,
                .precount-section {
                    margin-bottom: var(--space-lg);
                }

                .metronome-select {
                    width: 100%;
                    padding: 8px 12px;
                    background: var(--bg-input);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    color: var(--text-primary);
                    cursor: pointer;
                }

                .accent-toggles {
                    display: flex;
                    gap: 8px;
                    margin-top: var(--space-sm);
                }

                .accent-toggle {
                    width: 40px;
                    height: 40px;
                    border: 2px solid var(--border);
                    border-radius: var(--radius-md);
                    background: var(--bg-input);
                    color: var(--text-primary);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-weight: bold;
                }

                .accent-toggle.accented {
                    background: var(--primary);
                    border-color: var(--primary);
                    color: white;
                }

                .volume-slider {
                    width: calc(100% - 60px);
                    margin-right: 10px;
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                }

                .checkbox-label input[type="checkbox"] {
                    width: 20px;
                    height: 20px;
                    cursor: pointer;
                }

                .tempo-progression-section {
                    background: var(--bg-input);
                    padding: var(--space-lg);
                    border-radius: var(--radius-lg);
                    margin-bottom: var(--space-lg);
                }

                .tempo-progression-section h4 {
                    margin-bottom: var(--space-md);
                    color: var(--text-primary);
                }

                .progression-controls {
                    margin-top: var(--space-md);
                }

                .progression-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: var(--space-sm);
                }

                .progression-row input[type="number"] {
                    width: 80px;
                    padding: 6px 10px;
                    background: var(--bg-dark);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-sm);
                    color: var(--text-primary);
                }

                .small-select {
                    padding: 6px 10px;
                    background: var(--bg-dark);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-sm);
                    color: var(--text-primary);
                }

                .progression-status {
                    margin-top: var(--space-sm);
                    padding: var(--space-sm);
                    background: var(--bg-dark);
                    border-radius: var(--radius-md);
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                }

                .tap-tempo-section {
                    text-align: center;
                }

                .tap-tempo-btn {
                    padding: 12px 24px;
                    background: var(--primary);
                    border: none;
                    border-radius: var(--radius-lg);
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-weight: 600;
                }

                .tap-tempo-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(99, 102, 241, 0.4);
                }

                .tap-tempo-btn:active {
                    transform: translateY(0);
                }

                .tap-tempo-hint {
                    display: block;
                    margin-top: var(--space-sm);
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                }

                @media (max-width: 768px) {
                    .tempo-controls {
                        flex-wrap: wrap;
                    }

                    .accent-toggles {
                        flex-wrap: wrap;
                    }

                    .progression-row {
                        flex-wrap: wrap;
                    }
                }
            </style>
        `;

        this.setupVisualElements();
        this.attachEventListeners();
        this.updateBeatIndicators();
    }

    setupVisualElements() {
        this.visualElements = {
            circle: document.getElementById('metronomeCircle'),
            tempoDisplay: document.getElementById('tempoDisplay'),
            playBtn: document.getElementById('metronomePlayBtn'),
            beatIndicatorsContainer: document.getElementById('beatIndicators'),
            accentTogglesContainer: document.getElementById('accentToggles')
        };
    }

    attachEventListeners() {
        // Play/Stop button
        this.visualElements.playBtn.addEventListener('click', () => this.toggle());

        // Tempo buttons
        document.querySelectorAll('.tempo-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const change = parseInt(e.target.dataset.change);
                this.setTempo(this.tempo + change);
            });
        });

        // Tempo slider
        const tempoSlider = document.getElementById('tempoSlider');
        tempoSlider.addEventListener('input', (e) => {
            this.setTempo(parseInt(e.target.value));
        });

        // Time signature
        document.getElementById('timeSignature').addEventListener('change', (e) => {
            const [beats, noteValue] = e.target.value.split('/').map(n => parseInt(n));
            this.setTimeSignature(beats, noteValue);
        });

        // Sound type
        document.getElementById('soundType').addEventListener('change', (e) => {
            this.soundType = e.target.value;
        });

        // Volume
        const volumeSlider = document.getElementById('volumeSlider');
        volumeSlider.addEventListener('input', (e) => {
            this.volume = parseInt(e.target.value) / 100;
            document.getElementById('volumeDisplay').textContent = `${e.target.value}%`;
        });

        // Pre-count
        document.getElementById('preCountToggle').addEventListener('change', (e) => {
            this.preCount = e.target.checked;
        });

        // Tempo progression
        document.getElementById('progressionEnabled').addEventListener('change', (e) => {
            this.tempoProgression.enabled = e.target.checked;
            document.getElementById('progressionControls').style.display =
                e.target.checked ? 'block' : 'none';
            this.updateProgressionStatus();
        });

        document.getElementById('incrementValue').addEventListener('change', (e) => {
            this.tempoProgression.incrementValue = parseFloat(e.target.value);
            this.updateProgressionStatus();
        });

        document.getElementById('incrementType').addEventListener('change', (e) => {
            this.tempoProgression.incrementType = e.target.value;
            this.updateProgressionStatus();
        });

        document.getElementById('loopInterval').addEventListener('change', (e) => {
            this.tempoProgression.loopInterval = parseInt(e.target.value);
            this.updateProgressionStatus();
        });

        // Tap tempo
        this.setupTapTempo();
    }

    setupTapTempo() {
        const tapBtn = document.getElementById('tapTempoBtn');
        let tapTimes = [];

        tapBtn.addEventListener('click', () => {
            const now = Date.now();
            tapTimes.push(now);

            // Keep only recent taps (within 2 seconds)
            tapTimes = tapTimes.filter(time => now - time < 2000);

            if (tapTimes.length >= 4) {
                // Calculate average interval
                let totalInterval = 0;
                for (let i = 1; i < tapTimes.length; i++) {
                    totalInterval += tapTimes[i] - tapTimes[i-1];
                }
                const avgInterval = totalInterval / (tapTimes.length - 1);
                const bpm = Math.round(60000 / avgInterval);

                if (bpm >= 30 && bpm <= 300) {
                    this.setTempo(bpm);
                }
            }
        });
    }

    updateBeatIndicators() {
        const container = this.visualElements.beatIndicatorsContainer;
        const accentContainer = this.visualElements.accentTogglesContainer;

        container.innerHTML = '';
        accentContainer.innerHTML = '';
        this.beatIndicators = [];

        // Create beat indicators and accent toggles
        for (let i = 0; i < this.timeSignature.beats; i++) {
            // Beat indicator
            const indicator = document.createElement('div');
            indicator.className = 'beat-indicator';
            if (this.accentPattern[i]) {
                indicator.classList.add('accent');
            }
            container.appendChild(indicator);
            this.beatIndicators.push(indicator);

            // Accent toggle
            const toggle = document.createElement('button');
            toggle.className = 'accent-toggle';
            toggle.textContent = i + 1;
            if (this.accentPattern[i]) {
                toggle.classList.add('accented');
            }
            toggle.addEventListener('click', () => {
                this.accentPattern[i] = !this.accentPattern[i];
                this.updateBeatIndicators();
            });
            accentContainer.appendChild(toggle);
        }
    }

    setTempo(bpm) {
        this.tempo = Math.max(30, Math.min(300, bpm));
        document.getElementById('tempoSlider').value = this.tempo;
        this.visualElements.tempoDisplay.textContent = this.tempo;
        this.updateProgressionStatus();
    }

    setTimeSignature(beats, noteValue) {
        this.timeSignature = { beats, noteValue };

        // Reset accent pattern
        this.accentPattern = new Array(beats).fill(false);
        this.accentPattern[0] = true; // Default: accent first beat

        this.updateBeatIndicators();
    }

    toggle() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.start();
        }
    }

    start() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        this.isPlaying = true;
        this.currentBeat = 0;
        this.nextNoteTime = this.audioContext.currentTime;

        // Reset tempo progression
        this.tempoProgression.currentLoopCount = 0;

        // Handle pre-count
        if (this.preCount) {
            this.isInPreCount = true;
            this.preCountBeats = 0;
        }

        // Update UI
        this.visualElements.playBtn.textContent = '⏹️';
        this.visualElements.playBtn.classList.add('playing');

        // Notify timer to start sync
        if (this.timer) {
            this.timer.syncStart('Metronome');
        }

        // Start scheduling
        this.scheduler();
        requestAnimationFrame(this.draw);
    }

    stop() {
        this.isPlaying = false;
        this.isInPreCount = false;

        if (this.timerID) {
            clearTimeout(this.timerID);
            this.timerID = null;
        }

        // Update UI
        this.visualElements.playBtn.textContent = '▶️';
        this.visualElements.playBtn.classList.remove('playing');

        // Reset visual
        this.visualElements.circle.classList.remove('pulse');
        this.beatIndicators.forEach(indicator => indicator.classList.remove('active'));

        // Notify timer to stop sync
        if (this.timer) {
            this.timer.syncStop('Metronome');
        }
    }

    scheduler() {
        while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.currentBeat, this.nextNoteTime);
            this.nextNote();
        }

        if (this.isPlaying) {
            this.timerID = setTimeout(this.scheduler, this.lookahead);
        }
    }

    scheduleNote(beatNumber, time) {
        // Create sound
        const soundDef = this.soundDefinitions[this.soundType];
        const isAccent = this.accentPattern[beatNumber % this.timeSignature.beats];

        // Use oscillator for metronome sounds
        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        osc.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Set frequency based on accent
        osc.frequency.value = isAccent ? soundDef.high : soundDef.low;

        // Set volume
        const baseVolume = this.volume * (isAccent ? 1.0 : 0.7);
        gainNode.gain.value = this.isInPreCount ? baseVolume * 0.5 : baseVolume;

        // Envelope
        gainNode.gain.setValueAtTime(baseVolume, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + soundDef.duration);

        // Play
        osc.start(time);
        osc.stop(time + soundDef.duration);
    }

    nextNote() {
        // Calculate next note time
        const secondsPerBeat = 60.0 / this.tempo;
        this.nextNoteTime += secondsPerBeat;

        // Advance beat number
        this.currentBeat++;

        if (this.currentBeat === this.timeSignature.beats) {
            this.currentBeat = 0;

            // Handle pre-count
            if (this.isInPreCount) {
                this.preCountBeats += this.timeSignature.beats;
                if (this.preCountBeats >= this.preCountMeasures * this.timeSignature.beats) {
                    this.isInPreCount = false;
                }
            }

            // Handle tempo progression
            if (!this.isInPreCount && this.tempoProgression.enabled) {
                this.handleTempoProgression();
            }
        }
    }

    handleTempoProgression() {
        // This will be called by the audio player when a loop completes
    }

    onLoopComplete() {
        if (!this.tempoProgression.enabled || this.isInPreCount) return;

        this.tempoProgression.currentLoopCount++;

        if (this.tempoProgression.currentLoopCount % this.tempoProgression.loopInterval === 0) {
            let newTempo = this.tempo;

            if (this.tempoProgression.incrementType === 'percentage') {
                newTempo = this.tempo * (1 + this.tempoProgression.incrementValue / 100);
            } else {
                newTempo = this.tempo + this.tempoProgression.incrementValue;
            }

            // Limit to max tempo
            newTempo = Math.min(newTempo, this.tempoProgression.maxTempo);

            if (newTempo !== this.tempo) {
                this.setTempo(Math.round(newTempo));
                this.updateProgressionStatus();
            }
        }
    }

    updateProgressionStatus() {
        const status = document.getElementById('progressionStatus');
        if (!status) return;

        if (this.tempoProgression.enabled) {
            const increment = this.tempoProgression.incrementType === 'percentage'
                ? `${this.tempoProgression.incrementValue}%`
                : `${this.tempoProgression.incrementValue} BPM`;

            status.textContent = `Current: ${this.tempo} BPM | Loops: ${this.tempoProgression.currentLoopCount} | Next increase: +${increment} after ${this.tempoProgression.loopInterval - (this.tempoProgression.currentLoopCount % this.tempoProgression.loopInterval)} loop(s)`;
        } else {
            status.textContent = '';
        }
    }

    draw() {
        if (!this.isPlaying) return;

        const currentTime = this.audioContext.currentTime;
        const currentBeat = this.currentBeat;

        // Visual pulse on beat
        let drawBeat = Math.floor((currentTime - this.nextNoteTime + (60.0 / this.tempo)) * this.tempo / 60.0);

        if (drawBeat !== this.lastDrawnBeat) {
            this.lastDrawnBeat = drawBeat;

            // Pulse circle
            this.visualElements.circle.classList.add('pulse');
            setTimeout(() => {
                this.visualElements.circle.classList.remove('pulse');
            }, 100);

            // Update beat indicators
            this.beatIndicators.forEach((indicator, i) => {
                indicator.classList.toggle('active', i === (currentBeat % this.timeSignature.beats));
            });
        }

        requestAnimationFrame(this.draw);
    }

    // Integration with audio player loops
    syncWithAudioLoop(audioPlayer) {
        this.audioPlayer = audioPlayer;

        // Listen for loop completions
        const originalOnLoopCountUpdate = audioPlayer.onLoopCountUpdate;
        audioPlayer.onLoopCountUpdate = (count) => {
            if (originalOnLoopCountUpdate) {
                originalOnLoopCountUpdate(count);
            }

            if (count > 0) {
                this.onLoopComplete();
            }
        };
    }

    destroy() {
        this.stop();
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}
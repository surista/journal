// Enhanced Metronome Component with Advanced Features
import { Metronome } from './metronome.js';

export class MetronomeEnhanced extends Metronome {
    constructor(container, audioService) {
        super(container, audioService);
        
        // Additional properties for enhanced features
        this.tempoProgression = {
            enabled: false,
            startBpm: 80,
            endBpm: 120,
            increment: 5,
            measuresPerStep: 4,
            currentMeasure: 0
        };
        
        this.beatDropout = {
            enabled: false,
            pattern: [], // Which beats to drop out
            dropoutProbability: 0.3
        };
        
        // More sound options
        this.soundLibrary = {
            click: { normal: 800, accent: 1000 },
            beep: { normal: 600, accent: 800 },
            tick: { normal: 1200, accent: 1500 },
            wood: { normal: 400, accent: 500 },
            cowbell: { normal: 500, accent: 650 },
            clave: { normal: 2500, accent: 3000 },
            rim: { normal: 3500, accent: 4000 },
            hihat: { normal: 8000, accent: 10000 },
            kick: { normal: 60, accent: 80 },
            snare: { normal: 200, accent: 250 },
            triangle: { normal: 4500, accent: 5500 },
            shaker: { normal: 6000, accent: 7500 }
        };
        
        // Subdivision support
        this.subdivision = {
            enabled: false,
            division: 2, // 2 = eighth notes, 3 = triplets, 4 = sixteenth notes
            sound: 'tick'
        };
    }

    render() {
        this.container.innerHTML = `
            <div class="metronome-widget enhanced">
                <div class="audio-status" id="audioStatus">
                    <span class="status-indicator">🔇</span>
                    <span class="status-text">Click anywhere to enable audio</span>
                </div>
                
                <div class="metronome-header">
                    <h3>🎵 Enhanced Metronome</h3>
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
                            <option value="5">5/4</option>
                            <option value="7">7/8</option>
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
                            <option value="cowbell">Cowbell</option>
                            <option value="clave">Clave</option>
                            <option value="rim">Rim Shot</option>
                            <option value="hihat">Hi-Hat</option>
                            <option value="kick">Kick Drum</option>
                            <option value="snare">Snare</option>
                            <option value="triangle">Triangle</option>
                            <option value="shaker">Shaker</option>
                        </select>
                    </div>
                    
                    <div class="setting-group">
                        <label for="subdivisionSelect">Subdivision:</label>
                        <div class="subdivision-controls">
                            <input type="checkbox" id="subdivisionEnabled" ${this.subdivision.enabled ? 'checked' : ''}>
                            <select id="subdivisionSelect" ${!this.subdivision.enabled ? 'disabled' : ''}>
                                <option value="2">Eighth Notes</option>
                                <option value="3">Triplets</option>
                                <option value="4">Sixteenth Notes</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <!-- Enhanced Features -->
                <div class="enhanced-features">
                    <h4>Advanced Features</h4>
                    
                    <!-- Tempo Progression -->
                    <div class="feature-section">
                        <div class="feature-header">
                            <label>
                                <input type="checkbox" id="tempoProgressionEnabled" ${this.tempoProgression.enabled ? 'checked' : ''}>
                                Gradual Tempo Increase
                            </label>
                        </div>
                        <div class="feature-controls" id="tempoProgressionControls" style="${!this.tempoProgression.enabled ? 'display:none' : ''}">
                            <div class="control-row">
                                <label>Start BPM:</label>
                                <input type="number" id="progressionStartBpm" value="${this.tempoProgression.startBpm}" min="30" max="300">
                            </div>
                            <div class="control-row">
                                <label>End BPM:</label>
                                <input type="number" id="progressionEndBpm" value="${this.tempoProgression.endBpm}" min="30" max="300">
                            </div>
                            <div class="control-row">
                                <label>Increase by:</label>
                                <input type="number" id="progressionIncrement" value="${this.tempoProgression.increment}" min="1" max="20">
                                <span>BPM</span>
                            </div>
                            <div class="control-row">
                                <label>Every:</label>
                                <input type="number" id="progressionMeasures" value="${this.tempoProgression.measuresPerStep}" min="1" max="16">
                                <span>measures</span>
                            </div>
                            <div class="progression-status" id="progressionStatus">
                                Current: ${this.bpm} BPM
                            </div>
                        </div>
                    </div>
                    
                    <!-- Beat Dropout -->
                    <div class="feature-section">
                        <div class="feature-header">
                            <label>
                                <input type="checkbox" id="beatDropoutEnabled" ${this.beatDropout.enabled ? 'checked' : ''}>
                                Beat Dropout Training
                            </label>
                        </div>
                        <div class="feature-controls" id="beatDropoutControls" style="${!this.beatDropout.enabled ? 'display:none' : ''}">
                            <div class="control-row">
                                <label>Dropout Mode:</label>
                                <select id="dropoutMode">
                                    <option value="random">Random Beats</option>
                                    <option value="pattern">Fixed Pattern</option>
                                    <option value="progressive">Progressive</option>
                                </select>
                            </div>
                            <div class="control-row" id="dropoutPatternRow">
                                <label>Drop Beats:</label>
                                <div class="dropout-pattern">
                                    ${Array(this.beatsPerMeasure).fill(0).map((_, i) =>
                                        `<button class="dropout-beat-btn" data-beat="${i}">${i + 1}</button>`
                                    ).join('')}
                                </div>
                            </div>
                            <div class="control-row" id="dropoutProbabilityRow" style="display:none">
                                <label>Dropout Probability:</label>
                                <input type="range" id="dropoutProbability" min="0" max="100" value="${this.beatDropout.dropoutProbability * 100}">
                                <span id="dropoutProbabilityValue">${Math.round(this.beatDropout.dropoutProbability * 100)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.updateSliderBackground();
        this.attachEnhancedEventListeners();
    }

    attachEnhancedEventListeners() {
        // Call parent event listeners
        super.attachEventListeners();
        
        // Subdivision controls
        const subdivisionEnabled = document.getElementById('subdivisionEnabled');
        const subdivisionSelect = document.getElementById('subdivisionSelect');
        
        subdivisionEnabled?.addEventListener('change', (e) => {
            this.subdivision.enabled = e.target.checked;
            subdivisionSelect.disabled = !e.target.checked;
        });
        
        subdivisionSelect?.addEventListener('change', (e) => {
            this.subdivision.division = parseInt(e.target.value);
        });
        
        // Tempo progression controls
        const tempoProgressionEnabled = document.getElementById('tempoProgressionEnabled');
        const tempoProgressionControls = document.getElementById('tempoProgressionControls');
        
        tempoProgressionEnabled?.addEventListener('change', (e) => {
            this.tempoProgression.enabled = e.target.checked;
            tempoProgressionControls.style.display = e.target.checked ? 'block' : 'none';
            
            if (e.target.checked && this.isPlaying) {
                this.tempoProgression.currentMeasure = 0;
                this.setBpm(this.tempoProgression.startBpm);
            }
        });
        
        document.getElementById('progressionStartBpm')?.addEventListener('change', (e) => {
            this.tempoProgression.startBpm = parseInt(e.target.value);
        });
        
        document.getElementById('progressionEndBpm')?.addEventListener('change', (e) => {
            this.tempoProgression.endBpm = parseInt(e.target.value);
        });
        
        document.getElementById('progressionIncrement')?.addEventListener('change', (e) => {
            this.tempoProgression.increment = parseInt(e.target.value);
        });
        
        document.getElementById('progressionMeasures')?.addEventListener('change', (e) => {
            this.tempoProgression.measuresPerStep = parseInt(e.target.value);
        });
        
        // Beat dropout controls
        const beatDropoutEnabled = document.getElementById('beatDropoutEnabled');
        const beatDropoutControls = document.getElementById('beatDropoutControls');
        
        beatDropoutEnabled?.addEventListener('change', (e) => {
            this.beatDropout.enabled = e.target.checked;
            beatDropoutControls.style.display = e.target.checked ? 'block' : 'none';
        });
        
        const dropoutMode = document.getElementById('dropoutMode');
        dropoutMode?.addEventListener('change', (e) => {
            const mode = e.target.value;
            document.getElementById('dropoutPatternRow').style.display = mode === 'pattern' ? 'block' : 'none';
            document.getElementById('dropoutProbabilityRow').style.display = mode === 'random' ? 'block' : 'none';
        });
        
        document.querySelectorAll('.dropout-beat-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const beat = parseInt(e.target.dataset.beat);
                const index = this.beatDropout.pattern.indexOf(beat);
                
                if (index > -1) {
                    this.beatDropout.pattern.splice(index, 1);
                    e.target.classList.remove('active');
                } else {
                    this.beatDropout.pattern.push(beat);
                    e.target.classList.add('active');
                }
            });
        });
        
        const dropoutProbability = document.getElementById('dropoutProbability');
        dropoutProbability?.addEventListener('input', (e) => {
            this.beatDropout.dropoutProbability = parseInt(e.target.value) / 100;
            document.getElementById('dropoutProbabilityValue').textContent = e.target.value + '%';
        });
    }

    async playBeat() {
        if (!this.audioReady) return;

        const isAccent = this.accentPattern[this.currentBeat];
        const dropoutMode = document.getElementById('dropoutMode')?.value;
        let shouldPlayBeat = true;

        // Handle beat dropout
        if (this.beatDropout.enabled) {
            if (dropoutMode === 'pattern') {
                shouldPlayBeat = !this.beatDropout.pattern.includes(this.currentBeat);
            } else if (dropoutMode === 'random') {
                shouldPlayBeat = Math.random() > this.beatDropout.dropoutProbability;
            } else if (dropoutMode === 'progressive') {
                // Progressive dropout - increase probability over time
                const progressiveProbability = Math.min(0.5, this.tempoProgression.currentMeasure * 0.05);
                shouldPlayBeat = Math.random() > progressiveProbability;
            }
        }

        // Visual feedback always happens
        const bpmDisplay = document.getElementById('bpmDisplay');
        if (bpmDisplay) {
            bpmDisplay.classList.add('pulse');
            setTimeout(() => {
                bpmDisplay.classList.remove('pulse');
            }, 100);
        }

        // Play main beat
        if (shouldPlayBeat) {
            try {
                const sound = document.getElementById('soundSelect')?.value || 'click';
                const frequency = this.getFrequencyForSound(sound, isAccent);
                await this.audioService.playTone(frequency, 0.1);
            } catch (error) {
                console.warn('Audio playback failed:', error);
            }
        }

        // Play subdivisions if enabled
        if (this.subdivision.enabled && shouldPlayBeat) {
            const subdivisionInterval = (60000 / this.bpm) / this.subdivision.division;
            for (let i = 1; i < this.subdivision.division; i++) {
                setTimeout(() => {
                    const subFrequency = this.soundLibrary.tick.normal;
                    this.audioService.playTone(subFrequency, 0.05);
                }, subdivisionInterval * i);
            }
        }

        // Update beat counter
        this.currentBeat = (this.currentBeat + 1) % this.beatsPerMeasure;
        
        // Handle tempo progression
        if (this.currentBeat === 0 && this.tempoProgression.enabled) {
            this.tempoProgression.currentMeasure++;
            
            if (this.tempoProgression.currentMeasure >= this.tempoProgression.measuresPerStep) {
                this.tempoProgression.currentMeasure = 0;
                
                const newBpm = Math.min(
                    this.bpm + this.tempoProgression.increment,
                    this.tempoProgression.endBpm
                );
                
                if (newBpm !== this.bpm) {
                    this.setBpm(newBpm);
                    document.getElementById('progressionStatus').textContent = `Current: ${this.bpm} BPM`;
                    
                    // Restart metronome with new tempo
                    if (this.isPlaying) {
                        this.pause();
                        setTimeout(() => this.start(), 50);
                    }
                }
            }
        }
        
        this.updateBeatDisplay();
    }

    getFrequencyForSound(sound, isAccent) {
        const selectedSound = this.soundLibrary[sound] || this.soundLibrary.click;
        return isAccent ? selectedSound.accent : selectedSound.normal;
    }

    setTimeSignature(beats) {
        super.setTimeSignature(beats);
        
        // Update dropout pattern buttons
        const dropoutContainer = document.querySelector('.dropout-pattern');
        if (dropoutContainer) {
            dropoutContainer.innerHTML = Array(beats).fill(0).map((_, i) =>
                `<button class="dropout-beat-btn" data-beat="${i}">${i + 1}</button>`
            ).join('');
            
            // Re-attach dropout button listeners
            dropoutContainer.querySelectorAll('.dropout-beat-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const beat = parseInt(e.target.dataset.beat);
                    const index = this.beatDropout.pattern.indexOf(beat);
                    
                    if (index > -1) {
                        this.beatDropout.pattern.splice(index, 1);
                        e.target.classList.remove('active');
                    } else {
                        this.beatDropout.pattern.push(beat);
                        e.target.classList.add('active');
                    }
                });
            });
        }
    }

    // Override parent methods to handle enhanced features
    async start() {
        if (this.tempoProgression.enabled) {
            this.tempoProgression.currentMeasure = 0;
            this.setBpm(this.tempoProgression.startBpm);
        }
        
        await super.start();
    }

    stop() {
        super.stop();
        
        if (this.tempoProgression.enabled) {
            this.tempoProgression.currentMeasure = 0;
            this.setBpm(this.tempoProgression.startBpm);
            document.getElementById('progressionStatus').textContent = `Current: ${this.bpm} BPM`;
        }
    }
}
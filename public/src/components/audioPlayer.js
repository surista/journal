// Audio Player Component - Fixed Complete Version with High-Quality Tempo Control
import {WaveformVisualizer} from './waveform.js';
import { SessionManager } from './audio/sessionManager.js';
import { youtubeAudioProcessor } from '../services/youtubeAudioProcessor.js';
import { StorageService } from '../services/storageService.js';
import { TimeUtils } from '../utils/helpers.js';
import { renderAudioPlayerDOM } from './audioPlayerDOM.js';

export class AudioPlayer {
    constructor(container, audioService) {
        this.container = container;
        this.audioService = audioService;
        this.storageService = null;
        this.audio = null;

        this.sessionManager = new SessionManager(this);

        // YouTube player
        this.youtubePlayer = null;
        this.isYouTubeMode = false;
        this.youtubeVideoId = null;
        this.youtubeUpdateInterval = null;
        this.youtubeVideoTitle = null;
        this.youtubeVideoUrl = null;

        // Tone.js components for high-quality playback
        this.grainPlayer = null;
        this.isInitialized = false;
        this.eventListenersAttached = false;
        this.currentFileName = null;
        this.waveformVisualizer = null;

        // Audio parameters
        this.playbackRate = 1.0;
        this.pitchShiftAmount = 0;
        this.loopStart = null;
        this.loopEnd = null;
        this.isLooping = false;
        this.audioLoaded = false;
        this.qualityMode = 'medium'; // 'low', 'medium', 'high'

        // Tempo progression for loops
        this.tempoProgression = {
            enabled: false,
            incrementType: 'percentage', // 'percentage' or 'bpm'
            incrementValue: 1,
            loopInterval: 1, // After every N loops
            currentLoopCount: 0,
            maxTempo: 200 // 200% max speed
        };
        this.loopCount = 0;

        // UI state
        this.isPlaying = false;
        this.duration = 0;
        this.currentTime = 0;
        this.startTime = 0;
        this.startOffset = 0;
    }

    ensureStorageService() {
        if (!this.storageService) {
            // Try multiple fallback locations
            if (window.app?.currentPage?.storageService) {
                this.storageService = window.app.currentPage.storageService;
                console.log('Storage service obtained from currentPage');
            } else if (window.app?.storageService) {
                this.storageService = window.app.storageService;
                console.log('Storage service obtained from app');
            } else if (window.storageService) {
                this.storageService = window.storageService;
                console.log('Storage service obtained from window');
            } else {
                // Try to create a new instance as a last resort
                try {
                    this.storageService = new StorageService();
                    console.log('Storage service created new instance');

                    // Make it available globally for other components
                    if (window.app) {
                        window.app.storageService = this.storageService;
                    }
                } catch (e) {
                    console.error('Failed to create storage service instance:', e);
                }
            }

            if (!this.storageService) {
                console.error('Storage service not found in any expected location');
                return false;
            }
        }
        return true;
    }


    init() {
        if (this.isInitialized) {
            console.log('Audio player already initialized');
            return;
        }

        console.log('Initializing audio player...');
        console.log('Storage service available at init:', !!this.storageService);

        // Ensure storage service is available
        if (!this.storageService) {
            console.warn('Storage service not set during init, attempting to find it...');
            this.ensureStorageService();
        }



        try {
            this.render();
            this.attachEventListeners();
            this.initializeTone();
            this.isInitialized = true;
            console.log('Audio player initialized successfully with storage service:', !!this.storageService);

            // Make sure the audio player is globally accessible for onclick handlers
            if (typeof window !== 'undefined') {
                window.audioPlayer = this;
                window.youtubeAudioProcessor = youtubeAudioProcessor;

                // Also try to set it on the app structure
                if (window.app?.currentPage?.components) {
                    window.app.currentPage.components.audioPlayer = this;
                }
            }

        } catch (error) {
            console.error('Error in audio player init:', error);
            throw error;
        }
    }

    async initializeTone() {
        try {
            // Start Tone.js
            await Tone.start();
            console.log('Tone.js initialized');

            // Set the destination volume to ensure it's at unity gain
            Tone.Destination.volume.value = 0; // 0 dB

            // Note: We're now using GrainPlayer's built-in detune for pitch shifting
            // which provides much better quality than the PitchShift effect
            console.log('Using GrainPlayer detune for high-quality pitch shifting');

            // Add a master gain node for volume control
            // Start at 1.0 gain which corresponds to 100% on the exponentially-scaled volume slider
            this.masterGain = new Tone.Gain(1.0).toDestination();

            // Ensure the gain is stable and doesn't ramp
            this.masterGain.gain.cancelScheduledValues(Tone.now());
            this.masterGain.gain.setValueAtTime(1.0, Tone.now());

            // Ensure audioService is available
            if (!this.audioService) {
                console.error('AudioService not available during Tone.js init');
                // Try to get it from the global app
                if (window.app?.audioService) {
                    this.audioService = window.app.audioService;
                    console.log('AudioService retrieved from global app');
                }
            }

        } catch (error) {
            console.error('Failed to initialize Tone.js:', error);
        }
    }

    createLoopControlsSection() {
        const section = document.createElement('div');
        section.className = 'loop-controls-section';
        section.style.cssText = 'background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); padding: 16px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.1); width: 100%; box-sizing: border-box; position: relative; z-index: 10000 !important;';
        
        const h4 = document.createElement('h4');
        h4.style.marginBottom = '12px';
        h4.textContent = 'Loop Controls';
        section.appendChild(h4);
        
        // Main Controls Row
        const mainControlsRow = document.createElement('div');
        mainControlsRow.style.cssText = 'display: flex; gap: 8px; align-items: center; margin-bottom: 12px; flex-wrap: wrap;';
        
        const buttons = [
            { id: 'setLoopStartBtn', text: 'Start' },
            { id: 'setLoopEndBtn', text: 'End' },
            { id: 'clearLoopBtn', text: 'Clear' }
        ];
        
        buttons.forEach(({ id, text }) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.id = id;
            btn.className = 'btn btn-sm btn-secondary';
            btn.style.cssText = 'padding: 6px 12px; font-size: 12px;';
            btn.textContent = text;
            mainControlsRow.appendChild(btn);
        });
        
        const loopInfo = document.createElement('div');
        loopInfo.className = 'loop-info';
        loopInfo.style.cssText = 'font-family: monospace; font-size: 13px; text-align: center;';
        
        const loopStart = document.createElement('span');
        loopStart.id = 'loopStart';
        loopStart.textContent = '--:--';
        
        const loopEnd = document.createElement('span');
        loopEnd.id = 'loopEnd';
        loopEnd.textContent = '--:--';
        
        loopInfo.appendChild(loopStart);
        loopInfo.appendChild(document.createTextNode(' - '));
        loopInfo.appendChild(loopEnd);
        mainControlsRow.appendChild(loopInfo);
        
        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.id = 'saveSessionBtn';
        saveBtn.className = 'btn btn-sm btn-primary';
        saveBtn.style.cssText = 'padding: 6px 16px; font-size: 12px;';
        saveBtn.textContent = '💾 Save Loop';
        mainControlsRow.appendChild(saveBtn);
        
        section.appendChild(mainControlsRow);
        
        // Toggle Controls Row
        const toggleRow = document.createElement('div');
        toggleRow.style.cssText = 'display: flex; align-items: center; gap: 16px;';
        
        const toggles = [
            { id: 'loopEnabled', text: 'Loop?' },
            { id: 'progressionEnabled', text: 'Auto?' }
        ];
        
        toggles.forEach(({ id, text }) => {
            const label = document.createElement('label');
            label.className = 'loop-toggle';
            label.style.cssText = 'display: inline-flex; align-items: center; white-space: nowrap;';
            
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = id;
            
            const toggleSwitch = document.createElement('span');
            toggleSwitch.className = 'toggle-switch';
            
            const span = document.createElement('span');
            span.textContent = text;
            
            label.appendChild(input);
            label.appendChild(toggleSwitch);
            label.appendChild(span);
            toggleRow.appendChild(label);
        });
        
        const spacer = document.createElement('div');
        spacer.style.flex = '1';
        toggleRow.appendChild(spacer);
        
        const savedLoopsLabel = document.createElement('span');
        savedLoopsLabel.style.cssText = 'color: var(--text-secondary); font-size: 13px;';
        savedLoopsLabel.textContent = 'Saved Loops:';
        toggleRow.appendChild(savedLoopsLabel);
        
        section.appendChild(toggleRow);
        
        // Tempo Progression Controls
        const progressionControls = document.createElement('div');
        progressionControls.className = 'progression-controls-inline';
        progressionControls.id = 'progressionControls';
        progressionControls.style.cssText = 'display: none; align-items: center; gap: 6px; font-size: 12px; margin-top: 12px;';
        
        const incrementValue = document.createElement('input');
        incrementValue.type = 'number';
        incrementValue.id = 'incrementValue';
        incrementValue.value = '1';
        incrementValue.min = '0.1';
        incrementValue.max = '10';
        incrementValue.step = '0.1';
        incrementValue.style.cssText = 'width: 45px; padding: 3px 6px; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 4px; font-size: 12px;';
        
        const incrementType = document.createElement('select');
        incrementType.id = 'incrementType';
        incrementType.style.cssText = 'padding: 3px 6px; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 4px; font-size: 12px;';
        
        const percentOption = document.createElement('option');
        percentOption.value = 'percentage';
        percentOption.textContent = '%';
        
        const bpmOption = document.createElement('option');
        bpmOption.value = 'bpm';
        bpmOption.textContent = 'BPM';
        
        incrementType.appendChild(percentOption);
        incrementType.appendChild(bpmOption);
        
        const everyText = document.createElement('span');
        everyText.textContent = 'every';
        
        const loopInterval = document.createElement('input');
        loopInterval.type = 'number';
        loopInterval.id = 'loopInterval';
        loopInterval.value = '1';
        loopInterval.min = '1';
        loopInterval.max = '10';
        loopInterval.style.cssText = 'width: 35px; padding: 3px 6px; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 4px; font-size: 12px;';
        
        const loopsText = document.createElement('span');
        loopsText.textContent = 'loops';
        
        progressionControls.appendChild(incrementValue);
        progressionControls.appendChild(incrementType);
        progressionControls.appendChild(everyText);
        progressionControls.appendChild(loopInterval);
        progressionControls.appendChild(loopsText);
        
        section.appendChild(progressionControls);
        
        return section;
    }

    createSavedLoopsSection() {
        const section = document.createElement('div');
        section.className = 'saved-loops-section';
        section.style.cssText = 'background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); padding: 16px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.1);';
        
        const h4 = document.createElement('h4');
        h4.style.cssText = 'margin-bottom: 12px; font-size: 14px; color: var(--text-secondary);';
        h4.textContent = 'Saved Loops';
        section.appendChild(h4);
        
        const savedSessionsList = document.createElement('div');
        savedSessionsList.id = 'savedSessionsList';
        savedSessionsList.className = 'saved-sessions-list';
        savedSessionsList.style.cssText = 'max-height: 150px; overflow-y: auto;';
        
        const emptyState = document.createElement('p');
        emptyState.className = 'empty-state';
        emptyState.style.cssText = 'color: var(--text-secondary); text-align: center; font-size: 12px; margin: 0; padding: 16px;';
        emptyState.textContent = 'No saved loops for this file';
        
        savedSessionsList.appendChild(emptyState);
        section.appendChild(savedSessionsList);
        
        return section;
    }

    createAudioControlsCompact() {
        const section = document.createElement('div');
        section.className = 'audio-controls-compact';
        section.style.cssText = 'background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.1);';
        
        const h4 = document.createElement('h4');
        h4.style.cssText = 'margin-bottom: 16px; text-align: center;';
        h4.textContent = 'Audio Controls';
        section.appendChild(h4);
        
        const grid = document.createElement('div');
        grid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 16px;';
        
        // Speed Control
        const speedControl = document.createElement('div');
        speedControl.className = 'speed-control-compact';
        
        const speedLabel = document.createElement('label');
        speedLabel.style.cssText = 'display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-secondary);';
        speedLabel.textContent = 'Speed: ';
        
        const speedValue = document.createElement('span');
        speedValue.id = 'speedValue';
        speedValue.style.cssText = 'color: var(--primary); font-weight: 600;';
        speedValue.textContent = '100%';
        speedLabel.appendChild(speedValue);
        
        const speedSlider = document.createElement('input');
        speedSlider.type = 'range';
        speedSlider.id = 'speedSlider';
        speedSlider.min = '50';
        speedSlider.max = '150';
        speedSlider.value = '100';
        speedSlider.step = '1';
        speedSlider.className = 'slider';
        speedSlider.style.cssText = 'width: 100%; height: 8px; background: linear-gradient(to right, #374151 0%, #6366f1 50%, #374151 100%); border-radius: 4px; outline: none; -webkit-appearance: none; -moz-appearance: none; appearance: none;';
        
        const speedMarks = document.createElement('div');
        speedMarks.style.cssText = 'display: flex; justify-content: space-between; margin-top: 4px; font-size: 11px; color: var(--text-muted);';
        
        const mark50 = document.createElement('span');
        mark50.textContent = '50%';
        const mark100 = document.createElement('span');
        mark100.style.color = 'var(--text-secondary)';
        mark100.textContent = '100%';
        const mark150 = document.createElement('span');
        mark150.textContent = '150%';
        
        speedMarks.appendChild(mark50);
        speedMarks.appendChild(mark100);
        speedMarks.appendChild(mark150);
        
        speedControl.appendChild(speedLabel);
        speedControl.appendChild(speedSlider);
        speedControl.appendChild(speedMarks);
        
        // Pitch Control
        const pitchControl = document.createElement('div');
        pitchControl.className = 'pitch-control-compact';
        
        const pitchLabel = document.createElement('label');
        pitchLabel.style.cssText = 'display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-secondary);';
        pitchLabel.textContent = 'Pitch: ';
        
        const pitchValue = document.createElement('span');
        pitchValue.id = 'pitchValue';
        pitchValue.style.cssText = 'color: var(--primary); font-weight: 600;';
        pitchValue.textContent = '0';
        pitchLabel.appendChild(pitchValue);
        
        const pitchButtons = document.createElement('div');
        pitchButtons.className = 'pitch-buttons';
        pitchButtons.style.cssText = 'display: flex; gap: 6px; justify-content: center;';
        
        const pitchBtnData = [
            { pitch: '-1', text: '-1' },
            { pitch: '-0.5', text: '-½' },
            { pitch: '+0.5', text: '+½' },
            { pitch: '+1', text: '+1' }
        ];
        
        pitchBtnData.forEach(({ pitch, text }) => {
            const btn = document.createElement('button');
            btn.className = 'pitch-btn';
            btn.dataset.pitch = pitch;
            btn.style.cssText = 'flex: 1; padding: 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 14px;';
            btn.textContent = text;
            pitchButtons.appendChild(btn);
        });
        
        pitchControl.appendChild(pitchLabel);
        pitchControl.appendChild(pitchButtons);
        
        grid.appendChild(speedControl);
        grid.appendChild(pitchControl);
        section.appendChild(grid);
        
        // Volume Control
        const volumeControl = document.createElement('div');
        volumeControl.className = 'volume-control-compact';
        
        const volumeLabel = document.createElement('label');
        volumeLabel.style.cssText = 'display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-secondary);';
        volumeLabel.textContent = 'Volume: ';
        
        const volumeValue = document.createElement('span');
        volumeValue.id = 'volumeValue';
        volumeValue.style.cssText = 'color: var(--primary); font-weight: 600;';
        volumeValue.textContent = '100%';
        volumeLabel.appendChild(volumeValue);
        
        const volumeSliderContainer = document.createElement('div');
        volumeSliderContainer.className = 'volume-slider-container';
        volumeSliderContainer.style.cssText = 'display: flex; align-items: center; gap: 12px;';
        
        const volumeIcon = document.createElement('i');
        volumeIcon.className = 'icon';
        volumeIcon.style.fontSize = '18px';
        volumeIcon.textContent = '🔊';
        
        const volumeSlider = document.createElement('input');
        volumeSlider.type = 'range';
        volumeSlider.id = 'volumeSlider';
        volumeSlider.min = '0';
        volumeSlider.max = '100';
        volumeSlider.value = '100';
        volumeSlider.className = 'slider';
        volumeSlider.style.cssText = 'flex: 1; height: 8px; background: linear-gradient(to right, #374151 0%, #6366f1 100%); border-radius: 4px; outline: none; -webkit-appearance: none; -moz-appearance: none; appearance: none;';
        
        volumeSliderContainer.appendChild(volumeIcon);
        volumeSliderContainer.appendChild(volumeSlider);
        
        volumeControl.appendChild(volumeLabel);
        volumeControl.appendChild(volumeSliderContainer);
        section.appendChild(volumeControl);
        
        // Reset buttons
        const resetButtonsDiv = document.createElement('div');
        resetButtonsDiv.style.cssText = 'display: flex; gap: 10px; margin-top: 16px;';
        
        const resetSpeedBtn = document.createElement('button');
        resetSpeedBtn.id = 'resetSpeedBtn';
        resetSpeedBtn.className = 'btn btn-sm btn-secondary';
        resetSpeedBtn.style.cssText = 'flex: 1; padding: 8px; font-size: 13px;';
        const resetSpeedIcon = document.createElement('i');
        resetSpeedIcon.className = 'icon';
        resetSpeedIcon.textContent = '↻';
        resetSpeedBtn.appendChild(resetSpeedIcon);
        resetSpeedBtn.appendChild(document.createTextNode(' Reset Speed'));
        
        const resetPitchBtn = document.createElement('button');
        resetPitchBtn.id = 'resetPitchBtn';
        resetPitchBtn.className = 'btn btn-sm btn-secondary';
        resetPitchBtn.style.cssText = 'flex: 1; padding: 8px; font-size: 13px;';
        const resetPitchIcon = document.createElement('i');
        resetPitchIcon.className = 'icon';
        resetPitchIcon.textContent = '↻';
        resetPitchBtn.appendChild(resetPitchIcon);
        resetPitchBtn.appendChild(document.createTextNode(' Reset Pitch'));
        
        resetButtonsDiv.appendChild(resetSpeedBtn);
        resetButtonsDiv.appendChild(resetPitchBtn);
        section.appendChild(resetButtonsDiv);
        
        return section;
    }

    render() {
        if (!this.container) {
            console.error('No container for audio player');
            return;
        }

        console.log('Rendering audio player UI...');

        // Use DOM-based rendering
        renderAudioPlayerDOM(this.container);
        
        // Attach event listeners after rendering
        console.log('Audio player UI rendered successfully');
        this.attachEventListeners();
        
        // Add styles if not already added
        this.addStyles();
    }
    
    addStyles() {
        // Check if style already exists before adding
        if (document.getElementById('audioPlayerStyles')) {
            return;
        }
        
        const style = document.createElement('style');
        style.id = 'audioPlayerStyles';
        style.textContent = `
            /* Enhanced slider styles */
            .slider {
                cursor: pointer !important;
            }
            
            /* WebKit browsers (Chrome, Safari, newer Edge) */
            .slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                height: 20px;
                width: 20px;
                border-radius: 50%;
                background: #6366f1;
                border: 2px solid #ffffff;
                cursor: pointer;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
                transition: all 0.2s ease;
            }
            
            .slider::-webkit-slider-thumb:hover {
                background: #5856eb;
                transform: scale(1.1);
                box-shadow: 0 3px 8px rgba(99, 102, 241, 0.4);
            }
            
            /* Firefox */
            .slider::-moz-range-thumb {
                height: 20px;
                width: 20px;
                border-radius: 50%;
                background: #6366f1;
                border: 2px solid #ffffff;
                cursor: pointer;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
                transition: all 0.2s ease;
                -moz-appearance: none;
                appearance: none;
            }
            
            .slider::-moz-range-thumb:hover {
                background: #5856eb;
                transform: scale(1.1);
                box-shadow: 0 3px 8px rgba(99, 102, 241, 0.4);
            }
            
            /* Remove default track styling */
            .slider::-webkit-slider-track {
                -webkit-appearance: none;
                appearance: none;
            }
            
            .slider::-moz-range-track {
                background: transparent;
                border: none;
            }
            
            /* Add focus styles */
            .slider:focus {
                outline: none;
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
                border-radius: 4px;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    attachEventListeners() {
        // Prevent duplicate event listeners
        if (this.eventListenersAttached) {
            console.log('Event listeners already attached, skipping...');
            return;
        }

        console.log('Attaching event listeners...');

        // File input
        const fileInput = document.getElementById('audioFileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
            console.log('File input listener attached');
        } else {
            console.error('File input element not found');
        }

        // Source tab switching
        document.querySelectorAll('.source-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                // Update active tab
                document.querySelectorAll('.source-tab').forEach(t => {
                    t.classList.remove('active');
                    t.style.background = 'var(--bg-input)';
                    t.style.color = 'var(--text-primary)';
                    t.style.border = '1px solid var(--border)';
                });

                e.target.classList.add('active');
                e.target.style.background = 'var(--primary)';
                e.target.style.color = 'white';
                e.target.style.border = 'none';

                // Show/hide sections
                const source = e.target.dataset.source;
                document.getElementById('fileInputSection').style.display =
                    source === 'file' ? 'block' : 'none';
                document.getElementById('youtubeInputSection').style.display =
                    source === 'youtube' ? 'block' : 'none';

                // Reset when switching from YouTube to Local File
                if (this.isYouTubeMode && source === 'file') {
                    // Stop YouTube player
                    if (this.youtubePlayer) {
                        this.youtubePlayer.stopVideo();
                    }

                    // Clear YouTube state
                    this.isYouTubeMode = false;
                    this.youtubeVideoId = null;
                    this.youtubeVideoTitle = null;
                    this.youtubeVideoUrl = null;

                    // Hide YouTube player container
                    const youtubeContainer = document.getElementById('youtubePlayerContainer');
                    if (youtubeContainer) {
                        youtubeContainer.style.display = 'none';
                    }
                    
                    // Re-enable controls
                    const playBtn = document.getElementById('audioPlayPauseBtn');
                    if (playBtn) {
                        playBtn.disabled = false;
                        // Clear button content
                        while (playBtn.firstChild) {
                            playBtn.removeChild(playBtn.firstChild);
                        }
                        // Add icon and text
                        const icon = document.createElement('i');
                        icon.className = 'icon';
                        icon.textContent = '▶️';
                        playBtn.appendChild(icon);
                        playBtn.appendChild(document.createTextNode(' Play'));
                    }
                    
                    // Show all hidden controls
                    const elementsToShow = [
                        'speedControl',
                        'pitchControl', 
                        'loopControls',
                        'progressSection',
                        'waveformContainer',
                        'tempoProgressionSection'
                    ];
                    
                    elementsToShow.forEach(id => {
                        const element = document.getElementById(id);
                        if (element) element.style.display = '';
                    });

                    // Reset waveform container
                    const waveformContainer = document.querySelector('.waveform-container');
                    if (waveformContainer) {
                        // Clear container
                        while (waveformContainer.firstChild) {
                            waveformContainer.removeChild(waveformContainer.firstChild);
                        }
                        // Create new canvas
                        const canvas = document.createElement('canvas');
                        canvas.id = 'waveformCanvas';
                        canvas.style.cssText = 'width: 100%; height: 100%; display: block;';
                        waveformContainer.appendChild(canvas);
                    }

                    // Clear file name display
                    // Filename display is now managed by the parent component
                    // const fileNameEl = document.getElementById('currentFileName');
                    // if (fileNameEl) {
                    //     fileNameEl.textContent = '';
                    //     fileNameEl.style.color = 'var(--text-secondary)';
                    // }

                    // Hide pitch control and stop audio processing
                    const pitchControl = document.getElementById('youtubePitchControl');
                    if (pitchControl) {
                        pitchControl.style.display = 'none';
                    }

                    // Stop audio processor if active
                    if (youtubeAudioProcessor.isCurrentlyProcessing()) {
                        youtubeAudioProcessor.stopProcessing();
                    }

                    // Update pitch button states
                    this.updatePitchButtonStates();

                    // Hide audio controls if no local file is loaded
                    if (!this.currentFileName) {
                        const controlsSection = document.getElementById('audioControlsSection');
                        if (controlsSection) {
                            controlsSection.style.display = 'none';
                        }
                    }

                    // Clear duration display
                    const durationEl = document.getElementById('duration');
                    const currentTimeEl = document.getElementById('currentTime');
                    if (durationEl) durationEl.textContent = '0:00';
                    if (currentTimeEl) currentTimeEl.textContent = '0:00';

                    // Reset playback state
                    this.stop();
                }
            });
        });

        // YouTube load button
        document.getElementById('loadYoutubeBtn')?.addEventListener('click', () => {
            const input = document.getElementById('youtubeUrlInput');
            if (input && input.value.trim()) {
                this.loadYouTubeVideo(input.value.trim());
            }
        });

        // YouTube URL input enter key
        document.getElementById('youtubeUrlInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const input = e.target;
                if (input.value.trim()) {
                    this.loadYouTubeVideo(input.value.trim());
                }
            }
        });

        // Playback controls
        const playPauseBtn = document.getElementById('audioPlayPauseBtn');
        const stopBtn = document.getElementById('audioStopBtn');

        console.log('Audio player buttons found:', {
            playPauseBtn: !!playPauseBtn,
            stopBtn: !!stopBtn
        });

        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => {
                console.log('Play button clicked');
                this.togglePlayPause();
            });
        } else {
            console.error('audioPlayPauseBtn not found!');
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                console.log('Stop button clicked');
                this.stop();
            });
        } else {
            console.error('audioStopBtn not found!');
        }

        // Loop controls
        document.getElementById('setLoopStartBtn')?.addEventListener('click', () => this.setLoopStart());
        document.getElementById('setLoopEndBtn')?.addEventListener('click', () => this.setLoopEnd());
        document.getElementById('clearLoopBtn')?.addEventListener('click', () => this.clearLoop());
        document.getElementById('loopEnabled')?.addEventListener('change', (e) => {
            this.isLooping = e.target.checked;
        });

        // Save session button - Use event delegation
        const loopControlsSection = document.querySelector('.loop-controls-section');
        if (loopControlsSection) {
            loopControlsSection.addEventListener('click', (e) => {
                if (e.target && e.target.id === 'saveLoopBtn') {
                    console.log('Save loop button clicked via delegation!');
                    if (this.sessionManager && this.sessionManager.saveCurrentSession) {
                        this.sessionManager.saveCurrentSession();
                    }
                }
            });
        }

        // Also add direct listener as backup
        const saveBtn = document.getElementById('saveLoopBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                console.log('Save loop button clicked directly!');
                if (this.sessionManager && this.sessionManager.saveCurrentSession) {
                    this.sessionManager.saveCurrentSession();
                }
            });
        }


        // Tempo progression controls
        document.getElementById('progressionEnabled')?.addEventListener('change', (e) => {
            this.tempoProgression.enabled = e.target.checked;
            document.getElementById('progressionControls').style.display =
                e.target.checked ? 'block' : 'none';
            this.updateProgressionStatus();
        });

        document.getElementById('incrementValue')?.addEventListener('change', (e) => {
            this.tempoProgression.incrementValue = parseFloat(e.target.value);
            this.updateProgressionStatus();
        });

        document.getElementById('incrementType')?.addEventListener('change', (e) => {
            this.tempoProgression.incrementType = e.target.value;
            this.updateProgressionStatus();
        });

        document.getElementById('loopInterval')?.addEventListener('change', (e) => {
            this.tempoProgression.loopInterval = parseInt(e.target.value);
            this.updateProgressionStatus();
        });

        // Speed controls
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const change = parseInt(e.target.dataset.speed);
                this.adjustSpeed(change);
            });
        });

        const speedSlider = document.getElementById('speedSlider');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                this.setSpeed(parseInt(e.target.value));
            });
        }

        document.getElementById('resetSpeedBtn')?.addEventListener('click', () => {
            this.setSpeed(100);
            if (speedSlider) speedSlider.value = 100;
            // Re-apply pitch to ensure proper compensation
            this.setPitch(this.pitchShiftAmount);
        });

        // Pitch controls
        document.querySelectorAll('.pitch-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const change = parseFloat(e.target.dataset.pitch);
                this.adjustPitch(change);
            });
        });

        document.getElementById('resetPitchBtn')?.addEventListener('click', () => {
            this.setPitch(0);
        });

        // Volume control
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            // Set initial volume to ensure consistency
            if (this.masterGain) {
                // Initial slider is at 100, so set gain to 1.0 (100% squared)
                this.masterGain.gain.setValueAtTime(1.0, Tone.now());
            }

            volumeSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                document.getElementById('volumeValue').textContent = value + '%';
                if (this.masterGain) {
                    // Use exponential scaling for more natural volume control
                    // Maps 0-100 to 0-1 with exponential curve
                    const normalizedValue = value / 100;
                    const gainValue = normalizedValue * normalizedValue;
                    // Use setValueAtTime to prevent ramping
                    this.masterGain.gain.setValueAtTime(gainValue, Tone.now());
                }
            });
        }
        // YouTube pitch control button
        const enablePitchBtn = document.getElementById('enablePitchBtn');
        if (enablePitchBtn) {
            enablePitchBtn.addEventListener('click', async (e) => {
                e.stopPropagation();

                // Check if already processing
                if (youtubeAudioProcessor.isCurrentlyProcessing()) {
                    // Disable pitch shifting
                    youtubeAudioProcessor.stopProcessing();
                    enablePitchBtn.textContent = 'Enable Pitch Shifting';
                    enablePitchBtn.classList.remove('btn-primary');
                    enablePitchBtn.classList.add('btn-secondary');
                    enablePitchBtn.disabled = false;

                    const indicator = document.getElementById('pitchActiveIndicator');
                    if (indicator) {
                        indicator.style.display = 'none';
                    }

                    // Update pitch button states
                    this.updatePitchButtonStates();

                    // Reset pitch to 0 when disabling
                    this.setPitch(0);
                    const pitchSlider = document.getElementById('pitchSlider');
                    if (pitchSlider) pitchSlider.value = 0;

                } else {
                    // Enable pitch shifting
                    try {
                        enablePitchBtn.disabled = true;
                        enablePitchBtn.textContent = 'Enabling...';

                        // Initialize and start audio capture
                        await youtubeAudioProcessor.startTabAudioCapture();

                        // Update UI to show it's active
                        enablePitchBtn.textContent = 'Disable Pitch Shifting';
                        enablePitchBtn.classList.remove('btn-secondary');
                        enablePitchBtn.classList.add('btn-primary');
                        enablePitchBtn.disabled = false;

                        const indicator = document.getElementById('pitchActiveIndicator');
                        if (indicator) {
                            indicator.style.display = 'block';
                        }

                        // Apply current pitch setting
                        youtubeAudioProcessor.setPitch(this.pitchShiftAmount);

                        // Update pitch button states
                        this.updatePitchButtonStates();

                    } catch (error) {
                        console.error('Failed to enable pitch shifting:', error);
                        this.showNotification(error.message || 'Failed to enable pitch shifting', 'error');
                        enablePitchBtn.textContent = 'Enable Pitch Shifting';
                        enablePitchBtn.disabled = false;

                        // Update pitch button states
                        this.updatePitchButtonStates();
                    }
                }
            });
        }

        this.sessionManager.attachEventListeners();
        console.log('All event listeners attached successfully');
        this.eventListenersAttached = true;

    }

    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        console.log('Loading audio file:', file.name);

        try {
            // Stop any current playback
            this.stop();

            // Store filename
            this.currentFileName = file.name;
            if (this.practiceForm) {
                this.practiceForm.setAudioContext(file.name);
            }
            // Filename display is now managed by the parent component
            // const fileNameEl = document.getElementById('currentFileName');
            // if (fileNameEl) {
            //     fileNameEl.textContent = `Loaded: ${file.name}`;
            //     fileNameEl.style.color = 'var(--success)';
            // }

            // Dispose of previous player
            if (this.grainPlayer) {
                this.grainPlayer.stop();
                this.grainPlayer.dispose();
            }

            // Convert file to URL
            const audioUrl = URL.createObjectURL(file);

            // Reset loaded state
            this.audioLoaded = false;

            // Create GrainPlayer with settings optimized for tempo changes
            // Key insight: For tempo changes, we need consistent grain timing
            this.grainPlayer = new Tone.GrainPlayer({
                url: audioUrl,
                loop: false,
                playbackRate: 1.0,
                grainSize: 0.1,     // 100ms grains - good balance
                overlap: 0.2,       // 20% overlap - reduces phasing artifacts
                reverse: false,
                volume: -12,        // Start at reasonable level
                fadeIn: 0,
                fadeOut: 0,
                onload: () => {
                    try {
                        console.log('Audio loaded in Tone.js GrainPlayer');
                        this.duration = this.grainPlayer.buffer.duration;

                        // Mark as loaded in our own property
                        this.audioLoaded = true;

                        // Reset detune to default
                        this.grainPlayer.detune = 0;

                        // Connect to master gain before setting volume
                        this.grainPlayer.connect(this.masterGain);
                        
                        // Set master gain to current volume slider value
                        const volumeSlider = document.getElementById('volumeSlider');
                        if (volumeSlider && this.masterGain) {
                            const normalizedValue = volumeSlider.value / 100;
                            const gainValue = normalizedValue * normalizedValue; // Exponential curve
                            this.masterGain.gain.cancelScheduledValues(Tone.now());
                            this.masterGain.gain.setValueAtTime(gainValue, Tone.now());
                        }

                        console.log('Audio chain connected: GrainPlayer -> MasterGain -> Destination');

                        // Show controls with loading state
                        const controlsSection = document.getElementById('audioControlsSection');
                        if (controlsSection) {
                            controlsSection.style.display = 'block';
                        }

                        // Show loading state for waveform
                        const loadingState = document.getElementById('waveformLoadingState');
                        const waveformCanvas = document.getElementById('waveformCanvas');
                        if (loadingState && waveformCanvas) {
                            loadingState.style.display = 'flex';
                            waveformCanvas.style.opacity = '0';
                        }

                        const durationEl = document.getElementById('duration');
                        const currentTimeEl = document.getElementById('currentTime');

                        if (durationEl) durationEl.textContent = this.formatTime(this.duration);
                        if (currentTimeEl) currentTimeEl.textContent = this.formatTime(0);

                        // Initialize waveform
                        this.initializeWaveform(file);

                        // Load saved sessions
                        this.sessionManager.loadSavedSessions();

                        // Dispatch event for practice form
                        window.dispatchEvent(new CustomEvent('audioFileLoaded', {
                            detail: {fileName: file.name}
                        }));

                        console.log('Audio player setup complete');

                    } catch (error) {
                        console.error('Error in onload callback:', error);
                        // Continue anyway - the audio might still be playable
                        this.audioLoaded = true;
                    }
                },
                onerror: (error) => {
                    console.error('Error loading audio:', error);
                    this.showNotification('Failed to load audio file', 'error');
                }
            });

        } catch (error) {
            console.error('Error loading audio file:', error);
            this.showNotification('Failed to load audio file: ' + error.message, 'error');
            const controlsSection = document.getElementById('audioControlsSection');
            if (controlsSection) {
                controlsSection.style.display = 'none';
            }
        }
    }

    initializeYouTubePlayer() {
        // Ensure YouTube API is loaded
        if (!window.YT || !window.YT.Player) {
            console.error('YouTube API not loaded');
            setTimeout(() => this.initializeYouTubePlayer(), 1000);
            return;
        }

        // Create YouTube player
        this.youtubePlayer = new YT.Player('youtubePlayer', {
            height: '100%',
            width: '100%',
            videoId: '',
            playerVars: {
                'controls': 1,
                'rel': 0,
                'modestbranding': 1,
                'enablejsapi': 1,
                'autoplay': 0,  // Prevent autoplay
                'origin': window.location.origin
            },
            events: {
                'onReady': this.onYouTubePlayerReady.bind(this),
                'onStateChange': this.onYouTubeStateChange.bind(this)
            }
        });
    }

    onYouTubePlayerReady(event) {
        console.log('YouTube player ready');

        // Enable controls
        const controlsSection = document.getElementById('audioControlsSection');
        if (controlsSection) {
            controlsSection.style.display = 'block';
        }

        // Fetch video title after a short delay
        setTimeout(() => this.fetchYouTubeTitle(), 1000);

        // Load saved sessions
        setTimeout(() => this.sessionManager.loadSavedSessions(), 1500);
    }

    onYouTubeStateChange(event) {
        if (event.data === YT.PlayerState.PLAYING) {
            this.isPlaying = true;
            this.startYouTubeTimeUpdates();

            // Start timer if sync is enabled
            this.syncTimerStart();
        } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
            this.isPlaying = false;
            this.stopYouTubeTimeUpdates();

            // Stop timer if sync is enabled
            this.syncTimerStop();

            // Handle loop if enabled
            if (event.data === YT.PlayerState.ENDED && this.isLooping && this.loopStart !== null && this.loopEnd !== null) {
                this.youtubePlayer.seekTo(this.loopStart);
                this.youtubePlayer.playVideo();
                this.handleLoopComplete();
            }
        }

        this.updatePlayPauseButton();
    }

    loadYouTubeVideo(url) {
        // Extract video ID from URL
        const videoId = this.extractYouTubeVideoId(url);
        if (!videoId) {
            this.showNotification('Invalid YouTube URL', 'error');
            return;
        }

        console.log('Loading YouTube video:', { videoId, url });

        // SET YOUTUBE STATE IMMEDIATELY
        this.youtubeVideoId = videoId;
        this.isYouTubeMode = true;
        this.youtubeVideoUrl = url;

        // Reset state
        this.stop();
        this.currentTime = 0;
        this.loopCount = 0;
        this.tempoProgression.currentLoopCount = 0;

        // Show YouTube player
        const container = document.getElementById('youtubePlayerContainer');
        if (container) {
            container.style.display = 'block';
        }

        // Initialize player if not already done
        if (!this.youtubePlayer) {
            this.initializeYouTubePlayer();
            // Load video after player is ready
            setTimeout(() => {
                if (this.youtubePlayer && this.youtubePlayer.cueVideoById) {
                    this.youtubePlayer.cueVideoById(videoId);
                    this.onVideoLoaded();
                }
            }, 1000);
        } else {
            if (this.youtubePlayer.cueVideoById) {
                this.youtubePlayer.cueVideoById(videoId);
                this.onVideoLoaded();
            }
        }

        // Update UI immediately
        // Filename display is now managed by the parent component
        // const fileNameEl = document.getElementById('currentFileName');
        // if (fileNameEl) {
        //     fileNameEl.textContent = `YouTube: ${videoId}`;
        //     fileNameEl.style.color = 'var(--success)';
        // }

        // Show controls immediately
        const controlsSection = document.getElementById('audioControlsSection');
        if (controlsSection) {
            controlsSection.style.display = 'block';
        }

        // TRIGGER LOAD SAVED SESSIONS FOR YOUTUBE
        setTimeout(() => {
            this.sessionManager.loadSavedSessions();
        }, 500);

        // Dispatch event for practice form
        window.dispatchEvent(new CustomEvent('youtubeVideoLoaded', {
            detail: {
                videoId: videoId,
                url: url,
                mode: 'youtube'
            }
        }));

        // Replace waveform with YouTube progress bar
        this.setupYouTubeProgressBar();

        // Debug: Check the actual HTML structure
        const loopControlsCheck = document.querySelector('.loop-controls-section');
        if (loopControlsCheck) {
            console.log('Loop controls HTML:', loopControlsCheck.outerHTML.substring(0, 200));
        } else {
            console.error('Loop controls section not found!');
            const unifiedCheck = document.querySelector('.loop-controls-unified');
            if (unifiedCheck) {
                console.error('Found unified controls instead - clearing cache required!');
            }
        }

        console.log('YouTube video setup complete:', {
            videoId: this.youtubeVideoId,
            isYouTubeMode: this.isYouTubeMode,
            url: this.youtubeVideoUrl
        });
    }

    onVideoLoaded() {
        // Update duration
        setTimeout(() => {
            if (this.youtubePlayer && this.youtubePlayer.getDuration) {
                this.duration = this.youtubePlayer.getDuration();
                const durationEl = document.getElementById('duration');
                if (durationEl) durationEl.textContent = this.formatTime(this.duration);

                // Update current time to 0
                const currentTimeEl = document.getElementById('currentTime');
                if (currentTimeEl) currentTimeEl.textContent = this.formatTime(0);
            }
        }, 500);

        // Show YouTube pitch control
        const pitchControl = document.getElementById('youtubePitchControl');
        if (pitchControl) {
            pitchControl.style.display = 'block';
        }

        // Update pitch button states for YouTube mode
        this.updatePitchButtonStates();
    }

    async fetchYouTubeTitle() {
        if (!this.youtubePlayer || !this.youtubeVideoId) return;

        try {
            // Get video data from player
            const videoData = this.youtubePlayer.getVideoData();
            if (videoData && videoData.title) {
                this.youtubeVideoTitle = videoData.title;

                console.log('YouTube title fetched:', this.youtubeVideoTitle);

                // Update display
                // Filename display is now managed by the parent component
                // const fileNameEl = document.getElementById('currentFileName');
                // if (fileNameEl) {
                //     fileNameEl.textContent = `YouTube: ${this.youtubeVideoTitle}`;
                // }

                // Update practice form
                window.dispatchEvent(new CustomEvent('youtubeVideoLoaded', {
                    detail: {
                        videoId: this.youtubeVideoId,
                        title: this.youtubeVideoTitle,
                        url: this.youtubeVideoUrl,
                        mode: 'youtube'
                    }
                }));

                // IMPORTANT: Reload saved sessions with the new title
                this.sessionManager.loadSavedSessions();
            }
        } catch (error) {
            console.error('Error fetching YouTube title:', error);
        }
    }

    extractYouTubeVideoId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
            /^([a-zA-Z0-9_-]{11})$/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }

        return null;
    }


    startYouTubeTimeUpdates() {
        this.stopYouTubeTimeUpdates();

        this.youtubeUpdateInterval = setInterval(() => {
            if (this.youtubePlayer && this.youtubePlayer.getCurrentTime) {
                try {
                    this.currentTime = this.youtubePlayer.getCurrentTime();

                    // Update time display
                    const currentTimeEl = document.getElementById('currentTime');
                    if (currentTimeEl) {
                        currentTimeEl.textContent = this.formatTime(this.currentTime);
                    }

                    // Update YouTube-specific progress elements
                    const progressFill = document.getElementById('youtubeProgressFill');
                    const positionIndicator = document.getElementById('youtubePositionIndicator');
                    const youtubeCurrentTimeEl = document.getElementById('youtubeCurrentTime');
                    const youtubeDurationEl = document.getElementById('youtubeDuration');

                    // Get current duration
                    let currentDuration = this.duration;
                    if (this.youtubePlayer.getDuration) {
                        currentDuration = this.youtubePlayer.getDuration();
                        if (currentDuration !== this.duration) {
                            this.duration = currentDuration;
                        }
                    }

                    if (currentDuration > 0) {
                        const percentage = (this.currentTime / currentDuration) * 100;

                        if (progressFill) {
                            progressFill.style.width = percentage + '%';
                        }
                        if (positionIndicator) {
                            positionIndicator.style.left = percentage + '%';
                        }
                    }

                    if (youtubeCurrentTimeEl) {
                        youtubeCurrentTimeEl.textContent = this.formatTime(this.currentTime);
                    }
                    if (youtubeDurationEl && currentDuration) {
                        youtubeDurationEl.textContent = this.formatTime(currentDuration);
                    }

                    // Update loop markers
                    this.updateYouTubeLoopMarkers();

                    // Handle looping
                    if (this.isLooping && this.loopEnd !== null && this.currentTime >= this.loopEnd) {
                        this.youtubePlayer.seekTo(this.loopStart || 0);
                        this.handleLoopComplete();
                    }
                } catch (error) {
                    console.error('Error in YouTube time update:', error);
                }
            }
        }, 100);
    }

    stopYouTubeTimeUpdates() {
        if (this.youtubeUpdateInterval) {
            clearInterval(this.youtubeUpdateInterval);
            this.youtubeUpdateInterval = null;
        }
    }

    updateYouTubeLoopMarkers() {
        const container = document.querySelector('.youtube-progress-container');
        if (!container || !this.isYouTubeMode) return;

        // Remove existing markers
        container.querySelectorAll('.youtube-loop-start, .youtube-loop-end').forEach(marker => marker.remove());

        // Get duration
        let duration = this.duration;
        if (this.isYouTubeMode && this.youtubePlayer && this.youtubePlayer.getDuration) {
            duration = this.youtubePlayer.getDuration();
        }

        if (!duration || duration === 0) return;

        // Add start marker if set (INDEPENDENT of end marker)
        if (this.loopStart !== null) {
            const startPercent = Math.max(0, Math.min(100, (this.loopStart / duration) * 100));
            const startMarker = document.createElement('div');
            startMarker.className = 'youtube-loop-start';
            startMarker.style.cssText = `
            position: absolute;
            bottom: 0;
            height: 60%;
            width: 3px;
            background: #10b981;
            left: ${startPercent}%;
            z-index: 10;
            box-shadow: 0 0 4px rgba(16, 185, 129, 0.5);
        `;
            container.appendChild(startMarker);
        }

        // Add end marker if set (INDEPENDENT of start marker)
        if (this.loopEnd !== null) {
            const endPercent = Math.max(0, Math.min(100, (this.loopEnd / duration) * 100));
            const endMarker = document.createElement('div');
            endMarker.className = 'youtube-loop-end';
            endMarker.style.cssText = `
            position: absolute;
            bottom: 0;
            height: 60%;
            width: 3px;
            background: #ef4444;
            left: ${endPercent}%;
            z-index: 10;
            box-shadow: 0 0 4px rgba(239, 68, 68, 0.5);
        `;
            container.appendChild(endMarker);
        }

        // Show loop region if both markers are set
        const loopRegion = document.getElementById('loopRegion');
        if (loopRegion && this.loopStart !== null && this.loopEnd !== null) {
            const startPercent = Math.max(0, Math.min(100, (this.loopStart / duration) * 100));
            const endPercent = Math.max(0, Math.min(100, (this.loopEnd / duration) * 100));

            loopRegion.style.left = startPercent + '%';
            loopRegion.style.width = (endPercent - startPercent) + '%';
            loopRegion.style.display = 'block';
        } else if (loopRegion) {
            loopRegion.style.display = 'none';
        }
    }

    setupYouTubeProgressBar() {
        const waveformContainer = document.querySelector('.waveform-container');
        if (!waveformContainer) {
            console.error('Waveform container not found');
            return;
        }

        // Force refresh loop controls to ensure consistent layout
        const loopControlsSection = document.querySelector('.loop-controls-section');
        if (loopControlsSection) {
            // Force re-render by updating a data attribute
            loopControlsSection.setAttribute('data-mode', 'youtube');

            // Ensure progression controls stay on separate line
            const progressionControls = document.getElementById('progressionControls');
            if (progressionControls && progressionControls.style.display === 'flex') {
                progressionControls.style.display = 'block';
            }
        }

        // Clear the container and replace with YouTube-specific progress bar
        waveformContainer.innerHTML = `
            <div class="youtube-progress-container" style="
                width: 100%; 
                height: 100%; 
                position: relative;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%);
                border-radius: 8px;
                overflow: hidden;
                border: 1px solid rgba(99, 102, 241, 0.2);
            ">
                <!-- YouTube mode indicator -->
                <div style="
                    position: absolute;
                    top: 8px;
                    left: 12px;
                    z-index: 10;
                    background: linear-gradient(45deg, #ff0000, #cc0000);
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 11px;
                    color: white;
                    font-weight: 600;
                    box-shadow: 0 2px 8px rgba(255, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                ">
                    🎬 YouTube Mode
                </div>
                
                <!-- Main progress area -->
                <div id="youtubeProgressBar" style="
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 60%;
                    background: rgba(0, 0, 0, 0.3);
                    cursor: pointer;
                    border-top: 1px solid rgba(99, 102, 241, 0.3);
                ">
                    <!-- Progress fill -->
                    <div id="youtubeProgressFill" style="
                        position: absolute;
                        left: 0;
                        top: 0;
                        bottom: 0;
                        width: 0%;
                        background: linear-gradient(90deg, #6366f1, #8b5cf6);
                        opacity: 0.6;
                        transition: width 0.1s ease;
                    "></div>
                    
                    <!-- Current position indicator -->
                    <div id="youtubePositionIndicator" style="
                        position: absolute;
                        top: -2px;
                        bottom: -2px;
                        width: 3px;
                        background: linear-gradient(180deg, #ffffff, #6366f1);
                        left: 0%;
                        box-shadow: 0 0 8px rgba(99, 102, 241, 0.8);
                        border-radius: 2px;
                        z-index: 15;
                    "></div>
                </div>
                
                <!-- Loop region overlay -->
                <div class="loop-region" id="loopRegion" style="
                    position: absolute;
                    bottom: 0;
                    height: 60%;
                    background: rgba(99, 102, 241, 0.15);
                    border-left: 3px solid #10b981;
                    border-right: 3px solid #ef4444;
                    pointer-events: none;
                    display: none;
                    z-index: 10;
                "></div>
                
                <!-- Wave visualization area (decorative) -->
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 40%;
                    background: linear-gradient(180deg, 
                        rgba(99, 102, 241, 0.1) 0%, 
                        rgba(139, 92, 246, 0.05) 50%, 
                        transparent 100%);
                    overflow: hidden;
                ">
                    <!-- Animated wave pattern -->
                    <div style="
                        position: absolute;
                        top: 50%;
                        left: 0;
                        right: 0;
                        height: 2px;
                        background: repeating-linear-gradient(
                            90deg,
                            transparent 0px,
                            rgba(99, 102, 241, 0.3) 10px,
                            transparent 20px,
                            rgba(139, 92, 246, 0.3) 30px,
                            transparent 40px
                        );
                        animation: waveMove 3s linear infinite;
                    "></div>
                </div>
                
                <!-- Time display -->
                <div style="
                    position: absolute;
                    bottom: 8px;
                    right: 12px;
                    background: rgba(0, 0, 0, 0.8);
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 12px;
                    color: #ffffff;
                    font-family: 'Courier New', monospace;
                    font-weight: 600;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
                ">
                    <span id="youtubeCurrentTime">0:00</span> / <span id="youtubeDuration">0:00</span>
                </div>
            </div>
            
            <style>
                @keyframes waveMove {
                    0% { transform: translateX(-40px); }
                    100% { transform: translateX(0px); }
                }
                
                .youtube-progress-container:hover #youtubePositionIndicator {
                    width: 4px;
                    box-shadow: 0 0 12px rgba(99, 102, 241, 1);
                }
                
                #youtubeProgressBar:hover {
                    background: rgba(0, 0, 0, 0.5);
                }
                
                #youtubeProgressFill {
                    background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
                }
            </style>
        `;

        // Add click handler for seeking
        const progressBar = document.getElementById('youtubeProgressBar');
        if (progressBar) {
            progressBar.addEventListener('click', (e) => {
                const rect = progressBar.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = x / rect.width;

                // Get duration from YouTube player
                let duration = this.duration;
                if (this.youtubePlayer && this.youtubePlayer.getDuration) {
                    duration = this.youtubePlayer.getDuration();
                }

                const seekTime = percentage * duration;

                if (this.youtubePlayer && this.youtubePlayer.seekTo) {
                    this.youtubePlayer.seekTo(seekTime, true);
                    console.log(`Seeking to ${seekTime.toFixed(2)}s (${(percentage * 100).toFixed(1)}%)`);
                }
            });

            // Add hover effect for seeking preview
            progressBar.addEventListener('mousemove', (e) => {
                const rect = progressBar.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = x / rect.width;

                // Could add a preview tooltip here if desired
                progressBar.title = `Seek to ${(percentage * 100).toFixed(1)}%`;
            });
        }

        console.log('YouTube progress bar setup complete');
    }

    setupTimeUpdate() {
        // Create a loop to update time display
        const updateTime = () => {
            if (this.grainPlayer && this.grainPlayer.state === 'started') {
                // Calculate elapsed real time since playback started
                const realElapsed = Tone.now() - this.startTime;

                // Apply playback rate to get scaled time + starting offset
                this.currentTime = (realElapsed * this.playbackRate) + (this.startOffset || 0);

                // Handle looping
                if (this.isLooping && this.loopEnd !== null && this.currentTime >= this.loopEnd) {
                    this.startOffset = this.loopStart || 0;
                    this.grainPlayer.stop();
                    this.grainPlayer.playbackRate = this.playbackRate;

                    // Restart playback for loop
                    this.grainPlayer.start(undefined, this.startOffset);

                    this.startTime = Tone.now();
                    this.currentTime = this.startOffset;

                    // Handle loop completion for tempo progression
                    this.handleLoopComplete();
                }

                const currentTimeEl = document.getElementById('currentTime');
                if (currentTimeEl) {
                    currentTimeEl.textContent = this.formatTime(this.currentTime);
                }

                // Update waveform progress
                if (this.waveformVisualizer) {
                    this.waveformVisualizer.updateProgress(this.currentTime);
                }
            }

            if (this.isPlaying) {
                requestAnimationFrame(updateTime);
            }
        };

        if (this.isPlaying) {
            updateTime();
        }
    }

    async initializeWaveform(file) {
        const canvas = document.getElementById('waveformCanvas');
        if (!canvas || !this.audioService) {
            console.error('Cannot initialize waveform: canvas or audioService missing', {
                canvas: !!canvas,
                canvasId: canvas?.id,
                audioService: !!this.audioService
            });
            return;
        }

        try {
            console.log('Initializing waveform for file:', file.name);

            // Load file into audioService for visualization
            await this.audioService.loadAudioFile(file);

            console.log('Audio buffer loaded:', {
                hasBuffer: !!this.audioService.audioBuffer,
                bufferDuration: this.audioService.audioBuffer?.duration,
                bufferChannels: this.audioService.audioBuffer?.numberOfChannels,
                bufferSampleRate: this.audioService.audioBuffer?.sampleRate
            });

            // Create waveform visualizer
            // The WaveformVisualizer constructor automatically calls init() -> resizeCanvas() -> draw()
            // No need for additional initialization calls
            this.waveformVisualizer = new WaveformVisualizer(canvas, this.audioService);
            console.log('Waveform visualizer created and initialized');

            // Override audioService methods
            this.audioService.getDuration = () => this.duration;
            this.audioService.getCurrentTime = () => this.currentTime;
            this.audioService.seek = (time) => {
                if (this.grainPlayer) {
                    // Store whether we were playing
                    const wasPlaying = this.isPlaying;

                    // Stop current playback if playing
                    if (this.grainPlayer.state === 'started') {
                        this.grainPlayer.stop();
                    }

                    // Update current time
                    this.currentTime = time;
                    this.startOffset = time;

                    // Update display
                    const currentTimeEl = document.getElementById('currentTime');
                    if (currentTimeEl) {
                        currentTimeEl.textContent = this.formatTime(time);
                    }

                    // Update waveform progress immediately
                    if (this.waveformVisualizer) {
                        this.waveformVisualizer.updateProgress(time);
                    }

                    // Resume playback if we were playing
                    if (wasPlaying) {
                        this.grainPlayer.playbackRate = this.playbackRate;

                        // Resume playback after seek
                        this.grainPlayer.start(undefined, time);

                        this.startTime = Tone.now();
                        this.isPlaying = true;

                        // Restart time updates
                        this.setupTimeUpdate();

                        // Restart waveform animation
                        if (this.waveformVisualizer) {
                            this.waveformVisualizer.startAnimation();
                        }
                    }
                }
            };

            // Removed duplicate draw call - resizeCanvas is already called above

            console.log('Waveform visualizer initialized');
        } catch (error) {
            console.error('Error initializing waveform:', error);
        }
    }

    async togglePlayPause() {
        if (this.isYouTubeMode) {
            if (this.youtubePlayer) {
                if (this.isPlaying) {
                    this.youtubePlayer.pauseVideo();
                } else {
                    // NEW: Check if we should start from loop point
                    if (this.isLooping && this.loopStart !== null) {
                        const currentTime = this.youtubePlayer.getCurrentTime();
                        // If we're outside the loop region or at the very beginning, start from loop start
                        if (currentTime < this.loopStart ||
                            (this.loopEnd !== null && currentTime > this.loopEnd) ||
                            currentTime === 0) {
                            this.youtubePlayer.seekTo(this.loopStart);
                        }
                    }
                    this.youtubePlayer.playVideo();
                }
            }
            return;
        }

        // Original file-based code
        console.log('=== AUDIO PLAY DEBUG ===');
        console.log('GrainPlayer exists:', !!this.grainPlayer);
        console.log('AudioLoaded flag:', this.audioLoaded);
        console.log('GrainPlayer state:', this.grainPlayer?.state);
        console.log('GrainPlayer buffer:', !!this.grainPlayer?.buffer);
        console.log('Current isPlaying:', this.isPlaying);

        if (!this.grainPlayer) {
            console.error('No audio player initialized');
            this.showNotification('Please select an audio file first.', 'error');
            return;
        }

        // Check if audio is loaded using our custom flag
        if (!this.audioLoaded) {
            console.error('Audio not yet loaded', {
                grainPlayer: !!this.grainPlayer,
                audioLoaded: this.audioLoaded,
                grainPlayerState: this.grainPlayer?.state,
                buffer: !!this.grainPlayer?.buffer
            });
            this.showNotification('Audio is still loading. Please wait...', 'error');
            return;
        }

        // Ensure Tone.js audio context is running
        if (Tone.context.state !== 'running') {
            try {
                await Tone.start();
                console.log('Tone.js audio context started');
            } catch (error) {
                console.error('Failed to start Tone.js:', error);
                this.showNotification('Failed to start audio. Please try again.', 'error');
                return;
            }
        }

        if (this.isPlaying) {
            // Store current playback position before stopping
            this.currentTime = this.startOffset + (Tone.now() - this.startTime) * this.playbackRate;

            this.grainPlayer.stop();
            this.isPlaying = false;

            // Stop timer if sync is enabled
            this.syncTimerStop();

            // Stop time update
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }

            // Stop waveform animation
            if (this.waveformVisualizer) {
                this.waveformVisualizer.stopAnimation();
            }
        } else {
            // Handle loop boundaries
            let startPosition = this.currentTime;
            if (this.isLooping && this.loopStart !== null) {
                if (startPosition < this.loopStart ||
                    (this.loopEnd !== null && startPosition > this.loopEnd)) {
                    startPosition = this.loopStart;
                }
            }

            // Start playback with current tempo setting
            this.grainPlayer.playbackRate = this.playbackRate;

            // Ensure Tone.js context is started
            if (Tone.context.state !== 'running') {
                await Tone.start();
            }
            
            // Start playback at the correct volume (already set in GrainPlayer constructor)
            this.grainPlayer.start(undefined, startPosition);

            this.startTime = Tone.now();
            this.startOffset = startPosition;
            this.isPlaying = true;

            // Start time updates
            this.setupTimeUpdate();

            // Start timer if sync is enabled
            this.syncTimerStart();

            // Start waveform animation
            if (this.waveformVisualizer) {
                this.waveformVisualizer.startAnimation();
            }
        }

        this.updatePlayPauseButton();
    }

    syncTimerStart() {
        try {
            console.log('Audio player: Attempting to sync timer start...');

            // Check if sync is enabled by reading the checkbox directly
            const syncCheckbox = document.getElementById('syncMetronome');
            console.log('Sync checkbox found:', !!syncCheckbox, 'Checked:', syncCheckbox?.checked);

            if (!syncCheckbox || !syncCheckbox.checked) {
                console.log('Timer sync is disabled - checkbox not checked');
                return;
            }

            // Try multiple ways to find the timer
            let timer = null;

            // First, try to find the UnifiedPracticeMinimal instance
            if (window.unifiedPracticeMinimal?.timer) {
                timer = window.unifiedPracticeMinimal.timer;
                console.log('Found timer via window.unifiedPracticeMinimal');
            } else if (window.currentTimer) {
                timer = window.currentTimer;
                console.log('Found timer via window.currentTimer');
            } else if (window.app?.currentPage?.timer) {
                timer = window.app.currentPage.timer;
                console.log('Found timer via window.app.currentPage.timer');
            } else if (window.app?.currentPage?.components?.timer) {
                timer = window.app.currentPage.components.timer;
                console.log('Found timer via window.app.currentPage.components.timer');
            } else if (window.app?.currentPage?.sharedTimer) {
                timer = window.app.currentPage.sharedTimer;
                console.log('Found timer via window.app.currentPage.sharedTimer');
            }

            console.log('Timer search result:', !!timer);
            console.log('Available window properties:', {
                'window.unifiedPracticeMinimal': !!window.unifiedPracticeMinimal,
                'window.currentTimer': !!window.currentTimer,
                'window.app': !!window.app
            });

            if (timer) {
                console.log('Timer found, sync enabled, Timer running:', timer.isRunning);

                if (!timer.isRunning) {
                    console.log('Starting timer due to audio sync');
                    // For YouTube, we want to continue from where we left off
                    if (this.isYouTubeMode && timer.elapsedTime > 0) {
                        console.log('Resuming timer from elapsed time:', timer.elapsedTime);
                    }
                    timer.start();
                } else {
                    console.log('Timer already running, no action needed');
                }
            } else {
                console.warn('Timer component not found for sync');
                // Try to directly click the play button as a fallback
                const playBtn = document.getElementById('playPauseBtn');
                if (playBtn && !playBtn.classList.contains('playing')) {
                    console.log('Attempting to click timer play button directly');
                    playBtn.click();
                }
            }
        } catch (error) {
            console.warn('Timer sync failed, continuing with audio playback:', error);
        }
    }

    syncTimerStop() {
        try {
            console.log('Audio player: Attempting to sync timer stop...');

            // Check if sync is enabled by reading the checkbox directly
            const syncCheckbox = document.getElementById('syncMetronome');
            if (!syncCheckbox || !syncCheckbox.checked) {
                console.log('Timer sync is disabled - checkbox not checked');
                return;
            }

            // Try multiple ways to find the timer
            let timer = null;

            // First check the global reference
            if (window.currentTimer) {
                timer = window.currentTimer;
                console.log('Found timer via window.currentTimer');
            } else if (window.app?.currentPage?.timer) {
                timer = window.app.currentPage.timer;
            } else if (window.app?.currentPage?.components?.timer) {
                timer = window.app.currentPage.components.timer;
            } else if (window.app?.currentPage?.sharedTimer) {
                timer = window.app.currentPage.sharedTimer;
            }

            if (timer) {
                console.log('Timer found for stop, sync enabled, Timer running:', timer.isRunning);

                if (timer.isRunning) {
                    console.log('Pausing timer due to audio sync');
                    timer.pause();
                } else {
                    console.log('Timer already stopped');
                }
            } else {
                console.warn('Timer component not found for sync stop');
            }
        } catch (error) {
            console.warn('Timer sync stop failed, continuing:', error);
        }
    }

    stop() {
        console.log('Stop button clicked');

        if (this.isYouTubeMode && this.youtubePlayer) {
            this.youtubePlayer.stopVideo();
            this.stopYouTubeTimeUpdates();
            // For YouTube, explicitly seek to start
            this.youtubePlayer.seekTo(0);
        } else if (this.grainPlayer) {
            this.grainPlayer.stop();
        }

        this.isPlaying = false;

        // Always reset to 0 for stop (different from pause)
        this.currentTime = 0;
        this.startOffset = 0;

        const currentTimeEl = document.getElementById('currentTime');
        if (currentTimeEl) {
            currentTimeEl.textContent = this.formatTime(this.currentTime);
        }

        // Update waveform progress to show reset position
        if (this.waveformVisualizer) {
            this.waveformVisualizer.updateProgress(this.currentTime);
        }

        // Update play/pause button state
        this.updatePlayPauseButton();

        // Reset YouTube progress display
        if (this.isYouTubeMode) {
            const progressFill = document.getElementById('youtubeProgressFill');
            const positionIndicator = document.getElementById('youtubePositionIndicator');
            const youtubeCurrentTimeEl = document.getElementById('youtubeCurrentTime');

            if (progressFill) {
                progressFill.style.width = '0%';
            }
            if (positionIndicator) {
                positionIndicator.style.left = '0%';
            }
            if (youtubeCurrentTimeEl) {
                youtubeCurrentTimeEl.textContent = this.formatTime(0);
            }
        }

        this.updatePlayPauseButton();

        // Stop timer if sync is enabled
        this.syncTimerStop();

        // Stop waveform animation
        if (this.waveformVisualizer) {
            this.waveformVisualizer.stopAnimation();
            // Update waveform progress to reflect the reset position
            this.waveformVisualizer.updateProgress(this.currentTime);
        }

        // Reset loop and tempo progression
        this.loopCount = 0;
        this.tempoProgression.currentLoopCount = 0;
        this.updateProgressionStatus();
    }

    updatePlayPauseButton() {
        const btn = document.getElementById('audioPlayPauseBtn');
        if (btn) {
            // Clear button content
            while (btn.firstChild) {
                btn.removeChild(btn.firstChild);
            }
            
            // Create icon element
            const icon = document.createElement('i');
            icon.className = 'icon';
            icon.textContent = this.isPlaying ? '⏸️' : '▶️';
            
            // Create text node
            const text = document.createTextNode(this.isPlaying ? ' Pause' : ' Play');
            
            // Append elements
            btn.appendChild(icon);
            btn.appendChild(text);
        }
    }

    // Loop control methods
    setLoopStart() {
        let newStartTime;

        if (this.isYouTubeMode && this.youtubePlayer) {
            newStartTime = this.youtubePlayer.getCurrentTime();
        } else if (this.grainPlayer) {
            newStartTime = this.currentTime;
        } else {
            return;
        }

        // Check if new start point is after existing end point
        if (this.loopEnd !== null && newStartTime > this.loopEnd) {
            // Clear the loop and set this as new start point
            this.loopEnd = null;
            const loopEndEl = document.getElementById('loopEnd');
            if (loopEndEl) loopEndEl.textContent = '--:--';

            this.showNotification('Loop cleared - new start point set', 'info');
        }

        this.loopStart = newStartTime;

        const loopStartEl = document.getElementById('loopStart');
        if (loopStartEl) {
            loopStartEl.textContent = this.formatTime(this.loopStart);
        }

        // Update visual markers based on mode
        if (this.isYouTubeMode) {
            // For YouTube, use the custom progress bar markers
            this.updateYouTubeLoopMarkers();
        } else {
            // For audio files, update the loop region
            this.updateLoopRegion();

            // Update waveform visualizer markers
            if (this.waveformVisualizer && this.waveformVisualizer.updateLoopMarkers) {
                this.waveformVisualizer.updateLoopMarkers(this.loopStart, this.loopEnd);
            }
        }

        this.showNotification('Loop start set', 'success');
    }


    setLoopEnd() {
        let newEndTime;

        if (this.isYouTubeMode && this.youtubePlayer) {
            newEndTime = this.youtubePlayer.getCurrentTime();
        } else if (this.grainPlayer) {
            newEndTime = this.currentTime;
        } else {
            return;
        }

        // Check if new end point is before existing start point
        if (this.loopStart !== null && newEndTime < this.loopStart) {
            // Clear the loop and set this as new start point
            this.loopStart = newEndTime;
            this.loopEnd = null;

            const loopStartEl = document.getElementById('loopStart');
            const loopEndEl = document.getElementById('loopEnd');
            if (loopStartEl) loopStartEl.textContent = this.formatTime(this.loopStart);
            if (loopEndEl) loopEndEl.textContent = '--:--';

            this.showNotification('Loop cleared - point set as new start', 'info');
        } else {
            // Normal case - set as end point
            this.loopEnd = newEndTime;

            const loopEndEl = document.getElementById('loopEnd');
            if (loopEndEl) {
                loopEndEl.textContent = this.formatTime(this.loopEnd);
            }

            this.showNotification('Loop end set', 'success');
        }

        // Update visual markers based on mode
        if (this.isYouTubeMode) {
            // For YouTube, use the custom progress bar markers
            this.updateYouTubeLoopMarkers();
        } else {
            // For audio files, update the loop region
            this.updateLoopRegion();

            // Update waveform visualizer markers
            if (this.waveformVisualizer && this.waveformVisualizer.updateLoopMarkers) {
                this.waveformVisualizer.updateLoopMarkers(this.loopStart, this.loopEnd);
            }
        }
    }

    clearLoop() {
        this.loopStart = null;
        this.loopEnd = null;

        const loopStartEl = document.getElementById('loopStart');
        const loopEndEl = document.getElementById('loopEnd');
        const loopEnabledEl = document.getElementById('loopEnabled');

        if (loopStartEl) loopStartEl.textContent = '--:--';
        if (loopEndEl) loopEndEl.textContent = '--:--';
        if (loopEnabledEl) loopEnabledEl.checked = false;

        this.isLooping = false;

        // Clear visual markers based on mode
        if (this.isYouTubeMode) {
            this.updateYouTubeLoopMarkers();
        } else {
            // For audio files, clear main loop region
            this.updateLoopRegion();

            // Clear waveform visualizer markers
            if (this.waveformVisualizer && this.waveformVisualizer.updateLoopMarkers) {
                this.waveformVisualizer.updateLoopMarkers(null, null);
            }
        }

        // Reset tempo progression
        this.loopCount = 0;
        this.tempoProgression.currentLoopCount = 0;
        this.updateProgressionStatus();

        this.showNotification('Loop cleared', 'info');
    }

    updateLoopRegion() {
        const loopRegion = document.getElementById('loopRegion');
        if (!loopRegion) return;

        // For YouTube mode, we handle markers separately
        if (this.isYouTubeMode) {
            // Hide the standard loop region for YouTube
            loopRegion.style.display = 'none';
            return;
        }

        let duration = this.duration;
        if (!duration || duration === 0) {
            loopRegion.style.display = 'none';
            return;
        }

        if (this.loopStart !== null && this.loopEnd !== null) {
            const startPercent = (this.loopStart / duration) * 100;
            const endPercent = (this.loopEnd / duration) * 100;

            loopRegion.style.left = startPercent + '%';
            loopRegion.style.width = (endPercent - startPercent) + '%';
            loopRegion.style.display = 'block';
        } else {
            loopRegion.style.display = 'none';
        }
    }

    // Speed control methods - now with pitch preservation
    adjustSpeed(change) {
        const currentSpeed = this.playbackRate * 100;
        const newSpeed = Math.max(25, Math.min(300, currentSpeed + change));
        this.setSpeed(newSpeed);
        const speedSlider = document.getElementById('speedSlider');
        if (speedSlider) speedSlider.value = newSpeed;
    }

    setSpeed(speed) {
        this.playbackRate = speed / 100;
        const speedValueEl = document.getElementById('speedValue');
        if (speedValueEl) {
            speedValueEl.textContent = speed + '%';
        }

        if (this.isYouTubeMode && this.youtubePlayer) {
            this.youtubePlayer.setPlaybackRate(this.playbackRate);
        } else if (this.grainPlayer) {
            // Use fixed grain parameters for consistency
            // The key to good quality is NOT changing grain size with tempo
            this.grainPlayer.grainSize = 0.1;  // Keep constant
            this.grainPlayer.overlap = 0.2;    // Keep constant
            
            // Set playback rate directly - GrainPlayer handles this smoothly internally
            this.grainPlayer.playbackRate = this.playbackRate;

            // Handle pitch if needed
            if (this.pitchShiftAmount !== 0) {
                this.setPitch(this.pitchShiftAmount);
            }
        }
    }

    // Pitch control methods - independent of tempo
    adjustPitch(change) {
        const newPitch = Math.max(-12, Math.min(12, this.pitchShiftAmount + change));
        this.setPitch(newPitch);
        const pitchSlider = document.getElementById('pitchSlider');
        if (pitchSlider) pitchSlider.value = newPitch;
    }

    setPitch(pitch) {
        this.pitchShiftAmount = pitch;
        const pitchValueEl = document.getElementById('pitchValue');
        if (pitchValueEl) {
            if (pitch === 0) {
                pitchValueEl.textContent = '0';
            } else if (pitch > 0) {
                pitchValueEl.textContent = `+${pitch}`;
            } else {
                pitchValueEl.textContent = `${pitch}`;
            }
        }

        // Apply pitch shift based on mode
        if (this.isYouTubeMode) {
            // For YouTube, only update if audio processor is active
            if (window.youtubeAudioProcessor && window.youtubeAudioProcessor.isCurrentlyProcessing()) {
                window.youtubeAudioProcessor.setPitch(pitch);
            }
            // Don't show notification every time - buttons are already visually disabled
        } else if (this.grainPlayer && this.audioLoaded) {
            // For regular audio files, use detune for pitch shifting
            // GrainPlayer preserves pitch during tempo changes, so no compensation needed
            this.grainPlayer.detune = pitch * 100; // Convert semitones to cents
        }
    }

    applyHighQualityPitchShift(semitones) {
        // Disconnect current connections
        try {
            this.grainPlayer.disconnect();
            if (this.pitchShift) {
                this.pitchShift.disconnect();
                this.pitchShift.dispose();
                this.pitchShift = null;
            }
        } catch (e) {
            // Ignore disconnection errors
        }

        // Round to avoid floating point precision issues
        const roundedSemitones = Math.round(semitones * 100) / 100;

        if (Math.abs(roundedSemitones) < 0.01) {
            // No pitch shift - connect directly
            this.grainPlayer.connect(this.masterGain);
        } else {
            // Create high-quality pitch shifter with proper settings
            this.pitchShift = new Tone.PitchShift({
                pitch: roundedSemitones,
                windowSize: 0.1,     // Balanced window for quality vs latency
                delayTime: 0.05,     // Reduced delay for less artifacts
                feedback: 0.0,       // No feedback to avoid artifacts
                wet: 1.0            // 100% processed signal
            });

            // Connect the chain
            this.grainPlayer.connect(this.pitchShift);
            this.pitchShift.connect(this.masterGain);
        }
    }

    // Set audio quality mode for adaptive performance
    setQualityMode(mode = 'high') {
        const qualitySettings = {
            low: {
                grainSize: 0.25,     // Larger grains for lower CPU
                overlap: 0.25        // Less overlap
            },
            medium: {
                grainSize: 0.15,     // Medium grain size for balanced quality
                overlap: 0.4         // Moderate overlap
            },
            high: {
                grainSize: 0.1,      // Smaller grains for better quality
                overlap: 0.5         // Good overlap for smooth sound
            }
        };

        const settings = qualitySettings[mode] || qualitySettings.high;
        this.qualityMode = mode;

        // Update GrainPlayer settings for optimal pitch shifting
        if (this.grainPlayer) {
            this.grainPlayer.grainSize = settings.grainSize;
            this.grainPlayer.overlap = settings.overlap;
        }

        console.log(`Audio quality mode set to: ${mode}`);
    }

    updatePitchButtonStates() {
        const buttons = document.querySelectorAll('.pitch-btn');
        const isActive = this.isYouTubeMode ?
            (window.youtubeAudioProcessor && window.youtubeAudioProcessor.isCurrentlyProcessing()) :
            true;

        buttons.forEach(btn => {
            if (this.isYouTubeMode && !isActive) {
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
                btn.title = 'Enable pitch shifting first';
            } else {
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
                btn.title = '';
            }
        });
    }

    handleLoopComplete() {
        this.loopCount++;

        if (!this.tempoProgression.enabled) return;

        this.tempoProgression.currentLoopCount++;

        if (this.tempoProgression.currentLoopCount % this.tempoProgression.loopInterval === 0) {
            let newSpeed = this.playbackRate * 100; // Convert to percentage

            if (this.tempoProgression.incrementType === 'percentage') {
                newSpeed = newSpeed * (1 + this.tempoProgression.incrementValue / 100);
            } else {
                // For BPM mode, we need to calculate relative change
                // Assuming 100% = original BPM
                newSpeed = newSpeed + this.tempoProgression.incrementValue;
            }

            // Limit to max tempo
            newSpeed = Math.min(newSpeed, this.tempoProgression.maxTempo);

            if (newSpeed !== this.playbackRate * 100) {
                this.setSpeed(Math.round(newSpeed));
                const speedSlider = document.getElementById('speedSlider');
                if (speedSlider) speedSlider.value = newSpeed;
                this.showNotification(`Tempo increased to ${Math.round(newSpeed)}%`, 'info');
            }
        }

        this.updateProgressionStatus();
    }

    updateProgressionStatus() {
        const status = document.getElementById('progressionStatus');
        if (!status) return;

        if (this.tempoProgression.enabled) {
            const currentSpeed = Math.round(this.playbackRate * 100);
            const increment = this.tempoProgression.incrementType === 'percentage'
                ? `${this.tempoProgression.incrementValue}%`
                : `${this.tempoProgression.incrementValue} BPM`;

            const loopsUntilNext = this.tempoProgression.loopInterval -
                (this.tempoProgression.currentLoopCount % this.tempoProgression.loopInterval);

            status.textContent = `Current: ${currentSpeed}% | Loops: ${this.tempoProgression.currentLoopCount} | Next increase: +${increment} after ${loopsUntilNext} loop(s)`;
        } else {
            status.textContent = '';
        }
    }

    getDuration() {
        return this.grainPlayer ? this.grainPlayer.buffer.duration : 0;
    }

    getCurrentTime() {
        return this.currentTime;
    }

    formatTime(seconds) {
        if (isNaN(seconds) || seconds === null) return '--:--';
        return TimeUtils.formatTime(seconds);
    }

    showNotification(message, type = 'info') {
        if (window.app?.currentPage?.showNotification) {
            window.app.currentPage.showNotification(message, type);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }


    destroy() {
        console.log('=== DESTROYING AUDIO PLAYER ===');

        // Stop any playback first
        this.stop();

        // Clear any intervals
        if (this.youtubeUpdateInterval) {
            clearInterval(this.youtubeUpdateInterval);
            this.youtubeUpdateInterval = null;
        }

        // Dispose all Tone.js components
        if (this.grainPlayer) {
            try {
                this.grainPlayer.stop();
                this.grainPlayer.dispose();
            } catch (e) {
                console.error('Error disposing grainPlayer:', e);
            }
            this.grainPlayer = null;
        }


        // Removed compressor and reverb disposal - no longer used

        if (this.pitchShift) {
            try {
                this.pitchShift.disconnect();
                this.pitchShift.dispose();
            } catch (e) {
                console.error('Error disposing pitch shift:', e);
            }
            this.pitchShift = null;
        }

        // Destroy waveform visualizer
        if (this.waveformVisualizer) {
            this.waveformVisualizer.destroy?.();
            this.waveformVisualizer = null;
        }

        // Destroy session manager
        if (this.sessionManager) {
            this.sessionManager.destroy();
            this.sessionManager = null;
        }

        // Clear audio service buffer
        if (this.audioService) {
            this.audioService.audioBuffer = null;
        }

        // Reset all state
        this.currentFileName = null;
        this.audioLoaded = false;
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        this.isInitialized = false;

        console.log('Audio player destroyed');
    }
}
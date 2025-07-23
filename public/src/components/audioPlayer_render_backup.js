// Backup of the original render method with innerHTML
// This file contains the original HTML template that needs to be converted to DOM manipulation

render() {
    if (!this.container) {
        console.error('No container for audio player');
        return;
    }

    console.log('Rendering audio player UI...');

    this.container.innerHTML = `
        <div class="audio-player" style="
            background-image: url('data:image/jpeg;base64,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');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            position: relative;
        ">
            <!-- Background overlay for readability -->
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(26, 26, 46, 0.85);
                border-radius: 12px;
            "></div>
            
            <!-- Content wrapper -->
            <div style="position: relative; z-index: 1;">
<!-- Audio Source Selection -->
<div class="audio-source-section">
    <h3>Audio Source</h3>
    
    <!-- Source Type Tabs -->
    <div class="source-tabs" style="display: flex; gap: 8px; margin-bottom: 16px;">
        <button class="source-tab active" data-source="file" 
                style="flex: 1; padding: 10px; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
            📁 Local File
        </button>
        <button class="source-tab" data-source="youtube" 
                style="flex: 1; padding: 10px; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border); border-radius: 8px; cursor: pointer; transition: all 0.2s;">
            🎬 YouTube
        </button>
    </div>
    
    <!-- File Input Section -->
    <div id="fileInputSection" class="source-section">
        <input type="file" id="audioFileInput" accept="audio/*" class="file-input" 
               style="padding: 12px; background: var(--bg-input); border: 1px solid var(--border); 
                      border-radius: 8px; color: var(--text-primary); width: 100%; margin-bottom: 16px;">
    </div>
    
    <!-- YouTube Input Section -->
    <div id="youtubeInputSection" class="source-section" style="display: none;">
        <div style="display: flex; gap: 8px; margin-bottom: 16px;">
            <input type="text" id="youtubeUrlInput" placeholder="Enter YouTube URL" 
                   style="flex: 1; padding: 12px; background: var(--bg-input); border: 1px solid var(--border); 
                          border-radius: 8px; color: var(--text-primary);">
            <button id="loadYoutubeBtn" class="btn btn-primary" style="padding: 12px 20px;">
                Load Video
            </button>
        </div>
        <div id="youtubePlayerContainer" style="display: none; margin-bottom: 16px;">
            <div id="youtubePlayer" style="width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 8px;"></div>
        </div>
        <!-- Pitch Control for YouTube -->
        <div id="youtubePitchControl" style="display: none; margin-top: 16px; padding: 16px; background: var(--bg-input); border-radius: 8px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <h4 style="margin: 0; color: var(--text-primary);">🎵 True Pitch Control</h4>
                <button id="enablePitchBtn" class="btn btn-secondary" style="padding: 8px 16px; font-size: 14px;">
                    Enable Pitch Shifting
                </button>
            </div>
            <p style="margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.4;">
                Allows independent pitch control without affecting playback speed. 
                <span style="color: var(--warning);">Note: This will open a tab audio capture dialog.</span>
            </p>
            <div id="pitchActiveIndicator" style="display: none; margin-top: 12px; padding: 8px; background: var(--success-bg); 
                border-radius: 6px; color: var(--success); font-size: 13px; text-align: center;">
                ✓ Pitch shifting active - Use the pitch controls above
            </div>
        </div>
    </div>
    
    <!-- Moved to parent component to avoid duplicate element IDs -->
    <!-- <div id="currentFileName" class="current-file-name" 
         style="color: var(--text-secondary); font-size: 14px; margin-top: 8px;"></div> -->
</div>

                    <!-- Audio Controls -->
                    <div id="audioControlsSection" class="audio-controls-section" style="display: none; width: 100%; margin-top: 20px;">
                        <!-- Waveform -->
                        <div class="waveform-container" style="position: relative; width: 100%; height: 150px; background: var(--bg-input); border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
                            <div id="waveformLoadingState" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: var(--bg-input); z-index: 10;">
                                <div style="text-align: center;">
                                    <div style="width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
                                    <div style="color: var(--text-secondary); font-size: 14px;">Loading waveform...</div>
                                </div>
                            </div>
                            <canvas id="waveformCanvas" style="width: 100%; height: 100%; display: block; opacity: 0; transition: opacity 0.3s ease;"></canvas>
                            <div class="loop-region" id="loopRegion" style="position: absolute; top: 0; height: 100%; background: rgba(99, 102, 241, 0.2); pointer-events: none; display: none;"></div>
                        </div>

                        <!-- Playback Controls -->
                        <div class="playback-controls" style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px; justify-content: center;">
                            <button id="audioPlayPauseBtn" class="btn btn-primary" style="padding: 12px 24px;">
                                <i class="icon">▶️</i> Play
                            </button>
                            <button id="audioStopBtn" class="btn btn-secondary" style="padding: 12px 24px;">
                                <i class="icon">⏹️</i> Stop
                            </button>
                            <div class="time-display" style="font-family: monospace; font-size: 18px; margin-left: 16px;">
                                <span id="currentTime">0:00</span> / <span id="duration">0:00</span>
                            </div>
                        </div>

                        <!-- Loop Controls Section -->
<div class="loop-controls-section" style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); padding: 16px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.1); width: 100%; box-sizing: border-box; position: relative; z-index: 10000 !important;">
    <h4 style="margin-bottom: 12px;">Loop Controls</h4>
    
    <!-- Main Controls Row -->
    <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 12px; flex-wrap: wrap;">
        <button type="button" id="setLoopStartBtn" class="btn btn-sm btn-secondary" style="padding: 6px 12px; font-size: 12px;">Start</button>
        <button type="button" id="setLoopEndBtn" class="btn btn-sm btn-secondary" style="padding: 6px 12px; font-size: 12px;">End</button>
        <button type="button" id="clearLoopBtn" class="btn btn-sm btn-secondary" style="padding: 6px 12px; font-size: 12px;">Clear</button>
        <div class="loop-info" style="font-family: monospace; font-size: 13px; text-align: center;">
            <span id="loopStart">--:--</span> - <span id="loopEnd">--:--</span>
        </div>
        <button type="button" id="saveSessionBtn" class="btn btn-sm btn-primary" style="padding: 6px 16px; font-size: 12px;">💾 Save Loop</button>
    </div>
    
    <!-- Toggle Controls Row -->
    <div style="display: flex; align-items: center; gap: 16px;">
        <label class="loop-toggle" style="display: inline-flex; align-items: center; white-space: nowrap;">
            <input type="checkbox" id="loopEnabled">
            <span class="toggle-switch"></span>
            <span>Loop?</span>
        </label>
        
        <label class="loop-toggle" style="display: inline-flex; align-items: center; white-space: nowrap;">
            <input type="checkbox" id="progressionEnabled">
            <span class="toggle-switch"></span>
            <span>Auto?</span>
        </label>
        
        <div style="flex: 1;"></div>
        
        <span style="color: var(--text-secondary); font-size: 13px;">Saved Loops:</span>
    </div>
    
    <!-- Tempo Progression Controls (shows when Auto is enabled) -->
    <div class="progression-controls-inline" id="progressionControls" style="display: none; align-items: center; gap: 6px; font-size: 12px; margin-top: 12px;">
        <input type="number" id="incrementValue" value="1" min="0.1" max="10" step="0.1" 
               style="width: 45px; padding: 3px 6px; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 4px; font-size: 12px;">
        <select id="incrementType" style="padding: 3px 6px; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 4px; font-size: 12px;">
            <option value="percentage">%</option>
            <option value="bpm">BPM</option>
        </select>
        <span>every</span>
        <input type="number" id="loopInterval" value="1" min="1" max="10" 
               style="width: 35px; padding: 3px 6px; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 4px; font-size: 12px;">
        <span>loops</span>
    </div>
</div>

<!-- Saved Loops Section (Separate) -->
<div class="saved-loops-section" style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); padding: 16px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.1);">
    <h4 style="margin-bottom: 12px; font-size: 14px; color: var(--text-secondary);">Saved Loops</h4>
    <div id="savedSessionsList" class="saved-sessions-list" style="max-height: 150px; overflow-y: auto;">
        <p class="empty-state" style="color: var(--text-secondary); text-align: center; font-size: 12px; margin: 0; padding: 16px;">No saved loops for this file</p>
    </div>
</div>

                        <!-- Compact Audio Controls -->
                        <div class="audio-controls-compact" style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.1);">
                            <h4 style="margin-bottom: 16px; text-align: center;">Audio Controls</h4>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 16px;">
                                <!-- Speed Control (Left) -->
                                <div class="speed-control-compact">
                                    <label style="display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-secondary);">
                                        Speed: <span id="speedValue" style="color: var(--primary); font-weight: 600;">100%</span>
                                    </label>
                                    <input type="range" id="speedSlider" min="50" max="150" value="100" step="1" class="slider" 
                                           style="width: 100%; height: 8px; background: linear-gradient(to right, #374151 0%, #6366f1 50%, #374151 100%); border-radius: 4px; outline: none; -webkit-appearance: none; -moz-appearance: none; appearance: none;">
                                    <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 11px; color: var(--text-muted);">
                                        <span>50%</span>
                                        <span style="color: var(--text-secondary);">100%</span>
                                        <span>150%</span>
                                    </div>
                                </div>
                                
                                <!-- Pitch Control (Right) -->
                                <div class="pitch-control-compact">
                                    <label style="display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-secondary);">
                                        Pitch: <span id="pitchValue" style="color: var(--primary); font-weight: 600;">0</span>
                                    </label>
                                    <div class="pitch-buttons" style="display: flex; gap: 6px; justify-content: center;">
                                        <button class="pitch-btn" data-pitch="-1" style="flex: 1; padding: 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 14px;">-1</button>
                                        <button class="pitch-btn" data-pitch="-0.5" style="flex: 1; padding: 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 14px;">-½</button>
                                        <button class="pitch-btn" data-pitch="+0.5" style="flex: 1; padding: 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 14px;">+½</button>
                                        <button class="pitch-btn" data-pitch="+1" style="flex: 1; padding: 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 14px;">+1</button>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Volume Control (Bottom) -->
                            <div class="volume-control-compact">
                                <label style="display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-secondary);">
                                    Volume: <span id="volumeValue" style="color: var(--primary); font-weight: 600;">100%</span>
                                </label>
                                <div class="volume-slider-container" style="display: flex; align-items: center; gap: 12px;">
                                    <i class="icon" style="font-size: 18px;">🔊</i>
                                    <input type="range" id="volumeSlider" min="0" max="100" value="100" class="slider" 
                                           style="flex: 1; height: 8px; background: linear-gradient(to right, #374151 0%, #6366f1 100%); border-radius: 4px; outline: none; -webkit-appearance: none; -moz-appearance: none; appearance: none;">
                                </div>
                            </div>
                            
                            <!-- Reset buttons -->
                            <div style="display: flex; gap: 10px; margin-top: 16px;">
                                <button id="resetSpeedBtn" class="btn btn-sm btn-secondary" style="flex: 1; padding: 8px; font-size: 13px;">
                                    <i class="icon">↻</i> Reset Speed
                                </button>
                                <button id="resetPitchBtn" class="btn btn-sm btn-secondary" style="flex: 1; padding: 8px; font-size: 13px;">
                                    <i class="icon">↻</i> Reset Pitch
                                </button>
                            </div>
                        </div>
               

                        <!-- Info Text -->
                        <div class="save-info" style="background: rgba(99, 102, 241, 0.1); padding: 16px; border-radius: 8px; border-left: 4px solid var(--primary);">
                            <p style="margin: 0; color: var(--text-secondary);">💡 Tip: Use the "Save Current Session" button to save your loop points and settings</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
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
            </style>
        `;

    console.log('Audio player UI rendered successfully');
    this.attachEventListeners();
}
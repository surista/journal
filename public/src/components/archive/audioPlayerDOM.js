// DOM-based render method for AudioPlayer
export function renderAudioPlayerDOM(container) {
    // Clear container
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    // Create main audio player div
    const audioPlayer = document.createElement('div');
    audioPlayer.className = 'audio-player';
    audioPlayer.style.cssText = `
        background-image: url('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAEsASwDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgEYBAQDBAcFBAQAAQJ3AAECAxEEBSExBhNBUQdhcRMiMoEIFUKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAP==');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        position: relative;
    `;

    // Create background overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(26, 26, 46, 0.85);
        border-radius: 12px;
    `;
    audioPlayer.appendChild(overlay);

    // Create content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.style.cssText = 'position: relative; z-index: 1;';
    audioPlayer.appendChild(contentWrapper);

    // Create audio source section
    const audioSourceSection = createAudioSourceSection();
    contentWrapper.appendChild(audioSourceSection);

    // Create audio controls section
    const audioControlsSection = createAudioControlsSection();
    contentWrapper.appendChild(audioControlsSection);

    // Append to container
    container.appendChild(audioPlayer);

    return {
        audioSourceSection,
        audioControlsSection
    };
}

function createAudioSourceSection() {
    const section = document.createElement('div');
    section.className = 'audio-source-section';

    const title = document.createElement('h3');
    title.textContent = 'Audio Source';
    section.appendChild(title);

    // Source Type Tabs
    const sourceTabs = document.createElement('div');
    sourceTabs.className = 'source-tabs';
    sourceTabs.style.cssText = 'display: flex; gap: 8px; margin-bottom: 16px;';

    // File tab
    const fileTab = document.createElement('button');
    fileTab.className = 'source-tab active';
    fileTab.setAttribute('data-source', 'file');
    fileTab.style.cssText =
        'flex: 1; padding: 10px; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s;';
    fileTab.textContent = '📁 Local File';
    sourceTabs.appendChild(fileTab);

    // YouTube tab
    const youtubeTab = document.createElement('button');
    youtubeTab.className = 'source-tab';
    youtubeTab.setAttribute('data-source', 'youtube');
    youtubeTab.style.cssText =
        'flex: 1; padding: 10px; background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border); border-radius: 8px; cursor: pointer; transition: all 0.2s;';
    youtubeTab.textContent = '🎬 YouTube';
    sourceTabs.appendChild(youtubeTab);

    section.appendChild(sourceTabs);

    // File Input Section
    const fileInputSection = document.createElement('div');
    fileInputSection.id = 'fileInputSection';
    fileInputSection.className = 'source-section';

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'audioFileInput';
    fileInput.accept = 'audio/*';
    fileInput.className = 'file-input';
    fileInput.style.cssText =
        'padding: 12px; background: var(--bg-input); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); width: 100%; margin-bottom: 16px;';
    fileInputSection.appendChild(fileInput);

    section.appendChild(fileInputSection);

    // YouTube Input Section
    const youtubeInputSection = createYouTubeInputSection();
    section.appendChild(youtubeInputSection);

    return section;
}

function createYouTubeInputSection() {
    const section = document.createElement('div');
    section.id = 'youtubeInputSection';
    section.className = 'source-section';
    section.style.display = 'none';

    // Input container
    const inputContainer = document.createElement('div');
    inputContainer.style.cssText = 'display: flex; gap: 8px; margin-bottom: 16px;';

    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.id = 'youtubeUrlInput';
    urlInput.placeholder = 'Enter YouTube URL';
    urlInput.style.cssText =
        'flex: 1; padding: 12px; background: var(--bg-input); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary);';
    inputContainer.appendChild(urlInput);

    const loadBtn = document.createElement('button');
    loadBtn.id = 'loadYoutubeBtn';
    loadBtn.className = 'btn btn-primary';
    loadBtn.style.cssText = 'padding: 12px 20px;';
    loadBtn.textContent = 'Load Video';
    inputContainer.appendChild(loadBtn);

    section.appendChild(inputContainer);

    // YouTube player container
    const playerContainer = document.createElement('div');
    playerContainer.id = 'youtubePlayerContainer';
    playerContainer.style.cssText = 'display: none; margin-bottom: 16px;';

    const player = document.createElement('div');
    player.id = 'youtubePlayer';
    player.style.cssText = 'width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 8px;';
    playerContainer.appendChild(player);

    section.appendChild(playerContainer);

    // Pitch control for YouTube
    const pitchControl = createYouTubePitchControl();
    section.appendChild(pitchControl);

    return section;
}

function createYouTubePitchControl() {
    const control = document.createElement('div');
    control.id = 'youtubePitchControl';
    control.style.cssText =
        'display: none; margin-top: 16px; padding: 16px; background: var(--bg-input); border-radius: 8px;';

    const header = document.createElement('div');
    header.style.cssText =
        'display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;';

    const title = document.createElement('h4');
    title.style.cssText = 'margin: 0; color: var(--text-primary);';
    title.textContent = '🎵 True Pitch Control';
    header.appendChild(title);

    const enableBtn = document.createElement('button');
    enableBtn.id = 'enablePitchBtn';
    enableBtn.className = 'btn btn-secondary';
    enableBtn.style.cssText = 'padding: 8px 16px; font-size: 14px;';
    enableBtn.textContent = 'Enable Pitch Shifting';
    header.appendChild(enableBtn);

    control.appendChild(header);

    const description = document.createElement('p');
    description.style.cssText =
        'margin: 0; font-size: 13px; color: var(--text-secondary); line-height: 1.4;';
    description.innerHTML =
        'Allows independent pitch control without affecting playback speed. <span style="color: var(--warning);">Note: This will open a tab audio capture dialog.</span>';
    control.appendChild(description);

    const indicator = document.createElement('div');
    indicator.id = 'pitchActiveIndicator';
    indicator.style.cssText =
        'display: none; margin-top: 12px; padding: 8px; background: var(--success-bg); border-radius: 6px; color: var(--success); font-size: 13px; text-align: center;';
    indicator.textContent = '✓ Pitch shifting active - Use the pitch controls above';
    control.appendChild(indicator);

    return control;
}

function createAudioControlsSection() {
    const section = document.createElement('div');
    section.id = 'audioControlsSection';
    section.className = 'audio-controls-section';
    section.style.cssText = 'display: none; width: 100%; margin-top: 20px;';

    // Waveform
    const waveformContainer = createWaveformContainer();
    section.appendChild(waveformContainer);

    // Playback controls
    const playbackControls = createPlaybackControls();
    section.appendChild(playbackControls);

    // Loop controls
    const loopControls = createLoopControls();
    section.appendChild(loopControls);

    // Saved loops
    const savedLoops = createSavedLoopsSection();
    section.appendChild(savedLoops);

    // Compact audio controls
    const compactControls = createCompactAudioControls();
    section.appendChild(compactControls);

    // Info text
    const infoText = document.createElement('div');
    infoText.className = 'save-info';
    infoText.style.cssText =
        'background: rgba(99, 102, 241, 0.1); padding: 16px; border-radius: 8px; border-left: 4px solid var(--primary);';
    const infoParagraph = document.createElement('p');
    infoParagraph.style.cssText = 'margin: 0; color: var(--text-secondary);';
    infoParagraph.textContent =
        '💡 Tip: Use the "Save Current Session" button to save your loop points and settings';
    infoText.appendChild(infoParagraph);
    section.appendChild(infoText);

    return section;
}

function createWaveformContainer() {
    const container = document.createElement('div');
    container.className = 'waveform-container';
    container.style.cssText =
        'position: relative; width: 100%; height: 150px; background: var(--bg-input); border-radius: 8px; overflow: hidden; margin-bottom: 20px;';

    // Loading state
    const loadingState = document.createElement('div');
    loadingState.id = 'waveformLoadingState';
    loadingState.style.cssText =
        'position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: var(--bg-input); z-index: 10;';

    const loadingContent = document.createElement('div');
    loadingContent.style.textAlign = 'center';

    const spinner = document.createElement('div');
    spinner.style.cssText =
        'width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px;';
    loadingContent.appendChild(spinner);

    const loadingText = document.createElement('div');
    loadingText.style.cssText = 'color: var(--text-secondary); font-size: 14px;';
    loadingText.textContent = 'Loading waveform...';
    loadingContent.appendChild(loadingText);

    loadingState.appendChild(loadingContent);
    container.appendChild(loadingState);

    // Canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'waveformCanvas';
    canvas.style.cssText =
        'width: 100%; height: 100%; display: block; opacity: 0; transition: opacity 0.3s ease;';
    container.appendChild(canvas);

    // Loop region
    const loopRegion = document.createElement('div');
    loopRegion.className = 'loop-region';
    loopRegion.id = 'loopRegion';
    loopRegion.style.cssText =
        'position: absolute; top: 0; height: 100%; background: rgba(99, 102, 241, 0.2); pointer-events: none; display: none;';
    container.appendChild(loopRegion);

    return container;
}

function createPlaybackControls() {
    const controls = document.createElement('div');
    controls.className = 'playback-controls';
    controls.style.cssText =
        'display: flex; align-items: center; gap: 16px; margin-bottom: 24px; justify-content: center;';

    const playPauseBtn = document.createElement('button');
    playPauseBtn.id = 'audioPlayPauseBtn';
    playPauseBtn.className = 'btn btn-primary';
    playPauseBtn.style.cssText = 'padding: 12px 24px;';
    playPauseBtn.innerHTML = '<i class="icon">▶️</i> Play';
    controls.appendChild(playPauseBtn);

    const stopBtn = document.createElement('button');
    stopBtn.id = 'audioStopBtn';
    stopBtn.className = 'btn btn-secondary';
    stopBtn.style.cssText = 'padding: 12px 24px;';
    stopBtn.innerHTML = '<i class="icon">⏹️</i> Stop';
    controls.appendChild(stopBtn);

    const timeDisplay = document.createElement('div');
    timeDisplay.className = 'time-display';
    timeDisplay.style.cssText = 'font-family: monospace; font-size: 18px; margin-left: 16px;';

    const currentTime = document.createElement('span');
    currentTime.id = 'currentTime';
    currentTime.textContent = '0:00';
    timeDisplay.appendChild(currentTime);

    timeDisplay.appendChild(document.createTextNode(' / '));

    const duration = document.createElement('span');
    duration.id = 'duration';
    duration.textContent = '0:00';
    timeDisplay.appendChild(duration);

    controls.appendChild(timeDisplay);

    return controls;
}

function createLoopControls() {
    const section = document.createElement('div');
    section.className = 'loop-controls-section';
    section.style.cssText =
        'background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); padding: 16px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.1); width: 100%; box-sizing: border-box; position: relative; z-index: 10000 !important;';

    const title = document.createElement('h4');
    title.style.cssText = 'margin-bottom: 12px;';
    title.textContent = 'Loop Controls';
    section.appendChild(title);

    // Main controls row
    const mainRow = document.createElement('div');
    mainRow.style.cssText =
        'display: flex; gap: 8px; align-items: center; margin-bottom: 12px; flex-wrap: wrap;';

    const buttons = [
        { id: 'setLoopStartBtn', text: 'Start' },
        { id: 'setLoopEndBtn', text: 'End' },
        { id: 'clearLoopBtn', text: 'Clear' }
    ];

    buttons.forEach((btn) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.id = btn.id;
        button.className = 'btn btn-sm btn-secondary';
        button.style.cssText = 'padding: 6px 12px; font-size: 12px;';
        button.textContent = btn.text;
        mainRow.appendChild(button);
    });

    const loopInfo = document.createElement('div');
    loopInfo.className = 'loop-info';
    loopInfo.style.cssText = 'font-family: monospace; font-size: 13px; text-align: center;';

    const loopStart = document.createElement('span');
    loopStart.id = 'loopStart';
    loopStart.textContent = '--:--';
    loopInfo.appendChild(loopStart);

    loopInfo.appendChild(document.createTextNode(' - '));

    const loopEnd = document.createElement('span');
    loopEnd.id = 'loopEnd';
    loopEnd.textContent = '--:--';
    loopInfo.appendChild(loopEnd);

    mainRow.appendChild(loopInfo);

    const saveLoopBtn = document.createElement('button');
    saveLoopBtn.type = 'button';
    saveLoopBtn.id = 'saveLoopBtn';
    saveLoopBtn.className = 'btn btn-sm btn-primary';
    saveLoopBtn.style.cssText = 'padding: 6px 16px; font-size: 12px;';
    saveLoopBtn.textContent = '💾 Save Loop';
    mainRow.appendChild(saveLoopBtn);

    section.appendChild(mainRow);

    // Toggle controls row
    const toggleRow = document.createElement('div');
    toggleRow.style.cssText = 'display: flex; align-items: center; gap: 16px;';

    // Loop toggle
    const loopToggle = createToggle('loopEnabled', 'Loop?');
    toggleRow.appendChild(loopToggle);

    // Auto toggle
    const autoToggle = createToggle('progressionEnabled', 'Auto?');
    toggleRow.appendChild(autoToggle);

    const spacer = document.createElement('div');
    spacer.style.flex = '1';
    toggleRow.appendChild(spacer);

    const savedLoopsLabel = document.createElement('span');
    savedLoopsLabel.style.cssText = 'color: var(--text-secondary); font-size: 13px;';
    savedLoopsLabel.textContent = 'Saved Loops:';
    toggleRow.appendChild(savedLoopsLabel);

    section.appendChild(toggleRow);

    // Progression controls
    const progressionControls = createProgressionControls();
    section.appendChild(progressionControls);

    return section;
}

function createToggle(id, labelText) {
    const label = document.createElement('label');
    label.className = 'loop-toggle';
    label.style.cssText = 'display: inline-flex; align-items: center; white-space: nowrap;';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = id;
    label.appendChild(input);

    const toggle = document.createElement('span');
    toggle.className = 'toggle-switch';
    label.appendChild(toggle);

    const text = document.createElement('span');
    text.textContent = labelText;
    label.appendChild(text);

    return label;
}

function createProgressionControls() {
    const controls = document.createElement('div');
    controls.className = 'progression-controls-inline';
    controls.id = 'progressionControls';
    controls.style.cssText =
        'display: none; align-items: center; gap: 6px; font-size: 12px; margin-top: 12px;';

    const incrementInput = document.createElement('input');
    incrementInput.type = 'number';
    incrementInput.id = 'incrementValue';
    incrementInput.value = '1';
    incrementInput.min = '0.1';
    incrementInput.max = '10';
    incrementInput.step = '0.1';
    incrementInput.style.cssText =
        'width: 45px; padding: 3px 6px; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 4px; font-size: 12px;';
    controls.appendChild(incrementInput);

    const incrementType = document.createElement('select');
    incrementType.id = 'incrementType';
    incrementType.style.cssText =
        'padding: 3px 6px; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 4px; font-size: 12px;';

    const percentOption = document.createElement('option');
    percentOption.value = 'percentage';
    percentOption.textContent = '%';
    incrementType.appendChild(percentOption);

    const bpmOption = document.createElement('option');
    bpmOption.value = 'bpm';
    bpmOption.textContent = 'BPM';
    incrementType.appendChild(bpmOption);

    controls.appendChild(incrementType);

    controls.appendChild(document.createTextNode(' every '));

    const intervalInput = document.createElement('input');
    intervalInput.type = 'number';
    intervalInput.id = 'loopInterval';
    intervalInput.value = '1';
    intervalInput.min = '1';
    intervalInput.max = '10';
    intervalInput.style.cssText =
        'width: 35px; padding: 3px 6px; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 4px; font-size: 12px;';
    controls.appendChild(intervalInput);

    controls.appendChild(document.createTextNode(' loops'));

    return controls;
}

function createSavedLoopsSection() {
    const section = document.createElement('div');
    section.className = 'saved-loops-section';
    section.style.cssText =
        'background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); padding: 16px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.1);';

    const title = document.createElement('h4');
    title.style.cssText = 'margin-bottom: 12px; font-size: 14px; color: var(--text-secondary);';
    title.textContent = 'Saved Loops';
    section.appendChild(title);

    const list = document.createElement('div');
    list.id = 'savedSessionsList';
    list.className = 'saved-sessions-list';
    list.style.cssText = 'max-height: 150px; overflow-y: auto;';

    const emptyState = document.createElement('p');
    emptyState.className = 'empty-state';
    emptyState.style.cssText =
        'color: var(--text-secondary); text-align: center; font-size: 12px; margin: 0; padding: 16px;';
    emptyState.textContent = 'No saved loops for this file';
    list.appendChild(emptyState);

    section.appendChild(list);

    return section;
}

function createCompactAudioControls() {
    const controls = document.createElement('div');
    controls.className = 'audio-controls-compact';
    controls.style.cssText =
        'background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(255, 255, 255, 0.1);';

    const title = document.createElement('h4');
    title.style.cssText = 'margin-bottom: 16px; text-align: center;';
    title.textContent = 'Audio Controls';
    controls.appendChild(title);

    const grid = document.createElement('div');
    grid.style.cssText =
        'display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 16px;';

    // Speed control
    const speedControl = createSpeedControl();
    grid.appendChild(speedControl);

    // Pitch control
    const pitchControl = createPitchControl();
    grid.appendChild(pitchControl);

    controls.appendChild(grid);

    // Volume control
    const volumeControl = createVolumeControl();
    controls.appendChild(volumeControl);

    // Reset buttons
    const resetButtons = document.createElement('div');
    resetButtons.style.cssText = 'display: flex; gap: 10px; margin-top: 16px;';

    const resetSpeedBtn = document.createElement('button');
    resetSpeedBtn.id = 'resetSpeedBtn';
    resetSpeedBtn.className = 'btn btn-sm btn-secondary';
    resetSpeedBtn.style.cssText = 'flex: 1; padding: 8px; font-size: 13px;';
    resetSpeedBtn.innerHTML = '<i class="icon">↻</i> Reset Speed';
    resetButtons.appendChild(resetSpeedBtn);

    const resetPitchBtn = document.createElement('button');
    resetPitchBtn.id = 'resetPitchBtn';
    resetPitchBtn.className = 'btn btn-sm btn-secondary';
    resetPitchBtn.style.cssText = 'flex: 1; padding: 8px; font-size: 13px;';
    resetPitchBtn.innerHTML = '<i class="icon">↻</i> Reset Pitch';
    resetButtons.appendChild(resetPitchBtn);

    controls.appendChild(resetButtons);

    return controls;
}

function createSpeedControl() {
    const control = document.createElement('div');
    control.className = 'speed-control-compact';

    const label = document.createElement('label');
    label.style.cssText =
        'display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-secondary);';
    label.innerHTML =
        'Speed: <span id="speedValue" style="color: var(--primary); font-weight: 600;">100%</span>';
    control.appendChild(label);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = 'speedSlider';
    slider.min = '50';
    slider.max = '150';
    slider.value = '100';
    slider.step = '1';
    slider.className = 'slider';
    slider.style.cssText =
        'width: 100%; height: 8px; background: linear-gradient(to right, #374151 0%, #6366f1 50%, #374151 100%); border-radius: 4px; outline: none; -webkit-appearance: none; -moz-appearance: none; appearance: none;';
    control.appendChild(slider);

    const markers = document.createElement('div');
    markers.style.cssText =
        'display: flex; justify-content: space-between; margin-top: 4px; font-size: 11px; color: var(--text-muted);';

    const min = document.createElement('span');
    min.textContent = '50%';
    markers.appendChild(min);

    const center = document.createElement('span');
    center.style.color = 'var(--text-secondary)';
    center.textContent = '100%';
    markers.appendChild(center);

    const max = document.createElement('span');
    max.textContent = '150%';
    markers.appendChild(max);

    control.appendChild(markers);

    return control;
}

function createPitchControl() {
    const control = document.createElement('div');
    control.className = 'pitch-control-compact';

    const label = document.createElement('label');
    label.style.cssText =
        'display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-secondary);';
    label.innerHTML =
        'Pitch: <span id="pitchValue" style="color: var(--primary); font-weight: 600;">0</span>';
    control.appendChild(label);

    const buttons = document.createElement('div');
    buttons.className = 'pitch-buttons';
    buttons.style.cssText = 'display: flex; gap: 6px; justify-content: center;';

    const pitchValues = ['-1', '-0.5', '+0.5', '+1'];
    const pitchLabels = ['-1', '-½', '+½', '+1'];

    pitchValues.forEach((value, index) => {
        const btn = document.createElement('button');
        btn.className = 'pitch-btn';
        btn.setAttribute('data-pitch', value);
        btn.style.cssText =
            'flex: 1; padding: 8px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 14px;';
        btn.textContent = pitchLabels[index];
        buttons.appendChild(btn);
    });

    control.appendChild(buttons);

    return control;
}

function createVolumeControl() {
    const control = document.createElement('div');
    control.className = 'volume-control-compact';

    const label = document.createElement('label');
    label.style.cssText =
        'display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-secondary);';
    label.innerHTML =
        'Volume: <span id="volumeValue" style="color: var(--primary); font-weight: 600;">100%</span>';
    control.appendChild(label);

    const container = document.createElement('div');
    container.className = 'volume-slider-container';
    container.style.cssText = 'display: flex; align-items: center; gap: 12px;';

    const icon = document.createElement('i');
    icon.className = 'icon';
    icon.style.fontSize = '18px';
    icon.textContent = '🔊';
    container.appendChild(icon);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = 'volumeSlider';
    slider.min = '0';
    slider.max = '100';
    slider.value = '100';
    slider.className = 'slider';
    slider.style.cssText =
        'flex: 1; height: 8px; background: linear-gradient(to right, #374151 0%, #6366f1 100%); border-radius: 4px; outline: none; -webkit-appearance: none; -moz-appearance: none; appearance: none;';
    container.appendChild(slider);

    control.appendChild(container);

    return control;
}

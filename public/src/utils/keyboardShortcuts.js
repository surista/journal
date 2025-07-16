// Keyboard Shortcuts Manager
export class KeyboardShortcutsManager {
    constructor() {
        this.shortcuts = new Map();
        this.enabled = true;
        this.activeModals = new Set();
        this.init();
    }

    init() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Register default shortcuts
        this.registerDefaults();
    }

    registerDefaults() {
        // Navigation shortcuts
        this.register('alt+1', () => this.switchTab('practice'), 'Switch to Practice tab');
        this.register('alt+2', () => this.switchTab('repertoire'), 'Switch to Repertoire tab');
        this.register('alt+3', () => this.switchTab('goals'), 'Switch to Goals tab');
        this.register('alt+4', () => this.switchTab('calendar'), 'Switch to Calendar tab');
        this.register('alt+5', () => this.switchTab('statistics'), 'Switch to Statistics tab');
        
        // Practice controls
        this.register('space', () => this.toggleTimer(), 'Start/Stop timer', { preventDefault: false });
        this.register('m', () => this.toggleMetronome(), 'Toggle metronome');
        this.register('r', () => this.resetTimer(), 'Reset timer');
        this.register('s', () => this.saveSession(), 'Save practice session');
        
        // Audio controls
        this.register('p', () => this.togglePlayPause(), 'Play/Pause audio');
        this.register('left', () => this.seekBackward(), 'Seek backward 5s');
        this.register('right', () => this.seekForward(), 'Seek forward 5s');
        this.register('shift+left', () => this.decreaseTempo(), 'Decrease tempo');
        this.register('shift+right', () => this.increaseTempo(), 'Increase tempo');
        this.register('shift+up', () => this.increasePitch(), 'Increase pitch');
        this.register('shift+down', () => this.decreasePitch(), 'Decrease pitch');
        this.register('l', () => this.toggleLoop(), 'Toggle loop');
        
        // Metronome controls
        this.register('[', () => this.decreaseBPM(), 'Decrease BPM');
        this.register(']', () => this.increaseBPM(), 'Increase BPM');
        this.register('shift+[', () => this.decreaseBPM(10), 'Decrease BPM by 10');
        this.register('shift+]', () => this.increaseBPM(10), 'Increase BPM by 10');
        this.register('shift+m', () => this.cycleMetronomeSound(), 'Cycle metronome sound');
        
        // UI controls
        this.register('/', () => this.focusSearch(), 'Focus search');
        this.register('n', () => this.createNew(), 'Create new (context-dependent)');
        this.register('?', () => this.showHelp(), 'Show keyboard shortcuts');
        this.register('escape', () => this.escape(), 'Close modal/cancel');
        
        // Theme
        this.register('ctrl+shift+d', () => this.toggleTheme(), 'Toggle dark mode');
    }

    register(keys, callback, description, options = {}) {
        const normalizedKeys = this.normalizeKeys(keys);
        this.shortcuts.set(normalizedKeys, {
            callback,
            description,
            keys: keys,
            preventDefault: options.preventDefault !== false
        });
    }

    normalizeKeys(keys) {
        return keys.toLowerCase()
            .replace(/\s+/g, '')
            .split('+')
            .sort()
            .join('+');
    }

    handleKeyDown(e) {
        if (!this.enabled) return;
        
        // Don't trigger shortcuts when typing in inputs (unless it's a global shortcut)
        const tagName = e.target.tagName.toLowerCase();
        const isInput = ['input', 'textarea', 'select'].includes(tagName) || 
                       e.target.contentEditable === 'true';
        
        // Build key combination
        const keys = [];
        if (e.ctrlKey) keys.push('ctrl');
        if (e.altKey) keys.push('alt');
        if (e.shiftKey) keys.push('shift');
        if (e.metaKey) keys.push('meta');
        
        const key = e.key.toLowerCase();
        if (!['control', 'alt', 'shift', 'meta'].includes(key)) {
            keys.push(key);
        }
        
        const keyCombo = keys.sort().join('+');
        const shortcut = this.shortcuts.get(keyCombo);
        
        if (shortcut) {
            // Allow some shortcuts in inputs (like Escape)
            const allowedInInputs = ['escape', 'ctrl+shift+d', '/'];
            if (isInput && !allowedInInputs.includes(shortcut.keys)) {
                return;
            }
            
            if (shortcut.preventDefault) {
                e.preventDefault();
            }
            
            shortcut.callback(e);
        }
    }

    // Navigation methods
    switchTab(tabName) {
        const dashboardPage = window.app?.currentPage;
        if (dashboardPage?.switchTab) {
            dashboardPage.switchTab(tabName);
        }
    }

    // Timer controls
    toggleTimer() {
        const timer = window.app?.currentPage?.components?.timer;
        if (timer) {
            if (timer.isRunning) {
                timer.pause();
            } else {
                timer.start();
            }
        }
    }

    resetTimer() {
        const timer = window.app?.currentPage?.components?.timer;
        if (timer) {
            timer.reset();
        }
    }

    saveSession() {
        const saveButton = document.querySelector('[onclick*="saveSession"]');
        if (saveButton) {
            saveButton.click();
        }
    }

    // Metronome controls
    toggleMetronome() {
        const metronome = window.app?.currentPage?.components?.metronome;
        if (metronome) {
            metronome.toggle();
        }
    }

    increaseBPM(amount = 1) {
        const metronome = window.app?.currentPage?.components?.metronome;
        if (metronome && metronome.bpm < 300) {
            metronome.setBPM(Math.min(metronome.bpm + amount, 300));
        }
    }

    decreaseBPM(amount = 1) {
        const metronome = window.app?.currentPage?.components?.metronome;
        if (metronome && metronome.bpm > 40) {
            metronome.setBPM(Math.max(metronome.bpm - amount, 40));
        }
    }

    cycleMetronomeSound() {
        // Try to find the unified practice component first
        const unifiedPractice = window.app?.currentPage?.tabs?.practice?.unifiedPractice;
        if (unifiedPractice && unifiedPractice.metronomeState) {
            const sounds = ['click', 'beep', 'tick', 'wood', 'cowbell', 'clave', 'rim', 'hihat', 'kick', 'snare', 'triangle', 'shaker'];
            const currentIndex = sounds.indexOf(unifiedPractice.metronomeState.sound);
            const nextIndex = (currentIndex + 1) % sounds.length;
            const nextSound = sounds[nextIndex];
            
            // Update the metronome state
            unifiedPractice.metronomeState.sound = nextSound;
            
            // Update the dropdown
            const soundSelect = document.getElementById('soundSelect');
            if (soundSelect) {
                soundSelect.value = nextSound;
            }
            
            // Save to localStorage
            localStorage.setItem('defaultMetronomeSound', nextSound);
            
            // Show notification
            this.showNotification(`Metronome sound: ${nextSound}`);
        }
    }
    
    showNotification(message) {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.className = 'keyboard-shortcut-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--primary);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    // Audio controls
    togglePlayPause() {
        const audioPlayer = window.app?.currentPage?.components?.audioPlayer;
        if (audioPlayer) {
            audioPlayer.togglePlayPause();
        }
    }

    seekForward() {
        const audioPlayer = window.app?.currentPage?.components?.audioPlayer;
        if (audioPlayer && audioPlayer.audioBuffer) {
            const currentTime = audioPlayer.currentTime || 0;
            audioPlayer.seek(Math.min(currentTime + 5, audioPlayer.duration));
        }
    }

    seekBackward() {
        const audioPlayer = window.app?.currentPage?.components?.audioPlayer;
        if (audioPlayer && audioPlayer.audioBuffer) {
            const currentTime = audioPlayer.currentTime || 0;
            audioPlayer.seek(Math.max(currentTime - 5, 0));
        }
    }

    increaseTempo() {
        const tempoSlider = document.getElementById('tempoSlider');
        if (tempoSlider) {
            const newValue = Math.min(parseFloat(tempoSlider.value) + 5, 150);
            tempoSlider.value = newValue;
            tempoSlider.dispatchEvent(new Event('input'));
        }
    }

    decreaseTempo() {
        const tempoSlider = document.getElementById('tempoSlider');
        if (tempoSlider) {
            const newValue = Math.max(parseFloat(tempoSlider.value) - 5, 50);
            tempoSlider.value = newValue;
            tempoSlider.dispatchEvent(new Event('input'));
        }
    }

    increasePitch() {
        const pitchSlider = document.getElementById('pitchSlider');
        if (pitchSlider) {
            const newValue = Math.min(parseFloat(pitchSlider.value) + 1, 12);
            pitchSlider.value = newValue;
            pitchSlider.dispatchEvent(new Event('input'));
        }
    }

    decreasePitch() {
        const pitchSlider = document.getElementById('pitchSlider');
        if (pitchSlider) {
            const newValue = Math.max(parseFloat(pitchSlider.value) - 1, -12);
            pitchSlider.value = newValue;
            pitchSlider.dispatchEvent(new Event('input'));
        }
    }

    toggleLoop() {
        const loopCheckbox = document.getElementById('loopCheckbox');
        if (loopCheckbox) {
            loopCheckbox.checked = !loopCheckbox.checked;
            loopCheckbox.dispatchEvent(new Event('change'));
        }
    }

    // UI controls
    focusSearch() {
        const searchInput = document.querySelector('#repertoireSearch, .search-bar input');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    createNew() {
        // Context-dependent creation
        const activeTab = document.querySelector('.tab-pane.active');
        if (activeTab) {
            if (activeTab.id === 'repertoire-tab') {
                document.getElementById('addSongBtn')?.click();
            } else if (activeTab.id === 'goals-tab') {
                document.getElementById('addGoalBtn')?.click();
            }
        }
    }

    escape() {
        // Close any open modals
        const openModals = document.querySelectorAll('.modal[style*="display: flex"], .modal.show');
        openModals.forEach(modal => {
            const closeBtn = modal.querySelector('.close-btn, [onclick*="hide"]');
            if (closeBtn) {
                closeBtn.click();
            }
        });
        
        // Clear any focused inputs
        if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur();
        }
    }

    toggleTheme() {
        const themeService = window.app?.themeService;
        if (themeService) {
            const themes = themeService.getThemes();
            const currentTheme = themeService.currentTheme;
            const currentIndex = themes.indexOf(currentTheme);
            const nextIndex = (currentIndex + 1) % themes.length;
            themeService.setTheme(themes[nextIndex]);
        }
    }

    showHelp() {
        this.createHelpModal();
    }

    createHelpModal() {
        // Remove existing modal if any
        const existing = document.getElementById('keyboardShortcutsModal');
        if (existing) {
            existing.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'keyboardShortcutsModal';
        modal.className = 'modal';
        modal.style.cssText = 'display: flex; z-index: 10000;';
        
        const shortcuts = Array.from(this.shortcuts.entries()).map(([key, info]) => ({
            keys: info.keys,
            description: info.description
        }));
        
        // Group shortcuts by category
        const categories = {
            'Navigation': shortcuts.filter(s => s.description.includes('Switch')),
            'Practice': shortcuts.filter(s => s.description.includes('timer') || s.description.includes('session')),
            'Audio': shortcuts.filter(s => s.description.includes('audio') || s.description.includes('tempo') || s.description.includes('pitch')),
            'Metronome': shortcuts.filter(s => s.description.includes('metronome') || s.description.includes('BPM')),
            'General': shortcuts.filter(s => !s.description.includes('Switch') && !s.description.includes('timer') && !s.description.includes('audio') && !s.description.includes('metronome') && !s.description.includes('BPM') && !s.description.includes('tempo') && !s.description.includes('pitch'))
        };
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>Keyboard Shortcuts</h2>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                    ${Object.entries(categories).map(([category, items]) => items.length > 0 ? `
                        <div style="margin-bottom: 2rem;">
                            <h3 style="color: var(--primary); margin-bottom: 1rem;">${category}</h3>
                            <div style="display: grid; gap: 0.5rem;">
                                ${items.map(item => `
                                    <div style="display: grid; grid-template-columns: 150px 1fr; gap: 1rem; padding: 0.5rem; border-radius: 4px; background: var(--bg-input);">
                                        <kbd style="font-family: monospace; background: var(--bg-card); padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid var(--border); text-align: center;">
                                            ${item.keys.toUpperCase()}
                                        </kbd>
                                        <span>${item.description}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : '').join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    disable() {
        this.enabled = false;
    }

    enable() {
        this.enabled = true;
    }
}

// Create and export singleton instance
export const keyboardShortcuts = new KeyboardShortcutsManager();
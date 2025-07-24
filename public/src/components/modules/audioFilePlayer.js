// Audio File Player Module - Handles MP3 file playback
import { AudioPlayer } from '../audioPlayer.js';
import { AudioService } from '../../services/audioService.js';

export class AudioFilePlayer {
    constructor(storageService) {
        this.storageService = storageService;
        this.audioService = new AudioService();
        this.audioPlayer = null;
        this.currentFile = null;
        this.syncWithTimer = true;
        this.container = null;
    }

    initialize(container) {
        this.container = container;
    }

    async loadFile(file) {
        if (!file) return;

        // Validate file
        if (!this.validateFile(file)) {
            return;
        }

        try {
            // Clear any existing player
            this.clear();

            // Save file reference
            this.currentFile = file;

            // Read file as ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await this.audioService.decodeAudioData(arrayBuffer);

            // Create audio player instance
            const playerContainer = this.container || document.getElementById('audioPlayerContainer');
            if (!playerContainer) {
                console.error('Audio player container not found');
                return;
            }

            this.audioPlayer = new AudioPlayer(this.audioService, this.storageService);
            this.audioPlayer.render(playerContainer);

            // Load the audio buffer
            await this.audioPlayer.loadAudioBuffer(audioBuffer, file.name);

            // Set up sync with timer if enabled
            if (this.syncWithTimer && window.currentTimer) {
                this.audioPlayer.setSyncWithTimer(true);
            }

            // Show file name
            this.updateFileName(file.name);

            return true;
        } catch (error) {
            console.error('Error loading audio file:', error);
            this.showError('Failed to load audio file: ' + error.message);
            return false;
        }
    }

    validateFile(file) {
        // Check file type
        const validTypes = ['.mp3', 'audio/mp3', 'audio/mpeg'];
        const isValidType = validTypes.some(type => 
            file.type === type || file.name.toLowerCase().endsWith('.mp3')
        );

        if (!isValidType) {
            this.showError('Please select an MP3 file');
            return false;
        }

        // Check file size (20MB limit)
        const maxSize = 20 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showError('File size must be less than 20MB');
            return false;
        }

        return true;
    }

    clear() {
        if (this.audioPlayer) {
            this.audioPlayer.destroy();
            this.audioPlayer = null;
        }

        const playerContainer = this.container || document.getElementById('audioPlayerContainer');
        if (playerContainer) {
            playerContainer.innerHTML = '';
        }

        this.currentFile = null;
        this.hideFileName();
    }

    updateFileName(name) {
        const fileNameElement = document.getElementById('currentFileName');
        const wrapperElement = document.getElementById('currentFileNameWrapper');
        
        if (fileNameElement && wrapperElement) {
            fileNameElement.textContent = `Current: ${name}`;
            wrapperElement.style.display = 'block';
        }
    }

    hideFileName() {
        const wrapperElement = document.getElementById('currentFileNameWrapper');
        if (wrapperElement) {
            wrapperElement.style.display = 'none';
        }
    }

    showError(message) {
        // Use notification system if available
        if (window.notificationManager) {
            window.notificationManager.show(message, 'error');
        } else {
            console.error(message);
            alert(message);
        }
    }

    setSyncWithTimer(enabled) {
        this.syncWithTimer = enabled;
        if (this.audioPlayer) {
            this.audioPlayer.setSyncWithTimer(enabled);
        }
    }

    play() {
        if (this.audioPlayer && !this.audioPlayer.isPlaying) {
            this.audioPlayer.togglePlayPause();
        }
    }

    pause() {
        if (this.audioPlayer && this.audioPlayer.isPlaying) {
            this.audioPlayer.togglePlayPause();
        }
    }

    stop() {
        if (this.audioPlayer) {
            this.audioPlayer.stop();
        }
    }

    isPlaying() {
        return this.audioPlayer ? this.audioPlayer.isPlaying : false;
    }

    getState() {
        if (!this.audioPlayer) return null;

        return {
            fileName: this.currentFile?.name,
            isPlaying: this.audioPlayer.isPlaying,
            currentTime: this.audioPlayer.currentTime,
            duration: this.audioPlayer.duration,
            settings: this.audioPlayer.getSettings ? this.audioPlayer.getSettings() : null
        };
    }

    setState(state) {
        // This would require saving the audio file data
        // For now, just show a message that audio needs to be reloaded
        if (state && state.fileName) {
            this.showAudioRestoreMessage(state.fileName);
        }
    }

    showAudioRestoreMessage(fileName) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'audio-restore-message';
        messageDiv.innerHTML = `
            <p>Previously loaded: <strong>${fileName}</strong></p>
            <p>Please reload the audio file to continue.</p>
        `;
        
        const container = this.container || document.getElementById('audioPlayerContainer');
        if (container) {
            container.appendChild(messageDiv);
        }
    }

    destroy() {
        this.clear();
        this.container = null;
    }
}
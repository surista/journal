// Audio File Player Module - Handles MP3 file playback
import { AudioPlayer } from '../audioPlayerRefactored.js';
import { AudioService } from '../../services/audioService.js';

export class AudioFilePlayer {
    constructor(storageService) {
        this.storageService = storageService;
        this.audioService = new AudioService();
        this.audioPlayer = null;
        this.currentFile = null;
        this.currentFileName = null;
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

            // Decode audio data using Web Audio API
            // Use the AudioService which properly handles user gesture requirements
            console.log('Getting audio context from AudioService...');
            const audioContext = await this.audioService.getAudioContext();
            if (!audioContext) {
                console.log('No audio context available, attempting to initialize...');
                // If we don't have an audio context yet, try to initialize it
                // This should work since the user just clicked the browse button
                await this.audioService.initializeAudioContext();
                const context = await this.audioService.getAudioContext();
                if (!context) {
                    throw new Error(
                        'Cannot initialize audio. Please refresh the page and try again.'
                    );
                }
                return await this.loadFile(file); // Retry once with initialized context
            }

            console.log('Audio context state:', audioContext.state);
            console.log('Decoding audio data, arrayBuffer size:', arrayBuffer.byteLength);
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            console.log(
                'Audio decoded successfully, duration:',
                audioBuffer.duration,
                'channels:',
                audioBuffer.numberOfChannels
            );

            // Get player container
            const playerContainer =
                this.container || document.getElementById('audioPlayerContainer');
            if (!playerContainer) {
                console.error('Audio player container not found');
                return;
            }

            // Create audio player instance only if it doesn't exist
            if (!this.audioPlayer) {
                console.log('Creating new AudioPlayer instance');
                this.audioPlayer = new AudioPlayer(this.audioService, this.storageService);
                await this.audioPlayer.render(playerContainer);
            } else {
                console.log('Reusing existing AudioPlayer instance');
            }

            // Load the audio buffer
            await this.audioPlayer.loadAudioBuffer(audioBuffer, file.name);

            // Set up sync with timer if enabled
            if (this.syncWithTimer && window.currentTimer) {
                this.audioPlayer.setSyncWithTimer(true);
            }

            // Show file name
            this.currentFileName = file.name;
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
        const isValidType = validTypes.some(
            (type) => file.type === type || file.name.toLowerCase().endsWith('.mp3')
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
            // Don't destroy the player, just stop it
            this.audioPlayer.stop();
            // Clear the loaded audio
            if (this.audioPlayer.audioCore) {
                this.audioPlayer.audioCore.audioLoaded = false;
            }
        }

        this.currentFile = null;
        this.currentFileName = null;
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

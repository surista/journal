import {Timer} from '../timer.js';
import {PracticeForm} from '../practiceForm.js';
import {AudioPlayer} from '../audioPlayer.js';

export class AudioTab {
    constructor(storageService, audioService) {
        this.storageService = storageService;
        this.audioService = audioService;
        this.timer = null;
        this.audioPlayer = null;
        this.practiceForm = null;
        this.isInitialized = false;
    }

    render(container) {
        // Only render the HTML structure if not already initialized
        if (!this.isInitialized || !container.querySelector('.audio-layout')) {
            container.innerHTML = `
                <div class="audio-layout">
                    <!-- Timer Section - Sticky Container -->
                    <div id="timerContainerAudio" class="timer-section sticky-timer">
                        <!-- Timer will be rendered here -->
                    </div>
                    
                    <!-- Audio Player Section -->
                    <div class="audio-player-wrapper">
                        <div id="audioPlayerContainer"></div>
                    </div>
                    
                    <!-- Practice Form Section - Hidden by default -->
                    <div class="audio-practice-form-wrapper" style="display: none;">
                        <div id="practiceFormContainerAudio"></div>
                    </div>
                </div>
            `;

            this.initializeComponents();
            this.isInitialized = true;
        } else {
            // If already initialized, just ensure components are ready
            this.ensureComponentsReady();
        }
    }

    initializeComponents() {
        // Initialize timer if not already created
        if (!this.timer) {
            const timerContainer = document.getElementById('timerContainerAudio');
            if (timerContainer) {
                this.timer = new Timer(timerContainer);

                // Make timer accessible globally
                if (window.app && window.app.currentPage) {
                    window.app.currentPage.sharedTimer = this.timer;
                    window.currentTimer = this.timer;
                }
            }
        }

        // Initialize audio player
        if (!this.audioPlayer) {
            const audioPlayerContainer = document.getElementById('audioPlayerContainer');
            if (audioPlayerContainer && this.audioService) {
                this.audioPlayer = new AudioPlayer(audioPlayerContainer, this.audioService);
                this.audioPlayer.storageService = this.storageService;
                this.audioPlayer.init();

                // Make audio player accessible globally
                if (window.app?.currentPage?.components) {
                    window.app.currentPage.components.audioPlayer = this.audioPlayer;
                }
            }
        }

        // Add scroll listener for shadow effect
        this.setupScrollListener();
    }

    ensureComponentsReady() {
        // Ensure timer is accessible
        if (this.timer && window.app?.currentPage) {
            window.app.currentPage.sharedTimer = this.timer;
            window.currentTimer = this.timer;
        }

        // Ensure audio player is accessible
        if (this.audioPlayer && window.app?.currentPage?.components) {
            window.app.currentPage.components.audioPlayer = this.audioPlayer;
        }
    }

    setupScrollListener() {
        const audioLayout = document.querySelector('#audioTab .audio-layout');
        const timerContainer = document.getElementById('timerContainerAudio');

        if (audioLayout && timerContainer && !audioLayout.hasAttribute('data-scroll-listener')) {
            // Mark that we've added the listener to avoid duplicates
            audioLayout.setAttribute('data-scroll-listener', 'true');

            audioLayout.addEventListener('scroll', () => {
                if (audioLayout.scrollTop > 10) {
                    timerContainer.classList.add('scrolled');
                } else {
                    timerContainer.classList.remove('scrolled');
                }
            });
        }
    }

    onActivate() {
        console.log('Audio tab activated');

        // Ensure components are accessible
        this.ensureComponentsReady();

        // Refresh audio player waveform if needed
        if (this.audioPlayer && this.audioPlayer.waveformVisualizer) {
            setTimeout(() => {
                this.audioPlayer.waveformVisualizer.resizeCanvas?.();
                this.audioPlayer.waveformVisualizer.draw?.();
            }, 100);
        }

        // Update practice form context - safely check if method exists
        if (this.practiceForm && typeof this.practiceForm.updateContext === 'function') {
            this.practiceForm.updateContext();
        }

        // Ensure scroll listener is set up
        this.setupScrollListener();

        // Ensure proper layout height
        const audioLayout = document.querySelector('#audioTab .audio-layout');
        if (audioLayout) {
            audioLayout.style.height = `calc(100vh - 140px)`;
        }

        // Dispatch tab activated event
        window.dispatchEvent(new CustomEvent('audioTabActivated', {
            detail: {
                audioPlayer: this.audioPlayer,
                timer: this.timer
            }
        }));
    }

    destroy() {
        console.log('Destroying Audio tab');

        // Cleanup timer
        if (this.timer) {
            this.timer.destroy?.();
            this.timer = null;
        }

        // Cleanup audio player
        if (this.audioPlayer) {
            this.audioPlayer.destroy?.();
            this.audioPlayer = null;
        }

        // Cleanup practice form
        if (this.practiceForm) {
            this.practiceForm.destroy?.();
            this.practiceForm = null;
        }

        // Remove scroll listener
        const audioLayout = document.querySelector('#audioTab .audio-layout');
        if (audioLayout) {
            audioLayout.removeAttribute('data-scroll-listener');
        }

        // Reset initialization flag
        this.isInitialized = false;
    }
}
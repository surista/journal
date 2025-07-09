// AudioTab Component - Handles the audio practice tool
export class AudioTab {
    constructor(storageService, audioService) {
        this.storageService = storageService;
        this.audioService = audioService;
        this.container = null;
        this.timer = null;
        this.practiceForm = null;
        this.audioPlayer = null;
    }

    render(container) {
        this.container = container;

        this.container.innerHTML = `
            <div class="audio-layout">
                <!-- Timer (Always visible) -->
                <div id="timerContainerAudio" class="timer-section"></div>
                
                <!-- Log Practice Section -->
                <div class="log-practice-section collapsed" id="logPracticeSection">

                    <div class="log-practice-header">
                        <div class="log-practice-title">
                            <i class="icon">📝</i>
                            <h3>Log Practice Session</h3>
                        </div>
                        <i class="icon collapse-icon">▶</i>
                    </div>
                    <div class="log-practice-content">
                        <div class="log-practice-form-wrapper">
                            <div id="practiceFormContainerAudio"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Audio Player -->
                <div id="audioPlayerContainer" class="audio-player-wrapper"></div>
            </div>
        `;

        this.initializeComponents();
    }


    async initializeComponents() {
        // Get shared timer and practice form from dashboard
        const dashboard = window.app?.currentPage;
        if (dashboard) {
            this.timer = dashboard.components?.timer;
            this.practiceForm = dashboard.components?.practiceForm;

            // Move them to this tab
            if (this.timer) {
                const timerContainer = document.getElementById('timerContainerAudio');
                if (timerContainer) {
                    timerContainer.innerHTML = '';
                    this.timer.container = timerContainer;
                    this.timer.init();
                }
            }

            if (this.practiceForm) {
                const formContainer = document.getElementById('practiceFormContainerAudio');
                if (formContainer) {
                    formContainer.innerHTML = '';
                    this.practiceForm.container = formContainer;
                    this.practiceForm.render();

                    if (formContainer) {
                        formContainer.innerHTML = '';
                        this.practiceForm.container = formContainer;
                        this.practiceForm.render();

                        // Listen for audio file loaded events to update practice form context
                        window.addEventListener('audioFileLoaded', (event) => {
                            if (this.practiceForm) {
                                this.practiceForm.setAudioContext(event.detail.fileName);
                            }
                        });

                        window.addEventListener('youtubeVideoLoaded', (event) => {
                            if (this.practiceForm) {
                                const context = event.detail.title || event.detail.url || `YouTube: ${event.detail.videoId}`;
                                this.practiceForm.setAudioContext(context);
                            }
                        });
                    }

                    // Listen for audio file loaded events to update practice form context
                    window.addEventListener('audioFileLoaded', (event) => {
                        if (this.practiceForm) {
                            this.practiceForm.setAudioContext(event.detail.fileName);
                        }
                    });

                    window.addEventListener('youtubeVideoLoaded', (event) => {
                        if (this.practiceForm) {
                            const context = event.detail.title || event.detail.url || `YouTube: ${event.detail.videoId}`;
                            this.practiceForm.setAudioContext(context);
                        }
                    });
                }
            }
        }

        // Initialize audio player
        const audioPlayerContainer = document.getElementById('audioPlayerContainer');
        if (audioPlayerContainer) {
            try {
                const {AudioPlayer} = await import('../audioPlayer.js');
                this.audioPlayer = new AudioPlayer(audioPlayerContainer, this.audioService);

                // Pass storage service
                this.audioPlayer.storageService = this.storageService;

                // Store reference to dashboard for timer access
                this.audioPlayer.dashboard = dashboard;

                // Initialize
                this.audioPlayer.init();
                this.audioPlayer.isInitialized = true;

                console.log('Audio Player initialized successfully');
            } catch (error) {
                console.error('Error initializing Audio Player:', error);
                audioPlayerContainer.innerHTML = `
                    <div class="error-state" style="padding: 2rem; text-align: center; color: var(--text-secondary);">
                        <h3>Unable to load Audio Player</h3>
                        <p>${error.message}</p>
                        <button class="btn btn-primary" onclick="location.reload()">Reload Page</button>
                    </div>
                `;
            }
        }
    }

    onActivate() {
        // Ensure audio player is visible when tab is activated
        if (this.audioPlayer && this.audioPlayer.render) {
            this.audioPlayer.render();
        }

        // Resize waveform if it exists
        if (this.audioPlayer?.waveformVisualizer) {
            requestAnimationFrame(() => {
                this.audioPlayer.waveformVisualizer.resizeCanvas();
            });
        }
    }

    onDeactivate() {
        // Called when leaving tab
    }

    destroy() {
        if (this.audioPlayer && typeof this.audioPlayer.destroy === 'function') {
            this.audioPlayer.destroy();
        }
        this.audioPlayer = null;
        this.timer = null;
        this.practiceForm = null;
        this.container = null;
    }
}
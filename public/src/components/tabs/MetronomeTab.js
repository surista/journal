// MetronomeTab Component - Handles the metronome tool
export class MetronomeTab {
    constructor(storageService) {
        this.storageService = storageService;
        this.container = null;
        this.timer = null;
        this.practiceForm = null;
        this.metronome = null;
        this.audioService = null;
    }

    render(container) {
        this.container = container;

        this.container.innerHTML = `
            <div class="metronome-layout">
                <!-- Timer (Always visible) -->
                <div id="timerContainerMetronome" class="timer-section"></div>

                
                <!-- Metronome -->
                <div id="metronomeContainer" class="metronome-wrapper"></div>
            </div>
        `;

        this.attachEventListeners();
        this.initializeComponents();
    }

    attachEventListeners() {
        // Collapsible log practice section
        const header = this.container.querySelector('.log-practice-header');
        if (header) {
            header.addEventListener('click', () => {
                const section = header.closest('.log-practice-section');
                const icon = header.querySelector('.collapse-icon');
                if (section && icon) {
                    section.classList.toggle('collapsed');
                    icon.textContent = section.classList.contains('collapsed') ? '▶' : '▼';
                }
            });
        }
    }

    async initializeComponents() {
        // Get shared timer and practice form from dashboard
        const dashboard = window.app?.currentPage;
        if (dashboard) {
            this.timer = dashboard.components?.timer;
            this.practiceForm = dashboard.components?.practiceForm;
            this.audioService = dashboard.audioService;

            // Move them to this tab
            if (this.timer) {
                const timerContainer = document.getElementById('timerContainerMetronome');
                if (timerContainer) {
                    timerContainer.innerHTML = '';
                    this.timer.container = timerContainer;
                    this.timer.init();
                }
            }

            if (this.practiceForm) {
                const formContainer = document.getElementById('practiceFormContainerMetronome');
                if (formContainer) {
                    formContainer.innerHTML = '';
                    this.practiceForm.container = formContainer;
                    this.practiceForm.render();
                }
            }
        }

        // Initialize metronome
        const metronomeContainer = document.getElementById('metronomeContainer');
        if (metronomeContainer) {
            try {
                const { Metronome } = await import('../metronome.js');
                const { AudioService } = await import('../../services/audioService.js');

                // Get the audio service from dashboard or create new one
                let audioService = this.audioService || (dashboard && dashboard.audioService);
                if (!audioService) {
                    audioService = new AudioService();
                }

                this.metronome = new Metronome(metronomeContainer, audioService);

                if (this.timer) {
                    this.metronome.setTimer(this.timer);
                }

                console.log('Metronome initialized successfully');
            } catch (error) {
                console.error('Error initializing Metronome:', error);
                metronomeContainer.innerHTML = `
                    <div class="error-state" style="padding: 2rem; text-align: center;">
                        <h3>Unable to load Metronome</h3>
                        <p>${error.message}</p>
                        <button class="btn btn-primary" onclick="location.reload()">Reload Page</button>
                    </div>
                `;
            }
        }
    }

    onActivate() {
        // Called when tab becomes active

        // Add scroll listener for sticky timer shadow effect
        const metronomeLayout = document.querySelector('#metronomeTab .metronome-layout');
        const timerSection = document.querySelector('#metronomeTab .timer-section');

        if (metronomeLayout && timerSection) {
            const handleScroll = () => {
                if (metronomeLayout.scrollTop > 10) {
                    timerSection.classList.add('scrolled');
                } else {
                    timerSection.classList.remove('scrolled');
                }
            };

            // Remove any existing listeners
            metronomeLayout.removeEventListener('scroll', handleScroll);
            // Add new listener
            metronomeLayout.addEventListener('scroll', handleScroll);

            // Store reference for cleanup
            this.scrollHandler = handleScroll;
            this.scrollContainer = metronomeLayout;
        }
    }

    onDeactivate() {
        // Stop metronome when leaving tab
        if (this.metronome && this.metronome.isPlaying) {
            this.metronome.stop();
        }
    }

    destroy() {
        // Stop metronome when destroying
        if (this.metronome && this.metronome.isPlaying) {
            this.metronome.stop();
        }

        // Clean up scroll listener
        if (this.scrollHandler && this.scrollContainer) {
            this.scrollContainer.removeEventListener('scroll', this.scrollHandler);
        }

        if (this.metronome && typeof this.metronome.destroy === 'function') {
            this.metronome.destroy();
        }

        this.metronome = null;
        this.timer = null;
        this.practiceForm = null;
        this.container = null;
    }
}
// AudioService.js - Fixed to handle user gesture requirement
export class AudioService {
    constructor() {
        this.audioContext = null;
        this.isInitialized = false;
        this.initPromise = null;
        this.userGestureReceived = false;

        // Listen for first user interaction
        this.setupUserGestureListener();
    }

    setupUserGestureListener() {
        const handleUserGesture = () => {
            if (!this.userGestureReceived) {
                this.userGestureReceived = true;
                this.initializeAudioContext();

                // Remove listeners after first interaction
                document.removeEventListener('click', handleUserGesture);
                document.removeEventListener('touchstart', handleUserGesture);
                document.removeEventListener('keydown', handleUserGesture);
            }
        };

        // Listen for any user interaction
        document.addEventListener('click', handleUserGesture);
        document.addEventListener('touchstart', handleUserGesture);
        document.addEventListener('keydown', handleUserGesture);
    }

    async initializeAudioContext() {
        if (this.isInitialized || this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = new Promise((resolve, reject) => {
            try {
                // Create AudioContext only after user gesture
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

                // Resume context if suspended
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume().then(() => {
                        this.isInitialized = true;
                        console.log('✅ AudioContext initialized and resumed');
                        resolve(this.audioContext);
                    }).catch(reject);
                } else {
                    this.isInitialized = true;
                    console.log('✅ AudioContext initialized');
                    resolve(this.audioContext);
                }
            } catch (error) {
                console.error('❌ AudioContext initialization failed:', error);
                reject(error);
            }
        });

        return this.initPromise;
    }

    async getAudioContext() {
        if (!this.userGestureReceived) {
            console.warn('⚠️ AudioContext requires user interaction first');
            return null;
        }

        if (!this.isInitialized) {
            await this.initializeAudioContext();
        }

        return this.audioContext;
    }

    async createOscillator(frequency = 440, type = 'sine') {
        const context = await this.getAudioContext();
        if (!context) return null;

        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;
        gainNode.gain.value = 0.1;

        return { oscillator, gainNode };
    }

    async playTone(frequency = 440, duration = 0.1) {
        const nodes = await this.createOscillator(frequency);
        if (!nodes) return;

        const { oscillator, gainNode } = nodes;
        const now = this.audioContext.currentTime;

        oscillator.start(now);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
        oscillator.stop(now + duration);
    }

    async createMetronome(bpm = 120) {
        const context = await this.getAudioContext();
        if (!context) return null;

        return {
            context,
            playClick: async () => {
                await this.playTone(800, 0.1);
            },
            playAccent: async () => {
                await this.playTone(1000, 0.1);
            }
        };
    }

    isReady() {
        return this.isInitialized && this.userGestureReceived;
    }

    getState() {
        if (!this.audioContext) return 'not-initialized';
        return this.audioContext.state;
    }

    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    destroy() {
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
            this.isInitialized = false;
        }
    }
}
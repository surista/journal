// Transpose Extension API - Direct integration with Transpose chrome extension
// This uses the extension's exposed API if available

export class TransposeExtensionAPI {
    constructor() {
        this.isAvailable = false;
        this.transposeAPI = null;
        this.currentPitch = 0;
    }

    async initialize() {
        // Check if Transpose extension has injected its API
        if (window.transpose) {
            this.transposeAPI = window.transpose;
            this.isAvailable = true;
            console.log('Transpose API detected');
            return true;
        }

        // Check for extension via web accessible resources
        try {
            // Transpose extension ID
            const extensionId = 'ioimlbgefgadofblnajllknopjboejda';
            const testUrl = `chrome-extension://${extensionId}/icon-128.png`;

            // Try to load a resource to check if extension exists
            const img = new Image();
            img.src = testUrl;

            await new Promise((resolve, reject) => {
                img.onload = () => {
                    console.log('Transpose extension detected via resource check');
                    resolve(true);
                };
                img.onerror = () => {
                    reject(false);
                };
                setTimeout(() => reject(false), 1000);
            });

            // Extension exists but API not injected yet
            // Try to trigger injection by dispatching event
            this.requestAPIInjection();

            // Wait for API to be available
            return await this.waitForAPI();
        } catch (error) {
            console.log('Transpose extension not detected');
            return false;
        }
    }

    requestAPIInjection() {
        // Dispatch event that extension might listen for
        document.dispatchEvent(
            new CustomEvent('guitar-journal-request-transpose', {
                detail: {
                    action: 'inject-api',
                    source: 'guitar-practice-journal'
                }
            })
        );

        // Also try postMessage
        window.postMessage(
            {
                type: 'GUITAR_JOURNAL_REQUEST',
                target: 'transpose',
                action: 'inject-api'
            },
            '*'
        );
    }

    async waitForAPI(timeout = 3000) {
        return new Promise((resolve) => {
            const startTime = Date.now();

            const checkInterval = setInterval(() => {
                if (window.transpose) {
                    clearInterval(checkInterval);
                    this.transposeAPI = window.transpose;
                    this.isAvailable = true;
                    console.log('Transpose API now available');
                    resolve(true);
                } else if (Date.now() - startTime > timeout) {
                    clearInterval(checkInterval);
                    resolve(false);
                }
            }, 100);
        });
    }

    // Control methods that mirror Transpose functionality
    async setPitch(semitones) {
        this.currentPitch = semitones;

        // Method 1: Direct API if available
        if (this.transposeAPI && this.transposeAPI.setPitch) {
            this.transposeAPI.setPitch(semitones);
            return true;
        }

        // Method 2: Try to trigger Transpose UI directly
        // Look for Transpose control elements that might be injected
        const transposeElements = [
            document.querySelector('[class*="transpose"]'),
            document.querySelector('[id*="transpose"]'),
            document.querySelector('[data-transpose]'),
            document.querySelector('.pitch-shifter-controls'),
            document.querySelector('.transpose-widget'),
            // Check iframe for YouTube player
            document.querySelector('iframe')?.contentDocument?.querySelector('[class*="transpose"]')
        ].filter(Boolean);

        if (transposeElements.length > 0) {
            console.log('Found Transpose elements:', transposeElements);
            // Try clicking on the element to activate it
            transposeElements[0].click();
        }

        // Method 3: Set data attributes that extension might monitor
        document.documentElement.setAttribute('data-transpose-pitch', semitones.toString());
        document.documentElement.setAttribute('data-transpose-request', 'set-pitch');

        // Method 4: Try URL hash communication
        const currentHash = window.location.hash;
        window.location.hash = `transpose-pitch-${semitones}`;
        // Restore original hash after a moment
        setTimeout(() => {
            window.location.hash = currentHash;
        }, 100);

        // Method 5: Hidden input field communication
        let transposeInput = document.getElementById('transpose-control-input');
        if (!transposeInput) {
            transposeInput = document.createElement('input');
            transposeInput.type = 'hidden';
            transposeInput.id = 'transpose-control-input';
            document.body.appendChild(transposeInput);
        }
        transposeInput.value = semitones;
        transposeInput.setAttribute('data-pitch', semitones);
        transposeInput.dispatchEvent(new Event('change', { bubbles: true }));

        // Method 6: Focus-based communication
        // Some extensions monitor focus changes
        const videoElement = document.querySelector('video');
        if (videoElement) {
            videoElement.setAttribute('data-transpose-pitch', semitones);
            videoElement.focus();
            // Dispatch custom event on video element
            videoElement.dispatchEvent(
                new CustomEvent('transpose-pitch-change', {
                    detail: { pitch: semitones },
                    bubbles: true
                })
            );
        }

        // Method 7: Message passing with different formats
        this.sendMessage('setPitch', semitones);

        // Method 8: Try localStorage communication
        try {
            localStorage.setItem(
                'transpose-pitch-request',
                JSON.stringify({
                    pitch: semitones,
                    timestamp: Date.now(),
                    source: 'guitar-practice-journal'
                })
            );
            // Dispatch storage event
            window.dispatchEvent(
                new StorageEvent('storage', {
                    key: 'transpose-pitch-request',
                    newValue: localStorage.getItem('transpose-pitch-request'),
                    url: window.location.href
                })
            );
        } catch (e) {
            console.log('localStorage communication failed:', e);
        }

        return false;
    }

    simulateKeyPress(key, shiftKey = false) {
        const event = new KeyboardEvent('keydown', {
            key: key,
            code: key,
            shiftKey: shiftKey,
            bubbles: true,
            cancelable: true
        });

        // Try different event targets
        const targets = [document.activeElement, document.querySelector('video'), document.body];

        for (const target of targets) {
            if (target) {
                target.dispatchEvent(event);
            }
        }
    }

    sendMessage(action, value) {
        // Custom event
        document.dispatchEvent(
            new CustomEvent('guitar-journal-transpose-control', {
                detail: { action, value }
            })
        );

        // PostMessage
        window.postMessage(
            {
                type: 'TRANSPOSE_CONTROL',
                source: 'guitar-practice-journal',
                action,
                value
            },
            '*'
        );
    }

    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    // Get current state
    getState() {
        if (this.transposeAPI && this.transposeAPI.getState) {
            return this.transposeAPI.getState();
        }

        return {
            pitch: this.currentPitch,
            available: this.isAvailable
        };
    }

    // Reset all controls
    reset() {
        this.setPitch(0);

        if (this.transposeAPI && this.transposeAPI.reset) {
            this.transposeAPI.reset();
        }
    }
}

// Create singleton instance
export const transposeAPI = new TransposeExtensionAPI();

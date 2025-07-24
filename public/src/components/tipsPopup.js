// Tips Popup Component - Shows tips in lower left corner periodically
export class TipsPopup {
    constructor(tipsService) {
        this.tipsService = tipsService;
        this.popupElement = null;
        this.popupTimeout = null;
        this.intervalId = null;
        this.lastShownTime = 0;
        this.minInterval = 5 * 60 * 1000; // 5 minutes in milliseconds
        this.displayDuration = 4000; // 4 seconds (middle of 3-5 range)
    }

    init() {
        // Create popup element
        this.createPopupElement();
        
        // Start the interval to show tips
        this.startTipsInterval();
        
        // Show first tip after a short delay
        setTimeout(() => this.showTip(), 10000); // Show first tip after 10 seconds
    }

    createPopupElement() {
        this.popupElement = document.createElement('div');
        this.popupElement.className = 'tips-popup';
        this.popupElement.innerHTML = `
            <div class="tips-popup-content">
                <span class="tips-popup-icon">💡</span>
                <span class="tips-popup-text"></span>
            </div>
        `;
        document.body.appendChild(this.popupElement);
    }

    showTip() {
        const now = Date.now();
        
        // Don't show if we recently showed a tip
        if (now - this.lastShownTime < this.minInterval) {
            return;
        }

        // Get a random tip
        const tip = this.tipsService.getRandomTip();
        
        // Update the popup text
        const textElement = this.popupElement.querySelector('.tips-popup-text');
        textElement.textContent = tip;
        
        // Show the popup with animation
        this.popupElement.classList.add('show');
        
        // Hide after display duration
        this.popupTimeout = setTimeout(() => {
            this.popupElement.classList.remove('show');
        }, this.displayDuration);
        
        this.lastShownTime = now;
    }

    startTipsInterval() {
        // Show tips at random intervals between 5-7 minutes
        const scheduleNext = () => {
            const randomDelay = this.minInterval + Math.random() * 2 * 60 * 1000; // 5-7 minutes
            this.intervalId = setTimeout(() => {
                this.showTip();
                scheduleNext();
            }, randomDelay);
        };
        
        scheduleNext();
    }

    destroy() {
        // Clear timeouts and intervals
        if (this.popupTimeout) {
            clearTimeout(this.popupTimeout);
        }
        if (this.intervalId) {
            clearTimeout(this.intervalId);
        }
        
        // Remove popup element
        if (this.popupElement && this.popupElement.parentNode) {
            this.popupElement.parentNode.removeChild(this.popupElement);
        }
    }
}
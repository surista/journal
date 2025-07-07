// Waveform Visualizer Component
export class WaveformVisualizer {
    constructor(canvas, audioService) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.audioService = audioService;

        this.waveformData = null;
        this.waveformImageData = null;
        this.animationId = null;

        this.loopStartMarker = null;
        this.loopEndMarker = null;
        this.isAnimating = false;

        this.init();
    }

    init() {
        // Set canvas size
        this.resizeCanvas();

        // Handle window resize
        window.addEventListener('resize', () => this.resizeCanvas());

        // Handle canvas clicks
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));

        // Listen for audio time updates
        this.audioService.onTimeUpdate = (time) => {
            this.updateProgress(time);
        };

        // Store reference to this visualizer in audioService
        this.audioService.waveformVisualizer = this;
    }

    resizeCanvas() {
        // Check if the canvas is visible before trying to resize
        if (this.canvas.offsetParent === null) {
            console.log('Canvas is not visible, skipping resize');
            return;
        }

        const rect = this.canvas.getBoundingClientRect();

        // Check if canvas has valid dimensions
        if (rect.width === 0 || rect.height === 0) {
            console.warn('Canvas has zero dimensions, skipping resize');
            // Try again after a short delay
            setTimeout(() => this.resizeCanvas(), 100);
            return;
        }

        const dpr = window.devicePixelRatio || 1;

        // Set display size (css pixels)
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = '150px'; // Fixed height for consistency

        // Set actual size in memory (scaled up for retina displays)
        this.canvas.width = Math.max(1, rect.width * dpr);
        this.canvas.height = Math.max(1, 150 * dpr);

        // Scale context to match device pixel ratio
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);

        // Store display dimensions
        this.displayWidth = Math.max(1, rect.width);
        this.displayHeight = 150;

        // Redraw if we have data
        if (this.audioService && this.audioService.audioBuffer) {
            this.draw();
        }
    }

    draw() {
        const buffer = this.audioService.audioBuffer;
        if (!buffer) return;

        // Clear canvas with dark background
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.displayWidth, this.displayHeight);

        // Get audio data
        const data = buffer.getChannelData(0);
        const step = Math.ceil(data.length / this.displayWidth);
        const amp = this.displayHeight / 2;

        // Create gradient for waveform
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.displayHeight);
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(0.5, '#a855f7');
        gradient.addColorStop(1, '#6366f1');

        // Draw waveform with proper centering
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 2;

        // Draw positive waveform
        this.ctx.beginPath();
        for (let i = 0; i < this.displayWidth; i++) {
            let min = 1.0;
            let max = -1.0;

            for (let j = 0; j < step; j++) {
                const datum = data[(i * step) + j] || 0;
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }

            const x = i;
            const yMin = amp + (min * amp * 0.8); // Scale down slightly to prevent clipping
            const yMax = amp + (max * amp * 0.8);

            if (i === 0) {
                this.ctx.moveTo(x, yMin);
            } else {
                this.ctx.lineTo(x, yMin);
            }
            this.ctx.lineTo(x, yMax);
        }
        this.ctx.stroke();

        // Add center line
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, amp);
        this.ctx.lineTo(this.displayWidth, amp);
        this.ctx.stroke();

        // Store the waveform image
        this.waveformImageData = this.ctx.getImageData(
            0, 0,
            this.canvas.width,
            this.canvas.height
        );

        // Draw loop markers if set
        this.drawLoopMarkers();

        // Update current position
        const currentTime = this.audioService.getCurrentTime();
        this.updateProgress(currentTime);

        // Don't start animation here - let the audio player control it
    }

    handleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        this.seekToPosition(x);
    }

    handleTouch(event) {
        event.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = event.touches[0];
        const x = touch.clientX - rect.left;
        this.seekToPosition(x);
    }

    seekToPosition(x) {
        const percentage = x / this.displayWidth;
        const duration = this.audioService.getDuration();
        const time = duration * percentage;

        // Use audioService seek instead of direct audio element manipulation
        if (this.audioService && this.audioService.seek) {
            this.audioService.seek(time);
        }
    }

    updateProgress(currentTime) {
        if (!this.waveformImageData) return;

        // Restore original waveform
        this.ctx.putImageData(this.waveformImageData, 0, 0);

        // Ensure currentTime respects loop boundaries if looping
        let displayTime = currentTime;
        if (this.audioService.isLooping && this.loopStartMarker !== null && this.loopEndMarker !== null) {
            // Clamp to loop boundaries
            displayTime = Math.max(this.loopStartMarker, Math.min(displayTime, this.loopEndMarker));
        }

        // Draw progress overlay
        const duration = this.audioService.getDuration();
        const percentage = displayTime / duration;
        const progressX = percentage * this.displayWidth;
        // Draw played portion with semi-transparent overlay
        this.ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
        this.ctx.fillRect(0, 0, progressX, this.displayHeight);

        // Draw progress line
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(progressX, 0);
        this.ctx.lineTo(progressX, this.displayHeight);
        this.ctx.stroke();

        // Draw playhead circle
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(progressX, this.displayHeight / 2, 4, 0, Math.PI * 2);
        this.ctx.fill();

        // Redraw loop markers
        this.drawLoopMarkers();
    }

    updateLoopMarkers(loopStart, loopEnd) {
        this.loopStartMarker = loopStart;
        this.loopEndMarker = loopEnd;

        // Update visual markers using the safe method
        updateLoopMarkersSafe(loopStart, loopEnd, this.audioService.getDuration());

        // Redraw
        if (this.waveformImageData) {
            this.updateProgress(this.audioService.getCurrentTime());
        }
    }

    updateLoopMarkerElements() {
        // This method is now replaced by updateLoopMarkersSafe
        updateLoopMarkersSafe(this.loopStartMarker, this.loopEndMarker, this.audioService.getDuration());
    }

    drawLoopMarkers() {
        const duration = this.audioService.getDuration();
        if (!duration) return;

        // Draw loop region overlay if both markers are set
        if (this.loopStartMarker !== null && this.loopEndMarker !== null) {
            const startX = (this.loopStartMarker / duration) * this.displayWidth;
            const endX = (this.loopEndMarker / duration) * this.displayWidth;

            // Draw semi-transparent overlay
            this.ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
            this.ctx.fillRect(startX, 0, endX - startX, this.displayHeight);
        }

        // Draw start marker if set
        if (this.loopStartMarker !== null) {
            const startX = (this.loopStartMarker / duration) * this.displayWidth;

            // Draw start line
            this.ctx.strokeStyle = '#10b981';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(startX, 0);
            this.ctx.lineTo(startX, this.displayHeight);
            this.ctx.stroke();

            // Draw start label
            this.ctx.fillStyle = '#10b981';
            this.ctx.font = 'bold 12px sans-serif';
            this.ctx.fillText('A', startX + 4, 16);
        }

        // Draw end marker if set
        if (this.loopEndMarker !== null) {
            const endX = (this.loopEndMarker / duration) * this.displayWidth;

            // Draw end line
            this.ctx.strokeStyle = '#ef4444';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(endX, 0);
            this.ctx.lineTo(endX, this.displayHeight);
            this.ctx.stroke();
        }

        // Reset line dash
        this.ctx.setLineDash([]);

        // Draw end label if end marker is set
        if (this.loopEndMarker !== null) {
            const endX = (this.loopEndMarker / duration) * this.displayWidth;
            this.ctx.fillStyle = '#ef4444';
            this.ctx.font = 'bold 12px sans-serif';
            this.ctx.fillText('B', endX - 14, 16);
        }
    }

    clearLoopMarkers() {
        this.loopStartMarker = null;
        this.loopEndMarker = null;

        // Clear DOM markers
        updateLoopMarkersSafe(null, null, this.audioService.getDuration());

        if (this.waveformImageData) {
            this.updateProgress(this.audioService.getCurrentTime());
        }
    }

    startAnimation() {
        const animate = () => {
            // Check if we should continue animating
            if (this.audioService &&
                this.audioService.audio &&
                !this.audioService.audio.paused &&
                this.audioService.isPlaying) {

                // Get current time directly from audio element
                const currentTime = this.audioService.audio.currentTime;
                this.updateProgress(currentTime);
                this.animationId = requestAnimationFrame(animate);
            } else {
                // Stop animation if not playing
                this.stopAnimation();
            }
        };

        // Start the animation loop only if not already running
        if (!this.animationId && !this.isAnimating) {
            this.isAnimating = true;
            animate();
        }
    }

    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
            this.isAnimating = false;
        }
    }

    destroy() {
        this.stopAnimation();
        window.removeEventListener('resize', this.resizeCanvas);
        this.canvas.removeEventListener('click', this.handleClick);
        this.canvas.removeEventListener('touchstart', this.handleTouch);
    }
}

// Helper function to safely update loop markers in the DOM
// Helper function to safely update loop markers in the DOM
function updateLoopMarkersSafe(loopStart, loopEnd, duration) {
    const container = document.querySelector('.waveform-container');
    if (!container) return;

    // Remove any existing markers first
    const existingStartMarkers = container.querySelectorAll('.waveform-loop-start');
    const existingEndMarkers = container.querySelectorAll('.waveform-loop-end');

    existingStartMarkers.forEach(marker => marker.remove());
    existingEndMarkers.forEach(marker => marker.remove());

    // Create start marker if it exists (independent of end marker)
    if (loopStart !== null && duration) {
        const startMarker = document.createElement('div');
        startMarker.className = 'waveform-loop-start';
        startMarker.style.left = `${(loopStart / duration) * 100}%`;

        const startLabel = document.createElement('div');
        startLabel.className = 'waveform-loop-label';
        startLabel.textContent = 'A';
        startMarker.appendChild(startLabel);

        container.appendChild(startMarker);
    }

    // Create end marker if it exists (independent of start marker)
    if (loopEnd !== null && duration) {
        const endMarker = document.createElement('div');
        endMarker.className = 'waveform-loop-end';
        endMarker.style.left = `${(loopEnd / duration) * 100}%`;

        const endLabel = document.createElement('div');
        endLabel.className = 'waveform-loop-label';
        endLabel.textContent = 'B';
        endMarker.appendChild(endLabel);

        container.appendChild(endMarker);
    }
}

// Function to remove duplicate loop markers
function fixDuplicateLoopMarkers() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixDuplicateLoopMarkers);
        return;
    }

    // Find all loop markers
    const waveformContainer = document.querySelector('.waveform-container');
    if (!waveformContainer) return;

    // Remove duplicate loop start markers (keep only the first one)
    const loopStartMarkers = waveformContainer.querySelectorAll('.waveform-loop-start');
    if (loopStartMarkers.length > 1) {
        for (let i = 1; i < loopStartMarkers.length; i++) {
            loopStartMarkers[i].remove();
        }
    }

    // Remove duplicate loop end markers (keep only the first one)
    const loopEndMarkers = waveformContainer.querySelectorAll('.waveform-loop-end');
    if (loopEndMarkers.length > 1) {
        for (let i = 1; i < loopEndMarkers.length; i++) {
            loopEndMarkers[i].remove();
        }
    }
}

// Run the fix when the page loads and after any AJAX updates
fixDuplicateLoopMarkers();

// Also run after a short delay to catch any async rendering
setTimeout(fixDuplicateLoopMarkers, 1000);

// Set up MutationObserver to watch for DOM changes
const observer = new MutationObserver((mutations) => {
    // Check if waveform-related elements were added
    const hasWaveformChanges = mutations.some(mutation => {
        return Array.from(mutation.addedNodes).some(node => {
            return node.nodeType === 1 && (
                node.classList?.contains('waveform-loop-start') ||
                node.classList?.contains('waveform-loop-end') ||
                node.querySelector?.('.waveform-loop-start') ||
                node.querySelector?.('.waveform-loop-end')
            );
        });
    });

    if (hasWaveformChanges) {
        // Debounce the fix to avoid running it too frequently
        clearTimeout(window.loopMarkerFixTimeout);
        window.loopMarkerFixTimeout = setTimeout(fixDuplicateLoopMarkers, 100);
    }
});

// Start observing the waveform container when it becomes available
const startObserving = () => {
    const waveformContainer = document.querySelector('.waveform-container');
    if (waveformContainer) {
        observer.observe(waveformContainer, {
            childList: true,
            subtree: true
        });
    } else {
        // Try again after a short delay
        setTimeout(startObserving, 500);
    }
};

startObserving();
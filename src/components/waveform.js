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
        this.audioService.onTimeUpdate = (time) => this.updateProgress(time);
    }

    resizeCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        // Set display size (css pixels)
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = '150px'; // Fixed height for consistency

        // Set actual size in memory (scaled up for retina displays)
        this.canvas.width = rect.width * dpr;
        this.canvas.height = 150 * dpr;

        // Scale context to match device pixel ratio
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);

        // Store display dimensions
        this.displayWidth = rect.width;
        this.displayHeight = 150;

        // Redraw if we have data
        if (this.waveformData) {
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

        // Start animation loop
        this.startAnimation();
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

        // If playing, stop and restart at new position
        if (this.audioService.isPlaying) {
            this.audioService.pause();
            this.audioService.pausedAt = time;
            this.audioService.play();
        } else {
            this.audioService.pausedAt = time;
            this.updateProgress(time);
        }
    }

    updateProgress(currentTime) {
        if (!this.waveformImageData) return;

        // Restore original waveform
        this.ctx.putImageData(this.waveformImageData, 0, 0);

        // Draw progress overlay
        const duration = this.audioService.getDuration();
        const percentage = currentTime / duration;
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

        // Update visual markers
        this.updateLoopMarkerElements();

        // Redraw
        if (this.waveformImageData) {
            this.updateProgress(this.audioService.getCurrentTime());
        }
    }

    updateLoopMarkerElements() {
        const duration = this.audioService.getDuration();
        if (!duration) return;

        // Find or create marker elements
        let startMarker = document.getElementById('loopStart');
        let endMarker = document.getElementById('loopEnd');

        if (!startMarker || !endMarker) return;

        if (this.loopStartMarker !== null) {
            const startX = (this.loopStartMarker / duration) * this.displayWidth;
            startMarker.style.display = 'block';
            startMarker.style.left = startX + 'px';
        } else {
            startMarker.style.display = 'none';
        }

        if (this.loopEndMarker !== null) {
            const endX = (this.loopEndMarker / duration) * this.displayWidth;
            endMarker.style.display = 'block';
            endMarker.style.left = endX + 'px';
        } else {
            endMarker.style.display = 'none';
        }
    }

    drawLoopMarkers() {
        const duration = this.audioService.getDuration();
        if (!duration) return;

        // Draw loop region
        if (this.loopStartMarker !== null && this.loopEndMarker !== null) {
            const startX = (this.loopStartMarker / duration) * this.displayWidth;
            const endX = (this.loopEndMarker / duration) * this.displayWidth;

            // Draw semi-transparent overlay
            this.ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
            this.ctx.fillRect(startX, 0, endX - startX, this.displayHeight);

            // Draw start line
            this.ctx.strokeStyle = '#10b981';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(startX, 0);
            this.ctx.lineTo(startX, this.displayHeight);
            this.ctx.stroke();

            // Draw end line
            this.ctx.strokeStyle = '#ef4444';
            this.ctx.beginPath();
            this.ctx.moveTo(endX, 0);
            this.ctx.lineTo(endX, this.displayHeight);
            this.ctx.stroke();
            this.ctx.setLineDash([]);

            // Draw loop labels
            this.ctx.fillStyle = '#10b981';
            this.ctx.font = 'bold 12px sans-serif';
            this.ctx.fillText('A', startX + 4, 16);

            this.ctx.fillStyle = '#ef4444';
            this.ctx.fillText('B', endX - 14, 16);
        }
    }

    clearLoopMarkers() {
        this.loopStartMarker = null;
        this.loopEndMarker = null;
        this.updateLoopMarkerElements();

        if (this.waveformImageData) {
            this.updateProgress(this.audioService.getCurrentTime());
        }
    }

    startAnimation() {
        const animate = () => {
            if (this.audioService.isPlaying) {
                // Update is handled by the audio service callback
                this.animationId = requestAnimationFrame(animate);
            }
        };

        animate();
    }

    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    destroy() {
        this.stopAnimation();
        window.removeEventListener('resize', this.resizeCanvas);
        this.canvas.removeEventListener('click', this.handleClick);
        this.canvas.removeEventListener('touchstart', this.handleTouch);
    }
}
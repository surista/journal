// Waveform Controller Module - Handles waveform visualization
export class WaveformController {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.waveformData = null;
        this.duration = 0;
        this.currentTime = 0;
        
        // Visual settings
        this.width = 0;
        this.height = 100;
        this.waveformColor = '#6366f1';
        this.progressColor = 'rgba(156, 163, 175, 0.2)'; // Transparent grey
        this.loopRegionColor = 'rgba(99, 102, 241, 0.2)';
        this.loopStartColor = '#10b981'; // Green
        this.loopEndColor = '#ef4444'; // Red
        this.backgroundColor = '#1f2937';
        
        // Loop markers
        this.loopStart = null;
        this.loopEnd = null;
        
        // Interaction state
        this.isHovering = false;
        this.hoverPosition = 0;
        
        // Callbacks
        this.onSeek = null;
        this.onLoopRegionUpdate = null;
        
        // Performance optimization
        this.pixelRatio = window.devicePixelRatio || 1;
        this.needsRedraw = true;
        this.animationFrame = null;
    }

    initialize(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.setupCanvas();
        this.attachEventListeners();
    }

    setupCanvas() {
        if (!this.canvas) return;
        
        // Get the display size
        const rect = this.canvas.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        
        // Set the actual canvas size accounting for pixel ratio
        this.canvas.width = this.width * this.pixelRatio;
        this.canvas.height = this.height * this.pixelRatio;
        
        // Scale the context to ensure correct drawing
        this.ctx.scale(this.pixelRatio, this.pixelRatio);
        
        // Set canvas style size
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
        
        this.needsRedraw = true;
    }

    attachEventListeners() {
        if (!this.canvas) return;
        
        // Mouse events
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        
        // Resize observer
        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                this.setupCanvas();
                this.draw();
            });
            this.resizeObserver.observe(this.canvas);
        }
    }

    async generateWaveform(audioBuffer) {
        if (!audioBuffer) return;
        
        this.duration = audioBuffer.duration;
        
        // Get audio data
        const channelData = audioBuffer.getChannelData(0);
        const samplesPerPixel = Math.floor(channelData.length / this.width);
        
        this.waveformData = [];
        
        // Generate waveform data by finding min/max values for each pixel
        for (let x = 0; x < this.width; x++) {
            const startSample = x * samplesPerPixel;
            const endSample = Math.min(startSample + samplesPerPixel, channelData.length);
            
            let min = 1;
            let max = -1;
            
            for (let i = startSample; i < endSample; i++) {
                const sample = channelData[i];
                if (sample < min) min = sample;
                if (sample > max) max = sample;
            }
            
            this.waveformData.push({ min, max });
        }
        
        this.needsRedraw = true;
        this.draw();
    }

    draw() {
        if (!this.ctx || !this.needsRedraw) return;
        
        // Clear canvas
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw waveform
        if (this.waveformData) {
            this.drawWaveform();
        }
        
        // Draw loop region and markers
        if (this.loopStart !== null || this.loopEnd !== null) {
            this.drawLoopRegion();
        }
        
        // Draw progress
        if (this.currentTime > 0 && this.duration > 0) {
            this.drawProgress();
        }
        
        // Draw hover line
        if (this.isHovering) {
            this.drawHoverLine();
        }
        
        this.needsRedraw = false;
    }

    drawWaveform() {
        const midY = this.height / 2;
        
        this.ctx.fillStyle = this.waveformColor;
        this.ctx.beginPath();
        
        // Draw the waveform
        for (let x = 0; x < this.waveformData.length; x++) {
            const { min, max } = this.waveformData[x];
            const height = (max - min) * this.height * 0.8; // 80% of canvas height
            const y = midY - (height / 2);
            
            this.ctx.fillRect(x, y, 1, height);
        }
    }

    drawProgress() {
        const progressX = (this.currentTime / this.duration) * this.width;
        
        // Draw progress overlay on waveform
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'source-atop';
        this.ctx.fillStyle = this.progressColor;
        this.ctx.fillRect(0, 0, progressX, this.height);
        this.ctx.restore();
        
        // Draw progress line
        this.ctx.strokeStyle = 'rgba(229, 231, 235, 0.8)'; // Light grey line for current position
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(progressX, 0);
        this.ctx.lineTo(progressX, this.height);
        this.ctx.stroke();
    }

    drawLoopRegion() {
        // Draw loop start marker if set
        if (this.loopStart !== null) {
            const startX = (this.loopStart / this.duration) * this.width;
            
            // Draw loop start marker (green)
            this.ctx.strokeStyle = this.loopStartColor;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(startX, 0);
            this.ctx.lineTo(startX, this.height);
            this.ctx.stroke();
            
            // Draw handle
            this.drawLoopHandle(startX, 'start');
        }
        
        // Draw loop end marker if set
        if (this.loopEnd !== null) {
            const endX = (this.loopEnd / this.duration) * this.width;
            
            // Draw loop end marker (red)
            this.ctx.strokeStyle = this.loopEndColor;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(endX, 0);
            this.ctx.lineTo(endX, this.height);
            this.ctx.stroke();
            
            // Draw handle
            this.drawLoopHandle(endX, 'end');
        }
        
        // Draw loop region background if both markers are set
        if (this.loopStart !== null && this.loopEnd !== null) {
            const startX = (this.loopStart / this.duration) * this.width;
            const endX = (this.loopEnd / this.duration) * this.width;
            const width = endX - startX;
            
            // Draw loop region background
            this.ctx.fillStyle = this.loopRegionColor;
            this.ctx.fillRect(startX, 0, width, this.height);
        }
    }

    drawLoopHandle(x, type) {
        const handleWidth = 8;
        const handleHeight = 20;
        const y = (this.height - handleHeight) / 2;
        
        this.ctx.fillStyle = this.waveformColor;
        
        if (type === 'start') {
            this.ctx.fillRect(x - handleWidth, y, handleWidth, handleHeight);
        } else {
            this.ctx.fillRect(x, y, handleWidth, handleHeight);
        }
    }

    drawHoverLine() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.hoverPosition, 0);
        this.ctx.lineTo(this.hoverPosition, this.height);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
        
        // Draw time tooltip
        if (this.duration > 0) {
            const time = (this.hoverPosition / this.width) * this.duration;
            this.drawTimeTooltip(this.hoverPosition, time);
        }
    }

    drawTimeTooltip(x, time) {
        const text = this.formatTime(time);
        const padding = 4;
        
        this.ctx.font = '12px monospace';
        const textWidth = this.ctx.measureText(text).width;
        const tooltipWidth = textWidth + padding * 2;
        const tooltipHeight = 20;
        
        // Position tooltip
        let tooltipX = x - tooltipWidth / 2;
        tooltipX = Math.max(0, Math.min(tooltipX, this.width - tooltipWidth));
        const tooltipY = 5;
        
        // Draw tooltip background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
        
        // Draw tooltip text
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, tooltipX + tooltipWidth / 2, tooltipY + tooltipHeight / 2);
    }

    handleClick(event) {
        if (!this.onSeek || this.duration === 0) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const time = (x / this.width) * this.duration;
        
        this.onSeek(time);
    }

    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        this.hoverPosition = event.clientX - rect.left;
        this.needsRedraw = true;
        this.scheduleRedraw();
    }

    handleMouseEnter() {
        this.isHovering = true;
        this.canvas.style.cursor = 'pointer';
        this.needsRedraw = true;
        this.scheduleRedraw();
    }

    handleMouseLeave() {
        this.isHovering = false;
        this.canvas.style.cursor = 'default';
        this.needsRedraw = true;
        this.scheduleRedraw();
    }

    handleTouchStart(event) {
        event.preventDefault();
        const touch = event.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const time = (x / this.width) * this.duration;
        
        if (this.onSeek) {
            this.onSeek(time);
        }
    }

    scheduleRedraw() {
        if (this.animationFrame) return;
        
        this.animationFrame = requestAnimationFrame(() => {
            this.draw();
            this.animationFrame = null;
        });
    }

    updateProgress(currentTime) {
        if (this.currentTime !== currentTime) {
            this.currentTime = currentTime;
            this.needsRedraw = true;
            this.scheduleRedraw();
        }
    }

    updateLoopRegion(loopStart, loopEnd) {
        if (this.loopStart !== loopStart || this.loopEnd !== loopEnd) {
            this.loopStart = loopStart;
            this.loopEnd = loopEnd;
            this.needsRedraw = true;
            this.scheduleRedraw();
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    setColors(colors) {
        if (colors.waveform) this.waveformColor = colors.waveform;
        if (colors.progress) this.progressColor = colors.progress;
        if (colors.loopRegion) this.loopRegionColor = colors.loopRegion;
        if (colors.background) this.backgroundColor = colors.background;
        
        this.needsRedraw = true;
        this.scheduleRedraw();
    }

    resize() {
        this.setupCanvas();
        this.draw();
    }

    clear() {
        this.waveformData = null;
        this.currentTime = 0;
        this.duration = 0;
        this.loopStart = null;
        this.loopEnd = null;
        this.needsRedraw = true;
        this.draw();
    }

    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        this.canvas = null;
        this.ctx = null;
        this.waveformData = null;
    }
}
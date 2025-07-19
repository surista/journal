// YouTube Audio Extractor - Extract and process YouTube audio in real-time
// This approach uses a combination of techniques to achieve pitch shifting

export class YouTubeAudioExtractor {
    constructor() {
        this.audioContext = null;
        this.mediaStreamSource = null;
        this.scriptProcessor = null;
        this.pitchShifter = null;
        this.isProcessing = false;
        this.pitchRatio = 1.0;
        
        // Buffer for pitch shifting algorithm
        this.inputBuffer = [];
        this.outputBuffer = [];
        this.windowSize = 4096;
        this.hopSize = 1024;
    }
    
    async initialize() {
        if (this.audioContext) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Load pitch shifting library if needed
            await this.loadPitchShiftLibrary();
            
            console.log('YouTube Audio Extractor initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize audio extractor:', error);
            throw error;
        }
    }
    
    async loadPitchShiftLibrary() {
        // Option 1: Use SoundTouch.js library for pitch shifting
        return new Promise((resolve, reject) => {
            if (window.SoundTouch) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/soundtouchjs@0.1.30/dist/soundtouch.min.js';
            script.onload = () => {
                console.log('SoundTouch.js loaded for pitch shifting');
                resolve();
            };
            script.onerror = () => reject(new Error('Failed to load SoundTouch.js'));
            document.head.appendChild(script);
        });
    }
    
    async startProcessing(youtubePlayerElement) {
        await this.initialize();
        
        try {
            // Step 1: Create a canvas element to capture video frames
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.style.display = 'none';
            document.body.appendChild(canvas);
            
            // Step 2: Use captureStream to get MediaStream from canvas
            const stream = canvas.captureStream(30); // 30 fps
            
            // Step 3: Create audio processing nodes
            this.setupAudioProcessing(stream);
            
            // Step 4: Start frame capture loop
            this.startFrameCapture(youtubePlayerElement, canvas, ctx);
            
            this.isProcessing = true;
            return true;
        } catch (error) {
            console.error('Failed to start processing:', error);
            throw error;
        }
    }
    
    setupAudioProcessing(stream) {
        // Create script processor for real-time audio processing
        const bufferSize = 4096;
        this.scriptProcessor = this.audioContext.createScriptProcessor(bufferSize, 2, 2);
        
        // Initialize SoundTouch
        this.soundTouch = new SoundTouch();
        this.soundTouch.pitch = this.pitchRatio;
        
        // Create filter
        const filter = new SimpleFilter(this.soundTouch, bufferSize);
        
        // Process audio in script processor
        this.scriptProcessor.onaudioprocess = (event) => {
            const inputL = event.inputBuffer.getChannelData(0);
            const inputR = event.inputBuffer.getChannelData(1);
            const outputL = event.outputBuffer.getChannelData(0);
            const outputR = event.outputBuffer.getChannelData(1);
            
            // Apply pitch shifting
            filter.process(inputL, inputR, outputL, outputR);
        };
        
        // Connect nodes
        this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
        this.mediaStreamSource.connect(this.scriptProcessor);
        this.scriptProcessor.connect(this.audioContext.destination);
    }
    
    startFrameCapture(playerElement, canvas, ctx) {
        const captureFrame = () => {
            if (!this.isProcessing) return;
            
            // Draw current video frame to canvas
            const video = playerElement.querySelector('video');
            if (video) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0);
            }
            
            requestAnimationFrame(captureFrame);
        };
        
        captureFrame();
    }
    
    setPitch(semitones) {
        // Convert semitones to pitch ratio
        this.pitchRatio = Math.pow(2, semitones / 12);
        
        if (this.soundTouch) {
            this.soundTouch.pitch = this.pitchRatio;
            console.log(`Pitch set to ${semitones} semitones (ratio: ${this.pitchRatio})`);
        }
    }
    
    stop() {
        this.isProcessing = false;
        
        if (this.scriptProcessor) {
            this.scriptProcessor.disconnect();
            this.scriptProcessor = null;
        }
        
        if (this.mediaStreamSource) {
            this.mediaStreamSource.disconnect();
            this.mediaStreamSource = null;
        }
        
        // Remove canvas
        const canvas = document.querySelector('canvas[data-youtube-capture]');
        if (canvas) {
            canvas.remove();
        }
    }
}

// Simple filter implementation for SoundTouch
class SimpleFilter {
    constructor(soundTouch, bufferSize) {
        this.soundTouch = soundTouch;
        this.bufferSize = bufferSize;
        this.sourceBuffer = new Float32Array(bufferSize * 2);
        this.resultBuffer = new Float32Array(bufferSize * 2);
        this.position = 0;
    }
    
    process(inputL, inputR, outputL, outputR) {
        // Interleave input channels
        for (let i = 0; i < this.bufferSize; i++) {
            this.sourceBuffer[i * 2] = inputL[i];
            this.sourceBuffer[i * 2 + 1] = inputR[i];
        }
        
        // Process with SoundTouch
        this.soundTouch.process(this.sourceBuffer, this.bufferSize);
        
        // Extract processed samples
        const framesExtracted = this.soundTouch.extract(this.resultBuffer, this.bufferSize);
        
        // Deinterleave output
        for (let i = 0; i < framesExtracted; i++) {
            outputL[i] = this.resultBuffer[i * 2];
            outputR[i] = this.resultBuffer[i * 2 + 1];
        }
        
        // Fill remaining with silence if needed
        for (let i = framesExtracted; i < this.bufferSize; i++) {
            outputL[i] = 0;
            outputR[i] = 0;
        }
    }
}

export const youtubeAudioExtractor = new YouTubeAudioExtractor();
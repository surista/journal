// High-quality time stretching using Web Audio API with phase vocoder technique
export class HighQualityTimeStretch {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.fftSize = 2048;
        this.hopSize = this.fftSize / 4;
        this.windowFunction = this.generateWindow(this.fftSize);
    }

    // Generate Hann window for smoother processing
    generateWindow(size) {
        const window = new Float32Array(size);
        for (let i = 0; i < size; i++) {
            window[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (size - 1));
        }
        return window;
    }

    // Process audio buffer with time stretching
    async processBuffer(inputBuffer, stretchFactor) {
        const numChannels = inputBuffer.numberOfChannels;
        const inputLength = inputBuffer.length;
        const outputLength = Math.floor(inputLength * stretchFactor);
        
        // Create output buffer
        const outputBuffer = this.audioContext.createBuffer(
            numChannels,
            outputLength,
            inputBuffer.sampleRate
        );

        // Process each channel
        for (let channel = 0; channel < numChannels; channel++) {
            const inputData = inputBuffer.getChannelData(channel);
            const outputData = outputBuffer.getChannelData(channel);
            
            await this.stretchChannel(inputData, outputData, stretchFactor);
        }

        return outputBuffer;
    }

    // WSOLA (Waveform Similarity Overlap-Add) algorithm for time stretching
    async stretchChannel(inputData, outputData, stretchFactor) {
        const frameSize = 1024;
        const searchRange = frameSize / 2;
        
        let inputPos = 0;
        let outputPos = 0;
        
        // Copy first frame directly
        for (let i = 0; i < frameSize && i < inputData.length && i < outputData.length; i++) {
            outputData[i] = inputData[i];
        }
        
        outputPos = frameSize / 2;
        
        while (outputPos < outputData.length - frameSize) {
            // Calculate ideal input position
            const idealInputPos = outputPos / stretchFactor;
            
            // Find best matching position within search range
            let bestPos = Math.floor(idealInputPos);
            let bestCorrelation = -Infinity;
            
            const searchStart = Math.max(0, Math.floor(idealInputPos - searchRange));
            const searchEnd = Math.min(inputData.length - frameSize, Math.floor(idealInputPos + searchRange));
            
            // Find best correlation
            for (let pos = searchStart; pos < searchEnd; pos++) {
                const correlation = this.calculateCorrelation(
                    outputData, outputPos - frameSize/2,
                    inputData, pos,
                    frameSize/2
                );
                
                if (correlation > bestCorrelation) {
                    bestCorrelation = correlation;
                    bestPos = pos;
                }
            }
            
            // Overlap-add the best matching frame
            this.overlapAdd(
                inputData, bestPos,
                outputData, outputPos,
                frameSize,
                this.windowFunction
            );
            
            outputPos += frameSize / 2;
        }
    }

    // Calculate normalized cross-correlation
    calculateCorrelation(data1, pos1, data2, pos2, length) {
        let sum = 0;
        let sum1 = 0;
        let sum2 = 0;
        
        for (let i = 0; i < length; i++) {
            const val1 = data1[pos1 + i] || 0;
            const val2 = data2[pos2 + i] || 0;
            sum += val1 * val2;
            sum1 += val1 * val1;
            sum2 += val2 * val2;
        }
        
        return sum / Math.sqrt(sum1 * sum2 + 1e-10);
    }

    // Overlap-add with window function
    overlapAdd(inputData, inputPos, outputData, outputPos, frameSize, window) {
        for (let i = 0; i < frameSize; i++) {
            if (inputPos + i < inputData.length && outputPos + i < outputData.length) {
                if (i < frameSize / 2) {
                    // Fade out existing + fade in new
                    const fadeOut = 1 - (i / (frameSize / 2));
                    const fadeIn = i / (frameSize / 2);
                    outputData[outputPos + i] = outputData[outputPos + i] * fadeOut + 
                                               inputData[inputPos + i] * fadeIn;
                } else {
                    // Direct copy for second half
                    outputData[outputPos + i] = inputData[inputPos + i];
                }
            }
        }
    }

    // Create a time-stretched source node
    createStretchedSource(buffer, playbackRate) {
        const source = this.audioContext.createBufferSource();
        
        if (Math.abs(playbackRate - 1.0) < 0.01) {
            // No stretching needed
            source.buffer = buffer;
        } else {
            // Apply time stretching
            const stretchedBuffer = this.processBuffer(buffer, 1 / playbackRate);
            source.buffer = stretchedBuffer;
        }
        
        return source;
    }
}
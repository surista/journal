// YouTube Audio Processor - Stub implementation
// This file provides the interface for YouTube audio processing
// The actual implementation would require browser extension capabilities

export const youtubeAudioProcessor = {
    isCurrentlyProcessing() {
        return false;
    },

    stopProcessing() {},

    async startTabAudioCapture() {
        console.warn('YouTube audio capture requires browser extension');
        return false;
    },

    setPitch(pitchAmount) {},

    // Additional methods that might be needed
    isAvailable() {
        return false;
    },

    getStatus() {
        return 'unavailable';
    }
};

// For compatibility
export default youtubeAudioProcessor;

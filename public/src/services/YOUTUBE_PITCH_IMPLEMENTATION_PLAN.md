# YouTube Pitch Shifting Implementation Plan

## Overview
Implementing true pitch shifting (without tempo change) for YouTube videos in a web app faces several technical challenges. Here's a comprehensive plan with multiple approaches.

## Approach 1: Web Audio API with Tab Capture (Recommended)

### Steps:
1. **Capture Tab Audio**
   - Use `getDisplayMedia()` with audio-only capture
   - Mute the original YouTube player to prevent double audio
   - Route captured audio through Web Audio API

2. **Implement Pitch Shifting Algorithm**
   - Use Phase Vocoder algorithm for time-stretching
   - Implement PSOLA (Pitch Synchronous Overlap and Add)
   - Or use granular synthesis for real-time processing

3. **Audio Processing Pipeline**
   ```
   Tab Audio → MediaStreamSource → PitchShiftNode → Destination
   ```

### Implementation:
```javascript
// 1. Capture audio from tab
const stream = await navigator.mediaDevices.getDisplayMedia({
    audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
    },
    video: false
});

// 2. Create audio context and nodes
const audioContext = new AudioContext();
const source = audioContext.createMediaStreamSource(stream);
const pitchShifter = await createPitchShiftNode(audioContext);

// 3. Connect and process
source.connect(pitchShifter);
pitchShifter.connect(audioContext.destination);
```

### Challenges:
- Requires user permission for tab capture
- May capture all tab audio (not just YouTube)
- Latency issues with processing

## Approach 2: AudioWorklet for Real-time Processing

### Steps:
1. **Create Custom AudioWorklet**
   - Implement pitch shifting algorithm in worklet
   - Use circular buffer for time-domain processing
   - Apply windowing for smooth transitions

2. **Optimize Performance**
   - Use WASM for computationally intensive parts
   - Implement efficient FFT using Web Assembly
   - Minimize latency with small buffer sizes

### Implementation:
```javascript
// Create and register worklet
await audioContext.audioWorklet.addModule('pitch-shift-worklet.js');
const pitchNode = new AudioWorkletNode(audioContext, 'pitch-shift-processor');
```

## Approach 3: External Library Integration

### Options:
1. **Tone.js** - Already in the project
   - Use `Tone.PitchShift` with modified settings
   - Implement custom grain size for better quality

2. **SoundTouch.js** - Dedicated pitch shifting
   - Port of SoundTouch C++ library
   - High-quality time-stretching and pitch shifting

3. **Essentia.js** - Advanced audio analysis
   - Includes pitch shifting algorithms
   - More complex but higher quality

### Implementation with SoundTouch:
```javascript
import { SoundTouch, SimpleFilter } from 'soundtouchjs';

const soundTouch = new SoundTouch();
soundTouch.pitch = Math.pow(2, semitones / 12);
soundTouch.tempo = 1.0; // Preserve tempo

const filter = new SimpleFilter(soundTouch, bufferSize);
```

## Approach 4: Hybrid Solution

### Concept:
Combine multiple techniques for best results:

1. **For Chrome/Edge**: Use experimental APIs
   - `AudioContext.createMediaStreamTrackSource()`
   - Direct access to media element audio track

2. **For Firefox**: Use extension messaging
   - Create companion extension for audio routing
   - Communicate via `postMessage`

3. **Fallback**: Proxy audio through service
   - Route audio through server-side processor
   - Stream back processed audio

## Implementation Strategy

### Phase 1: Basic Implementation
1. Implement tab audio capture with muting
2. Add simple pitch shifting using ScriptProcessor
3. Handle user permissions and errors gracefully

### Phase 2: Optimization
1. Migrate to AudioWorklet for better performance
2. Implement advanced pitch shifting algorithm
3. Add quality settings (low/medium/high)

### Phase 3: Enhanced Features
1. Add formant preservation option
2. Implement pitch detection for auto-tune
3. Add reverb/effects post-processing

## Technical Considerations

### Latency Management
- Target < 50ms total latency
- Use smaller buffer sizes (256-512 samples)
- Implement look-ahead buffer for smoother playback

### Quality vs Performance
- Offer quality presets
- Adapt processing based on CPU usage
- Implement graceful degradation

### Browser Compatibility
- Feature detection for AudioWorklet
- Fallback to ScriptProcessor
- Clear messaging for unsupported browsers

## Alternative Solutions

If in-app processing proves impossible:

1. **Browser Extension**
   - Create dedicated extension
   - Direct access to tab audio
   - Better performance and control

2. **Desktop App Integration**
   - Electron app with virtual audio cable
   - System-level audio routing
   - Professional-grade processing

3. **Cloud Processing**
   - Stream audio to server
   - Process with professional tools
   - Stream back in real-time

## Next Steps

1. Test tab audio capture with current YouTube implementation
2. Implement basic pitch shifter with ScriptProcessor
3. Measure latency and quality
4. Iterate based on results

Would you like me to start implementing any of these approaches?
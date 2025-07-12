# Guitar Practice Journal - Manual Test Checklist

## Test Environment Setup
- [ ] Test Audio File: `/assets/audio/Tightrope.mp3` 
- [ ] Test YouTube URL: `https://www.youtube.com/watch?v=rXIoV3g3Yjo`
- [ ] Browser: Chrome/Firefox/Safari (latest version)
- [ ] Clear browser cache and localStorage before testing

## 1. Practice Log Tests

### 1.1 Save Practice Session
- [ ] Navigate to the app
- [ ] Click "Log Practice" or navigate to practice form
- [ ] Fill in practice details:
  - Duration: Set to 30 minutes
  - Notes: "Test practice session"
  - Topics: Add "Scales" and "Chord Changes"
  - Goals: Add "Improve speed" and "Clean tone"
- [ ] Click "Save Session"
- [ ] Verify success message appears
- [ ] Check that session appears in practice history

### 1.2 View Practice History
- [ ] Navigate to Dashboard or Calendar view
- [ ] Verify the test session appears with correct details
- [ ] Click on the session to view details
- [ ] Verify all information is displayed correctly

## 2. Audio File Tests

### 2.1 Load Audio File
- [ ] Navigate to Audio Player tab
- [ ] Click "Choose File" or drag and drop
- [ ] Select `/assets/audio/Tightrope.mp3`
- [ ] Verify file loads successfully
- [ ] Verify audio waveform appears (if applicable)
- [ ] Click Play and verify audio plays

### 2.2 Audio Controls
- [ ] Test Play/Pause button
- [ ] Test volume control
- [ ] Test seek/scrub through timeline
- [ ] Test pitch adjustment (-12 to +12 semitones)
- [ ] Test tempo adjustment (50% to 150%)

## 3. YouTube Integration Tests

### 3.1 Load YouTube Video
- [ ] Navigate to YouTube tab or section
- [ ] Enter URL: `https://www.youtube.com/watch?v=rXIoV3g3Yjo`
- [ ] Click Load/Submit
- [ ] Verify video player appears
- [ ] Verify video can be played

### 3.2 YouTube Controls
- [ ] Test Play/Pause
- [ ] Test seeking through video
- [ ] Test volume control
- [ ] Verify sync with timer (if applicable)

## 4. Loop Functionality Tests

### 4.1 Create Loops (Audio File)
- [ ] Load the test audio file
- [ ] Create Loop 1:
  - Name: "Intro"
  - Start: 0:00
  - End: 0:30
  - Color: Red
- [ ] Create Loop 2:
  - Name: "Verse"
  - Start: 0:30
  - End: 1:30
  - Color: Green
- [ ] Create Loop 3:
  - Name: "Chorus"
  - Start: 1:30
  - End: 2:00
  - Color: Blue
- [ ] Verify loops appear in loop list
- [ ] Click each loop to test playback

### 4.2 Save and Load Loops
- [ ] After creating loops, refresh the page
- [ ] Load the same audio file
- [ ] Verify loops are restored
- [ ] Test editing a loop name
- [ ] Test deleting a loop
- [ ] Verify changes persist after refresh

### 4.3 Create Loops (YouTube)
- [ ] Load the test YouTube video
- [ ] Create at least 2 loops with different sections
- [ ] Test loop playback
- [ ] Verify loops are saved
- [ ] Refresh and verify loops persist

## 5. Metronome Tests

### 5.1 Basic Functionality
- [ ] Navigate to Metronome tab
- [ ] Click anywhere to enable audio (if prompted)
- [ ] Click Start button
- [ ] Verify metronome plays at 120 BPM
- [ ] Verify beat indicators light up in sequence

### 5.2 BPM Adjustment
- [ ] Test BPM slider (30-300 BPM)
- [ ] Test +/- buttons (+1, +5, +10, -1, -5, -10)
- [ ] Test TAP tempo feature (tap 4-8 times)
- [ ] Verify BPM updates correctly

### 5.3 Time Signature
- [ ] Change to 3/4 time
- [ ] Verify display shows "3/4" (not stuck on 4/4)
- [ ] Verify only 3 beat indicators show
- [ ] Test 2/4 and 6/8 time signatures

### 5.4 Accent Pattern
- [ ] Click accent pattern buttons
- [ ] Verify accented beats sound different
- [ ] Verify visual indicators update

## 6. Timer Tests

### 6.1 Basic Timer
- [ ] Start timer
- [ ] Verify time counts up
- [ ] Pause timer
- [ ] Verify time stops
- [ ] Resume timer
- [ ] Verify time continues from pause point
- [ ] Stop/Reset timer
- [ ] Verify time resets to 00:00:00

### 6.2 Timer Sync
- [ ] Enable "Sync with Audio" (if available)
- [ ] Start audio playback
- [ ] Verify timer starts automatically
- [ ] Pause audio
- [ ] Verify timer pauses
- [ ] Test with metronome sync

## 7. Data Persistence Tests

### 7.1 Local Storage
- [ ] Create a practice session
- [ ] Add some loops to audio/video
- [ ] Set custom metronome settings
- [ ] Close browser completely
- [ ] Reopen app
- [ ] Verify all data is retained:
  - [ ] Practice sessions
  - [ ] Loops
  - [ ] Settings

### 7.2 Cross-Tab Sync
- [ ] Open app in two browser tabs
- [ ] Start timer in tab 1
- [ ] Verify timer syncs to tab 2
- [ ] Change settings in tab 1
- [ ] Verify settings update in tab 2

## 8. Error Handling Tests

### 8.1 Invalid Inputs
- [ ] Try loading non-existent audio file
- [ ] Try invalid YouTube URL
- [ ] Try creating loop with end time before start time
- [ ] Verify appropriate error messages appear

### 8.2 Browser Compatibility
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari (if on Mac)
- [ ] Test in Edge
- [ ] Verify all features work consistently

## 9. Performance Tests

### 9.1 Large Data
- [ ] Create 50+ practice sessions
- [ ] Verify app remains responsive
- [ ] Test loading large audio file (if available)
- [ ] Create 20+ loops
- [ ] Verify smooth playback

### 9.2 Memory Usage
- [ ] Use app for extended period (30+ minutes)
- [ ] Switch between tabs frequently
- [ ] Load/unload multiple audio files
- [ ] Monitor browser memory usage
- [ ] Verify no memory leaks

## Test Results Summary

- Date Tested: _______________
- Browser/Version: _______________
- Total Tests: 89
- Passed: _____
- Failed: _____
- Blocked: _____

## Issues Found

1. Issue: _______________
   - Steps to reproduce: _______________
   - Expected: _______________
   - Actual: _______________

2. Issue: _______________
   - Steps to reproduce: _______________
   - Expected: _______________
   - Actual: _______________

## Notes
- Always test with actual user interactions (clicks, not programmatic)
- Test both mouse and keyboard interactions where applicable
- Pay attention to visual feedback and loading states
- Note any console errors during testing
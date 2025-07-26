# Changelog

All notable changes to the Guitar Practice Journal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [10.92] - 2025-01-24

### Added
- Audio file names are now saved and displayed in practice history
- Audio file names included in CSV export
- YouTube speed progression feature with percentage-based increases
- Visual feedback for metronome tempo progression (current BPM, measure progress, animations)
- Missing --text-tertiary CSS variable to 18 theme files

### Changed
- Cloud sync UI buttons now have consistent widths
- Footer and info pages text colors now use CSS variables for proper theme support
- Modal text is now selectable and uses appropriate theme colors

### Fixed
- Timer not syncing with audio/YouTube playback when "Start timer with audio" is checked
- Metronome BPM changes not applying during playback
- Metronome freezing when adjusting tempo progression while playing
- Tempo progression showing wrong BPM values (defaults instead of user settings)
- Tempo progression display visibility issues (background blending)
- Text not visible in Features modal and other info modals
- Footer links text color incorrect in some themes

## [10.89] - 2025-01-24

### Added
- YouTube loop saving functionality with persistent storage
- Save loop button for both audio and YouTube players
- Keyboard shortcut (L) to toggle loop in YouTube mode
- Restore session modal with proper close functionality (X button, Escape key, background click)
- Global promise rejection handler for better error handling

### Changed
- YouTube play/pause button now properly syncs with video state
- Achievement badges now show only names with descriptions on hover
- YouTube controls layout now matches audio player layout exactly
- Consolidated duplicate loop controls in YouTube player
- Firebase App Check errors are now handled gracefully without blocking app startup

### Fixed
- YouTube play button icon not updating when video is playing/paused
- YouTube save loop button not appearing when loop is set
- YouTube waveform click causing video to freeze
- Duplicate loop controls in YouTube interface
- Promise rejection errors during app initialization
- SoundTouch library loading errors
- App error screen appearing due to non-critical Firebase App Check warnings

### Technical Improvements
- Better error handling for Firebase App Check ReCAPTCHA initialization
- Non-blocking initialization for optional services
- Dynamic script loading with error handling for external libraries
- Improved promise rejection handling to differentiate critical vs non-critical errors

## [10.88] - Previous Release

### Features
- Core practice tracking functionality
- Audio file pitch/tempo adjustment
- YouTube video integration
- Metronome with timer sync
- Practice statistics and achievements
- Cloud sync with Firebase (beta)
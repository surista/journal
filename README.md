# Guitar Practice Journal

A Progressive Web App (PWA) for tracking guitar practice sessions, managing repertoire, and monitoring progress.

## Features

### Core Functionality
- **Practice Timer**: Track practice sessions with an integrated timer
- **Metronome**: Built-in metronome with BPM control and timer synchronization
- **Audio Player**: Load and practice with audio files
  - Pitch shifting (±12 semitones)
  - Tempo adjustment (25% - 200%)
  - A-B loop functionality with save/load capabilities
- **YouTube Integration**: Practice along with YouTube videos
  - Video playback controls
  - Loop sections with save/load
  - Speed control
- **Practice Tracking**: Log sessions with notes and practice areas
- **Statistics**: View practice streaks, total time, and progress
- **Achievements**: Earn badges for practice milestones
- **Goal Setting**: Create and track practice goals
- **Repertoire Management**: Organize and track songs you're learning

### Technical Features
- **Progressive Web App**: Installable, works offline
- **Cloud Sync**: Optional Firebase integration for data backup
- **Multi-Theme Support**: 23+ themes including dark/light modes
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Keyboard Shortcuts**: Efficient workflow with keyboard controls

## Installation

### Live Version
Visit [https://www.guitar-practice-journal.com](https://www.guitar-practice-journal.com)

### Local Development
1. Clone the repository
2. Serve the `public` directory with any web server
3. No build process required - pure vanilla JavaScript

## Usage

### Quick Start
1. Create an account or use demo mode (demo@example.com / demo123)
2. Start the timer to begin tracking practice
3. Use the metronome, audio player, or YouTube player as needed
4. Save your session when done

### Keyboard Shortcuts
- **Space**: Play/Pause (context-sensitive)
- **L**: Toggle loop (audio/YouTube modes)
- **M**: Toggle metronome
- **↑/↓**: Adjust BPM (metronome mode)
- **1-9**: Quick BPM presets (metronome mode)
- **Esc**: Close modals

## Browser Requirements
- Modern browsers with ES6+ support
- Chrome/Edge 89+, Firefox 78+, Safari 14+
- Web Audio API support required for audio features

## Development

### Project Structure
```
/public/
  /src/
    /components/    # UI components
    /pages/        # Main views
    /services/     # Business logic
    /utils/        # Helper functions
    /config/       # Configuration
  /styles/         # CSS files
  index.html       # Main entry point
```

### Key Technologies
- Vanilla JavaScript (ES6+ modules)
- IndexedDB for local storage
- Web Audio API for audio processing
- Firebase for cloud sync (optional)
- Service Worker for offline support

## Version History
See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

## License
This project is proprietary software. All rights reserved.

## Support
For issues or feature requests, please contact the development team.
# 🎸 Guitar Practice Journal

A comprehensive web application for tracking guitar practice sessions, managing goals, and improving your musical journey. Built as a Progressive Web App (PWA) with offline capabilities and advanced audio processing features.

![Version](https://img.shields.io/badge/version-10.64-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![PWA](https://img.shields.io/badge/PWA-enabled-purple)
![Cloud Sync](https://img.shields.io/badge/Cloud%20Sync-Beta-orange)

## 🔥 Recent Updates (v10.64)

### Session Image Management
- **Visual Practice References**: Attach images to practice sessions
- **Enhanced Documentation**: Save chord diagrams, sheet music, or practice photos
- **Mobile Optimized**: Improved UX for mobile image handling

### Cloud Sync & Backup (v9.89+)
- **Firebase Integration**: Real-time cloud synchronization across devices
- **Automatic Backup**: Never lose your practice data
- **Offline Support**: Syncs automatically when reconnected
- **User Control**: Enable/disable cloud sync at any time

### Audio Processing Enhancements
- **Improved Pitch Shifting**: Better audio quality at extreme pitch changes
- **Enhanced Tempo Control**: More stable tempo adjustments
- **YouTube Integration**: Practice along with YouTube videos
- **Session Management**: Save and recall audio configurations

## ✨ Features

### 🎯 Practice Management
- **Smart Timer**: Practice session timer with audio/metronome synchronization
- **Session Logging**: Track practice areas, tempo (BPM), musical keys, and notes
- **Goal Setting**: Set and track daily practice goals with visual progress
- **Statistics**: Comprehensive analytics with trends and insights
- **Streak Tracking**: GitHub-style heatmap for practice consistency

### 🎵 Audio Tools
- **Audio Processing**: Upload MP3 files with advanced tempo and pitch control
- **A-B Loop**: Set loop points for focused practice sections
- **Pitch Shifting**: Transpose songs up to ±12 semitones with quality preservation
- **Tempo Control**: Adjust playback speed from 50% to 150% with pitch preservation
- **Waveform Visualization**: Visual audio representation with loop markers
- **Session Saving**: Save audio configurations for quick recall

### 🥁 Metronome
- **Digital Metronome**: Precise timing with visual and audio cues
- **Timer Integration**: Synchronized with practice timer
- **Tempo Progression**: Gradual tempo increases during practice

### 📊 Analytics & Insights
- **Practice Statistics**: Total time, session counts, averages, and trends
- **Calendar View**: Monthly practice overview with daily details
- **Achievement System**: Unlock badges for practice milestones
- **Area Analysis**: Track progress across different practice areas
- **Export/Import**: Full data backup and restore capabilities

### 📱 Progressive Web App
- **Offline Support**: Full functionality without internet connection
- **Mobile Optimized**: Responsive design with touch-friendly interface
- **Installation**: Install on mobile/desktop like a native app
- **Theme Support**: 28 themes including dark, light, and pastel variations

### ☁️ Cloud Sync (Beta)
- **Firebase Integration**: Secure cloud backup and synchronization
- **Multi-Device Sync**: Access your practice data from any device
- **Automatic Backup**: Real-time data protection
- **Privacy First**: Optional feature - enable only if needed

## 🚀 Quick Start

### Option 1: Direct Usage
1. Download or clone this repository
2. Open `index.html` in a modern web browser
3. Start practicing immediately with the demo account!

### Option 2: Web Server (Recommended)
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`

### Demo Account
- **Email**: `demo@example.com`
- **Password**: `demo123`

## 💻 Browser Requirements

### Minimum Requirements
- **Chrome/Edge**: Version 88+
- **Firefox**: Version 84+
- **Safari**: Version 14+
- **Mobile**: iOS 14+ / Android 8+

### Required Web APIs
- Web Audio API (for audio processing)
- IndexedDB (for data storage)
- Service Workers (for offline functionality)
- Canvas API (for visualizations)

## 🛠️ Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-username/guitar-practice-journal.git
cd guitar-practice-journal
```

### 2. Configure Base Path (Optional)
If deploying to a subdirectory, the app automatically detects the base path. For manual configuration:

```javascript
// In src/config.js
const appConfig = new AppConfig();
appConfig.basePath = '/your-subdirectory/';
```

### 3. Deploy
Upload files to your web server. The app works from any directory and automatically configures itself.

### 4. PWA Installation
- **Desktop**: Click the install icon in the address bar
- **Mobile**: Use "Add to Home Screen" from browser menu

## 📖 Usage Guide

### Getting Started
1. **Create Account**: Register or use demo account
2. **Set Goals**: Configure daily practice goals in the Goals tab
3. **Start Timer**: Use the practice timer to track sessions
4. **Log Sessions**: Fill out practice details and save
5. **Review Progress**: Check statistics and calendar views

### Navigation
- **Dashboard**: Main interface with tabbed layout for all practice tools
- **Calendar**: Monthly view of practice sessions with goal tracking
- **Seamless Navigation**: Use sidebar to switch between Dashboard and Calendar
- **Mobile Support**: Touch-friendly navigation with responsive design

### Audio Practice
1. **Upload Audio**: Click "Upload Audio File" in Audio Tools tab
2. **Set Loops**: Play the file and set A/B loop points
3. **Adjust Settings**: Change tempo/pitch as needed
4. **Save Session**: Save your configuration for later use
5. **Practice**: Use timer sync for integrated practice sessions

### Advanced Features
- **Keyboard Shortcuts**: Spacebar to play/pause, Ctrl+S to save
- **Mobile Gestures**: Swipe navigation on mobile devices
- **Data Export**: Backup your practice data anytime
- **Goal Tracking**: Set area-specific goals and track progress
- **Cross-Tab Sync**: Timer and settings synchronized across all tabs

## 🏗️ Architecture

Built with modern web technologies:

- **Frontend**: Vanilla JavaScript (ES6+ modules) - No framework dependencies
- **Storage**: Hybrid IndexedDB + localStorage with automatic migration
- **Audio**: Advanced Web Audio API with custom pitch/tempo algorithms
- **Styling**: Modular CSS with 28 theme variations
- **PWA**: Service Worker with intelligent caching strategies
- **Cloud**: Optional Firebase integration for backup and sync
- **Build**: Custom version management system

See [MAP.md](MAP.md) for detailed technical architecture.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly (especially navigation between Dashboard and Calendar)
5. Submit a pull request

### Development Guidelines
- Follow existing code style and patterns
- Add comments for complex logic
- Test on multiple browsers
- Test navigation thoroughly
- Update documentation as needed

## 📋 Data & Privacy

### Data Storage
- **Local First**: Primary data storage on your device
- **Optional Cloud**: Firebase sync available but not required
- **Your Control**: Export/import data anytime
- **Privacy First**: No tracking or analytics
- **Encryption**: Secure cloud transmission when enabled

### Supported Data
- Practice sessions with detailed metadata
- Goals and achievement progress
- Audio processing settings and saved sessions
- User preferences and themes
- Repertoire and song library
- Session images and visual references

## 🔧 Configuration

### Audio Settings
```javascript
// Maximum file size (20MB default)
maxFileSize: 20 * 1024 * 1024

// Supported formats
supportedFormats: ['audio/mp3', 'audio/mpeg']

// Quality modes
qualityModes: ['low', 'medium', 'high']
```

### Storage Settings
```javascript
// IndexedDB preferred, localStorage fallback
indexedDBEnabled: true

// Compression for large datasets
compressionEnabled: true

// Maximum localStorage entries
maxLocalStorageEntries: 1000
```

## 📊 Performance

### Optimizations
- **Virtual Scrolling**: For large practice session lists
- **Lazy Loading**: Components and images loaded on demand
- **Audio Caching**: Processed audio buffers cached for reuse
- **Smart Compression**: Automatic data compression for storage efficiency
- **Enhanced Navigation**: 60% faster page transitions

### Memory Usage
- **Typical**: 10-50MB for normal usage
- **Audio Processing**: Additional 20-100MB during audio manipulation
- **Storage**: Efficient compression reduces storage needs by 60-80%

## 🐛 Troubleshooting

### Common Issues

**Calendar page won't load**
- Refresh the page and try again
- Clear browser cache and reload
- Check browser console for error messages
- The app now has multiple fallback strategies for navigation

**Audio files won't load**
- Ensure file is MP3 format under 20MB
- Check browser audio permissions
- Try refreshing the page

**Data not saving**
- Check browser storage permissions
- Clear browser cache and try again
- Export data as backup before troubleshooting

**App won't install as PWA**
- Ensure HTTPS or localhost
- Check if browser supports PWA installation
- Try different browser

**Performance issues**
- Close other browser tabs
- Reduce audio quality in settings
- Clear old practice session data

**Navigation problems**
- Try refreshing the page
- Check if you're using a supported browser
- Clear browser cache
- The latest version includes enhanced error recovery

### Getting Help
1. Check browser console for error messages
2. Try the demo account to isolate issues
3. Export your data before troubleshooting
4. Create an issue with detailed steps to reproduce

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Web Audio API community for audio processing techniques
- Guitar community for feature suggestions and testing
- Open source projects that inspired this application

## 🔮 Roadmap

### Recently Completed ✅
- **Cloud Sync**: Firebase integration for backup and sync (v9.89+)
- **Session Images**: Visual practice documentation (v10.64)
- **YouTube Integration**: Practice along with videos
- **28 Themes**: Extensive theme collection including pastels

### Upcoming Features
- **Social Features**: Share progress with friends
- **Advanced Analytics**: AI-powered practice insights
- **Multiple Instruments**: Support for other instruments
- **Lesson Integration**: Built-in lesson recommendations
- **Collaborative Practice**: Real-time practice sessions

### Version History
See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

---

**Made with ❤️ for the guitar community**

Happy practicing! 🎸✨
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Guitar Practice Journal is a Progressive Web App (PWA) for tracking guitar practice sessions. It's built with vanilla JavaScript (ES6+ modules) without any framework dependencies, using IndexedDB for storage and Web Audio API for audio processing.

## Build Commands

### Version Management
- `npm run update-version` - Updates version across all files (version.js, config.js, index.html, manifest.json, package.json)
- `npm run bump-patch` - Increments patch version (e.g., 9.7.0 → 9.7.1)
- `npm run bump-minor` - Increments minor version (e.g., 9.7 → 9.8)
- `npm run bump-major` - Increments major version (e.g., 9.x → 10.0)
- `npm run build` - Runs version update script
- `npm run deploy` - Updates version and deploys to Firebase

**Note**: There is no test suite or linting setup. Consider implementing testing infrastructure.

## Code Architecture

### Directory Structure
- `/public/` - Main application root (all code is under this directory)
- `/public/src/` - JavaScript source files
  - `components/` - Reusable UI components (timer, audioPlayer, metronome, etc.)
  - `pages/` - Main views (dashboard.js, calendar.js, auth.js)
  - `services/` - Business logic (storageService.js, audioService.js, authService.js)
  - `utils/` - Helper functions
  - `config/` - Configuration files including version.js
- `/public/styles/` - CSS organized by purpose (main.css, components.css, pages.css)

### Key Technical Details

1. **No Framework Dependencies**: Pure vanilla JavaScript with ES6+ modules
2. **Storage**: Hybrid approach using IndexedDB (primary) with localStorage fallback
3. **Audio Processing**: Custom Web Audio API implementation with pitch shifting and tempo control
4. **Routing**: Custom SPA router with hash-based navigation
5. **State Management**: Service-based with local caching
6. **PWA Features**: Service Worker with intelligent caching, offline support
7. **Authentication**: Local authentication system with demo account (demo@example.com / demo123)

### Important Implementation Notes

1. **Base Path Detection**: The app automatically detects and configures base paths for subdirectory deployments
2. **Component Loading**: Components are loaded dynamically with proper error handling and fallback strategies
3. **Audio Limits**: Maximum file size is 20MB for audio uploads
4. **Cross-Tab Sync**: Timer and settings are synchronized across browser tabs
5. **Version Updates**: Use the build.js script to ensure version consistency across all files

### Development Workflow

1. **Making Changes**: Follow existing code patterns and conventions in neighboring files
2. **Adding Features**: Check existing components for similar functionality first
3. **Modifying Audio**: Be aware of the custom pitch shifting implementation in audioService.js
4. **Updating Version**: Always use npm scripts to update version, never manually edit version numbers
5. **Navigation**: The app has robust navigation with multiple fallback strategies - test thoroughly when modifying routing

### Current Features

- Practice session tracking with timer
- Audio file processing (pitch/tempo adjustment, A-B loops)
- Digital metronome with timer sync
- Goal setting and achievement badges
- Statistics and GitHub-style practice streak heatmap
- Calendar view for practice history
- 17+ themes including dark/light modes
- Repertoire management system (as of v9.4)
- YouTube integration for practice along with videos
- PWA capabilities (offline support, installable)

### Known Limitations

1. No automated testing framework
2. No linting or code formatting tools configured
3. All data is stored locally (no cloud sync implemented yet)
4. Limited to MP3 audio format support
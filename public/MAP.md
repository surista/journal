# Guitar Practice Journal - Project Architecture Map

## 🏗️ Core Structure

```
guitar-practice-journal/
├── index.html              # Main entry point with dynamic base path detection
├── service-worker.js       # PWA offline functionality
├── manifest.json          # PWA manifest
├── src/
│   ├── app.js              # Main application controller & routing
│   ├── config.js           # Centralized configuration system
│   ├── components/         # Reusable UI components
│   │   ├── timer.js        # Practice session timer with sync
│   │   ├── audioPlayer.js  # Audio processing & effects UI
│   │   ├── practiceForm.js # Session logging form
│   │   ├── metronome.js    # Digital metronome
│   │   ├── goalsList.js    # Practice goals management
│   │   ├── statsPanel.js   # Statistics dashboard
│   │   ├── streakHeatMap.js# GitHub-style practice heatmap
│   │   ├── achievementBadges.js # Gamification badges
│   │   ├── waveform.js     # Audio waveform visualization
│   │   ├── VirtualScrollList.js # Performance optimization
│   │   └── LazyImage.js    # Lazy loading images
│   ├── pages/              # Main application views
│   │   ├── dashboard.js    # Primary interface (tabbed layout)
│   │   ├── calendar.js     # Practice calendar view
│   │   └── auth.js         # User authentication
│   ├── services/           # Business logic & data management
│   │   ├── storageService.js    # Hybrid IndexedDB + localStorage
│   │   ├── indexedDBService.js  # IndexedDB wrapper
│   │   ├── audioService.js      # Web Audio API processing
│   │   ├── authService.js       # Local authentication
│   │   ├── notificationManager.js # User notifications
│   │   ├── themeService.js      # Dark/light theme
│   │   └── pushNotificationService.js # PWA notifications
│   └── utils/              # Helper functions & utilities
│       ├── helpers.js      # Time formatting, compression, debouncing
│       └── router.js       # SPA routing with config integration
└── styles/
    ├── main.css           # Global styles, variables, typography
    ├── components.css     # Component-specific styles
    └── pages.css          # Page-specific styles
```

## 🔧 Technology Stack

### **Frontend Architecture**
- **Framework**: Vanilla JavaScript (ES6+ modules)
- **Architecture Pattern**: Component-based with service layer
- **Routing**: Custom SPA router with hash-based navigation
- **State Management**: Service-based with local caching

### **Storage Technology**
- **Primary**: IndexedDB (for large datasets)
- **Fallback**: localStorage (with compression)
- **Migration**: Automatic localStorage → IndexedDB
- **Caching**: In-memory cache with TTL

### **Audio Processing**
- **Engine**: Web Audio API
- **Features**: Custom pitch shifting, tempo control, loop processing
- **Quality**: Adaptive quality modes (low/medium/high)
- **Formats**: MP3 support with 20MB limit

### **PWA Features**
- **Service Worker**: Dynamic caching with configurable base paths
- **Offline**: Full offline functionality
- **Installation**: Installable on mobile/desktop
- **Notifications**: Practice reminders

## 🏛️ Application Architecture

### **Main Application Flow**
```
index.html
    ↓ (loads)
app.js (App class)
    ↓ (initializes)
config.js (centralized settings)
    ↓ (configures)
authService.js (check authentication)
    ↓ (if authenticated)
storageService.js (initialize data layer)
    ↓ (route to)
dashboard.js OR calendar.js OR auth.js
```

### **Component Hierarchy**
```
Dashboard (main container)
├── Sidebar Navigation
├── Top Bar (user info, theme toggle)
├── Tab Content Container
│   ├── Practice Tab
│   │   ├── Compact Timer (sticky)
│   │   ├── Practice Form (collapsible)
│   │   └── Stats Widgets
│   ├── Audio Tools Tab
│   │   ├── Audio Player
│   │   ├── Waveform Visualizer
│   │   └── Saved Sessions
│   ├── Metronome Tab
│   ├── Goals Tab
│   │   ├── Goals List
│   │   └── Achievement Badges
│   ├── Statistics Tab
│   │   ├── Stats Panel
│   │   └── Streak Heat Map
│   └── History Tab
│       └── Virtual Scroll List
└── Mobile FAB (floating action button)
```

## 🔄 Data Flow Architecture

### **Storage Layer**
```
User Input → Component → Service → Storage
                           ↓
IndexedDB (primary) ←→ localStorage (fallback)
     ↓                        ↓
Cache Layer ←→ Compression ←→ Migration
     ↓
Component Updates
```

### **Audio Processing Pipeline**
```
File Upload → AudioService → Web Audio API
                    ↓
            Buffer Processing → Pitch Shifter
                    ↓
            Quality Control → Output
                    ↓
            Timer Sync ←→ Metronome Sync
```

### **Authentication Flow**
```
App Start → AuthService.getCurrentUser()
              ↓
         User Found? → Yes → StorageService(userId)
              ↓              ↓
             No           Dashboard
              ↓
         Auth Page → Login/Register
              ↓
         Success → StorageService
              ↓
         Dashboard
```

## 🎯 Core Features Architecture

### **1. Practice Timer System**
- **Components**: Timer, CompactTimer (dashboard integration)
- **Features**: Start/stop/reset, goal tracking, sync with audio/metronome
- **Storage**: Preferences in localStorage
- **Notifications**: Session milestones, goal completion

### **2. Audio Processing System**
- **Core**: AudioService with ImprovedPitchShifter
- **Features**: Tempo/pitch control, A-B loop, session saving
- **Quality Modes**: Adaptive performance-based adjustment
- **Integration**: Timer sync, waveform visualization

### **3. Data Management System**
- **Hybrid Storage**: IndexedDB + localStorage with automatic fallback
- **Features**: Compression, migration, export/import
- **Caching**: Smart caching with TTL for performance
- **Sync**: Cross-tab data synchronization

### **4. Practice Tracking System**
- **Components**: PracticeForm, StatsPanel, Calendar
- **Features**: Session logging, statistics, streak tracking
- **Analytics**: Trends, recommendations, goal progress
- **Visualization**: Heat maps, charts, progress bars

### **5. Goal & Achievement System**
- **Components**: GoalsList, AchievementBadges
- **Features**: Goal setting, progress tracking, gamification
- **Types**: Time goals, streak goals, area-specific goals
- **Rewards**: Badge system with visual feedback

## 🔌 Component Interfaces

### **Timer Component**
```javascript
// Key methods
timer.start() / stop() / reset()
timer.syncStart(componentName) / syncStop(componentName)
timer.getElapsedTime()

// Events
onTimeUpdate(elapsedTime)
onTimerStateChange(isRunning)
```

### **AudioPlayer Component**
```javascript
// Key methods
audioPlayer.loadAudioFile(file)
audioPlayer.setPlaybackRate(rate)
audioPlayer.setPitchShift(semitones)
audioPlayer.setLoopPoint(type) // 'start' or 'end'

// Integration
audioPlayer.setTimer(timer) // for sync
```

### **StorageService**
```javascript
// Practice entries
savePracticeEntry(entry) → Promise<entries[]>
getPracticeEntries() → Promise<entries[]>
getPracticeEntriesForDateRange(start, end) → Promise<entries[]>

// Goals
saveGoal(goal) → Promise<goals[]>
updateGoal(goalId, updates) → Promise<goal>

// Data management
exportData() → Promise<compressedData>
importData(data) → Promise<void>
```

## 🚀 Performance Optimizations

### **Virtual Scrolling**
- **Trigger**: Lists with >20 items
- **Implementation**: VirtualScrollList component
- **Used in**: History tab, large session lists

### **Lazy Loading**
- **Components**: Dynamic imports for tab content
- **Images**: LazyImage component with intersection observer
- **Audio**: On-demand audio context creation

### **Caching Strategy**
- **Storage Cache**: Recent entries, stats (1-minute TTL)
- **Component Cache**: Rendered components between tab switches
- **Audio Cache**: Processed audio buffers

### **Memory Management**
- **Audio**: Automatic grain cleanup in pitch shifter
- **DOM**: Virtual scrolling for large lists
- **Storage**: Compression for large datasets

## 🔐 Security & Privacy

### **Data Storage**
- **Local Only**: All data stored locally (IndexedDB/localStorage)
- **No Cloud**: No external data transmission
- **User Control**: Full export/import capability

### **Authentication**
- **Local**: Simple local authentication system
- **Demo Account**: Built-in demo@example.com for testing
- **Device-Based**: Account data tied to specific device

## 🎨 Styling Architecture

### **CSS Organization**
- **main.css**: Variables, reset, typography, utilities
- **components.css**: Component-specific styles with containment
- **pages.css**: Page layouts and responsive design

### **Design System**
- **Themes**: Dark (default) and light with CSS custom properties
- **Responsive**: Mobile-first with progressive enhancement
- **Performance**: CSS containment for complex components

### **Key Design Patterns**
- **Cards**: Consistent card-based layout
- **Gradients**: Primary/secondary color gradients
- **Animations**: Subtle transitions and hover effects
- **Typography**: System fonts with careful hierarchy

This architecture supports a scalable, maintainable, and performant guitar practice application with offline capabilities and rich audio processing features.
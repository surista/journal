# TypeScript Migration Plan - Guitar Practice Journal

## 📋 Executive Summary

This document outlines a precise, step-by-step plan to migrate the Guitar Practice Journal from JavaScript to TypeScript. The migration will be done incrementally over 6-8 weeks without disrupting development or introducing breaking changes.

## 🎯 Migration Goals

1. **Zero Downtime**: No disruption to existing functionality
2. **Incremental Approach**: Migrate file by file
3. **Type Safety**: Catch bugs at compile time
4. **Better DX**: Improved IntelliSense and refactoring
5. **Documentation**: Types as living documentation

## 📊 Current State Analysis

### File Count
```bash
# JavaScript files to migrate
src/: 89 .js files
├── components/: 34 files
├── services/: 14 files
├── pages/: 9 files
├── utils/: 5 files
└── config/: 2 files
```

### Complexity Assessment
- **Simple** (< 100 lines): 45 files
- **Medium** (100-300 lines): 28 files
- **Complex** (> 300 lines): 16 files

## 🗓️ Timeline & Phases

### Phase 0: Setup & Tooling (Week 1)
**Duration**: 3-5 days  
**Goal**: Configure TypeScript without breaking existing code

### Phase 1: Type Definitions (Week 1-2)
**Duration**: 5-7 days  
**Goal**: Define core interfaces and types

### Phase 2: Utilities & Config (Week 2)
**Duration**: 3-4 days  
**Goal**: Migrate simple, standalone files

### Phase 3: Services Layer (Week 3-4)
**Duration**: 10-12 days  
**Goal**: Type-safe service layer

### Phase 4: Components (Week 4-6)
**Duration**: 14-18 days  
**Goal**: Migrate all UI components

### Phase 5: Pages & Routes (Week 6-7)
**Duration**: 5-7 days  
**Goal**: Complete application migration

### Phase 6: Strict Mode (Week 7-8)
**Duration**: 5-7 days  
**Goal**: Enable strict type checking

## 📝 Detailed Implementation Plan

### Phase 0: Setup & Tooling

#### Day 1: Install Dependencies
```bash
npm install --save-dev typescript @types/node
npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install --save-dev @types/wicg-file-system-access  # For File System API
```

#### Day 2: Create tsconfig.json
```json
{
  "compilerOptions": {
    // Target modern browsers
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    
    // Allow gradual migration
    "allowJs": true,
    "checkJs": false,
    
    // Module resolution
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    
    // Start permissive
    "strict": false,
    "noImplicitAny": false,
    "strictNullChecks": false,
    
    // Output
    "outDir": "./dist",
    "rootDir": "./public",
    "removeComments": true,
    "sourceMap": true,
    
    // Decorators & JSX (if needed later)
    "experimentalDecorators": true,
    "jsx": "react",
    
    // Type checking
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": [
    "public/src/**/*",
    "public/*.js"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "public/test*.html"
  ]
}
```

#### Day 3: Update Build Scripts
```json
// package.json
{
  "scripts": {
    "build": "tsc && npm run copy-assets",
    "build:watch": "tsc --watch",
    "type-check": "tsc --noEmit",
    "copy-assets": "cp -r public/assets public/styles public/*.html dist/",
    "dev": "concurrently \"npm run build:watch\" \"npm run serve\"",
    "serve": "http-server dist -p 8000"
  },
  "devDependencies": {
    "concurrently": "^7.6.0",
    "http-server": "^14.1.1"
  }
}
```

#### Day 4: Create Type Declaration Files
```typescript
// public/src/types/global.d.ts
declare global {
  interface Window {
    APP_VERSION: string;
    APP_CONFIG: any;
    IS_MOBILE_DEVICE: boolean;
    MOBILE_TEST_MODE: boolean;
    cloudStorage: any;
    app: any;
    notificationManager: any;
  }
}

// Web APIs that might not be in lib.dom.d.ts
interface Navigator {
  vibrate?: (pattern: number | number[]) => boolean;
}

export {};
```

```typescript
// public/src/types/firebase.d.ts
declare module 'firebase/app' {
  // Add any missing Firebase types
}
```

### Phase 1: Type Definitions

#### Create Core Interfaces
```typescript
// public/src/types/models.ts
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  lastLogin: Date;
}

export interface PracticeSession {
  id: string;
  userId: string;
  date: Date;
  duration: number; // seconds
  practiceArea: PracticeArea;
  tempo?: number;
  key?: string;
  notes: string;
  goals: string[];
  audioFile?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PracticeArea = 
  | 'scales'
  | 'chords'
  | 'arpeggios'
  | 'songs'
  | 'technique'
  | 'theory'
  | 'ear-training'
  | 'sight-reading'
  | 'improvisation'
  | 'other';

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: 'minutes' | 'sessions' | 'days';
  timeframe: 'daily' | 'weekly' | 'monthly';
  practiceArea?: PracticeArea;
  isCompleted: boolean;
  createdAt: Date;
  completedAt?: Date;
}

export interface AudioSettings {
  volume: number; // 0-1
  pitch: number; // semitones, -12 to 12
  tempo: number; // 0.5 to 2
  loop: {
    enabled: boolean;
    start: number; // seconds
    end: number; // seconds
  };
}

export interface TimerState {
  elapsed: number; // seconds
  isRunning: boolean;
  startTime: number | null; // timestamp
  pausedAt: number | null; // timestamp
}

export interface Theme {
  id: string;
  name: string;
  isDark: boolean;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    border: string;
  };
}
```

#### Audio Types
```typescript
// public/src/types/audio.ts
export interface AudioSession {
  id: string;
  name: string;
  fileName?: string;
  fileUrl?: string;
  youtubeId?: string;
  youtubeTitle?: string;
  settings: AudioSettings;
  loops: AudioLoop[];
  createdAt: Date;
  lastUsed: Date;
}

export interface AudioLoop {
  id: string;
  name: string;
  start: number;
  end: number;
  color?: string;
}

export interface YouTubeData {
  videoId: string;
  title: string;
  duration: number;
  thumbnail?: string;
}

export type AudioSource = 'file' | 'youtube' | 'microphone';
```

#### Component Props
```typescript
// public/src/types/components.ts
export interface TimerProps {
  onTimeUpdate?: (elapsed: number) => void;
  onStateChange?: (isRunning: boolean) => void;
  initialTime?: number;
  autoStart?: boolean;
}

export interface AudioPlayerProps {
  source?: AudioSource;
  onLoad?: (duration: number) => void;
  onError?: (error: Error) => void;
  onTimeUpdate?: (currentTime: number) => void;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  className?: string;
  children: any; // Will be React.ReactNode when needed
}
```

### Phase 2: Utilities & Config

#### Migrate helpers.js
```typescript
// public/src/utils/helpers.ts
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    
    if (timeout) clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function compressData(data: any): string {
  // Implementation
  return btoa(JSON.stringify(data));
}

export function decompressData<T = any>(compressed: string): T {
  // Implementation
  return JSON.parse(atob(compressed));
}
```

#### Migrate config.js
```typescript
// public/src/config.ts
export interface AppConfig {
  basePath: string;
  apiUrl: string;
  features: {
    serviceWorker: boolean;
    analytics: boolean;
    cloudSync: boolean;
    youtubeIntegration: boolean;
  };
  audio: {
    maxFileSize: number; // bytes
    supportedFormats: string[];
    defaultQuality: 'low' | 'medium' | 'high';
  };
  storage: {
    quotaWarningThreshold: number; // percentage
    compressionEnabled: boolean;
  };
}

class Config implements AppConfig {
  basePath: string;
  apiUrl: string;
  features: AppConfig['features'];
  audio: AppConfig['audio'];
  storage: AppConfig['storage'];

  constructor() {
    this.basePath = this.detectBasePath();
    this.apiUrl = process.env.API_URL || '';
    
    this.features = {
      serviceWorker: 'serviceWorker' in navigator,
      analytics: false,
      cloudSync: true,
      youtubeIntegration: true
    };
    
    this.audio = {
      maxFileSize: 20 * 1024 * 1024, // 20MB
      supportedFormats: ['audio/mp3', 'audio/mpeg'],
      defaultQuality: 'medium'
    };
    
    this.storage = {
      quotaWarningThreshold: 80,
      compressionEnabled: true
    };
  }

  private detectBasePath(): string {
    const path = window.location.pathname;
    const match = path.match(/^(\/[^\/]+)*\//);
    return match ? match[0] : '/';
  }
}

export default new Config();
```

### Phase 3: Services Layer

#### StorageService Migration
```typescript
// public/src/services/storageService.ts
import { PracticeSession, Goal, User } from '../types/models';
import { compressData, decompressData } from '../utils/helpers';

export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  getKeys(): Promise<string[]>;
}

export class StorageService {
  private adapter: StorageAdapter;
  private userId: string;
  private cache: Map<string, any> = new Map();
  
  constructor(userId: string, adapter?: StorageAdapter) {
    this.userId = userId;
    this.adapter = adapter || new IndexedDBAdapter();
  }
  
  // Practice Sessions
  async savePracticeSession(session: Omit<PracticeSession, 'id' | 'userId'>): Promise<PracticeSession> {
    const newSession: PracticeSession = {
      ...session,
      id: this.generateId(),
      userId: this.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const sessions = await this.getPracticeSessions();
    sessions.push(newSession);
    
    await this.saveData('sessions', sessions);
    return newSession;
  }
  
  async getPracticeSessions(): Promise<PracticeSession[]> {
    const cached = this.cache.get('sessions');
    if (cached) return cached;
    
    const sessions = await this.loadData<PracticeSession[]>('sessions') || [];
    this.cache.set('sessions', sessions);
    return sessions;
  }
  
  async updatePracticeSession(id: string, updates: Partial<PracticeSession>): Promise<PracticeSession> {
    const sessions = await this.getPracticeSessions();
    const index = sessions.findIndex(s => s.id === id);
    
    if (index === -1) {
      throw new Error(`Session ${id} not found`);
    }
    
    sessions[index] = {
      ...sessions[index],
      ...updates,
      updatedAt: new Date()
    };
    
    await this.saveData('sessions', sessions);
    return sessions[index];
  }
  
  // Goals
  async saveGoal(goal: Omit<Goal, 'id' | 'userId'>): Promise<Goal> {
    const newGoal: Goal = {
      ...goal,
      id: this.generateId(),
      userId: this.userId,
      createdAt: new Date()
    };
    
    const goals = await this.getGoals();
    goals.push(newGoal);
    
    await this.saveData('goals', goals);
    return newGoal;
  }
  
  async getGoals(): Promise<Goal[]> {
    return await this.loadData<Goal[]>('goals') || [];
  }
  
  // Generic methods
  private async saveData<T>(key: string, data: T): Promise<void> {
    const fullKey = `${this.userId}_${key}`;
    
    if (this.shouldCompress(data)) {
      const compressed = compressData(data);
      await this.adapter.set(fullKey, compressed);
    } else {
      await this.adapter.set(fullKey, data);
    }
    
    this.cache.set(key, data);
  }
  
  private async loadData<T>(key: string): Promise<T | null> {
    const fullKey = `${this.userId}_${key}`;
    const data = await this.adapter.get<any>(fullKey);
    
    if (!data) return null;
    
    if (typeof data === 'string' && this.isCompressed(data)) {
      return decompressData<T>(data);
    }
    
    return data as T;
  }
  
  private shouldCompress(data: any): boolean {
    const size = JSON.stringify(data).length;
    return size > 1024; // Compress if > 1KB
  }
  
  private isCompressed(data: string): boolean {
    // Simple check - compressed data starts with base64 pattern
    return /^[A-Za-z0-9+/]/.test(data);
  }
  
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Adapter implementations
class IndexedDBAdapter implements StorageAdapter {
  private dbName = 'GuitarPracticeJournal';
  private version = 1;
  private db: IDBDatabase | null = null;
  
  async get<T>(key: string): Promise<T | null> {
    const db = await this.getDB();
    const tx = db.transaction(['data'], 'readonly');
    const store = tx.objectStore('data');
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(request.error);
    });
  }
  
  async set<T>(key: string, value: T): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(['data'], 'readwrite');
    const store = tx.objectStore('data');
    
    return new Promise((resolve, reject) => {
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async delete(key: string): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(['data'], 'readwrite');
    const store = tx.objectStore('data');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async clear(): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(['data'], 'readwrite');
    const store = tx.objectStore('data');
    
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async getKeys(): Promise<string[]> {
    const db = await this.getDB();
    const tx = db.transaction(['data'], 'readonly');
    const store = tx.objectStore('data');
    
    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  }
  
  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('data')) {
          db.createObjectStore('data', { keyPath: 'key' });
        }
      };
    });
  }
}
```

### Phase 4: Components

#### Timer Component Migration
```typescript
// public/src/components/timer.ts
import { TimerState } from '../types/models';
import { formatTime } from '../utils/helpers';

export interface TimerOptions {
  onTick?: (elapsed: number) => void;
  onStateChange?: (isRunning: boolean) => void;
  onMilestone?: (minutes: number) => void;
}

export class Timer {
  private state: TimerState = {
    elapsed: 0,
    isRunning: false,
    startTime: null,
    pausedAt: null
  };
  
  private interval: number | null = null;
  private options: TimerOptions;
  private container: HTMLElement;
  private displayElement: HTMLElement | null = null;
  
  constructor(container: HTMLElement, options: TimerOptions = {}) {
    this.container = container;
    this.options = options;
    this.render();
  }
  
  start(): void {
    if (this.state.isRunning) return;
    
    this.state.isRunning = true;
    this.state.startTime = Date.now() - this.state.elapsed * 1000;
    this.state.pausedAt = null;
    
    this.startInterval();
    this.options.onStateChange?.(true);
  }
  
  pause(): void {
    if (!this.state.isRunning) return;
    
    this.state.isRunning = false;
    this.state.pausedAt = Date.now();
    
    this.stopInterval();
    this.options.onStateChange?.(false);
  }
  
  reset(): void {
    this.state = {
      elapsed: 0,
      isRunning: false,
      startTime: null,
      pausedAt: null
    };
    
    this.stopInterval();
    this.updateDisplay();
    this.options.onStateChange?.(false);
  }
  
  getElapsed(): number {
    return this.state.elapsed;
  }
  
  getState(): Readonly<TimerState> {
    return { ...this.state };
  }
  
  destroy(): void {
    this.stopInterval();
    this.container.innerHTML = '';
  }
  
  private startInterval(): void {
    this.interval = window.setInterval(() => {
      if (!this.state.startTime) return;
      
      const elapsed = Math.floor((Date.now() - this.state.startTime) / 1000);
      const previousMinutes = Math.floor(this.state.elapsed / 60);
      const currentMinutes = Math.floor(elapsed / 60);
      
      this.state.elapsed = elapsed;
      this.updateDisplay();
      this.options.onTick?.(elapsed);
      
      // Check for milestone
      if (currentMinutes > previousMinutes && currentMinutes % 5 === 0) {
        this.options.onMilestone?.(currentMinutes);
      }
    }, 100); // Update 10 times per second for smooth display
  }
  
  private stopInterval(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
  
  private updateDisplay(): void {
    if (this.displayElement) {
      this.displayElement.textContent = formatTime(this.state.elapsed);
    }
  }
  
  private render(): void {
    this.container.innerHTML = `
      <div class="timer-container">
        <div class="timer-display" id="timer-display">00:00</div>
        <div class="timer-controls">
          <button class="timer-btn" id="timer-start">Start</button>
          <button class="timer-btn" id="timer-pause">Pause</button>
          <button class="timer-btn" id="timer-reset">Reset</button>
        </div>
      </div>
    `;
    
    this.displayElement = this.container.querySelector('#timer-display');
    
    // Event listeners
    this.container.querySelector('#timer-start')?.addEventListener('click', () => this.start());
    this.container.querySelector('#timer-pause')?.addEventListener('click', () => this.pause());
    this.container.querySelector('#timer-reset')?.addEventListener('click', () => this.reset());
  }
}
```

### Phase 5: Pages & Routes

#### App.ts Migration
```typescript
// public/src/app.ts
import { User } from './types/models';
import { AuthService } from './services/authService';
import { StorageService } from './services/storageService';
import { ThemeService } from './services/themeService';
import config from './config';

interface Route {
  path: string;
  component: () => Promise<any>;
  requiresAuth: boolean;
}

export class App {
  private authService: AuthService;
  private storageService: StorageService | null = null;
  private themeService: ThemeService;
  private currentUser: User | null = null;
  
  private routes: Route[] = [
    {
      path: '/',
      component: () => import('./pages/dashboard'),
      requiresAuth: true
    },
    {
      path: '/login',
      component: () => import('./pages/auth'),
      requiresAuth: false
    },
    {
      path: '/calendar',
      component: () => import('./pages/calendar'),
      requiresAuth: true
    }
  ];
  
  constructor() {
    this.authService = new AuthService();
    this.themeService = new ThemeService();
  }
  
  async init(): Promise<void> {
    try {
      // Check for mobile test mode
      this.initializeMobileMode();
      
      // Initialize theme
      await this.themeService.init();
      
      // Check authentication
      this.currentUser = await this.authService.getCurrentUser();
      
      if (!this.currentUser) {
        await this.navigateTo('/login');
        return;
      }
      
      // Initialize storage with user context
      this.storageService = new StorageService(this.currentUser.id);
      
      // Navigate to dashboard
      await this.navigateTo('/');
      
    } catch (error) {
      console.error('App initialization failed:', error);
      this.showError(error as Error);
    }
  }
  
  private initializeMobileMode(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const isMobileTest = urlParams.get('mobile-test') === 'true' || window.MOBILE_TEST_MODE;
    
    if (isMobileTest) {
      document.body.classList.add('mobile-test-mode');
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `${config.basePath}styles/mobile-improvements.css`;
      document.head.appendChild(link);
    }
  }
  
  private async navigateTo(path: string): Promise<void> {
    const route = this.routes.find(r => r.path === path);
    if (!route) {
      throw new Error(`Route ${path} not found`);
    }
    
    if (route.requiresAuth && !this.currentUser) {
      await this.navigateTo('/login');
      return;
    }
    
    const module = await route.component();
    const Page = module.default;
    
    const app = document.getElementById('app');
    if (!app) throw new Error('App container not found');
    
    const page = new Page({
      user: this.currentUser,
      storageService: this.storageService,
      authService: this.authService
    });
    
    await page.render(app);
  }
  
  private showError(error: Error): void {
    const app = document.getElementById('app');
    if (!app) return;
    
    app.innerHTML = `
      <div class="error-container">
        <h1>Something went wrong</h1>
        <p>${error.message}</p>
        <button onclick="location.reload()">Reload</button>
      </div>
    `;
  }
}
```

### Phase 6: Strict Mode & Cleanup

#### Enable Strict Type Checking
```json
// tsconfig.json - Update after migration
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

#### Fix Strict Mode Errors
1. Add null checks where needed
2. Initialize all class properties
3. Add return types to all functions
4. Remove unused variables
5. Handle all switch cases

## 📊 Migration Tracking

### Progress Tracker Spreadsheet
```
| File | Status | Assignee | Notes |
|------|--------|----------|-------|
| helpers.js | ✅ Migrated | - | No issues |
| config.js | ✅ Migrated | - | Added interfaces |
| storageService.js | 🔄 In Progress | - | Complex, needs testing |
| timer.js | ⏳ Pending | - | Simple component |
... (track all 89 files)
```

### Git Branch Strategy
```bash
# Create feature branch
git checkout -b feature/typescript-migration

# Create sub-branches for each phase
git checkout -b ts-migration/phase-0-setup
git checkout -b ts-migration/phase-1-types
# ... etc

# Merge to feature branch after each phase
git checkout feature/typescript-migration
git merge ts-migration/phase-0-setup

# Final merge to main
git checkout main
git merge feature/typescript-migration
```

## 🧪 Testing Strategy

### Unit Tests for Migrated Code
```typescript
// __tests__/utils/helpers.test.ts
import { formatTime, debounce, generateId } from '../../src/utils/helpers';

describe('formatTime', () => {
  it('formats seconds correctly', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(59)).toBe('0:59');
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(3661)).toBe('1:01:01');
  });
});

describe('generateId', () => {
  it('generates unique ids', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });
  
  it('follows expected format', () => {
    const id = generateId();
    expect(id).toMatch(/^\d{13}-[a-z0-9]{9}$/);
  });
});
```

### Integration Tests
```bash
# Run type checking
npm run type-check

# Run tests
npm test

# Run build
npm run build

# Test the built application
npm run serve
```

## 🚨 Risk Mitigation

### Potential Issues & Solutions

1. **Build Time Increase**
   - Solution: Use `tsc --build` for incremental compilation
   - Consider esbuild or swc for faster builds

2. **Third-party Libraries**
   - Solution: Install @types packages
   - Create custom declarations for missing types

3. **Dynamic Code**
   - Solution: Use type assertions carefully
   - Add runtime validation where needed

4. **Team Training**
   - Solution: Create TypeScript style guide
   - Pair programming during migration

### Rollback Plan
```bash
# If critical issues arise
git checkout main
git branch -D feature/typescript-migration

# Gradual rollback
# Keep tsconfig.json with allowJs: true
# Revert individual files to .js as needed
```

## 📚 Resources & Documentation

### Team Resources
1. **TypeScript Handbook**: https://www.typescriptlang.org/docs/
2. **Migration Guide**: https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html
3. **Style Guide**: Create internal style guide
4. **Code Examples**: Maintain examples folder

### Monitoring Success
- **Type Coverage**: Aim for >95% type coverage
- **Build Time**: Keep under 30 seconds
- **Bundle Size**: Should not increase significantly
- **Developer Velocity**: Track PR cycle time

## ✅ Success Criteria

1. **All files migrated to TypeScript**
2. **Strict mode enabled**
3. **No runtime errors introduced**
4. **Build process automated**
5. **Team trained on TypeScript**
6. **Documentation updated**
7. **Type coverage > 95%**
8. **All tests passing**

## 🎯 Conclusion

This migration plan provides a structured approach to converting the Guitar Practice Journal to TypeScript. The incremental approach minimizes risk while providing immediate benefits. Each phase builds on the previous one, ensuring a smooth transition.

Start with Phase 0 immediately to begin reaping the benefits of TypeScript's type checking and improved developer experience.
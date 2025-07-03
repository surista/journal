// Dashboard Page - Updated with Metronome tab and persistent practice form
import { Timer } from '../components/timer.js';
import { AudioPlayer } from '../components/audioPlayer.js';
import { PracticeForm } from '../components/practiceForm.js';
import { Metronome } from '../components/metronome.js';
import { GoalsList } from '../components/goalsList.js';
import { StatsPanel } from '../components/statsPanel.js';
import { StreakHeatMap } from '../components/streakHeatMap.js';
import { AchievementBadges } from '../components/achievementBadges.js';
import { NotificationService } from '../services/notificationService.js';
import { ThemeService } from '../services/themeService.js';
import { PushNotificationService } from '../services/pushNotificationService.js';
import { VirtualSessionsList } from '../components/VirtualScrollList.js';
import { TimeUtils, debounce } from '../utils/helpers.js';
import { notificationManager } from '../services/notificationManager.js';

export class DashboardPage {
    constructor(storageService, authService) {
        this.storageService = storageService;
        this.authService = authService;
        this.themeService = new ThemeService();
        this.pushNotificationService = null;

        this.components = {};
        this.container = null;
        this.virtualSessionsList = null;
        this.activeTab = 'practice'; // Default active tab

        // Debounced storage check
        this.debouncedCheckStorage = debounce(() => {
            this.checkStorageUsage();
        }, 5000);
    }

    async init() {
        try {
            // Initialize push notification service after storage is ready
            this.pushNotificationService = new PushNotificationService(this.storageService);

            // Create page structure
            this.render();

            // Initialize components
            await this.initializeComponents();

            // Wire up timer sync connections
            this.setupTimerSync();

            // Load initial data
            await this.loadData();

            // Set up auto-save
            this.setupAutoSave();

            // Check storage usage
            await this.checkStorageUsage();

            // Initialize tab from URL hash
            this.initializeFromHash();
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            notificationManager.error('Failed to initialize dashboard');
        }
    }

    setupTimerSync() {
        // Connect timer to audio player
        if (this.components.timer && this.components.audioPlayer) {
            this.components.audioPlayer.setTimer(this.components.timer);
            console.log('Connected timer to audio player');
        }

        // Connect timer to metronome
        if (this.components.timer && this.components.metronome) {
            this.components.metronome.setTimer(this.components.timer);
            console.log('Connected timer to metronome');
        }

        // Connect timer to practice form
        if (this.components.timer && this.components.practiceForm) {
            this.components.practiceForm.setTimer(this.components.timer);
            console.log('Connected timer to practice form');
        }
    }

    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="modern-dashboard">
                <!-- Sidebar Navigation -->
                <aside class="sidebar">
                    <div class="sidebar-header">
                        <div class="logo">
                            <span class="logo-icon">🎸</span>
                            <h1 class="logo-text">Guitar Journal</h1>
                        </div>
                    </div>

                    <nav class="sidebar-nav">
                        <button class="nav-item active" data-tab="practice">
                            <span class="nav-icon">⏱️</span>
                            <span class="nav-text">Practice</span>
                        </button>
                        <button class="nav-item" data-tab="audio">
                            <span class="nav-icon">🎵</span>
                            <span class="nav-text">Audio Tools</span>
                        </button>
                        <button class="nav-item" data-tab="metronome">
                            <span class="nav-icon">🎼</span>
                            <span class="nav-text">Metronome</span>
                        </button>
                        <button class="nav-item" data-tab="goals">
                            <span class="nav-icon">🎯</span>
                            <span class="nav-text">Goals</span>
                        </button>
                        <button class="nav-item" data-tab="stats">
                            <span class="nav-icon">📊</span>
                            <span class="nav-text">Statistics</span>
                        </button>
                        <button class="nav-item" data-tab="history">
                            <span class="nav-icon">📜</span>
                            <span class="nav-text">History</span>
                        </button>
                    </nav>

                    <div class="sidebar-footer">
                        <button class="nav-item" id="viewCalendarBtn">
                            <span class="nav-icon">📅</span>
                            <span class="nav-text">Calendar</span>
                        </button>
                        <div class="sidebar-divider"></div>
                        <button class="nav-item" data-tab="settings">
                            <span class="nav-icon">⚙️</span>
                            <span class="nav-text">Settings</span>
                        </button>
                    </div>
                </aside>

                <!-- Main Content Area -->
                <main class="main-content">
                    <!-- Top Bar -->
                    <header class="top-bar">
                        <div class="top-bar-left">
                            <button class="mobile-menu-toggle" id="mobileMenuToggle">
                                <span></span>
                                <span></span>
                                <span></span>
                            </button>
                            <h2 class="page-title" id="pageTitle">Practice Session</h2>
                        </div>
                        <div class="top-bar-right">
                            <div class="user-menu">
                                <button class="btn btn-icon theme-toggle" id="themeToggle" title="Toggle theme">
                                    ${this.themeService.getTheme() === 'dark' ? '☀️' : '🌙'}
                                </button>
                                <div class="user-info">
                                    <span class="user-avatar">👤</span>
                                    <span class="user-email">${this.authService.getCurrentUser().email}</span>
                                    <button class="btn btn-danger btn-small" id="logoutBtn">Logout</button>
                                </div>
                            </div>
                        </div>
                    </header>

                    <!-- Tab Content -->
                    <div class="tab-content">
                        <!-- Practice Tab -->
                        <div class="tab-pane active" id="practice-tab">
                            <!-- Sticky Container for Timer and Practice Form -->
                            <div class="sticky-top-container">
                                <!-- Compact Timer Section -->
                                <div class="compact-timer-section" id="compactTimerContainer"></div>
                                
                                <!-- Log Practice Session Section (collapsible) -->
                                <div class="log-practice-section" id="logPracticeSectionPractice">
                                    <div class="log-practice-header" onclick="window.togglePracticeForm('Practice')">
                                        <div class="log-practice-title">
                                            <span>📝</span>
                                            <span>Log Practice Session</span>
                                        </div>
                                        <div class="collapse-icon">▼</div>
                                    </div>
                                    <div class="log-practice-content">
                                        <div class="log-practice-form-wrapper" id="formContainerPractice"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="practice-layout">
                                <div class="practice-sidebar">
                                    <div class="card compact-stats" id="compactStatsContainer"></div>
                                    <div class="card recent-sessions-widget">
                                        <h3>Recent Sessions</h3>
                                        <div id="recentSessionsWidget"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Audio Tools Tab -->
                        <div class="tab-pane" id="audio-tab">
                            <!-- Sticky Container for Timer and Practice Form -->
                            <div class="sticky-top-container">
                                <!-- Compact Timer Section -->
                                <div class="compact-timer-section" id="compactTimerContainerAudio"></div>
                                
                                <!-- Log Practice Session Section (collapsible) -->
                                <div class="log-practice-section" id="logPracticeSectionAudio">
                                    <div class="log-practice-header" onclick="window.togglePracticeForm('Audio')">
                                        <div class="log-practice-title">
                                            <span>📝</span>
                                            <span>Log Practice Session</span>
                                        </div>
                                        <div class="collapse-icon">▼</div>
                                    </div>
                                    <div class="log-practice-content">
                                        <div class="log-practice-form-wrapper" id="formContainerAudio"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="audio-layout">
                                <div class="card" id="audioContainer"></div>
                            </div>
                        </div>

                        <!-- Metronome Tab -->
                        <div class="tab-pane" id="metronome-tab">
                            <!-- Sticky Container for Timer and Practice Form -->
                            <div class="sticky-top-container">
                                <!-- Compact Timer Section -->
                                <div class="compact-timer-section" id="compactTimerContainerMetronome"></div>
                                
                                <!-- Log Practice Session Section (collapsible) -->
                                <div class="log-practice-section" id="logPracticeSectionMetronome">
                                    <div class="log-practice-header" onclick="window.togglePracticeForm('Metronome')">
                                        <div class="log-practice-title">
                                            <span>📝</span>
                                            <span>Log Practice Session</span>
                                        </div>
                                        <div class="collapse-icon">▼</div>
                                    </div>
                                    <div class="log-practice-content">
                                        <div class="log-practice-form-wrapper" id="formContainerMetronome"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="metronome-layout">
                                <div class="card" id="metronomeContainer"></div>
                            </div>
                        </div>

                        <!-- Goals Tab -->
                        <div class="tab-pane" id="goals-tab">
                            <div class="goals-layout">
                                <div class="card" id="goalsContainer"></div>
                                <div class="card" id="achievementsContainer"></div>
                            </div>
                        </div>

                        <!-- Statistics Tab -->
                        <div class="tab-pane" id="stats-tab">
                            <div class="stats-layout">
                                <div class="stats-overview" id="statsContainer"></div>
                                <div class="card" id="heatmapContainer"></div>
                            </div>
                        </div>

                        <!-- History Tab -->
                        <div class="tab-pane" id="history-tab">
                            <div class="history-layout">
                                <div class="card">
                                    <div class="card-header">
                                        <h3>Practice History</h3>
                                        <div class="history-filters">
                                            <select id="historyFilter" class="filter-select">
                                                <option value="all">All Time</option>
                                                <option value="week">This Week</option>
                                                <option value="month">This Month</option>
                                                <option value="year">This Year</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div id="historyContainer"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Settings Tab -->
                        <div class="tab-pane" id="settings-tab">
                            <div class="settings-layout">
                                <div class="card">
                                    <h3>Settings</h3>
                                    <div class="settings-section">
                                        <h4>Data Management</h4>
                                        <div class="settings-actions">
                                            <button class="btn btn-primary" id="exportBtn">
                                                <span class="btn-icon">📥</span>
                                                Export Data
                                            </button>
                                            <label for="importFile" class="btn btn-primary">
                                                <span class="btn-icon">📤</span>
                                                Import Data
                                                <input type="file" id="importFile" accept=".json" style="display: none;">
                                            </label>
                                        </div>
                                    </div>
                                    <div class="settings-section">
                                        <h4>Storage</h4>
                                        <div id="storageIndicator"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <!-- Floating Action Button for mobile -->
            <button class="fab" id="quickActionBtn" title="Quick log practice">
                <span class="fab-icon">➕</span>
            </button>

            <style>
                /* Modern Dashboard Layout */
                .modern-dashboard {
                    display: flex;
                    height: 100vh;
                    background: var(--bg-dark);
                    overflow: hidden;
                }

                /* Sticky Container for Timer and Practice Form */
                .sticky-top-container {
                    position: sticky;
                    top: 0;
                    z-index: 90;
                    background: var(--bg-dark);
                    padding-bottom: 1rem;
                    margin-bottom: 1rem;
                }

                /* Compact Timer Section */
                .compact-timer-section {
                    background: var(--bg-card);
                    border-radius: var(--radius-xl);
                    padding: 1rem 1.5rem;
                    margin-bottom: 1rem;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    border: 1px solid var(--border);
                }

                /* Log Practice Section */
                .log-practice-section {
                    background: var(--bg-card);
                    border-radius: var(--radius-xl);
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    border: 1px solid var(--border);
                    transition: all var(--transition-base);
                }

                .log-practice-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid var(--border);
                    cursor: pointer;
                    user-select: none;
                }

                .log-practice-header:hover {
                    background: rgba(99, 102, 241, 0.05);
                }

                .log-practice-title {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .collapse-icon {
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform var(--transition-base);
                    color: var(--text-secondary);
                }

                .collapsed .collapse-icon {
                    transform: rotate(-90deg);
                }

                .log-practice-content {
                    max-height: 500px;
                    overflow: hidden;
                    transition: max-height var(--transition-base) ease-out;
                }

                .log-practice-section.collapsed .log-practice-content {
                    max-height: 0;
                    border-top: none;
                }

                .log-practice-section.collapsed .log-practice-header {
                    border-bottom: none;
                }

                .log-practice-form-wrapper {
                    padding: 1.5rem;
                }

                /* Compact Timer Styles */
                .compact-timer-wrapper {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 1.5rem;
                    flex-wrap: wrap;
                }

                .compact-timer-left {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    flex: 1;
                }

                .compact-timer-display {
                    font-size: 2rem !important;
                    font-weight: 300;
                    font-variant-numeric: tabular-nums;
                    color: #6366f1;
                    margin: 0;
                    min-width: 120px;
                }

                .compact-timer-controls {
                    display: flex;
                    gap: 0.75rem;
                }

                .compact-timer-controls .btn {
                    padding: 0.5rem 1rem;
                    font-size: 0.875rem;
                }

                .compact-timer-right {
                    display: flex;
                    align-items: center;
                    gap: 2rem;
                }

                .compact-timer-goal {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .compact-timer-goal label {
                    color: var(--text-secondary);
                    font-size: 0.875rem;
                    white-space: nowrap;
                }

                .compact-timer-goal select {
                    background: var(--bg-input);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    padding: 0.375rem 0.75rem;
                    color: var(--text-primary);
                    font-size: 0.875rem;
                    cursor: pointer;
                }

                .compact-timer-progress {
                    flex: 1;
                    min-width: 150px;
                    max-width: 300px;
                }

                .compact-progress-bar {
                    background: var(--bg-input);
                    height: 8px;
                    border-radius: 4px;
                    overflow: hidden;
                    position: relative;
                    border: 1px solid var(--border);
                }

                .compact-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #6366f1 0%, #a855f7 100%);
                    transition: width 0.3s ease;
                    width: 0%;
                }

                .compact-timer-sync {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.375rem 0.75rem;
                    background: var(--bg-input);
                    border-radius: var(--radius-md);
                    border: 1px solid var(--border);
                }

                .compact-sync-toggle {
                    width: 16px;
                    height: 16px;
                    cursor: pointer;
                    accent-color: #6366f1;
                }

                .compact-sync-label {
                    color: var(--text-secondary);
                    font-size: 0.8rem;
                    cursor: pointer;
                    user-select: none;
                }

                /* Sidebar Styles */
                .sidebar {
                    width: 260px;
                    background: var(--bg-card);
                    border-right: 1px solid var(--border);
                    display: flex;
                    flex-direction: column;
                    transition: transform var(--transition-base);
                    z-index: 100;
                }

                .sidebar-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--border);
                }

                .logo {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .logo-icon {
                    font-size: 2rem;
                    animation: float 3s ease-in-out infinite;
                }

                .logo-text {
                    font-size: 1.25rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    margin: 0;
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }

                .sidebar-nav {
                    flex: 1;
                    padding: 1rem 0;
                    overflow-y: auto;
                }

                .nav-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    width: 100%;
                    padding: 0.875rem 1.5rem;
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 0.95rem;
                    cursor: pointer;
                    transition: all var(--transition-base);
                    position: relative;
                }

                .nav-item::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 4px;
                    background: var(--primary);
                    transform: scaleX(0);
                    transition: transform var(--transition-base);
                }

                .nav-item:hover {
                    color: var(--text-primary);
                    background: rgba(99, 102, 241, 0.05);
                }

                .nav-item.active {
                    color: var(--primary);
                    background: rgba(99, 102, 241, 0.1);
                }

                .nav-item.active::before {
                    transform: scaleX(1);
                }

                .nav-icon {
                    font-size: 1.25rem;
                    width: 1.5rem;
                    text-align: center;
                }

                .sidebar-footer {
                    padding: 1rem 0;
                    border-top: 1px solid var(--border);
                }

                .sidebar-divider {
                    height: 1px;
                    background: var(--border);
                    margin: 0.5rem 1.5rem;
                }

                /* Main Content */
                .main-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                /* Top Bar */
                .top-bar {
                    background: var(--bg-card);
                    border-bottom: 1px solid var(--border);
                    padding: 1rem 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    min-height: 70px;
                }

                .top-bar-left {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                }

                .mobile-menu-toggle {
                    display: none;
                    flex-direction: column;
                    gap: 4px;
                    background: none;
                    border: none;
                    padding: 0.5rem;
                    cursor: pointer;
                }

                .mobile-menu-toggle span {
                    display: block;
                    width: 24px;
                    height: 2px;
                    background: var(--text-primary);
                    transition: all var(--transition-base);
                }

                .page-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0;
                }

                .user-menu {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .user-info {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.5rem 1rem;
                    background: var(--bg-input);
                    border-radius: var(--radius-lg);
                }

                .user-avatar {
                    font-size: 1.25rem;
                }

                .user-email {
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                }

                /* Tab Content */
                .tab-content {
                    flex: 1;
                    padding: 2rem;
                    overflow-y: auto;
                    background: var(--bg-dark);
                }

                .tab-pane {
                    display: none;
                    animation: fadeIn var(--transition-slow);
                }

                .tab-pane.active {
                    display: block;
                }

                /* Card Component */
                .card {
                    background: var(--bg-card);
                    border-radius: var(--radius-xl);
                    padding: 1.5rem;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    border: 1px solid var(--border);
                    margin-bottom: 1.5rem;
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .card h3 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin: 0;
                }

                /* Practice Layout */
                .practice-layout {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 2rem;
                }

                .practice-sidebar {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                }

                .compact-stats {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }

                .compact-stats .stat-card {
                    padding: 1rem;
                    background: var(--bg-input);
                    border-radius: var(--radius-lg);
                    text-align: center;
                }

                .compact-stats .stat-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--primary);
                    margin-bottom: 0.25rem;
                }

                .compact-stats .stat-label {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                }

                /* Recent Sessions Widget */
                .recent-sessions-widget {
                    max-height: 400px;
                    overflow-y: auto;
                }

                .recent-sessions-widget h3 {
                    margin-bottom: 1rem;
                    font-size: 1.1rem;
                }

                /* Audio Layout */
                .audio-layout {
                    max-width: 1200px;
                    margin: 0 auto;
                }

                /* Metronome Layout */
                .metronome-layout {
                    max-width: 800px;
                    margin: 0 auto;
                }

                /* Goals Layout */
                .goals-layout {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                }

                /* Stats Layout */
                .stats-layout {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }

                .stats-overview {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 1.5rem;
                }

                /* History Layout */
                .history-filters {
                    display: flex;
                    gap: 1rem;
                }

                .filter-select {
                    padding: 0.5rem 1rem;
                    background: var(--bg-input);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-md);
                    color: var(--text-primary);
                    cursor: pointer;
                }

                /* Settings Layout */
                .settings-layout {
                    max-width: 800px;
                    margin: 0 auto;
                }

                .settings-section {
                    padding: 1.5rem 0;
                    border-bottom: 1px solid var(--border);
                }

                .settings-section:last-child {
                    border-bottom: none;
                }

                .settings-section h4 {
                    margin-bottom: 1rem;
                    color: var(--text-primary);
                }

                .settings-actions {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                /* Floating Action Button */
                .fab {
                    position: fixed;
                    bottom: 2rem;
                    right: 2rem;
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
                    border: none;
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
                    transition: all var(--transition-base);
                    display: none;
                    z-index: 50;
                }

                .fab:hover {
                    transform: translateY(-2px) scale(1.05);
                    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.6);
                }

                .fab:active {
                    transform: translateY(0) scale(0.95);
                }

                /* Storage Indicator */
                .storage-usage {
                    margin-top: 1rem;
                }

                .storage-bar {
                    height: 8px;
                    background: var(--bg-input);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-top: 0.5rem;
                }

                .storage-fill {
                    height: 100%;
                    background: var(--primary);
                    transition: width var(--transition-base);
                }

                .storage-warning .storage-fill {
                    background: var(--warning);
                }

                .storage-critical .storage-fill {
                    background: var(--danger);
                }

                /* Responsive Design */
                @media (max-width: 1200px) {
                    .practice-layout {
                        grid-template-columns: 1fr;
                    }

                    .goals-layout {
                        grid-template-columns: 1fr;
                    }

                    .compact-timer-wrapper {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .compact-timer-left {
                        justify-content: space-between;
                    }

                    .compact-timer-right {
                        justify-content: space-between;
                    }

                    .log-practice-content {
                        max-height: 600px;
                    }
                }

                @media (max-width: 768px) {
                    .sidebar {
                        position: fixed;
                        left: 0;
                        top: 0;
                        height: 100vh;
                        transform: translateX(-100%);
                        box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
                    }

                    .sidebar.open {
                        transform: translateX(0);
                    }

                    .mobile-menu-toggle {
                        display: flex;
                    }

                    .page-title {
                        font-size: 1.25rem;
                    }

                    .user-info {
                        display: none;
                    }

                    .tab-content {
                        padding: 1rem;
                    }

                    .practice-sidebar {
                        grid-template-columns: 1fr;
                    }

                    .compact-stats {
                        grid-template-columns: 1fr 1fr;
                    }

                    .stats-overview {
                        grid-template-columns: 1fr;
                    }

                    .fab {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .settings-actions {
                        flex-direction: column;
                    }

                    .settings-actions .btn {
                        width: 100%;
                        justify-content: center;
                    }

                    .compact-timer-display {
                        font-size: 1.5rem !important;
                        min-width: 90px;
                    }

                    .compact-timer-controls .btn {
                        padding: 0.375rem 0.75rem;
                        font-size: 0.8rem;
                    }

                    .compact-timer-sync {
                        padding: 0.25rem 0.5rem;
                    }

                    .compact-sync-label {
                        display: none;
                    }

                    .compact-timer-goal label {
                        display: none;
                    }

                    .log-practice-title span:first-child {
                        font-size: 1.25rem;
                    }

                    .log-practice-content {
                        max-height: 400px;
                    }

                    .sticky-top-container {
                        padding-bottom: 0.5rem;
                    }

                    .compact-timer-section,
                    .log-practice-section {
                        margin-bottom: 0.75rem;
                    }

                    .log-practice-header {
                        padding: 0.75rem 1rem;
                    }

                    .log-practice-form-wrapper {
                        padding: 1rem;
                    }
                }

                /* Dark theme adjustments */
                [data-theme="light"] .sidebar {
                    background: #f8f9fa;
                    border-right-color: #e9ecef;
                }

                [data-theme="light"] .top-bar {
                    background: #ffffff;
                    border-bottom-color: #e9ecef;
                }

                [data-theme="light"] .card {
                    background: #ffffff;
                    border-color: #e9ecef;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                }

                [data-theme="light"] .compact-timer-section {
                    background: #ffffff;
                    border-color: #e9ecef;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                }

                /* Animations */
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            </style>
        `;

        this.container = app.querySelector('.modern-dashboard');
        this.attachEventListeners();
    }

    async initializeComponents() {
        try {
            // Initialize Compact Timer for Practice, Audio, and Metronome tabs
            const compactTimerContainer = document.getElementById('compactTimerContainer');
            const compactTimerContainerAudio = document.getElementById('compactTimerContainerAudio');
            const compactTimerContainerMetronome = document.getElementById('compactTimerContainerMetronome');

            if (compactTimerContainer) {
                // Create a custom compact timer component
                this.components.timer = new Timer(compactTimerContainer);
                // Render compact version
                this.renderCompactTimer(compactTimerContainer);

                // Clone the timer display for other tabs
                if (compactTimerContainerAudio) {
                    this.renderCompactTimer(compactTimerContainerAudio, 'Audio');
                }
                if (compactTimerContainerMetronome) {
                    this.renderCompactTimer(compactTimerContainerMetronome, 'Metronome');
                }

                console.log('Compact Timer initialized successfully');
            }

            // Initialize Practice Form for all three tabs
            try {
                const formContainerPractice = document.getElementById('formContainerPractice');
                const formContainerAudio = document.getElementById('formContainerAudio');
                const formContainerMetronome = document.getElementById('formContainerMetronome');

                this.components.practiceForm = new PracticeForm(formContainerPractice, this.storageService);
                this.components.practiceForm.render();

                // Clone the form to other tabs
                if (formContainerAudio) {
                    formContainerAudio.innerHTML = formContainerPractice.innerHTML;
                    this.attachPracticeFormListeners(formContainerAudio, 'Audio');
                }
                if (formContainerMetronome) {
                    formContainerMetronome.innerHTML = formContainerPractice.innerHTML;
                    this.attachPracticeFormListeners(formContainerMetronome, 'Metronome');
                }

                // Set up collapse/expand functionality
                this.setupPracticeFormCollapse();

                console.log('Practice Form initialized successfully');
            } catch (error) {
                console.error('Practice Form initialization error:', error);
            }

            // Initialize Audio Player (Audio tab)
            try {
                const audioContainer = document.getElementById('audioContainer');
                this.components.audioPlayer = new AudioPlayer(audioContainer, this.storageService);
                this.components.audioPlayer.render();

                // Remove metronome section from audio player if it exists
                const metronomeInAudio = audioContainer?.querySelector('#metronomeSection');
                if (metronomeInAudio) {
                    metronomeInAudio.remove();
                }

                console.log('Audio Player initialized successfully');
            } catch (error) {
                console.error('Audio Player initialization error:', error);
            }

            // Initialize Metronome (Metronome tab)
            try {
                const metronomeContainer = document.getElementById('metronomeContainer');
                this.components.metronome = new Metronome(metronomeContainer);
                this.components.metronome.render();
                console.log('Metronome initialized successfully');
            } catch (error) {
                console.error('Metronome initialization error:', error);
            }

            // Initialize Goals List (Goals tab)
            try {
                const goalsContainer = document.getElementById('goalsContainer');
                this.components.goalsList = new GoalsList(goalsContainer, this.storageService);
                this.components.goalsList.render();
                console.log('Goals List initialized successfully');
            } catch (error) {
                console.error('Goals List initialization error:', error);
            }

            // Initialize Achievement Badges (Goals tab)
            try {
                const achievementsContainer = document.getElementById('achievementsContainer');
                this.components.achievementBadges = new AchievementBadges(achievementsContainer, this.storageService);
                await this.components.achievementBadges.render();
                console.log('Achievement Badges initialized successfully');
            } catch (error) {
                console.error('Achievement Badges initialization error:', error);
            }

            // Initialize Stats Panel (Stats tab)
            try {
                const statsContainer = document.getElementById('statsContainer');
                this.components.statsPanel = new StatsPanel(statsContainer, this.storageService);
                this.components.statsPanel.render();
                console.log('Stats Panel initialized successfully');
            } catch (error) {
                console.error('Stats Panel initialization error:', error);
            }

            // Initialize Streak Heat Map (Stats tab)
            try {
                const heatmapContainer = document.getElementById('heatmapContainer');
                this.components.streakHeatMap = new StreakHeatMap(heatmapContainer, this.storageService);
                await this.components.streakHeatMap.render();
                console.log('Streak Heat Map initialized successfully');
            } catch (error) {
                console.error('Streak Heat Map initialization error:', error);
            }

            // Initialize compact stats for practice tab
            await this.renderCompactStats();

        } catch (error) {
            console.error('Error initializing components:', error);
            notificationManager.error('Failed to initialize some components');
        }
    }

    renderCompactTimer(container, tabSuffix = '') {
        // Create the compact timer HTML
        container.innerHTML = `
            <div class="compact-timer-wrapper">
                <div class="compact-timer-left">
                    <div class="compact-timer-display" id="compactTimerDisplay${tabSuffix}">00:00:00</div>
                    <div class="compact-timer-controls">
                        <button class="btn btn-success compact-start-btn" id="compactStartTimer${tabSuffix}">
                            ▶️ Start
                        </button>
                        <button class="btn btn-danger compact-stop-btn" id="compactStopTimer${tabSuffix}" style="display: none;">
                            ⏹️ Stop
                        </button>
                        <button class="btn btn-primary compact-reset-btn" id="compactResetTimer${tabSuffix}">
                            🔄 Reset
                        </button>
                    </div>
                </div>
                <div class="compact-timer-right">
                    <div class="compact-timer-goal">
                        <label for="compactSessionGoal${tabSuffix}">Goal:</label>
                        <select id="compactSessionGoal${tabSuffix}">
                            <option value="0">No goal</option>
                            <option value="600">10 min</option>
                            <option value="900">15 min</option>
                            <option value="1200">20 min</option>
                            <option value="1800" selected>30 min</option>
                            <option value="2700">45 min</option>
                            <option value="3600">60 min</option>
                        </select>
                    </div>
                    <div class="compact-timer-progress">
                        <div class="compact-progress-bar">
                            <div class="compact-progress-fill" id="compactTimerProgress${tabSuffix}"></div>
                        </div>
                    </div>
                    <div class="compact-timer-sync">
                        <input type="checkbox" id="compactTimerSync${tabSuffix}" class="compact-sync-toggle" ${this.components.timer?.isSyncEnabled ? 'checked' : ''}>
                        <label for="compactTimerSync${tabSuffix}" class="compact-sync-label">Sync</label>
                    </div>
                </div>
            </div>
        `;

        // If this is not a suffix (main timer), set up the main timer logic
        if (!tabSuffix) {
            // Initialize the timer with the compact display
            this.components.timer.elapsedTime = 0;
            this.components.timer.isRunning = false;
            this.components.timer.startTime = null;

            // Override the timer's update display method
            this.components.timer.updateTimerDisplay = () => {
                const displays = [
                    document.getElementById('compactTimerDisplay'),
                    document.getElementById('compactTimerDisplayAudio'),
                    document.getElementById('compactTimerDisplayMetronome')
                ];

                displays.forEach(display => {
                    if (display) {
                        const totalSeconds = Math.floor(this.components.timer.elapsedTime / 1000);
                        const hours = Math.floor(totalSeconds / 3600);
                        const minutes = Math.floor((totalSeconds % 3600) / 60);
                        const seconds = totalSeconds % 60;

                        display.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                    }
                });

                // Update progress bars
                this.updateCompactProgress();
            };

            // Set up compact timer event listeners
            this.attachCompactTimerListeners();
        }
    }

    attachCompactTimerListeners() {
        // Start buttons
        ['compactStartTimer', 'compactStartTimerAudio', 'compactStartTimerMetronome'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => {
                    this.components.timer.start();
                    this.updateCompactTimerButtons(true);
                });
            }
        });

        // Stop buttons
        ['compactStopTimer', 'compactStopTimerAudio', 'compactStopTimerMetronome'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => {
                    this.components.timer.stop();
                    this.updateCompactTimerButtons(false);
                });
            }
        });

        // Reset buttons
        ['compactResetTimer', 'compactResetTimerAudio', 'compactResetTimerMetronome'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => {
                    this.components.timer.reset();
                    this.updateCompactTimerButtons(false);
                });
            }
        });

        // Goal selects
        ['compactSessionGoal', 'compactSessionGoalAudio', 'compactSessionGoalMetronome'].forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                select.addEventListener('change', () => {
                    this.saveCompactTimerPreferences();
                    this.updateCompactProgress();
                });
            }
        });

        // Sync toggles
        ['compactTimerSync', 'compactTimerSyncAudio', 'compactTimerSyncMetronome'].forEach(id => {
            const toggle = document.getElementById(id);
            if (toggle) {
                toggle.addEventListener('change', (e) => {
                    this.components.timer.isSyncEnabled = e.target.checked;
                    this.saveCompactTimerPreferences();

                    // Sync all toggles
                    ['compactTimerSync', 'compactTimerSyncAudio', 'compactTimerSyncMetronome'].forEach(toggleId => {
                        const otherToggle = document.getElementById(toggleId);
                        if (otherToggle && otherToggle !== e.target) {
                            otherToggle.checked = e.target.checked;
                        }
                    });
                });
            }
        });

        // Load saved preferences
        this.loadCompactTimerPreferences();
    }

    attachPracticeFormListeners(container, tabSuffix) {
        // Re-attach event listeners for cloned practice forms
        const form = container.querySelector('form');
        if (form && this.components.practiceForm) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.components.practiceForm.handleSubmit(e);
            });
        }
    }

    setupPracticeFormCollapse() {
        // Set up toggle functionality
        window.togglePracticeForm = (tabSuffix) => {
            const section = document.getElementById(`logPracticeSection${tabSuffix}`);
            if (section) {
                section.classList.toggle('collapsed');

                // Save collapsed state to localStorage
                const isCollapsed = section.classList.contains('collapsed');
                localStorage.setItem('practiceFormCollapsed', isCollapsed);

                // Sync state across all tabs
                ['Practice', 'Audio', 'Metronome'].forEach(suffix => {
                    const otherSection = document.getElementById(`logPracticeSection${suffix}`);
                    if (otherSection && otherSection !== section) {
                        if (isCollapsed) {
                            otherSection.classList.add('collapsed');
                        } else {
                            otherSection.classList.remove('collapsed');
                        }
                    }
                });
            }
        };

        // Load saved collapsed state
        const savedCollapsedState = localStorage.getItem('practiceFormCollapsed');
        if (savedCollapsedState === 'true') {
            ['Practice', 'Audio', 'Metronome'].forEach(suffix => {
                const section = document.getElementById(`logPracticeSection${suffix}`);
                if (section) {
                    section.classList.add('collapsed');
                }
            });
        }
    }

    updateCompactTimerButtons(isRunning) {
        ['', 'Audio', 'Metronome'].forEach(suffix => {
            const startBtn = document.getElementById(`compactStartTimer${suffix}`);
            const stopBtn = document.getElementById(`compactStopTimer${suffix}`);

            if (startBtn) startBtn.style.display = isRunning ? 'none' : 'inline-flex';
            if (stopBtn) stopBtn.style.display = isRunning ? 'inline-flex' : 'none';
        });
    }

    updateCompactProgress() {
        const goal = document.getElementById('compactSessionGoal')?.value || '0';
        const goalSeconds = parseInt(goal);
        const currentSeconds = Math.floor(this.components.timer.elapsedTime / 1000);

        ['compactTimerProgress', 'compactTimerProgressAudio', 'compactTimerProgressMetronome'].forEach(id => {
            const progressBar = document.getElementById(id);
            if (progressBar) {
                if (goalSeconds > 0) {
                    const percentage = Math.min(100, (currentSeconds / goalSeconds) * 100);
                    progressBar.style.width = `${percentage}%`;

                    if (percentage >= 100) {
                        progressBar.style.background = '#10b981';
                    } else if (percentage >= 75) {
                        progressBar.style.background = '#f59e0b';
                    } else {
                        progressBar.style.background = 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)';
                    }
                } else {
                    progressBar.style.width = '0%';
                }
            }
        });
    }

    saveCompactTimerPreferences() {
        try {
            const preferences = {
                sessionGoal: document.getElementById('compactSessionGoal')?.value || '1800',
                syncEnabled: document.getElementById('compactTimerSync')?.checked || false
            };
            localStorage.setItem('compactTimerPreferences', JSON.stringify(preferences));
        } catch (error) {
            console.error('Failed to save compact timer preferences:', error);
        }
    }

    loadCompactTimerPreferences() {
        try {
            const preferences = localStorage.getItem('compactTimerPreferences');
            if (preferences) {
                const { sessionGoal, syncEnabled } = JSON.parse(preferences);

                ['compactSessionGoal', 'compactSessionGoalAudio', 'compactSessionGoalMetronome'].forEach(id => {
                    const select = document.getElementById(id);
                    if (select && sessionGoal) {
                        select.value = sessionGoal;
                    }
                });

                ['compactTimerSync', 'compactTimerSyncAudio', 'compactTimerSyncMetronome'].forEach(id => {
                    const toggle = document.getElementById(id);
                    if (toggle && syncEnabled !== undefined) {
                        toggle.checked = syncEnabled;
                    }
                });

                if (this.components.timer) {
                    this.components.timer.isSyncEnabled = syncEnabled || false;
                }
            }
        } catch (error) {
            console.error('Failed to load compact timer preferences:', error);
        }
    }

    initializeFromHash() {
        const hash = window.location.hash.slice(1);
        if (hash) {
            this.switchTab(hash);
        }
    }

    switchTab(tabName) {
        // Update active nav item
        const navItems = this.container.querySelectorAll('.nav-item[data-tab]');
        navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tabName);
        });

        // Update active tab pane
        const tabPanes = this.container.querySelectorAll('.tab-pane');
        tabPanes.forEach(pane => {
            pane.classList.toggle('active', pane.id === `${tabName}-tab`);
        });

        // Update page title
        const titles = {
            practice: 'Practice Session',
            audio: 'Audio Tools',
            metronome: 'Metronome',
            goals: 'Goals & Achievements',
            stats: 'Statistics',
            history: 'Practice History',
            settings: 'Settings'
        };
        document.getElementById('pageTitle').textContent = titles[tabName] || 'Dashboard';

        // Update URL hash
        window.location.hash = tabName;

        // Close mobile menu if open
        this.closeMobileMenu();

        this.activeTab = tabName;
    }

    toggleMobileMenu() {
        const sidebar = this.container.querySelector('.sidebar');
        sidebar.classList.toggle('open');
    }

    closeMobileMenu() {
        const sidebar = this.container.querySelector('.sidebar');
        sidebar.classList.remove('open');
    }

    async renderCompactStats() {
        try {
            const stats = await this.storageService.calculateStats();
            const container = document.getElementById('compactStatsContainer');

            if (container) {
                container.innerHTML = `
                    <div class="stat-card">
                        <div class="stat-value">${stats.currentStreak || 0}</div>
                        <div class="stat-label">Day Streak</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.formatDuration(stats.totalTime || 0, true)}</div>
                        <div class="stat-label">Total Time</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.totalSessions || 0}</div>
                        <div class="stat-label">Sessions</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.formatDuration(stats.averageSession || 0, true)}</div>
                        <div class="stat-label">Avg Session</div>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error rendering compact stats:', error);
        }
    }

    formatDuration(seconds, short = false) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (short && hours === 0) {
            return `${minutes}m`;
        }

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    async loadData() {
        try {
            await this.loadRecentSessions();
            await this.loadRecentSessionsWidget();
            await this.renderCompactStats();

            if (this.components.statsPanel) {
                this.components.statsPanel.update();
            }

            this.checkPracticeReminder();
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    async loadRecentSessionsWidget() {
        try {
            const entries = await this.storageService.getPracticeEntries();
            const container = document.getElementById('recentSessionsWidget');

            if (!container) return;

            if (!Array.isArray(entries) || entries.length === 0) {
                container.innerHTML = `<p class="empty-state">No sessions yet</p>`;
                return;
            }

            // Show only 5 most recent sessions in widget
            container.innerHTML = entries.slice(0, 5).map(entry => {
                const date = new Date(entry.date);
                const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                const duration = TimeUtils.formatDuration(entry.duration, true);

                return `
                    <div class="session-widget-item">
                        <div class="session-widget-header">
                            <span class="session-widget-time">${time}</span>
                            <span class="session-widget-duration">${duration}</span>
                        </div>
                        <div class="session-widget-area">${entry.practiceArea}</div>
                    </div>
                `;
            }).join('');

            // Add CSS for widget items
            const style = document.createElement('style');
            style.textContent = `
                .session-widget-item {
                    padding: 0.75rem;
                    background: var(--bg-input);
                    border-radius: var(--radius-md);
                    margin-bottom: 0.5rem;
                    transition: all var(--transition-base);
                }

                .session-widget-item:hover {
                    transform: translateX(4px);
                    background: rgba(99, 102, 241, 0.05);
                }

                .session-widget-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.25rem;
                }

                .session-widget-time {
                    color: var(--text-secondary);
                    font-size: 0.8rem;
                }

                .session-widget-duration {
                    color: var(--primary);
                    font-size: 0.8rem;
                    font-weight: 600;
                }

                .session-widget-area {
                    color: var(--text-primary);
                    font-size: 0.9rem;
                }
            `;
            if (!document.getElementById('session-widget-styles')) {
                style.id = 'session-widget-styles';
                document.head.appendChild(style);
            }
        } catch (error) {
            console.error('Error loading recent sessions widget:', error);
        }
    }

    async loadRecentSessions() {
        try {
            const entries = await this.storageService.getPracticeEntries();
            const container = document.getElementById('historyContainer');

            if (!container) return;

            if (!Array.isArray(entries) || entries.length === 0) {
                container.innerHTML = `
                    <p class="empty-state">No practice sessions yet. Start your first session!</p>
                `;
                return;
            }

            // Filter based on selected period
            const filterValue = document.getElementById('historyFilter')?.value || 'all';
            const filteredEntries = this.filterEntriesByPeriod(entries, filterValue);

            // Use virtual scrolling for large lists
            if (filteredEntries.length > 20) {
                container.innerHTML = '<div class="virtual-scroll-container" id="virtualSessions"></div>';
                const virtualContainer = document.getElementById('virtualSessions');

                if (this.virtualSessionsList) {
                    this.virtualSessionsList.destroy();
                }

                this.virtualSessionsList = new VirtualSessionsList(
                    virtualContainer,
                    filteredEntries,
                    TimeUtils
                );
            } else {
                // Regular rendering for small lists
                container.innerHTML = filteredEntries.map(entry => this.renderSessionCard(entry)).join('');
            }

            this.debouncedCheckStorage();
        } catch (error) {
            console.error('Error loading recent sessions:', error);
            const container = document.getElementById('historyContainer');
            if (container) {
                container.innerHTML = `
                    <p class="empty-state">Error loading sessions. Please refresh the page.</p>
                `;
            }
        }
    }

    filterEntriesByPeriod(entries, period) {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (period) {
            case 'week':
                const weekAgo = new Date(startOfDay);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return entries.filter(entry => new Date(entry.date) >= weekAgo);

            case 'month':
                const monthAgo = new Date(startOfDay);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return entries.filter(entry => new Date(entry.date) >= monthAgo);

            case 'year':
                const yearAgo = new Date(startOfDay);
                yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                return entries.filter(entry => new Date(entry.date) >= yearAgo);

            default:
                return entries;
        }
    }

    renderSessionCard(entry) {
        const date = new Date(entry.date);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        const duration = TimeUtils.formatDuration(entry.duration);

        return `
            <div class="session-card fade-in">
                <div class="session-header">
                    <span class="session-date">${formattedDate}</span>
                    <span class="session-duration">${duration}</span>
                </div>
                <div class="session-details">
                    <div class="session-detail">
                        <span class="detail-label">Practice Area</span>
                        <span class="detail-value">${entry.practiceArea}</span>
                    </div>
                    ${entry.bpm ? `
                        <div class="session-detail">
                            <span class="detail-label">BPM</span>
                            <span class="detail-value">${entry.bpm}</span>
                        </div>
                    ` : ''}
                    ${entry.key ? `
                        <div class="session-detail">
                            <span class="detail-label">Key</span>
                            <span class="detail-value">${entry.key}</span>
                        </div>
                    ` : ''}
                </div>
                ${entry.notes ? `<div class="session-notes">${entry.notes}</div>` : ''}
            </div>
        `;
    }

    checkPracticeReminder() {
        try {
            this.storageService.getPracticeEntries().then(entries => {
                if (!Array.isArray(entries)) return;

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const practicedToday = entries.some(entry => {
                    const entryDate = new Date(entry.date);
                    entryDate.setHours(0, 0, 0, 0);
                    return entryDate.getTime() === today.getTime();
                });

                const currentHour = new Date().getHours();
                if (!practicedToday && currentHour >= 18) {
                    this.showPracticeReminder();
                }
            });
        } catch (error) {
            console.error('Error checking practice reminder:', error);
        }
    }

    showPracticeReminder() {
        const modal = document.createElement('div');
        modal.className = 'reminder-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>🎸 Time to Practice!</h2>
                <p>You haven't practiced today. Even 10 minutes makes a difference!</p>
                <button class="btn btn-primary" onclick="this.closest('.reminder-modal').remove()">
                    Let's Practice!
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    attachEventListeners() {
        // Tab navigation
        const navItems = this.container.querySelectorAll('.nav-item[data-tab]');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                this.switchTab(item.dataset.tab);
            });
        });

        // Mobile menu toggle
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => this.toggleMobileMenu());
        }

        // Close mobile menu on outside click
        this.container.addEventListener('click', (e) => {
            const sidebar = this.container.querySelector('.sidebar');
            const toggle = document.getElementById('mobileMenuToggle');
            if (!sidebar.contains(e.target) && !toggle.contains(e.target) && sidebar.classList.contains('open')) {
                this.closeMobileMenu();
            }
        });

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const newTheme = this.themeService.toggleTheme();
                themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to logout?')) {
                    this.authService.logout();
                    window.location.reload();
                }
            });
        }

        // Quick action button (FAB)
        const quickActionBtn = document.getElementById('quickActionBtn');
        if (quickActionBtn) {
            quickActionBtn.addEventListener('click', () => {
                this.switchTab('practice');
                // Focus on timer start button
                setTimeout(() => {
                    const startBtn = document.getElementById('compactStartTimer');
                    if (startBtn) startBtn.click();
                }, 100);
            });
        }

        // Export/Import
        const exportBtn = document.getElementById('exportBtn');
        const importFile = document.getElementById('importFile');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        if (importFile) {
            importFile.addEventListener('change', (e) => this.importData(e.target.files[0]));
        }

        // History filter
        const historyFilter = document.getElementById('historyFilter');
        if (historyFilter) {
            historyFilter.addEventListener('change', () => this.loadRecentSessions());
        }

        // Calendar navigation
        const calendarBtn = document.getElementById('viewCalendarBtn');
        if (calendarBtn) {
            calendarBtn.addEventListener('click', async () => {
                console.log('Calendar button clicked');

                try {
                    // Clean up current page
                    this.destroy();

                    // Navigate to calendar using the app's router
                    if (window.app && window.app.loadCalendarPage) {
                        await window.app.loadCalendarPage();
                    } else {
                        // Fallback: direct import and initialization
                        const baseUrl = window.location.origin;
                        const basePath = window.location.pathname.includes('/journal/') ? '/journal/' : '/';
                        const modulePath = `${baseUrl}${basePath}src/pages/calendar.js`;

                        const { CalendarPage } = await import(modulePath);
                        const calendarPage = new CalendarPage(this.storageService, this.authService);
                        await calendarPage.init();

                        // Update window.app reference if it exists
                        if (window.app) {
                            window.app.currentPage = calendarPage;
                        }
                    }
                } catch (error) {
                    console.error('Error navigating to calendar:', error);
                    notificationManager.error('Failed to load calendar page. Please refresh and try again.');
                }
            });
        }

        // Listen for practice session saved events
        window.addEventListener('practiceSessionSaved', async () => {
            await this.loadRecentSessions();
            await this.loadRecentSessionsWidget();
            await this.renderCompactStats();
        });

        // Handle browser back/forward
        window.addEventListener('hashchange', () => {
            this.initializeFromHash();
        });
    }

    async exportData() {
        try {
            const exportResult = await this.storageService.exportData();

            let dataToExport;
            let filename;

            if (exportResult.compressed) {
                console.log(`Data compressed from ${exportResult.uncompressedSize} to ${exportResult.compressedSize} bytes (${exportResult.compressionRatio})`);

                dataToExport = JSON.stringify({
                    compressed: true,
                    data: exportResult.data,
                    compressionInfo: {
                        uncompressedSize: exportResult.uncompressedSize,
                        compressedSize: exportResult.compressedSize,
                        ratio: exportResult.compressionRatio
                    }
                });
                filename = `guitar-practice-compressed-${new Date().toISOString().split('T')[0]}.json`;
            } else {
                dataToExport = JSON.stringify(exportResult, null, 2);
                filename = `guitar-practice-backup-${new Date().toISOString().split('T')[0]}.json`;
            }

            const blob = new Blob([dataToExport], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();

            URL.revokeObjectURL(url);

            notificationManager.success('Data exported successfully! 📥');
        } catch (error) {
            notificationManager.error('Failed to export data. Please try again.');
            console.error('Export error:', error);
        }
    }

    async importData(file) {
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (confirm('This will replace all your current data. Are you sure?')) {
                await this.storageService.importData(data);
                await this.loadData();

                for (const component of Object.values(this.components)) {
                    if (component.render) {
                        component.render();
                    }
                }

                notificationManager.success('Data imported successfully! 📤');
            }
        } catch (error) {
            notificationManager.error('Error importing data. Please check the file.');
            console.error('Import error:', error);
        }
    }

    async checkStorageUsage() {
        try {
            const storageInfo = await this.storageService.getStorageInfo();
            const indicator = document.getElementById('storageIndicator');

            if (storageInfo && indicator) {
                const localStorageUsed = storageInfo.localStorage.used || 0;
                const localStorageQuota = 5 * 1024 * 1024; // 5MB typical localStorage limit
                const percentage = Math.round((localStorageUsed / localStorageQuota) * 100);

                indicator.innerHTML = `
                    <div class="storage-usage">
                        <div class="storage-info">
                            <span>Local Storage: ${this.formatBytes(localStorageUsed)} / ${this.formatBytes(localStorageQuota)}</span>
                            <span class="storage-percentage">${percentage}%</span>
                        </div>
                        <div class="storage-bar">
                            <div class="storage-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                `;

                if (percentage > 80) {
                    notificationManager.warning('Storage space running low. Consider exporting old data.');
                    indicator.classList.add('storage-warning');
                } else if (percentage > 95) {
                    notificationManager.error('Storage space critical! Export data to free up space.');
                    indicator.classList.add('storage-critical');
                }

                // Add storage info styles
                const style = document.createElement('style');
                style.textContent = `
                    .storage-info {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 0.5rem;
                        color: var(--text-secondary);
                        font-size: 0.9rem;
                    }

                    .storage-percentage {
                        font-weight: 600;
                        color: var(--primary);
                    }

                    .storage-warning .storage-percentage {
                        color: var(--warning);
                    }

                    .storage-critical .storage-percentage {
                        color: var(--danger);
                    }
                `;
                if (!document.getElementById('storage-info-styles')) {
                    style.id = 'storage-info-styles';
                    document.head.appendChild(style);
                }
            }
        } catch (error) {
            console.error('Error checking storage:', error);
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    setupAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            if (this.components.practiceForm) {
                this.components.practiceForm.saveFormState();
            }
        }, 30000);
    }

    destroy() {
        // Clean up all components
        Object.values(this.components).forEach(component => {
            try {
                if (component && component.destroy) {
                    component.destroy();
                }
            } catch (error) {
                console.warn('Error destroying component:', error);
            }
        });

        if (this.virtualSessionsList) {
            this.virtualSessionsList.destroy();
        }

        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        window.removeEventListener('practiceSessionSaved', this.loadRecentSessions);
        window.removeEventListener('hashchange', this.initializeFromHash);

        if (this.container) {
            this.container.remove();
        }
    }
}
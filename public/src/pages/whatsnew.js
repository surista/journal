// What's New Page
export class WhatsNewPage {
    render() {
        return `
            <div class="whats-new-page">
                <div class="page-header">
                    <h1>What's New in v10.98</h1>
                    <p class="subtitle">Latest updates and improvements to Guitar Practice Journal</p>
                </div>

                <div class="release-section">
                    <div class="version-badge">v10.98</div>
                    <h2>Latest Release - January 2025</h2>
                    
                    <div class="release-highlights">
                        <div class="highlight-card new">
                            <div class="highlight-icon">🧪</div>
                            <h3>Testing Framework</h3>
                            <p>Added Jest testing framework with comprehensive test setup for improved code quality and reliability.</p>
                        </div>
                        
                        <div class="highlight-card new">
                            <div class="highlight-icon">🔒</div>
                            <h3>Enhanced Security</h3>
                            <p>Improved Content Security Policy and added Subresource Integrity (SRI) to all external scripts.</p>
                        </div>
                        
                        <div class="highlight-card improved">
                            <div class="highlight-icon">🔄</div>
                            <h3>Version Management</h3>
                            <p>Automatic version updates across all files with improved build scripts and consistency checks.</p>
                        </div>
                        
                        <div class="highlight-card new">
                            <div class="highlight-icon">📋</div>
                            <h3>Code Quality</h3>
                            <p>ESLint and Prettier configuration for consistent code style across the entire project.</p>
                        </div>
                    </div>
                </div>

                <div class="release-section">
                    <div class="version-badge">v10.94</div>
                    <h2>January 2025</h2>
                    
                    <div class="detailed-changes">
                        <h3>🎵 Loop Validation</h3>
                        <ul>
                            <li><strong>Smart Loop Points</strong> - Prevents invalid start/end points with automatic validation</li>
                            <li><strong>Visual Feedback</strong> - Clear indicators when setting loop boundaries</li>
                            <li><strong>Error Prevention</strong> - Automatically clears invalid loop configurations</li>
                        </ul>
                    </div>
                </div>

                <div class="release-section">
                    <div class="version-badge">v10.93</div>
                    <h2>January 2025</h2>
                    
                    <div class="detailed-changes">
                        <h3>🎨 Theme Updates</h3>
                        <ul>
                            <li><strong>Theme Improvements</strong> - Enhanced color consistency across all 23+ themes</li>
                            <li><strong>Favorites Feature</strong> - Mark and quickly access your favorite practice sessions</li>
                            <li><strong>UI Polish</strong> - Refined spacing and visual hierarchy throughout the app</li>
                        </ul>
                    </div>
                </div>

                <div class="release-section">
                    <div class="version-badge">v10.92</div>
                    <h2>January 2025</h2>
                    
                    <div class="release-highlights">
                        <div class="highlight-card new">
                            <div class="highlight-icon">📁</div>
                            <h3>Audio File Tracking</h3>
                            <p>Audio file names are now saved with your practice sessions and included in CSV exports for better organization.</p>
                        </div>
                        
                        <div class="highlight-card new">
                            <div class="highlight-icon">⚡</div>
                            <h3>YouTube Speed Progression</h3>
                            <p>Gradually increase playback speed with percentage-based increments - perfect for building up to full tempo!</p>
                        </div>
                        
                        <div class="highlight-card improved">
                            <div class="highlight-icon">🎯</div>
                            <h3>Enhanced Metronome</h3>
                            <p>Visual feedback shows current BPM, measure progress, and tempo changes with smooth animations.</p>
                        </div>
                        
                        <div class="highlight-card fixed">
                            <div class="highlight-icon">🔧</div>
                            <h3>Timer Sync Fixes</h3>
                            <p>Fixed timer synchronization with audio/YouTube playback and metronome tempo changes.</p>
                        </div>
                    </div>
                </div>

                <div class="release-section">
                    <div class="version-badge">v10.89</div>
                    <h2>January 2025</h2>
                    
                    <div class="detailed-changes">
                        <h3>🌟 Major Features</h3>
                        <ul>
                            <li><strong>YouTube Loop Saving</strong> - Save and restore loop points for YouTube videos</li>
                            <li><strong>Keyboard Shortcuts</strong> - Press 'L' to toggle loop in YouTube mode</li>
                            <li><strong>Better Error Handling</strong> - Graceful handling of non-critical errors without blocking the app</li>
                            <li><strong>Achievement Improvements</strong> - Cleaner badge display with descriptions on hover</li>
                        </ul>
                        
                        <h3>🐛 Bug Fixes</h3>
                        <ul>
                            <li>Fixed YouTube play/pause button sync issues</li>
                            <li>Resolved duplicate loop controls in YouTube interface</li>
                            <li>Fixed promise rejection errors during app initialization</li>
                            <li>Improved Firebase App Check error handling</li>
                        </ul>
                    </div>
                </div>

                <div class="release-section">
                    <div class="version-badge">v8.6</div>
                    <h2>December 2024</h2>
                    
                    <div class="detailed-changes">
                        <h3>Major Features</h3>
                        <ul>
                            <li>Complete UI redesign with modern card-based layout</li>
                            <li>Tempo progression for gradual speed increases</li>
                            <li>Enhanced waveform visualization</li>
                            <li>Improved mobile experience</li>
                            <li>Better error handling and recovery</li>
                        </ul>
                    </div>
                </div>

                <div class="update-notification">
                    <h3>Stay Updated</h3>
                    <p>Guitar Practice Journal updates automatically when you visit the app. You'll see a notification when new features are available.</p>
                    <div class="update-features">
                        <div class="update-feature">
                            <i class="icon">🔄</i>
                            <span>Automatic Updates</span>
                        </div>
                        <div class="update-feature">
                            <i class="icon">💾</i>
                            <span>Data Always Preserved</span>
                        </div>
                        <div class="update-feature">
                            <i class="icon">📱</i>
                            <span>Cross-Device Sync</span>
                        </div>
                    </div>
                </div>

                <div class="changelog-link">
                    <p>For complete version history, see our <a href="https://github.com/yourusername/guitar-practice-journal/blob/main/CHANGELOG.md" target="_blank">full changelog</a> on GitHub.</p>
                </div>
            </div>
        `;
    }
}

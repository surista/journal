// What's New Page
export class WhatsNewPage {
    render() {
        return `
            <div class="whats-new-page">
                <div class="page-header">
                    <h1>What's New in v10.92</h1>
                    <p class="subtitle">Latest updates and improvements to Guitar Practice Journal</p>
                </div>

                <div class="release-section">
                    <div class="version-badge">v10.92</div>
                    <h2>Latest Release - January 2025</h2>
                    
                    <div class="release-highlights">
                        <div class="highlight-card new">
                            <div class="highlight-icon">🎬</div>
                            <h3>YouTube Integration</h3>
                            <p>Practice along with YouTube videos! Load any YouTube URL, set loop points, and use all audio tools including speed control and pitch shifting.</p>
                        </div>
                        
                        <div class="highlight-card improved">
                            <div class="highlight-icon">🎵</div>
                            <h3>Compact Audio Controls</h3>
                            <p>Redesigned audio interface puts speed, pitch, and volume controls in one convenient section. Less scrolling, more practicing!</p>
                        </div>
                        
                        <div class="highlight-card new">
                            <div class="highlight-icon">🔄</div>
                            <h3>Enhanced Loop Markers</h3>
                            <p>Visual loop markers now work perfectly with YouTube videos. Set start and end points with clear green/red indicators.</p>
                        </div>
                        
                        <div class="highlight-card new">
                            <div class="highlight-icon">📍</div>
                            <h3>Smart Loop Point Validation</h3>
                            <p>Setting a start point after the end point? The app now handles this intelligently by clearing and resetting your loop.</p>
                        </div>
                    </div>

                    <div class="detailed-changes">
                        <h3>🚀 New Features</h3>
                        <ul>
                            <li><strong>YouTube Video Support</strong> - Load and practice with any YouTube video URL</li>
                            <li><strong>YouTube Progress Bar</strong> - Visual progress tracking for YouTube videos with seek functionality</li>
                            <li><strong>Unified Audio Controls</strong> - All controls in one compact, accessible section</li>
                            <li><strong>Footer Navigation</strong> - New footer with quick access to all app sections</li>
                            <li><strong>Loop Point Intelligence</strong> - Automatic validation when setting invalid loop ranges</li>
                        </ul>

                        <h3>💪 Improvements</h3>
                        <ul>
                            <li>Simplified speed control to just a slider for cleaner interface</li>
                            <li>Pitch control now shows just the semitone value (not "semitones")</li>
                            <li>Better visual feedback for loop markers in YouTube mode</li>
                            <li>Fixed duplicate loop markers issue</li>
                            <li>YouTube progress bar resets properly when stopping</li>
                            <li>Clear button now works correctly for YouTube loops</li>
                            <li>Removed redundant logout button from header</li>
                        </ul>

                        <h3>🐛 Bug Fixes</h3>
                        <ul>
                            <li>Fixed timer sync checkbox initialization</li>
                            <li>Resolved YouTube loop marker positioning issues</li>
                            <li>Fixed clear loop function for YouTube videos</li>
                            <li>Corrected pitch value display format</li>
                            <li>Fixed YouTube progress not resetting on stop</li>
                        </ul>
                    </div>
                </div>

                <div class="release-section">
                    <div class="version-badge">v8.6</div>
                    <h2>Previous Release - December 2024</h2>
                    
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
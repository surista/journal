// Features Page
export class FeaturesPage {
    render() {
        return `
            <div class="features-page">
                <div class="page-header">
                    <h1>Features</h1>
                    <p class="subtitle">Everything you need to track and improve your guitar practice</p>
                </div>

                <div class="features-grid">
                    <!-- Practice Tracking -->
                    <div class="feature-category">
                        <h2>📝 Practice Tracking</h2>
                        <div class="feature-list">
                            <div class="feature-item">
                                <h3>Smart Session Timer</h3>
                                <p>Track practice time with a persistent timer that works across all tabs. Set daily goals and see real-time progress.</p>
                                <ul>
                                    <li>Continues running even if you close the browser</li>
                                    <li>Syncs with audio player and metronome</li>
                                    <li>Visual goal progress indicators</li>
                                    <li>Session milestone notifications</li>
                                </ul>
                            </div>
                            
                            <div class="feature-item">
                                <h3>Detailed Session Logging</h3>
                                <p>Record what you practiced, not just how long. Track specific areas, tempos, and progress notes.</p>
                                <ul>
                                    <li>10+ predefined practice areas</li>
                                    <li>Custom practice areas</li>
                                    <li>BPM and key tracking</li>
                                    <li>Rich session notes</li>
                                </ul>
                            </div>

                            <div class="feature-item">
                                <h3>Practice Streaks</h3>
                                <p>Build consistency with visual streak tracking and motivational badges.</p>
                                <ul>
                                    <li>GitHub-style contribution calendar</li>
                                    <li>Streak badges (5, 10, 15, 30, 60, 90 days)</li>
                                    <li>Monthly and yearly overviews</li>
                                    <li>Practice intensity visualization</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <!-- Audio Tools -->
                    <div class="feature-category">
                        <h2>🎵 Audio Tools</h2>
                        <div class="feature-list">
                            <div class="feature-item">
                                <h3>Advanced Audio Player</h3>
                                <p>Professional-grade audio processing for effective practice with backing tracks and songs.</p>
                                <ul>
                                    <li>MP3 file support (up to 20MB)</li>
                                    <li>YouTube video support</li>
                                    <li>High-quality tempo adjustment (50-150%)</li>
                                    <li>Pitch preservation during tempo changes</li>
                                </ul>
                            </div>

                            <div class="feature-item">
                                <h3>A-B Loop Practice</h3>
                                <p>Focus on difficult sections with precision loop controls.</p>
                                <ul>
                                    <li>Visual waveform with loop markers</li>
                                    <li>Click-to-set loop points</li>
                                    <li>Loop counter for repetition tracking</li>
                                    <li>Save loop configurations</li>
                                </ul>
                            </div>

                            <div class="feature-item">
                                <h3>Pitch Shifting</h3>
                                <p>Transpose songs to match your tuning or vocal range.</p>
                                <ul>
                                    <li>±12 semitones range</li>
                                    <li>Half-step precision</li>
                                    <li>Quick preset buttons</li>
                                    <li>Real-time processing</li>
                                </ul>
                            </div>

                            <div class="feature-item">
                                <h3>Tempo Progression</h3>
                                <p>Gradually increase tempo as you master difficult passages.</p>
                                <ul>
                                    <li>Automatic tempo increases after loops</li>
                                    <li>Percentage or BPM increments</li>
                                    <li>Configurable progression intervals</li>
                                    <li>Visual progress tracking</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <!-- Metronome -->
                    <div class="feature-category">
                        <h2>🥁 Metronome</h2>
                        <div class="feature-list">
                            <div class="feature-item">
                                <h3>Professional Metronome</h3>
                                <p>Precise timing tool with visual and audio feedback.</p>
                                <ul>
                                    <li>40-300 BPM range</li>
                                    <li>Visual beat indicators</li>
                                    <li>Multiple time signatures</li>
                                    <li>Accent patterns</li>
                                    <li>Timer synchronization</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <!-- Analytics -->
                    <div class="feature-category">
                        <h2>📊 Analytics & Insights</h2>
                        <div class="feature-list">
                            <div class="feature-item">
                                <h3>Comprehensive Statistics</h3>
                                <p>Understand your practice patterns and progress with detailed analytics.</p>
                                <ul>
                                    <li>Total practice time and sessions</li>
                                    <li>Average session duration</li>
                                    <li>Practice area breakdown</li>
                                    <li>Weekly/monthly trends</li>
                                    <li>Progress recommendations</li>
                                </ul>
                            </div>

                            <div class="feature-item">
                                <h3>Visual Calendar</h3>
                                <p>See your practice journey at a glance with an interactive calendar.</p>
                                <ul>
                                    <li>Monthly practice overview</li>
                                    <li>Daily practice details</li>
                                    <li>Goal completion tracking</li>
                                    <li>Click for session details</li>
                                </ul>
                            </div>

                            <div class="feature-item">
                                <h3>Achievement System</h3>
                                <p>Stay motivated with gamification elements and milestone tracking.</p>
                                <ul>
                                    <li>Unlockable achievement badges</li>
                                    <li>Practice milestones</li>
                                    <li>Personal records</li>
                                    <li>Progress celebrations</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <!-- Goals -->
                    <div class="feature-category">
                        <h2>🎯 Goal Management</h2>
                        <div class="feature-list">
                            <div class="feature-item">
                                <h3>Smart Goal Setting</h3>
                                <p>Set and track practice goals that adapt to your progress.</p>
                                <ul>
                                    <li>Daily/weekly time goals</li>
                                    <li>Area-specific targets</li>
                                    <li>Skill-based objectives</li>
                                    <li>Progress visualization</li>
                                    <li>Goal completion notifications</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <!-- Technical Features -->
                    <div class="feature-category">
                        <h2>⚡ Technical Excellence</h2>
                        <div class="feature-list">
                            <div class="feature-item">
                                <h3>Progressive Web App</h3>
                                <p>Modern web technology for the best user experience.</p>
                                <ul>
                                    <li>Works offline completely</li>
                                    <li>Installs like a native app</li>
                                    <li>Automatic updates</li>
                                    <li>Cross-platform compatibility</li>
                                </ul>
                            </div>

                            <div class="feature-item">
                                <h3>Data Management</h3>
                                <p>Your data, your control, always secure.</p>
                                <ul>
                                    <li>100% local storage</li>
                                    <li>No cloud requirements</li>
                                    <li>Export/import functionality</li>
                                    <li>Automatic compression</li>
                                    <li>Regular backup reminders</li>
                                </ul>
                            </div>

                            <div class="feature-item">
                                <h3>Performance</h3>
                                <p>Optimized for smooth performance on all devices.</p>
                                <ul>
                                    <li>Virtual scrolling for large datasets</li>
                                    <li>Lazy loading components</li>
                                    <li>Efficient memory management</li>
                                    <li>Responsive design</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="cta-section">
                    <h2>Ready to Start?</h2>
                    <p>All these features are available for free, with no sign-up required.</p>
                    <button class="btn btn-primary btn-lg" onclick="window.location.href='/'">
                        Start Practicing Now
                    </button>
                </div>
            </div>
        `;
    }
}
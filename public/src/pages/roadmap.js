// Roadmap Page
export class RoadmapPage {
    render() {
        return `
            <div class="roadmap-page">
                <div class="page-header">
                    <h1>Roadmap</h1>
                    <p class="subtitle">Where Guitar Practice Journal is heading</p>
                </div>

                <div class="roadmap-intro">
                    <p>
                        Our roadmap is shaped by user feedback and our vision for the ultimate practice companion.
                        While we can't guarantee specific timelines, here's what we're working on and planning.
                    </p>
                </div>

                <div class="roadmap-timeline">
                    <!-- Currently Working On -->
                    <div class="roadmap-section current">
                        <div class="section-header">
                            <div class="status-badge in-progress">In Development</div>
                            <h2>Currently Working On</h2>
                        </div>
                        
                        <div class="roadmap-items">
                            <div class="roadmap-item">
                                <div class="item-icon">☁️</div>
                                <div class="item-content">
                                    <h3>Cloud Sync & Backup</h3>
                                    <p>Optional cloud synchronization to keep your practice data in sync across all your devices.</p>
                                    <div class="features-list">
                                        <span class="feature-tag">Automatic sync</span>
                                        <span class="feature-tag">Conflict resolution</span>
                                        <span class="feature-tag">Encrypted storage</span>
                                        <span class="feature-tag">Privacy controls</span>
                                    </div>
                                </div>
                            </div>

                            <div class="roadmap-item">
                                <div class="item-icon">🎼</div>
                                <div class="item-content">
                                    <h3>Tab & Sheet Music Viewer</h3>
                                    <p>Display guitar tabs and sheet music alongside the audio player for synchronized practice.</p>
                                    <div class="features-list">
                                        <span class="feature-tag">Auto-scroll</span>
                                        <span class="feature-tag">Tempo sync</span>
                                        <span class="feature-tag">Annotation tools</span>
                                    </div>
                                </div>
                            </div>

                            <div class="roadmap-item">
                                <div class="item-icon">📱</div>
                                <div class="item-content">
                                    <h3>Native Mobile Apps</h3>
                                    <p>Dedicated iOS and Android apps with platform-specific optimizations.</p>
                                    <div class="features-list">
                                        <span class="feature-tag">Background audio</span>
                                        <span class="feature-tag">Widget support</span>
                                        <span class="feature-tag">Native performance</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Next Up -->
                    <div class="roadmap-section next">
                        <div class="section-header">
                            <div class="status-badge planned">Next Up</div>
                            <h2>Coming Soon</h2>
                        </div>
                        
                        <div class="roadmap-items">
                            <div class="roadmap-item">
                                <div class="item-icon">🤖</div>
                                <div class="item-content">
                                    <h3>AI Practice Assistant</h3>
                                    <p>Intelligent recommendations based on your practice patterns and goals.</p>
                                    <div class="features-list">
                                        <span class="feature-tag">Personalized routines</span>
                                        <span class="feature-tag">Progress analysis</span>
                                        <span class="feature-tag">Technique suggestions</span>
                                    </div>
                                </div>
                            </div>

                            <div class="roadmap-item">
                                <div class="item-icon">🎵</div>
                                <div class="item-content">
                                    <h3>Chord & Scale Detection</h3>
                                    <p>Automatically detect chords and scales in audio files to help with learning songs.</p>
                                    <div class="features-list">
                                        <span class="feature-tag">Real-time detection</span>
                                        <span class="feature-tag">Chord diagrams</span>
                                        <span class="feature-tag">Scale suggestions</span>
                                    </div>
                                </div>
                            </div>

                            <div class="roadmap-item">
                                <div class="item-icon">👥</div>
                                <div class="item-content">
                                    <h3>Community Features</h3>
                                    <p>Connect with other guitarists, share progress, and find practice partners.</p>
                                    <div class="features-list">
                                        <span class="feature-tag">Practice groups</span>
                                        <span class="feature-tag">Progress sharing</span>
                                        <span class="feature-tag">Challenges</span>
                                    </div>
                                </div>
                            </div>

                            <div class="roadmap-item">
                                <div class="item-icon">🎓</div>
                                <div class="item-content">
                                    <h3>Lesson Integration</h3>
                                    <p>Built-in lesson system with structured courses and progress tracking.</p>
                                    <div class="features-list">
                                        <span class="feature-tag">Video lessons</span>
                                        <span class="feature-tag">Practice exercises</span>
                                        <span class="feature-tag">Progress tracking</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Future Vision -->
                    <div class="roadmap-section future">
                        <div class="section-header">
                            <div class="status-badge future">Future Vision</div>
                            <h2>Long-term Goals</h2>
                        </div>
                        
                        <div class="roadmap-items">
                            <div class="roadmap-item">
                                <div class="item-icon">🎸</div>
                                <div class="item-content">
                                    <h3>Multi-Instrument Support</h3>
                                    <p>Expand beyond guitar to support bass, ukulele, piano, and more.</p>
                                </div>
                            </div>

                            <div class="roadmap-item">
                                <div class="item-icon">🎤</div>
                                <div class="item-content">
                                    <h3>Audio Recording</h3>
                                    <p>Record your practice sessions and track improvement over time.</p>
                                </div>
                            </div>

                            <div class="roadmap-item">
                                <div class="item-icon">🎮</div>
                                <div class="item-content">
                                    <h3>Gamification 2.0</h3>
                                    <p>Advanced achievement system with levels, rewards, and competitions.</p>
                                </div>
                            </div>

                            <div class="roadmap-item">
                                <div class="item-icon">🔌</div>
                                <div class="item-content">
                                    <h3>Plugin Ecosystem</h3>
                                    <p>Allow developers to create custom plugins and extensions.</p>
                                </div>
                            </div>

                            <div class="roadmap-item">
                                <div class="item-icon">🌍</div>
                                <div class="item-content">
                                    <h3>Localization</h3>
                                    <p>Support for multiple languages to help guitarists worldwide.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="feedback-section">
                    <h2>Shape the Future</h2>
                    <p>
                        Your feedback drives our development. Have an idea or feature request?
                        We'd love to hear from you!
                    </p>
                    <div class="feedback-actions">
                        <a href="https://github.com/yourusername/guitar-practice-journal/issues/new?template=feature_request.md" 
                           class="btn btn-primary" target="_blank">
                            <i class="icon">💡</i> Suggest a Feature
                        </a>
                        <a href="https://github.com/yourusername/guitar-practice-journal/discussions" 
                           class="btn btn-secondary" target="_blank">
                            <i class="icon">💬</i> Join Discussion
                        </a>
                    </div>
                </div>

                <div class="commitment-section">
                    <h3>Our Commitment</h3>
                    <div class="commitments">
                        <div class="commitment">
                            <i class="icon">🔒</i>
                            <p>Privacy-first approach in all new features</p>
                        </div>
                        <div class="commitment">
                            <i class="icon">🆓</i>
                            <p>Core features always free</p>
                        </div>
                        <div class="commitment">
                            <i class="icon">🚀</i>
                            <p>Performance and usability first</p>
                        </div>
                        <div class="commitment">
                            <i class="icon">🤝</i>
                            <p>Community-driven development</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}
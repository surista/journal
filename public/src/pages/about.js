// About Guitar Journal Page
export class AboutPage {
    render() {
        return `
            <div class="about-page">
                <div class="page-header">
                    <h1>About Guitar Practice Journal</h1>
                    <p class="subtitle">Your personal companion for musical growth</p>
                </div>

                <div class="content-section">
                    <div class="hero-section">
                        <div class="hero-content">
                            <h2>🎸 Built by Musicians, for Musicians</h2>
                            <p class="lead">
                                Guitar Practice Journal was born from a simple need: a better way to track practice sessions
                                and actually see progress over time. After years of scattered notes, forgotten practice routines,
                                and lost momentum, we created the tool we wished we had.
                            </p>
                        </div>
                    </div>

                    <div class="philosophy-section">
                        <h2>Our Philosophy</h2>
                        <div class="philosophy-grid">
                            <div class="philosophy-card">
                                <div class="icon">🎯</div>
                                <h3>Focused Practice</h3>
                                <p>Quality over quantity. Track what matters: consistency, progress, and deliberate practice in specific areas.</p>
                            </div>
                            <div class="philosophy-card">
                                <div class="icon">📊</div>
                                <h3>Data-Driven Progress</h3>
                                <p>See your journey visualized. Understand patterns, celebrate milestones, and identify areas for improvement.</p>
                            </div>
                            <div class="philosophy-card">
                                <div class="icon">🔒</div>
                                <h3>Privacy First</h3>
                                <p>Your practice data stays on your device. No cloud requirements, no tracking, just you and your music.</p>
                            </div>
                            <div class="philosophy-card">
                                <div class="icon">🚀</div>
                                <h3>Always Accessible</h3>
                                <p>Works offline, installs like an app, and syncs across your devices. Practice tracking that's always there when you need it.</p>
                            </div>
                        </div>
                    </div>

                    <div class="story-section">
                        <h2>The Story Behind the App</h2>
                        <p>
                            As guitarists ourselves, we struggled with the same challenges you face: maintaining consistent practice,
                            tracking progress across different techniques, and staying motivated during plateaus. Existing solutions
                            were either too complex, required subscriptions, or didn't focus on what really mattered - the practice itself.
                        </p>
                        <p>
                            We started with a simple timer and session log. But as we used it daily, we realized the potential for
                            something more comprehensive. The addition of audio tools came from the need to slow down difficult passages.
                            The streak calendar? That was inspired by the motivation we got from seeing our consistency visualized.
                        </p>
                        <p>
                            Every feature in Guitar Practice Journal comes from real practice room needs. No bloat, no unnecessary
                            complexity - just tools that help you become a better musician.
                        </p>
                    </div>

                    <div class="mission-section">
                        <h2>Our Mission</h2>
                        <blockquote>
                            "To provide guitarists with a simple, powerful, and privacy-respecting tool that makes 
                            deliberate practice easier and progress visible."
                        </blockquote>
                    </div>

                    <div class="team-section">
                        <h2>Built With Love</h2>
                        <p>
                            Guitar Practice Journal is an open-source project maintained by a community of developers
                            and musicians who believe in the power of deliberate practice and open tools.
                        </p>
                        <div class="tech-stack">
                            <h3>Technology</h3>
                            <p>Built with modern web technologies for the best possible experience:</p>
                            <ul>
                                <li><strong>Progressive Web App</strong> - Works offline and installs like a native app</li>
                                <li><strong>Web Audio API</strong> - Professional-grade audio processing</li>
                                <li><strong>IndexedDB</strong> - Secure local storage for your practice data</li>
                                <li><strong>Vanilla JavaScript</strong> - Fast, lightweight, no framework overhead</li>
                            </ul>
                        </div>
                    </div>

                    <div class="support-section">
                        <h2>Support the Project</h2>
                        <p>
                            Guitar Practice Journal is free and open source. If you find it valuable, consider:
                        </p>
                        <ul>
                            <li>⭐ Starring the project on GitHub</li>
                            <li>🐛 Reporting bugs or suggesting features</li>
                            <li>🤝 Contributing code or documentation</li>
                            <li>📢 Sharing with fellow musicians</li>
                        </ul>
                    </div>

                    <div class="contact-section">
                        <h2>Get in Touch</h2>
                        <p>
                            Have questions, suggestions, or just want to share your practice success story?
                            We'd love to hear from you!
                        </p>
                        <div class="contact-buttons">
                            <a href="https://github.com/yourusername/guitar-practice-journal" class="btn btn-primary">
                                <i class="icon">📦</i> View on GitHub
                            </a>
                            <a href="mailto:support@guitarjournal.app" class="btn btn-secondary">
                                <i class="icon">📧</i> Email Support
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}
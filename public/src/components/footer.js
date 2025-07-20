// Footer Component - Always-visible copyright and version
export class Footer {
    constructor() {
        // Don't set these here - check them in render() method
    }

    render() {
        const currentYear = new Date().getFullYear();

        // Get version info at render time (when globals should be available)
        const version = window.APP_VERSION || '8.6';
        const buildNumber = window.BUILD_NUMBER || 'unknown';
        const buildDate = window.BUILD_DATE || new Date().toISOString();

        console.log('Footer render - version info:', { version, buildNumber, buildDate });

        return `
            <footer class="app-footer">
                <div class="footer-container">
                    <div class="footer-left">
                        <div class="footer-branding">
                            <span class="footer-copyright">© ${currentYear} Guitar Practice Journal</span>
                            <span class="footer-version-badge" title="Build ${buildNumber} - ${new Date(buildDate).toLocaleDateString()}">
                                v${version}
                            </span>
                        </div>
                    </div>
                    
                    <nav class="footer-nav">
                        <div class="footer-dropdown">
                            <button class="footer-dropdown-trigger">ABOUT</button>
                            <div class="footer-dropdown-content">
                                <a href="#" class="footer-link" data-action="about">About Guitar Journal</a>
                                <a href="#" class="footer-link" data-action="features">Features</a>
                                <a href="#" class="footer-link" data-action="whatsnew">What's New</a>
                                <a href="#" class="footer-link" data-action="roadmap">Roadmap</a>
                            </div>
                        </div>
                        
                        <div class="footer-dropdown">
                            <button class="footer-dropdown-trigger">SUPPORT</button>
                            <div class="footer-dropdown-content">
                                <a href="#" class="footer-link" data-action="help">Help & FAQ</a>
                                <a href="#" class="footer-link" data-action="shortcuts">Keyboard Shortcuts</a>
                                <a href="https://github.com/yourusername/guitar-practice-journal/issues" target="_blank" rel="noopener">Report an Issue</a>
                                <a href="#" class="footer-link" data-action="contact">Contact Us</a>
                            </div>
                        </div>
                        
                        <div class="footer-dropdown">
                            <button class="footer-dropdown-trigger">LEGAL</button>
                            <div class="footer-dropdown-content">
                                <a href="#" class="footer-link" data-action="privacy">Privacy Policy</a>
                                <a href="#" class="footer-link" data-action="terms">Terms of Service</a>
                                <a href="#" class="footer-link" data-action="cookies">Cookie Policy</a>
                                <a href="#" class="footer-link" data-action="licenses">Open Source Licenses</a>
                            </div>
                        </div>
                        
                        <div class="footer-dropdown">
                            <button class="footer-dropdown-trigger">CONNECT</button>
                            <div class="footer-dropdown-content">
                                <a href="https://github.com/yourusername/guitar-practice-journal" target="_blank" rel="noopener">
                                    <i class="icon">📦</i> GitHub
                                </a>
                                <a href="#" class="footer-link" data-action="discord">
                                    <i class="icon">💬</i> Discord Community
                                </a>
                                <a href="#" class="footer-link" data-action="newsletter">
                                    <i class="icon">📧</i> Newsletter
                                </a>
                            </div>
                        </div>
                    </nav>
                    
                    <!-- REMOVED THE LOGOUT BUTTON FROM FOOTER -->
                </div>
            </footer>
        `;
    }

    attachEventListeners() {
        // Remove logout button code since we removed it from the footer

        // Footer links with data-action attributes
        const footerLinks = document.querySelectorAll('.footer-link[data-action]');
        footerLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const action = e.currentTarget.getAttribute('data-action');
                this.handleFooterAction(action);
            });
        });
    }

    handleFooterAction(action) {
        switch (action) {
            case 'about':
                this.showAboutModal();
                break;
            case 'features':
                this.showFeaturesModal();
                break;
            case 'whatsnew':
                this.showWhatsNewModal();
                break;
            case 'roadmap':
                this.showRoadmapModal();
                break;
            case 'help':
                this.showHelpModal();
                break;
            case 'shortcuts':
                this.showShortcutsModal();
                break;
            case 'contact':
                this.showContactModal();
                break;
            case 'privacy':
                this.showPrivacyPolicy();
                break;
            case 'terms':
                this.showTermsOfService();
                break;
            case 'cookies':
                this.showCookiePolicy();
                break;
            case 'licenses':
                this.showLicenses();
                break;
            case 'discord':
                window.open('https://discord.gg/yourinvite', '_blank');
                break;
            case 'newsletter':
                this.showNewsletterModal();
                break;
            default:
                console.warn('Unknown footer action:', action);
        }
    }

    showAboutModal() {
        import('../pages/about.js').then(module => {
            const aboutPage = new module.AboutPage();
            this.showPageModal('About Guitar Journal', aboutPage.render());
        });
    }

    showFeaturesModal() {
        import('../pages/features.js').then(module => {
            const featuresPage = new module.FeaturesPage();
            this.showPageModal('Features', featuresPage.render());
        });
    }

    showWhatsNewModal() {
        import('../pages/whatsnew.js').then(module => {
            const whatsNewPage = new module.WhatsNewPage();
            this.showPageModal("What's New", whatsNewPage.render());
        });
    }

    showRoadmapModal() {
        import('../pages/roadmap.js').then(module => {
            const roadmapPage = new module.RoadmapPage();
            this.showPageModal('Roadmap', roadmapPage.render());
        });
    }

    showShortcutsModal() {
        const content = `
            <div class="shortcuts-modal">
                <h3>Keyboard Shortcuts</h3>
                <div class="shortcuts-list">
                    <div class="shortcut-item">
                        <span>Start/Stop Timer</span>
                        <kbd>Space</kbd>
                    </div>
                    <div class="shortcut-item">
                        <span>New Practice Session</span>
                        <kbd>Ctrl + N</kbd>
                    </div>
                    <div class="shortcut-item">
                        <span>Save Session</span>
                        <kbd>Ctrl + S</kbd>
                    </div>
                    <div class="shortcut-item">
                        <span>Open Audio Player</span>
                        <kbd>Ctrl + A</kbd>
                    </div>
                    <div class="shortcut-item">
                        <span>Open Metronome</span>
                        <kbd>Ctrl + M</kbd>
                    </div>
                    <div class="shortcut-item">
                        <span>Close Modal</span>
                        <kbd>Esc</kbd>
                    </div>
                </div>
            </div>
        `;
        this.showPageModal('Keyboard Shortcuts', content);
    }

    showPrivacyPolicy() {
        const content = `
            <div class="legal-content">
                <h3>Privacy Policy</h3>
                <p><strong>Last updated: ${new Date().toLocaleDateString()}</strong></p>
                
                <h4>Data Storage</h4>
                <p>Guitar Practice Journal stores all your data locally on your device. We do not collect, transmit, or store any personal information on external servers.</p>
                
                <h4>Local Storage</h4>
                <p>Your practice data, settings, and audio files are stored using browser local storage technologies. This data remains on your device and is never sent to any external servers.</p>
                
                <h4>Third-Party Services</h4>
                <p>When using YouTube integration, you are subject to YouTube's privacy policy. We only access publicly available video data through their API.</p>
                
                <h4>Contact</h4>
                <p>For privacy concerns, please contact us at privacy@guitarjournal.app</p>
            </div>
        `;
        this.showPageModal('Privacy Policy', content);
    }

    showTermsOfService() {
        const content = `
            <div class="legal-content">
                <h3>Terms of Service</h3>
                <p><strong>Last updated: ${new Date().toLocaleDateString()}</strong></p>
                
                <h4>Acceptance of Terms</h4>
                <p>By using Guitar Practice Journal, you agree to these terms of service.</p>
                
                <h4>Use License</h4>
                <p>Guitar Practice Journal is provided free of charge for personal, non-commercial use.</p>
                
                <h4>Disclaimer</h4>
                <p>This software is provided "as is" without warranty of any kind. We are not responsible for any data loss or damages.</p>
                
                <h4>Open Source</h4>
                <p>Guitar Practice Journal is open source software. You are free to modify and distribute it according to the project license.</p>
            </div>
        `;
        this.showPageModal('Terms of Service', content);
    }

    showPageModal(title, content) {
        // Remove any existing modals first
        const existingModal = document.querySelector('.page-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'modal page-modal';
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';
        modal.innerHTML = `
            <div class="modal-content page-modal-content">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body page-modal-body">
                    <div class="info-page-wrapper">
                        ${content}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Force a reflow
        modal.offsetHeight;

        // Show the modal
        requestAnimationFrame(() => {
            modal.style.display = 'block';
            modal.style.transition = 'opacity 0.2s ease, visibility 0.2s ease';
            modal.style.opacity = '1';
            modal.style.visibility = 'visible';
        });

        // Add close button functionality
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => {
            modal.style.opacity = '0';
            modal.style.visibility = 'hidden';
            setTimeout(() => modal.remove(), 200);
        });

        // Add close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.opacity = '0';
                modal.style.visibility = 'hidden';
                setTimeout(() => modal.remove(), 200);
            }
        });

        // Add escape key to close
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                modal.style.opacity = '0';
                modal.style.visibility = 'hidden';
                setTimeout(() => modal.remove(), 200);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    // Placeholder methods for features not yet implemented
    showHelpModal() {
        this.showPageModal('Help & FAQ', '<p>Help content coming soon...</p>');
    }

    showContactModal() {
        this.showPageModal('Contact Us', '<p>Contact form coming soon...</p>');
    }

    showCookiePolicy() {
        this.showPageModal('Cookie Policy', '<p>This app uses local storage only. No tracking cookies are used.</p>');
    }

    showLicenses() {
        this.showPageModal('Open Source Licenses', '<p>License information coming soon...</p>');
    }

    showNewsletterModal() {
        this.showPageModal('Newsletter', '<p>Newsletter signup coming soon...</p>');
    }
}
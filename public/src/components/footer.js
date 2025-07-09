// Footer Component - Compact with Hover Dropdowns
export class Footer {
    constructor() {
        this.version = window.APP_VERSION || '7.6.2';
    }

    // Add these methods to the Footer class

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

    showPageModal(title, content) {
        // Remove any existing modals first
        const existingModal = document.querySelector('.page-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.className = 'modal page-modal';
        modal.style.opacity = '0'; // Start invisible
        modal.style.visibility = 'hidden'; // Ensure it's hidden
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

        // Force a reflow to ensure the modal is properly positioned
        modal.offsetHeight;

        // Now show the modal with a smooth transition
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

    render() {
        const currentYear = new Date().getFullYear();

        return `
            <footer class="app-footer">
                <div class="footer-container">
                    <div class="footer-left">
                        <span class="footer-copyright">&copy; ${currentYear} Guitar Practice Journal</span>
                        <span class="footer-version">Version ${this.version}</span>
                    </div>
                    
                    <nav class="footer-nav">
                        <div class="footer-dropdown">
                            <button class="footer-dropdown-trigger">ABOUT</button>
                            <div class="footer-dropdown-content">
                                <a href="#" id="aboutLink">About Guitar Journal</a>
                                <a href="#" id="featuresLink">Features</a>
                                <a href="#" id="changelogLink">What's New</a>
                                <a href="#" id="roadmapLink">Roadmap</a>
                            </div>
                        </div>
                        
                        <div class="footer-dropdown">
                            <button class="footer-dropdown-trigger">SUPPORT</button>
                            <div class="footer-dropdown-content">
                                <a href="#" id="helpLink">Help & FAQ</a>
                                <a href="#" id="shortcutsLink">Keyboard Shortcuts</a>
                                <a href="https://github.com/yourusername/guitar-practice-journal/issues" target="_blank" rel="noopener">Report an Issue</a>
                                <a href="#" id="contactLink">Contact Us</a>
                            </div>
                        </div>
                        
                        <div class="footer-dropdown">
                            <button class="footer-dropdown-trigger">LEGAL</button>
                            <div class="footer-dropdown-content">
                                <a href="#" id="privacyLink">Privacy Policy</a>
                                <a href="#" id="termsLink">Terms of Service</a>
                                <a href="#" id="cookiesLink">Cookie Policy</a>
                                <a href="#" id="licensesLink">Open Source Licenses</a>
                            </div>
                        </div>
                        
                        <div class="footer-dropdown">
                            <button class="footer-dropdown-trigger">CONNECT</button>
                            <div class="footer-dropdown-content">
                                <a href="https://github.com/yourusername/guitar-practice-journal" target="_blank" rel="noopener">
                                    <i class="icon">📦</i> GitHub
                                </a>
                                <a href="#" id="discordLink">
                                    <i class="icon">💬</i> Discord Community
                                </a>
                                <a href="#" id="newsletterLink">
                                    <i class="icon">📧</i> Newsletter
                                </a>
                            </div>
                        </div>
                    </nav>
                    
                    <div class="footer-right">
                        <button class="footer-logout-btn" id="footerLogoutBtn">
                            <i class="icon">🚪</i> Logout
                        </button>
                    </div>
                </div>
            </footer>
        `;
    }

    attachEventListeners() {
        // Logout button
        document.getElementById('footerLogoutBtn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.clear();
                window.location.href = './login.html';
            }
        });

        // Features link
        document.getElementById('featuresLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showFeaturesModal();
        });

        // What's New link
        document.getElementById('changelogLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showWhatsNewModal();
        });

        // Roadmap link
        document.getElementById('roadmapLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showRoadmapModal();
        });

        // About link
        document.getElementById('aboutLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showAboutModal();
        });

        // Keyboard shortcuts
        document.getElementById('shortcutsLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showShortcutsModal();
        });

        // Privacy Policy
        document.getElementById('privacyLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showPrivacyPolicy();
        });

        // Terms of Service
        document.getElementById('termsLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showTermsOfService();
        });
    }

}
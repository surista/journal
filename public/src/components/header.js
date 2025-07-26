// Header Component with Tab Name, Status, and Theme Toggle
export class Header {
    constructor(themeService) {
        this.themeService = themeService;
        this.currentTab = 'Practice';
        this.statusMessage = '';
        this.statusType = 'success'; // success, warning, error
    }

    setCurrentTab(tabName) {
        this.currentTab = tabName;
        this.updateHeader();
    }

    setStatus(message, type = 'success') {
        this.statusMessage = message;
        this.statusType = type;
        this.updateHeader();
    }

    updateHeader() {
        const headerElement = document.querySelector('.app-header');
        if (headerElement) {
            const tabElement = headerElement.querySelector('.header-tab-name');
            const statusElement = headerElement.querySelector('.header-status');

            if (tabElement) tabElement.textContent = this.currentTab;
            if (statusElement) {
                statusElement.textContent = this.statusMessage;
                statusElement.className = `header-status status-${this.statusType}`;
            }
        }
    }

    render() {
        const currentTheme = this.themeService.getTheme();
        const isDark =
            currentTheme.includes('dark') ||
            currentTheme === 'midnight' ||
            currentTheme === 'dracula';

        // Check if user is demo or real
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const isDemoUser = currentUser.email === 'demo@example.com';
        const syncStatus = isDemoUser
            ? '<span class="sync-status demo-mode" title="Demo mode - No cloud sync">🔒 Local Only</span>'
            : '<span class="sync-status cloud-mode" title="Cloud sync enabled">☁️ Synced</span>';

        return `
            <header class="app-header">
                <div class="header-container">
                    <div class="header-left">
                        <h1 class="header-tab-name">${this.currentTab}</h1>
                    </div>
                    
                    <div class="header-center">
                        <!-- Status removed - tips now show as popup -->
                    </div>
                    
                    <div class="header-right">
                        ${syncStatus}
                        <span class="theme-name" id="currentThemeName">${this.themeService.getThemeData().name.toLowerCase()}</span>
                        <button class="theme-toggle" id="themeToggle" title="Change theme">
                            <span class="theme-icon">${this.themeService.getThemeIcon(currentTheme)}</span>
                        </button>
                        <button class="logout-btn" id="logoutBtn" title="Logout">
                            <span class="logout-icon">⎋</span>
                            <span class="logout-text">Logout</span>
                        </button>
                    </div>
                </div>
            </header>
        `;
    }

    attachEventListeners() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                // Cycle to next theme
                const newTheme = this.themeService.nextTheme();

                // Update the icon
                const icon = themeToggle.querySelector('.theme-icon');
                if (icon) {
                    icon.textContent = this.themeService.getThemeIcon(newTheme);
                }

                // Update theme name
                const themeName = document.getElementById('currentThemeName');
                if (themeName) {
                    themeName.textContent = this.themeService.getThemeData().name.toLowerCase();
                }
            });
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                // Clear user data
                localStorage.removeItem('currentUser');
                localStorage.removeItem('userToken');
                // Redirect to login page
                window.location.href = './login.html';
            });
        }
    }
}

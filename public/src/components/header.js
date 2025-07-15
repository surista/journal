// Header Component with Tab Name, Status, and Theme Toggle
export class Header {
    constructor(themeService) {
        this.themeService = themeService;
        this.currentTab = 'Practice';
        this.statusMessage = 'All systems go';
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
        const isDark = currentTheme.includes('dark') || currentTheme === 'midnight' || currentTheme === 'dracula';
        
        return `
            <header class="app-header">
                <div class="header-container">
                    <div class="header-left">
                        <h1 class="header-tab-name">${this.currentTab}</h1>
                    </div>
                    
                    <div class="header-center">
                        <div class="header-status status-${this.statusType}">
                            <span class="status-indicator"></span>
                            <span class="status-text">${this.statusMessage}</span>
                        </div>
                    </div>
                    
                    <div class="header-right">
                        <div class="theme-toggle-wrapper">
                            <button class="theme-toggle" id="themeToggle" title="Toggle theme">
                                <span class="theme-icon">${isDark ? '☀️' : '🌙'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>
        `;
    }

    attachEventListeners() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const currentTheme = this.themeService.getTheme();
                const isDark = currentTheme.includes('dark') || currentTheme === 'midnight' || currentTheme === 'dracula';
                
                // Toggle between light and dark themes
                const newTheme = isDark ? 'light' : 'dark';
                this.themeService.setTheme(newTheme);
                
                // Update the icon
                const icon = themeToggle.querySelector('.theme-icon');
                if (icon) {
                    icon.textContent = isDark ? '🌙' : '☀️';
                }
            });
        }
    }
}
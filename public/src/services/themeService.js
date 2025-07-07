// Theme Service - Handles dark/light theme switching
export class ThemeService {
    constructor() {
        this.currentTheme = this.loadTheme();
        this.applyTheme();
    }

    loadTheme() {
        return localStorage.getItem('guitarJournalTheme') || 'dark';
    }

    saveTheme(theme) {
        localStorage.setItem('guitarJournalTheme', theme);
        this.currentTheme = theme;
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.saveTheme(newTheme);
        this.applyTheme();
        return newTheme;
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);

        // Update theme color meta tag
        const themeColor = this.currentTheme === 'dark' ? '#0a0a0a' : '#ffffff';
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', themeColor);
        }
    }

    getTheme() {
        return this.currentTheme;
    }
}
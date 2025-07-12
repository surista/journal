// Update your themeService.js to support multiple themes

export class ThemeService {
    constructor() {
        this.themes = {
            dark: {
                name: 'Dark',
                icon: '🌙',
                description: 'Default dark theme'
            },
            light: {
                name: 'Light',
                icon: '☀️',
                description: 'Clean light theme'
            },
            'midnight-blue': {
                name: 'Midnight Blue',
                icon: '🌌',
                description: 'Deep blue with purple accents'
            },
            'forest-green': {
                name: 'Forest Green',
                icon: '🌲',
                description: 'Natural green with earthy tones'
            },
            'sunset-orange': {
                name: 'Sunset Orange',
                icon: '🌅',
                description: 'Warm sunset colors'
            },
            'royal-purple': {
                name: 'Royal Purple',
                icon: '👑',
                description: 'Rich purple with gold accents'
            },
            'ocean-teal': {
                name: 'Ocean Teal',
                icon: '🌊',
                description: 'Deep ocean blues with teal'
            }
        };

        this.currentTheme = this.loadTheme();
        this.applyTheme(this.currentTheme);
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme && this.themes[savedTheme] ? savedTheme : 'dark';
    }

    saveTheme(theme) {
        localStorage.setItem('theme', theme);
    }

    applyTheme(theme) {
        if (!this.themes[theme]) {
            console.warn(`Theme '${theme}' not found, defaulting to dark`);
            theme = 'dark';
        }

        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        this.saveTheme(theme);

        // Update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            const colors = {
                'dark': '#1a1a2e',
                'light': '#ffffff',
                'midnight-blue': '#1a1f2e',
                'forest-green': '#1a2f23',
                'sunset-orange': '#2d1810',
                'royal-purple': '#1a0f2e',
                'ocean-teal': '#0f2942'
            };
            metaThemeColor.content = colors[theme] || '#1a1a2e';
        }

        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme, themeData: this.themes[theme] }
        }));
    }

    setTheme(theme) {
        if (this.themes[theme]) {
            this.applyTheme(theme);
            return theme;
        }
        return this.currentTheme;
    }

    getTheme() {
        return this.currentTheme;
    }

    getThemeData() {
        return this.themes[this.currentTheme];
    }

    getAllThemes() {
        return this.themes;
    }

    toggleTheme() {
        // Cycle through all themes
        const themeKeys = Object.keys(this.themes);
        const currentIndex = themeKeys.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themeKeys.length;
        const nextTheme = themeKeys[nextIndex];

        this.setTheme(nextTheme);
        return nextTheme;
    }

    // Cycle to next theme (same as toggle but more explicit)
    nextTheme() {
        return this.toggleTheme();
    }

    // Cycle to previous theme
    previousTheme() {
        const themeKeys = Object.keys(this.themes);
        const currentIndex = themeKeys.indexOf(this.currentTheme);
        const prevIndex = currentIndex === 0 ? themeKeys.length - 1 : currentIndex - 1;
        const prevTheme = themeKeys[prevIndex];

        this.setTheme(prevTheme);
        return prevTheme;
    }

    // Get computed color value for current theme
    getThemeColor(colorVar) {
        const styles = getComputedStyle(document.documentElement);
        return styles.getPropertyValue(`--${colorVar}`).trim();
    }
}
// Theme Service - Complete Updated Version
// Manages theme switching and persistence for the Guitar Practice Journal

export class ThemeService {
    constructor() {
        this.themes = {
            dark: {
                name: 'Dark',
                icon: '🌙',
                description: 'Default dark theme for comfortable night practice'
            },
            light: {
                name: 'Light',
                icon: '☀️',
                description: 'Clean light theme for daytime use'
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
                description: 'Warm sunset colors with orange and red tones'
            },
            'royal-purple': {
                name: 'Royal Purple',
                icon: '👑',
                description: 'Rich purple with gold accents'
            },
            'ocean-teal': {
                name: 'Ocean Teal',
                icon: '🌊',
                description: 'Deep ocean blues with teal accents'
            },
            'nordic-ice': {
                name: 'Nordic Ice',
                icon: '❄️',
                description: 'Cool blues and whites inspired by Scandinavian winters'
            },
            'cherry-blossom': {
                name: 'Cherry Blossom',
                icon: '🌸',
                description: 'Soft pinks and whites for a gentle aesthetic'
            },
            'cyberpunk': {
                name: 'Cyberpunk',
                icon: '🔮',
                description: 'Neon cyan and magenta with dark backgrounds'
            },
            'earth-tone': {
                name: 'Earth Tone',
                icon: '🍂',
                description: 'Natural browns and greens for an organic feel'
            },
            'coffee-brown': {
                name: 'Coffee Brown',
                icon: '☕',
                description: 'Warm coffee tones for a cozy feel'
            },
            'neon-cyber': {
                name: 'Neon Cyber',
                icon: '💫',
                description: 'Futuristic theme with neon cyan accents'
            },
            'northern-lights': {
                name: 'Northern Lights',
                icon: '🌌',
                description: 'Aurora borealis inspired with magical colors'
            },

            'cosmic-purple': {
                name: 'Cosmic Purple',
                icon: '🌌',
                description: 'Deep space purples with cosmic accents'
            },
            'emerald-green': {
                name: 'Emerald Green',
                icon: '💎',
                description: 'Rich emerald with jade accents'
            },
            'crimson-red': {
                name: 'Crimson Red',
                icon: '🔴',
                description: 'Deep crimson with burgundy tones'
            },
            'golden-amber': {
                name: 'Golden Amber',
                icon: '🟨',
                description: 'Warm golds and amber tones'
            },
            'slate-gray': {
                name: 'Slate Gray',
                icon: '🔘',
                description: 'Modern grays with blue undertones'
            },
            'pastel-dream': {
                name: 'Pastel Dream',
                icon: '🦄',
                description: 'Soft lavender and pink pastels'
            },
            'cotton-candy': {
                name: 'Cotton Candy',
                icon: '🍭',
                description: 'Sweet pink and blue pastels'
            },
            'spring-meadow': {
                name: 'Spring Meadow',
                icon: '🌷',
                description: 'Fresh greens and flower pastels'
            },
            'sunset-sherbet': {
                name: 'Sunset Sherbet',
                icon: '🍧',
                description: 'Warm orange and peach pastels'
            },
            'ocean-breeze': {
                name: 'Ocean Breeze',
                icon: '🌊',
                description: 'Light aqua and sky blue pastels'
            },
            'bubblegum-pop': {
                name: 'Bubblegum Pop',
                icon: '🍬',
                description: 'Bright pink and purple pastels'
            }
        };

        this.currentTheme = this.loadTheme();
        this.applyTheme(this.currentTheme);
        this.setupThemeListener();
    }

    loadTheme() {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('selectedTheme') || localStorage.getItem('theme');

        // Validate saved theme exists
        if (savedTheme && this.themes[savedTheme]) {
            return savedTheme;
        }

        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            return 'light';
        }

        // Default to dark theme
        return 'dark';
    }

    saveTheme(theme) {
        localStorage.setItem('selectedTheme', theme);
        // Also save to legacy key for compatibility
        localStorage.setItem('theme', theme);
    }

    applyTheme(theme) {
        if (!this.themes[theme]) {
            console.warn(`Theme '${theme}' not found, defaulting to dark`);
            theme = 'dark';
        }

        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        this.saveTheme(theme);

        // Update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            const colors = {
                'dark': '#0a0a0a',
                'light': '#ffffff',
                'midnight-blue': '#1a1f2e',
                'forest-green': '#1a2f23',
                'sunset-orange': '#2d1810',
                'royal-purple': '#1a0f2e',
                'ocean-teal': '#0f2942',
                'nordic-ice': '#1e293b',
                'cherry-blossom': '#3b1e29',
                'cyberpunk': '#111111',
                'earth-tone': '#2b2218',
                'coffee-brown': '#2a1f17',
                'neon-cyber': '#11111a',
                'northern-lights': '#0f2744',
                'cosmic-purple': '#1a0f3a',
                'emerald-green': '#134e4a',
                'crimson-red': '#2d0a0a',
                'golden-amber': '#2e2012',
                'slate-gray': '#1e293b',
                'pastel-dream': '#FDFBFF',
                'cotton-candy': '#FFFBFD',
                'spring-meadow': '#FBFFFB',
                'sunset-sherbet': '#FFFBF7',
                'ocean-breeze': '#F7FEFF',
                'bubblegum-pop': '#FFFBFE'
            };
            metaThemeColor.content = colors[theme] || '#0a0a0a';
        }

        // Update theme name display if it exists
        this.updateThemeDisplay();

        // Update theme name in header if currentThemeName element exists
        const themeNameElement = document.getElementById('currentThemeName');
        if (themeNameElement) {
            themeNameElement.textContent = this.themes[theme].name;
        }

        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: {
                theme,
                themeData: this.themes[theme],
                isDark: this.isDarkTheme()
            }
        }));

        console.log(`✨ Theme applied: ${this.themes[theme].name}`);
    }

    updateThemeDisplay() {
        // Update theme name in header
        const themeName = document.getElementById('themeName');
        if (themeName) {
            themeName.textContent = this.themes[this.currentTheme].name;
        }

        // Update currentThemeName element (new theme display)
        const currentThemeName = document.getElementById('currentThemeName');
        if (currentThemeName) {
            currentThemeName.textContent = this.themes[this.currentTheme].name;
        }

        // Update theme toggle icon
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = this.getThemeIcon(this.currentTheme);
            themeToggle.innerHTML = `<i class="icon">${icon}</i>`;
        }
    }

    setTheme(theme) {
        if (this.themes[theme]) {
            this.applyTheme(theme);
            return theme;
        }
        console.error(`Theme '${theme}' does not exist`);
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

    getThemeIcon(theme) {
        return this.themes[theme]?.icon || '🎨';
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

    // Check if current theme is considered dark
    isDarkTheme() {
        const darkThemes = [
            'dark',
            'midnight-blue',
            'forest-green',
            'sunset-orange',
            'royal-purple',
            'ocean-teal',
            'nordic-ice',
            'cherry-blossom',
            'cyberpunk',
            'earth-tone',
            'coffee-brown',
            'neon-cyber',
            'northern-lights',
            'cosmic-purple',
            'emerald-green',
            'crimson-red',
            'golden-amber',
            'cosmic-purple',
            'emerald-green',
            'crimson-red',
            'golden-amber',
            'slate-gray',
        ];
        return darkThemes.includes(this.currentTheme);
    }

    // Get computed color value for current theme
    getThemeColor(colorVar) {
        const styles = getComputedStyle(document.documentElement);
        return styles.getPropertyValue(`--${colorVar}`).trim();
    }

    // Get all color variables for current theme
    getThemeColors() {
        const colors = {};
        const colorVars = [
            'primary', 'primary-dark', 'primary-light',
            'bg-primary', 'bg-secondary', 'bg-tertiary',
            'text-primary', 'text-secondary', 'text-muted',
            'success', 'warning', 'danger', 'info'
        ];

        colorVars.forEach(varName => {
            colors[varName] = this.getThemeColor(varName);
        });

        return colors;
    }

    // Setup system theme preference listener
    setupThemeListener() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            // Listen for system theme changes
            mediaQuery.addEventListener('change', (e) => {
                // Only auto-switch if user hasn't manually selected a theme
                const hasManualSelection = localStorage.getItem('selectedTheme') !== null;
                if (!hasManualSelection) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    // Export theme configuration (for backup/sharing)
    exportThemeConfig() {
        return {
            currentTheme: this.currentTheme,
            availableThemes: Object.keys(this.themes),
            themeData: this.themes[this.currentTheme]
        };
    }

    // Create a theme preview (returns CSS variables object)
    previewTheme(theme) {
        if (!this.themes[theme]) {
            return null;
        }

        // Temporarily apply theme to get colors
        const originalTheme = this.currentTheme;
        document.documentElement.setAttribute('data-theme', theme);

        const preview = this.getThemeColors();

        // Restore original theme
        document.documentElement.setAttribute('data-theme', originalTheme);

        return preview;
    }

    // Get theme by icon (useful for icon-based selection)
    getThemeByIcon(icon) {
        for (const [key, theme] of Object.entries(this.themes)) {
            if (theme.icon === icon) {
                return key;
            }
        }
        return null;
    }

    // Get contrast color for text on primary color background
    getContrastTextColor() {
        const primaryColor = this.getThemeColor('primary');

        // Simple contrast calculation (you might want to use a more sophisticated algorithm)
        const rgb = primaryColor.match(/\d+/g);
        if (rgb) {
            const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
            return brightness > 128 ? '#000000' : '#ffffff';
        }

        return this.isDarkTheme() ? '#ffffff' : '#000000';
    }
}
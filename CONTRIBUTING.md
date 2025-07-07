# Contributing to Guitar Practice Journal

Thank you for your interest in contributing to Guitar Practice Journal! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Types of Contributions Welcome
- 🐛 **Bug Reports**: Help us identify and fix issues
- 💡 **Feature Requests**: Suggest new functionality
- 🔧 **Code Contributions**: Submit bug fixes or new features
- 📖 **Documentation**: Improve docs, comments, or examples
- 🎨 **Design Improvements**: UI/UX enhancements
- 🧪 **Testing**: Help test on different devices/browsers
- 🌍 **Localization**: Translate the app to other languages
- 🧭 **Navigation Testing**: Test page transitions and routing

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome 88+, Firefox 84+, Safari 14+)
- Basic understanding of JavaScript, HTML, CSS
- Familiarity with Web Audio API (for audio-related contributions)
- Git for version control

### Development Setup
1. **Fork the Repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR-USERNAME/guitar-practice-journal.git
   cd guitar-practice-journal
   ```

2. **Set Up Development Environment**
   ```bash
   # Start a local server (choose one)
   python -m http.server 8000        # Python
   npx serve .                       # Node.js
   php -S localhost:8000            # PHP
   ```

3. **Open in Browser**
   - Navigate to `http://localhost:8000`
   - Use demo account: `demo@example.com` / `demo123`

4. **Enable Developer Mode**
   - Open browser DevTools (F12)
   - Check console for any errors
   - Test core functionality including navigation

### Testing Navigation
Always test both Dashboard and Calendar navigation:
- Click "📅 Calendar" from Dashboard sidebar
- Use "← Back to Dashboard" from Calendar
- Test browser back/forward buttons
- Verify timer state persists during navigation
- Check URL updates correctly

## 📋 Development Guidelines

### Code Style
- **JavaScript**: ES6+ modules, consistent naming
- **CSS**: BEM-like methodology, use CSS custom properties
- **HTML**: Semantic markup, accessibility-friendly
- **Comments**: Document complex logic and component interfaces

### File Organization
```
src/
├── components/     # Reusable UI components
├── pages/         # Main application views (dashboard.js, calendar.js, auth.js)
├── services/      # Business logic and data management
├── utils/         # Helper functions and utilities (router.js, helpers.js)
└── styles/        # CSS organized by scope
```

### Component Structure
```javascript
// components/exampleComponent.js
export class ExampleComponent {
    constructor(container, dependencies) {
        this.container = container;
        // Initialize dependencies
    }

    render() {
        // Create DOM elements
        // Attach event listeners
    }

    destroy() {
        // Clean up resources - IMPORTANT!
        // Remove event listeners
        // Clear timers and intervals
    }
}
```

### Page Component Pattern
```javascript
// pages/examplePage.js
export class ExamplePage {
    constructor(storageService, authService) {
        this.storageService = storageService;
        this.authService = authService;
        this.container = null;
    }

    async init() {
        this.render();
        this.attachEventListeners();
        await this.loadData();
    }

    render() {
        // Create page HTML
        const app = document.getElementById('app');
        app.innerHTML = `<!-- page content -->`;
        this.container = app.querySelector('.page-container');
    }

    attachEventListeners() {
        // Handle navigation buttons
        // Ensure proper cleanup in destroy()
    }

    destroy() {
        // CRITICAL: Clean up all resources
        // Remove event listeners
        // Clear component references
        if (this.container) {
            this.container.remove();
        }
    }
}
```

### Navigation Guidelines
When adding navigation features:

```javascript
// Good navigation pattern
async navigateToOtherPage() {
    try {
        // Clean up current page
        this.destroy();
        
        // Use app navigation if available
        if (window.app && window.app.navigateToTarget) {
            await window.app.navigateToTarget();
        } else {
            // Fallback navigation
            await this.manualNavigation();
        }
    } catch (error) {
        console.error('Navigation error:', error);
        // Provide user feedback
        this.showNavigationError(error);
    }
}
```

### Service Pattern
```javascript
// services/exampleService.js
export class ExampleService {
    constructor() {
        // Initialize service
    }

    async publicMethod() {
        // Public API method
        return this.privateMethod();
    }

    privateMethod() {
        // Internal implementation
    }
}
```

## 🐛 Reporting Bugs

### Before Submitting
1. **Check Existing Issues**: Search for similar problems
2. **Reproduce the Bug**: Ensure it's consistently reproducible
3. **Test in Demo Mode**: Try with demo account to isolate user data issues
4. **Check Browser Console**: Note any error messages
5. **Test Navigation**: Try both Dashboard and Calendar if applicable

### Bug Report Template
```markdown
## Bug Description
Brief description of the issue

## Steps to Reproduce
1. Navigate to...
2. Click on...
3. Enter...
4. Observe...

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Navigation Context
- Started from: Dashboard / Calendar / Auth
- Attempting to go to: Dashboard / Calendar / Specific Tab
- Navigation method: Button click / URL / Browser back-forward

## Environment
- Browser: Chrome 95 / Firefox 93 / Safari 15
- OS: Windows 11 / macOS 12 / Ubuntu 20.04
- Device: Desktop / Mobile
- Account: Demo / Personal
- PWA: Installed / Browser only

## Additional Context
- Console errors (if any)
- Screenshots (if helpful)
- Data export (if data-related)
- Network tab if navigation-related
```

## 💡 Feature Requests

### Feature Request Template
```markdown
## Feature Description
Clear description of the proposed feature

## Problem It Solves
What user need or pain point does this address?

## Proposed Solution
How should this feature work?

## Alternative Solutions
Other ways to solve the same problem

## Navigation Considerations
- Which page(s) would this affect?
- How should users access this feature?
- Any routing or URL changes needed?

## Implementation Notes
Technical considerations (if applicable)

## Priority
- High: Critical for user experience
- Medium: Improves usability
- Low: Nice to have enhancement
```

## 🔧 Code Contributions

### Pull Request Process
1. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-new-feature
   # or
   git checkout -b fix/navigation-bug-fix
   ```

2. **Make Your Changes**
   - Follow coding standards
   - Add comments for complex logic
   - Update documentation if needed

3. **Test Thoroughly**
   - Test on multiple browsers
   - Verify offline functionality (if applicable)
   - Check mobile responsiveness
   - **Test navigation extensively**
   - Test with large datasets

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add amazing new feature"
   # or
   git commit -m "fix: resolve calendar navigation issue"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/amazing-new-feature
   ```
   Then create a Pull Request on GitHub

### Commit Message Convention
```
type(scope): description

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Formatting, no code change
- refactor: Code restructuring
- perf: Performance improvement
- test: Adding tests
- chore: Maintenance tasks

Examples:
feat(audio): add pitch shift quality control
fix(navigation): resolve calendar page loading issue
docs(readme): update installation instructions
feat(calendar): add monthly statistics display
fix(timer): resolve sync issue with metronome
```

### PR Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated (if applicable)
- [ ] Tested on multiple browsers
- [ ] **Navigation tested thoroughly (Dashboard ↔ Calendar)**
- [ ] No console errors or warnings
- [ ] Maintains backward compatibility
- [ ] Performance impact considered
- [ ] Component cleanup implemented properly

## 🧪 Testing Guidelines

### Manual Testing
1. **Core Functionality**
   - Timer start/stop/reset
   - Practice session logging
   - Audio file upload and processing
   - Data persistence across sessions

2. **Navigation Testing** (Critical)
   - Dashboard to Calendar navigation
   - Calendar to Dashboard navigation
   - Browser back/forward buttons
   - URL direct access to Calendar
   - Timer state persistence during navigation
   - Component cleanup verification

3. **Browser Compatibility**
   - Chrome/Edge (latest 2 versions)
   - Firefox (latest 2 versions)
   - Safari (latest 2 versions)
   - Mobile browsers

4. **Offline Functionality**
   - Disconnect internet
   - Verify core features work
   - Check data persistence
   - Test navigation without network

5. **Performance Testing**
   - Large practice session lists (100+ entries)
   - Large audio files (15-20MB)
   - Extended use sessions
   - Navigation performance

### Navigation Testing Scenarios
```javascript
// Critical navigation test cases
const navigationTests = {
    dashboardToCalendar: 'Click Calendar button from Dashboard sidebar',
    calendarToDashboard: 'Click Back to Dashboard from Calendar',
    directCalendarAccess: 'Navigate directly to /calendar URL',
    browserBackForward: 'Use browser back/forward buttons',
    timerPersistence: 'Verify timer continues during navigation',
    componentCleanup: 'Check for memory leaks during navigation',
    errorRecovery: 'Test navigation when components fail to load'
};
```

### Testing Scenarios
```javascript
// Test data scenarios
const testScenarios = {
    smallDataset: '< 10 practice sessions',
    mediumDataset: '50-100 practice sessions',
    largeDataset: '500+ practice sessions',
    audioFiles: 'Various MP3 sizes and quality',
    navigationStress: 'Rapid page switching',
    edgeCases: 'Invalid inputs, network failures'
};
```

## 📝 Documentation

### Code Documentation
- **JSDoc comments** for public methods
- **Inline comments** for complex logic, especially navigation
- **README updates** for new features
- **Architecture docs** for structural changes

### Example JSDoc
```javascript
/**
 * Navigate to calendar page with error handling
 * @param {boolean} preserveTimer - Whether to maintain timer state
 * @returns {Promise<void>} Resolves when navigation complete
 * @throws {Error} When navigation fails after all fallbacks
 */
async navigateToCalendar(preserveTimer = true) {
    // Implementation with multiple fallback strategies
}
```

## 🏗️ Architecture Considerations

### Adding New Pages
1. **Follow existing patterns** in pages directory
2. **Implement proper navigation** with app.js integration
3. **Add cleanup method** for proper resource management
4. **Consider mobile experience** from the start
5. **Update router configuration** in app.js

### Navigation Architecture
- **Centralized routing**: Use app.js for navigation logic
- **Fallback strategies**: Multiple approaches for reliability
- **State preservation**: Maintain timer and form state
- **Error recovery**: Graceful handling of navigation failures
- **URL management**: Proper URL updates and history

### Adding New Components
1. **Follow existing patterns** in components directory
2. **Use dependency injection** for services
3. **Implement proper cleanup** in destroy() method
4. **Consider mobile experience** from the start
5. **Test navigation integration** if component affects routing

### Audio Processing
- **Performance impact**: Audio processing is CPU-intensive
- **Memory management**: Clean up audio contexts properly
- **Quality vs Performance**: Balance quality settings appropriately
- **Browser compatibility**: Test Web Audio API features

### Data Storage
- **IndexedDB first**: Use IndexedDB for primary storage
- **localStorage fallback**: Ensure localStorage backup works
- **Data migration**: Consider upgrade paths for data schema changes
- **Compression**: Use compression for large datasets

## 🎨 Design Guidelines

### Visual Design
- **Consistent styling**: Use existing CSS custom properties
- **Responsive design**: Mobile-first approach
- **Dark/light themes**: Support both theme modes
- **Accessibility**: Consider screen readers and keyboard navigation

### User Experience
- **Progressive disclosure**: Don't overwhelm new users
- **Feedback**: Provide clear feedback for user actions
- **Error handling**: Graceful error states with helpful messages
- **Performance**: Maintain 60fps animations and responsive interactions
- **Navigation clarity**: Clear paths between Dashboard and Calendar

## 🌍 Localization

### Adding Translations
1. **Create language file**: `src/locales/[language].js`
2. **Follow existing structure**: Use nested objects for organization
3. **Test thoroughly**: Ensure UI accommodates text length variations
4. **Consider cultural aspects**: Date formats, musical terminology
5. **Include navigation labels**: Translate navigation elements

```javascript
// Example: src/locales/es.js
export const es = {
    navigation: {
        dashboard: 'Panel Principal',
        calendar: 'Calendario',
        backToDashboard: '← Volver al Panel'
    },
    timer: {
        start: 'Iniciar',
        stop: 'Parar',
        reset: 'Reiniciar'
    },
    practice: {
        areas: {
            scales: 'Escalas',
            chords: 'Acordes'
        }
    }
};
```

## 📞 Getting Help

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Code Review**: Pull request discussions

### Response Times
- **Bug reports**: Within 48 hours
- **Feature requests**: Within 1 week
- **Pull requests**: Within 1 week
- **Navigation issues**: Priority response within 24 hours

### Mentorship
New contributors are welcome! Don't hesitate to:
- Ask questions in issues or discussions
- Request code review feedback
- Suggest improvements to documentation
- Ask for guidance on navigation architecture

## 🏆 Recognition

### Contributors
All contributors will be:
- Listed in CONTRIBUTORS.md
- Credited in release notes for significant contributions
- Mentioned in project documentation

### Types of Recognition
- 🥇 **Major Features**: New functionality or significant improvements
- 🥈 **Bug Fixes**: Important bug fixes and stability improvements  
- 🥉 **Documentation**: Helpful documentation and examples
- 🌟 **Testing**: Thorough testing and quality assurance
- 🧭 **Navigation**: Improvements to user experience and routing

## 📄 Legal

### License Agreement
By contributing, you agree that your contributions will be licensed under the same MIT License that covers the project.

### Copyright
- You retain copyright of your contributions
- You grant the project maintainers perpetual license to use your contributions
- Ensure you have rights to any code you contribute

---

Thank you for contributing to Guitar Practice Journal! Your efforts help make this tool better for guitarists everywhere. 🎸✨

### Recent Focus Areas
We're particularly interested in contributions that:
- Improve navigation reliability and user experience
- Enhance mobile responsiveness
- Add comprehensive error handling
- Optimize performance for large datasets
- Improve accessibility features
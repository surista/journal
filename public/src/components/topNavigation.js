// Top Navigation Component
export class TopNavigation {
    constructor() {
        this.activeTab = 'practice';
    }

    setActiveTab(tab) {
        this.activeTab = tab;
        this.updateActiveState();
    }

    updateActiveState() {
        const navItems = document.querySelectorAll('.top-nav-item');
        navItems.forEach(item => {
            if (item.dataset.tab === this.activeTab) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    render() {
        return `
            <nav class="top-navigation">
                <div class="nav-container">
                    <button class="top-nav-item active" data-tab="practice" title="Practice">
                        <span class="nav-icon">🎵</span>
                        <span class="nav-label">Practice</span>
                    </button>
                    
                    <button class="top-nav-item" data-tab="repertoire" title="Repertoire">
                        <span class="nav-icon">📚</span>
                        <span class="nav-label">Repertoire</span>
                    </button>
                    
                    <button class="top-nav-item" data-tab="goals" title="Goals">
                        <span class="nav-icon">🎯</span>
                        <span class="nav-label">Goals</span>
                    </button>
                    
                    <button class="top-nav-item" data-tab="stats" title="Statistics">
                        <span class="nav-icon">📊</span>
                        <span class="nav-label">Stats</span>
                    </button>
                    
                    <button class="top-nav-item" data-tab="history" title="History">
                        <span class="nav-icon">📜</span>
                        <span class="nav-label">History</span>
                    </button>
                    
                    <button class="top-nav-item" data-tab="calendar" title="Calendar">
                        <span class="nav-icon">📅</span>
                        <span class="nav-label">Calendar</span>
                    </button>
                    
                    <!-- Hidden until ready
                    <button class="top-nav-item" data-tab="learning" title="My Learning">
                        <span class="nav-icon">🎓</span>
                        <span class="nav-label">Learning</span>
                    </button>
                    -->
                    
                    <button class="top-nav-item" data-tab="settings" title="Settings">
                        <span class="nav-icon">⚙️</span>
                        <span class="nav-label">Settings</span>
                    </button>
                </div>
            </nav>
        `;
    }

    attachEventListeners(onTabChange) {
        const navItems = document.querySelectorAll('.top-nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.setActiveTab(tab);
                if (onTabChange) {
                    onTabChange(tab);
                }
            });
        });
    }
}
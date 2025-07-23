// Achievement Badges Component - Fixed to handle async storage properly
import {notificationManager} from '../services/notificationManager.js';
import {TimeUtils} from '../utils/helpers.js';

export class AchievementBadges {
    constructor(container, storageService) {
        this.container = container;
        this.storageService = storageService;
        this.achievements = this.defineAchievements();
        this.earnedAchievements = [];
    }

    defineAchievements() {
        return [
            // Practice Streaks
            {
                id: 'first-day',
                name: 'First Steps',
                icon: '🎸',
                description: 'Complete your first practice session',
                check: (stats) => stats.totalSessions >= 1
            },
            {
                id: 'streak-starter',
                name: 'Streak Starter',
                icon: '🔥',
                description: '3 day practice streak',
                check: (stats) => stats.currentStreak >= 3 || stats.longestStreak >= 3
            },
            {
                id: 'week-warrior',
                name: 'Week Warrior',
                icon: '🗓️',
                description: '7 day practice streak',
                check: (stats) => stats.currentStreak >= 7 || stats.longestStreak >= 7
            },
            {
                id: 'fortnight-hero',
                name: 'Fortnight Hero',
                icon: '💪',
                description: '14 day practice streak',
                check: (stats) => stats.currentStreak >= 14 || stats.longestStreak >= 14
            },
            {
                id: 'commitment-keeper',
                name: 'Commitment Keeper',
                icon: '💎',
                description: '21 day practice streak',
                check: (stats) => stats.currentStreak >= 21 || stats.longestStreak >= 21
            },
            {
                id: 'monthly-master',
                name: 'Monthly Master',
                icon: '📅',
                description: '30 day practice streak',
                check: (stats) => stats.currentStreak >= 30 || stats.longestStreak >= 30
            },
            {
                id: 'habit-builder',
                name: 'Habit Builder',
                icon: '🌟',
                description: '45 day practice streak',
                check: (stats) => stats.currentStreak >= 45 || stats.longestStreak >= 45
            },
            {
                id: 'streak-master',
                name: 'Streak Master',
                icon: '👑',
                description: '60 day practice streak',
                check: (stats) => stats.currentStreak >= 60 || stats.longestStreak >= 60
            },
            {
                id: 'quarterly-legend',
                name: 'Quarterly Legend',
                icon: '🏆',
                description: '90 day practice streak',
                check: (stats) => stats.currentStreak >= 90 || stats.longestStreak >= 90
            },
            {
                id: 'year-master',
                name: 'Year Master',
                icon: '🎖️',
                description: '365 day practice streak',
                check: (stats) => stats.currentStreak >= 365 || stats.longestStreak >= 365
            },
            {
                id: 'double-digit',
                name: 'Double Digits',
                icon: '🔟',
                description: '10 day practice streak',
                check: (stats) => stats.currentStreak >= 10 || stats.longestStreak >= 10
            },
            {
                id: 'persistence-pro',
                name: 'Persistence Pro',
                icon: '💫',
                description: '100 day practice streak',
                check: (stats) => stats.currentStreak >= 100 || stats.longestStreak >= 100
            },
            {
                id: 'half-year-hero',
                name: 'Half Year Hero',
                icon: '🌟',
                description: '180 day practice streak',
                check: (stats) => stats.currentStreak >= 180 || stats.longestStreak >= 180
            },
            {
                id: 'consistency-champion',
                name: 'Consistency Champion',
                icon: '🏅',
                description: '150 day practice streak',
                check: (stats) => stats.currentStreak >= 150 || stats.longestStreak >= 150
            },
            {
                id: 'dedication-deity',
                name: 'Dedication Deity',
                icon: '⚡',
                description: '200 day practice streak',
                check: (stats) => stats.currentStreak >= 200 || stats.longestStreak >= 200
            },
            {
                id: 'unstoppable-force',
                name: 'Unstoppable Force',
                icon: '🚀',
                description: '250 day practice streak',
                check: (stats) => stats.currentStreak >= 250 || stats.longestStreak >= 250
            },
            {
                id: 'legendary-discipline',
                name: 'Legendary Discipline',
                icon: '🌠',
                description: '300 day practice streak',
                check: (stats) => stats.currentStreak >= 300 || stats.longestStreak >= 300
            },
            {
                id: 'zen-master',
                name: 'Zen Master',
                icon: '🧘',
                description: '500 day practice streak',
                check: (stats) => stats.currentStreak >= 500 || stats.longestStreak >= 500
            },

            // Total Sessions
            {
                id: 'getting-started',
                name: 'Getting Started',
                icon: '🌱',
                description: 'Complete 10 practice sessions',
                check: (stats) => stats.totalSessions >= 10
            },
            {
                id: 'committed',
                name: 'Committed',
                icon: '🎯',
                description: 'Complete 25 practice sessions',
                check: (stats) => stats.totalSessions >= 25
            },
            {
                id: 'dedicated',
                name: 'Dedicated',
                icon: '⭐',
                description: 'Complete 50 practice sessions',
                check: (stats) => stats.totalSessions >= 50
            },
            {
                id: 'century-club',
                name: 'Century Club',
                icon: '💯',
                description: 'Complete 100 practice sessions',
                check: (stats) => stats.totalSessions >= 100
            },

            // Total Practice Time
            {
                id: 'hour-hero',
                name: 'Hour Hero',
                icon: '⏰',
                description: 'Practice for 1 total hour',
                check: (stats) => stats.totalTime >= 3600
            },
            {
                id: 'five-hour-fighter',
                name: 'Five Hour Fighter',
                icon: '⚡',
                description: 'Practice for 5 total hours',
                check: (stats) => stats.totalTime >= 18000
            },
            {
                id: 'ten-hour-champion',
                name: 'Ten Hour Champion',
                icon: '🔥',
                description: 'Practice for 10 total hours',
                check: (stats) => stats.totalTime >= 36000
            },
            {
                id: 'day-devotee',
                name: 'Day Devotee',
                icon: '☀️',
                description: 'Practice for 24 total hours',
                check: (stats) => stats.totalTime >= 86400
            },

            // Session Length
            {
                id: 'marathon-session',
                name: 'Marathon Session',
                icon: '🏃',
                description: 'Practice for 2 hours in one session',
                check: (stats, entries) => Array.isArray(entries) && entries.some(e => e.duration >= 7200)
            },
            {
                id: 'quick-practice',
                name: 'Quick Practice',
                icon: '⚡',
                description: 'Complete 10 sessions under 15 minutes',
                check: (stats, entries) => Array.isArray(entries) && entries.filter(e => e.duration < 900 && e.duration >= 60).length >= 10
            },

            // Practice Areas
            {
                id: 'well-rounded',
                name: 'Well Rounded',
                icon: '🎨',
                description: 'Practice 5 different areas',
                check: (stats, entries) => Array.isArray(entries) && new Set(entries.map(e => e.practiceArea)).size >= 5
            },
            {
                id: 'scale-specialist',
                name: 'Scale Specialist',
                icon: '🎼',
                description: '25 scale practice sessions',
                check: (stats, entries) => Array.isArray(entries) && entries.filter(e => e.practiceArea === 'Scales').length >= 25
            },
            {
                id: 'chord-champion',
                name: 'Chord Champion',
                icon: '🎵',
                description: '25 chord practice sessions',
                check: (stats, entries) => Array.isArray(entries) && entries.filter(e => e.practiceArea === 'Chords').length >= 25
            },

            // Goals
            {
                id: 'goal-setter',
                name: 'Goal Setter',
                icon: '🎯',
                description: 'Create your first goal',
                check: (stats, entries, goals) => Array.isArray(goals) && goals.length >= 1
            },
            {
                id: 'goal-achiever',
                name: 'Goal Achiever',
                icon: '✅',
                description: 'Complete 5 goals',
                check: (stats, entries, goals) => Array.isArray(goals) && goals.filter(g => g.completed).length >= 5
            },

            // Special
            {
                id: 'early-bird',
                name: 'Early Bird',
                icon: '🌅',
                description: 'Practice before 7 AM',
                check: (stats, entries) => Array.isArray(entries) && entries.some(e => new Date(e.date).getHours() < 7)
            },
            {
                id: 'night-owl',
                name: 'Night Owl',
                icon: '🦉',
                description: 'Practice after 10 PM',
                check: (stats, entries) => Array.isArray(entries) && entries.some(e => new Date(e.date).getHours() >= 22)
            }
        ];
    }

    async render() {
        try {

            // Show loading state first
            this.container.innerHTML = `
                <div class="achievements-section">
                    <h2>Achievements</h2>
                    <div style="padding: 2rem; text-align: center; color: #9ca3af;">
                        Loading achievements...
                    </div>
                </div>
            `;

            // Load data asynchronously
            const stats = await this.storageService.calculateStats();
            const entries = await this.storageService.getPracticeEntries();
            const goals = await this.storageService.getGoals();


            this.earnedAchievements = await this.getEarnedAchievements(stats, entries, goals);
            const totalEarned = this.earnedAchievements.length;
            const totalAchievements = this.achievements.length;
            const percentage = Math.round((totalEarned / totalAchievements) * 100);

            this.container.innerHTML = `
                <div class="achievements-section">
                    <h2>Achievements (${totalEarned}/${totalAchievements})</h2>
                    <div class="achievements-progress">
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${percentage}%"></div>
                        </div>
                        <span class="progress-text">${percentage}% Complete</span>
                    </div>
                    <div class="achievements-filter">
                        <button class="filter-btn active" data-filter="all">All</button>
                        <button class="filter-btn" data-filter="earned">Earned</button>
                        <button class="filter-btn" data-filter="locked">Locked</button>
                    </div>
                    
                    <div class="achievements-section-header">
                        <h3>Practice Streaks</h3>
                    </div>
                    <div class="achievements-grid streak-achievements" id="streakAchievementsGrid">
                        ${this.renderStreakAchievements('all')}
                    </div>
                    
                    <div class="achievements-section-header">
                        <h3>Other Achievements</h3>
                    </div>
                    <div class="achievements-grid" id="achievementsGrid">
                        ${this.renderOtherAchievements('all')}
                    </div>
                </div>
            `;

            this.attachEventListeners();
        } catch (error) {
            console.error('Error rendering achievement badges:', error);
            this.container.innerHTML = `
                <div class="achievements-section">
                    <h2>Achievements</h2>
                    <div style="padding: 2rem; text-align: center; color: #ef4444;">
                        Error loading achievements: ${error.message}
                    </div>
                </div>
            `;
        }
    }

    renderAchievements(filter = 'all') {
        try {
            let achievementsToRender = this.achievements;

            if (filter === 'earned') {
                achievementsToRender = this.achievements.filter(a =>
                    this.earnedAchievements.includes(a.id)
                );
            } else if (filter === 'locked') {
                achievementsToRender = this.achievements.filter(a =>
                    !this.earnedAchievements.includes(a.id)
                );
            }

            return achievementsToRender.map(achievement => {
                const isEarned = this.earnedAchievements.includes(achievement.id);
                return this.renderBadge(achievement, isEarned);
            }).join('');
        } catch (error) {
            console.error('Error rendering achievements:', error);
            return '<div style="color: #ef4444;">Error rendering achievements</div>';
        }
    }

    renderStreakAchievements(filter = 'all') {
        try {
            // Get only streak-related achievements (first 18)
            const streakIds = [
                'first-day', 'streak-starter', 'week-warrior', 'double-digit', 'fortnight-hero',
                'commitment-keeper', 'monthly-master', 'habit-builder',
                'streak-master', 'quarterly-legend', 'persistence-pro', 'consistency-champion',
                'half-year-hero', 'dedication-deity', 'unstoppable-force', 'legendary-discipline',
                'year-master', 'zen-master'
            ];
            
            let streakAchievements = this.achievements.filter(a => streakIds.includes(a.id));

            if (filter === 'earned') {
                streakAchievements = streakAchievements.filter(a =>
                    this.earnedAchievements.includes(a.id)
                );
            } else if (filter === 'locked') {
                streakAchievements = streakAchievements.filter(a =>
                    !this.earnedAchievements.includes(a.id)
                );
            }

            // Sort by streak days required
            streakAchievements.sort((a, b) => {
                const getDays = (achievement) => {
                    const match = achievement.description.match(/(\d+) day/);
                    return match ? parseInt(match[1]) : 0;
                };
                return getDays(a) - getDays(b);
            });

            return streakAchievements.map(achievement => {
                const isEarned = this.earnedAchievements.includes(achievement.id);
                return this.renderBadge(achievement, isEarned);
            }).join('');
        } catch (error) {
            console.error('Error rendering streak achievements:', error);
            return '<div style="color: #ef4444;">Error rendering streak achievements</div>';
        }
    }

    renderOtherAchievements(filter = 'all') {
        try {
            // Get non-streak achievements
            const streakIds = [
                'first-day', 'streak-starter', 'week-warrior', 'double-digit', 'fortnight-hero',
                'commitment-keeper', 'monthly-master', 'habit-builder',
                'streak-master', 'quarterly-legend', 'persistence-pro', 'consistency-champion',
                'half-year-hero', 'dedication-deity', 'unstoppable-force', 'legendary-discipline',
                'year-master', 'zen-master'
            ];
            
            let otherAchievements = this.achievements.filter(a => !streakIds.includes(a.id));

            if (filter === 'earned') {
                otherAchievements = otherAchievements.filter(a =>
                    this.earnedAchievements.includes(a.id)
                );
            } else if (filter === 'locked') {
                otherAchievements = otherAchievements.filter(a =>
                    !this.earnedAchievements.includes(a.id)
                );
            }

            return otherAchievements.map(achievement => {
                const isEarned = this.earnedAchievements.includes(achievement.id);
                return this.renderBadge(achievement, isEarned);
            }).join('');
        } catch (error) {
            console.error('Error rendering other achievements:', error);
            return '<div style="color: #ef4444;">Error rendering other achievements</div>';
        }
    }

    renderBadge(achievement, isEarned) {
        const badgeClass = isEarned ? 'badge earned' : 'badge';
        // Format the name to add line breaks for better display
        const formattedName = achievement.name.replace(' ', '\n');

        return `
            <div class="${badgeClass}" title="${achievement.description}">
                <span class="badge-icon">${achievement.icon}</span>
                <span class="badge-label">${formattedName}</span>
            </div>
        `;
    }

    attachEventListeners() {
        try {
            // Filter buttons
            const filterBtns = this.container.querySelectorAll('.filter-btn');
            filterBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // Update active state
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    // Re-render achievements
                    const filter = btn.dataset.filter;
                    const streakGrid = document.getElementById('streakAchievementsGrid');
                    const otherGrid = document.getElementById('achievementsGrid');
                    if (streakGrid) {
                        streakGrid.innerHTML = this.renderStreakAchievements(filter);
                    }
                    if (otherGrid) {
                        otherGrid.innerHTML = this.renderOtherAchievements(filter);
                    }
                });
            });

            // Listen for practice session saved events
            window.addEventListener('practiceSessionSaved', async () => {
                try {
                    // Re-check achievements when new session is saved
                    const stats = await this.storageService.calculateStats();
                    const entries = await this.storageService.getPracticeEntries();
                    const goals = await this.storageService.getGoals();

                    await this.getEarnedAchievements(stats, entries, goals);
                } catch (error) {
                    console.error('Error checking achievements after practice session:', error);
                }
            });
        } catch (error) {
            console.error('Error attaching achievement listeners:', error);
        }
    }

    async getEarnedAchievements(stats, entries, goals) {
        try {

            const earned = JSON.parse(localStorage.getItem('guitarJournalAchievements') || '[]');
            const newlyEarned = [];

            // Ensure all data is valid
            if (!stats) stats = {totalTime: 0, totalSessions: 0, currentStreak: 0, longestStreak: 0};
            if (!Array.isArray(entries)) entries = [];
            if (!Array.isArray(goals)) goals = [];

            for (const achievement of this.achievements) {
                if (!earned.includes(achievement.id)) {
                    try {
                        // Call the check function with proper error handling
                        const isEarned = achievement.check(stats, entries, goals);
                        if (isEarned) {
                            earned.push(achievement.id);
                            newlyEarned.push(achievement);
                        }
                    } catch (error) {
                        console.error(`Error checking achievement ${achievement.id}:`, error);
                        // Continue to next achievement instead of breaking
                        continue;
                    }
                }
            }

            // Save updated achievements
            localStorage.setItem('guitarJournalAchievements', JSON.stringify(earned));

            // Show notifications for newly earned achievements
            if (newlyEarned.length > 0) {
                // Stagger notifications to avoid overwhelming the user
                newlyEarned.forEach((achievement, index) => {
                    setTimeout(() => {
                        this.showAchievementNotification(achievement);
                    }, index * 1000); // 1 second between each notification
                });
            }

            return earned;
        } catch (error) {
            console.error('Error getting earned achievements:', error);
            return [];
        }
    }

    showAchievementNotification(achievement) {
        try {
            // Use centralized notification system
            notificationManager.success(`🏆 Achievement Unlocked: ${achievement.name}!`, 5000);

            // Also show browser notification for achievements
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Achievement Unlocked! 🎉', {
                    body: `${achievement.name}: ${achievement.description}`,
                    icon: '/icon-192.png',
                    badge: '/icon-192.png',
                    tag: `achievement-${achievement.id}`,
                    requireInteraction: false
                });
            }

            // Add confetti effect
            this.celebrateAchievement();
        } catch (error) {
            console.error('Error showing achievement notification:', error);
        }
    }

    celebrateAchievement() {
        try {
            // Create confetti effect
            const confettiCount = 50;
            const colors = ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ef4444'];

            for (let i = 0; i < confettiCount; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.cssText = `
                    position: fixed;
                    width: 10px;
                    height: 10px;
                    background: ${colors[Math.floor(Math.random() * colors.length)]};
                    left: ${Math.random() * 100}%;
                    top: -10px;
                    opacity: ${Math.random() * 0.5 + 0.5};
                    transform: rotate(${Math.random() * 360}deg);
                    animation: confettiFall ${Math.random() * 3 + 2}s linear;
                    z-index: 9999;
                    pointer-events: none;
                `;

                document.body.appendChild(confetti);

                // Remove after animation
                setTimeout(() => confetti.remove(), 5000);
            }

            // Add CSS animation if not exists
            if (!document.getElementById('confettiStyles')) {
                const style = document.createElement('style');
                style.id = 'confettiStyles';
                style.textContent = `
                    @keyframes confettiFall {
                        0% {
                            transform: translateY(0) rotate(0deg);
                        }
                        100% {
                            transform: translateY(100vh) rotate(720deg);
                        }
                    }
                `;
                document.head.appendChild(style);
            }
        } catch (error) {
            console.error('Error creating celebration:', error);
        }
    }

    destroy() {
        try {
            // Remove event listeners
            window.removeEventListener('practiceSessionSaved', this.checkAchievements);
        } catch (error) {
            console.error('Error destroying AchievementBadges:', error);
        }
    }
}
// Achievement Badges Component - Optimized with lazy loading and centralized notifications
import { LazyAchievementBadges } from '../components/LazyImage.js';
import { notificationManager } from '../services/notificationManager.js';
import { TimeUtils } from '../utils/helpers.js';

export class AchievementBadges {
    constructor(container, storageService) {
        this.container = container;
        this.storageService = storageService;
        this.achievements = this.defineAchievements();
        this.lazyBadges = null;
        this.earnedAchievements = [];
    }

    defineAchievements() {
        return [
            // Practice Streaks
            { id: 'first-day', name: 'First Steps', icon: '🎸', description: 'Complete your first practice session', check: (stats) => stats.totalSessions >= 1 },
            { id: 'week-warrior', name: 'Week Warrior', icon: '🗓️', description: '7 day practice streak', check: (stats) => stats.currentStreak >= 7 || stats.longestStreak >= 7 },
            { id: 'fortnight-hero', name: 'Fortnight Hero', icon: '💪', description: '14 day practice streak', check: (stats) => stats.currentStreak >= 14 || stats.longestStreak >= 14 },
            { id: 'monthly-master', name: 'Monthly Master', icon: '📅', description: '30 day practice streak', check: (stats) => stats.currentStreak >= 30 || stats.longestStreak >= 30 },
            { id: 'quarterly-legend', name: 'Quarterly Legend', icon: '🏆', description: '90 day practice streak', check: (stats) => stats.currentStreak >= 90 || stats.longestStreak >= 90 },
            { id: 'yearly-virtuoso', name: 'Yearly Virtuoso', icon: '👑', description: '365 day practice streak', check: (stats) => stats.currentStreak >= 365 || stats.longestStreak >= 365 },

            // Total Sessions
            { id: 'getting-started', name: 'Getting Started', icon: '🌱', description: 'Complete 10 practice sessions', check: (stats) => stats.totalSessions >= 10 },
            { id: 'committed', name: 'Committed', icon: '🎯', description: 'Complete 25 practice sessions', check: (stats) => stats.totalSessions >= 25 },
            { id: 'dedicated', name: 'Dedicated', icon: '⭐', description: 'Complete 50 practice sessions', check: (stats) => stats.totalSessions >= 50 },
            { id: 'century-club', name: 'Century Club', icon: '💯', description: 'Complete 100 practice sessions', check: (stats) => stats.totalSessions >= 100 },
            { id: 'double-century', name: 'Double Century', icon: '✨', description: 'Complete 200 practice sessions', check: (stats) => stats.totalSessions >= 200 },
            { id: 'triple-century', name: 'Triple Century', icon: '🌟', description: 'Complete 300 practice sessions', check: (stats) => stats.totalSessions >= 300 },
            { id: 'practice-master', name: 'Practice Master', icon: '🎖️', description: 'Complete 500 practice sessions', check: (stats) => stats.totalSessions >= 500 },
            { id: 'thousand-sessions', name: 'Thousand Sessions', icon: '🏅', description: 'Complete 1000 practice sessions', check: (stats) => stats.totalSessions >= 1000 },

            // Total Practice Time
            { id: 'hour-hero', name: 'Hour Hero', icon: '⏰', description: 'Practice for 1 total hour', check: (stats) => stats.totalTime >= 3600 },
            { id: 'five-hour-fighter', name: 'Five Hour Fighter', icon: '⚡', description: 'Practice for 5 total hours', check: (stats) => stats.totalTime >= 18000 },
            { id: 'ten-hour-champion', name: 'Ten Hour Champion', icon: '🔥', description: 'Practice for 10 total hours', check: (stats) => stats.totalTime >= 36000 },
            { id: 'day-devotee', name: 'Day Devotee', icon: '☀️', description: 'Practice for 24 total hours', check: (stats) => stats.totalTime >= 86400 },
            { id: 'week-warrior-time', name: 'Week of Practice', icon: '📆', description: 'Practice for 168 total hours', check: (stats) => stats.totalTime >= 604800 },
            { id: 'hundred-hour-hero', name: 'Hundred Hour Hero', icon: '💎', description: 'Practice for 100 total hours', check: (stats) => stats.totalTime >= 360000 },
            { id: 'thousand-hour-master', name: 'Thousand Hour Master', icon: '🏛️', description: 'Practice for 1000 total hours', check: (stats) => stats.totalTime >= 3600000 },

            // Session Length
            { id: 'marathon-session', name: 'Marathon Session', icon: '🏃', description: 'Practice for 2 hours in one session', check: (stats, entries) => entries.some(e => e.duration >= 7200) },
            { id: 'endurance-expert', name: 'Endurance Expert', icon: '💪', description: 'Practice for 3 hours in one session', check: (stats, entries) => entries.some(e => e.duration >= 10800) },
            { id: 'quick-practice', name: 'Quick Practice', icon: '⚡', description: 'Complete 10 sessions under 15 minutes', check: (stats, entries) => entries.filter(e => e.duration < 900 && e.duration >= 60).length >= 10 },

            // Practice Areas
            { id: 'well-rounded', name: 'Well Rounded', icon: '🎨', description: 'Practice 5 different areas', check: (stats, entries) => new Set(entries.map(e => e.practiceArea)).size >= 5 },
            { id: 'area-master', name: 'Area Master', icon: '🎓', description: 'Practice all 10 areas', check: (stats, entries) => new Set(entries.map(e => e.practiceArea)).size >= 10 },
            { id: 'scale-specialist', name: 'Scale Specialist', icon: '🎼', description: '50 scale practice sessions', check: (stats, entries) => entries.filter(e => e.practiceArea === 'Scales').length >= 50 },
            { id: 'chord-champion', name: 'Chord Champion', icon: '🎵', description: '50 chord practice sessions', check: (stats, entries) => entries.filter(e => e.practiceArea === 'Chords').length >= 50 },
            { id: 'song-master', name: 'Song Master', icon: '🎤', description: '50 song practice sessions', check: (stats, entries) => entries.filter(e => e.practiceArea === 'Songs').length >= 50 },

            // Speed Progress
            { id: 'speed-demon', name: 'Speed Demon', icon: '🚀', description: 'Practice at 200+ BPM', check: (stats, entries) => entries.some(e => e.bpm && parseInt(e.bpm) >= 200) },
            { id: 'tempo-master', name: 'Tempo Master', icon: '🎚️', description: 'Practice at 10 different tempos', check: (stats, entries) => new Set(entries.filter(e => e.bpm).map(e => e.bpm)).size >= 10 },
            { id: 'slow-and-steady', name: 'Slow and Steady', icon: '🐢', description: 'Practice 20 sessions under 80 BPM', check: (stats, entries) => entries.filter(e => e.bpm && parseInt(e.bpm) < 80).length >= 20 },

            // Key Mastery
            { id: 'key-explorer', name: 'Key Explorer', icon: '🗝️', description: 'Practice in 12 different keys', check: (stats, entries) => new Set(entries.filter(e => e.key).map(e => e.key)).size >= 12 },
            { id: 'major-master', name: 'Major Master', icon: '🌟', description: 'Practice in all major keys', check: (stats, entries) => {
                const majorKeys = entries.filter(e => e.key && e.key.includes('Major')).map(e => e.key);
                return new Set(majorKeys).size >= 12;
            }},
            { id: 'minor-master', name: 'Minor Master', icon: '🌙', description: 'Practice in all minor keys', check: (stats, entries) => {
                const minorKeys = entries.filter(e => e.key && e.key.includes('Minor')).map(e => e.key);
                return new Set(minorKeys).size >= 12;
            }},

            // Goals
            { id: 'goal-setter', name: 'Goal Setter', icon: '🎯', description: 'Create your first goal', check: (stats, entries, goals) => goals.length >= 1 },
            { id: 'goal-achiever', name: 'Goal Achiever', icon: '✅', description: 'Complete 5 goals', check: (stats, entries, goals) => goals.filter(g => g.completed).length >= 5 },
            { id: 'goal-master', name: 'Goal Master', icon: '🏆', description: 'Complete 25 goals', check: (stats, entries, goals) => goals.filter(g => g.completed).length >= 25 },

            // Special
            { id: 'early-bird', name: 'Early Bird', icon: '🌅', description: 'Practice before 7 AM', check: (stats, entries) => entries.some(e => new Date(e.date).getHours() < 7) },
            { id: 'night-owl', name: 'Night Owl', icon: '🦉', description: 'Practice after 10 PM', check: (stats, entries) => entries.some(e => new Date(e.date).getHours() >= 22) },
            { id: 'weekend-warrior', name: 'Weekend Warrior', icon: '🏖️', description: 'Practice 20 weekend sessions', check: (stats, entries) => {
                const weekendSessions = entries.filter(e => {
                    const day = new Date(e.date).getDay();
                    return day === 0 || day === 6;
                });
                return weekendSessions.length >= 20;
            }},
            { id: 'holiday-hero', name: 'Holiday Hero', icon: '🎄', description: 'Practice on a major holiday', check: (stats, entries) => {
                const holidays = ['01-01', '07-04', '12-25', '12-31']; // Add more holidays
                return entries.some(e => {
                    const dateStr = new Date(e.date).toISOString().split('T')[0];
                    const monthDay = dateStr.slice(5);
                    return holidays.includes(monthDay);
                });
            }},
            { id: 'comeback-kid', name: 'Comeback Kid', icon: '💫', description: 'Return after 7+ days away', check: (stats, entries) => {
                for (let i = 1; i < entries.length; i++) {
                    const gap = new Date(entries[i-1].date) - new Date(entries[i].date);
                    if (gap > 7 * 24 * 60 * 60 * 1000) return true;
                }
                return false;
            }}
        ];
    }

    async render() {
        const stats = await this.storageService.calculateStats();
        const entries = await this.storageService.getPracticeEntries();
        const goals = this.storageService.getGoals();

        this.earnedAchievements = await this.getEarnedAchievements(stats, entries, goals);
        const totalEarned = this.earnedAchievements.length;
        const totalAchievements = this.achievements.length;
        const percentage = Math.round((totalEarned / totalAchievements) * 100);

        // Initialize lazy loader
        this.lazyBadges = new LazyAchievementBadges(this.container);

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
                <div class="achievements-grid" id="achievementsGrid">
                    ${this.renderAchievements('all')}
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    renderAchievements(filter = 'all') {
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
            return this.lazyBadges.renderBadge(achievement, isEarned).outerHTML;
        }).join('');
    }

    attachEventListeners() {
        // Filter buttons
        const filterBtns = this.container.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update active state
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Re-render achievements
                const filter = btn.dataset.filter;
                const grid = document.getElementById('achievementsGrid');
                grid.innerHTML = this.renderAchievements(filter);

                // Reinitialize lazy loader for new elements
                this.lazyBadges = new LazyAchievementBadges(this.container);
            });
        });

        // Listen for practice session saved events
        window.addEventListener('practiceSessionSaved', async () => {
            // Re-check achievements when new session is saved
            const stats = await this.storageService.calculateStats();
            const entries = await this.storageService.getPracticeEntries();
            const goals = this.storageService.getGoals();

            await this.getEarnedAchievements(stats, entries, goals);
        });
    }

    async getEarnedAchievements(stats, entries, goals) {
        const earned = JSON.parse(localStorage.getItem('guitarJournalAchievements') || '[]');
        const newlyEarned = [];

        for (const achievement of this.achievements) {
            if (!earned.includes(achievement.id)) {
                try {
                    const isEarned = await achievement.check(stats, entries, goals);
                    if (isEarned) {
                        earned.push(achievement.id);
                        newlyEarned.push(achievement);
                    }
                } catch (error) {
                    console.error(`Error checking achievement ${achievement.id}:`, error);
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
    }

    showAchievementNotification(achievement) {
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
    }

    celebrateAchievement() {
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
    }

    destroy() {
        // Clean up lazy loader
        if (this.lazyBadges) {
            this.lazyBadges.destroy();
        }

        // Remove event listeners
        window.removeEventListener('practiceSessionSaved', this.checkAchievements);
    }
}
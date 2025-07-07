// Notification Service
export class NotificationService {
    constructor() {
        this.container = null;
        this.queue = [];
        this.currentNotification = null;
        this.init();
    }

    init() {
        // Check if notification container exists
        this.container = document.getElementById('notification');

        if (!this.container) {
            // Create notification container
            this.container = document.createElement('div');
            this.container.id = 'notification';
            this.container.className = 'notification';
            document.body.appendChild(this.container);
        }

        // Request notification permission if supported
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    show(message, type = 'success', duration = 3000) {
        // Add to queue
        this.queue.push({ message, type, duration });

        // Process queue if not already processing
        if (!this.currentNotification) {
            this.processQueue();
        }
    }

    processQueue() {
        if (this.queue.length === 0) {
            this.currentNotification = null;
            return;
        }

        const notification = this.queue.shift();
        this.currentNotification = notification;

        // Show DOM notification
        this.showDOMNotification(notification);

        // Show browser notification if enabled
        if (this.shouldShowBrowserNotification(notification.type)) {
            this.showBrowserNotification(notification.message);
        }

        // Schedule next notification
        setTimeout(() => {
            this.hideDOMNotification();
            this.processQueue();
        }, notification.duration);
    }

    showDOMNotification(notification) {
        this.container.textContent = notification.message;

        // Set background based on type
        switch (notification.type) {
            case 'error':
                this.container.style.background = 'linear-gradient(135deg, var(--danger) 0%, #dc2626 100%)';
                break;
            case 'warning':
                this.container.style.background = 'linear-gradient(135deg, var(--warning) 0%, #d97706 100%)';
                break;
            case 'info':
                this.container.style.background = 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)';
                break;
            default: // success
                this.container.style.background = 'linear-gradient(135deg, var(--success) 0%, #059669 100%)';
        }

        // Add animation class
        this.container.classList.add('notification-show');
        this.container.style.display = 'block';
    }

    hideDOMNotification() {
        this.container.classList.remove('notification-show');
        this.container.style.display = 'none';
    }

    shouldShowBrowserNotification(type) {
        // Only show browser notifications for important messages
        return (type === 'success' || type === 'warning') &&
               'Notification' in window &&
               Notification.permission === 'granted' &&
               document.hidden; // Only when tab is not active
    }

    showBrowserNotification(message) {
        const notification = new Notification('Guitar Practice Journal', {
            body: message,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'guitar-practice',
            renotify: true
        });

        // Auto close after 5 seconds
        setTimeout(() => notification.close(), 5000);

        // Focus window on click
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }

    // Convenience methods
    success(message, duration = 3000) {
        this.show(message, 'success', duration);
    }

    error(message, duration = 4000) {
        this.show(message, 'error', duration);
    }

    warning(message, duration = 3500) {
        this.show(message, 'warning', duration);
    }

    info(message, duration = 3000) {
        this.show(message, 'info', duration);
    }

    // Special notifications
    practiceReminder() {
        const messages = [
            "🎸 Time to practice! Even 10 minutes makes a difference!",
            "🎵 Your guitar is calling! Ready for a practice session?",
            "🌟 Keep the streak going! Time for your daily practice!",
            "💪 Let's make some progress today! Guitar time!",
            "🔥 Don't break the streak! Quick practice session?"
        ];

        const randomMessage = messages[Math.floor(Math.random() * messages.length)];

        if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
            this.showBrowserNotification(randomMessage);
        } else {
            this.show(randomMessage, 'info', 5000);
        }
    }

    achievementUnlocked(achievement) {
        const message = `🏆 Achievement Unlocked: ${achievement}!`;
        this.show(message, 'success', 5000);

        // Always show browser notification for achievements
        if ('Notification' in window && Notification.permission === 'granted') {
            this.showBrowserNotification(message);
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

    // Check for achievements
    checkAchievements(stats) {
        const achievements = [
            { condition: stats.totalSessions === 1, name: "First Session" },
            { condition: stats.totalSessions === 10, name: "10 Sessions" },
            { condition: stats.totalSessions === 50, name: "50 Sessions" },
            { condition: stats.totalSessions === 100, name: "Century Club" },
            { condition: stats.currentStreak === 3, name: "3 Day Streak" },
            { condition: stats.currentStreak === 7, name: "Week Warrior" },
            { condition: stats.currentStreak === 30, name: "Monthly Master" },
            { condition: stats.totalTime >= 3600, name: "Hour Hero" },
            { condition: stats.totalTime >= 36000, name: "10 Hour Champion" },
            { condition: stats.totalTime >= 360000, name: "100 Hour Legend" }
        ];

        // Check each achievement
        achievements.forEach(achievement => {
            if (achievement.condition) {
                const achievementKey = `achievement_${achievement.name.replace(/\s/g, '_')}`;

                // Check if already earned
                if (!localStorage.getItem(achievementKey)) {
                    localStorage.setItem(achievementKey, 'true');
                    this.achievementUnlocked(achievement.name);
                }
            }
        });
    }
}
// Practice Reminder Service
export class ReminderService {
    constructor(storageService) {
        this.storageService = storageService;
        this.reminders = [];
        this.notificationPermission = 'default';
        this.reminderInterval = null;
    }

    async init() {
        // Load saved reminders
        await this.loadReminders();
        
        // Check notification permission
        if ('Notification' in window) {
            this.notificationPermission = Notification.permission;
            if (this.notificationPermission === 'default') {
                // Don't ask immediately, wait for user to enable reminders
            }
        }
        
        // Start checking reminders
        this.startReminderCheck();
    }

    async loadReminders() {
        try {
            const saved = localStorage.getItem('practiceReminders');
            if (saved) {
                this.reminders = JSON.parse(saved);
            } else {
                // Default reminders
                this.reminders = [
                    { id: 1, time: '09:00', enabled: false, days: [1,2,3,4,5], message: '🎸 Time for morning practice!' },
                    { id: 2, time: '18:00', enabled: false, days: [1,2,3,4,5,6,0], message: '🎵 Evening practice session!' }
                ];
                await this.saveReminders();
            }
        } catch (error) {
            console.error('Error loading reminders:', error);
        }
    }

    async saveReminders() {
        try {
            localStorage.setItem('practiceReminders', JSON.stringify(this.reminders));
        } catch (error) {
            console.error('Error saving reminders:', error);
        }
    }

    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            this.notificationPermission = permission;
            return permission === 'granted';
        }
        return this.notificationPermission === 'granted';
    }

    async addReminder(reminder) {
        reminder.id = Date.now();
        this.reminders.push(reminder);
        await this.saveReminders();
        return reminder;
    }

    async updateReminder(id, updates) {
        const index = this.reminders.findIndex(r => r.id === id);
        if (index !== -1) {
            this.reminders[index] = { ...this.reminders[index], ...updates };
            await this.saveReminders();
            return this.reminders[index];
        }
        return null;
    }

    async deleteReminder(id) {
        this.reminders = this.reminders.filter(r => r.id !== id);
        await this.saveReminders();
    }

    async toggleReminder(id) {
        const reminder = this.reminders.find(r => r.id === id);
        if (reminder) {
            reminder.enabled = !reminder.enabled;
            
            // Request permission if enabling and don't have it
            if (reminder.enabled && this.notificationPermission !== 'granted') {
                const granted = await this.requestNotificationPermission();
                if (!granted) {
                    reminder.enabled = false;
                    alert('Please enable notifications to use practice reminders.');
                }
            }
            
            await this.saveReminders();
            return reminder;
        }
        return null;
    }

    startReminderCheck() {
        // Check every minute
        this.reminderInterval = setInterval(() => {
            this.checkReminders();
        }, 60000);
        
        // Check immediately
        this.checkReminders();
    }

    stopReminderCheck() {
        if (this.reminderInterval) {
            clearInterval(this.reminderInterval);
            this.reminderInterval = null;
        }
    }

    checkReminders() {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

        this.reminders.forEach(reminder => {
            if (reminder.enabled && 
                reminder.time === currentTime && 
                reminder.days.includes(currentDay) &&
                (!reminder.lastShown || reminder.lastShown !== now.toDateString())) {
                
                this.showReminder(reminder);
                reminder.lastShown = now.toDateString();
                this.saveReminders();
            }
        });
    }

    showReminder(reminder) {
        // Browser notification
        if (this.notificationPermission === 'granted') {
            try {
                const notification = new Notification('Guitar Practice Reminder', {
                    body: reminder.message,
                    icon: '/icon-192x192.png',
                    badge: '/icon-192x192.png',
                    tag: 'practice-reminder',
                    requireInteraction: false // Not all browsers support this
                });

                notification.onclick = () => {
                    window.focus();
                    window.location.hash = '#practice';
                    notification.close();
                };
            } catch (error) {
                console.warn('Browser notification failed:', error);
                // Fall back to in-app notification only
            }
        }

        // Also show in-app notification
        this.showInAppReminder(reminder);
    }

    showInAppReminder(reminder) {
        // Create a floating notification
        const notification = document.createElement('div');
        notification.className = 'practice-reminder-notification';
        notification.innerHTML = `
            <div class="reminder-content">
                <h4>Practice Time!</h4>
                <p>${reminder.message}</p>
                <div class="reminder-actions">
                    <button class="btn btn-primary" onclick="window.location.hash='#practice'; this.parentElement.parentElement.parentElement.remove();">
                        Start Practice
                    </button>
                    <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove();">
                        Dismiss
                    </button>
                </div>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--bg-card);
            border: 2px solid var(--primary);
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            z-index: 9999;
            animation: slideInRight 0.3s ease;
            max-width: 320px;
        `;

        document.body.appendChild(notification);

        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 30000);
    }

    // Get next practice reminder
    getNextReminder() {
        const now = new Date();
        const enabledReminders = this.reminders.filter(r => r.enabled);
        
        if (enabledReminders.length === 0) return null;

        let nextReminder = null;
        let minMinutes = Infinity;

        enabledReminders.forEach(reminder => {
            const [hours, minutes] = reminder.time.split(':').map(Number);
            
            // Check each day the reminder is active
            reminder.days.forEach(day => {
                const reminderDate = new Date();
                reminderDate.setHours(hours, minutes, 0, 0);
                
                // Calculate days until this reminder day
                let daysUntil = (day - now.getDay() + 7) % 7;
                if (daysUntil === 0 && reminderDate <= now) {
                    daysUntil = 7; // Next week
                }
                
                reminderDate.setDate(reminderDate.getDate() + daysUntil);
                
                const minutesUntil = (reminderDate - now) / 60000;
                
                if (minutesUntil < minMinutes) {
                    minMinutes = minutesUntil;
                    nextReminder = {
                        ...reminder,
                        nextTime: reminderDate,
                        minutesUntil: Math.floor(minutesUntil)
                    };
                }
            });
        });

        return nextReminder;
    }

    // Get reminders for settings page
    getReminders() {
        return this.reminders;
    }

    destroy() {
        this.stopReminderCheck();
    }
}

// Create singleton instance
let reminderServiceInstance = null;

export function getReminderService(storageService) {
    if (!reminderServiceInstance) {
        reminderServiceInstance = new ReminderService(storageService);
    }
    return reminderServiceInstance;
}
// Push Notification Service - Handles practice reminders and exercise suggestions
export class PushNotificationService {
    constructor(storageService) {
        this.storageService = storageService;
        this.permission = null;
        this.practicePatterns = {};
        this.commonPracticeHours = [10, 14, 19]; // Default hours
        this.init();
    }

    async init() {
        try {
            // Request notification permission
            if ('Notification' in window) {
                this.permission = await Notification.requestPermission();
            }

            // Analyze practice patterns
            await this.analyzePracticePatterns();

            // Set up notification schedules
            this.scheduleNotifications();

            // Check for notifications every minute
            setInterval(() => this.checkNotifications(), 60000);
        } catch (error) {
            console.error('Error initializing push notifications:', error);
        }
    }

    async analyzePracticePatterns() {
        try {
        // Add a check to ensure storageService is ready
        if (!this.storageService) {
            console.warn('Storage service not ready for practice pattern analysis');
            return;
        }

        const entries = await this.storageService.getPracticeEntries();

        // Check if entries is an array
        if (!Array.isArray(entries)) {
            console.warn('getPracticeEntries did not return an array:', entries);
            return;
        }

        // Only analyze if we have entries
        if (entries.length === 0) {
            console.log('No practice entries found, using default notification times');
            return;
        }


            const patterns = {};

            entries.forEach(entry => {
                if (entry && entry.date) {
                    const date = new Date(entry.date);
                    const hour = date.getHours();

                    if (!patterns[hour]) {
                        patterns[hour] = 0;
                    }
                    patterns[hour]++;
                }
            });

            // Find most common practice hours
            this.practicePatterns = patterns;

            const sortedHours = Object.entries(patterns)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([hour]) => parseInt(hour));

            if (sortedHours.length > 0) {
                this.commonPracticeHours = sortedHours;
            }

            console.log('Practice patterns analyzed:', this.commonPracticeHours);

        } catch (error) {
            console.error('Error analyzing practice patterns:', error);
            // Keep default hours on error
        }
    }

    scheduleNotifications() {
        try {
            // Store scheduled notifications
            const notifications = [];

            // Practice reminders based on patterns
            this.commonPracticeHours.forEach(hour => {
                const reminderHour = hour - 0.25; // 15 minutes before
                notifications.push({
                    type: 'practice-reminder',
                    hour: Math.floor(reminderHour),
                    minute: Math.round((reminderHour % 1) * 60),
                    message: this.getPracticeReminderMessage()
                });
            });

            // Exercise suggestions at fixed times
            const suggestionTimes = [
                { hour: 10, minute: 0 },
                { hour: 14, minute: 30 },
                { hour: 19, minute: 0 }
            ];

            suggestionTimes.forEach(time => {
                notifications.push({
                    type: 'exercise-suggestion',
                    hour: time.hour,
                    minute: time.minute,
                    message: this.getExerciseSuggestion()
                });
            });

            localStorage.setItem('guitarJournalNotifications', JSON.stringify(notifications));
            console.log('Notifications scheduled:', notifications.length);

        } catch (error) {
            console.error('Error scheduling notifications:', error);
        }
    }

    checkNotifications() {
        if (this.permission !== 'granted') return;

        try {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();

            const notifications = JSON.parse(localStorage.getItem('guitarJournalNotifications') || '[]');
            const sentToday = JSON.parse(localStorage.getItem('guitarJournalSentToday') || '[]');

            notifications.forEach(notif => {
                const notifId = `${notif.type}-${notif.hour}-${notif.minute}`;

                if (notif.hour === currentHour &&
                    Math.abs(notif.minute - currentMinute) < 2 &&
                    !sentToday.includes(notifId)) {

                    this.sendNotification(notif.message);
                    sentToday.push(notifId);
                    localStorage.setItem('guitarJournalSentToday', JSON.stringify(sentToday));
                }
            });

            // Reset sent notifications at midnight
            if (currentHour === 0 && currentMinute === 0) {
                localStorage.setItem('guitarJournalSentToday', '[]');
            }
        } catch (error) {
            console.error('Error checking notifications:', error);
        }
    }

    sendNotification(message) {
        if (this.permission !== 'granted') return;

        try {
            new Notification('Guitar Practice Journal 🎸', {
                body: message,
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                tag: 'guitar-practice',
                requireInteraction: true
            });
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }

    getPracticeReminderMessage() {
        const messages = [
            "Time to practice! Your guitar is waiting 🎸",
            "Ready for your practice session? Let's make progress today!",
            "Your usual practice time is coming up. Keep the streak going!",
            "15 minutes until practice time. Warm up those fingers!",
            "Daily practice builds mastery. See you in 15 minutes!"
        ];
        return messages[Math.floor(Math.random() * messages.length)];
    }

    getExerciseSuggestion() {
        const exercises = [
            "Try the Spider Walk exercise for finger independence today!",
            "Practice the A minor pentatonic scale in different positions",
            "Work on your barre chords - try F major for 5 minutes",
            "Challenge: Play a C major scale at 120 BPM cleanly",
            "Focus on alternate picking with a simple 1-2-3-4 pattern",
            "Practice transitioning between G, C, and D chords smoothly",
            "Try fingerpicking pattern: thumb-1-2-3-2-1 on an E minor chord",
            "Work on your vibrato technique with sustained notes",
            "Practice the chromatic scale ascending and descending",
            "Try playing a song you know in a different key",
            "Focus on rhythm: practice strumming patterns with a metronome",
            "Work on hammer-ons and pull-offs in the pentatonic scale",
            "Practice power chords moving up the neck",
            "Try the classical tremolo technique on a single string",
            "Work on your blues bends - aim for perfect pitch"
        ];
        return "Exercise suggestion: " + exercises[Math.floor(Math.random() * exercises.length)];
    }
}
// services/notificationManager.js - Centralized notification system

export class NotificationManager {
    static instance = null;

    constructor() {
        if (NotificationManager.instance) {
            return NotificationManager.instance;
        }

        this.container = null;
        this.queue = [];
        this.currentNotification = null;
        this.hideTimeout = null;
        this.init();

        NotificationManager.instance = this;
    }

    static getInstance() {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager();
        }
        return NotificationManager.instance;
    }

    init() {
        // Check if notification container exists
        this.container = document.getElementById('notification');

        if (!this.container) {
            // Create notification container
            this.container = document.createElement('div');
            this.container.id = 'notification';
            this.container.className = 'notification';
            this.container.style.display = 'none'; // Hidden by default
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

        // Schedule next notification - store timeout ID
        this.hideTimeout = setTimeout(() => {
            this.hideDOMNotification();
            this.processQueue();
        }, notification.duration);
    }

    showDOMNotification(notification) {
        this.container.textContent = notification.message;

        // Set background based on type
        switch (notification.type) {
            case 'error':
                this.container.style.background =
                    'linear-gradient(135deg, var(--danger) 0%, #dc2626 100%)';
                break;
            case 'warning':
                this.container.style.background =
                    'linear-gradient(135deg, var(--warning) 0%, #d97706 100%)';
                break;
            case 'info':
                this.container.style.background =
                    'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)';
                break;
            default: // success
                this.container.style.background =
                    'linear-gradient(135deg, var(--success) 0%, #059669 100%)';
        }

        // Apply all necessary styles
        this.container.style.position = 'fixed';
        this.container.style.bottom = '20px';
        this.container.style.right = '20px';
        this.container.style.zIndex = '999999';
        this.container.style.padding = '16px 24px';
        this.container.style.borderRadius = '8px';
        this.container.style.color = 'white';
        this.container.style.fontWeight = '500';
        this.container.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
        this.container.style.maxWidth = '400px';
        this.container.style.display = 'block';

        // Add animation class
        this.container.classList.add('notification-show');
    }

    hideDOMNotification() {
        this.container.classList.remove('notification-show');
        this.container.style.display = 'none';
    }

    shouldShowBrowserNotification(type) {
        // Only show browser notifications for important messages
        return (
            (type === 'success' || type === 'warning') &&
            'Notification' in window &&
            Notification.permission === 'granted' &&
            document.hidden
        ); // Only when tab is not active
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
}

// Export singleton instance
export const notificationManager = NotificationManager.getInstance();

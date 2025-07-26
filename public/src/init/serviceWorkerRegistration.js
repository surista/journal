// Service Worker Registration
// Handles registration and updates for the service worker

if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('✅ Service Worker registered successfully');

            // Check for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('📦 New Service Worker found, installing...');

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('🔄 New Service Worker installed, update available!');

                        // Notify user about update
                        if (window.notificationManager) {
                            window.notificationManager.show(
                                'Update Available',
                                'A new version is available. Refresh to update.',
                                'info',
                                {
                                    duration: 0,
                                    actions: [
                                        {
                                            label: 'Refresh',
                                            action: () => window.location.reload()
                                        }
                                    ]
                                }
                            );
                        }
                    }
                });
            });

            // Check for updates periodically
            setInterval(() => {
                registration.update();
            }, 60000); // Check every minute
        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
        }
    });
}

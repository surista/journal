// service-worker.js - Updated with proper cache management
const CACHE_NAME = 'guitar-practice-journal-v7.7.2'; // Update version
const CACHE_VERSION = '7.7.2';

// Files to cache - be specific about what we cache
const STATIC_CACHE_URLS = [
    './',
    './index.html',
    './login.html',
    './manifest.json',

    // CSS files
    './styles/main.css',

    // Core JS files
    './src/app.js',
    './src/config.js',

    // Service files
    './src/services/authService.js',
    './src/services/storageService.js',
    './src/services/audioService.js',
    './src/services/notificationManager.js',

    // Component files
    './src/components/timer.js',
    './src/components/practiceForm.js',
    './src/components/audioPlayer.js',
    './src/components/metronome.js',
    './src/components/goalsList.js',
    './src/components/statsPanel.js',
    './src/components/streakHeatMap.js',
    './src/components/achievementBadges.js',
    './src/components/waveform.js',

    // Page files
    './src/pages/dashboard.js',
    './src/pages/calendar.js',
    './src/pages/auth.js',

    // Utility files
    './src/utils/helpers.js',
    './src/utils/router.js'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing version', CACHE_VERSION);

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Service Worker: Caching files');
            return cache.addAll(STATIC_CACHE_URLS);
        }).then(() => {
            console.log('Service Worker: Installation complete, skipping waiting');
            // Force the waiting service worker to become the active service worker
            return self.skipWaiting();
        }).catch((error) => {
            console.error('Service Worker: Installation failed', error);
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating version', CACHE_VERSION);

    event.waitUntil(
        Promise.all([
            // Clear old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Take control of all clients immediately
            self.clients.claim()
        ]).then(() => {
            console.log('Service Worker: Activation complete');

            // Notify all clients about the update
            return self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        type: 'SW_UPDATED',
                        version: CACHE_VERSION
                    });
                });
            });
        })
    );
});

// Fetch event - serve cached content with network-first strategy for critical files
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip external requests
    if (requestUrl.origin !== location.origin) {
        return;
    }

    // Network-first strategy for critical files (HTML, JS, CSS)
    if (isCriticalResource(requestUrl.pathname)) {
        event.respondWith(networkFirstStrategy(event.request));
    }
    // Cache-first strategy for static assets
    else {
        event.respondWith(cacheFirstStrategy(event.request));
    }
});

// Check if resource is critical (should always be fresh)
function isCriticalResource(pathname) {
    const criticalExtensions = ['.html', '.js', '.css'];
    const criticalPaths = ['/', '/index.html', '/src/', '/styles/'];

    return criticalExtensions.some(ext => pathname.endsWith(ext)) ||
           criticalPaths.some(path => pathname.startsWith(path));
}

// Network-first strategy (for critical resources)
async function networkFirstStrategy(request) {
    try {
        // Try network first
        const response = await fetch(request);

        // If successful, update cache and return response
        if (response && response.status === 200) {
            const responseClone = response.clone();
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, responseClone);

            console.log('Service Worker: Updated cache for', request.url);
            return response;
        }

        throw new Error('Network response not ok');
    } catch (error) {
        console.log('Service Worker: Network failed, trying cache for', request.url);

        // If network fails, try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // If both fail, return a basic error response
        return new Response('Resource not available', {
            status: 404,
            statusText: 'Not Found'
        });
    }
}

// Cache-first strategy (for static assets)
async function cacheFirstStrategy(request) {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    // If not in cache, try network
    try {
        const response = await fetch(request);

        // If successful, cache and return
        if (response && response.status === 200) {
            const responseClone = response.clone();
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, responseClone);
            return response;
        }

        return response;
    } catch (error) {
        console.error('Service Worker: Failed to fetch', request.url, error);

        // Return basic error response
        return new Response('Resource not available', {
            status: 404,
            statusText: 'Not Found'
        });
    }
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'SKIP_WAITING':
                console.log('Service Worker: Received SKIP_WAITING message');
                self.skipWaiting();
                break;

            case 'GET_VERSION':
                event.ports[0].postMessage({
                    type: 'VERSION_INFO',
                    version: CACHE_VERSION,
                    cacheName: CACHE_NAME
                });
                break;

            case 'CLEAR_CACHE':
                console.log('Service Worker: Clearing cache');
                caches.delete(CACHE_NAME).then(() => {
                    event.ports[0].postMessage({
                        type: 'CACHE_CLEARED'
                    });
                });
                break;
        }
    }
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
    if (event.tag === 'practice-data-sync') {
        event.waitUntil(syncPracticeData());
    }
});

async function syncPracticeData() {
    // Implementation for syncing practice data when back online
    console.log('Service Worker: Syncing practice data');
    // This would sync any pending practice session data
}

// Push notifications (if needed in the future)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();

        const options = {
            body: data.body || 'Time to practice guitar!',
            icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM2MzY2ZjEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNhODU1ZjciLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgZmlsbD0idXJsKCNhKSIgcng9IjI0Ii8+PHRleHQgeD0iOTYiIHk9IjEyMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjgwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+OuDwvdGV4dD48L3N2Zz4=',
            badge: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCA3MiA3MiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIGZpbGw9IiM2MzY2ZjEiIHJ4PSI4Ii8+PHRleHQgeD0iMzYiIHk9IjQ4IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzIiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7wn464PC90ZXh0Pjwvc3ZnPg==',
            tag: 'practice-reminder',
            renotify: true,
            actions: [
                {
                    action: 'practice',
                    title: 'Start Practice'
                },
                {
                    action: 'dismiss',
                    title: 'Later'
                }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(
                data.title || 'Guitar Practice Reminder',
                options
            )
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'practice') {
        // Open the app and navigate to practice
        event.waitUntil(
            clients.openWindow('./')
        );
    }
});

console.log('Service Worker script loaded, version:', CACHE_VERSION);
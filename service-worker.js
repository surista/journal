// Service Worker for offline functionality
const CACHE_NAME = 'guitar-journal-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/styles/main.css',
    '/styles/components.css',
    '/styles/pages.css',
    '/src/app.js',
    '/src/services/authService.js',
    '/src/services/storageService.js',
    '/src/pages/dashboard.js',
    '/src/pages/auth.js',
    '/src/components/timer.js',
    '/src/components/audioPlayer.js',
    '/src/utils/router.js'
];

// Install event - cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                // Clone the request
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(response => {
                    // Check if we received a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
            .catch(() => {
                // Offline fallback
                return caches.match('/index.html');
            })
    );
});

// Background sync for data upload
self.addEventListener('sync', event => {
    if (event.tag === 'sync-practice-data') {
        event.waitUntil(syncPracticeData());
    }
});

async function syncPracticeData() {
    // This would sync local data with a server when online
    console.log('Syncing practice data...');
    // Implementation would go here
}
// Service Worker for offline functionality
const CACHE_NAME = 'guitar-journal-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    // Only cache files that actually exist
    // Remove or comment out any that don't exist in your project
];

// Install event - cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                // Try to cache each file individually to avoid failures
                return Promise.all(
                    urlsToCache.map(url => {
                        return cache.add(url).catch(err => {
                            console.warn(`Failed to cache ${url}:`, err);
                            // Continue even if individual files fail
                            return Promise.resolve();
                        });
                    })
                );
            })
            .then(() => self.skipWaiting())
            .catch(err => {
                console.error('Cache installation failed:', err);
                // Still skip waiting even if caching fails
                return self.skipWaiting();
            })
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
    // Skip chrome-extension and non-http(s) requests
    if (event.request.url.startsWith('chrome-extension://') ||
        !event.request.url.startsWith('http')) {
        return;
    }

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
                            // Only cache successful responses
                            if (response.status === 200) {
                                cache.put(event.request, responseToCache);
                            }
                        })
                        .catch(err => {
                            console.warn('Failed to cache response:', err);
                        });

                    return response;
                }).catch(err => {
                    console.warn('Fetch failed:', err);
                    // Return offline fallback if available
                    return caches.match('/index.html');
                });
            })
            .catch(err => {
                console.error('Cache match error:', err);
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
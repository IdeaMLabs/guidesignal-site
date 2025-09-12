/**
 * GuideSignal Optimized Service Worker
 * Provides advanced caching and performance optimizations
 */

const CACHE_NAME = 'guidesignal-v2.0.0';
const STATIC_CACHE = 'guidesignal-static-v2.0.0';
const DYNAMIC_CACHE = 'guidesignal-dynamic-v2.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/auth.html',
    '/dashboard.html',
    '/apply.html',
    '/assets/auth-optimized.js',
    '/assets/firebase-config-optimized.js',
    '/assets/ai-ml-consolidated.js',
    '/assets/shared.css',
    '/manifest.json'
];

// Assets to cache on first access
const DYNAMIC_ASSETS_PATTERNS = [
    /\.(?:js|css|png|jpg|jpeg|svg|webp|woff|woff2)$/,
    /\/api\/.*/,
    /https:\/\/fonts\.googleapis\.com/,
    /https:\/\/fonts\.gstatic\.com/
];

// Network-first patterns (always try network first)
const NETWORK_FIRST_PATTERNS = [
    /\/api\/auth/,
    /\/api\/jobs/,
    /\.json$/
];

// Stale-while-revalidate patterns
const SWR_PATTERNS = [
    /\/assets\/.*/,
    /\.(?:css|js)$/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE).then((cache) => {
                return cache.addAll(STATIC_ASSETS);
            }),
            caches.open(DYNAMIC_CACHE) // Initialize dynamic cache
        ]).then(() => {
            return self.skipWaiting();
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            // Clean up old cache versions
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && 
                            cacheName !== DYNAMIC_CACHE &&
                            cacheName.startsWith('guidesignal-')) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Take control of all clients immediately
            self.clients.claim()
        ])
    );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip external requests (except fonts and CDN assets)
    if (url.origin !== location.origin && 
        !isAllowedExternalRequest(url)) {
        return;
    }

    // Choose caching strategy based on request type
    if (isNetworkFirst(request)) {
        event.respondWith(networkFirstStrategy(request));
    } else if (isStaleWhileRevalidate(request)) {
        event.respondWith(staleWhileRevalidateStrategy(request));
    } else if (isStaticAsset(request)) {
        event.respondWith(cacheFirstStrategy(request));
    } else {
        event.respondWith(networkFirstWithFallback(request));
    }
});

// Network-first strategy (for dynamic content)
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Fallback to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page for navigation requests
        if (request.destination === 'document') {
            return createOfflinePage();
        }
        
        throw error;
    }
}

// Cache-first strategy (for static assets)
async function cacheFirstStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.status === 200) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Return placeholder for images
        if (request.destination === 'image') {
            return createImagePlaceholder();
        }
        
        throw error;
    }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidateStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    // Start network request in background
    const networkResponsePromise = fetch(request).then((response) => {
        if (response.status === 200) {
            const cache = caches.open(DYNAMIC_CACHE);
            cache.then(c => c.put(request, response.clone()));
        }
        return response;
    }).catch(() => null);
    
    // Return cached version immediately, or wait for network
    return cachedResponse || networkResponsePromise;
}

// Network-first with fallback
async function networkFirstWithFallback(request) {
    try {
        const networkResponse = await Promise.race([
            fetch(request),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 3000)
            )
        ]);
        
        if (networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        return cachedResponse || createErrorResponse();
    }
}

// Helper functions for request classification
function isNetworkFirst(request) {
    return NETWORK_FIRST_PATTERNS.some(pattern => 
        pattern.test(request.url)
    );
}

function isStaleWhileRevalidate(request) {
    return SWR_PATTERNS.some(pattern => 
        pattern.test(request.url)
    );
}

function isStaticAsset(request) {
    return STATIC_ASSETS.includes(request.url) ||
           DYNAMIC_ASSETS_PATTERNS.some(pattern => 
               pattern.test(request.url)
           );
}

function isAllowedExternalRequest(url) {
    const allowedDomains = [
        'fonts.googleapis.com',
        'fonts.gstatic.com',
        'www.gstatic.com'
    ];
    
    return allowedDomains.some(domain => 
        url.hostname.includes(domain)
    );
}

// Create offline page response
function createOfflinePage() {
    const offlineHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offline - GuideSignal</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: #f9fafb;
            color: #374151;
            text-align: center;
            padding: 20px;
        }
        
        .offline-icon {
            width: 80px;
            height: 80px;
            margin-bottom: 24px;
            border-radius: 50%;
            background: #1a365d;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 32px;
        }
        
        h1 {
            margin-bottom: 16px;
            color: #1a365d;
        }
        
        .retry-btn {
            margin-top: 24px;
            padding: 12px 24px;
            background: #1a365d;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
        }
        
        .retry-btn:hover {
            background: #2d4a6b;
        }
    </style>
</head>
<body>
    <div class="offline-icon">📶</div>
    <h1>You're Offline</h1>
    <p>Please check your internet connection and try again.</p>
    <button class="retry-btn" onclick="location.reload()">
        Try Again
    </button>
</body>
</html>`;
    
    return new Response(offlineHTML, {
        headers: { 'Content-Type': 'text/html' },
        status: 200
    });
}

// Create image placeholder
function createImagePlaceholder() {
    const svg = `
<svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#e5e7eb"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" 
          fill="#6b7280" text-anchor="middle" dy=".3em">
        Image Unavailable
    </text>
</svg>`;
    
    return new Response(svg, {
        headers: { 'Content-Type': 'image/svg+xml' },
        status: 200
    });
}

// Create generic error response
function createErrorResponse() {
    return new Response('Service Unavailable', {
        status: 503,
        statusText: 'Service Unavailable'
    });
}

// Message handling for cache updates
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_UPDATE') {
        // Force update specific cache entries
        const { urls } = event.data;
        updateCacheEntries(urls);
    }
});

// Update specific cache entries
async function updateCacheEntries(urls) {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    for (const url of urls) {
        try {
            const response = await fetch(url);
            if (response.status === 200) {
                await cache.put(url, response);
            }
        } catch (error) {
            // Silently fail for individual URLs
        }
    }
}

// Performance monitoring
self.addEventListener('fetch', (event) => {
    // Track performance metrics (can be sent to analytics)
    if (event.request.destination === 'document') {
        const startTime = performance.now();
        
        event.request.addEventListener('loadend', () => {
            const loadTime = performance.now() - startTime;
            
            // Send performance data to main thread
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'PERFORMANCE_METRIC',
                        data: {
                            url: event.request.url,
                            loadTime: loadTime,
                            cached: !!event.request.cache
                        }
                    });
                });
            });
        });
    }
});

// Background sync for offline actions (if supported)
if ('sync' in self.registration) {
    self.addEventListener('sync', (event) => {
        if (event.tag === 'background-sync') {
            event.waitUntil(handleBackgroundSync());
        }
    });
}

async function handleBackgroundSync() {
    // Handle any queued offline actions
    const queuedActions = await getQueuedActions();
    
    for (const action of queuedActions) {
        try {
            await processQueuedAction(action);
            await removeQueuedAction(action.id);
        } catch (error) {
            // Keep in queue for next sync attempt
        }
    }
}

async function getQueuedActions() {
    // Implement queue storage logic (IndexedDB, etc.)
    return [];
}

async function processQueuedAction(action) {
    // Process offline actions when back online
    return fetch(action.url, action.options);
}

async function removeQueuedAction(id) {
    // Remove processed action from queue
}
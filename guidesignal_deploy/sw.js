// Service Worker for GuideSignal PWA
const CACHE_NAME = 'guidesignal-v2.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/jobs.html',
  '/apply.html',
  '/post.html',
  '/how.html',
  '/faq.html',
  '/enhanced_index.html',
  '/advanced_dashboard.html',
  '/assets/GuideSignalLogo.png',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('🚀 GuideSignal SW: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.warn('🔧 GuideSignal SW: Cache install failed', error);
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        return fetch(event.request).then(response => {
          // Don't cache non-successful responses
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
      .catch(error => {
        console.warn('🌐 GuideSignal SW: Fetch failed', error);
        
        // Return offline page for navigation requests
        if (event.request.destination === 'document') {
          return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>GuideSignal - Offline</title>
              <style>
                body { 
                  font-family: system-ui, sans-serif; 
                  text-align: center; 
                  padding: 2rem; 
                  background: #f9fafb; 
                }
                .offline-message {
                  max-width: 400px;
                  margin: 0 auto;
                  padding: 2rem;
                  background: white;
                  border-radius: 16px;
                  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }
              </style>
            </head>
            <body>
              <div class="offline-message">
                <h1>📡 You're Offline</h1>
                <p>GuideSignal requires an internet connection for real-time job matching.</p>
                <p>Check your connection and try again.</p>
                <button onclick="location.reload()">Retry</button>
              </div>
            </body>
            </html>
          `, {
            headers: { 'Content-Type': 'text/html' }
          });
        }
        
        return new Response('Offline', { status: 503 });
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
            console.log('🧹 GuideSignal SW: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline applications
self.addEventListener('sync', event => {
  if (event.tag === 'job-application') {
    event.waitUntil(processOfflineApplications());
  }
});

// Push notifications for job matches
self.addEventListener('push', event => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/assets/GuideSignalLogo.png',
    badge: '/assets/GuideSignalLogo.png',
    vibrate: [100, 50, 100],
    data: data.data,
    actions: [
      {
        action: 'view',
        title: 'View Job',
        icon: '/assets/view-icon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/assets/dismiss-icon.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'view') {
    // Open the job page
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// Process offline applications when back online
async function processOfflineApplications() {
  // Implementation would sync offline data
  console.log('🔄 GuideSignal SW: Processing offline applications');
}
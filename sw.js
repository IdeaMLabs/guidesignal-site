// GuideSignal Service Worker - Enhanced Performance & Offline Support
// Version: 2.1.0

const CACHE_NAME = 'guidesignal-v2.1.0';
const STATIC_CACHE = 'guidesignal-static-v2.1.0';
const DYNAMIC_CACHE = 'guidesignal-dynamic-v2.1.0';
const API_CACHE = 'guidesignal-api-v2.1.0';

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Resources to cache immediately
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/jobs.html',
  '/how.html',
  '/apply.html',
  '/post.html',
  '/faq.html',
  '/assets/optimized.css',
  '/assets/GuideSignalLogo.png',
  '/manifest.json'
];

// API endpoints to cache with different strategies
const API_ROUTES = {
  '/scoreboard.json': { strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE, ttl: 5 * 60 * 1000 }, // 5 minutes
  '/public_jobs.csv': { strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE, ttl: 10 * 60 * 1000 }, // 10 minutes
  '/public_cohort.csv': { strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE, ttl: 30 * 60 * 1000 } // 30 minutes
};

// Performance monitoring
const performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0,
  errors: 0,
  avgResponseTime: 0
};

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker v2.1.0');
  
  event.waitUntil(
    Promise.all([
      // Cache static resources
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static resources');
        return cache.addAll(STATIC_RESOURCES.map(url => new Request(url, { cache: 'reload' })));
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ]).catch(error => {
      console.error('[SW] Install failed:', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker v2.1.0');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external requests (except fonts and APIs)
  if (url.origin !== location.origin && !isAllowedExternalResource(url)) {
    return;
  }
  
  // Handle different types of requests
  if (isStaticResource(url.pathname)) {
    event.respondWith(handleStaticResource(request));
  } else if (isAPIRequest(url.pathname)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isImageRequest(url.pathname)) {
    event.respondWith(handleImageResource(request));
  } else {
    event.respondWith(handleDynamicResource(request));
  }
});

// Handle static resources with cache-first strategy
async function handleStaticResource(request) {
  const startTime = performance.now();
  
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      performanceMetrics.cacheHits++;
      logPerformance('static-cache-hit', performance.now() - startTime);
      return cached;
    }
    
    // Network fallback
    const response = await fetchWithTimeout(request);
    
    // Cache successful responses
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    performanceMetrics.cacheMisses++;
    performanceMetrics.networkRequests++;
    logPerformance('static-network', performance.now() - startTime);
    
    return response;
    
  } catch (error) {
    performanceMetrics.errors++;
    console.error('[SW] Static resource error:', error);
    return createErrorResponse('Static resource unavailable');
  }
}

// Handle API requests with configurable strategies
async function handleAPIRequest(request) {
  const startTime = performance.now();
  const pathname = new URL(request.url).pathname;
  const config = API_ROUTES[pathname] || { strategy: CACHE_STRATEGIES.NETWORK_FIRST, ttl: 5 * 60 * 1000 };
  
  try {
    switch (config.strategy) {
      case CACHE_STRATEGIES.CACHE_FIRST:
        return await handleCacheFirst(request, API_CACHE, config.ttl);
      
      case CACHE_STRATEGIES.NETWORK_FIRST:
        return await handleNetworkFirst(request, API_CACHE, config.ttl);
      
      case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
        return await handleStaleWhileRevalidate(request, API_CACHE, config.ttl);
      
      default:
        return await handleNetworkFirst(request, API_CACHE, config.ttl);
    }
  } catch (error) {
    performanceMetrics.errors++;
    console.error('[SW] API request error:', error);
    
    // Try to serve from cache as fallback
    const cache = await caches.open(API_CACHE);
    const cached = await cache.match(request);
    return cached || createErrorResponse('API temporarily unavailable');
  } finally {
    logPerformance('api-request', performance.now() - startTime);
  }
}

// Utility functions
function isStaticResource(pathname) {
  return pathname.endsWith('.css') || 
         pathname.endsWith('.js') || 
         pathname === '/' || 
         pathname.endsWith('.html') ||
         pathname === '/manifest.json';
}

function isAPIRequest(pathname) {
  return pathname.endsWith('.json') || 
         pathname.endsWith('.csv') ||
         pathname.startsWith('/api/');
}

function isImageRequest(pathname) {
  return /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(pathname);
}

function isAllowedExternalResource(url) {
  const allowedDomains = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'ideamlabs.github.io'
  ];
  
  return allowedDomains.some(domain => url.hostname === domain);
}

async function fetchWithTimeout(request, timeout = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(request, { 
      signal: controller.signal,
      headers: {
        ...request.headers,
        'Cache-Control': 'no-cache'
      }
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function createErrorResponse(message) {
  return new Response(
    JSON.stringify({
      error: true,
      message,
      timestamp: new Date().toISOString(),
      offline: !navigator.onLine
    }),
    {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    }
  );
}

function logPerformance(type, duration) {
  // Update average response time
  const currentCount = performanceMetrics.networkRequests + performanceMetrics.cacheHits;
  performanceMetrics.avgResponseTime = (
    (performanceMetrics.avgResponseTime * (currentCount - 1) + duration) / currentCount
  );
  
  // Log slow requests
  if (duration > 3000) {
    console.warn(`[SW] Slow ${type} request: ${duration.toFixed(2)}ms`);
  }
}

// Message handling for performance metrics
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'GET_PERFORMANCE_METRICS') {
    event.ports[0].postMessage({
      type: 'PERFORMANCE_METRICS',
      data: {
        ...performanceMetrics,
        cacheHitRate: performanceMetrics.cacheHits / (performanceMetrics.cacheHits + performanceMetrics.cacheMisses) || 0,
        errorRate: performanceMetrics.errors / performanceMetrics.networkRequests || 0,
        timestamp: Date.now()
      }
    });
  }
});

console.log('[SW] GuideSignal Service Worker v2.1.0 loaded successfully');
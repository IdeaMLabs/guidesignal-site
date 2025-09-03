// GuideSignal Service Worker - Optimized v2.3.0
const CACHE_NAME = 'guidesignal-v2.3.0';
const STATIC_CACHE = 'guidesignal-static-v2.3.0';
const DYNAMIC_CACHE = 'guidesignal-dynamic-v2.3.0';
const API_CACHE = 'guidesignal-api-v2.3.0';

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
  '/assets/index-optimized.css',
  '/assets/index-optimized.js',
  '/assets/GuideSignalLogo.png',
  '/assets/GuideSignalLogo.webp',
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
    'ideamlabs.github.io',
    'guidesignal.netlify.app',
    'guidesignal.github.io',
    'www.gstatic.com',
    'apis.google.com',
    'identitytoolkit.googleapis.com'
  ];
  
  // Only allow HTTPS external resources
  if (url.protocol !== 'https:') {
    console.warn('[SW] Blocked non-HTTPS external resource:', url.href);
    return false;
  }
  
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

// Handle dynamic resources with network-first strategy
async function handleDynamicResource(request) {
    return handleNetworkFirst(request, DYNAMIC_CACHE);
}

// Handle image resources with optimized caching
async function handleImageResource(request) {
    const startTime = performance.now();
    
    try {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        
        if (cached) {
            performanceMetrics.cacheHits++;
            logPerformance('image-cache-hit', performance.now() - startTime);
            return cached;
        }
        
        // Try to fetch with WebP optimization
        const optimizedRequest = await optimizeImageRequest(request);
        const response = await fetchWithTimeout(optimizedRequest);
        
        // Cache successful responses
        if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
            cache.put(request, response.clone());
        }
        
        performanceMetrics.networkRequests++;
        logPerformance('image-network', performance.now() - startTime);
        
        return response;
        
    } catch (error) {
        performanceMetrics.errors++;
        console.error('[SW] Image resource error:', error);
        
        // Return placeholder image or cached fallback
        return createPlaceholderImage();
    }
}

// Cache-first strategy with TTL
async function handleCacheFirst(request, cacheName, ttl = 0) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    if (cached && !isExpired(cached, ttl)) {
        performanceMetrics.cacheHits++;
        return cached;
    }
    
    try {
        const response = await fetchWithTimeout(request);
        if (response.ok) {
            const responseToCache = response.clone();
            // Add timestamp header for TTL
            const headers = new Headers(responseToCache.headers);
            headers.set('sw-cache-time', Date.now().toString());
            
            const modifiedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers
            });
            
            cache.put(request, modifiedResponse);
        }
        
        performanceMetrics.networkRequests++;
        return response;
        
    } catch (error) {
        if (cached) {
            console.warn('[SW] Serving stale cache due to network error');
            return cached;
        }
        throw error;
    }
}

// Network-first strategy with fallback
async function handleNetworkFirst(request, cacheName, ttl = 0) {
    try {
        const response = await fetchWithTimeout(request, 5000);
        
        if (response.ok) {
            const cache = await caches.open(cacheName);
            const responseToCache = response.clone();
            
            // Add metadata
            const headers = new Headers(responseToCache.headers);
            headers.set('sw-cache-time', Date.now().toString());
            
            const modifiedResponse = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers
            });
            
            cache.put(request, modifiedResponse);
        }
        
        performanceMetrics.networkRequests++;
        return response;
        
    } catch (error) {
        // Fallback to cache
        const cache = await caches.open(cacheName);
        const cached = await cache.match(request);
        
        if (cached) {
            performanceMetrics.cacheHits++;
            console.warn('[SW] Network failed, serving from cache');
            return cached;
        }
        
        throw error;
    }
}

// Stale-while-revalidate strategy
async function handleStaleWhileRevalidate(request, cacheName, ttl = 0) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    // Always try to update in background
    const updatePromise = fetchWithTimeout(request)
        .then(response => {
            if (response.ok) {
                const headers = new Headers(response.headers);
                headers.set('sw-cache-time', Date.now().toString());
                
                const responseToCache = new Response(response.body, {
                    status: response.status,
                    statusText: response.statusText,
                    headers
                });
                
                cache.put(request, responseToCache);
            }
            return response;
        })
        .catch(error => {
            console.error('[SW] Background update failed:', error);
        });
    
    // Return cached version immediately if available
    if (cached && !isExpired(cached, ttl)) {
        performanceMetrics.cacheHits++;
        updatePromise; // Fire and forget
        return cached;
    }
    
    // Wait for network if no cache or expired
    try {
        const response = await updatePromise;
        performanceMetrics.networkRequests++;
        return response;
    } catch (error) {
        if (cached) {
            console.warn('[SW] Network failed, serving stale cache');
            return cached;
        }
        throw error;
    }
}

// Optimize image requests for WebP support
async function optimizeImageRequest(request) {
    const url = new URL(request.url);
    
    // Check if browser supports WebP
    if (supportsWebP() && url.pathname.match(/\.(png|jpg|jpeg)$/i)) {
        // Try to request WebP version
        const webpUrl = url.pathname.replace(/\.(png|jpg|jpeg)$/i, '.webp');
        return new Request(url.origin + webpUrl, {
            headers: request.headers,
            method: request.method,
            mode: request.mode,
            credentials: request.credentials,
            cache: request.cache,
            redirect: request.redirect,
            referrer: request.referrer
        });
    }
    
    return request;
}

// Check WebP support
function supportsWebP() {
    // Check for WebP support in Accept header or use feature detection
    return self.registration?.scope && 
           (self.navigator?.userAgent?.includes('Chrome') || 
            self.navigator?.userAgent?.includes('Firefox'));
}

// Check if cached response is expired
function isExpired(response, ttl) {
    if (ttl <= 0) return false;
    
    const cacheTime = response.headers.get('sw-cache-time');
    if (!cacheTime) return true;
    
    const age = Date.now() - parseInt(cacheTime);
    return age > ttl;
}

// Create placeholder image for failed loads
function createPlaceholderImage() {
    const svg = `
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="200" fill="#f3f4f6"/>
            <text x="100" y="100" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="Arial, sans-serif" font-size="14">
                Image unavailable
            </text>
        </svg>
    `;
    
    return new Response(svg, {
        headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'no-cache'
        }
    });
}

console.log('[SW] GuideSignal Service Worker v2.1.0 loaded successfully');
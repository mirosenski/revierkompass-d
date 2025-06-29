// RevierKompass Maps Service Worker
// Handles offline caching for map tiles and routing data

const CACHE_NAME = 'revierkompass-maps-v1';
const RUNTIME_CACHE = 'revierkompass-maps-runtime';

// URLs to cache immediately
const PRECACHE_URLS = [
  '/api/maps/capabilities',
  '/api/maps/styles',
  '/api/maps/profiles'
];

// Cache strategies for different resource types
const CACHE_STRATEGIES = {
  tiles: 'cache-first',
  styles: 'network-first',
  routing: 'network-first',
  geocoding: 'network-first'
};

// Install event - precache important resources
self.addEventListener('install', event => {
  console.log('Maps Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Precaching maps resources');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Maps Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => 
              cacheName.startsWith('revierkompass-maps-') && 
              cacheName !== CACHE_NAME &&
              cacheName !== RUNTIME_CACHE
            )
            .map(cacheName => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - handle offline requests
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle requests to our API
  if (!url.pathname.startsWith('/api/maps/')) {
    return;
  }
  
  // Determine strategy based on request type
  if (url.pathname.includes('/tiles/')) {
    event.respondWith(handleTileRequest(request));
  } else if (url.pathname.includes('/route')) {
    event.respondWith(handleRoutingRequest(request));
  } else if (url.pathname.includes('/geocode')) {
    event.respondWith(handleGeocodingRequest(request));
  } else if (url.pathname.includes('/styles')) {
    event.respondWith(handleStyleRequest(request));
  } else {
    event.respondWith(handleGenericRequest(request));
  }
});

// Handle map tile requests with cache-first strategy
async function handleTileRequest(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  try {
    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('Tile request failed:', error);
    
    // Return cached version if available
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return empty tile as fallback
    return new Response(new ArrayBuffer(0), {
      status: 200,
      headers: { 'Content-Type': 'application/x-protobuf' }
    });
  }
}

// Handle routing requests with network-first strategy
async function handleRoutingRequest(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  try {
    // Try network first
    const networkResponse = await fetch(request, { timeout: 10000 });
    
    // Cache successful responses for POST requests too
    if (networkResponse.ok) {
      // For POST requests, create a cache key based on the request body
      const cacheKey = request.method === 'POST' 
        ? await createCacheKeyFromPostRequest(request)
        : request;
      
      if (cacheKey) {
        cache.put(cacheKey, networkResponse.clone());
      }
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('Routing request failed, trying cache:', error);
    
    // Try to find cached response
    const cacheKey = request.method === 'POST'
      ? await createCacheKeyFromPostRequest(request)
      : request;
    
    if (cacheKey) {
      const cachedResponse = await cache.match(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Return error response
    return new Response(JSON.stringify({
      error: 'Routing service unavailable offline',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle geocoding requests with network-first strategy
async function handleGeocodingRequest(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  try {
    // Try network first
    const networkResponse = await fetch(request, { timeout: 8000 });
    
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('Geocoding request failed, trying cache:', error);
    
    // Try cached version
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return error response
    return new Response(JSON.stringify({
      error: 'Geocoding service unavailable offline',
      offline: true,
      results: []
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle style requests with network-first strategy
async function handleStyleRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request, { timeout: 5000 });
    
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('Style request failed, trying cache:', error);
    
    // Try cached version
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return basic fallback style
    return new Response(JSON.stringify(getBasicFallbackStyle()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle generic requests with network-first strategy
async function handleGenericRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request, { timeout: 5000 });
    
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('Generic request failed, trying cache:', error);
    
    // Try cached version
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return appropriate error response
    return new Response(JSON.stringify({
      error: 'Service unavailable offline',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper function to create cache key for POST requests
async function createCacheKeyFromPostRequest(request) {
  try {
    const body = await request.text();
    const bodyHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body));
    const hashArray = Array.from(new Uint8Array(bodyHash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return new Request(`${request.url}?body_hash=${hashHex}`, {
      method: 'GET',
      headers: request.headers
    });
  } catch (error) {
    console.error('Failed to create cache key:', error);
    return null;
  }
}

// Basic fallback map style for offline use
function getBasicFallbackStyle() {
  return {
    version: 8,
    name: 'Offline Fallback',
    sources: {
      'offline-source': {
        type: 'raster',
        tiles: ['/api/maps/tiles/offline/{z}/{x}/{y}.png'],
        tileSize: 256
      }
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': '#f0f0f0'
        }
      },
      {
        id: 'offline-tiles',
        type: 'raster',
        source: 'offline-source',
        paint: {
          'raster-opacity': 1
        }
      }
    ]
  };
}

// Handle background sync for queued requests
self.addEventListener('sync', event => {
  if (event.tag === 'background-route-sync') {
    event.waitUntil(processQueuedRouteRequests());
  }
});

// Process queued route requests when back online
async function processQueuedRouteRequests() {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const requests = await cache.keys();
    
    // Find queued route requests
    const queuedRequests = requests.filter(request => 
      request.url.includes('/route') && 
      request.headers.get('x-queued') === 'true'
    );
    
    // Process each queued request
    for (const request of queuedRequests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response);
        }
      } catch (error) {
        console.error('Failed to process queued request:', error);
      }
    }
    
    console.log(`Processed ${queuedRequests.length} queued route requests`);
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Handle push messages for offline package updates
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    
    if (data.type === 'offline-package-ready') {
      event.waitUntil(
        self.registration.showNotification('RevierKompass', {
          body: 'Offline-Paket für Baden-Württemberg ist bereit zum Download',
          icon: '/images/police-badge.jpg',
          badge: '/images/police-badge.jpg',
          actions: [
            {
              action: 'download',
              title: 'Jetzt herunterladen'
            },
            {
              action: 'dismiss',
              title: 'Später'
            }
          ]
        })
      );
    }
  }
});

// Handle notification actions
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'download') {
    event.waitUntil(
      clients.openWindow('/admin?tab=offline-packages')
    );
  }
});

console.log('RevierKompass Maps Service Worker loaded');

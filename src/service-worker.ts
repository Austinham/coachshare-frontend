/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const API_URL = import.meta.env.VITE_API_URL || 'https://coachshare-api.vercel.app/api';

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Only handle API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response
          const responseToCache = response.clone();

          // Add CORS headers to the response
          const headers = new Headers(responseToCache.headers);
          headers.set('Access-Control-Allow-Origin', event.request.headers.get('origin') || '*');
          headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
          headers.set('Access-Control-Allow-Credentials', 'true');

          // Create a new response with the modified headers
          return new Response(responseToCache.body, {
            status: responseToCache.status,
            statusText: responseToCache.statusText,
            headers: headers
          });
        })
        .catch((error) => {
          console.error('Service Worker fetch error:', error);
          throw error;
        })
    );
  }
});

// Handle push notifications
self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() ?? {};
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: {
      url: data.url,
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow(event.notification.data.url)
  );
}); 
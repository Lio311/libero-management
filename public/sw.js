self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/libero-logo.png',
      badge: '/libero-logo.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2'
      }
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Required for PWA installation
self.addEventListener('fetch', function (event) {
  // We just let the request pass through. This satisfies the PWA criteria.
  // We can add actual offline caching later if needed.
});

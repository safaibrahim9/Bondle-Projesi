self.addEventListener('push', function (event) {
    if (event.data) {
        try {
            const data = event.data.json();
            
            const title = data.notification?.title || 'Bondle Bildirim';
            const options = {
                body: data.notification?.body || 'Yeni bir bildiriminiz var.',
                icon: data.notification?.icon || '/icons/icon-192x192.png',
                badge: data.notification?.badge || '/icons/badge.png',
                data: data.notification?.data || { url: '/' },
                vibrate: data.notification?.vibrate || [100, 50, 100],
            };

            event.waitUntil(
                self.registration.showNotification(title, options)
            );
        } catch (e) {
            console.error('Error parsing push event data:', e);
            // Fallback for simple text payloads
            event.waitUntil(
                self.registration.showNotification('Bondle', {
                    body: event.data.text()
                })
            );
        }
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window/tab
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

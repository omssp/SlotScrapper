importScripts("https://www.gstatic.com/firebasejs/8.6.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.6.0/firebase-messaging.js");
importScripts('https://cdn.jsdelivr.net/gh/omssp/SlotScrapper@1.1/init.js');

const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(function(payload) {
    console.log("[firebase-messaging-sw.js] Received background message ", payload);
    const notification = JSON.parse(payload.data.notification);
    const notificationTitle = notification.title;

    return self.registration.showNotification(
        notificationTitle,
        notification
    );
});

self.addEventListener('notificationclick', function(event) {
    const action = event.action;
    if (!action || (action && action.indexOf('dismiss-only') == -1)) {
        // event.waitUntil(clients.openWindow(`/@notify?action=${action}`));
        const dataURL = `/@notify?action=${action}`;
        event.waitUntil(
            clients.matchAll({ type: 'window' })
            .then(clientsArr => {
                const hadWindowToFocus = clientsArr.some(windowClient => {
                    return (windowClient.url === dataURL) ? (windowClient.focus(), true) : false;
                });
                if (!hadWindowToFocus)
                    clients.openWindow(dataURL)
                    .then(windowClient => windowClient ? windowClient.focus() : null);
            })
        );
    }
    if ((action && action.indexOf('dismiss') != -1) || (event.notification.tag && event.notification.tag.indexOf('dismiss') != -1)) {
        event.notification.close();
    }
    console.log(`open the website : /@notify?action=${action}`);
});

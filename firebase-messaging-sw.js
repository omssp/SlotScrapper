importScripts('/init.js');

const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(function(payload) {
    console.log("[firebase-messaging-sw.js] Received background message ", payload);
    // const notification = JSON.parse(payload.data.notification)
    // const notificationTitle = notification.title;

    // return self.registration.showNotification(
    //     notificationTitle,
    //     notification,
    // );
});

self.addEventListener('notificationclick', function(event) {
    const action = event.action;
    if (!action || (action && action.indexOf('dismiss-only') == -1)) {
        event.waitUntil(clients.openWindow(`/@notify-action?action=${action}`));
    }
    if (action && action.indexOf('dismiss') != -1) {
        event.notification.close();
    }
    console.log(`open the website : /@notify-action?action=${action}`);
});
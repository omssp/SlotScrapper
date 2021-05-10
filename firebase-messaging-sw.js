importScripts("https://www.gstatic.com/firebasejs/7.16.1/firebase-app.js");
importScripts(
    "https://www.gstatic.com/firebasejs/7.16.1/firebase-messaging.js",
);
// For an optimal experience using Cloud Messaging, also add the Firebase SDK for Analytics.
importScripts(
    "https://www.gstatic.com/firebasejs/7.16.1/firebase-analytics.js",
);

firebase.initializeApp({
    messagingSenderId: "1038599281105",
    apiKey: "AIzaSyBMkdyBvH87S21fiu9GdiHHbcE0IVCAqPg",
    projectId: "slotscra",
    appId: "1:1038599281105:web:f9fa1cf08f99e7d28d28f0",
});

const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(function(payload) {
    console.log(
        "[firebase-messaging-sw.js] Received background message ",
        payload,
    );
    let notification = JSON.parse(payload.data.notification)
    notification.data = payload.data.url
    const notificationTitle = notification.title;

    return self.registration.showNotification(
        notificationTitle,
        notification,
    );
});

self.addEventListener('notificationclick', function(event) {
    if (!event.action || event.action == 'visit') {
        event.waitUntil(
            clients.openWindow(event.notification.data ? event.notification.data : "https://selfregistration.cowin.gov.in/")
        );
        console.log(`open the website : ${event.notification.data ? event.notification.data : "https://selfregistration.cowin.gov.in/"}`);
        return;
    }
    switch (event.action) {
        case 'dismiss':
            console.log('dismiss');
            break;
        default:
            console.log(`Unknown action clicked: ${event.action}`);
            break;
    }
    event.notification.close();
});
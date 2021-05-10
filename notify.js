var firebaseConfig = {
    messagingSenderId: "1038599281105",
    apiKey: "AIzaSyBMkdyBvH87S21fiu9GdiHHbcE0IVCAqPg",
    projectId: "slotscra",
    appId: "1:1038599281105:web:f9fa1cf08f99e7d28d28f0",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

let clientToken;

$(document).ready(() => {

    askNotificationPermission();

    messaging.onMessage(function(payload) {
        console.log("onMessage: ", payload);
        const notification = JSON.parse(payload.data.notification)
        navigator.serviceWorker.getRegistration('/firebase-cloud-messaging-push-scope')
            .then(registration => {
                registration.showNotification(
                    notification.title,
                    notification
                )
            });
    });
});

$('#enableNotify').on('click', askNotificationPermission);

$('#regbtn').on('click', () => {
    // showNotification('asdsad')
});

function checkNotificationPromise() {
    try {
        Notification.requestPermission().then();
    } catch (e) {
        return false;
    }
    return true;
}

function askNotificationPermission() {
    showPreloader();
    // function to actually ask the permissions
    function handlePermission(permission) {
        messaging
            .requestPermission()
            .then(function() {
                console.log("Notification permission granted.");
                return messaging.getToken()
            })
            .then(function(token) {
                $('#enableNotify').addClass('d-none');
                $('#regbtn').removeClass('d-none');
                clientToken = token;
                console.log("token is : " + token);
                stopPreloader();
            })
            .catch(function(err) {
                $('#enableNotify').removeClass('d-none');
                $('#regbtn').addClass('d-none');
                if (Notification.permission === 'denied')
                    alert("Notifications blocked. Please enable them in your browser.");
                console.log("Unable to get permission to notify.", err);
                stopPreloader();
            });
    }

    // Let's check if the browser supports notifications
    if (!('Notification' in window)) {
        alert("This browser does not support notifications.");
    } else {
        if (checkNotificationPromise()) {
            Notification.requestPermission()
                .then((permission) => {
                    handlePermission(permission);
                })
        } else {
            Notification.requestPermission(function(permission) {
                handlePermission(permission);
            });
        }
    }
}

function showPreloader() {

    $('.preloader-background').removeClass('d-none');
    $('.form-body').addClass('loading-blurred');
}

function stopPreloader() {

    $('.preloader-background').addClass('d-none');
    $('.form-body').removeClass('loading-blurred');
}

/*
function subscribeTokenToTopic(token, topic) {
  fetch('https://myserver.com/'+token+'/rel/topics/'+topic, {
    method: 'POST',
    headers: new Headers({
      'Authorization': 'Bearer '+ oauthToken
    })
  }).then(response => {
    if (response.status < 200 || response.status >= 400) {
      throw 'Error subscribing to topic: '+response.status + ' - ' + response.text();
    }
    console.log('Subscribed to "'+topic+'"');
  }).catch(error => {
    console.error(error);
  })
}
*/
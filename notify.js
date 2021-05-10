var firebaseConfig = {
    messagingSenderId: "1038599281105",
    apiKey: "AIzaSyBMkdyBvH87S21fiu9GdiHHbcE0IVCAqPg",
    projectId: "slotscra",
    appId: "1:1038599281105:web:f9fa1cf08f99e7d28d28f0",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

let clientToken;
let origin = 'https://ss.omssp.workers.dev'

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

$('#regbtn').on('click', fetchSubscription);

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
                fetchSubscription();
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

function fetchSubscription() {
    $.when(showPreloader()).then(() => {

        let theURL = `${origin}/@action`
        let days = 1
        switch ($('input[name="sub"]:checked').attr('id')) {
            case "week":
                days = 7;
                break;
            case "month":
                days = 30;
                break;
        }
        $.ajax({
            method: "GET",
            url: theURL,
            data: {
                clientToken,
                topic: $("div.col-12.mt-1 > input").val(),
                days
            },
            async: false,
            success: function(response) {
                console.log(response)
                let radioId = 'day'

                switch (response.subscribed) {
                    case "new":
                    case "old":
                        if (response.found.days > 7) {
                            radioId = 'month'
                        } else if (response.found.days > 1) {
                            radioId = 'week'
                        }
                        $('input[name="sub"]').attr('disabled', true);
                        $("div.col-12.mt-1 > input").attr('disabled', true);
                        $("div.col-12.mt-1 > input").val(response.found.topic);
                        $('#regbtn').html('Unregister');
                        $('#regbtn').off('click').on('click', unSub)
                        break;
                }
                $(`#${radioId}`).attr('checked', true);
                stopPreloader();
            },
            error: function(e) {
                console.log(e)
                alert(e.statusText)
            }
        });
    });
}


function unSub() {
    $.when(showPreloader()).then(() => {
        let theURL = `${origin}/@remove`
        $.ajax({
            method: "GET",
            url: theURL,
            data: {
                clientToken
            },
            async: false,
            success: function(response) {
                console.log(response)
                $('input[name="sub"]').removeAttr('disabled');
                $("div.col-12.mt-1 > input").removeAttr('disabled');
                $('#regbtn').html('Register');
                $('#regbtn').off('click').on('click', fetchSubscription)
                stopPreloader();
            },
            error: function(e) {
                console.log(e)
                alert(e.statusText)
            }
        });
    });
}
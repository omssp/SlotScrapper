var firebaseConfig = {
    messagingSenderId: "1038599281105",
    apiKey: "AIzaSyBMkdyBvH87S21fiu9GdiHHbcE0IVCAqPg",
    projectId: "slotscra",
    appId: "1:1038599281105:web:f9fa1cf08f99e7d28d28f0",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

let clientToken;
let origin = '';
let first_notify;

$(document).ready(() => {
    first_notify = alertNotify('Please Allow the Notifications', 'info', 'topCenter', 25000);

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
                fetchSubscription(false);
            })
            .catch(function(err) {
                $('#enableNotify').removeClass('d-none');
                $('#regbtn').addClass('d-none');
                if (Notification.permission === 'denied') {
                    // alert("Notifications blocked. Please enable them in your browser.");
                    alertNotify('Notifications blocked. Please enable them in your browser.', 'error');
                }
                console.log("Unable to get permission to notify.", err);
                alertNotify(err.message, 'error', 'bottomCenter');
                stopPreloader();
            });
    }

    // Let's check if the browser supports notifications
    if (!('Notification' in window)) {
        // alert("This browser does not support notifications.");
        alertNotify('This browser does not support notifications.', 'warning');
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
    if (first_notify)
        first_notify.close();
    $('.preloader-background').addClass('d-none');
    $('.form-body').removeClass('loading-blurred');
}

function fetchSubscription(force_validation = true) {
    let topic = parseInt($("div.col-12.mt-1 > input").val());
    let consentGiven = $('#invalidCheck').is(":checked")
    if (force_validation) {
        let flag = false
        if (!consentGiven) {
            alertNotify(`Please confirm to receive Notification`, 'warning', 'topCenter');
            flag = true
        }
        if (!topic || topic < 100000 || topic > 999999) {
            alertNotify(`Please enter a valid Pin Code`, 'warning', 'topCenter');
            flag = true
        }
        if (flag)
            return
    }
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
                topic,
                days
            },
            async: false,
            success: function(response) {
                console.log(response)
                let radioId = 'day'
                let message = `Welcome back!<br/> You have already Registered and are receiving the Notifications Updates`
                switch (response.subscribed) {
                    case "new":
                        message = `Congratulations!<br/> You have Registered and will be receive the Notifications Updates`
                    case "old":
                        if (response.found.days > 7) {
                            radioId = 'month'
                        } else if (response.found.days > 1) {
                            radioId = 'week'
                        }
                        $('input[name="sub"]').attr('disabled', true);
                        $("div.col-12.mt-1 > input").attr('disabled', true);
                        $("div.col-12.mt-1 > input").val(response.found.topic);
                        $('#invalidCheck').attr('checked', true);
                        $('#invalidCheck').attr('disabled', true);
                        $('#regbtn').html('Unregister');
                        $('#regbtn').off('click').on('click', unSub);
                        alertNotify(message, 'success');
                        break;
                }
                $(`#${radioId}`).attr('checked', true);
                stopPreloader();
            },
            error: function(e) {
                console.log(e);
                // alert(e.statusText)
                alertNotify(`${e.status} : ${e.statusText}`, 'error', 'bottomCenter');
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
                $('#invalidCheck').removeAttr('disabled');
                $('#invalidCheck').attr('checked', false);
                $('#regbtn').html('Register');
                $('#regbtn').off('click').on('click', fetchSubscription)
                stopPreloader();
                alertNotify(`You have been Unregistered`, 'warning', 'bottomCenter');
            },
            error: function(e) {
                console.log(e);
                // alert(e.statusText)
                alertNotify(`${e.status} : ${e.statusText}`, 'error', 'bottomCenter');
            }
        });
    });
}

function alertNotify(text, type = 'info', layout = 'topCenter', timeout = 5000) {
    return (new Noty({
        text,
        theme: 'sunset',
        type,
        timeout,
        layout,
        // animation: {
        //     open: function(promise) {
        //         var n = this;
        //         Velocity(n.barDom, {
        //             left: 450,
        //             scaleY: 2
        //         }, {
        //             duration: 0
        //         });
        //         Velocity(n.barDom, {
        //             left: 0,
        //             scaleY: 1
        //         }, {
        //             easing: [8, 8],
        //             complete: function() {
        //                 promise(function(resolve) {
        //                     resolve();
        //                 })
        //             }
        //         });
        //     },
        //     close: function(promise) {
        //         var n = this;
        //         Velocity(n.barDom, {
        //             left: '+=-50'
        //         }, {
        //             easing: [8, 8, 2],
        //             duration: 350
        //         });
        //         Velocity(n.barDom, {
        //             left: 450,
        //             scaleY: .2,
        //             height: 0,
        //             margin: 0
        //         }, {
        //             easing: [8, 8],
        //             complete: function() {
        //                 promise(function(resolve) {
        //                     resolve();
        //                 })
        //             }
        //         });
        //     }
        // }
    }).show());
}
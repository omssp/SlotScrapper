const saveToStorage = data => SLOT_STORAGE.put("subrs", data);
const getFromStorage = () => SLOT_STORAGE.get("subrs");

const NotifyOptions = {
    'method': 'POST',
    'url': 'https://fcm.googleapis.com/fcm/send',
    'headers': {
        'Authorization': 'key=AAAA8dFXWdE:APA91bG9JLLAfunOANuyJEHf8Ak5rBUZ5EAN5fpxt_klXdj7lYdd0CFfnsmEUyK3TjEMZjqB3NduwCftrLqJJCprAG0Sw5kTPN--VFBF_KoB0R3xppFCRiaaI7YCVbrbFKKMpr2n0CKv',
        'Content-Type': 'application/json'
    },
    body: {}
};

addEventListener('fetch', function(event) {
    const { request } = event
    const response = handleRequest(request).catch(handleError)
    event.respondWith(response)
})

/**
 * Receives a HTTP request and replies with a response.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest(request) {
    const { method, url } = request
    const theURL = new URL(url)
    const { host, pathname } = theURL

    let token = theURL.searchParams.get('clientToken')
    token = (token) ? token.trim() : false
    let topic = theURL.searchParams.get('topic')
    topic = topic ? topic.trim() : false
    let days = theURL.searchParams.get('days')
    days = days ? days.trim() : false
    if (pathname.startsWith('/@action')) {

        if (token && topic) {
            return subscribeORCheck(token, topic, days)

        } else if (token) {
            return checkSubed(token)
        }
    } else if (pathname.startsWith('/@remove') && token) {
        return unSub(token)
    } else if (pathname.startsWith('/@subrs') && topic === "password") {
        return new Response(await getFromStorage(), {
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            }
        });
    } else if (pathname.startsWith('/@notify')) {
        return sendNotifications()
    }



    switch (pathname) {
        case '/':
            return returnWithGit('/index.html');
        case '/index.html':
        case '/notify.js':
        case '/firebase-messaging-sw.js':
        case '/manifest.json':
            return returnWithGit(pathname);
        case '/robots.txt':
            return new Response(null, { status: 204 })
    }

    // Workers on these hostnames have no origin server,
    // therefore there is nothing else to be found
    if (host.endsWith('.workers.dev') ||
        host.endsWith('.cloudflareworkers.com')) {
        return new Response('Not Found', { status: 404 })
    }

    // Makes a fetch request to the origin server
    return fetch(request)
}

async function returnWithGit(what) {
    let theLink = `https://raw.githubusercontent.com/omssp/SlotScrapper/master${what}`
    const r = await fetch(theLink, {
        // cf: {
        //     cacheTtlByStatus: { "200-299": 6912000, 404: 1, "500-599": 0 }
        // },
    });
    theMIME = 'text/html'
    if (what.endsWith('js')) {
        theMIME = 'text/javascript'
    } else if (what.endsWith('json')) {
        theMIME = 'application/json'
    }
    return new Response(r.body, {
        headers: {
            'Content-Type': theMIME + '; charset=utf-8',
            // 'Cache-Control': 'max-age=6912000'
        }
    });
}

async function subscribeORCheck(token, topic, days) {
    days = parseInt(days) ? days : 1

    let data = JSON.parse(await getFromStorage())
    data = data ? data : []

    let body = { subscribed: 'old' }
    body.found = data.find(o => o.token == token)

    if (!body.found) {
        let subr = { token, topic, days, datets: (new Date()) }
        data.push(subr)
        await saveToStorage(JSON.stringify(data))
        body.subscribed = 'new'
        body.found = subr

        let options = NotifyOptions
        options.body = JSON.stringify(buildNotifyBody([token]))
        await fetch(options.url, options)
    }
    return new Response(JSON.stringify(body), {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
        }
    });
}

async function unSub(token) {
    let data = JSON.parse(await getFromStorage())
    data = data ? data : []

    let body = { subscribed: "404" }
    body.foundIndex = data.findIndex(o => o.token == token)

    if (body.found != -1) {
        body.subscribed = false
        data.splice(body.foundIndex, 1)
        await saveToStorage(JSON.stringify(data))
    }
    return new Response(JSON.stringify(body), {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
        }
    });
}

async function checkSubed(token) {
    let data = JSON.parse(await getFromStorage())
    data = data ? data : []

    let body = { subscribed: 'old' }
    body.found = data.find(o => o.token == token)

    if (!body.found) {
        body.subscribed = false
    }
    return new Response(JSON.stringify(body), {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
        }
    });
}

/**
 * Responds with an uncaught error.
 * @param {Error} error
 * @returns {Response}
 */
function handleError(error) {
    console.error('Uncaught error:', error)

    const { stack } = error
    return new Response(stack || error, {
        status: 500,
        headers: {
            'Content-Type': 'text/plain;charset=UTF-8'
        }
    })
}

function buildNotifyBody(tokens_array = [], title = `Hey There \u{1f44b}`, body = "You will receive a similar notification when any\nCOWIN or COVISHIELD Sessions become available\nat you Registered Pin Code", visit_action = false) {
    console.log(tokens_array)
    let theBody = {
        data: {
            notification: {
                title,
                body,
                icon: "http://vomkar.droppages.com/icon.png",
                vibrate: [200, 100, 200],
                actions: [{
                    action: "dismiss",
                    title: "Okay"
                }]
            },
            url: "https://selfregistration.cowin.gov.in/",
        },
        registration_ids: tokens_array
    };
    if (visit_action)
        theBody.data.notification.actions.shift({ action: "visit", title: "Book Slot" });

    return theBody
}

async function sendNotifications() {

    let data = JSON.parse(await getFromStorage())

    let pinCodes = {}
    data.forEach(o => {
        (o.topic in pinCodes) ? (pinCodes[o.topic].push(o.token)) : (pinCodes[o.topic] = [o.token]);
    });

    let notifyResponses = []

    for (const [pinCode, tokens] of Object.entries(pinCodes)) {
        console.log(pinCode, tokens);

        let todaysDate = new Date().toJSON().slice(0, 10).split('-').reverse().join('-')
        let apiURL = `https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByPin?pincode=${pinCode}&date=${todaysDate}`

        let totalSlotsCount = 0
        let msgBody = `Hurry Up; Book Fast\n`;

        let response = await (await fetch(apiURL)).text()
        console.log(response)
        if (response.body.startsWith('{')) {
            response = JSON.parse(response.body)
            response.centers.forEach(center => {
                let centerSessionsCount = 0
                center.sessions.forEach(session => {
                    let count = parseInt(session.available_capacity)
                    totalSlotsCount += count ? count : 0
                    centerSessionsCount += count ? count : 0
                });
                if (centerSessionsCount > 0) {
                    msgBody += `${centerSessionsCount} slots at ${center.address}\n`
                }
            });
        }
        msgBody += `\nTake Care \u{e056}`

        if (totalSlotsCount > 0) {
            let title = `${totalSlotsCount} Slots Opened at ${pinCode} \u{1f44b}`
            let options = NotifyOptions
            options.body = JSON.stringify(buildNotifyBody(tokens, title, msgBody, true))
            notifyResponses.push(await fetch(options.url, options))
        }
    }

    return new Response(JSON.stringify(notifyResponses), {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
        }
    });
}
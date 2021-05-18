const saveToStorage = data => SLOT_STORAGE.put("subrs", data);
const getFromStorage = () => SLOT_STORAGE.get("subrs");

const redirect_url = "https://selfregistration.cowin.gov.in/";
const githubBaseURL = "https://cdn.jsdelivr.net/gh/omssp/SlotScrapper@1.3";

const NotifyOptions = {
    method: 'POST',
    url: 'https://fcm.googleapis.com/fcm/send',
    headers: {
        'Authorization': `key=${AUTH_KEY}`,
        'Content-Type': 'application/json'
    },
    body: {}
};

addEventListener('fetch', function(event) {
    const { request } = event;
    const response = handleRequest(request).catch(handleError);
    event.respondWith(response);
});

URL.prototype.getFilteredParams = function(param) {
    let res = this.searchParams.get(param);
    return res ? res.trim() : false;
};

String.prototype.polynomialRollingHash = function() {
    // P and M
    let p = 31;
    let m = 1e9 + 9;
    let power_of_p = 1;
    let hash_val = 0;

    // Loop to calculate the hash value
    // by iterating over the elements of stringToHashing
    for (let i = 0; i < this.length; i++) {
        hash_val = (hash_val + (this.charCodeAt(i) - 64) * power_of_p) % m;
        power_of_p = (power_of_p * p) % m;
    }
    return hash_val;
};

async function filterSubscribers(subscribers, saveUpdatedSubscribers = false) {
    let oldCount = subscribers.length;
    subscribers.forEach((o, i) => {
        // console.log(o)
        if (o.ts) {
            let dateTo = new Date();
            let dateFrom = new Date(o.ts);
            o.days_remaining = parseFloat((parseInt(o.days) - (dateTo.valueOf() - dateFrom.valueOf()) / (1000 * 60 * 60 * 24)).toFixed(2));
        }
    });
    if (saveUpdatedSubscribers) {
        subscribers = subscribers.filter(o => o.days_remaining > 0);
        if (oldCount != subscribers.length) {
            removals = subscribers.filter(o => o.days_remaining <= 0.0);
            await sayGoodBye(removals);
            await saveToStorage(JSON.stringify(subscribers));
        }
    }
    return subscribers;
}

async function sayGoodBye(listGoers) {
    let arrayTokens = [];
    listGoers.forEach(goer => {
        arrayTokens.push(goer.token);
    });

    console.log(arrayTokens)

    let options = NotifyOptions;
    let title = `See Ya \u{1f44b}`;

    let msgBody = `Your subscription has ended.\n\nIf you still wish to receive the Slot Availability Alerts\n\u{1f449} Just Resubscribe, Its FREE \u{1f609}`;
    let bodyObj = buildNotifyBody(arrayTokens, title, msgBody, `dismiss-bye-bye`);
    bodyObj.data.notification.actions = [{
        action: "dismiss-only",
        title: "Okay"
    }, {
        action: "dismiss-bye-bye",
        title: "Resubscribe"
    }];

    options.body = JSON.stringify(bodyObj);

    await fetch(options.url, options);
}

/**
 * Receives a HTTP request and replies with a response.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest(request) {
    const { method, url } = request;
    const theURL = new URL(url);
    const { host, pathname } = theURL;

    let token = theURL.getFilteredParams('clientToken');
    let topic = theURL.getFilteredParams('topic');
    let days = theURL.getFilteredParams('days');

    if (pathname.startsWith('/@action')) {
        if (token && topic) {
            return subscribeORCheck(token, topic, days);
        } else if (token) {
            return checkSubed(token);
        }
    } else if (pathname.startsWith('/@remove') && token) {
        return unSub(token);
    } else if (pathname.startsWith('/@subrs') && topic === PASS_WORD) {
        let subscribers = JSON.parse(await getFromStorage());
        if (days === 'purge') {
            await saveToStorage(JSON.stringify([]));
            subscribers.push("all above entries are purged");
        } else if (days === 'expired') {
            subscribers = await filterSubscribers(subscribers, true);
        }
        subscribers = await filterSubscribers(subscribers);
        return new Response(JSON.stringify(subscribers), {
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            }
        });
    } else if (pathname.startsWith('/@notification')) {
        return sendNotifications();
    } else if (pathname.startsWith('/@notify')) {
        let action = theURL.getFilteredParams('action');
        switch (action) {
            case 'dismiss-bye-bye':
            case 'dismiss-unregister':
                return returnWithGit('/index.html');
            default:
                return new Response('', {
                    status: 307,
                    headers: {
                        'Location': redirect_url
                    }
                });
        }
    }

    switch (pathname) {
        case '/':
            return returnWithGit('/index.html');
        case '/index.html':
        case '/init.js':
        case '/notify.js':
        case '/firebase-messaging-sw.js':
        case '/manifest.json':
            return returnWithGit(pathname);
        case '/robots.txt':
            return new Response(null, { status: 204 });
    }

    // Workers on these host names have no origin server,
    // therefore there is nothing else to be found
    if (host.endsWith('.workers.dev') ||
        host.endsWith('.cloudflareworkers.com')) {
        return new Response('Not Found', { status: 404 });
    }

    // Makes a fetch request to the origin server
    return fetch(request);
}

async function returnWithGit(where) {
    let theLink = `${githubBaseURL}${where}`;
    const r = await fetch(theLink, {
        cf: {
            cacheTtlByStatus: { "200-299": 9999990, 404: 1, "500-599": 0 }
        },
    });
    theMIME = 'text/html';
    if (where.endsWith('js')) {
        theMIME = 'text/javascript';
    } else if (where.endsWith('json')) {
        theMIME = 'application/json';
    }
    return new Response(r.body, {
        headers: {
            'Content-Type': theMIME + '; charset=utf-8',
            'Cache-Control': 'max-age=9999990'
        }
    });
}

async function subscribeORCheck(token, topic, days) {
    days = parseInt(days) ? days : 1;
    topic = parseInt(topic);

    let data = JSON.parse(await getFromStorage());
    data = data ? data : [];

    let body = { subscribed: 'old' };
    body.found = data.find(o => o.token == token);

    if (!body.found && topic && topic > 100000 && topic < 999999) {

        let subscriber = { token, topic, days, ts: (new Date()) };
        data.push(subscriber);
        await saveToStorage(JSON.stringify(data));
        body.subscribed = 'new';
        body.found = subscriber;

        let options = NotifyOptions;
        options.body = JSON.stringify(buildNotifyBody([token]));
        await fetch(options.url, options);
    } else if (!body.found) {
        body.subscribed = false;
    }
    return new Response(JSON.stringify(body), {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
        }
    });
}

async function unSub(token) {
    let data = JSON.parse(await getFromStorage());
    data = data ? data : [];

    let body = { subscribed: "404" };
    body.foundIndex = data.findIndex(o => o.token == token);

    if (body.found != -1) {
        body.subscribed = false;
        data.splice(body.foundIndex, 1);
        await sayGoodBye([{ token }]);
        await saveToStorage(JSON.stringify(data));
    }
    return new Response(JSON.stringify(body), {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
        }
    });
}

async function checkSubed(token) {
    let data = JSON.parse(await getFromStorage());
    data = data ? data : [];

    let body = { subscribed: 'old' };
    body.found = data.find(o => o.token == token);

    if (!body.found) {
        body.subscribed = false;
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
    console.error('Uncaught error:', error);

    const { stack } = error;
    return new Response(stack || error, {
        status: 500,
        headers: {
            'Content-Type': 'text/plain;charset=UTF-8'
        }
    });
}

function buildNotifyBody(
    tokens_array = [],
    title = `Hey There \u{1f44b}`,
    body = "You will receive a similar notification when any\nCOWIN or COVISHIELD Sessions become available at you Registered Pin Code",
    tag = 'newSlotNotify',
    renotify = true,
    add_booking = true,
    priority = 0,
    badge = "new-badge-min.png"
) {
    // console.log(tokens_array)
    let theBody = {
        data: {
            notification: {
                title,
                body,
                icon: `${githubBaseURL}/${badge}`,
                badge: `${githubBaseURL}/${badge}`,
                vibrate: [200, 100, 200],
                renotify,
                tag,
                priority,
                actions: [{
                    action: "dismiss-only",
                    title: "Okay"
                }, {
                    action: "dismiss-unregister",
                    title: "Unregister"
                }]
            },
        },
        registration_ids: tokens_array
    };
    if (add_booking) {
        theBody.data.notification.actions.push({ action: "visit", title: "Book Slot" });
    }
    theBody.data.notification.actions = theBody.data.notification.actions.reverse();

    return theBody;
}

async function sendNotifications() {

    let subscribers = JSON.parse(await getFromStorage());

    let pinCodes = {};
    subscribers.forEach(o => {
        (o.topic in pinCodes) ? (pinCodes[o.topic].push(o.token)) : (pinCodes[o.topic] = [o.token]);
    });

    let notifyResponses = [];

    for (const [pinCode, tokens] of Object.entries(pinCodes)) {
        console.log(pinCode, tokens);

        let dateObj = new Date((new Date()).toLocaleDateString("en-US", { timeZone: "Asia/Kolkata" }));
        let todaysDate = dateObj.toJSON().slice(0, 10).split('-').reverse().join('-');
        let apiURL = `http://ec2-13-235-95-228.ap-south-1.compute.amazonaws.com/proxy.php?u=https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByPin?pincode=${pinCode}&date=${todaysDate}`;

        let totalSlotsCount = 0;
        let msgBody = `Hurry Up; Book Fast\n\n`;

        let response = await (await fetch(apiURL)).text();
        // console.log(apiURL, response)
        if (response.startsWith('{')) {
            response = JSON.parse(response);

            response.centers.forEach((center) => {
                let centerSessionsCount = 0;
                let ageWise = {};
                let dose2_count = 0;
                center.sessions.forEach(session => {
                    let count = parseInt(session.available_capacity);
                    if (count) {
                        totalSlotsCount += count;
                        centerSessionsCount += count;
                    }
                    if (session.min_age_limit in ageWise) {
                        ageWise[session.min_age_limit] += count;
                    } else {
                        ageWise[session.min_age_limit] = count;
                    }
                    if (session.available_capacity_dose2) {
                        dose2_count += session.available_capacity_dose2;
                    }
                });
                if (dose2_count) {
                    Object.keys(ageWise).forEach(age => {
                        let dose0 = ageWise[age] - dose2_count;
                        ageWise[age] = '';
                        if (dose0) {
                            ageWise[age] = `${dose0}-D1 `;
                        }
                        ageWise[age] += `${dose2_count}-D2`;
                    });
                }
                if (centerSessionsCount >= 0) {
                    let midStr = '';
                    for (const [age, count] of Object.entries(ageWise)) {
                        midStr += `${count} (${age}Y) `;
                    }
                    msgBody += `${midStr.length ? midStr : (centerSessionsCount + ' ')}\u{2022} ${center.address}\n`;
                }
            });
        }
        let dateNow = new Date();
        let currMin = dateNow.getMinutes();
        if (currMin == 0) {
            await filterSubscribers(subscribers, true);
        }
        // console.log(msgBody);
        if (
            msgBody.length > 25 &&
            (
                totalSlotsCount > 0 ||
                (
                    (
                        currMin == 49 ||
                        currMin == 6 ||
                        currMin == 35 ||
                        currMin == 20
                    ) &&
                    response.length == undefined
                )
            )
        ) {
            let options = NotifyOptions;
            let title = `${totalSlotsCount} Slots Opened at ${pinCode} \u{1f44b}`;
            msgBody += `\nTake Care`;
            if (!totalSlotsCount) {
                title = `Summary of slots available at ${pinCode} \u{1f614}`;
                msgBody = msgBody.substr(21);
                msgBody += ' \u{1f614}';
                options.body = JSON.stringify(buildNotifyBody(tokens, title, msgBody, `dismiss-info-message`, false, false, 2, "old-badge-min.png"));
            } else {
                msgBody += ' \u{1f60a}';
                let notify_tag = `wow${msgBody.polynomialRollingHash()}`;
                msgBody = msgBody.replace('\n', `\nat ${(dateNow.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }).substr(-11))}\n`);
                options.body = JSON.stringify(buildNotifyBody(tokens, title, msgBody, notify_tag, false));
            }
            // console.log(JSON.stringify(options))
            notifyResponses.push(await fetch(options.url, options));
        } else {
            notifyResponses.push(`${apiURL} : ${response.length} : ${response.centers?.length}`);
        }
    }

    return new Response(JSON.stringify(notifyResponses), {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
        }
    });
}
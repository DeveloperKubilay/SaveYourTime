chrome.runtime.onInstalled.addListener(async function (details) {
    if (details.reason === 'install') {
        chrome.storage.local.clear();

        var lang = "en";
        try {
            lang = navigator.language.substring(0, 2).toLowerCase()
            await fetch(chrome.runtime.getURL('languages/' + lang + ".json"));
        } catch { lang = "en" }

        chrome.storage.local.set({
            Urls: [],
            lang: lang,
            lastResetTime: Date.now(),
            warnedUrls: {}
        }, function () {
            chrome.tabs.create({
                url: chrome.runtime.getURL('html/thanks.html')
            });
        });
    }
    
    try {
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
            if (tab.url && !tab.url.startsWith("chrome://") && !tab.url.startsWith("edge://") && !tab.url.startsWith("opera://") && !tab.url.startsWith("about:") && !tab.url.startsWith("chrome-extension://")) {
                try {
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ["script.js"]
                    });
                } catch(e) {}
            }
        }
    } catch(e) {}

    await chrome.storage.local.set({ Tabignores: [] });
});

chrome.runtime.onStartup.addListener(async () =>
    await chrome.storage.local.set({ Tabignores: [] })
);

chrome.alarms.create("myTimer", { periodInMinutes: 1 / 30 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "myTimer") {
        await run();
    }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        if (tab.active) await run();
    }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    await run();
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        await run(true);
    } else {
        await run();
    }
});



async function run(stopTracking = false) {
    var data = await chrome.storage.local.get([
        'Urls', 'lang', 'Tabignores', 'lastResetTime',
        'globalActiveUrl', 'globalActiveDomain', 'globalLastActiveTime',
        'warnedUrls', 'DailyUsage'
    ]);

    var Urls = data.Urls || [];
    var langCode = data.lang || "en";
    var Tabignores = data.Tabignores || [];
    var lastResetTime = data.lastResetTime || 0;
    var globalActiveUrl = data.globalActiveUrl || null;
    var globalActiveDomain = data.globalActiveDomain || null;
    var globalLastActiveTime = data.globalLastActiveTime || Date.now();
    var warnedUrls = data.warnedUrls || {};
    var DailyUsage = data.DailyUsage || {};

    // Günlük reset
    if (Date.now() - lastResetTime > 24 * 60 * 60 * 1000) {
        var temp = {}
        Urls = Urls.map(url => {
            temp[url.url] = 0;
            url.limited = false;
            return url;
        });
        await chrome.storage.local.set({
            ...temp,
            Urls: Urls,
            lastResetTime: Date.now(),
            warnedUrls: {},  // Uyarıları da sıfırla
            DailyUsage: {}   // Tüm istatistikleri sıfırla
        });
        warnedUrls = {};
        DailyUsage = {};
    }

    let elapsed = Date.now() - globalLastActiveTime;
    if (elapsed > 300000) elapsed = 30000;
    if (elapsed < 0) elapsed = 0;

    if (globalActiveUrl && elapsed > 0) {
        const urlItem = Urls.find(u => u.url === globalActiveUrl);
        if (urlItem && !urlItem.limited) {
            const usageData = await chrome.storage.local.get(urlItem.url);
            let usage = usageData[urlItem.url] || 0;
            if (usage < urlItem.limit) {
                let newUsage = usage + elapsed;
                if (newUsage > urlItem.limit) newUsage = urlItem.limit;

                await chrome.storage.local.set({
                    [urlItem.url]: newUsage,
                    [`_lastTrack_${urlItem.url}`]: Date.now()
                });
            }
        }
    }
    
    if (globalActiveDomain && elapsed > 0) {
        DailyUsage[globalActiveDomain] = (DailyUsage[globalActiveDomain] || 0) + elapsed;
        await chrome.storage.local.set({ DailyUsage });
    }

    globalLastActiveTime = Date.now();

    if (stopTracking) {
        await chrome.storage.local.set({
            globalActiveUrl: null,
            globalActiveDomain: null,
            globalLastActiveTime: globalLastActiveTime
        });
        return;
    }

    const allWindows = await chrome.windows.getAll({ populate: true, windowTypes: ['normal'] });
    const normalWindow = allWindows.find(w => w.focused) || allWindows.find(w => w.state !== 'minimized') || allWindows[0];
    const tab = normalWindow?.tabs?.find(t => t.active);

    if (!tab || !tab.url) {
        await chrome.storage.local.set({
            globalActiveUrl: null,
            globalActiveDomain: null,
            globalLastActiveTime: globalLastActiveTime
        });
        return;
    }


    const langResponse = await fetch(chrome.runtime.getURL('languages/' + langCode + ".json"));
    lang = await langResponse.json();

    const tabHost = tab.url.replace("https://", "").replace("http://", "").toLowerCase();
    const tabHostNoWww = tabHost.replace(/^www\./, '');
    const tabDomainOnly = tabHost.split('/')[0].replace(/^www\./, ''); // Exact domain
    
    globalActiveDomain = tabDomainOnly;

    const urlItem = Urls.filter(pattern => {
        const p = pattern.url.toLowerCase();
        const pNoWww = p.replace(/^www\./, '');
        return tabHost.startsWith(p) || tabHostNoWww.startsWith(pNoWww);
    }).sort((a, b) => b.url.length - a.url.length)[0] || {};

    if (urlItem.url) {
        const isTabIgnored = Tabignores.some(ignoredTab => ignoredTab.id === tab.id && ignoredTab.url === urlItem.url);
        if (isTabIgnored) {
            await chrome.storage.local.set({
                globalActiveUrl: null,
                globalLastActiveTime: globalLastActiveTime
            });
            return;
        }

        globalActiveUrl = urlItem.url;

        const usageData = await chrome.storage.local.get(urlItem.url);
        const usage = usageData[urlItem.url] || 0;

        const remainingTimeObj = urlItem.limit - usage;
        const remainingMinutes = Math.floor(remainingTimeObj / 60000);

        // === DÜZELTME: Uyarı sistemi ===
        if (!urlItem.limited && remainingTimeObj > 0) {
            const warnKey5 = `${urlItem.url}_warn5`;
            const warnKey1 = `${urlItem.url}_warn1`;

            if (remainingMinutes <= 5 && remainingMinutes > 1 && !warnedUrls[warnKey5]) {
                warnedUrls[warnKey5] = true;
                await chrome.storage.local.set({ warnedUrls });
                await sendMessageWithRetry(tab.id, {
                    target: "throwWarn",
                    lang: lang,
                    minutes: 5,
                });
            } else if (remainingMinutes <= 1 && remainingMinutes > 0 && !warnedUrls[warnKey1]) {
                warnedUrls[warnKey1] = true;
                await chrome.storage.local.set({ warnedUrls });
                await sendMessageWithRetry(tab.id, {
                    target: "throwWarn",
                    lang: lang,
                    minutes: 1,
                });
            }
        }
        // === DÜZELTME SONU ===

        if (remainingTimeObj <= 0) {
            await sendMessageWithRetry(tab.id, {
                target: "addIframe",
                lang: lang,
                currentpattern: urlItem.url,
                usage: DailyUsage[urlItem.url] || usage, // GERÇEK GÜNLÜK KULLANIM
                tabId: tab.id,
                limited: true
            });

            if (!urlItem.limited) {
                Urls = Urls.map(url => {
                    if (url.url === urlItem.url) url.limited = true;
                    return url;
                });
                await chrome.storage.local.set({ Urls: Urls });
            }
        } else {
            await sendMessageWithRetry(tab.id, {
                target: "scheduleIframe",
                lang: lang,
                currentpattern: urlItem.url,
                usage: DailyUsage[globalActiveDomain] || usage,
                tabId: tab.id,
                remainingMs: remainingTimeObj
            });
        }

        await chrome.storage.local.set({
            globalActiveUrl: globalActiveUrl,
            globalActiveDomain: globalActiveDomain,
            globalLastActiveTime: globalLastActiveTime
        });

    } else {
        await chrome.storage.local.set({
            globalActiveUrl: null,
            globalActiveDomain: globalActiveDomain,
            globalLastActiveTime: globalLastActiveTime
        });
    }
}

async function sendMessageWithRetry(tabId, message, maxRetries = 3, delay = 500) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await chrome.tabs.sendMessage(tabId, message);
            return true;
        } catch (e) {
            if (i === maxRetries - 1) {
                console.log("Content script not ready after retries");
                return false;
            }
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    return false;
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.target == "addTime") {
        chrome.storage.local.get([message.currentpattern, 'Urls', 'warnedUrls'])
            .then(result => {
                const currentUsage = result[message.currentpattern] || 0;
                const newUsage = Math.max(0, currentUsage - (message.minutes * 60 * 1000));

                const Urls = result.Urls || [];
                const updatedUrls = Urls.map(url => {
                    if (url.url === message.currentpattern) url.limited = false;
                    return url;
                });

                const warnedUrls = result.warnedUrls || {};
                delete warnedUrls[`${message.currentpattern}_warn5`];
                delete warnedUrls[`${message.currentpattern}_warn1`];

                // Clear ignores for this tab to re-enable limits on this site after adding time
                chrome.storage.local.get(['Tabignores']).then(({ Tabignores = [] }) => {
                    const filtered = Tabignores.filter(t => t.url !== message.currentpattern);
                    chrome.storage.local.set({ Tabignores: filtered });
                });

                return chrome.storage.local.set({
                    [message.currentpattern]: newUsage,
                    Urls: updatedUrls,
                    warnedUrls: warnedUrls,
                    [`_lastTrack_${message.currentpattern}`]: Date.now()
                });
            })
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
    else if (message.target == "resetAllData") {
        chrome.storage.local.clear()
            .then(() => {
                return chrome.storage.local.set({
                    lang: "en",
                    Urls: [],
                    Tabignores: [],
                    lastResetTime: Date.now(),
                    warnedUrls: {}
                });
            })
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
    else if (message.target == "Iframe_Continue") {
        chrome.storage.local.get(['Tabignores'])
            .then(({ Tabignores = [] }) => {
                const updatedTabignores = Tabignores.filter(tab => !(tab.id === message.tabId && tab.url === message.url));
                updatedTabignores.push({ id: message.tabId, url: message.url });
                return chrome.storage.local.set({ Tabignores: updatedTabignores });
            })
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    } else if (message.target == "deleteSite") {
        chrome.storage.local.get(['Urls', 'warnedUrls'])
            .then(({ Urls, warnedUrls = {} }) => {
                const updatedUrls = Urls.filter(url => url.url !== message.url);
                // Silinen sitenin uyarılarını da temizle
                delete warnedUrls[`${message.url}_warn5`];
                delete warnedUrls[`${message.url}_warn1`];

                // Remove from Tabignores
                chrome.storage.local.get(['Tabignores']).then(({ Tabignores = [] }) => {
                    const filtered = Tabignores.filter(t => t.url !== message.url);
                    chrome.storage.local.set({ Tabignores: filtered });
                });
                return chrome.storage.local.set({
                    Urls: updatedUrls,
                    [message.url]: 0,
                    warnedUrls
                });
            })
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    } else if (message.target == "addSite") {
        chrome.storage.local.get(['Urls', message.url, 'warnedUrls'])
            .then((data) => {
                const Urls = data.Urls || [];
                const warnedUrls = data.warnedUrls || {};
                const updatedUrls = Urls.filter(url =>
                    message.oldurl ?
                        url.url !== message.oldurl && url.url !== message.url
                        : url.url !== message.url
                );
                updatedUrls.push({ url: message.url, limit: message.limit, limited: false });
                const currentUsage = data[message.url] || 0;

                // Site güncellenince uyarıları sıfırla
                delete warnedUrls[`${message.url}_warn5`];
                delete warnedUrls[`${message.url}_warn1`];
                if (message.oldurl) {
                    delete warnedUrls[`${message.oldurl}_warn5`];
                    delete warnedUrls[`${message.oldurl}_warn1`];
                }

                // Testing için eklendiğinde Tabignores'tan temizle
                chrome.storage.local.get(['Tabignores']).then(({ Tabignores = [] }) => {
                    const filtered = Tabignores.filter(t => t.url !== message.url && t.url !== message.oldurl);
                    chrome.storage.local.set({ Tabignores: filtered });
                });

                return chrome.storage.local.set({
                    Urls: updatedUrls,
                    [message.url]: currentUsage,
                    warnedUrls,
                    [`_lastTrack_${message.url}`]: Date.now()
                });
            })
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    } else {
        sendResponse({ success: false });
        return true;
    }
});
chrome.runtime.onInstalled.addListener(async function (details) {
    if (details.reason === 'install') {
        chrome.storage.local.clear();
        /*
                    Urls: [
                {
                    url: "ifconfig.me",
                    limit: 10000,
                    limited: false
                },
                {
                    url: "duckduckgo.com",
                    limit: 10000,
                    limited: false
                },
                {
                    url: "www.youtube.com",
                    limit: 10000,
                    limited: false
                }
            ],
            "ifconfig.me": 0,
            "duckduckgo.com": 0,
            "www.youtube.com": 0,
            "lastResetTime": Date.now(),
        
        */

        var lang = "en";
        try{
           lang = navigator.language.substring(0, 2).toLowerCase()
           await fetch(chrome.runtime.getURL('languages/' + lang + ".json"));
        }catch{ lang = "en" }

        chrome.storage.local.set({
            Urls: [],
            lang: lang,
            lastResetTime: Date.now(),
        }, function () {
            chrome.tabs.create({
                url: chrome.runtime.getURL('html/thanks.html')
            });
        });
    }
    await chrome.storage.local.set({ Tabignores: [] });
});
chrome.runtime.onStartup.addListener(async () =>
    await chrome.storage.local.set({ Tabignores: [] })
);

chrome.alarms.create("myTimer", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "myTimer") {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab) {
            await run(activeTab.id, true);
        }
    }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        await run(tab.id);
    }
});

async function run(tabId, itsint) {
    var {
        Urls = [],
        lang: langCode = "en",
        Tabignores = [],
        lastResetTime = 0
    } = await chrome.storage.local.get(['Urls', 'lang', 'Tabignores', 'lastResetTime']);

    if (Date.now() - lastResetTime > 24 * 60 * 60 * 1000) {
        var temp = {}
        Urls = Urls.map(url => {
            if (url.limited) {
                temp[url.url] = 0;
                url.limited = false;
            }
            return url;
        });
        await chrome.storage.local.set({ ...temp, Urls: Urls, lastResetTime: Date.now() });
    }

    const isTabIgnored = Tabignores.some(tab => tab.id === tabId);
    if (isTabIgnored) return;

    const langResponse = await fetch(chrome.runtime.getURL('languages/' + langCode + ".json"));
    lang = await langResponse.json();

    const tab = await chrome.tabs.get(tabId);
    const urlItem = Urls.filter(pattern =>
        tab.url.replace("https://", "").replace("http://", "").toLowerCase().startsWith(pattern.url)
    ).sort((a, b) => b.url.length - a.url.length)[0] || {}

    if (urlItem.url) {
        try {
            const usage = (await chrome.storage.local.get(urlItem.url))[urlItem.url] || 0;
            if (usage >= urlItem.limit) {
                chrome.tabs.sendMessage(tab.id, {
                    target: "addIframe",
                    lang: lang,
                    currentpattern: urlItem.url,
                    usage: usage,
                    tabId: tabId,
                    limited: true
                }, function (response) { });
                if (itsint) {
                    if(urlItem.limited) return;
                    Urls = Urls.map(url => {
                        if (url.url === urlItem.url) url.limited = true;
                        return url;
                    });
                    await chrome.storage.local.set({ Urls: Urls });
                }

            } else if (itsint) await chrome.storage.local.set({
                [urlItem.url]: usage + 60000
            });

        } catch (error) {

            console.error("Error in run function:", error);
        }
    }


}





chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.target == "addTime") {
        chrome.storage.local.get(message.currentpattern)
            .then(result => {
                const currentUsage = result[message.currentpattern] || 0;
                const newUsage = currentUsage - (message.minutes * 60 * 1000);
                return chrome.storage.local.set({ [message.currentpattern]: newUsage });
            })
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
    else if (message.target == "resetAllData") {
        chrome.storage.local.clear()
            .then(() => {
                return chrome.storage.local.set({ lang: "en", Urls: [], Tabignores: [], lastResetTime: Date.now() });
            })
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
    else if (message.target == "Iframe_Continue") {
        chrome.storage.local.get(['Tabignores'])
            .then(({ Tabignores = [] }) => {
                const updatedTabignores = Tabignores.filter(tab => tab.id !== message.tabId);
                updatedTabignores.push({ id: message.tabId });
                return chrome.storage.local.set({ Tabignores: updatedTabignores });
            })
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    } else if (message.target == "deleteSite") {
        chrome.storage.local.get('Urls')
            .then(({ Urls }) => {
                const updatedUrls = Urls.filter(url => url.url !== message.url);
                return chrome.storage.local.set({ Urls: updatedUrls, [message.url]: 0 });
            })
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    } else if (message.target == "addSite") {
        chrome.storage.local.get('Urls')
            .then(({ Urls }) => {
                const updatedUrls = Urls.filter(url =>
                    message.oldurl ?
                        url.url !== message.oldurl && url.url !== message.url
                        : url.url !== message.url
                );
                updatedUrls.push({ url: message.url, limit: message.limit, limited: false });
                return chrome.storage.local.set({ Urls: updatedUrls, [message.url]: 1800000 });
            })
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    } else {
        sendResponse({ success: false });
        return true;
    }
});


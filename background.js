const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEYS = ['Urls', 'lang', 'Tabignores', 'lastResetTime', 'warnedUrls', 'DailyUsage'];

chrome.runtime.onInstalled.addListener(async function (details) {
    if (details.reason === 'install') {
        await chrome.storage.local.clear();

        let lang = 'en';
        try {
            lang = navigator.language.substring(0, 2).toLowerCase();
            await fetch(chrome.runtime.getURL(`languages/${lang}.json`));
        } catch {
            lang = 'en';
        }

        await chrome.storage.local.set({
            Urls: [],
            lang: lang,
            lastResetTime: Date.now(),
            warnedUrls: {},
            DailyUsage: {}
        });

        chrome.tabs.create({
            url: chrome.runtime.getURL('html/thanks.html')
        });
    }

    await chrome.storage.local.set({ Tabignores: [] });
});

chrome.runtime.onStartup.addListener(async function () {
    await chrome.storage.local.set({ Tabignores: [] });
});

chrome.alarms.create('myTimer', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(async function (alarm) {
    if (alarm.name !== 'myTimer') {
        return;
    }

    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab) {
        await run(activeTab, true);
    }
});

chrome.tabs.onUpdated.addListener(async function (_tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url) {
        await run(tab, false);
    }
});

chrome.tabs.onActivated.addListener(async function (activeInfo) {
    try {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        if (tab?.url) {
            await run(tab, false);
        }
    } catch { }
});

async function run(tab, shouldTrack) {
    if (!tab || !tab.url || !isTrackableUrl(tab.url)) {
        return;
    }

    let {
        Urls = [],
        lang: langCode = 'en',
        Tabignores = [],
        lastResetTime = 0,
        warnedUrls = {},
        DailyUsage = {}
    } = await chrome.storage.local.get(STORAGE_KEYS);

    if (Date.now() - lastResetTime > DAY_MS) {
        const resetValues = {};

        Urls = Urls.map((item) => {
            resetValues[item.url] = 0;
            return { ...item, limited: false };
        });

        await chrome.storage.local.set({
            ...resetValues,
            Urls: Urls,
            lastResetTime: Date.now(),
            warnedUrls: {},
            DailyUsage: {}
        });

        warnedUrls = {};
        DailyUsage = {};
    }

    const activeDomain = getDomainFromUrl(tab.url);
    if (shouldTrack && activeDomain) {
        DailyUsage[activeDomain] = (DailyUsage[activeDomain] || 0) + MINUTE_MS;
        await chrome.storage.local.set({ DailyUsage: DailyUsage });
    }

    const urlItem = getMatchedLimit(tab.url, Urls);
    if (!urlItem) {
        return;
    }

    const isTabIgnored = Tabignores.some((ignoredTab) =>
        ignoredTab.id === tab.id && ignoredTab.url === urlItem.url
    );
    if (isTabIgnored) {
        return;
    }

    const lang = await getLanguage(langCode);
    let usage = (await chrome.storage.local.get(urlItem.url))[urlItem.url] || 0;

    if (shouldTrack && !urlItem.limited && usage < urlItem.limit) {
        const nextUsage = usage + MINUTE_MS;
        const remainingMinutes = Math.floor((urlItem.limit - nextUsage) / MINUTE_MS);

        if (remainingMinutes === 5 || remainingMinutes === 1) {
            const warnKey = `${urlItem.url}_${remainingMinutes}`;
            if (!warnedUrls[warnKey]) {
                warnedUrls[warnKey] = true;
                await chrome.storage.local.set({ warnedUrls: warnedUrls });
                sendTabMessage(tab.id, {
                    target: 'throwWarn',
                    lang: lang,
                    minutes: remainingMinutes
                });
            }
        }

        usage = Math.min(nextUsage, urlItem.limit);
        await chrome.storage.local.set({
            [urlItem.url]: usage,
            [`_lastTrack_${urlItem.url}`]: Date.now()
        });
    }

    if (usage >= urlItem.limit) {
        sendTabMessage(tab.id, {
            target: 'addIframe',
            lang: lang,
            currentpattern: urlItem.url,
            usage: usage,
            tabId: tab.id,
            limited: true
        });

        if (!urlItem.limited) {
            await chrome.storage.local.set({
                Urls: Urls.map((item) =>
                    item.url === urlItem.url ? { ...item, limited: true } : item
                )
            });
        }
    }
}

function normalizeUrlPattern(url = '') {
    return url
        .replace(/^https?:\/\//i, '')
        .toLowerCase()
        .replace(/^www\./, '');
}

function getMatchedLimit(tabUrl, urls) {
    const cleanUrl = normalizeUrlPattern(tabUrl);

    return urls
        .filter((item) => {
            const itemUrl = normalizeUrlPattern(item.url);
            return cleanUrl === itemUrl || 
                   cleanUrl.startsWith(itemUrl + '/') || 
                   cleanUrl.endsWith('.' + itemUrl) || 
                   cleanUrl.includes('.' + itemUrl + '/');
        })
        .sort((a, b) => normalizeUrlPattern(b.url).length - normalizeUrlPattern(a.url).length)[0] || null;
}

function isTrackableUrl(url) {
    return ![
        'chrome://',
        'chrome-extension://',
        'edge://',
        'opera://',
        'about:',
        'moz-extension://'
    ].some((prefix) => url.startsWith(prefix));
}

function getDomainFromUrl(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    } catch {
        return null;
    }
}

async function getLanguage(langCode) {
    try {
        const response = await fetch(chrome.runtime.getURL(`languages/${langCode}.json`));
        return await response.json();
    } catch {
        const response = await fetch(chrome.runtime.getURL('languages/en.json'));
        return await response.json();
    }
}

function sendTabMessage(tabId, message) {
    chrome.tabs.sendMessage(tabId, message).catch(() => { });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message)
        .then(() => sendResponse({ success: true }))
        .catch((error) => sendResponse({ success: false, error: error.message }));

    return true;
});

async function handleMessage(message) {
    if (message.target === 'addTime') {
        await handleAddTime(message);
        return;
    }

    if (message.target === 'resetAllData') {
        await chrome.storage.local.clear();
        await chrome.storage.local.set({
            lang: 'en',
            Urls: [],
            Tabignores: [],
            lastResetTime: Date.now(),
            warnedUrls: {},
            DailyUsage: {}
        });
        return;
    }

    if (message.target === 'Iframe_Continue') {
        const { Tabignores = [] } = await chrome.storage.local.get(['Tabignores']);
        const updatedTabignores = Tabignores.filter((tab) =>
            !(tab.id === message.tabId && tab.url === message.url)
        );

        updatedTabignores.push({ id: message.tabId, url: message.url });
        await chrome.storage.local.set({ Tabignores: updatedTabignores });
        return;
    }

    if (message.target === 'deleteSite') {
        const { Urls = [], warnedUrls = {}, Tabignores = [] } =
            await chrome.storage.local.get(['Urls', 'warnedUrls', 'Tabignores']);

        delete warnedUrls[`${message.url}_5`];
        delete warnedUrls[`${message.url}_1`];

        await chrome.storage.local.set({
            Urls: Urls.filter((item) => item.url !== message.url),
            warnedUrls: warnedUrls,
            Tabignores: Tabignores.filter((tab) => tab.url !== message.url)
        });

        await chrome.storage.local.remove([
            message.url, 
            `_lastTrack_${message.url}`
        ]);
        return;
    }

    if (message.target === 'addSite') {
        await handleAddSite(message);
        return;
    }

    throw new Error('Unknown message target');
}

async function handleAddTime(message) {
    const { Urls = [], warnedUrls = {}, Tabignores = [], ...usageData } =
        await chrome.storage.local.get([message.currentpattern, 'Urls', 'warnedUrls', 'Tabignores']);

    delete warnedUrls[`${message.currentpattern}_5`];
    delete warnedUrls[`${message.currentpattern}_1`];

    const addedMs = message.minutes * MINUTE_MS;
    const currentUsage = usageData[message.currentpattern] || 0;
    const updatedUsage = Math.max(0, currentUsage - addedMs);
    const urlItem = Urls.find(item => item.url === message.currentpattern);
    const stillLimited = urlItem ? updatedUsage >= urlItem.limit : false;

    await chrome.storage.local.set({
        [message.currentpattern]: updatedUsage,
        Urls: Urls.map((item) =>
            item.url === message.currentpattern ? { ...item, limited: stillLimited } : item
        ),
        warnedUrls: warnedUrls,
        Tabignores: stillLimited
            ? Tabignores
            : Tabignores.filter((tab) => tab.url !== message.currentpattern),
        [`_lastTrack_${message.currentpattern}`]: Date.now()
    });
}

async function handleAddSite(message) {
    const keys = ['Urls', 'warnedUrls', 'Tabignores', message.url];
    if (message.oldurl) {
        keys.push(message.oldurl);
    }

    const data = await chrome.storage.local.get(keys);
    const Urls = data.Urls || [];
    const warnedUrls = data.warnedUrls || {};
    const Tabignores = data.Tabignores || [];

    delete warnedUrls[`${message.url}_5`];
    delete warnedUrls[`${message.url}_1`];

    if (message.oldurl) {
        delete warnedUrls[`${message.oldurl}_5`];
        delete warnedUrls[`${message.oldurl}_1`];
    }

    const updatedUrls = Urls.filter((item) =>
        message.oldurl
            ? item.url !== message.oldurl && item.url !== message.url
            : item.url !== message.url
    );

    updatedUrls.push({ url: message.url, limit: message.limit, limited: false });

    await chrome.storage.local.set({
        Urls: updatedUrls,
        [message.url]: data[message.url] ?? data[message.oldurl] ?? 0,
        warnedUrls: warnedUrls,
        Tabignores: Tabignores.filter((tab) =>
            tab.url !== message.url && tab.url !== message.oldurl
        ),
        [`_lastTrack_${message.url}`]: Date.now()
    });
}

chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === 'install') {
        chrome.storage.local.clear();

        chrome.storage.local.set({ Urls: [
            {
                url: "https://ifconfig.me",
                limit: 10000,
                limited: false
            },
            {
                url: "https://duckduckgo.com",
                limit: 10000,
                limited: false
            },
            {
                url: "https://www.youtube.com",
                limit: 10000,
                limited: false
            }
        ],
        "https://ifconfig.me":0,
        "https://duckduckgo.com":0,
        "https://www.youtube.com":0,

        }, function() {
            chrome.tabs.create({
                url: chrome.runtime.getURL('html/thanks.html')
            });
        });
    }
});
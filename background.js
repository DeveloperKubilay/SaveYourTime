chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === 'install') {
        chrome.storage.local.clear();

        // Set initial storage data
        chrome.storage.local.set({ Urls: [
            {
                url: "https://ifconfig.me",
                limit: 10000,
                limited: false
            },
            {
                url: "https://duckduckgo.com",
                limit: 3600000,
                limited: false
            }
        ],
        "https://ifconfig.me":0,
        "https://duckduckgo.com":3600000/2

        }, function() {
            // Open thanks.html in a new tab after installation
            chrome.tabs.create({
                url: chrome.runtime.getURL('html/thanks.html')
            });
        });
    }
});
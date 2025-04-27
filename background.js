chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === 'install') {
        // Set initial storage data
        chrome.storage.local.set({ Urls: [
            {
                url: "https://ifconfig.me",
                limit: 1000000,
                limited: false
            }
        ],
        "https://ifconfig.me":0

        }, function() {
            // Open thanks.html in a new tab after installation
            chrome.tabs.create({
                url: chrome.runtime.getURL('html/thanks.html')
            });
        });
    }
});
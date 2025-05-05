// Use global functions instead of imports
// const { checkUsage, basicRegex, formatTime, useTemplate } = window;

var patterns;
var Localwebsites = ["html/warn.html"]

async function setup() {
    try {
        var { Urls = [],lang = "en" } = await chrome.storage.local.get(['Urls', 'lang']);
        Localwebsites = await Promise.all(
            Localwebsites.map(async (localwebsite) => {
                const res = await fetch(chrome.runtime.getURL(localwebsite));
                const html = await res.text();
                return { url: localwebsite, html: html };
            })
        );
        lang = await fetch(chrome.runtime.getURL('languages/' + lang +".json"));
        lang = await lang.json();

        const currentUrl = window.location.href;
        patterns = Urls || [];
        const currentpattern = patterns.find(pattern => currentUrl.startsWith(pattern.url)) || {};
       // console.log(currentpattern, patterns, currentUrl);

        if (!currentpattern.url) return;
        var usage = await window.checkUsage(currentpattern);

        if (currentpattern.limited) {
            console.log("Limited URL: ", currentpattern.url);
            return window.useTemplate("warn", lang, Localwebsites, currentpattern, usage);
        }

        //console.log("Usage: ", usage, "Current Pattern: ", currentpattern);
        window.startTimer(currentpattern, usage, lang, Localwebsites);
    } catch (error) {
        console.error("Setup error:", error);
    }
}

// Add message listener to handle time additions and site unlocking
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === "timeAdded" && message.unlockSite) {
        // If we added time to this site, and it's currently limited
        const currentUrl = window.location.href;
        
        // Check if this message is for the current URL
        if (currentUrl.includes(message.url)) {
            try {
                // Get current data
                var { Urls = [], lang = "en" } = await chrome.storage.local.get(['Urls', 'lang']);
                const langData = await fetch(chrome.runtime.getURL('languages/' + lang + ".json"));
                const langObj = await langData.json();
                
                // Find current pattern
                const currentPattern = Urls.find(pattern => currentUrl.startsWith(pattern.url));
                if (currentPattern) {
                    // If we have original content saved, restore it
                    if (window.websitedata) {
                        document.body.innerHTML = window.websitedata;
                        window.websitedata = null;
                    }
                    
                    // Get current usage
                    const usage = await window.checkUsage(currentPattern);
                    
                    // Restart timer
                    window.startTimer(currentPattern, usage, langObj, Localwebsites);
                    
                    // Send response
                    sendResponse({ success: true });
                    return true;
                }
            } catch (error) {
                console.error("Error processing time addition message:", error);
            }
        }
    }
    // Always return false for async handlers unless we called sendResponse already
    return false;
});

// Run the setup function
setup().catch(error => console.error("Unhandled setup error:", error));
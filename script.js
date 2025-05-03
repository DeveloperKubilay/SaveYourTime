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

// Run the setup function
setup().catch(error => console.error("Unhandled setup error:", error));
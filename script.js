var patterns;
var lang;

async function setup() {
    try {
        var { Urls = [], lang: langCode = "en" } = await chrome.storage.local.get(['Urls', 'lang']);
        const langResponse = await fetch(chrome.runtime.getURL('languages/' + langCode + ".json"));
        lang = await langResponse.json();
        
        window.lang = lang;

        const currentUrl = window.location.href;
        patterns = Urls || [];
        const currentpattern = patterns.find(pattern => currentUrl.startsWith(pattern.url)) || {};

        if (!currentpattern.url) return;
        var usage = await checkUsage(currentpattern);

        if (currentpattern.limited) {
            console.log("Limited URL: ", currentpattern.url);
            return useTemplate("warn", currentpattern, usage);
        }

        startTimer(currentpattern, usage);
    } catch (error) {
        console.error("Setup error:", error);
    }
}

setup().catch(error => console.error("Unhandled setup error:", error));
var patterns;
var websitedata = "";
var lang = "tr.json"

async function checkUsage(data) {
    try {
        const key = typeof data === 'object' && data.url ? data.url : String(data);
        const result = await chrome.storage.local.get(key);
        return result[key] || 0;
    } catch (error) {
        console.error("Error checking usage:", error);
        return 0;
    }
}
function basicRegex(text, data) {
    function resolve(key) {
        const keys = key.split('.');
        let value = lang;
        for (let k of keys) {
            value = value?.[k];
            if (value === undefined) break;
        }
        if (value !== undefined) return value;
        value = data;
        for (let k of keys) {
            value = value?.[k];
            if (value === undefined) break;
        }
        return value !== undefined ? value : '';
    }

    return text.replace(/\{\{\s*(.*?)\s*\}\}/g, (_, key) => {
        let temp = resolve(key);
        if (typeof temp === 'string') {
            return temp.replace(/\{\{\s*(.*?)\s*\}\}/g, (_, innerKey) => resolve(innerKey));
        }
        return temp;
    });
}


async function setup() {
    try {
        const { Urls = [] } = await chrome.storage.local.get(['Urls']);
        var Localwebsites = ["html/warn.html"]
        Localwebsites = await Promise.all(
            Localwebsites.map(async (localwebsite) => {
                const res = await fetch(chrome.runtime.getURL(localwebsite));
                const html = await res.text();
                return { url: localwebsite, html: html };
            })
        );
        lang = await fetch(chrome.runtime.getURL('languages/' + lang));
        lang = await lang.json();

        const currentUrl = window.location.href;
        patterns = Urls || [];
        const currentpattern = patterns.find(pattern => currentUrl.startsWith(pattern.url)) || {};
        console.log(currentpattern, patterns, currentUrl);

        if (!currentpattern.url) return;
        var usage = await checkUsage(currentpattern);

        if (currentpattern.limited) {
            console.log("Limited URL: ", currentpattern.url);
            document.title = lang.warn.title;
            
            var data = ""+Localwebsites.find(website => website.url === "html/warn.html").html;
            data = basicRegex(data,{
                url: currentpattern.url.replace("https://", "").replace("http://", "").replace(/\/$/, ""),
                totalTime: usage / 1000,
            });
            document.body.innerHTML = data;
            return;
        }


        console.log("Usage: ", usage, "Current Pattern: ", currentpattern);

        const intervalId = setInterval(async () => {
            try {
                usage += 10000; 
                if (usage > currentpattern.limit) {
                    const { Urls = [] } = await chrome.storage.local.get(['Urls']);
                    const updatedUrls = Urls.map(url => {
                        if (url.url === currentpattern.url) {
                            return { ...url, limited: true };
                        }
                        return url;
                    });
                    websitedata = document.body.innerHTML;
                    chrome.storage.local.set({ Urls: updatedUrls });
                    chrome.storage.local.remove([currentpattern.url]);
                    document.body.innerHTML = chrome.runtime.getURL('html/warn.html')
                    setTimeout(() => {
                        document.body.innerHTML = websitedata;
                        chrome.storage.local.set({ [currentpattern.url]: 0 });
                    }, 5 * 1000);
                    clearInterval(intervalId);
                } else {
                    console.log(usage)
                    await chrome.storage.local.set({ [currentpattern.url]: usage });
                }
            } catch (error) {
                console.error("Error in interval:", error);
            }
        }, 10000);

        // Add event listener to clean up interval on page unload:
        window.addEventListener('beforeunload', () => {
            clearInterval(intervalId);
        });
    } catch (error) {
        console.error("Setup error:", error);
    }
}

// Run the setup function
setup().catch(error => console.error("Unhandled setup error:", error));
var patterns;
var websitedata = "";

const checkUrlPatterns = (urlToCheck) => {
    return patterns.find(pattern => urlToCheck.startsWith(pattern.url)) || {};
};

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

async function setup() {
    try {
        const { Urls = [] } = await chrome.storage.local.get(['Urls']);
        const currentUrl = window.location.href; // Added 'const' to define variable
        patterns = Urls || [];      
        const currentpattern = checkUrlPatterns(currentUrl);
        console.log(currentpattern, patterns, currentUrl);
        if (!currentpattern.url) return;
        if (currentpattern.limited) {
            console.log("Limited URL: ", currentpattern.url);
        fetch(chrome.runtime.getURL("html/warn.html"))
.then(res => res.text())
.then(html => {
    document.body.innerHTML = html
        /*.replace(/ext_QuickPaste_form/g, QP_PREFIX + 'form')
        .replace(/ext_QuickPaste_form_texts/g, QP_PREFIX + 'form_texts')
        .replace(/ext_QuickPaste_ctrlv/g, QP_PREFIX + 'ctrlv')
        .replace(/ext_QuickPaste_form_browse/g, QP_PREFIX + 'form_browse')
        .replace(/dragover/g, QP_PREFIX + 'dragover')
        .replace(/ext_QuickPaste_form_drop/g, QP_PREFIX + 'form_drop');*/
});
            
            return;
        }
        
        var usage = await checkUsage(currentpattern);
        console.log("Usage: ", usage, "Current Pattern: ", currentpattern);
        
        const intervalId = setInterval(async () => {
            try {
                usage += 1000000;
                if(usage > currentpattern.limit) {
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
                    document.body.innerHTML = `<iframe src="html/warn.html" style="width:100%; height:100%; border:none;"></iframe>`;
                    setTimeout(() => {
                        document.body.innerHTML = websitedata;
                        chrome.storage.local.set({ [currentpattern.url]: 0 });
                    }, 5 * 1000);
                    clearInterval(intervalId);
                } else {
                    await chrome.storage.local.set({ [currentpattern.url]: usage });
                }
            } catch (error) {
                console.error("Error in interval:", error);
            }
        }, 10000);
    } catch (error) {
        console.error("Setup error:", error);
    }
}

// Run the setup function
setup().catch(error => console.error("Unhandled setup error:", error));
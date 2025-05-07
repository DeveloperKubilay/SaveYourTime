window.getUrlData = async function(url,list) {
    return new Promise((resolve) => {
        chrome.storage.local.get(["Urls"], async function(data) {
            const urls = data.Urls || [];
            const foundUrl = !url ? {} : urls.filter(item => url.startsWith(item.url)).sort((a, b) => b.length - a.length)[0];
            const newUrls = [];
          
            if(list) {
                const temparray = urls.map(item => item.url !== url ? item : null).slice(0, 5);
                const usages = await window.getUsage(temparray.map(item => item.url));
                for (let i = 0; i < temparray.length; i++) {
                    const item = temparray[i];
                    if (item) {
                        newUrls.push({
                            url:item.url,
                            limit:item.limit,
                            limited:item.limited,
                            usage:usages[i] || 0
                        });
                    }
                }
            }

            if (foundUrl && foundUrl.url) {
                resolve({
                    Limit:foundUrl,
                    usage: await window.getUsage(foundUrl.url) || 0,
                    urls:list ? newUrls : urls
                });

            } else resolve({
                urls:list ? newUrls : urls
            });
        });
    });
}

window.getUsage = async function(url) {
    const isarr = Array.isArray(url);
    return new Promise((resolve) => {
        chrome.storage.local.get(isarr ? url : [url], function(data) {
            if (isarr) {

                const usageArr = url.map(u => data[u] || 0);
                resolve(usageArr);
            } else {
                resolve(data[url] || 0);
            }
        });
    });
}

window.getUrl = async function() {
    return new Promise((resolve) => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const tab = tabs[0];
            try {
                resolve({
                    shorturl:(new URL(tab.url)).hostname.replace(/^www\./, ''),
                    fullurl: tab.url
                });
            } catch (e) {
                resolve("?????");
            }
        });
    });
}
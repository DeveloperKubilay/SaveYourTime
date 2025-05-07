chrome.runtime.onInstalled.addListener(async function (details) {
    if (details.reason === 'install') {
        chrome.storage.local.clear();

        chrome.storage.local.set({
            Urls: [
                {
                    url: "ifconfig.me",
                    limit: 10000,
                    limited: false
                },
                {
                    url: "duckduckgo.com",
                    limit: 10000,
                    limited: false
                },
                {
                    url: "www.youtube.com",
                    limit: 10000,
                    limited: false
                }
            ],
            "ifconfig.me": 0,
            "duckduckgo.com": 0,
            "www.youtube.com": 0,

        }, function () {
            chrome.tabs.create({
                url: chrome.runtime.getURL('html/thanks.html')
            });
        });
    } else await run()
});

chrome.alarms.create("myTimer", { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "myTimer") await run();
});





async function run() {
    var { Urls = [], lang: langCode = "en" } = await chrome.storage.local.get(['Urls', 'lang']);
    const langResponse = await fetch(chrome.runtime.getURL('languages/' + langCode + ".json"));
    lang = await langResponse.json();



    //const limitedUrls = Urls.filter(item => item.limited === true);
    let allLimitedTabs = [];
    for (const urlItem of Urls) {
        const usage = (await chrome.storage.local.get(urlItem.url))[urlItem.url] || 0
        const tab = await chrome.tabs.query({ url: "*://" + urlItem.url + "/*" })
        tab.forEach((tab) => {
            const tabs = {
                urlItem: urlItem,
                usage:usage,
                tab:tab,
            }
            allLimitedTabs.push(tabs);
        })
    }

    var newtime = {}


    for (const tab of allLimitedTabs) {
        try {
            if(newtime[tab.urlItem.url]) newtime[tab.urlItem.url] += 30000;
            else newtime[tab.urlItem.url] = 30000; 

            if(tab.urlItem.limited || newtime[tab.urlItem.url] > tab.urlItem.limit){
                if(!tab.urlItem.limited) {
                    tab.urlItem.limited = true;
                    Urls = Urls.map((item) => {
                        if(item.url === tab.urlItem.url) {
                            return {...item, limited: true};
                        }
                        return item;
                    })
                    await chrome.storage.local.set({ Urls });
                }
                chrome.tabs.sendMessage(tab.tab.id, {
                    target: "addIframe",
                    lang: lang,
                    currentpattern: tab.urlItem.url,
                    usage: tab.usage,
                    limited: true 
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.log(`Error sending message to tab ${tab.tab.id}:`, chrome.runtime.lastError);
                    } else {
                        console.log(`Message sent to tab ${tab.tab.id}, response:`, response);
                    }
                });

            }

            console.log(tab)

        } catch (error) {
            console.error("Tab mesaj hatası:", error);
        }
    }

    await chrome.storage.local.set(newtime);
}





chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if(message.target == "addTime") {
        //message.minutes dk
        //currentpattern url

    }else if(message.target == "checkLanguage") {

    } else if(message.target == "resetAllData") {
        chrome.storage.local.clear();
        chrome.storage.local.set({ lang: "en", Urls: [] });
    }
    console.log(message)

    //  sendResponse({ success: true, message: "Timer sıfırlandı" });
    
    return true;
  });


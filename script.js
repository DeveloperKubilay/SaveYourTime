function formatTime(lang,ms) {
    const absMs = Math.abs(ms);
    const seconds = Math.floor((absMs / 1000) % 60);
    const minutes = Math.floor((absMs / (1000 * 60)) % 60);
    const hours = Math.floor(absMs / (1000 * 60 * 60));

    const sign = ms < 0 ? '-' : '';

    return `${sign}${hours} ${lang.common.time.hoursShort}, ${minutes} ${lang.common.time.minutesShort}, ${seconds} ${lang.common.time.secondsShort}`;
}

let Lastsitedata;
let limited;
let Tabignore = false;
function addIframe(data) {
    if(Tabignore) return;

    if(data.limited){
        if(limited) return;
        console.log("m",limited)
        limited = true;
        const existingFavicons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
        if (existingFavicons.length > 0) {
            Lastsitedata = {
                icon: existingFavicons[0].href,
                title: document.title
            }
        }
        document.title = data.lang.warn.title;


        let link = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = chrome.runtime.getURL('icons/icon128.png'); 


        document.getElementsByTagName('head')[0].appendChild(link);


        let iframe = document.createElement('iframe');
        iframe.src = chrome.runtime.getURL('html/warn.html');
        iframe.style.position = 'fixed';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.zIndex = '2147483647';
        iframe.style.border = 'none';
        iframe.id = 'site-SAVE_YOUR_TIME_iframe';
        document.body.appendChild(iframe);


        const videoElement = document.querySelector('video');
        if (videoElement && !videoElement.paused) {
            videoElement.pause();
        }

        const audioElement = document.querySelector('audio');
        if (audioElement && !audioElement.paused) {
            audioElement.pause();
        }


        window.addEventListener('message', async function(event) {
            if (event.data.type === 'addTime') 
                chrome.runtime.sendMessage({ 
                    target: "addTime", 
                    minutes:event.data.minutes,
                    currentpattern: data.currentpattern
                }),
                addIframe({ limited: false })

             else if (event.data.type === 'continue') 
                chrome.runtime.sendMessage({ 
                    target: "Iframe_Continue",
                    tabId: data.tabId
                }),
                addIframe({ limited: false }),
                Tabignore = true;

             else if (event.data.type === 'settings') 
                window.open(chrome.runtime.getURL('html/settings.html'));
            
        });
        
        iframe.onload = function() {
            iframe.contentWindow.postMessage({
                type: 'initialize',
                domain: data.currentpattern,
                dailyStats: data.lang.warn.dailyStats.replace("{{ totalTime }}",formatTime(data.lang,data.usage))
            }, '*');
        };
    }else{
        if(!limited) return;
        limited = false;

        const iframe = document.getElementById("site-SAVE_YOUR_TIME_iframe");
        if (iframe) iframe.remove();
        
        document.title = Lastsitedata?.title || document.title;
        let favicon = document.querySelector('link[rel="icon"]');
        if (favicon && Lastsitedata?.icon) {
            favicon.href = Lastsitedata.icon;
        } else if (Lastsitedata?.icon) {
            favicon = document.createElement('link');
            favicon.rel = 'icon';
            favicon.href = Lastsitedata.icon;
            document.head.appendChild(favicon);
        }

    }
       
}




chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.target === "addIframe") addIframe(request); 
    sendResponse({success: true});
});










/*
   sendResponse({ success: true, received: request });

chrome.runtime.onConnect.addListener(function(port) {
    console.log("Connected to SaveYourTime", port.name);
    if (port.name === "SaveYourTime") {
      port.onMessage.addListener(async function(msg) {

        if(msg.checkLanguage) checkLanguage();
        else if(msg.resetAllData) {
            await chrome.storage.local.clear();
            await chrome.storage.local.set({ lang: "en", Urls: [] });
        }
            else if(msg.addTime){
                const url = msg.url;
                const time = msg.time;
    
                const currentpattern = await getCurrentpattern();
                console.log(currentpattern, url, url.startsWith(currentpattern.url));
                if(!url.startsWith(currentpattern?.url)) return;
                addTime(time, currentpattern);
            }else console.log("SaveYourTime Debug\n",msg)
    
          });
        }
    });


async function addTime(minutes, currentpattern) {
    var usage = await checkUsage(currentpattern);

    usage -= minutes * 60 * 1000;
    chrome.storage.local.set({ [currentpattern.url]: usage });

    editWebsite(currentpattern.url, false);
    startTimer(currentpattern, usage);

    youAreFree();
}

async function editWebsite(currentpattern, x){
    const { Urls = [] } = await chrome.storage.local.get(['Urls']);
    const updatedUrls = Urls.map(url => {
        if (url.url === currentpattern) {
            if(typeof x === "boolean") return { ...url,limited: x };
            else return { ...url, x };
        }
        return url;
    });
    chrome.storage.local.set({ Urls: updatedUrls });
}


var intervalId = null;
async function startTimer(currentpattern, usage) {
    if(intervalId) clearInterval(intervalId);
    intervalId = setInterval(async () => {
        try {
            usage += 10000; 
            if (usage > currentpattern.limit) {
                editWebsite(currentpattern.url, true);
                await chrome.storage.local.set({ [currentpattern.url]: usage });

                useTemplate("warn", currentpattern, usage);

                clearInterval(intervalId);
            } else {
                await chrome.storage.local.set({ [currentpattern.url]: usage });
            }
        } catch {}
    }, 10000);
    window.addEventListener('beforeunload', () => {
        clearInterval(intervalId);
    });
}

async function checkLanguage() {
    var { lang = "en" } = await chrome.storage.local.get(['lang']);
    if(window.lang?.lang === lang) return;
    let langData = await fetch(chrome.runtime.getURL('languages/' + lang +".json"));
    window.lang = await langData.json();
}

async function getCurrentpattern() {
    const currentUrl = window.location.href;
    const patterns = await chrome.storage.local.get(['Urls']);
    const currentpattern = patterns.Urls.filter(pattern => currentUrl.startsWith(pattern.url)).sort((a, b) => b.length - a.length)[0] || {};

    if (!currentpattern.url) return;
    return currentpattern;
}


*/
/*
const currentUrl = window.location.href;
patterns = Urls || [];
const currentpattern = patterns.find(pattern => currentUrl.startsWith(pattern.url)) || {};

if (!currentpattern.url) return;
var usage = await checkUsage(currentpattern);

if (currentpattern.limited) {
    console.log("Limited URL: ", currentpattern.url);
    return useTemplate("warn", currentpattern, usage);
}

startTimer(currentpattern, usage);*/
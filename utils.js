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

function basicRegex(text, data, lang) {
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

function formatTime(ms, lang) {
    const absMs = Math.abs(ms);
    const seconds = Math.floor((absMs / 1000) % 60);
    const minutes = Math.floor((absMs / (1000 * 60)) % 60);
    const hours = Math.floor(absMs / (1000 * 60 * 60));

    const sign = ms < 0 ? '-' : '';

    return `${sign}${hours} ${lang.common.time.hoursShort}, ${minutes} ${lang.common.time.minutesShort}, ${seconds} ${lang.common.time.secondsShort}`;
}

function useTemplate(template, lang, Localwebsites, ...args) {
    if(template === "warn") {
        document.title = lang.warn.title;
            
        var data = ""+Localwebsites.find(website => website.url === "html/warn.html").html;
        data = basicRegex(data, {
            url: args[0].url.replace("https://", "").replace("http://", "").replace(/\/$/, ""),
            totalTime: formatTime(args[1], lang),
        }, lang);
        window.websitedata = document.body.innerHTML;
        document.body.innerHTML = data;
        
        document.querySelectorAll('.time-option-btn').forEach(button => {
            button.addEventListener('click', async function() {
                const minutes = parseInt(this.getAttribute('data-time') || this.innerText.match(/\d+/)[0]);
                //await chrome.storage.local.set({ [currentpattern.url]: usage });
                var usage = await window.checkUsage(args[0]);
                if (usage < 0) return;
                usage -= minutes * 60 * 1000;
                chrome.storage.local.set({ [args[0].url]: usage });
                limitWebsite(args[0].url, false);
                startTimer(args[0], usage, lang, Localwebsites);
                document.body.innerHTML = window.websitedata;
            });
        });
        
        const continueButton = document.querySelector('.continue-btn');
        if (continueButton) {
            continueButton.addEventListener('click', function() {
                document.body.innerHTML = window.websitedata;

            });
        }
        
        const settingsButton = document.querySelector('.settings-btn');
        if (settingsButton) {
            settingsButton.addEventListener('click', function() {
                window.open(chrome.runtime.getURL('html/settings.html'));
            });
        }
    }
}

async function limitWebsite(currentpattern,x){
    const { Urls = [] } = await chrome.storage.local.get(['Urls']);
    const updatedUrls = Urls.map(url => {
        if (url.url === currentpattern) {
            return { ...url, limited: x };
        }
        return url;
    });
    chrome.storage.local.set({ Urls: updatedUrls });
}


async function startTimer(currentpattern, usage, lang, Localwebsites) {
    const intervalId = setInterval(async () => {
        try {
            console.log("Interval running: ", currentpattern.url, usage);
            usage += 10000; 
            if (usage > currentpattern.limit) {
                limitWebsite(currentpattern.url,true);
                await chrome.storage.local.set({ [currentpattern.url]: usage });

                useTemplate("warn", lang, Localwebsites, currentpattern, usage);

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


window.checkUsage = checkUsage;
window.basicRegex = basicRegex;
window.formatTime = formatTime;
window.useTemplate = useTemplate;
window.limitWebsite = limitWebsite;
window.startTimer = startTimer;
// Global object to track active timers
window.activeTimers = {};

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

// Make formatTime with optional parameters for better display options
function formatTime(ms, lang, shortFormat = false) {
    if (!lang && window.translations) {
        lang = window.translations;
    }
    
    const absMs = Math.abs(ms);
    const seconds = Math.floor((absMs / 1000) % 60);
    const minutes = Math.floor((absMs / (1000 * 60)) % 60);
    const hours = Math.floor(absMs / (1000 * 60 * 60));

    const sign = ms < 0 ? '-' : '';
    
    // If we have translations
    if (lang && lang.common && lang.common.time) {
        // Always use short forms for time units
        const hUnit = lang.common.time.hoursShort || 'h';
        const mUnit = lang.common.time.minutesShort || 'm';
        const sUnit = lang.common.time.secondsShort || 's';
        
        // If shortFormat is true, only return hours and minutes
        if (shortFormat) {
            return `${sign}${hours}${hUnit}, ${minutes}${mUnit}`;
        }
        
        // Full format with seconds
        return `${sign}${hours}${hUnit}, ${minutes}${mUnit}, ${seconds}${sUnit}`;
    }
    
    // Fallback format
    return shortFormat ? 
        `${sign}${hours}h, ${minutes}m` :
        `${sign}${hours}h, ${minutes}m, ${seconds}s`;
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
                var usage = await window.checkUsage(args[0]);
                if (usage < 0) return;
                usage -= minutes * 60 * 1000;
                chrome.storage.local.set({ [args[0].url]: usage });
                
                // Remove limited flag
                await limitWebsite(args[0].url, false);
                
                // Restore original page content
                document.body.innerHTML = window.websitedata;
                
                // Restart timer
                startTimer(args[0], usage, lang, Localwebsites);
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

async function limitWebsite(currentpattern, x) {
    const { Urls = [] } = await chrome.storage.local.get(['Urls']);
    const updatedUrls = Urls.map(url => {
        if (url.url === currentpattern) {
            return { ...url, limited: x };
        }
        return url;
    });
    await chrome.storage.local.set({ Urls: updatedUrls });
    
    // If we're unlimiting a site, clear its timer if it exists
    if (x === false && window.activeTimers[currentpattern]) {
        clearInterval(window.activeTimers[currentpattern]);
        delete window.activeTimers[currentpattern];
    }
}

async function startTimer(currentpattern, usage, lang, Localwebsites) {
    // Clear any existing timer for this site
    if (window.activeTimers[currentpattern.url]) {
        clearInterval(window.activeTimers[currentpattern.url]);
        delete window.activeTimers[currentpattern.url];
    }
    
    const intervalId = setInterval(async () => {
        try {
            console.log("Interval running: ", currentpattern.url, usage);
            usage += 10000; 
            if (usage > currentpattern.limit) {
                await limitWebsite(currentpattern.url, true);
                await chrome.storage.local.set({ [currentpattern.url]: usage });

                useTemplate("warn", lang, Localwebsites, currentpattern, usage);

                // Clear the timer once limit is reached
                clearInterval(intervalId);
                delete window.activeTimers[currentpattern.url];
            } else {
                await chrome.storage.local.set({ [currentpattern.url]: usage });
            }
        } catch (error) {
            console.error("Timer error:", error);
        }
    }, 10000);
    
    // Store the timer ID
    window.activeTimers[currentpattern.url] = intervalId;
    
    window.addEventListener('beforeunload', () => {
        clearInterval(intervalId);
    });
}

// Add compatibility method for checking if a site is blocked/limited
async function isSiteLimited(url) {
    try {
        const { Urls = [] } = await chrome.storage.local.get(['Urls']);
        const site = Urls.find(site => url.startsWith(site.url));
        return site ? site.limited : false;
    } catch (error) {
        console.error("Error checking if site is limited:", error);
        return false;
    }
}

// Export the new function
window.isSiteLimited = isSiteLimited;

window.checkUsage = checkUsage;
window.basicRegex = basicRegex;
window.formatTime = formatTime;
window.useTemplate = useTemplate;
window.limitWebsite = limitWebsite;
window.startTimer = startTimer;
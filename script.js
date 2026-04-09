function formatTime(lang, ms) {
    const absMs = Math.abs(ms);
    const minutes = Math.floor((absMs / (1000 * 60)) % 60);
    const hours = Math.floor(absMs / (1000 * 60 * 60));

    const sign = ms < 0 ? '-' : '';

    return `${sign}${hours} ${lang.common.time.hoursShort}, ${minutes} ${lang.common.time.minutesShort}`;
}

let lastSiteData;
let limited;
let currentLimitData = null;

window.addEventListener('message', async function (event) {
    if (!currentLimitData || !event.data?.type) {
        return;
    }

    const iframe = document.getElementById('site-SAVE_YOUR_TIME_iframe');
    if (!iframe || event.source !== iframe.contentWindow) {
        return;
    }

    try {
        if (event.data.type === 'addTime') {
            chrome.runtime.sendMessage({
                target: 'addTime',
                minutes: event.data.minutes,
                currentpattern: currentLimitData.currentpattern
            });
            addIframe({ limited: false });
        } else if (event.data.type === 'continue' || event.data.type === 'close') {
            chrome.runtime.sendMessage({
                target: 'Iframe_Continue',
                tabId: currentLimitData.tabId,
                url: currentLimitData.currentpattern
            });
            addIframe({ limited: false });
        } else if (event.data.type === 'settings') {
            window.open(chrome.runtime.getURL('html/settings.html'));
        } else if (event.data.type === 'delete') {
            chrome.runtime.sendMessage({
                target: 'deleteSite',
                url: currentLimitData.currentpattern
            });
            addIframe({ limited: false });
        }
    } catch { }
});

function addIframe(data) {
    if (data.limited) {
        if (limited) {
            return;
        }

        limited = true;
        currentLimitData = data;

        const existingFavicons = document.querySelectorAll(
            'link[rel="icon"], link[rel="shortcut icon"]'
        );

        if (existingFavicons.length > 0) {
            lastSiteData = {
                icon: existingFavicons[0].href,
                title: document.title
            };
        }

        document.title = data.lang.warn.title;

        let link =
            document.querySelector("link[rel*='icon']") ||
            document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = chrome.runtime.getURL('public/icons/icon128.png');

        document.getElementsByTagName('head')[0].appendChild(link);

        const iframe = document.createElement('iframe');
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

        iframe.onload = function () {
            iframe.contentWindow.postMessage(
                {
                    type: 'initialize',
                    domain: data.currentpattern,
                    dailyStats: data.lang.warn.dailyStats.replace(
                        '{{ totalTime }}',
                        formatTime(data.lang, data.usage)
                    )
                },
                '*'
            );
        };
    } else {
        if (!limited) {
            return;
        }

        limited = false;
        currentLimitData = null;

        const iframe = document.getElementById('site-SAVE_YOUR_TIME_iframe');
        if (iframe) {
            iframe.remove();
        }

        document.title = lastSiteData?.title || document.title;
        let favicon = document.querySelector('link[rel="icon"]');
        if (favicon && lastSiteData?.icon) {
            favicon.href = lastSiteData.icon;
        } else if (lastSiteData?.icon) {
            favicon = document.createElement('link');
            favicon.rel = 'icon';
            favicon.href = lastSiteData.icon;
            document.head.appendChild(favicon);
        }
    }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.target === 'addIframe') {
        addIframe(request);
    }

    if (request.target === 'throwWarn') {
        Toastify({
            text: request.lang.warn.ThrowWarn
                .replace('{{ minutes }}', request.minutes)
                .replace('{{ appName }}', request.lang.app.name),
            duration: 3000,
            destination: chrome.runtime.getURL('html/settings.html'),
            newWindow: true,
            close: false,
            gravity: 'top',
            position: 'right',
            stopOnFocus: true,
            style: "font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;"
        }).showToast();
    }

    sendResponse({ success: true });
});

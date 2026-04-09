let kullanilanGunlukZaman = 0;
let toplamGunlukZaman = 0;
let circleLimited = false;
let currentSiteHasLimit = false;
let currentSitePattern = null;
let currentTabId = null;
let currentUsageValue = 0;
let lastTrackTime = 0;
let countdownInterval = null;
var url;

window.SAVE_YOUR_TIME_RUN = async function () {
    url = await window.getUrl();

    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTabId = activeTab?.id || null;

    const { Tabignores = [] } = await chrome.storage.local.get(['Tabignores']);
    const data = await window.getUrlData(url.fullurl, true);

    url.pattern = data.Limit?.url;

    renderSiteList(data.urls);
    document.getElementById('currentSiteName').innerText = url.shorturl || '—';

    document.getElementById('settingsBtn').addEventListener('click', function () {
        chrome.runtime.openOptionsPage();
    });

    initSiteManagePanel(data);

    const footerText = document.getElementById('footerStatusText');
    const footerIcon = document.getElementById('footerStatusIcon');

    if (!data.Limit) {
        document.querySelector('div.progress-container').style.display = 'none';
        document.querySelector('div.time-actions').style.display = 'none';
        document.getElementById('siteLimit').style.fontSize = '1.2em';
        document.getElementById('siteLimit').style.color = 'var(--text-light)';
        document.getElementById('siteLimit').innerText = window.translations.popup.noLimits;
        
        footerText.innerText = window.translations?.common?.inactive || 'Kapalı';
        footerText.setAttribute('data-lang', 'common.inactive');
        footerIcon.className = 'fas fa-circle-xmark';
        footerIcon.style.color = 'var(--text-muted)';
        footerText.style.color = 'var(--text-muted)';
        return;
    } else {
        footerText.innerText = window.translations?.common?.active || 'Aktif';
        footerText.setAttribute('data-lang', 'common.active');
        footerIcon.className = 'fas fa-circle-check';
        footerIcon.style.color = 'var(--primary)';
        footerText.style.color = 'var(--primary)';
    }

    kullanilanGunlukZaman = data.usage || 0;
    toplamGunlukZaman = data.Limit.limit || 0;
    currentUsageValue = kullanilanGunlukZaman;
    currentSitePattern = data.Limit.url;

    document.getElementById('add15min').addEventListener('click', function () {
        addTime(15);
    });
    document.getElementById('add30min').addEventListener('click', function () {
        addTime(30);
    });
    document.getElementById('add60min').addEventListener('click', function () {
        addTime(60);
    });

    if (kullanilanGunlukZaman < 0) {
        if (data.Limit.limited) {
            circleLimited = true;
            toplamGunlukZaman = Math.abs(kullanilanGunlukZaman);
            kullanilanGunlukZaman = 0;
        } else {
            toplamGunlukZaman += Math.abs(kullanilanGunlukZaman);
            kullanilanGunlukZaman = 0;
        }
    }

    document.getElementById('siteLimit').textContent =
        `${window.translations.popup.dailyLimit}: ${window.formatTime(data.Limit.limit, 1)}`;

    updateProgressCircle(kullanilanGunlukZaman, toplamGunlukZaman, circleLimited);

    const isIgnored = Tabignores.some((tab) => tab.id === currentTabId && tab.url === data.Limit.url);
    if (!data.Limit.limited && !isIgnored) {
        await startLiveCountdown(data.Limit.url);
    }
};

window.addEventListener('beforeunload', stopLiveCountdown);

function renderSiteList(sites) {
    const siteList = document.getElementById('siteList');
    siteList.innerHTML = '';

    sites.forEach((item) => {
        const cleanUrl = item.url.replace('https://', '').replace('http://', '');
        siteList.innerHTML += `<div class="site-item">
                <div class="site-item-name">${cleanUrl}</div>
                <div class="site-item-time">${window.formatTime(item.usage)} / ${window.formatTime(item.limit, 1)}</div>
            </div>`;
    });
}

let timeAddLimit = false;
async function addTime(minutes) {
    if (timeAddLimit || !currentSitePattern) {
        return;
    }

    timeAddLimit = true;

    const addedMs = minutes * 60 * 1000;
    currentUsageValue = Math.max(0, currentUsageValue - addedMs);
    kullanilanGunlukZaman = Math.max(0, kullanilanGunlukZaman - addedMs);
    lastTrackTime = Date.now();

    SendMSG('addTime', {
        minutes: minutes,
        currentpattern: currentSitePattern
    });

    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
        const curtab = tabs[0];
        const tab = await chrome.tabs.get(curtab.id);
        chrome.tabs.sendMessage(tab.id, {
            target: 'addIframe',
            limited: false
        });
    });

    updateProgressCircle(currentUsageValue, toplamGunlukZaman, circleLimited);

    setTimeout(() => {
        timeAddLimit = false;
    }, 200);
}

async function startLiveCountdown(limitUrl) {
    stopLiveCountdown();
    ensureStorageListener();

    const trackKey = `_lastTrack_${limitUrl}`;
    const trackData = await chrome.storage.local.get(trackKey);
    lastTrackTime = trackData[trackKey] || Date.now();

    countdownInterval = setInterval(function () {
        const elapsed = Math.max(0, Date.now() - lastTrackTime);
        const previewUsage = Math.min(currentUsageValue + elapsed, toplamGunlukZaman);
        updateProgressCircle(previewUsage, toplamGunlukZaman, circleLimited);

        if (previewUsage >= toplamGunlukZaman) {
            stopLiveCountdown();
        }
    }, 1000);
}

function stopLiveCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

function ensureStorageListener() {
    if (window.__saveYourTimePopupStorageListener) {
        return;
    }

    window.__saveYourTimePopupStorageListener = function (changes, area) {
        if (area !== 'local' || !currentSitePattern) {
            return;
        }

        if (changes[currentSitePattern]) {
            currentUsageValue = changes[currentSitePattern].newValue || 0;
            kullanilanGunlukZaman = currentUsageValue;
        }

        const trackKey = `_lastTrack_${currentSitePattern}`;
        if (changes[trackKey]) {
            lastTrackTime = changes[trackKey].newValue || Date.now();
        }
    };

    chrome.storage.onChanged.addListener(window.__saveYourTimePopupStorageListener);
}

function formatTimeWithSeconds(ms) {
    const absMs = Math.max(0, Math.abs(ms));
    const hours = Math.floor(absMs / (1000 * 60 * 60));
    const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((absMs % (1000 * 60)) / 1000);
    const t = window.translations.common.time;

    if (hours > 0) {
        return `${hours}${t.hourShort} ${minutes}${t.minutesShort} ${seconds}s`;
    }

    if (minutes > 0) {
        return `${minutes}${t.minutesShort} ${seconds}s`;
    }

    return `${seconds}s`;
}

function updateProgressCircle(usedTime, totalTime, circleLimitedParam) {
    const safeTotal = totalTime || 1;
    const percentage = circleLimitedParam ? 100 : Math.min((usedTime / safeTotal) * 100, 100);

    const progressCircle = document.getElementById('progressCircle');
    const circumference = 2 * Math.PI * 40;
    const offset = circumference - (percentage / 100) * circumference;
    progressCircle.style.strokeDasharray = `${circumference}`;
    progressCircle.style.strokeDashoffset = offset;

    if (percentage >= 90) {
        progressCircle.style.stroke = 'var(--red)';
    } else if (percentage >= 75) {
        progressCircle.style.stroke = 'var(--yellow)';
    } else {
        progressCircle.style.stroke = 'var(--primary)';
    }

    document.getElementById('timeUsed').textContent = formatTimeWithSeconds(usedTime);
    const leftTime = totalTime - usedTime;
    if (leftTime <= 0) {
        document.getElementById('timeLeft').textContent = window.translations.popup.timeEnd;
        document.getElementById('timeLeft').style.color = 'var(--yellow)';
    } else {
        document.getElementById('timeLeft').textContent =
            `${formatTimeWithSeconds(leftTime)} ${window.translations.common.time.left}`;
        document.getElementById('timeLeft').style.color = 'var(--text-light)';
    }
}

function initSiteManagePanel(data) {
    const manageUrlText = document.getElementById('manageUrlText');
    const popupTimeHours = document.getElementById('popupTimeHours');
    const popupTimeMinutes = document.getElementById('popupTimeMinutes');
    const templateButtons = document.querySelectorAll('.tpl-btn');

    const shortUrl = typeof url === 'object' ? url.shorturl : '';
    manageUrlText.textContent = shortUrl || '—';

    currentSiteHasLimit = !!data.Limit;
    currentSitePattern = data.Limit?.url || shortUrl || null;

    popupTimeHours.value = '';
    popupTimeMinutes.value = '';

    if (data.Limit) {
        const totalMinutes = Math.floor((data.Limit.limit || 0) / 60000);
        popupTimeHours.value = Math.floor(totalMinutes / 60) || '';
        popupTimeMinutes.value = totalMinutes % 60 || '';
        highlightMatchingTemplate(totalMinutes);
    } else {
        templateButtons.forEach((button) => button.classList.remove('selected'));
    }

    templateButtons.forEach((button) => {
        button.addEventListener('click', function () {
            templateButtons.forEach((item) => item.classList.remove('selected'));
            this.classList.add('selected');

            const totalMinutes = parseInt(this.getAttribute('data-minutes'), 10);
            popupTimeHours.value = Math.floor(totalMinutes / 60) || '';
            popupTimeMinutes.value = totalMinutes % 60 || '';
        });
    });

    popupTimeHours.addEventListener('input', clearTemplateSelection);
    popupTimeMinutes.addEventListener('input', clearTemplateSelection);

    updateManageButtons();
}

function clearTemplateSelection() {
    document.querySelectorAll('.tpl-btn').forEach((button) => button.classList.remove('selected'));
}

function highlightMatchingTemplate(totalMinutes) {
    document.querySelectorAll('.tpl-btn').forEach((button) => {
        button.classList.toggle(
            'selected',
            parseInt(button.getAttribute('data-minutes'), 10) === totalMinutes
        );
    });
}

function updateManageButtons() {
    const manageActions = document.getElementById('manageActions');
    const shortUrl = typeof url === 'object' ? url.shorturl : '';
    const t = window.translations;

    if (!shortUrl) {
        manageActions.innerHTML = `
            <button class="action-btn-popup btn-disabled" disabled>
                <i class="fas fa-ban"></i> ${t.popup?.siteManage?.unsupported || 'Unsupported'}
            </button>
        `;
        return;
    }

    if (currentSiteHasLimit) {
        manageActions.innerHTML = `
            <button class="action-btn-popup btn-edit" id="popupEditSiteBtn">
                <i class="fas fa-save"></i> ${t.popup?.siteManage?.updateLimit || t.common.save}
            </button>
            <button class="action-btn-popup btn-remove" id="popupRemoveSiteBtn">
                <i class="fas fa-trash"></i> ${t.common.delete}
            </button>
        `;

        document.getElementById('popupEditSiteBtn').addEventListener('click', popupUpdateSite);
        document.getElementById('popupRemoveSiteBtn').addEventListener('click', popupRemoveSite);
    } else {
        manageActions.innerHTML = `
            <button class="action-btn-popup btn-add" id="popupAddSiteBtn">
                <i class="fas fa-plus"></i> ${t.popup?.siteManage?.setLimit || t.settings.sites.add}
            </button>
        `;

        document.getElementById('popupAddSiteBtn').addEventListener('click', popupAddSite);
    }
}

function getPopupTimeLimit() {
    const hours = Math.min(23, Math.max(0, parseInt(document.getElementById('popupTimeHours').value, 10) || 0));
    const minutes = Math.min(59, Math.max(0, parseInt(document.getElementById('popupTimeMinutes').value, 10) || 0));
    return (hours * 60 + minutes) * 60 * 1000;
}

function showManageStatus(message) {
    const status = document.getElementById('manageStatus');
    status.textContent = message;
    status.style.display = 'block';

    clearTimeout(window.__saveYourTimePopupStatusTimeout);
    window.__saveYourTimePopupStatusTimeout = setTimeout(() => {
        status.style.display = 'none';
    }, 2000);
}

function popupAddSite() {
    const limitMs = getPopupTimeLimit();
    const siteUrl = typeof url === 'object' ? url.shorturl : '';
    if (!siteUrl || limitMs <= 0) {
        return;
    }

    chrome.runtime.sendMessage({
        target: 'addSite',
        url: siteUrl,
        limit: limitMs
    }, () => {
        showManageStatus(window.translations.popup?.siteManage?.added || 'Saved');
        window.location.reload();
    });
}

function popupUpdateSite() {
    const limitMs = getPopupTimeLimit();
    const siteUrl = (currentSitePattern || (typeof url === 'object' ? url.shorturl : '')).replace(/^www\./, '');
    if (!siteUrl || limitMs <= 0) {
        return;
    }

    chrome.runtime.sendMessage({
        target: 'addSite',
        oldurl: currentSitePattern,
        url: siteUrl,
        limit: limitMs
    }, () => {
        showManageStatus(window.translations.popup?.siteManage?.updated || 'Updated');
        window.location.reload();
    });
}

function popupRemoveSite() {
    const siteUrl = (currentSitePattern || (typeof url === 'object' ? url.shorturl : '')).replace(/^www\./, '');
    if (!siteUrl) {
        return;
    }

    chrome.runtime.sendMessage({
        target: 'deleteSite',
        url: siteUrl
    }, () => {
        showManageStatus(window.translations.popup?.siteManage?.removed || 'Removed');
        window.location.reload();
    });
}

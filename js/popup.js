let kullanılangünlükzaman = 0;
let toplamgünlükzaman = 0;
let circleLimited = false;
var url;
var currentSiteHasLimit = false;
var currentSitePattern = null;
var countdownInterval = null;
var lastTrackTime = null;


window.SAVE_YOUR_TIME_RUN = async function () {

    url = await window.getUrl();

    const data = await window.getUrlData(url.fullurl, true);

    url.pattern = data.Limit?.url;

    const sites = document.getElementById("siteList")
    data.urls.forEach((item) => {
        const cleanUrl = item.url.replace("https://", "").replace("http://", "");
        sites.innerHTML += `<div class="site-item" data-url="${cleanUrl}">
                    <div class="site-item-name">${cleanUrl}</div>
                    <div class="site-item-time">${window.formatTime(item.usage)} / ${window.formatTime(item.limit, 1)}</div>
                    <div class="site-item-actions">
                        <button class="site-edit-btn" title="${window.translations.common.edit}"><i class="fas fa-edit"></i></button>
                        <button class="site-del-btn" title="${window.translations.common.delete}"><i class="fas fa-trash"></i></button>
                    </div>
                </div>`
    })
    document.getElementById("currentSiteName").innerText = url.shorturl;

    document.getElementById('settingsBtn').addEventListener('click', function () {
        chrome.runtime.openOptionsPage();
    });

    // Site management panel setup
    initSiteManagePanel(data);

    // Site list action buttons
    initSiteListActions();

    if (!data.Limit) {
        document.querySelector("div.current-site").style.display = "none";
        document.body.style.opacity = '1';
        return;
    } else {

        kullanılangünlükzaman = data.usage || 0;
        toplamgünlükzaman = data.Limit.limit || 0;

        document.getElementById('add15min').addEventListener('click', function () {
            addTime(15);
        });
        document.getElementById('add30min').addEventListener('click', function () {
            addTime(30);
        });
        document.getElementById('add60min').addEventListener('click', function () {
            addTime(60);
        });
        if (kullanılangünlükzaman < 0) {
            if (data.Limit.limited) {
                circleLimited = true;
                toplamgünlükzaman = Math.abs(kullanılangünlükzaman)
                kullanılangünlükzaman = 0;
            } else {
                toplamgünlükzaman += Math.abs(kullanılangünlükzaman)
                kullanılangünlükzaman = 0;
            }
        }
    }
    document.getElementById('siteLimit').textContent = window.translations.popup.dailyLimit + ": " + window.formatTime(data.Limit.limit, 1);

    updateProgressCircle(kullanılangünlükzaman, toplamgünlükzaman, circleLimited);
    document.body.style.opacity = '1';

    const trackKey = `_lastTrack_${data.Limit.url}`;
    const trackData = await chrome.storage.local.get(trackKey);
    lastTrackTime = trackData[trackKey] || Date.now();
    let syncUsage = kullanılangünlükzaman;

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && data.Limit) {
            const limitUrl = data.Limit.url;
            if (changes[limitUrl]) syncUsage = changes[limitUrl].newValue;
            if (changes[`_lastTrack_${limitUrl}`]) lastTrackTime = changes[`_lastTrack_${limitUrl}`].newValue;
        }
    });

    countdownInterval = setInterval(function() {
        const elapsed = Math.max(0, Date.now() - lastTrackTime);
        
        kullanılangünlükzaman = syncUsage + elapsed;
        if (kullanılangünlükzaman > toplamgünlükzaman) {
            kullanılangünlükzaman = toplamgünlükzaman;
        }
        
        updateProgressCircle(kullanılangünlükzaman, toplamgünlükzaman, circleLimited);
    }, 1000);
}

var timeaddlimit = false;
async function addTime(minutes) {
    if (timeaddlimit) return;

    timeaddlimit = true;

    SendMSG("addTime", {
        minutes: minutes,
        currentpattern: url.pattern
    });

    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
        const curtab = tabs[0];
        const tab = await chrome.tabs.get(curtab.id);
        chrome.tabs.sendMessage(tab.id, {
            target: "addIframe",
            limited: false
        })
    })

    toplamgünlükzaman += minutes * 60 * 1000;

    updateProgressCircle(kullanılangünlükzaman, toplamgünlükzaman, circleLimited);

    setTimeout(() => timeaddlimit = false, 200);
}

function formatTimeWithSeconds(ms) {
    const absMs = Math.abs(ms);
    const hours = Math.floor(absMs / (1000 * 60 * 60));
    const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((absMs % (1000 * 60)) / 1000);
    const t = window.translations.common.time;

    if (hours > 0) {
        return hours + t.hourShort + ' ' + minutes + t.minutesShort + ' ' + seconds + 's';
    } else if (minutes > 0) {
        return minutes + t.minutesShort + ' ' + seconds + 's';
    } else {
        return seconds + 's';
    }
}

function updateProgressCircle(usedTime, totalTime, circleLimitedParam) {
    const percentage = circleLimitedParam ? 100 : Math.min((usedTime / totalTime) * 100, 100);

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

    const usedSecondsMs = Math.floor(usedTime / 1000) * 1000;
    const totalSecondsMs = Math.floor(totalTime / 1000) * 1000;

    document.getElementById('timeUsed').textContent = formatTimeWithSeconds(usedSecondsMs);
    const leftTime = totalSecondsMs - usedSecondsMs;
    
    if (leftTime <= 0) {
        document.getElementById('timeLeft').textContent = window.translations.popup.timeEnd;
        document.getElementById('timeLeft').style.color = 'var(--yellow)';
        if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
    }
    else {
        document.getElementById('timeLeft').textContent = formatTimeWithSeconds(leftTime) + " " + window.translations.common.time.left;
        document.getElementById('timeLeft').style.color = 'var(--text)';
    }

}


// ==================== Site Management Panel ====================

function initSiteManagePanel(data) {
    const manageUrlText = document.getElementById('manageUrlText');
    const popupTimeHours = document.getElementById('popupTimeHours');
    const popupTimeMinutes = document.getElementById('popupTimeMinutes');
    const manageActions = document.getElementById('manageActions');
    const manageStatus = document.getElementById('manageStatus');
    const tplBtns = document.querySelectorAll('.tpl-btn');

    // Auto-fill current site URL
    const shortUrl = url.shorturl || '—';
    manageUrlText.textContent = shortUrl;

    currentSiteHasLimit = !!data.Limit;
    currentSitePattern = data.Limit?.url || null;

    // Update action buttons based on whether site has a limit
    updateManageButtons();

    // Template button click handlers
    tplBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            tplBtns.forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');

            const totalMinutes = parseInt(this.getAttribute('data-minutes'));
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;

            popupTimeHours.value = hours;
            popupTimeMinutes.value = minutes;
        });
    });

    // Clear template selection when custom input changes
    popupTimeHours.addEventListener('input', () => tplBtns.forEach(b => b.classList.remove('selected')));
    popupTimeMinutes.addEventListener('input', () => tplBtns.forEach(b => b.classList.remove('selected')));

    // If site already has limit, pre-fill with current limit
    if (data.Limit) {
        const limitMs = data.Limit.limit || 0;
        const limitHours = Math.floor(limitMs / (1000 * 60 * 60));
        const limitMinutes = Math.floor((limitMs % (1000 * 60 * 60)) / (1000 * 60));
        popupTimeHours.value = limitHours || '';
        popupTimeMinutes.value = limitMinutes || '';

        // Highlight matching template
        const totalMin = limitHours * 60 + limitMinutes;
        tplBtns.forEach(btn => {
            if (parseInt(btn.getAttribute('data-minutes')) === totalMin) {
                btn.classList.add('selected');
            }
        });
    }
}

function updateManageButtons() {
    const manageActions = document.getElementById('manageActions');
    const t = window.translations;

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
    const hours = Math.min(23, Math.max(0, parseInt(document.getElementById('popupTimeHours').value) || 0));
    const minutes = Math.min(59, Math.max(0, parseInt(document.getElementById('popupTimeMinutes').value) || 0));
    return (hours * 60 + minutes) * 60 * 1000; // ms
}

function showManageStatus(message) {
    const status = document.getElementById('manageStatus');
    status.textContent = message;
    status.style.display = 'block';
    setTimeout(() => { status.style.display = 'none'; }, 2000);
}

function popupAddSite() {
    const limitMs = getPopupTimeLimit();
    if (limitMs <= 0) return;

    const siteUrl = url.shorturl;
    if (!siteUrl || siteUrl === '—') return;

    chrome.runtime.sendMessage({
        target: "addSite",
        url: siteUrl,
        limit: limitMs
    }, () => {
        showManageStatus(window.translations.popup?.siteManage?.added || '✓');
        window.location.reload();
    });

    currentSiteHasLimit = true;
    currentSitePattern = siteUrl;
    url.pattern = siteUrl;
    updateManageButtons();
}

function popupUpdateSite() {
    const limitMs = getPopupTimeLimit();
    if (limitMs <= 0) return;

    let siteUrl = currentSitePattern || url.shorturl;
    if (!siteUrl) return;
    siteUrl = siteUrl.replace(/^www\./, '');

    chrome.runtime.sendMessage({
        target: "addSite",
        oldurl: currentSitePattern,
        url: siteUrl,
        limit: limitMs
    }, () => {
        showManageStatus(window.translations.popup?.siteManage?.updated || '✓');
        window.location.reload();
    });
}

function popupRemoveSite() {
    let siteUrl = currentSitePattern || url.shorturl;
    if (!siteUrl) return;
    siteUrl = siteUrl.replace(/^www\./, '');

    chrome.runtime.sendMessage({
        target: "deleteSite",
        url: siteUrl
    }, () => {
        currentSiteHasLimit = false;
        currentSitePattern = null;

        updateManageButtons();
        document.getElementById('popupTimeHours').value = '';
        document.getElementById('popupTimeMinutes').value = '';
        document.querySelectorAll('.tpl-btn').forEach(b => b.classList.remove('selected'));

        showManageStatus(window.translations.popup?.siteManage?.removed || '✓');
        window.location.reload();
    });
}


// ==================== Site List Actions ====================

function initSiteListActions() {
    const siteList = document.getElementById('siteList');

    siteList.addEventListener('click', function (e) {
        const editBtn = e.target.closest('.site-edit-btn');
        const delBtn = e.target.closest('.site-del-btn');
        const siteItem = e.target.closest('.site-item');
        if (!siteItem) return;

        const siteUrl = siteItem.getAttribute('data-url');

        if (delBtn && siteUrl) {
            chrome.runtime.sendMessage({ target: "deleteSite", url: siteUrl }, () => {
                siteItem.remove();

                // If deleted site is the current site, update management panel
                if (siteUrl === currentSitePattern || siteUrl === url.shorturl) {
                    currentSiteHasLimit = false;
                    currentSitePattern = null;
                    updateManageButtons();
                    document.getElementById('popupTimeHours').value = '';
                    document.getElementById('popupTimeMinutes').value = '';
                    document.querySelectorAll('.tpl-btn').forEach(b => b.classList.remove('selected'));
                }
            });
        }

        if (editBtn && siteUrl) {
            // Fill the management panel with the clicked site's data
            document.getElementById('manageUrlText').textContent = siteUrl;

            // Parse the time from the site item
            const timeText = siteItem.querySelector('.site-item-time').textContent;
            const limitPart = timeText.split('/')[1]?.trim();

            // Set this site as the current editing target
            currentSitePattern = siteUrl;
            currentSiteHasLimit = true;
            updateManageButtons();

            // Scroll to panel
            document.getElementById('siteManagePanel').scrollIntoView({ behavior: 'smooth' });
        }
    });
}

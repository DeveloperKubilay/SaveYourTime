//Chart'ları hazırlar
function initializeCharts(labelArray, usageArray, backgroundColor) {
    const sitesCtx = document.getElementById('sitesChart')?.getContext('2d');

    if (!sitesCtx) return;
    if (window.sitesChart instanceof Chart) window.sitesChart.destroy();

    const maxValue = Math.max(...usageArray);

    window.sitesChart = new Chart(sitesCtx, {
        type: 'bar',
        data: {
            labels: labelArray,
            datasets: [{
                data: usageArray,
                backgroundColor: backgroundColor,
                borderRadius: 20
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#9ca3af'
                    },
                    suggestedMax: maxValue < 1 ? 1 : undefined
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#9ca3af'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                    titleColor: '#f3f4f6',
                    bodyColor: '#9ca3af',
                    borderColor: 'rgba(74, 222, 128, 0.5)',
                    borderWidth: 1,
                    displayColors: false,
                    padding: 10,
                    callbacks: {
                        label: function (context) {
                            return `${context.raw} ${window.translations.common.time.hours}`;
                        }
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            },
            layout: {
                padding: {
                    top: 5,
                    right: 15,
                    bottom: 5,
                    left: 15
                }
            }
        }
    });
}

function resetSiteForm() {
    document.getElementById('siteUrl').value = '';
    document.getElementById('timeHours').value = '';
    document.getElementById('timeMinutes').value = '';
    document.getElementById('editingSiteId').value = '';
    document.getElementById('siteFormTitle').innerHTML = '<i class="fas fa-plus" style="color: var(--primary); margin-right: 8px;"></i> <span data-lang="settings.sites.addNew">Yeni Site Ekle</span>';
    document.getElementById('addSiteBtn').innerHTML = '<i class="fas fa-plus"></i> <span data-lang="settings.sites.add">Ekle</span>';
    document.getElementById('cancelEditBtn').style.display = 'none';

    document.querySelectorAll('.template-btn').forEach(btn => btn.classList.remove('selected'));
}


document.addEventListener('DOMContentLoaded', function () {
    //Global

    //Menüler arası geçişi sağlar
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function () {
            if (this.querySelector('select')) {
                return;
            }

            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            this.classList.add('active');

            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    //Dashboard
    window.getUrlData(null, true).then(data => {
        data = data.urls
        var labelArray = [];
        var usageArray = [];
        var backgroundColor = [];

        const limitedSites = data.filter(item => item.limited).length;
        const totalSites = data.length;

        document.getElementById('restrictedSites').textContent = totalSites;
        document.getElementById('blockedSites').textContent = limitedSites;
        document.getElementById('notBlockedSites').textContent = totalSites - limitedSites;

        data.forEach((item, index) => {
            var url,
                bg = "hsl(" + Math.floor(Math.random() * 360) + ", 70%, 50%)",
                usage = item.usage / 3600000;

            try {
                var url = (new URL(item.url)).hostname.replace(/^www\./, '').split(".")[0];
                url = url.charAt(0).toUpperCase() + url.slice(1);

                if (url === "Youtube") url = "YouTube";
                else if (url === "Tiktok") url = "TikTok";
                else if (url === "Whatsapp") url = "WhatsApp";
                else if (url == "Pornhub") url = "PornHub";

            } catch (error) {
                url = item.url.replace("https://", "").replace("http://").replace("www.", "")
            }


            if (url == "YouTube") bg = "rgba(255, 0, 0, 1)";
            else if (url == "Facebook") bg = "rgba(66, 103, 178, 1)";
            else if (url == "X" || url == "TikTok") bg = "rgba(0, 0, 0, 1)";
            else if (url == "Instagram") bg = "rgba(131, 58, 180, 1)";
            else if (url == "WhatsApp") bg = "rgba(37, 211, 102, 1)";
            else if (url == "Reddit") bg = "rgba(255, 69, 0, 1)";
            else if (url == "Snapchat") bg = "rgba(255, 252, 0, 1)";
            else if (url == "Pinterest") bg = "rgba(189, 8, 28, 1)";
            else if (url == "Vimeo") bg = "rgba(26, 183, 234, 1)";
            else if (url == "Odysee") bg = "rgba(252, 66, 123, 1)";
            else if (url == "Linkedin") bg = "rgba(0, 119, 181, 1)";
            else if (url == "Discord") bg = "rgba(88, 101, 242, 1)";
            else if (url == "Telegram") bg = "rgba(0, 122, 255, 1)";
            else if (url == "Twitch") bg = "rgba(100, 65, 164, 1)";
            else if (url == "Spotify") bg = "rgba(30, 215, 96, 1)";
            else if (url == "Netflix") bg = "rgba(229, 9, 20, 1)";
            else if (url == "Steam") bg = "rgba(0, 0, 0, 1)";
            else if (url == "Amazon") bg = "rgba(255, 153, 0, 1)";
            else if (url == "Ebay") bg = "rgba(255, 0, 0, 1)";
            else if (url == "Kick") bg = "rgba(0, 255, 0, 1)";
            else if (url == "Google") bg = "rgba(219, 68, 55, 1)";
            else if (url == "Pornhub") bg = "rgba(255, 153, 0, 1)";


            labelArray.push(url);
            usageArray.push(usage < 0 ? 0 : +usage.toFixed(2));
            backgroundColor.push(bg);
        });
        initializeCharts(labelArray, usageArray, backgroundColor);
    })



    //Site managment
    document.getElementById('cancelEditBtn').addEventListener('click', resetSiteForm);//iptal butonu
    document.getElementById('addSiteBtn').addEventListener('click', function () { //site ekleme veya editleme buttonu
        const isEditing = document.getElementById('editingSiteId').value !== '';
        isEditing ? updateSite() : addSite();
    });
    document.querySelectorAll('.template-btn').forEach(btn => {  //template süre seç
        btn.addEventListener('click', function () {
            document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('selected'));

            this.classList.add('selected');

            const hours = parseFloat(this.getAttribute('data-hours'));

            const wholeHours = Math.floor(hours);
            const minutes = Math.round((hours - wholeHours) * 60);

            document.getElementById('timeHours').value = wholeHours;
            document.getElementById('timeMinutes').value = minutes;
        });
    });

    //site Editleme buttonları
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const siteId = this.closest('.site-item').getAttribute('data-site-id');
            editSite(siteId);
        });
    });


    //Delete buttonları
    function addDeleteButtonListener(listElement) {
        if (listElement) {
            listElement.addEventListener('click', function (e) {
                const deleteBtn = e.target.closest('.delete-btn');
                if (deleteBtn) {
                    const siteItem = deleteBtn.closest('.site-item');
                    const url = siteItem.querySelector('.site-url').textContent;
                    if (listElement.id === 'sitesList') {
                        document.querySelectorAll('.site-item').forEach(item => {
                            const siteUrl = item.querySelector('.site-url');
                            if (siteUrl && siteUrl.textContent === url) {
                                item.remove();
                            }
                        });
                    } else
                        siteItem.remove();

                    window.SendMSG("deleteSite", { url: url });
                }
            });
        }
    }

    addDeleteButtonListener(document.getElementById('sitesList'));
    addDeleteButtonListener(document.getElementById('activeLimitsList'));


    //Settings
    const resetDataBtn = document.getElementById('resetDataBtn');
    if (resetDataBtn) {
        resetDataBtn.addEventListener('click', function () {
            const confirmReset = confirm(window.translations.settings.general.resetDataConfirm);
            if (confirmReset) {
                window.SendMSG("resetAllData")
                setTimeout(() => window.location.reload(), 500)
            }
        })
    }





})







function addSite() {
    const url = document.getElementById('siteUrl').value.trim().toLowerCase();
    const timeHours = parseInt(document.getElementById('timeHours').value) || 0;
    const timeMinutes = parseInt(document.getElementById('timeMinutes').value) || 0;

    const validHours = Math.min(23, Math.max(0, timeHours));
    const validMinutes = Math.min(59, Math.max(0, timeMinutes));

    const timeLimitMinutes = (validHours * 60) + validMinutes;

    if (!url || timeLimitMinutes < 1) return;
    const siteId = url.replace(/[^a-zA-Z0-9]/g, '');//URL ama arındırılmış hali

    let siteExists = false;
    const siteItems = document.querySelectorAll('.site-item');

    siteItems.forEach(item => {
        const existingUrl = item.querySelector('.site-url').textContent.trim().toLowerCase();
        if (existingUrl === url) {
            siteExists = true;
            document.getElementById('editingSiteId').value = item.getAttribute('data-site-id');
            updateSite();
        }
    });

    if (siteExists) return;

    const sitesList = document.getElementById('sitesList');
    const newSite = document.createElement('div');
    newSite.className = 'site-item';
    newSite.setAttribute('data-site-id', siteId);

    const timeString = window.formatTime(timeLimitMinutes* 60*1000);

    newSite.innerHTML = `
            <div class="site-info">
                <span class="site-url">${url}</span>
                <span class="site-limit">${window.translations.popup.dailyLimit}: ${timeString}</span>
                <span class="site-remaining">${window.translations.settings.sites.remaining}: ${timeString}</span>
            </div>
            <div class="site-actions">
                <button class="edit-btn"><i class="fas fa-edit"></i></button>
                <button class="delete-btn"><i class="fas fa-trash"></i></button>
            </div>
        `;
    newSite.querySelector(".edit-btn").setAttribute('title', window.translations.common.edit);
    newSite.querySelector(".delete-btn").setAttribute('title', window.translations.common.delete);
    sitesList.prepend(newSite);

    const newEditBtn = newSite.querySelector('.edit-btn');
    newEditBtn.addEventListener('click', function () {
        editSite(siteId);
    });

    resetSiteForm();

}

function formatTimeString(hours, minutes, hourText, hoursText, minuteText, minutesText) {
    let timeString = '';

    if (hours > 0) {
        timeString += `${hours} ${hours === 1 ? hourText : hoursText}`;
        if (minutes > 0) {
            timeString += ` ${minutes} ${minutes === 1 ? minuteText : minutesText}`;
        }
    } else if (minutes > 0) {
        timeString += `${minutes} ${minutes === 1 ? minuteText : minutesText}`;
    }

    return timeString;
}

window.editSite = function (siteId) {
    console.log('Editing site:', siteId);
    const siteItem = document.querySelector(`.site-item[data-site-id="${siteId}"]`);
    if (siteItem) {
        const url = siteItem.querySelector('.site-url').textContent;
        const limitText = siteItem.querySelector('.site-limit').textContent;

        const limitMatch = limitText.match(/[\d\.]+/);
        const timeLimit = limitMatch ? parseFloat(limitMatch[0]) : 0;

        const hours = Math.floor(timeLimit);
        const minutes = Math.round((timeLimit - hours) * 60);

        document.getElementById('siteUrl').value = url;
        document.getElementById('timeHours').value = hours;
        document.getElementById('timeMinutes').value = minutes;
        document.getElementById('editingSiteId').value = siteId;

        document.getElementById('siteFormTitle').innerHTML = '<i class="fas fa-edit" style="color: #3b82f6; margin-right: 8px;"></i> <span data-lang="settings.sites.editSite">Siteyi Düzenle</span>';
        document.getElementById('addSiteBtn').innerHTML = '<i class="fas fa-save"></i> <span data-lang="common.save">Kaydet</span>';
        document.getElementById('cancelEditBtn').style.display = 'inline-flex';
        document.getElementById('siteFormCard').scrollIntoView({ behavior: 'smooth' });

        document.querySelectorAll('.template-btn').forEach(btn => btn.classList.remove('selected'));
    }
};

function updateSite() {
    const siteId = document.getElementById('editingSiteId').value;
    const url = document.getElementById('siteUrl').value;
    const timeHours = parseInt(document.getElementById('timeHours').value) || 0;
    const timeMinutes = parseInt(document.getElementById('timeMinutes').value) || 0;

    const validHours = Math.min(23, Math.max(0, timeHours));
    const validMinutes = Math.min(59, Math.max(0, timeMinutes));

    const timeLimitMinutes = (validHours * 60) + validMinutes;

    if (url && timeLimitMinutes > 0) {
        const siteItem = document.querySelector(`.site-item[data-site-id="${siteId}"]`);
        if (siteItem) {
            const dailyLimitEl = document.querySelector('[data-lang="popup.dailyLimit"]');
            const remainingEl = document.querySelector('[data-lang="settings.sites.remaining"]');
            const hourEl = document.querySelector('[data-lang="common.time.hour"]');
            const hoursEl = document.querySelector('[data-lang="common.time.hours"]');
            const minuteEl = document.querySelector('[data-lang="common.time.minute"]');
            const minutesEl = document.querySelector('[data-lang="common.time.minutes"]');

            const dailyLimitText = dailyLimitEl?.textContent || window.i18n?.t('popup.dailyLimit') || 'Günlük Limit';
            const remainingText = remainingEl?.textContent || window.i18n?.t('settings.sites.remaining') || 'Kalan süre';
            const hourText = hourEl?.textContent || window.i18n?.t('common.time.hour') || 'saat';
            const hoursText = hoursEl?.textContent || window.i18n?.t('common.time.hours') || 'saat';
            const minuteText = minuteEl?.textContent || window.i18n?.t('common.time.minute') || 'dakika';
            const minutesText = minutesEl?.textContent || window.i18n?.t('common.time.minutes') || 'dakika';

            const timeString = formatTimeString(validHours, validMinutes, hourText, hoursText, minuteText, minutesText);

            siteItem.querySelector('.site-url').textContent = url;
            siteItem.querySelector('.site-limit').innerHTML = `${dailyLimitText}: ${timeString}`;
            siteItem.querySelector('.site-remaining').innerHTML = `${remainingText}: ${timeString}`;

            //siteItem.querySelector('.delete-btn').setAttribute('onclick', `deleteSite('${url}')`);

            resetSiteForm();
        }
    }
}
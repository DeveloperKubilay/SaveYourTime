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
    document.getElementById('siteFormTitle').innerHTML = 
        '<i class="fas fa-plus" style="color: var(--primary); margin-right: 8px;"></i> <span>'+window.translations.settings.sites.addNew+'</span>';
    document.getElementById('addSiteBtn').innerHTML = '<i class="fas fa-plus"></i> <span>'+window.translations.settings.sites.add+'</span>';
    document.getElementById('cancelEditBtn').style.display = 'none';

    document.querySelectorAll('.template-btn').forEach(btn => btn.classList.remove('selected'));
}


window.SAVE_YOUR_TIME_RUN = async function () {
    //Global

    //Menüler arası geçişi sağlar
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function () {
            if (this.querySelector('select')) return;
            
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            this.classList.add('active');

            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });


    //site Editleme buttonları
    const siteList = document.getElementById('sitesList')
    const activeLimitsList = document.getElementById('activeLimitsList')

    siteList.addEventListener('click', function (event) {
        const editBtn = event.target.closest('.edit-btn');
        if (editBtn) {
            const siteId = editBtn.closest('.site-item').getAttribute('data-site-id');
            const siteItem = document.querySelector(`.site-item[data-site-id="${siteId}"]`);
            if (siteItem) {
                const url = siteItem.querySelector('.site-url').textContent;
                const remainingText = siteItem.querySelector('.site-remaining').getAttribute('data-remaining');

                const limitMatch = remainingText.split('.');

                const hours = Math.floor(limitMatch[0]);
                const minutes = Math.floor(limitMatch[1])

                document.getElementById('siteUrl').value = url;
                document.getElementById('timeHours').value = hours;
                document.getElementById('timeMinutes').value = minutes;
                document.getElementById('editingSiteId').value = siteId;

                document.getElementById('siteFormTitle').innerHTML = '<i class="fas fa-edit" style="color: #3b82f6; margin-right: 8px;"></i>' +
                    '<span>' + window.translations.settings.sites.editSite + '</span>';

                document.getElementById('addSiteBtn').innerHTML = '<i class="fas fa-save"></i> <span data-lang="common.save">'+window.translations.common.save+'</span>';
                document.getElementById('cancelEditBtn').style.display = 'inline-flex';
                document.getElementById('siteFormCard').scrollIntoView({ behavior: 'smooth' });

                document.querySelectorAll('.template-btn').forEach(btn => btn.classList.remove('selected'));
            }
        }
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

    addDeleteButtonListener(siteList);
    addDeleteButtonListener(activeLimitsList);


    window.getUrlData(null, true).then(data => {
        data = data.urls
        var labelArray = [];
        var usageArray = [];
        var backgroundColor = [];

        const limitedSites = data.filter(item => item.limited).length;
        const totalSites = data.length;

        document.getElementById('restrictedSites'). textContent= totalSites;
        document.getElementById('blockedSites').textContent = limitedSites;
        document.getElementById('notBlockedSites').textContent = totalSites - limitedSites;

        data.forEach((item, index) => {
            //Dashboard
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
            else if (url == "Steam") bg = "rgba(0, 120, 180, 1)";
            else if (url == "Amazon") bg = "rgba(255, 153, 0, 1)";
            else if (url == "Ebay") bg = "rgba(255, 0, 0, 1)";
            else if (url == "Kick") bg = "rgba(0, 255, 0, 1)";
            else if (url == "Google") bg = "rgba(219, 68, 55, 1)";
            else if (url == "Pornhub") bg = "rgba(255, 153, 0, 1)";


            labelArray.push(url);
            usageArray.push(usage < 0 ? 0 : +usage.toFixed(2));
            backgroundColor.push(bg);

            //Site management
            addSite(item.url, item.limit / 60000, item.usage / 60000, item.limited)
        });
        initializeCharts(labelArray, usageArray, backgroundColor);
        //Active limits
        data.filter(item => item.limited).forEach(item => {    
            const siteItem = document.createElement('div');
            siteItem.className = 'site-item';
            siteItem.innerHTML = `
                    <div class="site-info">
                        <span class="site-url">${item.url}</span>
                        <span class="site-remaining" data-time="${-item.usage}">${window.translations.settings.sites.remaining}: ${
                            window.formatTime(-item.usage,-9999999999999999999,true)
                        }</span>
                    </div>
                    <div class="site-actions">
                        <button class="time-btn" data-time="15">+15${window.translations.common.time.minutesShort}</button>
                        <button class="time-btn" data-time="30">+30${window.translations.common.time.minutesShort}</button>
                        <button class="time-btn" data-time="60">+1${window.translations.common.time.hourShort}</button>
                        <button class="time-btn" data-time="120">+2${window.translations.common.time.hoursShort}</button>
                        <button class="time-btn" data-time="-60">-1${window.translations.common.time.hoursShort}</button>
                        <button class="delete-btn" data-lang-title="common.close"><i class="fas fa-times"></i></button>
                    </div>` 
             siteItem.querySelector(".delete-btn").setAttribute('title', window.translations.common.delete);
             activeLimitsList.innerHTML += siteItem.outerHTML;
        })
        const timeButtons = document.querySelectorAll('.time-btn');
        timeButtons.forEach(button => {
            button.addEventListener('click', function (btn) {
                const siteItem = btn.target.closest('.site-item');
                const url = siteItem.querySelector('.site-url').textContent;
                const timeChange = parseInt(this.getAttribute('data-time'));
                const remainingTime = siteItem.querySelector('.site-remaining');
                
                const time = Number(remainingTime.getAttribute("data-time")) + (timeChange* 60000)
                remainingTime.setAttribute('data-time',time);

                remainingTime.innerHTML = 
                    `${window.translations.settings.sites.remaining}: ${window.formatTime( 
                        Number(remainingTime.getAttribute("data-time"))
                    , -9999999999999999999,true)}`
        

                window.SendMSG("addTime", {
                    currentpattern: url,
                    minutes: timeChange
                });
            })
        })
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



    const quickAddBtn = document.getElementById('quickAddBtn');
    const quickAddDropdown = document.getElementById('quickAddDropdown');

    if (quickAddBtn && quickAddDropdown) {
        quickAddBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            quickAddDropdown.style.display = quickAddDropdown.style.display === 'block' ? 'none' : 'block';
        });

        document.addEventListener('click', function (e) {
            if (!quickAddDropdown.contains(e.target) && e.target !== quickAddBtn) {
                quickAddDropdown.style.display = 'none';
            }
        });

        quickAddDropdown.querySelectorAll('.quick-add-item').forEach(item => {
            item.addEventListener('click', function () {
                let url = this.textContent.trim().toLowerCase();
                const icon = this.querySelector('i');
                if (icon) {
                    if (icon.classList.contains('fa-youtube')) {
                        if (icon.classList.contains('yt-shorts')) url = 'www.youtube.com/shorts';
                        else url = 'www.youtube.com';
                    }
                    else if (icon.classList.contains('fa-facebook')) url = 'facebook.com';
                    else if (icon.classList.contains('fa-x-twitter')) url = 'twitter.com';
                    else if (icon.classList.contains('fa-tiktok')) url = 'tiktok.com';
                    else if (icon.classList.contains('fa-instagram')) url = 'instagram.com';
                    else if (icon.classList.contains('fa-whatsapp')) url = 'web.whatsapp.com';
                    else if (icon.classList.contains('fa-reddit')) url = 'reddit.com';
                    else if (icon.classList.contains('fa-snapchat')) url = 'snapchat.com';
                    else if (icon.classList.contains('fa-pinterest')) url = 'pinterest.com';
                    else if (icon.classList.contains('fa-vimeo')) url = 'vimeo.com';
                    else if (icon.classList.contains('fa-play-circle')) url = 'odysee.com';
                    else if (icon.classList.contains('fa-linkedin')) url = 'linkedin.com';
                    else if (icon.classList.contains('fa-discord')) url = 'discord.com';
                    else if (icon.classList.contains('fa-telegram')) url = 'web.telegram.org';
                    else if (icon.classList.contains('fa-twitch')) url = 'twitch.tv';
                    else if (icon.classList.contains('fa-spotify')) url = 'open.spotify.com';
                    else if (icon.classList.contains('fa-play')) url = 'netflix.com';
                    else if (icon.classList.contains('fa-steam')) url = 'store.steampowered.com';
                    else if (icon.classList.contains('fa-amazon')) url = 'amazon.com';
                    else if (icon.classList.contains('fa-ebay')) url = 'ebay.com';
                    else if (icon.classList.contains('fa-gamepad')) url = 'kick.com';
                    else if (icon.classList.contains('fa-google')) url = 'google.com';
                }
                document.getElementById('siteUrl').value = url;
                addSite();
                quickAddDropdown.style.display = 'none';
            });
        });
    }


    //Settings
    const resetDataBtn = document.getElementById('resetDataBtn');
    if (resetDataBtn) {
        resetDataBtn.addEventListener('click', function () {
            const confirmReset = confirm(window.translations.settings.general.resetDataConfirm);
            if (confirmReset) {
                window.SendMSG("resetAllData")
                setTimeout(() => window.location.reload(), 500)
            }
        });


    }
}




function updateSite() {
    const siteId = document.getElementById('editingSiteId').value;
    const url = document.getElementById('siteUrl').value.trim().toLowerCase().replace("https://", "").replace("http://", "").replace(/\/+$/, "");
    if (!url.includes(".")) return;
    const timeHours = parseInt(document.getElementById('timeHours').value) || 0;
    const timeMinutes = parseInt(document.getElementById('timeMinutes').value) || 0;

    const validHours = Math.min(23, Math.max(0, timeHours));
    const validMinutes = Math.min(59, Math.max(0, timeMinutes));

    const timeLimitMinutes = (validHours * 60) + validMinutes;
 
    if (url && timeLimitMinutes > 0) {
        const siteItem = document.querySelector(`.site-item[data-site-id="${siteId}"]`);
        if (siteItem) {
            const oldUrl = siteItem.querySelector('.site-url').textContent.trim();
            const timeString = window.formatTime(timeLimitMinutes * 60 * 1000);
            
            siteItem.querySelector('.site-url').innerHTML = `${getIconHTML(url)}${url}`;
            siteItem.querySelector('.site-limit').innerHTML = `${window.translations.popup.dailyLimit}: ${timeString}`;
            siteItem.querySelector('.site-remaining').innerHTML = `${window.translations.settings.sites.remaining}: ${timeString}`;
            siteItem.querySelector('.site-remaining').setAttribute('data-remaining', validHours + '.' + validMinutes);

            window.SendMSG("addSite", {
                oldurl: oldUrl,
                url: url,
                limit: timeLimitMinutes * 60 * 1000
            });

            resetSiteForm();
        }
    }
}

function getIconHTML(url) {
    let iconHTML = '';
    if (url.includes('youtube')) {
        iconHTML = '<i class="fab fa-youtube" style="color:#FF0000;margin-right:5px;"></i>';
    } else if (url.includes('facebook')) {
        iconHTML = '<i class="fab fa-facebook" style="color:#4267B2;margin-right:5px;"></i>';
    } else if (url.includes('twitter') || url.includes('x.com')) {
        iconHTML = '<i class="fab fa-x-twitter" style="color:#000000;margin-right:5px;"></i>';
    } else if (url.includes('tiktok')) {
        iconHTML = '<i class="fab fa-tiktok" style="color:#000000;margin-right:5px;"></i>';
    } else if (url.includes('instagram')) {
        iconHTML = '<i class="fab fa-instagram" style="color:#833AB4;margin-right:5px;"></i>';
    } else if (url.includes('whatsapp')) {
        iconHTML = '<i class="fab fa-whatsapp" style="color:#25D366;margin-right:5px;"></i>';
    } else if (url.includes('reddit')) {
        iconHTML = '<i class="fab fa-reddit" style="color:#FF4500;margin-right:5px;"></i>';
    } else if (url.includes('snapchat')) {
        iconHTML = '<i class="fab fa-snapchat" style="color:#FFFC00;margin-right:5px;"></i>';
    } else if (url.includes('pinterest')) {
        iconHTML = '<i class="fab fa-pinterest" style="color:#BD081C;margin-right:5px;"></i>';
    } else if (url.includes('vimeo')) {
        iconHTML = '<i class="fab fa-vimeo" style="color:#1AB7EA;margin-right:5px;"></i>';
    } else if (url.includes('linkedin')) {
        iconHTML = '<i class="fab fa-linkedin" style="color:#0077B5;margin-right:5px;"></i>';
    } else if (url.includes('discord')) {
        iconHTML = '<i class="fab fa-discord" style="color:#5865F2;margin-right:5px;"></i>';
    } else if (url.includes('telegram')) {
        iconHTML = '<i class="fab fa-telegram" style="color:#0088cc;margin-right:5px;"></i>';
    } else if (url.includes('twitch')) {
        iconHTML = '<i class="fab fa-twitch" style="color:#6441A4;margin-right:5px;"></i>';
    } else if (url.includes('spotify')) {
        iconHTML = '<i class="fab fa-spotify" style="color:#1ED760;margin-right:5px;"></i>';
    } else if (url.includes('netflix')) {
        iconHTML = '<i class="fas fa-play" style="color:#E50914;margin-right:5px;"></i>';
    } else if (url.includes('steam')) {
        iconHTML = '<i class="fab fa-steam" style="color:#0078B4;margin-right:5px;"></i>';
    } else if (url.includes('amazon')) {
        iconHTML = '<i class="fab fa-amazon" style="color:#FF9900;margin-right:5px;"></i>';
    } else if (url.includes('ebay')) {
        iconHTML = '<i class="fab fa-ebay" style="color:#FF0000;margin-right:5px;"></i>';
    } else if (url.includes('kick')) {
        iconHTML = '<i class="fas fa-gamepad" style="color:#00FF00;margin-right:5px;"></i>';
    } else if (url.includes('google')) {
        iconHTML = '<i class="fab fa-google" style="color:#DB4437;margin-right:5px;"></i>';
    } else if (url.includes('pornhub')) {
        iconHTML = '<i class="fas fa-film" style="color:#FF9900;margin-right:5px;"></i>';
    } else {
        // Default icon for other sites
        iconHTML = '<i class="fas fa-globe" style="color:#7C8995;margin-right:5px;"></i>';
    }
    return iconHTML;
}



function addSite(murl, timeLimit, usage,itsLimited) {
    const url = (murl ?? document.getElementById('siteUrl').value.trim().toLowerCase().replace("https://", "").replace("http://", "")).replace(/\/+$/, "");
    if (!url.includes(".")) return;
    const timeHours = parseInt(document.getElementById('timeHours').value) || 0;
    const timeMinutes = parseInt(document.getElementById('timeMinutes').value) || 0;

    let validHours, validMinutes;
    
    if (timeLimit !== undefined) {
        validHours = Math.floor(timeLimit / 60);
        validMinutes = timeLimit % 60;
    } else {
        validHours = Math.min(23, Math.max(0, timeHours));
        validMinutes = Math.min(59, Math.max(0, timeMinutes));
    }
    
    const timeLimitMinutes = validHours * 60 + validMinutes;
    if (!url || timeLimitMinutes < 0.000000000000001) return;
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

    
    const timeString = window.formatTime(timeLimitMinutes * 60 * 1000);
    newSite.innerHTML = `
            <div class="site-info">
                <span class="site-url">${getIconHTML(url)}${url}</span>
                <span class="site-limit">${window.translations.popup.dailyLimit}: ${timeString}</span>
                <span class="site-remaining" data-remaining="${validHours}.${validMinutes}">${window.translations.settings.sites.remaining}: ${
                    typeof usage !== "undefined" ? window.formatTime(!itsLimited ? (timeLimit-usage)*60000 : usage*60000) : timeString
                }</span>
            </div>
            <div class="site-actions">
                <button class="edit-btn"><i class="fas fa-edit"></i></button>
                <button class="delete-btn"><i class="fas fa-trash"></i></button>
            </div>
        `;
    newSite.querySelector(".edit-btn").setAttribute('title', window.translations.common.edit);
    newSite.querySelector(".delete-btn").setAttribute('title', window.translations.common.delete);

    if (typeof usage === "undefined") {
        window.SendMSG("addSite", {
            url: url,
            limit: timeLimitMinutes * 60 * 1000
        })
    }

    sitesList.prepend(newSite);
    resetSiteForm();
}
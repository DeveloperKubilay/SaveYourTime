//Chart'ları hazırlar
function initializeCharts() {
    const sitesCtx = document.getElementById('sitesChart')?.getContext('2d');
    if (!sitesCtx) {
        console.warn('sitesChart canvas not found');
        return;
    }
    
    if (window.sitesChart instanceof Chart) {
        window.sitesChart.destroy();
    }
    
    const gradient = sitesCtx.createLinearGradient(0, 0, 240, 0);
    gradient.addColorStop(0, 'rgba(74, 222, 128, 0.6)');
    gradient.addColorStop(1, 'rgba(74, 222, 128, 0.1)');
    
    const timeUsedElement = document.querySelector('[data-lang="popup.timeUsed"]');
    const timeUsedLabel = timeUsedElement ? timeUsedElement.textContent : 'Kullanılan Süre';
    
    window.sitesChart = new Chart(sitesCtx, {
        type: 'bar',
        data: {
            labels: ['Facebook', 'YouTube', 'Twitter', 'Instagram', 'Reddit'],
            datasets: [{
                label: timeUsedLabel,
                data: [5.2, 8.5, 3.1, 4.7, 2.3],
                backgroundColor: [
                    'rgba(66, 103, 178, 0.8)',
                    'rgba(255, 0, 0, 0.8)',
                    'rgba(29, 161, 242, 0.8)',
                    'rgba(225, 48, 108, 0.8)',
                    'rgba(255, 69, 0, 0.8)'
                ],
                borderWidth: 0,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#9ca3af'
                    }
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
                        label: function(context) {
                            const value = context.raw;
                            const hourText = document.querySelector('[data-lang="common.time.hours"]')?.textContent || 'saat';
                            return `${value} ${hourText}`;
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


document.addEventListener('DOMContentLoaded', function() {
//Global

    //Menüler arası geçişi sağlar
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
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
    initializeCharts();


  


//Site managment
    document.getElementById('cancelEditBtn').addEventListener('click', resetSiteForm);
    document.getElementById('addSiteBtn').addEventListener('click', function() { //ADD SİTE BUTTON
        const isEditing = document.getElementById('editingSiteId').value !== '';
        if (isEditing) {
            updateSite();
        } else {
            addSite();
        }
    });
    document.querySelectorAll('.template-btn').forEach(btn => {  // TIME SELECTION BUTTONS
        btn.addEventListener('click', function() {
            document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('selected'));
            
            this.classList.add('selected');
            
            const hours = parseFloat(this.getAttribute('data-hours'));
            
            const wholeHours = Math.floor(hours);
            const minutes = Math.round((hours - wholeHours) * 60);
            
            document.getElementById('timeHours').value = wholeHours;
            document.getElementById('timeMinutes').value = minutes;
        });
    });


    initializeEditButtons();
  //  initializeResetDataButton();

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        
        const siteItem = this.closest('.site-item');
        const url = siteItem.querySelector('.site-url').textContent;
        deleteSite(url);
    });
});



    })

















    
    function initializeEditButtons() {
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const siteId = this.closest('.site-item').getAttribute('data-site-id');
                editSite(siteId);
            });
        });
    }
    

    
    function initializeResetDataButton() {
        const resetDataBtn = document.getElementById('resetDataBtn');
        if (resetDataBtn) {
            resetDataBtn.addEventListener('click', function() {
                if (confirm(window.i18n?.t('settings.general.resetDataConfirm') || 
                           'Tüm kayıtlı veriler silinecektir. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?')) {
                    
                    localStorage.clear();
                    
                    alert(window.i18n?.t('settings.general.dataResetSuccess') || 
                          'Tüm veriler başarıyla sıfırlandı. Sayfayı yenilemek için tamam\'a tıklayın.');
                    
                    location.reload();
                }
            });
        }
    }




function addSite() {
    const url = document.getElementById('siteUrl').value.trim().toLowerCase();
    const timeHours = parseInt(document.getElementById('timeHours').value) || 0;
    const timeMinutes = parseInt(document.getElementById('timeMinutes').value) || 0;
    
    const validHours = Math.min(23, Math.max(0, timeHours));
    const validMinutes = Math.min(59, Math.max(0, timeMinutes));
    
    const timeLimitMinutes = (validHours * 60) + validMinutes;
    
    if (url && timeLimitMinutes > 0) {
        const siteId = url.replace(/[^a-zA-Z0-9]/g, '');
        
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
        
        if (siteExists) {
            return;
        }
        
        const sitesList = document.getElementById('sitesList');
        const newSite = document.createElement('div');
        newSite.className = 'site-item';
        newSite.setAttribute('data-site-id', siteId);
        
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
        
        newSite.innerHTML = `
            <div class="site-info">
                <span class="site-url">${url}</span>
                <span class="site-limit">${dailyLimitText}: ${timeString}</span>
                <span class="site-remaining">${remainingText}: ${timeString}</span>
            </div>
            <div class="site-actions">
                <button class="edit-btn" onclick="editSite('${siteId}')"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" onclick="deleteSite('${url}')"><i class="fas fa-trash"></i></button>
            </div>
        `;
        sitesList.prepend(newSite);
        
        const newEditBtn = newSite.querySelector('.edit-btn');
        newEditBtn.addEventListener('click', function() {
            editSite(siteId);
        });
        
        resetSiteForm();
    }
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

window.editSite = function(siteId) {
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
            
            siteItem.querySelector('.delete-btn').setAttribute('onclick', `deleteSite('${url}')`);
            
            resetSiteForm();
        }
    }
}



window.deleteSite = function(url) {
    console.log('Deleting site:', url);
    
    const siteItems = document.querySelectorAll('.site-item');
    let deleted = false;
    
    siteItems.forEach(item => {
        const siteUrl = item.querySelector('.site-url');
        if (siteUrl && siteUrl.textContent === url) {
            item.remove();
            deleted = true;
        }
    });
    
    if (deleted) {
        console.log(`Site ${url} successfully deleted`);
    }
};

window.addTime = function(url, minutes) {
    console.log(`${url} adding ${minutes} minutes`);
    
    const addTimeMsg = window.i18n?.t('warn.addTime') || 'added';
    const minutesText = window.i18n?.t('common.time.minutes') || 'minutes';
    alert(`${url} ${addTimeMsg}: ${minutes} ${minutesText}!`);
};

window.removeLimit = function(url) {
    console.log(`${url} removed from limits`);
    
    const limitItems = document.querySelectorAll('#activeLimitsList .site-item');
    limitItems.forEach(item => {
        if (item.querySelector('.site-url').textContent === url) {
            item.remove();
        }
    });
};
// Örnek süre değerleri (gerçek uygulamada burası backend'den gelecek)
let kullanılangünlükzaman = 8100000; // 2 saat 15 dakika (ms cinsinden)
let toplamgünlükzaman = 10800000;   // 3 saat (ms cinsinden)

document.addEventListener('DOMContentLoaded', function() {
    initializePopup() 
    function initializePopup() {
        // Başlangıç değerleriyle progress dairesini güncelle
        updateProgressCircle(kullanılangünlükzaman, toplamgünlükzaman);
        
        // Butonlara event listener'lar ekle
        document.getElementById('settingsBtn').addEventListener('click', openSettings);
        
        // Check if elements exist before adding event listeners
        const openSettingsBtn = document.getElementById('openSettings');
        if (openSettingsBtn) {
            openSettingsBtn.addEventListener('click', openSettings);
        }
        
        const openStatsBtn = document.getElementById('openStats');
        if (openStatsBtn) {
            openStatsBtn.addEventListener('click', openStats);
        }
        
        // Süre ekleme butonları için event listener'lar
        document.getElementById('add15min').addEventListener('click', function() {
            addTime(15);
        });
        document.getElementById('add30min').addEventListener('click', function() {
            addTime(30);
        });
        document.getElementById('add60min').addEventListener('click', function() {
            addTime(60);
        });
        
        // Gerçek uygulamada aktif sekme bilgilerini al
        getCurrentTabInfo();
        
        // Title translation
        document.title = window.t ? window.t('app.name') : 'SaveYourTime';
        
        // Translate static elements
        if (window.translatePage) {
            window.translatePage();
        }
    }
});

// Progress çemberini güncelleme fonksiyonu
function updateProgressCircle(usedTime, totalTime) {
    // Yüzde hesapla
    const percentage = Math.min((usedTime / totalTime) * 100, 100);
    
    // SVG progress dairesini güncelle
    const progressCircle = document.getElementById('progressCircle');
    const circumference = 2 * Math.PI * 40; // r=40 için düzeltildi
    const offset = circumference - (percentage / 100) * circumference;
    progressCircle.style.strokeDasharray = `${circumference}`;
    progressCircle.style.strokeDashoffset = offset;
    
    // %75 üzerinde sarı, %90 üzerinde kırmızı renk kullan
    if (percentage >= 90) {
        progressCircle.style.stroke = 'var(--red)';
    } else if (percentage >= 75) {
        progressCircle.style.stroke = 'var(--yellow)';
    } else {
        progressCircle.style.stroke = 'var(--primary)';
    }
    
    // Use formatTime function for time strings
    const timeUsedText = window.formatTime ? window.formatTime(usedTime) : msToTimeString(usedTime);
    const timeLeftText = window.formatTime ? 
        `${window.formatTime(totalTime - usedTime)} ${window.t('common.time.left')}` : 
        `${msToTimeString(totalTime - usedTime)} kaldı`;
    
    document.getElementById('timeUsed').textContent = timeUsedText;
    document.getElementById('timeLeft').textContent = timeLeftText;
    
    const limitText = window.t ? 
        `${window.t('popup.dailyLimit')}: ${window.formatTime(totalTime)}` : 
        `Günlük Limit: ${msToTimeString(totalTime)}`;
        
    document.getElementById('siteLimit').textContent = limitText;
}

// Legacy time formatter for fallback
function msToTimeString(ms) {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return hours + 's ' + (minutes > 0 ? minutes + 'dk' : '');
    } else {
        return minutes + 'dk';
    }
}

// Ek süre ekle fonksiyonu
function addTime(minutes) {
    const msToAdd = minutes * 60 * 1000;
    toplamgünlükzaman += msToAdd;
    
    // Progress dairesini güncelle
    updateProgressCircle(kullanılangünlükzaman, toplamgünlükzaman);
    
    // Gerçek uygulamada burada backend'e kayıt yapılacak
    console.log(`${minutes} ${window.t ? window.t('common.time.minutes') : 'dakika'} eklendi.`);
}

// Aktif sekme bilgilerini al
function getCurrentTabInfo() {
    // Chrome uzantısı için:
    // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    //     if (tabs[0]) {
    //         const url = new URL(tabs[0].url);
    //         const domain = url.hostname;
    //         document.getElementById('currentSiteName').textContent = domain;
    //         
    //         // Backend'den bu site için kullanım sürelerini al
    //         // fetchSiteUsageData(domain);
    //     }
    // });
    
    // Test verileri
    const activeSite = "youtube.com";
    document.getElementById('currentSiteName').textContent = activeSite;
}

// Site kullanım verilerini backend'den al
function fetchSiteUsageData(domain) {
    // Gerçek uygulamada backend'den veri çekme kodu
    // API çağrısı veya yerel depolama erişimi
    
    // Örnek test değerleri
    kullanılangünlükzaman = 8100000; // 2 saat 15 dakika
    toplamgünlükzaman = 10800000;    // 3 saat
    
    updateProgressCircle(kullanılangünlükzaman, toplamgünlükzaman);
}

// Ayarlar sayfasını aç
function openSettings(e) {
    if (e) e.preventDefault();
    // Use Chrome extension API to open options page
    chrome.runtime.openOptionsPage();
}

// İstatistikler sayfasını aç
function openStats(e) {
    if (e) e.preventDefault();
    window.open('settings.html#dashboard', '_blank');
}

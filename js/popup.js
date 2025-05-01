// Örnek süre değerleri (gerçek uygulamada burası backend'den gelecek)
let kullanılangünlükzaman = 8100000; // 2 saat 15 dakika (ms cinsinden)
let toplamgünlükzaman = 10800000;   // 3 saat (ms cinsinden)

document.addEventListener('DOMContentLoaded', function() {
    // Başlangıç değerleriyle progress dairesini güncelle
    updateProgressCircle(kullanılangünlükzaman, toplamgünlükzaman);
    
    // Butonlara event listener'lar ekle
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('openSettings').addEventListener('click', openSettings);
    document.getElementById('openStats').addEventListener('click', openStats);
    
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
    
    // Kullanılan süre ve kalan süre metinlerini güncelle
    const timeUsedText = msToTimeString(usedTime);
    const timeLeftText = msToTimeString(totalTime - usedTime);
    
    document.getElementById('timeUsed').textContent = timeUsedText;
    document.getElementById('timeLeft').textContent = timeLeftText + ' kaldı';
    document.getElementById('siteLimit').textContent = 'Günlük Limit: ' + msToTimeString(totalTime);
}

// Milisaniyeyi okunabilir saat/dakika formatına çevir
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
    console.log(`${minutes} dakika eklendi.`);
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
    // Chrome uzantısı için:
    // chrome.runtime.openOptionsPage();
    window.open('settings.html', '_blank');
}

// İstatistikler sayfasını aç
function openStats(e) {
    if (e) e.preventDefault();
    window.open('settings.html#dashboard', '_blank');
}

document.addEventListener('DOMContentLoaded', function() {
    // Tab switching
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all tabs and contents
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Show corresponding content
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Initialize charts when page loads
    // Most visited sites chart
    const sitesCtx = document.getElementById('sitesChart').getContext('2d');
    
    // Define gradient for chart
    const gradient = sitesCtx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, 'rgba(74, 222, 128, 0.6)');
    gradient.addColorStop(1, 'rgba(74, 222, 128, 0.1)');
    
    const sitesChart = new Chart(sitesCtx, {
        type: 'bar',
        data: {
            labels: ['Facebook', 'YouTube', 'Twitter', 'Instagram', 'Reddit'],
            datasets: [{
                label: 'Saatlik Kullanım',
                data: [5.2, 8.5, 3.1, 4.7, 2.3],
                backgroundColor: [
                    'rgba(66, 103, 178, 0.8)',   // Facebook blue
                    'rgba(255, 0, 0, 0.8)',      // YouTube red
                    'rgba(29, 161, 242, 0.8)',   // Twitter blue
                    'rgba(225, 48, 108, 0.8)',   // Instagram pink
                    'rgba(255, 69, 0, 0.8)'      // Reddit orange
                ],
                borderWidth: 0,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#9ca3af'
                    }
                },
                x: {
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
                    padding: 10
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
});

function addSite() {
    // Site ekleme fonksiyonu
    const url = document.getElementById('siteUrl').value;
    const timeLimit = document.getElementById('timeLimit').value;
    
    if (url && timeLimit) {
        // Burada veritabanına kaydetme işlemi olacak
        
        // UI'a ekle
        const sitesList = document.getElementById('sitesList');
        const newSite = document.createElement('div');
        newSite.className = 'site-item';
        newSite.innerHTML = `
            <div class="site-info">
                <span class="site-url">${url}</span>
                <span class="site-limit">Günlük limit: ${timeLimit} saat</span>
                <span class="site-remaining">Kalan süre: ${timeLimit} saat</span>
            </div>
            <button class="delete-btn" onclick="deleteSite('${url}')"><i class="fas fa-trash"></i></button>
        `;
        sitesList.prepend(newSite);
        
        // Aktif limitlere de ekle
        const activeLimitsList = document.getElementById('activeLimitsList');
        const newActiveLimit = document.createElement('div');
        newActiveLimit.className = 'site-item';
        newActiveLimit.innerHTML = `
            <div class="site-info">
                <span class="site-url">${url}</span>
                <span class="site-remaining">Kalan süre: ${timeLimit} saat</span>
            </div>
            <div class="site-actions">
                <button class="time-btn" onclick="addTime('${url}', 15)">+15dk</button>
                <button class="time-btn" onclick="addTime('${url}', 30)">+30dk</button>
                <button class="time-btn" onclick="addTime('${url}', 60)">+1sa</button>
                <button class="time-btn" onclick="addTime('${url}', 120)">+2sa</button>
                <button class="delete-btn" onclick="removeLimit('${url}')"><i class="fas fa-times"></i></button>
            </div>
        `;
        activeLimitsList.prepend(newActiveLimit);
        
        // Formu temizle
        document.getElementById('siteUrl').value = '';
        document.getElementById('timeLimit').value = '';
    }
}

function deleteSite(url) {
    // Site silme fonksiyonu
    // Burada veritabanından silme işlemi olacak
    
    // UI'dan kaldır
    const siteItems = document.querySelectorAll('.site-item');
    siteItems.forEach(item => {
        if (item.querySelector('.site-url').textContent === url) {
            item.remove();
        }
    });
}

function addTime(url, minutes) {
    // Siteye ek süre ekleme fonksiyonu
    console.log(`${url} sitesine ${minutes} dakika eklendi`);
    // Burada veritabanında süre güncelleme işlemi olacak
    
    // UI güncelleme işlemleri burada yapılacak
    alert(`${url} sitesine ${minutes} dakika eklendi!`);
}

function removeLimit(url) {
    // Siteyi limitlerden kaldırma fonksiyonu
    console.log(`${url} sitesi limitlerden kaldırıldı`);
    // Burada veritabanından limitten kaldırma işlemi olacak
    
    // UI'dan kaldır (sadece aktif limitler listesinden)
    const limitItems = document.querySelectorAll('#activeLimitsList .site-item');
    limitItems.forEach(item => {
        if (item.querySelector('.site-url').textContent === url) {
            item.remove();
        }
    });
}

// Add site button click handler - add this after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('addSiteBtn').addEventListener('click', addSite);
});
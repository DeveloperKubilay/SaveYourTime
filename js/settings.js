document.addEventListener('DOMContentLoaded', function() {
    console.log('Settings.js: DOM loaded');
    
    // Safely initialize the settings page
    initializeSettings();
    
    function initializeSettings() {
        console.log('Initializing settings page');
        
        // Tab switching
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', function() {
                if (this.querySelector('select')) {
                    // Skip if this is the language switcher
                    return;
                }
                
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
        
        // Initialize language dropdown behavior
        initializeLanguageDropdown();
        
        // Initialize charts when page loads
        if (window.Chart) {
            initializeCharts();
        } else {
            console.warn('Chart.js not loaded, cannot initialize charts');
        }
        
        // Listen for language change events to update chart labels
        document.addEventListener('languageChanged', function() {
            console.log('Language changed, reinitializing charts');
            if (window.Chart) {
                initializeCharts();
            }
        });
    }
    
    // Function to handle language dropdown behavior
    function initializeLanguageDropdown() {
        const languageNavItem = document.getElementById('language-nav-item');
        
        if (languageNavItem) {
            languageNavItem.addEventListener('click', function(e) {
                // Only trigger if the click wasn't directly on the select element
                if (e.target.tagName !== 'SELECT') {
                    const languageSelect = document.getElementById('languageSwitcher');
                    languageSelect.focus();
                    
                    // Simulate a click to open the dropdown
                    const event = new MouseEvent('mousedown', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });
                    languageSelect.dispatchEvent(event);
                }
            });
        }
    }
});

function initializeCharts() {
    const sitesCtx = document.getElementById('sitesChart')?.getContext('2d');
    if (!sitesCtx) {
        console.warn('sitesChart canvas not found');
        return;
    }
    
    // Check if chart already exists and destroy it
    if (window.sitesChart instanceof Chart) {
        window.sitesChart.destroy();
    }
    
    // Define gradient for chart
    const gradient = sitesCtx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, 'rgba(74, 222, 128, 0.6)');
    gradient.addColorStop(1, 'rgba(74, 222, 128, 0.1)');
    
    window.sitesChart = new Chart(sitesCtx, {
        type: 'bar',
        data: {
            labels: ['Facebook', 'YouTube', 'Twitter', 'Instagram', 'Reddit'],
            datasets: [{
                label: window.i18n?.t('popup.timeUsed') || 'Time Used',
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
}

// Add site button click handler should be defined globally
window.addSite = function() {
    const url = document.getElementById('siteUrl').value;
    const timeLimit = document.getElementById('timeLimit').value;
    
    if (url && timeLimit) {
        // Add to database (would be implemented)
        
        // Update UI
        const sitesList = document.getElementById('sitesList');
        const newSite = document.createElement('div');
        newSite.className = 'site-item';
        
        const hourText = window.i18n?.t('common.time.hours') || 'hours';
        const dailyLimitText = window.i18n?.t('popup.dailyLimit') || 'Daily Limit';
        const remainingText = window.i18n?.t('settings.sites.remaining') || 'Remaining time';
        
        newSite.innerHTML = `
            <div class="site-info">
                <span class="site-url">${url}</span>
                <span class="site-limit">${dailyLimitText}: ${timeLimit} ${hourText}</span>
                <span class="site-remaining">${remainingText}: ${timeLimit} ${hourText}</span>
            </div>
            <button class="delete-btn" onclick="deleteSite('${url}')"><i class="fas fa-trash"></i></button>
        `;
        sitesList.prepend(newSite);
        
        // Reset form
        document.getElementById('siteUrl').value = '';
        document.getElementById('timeLimit').value = '';
    }
};

window.deleteSite = function(url) {
    // Delete site function
    
    // Remove from UI
    const siteItems = document.querySelectorAll('.site-item');
    siteItems.forEach(item => {
        if (item.querySelector('.site-url').textContent === url) {
            item.remove();
        }
    });
};

window.addTime = function(url, minutes) {
    // Add time function
    console.log(`${url} adding ${minutes} minutes`);
    
    // Show notification
    const addTimeMsg = window.i18n?.t('warn.addTime') || 'added';
    const minutesText = window.i18n?.t('common.time.minutes') || 'minutes';
    alert(`${url} ${addTimeMsg}: ${minutes} ${minutesText}!`);
};

window.removeLimit = function(url) {
    // Remove limit function
    console.log(`${url} removed from limits`);
    
    // Remove from UI (active limits only)
    const limitItems = document.querySelectorAll('#activeLimitsList .site-item');
    limitItems.forEach(item => {
        if (item.querySelector('.site-url').textContent === url) {
            item.remove();
        }
    });
};
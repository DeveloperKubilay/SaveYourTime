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

        // Initialize time template buttons
        initializeTimeTemplates();

        // Add site button click handler
        document.getElementById('addSiteBtn').addEventListener('click', function() {
            const isEditing = document.getElementById('editingSiteId').value !== '';
            if (isEditing) {
                updateSite();
            } else {
                addSite();
            }
        });

        // Cancel edit button click handler
        document.getElementById('cancelEditBtn').addEventListener('click', function() {
            cancelEdit();
        });
        
        // Initialize edit buttons
        initializeEditButtons();
        
        // Initialize delete buttons
        initializeDeleteButtons();
        
        // Initialize reset data button
        initializeResetDataButton();
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

    // Function to initialize time template buttons
    function initializeTimeTemplates() {
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove selected class from all template buttons
                document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('selected'));
                
                // Add selected class to clicked button
                this.classList.add('selected');
                
                // Get hours value from data attribute
                const hours = parseFloat(this.getAttribute('data-hours'));
                
                // Calculate hours and minutes
                const wholeHours = Math.floor(hours);
                const minutes = Math.round((hours - wholeHours) * 60);
                
                // Set values in the input fields
                document.getElementById('timeHours').value = wholeHours;
                document.getElementById('timeMinutes').value = minutes;
            });
        });
    }
    
    // Function to initialize edit buttons
    function initializeEditButtons() {
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const siteId = this.closest('.site-item').getAttribute('data-site-id');
                editSite(siteId);
            });
        });
    }
    
    // Function to initialize delete buttons
    function initializeDeleteButtons() {
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault(); // Prevent default action
                
                const siteItem = this.closest('.site-item');
                const url = siteItem.querySelector('.site-url').textContent;
                deleteSite(url);
            });
        });
    }
    
    // Function to initialize reset data button
    function initializeResetDataButton() {
        const resetDataBtn = document.getElementById('resetDataBtn');
        if (resetDataBtn) {
            resetDataBtn.addEventListener('click', function() {
                if (confirm(window.i18n?.t('settings.general.resetDataConfirm') || 
                           'Tüm kayıtlı veriler silinecektir. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?')) {
                    
                    // Clear local storage data
                    localStorage.clear();
                    
                    // Show confirmation
                    alert(window.i18n?.t('settings.general.dataResetSuccess') || 
                          'Tüm veriler başarıyla sıfırlandı. Sayfayı yenilemek için tamam\'a tıklayın.');
                    
                    // Reload page
                    location.reload();
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

// Add site function
function addSite() {
    const url = document.getElementById('siteUrl').value.trim().toLowerCase();
    const timeHours = parseInt(document.getElementById('timeHours').value) || 0;
    const timeMinutes = parseInt(document.getElementById('timeMinutes').value) || 0;
    
    // Ensure time values are within valid ranges
    const validHours = Math.min(23, Math.max(0, timeHours));
    const validMinutes = Math.min(59, Math.max(0, timeMinutes));
    
    // Convert hours and minutes to total minutes
    const timeLimitMinutes = (validHours * 60) + validMinutes;
    
    if (url && timeLimitMinutes > 0) {
        // Generate a unique ID for the site
        const siteId = url.replace(/[^a-zA-Z0-9]/g, '');
        
        // Check if site already exists - improved check that compares URLs directly
        let siteExists = false;
        const siteItems = document.querySelectorAll('.site-item');
        
        siteItems.forEach(item => {
            const existingUrl = item.querySelector('.site-url').textContent.trim().toLowerCase();
            if (existingUrl === url) {
                siteExists = true;
                // Set this site for editing instead
                document.getElementById('editingSiteId').value = item.getAttribute('data-site-id');
                updateSite();
            }
        });
        
        if (siteExists) {
            return; // Exit the function if we're editing an existing site
        }
        
        // Rest of the function remains the same
        const sitesList = document.getElementById('sitesList');
        const newSite = document.createElement('div');
        newSite.className = 'site-item';
        newSite.setAttribute('data-site-id', siteId);
        
        // Get proper translations directly from DOM elements to ensure we use the displayed language
        const dailyLimitEl = document.querySelector('[data-lang="popup.dailyLimit"]');
        const remainingEl = document.querySelector('[data-lang="settings.sites.remaining"]');
        const hourEl = document.querySelector('[data-lang="common.time.hour"]');
        const hoursEl = document.querySelector('[data-lang="common.time.hours"]');
        const minuteEl = document.querySelector('[data-lang="common.time.minute"]');
        const minutesEl = document.querySelector('[data-lang="common.time.minutes"]');
        
        // Use text content from elements, or fall back to i18n or default values
        const dailyLimitText = dailyLimitEl?.textContent || window.i18n?.t('popup.dailyLimit') || 'Günlük Limit';
        const remainingText = remainingEl?.textContent || window.i18n?.t('settings.sites.remaining') || 'Kalan süre';
        const hourText = hourEl?.textContent || window.i18n?.t('common.time.hour') || 'saat';
        const hoursText = hoursEl?.textContent || window.i18n?.t('common.time.hours') || 'saat';
        const minuteText = minuteEl?.textContent || window.i18n?.t('common.time.minute') || 'dakika';
        const minutesText = minutesEl?.textContent || window.i18n?.t('common.time.minutes') || 'dakika';
        
        // Format the time string properly
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
        
        // Initialize the edit button for this new site
        const newEditBtn = newSite.querySelector('.edit-btn');
        newEditBtn.addEventListener('click', function() {
            editSite(siteId);
        });
        
        // Reset form
        resetSiteForm();
    }
}

// Helper function to format time string
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

// Edit site function
window.editSite = function(siteId) {
    console.log('Editing site:', siteId);  // Debug log
    // Find the site item
    const siteItem = document.querySelector(`.site-item[data-site-id="${siteId}"]`);
    if (siteItem) {
        // Extract data from the site item
        const url = siteItem.querySelector('.site-url').textContent;
        const limitText = siteItem.querySelector('.site-limit').textContent;
        
        // Parse the time limit
        const limitMatch = limitText.match(/[\d\.]+/);
        const timeLimit = limitMatch ? parseFloat(limitMatch[0]) : 0;
        
        // Calculate hours and minutes
        const hours = Math.floor(timeLimit);
        const minutes = Math.round((timeLimit - hours) * 60);
        
        // Set form to edit mode
        document.getElementById('siteUrl').value = url;
        document.getElementById('timeHours').value = hours;
        document.getElementById('timeMinutes').value = minutes;
        document.getElementById('editingSiteId').value = siteId;
        
        // Update UI
        document.getElementById('siteFormTitle').innerHTML = '<i class="fas fa-edit" style="color: #3b82f6; margin-right: 8px;"></i> <span data-lang="settings.sites.editSite">Siteyi Düzenle</span>';
        document.getElementById('addSiteBtn').innerHTML = '<i class="fas fa-save"></i> <span data-lang="common.save">Kaydet</span>';
        document.getElementById('cancelEditBtn').style.display = 'inline-flex';
        document.getElementById('siteFormCard').scrollIntoView({ behavior: 'smooth' });
        
        // Remove any selected template
        document.querySelectorAll('.template-btn').forEach(btn => btn.classList.remove('selected'));
    }
};

// Update site function
function updateSite() {
    const siteId = document.getElementById('editingSiteId').value;
    const url = document.getElementById('siteUrl').value;
    const timeHours = parseInt(document.getElementById('timeHours').value) || 0;
    const timeMinutes = parseInt(document.getElementById('timeMinutes').value) || 0;
    
    // Ensure time values are within valid ranges
    const validHours = Math.min(23, Math.max(0, timeHours));
    const validMinutes = Math.min(59, Math.max(0, timeMinutes));
    
    // Convert hours and minutes to total minutes
    const timeLimitMinutes = (validHours * 60) + validMinutes;
    
    if (url && timeLimitMinutes > 0) {
        // Find the site item
        const siteItem = document.querySelector(`.site-item[data-site-id="${siteId}"]`);
        if (siteItem) {
            // Get proper translations directly from DOM elements to ensure we use the displayed language
            const dailyLimitEl = document.querySelector('[data-lang="popup.dailyLimit"]');
            const remainingEl = document.querySelector('[data-lang="settings.sites.remaining"]');
            const hourEl = document.querySelector('[data-lang="common.time.hour"]');
            const hoursEl = document.querySelector('[data-lang="common.time.hours"]');
            const minuteEl = document.querySelector('[data-lang="common.time.minute"]');
            const minutesEl = document.querySelector('[data-lang="common.time.minutes"]');
            
            // Use text content from elements, or fall back to i18n or default values
            const dailyLimitText = dailyLimitEl?.textContent || window.i18n?.t('popup.dailyLimit') || 'Günlük Limit';
            const remainingText = remainingEl?.textContent || window.i18n?.t('settings.sites.remaining') || 'Kalan süre';
            const hourText = hourEl?.textContent || window.i18n?.t('common.time.hour') || 'saat';
            const hoursText = hoursEl?.textContent || window.i18n?.t('common.time.hours') || 'saat';
            const minuteText = minuteEl?.textContent || window.i18n?.t('common.time.minute') || 'dakika';
            const minutesText = minutesEl?.textContent || window.i18n?.t('common.time.minutes') || 'dakika';
            
            // Format the time string properly
            const timeString = formatTimeString(validHours, validMinutes, hourText, hoursText, minuteText, minutesText);
            
            // Update site information
            siteItem.querySelector('.site-url').textContent = url;
            siteItem.querySelector('.site-limit').innerHTML = `${dailyLimitText}: ${timeString}`;
            siteItem.querySelector('.site-remaining').innerHTML = `${remainingText}: ${timeString}`;
            
            // Update delete button onclick 
            siteItem.querySelector('.delete-btn').setAttribute('onclick', `deleteSite('${url}')`);
            
            // Reset form
            resetSiteForm();
        }
    }
}

// Cancel edit function
function cancelEdit() {
    resetSiteForm();
}

// Reset site form
function resetSiteForm() {
    document.getElementById('siteUrl').value = '';
    document.getElementById('timeHours').value = '';
    document.getElementById('timeMinutes').value = '';
    document.getElementById('editingSiteId').value = '';
    document.getElementById('siteFormTitle').innerHTML = '<i class="fas fa-plus" style="color: var(--primary); margin-right: 8px;"></i> <span data-lang="settings.sites.addNew">Yeni Site Ekle</span>';
    document.getElementById('addSiteBtn').innerHTML = '<i class="fas fa-plus"></i> <span data-lang="settings.sites.add">Ekle</span>';
    document.getElementById('cancelEditBtn').style.display = 'none';
    
    // Remove any selected template
    document.querySelectorAll('.template-btn').forEach(btn => btn.classList.remove('selected'));
}

window.deleteSite = function(url) {
    console.log('Deleting site:', url); // Debug log
    
    // Remove from UI immediately without confirmation
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
        // Here you would also remove from storage/database
    }
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
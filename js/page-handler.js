/**
 * Common page initialization script to avoid CSP inline script violations
 */

// Load i18n first
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Page handler: DOM content loaded');
    
    // Load i18n-loader if not already loaded
    if (!window.SaveYourTime_I18n) {
        console.log('i18n not loaded, attempting to load it');
        try {
            // Import i18n-loader.js
            await import(chrome.runtime.getURL('js/i18n-loader.js'));
            
            // Wait for i18n to be loaded
            if (!window.SaveYourTime_I18n) {
                await new Promise(resolve => {
                    document.addEventListener('i18nLoaded', resolve, { once: true });
                    // Set a timeout in case i18n never loads
                    setTimeout(resolve, 3000);
                });
            }
        } catch (error) {
            console.error('Error loading i18n:', error);
        }
    }
    
    // Now check if i18n is loaded
    if (window.SaveYourTime_I18n) {
        try {
            // Wait for full i18n initialization before showing content
            await initializeTranslations();
            
            // Handle specific page functions
            initializePageSpecificBehavior();
            
            // Listen for language change events
            document.addEventListener('languageChanged', function(e) {
                console.log('Language changed to:', e.detail.language);
                window.SaveYourTime_I18n.translatePage();
                
                // Update any dynamic content after translation
                updateDynamicContent();
            });
        } catch (error) {
            console.error('Error during page initialization:', error);
        }
    } else {
        console.error('i18n not loaded properly');
    }
});

/**
 * Wait for translations to be fully loaded before showing content
 */
async function initializeTranslations() {
    return new Promise(async (resolve) => {
        try {
            // If i18n is already initialized, just use it
            if (window.SaveYourTime_I18n && window.SaveYourTime_I18n.isInitialized) {
                console.log('i18n already initialized');
                resolve();
                return;
            }

            // Get saved language from localStorage
            const savedLang = localStorage.getItem('language') || 'en';
            
            // Ensure languages are loaded
            await window.SaveYourTime_I18n.loadAvailableLanguages();
            
            // Load the saved language
            if (savedLang && window.SaveYourTime_I18n.isLanguageAvailable(savedLang)) {
                console.log(`Loading saved language: ${savedLang}`);
                await window.SaveYourTime_I18n.switchLanguage(savedLang);
            } else {
                console.log('No valid saved language found, using default');
                await window.SaveYourTime_I18n.switchLanguage('en');
            }
            
            // Initialize language switchers
            window.SaveYourTime_I18n.initLanguageSwitchers();
            
            // Mark i18n as fully initialized
            window.SaveYourTime_I18n.isInitialized = true;
            
            // Apply translations immediately
            window.SaveYourTime_I18n.translatePage();
            
            resolve();
        } catch (error) {
            console.error('Error initializing translations:', error);
            resolve(); // Resolve anyway to prevent blocking the page
        }
    });
}

/**
 * Handle any page-specific initialization
 */
function initializePageSpecificBehavior() {
    const pagePath = window.location.pathname;
    
    if (pagePath.includes('warn.html')) {
        // Initialize warn page specifics
        initializeWarnPage();
    } else if (pagePath.includes('settings.html')) {
        // Initialize settings page specifics (like charts)
        if (typeof initializeCharts === 'function') {
            initializeCharts();
        }
    } else if (pagePath.includes('popup.html')) {
        // Initialize popup page
        if (typeof initializePopup === 'function') {
            initializePopup();
        }
    }
}

/**
 * Update any dynamic content after language changes
 */
function updateDynamicContent() {
    const pagePath = window.location.pathname;
    
    if (pagePath.includes('warn.html')) {
        updateWarnPageContent();
    } else if (pagePath.includes('popup.html')) {
        // Update circle and other dynamic elements
        if (typeof updateProgressCircle === 'function' && 
            typeof kullanılangünlükzaman !== 'undefined' && 
            typeof toplamgünlükzaman !== 'undefined') {
            updateProgressCircle(kullanılangünlükzaman, toplamgünlükzaman);
        }
    }
}

/**
 * Initialize elements specific to the warn page
 */
function initializeWarnPage() {
    // Set up any warn.html specific behavior
    setupWarnPageButtons();
}

/**
 * Set up the buttons for the warn page
 */
function setupWarnPageButtons() {
    // These functions are declared globally to be callable from HTML
    window.addTime = function(minutes) {
        console.log(`Adding ${minutes} minutes`);
        
        const message = window.SaveYourTime_I18n ? 
            `${minutes} ${window.SaveYourTime_I18n.t('common.time.minutes')} ${window.SaveYourTime_I18n.t('warn.addTime')}` :
            `${minutes} minutes added`;
            
        alert(message);
        setTimeout(() => window.close(), 1500);
    };

    window.continueAnyway = function() {
        console.log("User chose to continue");
        window.close();
    };

    window.openSettings = function() {
        console.log("Opening settings");
        window.open('settings.html', '_blank');
    };
}

/**
 * Update the warn page content after language change
 */
function updateWarnPageContent() {
    if (!window.SaveYourTime_I18n) return;
    
    // Update site title
    const currentSite = document.getElementById('site-domain')?.textContent || "example.com";
    document.title = currentSite + " - " + window.SaveYourTime_I18n.t('warn.title');
    
    // Update stats text
    const statsText = window.SaveYourTime_I18n.t('warn.dailyStats', {
        totalTime: '3 ' + window.SaveYourTime_I18n.t('common.time.hours') + ' 20 ' + window.SaveYourTime_I18n.t('common.time.minutes')
    });
    
    const statsElement = document.getElementById('daily-stats-text');
    if (statsElement) {
        statsElement.innerHTML = statsText;
    }
    
    // Update time buttons
    const timeButtons = document.querySelectorAll('.time-option-btn span');
    if (timeButtons.length >= 4) {
        timeButtons[0].textContent = "+15 " + window.SaveYourTime_I18n.t('common.time.minutes');
        timeButtons[1].textContent = "+30 " + window.SaveYourTime_I18n.t('common.time.minutes');
        timeButtons[2].textContent = "+1 " + window.SaveYourTime_I18n.t('common.time.hour');
        timeButtons[3].textContent = "+2 " + window.SaveYourTime_I18n.t('common.time.hours');
    }
}

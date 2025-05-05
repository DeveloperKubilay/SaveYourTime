document.addEventListener('DOMContentLoaded', async function() {
    try {
        // First, load available languages
        const languagesResponse = await fetch('../languages/data.json');
        const languagesData = await languagesResponse.json();
        const availableLanguages = languagesData.languages;
        
        // Get saved language or use default (en)
        let selectedLang = "en";
        
        try {
            const { lang } = await chrome.storage.local.get(['lang']);
            selectedLang = lang || "en";
        } catch (chromeError) {
            // Fallback to localStorage if not in extension context
            selectedLang = localStorage.getItem('lang') || "en";
            console.info('Using localStorage for language settings');
        }
        
        // Load the appropriate language file
        const selectedLanguageFile = availableLanguages[selectedLang]?.file || "en.json";
        const langResponse = await fetch(`../languages/${selectedLanguageFile}`);
        window.translations = await langResponse.json();

        // Create global translation functions to replace i18n
        window.t = function(key) {
            return getNestedTranslation(window.translations, key) || key;
        };

        window.formatTime = function(ms) {
            const hours = Math.floor(ms / (1000 * 60 * 60));
            const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
            
            if (hours > 0) {
                return hours + ' ' + (hours === 1 ? t('common.time.hour') : t('common.time.hours')) + 
                       (minutes > 0 ? ' ' + minutes + ' ' + t('common.time.minutes') : '');
            } else {
                return minutes + ' ' + (minutes === 1 ? t('common.time.minute') : t('common.time.minutes'));
            }
        };

        window.translatePage = function() {
            applyTranslations(window.translations);
        };

        // Apply translations to elements with data-lang attributes
        applyTranslations(window.translations);
        
        // Populate language switcher dropdown
        populateLanguageSwitcher(availableLanguages, selectedLang);
        
        // Set up language switching
        setupLanguageSwitcher(availableLanguages);
        
    } catch (error) {
        console.error('Error loading language data:', error);
        fallbackToEnglish();
    }
});

// Apply translations to all elements with data-lang attributes
function applyTranslations(translations) {
    // Handle text content translations
    const elements = document.querySelectorAll('[data-lang]');
    elements.forEach(element => {
        const key = element.getAttribute('data-lang');
        const translation = getNestedTranslation(translations, key);
        
        if (translation) {
            // Check if translation contains special markers
            const hasSpecialFormatting = translation.includes('[hl]') || 
                                         translation.includes('[strong]') || 
                                         translation.includes('<strong>');
            
            if (hasSpecialFormatting) {
                // Process translation text with formatting markers
                let processedHTML = translation;
                // Convert [hl]...[/hl] to <span class="highlight">...</span>
                processedHTML = processedHTML.replace(/\[hl\](.*?)\[\/hl\]/g, '<span class="highlight">$1</span>');
                // Convert [strong]...[/strong] to <strong>...</strong>
                processedHTML = processedHTML.replace(/\[strong\](.*?)\[\/strong\]/g, '<strong>$1</strong>');
                // Set HTML content
                element.innerHTML = processedHTML;
            } else {
                // No special formatting, use innerText to avoid XSS
                element.innerText = translation;
            }
        }
    });
    
    // Rest of the function remains unchanged
    // Handle placeholder translations
    const placeholderElements = document.querySelectorAll('[data-lang-placeholder]');
    placeholderElements.forEach(element => {
        const key = element.getAttribute('data-lang-placeholder');
        const translation = getNestedTranslation(translations, key);
        
        if (translation) {
            element.setAttribute('placeholder', translation);
        }
    });
    
    // Handle title (tooltip) translations
    const titleElements = document.querySelectorAll('[data-lang-title]');
    titleElements.forEach(element => {
        const key = element.getAttribute('data-lang-title');
        const translation = getNestedTranslation(translations, key);
        
        if (translation) {
            element.setAttribute('title', translation);
        }
    });
}

// Get nested translation using dot notation (e.g., "app.name")
function getNestedTranslation(translations, key) {
    const keys = key.split('.');
    let result = translations;
    
    for (const k of keys) {
        if (result && result[k] !== undefined) {
            result = result[k];
        } else {
            return undefined;
        }
    }
    
    return result;
}

// Populate the language switcher dropdown
function populateLanguageSwitcher(availableLanguages, currentLang) {
    const languageSwitcher = document.getElementById('languageSwitcher');
    if (!languageSwitcher) return;
    
    languageSwitcher.innerHTML = '';
    
    Object.keys(availableLanguages).forEach(langCode => {
        const language = availableLanguages[langCode];
        const option = document.createElement('option');
        option.value = langCode;
        option.textContent = `${language.flag} ${language.name}`;
        option.selected = langCode === currentLang;
        languageSwitcher.appendChild(option);
    });
}

// Handle language switching
function setupLanguageSwitcher(availableLanguages) {
    const languageSwitcher = document.getElementById('languageSwitcher');
    if (!languageSwitcher) return;
    
    languageSwitcher.addEventListener('change', async function() {
        const selectedLang = this.value;
        
        try {
            await chrome.storage.local.set({ lang: selectedLang });
        } catch (chromeError) {
            localStorage.setItem('lang', selectedLang);
        }
        
        window.location.reload();
    });
}

// Fallback function when language loading fails
async function fallbackToEnglish() {
    try {
        const langResponse = await fetch('../languages/en.json');
        const translations = await langResponse.json();
        applyTranslations(translations);
    } catch (err) {
        console.error('Failed to load fallback language:', err);
    }
}
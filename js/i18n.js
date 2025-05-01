/**
 * Internationalization (i18n) utility for SaveYourTime
 */

// Only define class if it's not already defined
if (!window.I18n) {
    class I18n {
        constructor() {
            this.translations = {};
            this.defaultLanguage = 'en'; // Default fallback language
            this.currentLanguage = 'en'; // Start with English as default
            this.availableLanguages = {}; // Will be populated from data.json
            this.isInitialized = false; // Track initialization state
        }

        /**
         * Load all available languages from data.json
         * @returns {Promise} - Promise that resolves when languages are loaded
         */
        async loadAvailableLanguages() {
            try {
                console.log('Loading available languages from data.json...');
                const response = await fetch('../languages/data.json');
                if (!response.ok) {
                    throw new Error('Failed to load language data');
                }
                
                const data = await response.json();
                this.availableLanguages = data.languages || {};
                
                // Check if we have English, it's required as fallback
                if (!this.availableLanguages['en']) {
                    console.warn('English language not found in data.json, adding it as fallback');
                    this.availableLanguages['en'] = { name: 'English', flag: 'EN', file: 'en.json' };
                }
                
                console.log('Available languages:', Object.keys(this.availableLanguages));
                return this.availableLanguages;
            } catch (error) {
                console.error('Error loading language data:', error);
                // If data.json fails to load, ensure we at least have English
                this.availableLanguages = {
                    'en': { name: 'English', flag: 'EN', file: 'en.json' }
                };
                console.log('Using fallback languages:', Object.keys(this.availableLanguages));
                return this.availableLanguages;
            }
        }

        /**
         * Check if a language is available
         * @param {string} lang - Language code to check
         * @returns {boolean} - Whether language is available
         */
        isLanguageAvailable(lang) {
            return Boolean(this.availableLanguages[lang]);
        }

        /**
         * Load a language file
         * @param {string} lang - Language code to load
         * @returns {Promise} - Promise that resolves when language is loaded
         */
        async loadLanguage(lang) {
            try {
                // If language is not available, fall back to English
                if (!this.isLanguageAvailable(lang)) {
                    console.warn(`Language ${lang} is not available, falling back to English`);
                    lang = 'en';
                }
                
                // First, make sure default language is loaded as fallback
                if (lang !== this.defaultLanguage && !this.defaultTranslations) {
                    const defaultResponse = await fetch(`../languages/${this.defaultLanguage}.json`);
                    if (defaultResponse.ok) {
                        this.defaultTranslations = await defaultResponse.json();
                        console.log(`Loaded default language (${this.defaultLanguage}) as fallback`);
                    }
                }
                
                // Then, load the requested language
                const fileToLoad = this.availableLanguages[lang]?.file || `${lang}.json`;
                console.log(`Loading language file: ${fileToLoad}`);
                
                const response = await fetch(`../languages/${fileToLoad}`);
                if (!response.ok) {
                    throw new Error(`Failed to load language ${lang} (${fileToLoad})`);
                }
                
                this.translations = await response.json();
                this.currentLanguage = lang;
                localStorage.setItem('language', lang);
                
                // If document is ready, translate the page
                if (document.readyState === 'complete' || document.readyState === 'interactive') {
                    this.translatePage();
                } else {
                    document.addEventListener('DOMContentLoaded', () => this.translatePage());
                }
                
                console.log(`Successfully loaded language: ${lang}`);
                return this.translations;
            } catch (error) {
                console.error(`Error loading language ${lang}:`, error);
                // If failed and not already using default, try to load default
                if (lang !== this.defaultLanguage) {
                    return this.loadLanguage(this.defaultLanguage);
                }
                return {}; // Return empty object if everything fails
            }
        }

        /**
         * Get a translation by key
         * @param {string} key - Dot notation key path (e.g. "common.save")
         * @param {object} params - Optional parameters for string interpolation
         * @returns {string} - Translated string
         */
        t(key, params = {}) {
            const keys = key.split('.');
            let value = this.translations;
            
            // Try to get translation from current language
            for (const k of keys) {
                if (value && value[k] !== undefined) {
                    value = value[k];
                } else {
                    // Key not found in current language
                    value = undefined;
                    break;
                }
            }
            
            // If translation not found in current language, try default language
            if (value === undefined && this.defaultTranslations && this.currentLanguage !== this.defaultLanguage) {
                console.warn(`Translation key "${key}" not found in ${this.currentLanguage}, trying default language`);
                value = this.defaultTranslations;
                for (const k of keys) {
                    if (value && value[k] !== undefined) {
                        value = value[k];
                    } else {
                        // Key not found in default language either
                        console.warn(`Translation key "${key}" not found in default language either`);
                        return key; // Return the key as fallback
                    }
                }
            }
            
            if (typeof value === 'string') {
                // Apply parameter replacements if any
                return value.replace(/{{(\w+)}}/g, (match, param) => {
                    return params[param] !== undefined ? params[param] : match;
                });
            }
            
            return value !== undefined ? value : key;
        }

        /**
         * Switch to a new language
         * @param {string} lang - Language code to switch to
         */
        async switchLanguage(lang) {
            console.log(`Switching language to: ${lang}`);
            if (lang === this.currentLanguage && this.translations && Object.keys(this.translations).length > 0) {
                console.log('Language is already set to', lang);
                return;
            }
            
            await this.loadLanguage(lang);
            this.translatePage();
            
            // Update language switchers to reflect the new language
            document.querySelectorAll('#languageSwitcher').forEach(switcher => {
                switcher.value = lang;
            });
            
            // Dispatch an event to notify the app that language has changed
            const event = new CustomEvent('languageChanged', { detail: { language: lang } });
            document.dispatchEvent(event);
            
            console.log(`Language switched to: ${lang}`);
        }

        /**
         * Translate elements with data-i18n attributes on the page
         */
        translatePage() {
            console.log('Translating page elements...');
            
            // Process elements with data-i18n attribute (text content)
            document.querySelectorAll('[data-i18n]').forEach(element => {
                const key = element.getAttribute('data-i18n');
                const translation = this.t(key);
                
                // Check if we have parameters to pass
                const paramsAttr = element.getAttribute('data-i18n-params');
                if (paramsAttr) {
                    try {
                        const params = JSON.parse(paramsAttr);
                        element.textContent = this.t(key, params);
                    } catch (e) {
                        console.error('Invalid data-i18n-params JSON:', paramsAttr, e);
                        element.textContent = translation;
                    }
                } else {
                    element.textContent = translation;
                }
            });
            
            // Handle elements with HTML content
            document.querySelectorAll('[data-i18n-html]').forEach(element => {
                const key = element.getAttribute('data-i18n-html');
                element.innerHTML = this.t(key);
            });
            
            // Handle placeholder attributes
            document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
                const key = element.getAttribute('data-i18n-placeholder');
                element.setAttribute('placeholder', this.t(key));
            });
            
            // Handle title attributes
            document.querySelectorAll('[data-i18n-title]').forEach(element => {
                const key = element.getAttribute('data-i18n-title');
                element.setAttribute('title', this.t(key));
            });

            // Update document title if it has a translation key
            const titleElement = document.querySelector('title[data-i18n]');
            if (titleElement) {
                const titleKey = titleElement.getAttribute('data-i18n');
                document.title = this.t(titleKey);
            }
            
            console.log('Page translation complete.');
        }

        /**
         * Format a time value into human-readable format
         * @param {number} ms - Time in milliseconds
         * @returns {string} - Formatted time string
         */
        formatTime(ms) {
            const hours = Math.floor(ms / (1000 * 60 * 60));
            const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
            
            let result = '';
            
            if (hours > 0) {
                result += `${hours} ${hours === 1 ? this.t('common.time.hour') : this.t('common.time.hours')}`;
                if (minutes > 0) {
                    result += ` ${minutes} ${minutes === 1 ? this.t('common.time.minute') : this.t('common.time.minutes')}`;
                }
            } else {
                result = `${minutes} ${minutes === 1 ? this.t('common.time.minute') : this.t('common.time.minutes')}`;
            }
            
            return result;
        }

        /**
         * Get available languages
         * @returns {Object} - Object of available languages
         */
        getAvailableLanguages() {
            return this.availableLanguages;
        }

        /**
         * Initialize language switcher elements
         */
        initLanguageSwitchers() {
            console.log('Initializing language switchers');
            const languageSwitchers = document.querySelectorAll('#languageSwitcher');
            
            if (languageSwitchers.length === 0) {
                console.log('No language switchers found on the page');
                return;
            }
            
            // Make sure we have languages available
            if (Object.keys(this.availableLanguages).length === 0) {
                console.warn('No languages available yet, deferring language switcher initialization');
                return;
            }
            
            console.log(`Found ${languageSwitchers.length} switchers, populating with ${Object.keys(this.availableLanguages).length} languages`);
            
            languageSwitchers.forEach(switcher => {
                // Clear existing options
                switcher.innerHTML = '';
                
                // Populate language switcher with options from data.json
                Object.entries(this.availableLanguages).forEach(([code, langData]) => {
                    const option = document.createElement('option');
                    option.value = code;
                    option.textContent = langData.name || langData.flag || code.toUpperCase(); // Use full language name instead of just flag
                    if (code === this.currentLanguage) {
                        option.selected = true;
                    }
                    switcher.appendChild(option);
                });
                
                // Add change event listener
                switcher.addEventListener('change', (e) => {
                    const selectedLang = e.target.value;
                    console.log(`Language switcher changed to: ${selectedLang}`);
                    this.switchLanguage(selectedLang);
                });
                
                console.log(`Language switcher initialized with ${switcher.options.length} options`);
            });
        }
    }

    // Create a singleton instance only if it doesn't exist
    if (!window.i18n) {
        window.i18n = new I18n();
    }
}

// DOM ready listener should only be added once
if (!window.i18nInitialized) {
    window.i18nInitialized = true;
    
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM content loaded, initializing i18n');
        
        // Basic setup - detailed initialization happens in page-handler.js
        if (window.i18n && !window.i18n.isInitialized) {
            window.i18n.loadAvailableLanguages().catch(err => {
                console.error('Error loading languages:', err);
            });
        }
    });
}

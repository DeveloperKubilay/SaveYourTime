document.addEventListener('DOMContentLoaded', async function() {
    const availableLanguages = (await (await fetch('../languages/data.json')).json()).languages;
    
    const { lang = "en" } = await chrome.storage.local.get(['lang']);
    
    const langResponse = await fetch(`../languages/${availableLanguages[lang]?.file || "en.json"}`);
    window.translations = await langResponse.json();
    window.formatTime = function (ms,minimum){
        const hours = Math.floor(ms / (1000 * 60 * 60));
        var minutes = Math.max(Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60)), minimum || 0);
        
        if (hours > 0) {
            return hours + window.translations.common.time.hourShort +' ' + (minutes > 0 ? minutes + window.translations.common.time.minutesShort : '');
        } else {
            return minutes + window.translations.common.time.minutesShort;
        }
    }

    window.SendMSG = function(DATA) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const port = chrome.tabs.connect(tabs[0].id, {name: "SaveYourTime"});
            port.postMessage(DATA);
        });
    }
    window.SendMSGA = function(DATA) {
        chrome.runtime.sendMessage({
            action: "relayToContent",
            data: DATA
        }, response => {
            if (chrome.runtime.lastError) {
                console.warn("Mesaj gönderme hatası:", chrome.runtime.lastError.message);
            } else if (response) {
                console.log("Mesaj cevabı:", response);
            }
        });
    }

    applyTranslations(window.translations);
    populateLanguageSwitcher(availableLanguages, lang);
    setupLanguageSwitcher(availableLanguages);
    try{
        window.SAVE_YOUR_TIME_RUN()
    }catch{}
});


document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

function applyTranslations(translations) {
    const elements = document.querySelectorAll('[data-lang]');
    elements.forEach(element => {
        const key = element.getAttribute('data-lang');
        const translation = getNestedTranslation(translations, key);
        
        if (translation) {
            const hasSpecialFormatting = translation.includes('[hl]') || 
                                         translation.includes('[strong]') || 
                                         translation.includes('<strong>');
            
            if (hasSpecialFormatting) {
                let processedHTML = translation;
                processedHTML = processedHTML.replace(/\[hl\](.*?)\[\/hl\]/g, '<span class="highlight">$1</span>');
                processedHTML = processedHTML.replace(/\[strong\](.*?)\[\/strong\]/g, '<strong>$1</strong>');
                element.innerHTML = processedHTML;
            } else {
                element.innerText = translation;
            }
        }
    });
    
    // input'a ne tür yazı yazılcağını belirtir
    const placeholderElements = document.querySelectorAll('[data-lang-placeholder]');
    placeholderElements.forEach(element => {
        const key = element.getAttribute('data-lang-placeholder');
        const translation = getNestedTranslation(translations, key);
        
        if (translation) {
            element.setAttribute('placeholder', translation);
        }
    });
    
    // title değiştirme yapar mouse ile hover yaptığınızda görünür
    const titleElements = document.querySelectorAll('[data-lang-title]');
    titleElements.forEach(element => {
        const key = element.getAttribute('data-lang-title');
        const translation = getNestedTranslation(translations, key);
        
        if (translation) {
            element.setAttribute('title', translation);
        }
    });
}

// common.test yapmaya yarar
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

// Dil seçme menüsüsüne dilleri ekler
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

// Dil seçildiği zaman dili değiştirir
function setupLanguageSwitcher() {
    const languageSwitcher = document.getElementById('languageSwitcher');
    if (!languageSwitcher) return;
    
    languageSwitcher.addEventListener('change', async function() {
        const selectedLang = this.value;
        
        try {
            await chrome.storage.local.set({ lang: selectedLang });

            chrome.runtime.sendMessage({ 
                target: "checkLanguage"
            });
        } catch (chromeError) {
            localStorage.setItem('lang', selectedLang);
        }
        
        window.location.reload();
    });
}


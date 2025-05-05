document.addEventListener('DOMContentLoaded', async function() {
    try {
        await initializePopup();
    } catch (error) {
        console.error("Error initializing popup:", error);
    }
});

async function initializePopup() {
    // Title translation
    document.title = window.t ? window.t('app.name') : 'SaveYourTime';
    
    // Translate static elements
    if (window.translatePage) {
        window.translatePage();
    }
    
    // Get current tab information
    const currentTab = await getCurrentTab();
    if (!currentTab || !currentTab.url) {
        showNoActiveTabInfo();
        return;
    }
    
    // Get website data from storage
    const { Urls = [] } = await chrome.storage.local.get(['Urls']);
    const currentPattern = Urls.find(pattern => 
        currentTab.url.startsWith(pattern.url)
    );
    
    // Update current website section
    updateCurrentSite(currentTab, currentPattern);
    
    // Update other sites list
    updateOtherSites(Urls, currentPattern);
    
    // Add event listeners
    setupEventListeners(currentPattern);
}

async function getCurrentTab() {
    try {
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        return tabs[0];
    } catch (error) {
        console.error("Error getting current tab:", error);
        return null;
    }
}

function showNoActiveTabInfo() {
    document.getElementById('currentSiteName').textContent = window.t ? 
        window.t('common.noActiveTab') : 'No active tab';
    
    // Hide progress and buttons
    document.querySelector('.progress-container').style.display = 'none';
    document.querySelector('.time-actions').style.display = 'none';
}

async function updateCurrentSite(tab, pattern) {
    // Update site name
    const url = new URL(tab.url);
    const domain = url.hostname;
    document.getElementById('currentSiteName').textContent = domain;
    
    // If the site isn't being tracked, show a message
    if (!pattern) {
        document.querySelector('.site-limit').textContent = window.t ? 
            window.t('popup.notTracked') : 'Not tracked';
        document.querySelector('.progress-container').style.display = 'none';
        document.querySelector('.time-actions').style.display = 'none';
        document.querySelector('.site-info').style.textAlign = 'center';
        return;
    }
    
    // Get usage data
    const usage = await window.checkUsage(pattern);
    const totalLimit = pattern.limit || 0;
    
    // If there's no limit set, show 'No limit set' message
    if (!totalLimit) {
        document.querySelector('.site-limit').textContent = window.t ? 
            window.t('popup.noLimitSet') : 'No limit set for this site';
        // Hide progress circle when no limit is set
        document.querySelector('.progress-container').style.display = 'none';
        document.querySelector('.site-info').style.textAlign = 'center';
        document.querySelector('.time-actions').style.display = 'flex'; // Still allow adding time
        return;
    }
    
    // Ensure progress container is shown
    document.querySelector('.progress-container').style.display = 'block';
    document.querySelector('.site-info').style.textAlign = '';
    document.querySelector('.time-actions').style.display = 'flex';
    
    // Update progress circle
    updateProgressCircle(usage, totalLimit);
    
    // Show site limit
    const limitText = window.t ? 
        `${window.t('popup.dailyLimit')}: ${window.formatTime(totalLimit, null, true)}` : 
        `Daily Limit: ${msToTimeString(totalLimit)}`;
    
    document.getElementById('siteLimit').textContent = limitText;
}

async function updateOtherSites(allSites, currentPattern) {
    const siteListEl = document.getElementById('siteList');
    siteListEl.innerHTML = ''; // Clear existing items
    
    // Filter sites (exclude current one and limit to maximum 5)
    const otherSites = allSites
        .filter(site => !currentPattern || site.url !== currentPattern.url)
        .slice(0, 5);
    
    if (otherSites.length === 0) {
        const noSitesDiv = document.createElement('div');
        noSitesDiv.className = 'site-item';
        noSitesDiv.textContent = window.t ? 
            window.t('popup.noOtherSites') : 'No other sites tracked';
        siteListEl.appendChild(noSitesDiv);
        return;
    }
    
    // Create site items
    for (const site of otherSites) {
        const usage = await window.checkUsage(site);
        const siteItem = createSiteItem(site, usage);
        siteListEl.appendChild(siteItem);
    }
}

function createSiteItem(site, usage) {
    const siteUrl = new URL(site.url.startsWith('http') ? site.url : 'https://' + site.url);
    const domain = siteUrl.hostname.replace('www.', '');
    
    const siteItem = document.createElement('div');
    siteItem.className = 'site-item';
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'site-item-name';
    nameDiv.textContent = domain;
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'site-item-time';
    
    // Use short format for time display
    if (window.formatTime) {
        const usedFormatted = window.formatTime(usage, null, true);
        const limitFormatted = window.formatTime(site.limit || 0, null, true);
        timeDiv.textContent = `${usedFormatted} / ${limitFormatted}`;
    } else {
        timeDiv.textContent = `${msToTimeString(usage)} / ${msToTimeString(site.limit || 0)}`;
    }
    
    siteItem.appendChild(nameDiv);
    siteItem.appendChild(timeDiv);
    
    return siteItem;
}

function updateProgressCircle(usedTime, totalTime) {
    // Percentage calculation
    const percentage = totalTime > 0 ? Math.min((usedTime / totalTime) * 100, 100) : 0;
    
    // Calculate time left first to determine color
    const timeLeftMs = totalTime - usedTime;
    
    // Update SVG circle
    const progressCircle = document.getElementById('progressCircle');
    const radius = 40; // From the SVG
    const circumference = 2 * Math.PI * radius;
    
    // Make sure we set the dasharray before the offset for consistent rendering
    progressCircle.style.strokeDasharray = `${circumference}`;
    
    // Calculate offset - ensure it's properly calculated for 100%
    let offset = circumference - (percentage / 100) * circumference;
    
    // Fix for 100% case - ensure it properly covers the full circle
    if (percentage >= 100) {
        offset = 0;
    }
    
    progressCircle.style.strokeDashoffset = offset;
    
    // Update color based on time left and usage percentage - check time left first!
    if (timeLeftMs <= 0 || percentage >= 100) {
        progressCircle.style.stroke = 'var(--red)';
    } else if (percentage >= 75) {
        progressCircle.style.stroke = 'var(--yellow)';
    } else {
        progressCircle.style.stroke = 'var(--primary)';
    }
    
    // Update time text using short format
    const timeUsedText = window.formatTime ? 
        window.formatTime(usedTime, null, true) : 
        msToTimeString(usedTime);
    
    // Handle time left text - avoid showing negative values
    let timeLeftText;
    
    if (timeLeftMs <= 0) {
        timeLeftText = window.t ? window.t('common.time.noTimeLeft') : 'No time left';
    } else {
        timeLeftText = window.formatTime && window.t ? 
            `${window.formatTime(timeLeftMs, null, true)} ${window.t('common.time.left')}` : 
            `${msToTimeString(timeLeftMs)} left`;
    }
    
    document.getElementById('timeUsed').textContent = timeUsedText;
    document.getElementById('timeLeft').textContent = timeLeftText;
}

// Legacy time formatter updated for shorter display
function msToTimeString(ms) {
    const absMs = Math.abs(ms);
    const hours = Math.floor(absMs / (1000 * 60 * 60));
    const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));
    
    // Always show both hours and minutes
    return `${hours}h, ${minutes}m`;
}

function setupEventListeners(currentPattern) {
    // Settings button
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    
    // Additional settings links if they exist
    const openSettingsBtn = document.getElementById('openSettings');
    if (openSettingsBtn) {
        openSettingsBtn.addEventListener('click', openSettings);
    }
    
    const openStatsBtn = document.getElementById('openStats');
    if (openStatsBtn) {
        openStatsBtn.addEventListener('click', openStats);
    }
    
    // Add time buttons
    if (currentPattern) {
        setupTimeButtons(currentPattern);
    }
}

function setupTimeButtons(pattern) {
    // 15 minutes button
    document.getElementById('add15min').addEventListener('click', async function() {
        await addTime(pattern, 15);
    });
    
    // 30 minutes button
    document.getElementById('add30min').addEventListener('click', async function() {
        await addTime(pattern, 30);
    });
    
    // 60 minutes button
    document.getElementById('add60min').addEventListener('click', async function() {
        await addTime(pattern, 60);
    });
}

async function addTime(pattern, minutes) {
    try {
        const msToAdd = minutes * 60 * 1000;
        
        // Get current pattern data
        const { Urls = [] } = await chrome.storage.local.get(['Urls']);
        const updatedUrls = Urls.map(site => {
            if (site.url === pattern.url) {
                return { 
                    ...site, 
                    limit: (site.limit || 0) + msToAdd,
                    limited: false // Reset the limit when adding time
                };
            }
            return site;
        });
        
        // Save updated URLs
        await chrome.storage.local.set({ Urls: updatedUrls });
        
        // Get current usage
        const usage = await window.checkUsage(pattern);
        
        // Find updated pattern
        const updatedPattern = updatedUrls.find(site => site.url === pattern.url);
        
        // Update UI
        updateProgressCircle(usage, updatedPattern.limit);
        
        // Update limit text
        const limitText = window.t ? 
            `${window.t('popup.dailyLimit')}: ${window.formatTime(updatedPattern.limit, null, true)}` : 
            `Daily Limit: ${msToTimeString(updatedPattern.limit)}`;
        
        document.getElementById('siteLimit').textContent = limitText;
        
        // Notify the active tab that time has been added and site should be unlocked
        await notifyTimeAdded(pattern.url, minutes);
        
    } catch (error) {
        console.error("Error adding time:", error);
    }
}

async function notifyTimeAdded(url, minutes) {
    try {
        const tabs = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });
        
        if (tabs[0]) {
            // Send a message to unlock the site and restart timer
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "timeAdded",
                url: url,
                minutes: minutes,
                unlockSite: true  // Explicit flag to unlock the site
            }).catch(err => {
                console.log("Tab may not have content script running, attempting reload");
                
                // If the tab is in a limited state, reload it to restore functionality
                if (tabs[0].url.includes(url)) {
                    chrome.tabs.reload(tabs[0].id);
                }
            });
        }
    } catch (error) {
        console.error("Error sending message to tab:", error);
    }
}

function openSettings(e) {
    if (e) e.preventDefault();
    try {
        // Try to use Chrome extension API first
        chrome.runtime.openOptionsPage();
    } catch (error) {
        // Fallback to opening the settings page directly
        window.open('settings.html', '_blank');
    }
}

function openStats(e) {
    if (e) e.preventDefault();
    window.open('settings.html#dashboard', '_blank');
}

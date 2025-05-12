let kullanılangünlükzaman = 0; 
let toplamgünlükzaman = 0; 
let circleLimited = false;
var url;



window.SAVE_YOUR_TIME_RUN = async function() {

        url = await window.getUrl();

        const data = await window.getUrlData(url.fullurl, true);

        url.pattern = data.Limit?.url;

        const sites = document.getElementById("siteList")
        data.urls.forEach((item) => {
            sites.innerHTML+=`<div class="site-item">
                    <div class="site-item-name">${item.url.replace("https://","").replace("http://","")}</div>
                    <div class="site-item-time">${window.formatTime(item.usage)} / ${window.formatTime(item.limit,1)}</div>
                </div>`
        })
        document.getElementById("currentSiteName").innerText = url.shorturl;

        document.getElementById('settingsBtn').addEventListener('click', function(){
            chrome.runtime.openOptionsPage();
        });

        if (!data.Limit) {
            document.querySelector("div.progress-container").style.display = "none";
            document.querySelector("div.time-actions").style.display = "none";
            document.getElementById("siteLimit").style.fontSize = "1.2em";
            document.getElementById("siteLimit").style.color = "var(--text)";
            document.getElementById("siteLimit").innerText = window.translations.popup.noLimits;
            return;
        }else{

            kullanılangünlükzaman = data.usage || 0;
            toplamgünlükzaman = data.Limit.limit || 0;

            document.getElementById('add15min').addEventListener('click', function() {
                addTime(15);
            });
            document.getElementById('add30min').addEventListener('click', function() {
                addTime(30);
            });
            document.getElementById('add60min').addEventListener('click', function() {
                addTime(60);
            });
            if(kullanılangünlükzaman < 0){
                if(data.Limit.limited){
                    circleLimited = true;
                    toplamgünlükzaman = Math.abs(kullanılangünlükzaman)
                    kullanılangünlükzaman = 0;
                }else {
                    toplamgünlükzaman += Math.abs(kullanılangünlükzaman)
                    kullanılangünlükzaman = 0;
                }
            }
        }
        document.getElementById('siteLimit').textContent = window.translations.popup.dailyLimit +": " +window.formatTime(data.Limit.limit, 1);

        updateProgressCircle(kullanılangünlükzaman, toplamgünlükzaman, circleLimited);
}

var timeaddlimit = false;
async function addTime(minutes) {
    if(timeaddlimit) return;

    timeaddlimit = true;
    
    SendMSG("addTime", {
        minutes: minutes,
        currentpattern: url.pattern
    });

    chrome.tabs.query({active: true, currentWindow: true}, async function(tabs) {
        const curtab = tabs[0];
        const tab = await chrome.tabs.get(curtab.id);
        chrome.tabs.sendMessage(tab.id, {
            target: "addIframe",
            limited: false
        })
    })

    toplamgünlükzaman += minutes * 60 * 1000;
    
    updateProgressCircle(kullanılangünlükzaman, toplamgünlükzaman, circleLimited);


    

    setTimeout(()=>timeaddlimit = false, 200);
}

function updateProgressCircle(usedTime, totalTime, circleLimitedParam) {
    const percentage = circleLimitedParam ? 100 : Math.min((usedTime / totalTime) * 100, 100);

    const progressCircle = document.getElementById('progressCircle');
    const circumference = 2 * Math.PI * 40;
    const offset = circumference - (percentage / 100) * circumference;
    progressCircle.style.strokeDasharray = `${circumference}`;
    progressCircle.style.strokeDashoffset = offset;
    
    if (percentage >= 90) {
        progressCircle.style.stroke = 'var(--red)';
    } else if (percentage >= 75) {
        progressCircle.style.stroke = 'var(--yellow)';
    } else {
        progressCircle.style.stroke = 'var(--primary)';
    }


    document.getElementById('timeUsed').textContent = window.formatTime(usedTime);
    const leftTime = totalTime - usedTime;
    if(leftTime < 0) {
        document.getElementById('timeLeft').textContent = window.translations.popup.timeEnd;
        document.getElementById('timeLeft').style.color = 'var(--yellow)';
    }
    else {
        document.getElementById('timeLeft').textContent =  window.formatTime(leftTime) + " " + window.translations.common.time.left;
        document.getElementById('timeLeft').style.color = 'var(--text)';
    }
    
}

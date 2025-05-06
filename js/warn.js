document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.time-option-btn').forEach(button => {
        button.addEventListener('click', function() {
            const minutes = parseInt(this.getAttribute('data-time'));
            window.parent.postMessage({ 
                type: 'addTime', 
                minutes: minutes 
            }, '*');
        });
    });
    
    const continueButton = document.querySelector('.continue-btn');
    if (continueButton) {
        continueButton.addEventListener('click', function() {
            window.parent.postMessage({ type: 'continue' }, '*');
        });
    }

    const settingsButton = document.querySelector('.settings-btn');
    if (settingsButton) {
        settingsButton.addEventListener('click', function() {
            window.parent.postMessage({ type: 'settings' }, '*');
        });
    }

    window.addEventListener('message', function(event) {
        if (event.data.type === 'initialize') {
            document.getElementById("site-domain").innerText = event.data.domain;
            document.getElementById("daily-stats-text").innerHTML = event.data.dailyStats;
        }
    });
});
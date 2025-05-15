document.addEventListener("DOMContentLoaded", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentUrl = tabs[0].url;

        chrome.storage.local.get(["urls"], (data) => {
            const urls = data.urls || [];
            const getDomainParts = (url) => {
                try {
                    const hostname = new URL(url).hostname;
                    return hostname.split('.');
                } catch {
                    return [];
                }
            };
            
            const currentDomainParts = getDomainParts(currentUrl);
            
            const matchedUrl = urls.find(url => {
                const storedDomainParts = getDomainParts(url.name);
                // Compare domain parts excluding TLD
                return currentDomainParts.length > 1 && 
                       storedDomainParts.length > 1 && 
                       currentDomainParts[currentDomainParts.length - 2] === 
                       storedDomainParts[storedDomainParts.length - 2];
            });            

            if (!matchedUrl) {
                displaySeriesData();
                return;
            }

            // Отримати поточну назву серіалу з контентного скрипта
            chrome.tabs.sendMessage(tabs[0].id, { action: "getSeriesTitle" }, (response) => {
                if (!response || !response.seriesTitle) {
                    displaySeriesData();
                    return;
                }

                const seriesData = matchedUrl.data.find(series => series.name === response.seriesTitle);

                if (seriesData) {
                    displaySeriesData(seriesData);
                } else {
                    displaySeriesData();
                }
            });
        });
    });
});

function displaySeriesData(seriesData = { name: "No series detected", lastEpisode: "" }) {
    document.getElementById("series-title").textContent = seriesData.name;
    document.getElementById("last-episode").textContent = seriesData.lastEpisode ? `Last watched: ${seriesData.lastEpisode}` : "";
}

document.addEventListener('DOMContentLoaded', function() {
  var btn = document.getElementById('settings-btn');
  if (btn) {
    btn.onclick = function() {
      if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.openOptionsPage) {
        browser.runtime.openOptionsPage();
      } else if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open('options.html');
      }
    };
  }
});
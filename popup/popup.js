document.addEventListener("DOMContentLoaded", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentUrl = tabs[0].url;

        chrome.storage.local.get(["urls"], (data) => {
            const urls = data.urls || [];
            const matchedUrl = urls.find(url => new RegExp(url.name.replace(/\*/g, ".*")).test(currentUrl));

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
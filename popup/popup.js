document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get(["seriesTitle", "episodeNumber"], (data) => {
      document.getElementById("series-title").textContent = data.seriesTitle || "No series detected";
      document.getElementById("last-episode").textContent = `Last watched: ${data.episodeNumber || "-"}`;
    });
  });
  
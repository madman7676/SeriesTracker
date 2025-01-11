document.addEventListener("DOMContentLoaded", () => {
    const settingsList = document.getElementById("settings-list");
    const localDataList = document.getElementById("local-data-list");
    const urlPatternInput = document.getElementById("url-pattern");
    const seriesXPathInput = document.getElementById("series-xpath");
    const episodeXPathInput = document.getElementById("episode-xpath");

    // Завантажити існуючі налаштування
    chrome.storage.local.get(["settings"], (data) => {
        const settings = data.settings || [];
        displaySettings(settings);
    });

    // Зберегти нові налаштування
    document.getElementById("save-settings").addEventListener("click", () => {
        const urlPattern = urlPatternInput.value.trim();
        const seriesXPath = seriesXPathInput.value.trim();
        const episodeXPath = episodeXPathInput.value.trim();

        if (!urlPattern || !seriesXPath || !episodeXPath) {
            alert("Please fill in all fields.");
            return;
        }

        const newSetting = { urlPattern, seriesXPath, episodeXPath };

        chrome.storage.local.get(["settings"], (data) => {
            const settings = data.settings || [];
            settings.push(newSetting);
            chrome.storage.local.set({ settings }, () => {
                alert("Settings saved!");
                displaySettings(settings);
                // Очищення полів після збереження
                urlPatternInput.value = "";
                seriesXPathInput.value = "";
                episodeXPathInput.value = "";
            });
        });
    });

    // Відобразити налаштування
    function displaySettings(settings) {
        settingsList.innerHTML = ""; // Очистити список
        localDataList.innerHTML = ""; // Очистити список локальних даних

        if (settings.length === 0) {
            settingsList.innerHTML = `<p>There are no saved settings for the current moment.</p>`;
            return;
        }

        settings.forEach((setting, index) => {
            const listItem = document.createElement("li");
            listItem.innerHTML = `
                <strong>URL Pattern:</strong> ${setting.urlPattern}<br />
                <strong>Series XPath:</strong> ${setting.seriesXPath}<br />
                <strong>Episode XPath:</strong> ${setting.episodeXPath}<br />
                <button data-index="${index}" class="edit-btn">Edit</button>
                <button data-index="${index}" class="delete-btn">Delete</button>
            `;
            settingsList.appendChild(listItem);

            // Отримати та відобразити локальні дані для кожного збереженого елемента
            chrome.storage.local.get(["seriesTitle", "episodeNumber"], (data) => {
                const seriesTitle = data.seriesTitle || "No series detected";
                const episodeNumber = data.episodeNumber || "-";
                const localDataItem = document.createElement("li");
                localDataItem.textContent = `${seriesTitle} --- ${episodeNumber}`;
                localDataList.appendChild(localDataItem);
            });
        });

        // Додати обробники для кнопок редагування та видалення
        document.querySelectorAll(".edit-btn").forEach((button) => {
            button.addEventListener("click", (e) => {
                const index = e.target.getAttribute("data-index");
                editSetting(index, settings);
            });
        });

        document.querySelectorAll(".delete-btn").forEach((button) => {
            button.addEventListener("click", (e) => {
                const index = e.target.getAttribute("data-index");
                deleteSetting(index, settings);
            });
        });
    }

    // Редагування налаштувань
    function editSetting(index, settings) {
        const setting = settings[index];
        urlPatternInput.value = setting.urlPattern;
        seriesXPathInput.value = setting.seriesXPath;
        episodeXPathInput.value = setting.episodeXPath;

        // Видалити редаговану позицію
        settings.splice(index, 1);
        chrome.storage.local.set({ settings }, () => {
            displaySettings(settings);
        });
    }

    // Видалення налаштувань
    function deleteSetting(index, settings) {
        settings.splice(index, 1);
        chrome.storage.local.set({ settings }, () => {
            displaySettings(settings);
        });
    }
});
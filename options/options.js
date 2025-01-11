document.addEventListener("DOMContentLoaded", () => {
    const settingsContainer = document.getElementById("settings-container");
    const urlPatternInput = document.getElementById("url-pattern");
    const seriesXPathInput = document.getElementById("series-xpath");
    const episodeXPathInput = document.getElementById("episode-xpath");
    const dynamicCheckbox = document.getElementById("dynamic-checkbox");
    const dynamicFields = document.getElementById("dynamic-fields");
    const containerXPathInput = document.getElementById("container-xpath");
    const currentEpisodeXPathInput = document.getElementById("current-episode-xpath");
    const episodeXPathLabel = document.getElementById("episode-xpath-label");

    // Показати або приховати динамічні поля
    dynamicCheckbox.addEventListener("change", () => {
        const isChecked = dynamicCheckbox.checked;
        episodeXPathInput.style.display = isChecked ? "none" : "block";
        episodeXPathLabel.style.display = isChecked ? "none" : "block";
        dynamicFields.style.display = isChecked ? "block" : "none";
    });

    // Завантажити існуючі налаштування
    chrome.storage.local.get(["settings"], (data) => {
        const settings = data.settings || [];
        displaySettings(settings);
    });

    // Зберегти нові налаштування
    document.getElementById("save-settings").addEventListener("click", saveSettings);

    function saveSettings() {
        const urlPattern = urlPatternInput.value.trim();
        const seriesXPath = seriesXPathInput.value.trim();
        const episodeXPath = episodeXPathInput.value.trim();
        const containerXPath = containerXPathInput.value.trim();
        const currentEpisodeXPath = currentEpisodeXPathInput.value.trim();
        const isDynamic = dynamicCheckbox.checked;

        if (!urlPattern || !seriesXPath || (!episodeXPath && !isDynamic)) {
            alert("Please fill in all fields.");
            return;
        }

        const newSetting = {
            urlPattern,
            seriesXPath,
            episodeXPath: isDynamic ? null : episodeXPath,
            containerXPath: isDynamic ? containerXPath : null,
            currentEpisodeXPath: isDynamic ? currentEpisodeXPath : null,
            isDynamic
        };

        chrome.storage.local.get(["settings"], (data) => {
            const settings = data.settings || [];
            settings.push(newSetting);
            chrome.storage.local.set({ settings }, () => {
                alert("Settings saved!");
                displaySettings(settings);
                clearInputs();
            });
        });
    }

    function clearInputs() {
        urlPatternInput.value = "";
        seriesXPathInput.value = "";
        episodeXPathInput.value = "";
        containerXPathInput.value = "";
        currentEpisodeXPathInput.value = "";
        dynamicCheckbox.checked = false;
        dynamicFields.style.display = "none";
        episodeXPathLabel.style.display = "block";
        episodeXPathInput.style.display = "block";
    }

    // Відобразити налаштування
    function displaySettings(settings) {
        settingsContainer.innerHTML = ""; // Очистити список

        if (settings.length === 0) {
            settingsContainer.innerHTML = `<p>There are no saved settings for the current moment.</p>`;
            return;
        }

        settings.forEach((setting, index) => {
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                <h3>URL Pattern: ${setting.urlPattern}</h3>
                <p><strong>Series XPath:</strong> ${setting.seriesXPath}</p>
                ${setting.isDynamic ? `
                    <p><strong>Container XPath:</strong> ${setting.containerXPath}</p>
                    <p><strong>Current episode full XPath:</strong> ${setting.currentEpisodeXPath}</p>
                ` : `
                    <p><strong>Episode XPath:</strong> ${setting.episodeXPath}</p>
                `}
                <button data-index="${index}" class="edit-btn">Edit</button>
                <button data-index="${index}" class="delete-btn">Delete</button>
            `;
            settingsContainer.appendChild(card);

            // Отримати та відобразити локальні дані для кожного збереженого елемента
            chrome.storage.local.get(["urls"], (data) => {
                const urls = data.urls || [];
                const matchedUrl = urls.find(url => url.name === setting.urlPattern);

                if (matchedUrl) {
                    matchedUrl.data.forEach(series => {
                        const seriesData = document.createElement("p");
                        seriesData.textContent = `${series.name} --- Last watched: ${series.lastEpisode}`;
                        card.appendChild(seriesData);
                    });
                }
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
        if (setting.isDynamic) {
            dynamicCheckbox.checked = true;
            episodeXPathLabel.style.display = "none";
            dynamicFields.style.display = "block";
            containerXPathInput.value = setting.containerXPath;
            currentEpisodeXPathInput.value = setting.currentEpisodeXPath;
        } else {
            dynamicCheckbox.checked = false;
            episodeXPathLabel.style.display = "block";
            dynamicFields.style.display = "none";
            episodeXPathInput.value = setting.episodeXPath;
        }

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
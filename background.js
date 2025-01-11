chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
        // Завантажуємо налаштування з локального сховища
        chrome.storage.local.get(["settings"], (data) => {
            const settings = data.settings || [];

            // Перевіряємо, чи URL відповідає хоча б одному з патернів
            const matchedSetting = settings.find((setting) => {
                const urlPattern = new RegExp(setting.urlPattern.replace(/\*/g, ".*"));
                return urlPattern.test(tab.url);
            });

            if (matchedSetting) {
                console.log("URL matched:", tab.url);

                // Надсилаємо повідомлення content.js з відповідними XPath
                chrome.tabs.sendMessage(tabId, {
                    action: "extractData",
                    seriesXPath: matchedSetting.seriesXPath,
                    episodeXPath: matchedSetting.episodeXPath,
                });

                // Не очікуємо на відповідь
            }
        });
    }
});
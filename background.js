chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
        chrome.storage.local.get(["settings"], (data) => {
            const settings = data.settings || [];
            
            const getDomainParts = (url) => {
                try {
                    const hostname = new URL(url).hostname;
                    return hostname.split('.');
                } catch {
                    return [];
                }
            };

            const currentDomainParts = getDomainParts(tab.url);
            
            // Знаходимо відповідні налаштування
            const matchedSetting = settings.find((setting) => {
                const settingDomainParts = getDomainParts(setting.urlPattern);
                return currentDomainParts.length > 1 && 
                       settingDomainParts.length > 1 && 
                       currentDomainParts[currentDomainParts.length - 2] === 
                       settingDomainParts[settingDomainParts.length - 2];
            });

            if (matchedSetting) {
                console.log("URL matched:", tab.url);

                chrome.tabs.sendMessage(tabId, {
                    action: "extractData",
                    seriesXPath: matchedSetting.seriesXPath,
                    episodeXPath: matchedSetting.episodeXPath,
                    urlPattern: matchedSetting.urlPattern
                });
            }
        });
    }
});
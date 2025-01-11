console.log("***Series Tracker installed.");

let seriesXPathGlobal = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extractData") {
        console.log("Awaiting for episode element...");
        seriesXPathGlobal = request.seriesXPath; // Зберегти seriesXPath у глобальну змінну
        waitForElement(request.episodeXPath, 10000) // Чекаємо до 10 секунд
            .then((episodeElement) => {
                console.log("Episode element found:", episodeElement);
                observeElement(episodeElement, request.seriesXPath, request.urlPattern);
                // Початкова перевірка значення епізоду
                checkAndSaveEpisode(episodeElement, request.seriesXPath, request.urlPattern);
            })
            .catch(() => {
                console.error("Episode element not found within the time limit.");
            });
    } else if (request.action === "getSeriesTitle") {
        if (seriesXPathGlobal) {
            const seriesTitle = document.evaluate(
                seriesXPathGlobal,
                document,
                null,
                XPathResult.STRING_TYPE,
                null
            ).stringValue;
            sendResponse({ seriesTitle });
        } else {
            sendResponse({ seriesTitle: null });
        }
    }
});

// Функція для очікування появи елемента
function waitForElement(xpath, timeout = 10000, interval = 100) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const checkExist = () => {
            const element = document.evaluate(
                xpath,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
            ).singleNodeValue;

            if (element) {
                resolve(element); // Елемент знайдено
            } else if (Date.now() - startTime >= timeout) {
                reject(); // Час вичерпано
            } else {
                setTimeout(checkExist, interval); // Повторна перевірка
            }
        };

        checkExist();
    });
}

// Функція для спостереження за змінами в конкретному елементі
function observeElement(element, seriesXPath, urlPattern) {
    const observer = new MutationObserver(() => {
        checkAndSaveEpisode(element, seriesXPath, urlPattern);
    });

    // Налаштувати спостереження лише за змінами вмісту або тексту
    observer.observe(element, {
        childList: true,
        characterData: true,
        subtree: true,
    });

    // Відключити спостереження, коли сторінка закривається
    window.addEventListener("beforeunload", () => {
        observer.disconnect();
    });
}

// Функція для перевірки та збереження значення епізоду
function checkAndSaveEpisode(element, seriesXPath, urlPattern) {
    const seriesTitle = document.evaluate(
        seriesXPath,
        document,
        null,
        XPathResult.STRING_TYPE,
        null
    ).stringValue;

    const episodeRaw = element.textContent || "";
    const episodeNumber = parseInt(episodeRaw.match(/\d+/)?.[0] || "0", 10);

    console.log("Episode number:", episodeNumber);

    if (seriesTitle && episodeNumber) {
        // Отримати збережені дані
        chrome.storage.local.get(["urls"], (data) => {
            const urls = data.urls || [];
            let urlData = urls.find(url => url.name === urlPattern);

            if (!urlData) {
                urlData = { name: urlPattern, data: [] };
                urls.push(urlData);
            }

            let seriesData = urlData.data.find(series => series.name === seriesTitle);

            if (!seriesData) {
                seriesData = { name: seriesTitle, lastEpisode: 0 };
                urlData.data.push(seriesData);
            }

            if (episodeNumber > seriesData.lastEpisode) {
                seriesData.lastEpisode = episodeNumber;
                chrome.storage.local.set({ urls }, () => {
                    console.log("Data saved locally:", urls);
                });
            }
        });
    }
}
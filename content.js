console.log("***Series Tracker installed.");

chrome.runtime.onMessage.addListener((request, sender) => {
    if (request.action === "extractData") {
        console.log("Awaiting for episode element...");
        waitForElement(request.episodeXPath, 10000) // Чекаємо до 10 секунд
            .then((episodeElement) => {
                console.log("Episode element found:", episodeElement);
                observeElement(episodeElement, request.seriesXPath);
                // Початкова перевірка значення епізоду
                checkAndSaveEpisode(episodeElement, request.seriesXPath);
            })
            .catch(() => {
                console.error("Episode element not found within the time limit.");
            });
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
function observeElement(element, seriesXPath) {
    const observer = new MutationObserver(() => {
        checkAndSaveEpisode(element, seriesXPath);
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
function checkAndSaveEpisode(element, seriesXPath) {
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
        // Отримати збережене значення episodeNumber
        chrome.storage.local.get(["episodeNumber"], (data) => {
            const savedEpisodeNumber = parseInt(data.episodeNumber || "0", 10);

            // Надіслати нове значення лише якщо воно більше за збережене
            if (episodeNumber > savedEpisodeNumber) {
                chrome.storage.local.set({ seriesTitle, episodeNumber }, () => {
                    console.log("Data saved locally:", { seriesTitle, episodeNumber });
                });
            }
        });
    }
}
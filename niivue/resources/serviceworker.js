const cacheName = "NiiVueCache_1";
const precachedResources = ["/niivue-vscode/main.js", "/niivue-vscode/index.css", "/niivue-vscode/index.html", "/niivue-vscode/favicon.ico", "/niivue-vscode/register.js", "/niivue-vscode/serviceworker.js"];

async function precache() {
    const cache = await caches.open(cacheName);
    return cache.addAll(precachedResources);
}

self.addEventListener("install", (event) => {
    event.waitUntil(precache());
});

function isCacheable(request) {
    const endings = [".js", ".css", ".html", ".ico"];
    const url = new URL(request.url);
    return endings.some((ending) => url.pathname.endsWith(ending));
}

async function cacheFirstWithRefresh(request) {
    const fetchResponsePromise = fetch(request).then(async (networkResponse) => {
        if (networkResponse.ok) {
            const cache = await caches.open("NiiVueCache_1");
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    });

    return (await caches.match(request)) || (await fetchResponsePromise);
}

self.addEventListener("fetch", (event) => {
    if (isCacheable(event.request)) {
        event.respondWith(cacheFirstWithRefresh(event.request));
    }
});

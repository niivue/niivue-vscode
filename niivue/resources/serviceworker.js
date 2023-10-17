const cacheName = "NiiVueCache_1";
const precachedResources = ["main.js", "index.css", "index.html", "favicon.ico", "register.js", "serviceworker.js"];

async function precache() {
    const cache = await caches.open(cacheName);
    return cache.addAll(precachedResources);
}

self.addEventListener("install", (event) => {
    event.waitUntil(precache());
});

function isCacheable(request) {
    const url = new URL(request.url);
    return !url.pathname.endsWith(".json");
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

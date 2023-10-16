const cacheName = "NiiVueCache_1";
const precachedResources = ["main.js", "index.css", "index.html", "favicon.ico", "register.js", "serviceworker.js", "manifest.json"];

async function precache() {
    const cache = await caches.open(cacheName);
    return cache.addAll(precachedResources);
}

self.addEventListener("install", (event) => {
    event.waitUntil(precache());
});

async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open("NiiVueCache_1");
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        return Response.error();
    }
}

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url)
    if (("/niivue-vscode/" + precachedResources).includes(url.pathname)) {
        event.respondWith(cacheFirst(event.request));
    }
});

// For caching and refreshing the cache

// function isCacheable(request) {
//     const url = new URL(request.url);
//     return !url.pathname.endsWith(".json");
// }

// async function cacheFirstWithRefresh(request) {
//     const fetchResponsePromise = fetch(request).then(async (networkResponse) => {
//         if (networkResponse.ok) {
//             const cache = await caches.open("NiiVueCache_1");
//             cache.put(request, networkResponse.clone());
//         }
//         return networkResponse;
//     });

//     return (await caches.match(request)) || (await fetchResponsePromise);
// }

// self.addEventListener("fetch", (event) => {
//     if (isCacheable(event.request)) {
//         event.respondWith(cacheFirstWithRefresh(event.request));
//     }
// });

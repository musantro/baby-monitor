const APP_NAME = "baby-monitor";
const APP_CACHE = APP_NAME + "-app-cache";
const META_CACHE = APP_NAME + "-meta-cache";
const PUBLIC_FILES = ["./index.html", "./manifest.json", "./favicon.png"];

async function postMessage(message) {
    const clients = await self.clients.matchAll({ type: "window" });
    for (const client of clients) client.postMessage(message);
}

self.addEventListener("message", async (event) => {
    if (event.data === "CHECK-UPDATE") {
        await checkForUpdateAndReplaceAppCache();
        return;
    }
    console.log("Message From Client:", event.data);
});

async function storeOrLoadMetaCache(key, value) {
    try {
        const cache = await caches.open(META_CACHE);
        const request = new Request(`/meta-cache/${key}`);

        if (value === undefined) {
            const response = await cache.match(request);
            return response ? await response.json() : null;
        } else {
            const response = new Response(JSON.stringify(value));
            await cache.put(request, response);
        }
    } catch (err) {
        console.error("Error While Dealing With Meta-Cache:", err);
        return false;
    }
}

async function isUpdateAvailable() {
    try {
        const lastUpdateKey = "last-update";
        const lastUpdateVal = await storeOrLoadMetaCache(lastUpdateKey) ?? "0";

        const response = await fetch(`/api/v1/version`, {
            headers: { "X-Last-Update": lastUpdateVal }, cache: "no-store"
        });
        const data = await response.json();

        if (data.is_updated) await storeOrLoadMetaCache(lastUpdateKey, data.last_update);
        return [data.is_updated, lastUpdateVal > 0];
    } catch (err) {
        console.error("Error While Checking For Update:", err);
        return [false, false];
    }
}

async function checkForUpdateAndReplaceAppCache() {
    const [updateAvailable, shouldNotifyClient] = await isUpdateAvailable();
    if (updateAvailable) {
        await caches.delete(APP_CACHE);
        const cache = await caches.open(APP_CACHE);
        await cache.addAll(PUBLIC_FILES);
        if (shouldNotifyClient) await postMessage("UPDATED");
    }
}

self.addEventListener("activate", (event) => {
    event.waitUntil((async () => await self.clients.claim())());
});

self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(APP_CACHE).then((cache) => cache.addAll(PUBLIC_FILES)));
});

self.addEventListener("fetch", (event) => {
    event.respondWith(caches.open(APP_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;

        const response = await fetch(event.request);
        if (event.request.url.includes(`/${APP_NAME}/`)) cache.put(event.request, response.clone());
        return response;
    }));
});

/* =========================================================
   CropCure service worker — keeps the ~124 MB diagnosis model
   (and the TF.js runtime) in Cache Storage after the first
   download, so later visits load it from disk instead of the
   network. Everything else goes straight to the network.

   If you replace the model files, bump MODEL_CACHE (e.g. -v2)
   so visitors download the new version.
   ========================================================= */
const MODEL_CACHE = 'cropcure-model-v1';
const MODEL_DIR = new URL('model/tfjs_model/', self.registration.scope).pathname;
const TFJS_URL = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        // Drop caches from older model versions
        const keys = await caches.keys();
        await Promise.all(keys
            .filter(k => k.startsWith('cropcure-model-') && k !== MODEL_CACHE)
            .map(k => caches.delete(k)));
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', event => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    const isModelFile = url.origin === self.location.origin && url.pathname.startsWith(MODEL_DIR);
    const isRuntime = url.href === TFJS_URL;
    if (!isModelFile && !isRuntime) return;

    // Cache first: model files never change for a given MODEL_CACHE version
    event.respondWith(cacheFirst(request, event));
});

// The home page's background download and the prerendered model page can ask
// for the same shard at the same time — share one network request per file.
const inflight = new Map();
const MATCH = { ignoreSearch: true, ignoreVary: true };

async function cacheFirst(request, event) {
    const cache = await caches.open(MODEL_CACHE);
    const cached = await cache.match(request, MATCH);
    if (cached) return cached;

    let pending = inflight.get(request.url);
    if (!pending) {
        pending = (async () => {
            const response = await fetch(request);
            if (response.ok || response.type === 'opaque') {
                try { await cache.put(request, response.clone()); } catch { /* quota / aborted */ }
            }
            return response;
        })();
        inflight.set(request.url, pending);
        event.waitUntil(pending.catch(() => {}).finally(() => inflight.delete(request.url)));
    }

    const response = await pending;
    return (await cache.match(request, MATCH)) || response.clone();
}

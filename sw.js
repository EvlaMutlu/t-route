// T-Route – çevrimdışı çalışma için service worker
const APP = "tsd-app-v2";
const TILES = "tsd-tiles-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./icon-192.png"];
const LIBS = [
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
];
const TILE_HOSTS = ["server.arcgisonline.com", "tile.opentopomap.org", "tile.openstreetmap.org"];

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const c = await caches.open(APP);
    await Promise.allSettled(SHELL.map(u => c.add(u)));
    await Promise.allSettled(LIBS.map(u => c.add(new Request(u, { mode: "cors" }))));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keep = [APP, TILES];
    for (const k of await caches.keys()) if (!keep.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function cacheFirst(req, name) {
  const c = await caches.open(name);
  const hit = await c.match(req.url);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res.ok) c.put(req.url, res.clone());
    return res;
  } catch (err) {
    return new Response("", { status: 504 });
  }
}

async function networkFirst(req) {
  const c = await caches.open(APP);
  try {
    const res = await fetch(req);
    if (res.ok) c.put(req, res.clone());
    return res;
  } catch (err) {
    return (await c.match(req)) || (await c.match("./index.html")) || new Response("Çevrimdışı", { status: 503 });
  }
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (TILE_HOSTS.some(h => url.hostname.endsWith(h))) { e.respondWith(cacheFirst(req, TILES)); return; }
  if (url.hostname.endsWith("google.com") || url.hostname.endsWith("googleusercontent.com")) return; // Drive / Apps Script: doğrudan ağ
  if (LIBS.includes(req.url)) { e.respondWith(cacheFirst(req, APP)); return; }
  if (url.origin === self.location.origin) { e.respondWith(networkFirst(req)); return; }
});

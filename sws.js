const CACHE = 'pennypilot-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  // Chart.js served via CDN; we cache-on-fetch
];

self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e)=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.map(k=> k!==CACHE ? caches.delete(k) : null)))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e)=>{
  const req = e.request;
  // Try cache first for own assets, then network; for CDN, try network then fallback.
  e.respondWith((async ()=>{
    const url = new URL(req.url);
    if(url.origin === location.origin){
      const cached = await caches.match(req);
      return cached || fetch(req);
    }
    // For CDNs (Chart.js), network-first
    try{
      const res = await fetch(req);
      const cache = await caches.open(CACHE);
      cache.put(req, res.clone());
      return res;
    }catch{
      const cached = await caches.match(req);
      return cached || new Response('/* offline */', {status:200, headers:{'Content-Type':'text/plain'}});
    }
  })());
});

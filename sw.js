const CACHE_NAME = "rehber-atlasi-pwa-v20260422-v5";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./form.html",
  "./kayit.html",
  "./manifest.webmanifest",
  "./sw.js",
  "./vendor/xlsx.full.min.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/splash.png",
  "./icons/splash-iphone-se.png",
  "./icons/splash-iphone-std.png",
  "./icons/splash-iphone-pro-max.png",
  "./icons/splash-ipad-std.png",
  "./icons/splash-ipad-pro-11.png",
  "./icons/splash-ipad-pro-129.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Firebase, API ve CDN isteklerini SW'ye alma
  if (
    url.hostname.includes("firebaseapp.com") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("anthropic.com") ||
    url.hostname.includes("gstatic.com") ||
    url.hostname.includes("cdnjs.cloudflare.com")
  ) {
    return; // SW pass-through
  }

  // HTML sayfaları: Cache First, arka planda güncelle (Stale-While-Revalidate)
  if (request_is_html(event.request)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          const fetchPromise = fetch(event.request).then(response => {
            cache.put(event.request, response.clone());
            return response;
          }).catch(() => cached); // ağ yoksa cache'den dön

          return cached || fetchPromise; // cache varsa hemen ver
        })
      )
    );
    return;
  }

  // Diğer assets: Cache First
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        caches.open(CACHE_NAME).then(c => c.put(event.request, response.clone()));
        return response;
      });
    })
  );
});

function request_is_html(request) {
  return request.headers.get("accept")?.includes("text/html") ||
         request.url.endsWith(".html") ||
         request.url.endsWith("/");
}

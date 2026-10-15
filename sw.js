/*
  sw.js - Minimal Service Worker (v3, AĞ ÖNCELİKLİ)
  --------------------------------------------------
  Amacı: tarayıcının "Ana ekrana ekle"yi sunabilmesi + internet yokken sayfanın açılabilmesi.
  Önceki sürüm "önbellek öncelikli" idi ve index.html'i güncelleme yapsan bile eski haliyle sunabilirdi
  ("hâlâ eski kod çalışıyor" şikayetinin tipik nedeni). Bu sürüm TERSİ yapar: internet varken HER ZAMAN
  sunucudaki güncel dosyayı alır, yalnızca internet yoksa önbelleğe döner.
  Başka sitelere giden istekler (Apps Script API, Google Fonts, Chart.js CDN) ASLA ele alınmaz.
*/
const ONBELLEK = 'panel-v3';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((anahtarlar) => Promise.all(anahtarlar.filter((a) => a !== ONBELLEK).map((a) => caches.delete(a))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const istek = event.request;
  if (istek.method !== 'GET') return;
  if (new URL(istek.url).origin !== self.location.origin) return;   // API / font / CDN: dokunma

  event.respondWith(
    fetch(istek)
      .then((cevap) => {
        if (cevap && cevap.ok) {
          const kopya = cevap.clone();
          caches.open(ONBELLEK).then((c) => c.put(istek, kopya));
        }
        return cevap;
      })
      .catch(() =>
        caches.match(istek, { ignoreSearch: true })
          .then((x) => x || caches.match('/index.html') || caches.match('/'))
      )
  );
});

// Network-first for the app's own files so updates show up right away,
// with the cache as an offline fallback.
const CACHE_NAME = 'lingalokr-v6';
const ASSETS = [
  './',
  'index.html',
  'css/styles.css',
  'js/hangul.js',
  'js/data.js',
  'js/korean_class_words.js',
  'js/examples.js',
  'js/lessons.js',
  'js/strokes.js',
  'js/speaking.js',
  'js/writing.js',
  'js/keyboard.js',
  'js/achievements.js',
  'js/app.js',
  'assets/logo.png',
  'assets/favicon.ico',
  'manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const cacheable = url.origin === location.origin || url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com');
  if (!cacheable) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match('index.html') : undefined)))
  );
});

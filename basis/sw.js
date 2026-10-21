// Service Worker - 缓存应用壳，行情数据不缓存（保持实时）
const CACHE_NAME = 'basis-monitor-v1';
const ASSETS = [
  './',
  './股指期货贴水监测.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 行情API走网络优先，HTML/JS走缓存优先
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // 行情接口永远走网络
  if (url.hostname.includes('eastmoney.com')) return;
  // 静态资源缓存优先
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached || fetch(e.request).then(resp => {
        if (resp.status === 200 && url.origin === location.origin) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return resp;
      })
    )
  );
});

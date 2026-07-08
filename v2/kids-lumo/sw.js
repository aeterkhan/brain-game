/* 백지의 방 키즈 (v2) — Service Worker
   전략: network-first.
   - 온라인이면 항상 서버 최신을 받아 화면에 쓰고 캐시도 갱신
     → 웹에서 배포한 업데이트가 앱을 열 때 그 즉시 반영됩니다.
   - 오프라인이면 마지막으로 캐시된 버전으로 끊김 없이 동작.
   scope 는 이 파일 위치(/v2/kids/) 이하로 한정되어 다른 버전엔 영향이 없습니다. */
const CACHE = 'baekji-kids-lumo-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;                 // POST 등은 그대로 통과
  e.respondWith(
    fetch(req)
      .then((res) => {
        // 같은 출처 정상 응답이면 캐시 갱신(다음 오프라인 대비)
        if (res && res.status === 200 && req.url.indexOf(self.location.origin) === 0) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((r) => r || caches.match('./index.html'))
      )
  );
});

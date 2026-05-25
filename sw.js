// 心情日记 Service Worker - v1
const CACHE_NAME = "mood-diary-v1";
const FILES_TO_CACHE = [
  "./心情日记.html",
  "./manifest.json",
  "./icon.svg"
];

// 安装：预缓存核心文件
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE).catch((err) => {
        console.warn("预缓存部分文件失败:", err);
      });
    })
  );
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// 请求拦截：缓存优先，网络回退
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, clone);
              });
            }
            return response;
          })
          .catch(() => {
            // 完全离线时，对于 HTML 请求返回缓存的主页
            if (event.request.headers.get("accept")?.includes("text/html")) {
              return caches.match("./心情日记.html");
            }
          })
      );
    })
  );
});

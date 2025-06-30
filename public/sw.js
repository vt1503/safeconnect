const CACHE_NAME = "safeconnect-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/favicon.ico",
  "/logosc.png",
  "/logoapp.png",
  "/bolttag/black_circle_360x360.png",
  "/bolttag/white_circle_360x360.png",
  "/bolttag/poweredbybolt.png",
  "/i18n/vi.json",
  "/i18n/en.json",
];

const AUDIO_ASSETS = [
  "/sounds/like.mp3",
  "/sounds/delete.mp3",
  "/sounds/postdone.mp3",
  "/sounds/pop.wav",
  "/sounds/sendsound.mp3",
];

// Install: Pre-cache static assets and audio files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        // Cache static assets
        const staticCache = cache.addAll(STATIC_ASSETS);
        // Cache audio files
        const audioCache = cache.addAll(AUDIO_ASSETS);
        return Promise.all([staticCache, audioCache]);
      })
      .catch(() => {})
  );
  self.skipWaiting();
});

// Activate: Clear old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache static + i18n JSON + audio files (network-first, fallback cache)
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isStatic = STATIC_ASSETS.includes(url.pathname);
  const isI18n =
    url.pathname.startsWith("/i18n/") && url.pathname.endsWith(".json");
  const isAudio = AUDIO_ASSETS.includes(url.pathname);

  if (isStatic || isI18n || isAudio) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response.clone()).catch(() => {});
            });
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
});

// Push Notification
self.addEventListener("push", (event) => {
  const options = {
    body: event.data
      ? event.data.text()
      : "Bạn có thông báo mới từ SafeConnect",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      { action: "explore", title: "Xem chi tiết" },
      { action: "close", title: "Đóng" },
    ],
  };
  event.waitUntil(self.registration.showNotification("SafeConnect", options));
});

// Notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  let url = "/";
  if (event.action === "explore") url = "/map";
  event.waitUntil(clients.openWindow(url));
});

// Background Sync (placeholder)
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-sos") {
    event.waitUntil(Promise.resolve());
  }
});

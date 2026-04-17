const CACHE_NAME = "meu-treino-v2";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

// Instalação - Cache dos arquivos estáticos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Cache aberto");
      return cache.addAll(APP_SHELL).catch((err) => {
        console.log("Erro ao adicionar ao cache:", err);
      });
    })
  );
  self.skipWaiting();
});

// Ativação - Limpeza de caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("Removendo cache antigo:", key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => {
      console.log("Service Worker ativado");
      return self.clients.claim();
    })
  );
});

// Fetch - Estratégia Network First com fallback para cache
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a requisição foi bem sucedida, salva no cache
        if (response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, copy);
          });
        }
        return response;
      })
      .catch(() => {
        // Se falhar, tenta pegar do cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Se não tiver no cache, retorna uma página offline
          return caches.match("/index.html");
        });
      })
  );
});

// Notificação de atualização disponível
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
const CACHE_NAME = 'juventud-2.0-v2';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './app.png',
    './titulo.png',
    './logo.png' // Incluí logo.png por si decidiste usar ese nombre en lugar de titulo.png
];

// Instalación del Service Worker y guardado en caché
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache abierto');
                return cache.addAll(urlsToCache);
            })
            .catch(err => console.log('Error cacheando:', err))
    );
    self.skipWaiting();
});

// Activación y limpieza de cachés antiguas
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Eliminando caché antigua:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Estrategia de red: Cache primero, luego red
self.addEventListener('fetch', (event) => {
    // Solo interceptar peticiones GET
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Si el archivo está en caché, lo devolvemos
                if (response) {
                    return response;
                }

                // Si no está en caché, lo pedimos a la red
                return fetch(event.request)
                    .then((response) => {
                        // Verificamos que la respuesta sea válida
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clonamos la respuesta para guardarla en caché
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Si falla la red y es un documento, mostramos el index principal
                        if (event.request.destination === 'document') {
                            return caches.match('./index.html');
                        }
                    });
            })
    );
});

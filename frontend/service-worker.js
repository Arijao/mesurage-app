/**
 *  SERVICE WORKER - BEHAVANA PWA
 * Stratégie : Cache First avec fallback réseau
 * Version : 1.0.0
 */

const CACHE_NAME = 'behavana-v1.0.0';
const CACHE_URLS = [
    './',
    './index.html',
    './styles.css',
    './manifest.json',
    // Ajouter vos autres fichiers CSS/JS si séparés
];

// Fonts et ressources externes
const EXTERNAL_CACHE_NAME = 'behavana-external-v1';
const EXTERNAL_URLS = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
    'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
];

// Données utilisateur (IndexedDB ne peut pas être mise en cache, mais on peut précharger l'interface)
const DATA_CACHE_NAME = 'behavana-data-v1';

/**
 *  INSTALLATION - Mise en cache initiale
 */
self.addEventListener('install', (event) => {
    console.log('[SW]  Installation du Service Worker...');
    
    event.waitUntil(
        Promise.all([
            // Cache principal
            caches.open(CACHE_NAME).then((cache) => {
                console.log('[SW] Mise en cache des fichiers principaux');
                return cache.addAll(CACHE_URLS);
            }),
            // Cache externe
            caches.open(EXTERNAL_CACHE_NAME).then((cache) => {
                console.log('[SW] Mise en cache des ressources externes');
                return cache.addAll(EXTERNAL_URLS).catch(err => {
                    console.warn('[SW]  Certaines ressources externes n\'ont pas pu être mises en cache', err);
                });
            })
        ]).then(() => {
            console.log('[SW]  Installation terminée - activation immédiate');
            return self.skipWaiting(); // Active immédiatement le nouveau SW
        })
    );
});

/**
 *  ACTIVATION - Nettoyage des anciens caches
 */
self.addEventListener('activate', (event) => {
    console.log('[SW]  Activation du Service Worker...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Supprimer les anciens caches
                    if (cacheName !== CACHE_NAME && 
                        cacheName !== EXTERNAL_CACHE_NAME && 
                        cacheName !== DATA_CACHE_NAME) {
                        console.log('[SW] 🗑️ Suppression ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[SW]  Activation terminée - contrôle de tous les clients');
            return self.clients.claim(); // Prend le contrôle de tous les clients
        })
    );
});

/**
 *  FETCH - Interception des requêtes
 * Stratégie : Cache First (Cache d'abord, puis réseau)
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Ignorer les requêtes non-GET
    if (request.method !== 'GET') {
        return;
    }
    
    // Ignorer les requêtes Chrome extensions
    if (url.protocol === 'chrome-extension:') {
        return;
    }
    
    // Ne jamais mettre en cache l'API : le backend local est toujours disponible,
    // les données doivent toujours être fraîches, jamais figées dans le cache
    if (url.pathname.startsWith('/api/')) {
        return;
    }
    
    // Stratégie spéciale pour les fonts Google
    if (url.origin === 'https://fonts.googleapis.com' || 
        url.origin === 'https://fonts.gstatic.com') {
        event.respondWith(cacheFirstStrategy(request, EXTERNAL_CACHE_NAME));
        return;
    }
    
    // Stratégie Cache First pour tous les autres fichiers
    event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
});

/**
 *  Stratégie Cache First
 * Cherche d'abord dans le cache, puis sur le réseau
 */
async function cacheFirstStrategy(request, cacheName) {
    try {
        // 1. Chercher dans le cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('[SW] 📦 Fichier servi depuis le cache:', request.url);
            
            // En arrière-plan, mettre à jour le cache si connecté
            updateCache(request, cacheName);
            
            return cachedResponse;
        }
        
        // 2. Si pas dans le cache, chercher sur le réseau
        console.log('[SW] 🌐 Fichier récupéré depuis le réseau:', request.url);
        const networkResponse = await fetch(request);
        
        // Mettre en cache la réponse réseau
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.error('[SW]  Erreur lors de la récupération:', request.url, error);
        
        // Fallback : retourner une page d'erreur offline
        if (request.destination === 'document') {
            return caches.match('./index.html');
        }
        
        // Pour les autres ressources, retourner une réponse vide
        return new Response('', { status: 408, statusText: 'Offline' });
    }
}

/**
 *  Mise à jour du cache en arrière-plan
 */
async function updateCache(request, cacheName) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
            console.log('[SW] 🔄 Cache mis à jour:', request.url);
        }
    } catch (error) {
        // Silencieux : pas grave si la mise à jour échoue
    }
}

/**
 * Messages du client
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[SW] ⏩ Skip waiting demandé');
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        console.log('[SW] 🗑️ Nettoyage du cache demandé');
        event.waitUntil(
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            })
        );
    }
});

/**
 * Notifications Push (optionnel - pour futures fonctionnalités)
 */
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: './icons/icon-192x192.png',
            badge: './icons/icon-72x72.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: 1
            }
        };
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

/**
 *  Clic sur notification
 */
self.addEventListener('notificationclick', (event) => {
    console.log('[SW]  Notification cliquée');
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});

console.log('[SW] 📱 Service Worker chargé et prêt');

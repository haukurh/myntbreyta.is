const version = 'v0.0.12';

const addResourcesToCache = async (resources) => {
  const cache = await caches.open(version);
  await cache.addAll(resources);
};

const putInCache = async (request, response) => {
  if (request.method === 'GET' && response.ok && !response.redirected) {
    const cache = await caches.open(version);
    await cache.put(request, response);
  }
};

const cacheFirst = async ({ request, preloadResponsePromise, fallbackUrl }) => {
  // First try to get the resource from the cache
  const cache = await caches.open(version);
  const responseFromCache = await cache.match(request, { ignoreSearch: true });

  if (responseFromCache && ['default', 'force-cache'].includes(request.cache)) {
    const expiresHeader = responseFromCache.headers.get('expires');
    if (
      expiresHeader === null ||
      (expiresHeader !== null && new Date() < new Date(expiresHeader))
    ) {
      preloadResponsePromise
        .then((response) => {
          if (response) {
            putInCache(request, response.clone());
          } else {
            fetch(request)
              .then((response) => {
                if (response) {
                  putInCache(request, response.clone());
                }
              })
              .catch(() => {});
          }
        })
        .catch(() => {});
      return responseFromCache;
    }
  }

  // Next try to use the preloaded response, if it's there
  const preloadResponse = await preloadResponsePromise.catch(() => {});
  if (preloadResponse) {
    putInCache(request, preloadResponse.clone());
    return preloadResponse;
  }

  // Next try to get the resource from the network
  try {
    const responseFromNetwork = await fetch(request);
    // response may be used only once
    // we need to save clone to put one copy in cache
    // and serve second one
    putInCache(request, responseFromNetwork.clone());
    return responseFromNetwork;
  } catch (error) {
    if (responseFromCache) {
      console.warn('Network error unable to fetch resource, using from cache');
      return responseFromCache;
    }
    return new Response('Network error happened', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
};

const enableNavigationPreload = async () => {
  if (self.registration.navigationPreload) {
    // Enable navigation preloads!
    await self.registration.navigationPreload.enable();
  }
};

const clearCaches = async () => {
  console.log('clearing all caches');
  await caches.keys().then((cacheNames) => {
    cacheNames.forEach((cacheName) => {
      if (version !== cacheName) {
        caches.delete(cacheName);
      }
    });
  });
};

self.addEventListener('activate', (event) => {
  event.waitUntil(enableNavigationPreload());
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    clearCaches(),
    addResourcesToCache(['/', '/currency-rates.json']),
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    cacheFirst({
      request: event.request,
      preloadResponsePromise: event.preloadResponse,
    }).catch((e) => console.warn('Something went really wrong', { error: e })),
  );
});

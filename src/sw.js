const version = 'RELEASE_VERSION';

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

const cacheIsFresh = (response) => {
  if (response === undefined) {
    console.debug('No response found in cache', response);
    return false;
  }

  const responseDate = response.headers.get('date');
  const cacheControl = response.headers.get('cache-control');

  if (cacheControl !== null && cacheControl.includes('no-cache')) {
    console.debug('Cache control: no-cache', response);
    return false;
  }

  if (responseDate !== null && cacheControl !== null) {
    const documentDate = new Date(responseDate);
    const match = cacheControl.match(/max-age=(\d+)/);
    const maxAge = match === null ? 0 : Number(match[1]);
    documentDate.setSeconds(documentDate.getSeconds() + maxAge);
    if (new Date() < documentDate) {
      console.debug(
        'Is cache based on cache-control header + document date',
        response,
      );
      return true;
    }
  }

  const expiresHeader = response.headers.get('expires');
  if (expiresHeader !== null && new Date() < new Date(expiresHeader)) {
    console.debug('Is cache based on expires header', response);
    return true;
  }

  // Defaults to false, relaying on explicit cache control headers
  console.debug('Cache should not be used', response);
  return false;
};

const requestAcceptsCache = (request) => {
  return ['default', 'force-cache'].includes(request.cache);
};

const cacheFirst = async ({ request, preloadResponsePromise, fallbackUrl }) => {
  // First try to get the resource from the cache
  const cache = await caches.open(version);
  const cachedResponse = await cache.match(request, { ignoreSearch: true });

  if (requestAcceptsCache(request) && cacheIsFresh(cachedResponse)) {
    return cachedResponse;
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
    if (cachedResponse) {
      console.warn('Network error unable to fetch resource, using from cache');
      return cachedResponse;
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

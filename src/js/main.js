const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register(
                '/sw.js',
                {
                    scope: '/',
                }
            );
            if (registration.installing) {
                console.log('Service worker installing');
            } else if (registration.waiting) {
                console.log('Service worker installed');
            } else if (registration.active) {
                console.log('Service worker active');
            }
        } catch (error) {
            console.error(`Registration failed with ${error}`);
        }
    }
};

const unregisterServiceWorker = async () => {
    return new Promise((resolve, reject) => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration('/')
                .then((registration) => {
                    if (registration) {
                        registration.unregister()
                            .then((result) => {
                                if (result) {
                                    console.log('Service worker unregistered!');
                                    resolve(result);
                                } else {
                                    console.warn('Unable to unregister service worker');
                                    reject(result);
                                }
                            })
                            .catch((e) => {
                                console.error('Error when unregistering service worker', {
                                    error: e,
                                });
                                reject(e);
                            });
                    } else {
                        console.warn('No service worker registration available!');
                        reject();
                    }
                });
        }
    });
};

registerServiceWorker();

const popularList = ['AUD', 'USD', 'GBP', 'SEK', 'EUR', 'THB'];

const db = {
    get: (key) => JSON.parse(window.localStorage.getItem(key)),
    set: (key, value) => window.localStorage.setItem(key, JSON.stringify(value)),
    remove: (key) => window.localStorage.removeItem(key),
    clear: () => window.localStorage.clear(),
    keys: {
        USER_SELECTED_CURRENCIES: 'userSelectedCurrencies',
        CURRENCIES: 'currencies',
        CURRENT: 'current',
        UPDATED_AT: 'updatedAt',
        NUMBER_FORMAT: 'numberFormat',
    },
};

const getUserSelectedCurrencies = () => {
    const key = db.keys.USER_SELECTED_CURRENCIES;
    const selected = db.get(key);
    if (!selected) {
        db.set(key, popularList);
        return popularList;
    }
    if (!Array.isArray(selected)) {
        db.remove(key);
        return getUserSelectedCurrencies();
    }
    return selected;
};

const getUserSelectedCurrency = () => {
    const userSelectedCurrencies = getUserSelectedCurrencies();
    const current = db.get(db.keys.CURRENT);
    if (!current) {
        console.log('No currency selected for user, setting default');
        db.set(db.keys.CURRENT, userSelectedCurrencies[0]);
        return userSelectedCurrencies[0];
    }
    if (!userSelectedCurrencies.includes(current)) {
        console.log('Selected currency not available, resetting to first as default');
        db.set(db.keys.CURRENT, userSelectedCurrencies[0]);
        return userSelectedCurrencies[0];
    }
    return current;
};

const updateCurrencies = async (force = false) => {
    if (!navigator.onLine) {
        console.warn('The browser is offline');
    }
    console.log('Fetching currencies');
    const options = {
        method: 'GET',
        credentials: 'omit',
        headers: {
            'accept': 'application/json',
        }
    };
    if (force) {
        options.headers['cache-control'] = 'no-cache';
    }
    await fetch('/currency-rates.json', options)
        .then((response) => {
          db.set(db.keys.UPDATED_AT, response.headers.get('last-modified'));
          return response.json();
        })
        .then((json) => db.set(db.keys.CURRENCIES, json))
        .catch((error) => console.error('Unable to fetch currency data', { error }));
};

const _fetchCurrencies = async () => {
    const key = db.keys.CURRENCIES;
    const stored = db.get(key);
    if (stored) {
        return stored;
    }
    console.log('currencies not set in database, fetching for the first time...');
    await updateCurrencies();
    return db.get(key);
};

const getCurrencies = async (fetchIfStale = true) => {
    const currencies = await _fetchCurrencies();
    if (currencies) {
        let age = (new Date()) - (new Date(currencies.updatedAt));
        // Calculate age from milliseconds to days
        age = age / (1000 * 3600 * 24);
        if (fetchIfStale && age > 1) {
            console.log('Data is older than one day, fetching again...');
            await updateCurrencies(true);
        }
        return await _fetchCurrencies();
    }
    return currencies;
};

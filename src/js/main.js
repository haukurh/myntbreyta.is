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

const localStorage = {
    get: (key) => JSON.parse(window.localStorage.getItem(key)),
    set: (key, value) => window.localStorage.setItem(key, JSON.stringify(value)),
    remove: (key) => window.localStorage.removeItem(key),
    clear: () => window.localStorage.clear(),
    keys: {
        USER_SELECTED_CURRENCIES: 'userSelectedCurrencies',
        CURRENCIES: 'currencies',
        CURRENT: 'current',
        NUMBER_FORMAT: 'numberFormat'
    },
};

const getUserSelectedCurrencies = () => {
    const key = localStorage.keys.USER_SELECTED_CURRENCIES;
    const selected = localStorage.get(key);
    if (!selected) {
        localStorage.set(key, popularList);
        return popularList;
    }
    if (!Array.isArray(selected)) {
        localStorage.remove(key);
        return getUserSelectedCurrencies();
    }
    return selected;
};

const getUserSelectedCurrency = () => {
    const userSelectedCurrencies = getUserSelectedCurrencies();
    const current = localStorage.get(localStorage.keys.CURRENT);
    if (!current) {
        console.log('No currency selected for user, setting default');
        localStorage.set(localStorage.keys.CURRENT, userSelectedCurrencies[0]);
        return userSelectedCurrencies[0];
    }
    if (!userSelectedCurrencies.includes(current)) {
        console.log('Selected currency not available, resetting to first as default');
        localStorage.set(localStorage.keys.CURRENT, userSelectedCurrencies[0]);
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
        .then((response) => response.json())
        .then((json) => localStorage.set(localStorage.keys.CURRENCIES, json))
        .catch((error) => console.error('Unable to fetch currency data', { error }));
};

const _fetchCurrencies = async () => {
    const key = localStorage.keys.CURRENCIES;
    const stored = localStorage.get(key);
    if (stored) {
        return stored;
    }
    console.log('data not set in localStorage, fetching for the first time...');
    await updateCurrencies();
    return localStorage.get(key);
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

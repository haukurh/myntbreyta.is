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

const updateCurrencies = async () => {
    if (!navigator.onLine) {
        console.warn('The browser is offline');
    }
    console.log('Fetching currencies');
    await fetch('/currency-rates.json')
        .then((response) => response.json())
        .then((json) => localStorage.set(localStorage.keys.CURRENCIES, json))
        .catch((error) => console.error('Unable to fetch currency data', { error }));
};

const _fetchCurrencies = async () => {
    const key = localStorage.keys.CURRENCIES;
    const stored = localStorage.get(key);
    if (stored) {
        console.log(stored);
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
            await updateCurrencies();
        }
        return await _fetchCurrencies();
    }
    return currencies;
};

const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
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
      navigator.serviceWorker.getRegistration('/').then((registration) => {
        if (registration) {
          registration
            .unregister()
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

const popularList = [
  'EUR',
  'USD',
  'GBP',
  'SEK',
  'DKK',
  'NOK',
  'AUD',
  'PLN',
  'CHF',
  'CZK',
  'THB',
];

const currencyDescription = {
  EUR: 'evra',
  USD: 'dalur, bandarískur',
  GBP: 'pund, sterlingspund',
  SEK: 'króna, sænsk',
  AUD: 'dalur, ástralskur',
  CHF: 'franki, svissneskur',
  DKK: 'króna, dönsk',
  NOK: 'króna, norsk',
  CZK: 'króna, tékknesk',
  PLN: 'slot',
  THB: 'bat',
};

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
  if (selected) {
    db.remove(key);
  }
  return popularList;
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
    console.log(
      'Selected currency not available, resetting to first as default',
    );
    db.set(db.keys.CURRENT, userSelectedCurrencies[0]);
    return userSelectedCurrencies[0];
  }
  return current;
};

const selector = document.getElementById('currency');
const domestic = document.getElementById('domestic');
const foreign = document.getElementById('foreign');

const NUMBER_FORMAT_1 = 1;
const NUMBER_FORMAT_2 = 2;
const numberFormat =
  db.get(db.keys.NUMBER_FORMAT) !== NUMBER_FORMAT_2
    ? NUMBER_FORMAT_1
    : NUMBER_FORMAT_2;
const group = numberFormat === NUMBER_FORMAT_1 ? '.' : ',';
const decimal = numberFormat === NUMBER_FORMAT_1 ? ',' : '.';

let rate = 1;
let currencies = {};
let currency = 'ISK';

const setSelected = async (currencyCode) => {
  if ((!currencyCode) in currencies) {
    console.warn('Unable to find selected currency, when selecting', {
      currencyCode,
    });
    db.remove(db.keys.CURRENT);
    return;
  }
  currency = currencyCode;
  console.log(`Selecting currency ${currencyCode}`);
  db.set(db.keys.CURRENT, currency);
  document
    .querySelectorAll('.foreign-label')
    .forEach((el) => (el.innerText = currency));
  document.getElementById('foreign-label-description').innerText =
    `(${currencyDescription[currency]})`;
  rate = currencies[currency];
  foreign.value = 1;
  updateDomestic();
};

const getCurrentRate = () => {
  if (!rate) {
    return 0;
  }
  rate = parseFloat(rate);
  return isNaN(rate) ? 0 : rate;
};

const shouldUpdate = (el) => {
  const value = el.value.toString();
  return !(value === '' || [',', '.'].includes(value.trim().slice(-1)));
};

const getFormValue = (el) => {
  const value = Number.parseFloat(
    el.value.toString().replaceAll(group, '').replaceAll(',', '.'),
  );
  return isNaN(value) ? 0 : value;
};

const formatNumber = (number, allowFraction = false) => {
  let maxFraction = number < 100 ? 2 : 0;
  if (allowFraction) {
    maxFraction = 6;
  }
  return new Intl.NumberFormat('is-IS', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFraction,
    trailingZeroDisplay: 'stripIfInteger',
  })
    .formatToParts(number)
    .map((obj) => {
      if (obj.type === 'group') {
        obj.value = group;
      }
      if (obj.type === 'decimal') {
        obj.value = decimal;
      }
      return obj.value;
    })
    .join('');
};

const updateFront = (
  allowDomesticFraction = false,
  allowForeignFraction = false,
) => {
  const domesticValue = getFormValue(domestic);
  if (shouldUpdate(domestic)) {
    domestic.value = formatNumber(domesticValue, allowDomesticFraction);
  }
  const foreignValue = getFormValue(foreign);
  if (shouldUpdate(foreign)) {
    foreign.value = formatNumber(foreignValue, allowForeignFraction);
  }
};

const updateForeign = () => {
  console.log('Updating foreign');
  const value = getFormValue(domestic);
  foreign.value = formatNumber((value / rate).toFixed(2));
  updateFront(true);
};

const updateDomestic = () => {
  console.log('Updating domestic');
  const value = getFormValue(foreign);
  domestic.value = formatNumber((value * rate).toFixed(0));
  updateFront(false, true);
};

const updateSelector = (currencies) => {
  console.log('Running updateSelector');
  const current = getUserSelectedCurrency();
  const userSelectedCurrencies = getUserSelectedCurrencies();
  const selector = document.getElementById('currency');
  selector.innerHTML = '';
  userSelectedCurrencies.forEach((currencyCode) => {
    const option = document.createElement('option');
    option.value = currencyCode;
    option.innerText = currencyCode;
    if (currencyCode === current) {
      option.selected = true;
      setSelected(current);
    }
    selector.appendChild(option);
  });
  return currencies;
};

const selectEverything = (e) => {
  e.target.setSelectionRange(0, e.target.value.length);
};

selector.addEventListener('change', (e) => setSelected(e.target.value));
domestic.addEventListener('change', updateForeign);
domestic.addEventListener('input', updateForeign);
domestic.addEventListener('focus', selectEverything);
foreign.addEventListener('change', updateDomestic);
foreign.addEventListener('input', updateDomestic);
foreign.addEventListener('focus', selectEverything);

fetch('/currency-rates.json')
  .then((response) => {
    const lastModified = response.headers.get('last-modified');
    const el = document.getElementById('currency-date');
    const modifiedAt = new Date(lastModified);
    el.innerText = new Intl.DateTimeFormat(['is-IS', 'en-GB'], {
      dateStyle: 'long',
    }).format(modifiedAt);
    return response.json();
  })
  .then((response) => {
    currencies = response;
    updateSelector();
    updateForeign();
  });

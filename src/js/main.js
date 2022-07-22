
let currencies = [];

const popularList = ['AUD', 'USD', 'EUR', 'THB'];

const selector = document.getElementById('currency');
const domestic = document.getElementById('domestic');
const foreign = document.getElementById('foreign');

const getCurrentRate = () => {
    let rate = document.getElementById('rate').dataset.rate;
    if (!rate) {
        return 0;
    }
    rate = parseFloat(rate);
    return isNaN(rate) ? 0 : rate;
}

const updateForeign = () => {
    const value = getFormValue(domestic);
    setFormValue(foreign, (value / getCurrentRate()).toFixed(2));
};

const updateDomestic = () => {
    const value = getFormValue(foreign);
    setFormValue(domestic, (value * getCurrentRate()).toFixed(2));
};

const setSelected = (currencyCode) => {
    let currency = null;
    const currencies = JSON.parse(window.localStorage.getItem('currencies'));
    if (!currencies) {
        console.warn('No currencies found, when selecting');
        return;
    }
    for (const currenciesKey in currencies.rates) {
        if (currencies.rates[currenciesKey].CurrencyCode === currencyCode) {
            currency = currencies.rates[currenciesKey];
            break;
        }
    }
    if (!currency) {
        console.warn('Unable to find selected currency, when selecting', {
            currencyCode,
        });
        window.localStorage.removeItem('selected');
        return;
    }
    console.log(`Selecting currency ${currencyCode}`);
    window.localStorage.setItem('current', JSON.stringify(currency.CurrencyCode));
    document.getElementById('foreign-label').innerText = currency.CurrencyCode;
    document.getElementById('foreign-label-description').innerText = `(${currency.CurrencyDescription})`;
    document.getElementById('rate').dataset.rate = currency.CurrencyRate;
    updateForeign();
};

const moveCursorToEnd = (e) => {
    setTimeout(function(){
        const end = e.target.value.length;
        e.target.setSelectionRange(end, end);
        e.target.focus();
    }, 0);
};

const getFormValue = (el) => {
    const value = Number.parseFloat(el.value);
    return isNaN(value) ? 0 : value;
};
const setFormValue = (el, value) => {
    el.value = value;
};

const _getUniqueCurrencies = (needle, haystack) => {
    const pool = {};
    haystack
        .filter((rate) => needle.includes(rate.CurrencyCode))
        .forEach((rate) => pool[rate.CurrencyCode] = rate);
    return Object.values(pool);
};

const updateSelector = () => {
    const current = JSON.parse(window.localStorage.getItem('current'));
    const currencies = JSON.parse(window.localStorage.getItem('currencies'));
    const userSelectedCurrencies = JSON.parse(window.localStorage.getItem('userSelectedCurrencies'));
    const selector = document.getElementById('currency');
    if (!userSelectedCurrencies) {
        console.error('No currencies available for selector');
        return;
    }
    selector.innerHTML = '';
    console.log(currencies);
    _getUniqueCurrencies(userSelectedCurrencies, currencies.rates)
        .forEach((rate, index) => {
            const option = document.createElement('option');
            option.value = rate.CurrencyCode;
            option.innerText = rate.CurrencyCode;
            if ((!current && index === 0) || rate.CurrencyCode === current) {
                option.selected = true;
                setSelected(rate.CurrencyCode);
            }
            selector.appendChild(option);
        });
    return '';
}

selector.addEventListener('change', (e) => setSelected(e.target.value));
domestic.addEventListener('change', updateForeign);
domestic.addEventListener('input', updateForeign);
domestic.addEventListener('focus', moveCursorToEnd);
foreign.addEventListener('change', updateDomestic);
foreign.addEventListener('input', updateDomestic);
foreign.addEventListener('focus', moveCursorToEnd);

const updateCurrencies = () => {
    fetch('/currency-rates.json')
        .then((response) => response.text())
        .then((json) => window.localStorage.setItem('currencies', json))
        .then(() => updateSelector())
        .then(() => updateForeign());
};

updateCurrencies();


document.addEventListener('touchmove', (e) => e.preventDefault());

const currencies = {
    popular: {},
    byCurrency: {},
    byCountry: {},
};

const popularList = ['AUD', 'USD', 'EUR', 'THB'];

const selector = document.getElementById('currency');
const domestic = document.getElementById('domestic');
const foreign = document.getElementById('foreign');

const getSelected = () => {
    const value = window.localStorage.getItem('selected');
    if (value === null) {
        console.debug('No currency selected');
        return null;
    }

    try {
        return JSON.parse(value);
    } catch (e) {
        console.error('Unable to parse selected currency', {
            value,
        });
        console.debug('Deleting stored value');
        window.localStorage.removeItem('selected');
        return null;
    }
};

const updateForeign = () => {
    const value = getFormValue(domestic);
    setFormValue(foreign, (value / selected.CurrencyRate).toFixed(2));
};

const updateDomestic = () => {
    const value = getFormValue(foreign);
    setFormValue(domestic, (value * selected.CurrencyRate).toFixed(2));
};

const setSelected = (currencyCode) => {
    if (currencies.byCurrency.hasOwnProperty(currencyCode)) {
        selected = currencies.byCurrency[currencyCode];
        window.localStorage.setItem('selected', JSON.stringify(selected));
        updateForeign();
        console.log(`Selecting currency ${selected.CurrencyCode}`);
        document.getElementById('foreign-label').innerText = selected.CurrencyCode;
        document.getElementById('foreign-label-description').innerText = `(${selected.CurrencyDescription})`;
    } else {
        console.debug(`Currency ${currencyCode} not found`);
        window.localStorage.removeItem('selected');
    }
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


const updateSelector = () => {
    selector.innerHTML = '';
    let selected = getSelected();
    let hasSelected = false;
    const popularGroup = document.createElement('optgroup');
    popularGroup.label = 'Popular';
    Object.values(currencies.popular).forEach((currency, index) => {
        const option = document.createElement('option');
        option.value = currency.CurrencyCode;
        option.innerText = currency.CurrencyCode;
        if ((!hasSelected && selected && selected.CurrencyCode === currency.CurrencyCode) || (!hasSelected && !selected && index === 0)) {
            setSelected(currency.CurrencyCode);
            option.selected = true;
            hasSelected = true;
        }
        popularGroup.appendChild(option);
    });
    selector.appendChild(popularGroup);
    const byCurrencyGroup = document.createElement('optgroup');
    byCurrencyGroup.label = 'By currency';
    Object.values(currencies.byCurrency).sort((a, b) => {
        if (a.CurrencyCode < b.CurrencyCode) {
            return -1;
        }
        if (a.CurrencyCode > b.CurrencyCode) {
            return 1;
        }
        return 0;
    }).forEach((currency) => {
        const option = document.createElement('option');
        option.value = currency.CurrencyCode;
        // option.innerText = `${currency.CurrencyCode}: ${currency.CurrencyDescription}`;
        option.innerText = currency.CurrencyCode;
        if (!hasSelected && selected && selected.CurrencyCode === currency.CurrencyCode) {
            setSelected(currency.CurrencyCode);
            option.selected = true;
            hasSelected = true;
        }
        byCurrencyGroup.appendChild(option);
    });
    selector.appendChild(byCurrencyGroup);
    const byCountryGroup = document.createElement('optgroup');
    byCountryGroup.label = 'By country';
    Object.values(currencies.byCountry).sort((a, b) => {
        if (a.CountryEnglish < b.CountryEnglish) {
            return -1;
        }
        if (a.CountryEnglish > b.CountryEnglish) {
            return 1;
        }
        return 0;
    }).forEach((currency) => {
        const option = document.createElement('option');
        option.value = currency.CurrencyCode;
        // option.innerText = `${currency.CurrencyCode}: ${currency.CurrencyDescription}`;
        option.innerText = currency.CountryEnglish;
        if (!hasSelected && selected && selected.CurrencyCode === currency.CurrencyCode) {
            setSelected(currency.CurrencyCode);
            option.selected = true;
            hasSelected = true;
        }
        byCountryGroup.appendChild(option);
    });
    selector.appendChild(byCountryGroup);
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
        .then((text) => JSON.parse(text))
        .then((data) => {
            currencies.popular = {};
            currencies.byCurrency = {};
            currencies.byCountry = {};
            data.rates.forEach((rate) => {
                if (popularList.includes(rate.CurrencyCode)) {
                    currencies.popular[rate.CurrencyCode] = rate;
                }
                if (rate.CountryCode && rate.CountryEnglish !== 'æ') {
                    currencies.byCountry[rate.CountryCode] = rate;
                }
                currencies.byCurrency[rate.CurrencyCode] = rate;
            });
        })
        .then(() => updateSelector())
        .catch((error) => console.error('Unable to fetch currency data', { error }));
};

updateCurrencies();

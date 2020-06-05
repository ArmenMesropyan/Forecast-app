// Forecast API

const API_ENV = {
    url: 'https://api.openweathermap.org/data/2.5',
    apiKey: '7689330884e1ff40676d8958c66d690d',
};

function checkValue(value) {
    if (!value.lat && !value.lon) return `?q=${value}&appid=${API_ENV.apiKey}&units=metric`;
    return `?lat=${value.lat}&lon=${value.lon}&appid=${API_ENV.apiKey}&units=metric`;
}

async function getForecast(value, type) {
    try {
        const query = checkValue(value);

        const res = await fetch(`${API_ENV.url}/${type}${query}`)
            .then((data) => data.json());
        console.log('res: ', res);
        return res;
    } catch (error) {
        return Promise.reject(error);
    }
}

getForecast('Yerevan', 'weather');
getForecast({ lat: 40.18, lon: 44.51 }, 'weather');

getForecast('Yerevan', 'forecast');
getForecast({ lat: 40.18, lon: 44.51 }, 'forecast');
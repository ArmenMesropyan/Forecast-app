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
        return res;
    } catch (error) {
        return Promise.reject(error);
    }
}

function serializeWeather({
    name,
    dt: date,
    sys: { country },
    main: { temp },
    weather: [weather],
}) {
    const state = {
        name,
        country,
        temp,
        date,
        main: weather.main,
        description: weather.description,
    };
    return state;
}

function serializeForecast({ list }) {
    const res = list.reduce((acc, item) => {
        const date = item.dt_txt.split(' ')[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(item);
        return acc;
    }, {});

    return res;
}

async function init() {
    try {
        const weather = serializeWeather(await getForecast('Yerevan', 'weather'));
        const forecast = serializeForecast(await getForecast({ lat: 40.18, lon: 44.51 }, 'forecast'));
        console.log('weather: ', weather);
        console.log('forecast: ', forecast);
    } catch (error) {
        console.log(error);
    }
}

init();
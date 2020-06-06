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
    coord,
}) {
    const state = {
        name,
        country,
        temp: Math.round(temp),
        date,
        main: weather.main,
        description: weather.description,
        coord,
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

function getApproximateForecast(list) {
    const current = Object.values(list)[0][1];
    const currentHours = current.dt_txt.split(' ')[1];

    const res = Object.values(list).reduce((acc, item) => {
        item.forEach((data) => {
            const [day, hours] = data.dt_txt.split(' ');

            if (hours === currentHours) acc[day] = data;
        });
        return acc;
    }, {});


    return res;
}

// Map API

function initMap(lon, lat) {
    mapboxgl.accessToken = 'pk.eyJ1IjoiYXJtZW5tZXNyb3B5YW4iLCJhIjoiY2tiM21wbng5MGFsZjJ5bzlreG44dDFwNyJ9.vr5iz0Fi9VgpbSJ8kxfS5Q';
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/dark-v10',
        center: [lon, lat],
        zoom: 10,
    });
}

// App initialization

async function onUserGeo(position) {
    try {
        const { latitude, longitude } = position.coords;
        initMap(longitude, latitude);
        const weather = serializeWeather(await getForecast({ lat: latitude, lon: longitude }, 'weather'));
        const forecast = serializeForecast(await getForecast({ lat: latitude, lon: longitude }, 'forecast'));
        const currentForecasts = getApproximateForecast(forecast);
        console.log('forecast: ', forecast);
        console.log('currentForecasts: ', currentForecasts);
        console.log('weather: ', weather);
    } catch (error) {
        console.log(error);
    }
}

function showUserForecast() {
    window.navigator.geolocation.getCurrentPosition(onUserGeo);
}

async function showForecast(val) {
    try {
        const weather = serializeWeather(await getForecast(val, 'weather'));
        const forecast = serializeForecast(await getForecast(val, 'forecast'));
        const currentForecasts = getApproximateForecast(forecast);
        const { lon, lat } = weather.coord;
        initMap(lon, lat);
        console.log('forecast: ', forecast);
        console.log('currentForecasts: ', currentForecasts);
        console.log('weather: ', weather);
    } catch (error) {
        console.log(error);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    showUserForecast();
    const form = document.forms.searchForm;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const { value } = form.elements['country-search'];
        if (!value) showUserForecast();
        else showForecast(value);
    });
});
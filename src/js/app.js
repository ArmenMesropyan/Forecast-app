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
    main: { temp, humidity },
    weather: [weather],
    coord,
}) {
    const state = {
        name,
        country,
        temp: Math.round(temp),
        date,
        main: weather.main,
        humidity,
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
    const arr = Object.values(list);
    const current = arr[0][1] || arr[1][0];
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

function coordsHTMLTemplate({ lat, lon }) {
    return `
        <li class="coords__item coords__item_lat">${lat}</li>
        <li class="coords__item coords__item_lon">${lon}</li>
    `;
}

function weatherHTMLTemplate({
    name,
    country,
    date,
    description,
    humidity,
    temp,
}) {
    return `
        <ul class="current-weather__list">
            <li class="current-weather__item current-date">
                <p class="current-date__day">${date}</p>
                <p class="current-date__date">${date}</p>
            </li>
            <li class="current-weather__item current-main">
                <p class="current-main__name">${name}${country}</p>
                <p class="current-weather__temp">${temp} C</p>
            </li>
            <li class="current-weather__item current-second">
                <p class="current-second__water">${humidity}%</p>
                <p class="current-weather__info">${description}</p>
            </li>
        </ul>
    `;
}

function showCurrentWeather({ coord, ...weather }) {
    const coordsContainer = document.querySelector('.coords__list');
    const currentWeatherContainer = document.querySelector('.current-weather');

    coordsContainer.innerHTML = coordsHTMLTemplate(coord);
    currentWeatherContainer.innerHTML = weatherHTMLTemplate(weather);
}

async function showForecast(val) {
    try {
        let position;
        if (val.coords) {
            const { coords: { latitude, longitude } } = val;
            position = { lat: latitude, lon: longitude };
        }
        const weather = serializeWeather(await getForecast(position || val, 'weather'));
        const forecast = serializeForecast(await getForecast(position || val, 'forecast'));
        const currentForecasts = getApproximateForecast(forecast);
        const { lon, lat } = weather.coord;
        initMap(lon, lat);
        console.log('forecast: ', forecast);
        console.log('currentForecasts: ', currentForecasts);
        console.log('weather: ', weather);
        showCurrentWeather(weather);
    } catch (error) {
        console.log(error);
    }
}

function showUserForecast() {
    window.navigator.geolocation.getCurrentPosition(showForecast);
}

// async function init() {
//     try {
//         // const weather = serializeWeather(await getForecast('Yerevan', 'weather'));
//         // const forecast = serializeForecast(await getForecast({ lat: 40.18, lon: 44.51 }, 'forecast'));
//         // const currentForecasts = getApproximateForecast(forecast);
//         showUserForecast();
//     } catch (error) {
//         console.log(error);
//     }
// }


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
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
    const desc = weather.description.charAt(0).toUpperCase() + weather.description.slice(1);
    const dateOptions = {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
    };
    const dateTimeFormat = new Intl.DateTimeFormat('en', dateOptions);
    const [week, day, hour] = dateTimeFormat.format(date * 1000).split(',');

    const state = {
        name,
        country,
        temp: Math.round(temp),
        day,
        week,
        date,
        hour,
        main: weather.main,
        icon: weather.icon,
        humidity,
        desc,
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
            if (hours === currentHours) acc[day] = serializeWeather(data);
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
    desc,
    humidity,
    temp,
    day,
    week,
}) {
    return `
        <ul class="current-weather__list">
            <li class="current-weather__item current-date">
                <p class="current-date__week">${week}</p>
                <p class="current-date__day">${day}</p>
            </li>
            <li class="current-weather__item current-main">
                <p class="current-main__name">${name}, ${country}</p>
                <p class="current-weather__temp">${temp} C</p>
            </li>
            <li class="current-weather__item current-second">
                <p class="current-second__water">${humidity}%</p>
                <p class="current-weather__info">${desc}</p>
            </li>
        </ul>
    `;
}

function forecastHTMLTemplate(date, {
    desc,
    humidity,
    temp,
    day,
    week,
    icon,
} = {}) {
    return `
        <li class="forecast-list__item day-weather" data-date="${date}">
            <a class="forecast-list__link" href="#hours-forecast">Go to this day hours forecasts</a>
            <ul class="day-weather__list">
                <li class="day-weather__date">
                    ${week} -${day}
                </li>
                <li class="day-weather__info">
                    <img src="http://openweathermap.org/img/w/${icon}.png" alt="${desc}" class="day-weather__img">
                    <p class="day-weather__temp">${temp} &#8451</p>
                    <p class="day-weather__water">${humidity} %</p>
                    <p class="day-weather__desc">${desc}</p>
                </li>
            </ul>
        </li>
    `;
}

function hoursForecastTemplate({
    desc,
    humidity,
    temp,
    day,
    week,
    icon,
    hour,
} = {}) {
    return `
        <li class="hours-forecast__item hour-forecast">
            <ul class="hour-forecast__list">
                <li class="hour-forecast__date">
                    <p class="hour-forecast__week">${week}</p>
                    <p class="hour-forecast__day">${day} - ${hour}</p>
                </li>
                <li class="hour-forecast__info">
                    <img src="http://openweathermap.org/img/w/${icon}.png" alt="" class="hour-forecast__img">
                    <p class="hour-forecast__temp">${temp} C</p>
                    <p class="hour-forecast__water">${humidity} %</p>
                    <p class="hour-forecast__desc">${desc}</p>
                </li>
            </ul>
        </li>
    `;
}

function showCurrentWeather({ coord, ...weather }) {
    const coordsContainer = document.querySelector('.coords__list');
    const currentWeatherContainer = document.querySelector('.current-weather');

    coordsContainer.innerHTML = coordsHTMLTemplate(coord);
    currentWeatherContainer.innerHTML = weatherHTMLTemplate(weather);
}

function clearCurrentForecasts(parent) {
    const elems = parent.querySelectorAll('.day-weather');
    if (!elems) return;
    elems.forEach((elem) => parent.removeChild(elem));
}

function showCurrentForecasts(data) {
    const container = document.querySelector('.forecast-list__list');
    clearCurrentForecasts(container);
    Object.entries(data).forEach(([date, item]) => {
        const html = forecastHTMLTemplate(date, item);
        container.insertAdjacentHTML('beforeend', html);
    });
}

function clearHoursForecasts() {
    const container = document.querySelector('.hours-forecast__list');
    container.innerHTML = '';
}

function showScroll() {
    const scroll = document.querySelector('.scroll-top');
    scroll.classList.add('scroll-top_showed');
}

function showForecasts(data, { target }) {
    showScroll();

    let elem;
    if (!target.classList.contains('day-weather')) elem = target.closest('.day-weather');
    else elem = target;

    const container = document.querySelector('.hours-forecast__list');
    clearHoursForecasts();

    const { date } = elem.dataset;
    const arr = data[date];

    arr.forEach((dayForecast) => {
        const html = hoursForecastTemplate(serializeWeather(dayForecast));
        container.insertAdjacentHTML('beforeend', html);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // showUserForecast();
    const form = document.forms.searchForm;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const { value } = form.elements['country-search'];
        console.log('value: ', value);
        clearHoursForecasts();
        // if (!value) showUserForecast();
        // else showForecast(value);
    });
});
async function fetchWeather(city) {
    if (!city || city.trim() === '') {
        alert('Please enter a valid city name.');
        return;
    }

    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
    try {
        const geoRes = await fetch(geoUrl);
        if (!geoRes.ok) {
            alert('Error fetching geocoding data. Please try again later.');
            return;
        }

        const geoData = await geoRes.json();
        if (!geoData.results || geoData.results.length === 0) {
            alert('City not found. Please check the spelling and try again.');
            return;
        }

        const { latitude, longitude } = geoData.results[0];
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 4);
        const startStr = today.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&start_date=${startStr}&end_date=${endStr}&timezone=auto`;

        const weatherRes = await fetch(weatherUrl);
        if (!weatherRes.ok) {
            alert('Error fetching weather data. Please try again later.');
            return;
        }

        const weatherData = await weatherRes.json();
        let output = '';

        if (weatherData.current_weather && typeof weatherData.current_weather.temperature === 'number') {
            output += `<strong>Current temperature in ${city}: ${weatherData.current_weather.temperature}°C</strong><br><br>`;
        } else {
            output += '<strong>Weather data not available.</strong><br><br>';
        }

        if (weatherData.daily && weatherData.daily.time) {
            output += `<strong>5-day forecast for ${city}:</strong><br>`;
            for (let i = 0; i < weatherData.daily.time.length; i++) {
                const date = weatherData.daily.time[i];
                const min = weatherData.daily.temperature_2m_min[i];
                const max = weatherData.daily.temperature_2m_max[i];
                output += `${date}: Min ${min}°C, Max ${max}°C<br>`;
            }
        } else {
            output += '<strong>Forecast data not available.</strong>';
        }

        document.getElementById('status').innerHTML = output;
    } catch (error) {
        alert('An error occurred while fetching weather data. Please try again.');
        console.error('Error fetching weather:', error);
    }
}

document.getElementById('weather-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const cityInput = document.getElementById('city');
    const statusElement = document.getElementById('status');
    const city = cityInput.value;

    if (!city || city.trim() === '') {
        statusElement.innerHTML = '<strong>Please enter a valid city name.</strong>';
        return;
    }

    statusElement.innerHTML = '<strong>Fetching weather data...</strong>';

    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
    try {
        const geoRes = await fetch(geoUrl);
        if (!geoRes.ok) {
            statusElement.innerHTML = '<strong>Error fetching geocoding data. Please try again later.</strong>';
            return;
        }

        const geoData = await geoRes.json();
        if (!geoData.results || geoData.results.length === 0) {
            statusElement.innerHTML = '<strong>City not found. Please check the spelling and try again.</strong>';
            return;
        }

        const { latitude, longitude } = geoData.results[0];
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 4);
        const startStr = today.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&start_date=${startStr}&end_date=${endStr}&timezone=auto`;

        const weatherRes = await fetch(weatherUrl);
        if (!weatherRes.ok) {
            statusElement.innerHTML = '<strong>Error fetching weather data. Please try again later.</strong>';
            return;
        }

        const weatherData = await weatherRes.json();
        let output = '';

        if (weatherData.current_weather && typeof weatherData.current_weather.temperature === 'number') {
            output += `<strong>Current temperature in ${city}: ${weatherData.current_weather.temperature}°C</strong><br><br>`;
        } else {
            output += '<strong>Weather data not available.</strong><br><br>';
        }

        if (weatherData.daily && weatherData.daily.time) {
            output += `<strong>5-day forecast for ${city}:</strong><br>`;
            for (let i = 0; i < weatherData.daily.time.length; i++) {
                const date = weatherData.daily.time[i];
                const min = weatherData.daily.temperature_2m_min[i];
                const max = weatherData.daily.temperature_2m_max[i];
                output += `${date}: Min ${min}°C, Max ${max}°C<br>`;
            }
        } else {
            output += '<strong>Forecast data not available.</strong>';
        }

        statusElement.innerHTML = output;
    } catch (error) {
        statusElement.innerHTML = '<strong>An error occurred while fetching weather data. Please try again.</strong>';
        console.error('Error fetching weather:', error);
    }
});

fetchWeather('Mumbai');

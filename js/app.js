let map;
let geocoder;

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 34.05, lng: -118.24 }, // 默认洛杉矶
        zoom: 8,
    });
    geocoder = new google.maps.Geocoder();
}

document.getElementById('searchBtn').addEventListener('click', function() {
    const city = document.getElementById('cityInput').value.trim();
    const output = document.getElementById('weatherOutput');

    if (!city) {
        output.innerHTML = "Please enter a city.";
        return;
    }

    // 1. 用 Geocoder 获取城市经纬度
    geocoder.geocode({ address: city }, (results, status) => {
        if (status === "OK") {
            const location = results[0].geometry.location;
            map.setCenter(location);
            new google.maps.Marker({
                map: map,
                position: location,
            });

            // 2. 调用 Open-Meteo 获取天气
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.lat()}&longitude=${location.lng()}&current_weather=true`)
                .then(response => response.json())
                .then(data => {
                    const weather = data.current_weather;
                    output.innerHTML = `
                        <p><strong>City:</strong> ${city}</p>
                        <p><strong>Temperature:</strong> ${weather.temperature}°C</p>
                        <p><strong>Wind Speed:</strong> ${weather.windspeed} km/h</p>
                        <p><strong>Weather Code:</strong> ${weather.weathercode}</p>
                    `;
                })
                .catch(() => {
                    output.innerHTML = "Error fetching weather data.";
                });

        } else {
            output.innerHTML = "City not found.";
        }
    });
});

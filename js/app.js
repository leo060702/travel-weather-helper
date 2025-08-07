// js/app.js
let map;
let geocoder;

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 34.05, lng: -118.24 },
    zoom: 8,
  });
  geocoder = new google.maps.Geocoder();
}

document.addEventListener("DOMContentLoaded", function () {
  const modeRadios = document.querySelectorAll("input[name='mode']");
  const singleCityInput = document.getElementById("singleCityInput");
  const routeInput = document.getElementById("routeInput");
  const output = document.getElementById("weatherOutput");
  const forecastOutput = document.getElementById("forecastOutput");

  modeRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      if (radio.value === "single") {
        singleCityInput.style.display = "block";
        routeInput.style.display = "none";
      } else {
        singleCityInput.style.display = "none";
        routeInput.style.display = "block";
      }
    });
  });

  document.getElementById('searchBtn').addEventListener('click', function () {
    const city = document.getElementById('cityInput').value.trim();
    if (!city) {
      output.innerHTML = "Please enter a city.";
      return;
    }

    geocoder.geocode({ address: city }, (results, status) => {
      if (status === "OK") {
        const location = results[0].geometry.location;
        map.setCenter(location);
        new google.maps.Marker({ map: map, position: location });
        fetchWeather(location.lat(), location.lng(), city);
      } else {
        output.innerHTML = "City not found.";
      }
    });
  });

  document.getElementById("routeBtn").addEventListener("click", function () {
    const start = document.getElementById("startInput").value.trim();
    const end = document.getElementById("endInput").value.trim();

    if (!start || !end) {
      output.innerHTML = "Please enter both start and end locations.";
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    directionsService.route(
      {
        origin: start,
        destination: end,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (status === "OK") {
          directionsRenderer.setDirections(response);
          output.innerHTML = `Route from <strong>${start}</strong> to <strong>${end}</strong>:`;

          const path = response.routes[0].overview_path;
          const points = [path[0], path[Math.floor(path.length / 2)], path[path.length - 1]];
          forecastOutput.innerHTML = "";

          points.forEach((point, index) => {
            fetchWeather(point.lat(), point.lng(), `Stop ${index + 1}`);
          });
        } else {
          output.innerHTML = `Route not found. <br>Status: ${status}`;
          console.warn("Route error:", status, response);
        }
      }
    );
  });

  function fetchWeather(lat, lng, label) {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,weathercode,windspeed_10m_max&current_weather=true&timezone=auto`)
      .then(res => res.json())
      .then(data => {
        const current = data.current_weather;
        const daily = data.daily;

        const card = document.createElement("div");
        card.className = "weather-card";
        card.style.border = "1px solid #ccc";
        card.style.borderRadius = "8px";
        card.style.padding = "10px";
        card.style.marginBottom = "1em";
        card.style.backgroundColor = "#f9f9f9";

        card.innerHTML = `
          <h4>${label} (Today)</h4>
          <p><strong>Temperature:</strong> ${current.temperature}&deg;C</p>
          <p><strong>Wind:</strong> ${current.windspeed} km/h</p>
          <p><strong>Condition:</strong> ${getWeatherDescription(current.weathercode)}</p>
          <p><strong>Advice:</strong> ${getAdvice(current.weathercode, current.temperature)}</p>
          <hr>
          <h4>Next 3 Days Forecast</h4>
        `;

        for (let i = 1; i <= 3; i++) {
          const date = daily.time[i];
          const tempMax = daily.temperature_2m_max[i];
          const tempMin = daily.temperature_2m_min[i];
          const wind = daily.windspeed_10m_max[i];
          const code = daily.weathercode[i];

          card.innerHTML += `
            <p><strong>${date}</strong><br>
            🌡️ ${tempMin}°C - ${tempMax}°C<br>
            💨 ${wind} km/h<br>
            ☁️ ${getWeatherDescription(code)}<br>
            🧥 ${getAdvice(code, tempMax)}</p>
          `;
        }

        forecastOutput.appendChild(card);
      })
      .catch(() => {
        const error = document.createElement("p");
        error.textContent = `Weather data for ${label} unavailable.`;
        forecastOutput.appendChild(error);
      });
  }

  function getWeatherDescription(code) {
    const descriptions = {
      0: "Clear ☀️",
      1: "Mostly Clear 🌤️",
      2: "Partly Cloudy ⛅",
      3: "Overcast ☁️",
      45: "Fog 🌫️",
      48: "Freezing Fog ❄️🌫️",
      51: "Light Drizzle 🌦️",
      61: "Rain 🌧️",
      71: "Snow ❄️",
      95: "Thunderstorm ⛈️"
    };
    return descriptions[code] || `Unknown (Code ${code})`;
  }

  function getAdvice(code, temp) {
    let drive = "Normal driving conditions.";
    let clothing = "Wear something comfortable.";

    if ([61, 63, 65].includes(code)) {
      drive = "Drive carefully. Roads may be wet.";
      clothing = "Bring an umbrella or raincoat.";
    } else if ([45, 48].includes(code)) {
      drive = "Visibility may be low. Use fog lights.";
      clothing = "Wear visible clothing in low light.";
    } else if (code >= 95) {
      drive = "Thunderstorms possible. Avoid driving if unsafe.";
      clothing = "Stay indoors if possible.";
    }

    if (temp < 10) clothing += " Wear a jacket.";
    else if (temp > 28) clothing += " Wear light clothing.";

    return `${drive} ${clothing}`;
  }
});
let map;
let geocoder;

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 34.05, lng: -118.24 },
    zoom: 8,
  });
  geocoder = new google.maps.Geocoder();

  // 自动补全功能（仅用于单城市输入）
  const input = document.getElementById("cityInput");
  const autocomplete = new google.maps.places.Autocomplete(input, {
    types: ["(cities)"] // 可改为 geocode 或为空放宽限制
  });

  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    if (!place.geometry || !place.geometry.location) {
      alert("No details available for that input");
      return;
    }
    const location = place.geometry.location;
    map.setCenter(location);
    new google.maps.Marker({ map: map, position: location });
    fetchWeather(location.lat(), location.lng(), place.name);
  });
}



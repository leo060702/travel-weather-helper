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

  // 切换输入模式
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

  // 单城市天气查询
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

  // 路线查询
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

  // 获取天气信息（当前 + 建议 + 美化）
  function fetchWeather(lat, lng, label) {
    const today = new Date().toISOString().split("T")[0];
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,weathercode,windspeed_10m_max&current_weather=true&timezone=auto`)
      .then(res => res.json())
      .then(data => {
        const w = data.current_weather;
        const description = getWeatherDescription(w.weathercode);
        const advice = getAdvice(w.weathercode, w.temperature);

        const card = document.createElement("div");
        card.className = "weather-card";
        card.style.border = "1px solid #ccc";
        card.style.borderRadius = "8px";
        card.style.padding = "10px";
        card.style.marginBottom = "1em";
        card.style.backgroundColor = "#f9f9f9";

        card.innerHTML = `
          <h4>${label} (${today})</h4>
          <p><strong>Temperature:</strong> ${w.temperature}&deg;C</p>
          <p><strong>Wind:</strong> ${w.windspeed} km/h</p>
          <p><strong>Condition:</strong> ${description}</p>
          <p><strong>Advice:</strong> ${advice}</p>
        `;
        forecastOutput.appendChild(card);
      })
      .catch(() => {
        const error = document.createElement("p");
        error.textContent = `Weather data for ${label} unavailable.`;
        forecastOutput.appendChild(error);
      });
  }

  // 天气代码说明
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

  // 穿衣与驾驶建议
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

// js/app.js
let map;
let geocoder;
let directionsService;
let directionsRenderer;

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 34.05, lng: -118.24 },
    zoom: 8,
  });
  geocoder = new google.maps.Geocoder();
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  directionsRenderer.setMap(map);
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

          // 获取沿途关键点并查询天气（只取起点、中点、终点）
          const path = response.routes[0].overview_path;
          const points = [path[0], path[Math.floor(path.length / 2)], path[path.length - 1]];

          forecastOutput.innerHTML = "";
          points.forEach((point, index) => {
            fetchWeather(point.lat(), point.lng(), `Stop ${index + 1}`);
          });
        } else {
          output.innerHTML = "Route not found.";
        }
      }
    );
  });

  // 获取天气信息
  function fetchWeather(lat, lng, label) {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`)
      .then(res => res.json())
      .then(data => {
        const w = data.current_weather;
        const card = document.createElement("div");
        card.className = "weather-card";
        card.innerHTML = `
          <h4>${label}</h4>
          <p><strong>Temperature:</strong> ${w.temperature}&deg;C</p>
          <p><strong>Wind:</strong> ${w.windspeed} km/h</p>
          <p><strong>Code:</strong> ${w.weathercode}</p>
        `;
        forecastOutput.appendChild(card);
      })
      .catch(() => {
        const error = document.createElement("p");
        error.textContent = `Weather data for ${label} unavailable.`;
        forecastOutput.appendChild(error);
      });
  }
});

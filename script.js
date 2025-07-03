const weatherCodeDescriptions = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  80: 'Rain showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Severe thunderstorm'
};

function getWeatherIcon(code) {
  // Map weather codes to image filenames in the assets folder
  const iconMap = {
    0: 'cloud-sun.png',
    1: 'cloud-sun.png',
    2: 'partly-cloudy.png',
    3: 'night.png',
    45: 'fog.png',
    48: 'fog.png',
    51: 'drizzle.png',
    53: 'drizzle.png',
    55: 'drizzle.png',
    61: 'light-rain.png',
    63: 'heavy-rain.png',
    65: 'heavy-rain.png',
    80: 'light-rain.png',
    95: 'night.png',
    96: 'thunderstorm_hail.png',
    99: 'severe_thunderstorm.png'
  };
  return `assets/${iconMap[code] || 'unknown.png'}`;
}

navigator.geolocation.getCurrentPosition(success, error);

function success(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;

  const WEATHER_URL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  const LOCATION_URL = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;

  // Get weather
  fetch(WEATHER_URL)
    .then(res => res.json())
    .then(data => {
      const weather = data.current_weather;
      const temp = weather.temperature;
      const code = weather.weathercode;
      const desc = weatherCodeDescriptions[code] || 'Unknown';

      document.getElementById('temperature').textContent = `${temp}°C`;
      document.getElementById('description').textContent = desc;

      // Set weather icon
      let icon = document.getElementById('weather-icon');
      if (!icon) {
        icon = document.createElement('img');
        icon.id = 'weather-icon';
        icon.alt = desc;
        icon.className = 'mb-3';
        document.querySelector('.glass-card').insertBefore(icon, document.getElementById('temperature'));
      }
      icon.src = getWeatherIcon(code);

      updateTheme(code);
    });

  // Get location name
  fetch(LOCATION_URL)
    .then(res => res.json())
    .then(locationData => {
      const address = locationData.address;
      const city = address.city || address.town || address.village || '';
      const state = address.state || '';
      const country = address.country || '';
      const fullLocation = `${city}, ${state}, ${country}`;

      document.getElementById('location').textContent = fullLocation;
    });
}

function error() {
  document.getElementById('temperature').textContent = "Location access denied";
  document.getElementById('description').textContent = "Please allow location access to view weather.";
  // Remove weather icon if present
  const icon = document.getElementById('weather-icon');
  if (icon) icon.remove();
  // Show a warning message
  let warning = document.getElementById('location-warning');
  if (!warning) {
    warning = document.createElement('div');
    warning.id = 'location-warning';
    warning.className = 'alert alert-warning mt-3';
    warning.textContent = '⚠️ Please enable location permissions in your browser to see live weather for your area.';
    document.querySelector('.glass-card').appendChild(warning);
  }
}

function updateTheme(code) {
  const body = document.body;

  if ([0, 1].includes(code)) {
    body.classList.add("sunny");
  } else if ([2, 3, 45, 48].includes(code)) {
    body.classList.add("cloudy");
  } else if ([95, 96, 99].includes(code)) {
    body.classList.add("night");
  } else {
    body.classList.add("bg-base");
  }
}

// Add search form for other locations
window.addEventListener('DOMContentLoaded', () => {
  const card = document.querySelector('.glass-card');
  const form = document.createElement('form');
  form.className = 'mb-3';
  form.id = 'location-form';
  form.innerHTML = `
    <div class="input-group mb-2">
      <input type="text" class="form-control bg-transparent text-white" id="search-location" placeholder="Enter city, state, or country">
      <button class="btn btn-success" type="submit">Search</button>
    </div>
  `;
  card.insertBefore(form, card.firstChild);

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const query = document.getElementById('search-location').value.trim();
    if (!query) return;
    fetchLocationAndWeather(query);
  });
});

function fetchLocationAndWeather(query) {
  // Use Nominatim to get lat/lon from query
  fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`)
    .then(res => res.json())
    .then(results => {
      if (results.length === 0) {
        document.getElementById('temperature').textContent = 'Location not found';
        document.getElementById('description').textContent = '';
        document.getElementById('location').textContent = '';
        const icon = document.getElementById('weather-icon');
        if (icon) icon.remove();
        return;
      }
      const lat = results[0].lat;
      const lon = results[0].lon;
      updateWeatherAndLocation(lat, lon, results[0].display_name);
    });
}

function updateWeatherAndLocation(lat, lon, displayName) {
  const WEATHER_URL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  fetch(WEATHER_URL)
    .then(res => res.json())
    .then(data => {
      const weather = data.current_weather;
      if (!weather) {
        document.getElementById('temperature').textContent = 'Weather not available';
        document.getElementById('description').textContent = '';
        const icon = document.getElementById('weather-icon');
        if (icon) icon.remove();
        return;
      }
      const temp = weather.temperature;
      const code = weather.weathercode;
      const desc = weatherCodeDescriptions[code] || 'Unknown';
      document.getElementById('temperature').textContent = `${temp}°C`;
      document.getElementById('description').textContent = desc;
      document.getElementById('location').textContent = displayName;
      // Set weather icon
      let icon = document.getElementById('weather-icon');
      if (!icon) {
        icon = document.createElement('img');
        icon.id = 'weather-icon';
        icon.alt = desc;
        icon.className = 'mb-3';
        document.querySelector('.glass-card').insertBefore(icon, document.getElementById('temperature'));
      }
      icon.src = getWeatherIcon(code);
      updateTheme(code);
    });
}

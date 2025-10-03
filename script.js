// ========== helpers ==========
const $ = (id) => document.getElementById(id);

const WMO = {
  0:["Clear","☀️"],1:["Mainly clear","🌤️"],2:["Partly cloudy","⛅"],3:["Overcast","☁️"],
  45:["Fog","🌫️"],48:["Rime fog","🌫️"],51:["Drizzle (light)","🌦️"],53:["Drizzle","🌦️"],55:["Drizzle (heavy)","🌧️"],
  61:["Rain (light)","🌦️"],63:["Rain","🌧️"],65:["Rain (heavy)","🌧️"],66:["Freezing rain (light)","🌧️"],67:["Freezing rain (heavy)","🌧️"],
  71:["Snow (light)","🌨️"],73:["Snow","🌨️"],75:["Snow (heavy)","❄️"],80:["Rain showers (light)","🌦️"],81:["Rain showers","🌦️"],82:["Rain showers (violent)","⛈️"],
  85:["Snow showers (light)","🌨️"],86:["Snow showers (heavy)","❄️"],95:["Thunderstorm","⛈️"],96:["TS w/ light hail","⛈️"],99:["TS w/ heavy hail","⛈️"]
};
const compass = (deg) => ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"][Math.round(deg/22.5)%16];
const shortTime = (d) => new Date(d).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
const longDate = (d) => new Date(d).toDateString();

// ========== API calls ==========
async function geocode(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("Geocoding failed");
  const j = await r.json();
  if (!j.results?.length) throw new Error("City not found");
  const g = j.results[0];
  return { lat: g.latitude, lon: g.longitude, label: `${g.name}, ${g.country}` };
}

async function fetchForecast(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
              `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m` +
              `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
              `&timezone=auto&forecast_days=5`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("Forecast failed");
  return r.json();
}

async function fetchAir(lat, lon) {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}` +
                `&hourly=us_aqi,pm10,pm2_5&timezone=auto`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const j = await r.json();
    const n = j.hourly?.us_aqi?.length ? j.hourly.us_aqi.length - 1 : -1;
    if (n < 0) return null;
    return { aqi: j.hourly.us_aqi[n], pm25: j.hourly.pm2_5?.[n], pm10: j.hourly.pm10?.[n] };
  } catch { return null; }
}

// ========== UI fill ==========
async function updateWeather(city) {
  if (!city?.trim()) { $("status").textContent = "Please enter a city."; return; }
  $("status").textContent = "Fetching weather…";

  try {
    const { lat, lon, label } = await geocode(city.trim());
    const [wx, air] = await Promise.all([fetchForecast(lat, lon), fetchAir(lat, lon)]);

    // current
    const cur = wx.current;
    const [desc, icon] = WMO[cur.weather_code] ?? ["—","❓"];
    $("loc").textContent = label;
    $("icon").textContent = icon;
    $("temp").textContent = cur.temperature_2m ?? "—";
    $("desc").textContent = desc;
    $("feels").textContent = cur.apparent_temperature ?? "—";

    // wind & sun
    const windDir = typeof cur.wind_direction_10m === "number" ? `${compass(cur.wind_direction_10m)} (${cur.wind_direction_10m}°)` : "—";
    $("wind").innerHTML = `Wind: <strong>${cur.wind_speed_10m ?? "—"} km/h</strong>${cur.wind_gusts_10m != null ? ` • Gusts <strong>${cur.wind_gusts_10m} km/h</strong>` : ""} • Dir ${windDir}`;
    $("sun").innerHTML = `Sunrise: <strong>${shortTime(wx.daily.sunrise[0])}</strong> • Sunset: <strong>${shortTime(wx.daily.sunset[0])}</strong>`;

    // air quality
    const aqiPanel = $("panel-aqi");
    if (air?.aqi != null) {
      $("aqi").textContent = air.aqi;
      $("pm25").textContent = air.pm25 ?? "—";
      $("pm10").textContent = air.pm10 ?? "—";
      aqiPanel.classList.remove("hidden");
    } else {
      aqiPanel.classList.add("hidden");
    }

    // forecast
    const ul = $("forecast-list");
    ul.innerHTML = "";
    for (let i = 0; i < wx.daily.time.length; i++) {
      const [dDesc, dIcon] = WMO[wx.daily.weather_code[i]] ?? ["—","❓"];
      const li = document.createElement("li");
      li.innerHTML = `<strong>${longDate(wx.daily.time[i])}</strong><br>${dIcon} ${dDesc}<br>
        ⬆️ ${wx.daily.temperature_2m_max[i]}°C &nbsp; ⬇️ ${wx.daily.temperature_2m_min[i]}°C`;
      ul.appendChild(li);
    }

    $("status").textContent = "";
  } catch (e) {
    console.error(e);
    $("status").textContent = "Unable to fetch weather. Please try again.";
  }
}

// wire up
document.getElementById("weather-form").addEventListener("submit", (e) => {
  e.preventDefault();
  updateWeather(document.getElementById("city").value);
});

// default city on load
updateWeather("Mumbai");

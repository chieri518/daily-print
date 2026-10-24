// The five-day forecast, today's almanac (sun, moon) and air quality, from Open-Meteo (free, no key): https://open-meteo.com
import { esc } from "./html.ts";

export type Forecast = {
  place: string;
  unit: "°F" | "°C";
  windUnit: "mph" | "km/h";
  days: { date: string; code: number; high: number; low: number; feelsLike: number; rain: number; wind: number }[];
  sunrise: string; // e.g. "7:26 am"
  sunset: string;
  daylight: string; // e.g. "10h 55m"
  moon: string; // e.g. "Waxing crescent"
  airQuality: number | null; // US AQI
};

// Finds the location, trying shorter names until one matches ("San Francisco Bay Area" → "San Francisco").
async function geocode(location: string) {
  const words = location.split(/[\s,]+/);
  for (let n = words.length; n > 0; n--) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(
      words.slice(0, n).join(" "),
    )}`;
    const { results } = await (await fetch(url)).json();
    if (results?.length) return results[0] as { name: string; latitude: number; longitude: number };
  }
  return null;
}

// Returns null if the location can't be found or the weather service fails, so the paper still prints without it.
export async function getForecast(location: string, temperature: "fahrenheit" | "celsius") {
  try {
    return await fetchForecast(location, temperature);
  } catch (error) {
    console.warn(`The forecast isn't available: ${error}`);
    return null;
  }
}

async function fetchForecast(location: string, temperature: "fahrenheit" | "celsius"): Promise<Forecast | null> {
  const place = await geocode(location);
  if (!place) return null;
  const fahrenheit = temperature === "fahrenheit";
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset,daylight_duration",
    temperature_unit: temperature,
    wind_speed_unit: fahrenheit ? "mph" : "kmh",
    timezone: "auto",
    forecast_days: "5",
  });
  const { daily: d } = await (await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)).json();
  const minutes = Math.round(d.daylight_duration[0] / 60);
  return {
    place: place.name,
    unit: fahrenheit ? "°F" : "°C",
    windUnit: fahrenheit ? "mph" : "km/h",
    days: d.time.map((date: string, i: number) => ({
      date,
      code: d.weather_code[i],
      high: Math.round(d.temperature_2m_max[i]),
      low: Math.round(d.temperature_2m_min[i]),
      feelsLike: Math.round(d.apparent_temperature_max[i]),
      rain: d.precipitation_probability_max[i] ?? 0,
      wind: Math.round(d.wind_speed_10m_max[i]),
    })),
    sunrise: clock(d.sunrise[0]),
    sunset: clock(d.sunset[0]),
    daylight: `${Math.floor(minutes / 60)}h ${minutes % 60}m`,
    moon: moonPhase(new Date(`${d.time[0]}T12:00:00Z`)),
    airQuality: await airQuality(place.latitude, place.longitude),
  };
}

// The US air quality index right now, or null if it isn't available.
async function airQuality(latitude: number, longitude: number) {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi`;
    return (await (await fetch(url)).json()).current.us_aqi as number;
  } catch {
    return null;
  }
}

// "2026-10-23T07:26" → "7:26 am"
function clock(time: string) {
  const [h, m] = time.slice(11, 16).split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}

// The moon's phase, counted from a known new moon (January 6, 2000) in cycles of 29.53 days.
function moonPhase(date: Date) {
  const cycle = 29.530588;
  const age = ((date.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000) % cycle;
  const phases = [
    "New moon",
    "Waxing crescent",
    "First quarter",
    "Waxing gibbous",
    "Full moon",
    "Waning gibbous",
    "Last quarter",
    "Waning crescent",
  ];
  return phases[Math.round((age / cycle) * 8) % 8];
}

// What the air quality number means, in the US index's own words.
function airLabel(aqi: number) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for sensitive groups";
  if (aqi <= 200) return "Unhealthy";
  return "Very unhealthy";
}

// Plain-text forecast for Claude, which writes the umbrella-or-jacket tip.
export function describeForecast(f: Forecast) {
  const days = f.days.map(
    (d) =>
      `${d.date}: ${condition(d.code).label}, high ${d.high}${f.unit}, low ${d.low}${f.unit}, ${
        d.rain
      }% chance of rain, wind ${d.wind} ${f.windUnit}`,
  );
  const air = f.airQuality !== null ? `Air quality today: ${f.airQuality} (${airLabel(f.airQuality)})` : "";
  return [...days, air].join("\n");
}

// The masthead line, e.g. "Partly cloudy, 68°F / 53°F".
export function todayLine(f: Forecast) {
  const d = f.days[0];
  return `${condition(d.code).label}, ${d.high}${f.unit} / ${d.low}${f.unit}`;
}

// The forecast as printed: one column per day with an icon, today's almanac line, then the tip.
export function weatherHtml(f: Forecast | null, tip: string) {
  if (!f) return `<p class="weather-tip">The forecast wasn't available today.</p>`;
  const days = f.days.map((d, i) => {
    const { label, icon } = condition(d.code);
    const name = i === 0 ? "Today" : new Date(`${d.date}T12:00`).toLocaleDateString("en-US", { weekday: "short" });
    return `<div class="day">
      <strong>${name}</strong>
      ${ICONS[icon]}
      <span class="condition">${label}</span>
      <span class="temps"><b>${d.high}°</b> / ${d.low}°</span>
      <span class="small">Rain ${d.rain}% · Wind ${d.wind} ${f.windUnit}</span>
    </div>`;
  });
  const almanac = [
    `Sunrise ${f.sunrise}`,
    `Sunset ${f.sunset}`,
    `Daylight ${f.daylight}`,
    f.moon,
    f.airQuality !== null && `Air quality ${f.airQuality}, ${airLabel(f.airQuality).toLowerCase()}`,
  ].filter(Boolean);
  return `<div class="weather"><div class="days">${days.join("")}</div>
    <p class="almanac">${almanac.join(" · ")}</p>
    <p class="weather-tip">${esc(tip)}</p></div>`;
}

// WMO weather codes, grouped into the conditions we draw.
function condition(code: number): { label: string; icon: keyof typeof ICONS } {
  if (code === 0) return { label: "Sunny", icon: "sun" };
  if (code <= 2) return { label: "Partly cloudy", icon: "partly" };
  if (code === 3) return { label: "Cloudy", icon: "cloud" };
  if (code <= 48) return { label: "Fog", icon: "fog" };
  if (code <= 67 || (code >= 80 && code <= 82)) return { label: code <= 57 ? "Drizzle" : "Rain", icon: "rain" };
  if (code <= 86) return { label: "Snow", icon: "snow" };
  return { label: "Storms", icon: "storm" };
}

// Black-and-white line icons for print.
const cloud = `<path d="M14 34h22a8 8 0 0 0 0-16 11 11 0 0 0-21-2 9 9 0 0 0-1 18z" fill="#fff" stroke="#000" stroke-width="2"/>`;
const sun = (x: number, y: number, r: number) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#000" stroke-width="2"/>` +
  [0, 45, 90, 135, 180, 225, 270, 315]
    .map((a) => {
      const c = Math.cos((a * Math.PI) / 180),
        s = Math.sin((a * Math.PI) / 180);
      return `<line x1="${x + c * (r + 3)}" y1="${y + s * (r + 3)}" x2="${x + c * (r + 7)}" y2="${
        y + s * (r + 7)
      }" stroke="#000" stroke-width="2"/>`;
    })
    .join("");
const drops = (d: string) => `<path d="${d}" stroke="#000" stroke-width="2" fill="none"/>`;
const svg = (body: string) => `<svg class="icon" viewBox="0 0 48 48">${body}</svg>`;

const ICONS = {
  sun: svg(sun(24, 24, 9)),
  partly: svg(sun(30, 16, 7) + cloud),
  cloud: svg(cloud),
  fog: svg(cloud + drops("M10 40h28M14 45h20")),
  rain: svg(cloud + drops("M17 38l-2 6M25 38l-2 6M33 38l-2 6")),
  snow: svg(
    cloud +
      `<g font-size="8" text-anchor="middle"><text x="16" y="45">*</text><text x="25" y="45">*</text><text x="34" y="45">*</text></g>`,
  ),
  storm: svg(cloud + `<path d="M26 34l-5 7h5l-3 6" stroke="#000" stroke-width="2" fill="none"/>`),
};

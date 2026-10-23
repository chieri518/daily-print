// The five-day forecast, from Open-Meteo (free, no key): https://open-meteo.com
import { esc } from "./html.ts";

export type Forecast = {
  place: string;
  unit: "°F" | "°C";
  days: { date: string; code: number; high: number; low: number; feelsLike: number; rain: number; wind: number }[];
};

// Finds the location, trying shorter names until one matches ("San Francisco Bay Area" → "San Francisco").
async function geocode(location: string) {
  const words = location.split(/[\s,]+/);
  for (let n = words.length; n > 0; n--) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(
      words.slice(0, n).join(" "),
    )}`;
    const { results } = await (await fetch(url)).json();
    if (results?.length)
      return results[0] as { name: string; latitude: number; longitude: number; country_code: string };
  }
  return null;
}

// Returns null if the location can't be found, so the paper still prints without a forecast.
export async function getForecast(location: string): Promise<Forecast | null> {
  const place = await geocode(location);
  if (!place) return null;
  const us = place.country_code === "US";
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_probability_max,wind_speed_10m_max",
    temperature_unit: us ? "fahrenheit" : "celsius",
    wind_speed_unit: us ? "mph" : "kmh",
    timezone: "auto",
    forecast_days: "5",
  });
  const { daily: d } = await (await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)).json();
  return {
    place: place.name,
    unit: us ? "°F" : "°C",
    days: d.time.map((date: string, i: number) => ({
      date,
      code: d.weather_code[i],
      high: Math.round(d.temperature_2m_max[i]),
      low: Math.round(d.temperature_2m_min[i]),
      feelsLike: Math.round(d.apparent_temperature_max[i]),
      rain: d.precipitation_probability_max[i] ?? 0,
      wind: Math.round(d.wind_speed_10m_max[i]),
    })),
  };
}

// Plain-text forecast for Claude, which writes the umbrella-or-jacket tip.
export function describeForecast(f: Forecast) {
  return f.days
    .map(
      (d) =>
        `${d.date}: ${condition(d.code).label}, high ${d.high}${f.unit}, low ${d.low}${f.unit}, ${
          d.rain
        }% chance of rain, wind ${d.wind}`,
    )
    .join("\n");
}

// The masthead line, e.g. "Partly cloudy, 68°F / 53°F".
export function todayLine(f: Forecast) {
  const d = f.days[0];
  return `${condition(d.code).label}, ${d.high}${f.unit} / ${d.low}${f.unit}`;
}

// The forecast as printed: one column per day with an icon, then the tip.
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
      <span class="small">Rain ${d.rain}% · Wind ${d.wind}</span>
    </div>`;
  });
  return `<div class="weather"><div class="days">${days.join("")}</div><p class="weather-tip">${esc(tip)}</p></div>`;
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

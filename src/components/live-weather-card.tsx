import Link from "next/link";

const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=32.18&longitude=-95.478333&current=temperature_2m,apparent_temperature,weather_code,is_day,relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FChicago&forecast_days=1";

const FORECAST_URL =
  "https://forecast.weather.gov/MapClick.php?lat=32.18&lon=-95.478333";

type WeatherResponse = {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    weather_code: number;
    is_day: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
  };
  daily: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
};

type WeatherTheme = {
  label: string;
  icon: string;
  background: string;
};

function weatherTheme(code: number, isDay: boolean): WeatherTheme {
  if (code === 0) {
    return isDay
      ? {
          label: "Clear skies",
          icon: "☀️",
          background:
            "linear-gradient(135deg, #176b87 0%, #3d91a6 58%, #d7a64b 100%)",
        }
      : {
          label: "Clear night",
          icon: "🌙",
          background:
            "linear-gradient(135deg, #102f45 0%, #1f5068 62%, #526a7a 100%)",
        };
  }
  if (code <= 2) {
    return {
      label: code === 1 ? "Mostly clear" : "Partly cloudy",
      icon: isDay ? "🌤️" : "☁️",
      background:
        "linear-gradient(135deg, #2b6579 0%, #6e9ca8 58%, #c9b98b 100%)",
    };
  }
  if (code === 3) {
    return {
      label: "Overcast",
      icon: "☁️",
      background:
        "linear-gradient(135deg, #405b65 0%, #748b91 58%, #aeb9b8 100%)",
    };
  }
  if (code === 45 || code === 48) {
    return {
      label: "Foggy",
      icon: "🌫️",
      background:
        "linear-gradient(135deg, #536d73 0%, #8ca0a2 58%, #c3ccca 100%)",
    };
  }
  if (code >= 95) {
    return {
      label: "Thunderstorms",
      icon: "⛈️",
      background:
        "linear-gradient(135deg, #1c3344 0%, #3f5667 58%, #6d6473 100%)",
    };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return {
      label: "Snow",
      icon: "🌨️",
      background:
        "linear-gradient(135deg, #4f7485 0%, #8eabb5 58%, #d8e4e5 100%)",
    };
  }
  if (code >= 51 && code <= 57) {
    return {
      label: "Drizzle",
      icon: "🌦️",
      background:
        "linear-gradient(135deg, #28576c 0%, #5c8796 58%, #9fb3b7 100%)",
    };
  }
  return {
    label: code >= 80 ? "Rain showers" : "Rain",
    icon: "🌧️",
    background:
      "linear-gradient(135deg, #1d4d63 0%, #527a89 58%, #8ca4a8 100%)",
  };
}

function localTimeLabel(time: string) {
  const timePart = time.split("T")[1];
  if (!timePart) return "just now";
  const [rawHour, minute = "00"] = timePart.split(":");
  const hour = Number(rawHour);
  if (!Number.isFinite(hour)) return "just now";
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${period}`;
}

async function lakeWeather(): Promise<WeatherResponse | null> {
  try {
    const response = await fetch(WEATHER_URL, {
      next: { revalidate: 900 },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as WeatherResponse;
    if (
      !Number.isFinite(data.current?.temperature_2m) ||
      !Number.isFinite(data.current?.weather_code)
    ) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function LiveWeatherFallback() {
  return (
    <div className="ml-auto min-h-32 w-full max-w-[380px] animate-pulse rounded-lh bg-water/15" />
  );
}

export async function LiveWeatherCard() {
  const weather = await lakeWeather();

  if (!weather) {
    return (
      <Link
        href={FORECAST_URL}
        target="_blank"
        rel="noreferrer"
        className="card group ml-auto flex w-full max-w-[380px] items-center justify-between gap-4 p-4 transition-colors hover:border-water"
      >
        <div>
          <p className="section-label">Live weather · Lake Palestine</p>
          <p className="mt-1 font-semibold">Weather is temporarily unavailable</p>
        </div>
        <span className="text-sm font-semibold text-water group-hover:text-deep-2">
          Full forecast ↗
        </span>
      </Link>
    );
  }

  const current = weather.current;
  const theme = weatherTheme(current.weather_code, current.is_day === 1);
  const high = weather.daily.temperature_2m_max[0];
  const low = weather.daily.temperature_2m_min[0];

  return (
    <Link
      href={FORECAST_URL}
      target="_blank"
      rel="noreferrer"
      aria-label={`Lake Palestine live weather: ${theme.label}, ${Math.round(current.temperature_2m)} degrees. Open the full forecast.`}
      className="group relative ml-auto block w-full max-w-[380px] overflow-hidden rounded-lh border border-white/20 text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
      style={{ background: theme.background }}
    >
      <span
        aria-hidden
        className="absolute -right-8 -top-16 h-52 w-52 rounded-full bg-white/15 blur-2xl"
      />
      <span
        aria-hidden
        className="absolute -bottom-20 left-1/3 h-44 w-72 rounded-full bg-deep/20 blur-3xl"
      />
      <div className="relative p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/75">
              Live weather · Lake Palestine
            </p>
            <span className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              Updated {localTimeLabel(current.time)}
            </span>
          </div>
          <span className="text-xs font-semibold text-white transition-transform group-hover:translate-x-1">
            More info ↗
          </span>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <span
            role="img"
            aria-label={theme.label}
            className="text-4xl drop-shadow-sm"
          >
            {theme.icon}
          </span>
          <div className="flex min-w-0 flex-1 items-end gap-2">
            <p className="font-display text-4xl leading-none">
              {Math.round(current.temperature_2m)}°
            </p>
            <div className="min-w-0 pb-0.5">
              <p className="truncate text-sm font-semibold text-white/95">
                {theme.label}
              </p>
              <p className="text-xs text-white/75">
                Feels {Math.round(current.apparent_temperature)}° · H{" "}
                {Math.round(high)}° / L {Math.round(low)}°
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 flex gap-4 border-t border-white/20 pt-2 text-xs text-white/75">
          <span>Humidity {Math.round(current.relative_humidity_2m)}%</span>
          <span>Wind {Math.round(current.wind_speed_10m)} mph</span>
        </div>
      </div>
    </Link>
  );
}

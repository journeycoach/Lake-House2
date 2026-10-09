import Link from "next/link";
import type { ComponentType } from "react";
import {
  CloudDrizzleIcon,
  CloudFogIcon,
  CloudIcon,
  CloudLightningIcon,
  CloudRainIcon,
  CloudSnowIcon,
  CloudSunIcon,
  MoonIcon,
  SunIcon,
  WarningIcon,
} from "@/components/icons";

const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=32.18&longitude=-95.478333&current=temperature_2m,apparent_temperature,weather_code,is_day,relative_humidity_2m,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FChicago&forecast_days=16";

const FORECAST_URL =
  "https://forecast.weather.gov/MapClick.php?lat=32.18&lon=-95.478333";

const ALERTS_URL =
  "https://api.weather.gov/alerts/active?point=32.18,-95.478333";

type WeatherAlert = {
  id: string;
  event: string;
  headline: string | null;
  severity: string;
};

type AlertsResponse = {
  features: {
    id: string;
    properties: {
      event: string;
      headline: string | null;
      severity: string;
      messageType: string;
    };
  }[];
};

/* Warnings only, not watches or advisories — a watch shown as a red banner
   would cry wolf. NWS marks a cancelled/expired alert with messageType
   "Cancel"/"Expire", which the active-alerts endpoint should already exclude,
   but we filter defensively anyway. */
async function lakeAlerts(): Promise<WeatherAlert[]> {
  try {
    const response = await fetch(ALERTS_URL, {
      headers: {
        "User-Agent": "Paine Pointe lakehouse app (contact via paines.com)",
        Accept: "application/geo+json",
      },
      next: { revalidate: 300 },
    });
    if (!response.ok) return [];
    const data = (await response.json()) as AlertsResponse;
    return data.features
      .filter(
        (f) =>
          f.properties.event.toLowerCase().includes("warning") &&
          f.properties.messageType !== "Cancel" &&
          f.properties.messageType !== "Expire"
      )
      .map((f) => ({
        id: f.id,
        event: f.properties.event,
        headline: f.properties.headline,
        severity: f.properties.severity,
      }));
  } catch {
    return [];
  }
}

function alertIsSevere(severity: string) {
  return severity === "Extreme" || severity === "Severe";
}

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
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max?: number[];
  };
};

type WeatherTheme = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  background: string;
};

function weatherTheme(code: number, isDay: boolean): WeatherTheme {
  if (code === 0) {
    return isDay
      ? {
          label: "Clear skies",
          icon: SunIcon,
          background:
            "linear-gradient(135deg, #176b87 0%, #3d91a6 58%, #d7a64b 100%)",
        }
      : {
          label: "Clear night",
          icon: MoonIcon,
          background:
            "linear-gradient(135deg, #102f45 0%, #1f5068 62%, #526a7a 100%)",
        };
  }
  if (code <= 2) {
    return {
      label: code === 1 ? "Mostly clear" : "Partly cloudy",
      icon: isDay ? CloudSunIcon : CloudIcon,
      background:
        "linear-gradient(135deg, #2b6579 0%, #6e9ca8 58%, #c9b98b 100%)",
    };
  }
  if (code === 3) {
    return {
      label: "Overcast",
      icon: CloudIcon,
      background:
        "linear-gradient(135deg, #405b65 0%, #748b91 58%, #aeb9b8 100%)",
    };
  }
  if (code === 45 || code === 48) {
    return {
      label: "Foggy",
      icon: CloudFogIcon,
      background:
        "linear-gradient(135deg, #536d73 0%, #8ca0a2 58%, #c3ccca 100%)",
    };
  }
  if (code >= 95) {
    return {
      label: "Thunderstorms",
      icon: CloudLightningIcon,
      background:
        "linear-gradient(135deg, #1c3344 0%, #3f5667 58%, #6d6473 100%)",
    };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return {
      label: "Snow",
      icon: CloudSnowIcon,
      background:
        "linear-gradient(135deg, #4f7485 0%, #8eabb5 58%, #d8e4e5 100%)",
    };
  }
  if (code >= 51 && code <= 57) {
    return {
      label: "Drizzle",
      icon: CloudDrizzleIcon,
      background:
        "linear-gradient(135deg, #28576c 0%, #5c8796 58%, #9fb3b7 100%)",
    };
  }
  return {
    label: code >= 80 ? "Rain showers" : "Rain",
    icon: CloudRainIcon,
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
    <div className="min-h-32 w-full animate-pulse rounded-lh bg-water/15" />
  );
}

export function VisitWeatherBadgeFallback() {
  return <span className="h-9 w-16 animate-pulse rounded-full border border-deep bg-deep/70" />;
}

export async function VisitWeatherBadge() {
  const [weather, alerts] = await Promise.all([lakeWeather(), lakeAlerts()]);
  const hasSevereAlert = alerts.some((alert) => alertIsSevere(alert.severity));

  if (!weather) {
    return (
      <Link
        href={FORECAST_URL}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open the Lake Palestine weather forecast${hasSevereAlert ? "; severe weather alert active" : ""}`}
        className="inline-flex items-center gap-1.5 rounded-full border border-deep bg-deep px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-water"
      >
        <CloudSunIcon className="h-3.5 w-3.5" />
        <span>Current</span>
        {hasSevereAlert ? (
          <span aria-hidden="true" className="ml-0.5 h-2 w-2 rounded-full bg-red-400 ring-2 ring-white/40" />
        ) : null}
      </Link>
    );
  }

  const current = weather.current;
  const theme = weatherTheme(current.weather_code, current.is_day === 1);
  const rainChance = weather.daily.precipitation_probability_max?.[0];
  const showRainChance = typeof rainChance === "number" && rainChance >= 30;
  const secondaryDetails = [
    `Feels ${Math.round(current.apparent_temperature)}°`,
    ...(showRainChance ? [`Rain ${Math.round(rainChance)}%`] : []),
  ].join(" · ");

  return (
    <Link
      href={FORECAST_URL}
      target="_blank"
      rel="noreferrer"
      aria-label={`Lake Palestine weather: ${theme.label}, ${Math.round(current.temperature_2m)} degrees, feels like ${Math.round(current.apparent_temperature)} degrees${showRainChance ? `, ${Math.round(rainChance)} percent chance of rain` : ""}${hasSevereAlert ? ". Severe weather alert active" : ""}. Open the full forecast.`}
      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-deep bg-deep px-2.5 py-1.5 text-white transition-colors hover:bg-water"
    >
      <span role="img" aria-label={theme.label} className="leading-none">
        <theme.icon className="h-[18px] w-[18px]" />
      </span>
      <span className="flex flex-col items-start leading-tight">
        <span className="text-[9px] font-semibold uppercase tracking-wide text-white/70">
          Current
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-sm font-bold">{Math.round(current.temperature_2m)}°</span>
          {hasSevereAlert ? (
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-red-400 ring-2 ring-white/40"
            />
          ) : null}
        </span>
        <span className="whitespace-nowrap text-[9px] font-medium text-white/75">
          {secondaryDetails}
        </span>
      </span>
    </Link>
  );
}

function forecastPriority(code: number) {
  if (code >= 95) return 6;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 5;
  if (code >= 80) return 4;
  if (code >= 51) return 3;
  if (code === 45 || code === 48) return 2;
  if (code === 3) return 1;
  return 0;
}

export function VisitWeatherForecastFallback() {
  return <div className="mt-2 h-7 w-48 animate-pulse rounded-full bg-white/10" />;
}

export async function VisitWeatherForecast({
  start,
  end,
  today,
}: {
  start: string;
  end: string;
  today: string;
}) {
  const weather = await lakeWeather();
  const firstVisitDay = start > today ? start : today;
  const coveredDays = weather?.daily.time
    .map((date, index) => ({ date, index }))
    .filter(({ date }) => date >= firstVisitDay && date <= end) ?? [];

  if (!weather || coveredDays.length === 0) {
    return (
      <Link
        href={FORECAST_URL}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-white/85 hover:bg-white/15"
      >
        <CloudSunIcon className="h-4 w-4" />
        <span className="text-xs">Forecast available closer to your stay</span>
      </Link>
    );
  }

  const high = Math.round(
    Math.max(...coveredDays.map(({ index }) => weather.daily.temperature_2m_max[index]))
  );
  const low = Math.round(
    Math.min(...coveredDays.map(({ index }) => weather.daily.temperature_2m_min[index]))
  );
  const rainChance = Math.max(
    ...coveredDays.map(({ index }) => weather.daily.precipitation_probability_max?.[index] ?? 0)
  );
  const representativeCode = coveredDays
    .map(({ index }) => weather.daily.weather_code[index])
    .filter(Number.isFinite)
    .sort((a, b) => forecastPriority(b) - forecastPriority(a))[0] ?? 0;
  const theme = weatherTheme(representativeCode, true);
  const dateLabel = coveredDays.length === 1
    ? "1-day forecast"
    : `${coveredDays.length}-day forecast`;
  const rainLabel = rainChance >= 30 ? ` · Rain up to ${Math.round(rainChance)}%` : "";

  return (
    <Link
      href={FORECAST_URL}
      target="_blank"
      rel="noreferrer"
      aria-label={`Visit weather forecast: ${theme.label}, high ${high}, low ${low} degrees${rainChance >= 30 ? `, rain chance up to ${Math.round(rainChance)} percent` : ""}. Open full forecast.`}
      className="mt-2 inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-white transition-colors hover:bg-white/15"
    >
      <span role="img" aria-label={theme.label} className="leading-none">
        <theme.icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 truncate text-xs">
        <span className="font-semibold">Visit forecast</span>
        <span className="text-white/65"> · {dateLabel} · </span>
        {theme.label} · H {high}° / L {low}°{rainLabel}
      </span>
      <span aria-hidden="true" className="shrink-0 text-xs text-white/60">↗</span>
    </Link>
  );
}

const SEVERITY_ORDER: Record<string, number> = {
  Extreme: 0,
  Severe: 1,
  Moderate: 2,
  Minor: 3,
  Unknown: 4,
};

function AlertBanner({ alerts }: { alerts: WeatherAlert[] }) {
  if (alerts.length === 0) return null;
  const [primary] = [...alerts].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 5) - (SEVERITY_ORDER[b.severity] ?? 5)
  );
  const severe = alertIsSevere(primary.severity);
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white sm:px-4 sm:py-2 ${
        severe ? "bg-rust" : "bg-amber"
      }`}
    >
      <WarningIcon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">
        {primary.event}
        {alerts.length > 1 ? ` · +${alerts.length - 1} more` : ""}
      </span>
    </div>
  );
}

export async function LiveWeatherCard() {
  const [weather, alerts] = await Promise.all([lakeWeather(), lakeAlerts()]);

  if (!weather) {
    return (
      <div className="w-full overflow-hidden rounded-lh">
        <AlertBanner alerts={alerts} />
        <Link
          href={FORECAST_URL}
          target="_blank"
          rel="noreferrer"
          className="card group flex items-center justify-between gap-4 rounded-t-none p-4 transition-colors hover:border-water"
        >
          <div>
            <p className="section-label">Live weather · Lake Palestine</p>
            <p className="mt-1 font-semibold">Weather is temporarily unavailable</p>
          </div>
          <span className="text-sm font-semibold text-water group-hover:text-deep-2">
            Full forecast ↗
          </span>
        </Link>
      </div>
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
      className="group relative block w-full overflow-hidden rounded-lh border border-white/20 text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md"
      style={{ background: theme.background }}
    >
      <AlertBanner alerts={alerts} />
      <span
        aria-hidden
        className="absolute -right-8 -top-16 h-52 w-52 rounded-full bg-white/15 blur-2xl"
      />
      <span
        aria-hidden
        className="absolute -bottom-20 left-1/3 h-44 w-72 rounded-full bg-deep/20 blur-3xl"
      />
      <div className="relative p-4 sm:p-6">
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

        <div className="mt-2 flex items-center gap-3 sm:mt-3">
          <span
            role="img"
            aria-label={theme.label}
            className="drop-shadow-sm"
          >
            <theme.icon className="h-9 w-9 sm:h-11 sm:w-11" />
          </span>
          <div className="flex min-w-0 flex-1 items-end gap-2">
            <p className="font-display text-3xl leading-none sm:text-4xl">
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

        <div className="mt-2 flex gap-4 border-t border-white/20 pt-2 text-xs text-white/75 sm:mt-3">
          <span>Humidity {Math.round(current.relative_humidity_2m)}%</span>
          <span>Wind {Math.round(current.wind_speed_10m)} mph</span>
        </div>
      </div>
    </Link>
  );
}

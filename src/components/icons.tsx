/* A small, hand-drawn icon set matching the thin-stroke line style already
   used elsewhere in the app (the Chevron on Property Care, the calendar
   glyph on Plan a Stay, the checklist icon in the sidebar). Swapping these
   in for emoji keeps every icon the same weight, color (currentColor) and
   visual language instead of mixing in flat, OS-rendered color glyphs. */

type IconProps = { className?: string };

function Base({
  className = "h-4 w-4",
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

// Shared cloud silhouette so every weather icon that includes a cloud
// (overcast, fog, storm, snow, drizzle, rain) looks like the same cloud.
const CLOUD_D =
  "M4.6 11.6a2.4 2.4 0 0 1-.2-4.8 3.2 3.2 0 0 1 6.2-1A2.6 2.6 0 0 1 10.4 11.6H4.6Z";

export function HomeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 8.3 9 3.2l6 5.1" />
      <path d="M4.6 7.3V15h8.8V7.3" />
      <path d="M7.2 15v-4.3h3.6V15" />
    </Base>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="2.5" y="3.5" width="13" height="12" rx="1.5" />
      <path d="M5.5 2v3M12.5 2v3M2.5 7h13" />
    </Base>
  );
}

export function WrenchIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M11.8 3.3a3.1 3.1 0 0 0-4 4L3.3 11.8l2.9 2.9L10.7 10a3.1 3.1 0 0 0 4-4l-2.2 2.2-1.7-.4-.4-1.7 2.2-2.2Z" />
    </Base>
  );
}

export function ChecklistIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="3" width="12" height="12" rx="2.5" />
      <path d="M6 9.2 8 11.2 12.2 6.8" />
    </Base>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 4.8c-1.4-1.1-3.3-1.4-5.2-1.1v9.8c1.9-.3 3.8 0 5.2 1.1 1.4-1.1 3.3-1.4 5.2-1.1V3.7c-1.9-.3-3.8 0-5.2 1.1Z" />
      <path d="M9 4.8v9.8" />
    </Base>
  );
}

export function NoteIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 2.5h5.3L13.5 5.7V15.5H5V2.5Z" />
      <path d="M10.3 2.5v3.2h3.2" />
      <path d="M7 9.2h4M7 11.6h4" />
    </Base>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 16s5-5.3 5-9.2A5 5 0 1 0 4 6.8C4 10.7 9 16 9 16Z" />
      <circle cx="9" cy="6.8" r="1.8" />
    </Base>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 5h5M10.6 5H15M3 9h2M6.6 9H15M3 13h7M12.6 13H15" />
      <circle cx="8" cy="5" r="1.6" />
      <circle cx="4.6" cy="9" r="1.6" />
      <circle cx="9.6" cy="13" r="1.6" />
    </Base>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="7.6" cy="7.6" r="4.6" />
      <path d="M13.8 13.8 11 11" />
    </Base>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 2.4a3 3 0 0 0-3 3v1.2c0 1.7-.6 3.3-1.8 4.5l-.2.2h10l-.2-.2A6.2 6.2 0 0 1 12 6.6V5.4a3 3 0 0 0-3-3Z" />
      <path d="M7.3 13.3a1.9 1.9 0 0 0 3.4 0" />
    </Base>
  );
}

export function SailboatIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 2.4v7.6" />
      <path d="M9 3 12.6 10H9V3Z" />
      <path d="M2.3 13c1.8 1.7 4.2 2.6 6.7 2.6s4.9-.9 6.7-2.6" />
    </Base>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="9" cy="9" r="3.4" />
      <path d="M9 2.3v1.8M9 13.9v1.8M2.3 9h1.8M13.9 9h1.8M4.4 4.4l1.3 1.3M12.3 12.3l1.3 1.3M13.6 4.4l-1.3 1.3M5.7 12.3l-1.3 1.3" />
    </Base>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12.8 10.3A5.4 5.4 0 1 1 7.7 3a4.3 4.3 0 1 0 5.1 7.3Z" />
    </Base>
  );
}

export function CloudIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d={CLOUD_D} />
    </Base>
  );
}

export function CloudSunIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="6.3" cy="4.6" r="1.7" />
      <path d="M6.3 1.7v.9M3.6 2.9l.6.6M3.2 4.6h.9" />
      <path d={CLOUD_D} />
    </Base>
  );
}

export function CloudFogIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d={CLOUD_D} />
      <path d="M3 13.2h12M4.2 15.6h9.6" />
    </Base>
  );
}

export function CloudLightningIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d={CLOUD_D} />
      <path d="M9.6 10.6 7.2 14h2l-1 3 3.4-4.4H9.7l1-2Z" />
    </Base>
  );
}

export function CloudSnowIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d={CLOUD_D} />
      <circle cx="5.8" cy="13.4" r=".55" fill="currentColor" stroke="none" />
      <circle cx="8.6" cy="14.8" r=".55" fill="currentColor" stroke="none" />
      <circle cx="11.4" cy="13.4" r=".55" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function CloudDrizzleIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="6" cy="4.6" r="1.6" />
      <path d="M6 1.8v.8M3.5 2.9l.6.6M3.2 4.6h.9" />
      <path d={CLOUD_D} />
      <path d="M6.6 13.4l-.5 1.3M9.8 13.4l-.5 1.3" />
    </Base>
  );
}

export function CloudRainIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d={CLOUD_D} />
      <path d="M5.8 12.6v2.6M8.6 12.6v2.6M11.4 12.6v2.6" />
    </Base>
  );
}

export function WarningIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 2.6 16.3 15.4H1.7L9 2.6Z" />
      <path d="M9 7v3.6M9 13v.1" />
    </Base>
  );
}

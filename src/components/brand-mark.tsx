/*
  The Lakehouse mark: LH monogram over water lines in a bordered rounded
  square. From the family-approved logo (see src/app/icon.svg for the favicon
  cut). Renders in currentColor so it works light-on-deep and ink-on-mist.
*/
const SIZES = {
  sm: { box: "h-10 w-10", text: "text-sm", wave: 14 },
  lg: { box: "h-12 w-12", text: "text-lg", wave: 18 },
} as const;

export function BrandMark({ size = "sm" }: { size?: keyof typeof SIZES }) {
  const s = SIZES[size];
  return (
    <span
      className={`${s.box} rounded-lh border border-white/25 flex flex-col items-center justify-center text-white shrink-0`}
    >
      <span className={`font-display ${s.text} leading-none`}>LH</span>
      <svg
        aria-hidden
        width={s.wave}
        height="6"
        viewBox="0 0 18 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        className="mt-1 opacity-80"
      >
        <path d="M1 2c1.7-1.6 3.3-1.6 5 0s3.3 1.6 5 0 3.3-1.6 5 0" />
        <path d="M3 5c1.5-1.4 3-1.4 4.5 0s3 1.4 4.5 0 3-1.4 4.5 0" />
      </svg>
    </span>
  );
}

import Image from "next/image";
import painePointeLogo from "@/assets/paine-pointe-logo.png";

const SIZES = {
  sm: "w-28",
  lg: "w-56 max-w-full",
} as const;
const WORD_SIZES = {
  sm: "text-[19px]",
  lg: "text-[38px]",
} as const;
const POINTE_SIZES = {
  sm: "text-[22px]",
  lg: "text-[44px]",
} as const;

export function BrandMark({ size = "sm" }: { size?: keyof typeof SIZES }) {
  return (
    <span className={`relative inline-flex shrink-0 ${SIZES[size]}`}>
      <Image
        src={painePointeLogo}
        alt="Paine Pointe"
        loading="eager"
        placeholder="blur"
        className="h-auto w-full rounded-lh bg-white shadow-sm"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-lh bg-deep"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <svg width="91%" height="94%" viewBox="0 0 36 24" aria-hidden="true">
          <path d="M2 7 18 0 34 7v15H2V7Z" fill="white" />
        </svg>
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[10%] top-[12%] flex h-[34%] items-center justify-center bg-white"
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-[13%] top-[24%] z-10 flex h-[24%] items-center justify-center font-display leading-none text-[#8b1e3f] ${WORD_SIZES[size]}`}
      >
        Paine
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[10%] top-[48%] flex h-[35%] items-center justify-center bg-white"
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-[13%] top-[53%] z-10 flex h-[24%] items-center justify-center font-display leading-none text-[#8b1e3f] ${POINTE_SIZES[size]}`}
      >
        Pointe
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center text-[#8a8175]"
      >
        <svg
          width="91%"
          height="94%"
          viewBox="0 0 36 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 7 18 0 34 7v15H2V7Z" />
        </svg>
      </span>
    </span>
  );
}

import Image from "next/image";
import painePointeLogo from "@/assets/paine-pointe-logo.png";

const SIZES = {
  sm: "w-28",
  lg: "w-56 max-w-full",
} as const;

export function BrandMark({ size = "sm" }: { size?: keyof typeof SIZES }) {
  return (
    <Image
      src={painePointeLogo}
      alt="Paine Pointe"
      loading="eager"
      placeholder="blur"
      className={`${SIZES[size]} h-auto shrink-0 rounded-lh bg-white shadow-sm`}
    />
  );
}

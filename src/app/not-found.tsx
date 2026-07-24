import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center p-6 bg-deep">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <BrandMark size="lg" />
        </div>
        <h1 className="font-display text-3xl text-white">
          Nothing at this address
        </h1>
        <p className="mt-2 text-sm text-white/60">
          The page you followed does not exist anymore.
        </p>
        <Link href="/" className="btn btn-primary mt-6">
          Back to the house
        </Link>
      </div>
    </main>
  );
}

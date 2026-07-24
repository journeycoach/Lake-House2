"use client";

import { BrandMark } from "@/components/brand-mark";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex-1 flex items-center justify-center p-6 bg-deep">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <BrandMark size="lg" />
        </div>
        <h1 className="font-display text-3xl text-white">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-white/60">
          The house hit a snag loading this page. Try again, and tell Jeff or
          John if it keeps happening.
        </p>
        <button type="button" onClick={reset} className="btn btn-primary mt-6">
          Try again
        </button>
      </div>
    </main>
  );
}

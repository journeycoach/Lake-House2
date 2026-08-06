import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { RequestForm } from "./request-form";

export const metadata: Metadata = { title: "Ask to join · Paine Pointe" };

export default function RequestPage() {
  return (
    <main className="flex-1 flex items-center justify-center p-6 bg-deep">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <BrandMark size="lg" />
          </div>
          <h1 className="font-display text-3xl text-white">Ask to join</h1>
          <p className="mt-2 text-sm text-white/60">
            Family and household members only. An admin approves everyone by
            hand.
          </p>
        </div>
        <RequestForm />
        <p className="mt-4 text-center text-sm text-white/60">
          <Link href="/signin" className="underline hover:text-white">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

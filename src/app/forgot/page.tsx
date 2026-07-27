import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Forgot password · The Lakehouse" };

export default function ForgotPage() {
  return (
    <main className="flex-1 flex items-center justify-center p-6 bg-deep">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <BrandMark size="lg" />
          </div>
          <h1 className="font-display text-3xl text-white">Forgot password</h1>
          <p className="mt-2 text-sm text-white/60">
            We will email you a link to set a new one.
          </p>
        </div>
        <ForgotForm />
        <p className="mt-4 text-center text-sm text-white/60">
          <Link href="/signin" className="underline hover:text-white">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

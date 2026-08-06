import type { Metadata } from "next";
import { BrandMark } from "@/components/brand-mark";
import { SignInForm } from "./signin-form";

export const metadata: Metadata = { title: "Sign in · Paine Pointe" };

export default function SignInPage() {
  return (
    <main className="flex-1 flex items-center justify-center p-6 bg-deep">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <BrandMark size="lg" />
          </div>
          <p className="mt-4 text-sm text-white/60">
            Family only. Sign in to see the calendar, notes, and house guide.
          </p>
        </div>
        <SignInForm />
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import { SignInForm } from "./signin-form";

export const metadata: Metadata = { title: "Sign in · The Lakehouse" };

export default function SignInPage() {
  return (
    <main className="flex-1 flex items-center justify-center p-6 bg-deep">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-lh border border-white/25 flex items-center justify-center">
            <span className="font-display text-lg text-white">LH</span>
          </div>
          <h1 className="font-display text-3xl text-white">The Lakehouse</h1>
          <p className="mt-2 text-sm text-white/60">
            Family only. Sign in to see the calendar, notes, and house guide.
          </p>
        </div>
        <SignInForm />
      </div>
    </main>
  );
}

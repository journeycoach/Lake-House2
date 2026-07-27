import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { readToken } from "@/lib/tokens";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Set a password · The Lakehouse" };

export default async function ResetPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  // An invite link and a reset link look identical to the person using them;
  // only the wording differs, so accept either.
  const reset = await readToken(token, "reset");
  const invite = reset ? null : await readToken(token, "invite");
  const valid = reset ?? invite;

  return (
    <main className="flex-1 flex items-center justify-center p-6 bg-deep">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <BrandMark size="lg" />
          </div>
          <h1 className="font-display text-3xl text-white">
            {invite ? "Welcome to the lakehouse" : "Set a new password"}
          </h1>
          {valid ? (
            <p className="mt-2 text-sm text-white/60">
              {invite
                ? "Pick a password and you are in."
                : "Pick something only you know."}
            </p>
          ) : null}
        </div>

        {valid ? (
          <ResetForm token={token} />
        ) : (
          <div className="card p-6">
            <p className="text-sm">
              This link has expired or was already used. Ask for a new one and
              it will arrive in a moment.
            </p>
            <Link href="/forgot" className="btn btn-primary mt-4 w-full">
              Send a new link
            </Link>
          </div>
        )}

        <p className="mt-4 text-center text-sm text-white/60">
          <Link href="/signin" className="underline hover:text-white">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

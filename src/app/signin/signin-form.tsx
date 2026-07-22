"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "./actions";

const initial: SignInState = {};

export function SignInForm() {
  const [state, formAction, pending] = useActionState(signIn, initial);

  return (
    <form action={formAction} className="card p-6 space-y-4">
      <div>
        <label htmlFor="email" className="flabel">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="field"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="flabel">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="field"
        />
      </div>
      {state.error ? (
        <p className="text-sm font-medium text-rust">{state.error}</p>
      ) : null}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Signing in" : "Sign in"}
      </button>
      <p className="text-xs text-ink-faint">
        Forgot your password? Any admin can reset it from the Admin page.
      </p>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { requestReset, type ForgotState } from "./actions";

const initial: ForgotState = {};

export function ForgotForm() {
  const [state, action, pending] = useActionState(requestReset, initial);

  if (state.sent) {
    return (
      <div className="card p-6">
        <p className="text-sm">
          If that address belongs to an account, a reset link is on its way.
          It works once and expires in an hour.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="card p-6 space-y-4">
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
      {state.error ? (
        <p className="text-sm font-medium text-rust">{state.error}</p>
      ) : null}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Sending" : "Send reset link"}
      </button>
    </form>
  );
}

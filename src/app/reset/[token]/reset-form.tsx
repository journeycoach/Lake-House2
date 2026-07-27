"use client";

import { useActionState } from "react";
import { setNewPassword, type ResetState } from "@/app/forgot/actions";

const initial: ResetState = {};

export function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(setNewPassword, initial);

  return (
    <form action={action} className="card p-6 space-y-4">
      <input type="hidden" name="token" value={token} />
      <div>
        <label htmlFor="password" className="flabel">
          New password (8 or more characters)
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="field"
        />
      </div>
      {state.error ? (
        <p className="text-sm font-medium text-rust">{state.error}</p>
      ) : null}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Saving" : "Save and sign in"}
      </button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import {
  updateProfile,
  changePassword,
  type AccountState,
} from "./actions";

const initial: AccountState = {};

function Feedback({ state }: { state: AccountState }) {
  if (state.error)
    return <p className="text-sm font-medium text-rust">{state.error}</p>;
  if (state.saved)
    return <p className="text-sm font-medium text-sage">Saved.</p>;
  return null;
}

export function ProfileForm({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const [state, action, pending] = useActionState(updateProfile, initial);
  return (
    <form action={action} className="mt-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="flabel">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={name}
            maxLength={200}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="email" className="flabel">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={email}
            maxLength={254}
            className="field"
          />
        </div>
      </div>
      <Feedback state={state} />
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Saving" : "Save details"}
      </button>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, initial);
  return (
    <form action={action} className="mt-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="current" className="flabel">
            Current password
          </label>
          <input
            id="current"
            name="current"
            type="password"
            autoComplete="current-password"
            required
            className="field"
          />
        </div>
        <div>
          <label htmlFor="next" className="flabel">
            New password (8+)
          </label>
          <input
            id="next"
            name="next"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="field"
          />
        </div>
      </div>
      <Feedback state={state} />
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Changing" : "Change password"}
      </button>
    </form>
  );
}

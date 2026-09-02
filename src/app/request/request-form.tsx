"use client";

import { useActionState } from "react";
import { requestAccess, type RequestState } from "./actions";

const initial: RequestState = {};

export function RequestForm() {
  const [state, action, pending] = useActionState(requestAccess, initial);

  if (state.sent) {
    return (
      <div className="card p-6">
        <p className="text-sm">
          Thanks. An admin will take a look, and you will get an email if they
          let you in.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="card p-6 space-y-4">
      {/* Honeypot: invisible to a real person, so any submission with it
          filled in is treated as spam and dropped silently. */}
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
      >
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div>
        <label htmlFor="name" className="flabel">
          Your name
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={200}
          className="field"
          placeholder="First and last"
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
          autoComplete="email"
          required
          maxLength={254}
          className="field"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="message" className="flabel">
          Who are you? (optional)
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          maxLength={4000}
          className="field"
          placeholder="Emma's husband, we come up in August"
        />
      </div>
      {state.error ? (
        <p className="text-sm font-medium text-rust">{state.error}</p>
      ) : null}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Sending" : "Ask to join"}
      </button>
    </form>
  );
}

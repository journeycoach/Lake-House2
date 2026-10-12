"use client";

import { useState } from "react";

/* The checkbox used to check a shopping list item off. Flips to a filled,
   checked state the instant it's tapped (before the server round trip
   finishes), so checking an item off always shows a clear confirmation
   instead of the row just vanishing on the next page refresh. */
export function CheckoffButton({
  id,
  done,
  label,
  action,
  onToggle,
  fields,
}: {
  id: number;
  done: boolean;
  label: string;
  action: (formData: FormData) => void;
  onToggle?: () => void;
  /* Extra hidden fields the action needs besides "id" (e.g. a fixed
     status="done" for a list that only ever marks items complete). */
  fields?: Record<string, string>;
}) {
  const [checked, setChecked] = useState(done);

  return (
    <form
      action={action}
      onSubmit={() => {
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate(10);
        }
        setChecked((value) => !value);
        onToggle?.();
      }}
      className="shrink-0"
    >
      <input type="hidden" name="id" value={id} />
      {fields
        ? Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))
        : null}
      <button
        type="submit"
        aria-label={label}
        aria-pressed={checked}
        className={`check-control flex items-center justify-center rounded-md border transition-colors duration-150 ${
          checked
            ? "border-sage bg-sage text-white hover:bg-deep"
            : "border-sand-line bg-white hover:border-water hover:bg-mist"
        }`}
      >
        {checked ? (
          <svg
            width="12"
            height="12"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1.5 5.5L4 8l4.5-6" />
          </svg>
        ) : null}
      </button>
    </form>
  );
}

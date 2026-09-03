"use client";

import { useId, useState, type ReactNode } from "react";

export function PersonRow({
  name,
  email,
  isYou,
  roleLabel,
  colorDot,
  children,
}: {
  name: string;
  email: string;
  isYou: boolean;
  roleLabel: string;
  colorDot: ReactNode;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();

  return (
    <li className="border-t border-sand-line first:border-0">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 py-4 text-left"
      >
        {colorDot}
        <span className="min-w-0 flex-1 basis-40">
          <span className="flex items-center gap-2 font-semibold">
            <span className="truncate">{name}</span>
            {isYou ? (
              <span className="text-xs font-medium text-ink-faint">you</span>
            ) : null}
          </span>
          <span className="block truncate text-sm text-ink-soft">{email}</span>
        </span>
        <span className="chip chip-whenever shrink-0">{roleLabel}</span>
        <svg
          aria-hidden
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-ink-faint transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        >
          <path d="m4 7 5 5 5-5" />
        </svg>
      </button>

      <div id={contentId} className={expanded ? "block space-y-3 pb-4" : "hidden"}>
        {children}
      </div>
    </li>
  );
}

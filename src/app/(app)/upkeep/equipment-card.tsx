"use client";

import { useId, useState, type ReactNode } from "react";

export function EquipmentCard({
  name,
  category,
  location,
  serviceRecordCount,
  children,
}: {
  name: string;
  category: string;
  location: string | null;
  serviceRecordCount: number;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();

  return (
    <article className="card overflow-hidden sm:overflow-visible sm:p-5">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={() => setExpanded((current) => !current)}
        className={`flex w-full items-center justify-between gap-3 p-4 text-left sm:hidden ${
          expanded ? "border-b border-sand-line" : ""
        }`}
      >
        <span className="min-w-0">
          <span className="block text-xs font-semibold uppercase tracking-wider text-ink-faint">
            {category}
          </span>
          <span className="font-display mt-0.5 block truncate text-lg">
            {name}
          </span>
          <span className="mt-0.5 block truncate text-xs text-ink-soft">
            {[
              location,
              `${serviceRecordCount} service ${serviceRecordCount === 1 ? "record" : "records"}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </span>
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

      <div id={contentId} className={expanded ? "block" : "hidden sm:block"}>
        {children}
      </div>
    </article>
  );
}

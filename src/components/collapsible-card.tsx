import type { ReactNode } from "react";

export function CollapsibleCard({
  id,
  label,
  title,
  description,
  className = "",
  children,
}: {
  id?: string;
  label: string;
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <details
      id={id}
      className={`card group mb-6 scroll-mt-4 ${className}`}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 [&::-webkit-details-marker]:hidden">
        <div>
          <p className="section-label">{label}</p>
          <h2 className="font-display mt-1 text-2xl">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-ink-soft">{description}</p>
          ) : null}
        </div>
        <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-water">
          View
          <svg
            aria-hidden
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform group-open:rotate-180"
          >
            <path d="m4 6 4 4 4-4" />
          </svg>
        </span>
      </summary>
      <div className="border-t border-sand-line px-6 pb-6 pt-5">
        {children}
      </div>
    </details>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type QuickAction = {
  href: string;
  label: string;
  className: string;
};

/*
  Same three buttons everywhere at sm: and up. Below that, they collapse into
  one "Quick actions" trigger so the header does not compete with the page
  title for space on a phone.
*/
export function QuickActionsMenu({ actions }: { actions: QuickAction[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <div className="hidden w-full flex-wrap items-center gap-2 sm:flex sm:w-auto">
        {actions.map((action) => (
          <Link key={action.href} href={action.href} className={action.className}>
            {action.label}
          </Link>
        ))}
      </div>
      <div ref={rootRef} className="relative w-full sm:hidden">
        <button
          type="button"
          aria-haspopup="true"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="btn btn-primary flex w-full items-center justify-center gap-2"
        >
          Quick actions
          <span aria-hidden className={`transition-transform ${open ? "rotate-180" : ""}`}>
            ▾
          </span>
        </button>
        {open ? (
          <div className="absolute right-0 z-20 mt-2 w-full min-w-[220px] rounded-lh border border-sand-line bg-card p-1.5 shadow-lg">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2.5 text-sm font-semibold text-ink hover:bg-mist"
              >
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "./brand-mark";

export type NavUser = { name: string; role: string };

const LINKS: { href: string; label: string; adminOnly?: boolean }[] = [
  { href: "/", label: "Home" },
  { href: "/calendar", label: "Calendar" },
  { href: "/notes", label: "Family notes" },
  { href: "/upkeep", label: "Upkeep" },
  { href: "/checklist", label: "Checklist" },
  { href: "/guide", label: "House guide" },
  { href: "/activity", label: "Activity", adminOnly: true },
  { href: "/admin", label: "Admin", adminOnly: true },
];

function NavLinks({
  user,
  onNavigate,
}: {
  user: NavUser;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {LINKS.filter((l) => !l.adminOnly || user.role === "admin").map((l) => {
        const active =
          l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            className={`rounded-lh px-4 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-white/10 text-white"
                : "text-white/65 hover:text-white hover:bg-white/5"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Mark() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <BrandMark size="sm" />
      <span>
        <span className="block font-display text-lg leading-tight text-white">
          The Lakehouse
        </span>
        <span className="block text-xs text-white/55">Our family place</span>
      </span>
    </Link>
  );
}

export function Sidebar({
  user,
  status,
  signOutSlot,
  previewSlot,
}: {
  user: NavUser;
  status: string;
  signOutSlot: React.ReactNode;
  previewSlot?: React.ReactNode;
}) {
  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-deep p-6 sticky top-0 h-screen">
      <Mark />
      <div className="mt-10 flex-1">
        <NavLinks user={user} />
      </div>
      <div className="border-t border-white/15 pt-4 space-y-3">
        <p className="text-sm text-white/80">
          House is {status.toLowerCase()}
        </p>
        {previewSlot}
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/account"
            className="text-sm font-semibold text-white hover:underline"
          >
            {user.name}
          </Link>
          {signOutSlot}
        </div>
      </div>
    </aside>
  );
}

export function MobileHeader({
  user,
  status,
  signOutSlot,
  previewSlot,
}: {
  user: NavUser;
  status: string;
  signOutSlot: React.ReactNode;
  previewSlot?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <header className="lg:hidden sticky top-0 z-40 bg-deep">
      <div className="flex items-center justify-between p-4">
        <Mark />
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="h-10 w-10 rounded-lh border border-white/25 flex items-center justify-center text-white"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            {open ? (
              <>
                <path d="M3 3l12 12" />
                <path d="M15 3L3 15" />
              </>
            ) : (
              <>
                <path d="M2 4.5h14" />
                <path d="M2 9h14" />
                <path d="M2 13.5h14" />
              </>
            )}
          </svg>
        </button>
      </div>
      {open ? (
        <div className="border-t border-white/15 p-4 pb-6 space-y-4">
          <NavLinks user={user} onNavigate={() => setOpen(false)} />
          <div className="border-t border-white/15 pt-4 space-y-3">
            {previewSlot}
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/80">
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="font-semibold text-white hover:underline"
                >
                  {user.name}
                </Link>{" "}
                · house is {status.toLowerCase()}
              </p>
              {signOutSlot}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

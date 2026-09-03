"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useState } from "react";
import { BrandMark } from "./brand-mark";

export type NavUser = { name: string; role: string };

const LINKS: {
  href: string;
  label: string;
  icon?: string;
  adminOnly?: boolean;
  separatorBefore?: boolean;
}[] = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/calendar", label: "Calendar", icon: "📅" },
  { href: "/upkeep", label: "Property Care", icon: "🛠️" },
  { href: "/checklist", label: "Shopping List", icon: "✅" },
  { href: "/guide", label: "House guide", icon: "📖" },
  { href: "/notes", label: "FYI Everyone", icon: "📝" },
  {
    href: "/admin",
    label: "Admin",
    icon: "⚙️",
    adminOnly: true,
    separatorBefore: true,
  },
];

const MOBILE_PRIMARY_LINKS = LINKS.slice(0, 4);

function MobileBottomNav({
  open,
  onMore,
  onNavigate,
}: {
  open: boolean;
  onMore: () => void;
  onNavigate: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-white/15 bg-deep/98 px-1 pt-1 text-white shadow-[0_-8px_24px_rgba(17,51,53,0.2)] backdrop-blur-sm [padding-bottom:max(0.25rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      {MOBILE_PRIMARY_LINKS.map((link) => {
        const active =
          link.href === "/"
            ? pathname === "/"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-semibold transition-colors ${
              active ? "bg-white/10 text-white" : "text-white/65 hover:text-white"
            }`}
          >
            <span aria-hidden className="text-base leading-none">
              {link.icon}
            </span>
            <span className="max-w-full truncate">{link.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        aria-label={open ? "Close more navigation" : "Open more navigation"}
        aria-expanded={open}
        onClick={onMore}
        className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-semibold transition-colors ${
          open ? "bg-white/10 text-white" : "text-white/65 hover:text-white"
        }`}
      >
        <span aria-hidden className="text-lg leading-none">•••</span>
        <span>More</span>
      </button>
    </nav>
  );
}

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
          <Fragment key={l.href}>
            {l.separatorBefore ? (
              <div aria-hidden className="my-2 border-t border-white/15" />
            ) : null}
            <Link
              href={l.href}
              onClick={onNavigate}
              className={`rounded-lh px-4 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-white/10 text-white"
                  : "text-white/65 hover:text-white hover:bg-white/5"
              }`}
            >
              {l.icon ? (
                <span aria-hidden className="mr-2 inline-block w-5 text-center">
                  {l.icon}
                </span>
              ) : null}
              {l.label}
            </Link>
          </Fragment>
        );
      })}
    </nav>
  );
}

function Mark() {
  return (
    <Link href="/" className="inline-flex">
      <BrandMark size="sm" />
    </Link>
  );
}

export function Sidebar({
  user,
  status,
  version,
  signOutSlot,
  previewSlot,
}: {
  user: NavUser;
  status: string;
  version: string;
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
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/35">
          Version {version}
        </p>
      </div>
    </aside>
  );
}

export function MobileHeader({
  user,
  status,
  version,
  signOutSlot,
  previewSlot,
}: {
  user: NavUser;
  status: string;
  version: string;
  signOutSlot: React.ReactNode;
  previewSlot?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
    <header className="lg:hidden sticky top-0 z-40 bg-deep">
      <div className="flex items-center justify-between p-4">
        <Mark />
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-11 w-11 items-center justify-center rounded-lh border border-white/25 text-white"
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
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/35">
              Version {version}
            </p>
          </div>
        </div>
      ) : null}
    </header>
    <MobileBottomNav
      open={open}
      onMore={() => setOpen((value) => !value)}
      onNavigate={() => setOpen(false)}
    />
    </>
  );
}

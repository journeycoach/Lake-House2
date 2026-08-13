import Link from "next/link";

export function AdminTabs({ active }: { active: "admin" | "activity" }) {
  return (
    <nav
      aria-label="Admin sections"
      className="mb-6 flex gap-1 rounded-lh border border-sand-line bg-white/60 p-1"
    >
      <Link
        href="/admin"
        aria-current={active === "admin" ? "page" : undefined}
        className={`flex-1 rounded-[8px] px-4 py-3 text-center text-sm font-semibold transition-colors ${
          active === "admin"
            ? "bg-deep text-white shadow-sm"
            : "text-ink-soft hover:bg-white hover:text-ink"
        }`}
      >
        Admin Settings
      </Link>
      <Link
        href="/activity"
        aria-current={active === "activity" ? "page" : undefined}
        className={`flex-1 rounded-[8px] px-4 py-3 text-center text-sm font-semibold transition-colors ${
          active === "activity"
            ? "bg-deep text-white shadow-sm"
            : "text-ink-soft hover:bg-white hover:text-ink"
        }`}
      >
        Site Activity
      </Link>
    </nav>
  );
}

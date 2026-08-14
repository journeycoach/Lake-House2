import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { AdminTabs } from "@/components/admin-tabs";

export const metadata: Metadata = { title: "Activity · Paine Pointe" };

function fmtStamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/* Admin-only history: every content action plus sign-in attempts. */
export default async function ActivityPage() {
  await requireAdmin();
  const [activity, logins] = await Promise.all([
    getDb()
      .select()
      .from(schema.activityLog)
      .orderBy(desc(schema.activityLog.id))
      .limit(200),
    getDb()
      .select()
      .from(schema.loginEvents)
      .orderBy(desc(schema.loginEvents.id))
      .limit(50),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Site Activity"
        action={<span className="chip chip-whenever">Admin only</span>}
      />
      <AdminTabs active="activity" />

      <section className="card p-4 sm:p-6">
        <p className="section-label">Recent activity</p>
        <h2 className="font-display text-2xl mt-1">Who did what, when</h2>
        <ul className="mt-4 space-y-2">
          {activity.map((a) => (
            <li
              key={a.id}
              className="flex items-baseline justify-between gap-4 border-t border-sand-line pt-2 text-sm first:border-0 first:pt-0"
            >
              <span className="min-w-0">
                <span className="font-semibold">{a.userName}</span>{" "}
                <span className="text-ink-soft">{a.action}</span>
                {a.detail ? (
                  <span className="text-ink-faint"> · {a.detail}</span>
                ) : null}
              </span>
              <span className="shrink-0 text-xs text-ink-faint">
                {fmtStamp(a.at)}
              </span>
            </li>
          ))}
          {activity.length === 0 ? (
            <li className="text-sm text-ink-soft">Nothing logged yet.</li>
          ) : null}
        </ul>
      </section>

      <section className="card mt-4 p-4 sm:mt-6 sm:p-6">
        <p className="section-label">Sign-in activity</p>
        <h2 className="font-display text-2xl mt-1">Last 50 attempts</h2>
        <ul className="mt-4 space-y-2">
          {logins.map((l) => (
            <li
              key={l.id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="min-w-0 truncate">{l.email}</span>
              <span className="flex shrink-0 items-center gap-3">
                <span className={`chip ${l.success ? "chip-ready" : "chip-urgent"}`}>
                  {l.success ? "ok" : "failed"}
                </span>
                <span className="text-xs text-ink-faint">{fmtStamp(l.at)}</span>
              </span>
            </li>
          ))}
          {logins.length === 0 ? (
            <li className="text-sm text-ink-soft">No sign-ins yet.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}

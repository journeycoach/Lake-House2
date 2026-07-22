import type { Metadata } from "next";
import { asc, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { householdVar, HOUSEHOLD_TOKENS } from "@/lib/colors";
import { ROLES, roleLabel } from "@/lib/roles";
import { PageHeader } from "@/components/page-header";
import {
  addUser,
  resetPassword,
  setRole,
  removeUser,
  setHouseStatus,
  addHousehold,
} from "./actions";

export const metadata: Metadata = { title: "Admin · The Lakehouse" };

function fmtStamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AdminPage() {
  const admin = await requireAdmin();
  const [users, households, logins, mails, activity] = await Promise.all([
    db.select().from(schema.users).orderBy(asc(schema.users.name)),
    db.select().from(schema.households).orderBy(asc(schema.households.name)),
    db
      .select()
      .from(schema.loginEvents)
      .orderBy(desc(schema.loginEvents.id))
      .limit(30),
    db.select().from(schema.outbox).orderBy(desc(schema.outbox.id)).limit(30),
    db
      .select()
      .from(schema.activityLog)
      .orderBy(desc(schema.activityLog.id))
      .limit(50),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Admin" action={<span className="chip chip-whenever">Admin only</span>} />

      {/* Family accounts */}
      <section className="card p-6">
        <p className="section-label">Family accounts</p>
        <h2 className="font-display text-2xl mt-1">Who can sign in</h2>
        <ul className="mt-4">
          {users.map((u) => (
            <li
              key={u.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-sand-line py-4 first:border-0"
            >
              <div className="min-w-0 flex-1 basis-48">
                <p className="font-semibold">
                  {u.name}
                  {u.id === admin.id ? (
                    <span className="ml-2 text-xs font-medium text-ink-faint">you</span>
                  ) : null}
                </p>
                <p className="truncate text-sm text-ink-soft">{u.email}</p>
              </div>
              {u.id !== admin.id ? (
                <div className="flex items-center gap-3">
                  <form action={setRole} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={u.id} />
                    <select
                      name="role"
                      defaultValue={u.role}
                      className="field w-44 py-2 text-sm"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="btn btn-quiet py-2">
                      Set
                    </button>
                  </form>
                  <form action={removeUser}>
                    <input type="hidden" name="id" value={u.id} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-ink-faint hover:text-rust"
                    >
                      Remove
                    </button>
                  </form>
                </div>
              ) : (
                <span className="chip chip-whenever">{roleLabel(u.role)}</span>
              )}
              <form action={resetPassword} className="flex w-full items-center gap-2 sm:w-auto">
                <input type="hidden" name="id" value={u.id} />
                <input
                  type="password"
                  name="password"
                  minLength={8}
                  placeholder="New password (8+)"
                  className="field flex-1 py-2 text-sm sm:w-44"
                />
                <button type="submit" className="btn btn-quiet shrink-0 py-2">
                  Reset
                </button>
              </form>
            </li>
          ))}
        </ul>

        <div className="mt-6 border-t border-sand-line pt-4">
          <h3 className="font-semibold">Add a person</h3>
          <form action={addUser} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input name="name" required placeholder="Name" className="field" />
            <input name="email" type="email" required placeholder="Email" className="field" />
            <input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="Starting password (8+)"
              className="field"
            />
            <select name="role" className="field" defaultValue="family">
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <select name="householdId" className="field" defaultValue="">
              <option value="">No household</option>
              {households.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-primary">
              Add person
            </button>
          </form>
        </div>
      </section>

      {/* Households + status */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <p className="section-label">Households</p>
          <h2 className="font-display text-2xl mt-1">Calendar colors</h2>
          <ul className="mt-4 space-y-2">
            {households.map((h) => (
              <li key={h.id} className="flex items-center gap-3 text-sm">
                <span
                  aria-hidden
                  className="h-3 w-3 rounded-full"
                  style={{ background: householdVar(h.color) }}
                />
                {h.name}
              </li>
            ))}
          </ul>
          <form action={addHousehold} className="mt-4 flex flex-wrap items-center gap-2 border-t border-sand-line pt-4">
            <input name="name" required placeholder="New household" className="field flex-1" />
            <select name="color" className="field w-28">
              {HOUSEHOLD_TOKENS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-quiet">
              Add
            </button>
          </form>
        </section>

        <section className="card p-6">
          <p className="section-label">House status</p>
          <h2 className="font-display text-2xl mt-1">Shown to everyone</h2>
          <form action={setHouseStatus} className="mt-4 flex items-center gap-2">
            <input
              name="value"
              required
              placeholder="Ready"
              className="field flex-1"
            />
            <button type="submit" className="btn btn-quiet shrink-0">
              Update
            </button>
          </form>
          <p className="mt-2 text-xs text-ink-faint">
            Keep it short: Ready, Winterized, Water off, Under repair.
          </p>
        </section>
      </div>

      {/* Recent activity */}
      <section className="card mt-6 p-6">
        <p className="section-label">Recent activity</p>
        <h2 className="font-display text-2xl mt-1">Who did what, when</h2>
        <ul className="mt-4 space-y-2">
          {activity.map((a) => (
            <li
              key={a.id}
              className="flex items-baseline justify-between gap-4 text-sm"
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

      {/* Sign-ins + outbox */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <p className="section-label">Sign-in activity</p>
          <h2 className="font-display text-2xl mt-1">Last 30 attempts</h2>
          <ul className="mt-4 space-y-2">
            {logins.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 text-sm">
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

        <section className="card p-6">
          <p className="section-label">Mail outbox</p>
          <h2 className="font-display text-2xl mt-1">What the app has sent</h2>
          <p className="mt-1 text-xs text-ink-faint">
            Without a mail key set, messages are logged here instead of sent.
          </p>
          <ul className="mt-4 space-y-2">
            {mails.map((m) => (
              <li key={m.id} className="text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate font-medium">{m.subject}</span>
                  <span className={`chip shrink-0 ${m.status === "sent" ? "chip-ready" : m.status === "failed" ? "chip-urgent" : "chip-whenever"}`}>
                    {m.status}
                  </span>
                </div>
                <p className="text-xs text-ink-faint">
                  to {m.toEmail} · {m.kind} · {fmtStamp(m.createdAt)}
                </p>
              </li>
            ))}
            {mails.length === 0 ? (
              <li className="text-sm text-ink-soft">Nothing sent yet.</li>
            ) : null}
          </ul>
        </section>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { asc, desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { approveRequest, declineRequest } from "./request-actions";
import { clearHistory } from "./storage-actions";
import { storageReport } from "@/lib/backup";
import { householdVar, HOUSEHOLD_TOKENS } from "@/lib/colors";
import { ROLES, roleLabel } from "@/lib/roles";
import { PageHeader } from "@/components/page-header";
import { StayChecklistTemplates } from "./stay-checklist-templates";
import {
  addUser,
  resetPassword,
  setRole,
  removeUser,
  setHouseStatus,
  setUserColor,
} from "./actions";

export const metadata: Metadata = { title: "Admin · Paine Pointe" };

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
  const [users, households, mails, requests, storage, stayTemplates] = await Promise.all([
    getDb()
      .select()
      .from(schema.users)
      .orderBy(asc(schema.users.createdAt), asc(schema.users.id)),
    getDb().select().from(schema.households).orderBy(asc(schema.households.name)),
    getDb().select().from(schema.outbox).orderBy(desc(schema.outbox.id)).limit(30),
    getDb()
      .select()
      .from(schema.accessRequests)
      .where(eq(schema.accessRequests.status, "pending"))
      .orderBy(asc(schema.accessRequests.id)),
    storageReport(),
    getDb()
      .select()
      .from(schema.stayChecklistTemplates)
      .where(eq(schema.stayChecklistTemplates.active, 1))
      .orderBy(
        asc(schema.stayChecklistTemplates.phase),
        asc(schema.stayChecklistTemplates.position)
      ),
  ]);
  const householdsById = new Map(
    households.map((household) => [household.id, household])
  );
  const householdsByColor = new Map<string, typeof households>();
  for (const household of households) {
    const group = householdsByColor.get(household.color) ?? [];
    group.push(household);
    householdsByColor.set(household.color, group);
  }
  const firstAvailableColor =
    HOUSEHOLD_TOKENS.find((token) => !householdsByColor.has(token)) ?? "";
  const currentUser = users.find((user) => user.id === admin.id);
  const orderedUsers = currentUser
    ? [currentUser, ...users.filter((user) => user.id !== admin.id)]
    : users;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Admin" action={<span className="chip chip-whenever">Admin only</span>} />

      <section className="card mb-6 p-6">
        <p className="section-label">House status</p>
        <h2 className="font-display text-2xl mt-1">Shown to everyone</h2>
        <form action={setHouseStatus} className="mt-4 flex items-center gap-2">
          <input
            name="value"
            required
            placeholder="Ready"
            maxLength={200}
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

      <StayChecklistTemplates templates={stayTemplates} />

      {/* Pending access requests. Only rendered when someone is waiting, so
          the page stays quiet the rest of the time. */}
      {requests.length > 0 ? (
        <section id="requests" className="card mb-6 border-rust p-6">
          <p className="section-label">Waiting on you</p>
          <h2 className="font-display text-2xl mt-1">
            {requests.length} {requests.length === 1 ? "person wants" : "people want"} in
          </h2>
          <ul className="mt-4">
            {requests.map((r) => (
              <li
                key={r.id}
                className="border-t border-sand-line py-4 first:border-0 first:pt-0"
              >
                <p className="font-semibold">{r.name}</p>
                <p className="text-sm text-ink-soft">{r.email}</p>
                {r.message ? (
                  <p className="mt-2 text-sm">{r.message}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <form action={approveRequest} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    <select name="role" defaultValue="family" className="field w-44 py-2 text-sm">
                      {ROLES.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    <select name="householdId" defaultValue="" className="field w-44 py-2 text-sm">
                      <option value="">No household</option>
                      {households.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="btn btn-primary py-2">
                      Approve
                    </button>
                  </form>
                  <form action={declineRequest}>
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-ink-faint hover:text-rust"
                    >
                      Decline
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-ink-faint">
            Approving creates the account and emails them a link to set their
            own password.
          </p>
        </section>
      ) : null}

      {/* Family accounts */}
      <section className="card p-6">
        <p className="section-label">People</p>
        <h2 className="font-display text-2xl mt-1">
          Family accounts and calendar colors
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Add or remove people, control their access, and choose the color that
          identifies each person on the calendar.
        </p>
        <ul className="mt-4">
          {orderedUsers.map((u) => {
            const household = u.householdId
              ? householdsById.get(u.householdId)
              : undefined;
            return (
              <li
                key={u.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-sand-line py-4 first:border-0"
              >
                <div className="min-w-0 flex-1 basis-48">
                  <p className="flex items-center gap-2 font-semibold">
                    <span
                      aria-hidden
                      className="h-3 w-3 shrink-0 rounded-full border border-sand-line"
                      style={{
                        background: household
                          ? householdVar(household.color)
                          : "transparent",
                      }}
                    />
                    <span>
                      {u.name}
                      {u.id === admin.id ? (
                        <span className="ml-2 text-xs font-medium text-ink-faint">
                          you
                        </span>
                      ) : null}
                    </span>
                  </p>
                  <p className="truncate text-sm text-ink-soft">{u.email}</p>
                  <p className="text-xs text-ink-faint">
                    {household
                      ? `${household.name} household color`
                      : "No household color"}
                  </p>
                </div>
                <form action={setUserColor} className="w-full">
                  <input type="hidden" name="userId" value={u.id} />
                  <fieldset className="flex flex-wrap items-center gap-3 rounded-lg bg-sand/40 px-3 py-2">
                    <legend className="sr-only">Calendar color for {u.name}</legend>
                    <span className="text-xs font-semibold text-ink-soft">
                      Calendar color
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {HOUSEHOLD_TOKENS.map((token) => {
                        const otherOwners = (householdsByColor.get(token) ?? [])
                          .filter((owner) => owner.id !== household?.id);
                        const unavailable = otherOwners.length > 0;
                        const colorName = token.charAt(0).toUpperCase() + token.slice(1);
                        return (
                        <label
                          key={token}
                          className={unavailable ? "cursor-not-allowed opacity-30" : "cursor-pointer"}
                          title={
                            unavailable
                              ? `${colorName} is used by ${otherOwners.map((owner) => owner.name).join(", ")}`
                              : colorName
                          }
                        >
                          <input
                            type="radio"
                            name="color"
                            value={token}
                            disabled={unavailable}
                            defaultChecked={household?.color === token}
                            className="peer sr-only"
                          />
                          <span
                            className="block h-7 w-7 rounded-full border-2 border-white shadow-sm ring-1 ring-sand-line transition peer-checked:ring-2 peer-checked:ring-deep peer-checked:ring-offset-2"
                            style={{ background: householdVar(token) }}
                          />
                          <span className="sr-only">
                            {colorName}
                            {unavailable
                              ? `, already used by ${otherOwners.map((owner) => owner.name).join(", ")}`
                              : ""}
                          </span>
                        </label>
                        );
                      })}
                    </div>
                    <button type="submit" className="btn btn-quiet ml-auto py-2">
                      Save color
                    </button>
                  </fieldset>
                  <p className="mt-1 text-xs text-ink-faint">
                    Dimmed colors belong to another household and cannot be selected.
                  </p>
                </form>
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
            );
          })}
        </ul>

        <div className="mt-6 border-t border-sand-line pt-4">
          <h3 className="font-semibold">Add a person</h3>
          <form action={addUser} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input name="name" required placeholder="Name" maxLength={200} className="field" />
            <input name="email" type="email" required placeholder="Email" maxLength={254} className="field" />
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
            <select name="color" className="field" defaultValue={firstAvailableColor}>
              {HOUSEHOLD_TOKENS.map((token) => {
                const owners = householdsByColor.get(token) ?? [];
                return (
                <option key={token} value={token} disabled={owners.length > 0}>
                  {token.charAt(0).toUpperCase() + token.slice(1)} color
                  {owners.length > 0 ? ` — used by ${owners.map((owner) => owner.name).join(", ")}` : ""}
                </option>
                );
              })}
            </select>
            <button type="submit" className="btn btn-primary">
              Add person
            </button>
          </form>
        </div>
      </section>

      {/* Storage and backups */}
      <section className={`card mt-6 p-6 ${storage.nearlyFull ? "border-amber" : ""}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="section-label">Storage</p>
            <h2 className="font-display text-2xl mt-1">
              {storage.nearlyFull
                ? "Filling up, worth clearing"
                : "Plenty of room"}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              {storage.totalRows.toLocaleString()} entries stored.{" "}
              {storage.historyRows.toLocaleString()} of those are history that
              can be cleared.
            </p>
          </div>
          <a href="/api/backup" className="btn btn-primary shrink-0">
            Download a backup
          </a>
        </div>

        <ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {storage.perTable.map((t) => (
            <li
              key={t.name}
              className="flex items-baseline justify-between gap-3 border-t border-sand-line pt-2 text-sm"
            >
              <span>
                {t.label}
                {t.clearable ? (
                  <span className="ml-2 text-xs text-ink-faint">clearable</span>
                ) : null}
              </span>
              <span className="font-semibold">{t.rows.toLocaleString()}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 border-t border-sand-line pt-4">
          <h3 className="font-semibold">Clear old history</h3>
          <p className="mt-1 text-sm text-ink-soft">
            Removes activity, sign-in records, and sent mail older than what you
            keep. Bookings, notes, the guide, and accounts are never touched.
            Download a backup first.
          </p>
          <form action={clearHistory} className="mt-3 flex flex-wrap items-center gap-2">
            <select name="keep" defaultValue="month" className="field w-56">
              <option value="week">Keep the last week</option>
              <option value="month">Keep the last 30 days</option>
              <option value="quarter">Keep the last 90 days</option>
            </select>
            <button type="submit" className="btn btn-quiet">
              Clear the rest
            </button>
          </form>
        </div>
      </section>

      {/* Outbox */}
      <div className="mt-6 grid gap-6">
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

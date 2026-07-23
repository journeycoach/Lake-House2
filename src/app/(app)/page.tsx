import Link from "next/link";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { fmtDay, fmtLong, fmtRange, parseISO, todayISO } from "@/lib/dates";
import { householdVar } from "@/lib/colors";
import { canEdit } from "@/lib/roles";
import {
  allStays,
  checklistItems,
  latestNotes,
  openFixit,
  staysNow,
  staysUpcoming,
} from "@/lib/queries";
import { MonthGrid, HouseholdLegend } from "@/components/month-grid";

export default async function HomePage() {
  const user = await requireUser();
  const today = todayISO();
  const [stays, notes, fixes, checks, statusRow] = await Promise.all([
    allStays(),
    latestNotes(3),
    openFixit(),
    checklistItems(),
    getDb().query.settings.findFirst({
      where: eq(schema.settings.key, "house_status"),
    }),
  ]);

  const here = staysNow(stays, today);
  const next = staysUpcoming(stays, today)[0];
  const status = statusRow?.value ?? "Ready";
  const { y, m } = (() => {
    const t = parseISO(today);
    return { y: t.y, m: t.m };
  })();
  const monthStays = stays.filter(
    (s) =>
      s.start <= `${y}-${String(m).padStart(2, "0")}-31` &&
      s.end >= `${y}-${String(m).padStart(2, "0")}-01`
  );
  const openChecks = checks.filter((c) => !c.done);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label">{fmtLong(today)}</p>
          <h1 className="font-display text-3xl lg:text-4xl mt-1">
            Good morning, {user.name}
          </h1>
        </div>
        {canEdit(user.effectiveRole) ? (
          <Link href="/calendar#plan" className="btn btn-primary">
            Plan a stay
          </Link>
        ) : null}
      </div>

      {/* Hero: people first. House status is a small chip, on purpose. */}
      <section className="card p-6 lg:p-8">
        <div className="flex items-start justify-between gap-4">
          <p className="section-label">At the lake</p>
          <span className="chip chip-ready">House is {status.toLowerCase()}</span>
        </div>
        {here.length > 0 ? (
          <div className="mt-3 space-y-4">
            {here.map((s) => (
              <div key={s.id}>
                <h2 className="font-display text-3xl lg:text-5xl leading-tight">
                  <span
                    aria-hidden
                    className="mr-3 inline-block h-3 w-3 rounded-full align-middle"
                    style={{ background: householdVar(s.color) }}
                  />
                  {s.label} is here
                </h2>
                <p className="mt-2 text-ink-soft">
                  Through {fmtDay(s.end)} · {s.adults + s.kids} guest
                  {s.adults + s.kids === 1 ? "" : "s"}
                  {s.note ? ` · "${s.note}"` : ""}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3">
            <h2 className="font-display text-3xl lg:text-5xl leading-tight">
              Nobody at the lake right now
            </h2>
          </div>
        )}
        {next ? (
          <p className="mt-5 border-t border-sand-line pt-4 text-sm text-ink-soft">
            Next up: <span className="font-semibold text-ink">{next.label}</span>
            , arriving {fmtDay(next.start)}
            {next.note ? ` · "${next.note}"` : ""}
          </p>
        ) : null}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Calendar preview: grid on desktop, agenda on mobile */}
        <section className="card p-6 lg:col-span-3">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <p className="section-label">Family calendar</p>
              <Link
                href="/calendar"
                className="font-display text-2xl hover:text-water transition-colors"
              >
                This month
              </Link>
            </div>
            <Link
              href="/calendar"
              className="text-sm font-medium text-water hover:text-deep-2"
            >
              Open calendar
            </Link>
          </div>
          <div className="mt-4 hidden md:block">
            <MonthGrid year={y} month={m} stays={monthStays} today={today} />
          </div>
          <ul className="mt-4 space-y-3 md:hidden">
            {[...here, ...staysUpcoming(stays, today)].slice(0, 4).map((s) => (
              <li key={s.id} className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: householdVar(s.color) }}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{s.label}</p>
                  <p className="text-xs text-ink-soft">
                    {fmtRange(s.start, s.end)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-sand-line pt-3">
            <HouseholdLegend stays={monthStays} />
          </div>
        </section>

        {/* Notes */}
        <section className="card p-6 lg:col-span-2">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <p className="section-label">Family notes</p>
              <Link
                href="/notes"
                className="font-display text-2xl hover:text-water transition-colors"
              >
                FYI everyone
              </Link>
            </div>
            <Link
              href="/notes"
              className="text-sm font-medium text-water hover:text-deep-2"
            >
              All notes
            </Link>
          </div>
          <ul className="mt-4 space-y-4">
            {notes.map((n) => (
              <li key={n.id} className="border-t border-sand-line pt-3 first:border-0 first:pt-0">
                <p className="text-sm">{n.body}</p>
                <p className="mt-1 text-xs text-ink-faint">
                  {n.authorName} · {n.tag}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Fix-it */}
        <section className="card p-6 lg:col-span-3">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <p className="section-label">Fix-it list</p>
              <Link
                href="/upkeep"
                className="font-display text-2xl hover:text-water transition-colors"
              >
                {fixes.length === 0
                  ? "Nothing needs attention"
                  : `${fixes.length} thing${fixes.length === 1 ? "" : "s"} need${fixes.length === 1 ? "s" : ""} attention`}
              </Link>
            </div>
            <Link
              href="/upkeep"
              className="text-sm font-medium text-water hover:text-deep-2"
            >
              {canEdit(user.effectiveRole) ? "Report an issue" : "See the list"}
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {fixes.slice(0, 3).map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{f.title}</p>
                  <p className="text-xs text-ink-soft">
                    {f.location}
                    {f.assignedTo ? ` · ${f.assignedTo}` : ""}
                  </p>
                </div>
                <span className={`chip chip-${f.priority}`}>{f.priority}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Checklist */}
        <section className="card p-6 lg:col-span-2">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <p className="section-label">Shared checklist</p>
              <Link
                href="/checklist"
                className="font-display text-2xl hover:text-water transition-colors"
              >
                Before the next trip
              </Link>
            </div>
            <Link
              href="/checklist"
              className="text-sm font-medium text-water hover:text-deep-2"
            >
              {canEdit(user.effectiveRole) ? "Add or edit" : "See the list"}
            </Link>
          </div>
          <ul className="mt-4 space-y-2">
            {openChecks.slice(0, 5).map((c) => (
              <li key={c.id} className="flex items-center gap-2 text-sm">
                <span
                  aria-hidden
                  className="h-4 w-4 shrink-0 rounded-[4px] border border-sand-line"
                />
                {c.title}
              </li>
            ))}
            {openChecks.length === 0 ? (
              <li className="text-sm text-ink-soft">All stocked up.</li>
            ) : null}
          </ul>
        </section>
      </div>

      {/* Quick reference */}
      <Link
        href="/guide"
        className="card mt-6 flex items-center justify-between gap-4 p-6 hover:border-water transition-colors"
      >
        <div>
          <p className="section-label">Quick reference</p>
          <p className="mt-1 font-semibold">
            Wi-Fi, lock code, marina, septic, emergency contacts & house rules
          </p>
        </div>
        <span className="btn btn-quiet shrink-0">Open house guide</span>
      </Link>
    </div>
  );
}

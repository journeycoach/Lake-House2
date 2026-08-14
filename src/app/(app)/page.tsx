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
  maintenanceItems,
  openFixit,
  staysNow,
  staysUpcoming,
} from "@/lib/queries";
import { MonthGrid, HouseholdLegend } from "@/components/month-grid";
import { RichNote } from "@/components/rich-note";
import { toggleItem } from "./checklist/actions";

export default async function HomePage() {
  const user = await requireUser();
  const today = todayISO();
  const [stays, notes, fixes, checks, maintenance, statusRow] = await Promise.all([
    allStays(),
    latestNotes(3),
    openFixit(),
    checklistItems(),
    maintenanceItems(),
    getDb().query.settings.findFirst({
      where: eq(schema.settings.key, "house_status"),
    }),
  ]);

  const here = staysNow(stays, today);
  const next = staysUpcoming(stays, today)[0];
  const checklistStay = here[0] ?? next;
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
  const monthKey = `${y}-${String(m).padStart(2, "0")}`;
  const monthMaintenance = maintenance.filter((item) =>
    item.nextDue?.startsWith(monthKey)
  );
  const currentChecks = checks.filter((check) => !check.done).slice(0, 5);
  const recentCompletedChecks = checks
    .filter((check) => check.done)
    .sort((a, b) => b.position - a.position)
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label">{fmtLong(today)}</p>
          <h1 className="font-display text-3xl lg:text-4xl mt-1">
            Good morning, {user.name}
          </h1>
        </div>
        <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
          {canEdit(user.effectiveRole) ? (
            <>
              <Link
                href="/calendar?plan=open#plan"
                className="btn btn-primary min-w-0 px-2 text-[11px] sm:px-3 sm:text-xs"
              >
                Plan a stay
              </Link>
              <Link
                href="/upkeep?tab=fixit&report=open#report-an-issue"
                className="btn min-w-0 bg-water px-2 text-[11px] text-white hover:bg-deep-2 sm:px-3 sm:text-xs"
              >
                Report an Issue
              </Link>
            </>
          ) : null}
          <Link
            href={checklistStay ? `/calendar/${checklistStay.id}/checklist` : "/calendar#plan"}
            className="btn min-w-0 bg-sage px-2 text-[11px] text-white hover:bg-deep sm:px-3 sm:text-xs"
          >
            Check-in list
          </Link>
        </div>
      </div>

      {/* Hero: people first. House status is a small chip, on purpose. */}
      <section className="card p-4 sm:p-5 lg:p-6">
        <div className="flex items-start justify-between gap-4">
          <p className="section-label">Who is at the lake</p>
          <span className="chip chip-ready">House is {status.toLowerCase()}</span>
        </div>
        {here.length > 0 ? (
          <div className="mt-2 space-y-3">
            {here.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1"
              >
                <h2 className="font-display text-2xl lg:text-4xl leading-tight">
                  <span
                    aria-hidden
                    className="mr-3 inline-block h-3 w-3 rounded-full align-middle"
                    style={{ background: householdVar(s.color) }}
                  />
                  {s.label}
                </h2>
                <p className="text-sm text-ink-soft">
                  Through {fmtDay(s.end)} · {s.adults + s.kids} guest
                  {s.adults + s.kids === 1 ? "" : "s"}
                  {s.note ? ` · "${s.note}"` : ""}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-2">
            <h2 className="font-display text-2xl lg:text-4xl leading-tight">
              Nobody at the lake right now
            </h2>
          </div>
        )}
        {next ? (
          <p className="mt-4 border-t border-sand-line pt-3 text-sm text-ink-soft">
            Next up: <span className="font-semibold text-ink">{next.label}</span>
            , arriving {fmtDay(next.start)}
            {next.note ? ` · "${next.note}"` : ""}
          </p>
        ) : null}
      </section>

      <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-5">
        {/* Calendar preview: grid on desktop, agenda on mobile */}
        <Link
          href="/calendar"
          className="card group block p-4 transition-colors hover:border-water/40 sm:p-6 lg:col-span-3"
        >
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <p className="section-label">Family calendar</p>
              <h2 className="font-display text-2xl transition-colors group-hover:text-water">
                This month
              </h2>
            </div>
            <span className="text-sm font-medium text-water transition-colors group-hover:text-deep-2">
              Open calendar
            </span>
          </div>
          <div className="mt-4 hidden md:block">
            <MonthGrid
              year={y}
              month={m}
              stays={monthStays}
              maintenance={monthMaintenance}
              today={today}
            />
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
            <HouseholdLegend
              stays={monthStays}
              showMaintenance={monthMaintenance.length > 0}
            />
          </div>
        </Link>

        {/* Checklist */}
        <section className="card p-4 sm:p-6 lg:col-span-2">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <p className="section-label">Check List</p>
              <Link
                href="/checklist"
                className="font-display text-2xl hover:text-water transition-colors"
              >
                Pickup before the next trip
              </Link>
            </div>
            <Link
              href="/checklist"
              className="text-sm font-medium text-water hover:text-deep-2"
            >
              {canEdit(user.effectiveRole) ? "Add or edit" : "See the list"}
            </Link>
          </div>
          <div className="mt-4">
            <p className="section-label">Current</p>
            <ul className="mt-2">
              {currentChecks.map((check) => (
                <li
                  key={check.id}
                  className="flex items-start gap-3 border-t border-sand-line py-3 first:border-0 first:pt-0"
                >
                  <form action={toggleItem} className="shrink-0">
                    <input type="hidden" name="id" value={check.id} />
                    <button
                      type="submit"
                      aria-label={`Mark "${check.title}" done`}
                      aria-pressed="false"
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-sand-line bg-white transition-colors hover:border-water hover:bg-mist"
                    />
                  </form>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{check.title}</p>
                    {check.details ? (
                      <p className="text-sm text-ink-soft">{check.details}</p>
                    ) : null}
                    <p className="text-xs font-medium text-water">
                      Added by {check.addedBy}
                    </p>
                  </div>
                </li>
              ))}
              {currentChecks.length === 0 ? (
                <li className="text-sm text-ink-soft">
                  Everything is checked off.
                </li>
              ) : null}
            </ul>
          </div>

          <div className="mt-5 border-t border-sand-line pt-4">
            <p className="section-label">Recently checked off</p>
            <ul className="mt-2">
              {recentCompletedChecks.map((check) => (
                <li
                  key={check.id}
                  className="flex items-start gap-3 border-t border-sand-line py-3 first:border-0 first:pt-0"
                >
                  <form action={toggleItem} className="shrink-0">
                    <input type="hidden" name="id" value={check.id} />
                    <button
                      type="submit"
                      aria-label={`Mark "${check.title}" not done`}
                      aria-pressed="true"
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-sage bg-sage text-white transition-colors hover:bg-deep"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 10 10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1.5 5.5L4 8l4.5-6" />
                      </svg>
                    </button>
                  </form>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <p className="font-semibold text-ink-faint line-through">
                        {check.title}
                      </p>
                      <span className="text-xs text-ink-faint">
                        Checked by {check.checkedBy ?? "Unknown"}
                      </span>
                    </div>
                    {check.details ? (
                      <p className="text-sm text-ink-faint line-through">
                        {check.details}
                      </p>
                    ) : null}
                    <p className="text-xs font-medium text-water">
                      Added by {check.addedBy}
                    </p>
                  </div>
                </li>
              ))}
              {recentCompletedChecks.length === 0 ? (
                <li className="text-sm text-ink-soft">
                  Nothing has been checked off yet.
                </li>
              ) : null}
            </ul>
          </div>
        </section>

        {/* Fix-it */}
        <section className="card p-4 sm:p-6 lg:col-span-3">
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

        {/* Notes */}
        <section className="card p-4 sm:p-6 lg:col-span-2">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <Link
                href="/notes"
                className="font-display text-2xl hover:text-water transition-colors"
              >
                FYI Everyone
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
                <RichNote body={n.body} />
                <p className="mt-1 text-xs text-ink-faint">
                  {n.authorName} · {n.tag}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Quick reference */}
      <Link
        href="/guide"
        className="card mt-4 flex items-center justify-between gap-4 p-4 transition-colors hover:border-water sm:mt-6 sm:p-6"
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

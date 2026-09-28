import Link from "next/link";
import { Suspense } from "react";
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
  stayChecklistProgress,
} from "@/lib/queries";
import { MonthGrid, HouseholdLegend } from "@/components/month-grid";
import { RichNote } from "@/components/rich-note";
import {
  LiveWeatherCard,
  LiveWeatherFallback,
} from "@/components/live-weather-card";
import { toggleItem } from "./checklist/actions";

export default async function HomePage() {
  const user = await requireUser();
  const today = todayISO();
  const [stays, notes, fixes, checks, maintenance] = await Promise.all([
    allStays(),
    latestNotes(3),
    openFixit(),
    checklistItems(),
    maintenanceItems(),
  ]);

  const here = staysNow(stays, today);
  const next = staysUpcoming(stays, today)[0];
  const checklistStay = here[0] ?? next;
  const progressByStay = await stayChecklistProgress(here.map((s) => s.id));

  // Attention: only the handful of things someone should actually act on.
  const upcomingOrCurrent = stays
    .filter((s) => s.end >= today)
    .sort((a, b) => a.start.localeCompare(b.start));
  const overlaps: { a: (typeof stays)[number]; b: (typeof stays)[number] }[] = [];
  for (let i = 0; i < upcomingOrCurrent.length; i++) {
    for (let j = i + 1; j < upcomingOrCurrent.length; j++) {
      const a = upcomingOrCurrent[i];
      const b = upcomingOrCurrent[j];
      if (a.householdId !== b.householdId && a.start <= b.end && b.start <= a.end) {
        overlaps.push({ a, b });
      }
    }
  }
  const overdueMaintenance = maintenance.filter(
    (item) => item.nextDue && item.nextDue < today
  );
  const urgentFixes = fixes.filter((f) => f.priority === "urgent");
  const departingToday = here.filter((s) => s.end === today);
  const incompleteDepartures = departingToday
    .map((s) => ({ stay: s, progress: progressByStay.get(s.id) }))
    .filter(
      ({ progress }) =>
        progress && progress.checkoutTotal > 0 && progress.checkoutCompleted < progress.checkoutTotal
    );
  const hasAttention =
    overlaps.length > 0 ||
    overdueMaintenance.length > 0 ||
    urgentFixes.length > 0 ||
    incompleteDepartures.length > 0;
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
  const openChecks = checks.filter((check) => !check.done);
  const currentChecks = openChecks.slice(0, 4);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label">{fmtLong(today)}</p>
          <h1 className="font-display text-3xl lg:text-4xl mt-1">
            Good morning, {user.name}
          </h1>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href={checklistStay ? `/calendar/${checklistStay.id}/checklist` : "/calendar#plan"}
            className="btn btn-quiet min-w-0 px-3 text-xs sm:text-xs"
          >
            Who&apos;s at the lake?{" "}
            <span className="font-semibold text-ink">
              {here.length > 0 ? here.map((s) => s.label).join(", ") : "Nobody"}
            </span>
          </Link>
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
      </div>

      {/* Hero: needs-attention + weather; "who's at the lake" now lives in the header as a compact button. */}
      <div className="grid gap-2 sm:gap-4 lg:grid-cols-2 lg:items-start">
      {hasAttention ? (
        <section className="card p-4 sm:p-6">
          <p className="section-label">Needs attention</p>
          <ul className="mt-2 space-y-0.5 sm:mt-3 sm:space-y-1">
            {overlaps.map(({ a, b }) => (
              <li key={`overlap-${a.id}-${b.id}`}>
                <Link
                  href="/calendar"
                  className="flex min-w-0 items-center gap-2 rounded-lh px-2 py-1 sm:py-1.5 -mx-2 hover:bg-mist/60"
                >
                  <span className="chip chip-soon shrink-0">Overlap</span>
                  <span className="shrink-0 text-xs font-medium text-ink-soft">
                    {fmtRange(
                      a.start > b.start ? a.start : b.start,
                      a.end < b.end ? a.end : b.end
                    )}
                  </span>
                  <span className="truncate text-sm font-semibold">
                    {a.label} & {b.label}
                  </span>
                </Link>
              </li>
            ))}
            {overdueMaintenance.map((item) => (
              <li key={`maint-${item.id}`}>
                <Link
                  href="/upkeep?tab=maintenance"
                  className="flex min-w-0 items-center gap-2 rounded-lh px-2 py-1 sm:py-1.5 -mx-2 hover:bg-mist/60"
                >
                  <span className="chip chip-urgent shrink-0">Overdue</span>
                  <span className="shrink-0 text-xs font-medium text-ink-soft">
                    due {fmtDay(item.nextDue as string)}
                  </span>
                  <span className="truncate text-sm font-semibold">{item.task}</span>
                </Link>
              </li>
            ))}
            {urgentFixes.map((f) => (
              <li key={`fix-${f.id}`}>
                <Link
                  href="/upkeep?tab=fixit"
                  className="flex min-w-0 items-center gap-2 rounded-lh px-2 py-1 sm:py-1.5 -mx-2 hover:bg-mist/60"
                >
                  <span className="chip chip-urgent shrink-0">Urgent</span>
                  <span className="truncate text-sm">
                    <span className="font-semibold">{f.title}</span>
                    {f.location ? ` · ${f.location}` : ""}
                  </span>
                </Link>
              </li>
            ))}
            {incompleteDepartures.map(({ stay, progress }) => (
              <li key={`departure-${stay.id}`}>
                <Link
                  href={`/calendar/${stay.id}/checklist`}
                  className="flex min-w-0 items-center gap-2 rounded-lh px-2 py-1 sm:py-1.5 -mx-2 hover:bg-mist/60"
                >
                  <span className="chip chip-urgent shrink-0">Leaving today</span>
                  <span className="shrink-0 text-xs font-medium text-ink-soft">
                    {(progress?.checkoutTotal ?? 0) - (progress?.checkoutCompleted ?? 0)} left
                  </span>
                  <span className="truncate text-sm font-semibold">{stay.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Suspense fallback={<LiveWeatherFallback />}>
        <LiveWeatherCard />
      </Suspense>
      </div>

      <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-5">
        {/* Calendar preview: grid on desktop, agenda on mobile */}
        <div className="card p-4 sm:p-6 lg:col-span-3">
          <Link href="/calendar" className="group flex items-baseline justify-between gap-4">
            <div>
              <p className="section-label">Family calendar</p>
              <h2 className="font-display text-2xl transition-colors group-hover:text-water">
                This month
              </h2>
            </div>
            <span className="text-sm font-medium text-water transition-colors group-hover:text-deep-2">
              Open calendar
            </span>
          </Link>
          <div className="mt-4 hidden md:block">
            <MonthGrid
              year={y}
              month={m}
              stays={monthStays}
              maintenance={monthMaintenance}
              today={today}
              planningEnabled={canEdit(user.effectiveRole)}
            />
            {canEdit(user.effectiveRole) ? (
              <p className="mt-2 text-xs text-ink-faint">
                Tap a stay to edit it, or an empty day to plan one.
              </p>
            ) : null}
          </div>
          <ul className="mt-4 space-y-1 md:hidden">
            {[...here, ...staysUpcoming(stays, today)].slice(0, 4).map((s) => (
              <li key={s.id}>
                <Link
                  href={`/calendar/${s.id}/checklist`}
                  className="-mx-2 flex items-center gap-3 rounded-lh px-2 py-1.5 hover:bg-mist/60"
                >
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: householdVar(s.color) }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{s.label}</p>
                    <p className="text-xs text-ink-soft">
                      {fmtRange(s.start, s.end)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-sand-line pt-3">
            <HouseholdLegend
              stays={monthStays}
              showMaintenance={monthMaintenance.length > 0}
            />
          </div>
        </div>

        {/* Checklist */}
        <section className="card p-4 sm:p-6 lg:col-span-2">
          <p className="section-label">Shopping List</p>
          <Link
            href="/checklist"
            className="font-display text-2xl hover:text-water transition-colors"
          >
            Pickup before the next trip
          </Link>
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
          {openChecks.length > currentChecks.length ? (
            <Link
              href="/checklist"
              className="mt-4 inline-block text-sm font-semibold text-water hover:text-deep-2"
            >
              View all {openChecks.length} items →
            </Link>
          ) : null}
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

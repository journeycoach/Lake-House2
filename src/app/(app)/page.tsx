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
import { QuickActionsMenu } from "./quick-actions";

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
        <QuickActionsMenu
          actions={[
            ...(canEdit(user.effectiveRole)
              ? [
                  {
                    href: "/calendar?plan=open#plan",
                    label: "Plan a stay",
                    className: "btn btn-primary min-w-0 px-3 text-xs sm:text-xs",
                  },
                  {
                    href: "/upkeep?tab=fixit&report=open#report-an-issue",
                    label: "Report an Issue",
                    className:
                      "btn min-w-0 bg-water px-3 text-xs text-white hover:bg-deep-2 sm:text-xs",
                  },
                ]
              : []),
            {
              href: checklistStay ? `/calendar/${checklistStay.id}/checklist` : "/calendar#plan",
              label: "Check-in list",
              className: "btn min-w-0 bg-sage px-3 text-xs text-white hover:bg-deep sm:text-xs",
            },
          ]}
        />
      </div>

      {/* Hero: people first. House status is a small chip, on purpose. */}
      <section className="card p-4 sm:p-5 lg:p-6">
        <div className="flex items-start justify-between gap-4">
          <p className="section-label">Who is at the lake</p>
          <span className="chip chip-ready">House is {status.toLowerCase()}</span>
        </div>
        {here.length > 0 ? (
          <div className="mt-2 space-y-4">
            {here.map((s) => {
              const progress = progressByStay.get(s.id);
              return (
                <div key={s.id}>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
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
                  <Link
                    href={`/calendar/${s.id}/checklist`}
                    className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-water hover:text-deep-2"
                  >
                    Visit checklist
                    {progress && progress.total > 0 ? (
                      <span
                        className={`chip ${progress.completed === progress.total ? "chip-ready" : "chip-whenever"}`}
                      >
                        {progress.completed} of {progress.total} complete
                      </span>
                    ) : null}
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              );
            })}
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

      {hasAttention ? (
        <section className="card mt-4 p-4 sm:mt-6 sm:p-5">
          <p className="section-label">Needs attention</p>
          <ul className="mt-3 space-y-2">
            {overlaps.map(({ a, b }) => (
              <li key={`overlap-${a.id}-${b.id}`}>
                <Link
                  href="/calendar"
                  className="flex flex-wrap items-center gap-2 rounded-lh px-2 py-1.5 -mx-2 hover:bg-mist/60"
                >
                  <span className="chip chip-soon">Overlap</span>
                  <span className="text-sm">
                    <span className="font-semibold">{a.label}</span> and{" "}
                    <span className="font-semibold">{b.label}</span> are both at the lake{" "}
                    {fmtRange(
                      a.start > b.start ? a.start : b.start,
                      a.end < b.end ? a.end : b.end
                    )}
                  </span>
                </Link>
              </li>
            ))}
            {overdueMaintenance.map((item) => (
              <li key={`maint-${item.id}`}>
                <Link
                  href="/upkeep?tab=maintenance"
                  className="flex flex-wrap items-center gap-2 rounded-lh px-2 py-1.5 -mx-2 hover:bg-mist/60"
                >
                  <span className="chip chip-urgent">Overdue</span>
                  <span className="text-sm">
                    <span className="font-semibold">{item.task}</span> was due{" "}
                    {fmtDay(item.nextDue as string)}
                  </span>
                </Link>
              </li>
            ))}
            {urgentFixes.map((f) => (
              <li key={`fix-${f.id}`}>
                <Link
                  href="/upkeep?tab=fixit"
                  className="flex flex-wrap items-center gap-2 rounded-lh px-2 py-1.5 -mx-2 hover:bg-mist/60"
                >
                  <span className="chip chip-urgent">Urgent</span>
                  <span className="text-sm">
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
                  className="flex flex-wrap items-center gap-2 rounded-lh px-2 py-1.5 -mx-2 hover:bg-mist/60"
                >
                  <span className="chip chip-urgent">Leaving today</span>
                  <span className="text-sm">
                    <span className="font-semibold">{stay.label}</span> has{" "}
                    {(progress?.checkoutTotal ?? 0) - (progress?.checkoutCompleted ?? 0)} departure
                    task{(progress?.checkoutTotal ?? 0) - (progress?.checkoutCompleted ?? 0) === 1 ? "" : "s"} left
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-4 sm:mt-6">
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

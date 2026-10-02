import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { fmtLong, fmtRange, parseISO, todayISO } from "@/lib/dates";
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
  VisitWeatherBadge,
  VisitWeatherBadgeFallback,
} from "@/components/live-weather-card";
import { MyVisitCard, MyVisitEmptyState } from "@/components/my-visit-card";
import { toggleItem } from "./shopping-list/actions";

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
  const householdStays = user.householdId
    ? stays
        .filter((stay) => stay.householdId === user.householdId && stay.end >= today)
        .sort((a, b) => a.start.localeCompare(b.start))
    : [];
  const myVisit =
    householdStays.find((stay) => stay.start <= today && today <= stay.end) ??
    householdStays[0];
  const overlappingVisits = myVisit
    ? stays.filter(
        (stay) =>
          stay.id !== myVisit.id &&
          stay.start <= myVisit.end &&
          myVisit.start <= stay.end
      )
    : [];
  const progressStayIds = Array.from(
    new Set([
      ...here.map((stay) => stay.id),
      ...(myVisit ? [myVisit.id] : []),
    ])
  );
  const progressByStay = await stayChecklistProgress(progressStayIds);

  const overdueMaintenance = maintenance.filter(
    (item) => item.nextDue && item.nextDue < today
  );
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
  const visitIssues = myVisit
    ? [
        ...fixes.map((item) => ({
          id: item.id,
          title: item.title,
          urgency: item.priority as "urgent" | "soon" | "whenever",
        })),
        ...maintenance
          .filter(
            (item) =>
              item.nextDue &&
              item.nextDue >= today &&
              item.nextDue <= myVisit.end
          )
          .map((item) => ({ id: item.id, title: item.task, urgency: "soon" as const })),
      ]
    : [];
  const assignedItems = [
    ...fixes
      .filter((item) => item.assignedTo?.trim())
      .map((item) => ({
        id: `fixit-${item.id}`,
        title: item.title,
        assignedTo: item.assignedTo!,
        category: "Issue" as const,
        href: "/upkeep?tab=fixit",
      })),
    ...maintenance
      .filter((item) => item.assignedTo?.trim())
      .map((item) => ({
        id: `maintenance-${item.id}`,
        title: item.task,
        assignedTo: item.assignedTo!,
        category: "Maintenance" as const,
        href: `/upkeep?tab=maintenance#maintenance-${item.id}`,
      })),
  ];
  const myAssignedItems = assignedItems.filter(
    (item) => item.assignedTo.trim().toLowerCase() === user.name.trim().toLowerCase()
  );

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
          <div className="flex min-w-0 items-center gap-2">
            <Suspense fallback={<VisitWeatherBadgeFallback />}>
              <VisitWeatherBadge />
            </Suspense>
            <Link
              href={checklistStay ? `/calendar/${checklistStay.id}/checklist` : "/calendar/plan"}
              className="btn btn-quiet min-w-0 flex-1 bg-card px-3 text-xs sm:text-xs"
            >
              Who&apos;s at the lake?{" "}
              <span className="font-semibold text-ink">
                {here.length > 0
                  ? here.map((s) => s.householdName ?? s.label).join(", ")
                : "Nobody"}
              </span>
            </Link>
          </div>
          {canEdit(user.effectiveRole) ? (
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
              <Link
                href="/calendar/plan"
                className="btn min-w-0 bg-water px-2 text-[11px] text-white hover:bg-deep-2 sm:px-3 sm:text-xs"
              >
                Plan a stay
              </Link>
              <Link
                href="/upkeep/report-issue"
                className="btn min-w-0 bg-care px-2 text-[11px] text-white hover:bg-care/90 sm:px-3 sm:text-xs"
              >
                Report an Issue
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      {myVisit ? (
        <MyVisitCard
          stay={myVisit}
          today={today}
          overlappingVisits={overlappingVisits}
          progress={progressByStay.get(myVisit.id)}
          shoppingItems={openChecks}
          issues={visitIssues}
          assignedItems={myAssignedItems}
          overdueMaintenance={overdueMaintenance.map(({ id, task, nextDue }) => ({
            id,
            task,
            nextDue,
          }))}
        />
      ) : (
        <MyVisitEmptyState canPlan={canEdit(user.effectiveRole)} />
      )}

      <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-5 lg:items-start">
        <div className="contents lg:col-span-3 lg:grid lg:content-start lg:gap-6">
        {/* Calendar preview: grid on desktop, agenda on mobile */}
        <div className="card order-1 p-4 sm:p-6">
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

        {/* Notes */}
        <section className="card order-4 p-4 sm:p-6">
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

        <div className="contents lg:col-span-2 lg:grid lg:content-start lg:gap-6">
        {/* Checklist */}
        <section className="card order-2 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="section-label">Shopping List</p>
            {canEdit(user.effectiveRole) ? (
              <Link
                href="/shopping-list"
                className="shrink-0 text-xs font-semibold text-water hover:text-deep-2 hover:underline"
              >
                Add items +
              </Link>
            ) : null}
          </div>
          <Link
            href="/shopping-list"
            className="block whitespace-nowrap font-display text-base leading-tight transition-colors hover:text-water lg:text-lg"
          >
            {openChecks.length > 0
              ? `Pick up ${openChecks.length} item${openChecks.length === 1 ? "" : "s"} before the next trip`
              : "Nothing to pick up before the next trip"}
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
                      className="check-control flex items-center justify-center rounded-md border border-sand-line bg-white transition-colors hover:border-water hover:bg-mist"
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
              href="/shopping-list"
              className="mt-4 inline-block text-sm font-semibold text-water hover:text-deep-2"
            >
              View all {openChecks.length} items →
            </Link>
          ) : null}
        </section>

        {/* Fix-it */}
        <section className="card order-3 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <p className="section-label">Fix-it list</p>
            <Link
              href={
                canEdit(user.effectiveRole)
                  ? "/upkeep/report-issue"
                  : "/upkeep"
              }
              className="shrink-0 whitespace-nowrap text-xs font-medium text-water hover:text-deep-2 sm:text-sm"
            >
              {canEdit(user.effectiveRole) ? "Report an issue" : "See the list"}
            </Link>
          </div>
          <Link
            href="/upkeep"
            className="mt-1 block font-display text-xl leading-tight transition-colors hover:text-water"
          >
            {fixes.length === 0
              ? "Nothing needs attention"
              : `${fixes.length} thing${fixes.length === 1 ? "" : "s"} need${fixes.length === 1 ? "s" : ""} attention`}
          </Link>
          <ul className="mt-4">
            {fixes.slice(0, 5).map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-3 border-t border-sand-line py-3 first:border-0 first:pt-0"
              >
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
          {fixes.length > 5 ? (
            <Link
              href="/upkeep"
              className="mt-4 inline-block text-sm font-semibold text-water hover:text-deep-2"
            >
              View all {fixes.length} issues →
            </Link>
          ) : null}
        </section>
        </div>
      </div>

      {/* Quick reference */}
      <section className="card mt-4 flex flex-wrap items-center justify-between gap-4 p-4 transition-colors hover:border-water sm:mt-6 sm:p-6">
        <Link href="/guide" className="min-w-0 flex-1">
          <p className="section-label">Quick reference</p>
          <p className="mt-1 font-semibold">
            Wi-Fi, lock code, marina, emergency contacts, check-in & check-out procedure, and house rules
          </p>
        </Link>
        <a
          href="https://www.google.com/maps/place/22082+Blue+Water+Rd,+Chandler,+TX+75758/@32.1995742,-95.4879946,18.06z/data=!4m6!3m5!1s0x86484c8512a9e5c5:0xb35bce62845f2a7c!8m2!3d32.2011789!4d-95.4869285!16s%2Fg%2F11j7mkmsj7?entry=ttu&g_ep=EgoyMDI2MDkyOC4wIKXMDSoASAFQAw%3D%3D"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-quiet shrink-0 text-sm"
          aria-label="Open Google Maps directions to Paine Pointe in a new tab"
        >
          Map &amp; directions <span aria-hidden="true">↗</span>
        </a>
      </section>
    </div>
  );
}

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
import { ShoppingCurrentList } from "@/components/shopping-current-list";
import { toggleItem } from "./shopping-list/actions";

export default async function HomePage() {
  const user = await requireUser();
  const isMine = (name?: string | null) =>
    !!name && name.trim().toLowerCase() === user.name.trim().toLowerCase();
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
  const progressStayIds = Array.from(
    new Set([
      ...here.map((stay) => stay.id),
      ...(myVisit ? [myVisit.id] : []),
    ])
  );
  const progressByStay = await stayChecklistProgress(progressStayIds);

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
  const myShoppingItems = openChecks.filter((item) => isMine(item.assignedTo));
  // On the home page, lead with what the current user needs to grab, then
  // fill remaining room with unassigned items before anyone else's.
  const unassignedShoppingItems = openChecks.filter((item) => !item.assignedTo);
  const othersShoppingItems = openChecks.filter(
    (item) => item.assignedTo && !isMine(item.assignedTo)
  );
  const currentChecks = [
    ...myShoppingItems,
    ...unassignedShoppingItems,
    ...othersShoppingItems,
  ].slice(0, 4);
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
  const myAssignedItems = assignedItems.filter((item) => isMine(item.assignedTo));
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 space-y-3">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="section-label">{fmtLong(today)}</p>
            <h1 className="font-display text-3xl lg:text-4xl mt-1">
              Hello, {user.name}
            </h1>
          </div>
          <div className="shrink-0">
            <Suspense fallback={<VisitWeatherBadgeFallback />}>
              <VisitWeatherBadge />
            </Suspense>
          </div>
        </div>
        {canEdit(user.effectiveRole) ? (
          <div className="flex justify-end">
            <div className="grid w-full grid-cols-3 gap-1.5 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-2">
              <Link
                href="/calendar/plan"
                className="btn min-w-0 px-1 text-[10px] leading-tight text-white bg-water hover:bg-deep-2 sm:px-3 sm:text-xs"
              >
                Plan a stay
              </Link>
              <Link
                href="/upkeep/report-issue"
                className="btn min-w-0 px-1 text-[10px] leading-tight text-white bg-care hover:bg-care/90 sm:px-3 sm:text-xs"
              >
                Report an Issue
              </Link>
              <Link
                href="/shopping-list#add-item"
                className="btn min-w-0 px-1 text-[10px] leading-tight text-white bg-sage hover:bg-deep sm:px-3 sm:text-xs"
              >
                Add to Shopping List
              </Link>
            </div>
          </div>
        ) : null}
        <div className="flex justify-center">
          <Link
            href={checklistStay ? `/calendar/${checklistStay.id}/checklist` : "/calendar/plan"}
            className="btn btn-quiet min-w-0 bg-card px-3 text-xs sm:text-xs"
          >
            Who&apos;s at the lake?{" "}
            <span className="font-semibold text-ink">
              {here.length > 0
                ? here.map((s) => s.householdName ?? s.label).join(", ")
                : "Nobody"}
            </span>
          </Link>
        </div>
      </div>

      {myVisit ? (
        <MyVisitCard
          stay={myVisit}
          today={today}
          progress={progressByStay.get(myVisit.id)}
          shoppingItems={openChecks}
          myShoppingItems={myShoppingItems}
          assignedItems={myAssignedItems}
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
            <ShoppingCurrentList
              items={currentChecks.map((check) => ({
                id: check.id,
                title: check.title,
                details: check.details,
                assignedTo: check.assignedTo,
                addedBy: check.addedBy,
              }))}
              currentUserName={user.name}
              action={toggleItem}
            />
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
            <p className="section-label">Property Care</p>
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
                    {f.assignedTo ? (
                      <>
                        {" · "}
                        <span
                          className={
                            isMine(f.assignedTo) ? "font-semibold text-care" : undefined
                          }
                        >
                          {f.assignedTo}
                        </span>
                      </>
                    ) : null}
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
      </section>

      <div className="mt-5 flex justify-center pb-2">
        <Link
          href="/install"
          className="text-sm font-semibold text-water transition-colors hover:text-deep-2"
        >
          Install Paine Pointe on your phone →
        </Link>
      </div>
    </div>
  );
}

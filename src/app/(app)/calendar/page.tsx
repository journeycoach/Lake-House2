import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { asc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { householdVar } from "@/lib/colors";
import { fmtDay, fmtRange, monthName, parseISO, todayISO } from "@/lib/dates";
import {
  allStays,
  maintenanceItems,
  staysNow,
  staysUpcoming,
} from "@/lib/queries";
import { getFeedToken } from "@/lib/feed-token";
import { requireUser } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { canUpdateStayChecklist } from "@/lib/stay-checklist-access";
import {
  MonthGrid,
  MiniMonthGrid,
  HouseholdLegend,
} from "@/components/month-grid";
import { YearGrid } from "@/components/year-grid";
import { CopyField } from "@/components/copy-field";
import { PageHeader } from "@/components/page-header";
import { StayForm, StayListItem } from "./stay-form";

export const metadata: Metadata = { title: "Calendar · Paine Pointe" };

function tab(active: boolean) {
  return `rounded-lh px-4 py-2 text-sm font-semibold transition-colors ${
    active ? "bg-deep text-white" : "text-ink-soft hover:text-ink"
  }`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{
    m?: string;
    y?: string;
    view?: string;
    start?: string;
    plan?: string;
  }>;
}) {
  const user = await requireUser();
  const editor = canEdit(user.effectiveRole);
  const params = await searchParams;
  const view = params.view === "year" ? "year" : "month";
  const selectedStart = /^\d{4}-\d{2}-\d{2}$/.test(params.start ?? "")
    ? params.start
    : undefined;
  const shouldOpenPlan = Boolean(selectedStart) || params.plan === "open";
  const today = todayISO();
  const t = parseISO(today);
  let y = t.y;
  let m = t.m;
  if (params.m && /^\d{4}-\d{2}$/.test(params.m)) {
    const [py, pm] = params.m.split("-").map(Number);
    y = py;
    m = pm;
  }
  let yearY = t.y;
  if (params.y && /^\d{4}$/.test(params.y)) yearY = Number(params.y);

  const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;

  const [stays, maintenance, households, stayChecklistItems] = await Promise.all([
    allStays(),
    maintenanceItems(),
    getDb()
      .select({ id: schema.households.id, name: schema.households.name })
      .from(schema.households)
      .orderBy(asc(schema.households.name)),
    getDb()
      .select()
      .from(schema.stayChecklistItems)
      .orderBy(
        asc(schema.stayChecklistItems.phase),
        asc(schema.stayChecklistItems.position)
      ),
  ]);
  const monthKey = `${y}-${String(m).padStart(2, "0")}`;
  const monthStays = stays.filter(
    (s) => s.start <= `${monthKey}-31` && s.end >= `${monthKey}-01`
  );
  const yearStays = stays.filter(
    (s) => s.start <= `${yearY}-12-31` && s.end >= `${yearY}-01-01`
  );
  const monthMaintenance = maintenance.filter((item) =>
    item.nextDue?.startsWith(monthKey)
  );
  const yearMaintenance = maintenance.filter((item) =>
    item.nextDue?.startsWith(`${yearY}-`)
  );
  const datedMaintenance = maintenance.filter((item) => item.nextDue);

  const upcoming = [...staysNow(stays, today), ...staysUpcoming(stays, today)];
  const overlappingVisits = upcoming.flatMap((stay, index) =>
    upcoming
      .slice(index + 1)
      .filter((other) => stay.start <= other.end && other.start <= stay.end)
      .map((other) => ({ stay, other }))
  );
  const checklistItemsByStay = new Map<number, typeof stayChecklistItems>();
  for (const item of stayChecklistItems) {
    const items = checklistItemsByStay.get(item.stayId) ?? [];
    items.push(item);
    checklistItemsByStay.set(item.stayId, items);
  }

  const token = await getFeedToken();
  const host = (await headers()).get("host") ?? "localhost:3000";
  const feedPath = `/api/feed/${token}.ics`;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Calendar" />

      <section className="card mb-5 p-3 md:p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <div>
            <p className="section-label">Upcoming stays</p>
            <h2 className="font-display mt-0.5 text-lg">Who is using Paine Pointe</h2>
          </div>
          {editor ? (
            <Link href="#plan" className="text-xs font-semibold text-water hover:text-deep-2">
              Plan a stay
            </Link>
          ) : null}
        </div>
        <ul className="mt-1">
          {upcoming.map((s) => (
            <StayListItem
              key={s.id}
              stay={s}
              households={households}
              color={householdVar(s.color)}
              checklist={(checklistItemsByStay.get(s.id) ?? []).map((item) => ({
                id: item.id,
                phase: item.phase,
                title: item.title,
                done: Boolean(item.checkedAt),
                checkedBy: item.checkedBy,
                checkedAt: item.checkedAt,
              }))}
              canToggleChecklist={canUpdateStayChecklist(user, s, today)}
              dateBadge={fmtDay(s.start)}
              meta={`${fmtRange(s.start, s.end)} · ${s.adults} adult${s.adults === 1 ? "" : "s"} · ${s.kids} kid${s.kids === 1 ? "" : "s"}`}
              canEdit={editor}
            />
          ))}
          {upcoming.length === 0 ? (
            <li className="pt-1 text-sm text-ink-soft">
              Nothing scheduled yet.
            </li>
          ) : null}
        </ul>
      </section>

      {editor ? (
        <details
          id="plan"
          open={shouldOpenPlan}
          className="group mb-5 scroll-mt-6 rounded-lh border border-water/30 border-l-4 bg-water-tint p-4"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lh bg-water text-white"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 17 17"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="3.5" width="13" height="11.5" rx="1.5" />
                  <path d="M5 2v3M12 2v3M2 7h13M8.5 9v4M6.5 11h4" />
                </svg>
              </span>
              <div>
                <p className="section-label text-water">Plan a stay</p>
                <h2 className="font-display mt-0.5 text-xl">Put it on the calendar</h2>
              </div>
            </div>
            <span className="flex items-center gap-2 text-sm font-semibold text-water">
              Add a stay
              <svg
                aria-hidden
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-open:rotate-180"
              >
                <path d="m3 5 4 4 4-4" />
              </svg>
            </span>
          </summary>
          <div className="mt-4 border-t border-sand-line pt-4">
            <StayForm households={households} defaultDate={selectedStart} />
          </div>
        </details>
      ) : null}

      <section className="card p-4 md:p-6">
        <div className="flex items-center justify-between gap-3 md:hidden">
          <h2 className="font-display text-xl">{monthName(y, m)}</h2>
          <div className="flex items-center gap-2">
            <Link
              href={`/calendar?view=month&m=${prev}`}
              aria-label="Previous month"
              className="btn btn-quiet px-3 py-2"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 2L4 7l5 5" />
              </svg>
            </Link>
            <Link
              href={`/calendar?view=month&m=${next}`}
              aria-label="Next month"
              className="btn btn-quiet px-3 py-2"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 2l5 5-5 5" />
              </svg>
            </Link>
          </div>
        </div>
        <div className="mt-3 md:hidden">
          <MiniMonthGrid
            year={y}
            month={m}
            stays={monthStays}
            maintenance={monthMaintenance}
            today={today}
            planningEnabled={editor}
          />
        </div>

        <div className="hidden md:block">
        <div className="flex items-center justify-between gap-4">
          {view === "month" ? (
            <h2 className="font-display text-2xl">{monthName(y, m)}</h2>
          ) : (
            <h2 className="font-display text-2xl">{yearY}</h2>
          )}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 rounded-lh border border-sand-line p-1">
              <Link href="/calendar?view=month" className={tab(view === "month")}>
                Month
              </Link>
              <Link href="/calendar?view=year" className={tab(view === "year")}>
                Year
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={
                  view === "month"
                    ? `/calendar?view=month&m=${prev}`
                    : `/calendar?view=year&y=${yearY - 1}`
                }
                aria-label={view === "month" ? "Previous month" : "Previous year"}
                className="btn btn-quiet px-3"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 2L4 7l5 5" />
                </svg>
              </Link>
              <Link
                href={
                  view === "month"
                    ? `/calendar?view=month&m=${next}`
                    : `/calendar?view=year&y=${yearY + 1}`
                }
                aria-label={view === "month" ? "Next month" : "Next year"}
                className="btn btn-quiet px-3"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 2l5 5-5 5" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-4">
          {view === "month" ? (
            <MonthGrid
              year={y}
              month={m}
              stays={monthStays}
              maintenance={monthMaintenance}
              today={today}
              planningEnabled={editor}
            />
          ) : (
            <YearGrid
              year={yearY}
              stays={yearStays}
              maintenance={yearMaintenance}
              today={today}
              planningEnabled={editor}
            />
          )}
        </div>
        <div className="mt-4 border-t border-sand-line pt-3">
          <HouseholdLegend
            stays={view === "month" ? monthStays : yearStays}
            showMaintenance={
              (view === "month" ? monthMaintenance : yearMaintenance).length > 0
            }
          />
        </div>
        </div>
      </section>

      <section
        id="calendar-details"
        className="card mt-4 scroll-mt-4 p-4 md:hidden"
      >
        <p className="section-label">Month details</p>
        <h2 className="font-display mt-1 text-xl">
          Stays and maintenance
        </h2>
        <ul className="mt-3 divide-y divide-sand-line">
          {monthStays.map((stay) => (
            <li key={`mobile-stay-${stay.id}`} className="py-3 first:pt-0">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: householdVar(stay.color) }}
                />
                <div className="min-w-0">
                  <p className="font-semibold">{stay.label}</p>
                  <p className="text-xs text-ink-soft">
                    {fmtRange(stay.start, stay.end)}
                  </p>
                  {stay.note ? (
                    <p className="mt-1 text-xs text-ink-faint">{stay.note}</p>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
          {monthMaintenance.map((item) => (
            <li
              key={`mobile-maintenance-${item.id}`}
              className="py-3 first:pt-0"
            >
              <Link
                href={`/upkeep?tab=maintenance#maintenance-${item.id}`}
                className="group flex items-start gap-3 rounded-lh transition-colors hover:bg-water-tint"
              >
                <span
                  aria-hidden
                  className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-[3px] bg-care"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold transition-colors group-hover:text-water">
                    {item.task}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {fmtDay(item.nextDue!)} · Preventive care
                  </p>
                </div>
                <span className="text-xs font-semibold text-water group-hover:text-deep-2">
                  Open
                </span>
              </Link>
            </li>
          ))}
          {monthStays.length === 0 && monthMaintenance.length === 0 ? (
            <li className="py-3 text-sm text-ink-soft">
              Nothing is scheduled this month.
            </li>
          ) : null}
        </ul>
      </section>

      <section className="card mt-6 p-6">
        <p className="section-label text-care">Preventive care</p>
        <h2 className="font-display text-2xl mt-1">Maintenance dates</h2>
        <ul className="mt-4 divide-y divide-sand-line">
          {datedMaintenance.map((item) => (
            <li
              key={item.id}
              className="py-1 first:pt-0 last:pb-0"
            >
              <Link
                href={`/upkeep?tab=maintenance#maintenance-${item.id}`}
                className="group flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lh px-2 py-2 transition-colors hover:bg-water-tint"
              >
                <span className="chip chip-care shrink-0">
                  {fmtDay(item.nextDue!)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold transition-colors group-hover:text-water">
                    {item.task}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {item.cadence ?? "No cadence"}
                    {item.assignedTo ? ` · Assigned to ${item.assignedTo}` : ""}
                  </p>
                </div>
                <span className="text-sm font-medium text-water group-hover:text-deep-2">
                  Open
                </span>
              </Link>
            </li>
          ))}
          {datedMaintenance.length === 0 ? (
            <li className="py-4 text-sm text-ink-soft">
              No preventive care dates have been scheduled yet.
            </li>
          ) : null}
        </ul>
      </section>

      {overlappingVisits.length > 0 ? (
        <section className="card mt-6 border-amber p-6">
          <p className="section-label text-amber">Shared dates</p>
          <h2 className="font-display mt-1 text-2xl">
            Family visits overlap
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            These reservations share at least one day. Coordinate arrival,
            sleeping arrangements, and supplies before the trip.
          </p>
          <ul className="mt-3">
            {overlappingVisits.map(({ stay, other }) => (
              <li
                key={`${stay.id}:${other.id}`}
                className="border-t border-sand-line py-2 text-sm first:border-0"
              >
                <span className="font-semibold">{stay.label}</span>
                {` (${fmtRange(stay.start, stay.end)}) shares dates with `}
                <span className="font-semibold">{other.label}</span>
                {` (${fmtRange(other.start, other.end)})`}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Subscribe */}
      <section className="card mt-6 p-6">
        <p className="section-label">Subscribe</p>
        <h2 className="font-display text-2xl mt-1">
          The lake schedule, on your own calendar
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          Subscribe once and every stay and preventive care date shows up in
          your calendar app automatically, including changes. In Apple
          Calendar, open the webcal link. In Google Calendar, choose Other
          calendars, then From URL, and paste the https link. Subscriptions
          update on the calendar app&apos;s own schedule, usually within a day.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <CopyField label="Apple Calendar (webcal)" value={`webcal://${host}${feedPath}`} />
          <CopyField label="Google Calendar (from URL)" value={`https://${host}${feedPath}`} />
        </div>
        <p className="mt-3 text-xs text-ink-faint">
          Anyone with this link can see the schedule, so treat it like a house
          key. Subscriptions from outside this computer start working once the
          site is on its real domain.
        </p>
      </section>
    </div>
  );
}

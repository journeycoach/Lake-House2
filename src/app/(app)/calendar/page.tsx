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
import { MonthGrid, HouseholdLegend } from "@/components/month-grid";
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
  searchParams: Promise<{ m?: string; y?: string; view?: string }>;
}) {
  const user = await requireUser();
  const editor = canEdit(user.effectiveRole);
  const params = await searchParams;
  const view = params.view === "year" ? "year" : "month";
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

  const [stays, maintenance, households] = await Promise.all([
    allStays(),
    maintenanceItems(),
    getDb()
      .select({ id: schema.households.id, name: schema.households.name })
      .from(schema.households)
      .orderBy(asc(schema.households.name)),
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

  const token = await getFeedToken();
  const host = (await headers()).get("host") ?? "localhost:3000";
  const feedPath = `/api/feed/${token}.ics`;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Calendar" action={<span />} />

      {/* Month / year views: md and up. Phones get the agenda list below. */}
      <section className="card hidden p-6 md:block">
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
            />
          ) : (
            <YearGrid
              year={yearY}
              stays={yearStays}
              maintenance={yearMaintenance}
              today={today}
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
      </section>

      <section className="card mt-6 p-6">
        <p className="section-label text-care">Preventive care</p>
        <h2 className="font-display text-2xl mt-1">Maintenance dates</h2>
        <ul className="mt-4 divide-y divide-sand-line">
          {datedMaintenance.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 first:pt-0 last:pb-0"
            >
              <span className="chip chip-care shrink-0">
                {fmtDay(item.nextDue!)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{item.task}</p>
                <p className="text-xs text-ink-soft">
                  {item.cadence ?? "No cadence"}
                  {item.assignedTo ? ` · Assigned to ${item.assignedTo}` : ""}
                </p>
              </div>
              <Link
                href="/upkeep"
                className="text-sm font-medium text-water hover:text-deep-2"
              >
                Open
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

      {/* Stays list */}
      <section className="card mt-6 p-6">
        <p className="section-label">Upcoming stays</p>
        <h2 className="font-display text-2xl mt-1">Who is using Paine Pointe</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Conflicting dates are flagged before saving.
        </p>
        <ul className="mt-4">
          {upcoming.map((s) => (
            <StayListItem
              key={s.id}
              stay={s}
              households={households}
              color={householdVar(s.color)}
              dateBadge={fmtDay(s.start)}
              meta={`${fmtRange(s.start, s.end)} · ${s.adults} adult${s.adults === 1 ? "" : "s"} · ${s.kids} kid${s.kids === 1 ? "" : "s"}`}
              canEdit={editor}
            />
          ))}
          {upcoming.length === 0 ? (
            <li className="py-4 text-sm text-ink-soft">
              Nothing on the calendar yet. Plan the first stay below.
            </li>
          ) : null}
        </ul>
      </section>

      {/* Plan a stay */}
      {editor ? (
        <section id="plan" className="card mt-6 p-6 scroll-mt-6">
          <p className="section-label">Plan a stay</p>
          <h2 className="font-display text-2xl mt-1 mb-4">Put it on the calendar</h2>
          <StayForm households={households} />
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

import type { Metadata } from "next";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { parseISO, todayISO, monthName } from "@/lib/dates";
import { allStays, maintenanceItems } from "@/lib/queries";
import { requireUser } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { MiniMonthGrid, MonthGrid, HouseholdLegend } from "@/components/month-grid";
import { PageHeader } from "@/components/page-header";
import { StayForm } from "../stay-form";

export const metadata: Metadata = { title: "Plan a Stay · Paine Pointe" };

export default async function PlanStayPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; start?: string }>;
}) {
  const user = await requireUser();
  const editor = canEdit(user.effectiveRole);
  const params = await searchParams;
  const today = todayISO();
  let { y, m } = parseISO(today);
  const selectedStart = /^\d{4}-\d{2}-\d{2}$/.test(params.start ?? "")
    ? params.start
    : undefined;
  if (params.m && /^\d{4}-\d{2}$/.test(params.m)) {
    const [year, month] = params.m.split("-").map(Number);
    if (month >= 1 && month <= 12) {
      y = year;
      m = month;
    }
  } else if (selectedStart) {
    ({ y, m } = parseISO(selectedStart));
  }

  const monthKey = `${y}-${String(m).padStart(2, "0")}`;
  const previousMonth = m === 1
    ? `${y - 1}-12`
    : `${y}-${String(m - 1).padStart(2, "0")}`;
  const nextMonth = m === 12
    ? `${y + 1}-01`
    : `${y}-${String(m + 1).padStart(2, "0")}`;
  const [stays, maintenance, households] = await Promise.all([
    allStays(),
    maintenanceItems(),
    getDb()
      .select({ id: schema.households.id, name: schema.households.name })
      .from(schema.households)
      .orderBy(asc(schema.households.name)),
  ]);
  const monthStays = stays.filter(
    (stay) => stay.start <= `${monthKey}-31` && stay.end >= `${monthKey}-01`
  );
  const monthMaintenance = maintenance.filter((item) =>
    item.nextDue?.startsWith(monthKey)
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Plan a Stay"
        action={
          <Link href="/calendar" className="btn btn-quiet">
            ← Back to calendar
          </Link>
        }
      />

      <section id="plan-form" className="mb-5 scroll-mt-6 rounded-lh border border-water/30 border-l-4 bg-water-tint p-4 md:p-5">
        <div className="mb-4 flex items-center gap-3 border-b border-sand-line pb-4">
          <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lh bg-water text-white">
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3.5" width="13" height="11.5" rx="1.5" />
              <path d="M5 2v3M12 2v3M2 7h13M8.5 9v4M6.5 11h4" />
            </svg>
          </span>
          <div>
            <h2 className="font-display text-xl">Put it on the calendar</h2>
          </div>
        </div>
        {editor ? (
          <StayForm
            households={households}
            defaultDate={selectedStart}
            defaultHouseholdId={user.householdId}
            defaultLabel={`Family ${user.name}`}
            existingStays={stays}
          />
        ) : (
          <p className="text-sm text-ink-soft">Only family members can add a stay. You can still use the calendar below to check dates.</p>
        )}
      </section>

      <section className="card p-4 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl md:text-2xl">{monthName(y, m)}</h2>
          <div className="flex items-center gap-2">
            <Link href={`/calendar/plan?m=${previousMonth}`} aria-label="Previous month" className="btn btn-quiet px-3 py-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2L4 7l5 5" /></svg>
            </Link>
            <Link href={`/calendar/plan?m=${nextMonth}`} aria-label="Next month" className="btn btn-quiet px-3 py-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 2l5 5-5 5" /></svg>
            </Link>
          </div>
        </div>
        <p className="mt-1 text-sm text-ink-soft">Calendar reference · tap an open day to start a stay for that date.</p>
        <div className="mt-4 md:hidden">
          <MiniMonthGrid year={y} month={m} stays={monthStays} maintenance={monthMaintenance} today={today} planningEnabled={editor} />
        </div>
        <div className="mt-4 hidden md:block">
          <MonthGrid year={y} month={m} stays={monthStays} maintenance={monthMaintenance} today={today} planningEnabled={editor} />
        </div>
        <div className="mt-4 border-t border-sand-line pt-3">
          <HouseholdLegend stays={monthStays} showMaintenance={monthMaintenance.length > 0} />
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { householdVar } from "@/lib/colors";
import { fmtDay, fmtRange, monthName, parseISO, todayISO } from "@/lib/dates";
import { allStays, staysNow, staysUpcoming } from "@/lib/queries";
import { MonthGrid, HouseholdLegend } from "@/components/month-grid";
import { PageHeader } from "@/components/page-header";
import { StayForm, StayListItem } from "./stay-form";

export const metadata: Metadata = { title: "Calendar · The Lakehouse" };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const params = await searchParams;
  const today = todayISO();
  const t = parseISO(today);
  let y = t.y;
  let m = t.m;
  if (params.m && /^\d{4}-\d{2}$/.test(params.m)) {
    const [py, pm] = params.m.split("-").map(Number);
    y = py;
    m = pm;
  }
  const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;

  const stays = await allStays();
  const monthKey = `${y}-${String(m).padStart(2, "0")}`;
  const monthStays = stays.filter(
    (s) => s.start <= `${monthKey}-31` && s.end >= `${monthKey}-01`
  );
  const households = await db
    .select({ id: schema.households.id, name: schema.households.name })
    .from(schema.households)
    .orderBy(asc(schema.households.name));

  const upcoming = [...staysNow(stays, today), ...staysUpcoming(stays, today)];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Calendar" action={<span />} />

      {/* Month view: desktop only. Phones get the agenda below instead. */}
      <section className="card hidden p-6 md:block">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl">{monthName(y, m)}</h2>
          <div className="flex items-center gap-2">
            <Link
              href={`/calendar?m=${prev}`}
              aria-label="Previous month"
              className="btn btn-quiet px-3"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 2L4 7l5 5" />
              </svg>
            </Link>
            <Link
              href={`/calendar?m=${next}`}
              aria-label="Next month"
              className="btn btn-quiet px-3"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 2l5 5-5 5" />
              </svg>
            </Link>
          </div>
        </div>
        <div className="mt-4">
          <MonthGrid year={y} month={m} stays={monthStays} today={today} />
        </div>
        <div className="mt-4 border-t border-sand-line pt-3">
          <HouseholdLegend stays={monthStays} />
        </div>
      </section>

      {/* Stays list */}
      <section className="card mt-6 p-6">
        <p className="section-label">Upcoming stays</p>
        <h2 className="font-display text-2xl mt-1">Who is using the lakehouse</h2>
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
      <section id="plan" className="card mt-6 p-6 scroll-mt-6">
        <p className="section-label">Plan a stay</p>
        <h2 className="font-display text-2xl mt-1 mb-4">Put it on the calendar</h2>
        <StayForm households={households} />
      </section>
    </div>
  );
}

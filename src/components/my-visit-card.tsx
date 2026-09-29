import Link from "next/link";
import { Suspense } from "react";
import { fmtRange } from "@/lib/dates";
import type { StayChecklistProgress, StayRow } from "@/lib/queries";
import {
  VisitWeatherFallback,
  VisitWeatherSummary,
} from "@/components/live-weather-card";

type VisitIssue = {
  id: number;
  title: string;
};

export function MyVisitEmptyState({ canPlan }: { canPlan: boolean }) {
  return (
    <section className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-lh bg-deep px-4 py-4 text-white shadow-sm sm:mb-6 sm:px-6">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/65">
          My Visit
        </p>
        <h2 className="mt-1 font-display text-2xl">No upcoming visit assigned</h2>
        <p className="mt-1 text-sm text-white/70">
          Your dates, stay checklist, weather, shopping, and property notes will
          appear here once your household has a stay.
        </p>
      </div>
      {canPlan ? (
        <Link href="/calendar?plan=open#plan" className="btn bg-white text-deep hover:bg-mist">
          Plan my next visit
        </Link>
      ) : (
        <Link href="/calendar" className="text-sm font-semibold text-white/85 hover:text-white">
          View the calendar →
        </Link>
      )}
    </section>
  );
}

export function MyVisitCard({
  stay,
  today,
  progress,
  shoppingItems,
  issues,
}: {
  stay: StayRow;
  today: string;
  progress?: StayChecklistProgress;
  shoppingItems: { id: number; title: string }[];
  issues: VisitIssue[];
}) {
  const isCurrent = stay.start <= today && today <= stay.end;
  const total = progress?.total ?? 0;
  const completed = progress?.completed ?? 0;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const guestCount = stay.adults + stay.kids;

  return (
    <section className="mb-4 overflow-hidden rounded-lh bg-deep text-white shadow-sm sm:mb-6">
      <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/65">
              My Visit
            </p>
            <span className="rounded-full bg-white/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/85">
              {isCurrent ? "At the lake now" : "Upcoming"}
            </span>
          </div>
          <h2 className="mt-1 font-display text-2xl sm:text-3xl">{stay.label}</h2>
          <p className="mt-1 text-sm text-white/75">
            {fmtRange(stay.start, stay.end)}
            {guestCount > 0
              ? ` · ${guestCount} guest${guestCount === 1 ? "" : "s"}`
              : ""}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lh bg-white/10 p-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold">Stay checklist</span>
                <span className="text-white/70">
                  {completed} of {total}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-sage"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-white/60">
                {total > 0 ? `${percent}% complete` : "Ready when your visit begins"}
              </p>
            </div>
            <Suspense fallback={<VisitWeatherFallback />}>
              <VisitWeatherSummary />
            </Suspense>
          </div>
        </div>

        <div className="rounded-lh bg-white p-4 text-ink">
          <div className="grid grid-cols-2 gap-3">
            <Link href="/checklist" className="rounded-lh bg-mist p-3 hover:bg-water/10">
              <span className="section-label">Shopping</span>
              <span className="mt-1 block font-display text-xl">
                {shoppingItems.length} item{shoppingItems.length === 1 ? "" : "s"}
              </span>
              <span className="mt-1 block truncate text-xs text-ink-soft">
                {shoppingItems[0]?.title ?? "Nothing needed"}
              </span>
            </Link>
            <Link
              href="/upkeep?tab=fixit"
              className="rounded-lh bg-mist p-3 hover:bg-water/10"
            >
              <span className="section-label">Property care</span>
              <span className="mt-1 block font-display text-xl">
                {issues.length} open
              </span>
              <span className="mt-1 block truncate text-xs text-ink-soft">
                {issues[0]?.title ?? "No urgent issues"}
              </span>
            </Link>
          </div>
          <Link
            href={`/calendar/${stay.id}/checklist`}
            className="btn btn-primary mt-3 w-full justify-center"
          >
            Open my visit
          </Link>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { Suspense } from "react";
import { fmtRange } from "@/lib/dates";
import type { StayChecklistProgress, StayRow } from "@/lib/queries";
import {
  VisitWeatherForecast,
  VisitWeatherForecastFallback,
} from "@/components/live-weather-card";
import { HomeIcon, SailboatIcon } from "@/components/icons";

export function MyVisitEmptyState({ canPlan }: { canPlan: boolean }) {
  return (
    <section className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-lh bg-deep px-4 py-4 text-white shadow-sm sm:mb-6 sm:px-6">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/65">
          My Visit
        </p>
        <h2 className="mt-1 font-display text-2xl">No upcoming visit assigned</h2>
        <p className="mt-1 text-sm text-white/70">
          Your dates, stay checklist, shopping, and property notes will
          appear here once your household has a stay.
        </p>
      </div>
      {canPlan ? (
        <Link href="/calendar/plan" className="btn bg-white text-deep hover:bg-mist">
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
  myShoppingItems,
  assignedItems,
}: {
  stay: StayRow;
  today: string;
  progress?: StayChecklistProgress;
  shoppingItems: { id: number; title: string }[];
  myShoppingItems: { id: number; title: string }[];
  assignedItems: {
    id: string;
    title: string;
    assignedTo: string;
    category: "Issue" | "Maintenance";
    href: string;
  }[];
}) {
  const isCurrent = stay.start <= today && today <= stay.end;
  const leavesToday = isCurrent && stay.end === today;
  const total = progress?.total ?? 0;
  const completed = progress?.completed ?? 0;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const checkoutTotal = progress?.checkoutTotal ?? 0;
  const checkoutCompleted = progress?.checkoutCompleted ?? 0;
  const checkoutPercent = checkoutTotal > 0
    ? Math.round((checkoutCompleted / checkoutTotal) * 100)
    : 0;
  const guestCount = stay.adults + stay.kids;

  return (
    <section className="mb-4 overflow-hidden rounded-lh bg-deep text-white shadow-sm sm:mb-6">
      <div className="p-4 sm:px-5 sm:py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/65">
                My Visit
              </p>
              <span className="rounded-full bg-white/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/85">
                {isCurrent ? "At the lake now" : "Upcoming"}
              </span>
            </div>
            <h2 className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 font-display text-xl sm:text-2xl">
              <span>{stay.label}</span>
              {stay.note ? (
                <span className="font-sans text-xs font-normal text-white/75">
                  Arrival note: {stay.note}
                </span>
              ) : null}
            </h2>
            <p className="mt-0.5 text-xs text-white/70">
              {fmtRange(stay.start, stay.end)}
              {stay.guestNames
                ? ` · ${stay.guestNames}`
                : guestCount > 0
                  ? ` · ${guestCount} guest${guestCount === 1 ? "" : "s"}`
                  : ""}
            </p>
            <Suspense fallback={<VisitWeatherForecastFallback />}>
              <VisitWeatherForecast start={stay.start} end={stay.end} today={today} />
            </Suspense>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/15 pt-3 lg:border-0 lg:pt-0">
            <Link
              href={`/calendar/${stay.id}/checklist`}
              aria-label={`Open Stay Checklist for ${stay.label}: ${completed} of ${total} complete`}
              className="group inline-flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <HomeIcon className="h-4 w-4" />
              <span>Stay Checklist</span>
              <span className="text-xs font-medium text-white/70">{completed}/{total}</span>
              <span aria-hidden="true">→</span>
            </Link>
            <span
              role="progressbar"
              aria-label="Stay Checklist progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              className="h-1.5 w-20 overflow-hidden rounded-full bg-white/20"
            >
              <span className="block h-full rounded-full bg-sage" style={{ width: `${percent}%` }} />
            </span>
            <Link
              href={`/calendar/${stay.id}/checklist#boat-checklist`}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-semibold text-white/85 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <SailboatIcon className="h-4 w-4" /> Boat Checklist <span aria-hidden="true">→</span>
            </Link>
            {isCurrent && stay.end === today ? (
              <span className="inline-flex items-center gap-2">
                <Link
                  href={`/calendar/${stay.id}/checklist`}
                  aria-label={`Open Leave Checklist: ${checkoutCompleted} of ${checkoutTotal} complete`}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-semibold hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <svg
                    aria-hidden="true"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2.5 14V2.5h7V14" />
                    <path d="M5 5.5h2M5 8h2" />
                    <path d="M8 11h5m-2-2 2 2-2 2" />
                  </svg>
                  <span>Leave Checklist</span>
                  <span className="text-xs font-medium text-white/70">
                    {checkoutCompleted}/{checkoutTotal}
                  </span>
                  <span aria-hidden="true">→</span>
                </Link>
                <span
                  role="progressbar"
                  aria-label="Leave Checklist progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={checkoutPercent}
                  className="h-1.5 w-20 overflow-hidden rounded-full bg-white/20"
                >
                  <span
                    className="block h-full rounded-full bg-sage"
                    style={{ width: `${checkoutPercent}%` }}
                  />
                </span>
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/15 pt-3 md:grid-cols-4">
          <Link href="/shopping-list" className="min-w-0 rounded-md bg-white px-3 py-2 text-ink transition-colors hover:bg-mist">
            <span className="section-label text-[9px]">Shopping</span>
            <span className="mt-0.5 block text-sm font-semibold">
              {myShoppingItems.length > 0 ? (
                <>
                  {myShoppingItems.length} for you
                  <span className="ml-1 font-normal text-ink-soft">
                    · {myShoppingItems.slice(0, 2).map((item) => item.title).join(", ")}
                    {myShoppingItems.length > 2 ? ` +${myShoppingItems.length - 2}` : ""}
                  </span>
                </>
              ) : (
                <>
                  {shoppingItems.length} item{shoppingItems.length === 1 ? "" : "s"}
                  <span className="ml-1 font-normal text-ink-soft">
                    · {shoppingItems[0]?.title ?? "All set"}
                  </span>
                </>
              )}
            </span>
          </Link>

          {assignedItems.length > 0 ? (
            <div className="min-w-0 rounded-md bg-white px-3 py-2 text-ink">
              <span className="section-label text-[9px]">Assigned · {assignedItems.length}</span>
              <div className="mt-0.5 space-y-0.5">
                {assignedItems.slice(0, 2).map((item) => (
                  <Link key={item.id} href={item.href} className="block truncate text-xs hover:text-water">
                    <span className="font-semibold">{item.assignedTo}:</span> {item.title}
                  </Link>
                ))}
                {assignedItems.length > 2 ? (
                  <Link href="/upkeep" className="block text-[10px] font-semibold text-water hover:underline">
                    +{assignedItems.length - 2} more →
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}

        </div>
      </div>
    </section>
  );
}

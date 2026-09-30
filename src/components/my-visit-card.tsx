import Link from "next/link";
import { fmtDay, fmtRange } from "@/lib/dates";
import type { StayChecklistProgress, StayRow } from "@/lib/queries";

type VisitIssue = {
  id: number;
  title: string;
  urgency: "urgent" | "soon" | "whenever";
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
          Your dates, stay checklist, shopping, and property notes will
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
  overlappingVisits,
  progress,
  shoppingItems,
  issues,
  overdueMaintenance,
}: {
  stay: StayRow;
  today: string;
  overlappingVisits: StayRow[];
  progress?: StayChecklistProgress;
  shoppingItems: { id: number; title: string }[];
  issues: VisitIssue[];
  overdueMaintenance: { id: number; task: string; nextDue: string | null }[];
}) {
  const isCurrent = stay.start <= today && today <= stay.end;
  const total = progress?.total ?? 0;
  const completed = progress?.completed ?? 0;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const checkoutTotal = progress?.checkoutTotal ?? 0;
  const checkoutCompleted = progress?.checkoutCompleted ?? 0;
  const checkoutPercent =
    checkoutTotal > 0 ? Math.round((checkoutCompleted / checkoutTotal) * 100) : 0;
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
          <h2 className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 font-display text-2xl sm:text-3xl">
            <span>{stay.label}</span>
            {stay.note ? (
              <span className="font-sans text-sm font-normal text-white/75">
                Arrival note: {stay.note}
              </span>
            ) : null}
          </h2>
          <p className="mt-1 text-sm text-white/75">
            {fmtRange(stay.start, stay.end)}
            {guestCount > 0
              ? ` · ${guestCount} guest${guestCount === 1 ? "" : "s"}`
              : ""}
          </p>

          {overlappingVisits.length > 0 ? (
            <div
              role="status"
              className="mt-3 rounded-lg border border-amber-200/40 bg-amber-100/10 px-3 py-2 text-sm text-white/90"
            >
              <p className="font-semibold text-amber-100">
                Another family visit overlaps
              </p>
              <ul className="mt-1 space-y-1 text-xs text-white/80">
                {overlappingVisits.slice(0, 2).map((visit) => {
                  const overlapStart = visit.start > stay.start ? visit.start : stay.start;
                  const overlapEnd = visit.end < stay.end ? visit.end : stay.end;
                  return (
                    <li key={visit.id}>
                      {visit.label} · {fmtRange(overlapStart, overlapEnd)}
                    </li>
                  );
                })}
              </ul>
              {overlappingVisits.length > 2 ? (
                <p className="mt-1 text-xs text-white/70">
                  And {overlappingVisits.length - 2} more overlapping visit
                  {overlappingVisits.length - 2 === 1 ? "" : "s"}.
                </p>
              ) : null}
              <Link
                href="/calendar#upcoming-stays"
                className="mt-1 inline-block text-xs font-semibold text-amber-100 underline decoration-amber-100/50 underline-offset-2 hover:text-white"
              >
                View calendar
              </Link>
            </div>
          ) : null}

          <div className="mt-4 max-w-md">
            <Link
              href={`/calendar/${stay.id}/checklist`}
              aria-label={`Open stay checklist for ${stay.label}`}
              className="group block rounded-lh bg-white/10 p-3 transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <span aria-hidden="true">🏠</span>
                  Stay checklist <span aria-hidden>→</span>
                </span>
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
            </Link>
            <Link
              href={`/calendar/${stay.id}/checklist#boat-checklist`}
              className="mt-2 inline-flex min-h-9 items-center gap-2 rounded-md px-2 text-sm font-semibold text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span aria-hidden="true">⛵</span>
              Boat checklist <span aria-hidden="true">→</span>
            </Link>
          </div>

          {isCurrent && stay.end === today ? (
            <div className="mt-2 max-w-md">
              <Link
                href={`/calendar/${stay.id}/checklist`}
                aria-label={`Check-out checklist: ${checkoutCompleted} of ${checkoutTotal} complete`}
                className="group block rounded-lh border border-white/15 bg-white/10 p-3 transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold">Check-out progress <span aria-hidden>→</span></span>
                  <span className="text-white/75">
                    {checkoutCompleted} of {checkoutTotal}
                  </span>
                </div>
                {checkoutTotal > 0 ? (
                  <>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
                      <div
                        className="h-full rounded-full bg-sage"
                        style={{ width: `${checkoutPercent}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-white/65">
                      {checkoutCompleted === checkoutTotal
                        ? "All check-out tasks complete"
                        : `${checkoutTotal - checkoutCompleted} task${checkoutTotal - checkoutCompleted === 1 ? "" : "s"} remaining`}
                    </p>
                  </>
                ) : (
                  <p className="mt-1.5 text-xs text-white/65">No check-out tasks for this visit</p>
                )}
              </Link>
            </div>
          ) : null}
        </div>

        <div className="rounded-lh bg-white p-4 text-ink">
          <div className="grid grid-cols-2 gap-3">
            <Link href="/shopping-list" className="rounded-lh bg-mist p-3 hover:bg-water/10">
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
              {issues[0] ? (
                <span className="mt-1 flex min-w-0 items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-xs text-ink-soft">
                    {issues[0].title}
                  </span>
                  <span className={`chip chip-${issues[0].urgency} shrink-0 text-[10px]`}>
                    {issues[0].urgency === "urgent"
                      ? "Urgent"
                      : issues[0].urgency === "soon"
                        ? "Soon"
                        : "Whenever"}
                  </span>
                </span>
              ) : (
                <span className="mt-1 block truncate text-xs text-ink-soft">
                  No open items
                </span>
              )}
            </Link>
          </div>
          {overdueMaintenance.length > 0 ? (
            <div className="mt-3 rounded-lh border border-red-200 bg-red-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-red-800">
                  Overdue maintenance
                </span>
                <span className="text-xs font-semibold text-red-800">
                  {overdueMaintenance.length} item{overdueMaintenance.length === 1 ? "" : "s"}
                </span>
              </div>
              <ul className="mt-1 space-y-1">
                {overdueMaintenance.slice(0, 2).map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/upkeep?tab=maintenance#maintenance-${item.id}`}
                      className="flex min-w-0 items-baseline justify-between gap-2 text-xs text-red-900 hover:underline"
                    >
                      <span className="truncate font-medium">{item.task}</span>
                      {item.nextDue ? (
                        <span className="shrink-0 text-red-800/75">{fmtDay(item.nextDue)}</span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
              {overdueMaintenance.length > 2 ? (
                <Link
                  href="/upkeep?tab=maintenance"
                  className="mt-1 inline-block text-xs font-semibold text-red-900 hover:underline"
                >
                  View all overdue maintenance →
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

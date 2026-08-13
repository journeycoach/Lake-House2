import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { fmtRange } from "@/lib/dates";
import { getDb, schema } from "@/lib/db";
import { StayChecklistPhase, type StayChecklistEntry } from "../../stay-checklist";

function tabClass(active: boolean) {
  return `rounded-lh px-4 py-2 text-sm font-semibold transition-colors ${
    active ? "bg-deep text-white" : "text-ink-soft hover:text-ink"
  }`;
}

export default async function VisitChecklistPage({
  params,
  searchParams,
}: {
  params: Promise<{ stayId: string }>;
  searchParams: Promise<{ phase?: string }>;
}) {
  await requireUser();
  const { stayId: rawStayId } = await params;
  const stayId = Number(rawStayId);
  if (!Number.isInteger(stayId) || stayId < 1) notFound();

  const [stay, rows] = await Promise.all([
    getDb().query.stays.findFirst({ where: eq(schema.stays.id, stayId) }),
    getDb()
      .select()
      .from(schema.stayChecklistItems)
      .where(eq(schema.stayChecklistItems.stayId, stayId))
      .orderBy(
        asc(schema.stayChecklistItems.phase),
        asc(schema.stayChecklistItems.position)
      ),
  ]);
  if (!stay) notFound();

  const requested = (await searchParams).phase;
  const phase = requested === "checkout" ? "checkout" : "checkin";
  const phaseItems: StayChecklistEntry[] = rows
    .filter((item) => item.phase === phase)
    .map((item) => ({
      id: item.id,
      phase: item.phase,
      title: item.title,
      done: Boolean(item.checkedAt),
      checkedBy: item.checkedBy,
      checkedAt: item.checkedAt,
    }));
  const completed = phaseItems.filter((item) => item.done).length;
  const phaseComplete = phaseItems.length > 0 && completed === phaseItems.length;
  const totalCompleted = rows.filter((item) => item.checkedAt).length;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5">
        <Link href="/calendar" className="text-sm font-semibold text-water hover:text-deep-2">
          ← Back to calendar
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="section-label">Visit checklist</p>
            <h1 className="font-display mt-1 text-3xl">{stay.label}</h1>
            <p className="mt-1 text-sm text-ink-soft">{fmtRange(stay.start, stay.end)}</p>
          </div>
          <span className={`chip ${totalCompleted === rows.length && rows.length > 0 ? "chip-ready" : "chip-whenever"}`}>
            {totalCompleted} of {rows.length} complete
          </span>
        </div>
      </div>

      <section className="card p-4 md:p-6">
        <div className="flex items-center gap-1 rounded-lh border border-sand-line p-1">
          <Link
            href={`/calendar/${stay.id}/checklist?phase=checkin`}
            className={tabClass(phase === "checkin")}
          >
            Check In
          </Link>
          <Link
            href={`/calendar/${stay.id}/checklist?phase=checkout`}
            className={tabClass(phase === "checkout")}
          >
            Check Out
          </Link>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-sand-line pb-4">
          <div>
            <h2 className="font-display text-2xl">
              {phase === "checkin" ? "Arrival tasks" : "Departure tasks"}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Anyone in the family can update this visit’s progress.
            </p>
          </div>
          <span className={`chip ${phaseComplete ? "chip-ready" : "chip-whenever"}`}>
            {phaseComplete ? "Complete" : `${completed} of ${phaseItems.length}`}
          </span>
        </div>

        {phaseItems.length > 0 ? (
          <div className="mt-4">
            <StayChecklistPhase
              label={phase === "checkin" ? "Check In" : "Check Out"}
              items={phaseItems}
              showStatus
            />
            <p className="mt-4 border-t border-sand-line pt-3 text-xs text-ink-faint">
              Unchecked items remain part of this visit’s permanent record as not completed.
            </p>
          </div>
        ) : (
          <p className="mt-5 text-sm text-ink-soft">
            This reservation does not have any {phase === "checkin" ? "check-in" : "check-out"} tasks.
          </p>
        )}
      </section>
    </div>
  );
}

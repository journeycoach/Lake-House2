import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { fmtRange } from "@/lib/dates";
import { getDb, schema } from "@/lib/db";
import { canUpdateStayChecklist } from "@/lib/stay-checklist-access";
import { StayChecklistPhase, type StayChecklistEntry } from "../../stay-checklist";

export default async function VisitChecklistPage({
  params,
}: {
  params: Promise<{ stayId: string }>;
}) {
  const user = await requireUser();
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
  const canToggle = canUpdateStayChecklist(user, stay);

  const checklistItems: StayChecklistEntry[] = rows.map((item) => ({
    id: item.id,
    phase: item.phase,
    title: item.title,
    done: Boolean(item.checkedAt),
    checkedBy: item.checkedBy,
    checkedAt: item.checkedAt,
  }));
  const phases = [
    {
      phase: "checkin" as const,
      label: "Check In",
      title: "Arrival tasks",
      items: checklistItems.filter((item) => item.phase === "checkin"),
    },
    {
      phase: "boat" as const,
      label: "Boat",
      title: "Boat tasks",
      items: checklistItems.filter((item) => item.phase === "boat"),
    },
    {
      phase: "checkout" as const,
      label: "Check Out",
      title: "Departure tasks",
      items: checklistItems.filter((item) => item.phase === "checkout"),
    },
  ];
  const totalCompleted = rows.filter((item) => item.checkedAt).length;

  return (
    <div className="mx-auto max-w-5xl">
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
        <p className="text-sm text-ink-soft">
          {canToggle
            ? "You can update this visit’s progress while your household is at the lake."
            : "Everyone can view these lists. Checkboxes are available only to the resident household during its stay."}
        </p>

        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {phases.map(({ phase, label, title, items }) => {
            const completed = items.filter((item) => item.done).length;
            const complete = items.length > 0 && completed === items.length;

            return (
              <section key={phase} className="rounded-lh border border-sand-line p-4">
                <div className="flex items-center justify-between gap-3 border-b border-sand-line pb-4">
                  <h2 className="font-display text-2xl">{title}</h2>
                  <span className={`chip shrink-0 ${complete ? "chip-ready" : "chip-whenever"}`}>
                    {complete ? "Complete" : `${completed} of ${items.length}`}
                  </span>
                </div>

                {items.length > 0 ? (
                  <div className="mt-4">
                    <StayChecklistPhase
                      label={label}
                      items={items}
                      canToggle={canToggle}
                      showStatus
                    />
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-ink-soft">
                    This reservation does not have any {phase === "checkin" ? "check-in" : phase === "checkout" ? "check-out" : "boat"} tasks.
                  </p>
                )}
              </section>
            );
          })}
        </div>

        <p className="mt-5 border-t border-sand-line pt-3 text-xs text-ink-faint">
          Unchecked items remain part of this visit’s permanent record as not completed.
        </p>
      </section>
    </div>
  );
}

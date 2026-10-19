import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { getDb, schema } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { setFixitStatus } from "../../fixit-actions";

export const metadata: Metadata = { title: "Repair completed · Paine Pointe" };

export default async function RepairCompletedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  if (!canEdit(user.effectiveRole)) notFound();
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) notFound();

  const item = await getDb().query.fixit.findFirst({
    where: eq(schema.fixit.id, id),
  });
  if (!item || !["open", "done"].includes(item.status)) notFound();

  const isComplete = item.status === "done";

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={isComplete ? "Repair completed" : "Complete a repair"} />

      <section
        aria-live="polite"
        className="card mt-6 p-6 text-center sm:p-8"
      >
        <span
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-white ${isComplete ? "bg-sage" : "bg-water"}`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="h-7 w-7"
          >
            {isComplete ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.5 4L19 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
            )}
          </svg>
        </span>
        <p
          className={`section-label mt-4 ${isComplete ? "text-sage" : "text-water"}`}
        >
          Property care update
        </p>
        <h2 className="font-display mt-1 text-3xl">
          {isComplete ? "Marked complete" : "Ready to mark complete?"}
        </h2>
        <p className="mt-2 text-lg font-semibold text-ink">{item.title}</p>
        {item.details ? (
          <p className="mt-1 text-sm text-ink-soft">{item.details}</p>
        ) : null}
        <p className="mt-4 text-sm text-ink-soft">
          {isComplete
            ? "This item has moved from the open list to Completed. You can still find it in the Property Care history."
            : "Review the repair, then confirm to move it from the open list to Completed."}
        </p>
        {isComplete ? (
          <Link
            href="/upkeep?tab=fixit#completed"
            className="btn btn-quiet mt-6 inline-flex"
          >
            ← Back to Property Care
          </Link>
        ) : (
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <form action={setFixitStatus}>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="status" value="done" />
              <button
                type="submit"
                className="btn bg-sage text-white hover:bg-deep"
              >
                Mark complete
              </button>
            </form>
            <Link href="/upkeep?tab=fixit" className="btn btn-quiet">
              Keep it open
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

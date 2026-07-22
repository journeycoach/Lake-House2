import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { openFixit } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { reportIssue, setFixitStatus, removeFixit } from "./actions";

export const metadata: Metadata = { title: "Fix-it list · The Lakehouse" };

export default async function FixitPage() {
  const open = await openFixit();
  const done = await db
    .select()
    .from(schema.fixit)
    .where(eq(schema.fixit.status, "done"))
    .orderBy(desc(schema.fixit.id));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Fix-it list" />

      <section className="card p-6">
        <p className="section-label">Repairs & replacements</p>
        <h2 className="font-display text-2xl mt-1">Keep the place cared for</h2>
        <ul className="mt-4">
          {open.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-4 border-t border-sand-line py-4 first:border-0"
            >
              <form action={setFixitStatus} className="shrink-0">
                <input type="hidden" name="id" value={f.id} />
                <input type="hidden" name="status" value="done" />
                <button
                  type="submit"
                  aria-label={`Mark "${f.title}" done`}
                  className="h-5 w-5 rounded-[4px] border border-sand-line hover:border-water"
                />
              </form>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{f.title}</p>
                {f.details ? (
                  <p className="text-sm text-ink-soft">{f.details}</p>
                ) : null}
                <p className="text-xs text-ink-faint">
                  {f.location}
                  {f.assignedTo ? ` · Assigned to ${f.assignedTo}` : " · Unassigned"}
                </p>
              </div>
              <span className={`chip chip-${f.priority} shrink-0`}>
                {f.priority}
              </span>
            </li>
          ))}
          {open.length === 0 ? (
            <li className="py-4 text-sm text-ink-soft">
              Nothing needs attention. The house thanks you.
            </li>
          ) : null}
        </ul>
      </section>

      <section className="card mt-6 p-6">
        <p className="section-label">Report an issue</p>
        <h2 className="font-display text-2xl mt-1 mb-4">What needs fixing</h2>
        <form action={reportIssue} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="title" className="flabel">
                What is broken
              </label>
              <input id="title" name="title" required className="field" placeholder="Dock light is flickering" />
            </div>
            <div>
              <label htmlFor="location" className="flabel">
                Where
              </label>
              <input id="location" name="location" className="field" placeholder="Dock" />
            </div>
            <div>
              <label htmlFor="priority" className="flabel">
                How urgent
              </label>
              <select id="priority" name="priority" className="field" defaultValue="whenever">
                <option value="urgent">Urgent</option>
                <option value="soon">Soon</option>
                <option value="whenever">Whenever</option>
              </select>
            </div>
            <div>
              <label htmlFor="assignedTo" className="flabel">
                Who is on it (optional)
              </label>
              <input id="assignedTo" name="assignedTo" className="field" placeholder="Dad" />
            </div>
          </div>
          <div>
            <label htmlFor="details" className="flabel">
              Details
            </label>
            <textarea id="details" name="details" rows={2} className="field" placeholder="Check the fixture and replace it if needed." />
          </div>
          <button type="submit" className="btn btn-primary">
            Add to the list
          </button>
        </form>
      </section>

      {done.length > 0 ? (
        <section className="card mt-6 p-6">
          <p className="section-label">Done</p>
          <ul className="mt-2">
            {done.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-4 border-t border-sand-line py-3 first:border-0"
              >
                <p className="flex-1 text-sm text-ink-faint line-through">
                  {f.title}
                </p>
                <form action={setFixitStatus}>
                  <input type="hidden" name="id" value={f.id} />
                  <input type="hidden" name="status" value="open" />
                  <button
                    type="submit"
                    className="text-xs font-medium text-water hover:text-deep-2"
                  >
                    Reopen
                  </button>
                </form>
                <form action={removeFixit}>
                  <input type="hidden" name="id" value={f.id} />
                  <button
                    type="submit"
                    className="text-xs font-medium text-ink-faint hover:text-rust"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

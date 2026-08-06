import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { addDays, fmtDay, todayISO } from "@/lib/dates";
import { maintenanceItems, openFixit } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { reportIssue, setFixitStatus, removeFixit } from "./fixit-actions";
import { addSchedule, updateDue, removeSchedule } from "./maintenance-actions";

export const metadata: Metadata = { title: "Upkeep · Paine Pointe" };

/* One page for taking care of the house: what is broken now, then the
   recurring work that keeps things from breaking. */
export default async function UpkeepPage() {
  const user = await requireUser();
  const editor = canEdit(user.effectiveRole);
  const open = await openFixit();
  const done = await getDb()
    .select()
    .from(schema.fixit)
    .where(eq(schema.fixit.status, "done"))
    .orderBy(desc(schema.fixit.id));
  const items = await maintenanceItems();
  const today = todayISO();
  const soon = addDays(today, 14);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Upkeep" />

      {/* Fix-it list */}
      <section className="card p-6">
        <p className="section-label">Fix-it list</p>
        <h2 className="font-display text-2xl mt-1">Keep the place cared for</h2>
        <ul className="mt-4">
          {open.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-4 border-t border-sand-line py-4 first:border-0"
            >
              {editor ? (
                <form action={setFixitStatus} className="shrink-0">
                  <input type="hidden" name="id" value={f.id} />
                  <input type="hidden" name="status" value="done" />
                  <button
                    type="submit"
                    aria-label={`Mark "${f.title}" done`}
                    className="h-5 w-5 rounded-[4px] border border-sand-line hover:border-water"
                  />
                </form>
              ) : (
                <span
                  aria-hidden
                  className="h-5 w-5 shrink-0 rounded-[4px] border border-sand-line"
                />
              )}
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

      {/* Report an issue */}
      <section className={`card mt-6 p-6 ${editor ? "" : "hidden"}`}>
        <p className="section-label">Report an issue</p>
        <h2 className="font-display text-2xl mt-1 mb-4">What needs fixing</h2>
        <form action={reportIssue} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="title" className="flabel">
                What is broken
              </label>
              <input id="title" name="title" required maxLength={200} className="field" placeholder="Dock light is flickering" />
            </div>
            <div>
              <label htmlFor="location" className="flabel">
                Where
              </label>
              <input id="location" name="location" maxLength={200} className="field" placeholder="Dock" />
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
              <input id="assignedTo" name="assignedTo" maxLength={200} className="field" placeholder="Dad" />
            </div>
          </div>
          <div>
            <label htmlFor="details" className="flabel">
              Details
            </label>
            <textarea id="details" name="details" rows={2} maxLength={4000} className="field" placeholder="Check the fixture and replace it if needed." />
          </div>
          <SubmitButton>Add to the list</SubmitButton>
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
                {!editor ? null : (
                  <>
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
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Maintenance schedules */}
      <section className="mt-10">
        <p className="section-label">Preventive care</p>
        <h2 className="font-display text-2xl mt-1">
          Keep recurring work from being forgotten
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {items.map((m) => {
            const overdue = m.nextDue && m.nextDue < today;
            const dueSoon = m.nextDue && !overdue && m.nextDue <= soon;
            return (
              <article key={m.id} className="card flex flex-col p-5">
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`chip ${overdue ? "chip-urgent" : dueSoon ? "chip-soon" : "chip-whenever"}`}
                  >
                    {overdue ? "Overdue" : dueSoon ? "Due soon" : "Upcoming"}
                  </span>
                  {editor ? (
                    <form action={removeSchedule}>
                      <input type="hidden" name="id" value={m.id} />
                      <button
                        type="submit"
                        className="text-xs font-medium text-ink-faint hover:text-rust"
                      >
                        Remove
                      </button>
                    </form>
                  ) : null}
                </div>
                <h3 className="font-display text-xl mt-3">
                  {m.nextDue ? fmtDay(m.nextDue) : "No date"}
                  <span className="ml-2 align-middle text-[11px] font-sans font-semibold uppercase tracking-wider text-ink-faint">
                    next due
                  </span>
                </h3>
                <p className="mt-1 font-semibold">{m.task}</p>
                {m.details ? (
                  <p className="mt-1 flex-1 text-sm text-ink-soft">{m.details}</p>
                ) : (
                  <span className="flex-1" />
                )}
                <p className="mt-2 text-xs text-ink-faint">
                  {m.cadence ?? "No cadence"} · {m.assignedTo ? `Assigned to ${m.assignedTo}` : "Unassigned"}
                </p>
                <form
                  action={updateDue}
                  className={`mt-3 items-center gap-2 border-t border-sand-line pt-3 ${editor ? "flex" : "hidden"}`}
                >
                  <input type="hidden" name="id" value={m.id} />
                  <input
                    type="date"
                    name="nextDue"
                    defaultValue={m.nextDue ?? ""}
                    className="field flex-1 py-2"
                  />
                  <button type="submit" className="btn btn-quiet shrink-0">
                    Set next due
                  </button>
                </form>
              </article>
            );
          })}
          {items.length === 0 ? (
            <p className="text-sm text-ink-soft">No schedules yet.</p>
          ) : null}
        </div>
      </section>

      {/* Add a schedule */}
      <section className={`card mt-6 p-6 ${editor ? "" : "hidden"}`}>
        <p className="section-label">Add a maintenance item</p>
        <h2 className="font-display text-2xl mt-1 mb-4">
          Put it on a schedule
        </h2>
        <form action={addSchedule} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="task" className="flabel">
                Task
              </label>
              <input id="task" name="task" required maxLength={200} className="field" placeholder="Clean gutters" />
            </div>
            <div>
              <label htmlFor="cadence" className="flabel">
                How often
              </label>
              <input id="cadence" name="cadence" maxLength={200} className="field" placeholder="Every spring and fall" />
            </div>
            <div>
              <label htmlFor="nextDue" className="flabel">
                Next due
              </label>
              <input id="nextDue" name="nextDue" type="date" className="field" />
            </div>
            <div>
              <label htmlFor="assignedTo2" className="flabel">
                Assigned to
              </label>
              <input id="assignedTo2" name="assignedTo" maxLength={200} className="field" placeholder="Unassigned" />
            </div>
          </div>
          <div>
            <label htmlFor="details2" className="flabel">
              Details
            </label>
            <textarea
              id="details2"
              name="details"
              rows={2}
              maxLength={4000}
              className="field"
              placeholder="Steps, service provider, supplies, or anything else to remember"
            />
          </div>
          <SubmitButton>Add schedule</SubmitButton>
        </form>
      </section>
    </div>
  );
}

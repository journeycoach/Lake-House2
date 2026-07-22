import type { Metadata } from "next";
import { addDays, fmtDay, todayISO } from "@/lib/dates";
import { maintenanceItems } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { addSchedule, updateDue, removeSchedule } from "./actions";

export const metadata: Metadata = { title: "Maintenance · The Lakehouse" };

export default async function MaintenancePage() {
  const items = await maintenanceItems();
  const today = todayISO();
  const soon = addDays(today, 14);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Maintenance" />

      <section className="card p-6">
        <p className="section-label">Preventive care</p>
        <h2 className="font-display text-2xl mt-1 mb-4">
          Keep recurring work from being forgotten
        </h2>
        <form action={addSchedule} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="task" className="flabel">
                Task
              </label>
              <input id="task" name="task" required className="field" placeholder="Clean gutters" />
            </div>
            <div>
              <label htmlFor="cadence" className="flabel">
                How often
              </label>
              <input id="cadence" name="cadence" className="field" placeholder="Every spring and fall" />
            </div>
            <div>
              <label htmlFor="nextDue" className="flabel">
                Next due
              </label>
              <input id="nextDue" name="nextDue" type="date" className="field" />
            </div>
            <div>
              <label htmlFor="assignedTo" className="flabel">
                Assigned to
              </label>
              <input id="assignedTo" name="assignedTo" className="field" placeholder="Unassigned" />
            </div>
          </div>
          <div>
            <label htmlFor="details" className="flabel">
              Details
            </label>
            <textarea
              id="details"
              name="details"
              rows={2}
              className="field"
              placeholder="Steps, service provider, supplies, or anything else to remember"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Add schedule
          </button>
        </form>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
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
                <form action={removeSchedule}>
                  <input type="hidden" name="id" value={m.id} />
                  <button
                    type="submit"
                    className="text-xs font-medium text-ink-faint hover:text-rust"
                  >
                    Remove
                  </button>
                </form>
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
                className="mt-3 flex items-center gap-2 border-t border-sand-line pt-3"
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
    </div>
  );
}

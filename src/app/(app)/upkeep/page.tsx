import type { Metadata } from "next";
import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { addDays, fmtDay, todayISO } from "@/lib/dates";
import { maintenanceItems, openFixit } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { setFixitStatus, removeFixit, updateFixit } from "./fixit-actions";
import { CollapsibleEditForm } from "@/components/collapsible-edit-form";
import {
  addSchedule,
  updateMaintenance,
  removeSchedule,
} from "./maintenance-actions";
import { EquipmentSection } from "./equipment-section";
import { ReportIssueForm } from "./report-issue-form";

export const metadata: Metadata = { title: "Fix It List · Paine Pointe" };

function Chevron({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 transition-transform group-open:rotate-180 ${className}`}
    >
      <path d="m3 5 4 4 4-4" />
    </svg>
  );
}

/* One page for taking care of the house: what is broken now, then the
   recurring work that keeps things from breaking. */
export default async function UpkeepPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; report?: string }>;
}) {
  const params = await searchParams;
  const activeTab = params.tab === "maintenance" ? "maintenance" : "fixit";
  const shouldOpenReport = activeTab === "fixit" && params.report === "open";
  const user = await requireUser();
  const editor = canEdit(user.effectiveRole);
  const [open, done, items, equipment, serviceRecords] = await Promise.all([
    openFixit(),
    getDb()
      .select()
      .from(schema.fixit)
      .where(eq(schema.fixit.status, "done"))
      .orderBy(desc(schema.fixit.id)),
    maintenanceItems(),
    getDb().select().from(schema.equipment).orderBy(asc(schema.equipment.name)),
    getDb()
      .select()
      .from(schema.serviceRecords)
      .orderBy(desc(schema.serviceRecords.servicedOn), desc(schema.serviceRecords.id)),
  ]);
  const equipmentById = new Map(equipment.map((item) => [item.id, item]));
  const today = todayISO();
  const soon = addDays(today, 14);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Fix It List" />

      <nav
        aria-label="Fix It List sections"
        className="mb-6 flex gap-1 rounded-lh border border-sand-line bg-white/60 p-1"
      >
        <Link
          href="/upkeep?tab=fixit"
          aria-current={activeTab === "fixit" ? "page" : undefined}
          className={`flex-1 rounded-[8px] px-4 py-3 text-center text-sm font-semibold transition-colors ${
            activeTab === "fixit"
              ? "bg-deep text-white shadow-sm"
              : "text-ink-soft hover:bg-white hover:text-ink"
          }`}
        >
          Fix It Now
        </Link>
        <Link
          href="/upkeep?tab=maintenance"
          aria-current={activeTab === "maintenance" ? "page" : undefined}
          className={`flex-1 rounded-[8px] px-4 py-3 text-center text-sm font-semibold transition-colors ${
            activeTab === "maintenance"
              ? "bg-deep text-white shadow-sm"
              : "text-ink-soft hover:bg-white hover:text-ink"
          }`}
        >
          Reoccurring Maintenance
        </Link>
      </nav>

      {activeTab === "fixit" ? (
        <>

      {/* Report an issue */}
      <details
        id="report-an-issue"
        open={shouldOpenReport}
        className={`group mb-6 scroll-mt-6 rounded-lh border border-water/30 border-l-4 bg-water-tint ${
          editor ? "" : "hidden"
        }`}
      >
        <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-4 rounded-lh p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-water [&::-webkit-details-marker]:hidden">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lh bg-water text-white"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 2.5 16 15H2L9 2.5Z" />
                <path d="M9 6.5v4M9 13h.01" />
              </svg>
            </span>
            <div>
              <p className="section-label text-water">Report an issue</p>
              <h2 className="font-display mt-0.5 text-xl">What needs fixing</h2>
            </div>
          </div>
          <span className="flex items-center gap-2 text-sm font-semibold text-water">
            Report an Issue
            <svg
              aria-hidden
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform group-open:rotate-180"
            >
              <path d="m3 5 4 4 4-4" />
            </svg>
          </span>
        </summary>
        <div className="mx-4 mb-4 hidden border-t border-sand-line pt-4 group-open:block">
          <ReportIssueForm />
        </div>
      </details>

      {/* Fix-it list */}
      <section className="card p-4 sm:p-6">
        <p className="section-label">Fix-it list</p>
        <h2 className="font-display text-2xl mt-1">Keep the place cared for</h2>
        <ul className="mt-4">
          {open.map((f) => {
            const summary = (
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{f.title}</p>
                {f.details ? (
                  <p className="text-sm text-ink-soft">{f.details}</p>
                ) : null}
                <p className="text-xs text-ink-faint">
                  {f.location}
                  {f.assignedTo ? ` · Assigned to ${f.assignedTo}` : " · Unassigned"}
                  {f.reportedBy ? ` · Reported by ${f.reportedBy}` : ""}
                </p>
              </div>
            );
            return (
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
                {f.photoUrl ? (
                  <a
                    href={f.photoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={f.photoUrl}
                      alt={`Reported issue: ${f.title}`}
                      loading="lazy"
                      className="h-16 w-20 rounded-lh object-cover"
                    />
                  </a>
                ) : null}
                {editor ? (
                  <details className="group min-w-0 flex-1">
                    <summary className="flex min-w-0 cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
                      {summary}
                      <span className={`chip chip-${f.priority} shrink-0`}>
                        {f.priority}
                      </span>
                      <Chevron />
                    </summary>
                    <CollapsibleEditForm
                      action={updateFixit}
                      className="mt-3 grid gap-3 rounded-lh border border-sand-line bg-mist/40 p-3 sm:grid-cols-2"
                    >
                      <input type="hidden" name="id" value={f.id} />
                      <label className="min-w-0">
                        <span className="mb-1 block text-xs font-semibold text-ink-soft">
                          What is broken
                        </span>
                        <input
                          name="title"
                          required
                          maxLength={200}
                          defaultValue={f.title}
                          className="field"
                        />
                      </label>
                      <label className="min-w-0">
                        <span className="mb-1 block text-xs font-semibold text-ink-soft">
                          Where
                        </span>
                        <input
                          name="location"
                          maxLength={200}
                          defaultValue={f.location ?? ""}
                          className="field"
                        />
                      </label>
                      <label className="min-w-0">
                        <span className="mb-1 block text-xs font-semibold text-ink-soft">
                          How urgent
                        </span>
                        <select
                          name="priority"
                          defaultValue={f.priority}
                          className="field"
                        >
                          <option value="urgent">Urgent</option>
                          <option value="soon">Soon</option>
                          <option value="whenever">Whenever</option>
                        </select>
                      </label>
                      <label className="min-w-0">
                        <span className="mb-1 block text-xs font-semibold text-ink-soft">
                          Who is on it
                        </span>
                        <input
                          name="assignedTo"
                          maxLength={200}
                          defaultValue={f.assignedTo ?? ""}
                          className="field"
                          placeholder="Unassigned"
                        />
                      </label>
                      <label className="min-w-0 sm:col-span-2">
                        <span className="mb-1 block text-xs font-semibold text-ink-soft">
                          Details
                        </span>
                        <textarea
                          name="details"
                          rows={2}
                          maxLength={4000}
                          defaultValue={f.details ?? ""}
                          className="field"
                        />
                      </label>
                      <div className="sm:col-span-2">
                        <SubmitButton className="btn btn-primary">
                          Save changes
                        </SubmitButton>
                      </div>
                    </CollapsibleEditForm>
                  </details>
                ) : (
                  <>
                    {summary}
                    <span className={`chip chip-${f.priority} shrink-0`}>
                      {f.priority}
                    </span>
                  </>
                )}
              </li>
            );
          })}
          {open.length === 0 ? (
            <li className="py-4 text-sm text-ink-soft">
              Nothing needs attention. The house thanks you.
            </li>
          ) : null}
        </ul>
      </section>

      {done.length > 0 ? (
        <section className="card mt-4 p-4 sm:mt-6 sm:p-6">
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

        </>
      ) : (
        <>
      {/* Maintenance schedules */}
      <section>
        <details
          className={`group mb-6 rounded-lh border border-water/30 border-l-4 bg-water-tint ${
            editor ? "" : "hidden"
          }`}
        >
          <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-4 rounded-lh p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-water [&::-webkit-details-marker]:hidden">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lh bg-water text-white"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 18 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2.5" y="3.5" width="13" height="12" rx="1.5" />
                  <path d="M5.5 2v3M12.5 2v3M2.5 7h13M9 9v4M7 11h4" />
                </svg>
              </span>
              <div>
                <p className="section-label text-water">Add a maintenance item</p>
                <h2 className="font-display mt-0.5 text-xl">Put it on a schedule</h2>
              </div>
            </div>
            <span className="flex items-center gap-2 text-sm font-semibold text-water">
              Add Maintenance
              <svg
                aria-hidden
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-open:rotate-180"
              >
                <path d="m3 5 4 4 4-4" />
              </svg>
            </span>
          </summary>
          <div className="mx-4 mb-4 hidden border-t border-sand-line pt-4 group-open:block">
            <form action={addSchedule} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
                <div>
                  <label htmlFor="equipmentId" className="flabel">
                    Equipment
                  </label>
                  <select id="equipmentId" name="equipmentId" className="field" defaultValue="">
                    <option value="">General house task</option>
                    {equipment.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
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
          </div>
        </details>

        <p className="section-label text-care">Preventive care</p>
        <h2 className="font-display text-2xl mt-1">
          Keep recurring work from being forgotten
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {items.map((m) => {
            const overdue = m.nextDue && m.nextDue < today;
            const dueSoon = m.nextDue && !overdue && m.nextDue <= soon;
            const summary = (
              <>
                <h3 className="font-display text-xl">
                  {m.nextDue ? fmtDay(m.nextDue) : "No date"}
                  <span className="ml-2 align-middle text-[11px] font-sans font-semibold uppercase tracking-wider text-ink-faint">
                    next due
                  </span>
                </h3>
                <p className="mt-1 font-semibold">{m.task}</p>
                {m.equipmentId && equipmentById.get(m.equipmentId) ? (
                  <p className="mt-1 text-xs font-semibold text-water">
                    {equipmentById.get(m.equipmentId)!.name}
                  </p>
                ) : null}
                {m.details ? (
                  <p className="mt-1 text-sm text-ink-soft">{m.details}</p>
                ) : null}
                <p className="mt-2 text-xs text-ink-faint">
                  {m.cadence ?? "No cadence"} · {m.assignedTo ? `Assigned to ${m.assignedTo}` : "Unassigned"}
                </p>
              </>
            );
            return (
              <article
                key={m.id}
                id={`maintenance-${m.id}`}
                className="card flex scroll-mt-6 flex-col p-4 sm:p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`chip ${overdue ? "chip-urgent" : dueSoon ? "chip-soon" : "chip-whenever"}`}
                  >
                    {overdue ? "Overdue" : dueSoon ? "Due soon" : "Upcoming"}
                  </span>
                  {editor ? (
                    <>
                    <details className="relative sm:hidden">
                      <summary
                        aria-label={`Actions for ${m.task}`}
                        className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-md border border-sand-line bg-white text-lg font-bold tracking-widest text-water [&::-webkit-details-marker]:hidden"
                      >
                        ⋯
                      </summary>
                      <div className="absolute right-0 top-12 z-30 w-64 rounded-lh border border-sand-line bg-white p-3 shadow-lg">
                        <form action={removeSchedule}>
                          <input type="hidden" name="id" value={m.id} />
                          <button
                            type="submit"
                            className="flex min-h-11 w-full items-center rounded-md px-3 text-left text-sm font-semibold text-rust hover:bg-rust/5"
                          >
                            Remove maintenance item
                          </button>
                        </form>
                      </div>
                    </details>
                    <form action={removeSchedule} className="hidden sm:block">
                      <input type="hidden" name="id" value={m.id} />
                      <button
                        type="submit"
                        className="inline-flex min-h-11 items-center text-xs font-medium text-ink-faint hover:text-rust"
                      >
                        Remove
                      </button>
                    </form>
                    </>
                  ) : null}
                </div>
                {editor ? (
                  <details className="group mt-3 flex-1">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-2 [&::-webkit-details-marker]:hidden">
                      <span className="min-w-0 flex-1">{summary}</span>
                      <Chevron className="mt-1" />
                    </summary>
                    <CollapsibleEditForm
                      action={updateMaintenance}
                      className="mt-3 grid gap-3 border-t border-sand-line pt-3 sm:grid-cols-2"
                    >
                      <input type="hidden" name="id" value={m.id} />
                      <label className="min-w-0">
                        <span className="mb-1 block text-xs font-semibold text-ink-soft">
                          Task
                        </span>
                        <input
                          name="task"
                          required
                          maxLength={200}
                          defaultValue={m.task}
                          className="field"
                        />
                      </label>
                      <label className="min-w-0">
                        <span className="mb-1 block text-xs font-semibold text-ink-soft">
                          How often
                        </span>
                        <input
                          name="cadence"
                          maxLength={200}
                          defaultValue={m.cadence ?? ""}
                          className="field"
                        />
                      </label>
                      <label className="min-w-0">
                        <span className="mb-1 block text-xs font-semibold text-ink-soft">
                          Next due
                        </span>
                        <input
                          type="date"
                          name="nextDue"
                          defaultValue={m.nextDue ?? ""}
                          className="field"
                        />
                      </label>
                      <label className="min-w-0">
                        <span className="mb-1 block text-xs font-semibold text-ink-soft">
                          Assigned to
                        </span>
                        <input
                          name="assignedTo"
                          maxLength={200}
                          defaultValue={m.assignedTo ?? ""}
                          className="field"
                          placeholder="Unassigned"
                        />
                      </label>
                      <label className="min-w-0 sm:col-span-2">
                        <span className="mb-1 block text-xs font-semibold text-ink-soft">
                          Equipment
                        </span>
                        <select
                          name="equipmentId"
                          defaultValue={m.equipmentId ?? ""}
                          className="field"
                        >
                          <option value="">General house task</option>
                          {equipment.map((eq2) => (
                            <option key={eq2.id} value={eq2.id}>
                              {eq2.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="min-w-0 sm:col-span-2">
                        <span className="mb-1 block text-xs font-semibold text-ink-soft">
                          Details
                        </span>
                        <textarea
                          name="details"
                          rows={2}
                          maxLength={4000}
                          defaultValue={m.details ?? ""}
                          className="field"
                        />
                      </label>
                      <div className="sm:col-span-2">
                        <SubmitButton className="btn btn-primary">
                          Save changes
                        </SubmitButton>
                      </div>
                    </CollapsibleEditForm>
                  </details>
                ) : (
                  <div className="mt-3 flex-1">{summary}</div>
                )}
              </article>
            );
          })}
          {items.length === 0 ? (
            <p className="text-sm text-ink-soft">No schedules yet.</p>
          ) : null}
        </div>
      </section>

      <EquipmentSection
        equipment={equipment}
        records={serviceRecords}
        editor={editor}
      />
        </>
      )}
    </div>
  );
}

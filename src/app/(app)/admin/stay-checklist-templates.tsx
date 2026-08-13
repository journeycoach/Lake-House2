import {
  addStayChecklistTemplate,
  moveStayChecklistTemplate,
  removeStayChecklistTemplate,
  updateStayChecklistTemplate,
} from "../calendar/stay-checklist-actions";

type Template = {
  id: number;
  phase: string;
  title: string;
  position: number;
};

export function StayChecklistTemplates({ templates }: { templates: Template[] }) {
  return (
    <section id="stay-checklist-templates" className="card mb-6 scroll-mt-4 p-6">
      <p className="section-label">Stay checklist templates</p>
      <h2 className="font-display mt-1 text-2xl">Check In and Check Out</h2>
      <p className="mt-1 text-sm text-ink-soft">
        These steps are copied into each new reservation. Editing them will not change existing or past visit records.
      </p>
      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        {[
          { phase: "checkin", label: "Check In" },
          { phase: "checkout", label: "Check Out" },
        ].map((group) => {
          const items = templates.filter((template) => template.phase === group.phase);
          return (
            <div key={group.phase} className="rounded-lh border border-sand-line p-4">
              <h3 className="font-semibold">{group.label} template</h3>
              <ul className="mt-2 divide-y divide-sand-line">
                {items.map((template, index) => (
                  <li key={template.id} className="py-3">
                    <form action={updateStayChecklistTemplate} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={template.id} />
                      <input
                        name="title"
                        required
                        maxLength={200}
                        defaultValue={template.title}
                        aria-label={`${group.label} task`}
                        className="field min-w-0 flex-1 py-2 text-sm"
                      />
                      <button type="submit" className="btn btn-quiet shrink-0 py-2">Save</button>
                    </form>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1">
                        <form action={moveStayChecklistTemplate}>
                          <input type="hidden" name="id" value={template.id} />
                          <input type="hidden" name="direction" value="up" />
                          <button
                            type="submit"
                            disabled={index === 0}
                            aria-label={`Move ${template.title} up`}
                            className="btn btn-quiet px-3 py-2 disabled:opacity-30"
                          >
                            ↑
                          </button>
                        </form>
                        <form action={moveStayChecklistTemplate}>
                          <input type="hidden" name="id" value={template.id} />
                          <input type="hidden" name="direction" value="down" />
                          <button
                            type="submit"
                            disabled={index === items.length - 1}
                            aria-label={`Move ${template.title} down`}
                            className="btn btn-quiet px-3 py-2 disabled:opacity-30"
                          >
                            ↓
                          </button>
                        </form>
                      </div>
                      <form action={removeStayChecklistTemplate}>
                        <input type="hidden" name="id" value={template.id} />
                        <button type="submit" className="text-xs font-medium text-ink-faint hover:text-rust">
                          Remove from future stays
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
                {items.length === 0 ? (
                  <li className="py-3 text-sm text-ink-soft">No steps yet.</li>
                ) : null}
              </ul>
              <form action={addStayChecklistTemplate} className="mt-3 flex gap-2 border-t border-sand-line pt-3">
                <input type="hidden" name="phase" value={group.phase} />
                <input
                  name="title"
                  required
                  maxLength={200}
                  className="field min-w-0 flex-1 py-2 text-sm"
                  placeholder={`Add a ${group.label.toLowerCase()} task`}
                />
                <button type="submit" className="btn btn-primary shrink-0 py-2">Add</button>
              </form>
            </div>
          );
        })}
      </div>
    </section>
  );
}

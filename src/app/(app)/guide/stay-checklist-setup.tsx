import {
  addStayChecklistTemplate,
  removeStayChecklistTemplate,
} from "../calendar/stay-checklist-actions";

type Template = {
  id: number;
  phase: string;
  title: string;
};

export function StayChecklistSetup({ templates }: { templates: Template[] }) {
  return (
    <section id="stay-checklist-setup" className="card mt-4 scroll-mt-4 p-6">
      <p className="section-label">Stay checklist setup</p>
      <h2 className="font-display mt-1 text-2xl">Steps for every reservation</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Edit the arrival and departure steps that reset for every stay.
      </p>
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        {[
          { phase: "checkin", label: "Check in" },
          { phase: "checkout", label: "Check out" },
        ].map((group) => (
          <div key={group.phase}>
            <h3 className="font-semibold">{group.label}</h3>
            <ul className="mt-2">
              {templates
                .filter((template) => template.phase === group.phase)
                .map((template) => (
                  <li
                    key={template.id}
                    className="flex items-center gap-3 border-t border-sand-line py-2 first:border-0"
                  >
                    <span className="min-w-0 flex-1 text-sm">
                      {template.title}
                    </span>
                    <form action={removeStayChecklistTemplate}>
                      <input type="hidden" name="id" value={template.id} />
                      <button
                        type="submit"
                        className="text-xs text-ink-faint hover:text-rust"
                      >
                        Remove
                      </button>
                    </form>
                  </li>
                ))}
            </ul>
            <form action={addStayChecklistTemplate} className="mt-3 flex gap-2">
              <input type="hidden" name="phase" value={group.phase} />
              <input
                name="title"
                required
                maxLength={200}
                className="field flex-1 py-2"
                placeholder={`Add a ${group.label.toLowerCase()} step`}
              />
              <button type="submit" className="btn btn-quiet shrink-0 py-2">
                Add
              </button>
            </form>
          </div>
        ))}
      </div>
    </section>
  );
}

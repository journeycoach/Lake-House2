import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { checklistItems } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { addItem, toggleItem, removeItem, moveItem } from "./actions";

export const metadata: Metadata = { title: "Checklist · The Lakehouse" };

export default async function ChecklistPage() {
  const user = await requireUser();
  const editor = canEdit(user.effectiveRole);
  const items = await checklistItems();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Checklist" />

      <section className="card p-6">
        <p className="section-label">Shared checklist</p>
        <h2 className="font-display text-2xl mt-1">Before the next trip</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Everyone can add items, check them off, and change their order.
        </p>

        <form
          action={addItem}
          className={`mt-4 flex-col gap-3 sm:flex-row ${editor ? "flex" : "hidden"}`}
        >
          <input
            name="title"
            required
            className="field sm:flex-1"
            placeholder="What do we need to bring, buy, or do?"
          />
          <input
            name="details"
            className="field sm:w-56"
            placeholder="Quantity, brand, location"
          />
          <button type="submit" className="btn btn-primary shrink-0">
            Add to list
          </button>
        </form>

        <ul className="mt-4">
          {items.map((item, i) => (
            <li
              key={item.id}
              className="flex items-center gap-3 border-t border-sand-line py-3 first:border-0"
            >
              {editor ? (
                <form action={toggleItem} className="shrink-0">
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    aria-label={`Mark "${item.title}" ${item.done ? "not done" : "done"}`}
                    className={`flex h-5 w-5 items-center justify-center rounded-[4px] border ${
                      item.done
                        ? "border-sage bg-sage text-white"
                        : "border-sand-line hover:border-water"
                    }`}
                  >
                    {item.done ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1.5 5.5L4 8l4.5-6" />
                      </svg>
                    ) : null}
                  </button>
                </form>
              ) : (
                <span
                  aria-hidden
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border ${
                    item.done
                      ? "border-sage bg-sage text-white"
                      : "border-sand-line"
                  }`}
                >
                  {item.done ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1.5 5.5L4 8l4.5-6" />
                    </svg>
                  ) : null}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p
                  className={`font-semibold ${item.done ? "text-ink-faint line-through" : ""}`}
                >
                  {item.title}
                </p>
                {item.details ? (
                  <p className="text-sm text-ink-soft">{item.details}</p>
                ) : null}
                <p className="text-xs text-ink-faint">Added by {item.addedBy}</p>
              </div>
              <div
                className={`shrink-0 items-center gap-2 ${editor ? "flex" : "hidden"}`}
              >
                <form action={moveItem}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="dir" value="up" />
                  <button
                    type="submit"
                    disabled={i === 0}
                    aria-label={`Move "${item.title}" up`}
                    className="btn btn-quiet h-8 w-8 p-0 disabled:opacity-30"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 10V2M2.5 5.5L6 2l3.5 3.5" />
                    </svg>
                  </button>
                </form>
                <form action={moveItem}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="dir" value="down" />
                  <button
                    type="submit"
                    disabled={i === items.length - 1}
                    aria-label={`Move "${item.title}" down`}
                    className="btn btn-quiet h-8 w-8 p-0 disabled:opacity-30"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2v8M2.5 6.5L6 10l3.5-3.5" />
                    </svg>
                  </button>
                </form>
                <form action={removeItem}>
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    type="submit"
                    className="text-xs font-medium text-ink-faint hover:text-rust"
                  >
                    Remove
                  </button>
                </form>
              </div>
            </li>
          ))}
          {items.length === 0 ? (
            <li className="py-4 text-sm text-ink-soft">List is empty.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}

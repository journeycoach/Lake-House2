import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { checklistItems } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { addItem, toggleItem, removeItem, moveItem } from "./actions";

export const metadata: Metadata = { title: "Checklist · The Lakehouse" };

export default async function ChecklistPage() {
  const user = await requireUser();
  const editor = canEdit(user.effectiveRole);
  const items = await checklistItems();
  const openItems = items.filter((item) => !item.done);
  const completedItems = items.filter((item) => item.done);

  function itemRows(rows: typeof items) {
    return rows.map((item, i) => (
      <li
        key={item.id}
        className="flex flex-wrap items-center gap-3 border-t border-sand-line py-3 first:border-0"
      >
        <span
          aria-hidden
          className="w-5 shrink-0 text-center text-xs font-semibold text-ink-faint"
        >
          {i + 1}
        </span>
        <form action={toggleItem} className="shrink-0">
          <input type="hidden" name="id" value={item.id} />
          <button
            type="submit"
            aria-label={`Mark "${item.title}" ${item.done ? "not done" : "done"}`}
            aria-pressed={Boolean(item.done)}
            className={`flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
              item.done
                ? "border-sage bg-sage text-white hover:bg-deep"
                : "border-sand-line bg-white hover:border-water hover:bg-mist"
            }`}
          >
            {item.done ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 10 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1.5 5.5L4 8l4.5-6" />
              </svg>
            ) : null}
          </button>
        </form>
        <div className="min-w-0 flex-1 basis-48">
          <p
            className={`font-semibold ${item.done ? "text-ink-faint line-through" : ""}`}
          >
            {item.title}
          </p>
          {item.details ? (
            <p
              className={`text-sm ${
                item.done ? "text-ink-faint line-through" : "text-ink-soft"
              }`}
            >
              {item.details}
            </p>
          ) : null}
          <p className="text-xs text-ink-faint">Added by {item.addedBy}</p>
        </div>
        <div
          className={`w-full items-center justify-end gap-2 sm:w-auto ${
            editor ? "flex" : "hidden"
          }`}
        >
          <form action={moveItem}>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="dir" value="up" />
            <button
              type="submit"
              disabled={i === 0}
              aria-label={`Move "${item.title}" up`}
              className="rounded-md border border-sand-line px-2 py-1 text-xs font-semibold text-water transition hover:border-water disabled:cursor-default disabled:opacity-30"
            >
              Move up
            </button>
          </form>
          <form action={moveItem}>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="dir" value="down" />
            <button
              type="submit"
              disabled={i === rows.length - 1}
              aria-label={`Move "${item.title}" down`}
              className="rounded-md border border-sand-line px-2 py-1 text-xs font-semibold text-water transition hover:border-water disabled:cursor-default disabled:opacity-30"
            >
              Move down
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
    ));
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Checklist" />

      <section className="card p-6">
        <p className="section-label">Shared checklist</p>
        <h2 className="font-display text-2xl mt-1">Before the next trip</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Everyone can check items off. Household members and admins can add,
          remove, and reorder them.
        </p>

        <form
          action={addItem}
          className={`mt-4 gap-3 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)_auto] ${
            editor ? "grid" : "hidden"
          }`}
        >
          <label className="min-w-0">
            <span className="mb-1 block text-xs font-semibold text-ink-soft">
              Item
            </span>
            <input
              name="title"
              required
              maxLength={200}
              className="field"
              placeholder="Paper towels"
            />
          </label>
          <label className="min-w-0">
            <span className="mb-1 block text-xs font-semibold text-ink-soft">
              Details
            </span>
            <input
              name="details"
              maxLength={4000}
              className="field"
              placeholder="Quantity, brand, or location"
            />
          </label>
          <SubmitButton className="btn btn-primary self-end whitespace-nowrap">
            Add to list
          </SubmitButton>
        </form>

        <ul className="mt-4">
          {itemRows(openItems)}
          {openItems.length === 0 ? (
            <li className="py-4 text-sm text-ink-soft">
              {items.length === 0
                ? "List is empty."
                : "Everything is checked off."}
            </li>
          ) : null}
        </ul>

        {completedItems.length > 0 ? (
          <div className="mt-6 border-t border-sand-line pt-5">
            <p className="section-label">Completed ({completedItems.length})</p>
            <ul className="mt-2">{itemRows(completedItems)}</ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { checklistItems } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { AddItemForm } from "./add-item-form";
import { EditableChecklistItem } from "./edit-item";
import { CheckoffButton } from "@/components/checkoff-button";
import { toggleItem } from "./actions";
import { getDb, schema } from "@/lib/db";
import { asc } from "drizzle-orm";

export const metadata: Metadata = { title: "Shopping List · Paine Pointe" };

export default async function ChecklistPage() {
  const user = await requireUser();
  const editor = canEdit(user.effectiveRole);
  const items = await checklistItems();
  const assignees = (await getDb()
    .select({ name: schema.users.name })
    .from(schema.users)
    .orderBy(asc(schema.users.name)))
    .map((row) => row.name)
    .filter((name, index, names) => names.indexOf(name) === index);
  const openItems = items.filter((item) => !item.done);
  const completedItems = items.filter((item) => item.done);

  function itemRows(rows: typeof items) {
    return rows.map((item, i) => {
      return (
      <li
        key={item.id}
        className="flex flex-wrap items-center gap-1.5 border-t border-sand-line py-1.5 sm:gap-3 sm:py-3 first:border-0"
      >
        <span
          aria-hidden
          className="w-5 shrink-0 text-center text-xs font-semibold text-ink-faint"
        >
          {i + 1}
        </span>
        <CheckoffButton
          id={item.id}
          done={Boolean(item.done)}
          label={`Mark "${item.title}" ${item.done ? "not done" : "done"}`}
          action={toggleItem}
        />
        {editor ? (
              <EditableChecklistItem
                item={item}
                assignees={assignees}
                currentUser={user.name}
              />
        ) : (
          <div className="min-w-0 flex-1 basis-48">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <p
                className={`font-semibold ${item.done ? "text-ink-faint line-through" : ""}`}
              >
                {item.title}
              </p>
              {item.assignedTo ? (
                <span className="text-xs font-medium text-ink-soft">
                  Assigned to{" "}
                  <span
                    className={
                      item.assignedTo.trim().toLowerCase() ===
                      user.name.trim().toLowerCase()
                        ? "font-semibold text-care"
                        : undefined
                    }
                  >
                    {item.assignedTo}
                  </span>
                </span>
              ) : null}
              {item.done ? (
                <span className="hidden text-xs text-ink-faint sm:inline">
                  Checked by {item.checkedBy ?? "Unknown"}
                </span>
              ) : null}
            </div>
            {item.details || item.addedBy ? (
              <p className="text-sm text-ink-soft">
                {item.details ? (
                  <>
                    <span className={item.done ? "text-ink-faint line-through" : ""}>
                      {item.details}
                    </span>
                    {" · "}
                  </>
                ) : null}
                <span className="text-xs text-ink-faint">
                  {item.done
                    ? `Checked by ${item.checkedBy ?? "Unknown"}`
                    : `Added by ${item.addedBy}`}
                </span>
              </p>
            ) : null}
          </div>
        )}
      </li>
      );
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Shopping List" />

      <section className="card p-3 sm:p-6">
        <h2 className="font-display text-2xl">
          Pickup before the next trip
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Check items off when you get them.
        </p>

        <AddItemForm editor={editor} assignees={assignees} />

        <ul className="mt-2 sm:mt-4">
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
          <div className="mt-4 border-t border-sand-line pt-3 sm:mt-6 sm:pt-5">
            <p className="section-label">Completed ({completedItems.length})</p>
            <ul className="mt-1.5 sm:mt-2">{itemRows(completedItems)}</ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { checklistItems } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { AddItemForm } from "./add-item-form";
import { ShoppingListItemRow } from "./item-row";
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
  // Logged-in user's own items first; date added (the existing position/id
  // order from checklistItems) is preserved within each group via a stable sort.
  const currentUserName = user.name.trim().toLowerCase();
  const isMine = (name: string | null | undefined) =>
    !!name && name.trim().toLowerCase() === currentUserName;
  const byMineThenAdded = (rows: typeof items) =>
    [...rows].sort(
      (a, b) => (isMine(a.assignedTo) ? 0 : 1) - (isMine(b.assignedTo) ? 0 : 1)
    );
  const openItems = byMineThenAdded(items.filter((item) => !item.done));
  const completedItems = byMineThenAdded(items.filter((item) => item.done));

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
          {openItems.map((item, index) => (
            <ShoppingListItemRow
              key={item.id}
              item={item}
              index={index}
              editor={editor}
              assignees={assignees}
              currentUser={user.name}
            />
          ))}
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
            <ul className="mt-1.5 sm:mt-2">
              {completedItems.map((item, index) => (
                <ShoppingListItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  editor={editor}
                  assignees={assignees}
                  currentUser={user.name}
                />
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}

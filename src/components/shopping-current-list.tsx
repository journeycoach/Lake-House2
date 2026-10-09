"use client";

import { useState } from "react";
import { CheckoffButton } from "./checkoff-button";

export type CurrentShoppingItem = {
  id: number;
  title: string;
  details: string | null;
  assignedTo: string | null;
  addedBy: string;
};

/* The "Current" shopping list on the home page. Checking an item off here
   doesn't remove it from view: the list is captured once when the page
   loads, so toggling an item just marks it checked in place (checkbox
   fills in, text gets a strikethrough) instead of the row vanishing the
   moment the server re-renders. The list only actually drops checked
   items the next time the page itself is reloaded or navigated to. */
export function ShoppingCurrentList({
  items,
  currentUserName,
  action,
}: {
  items: CurrentShoppingItem[];
  currentUserName: string;
  action: (formData: FormData) => void;
}) {
  const [frozenItems] = useState(items);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());

  const isMine = (name?: string | null) =>
    !!name && name.trim().toLowerCase() === currentUserName.trim().toLowerCase();

  function toggle(id: number) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <ul className="mt-2">
      {frozenItems.map((check) => {
        const checked = checkedIds.has(check.id);
        return (
          <li
            key={check.id}
            className="flex items-start gap-3 border-t border-sand-line py-3 first:border-0 first:pt-0"
          >
            <CheckoffButton
              id={check.id}
              done={checked}
              label={`Mark "${check.title}" ${checked ? "not done" : "done"}`}
              action={action}
              onToggle={() => toggle(check.id)}
            />
            <div className="min-w-0 flex-1">
              <p
                className={`font-semibold ${checked ? "text-ink-faint line-through" : ""}`}
              >
                {check.title}
              </p>
              {check.details ? (
                <p
                  className={`text-sm ${checked ? "text-ink-faint line-through" : "text-ink-soft"}`}
                >
                  {check.details}
                </p>
              ) : null}
              <p className="text-xs font-medium text-water">
                {check.assignedTo ? (
                  <>
                    Assigned to{" "}
                    <span
                      className={
                        isMine(check.assignedTo) ? "font-semibold text-care" : undefined
                      }
                    >
                      {check.assignedTo}
                    </span>
                  </>
                ) : (
                  `Added by ${check.addedBy}`
                )}
              </p>
            </div>
          </li>
        );
      })}
      {frozenItems.length === 0 ? (
        <li className="text-sm text-ink-soft">Everything is checked off.</li>
      ) : null}
    </ul>
  );
}

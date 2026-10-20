"use client";

import { useState } from "react";
import { CheckoffButton } from "@/components/checkoff-button";
import { EditableChecklistItem } from "./edit-item";
import { toggleItem } from "./actions";

type ChecklistItem = {
  id: number;
  title: string;
  details: string | null;
  assignedTo: string | null;
  done: number;
  checkedBy: string | null;
  addedBy: string;
};

export function ShoppingListItemRow({
  item,
  index,
  editor,
  assignees,
  currentUser,
}: {
  item: ChecklistItem;
  index: number;
  editor: boolean;
  assignees: string[];
  currentUser: string;
}) {
  const [checked, setChecked] = useState(Boolean(item.done));
  const displayItem = {
    ...item,
    done: Number(checked),
    checkedBy: checked ? item.checkedBy ?? currentUser : null,
  };

  return (
    <li className="flex flex-wrap items-center gap-1.5 border-t border-sand-line py-1.5 first:border-0 sm:gap-3 sm:py-3">
      <span
        aria-hidden="true"
        className="w-5 shrink-0 text-center text-xs font-semibold text-ink-faint"
      >
        {index + 1}
      </span>
      <CheckoffButton
        id={item.id}
        done={checked}
        label={`Mark "${item.title}" ${checked ? "not done" : "done"}`}
        action={toggleItem}
        onToggle={() => setChecked((value) => !value)}
      />
      {editor ? (
        <EditableChecklistItem
          item={displayItem}
          assignees={assignees}
          currentUser={currentUser}
        />
      ) : (
        <div className="min-w-0 flex-1 basis-48">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p
              className={`font-semibold ${checked ? "text-ink-faint line-through" : ""}`}
            >
              {item.title}
            </p>
            {item.assignedTo ? (
              <span className="text-xs font-medium text-ink-soft">
                Assigned to{" "}
                <span
                  className={
                    item.assignedTo.trim().toLowerCase() ===
                    currentUser.trim().toLowerCase()
                      ? "font-semibold text-care"
                      : undefined
                  }
                >
                  {item.assignedTo}
                </span>
              </span>
            ) : null}
            {checked ? (
              <span className="hidden text-xs text-ink-faint sm:inline">
                Checked by {displayItem.checkedBy ?? "Unknown"}
              </span>
            ) : null}
          </div>
          {item.details || item.addedBy ? (
            <p className="text-sm text-ink-soft">
              {item.details ? (
                <>
                  <span className={checked ? "text-ink-faint line-through" : ""}>
                    {item.details}
                  </span>
                  {" · "}
                </>
              ) : null}
              <span className="text-xs text-ink-faint">
                {checked
                  ? `Checked by ${displayItem.checkedBy ?? "Unknown"}`
                  : `Added by ${item.addedBy}`}
              </span>
            </p>
          ) : null}
        </div>
      )}
    </li>
  );
}

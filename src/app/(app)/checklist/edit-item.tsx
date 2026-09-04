"use client";

import { useState, useTransition } from "react";
import { updateItem } from "./actions";

type Item = {
  id: number;
  title: string;
  details: string | null;
  done: number;
  checkedBy: string | null;
  addedBy: string;
};

export function EditableChecklistItem({ item }: { item: Item }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <form
        action={(formData) => {
          startTransition(async () => {
            await updateItem(formData);
            setEditing(false);
          });
        }}
        className="grid w-full gap-3 rounded-lh border border-sand-line bg-mist/40 p-3 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)_auto]"
      >
        <input type="hidden" name="id" value={item.id} />
        <label className="min-w-0">
          <span className="mb-1 block text-xs font-semibold text-ink-soft">
            Item
          </span>
          <input
            name="title"
            required
            maxLength={200}
            defaultValue={item.title}
            className="field"
          />
        </label>
        <label className="min-w-0">
          <span className="mb-1 block text-xs font-semibold text-ink-soft">
            Details
          </span>
          <input
            name="details"
            maxLength={4000}
            defaultValue={item.details ?? ""}
            className="field"
          />
        </label>
        <div className="flex items-end gap-3">
          <button
            type="submit"
            disabled={pending}
            className="btn btn-primary whitespace-nowrap"
          >
            {pending ? "Saving" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="pb-2 text-xs font-medium text-ink-faint hover:text-rust"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="-my-1 min-w-0 flex-1 basis-48 rounded-md py-1 text-left hover:bg-mist/60"
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <p
          className={`font-semibold ${item.done ? "text-ink-faint line-through" : ""}`}
        >
          {item.title}
        </p>
        {item.done ? (
          <span className="text-xs text-ink-faint">
            Checked by {item.checkedBy ?? "Unknown"}
          </span>
        ) : null}
      </div>
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
    </button>
  );
}

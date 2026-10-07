"use client";

import { useActionState, useEffect, useRef } from "react";
import { addItem, type AddItemState } from "./actions";
import { SubmitButton } from "@/components/submit-button";

const initial: AddItemState = {};

function Feedback({ state }: { state: AddItemState }) {
  if (state.error)
    return <p className="text-sm font-medium text-rust">{state.error}</p>;
  if (state.added)
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-3 rounded-lg border border-sage/30 bg-sage/10 p-3 text-sage"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage text-white">
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m3 8 3.2 3.2L13 4.5" />
          </svg>
        </span>
        <span className="min-w-0">
          <span className="block font-semibold">Added to Shopping List</span>
          {state.addedTitle ? (
            <span className="block break-words text-sm">{state.addedTitle}</span>
          ) : null}
        </span>
      </div>
    );
  return null;
}

export function AddItemForm({
  editor,
  assignees,
}: {
  editor: boolean;
  assignees: string[];
}) {
  const [state, action] = useActionState(addItem, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.added) formRef.current?.reset();
  }, [state.added]);

  return (
    <form
      id="add-item"
      ref={formRef}
      action={action}
      className={`mt-2 gap-1.5 rounded-lh border border-water/30 border-l-4 bg-water-tint p-2 sm:mt-2 sm:gap-1.5 sm:p-2 ${
        editor
          ? "grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)_minmax(8rem,1.5fr)_auto]"
          : "hidden"
      }`}
    >
      <label className="min-w-0">
        <span className="mb-0.5 block text-xs font-semibold text-ink-soft">
          Item
        </span>
        <input
          name="title"
          required
          maxLength={200}
          className="field"
          placeholder="Milk, Propane, Napkins, etc..."
        />
      </label>
      <label className="col-span-2 col-start-1 row-start-2 min-w-0 sm:col-span-1 sm:col-start-2 sm:row-start-1">
        <span className="mb-0.5 block text-xs font-semibold text-ink-soft">
          Details
        </span>
        <input
          name="details"
          maxLength={4000}
          className="field"
          placeholder="Quantity, brand, or preferred store"
        />
      </label>
      <label className="col-span-2 col-start-1 row-start-3 min-w-0 sm:col-span-1 sm:col-start-3 sm:row-start-1">
        <span className="mb-0.5 block text-xs font-semibold text-ink-soft">
          Assigned to
        </span>
        <select name="assignedTo" defaultValue="" className="field">
          <option value="">Anyone</option>
          {assignees.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <SubmitButton className="btn btn-primary col-start-2 row-start-1 self-end whitespace-nowrap sm:col-start-4">
        Add to list
      </SubmitButton>
      {(state.error || state.added) ? (
        <div className="col-span-2 col-start-1 row-start-4 sm:col-span-4 sm:row-start-2">
          <Feedback state={state} />
        </div>
      ) : null}
    </form>
  );
}

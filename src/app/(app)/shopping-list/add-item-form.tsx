"use client";

import { useActionState } from "react";
import { addItem, type AddItemState } from "./actions";
import { SubmitButton } from "@/components/submit-button";

const initial: AddItemState = {};

function Feedback({ state }: { state: AddItemState }) {
  if (state.error)
    return <p className="text-sm font-medium text-rust">{state.error}</p>;
  if (state.added)
    return (
      <p aria-live="polite" className="text-sm font-medium text-sage">
        Added.
      </p>
    );
  return null;
}

export function AddItemForm({ editor }: { editor: boolean }) {
  const [state, action] = useActionState(addItem, initial);
  return (
    <form
      action={action}
      className={`mt-2 gap-1.5 rounded-lh border border-water/30 border-l-4 bg-water-tint p-2 sm:mt-2 sm:gap-1.5 sm:p-2 ${
        editor
          ? "grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)_auto]"
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
      <SubmitButton className="btn btn-primary col-start-2 row-start-1 self-end whitespace-nowrap sm:col-start-3">
        Add to list
      </SubmitButton>
      {(state.error || state.added) ? (
        <div className="col-span-2 col-start-1 row-start-3 sm:col-span-3 sm:row-start-2">
          <Feedback state={state} />
        </div>
      ) : null}
    </form>
  );
}

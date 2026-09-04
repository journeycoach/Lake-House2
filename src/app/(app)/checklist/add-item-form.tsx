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
      className={`mt-4 gap-3 rounded-lh border border-water/30 border-l-4 bg-water-tint p-4 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)_auto] ${
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
      <div className="sm:col-span-3">
        <Feedback state={state} />
      </div>
    </form>
  );
}

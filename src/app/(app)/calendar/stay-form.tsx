"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createStay,
  updateStay,
  deleteStay,
  type StayFormState,
} from "./actions";
import { StayChecklist, type StayChecklistEntry } from "./stay-checklist";

type Household = { id: number; name: string };
export type EditableStay = {
  id: number;
  label: string;
  householdId?: number | null;
  start: string;
  end: string;
  adults: number;
  kids: number;
  note: string | null;
};

const initial: StayFormState = {};

export function StayForm({
  households,
  stay,
  onDone,
  defaultDate,
}: {
  households: Household[];
  stay?: EditableStay;
  onDone?: () => void;
  defaultDate?: string;
}) {
  const action = stay ? updateStay : createStay;
  const [state, formAction, pending] = useActionState(
    async (prev: StayFormState, formData: FormData) => {
      const result = await action(prev, formData);
      if (!result.error && !result.conflict) onDone?.();
      return result;
    },
    initial
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      {stay ? <input type="hidden" name="id" value={stay.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="label" className="flabel">
            Who is coming
          </label>
          <input
            id="label"
            name="label"
            required
            defaultValue={stay?.label}
            maxLength={200}
            className="field"
            placeholder="John & Jenn, Guys Weekend"
          />
        </div>
        <div>
          <label htmlFor="householdId" className="flabel">
            Household color
          </label>
          <select
            id="householdId"
            name="householdId"
            defaultValue={stay?.householdId ?? ""}
            className="field"
          >
            <option value="">Pick one</option>
            {households.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="start" className="flabel">
            First night
          </label>
          <input
            id="start"
            name="start"
            type="date"
            required
            defaultValue={stay?.start ?? defaultDate}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="end" className="flabel">
            Last night
          </label>
          <input
            id="end"
            name="end"
            type="date"
            required
            defaultValue={stay?.end ?? defaultDate}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="adults" className="flabel">
            Adults
          </label>
          <input
            id="adults"
            name="adults"
            type="number"
            min={0}
            defaultValue={stay?.adults ?? 2}
            className="field"
          />
        </div>
        <div>
          <label htmlFor="kids" className="flabel">
            Kids
          </label>
          <input
            id="kids"
            name="kids"
            type="number"
            min={0}
            defaultValue={stay?.kids ?? 0}
            className="field"
          />
        </div>
      </div>
      <div>
        <label htmlFor="note" className="flabel">
          Arrival note
        </label>
        <input
          id="note"
          name="note"
          defaultValue={stay?.note ?? ""}
          maxLength={4000}
          className="field"
          placeholder="Arriving after lunch Friday"
        />
      </div>
      {state.error ? (
        <p className="text-sm font-medium text-rust">{state.error}</p>
      ) : null}
      {state.conflict ? (
        <div className="rounded-lh border border-amber/40 bg-amber/10 p-3 text-sm">
          <p className="font-medium text-ink">{state.conflict}</p>
          <label className="mt-2 flex items-center gap-2 text-ink-soft">
            <input type="checkbox" name="confirmConflict" value="1" />
            Save anyway, we are overlapping on purpose
          </label>
        </div>
      ) : null}
      <div className="mobile-form-actions items-center justify-between">
        <div className="mobile-form-actions">
          <button type="submit" disabled={pending} className="btn btn-primary">
            {pending ? "Saving" : stay ? "Save changes" : "Add to calendar"}
          </button>
          {onDone ? (
            <button type="button" onClick={onDone} className="btn btn-quiet">
              Cancel
            </button>
          ) : null}
        </div>
        {stay ? (
          confirmingDelete ? (
            <div className="flex items-center gap-3">
              <button
                type="submit"
                formAction={deleteStay}
                className="text-sm font-semibold text-rust hover:text-rust-dark"
              >
                Confirm remove
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="text-sm font-medium text-ink-soft"
              >
                Keep
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="text-sm font-medium text-ink-faint hover:text-rust"
            >
              Remove
            </button>
          )
        ) : null}
      </div>
    </form>
  );
}

export function EditStayForm({
  households,
  stay,
  closeHref,
}: {
  households: Household[];
  stay: EditableStay;
  closeHref: string;
}) {
  const router = useRouter();
  return (
    <StayForm
      households={households}
      stay={stay}
      onDone={() => router.push(closeHref)}
    />
  );
}

export function StayListItem({
  stay,
  households,
  dateBadge,
  meta,
  color,
  checklist,
  canToggleChecklist,
  canEdit = true,
}: {
  stay: EditableStay;
  households: Household[];
  dateBadge: string;
  meta: string;
  color: string;
  checklist: StayChecklistEntry[];
  canToggleChecklist: boolean;
  canEdit?: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="border-t border-sand-line py-4 first:border-0">
        <StayForm
          households={households}
          stay={stay}
          onDone={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="border-t border-sand-line py-3 first:border-0 first:pt-1">
      <div className="flex items-center gap-3">
      <span
        className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lh text-white"
        style={{ background: color }}
      >
        <span className="text-base font-bold leading-none">
          {dateBadge.split(" ")[1]}
        </span>
        <span className="text-[10px] uppercase">{dateBadge.split(" ")[0]}</span>
      </span>
      {canEdit ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="font-semibold text-water hover:text-deep-2">
            {stay.label}
          </p>
          <p className="text-sm text-ink-soft">{meta}</p>
          {stay.note ? (
            <p className="text-sm text-ink-faint">{stay.note}</p>
          ) : null}
        </button>
      ) : (
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{stay.label}</p>
          <p className="text-sm text-ink-soft">{meta}</p>
          {stay.note ? (
            <p className="text-sm text-ink-faint">{stay.note}</p>
          ) : null}
        </div>
      )}
      <div className="flex shrink-0 items-center gap-3">
        <a
          href={`/api/stay-ics/${stay.id}`}
          className="text-sm font-medium text-water hover:text-deep-2"
        >
          Add to calendar
        </a>
      </div>
      </div>
      <div className="ml-13">
        <StayChecklist
          stayId={stay.id}
          items={checklist}
          canToggle={canToggleChecklist}
        />
      </div>
    </li>
  );
}

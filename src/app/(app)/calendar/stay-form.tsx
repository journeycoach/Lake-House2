"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createStay,
  updateStay,
  deleteStay,
  type StayFormState,
} from "./actions";
import { StayChecklist, type StayChecklistEntry } from "./stay-checklist";
import { fmtRange } from "@/lib/dates";

type Household = { id: number; name: string };
export type EditableStay = {
  id: number;
  label: string;
  householdId?: number | null;
  start: string;
  end: string;
  adults: number;
  kids: number;
  guestNames: string | null;
  note: string | null;
};

/* A trimmed view of another booked stay, just enough to spot an overlap
   and name it in the warning. */
export type ConflictStay = {
  id: number;
  label: string;
  start: string;
  end: string;
};

function describeConflicts(conflicts: ConflictStay[]): string | null {
  if (conflicts.length === 0) return null;
  const [first, ...rest] = conflicts;
  const extra =
    rest.length > 0
      ? `, along with ${rest.length} other visit${rest.length === 1 ? "" : "s"}`
      : "";
  return `${first.label} is already booked ${fmtRange(first.start, first.end)}${extra}. Save anyway if sharing the house is the plan.`;
}

const initial: StayFormState = {};

export function StayForm({
  households,
  stay,
  onDone,
  defaultDate,
  defaultHouseholdId,
  defaultLabel,
  existingStays = [],
  closeDetailsId,
}: {
  households: Household[];
  stay?: EditableStay;
  onDone?: () => void;
  defaultDate?: string;
  defaultHouseholdId?: number | null;
  defaultLabel?: string;
  existingStays?: ConflictStay[];
  closeDetailsId?: string;
}) {
  const action = stay ? updateStay : createStay;
  const [state, formAction, pending] = useActionState(
    async (prev: StayFormState, formData: FormData) => {
      const result = await action(prev, formData);
      if (!result.error && !result.conflict) {
        onDone?.();
        if (closeDetailsId) {
          const details = document.getElementById(closeDetailsId);
          if (details instanceof HTMLDetailsElement) details.open = false;
        }
      }
      return result;
    },
    initial
  );
  const router = useRouter();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const values = state.values;
  const formKey = values ? JSON.stringify(values) : "ready";
  const [start, setStart] = useState(
    values?.start ?? stay?.start ?? defaultDate ?? ""
  );
  const [end, setEnd] = useState(values?.end ?? stay?.end ?? defaultDate ?? "");

  // Checked live as the dates change, against the stays already on the
  // calendar, so the warning shows up before a round trip to the server.
  const localConflicts =
    start && end && start <= end
      ? existingStays.filter(
          (other) =>
            other.id !== stay?.id && start <= other.end && other.start <= end
        )
      : [];
  const conflictMessage = describeConflicts(localConflicts) ?? state.conflict ?? null;

  useEffect(() => {
    if (state.added) formRef.current?.reset();
  }, [state.added]);

  useEffect(() => {
    if (!state.added || stay) return;
    const timeout = window.setTimeout(() => {
      router.replace("/calendar");
    }, 2200);
    return () => window.clearTimeout(timeout);
  }, [router, state.added, stay]);

  if (state.added && !stay) {
    return (
      <section
        role="status"
        aria-live="polite"
        className="rounded-lh border border-sage/30 bg-sage/10 p-5 text-center sm:p-7"
      >
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-sage text-white">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m5 12.5 4.5 4L19 7"
            />
          </svg>
        </span>
        <h2 className="mt-3 font-display text-2xl text-ink">
          Stay added to the calendar
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Your visit is booked. Returning to the Calendar…
        </p>
        <Link href="/calendar" className="btn btn-quiet mt-4">
          Go to Calendar now
        </Link>
      </section>
    );
  }

  return (
    <form
      key={formKey}
      ref={formRef}
      action={formAction}
      className="space-y-4"
    >
      {stay ? <input type="hidden" name="id" value={stay.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="householdId" className="flabel">
            Household
          </label>
          <select
            id="householdId"
            name="householdId"
            defaultValue={
              values?.householdId ?? stay?.householdId ?? defaultHouseholdId ?? ""
            }
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
          <label htmlFor="label" className="flabel">
            Who is coming
          </label>
          <input
            id="label"
            name="label"
            required
            defaultValue={values?.label ?? stay?.label ?? defaultLabel}
            maxLength={200}
            className="field"
            placeholder="Family weekend at the lake"
          />
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
            value={start}
            onChange={(e) => setStart(e.target.value)}
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
            value={end}
            onChange={(e) => setEnd(e.target.value)}
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
            defaultValue={values?.adults ?? stay?.adults ?? 2}
            className="field"
          />
        </div>
        {/* Kids is hidden for now; still submitted so existing stays keep their count. */}
        <input
          type="hidden"
          name="kids"
          defaultValue={values?.kids ?? stay?.kids ?? 0}
        />
      </div>
      {stay ? (
        <div>
          <label htmlFor="guestNames" className="flabel">
            Guest names (optional)
          </label>
          <input
            id="guestNames"
            name="guestNames"
            defaultValue={values?.guestNames ?? stay.guestNames ?? ""}
            maxLength={500}
            className="field"
          />
        </div>
      ) : null}
      {/* Arrival note is hidden for now; still submitted so existing stays keep their note. */}
      <input
        type="hidden"
        name="note"
        defaultValue={values?.note ?? stay?.note ?? ""}
      />
      {state.error ? (
        <p className="text-sm font-medium text-rust">{state.error}</p>
      ) : null}
      {state.added ? (
        <p aria-live="polite" className="text-sm font-medium text-sage">
          Added.
        </p>
      ) : null}
      {conflictMessage ? (
        <div className="rounded-lh border border-amber/40 bg-amber/10 p-3 text-sm">
          <p className="font-medium text-ink">{conflictMessage}</p>
          <label className="mt-2 flex items-center gap-2 text-ink-soft">
            <input
              type="checkbox"
              name="confirmConflict"
              value="1"
              className="h-4 w-4 shrink-0 accent-water"
            />
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
  existingStays = [],
}: {
  households: Household[];
  stay: EditableStay;
  closeHref: string;
  existingStays?: ConflictStay[];
}) {
  const router = useRouter();
  return (
    <StayForm
      households={households}
      stay={stay}
      existingStays={existingStays}
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
  existingStays = [],
}: {
  stay: EditableStay;
  households: Household[];
  dateBadge: string;
  meta: string;
  color: string;
  checklist: StayChecklistEntry[];
  canToggleChecklist: boolean;
  canEdit?: boolean;
  existingStays?: ConflictStay[];
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="border-t border-sand-line py-4 first:border-0">
        <StayForm
          households={households}
          stay={stay}
          existingStays={existingStays}
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

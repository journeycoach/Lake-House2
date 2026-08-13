"use client";

import { useState } from "react";
import Link from "next/link";
import { toggleStayChecklistItem } from "./stay-checklist-actions";

export type StayChecklistEntry = {
  id: number;
  phase: string;
  title: string;
  done: boolean;
  checkedBy: string | null;
  checkedAt: string | null;
};

function checkedDetails(item: StayChecklistEntry) {
  if (!item.checkedBy) return null;
  if (!item.checkedAt) return `Checked by ${item.checkedBy}`;
  return `Checked by ${item.checkedBy} · ${new Date(item.checkedAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  })}`;
}

export function StayChecklistPhase({
  label,
  items,
  showStatus = false,
}: {
  label: string;
  items: StayChecklistEntry[];
  showStatus?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
        {label}
      </p>
      <ul className="mt-1">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 py-1.5">
            <form action={toggleStayChecklistItem} className="shrink-0">
              <input type="hidden" name="itemId" value={item.id} />
              <button
                type="submit"
                aria-label={`${item.done ? "Uncheck" : "Check"} ${item.title}`}
                aria-pressed={item.done}
                className={`flex h-6 w-6 items-center justify-center rounded-[5px] border transition-colors ${
                  item.done
                    ? "border-sage bg-sage text-white"
                    : "border-sand-line bg-white hover:border-water"
                }`}
              >
                {item.done ? (
                  <svg
                    aria-hidden
                    width="13"
                    height="13"
                    viewBox="0 0 10 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1.5 5.5 4 8l4.5-6" />
                  </svg>
                ) : null}
              </button>
            </form>
            <div className="min-w-0">
              <p className={`text-sm ${item.done ? "text-ink-faint line-through" : "text-ink"}`}>
                {item.title}
              </p>
              {item.done && item.checkedBy ? (
                <p className="text-xs text-ink-faint">{checkedDetails(item)}</p>
              ) : showStatus ? (
                <p className="text-xs text-ink-faint">Not completed</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StayChecklist({
  stayId,
  items,
}: {
  stayId: number;
  items: StayChecklistEntry[];
}) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  const completed = items.filter((item) => item.done).length;
  const checkin = items.filter((item) => item.phase === "checkin");
  const checkout = items.filter((item) => item.phase === "checkout");

  return (
    <div className="mt-3 rounded-lh border border-sand-line bg-mist/60 p-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="text-sm font-semibold">Check-in &amp; check-out</span>
        <span className="flex items-center gap-2 text-xs font-medium text-water">
          {completed} of {items.length} complete
          <svg
            aria-hidden
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={open ? "rotate-180" : ""}
          >
            <path d="m2.5 4.5 3.5 3 3.5-3" />
          </svg>
        </span>
      </button>
      {open ? (
        <div className="mt-3 border-t border-sand-line pt-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <StayChecklistPhase label="Check in" items={checkin} />
            <StayChecklistPhase label="Check out" items={checkout} />
          </div>
          <Link
            href={`/calendar/${stayId}/checklist`}
            className="mt-3 inline-block text-sm font-semibold text-water hover:text-deep-2"
          >
            Open visit checklist and record
          </Link>
        </div>
      ) : null}
    </div>
  );
}

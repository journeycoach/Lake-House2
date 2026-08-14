"use client";

import { useState, type ReactNode } from "react";
import { VISIBILITY } from "@/lib/roles";
import { GuideBlock, type Block } from "@/components/guide-block";
import { AddBlock } from "./add-block";
import {
  saveSection,
  saveBlock,
  removeSection,
  moveSection,
  removeBlock,
  moveBlock,
} from "./actions";

export type Section = {
  id: number;
  position: number;
  title: string;
  minRole: string;
};

type ManageMode = "heading" | "arrange" | "editItems" | "deleteItems";

function manageButtonClass(active: boolean) {
  return `rounded-lh px-3 py-1.5 text-xs font-medium transition-colors ${
    active
      ? "bg-deep text-white"
      : "bg-white text-water hover:bg-water-tint hover:text-deep-2"
  }`;
}

export function SectionCard({
  section,
  blocks,
  canEdit = false,
  isFirst,
  isLast,
  stayChecklist,
  checklistEditHref,
  anchorId,
}: {
  section: Section;
  blocks: Block[];
  canEdit?: boolean;
  isFirst: boolean;
  isLast: boolean;
  stayChecklist?: ReactNode;
  checklistEditHref?: string;
  anchorId?: string;
}) {
  const [managing, setManaging] = useState(false);
  const [manageMode, setManageMode] = useState<ManageMode | null>(null);
  const editing = manageMode === "heading";
  const editingContent = manageMode === "editItems";
  const deletingContent = manageMode === "deleteItems";
  const arranging = manageMode === "arrange";

  function toggleMode(mode: ManageMode) {
    setManageMode((current) => (current === mode ? null : mode));
  }

  return (
    <article id={anchorId} className="card flex scroll-mt-4 flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-2xl text-amber">
          {String(section.position).padStart(2, "0")}
        </p>
        {canEdit ? (
          <button
            type="button"
            aria-expanded={managing}
            onClick={() => {
              setManaging((current) => !current);
              setManageMode(null);
            }}
            className="rounded-lh border border-sand-line px-3 py-1.5 text-xs font-semibold text-water hover:border-water hover:bg-water-tint"
          >
            {managing ? "Done" : "Manage"}
          </button>
        ) : null}
      </div>

      {editing ? (
        <form
          action={async (formData) => {
            await saveSection(formData);
            setManageMode(null);
          }}
          className="mt-2 space-y-3"
        >
          <input type="hidden" name="id" value={section.id} />
          <input
            name="title"
            defaultValue={section.title}
            maxLength={200}
            required
            className="field font-semibold"
          />
          <select
            name="minRole"
            defaultValue={section.minRole}
            className="field text-sm"
          >
            {VISIBILITY.map((v) => (
              <option key={v.value} value={v.value}>
                Visible to {v.label.toLowerCase()}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" className="btn btn-primary py-2">
              Save
            </button>
            <span className="flex-1" />
            <button
              type="submit"
              formAction={removeSection}
              className="text-xs font-medium text-ink-faint hover:text-rust"
            >
              Delete this section
            </button>
          </div>
        </form>
      ) : (
        <h3 className="mt-2 font-semibold">
          {section.title}
          {section.minRole !== "family" ? (
            <span className="ml-2 align-middle text-xs font-medium text-ink-faint">
              {section.minRole === "admin" ? "admins only" : "family and admins"}
            </span>
          ) : null}
        </h3>
      )}

      {managing ? (
        <div className="mt-3 rounded-lh border border-sand-line bg-mist/60 p-3">
          <p className="section-label">Manage this card</p>
          <div className="flex flex-wrap items-start gap-2 [&>form]:w-full [&>form]:basis-full">
            <AddBlock key={manageMode ?? "add"} sectionId={section.id} />
            <button
              type="button"
              onClick={() => toggleMode("heading")}
              className={`mt-3 ${manageButtonClass(editing)}`}
            >
              Edit heading
            </button>
            <button
              type="button"
              onClick={() => toggleMode("arrange")}
              className={`mt-3 ${manageButtonClass(arranging)}`}
            >
              Reorder
            </button>
            <button
              type="button"
              onClick={() => toggleMode("editItems")}
              disabled={blocks.length === 0}
              className={`mt-3 disabled:cursor-default disabled:opacity-40 ${manageButtonClass(editingContent)}`}
            >
              Edit items
            </button>
            <button
              type="button"
              onClick={() => toggleMode("deleteItems")}
              disabled={blocks.length === 0}
              className={`mt-3 disabled:cursor-default disabled:opacity-40 ${manageButtonClass(deletingContent)}`}
            >
              Delete items
            </button>
            {checklistEditHref ? (
              <a
                href={checklistEditHref}
                className={`mt-3 ${manageButtonClass(false)}`}
              >
                Edit checklist setup
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {stayChecklist ? (
        <div className="mt-3 rounded-lh border border-sand-line bg-mist/60 p-3">
          {stayChecklist}
        </div>
      ) : null}

      {arranging ? (
        <div className="mt-2 flex items-center gap-2">
          <form action={moveSection}>
            <input type="hidden" name="id" value={section.id} />
            <input type="hidden" name="dir" value="up" />
            <button
              type="submit"
              disabled={isFirst}
              className="btn btn-quiet py-1 text-xs disabled:opacity-30"
            >
              Move up
            </button>
          </form>
          <form action={moveSection}>
            <input type="hidden" name="id" value={section.id} />
            <input type="hidden" name="dir" value="down" />
            <button
              type="submit"
              disabled={isLast}
              className="btn btn-quiet py-1 text-xs disabled:opacity-30"
            >
              Move down
            </button>
          </form>
        </div>
      ) : null}

      <div className="mt-1">
        {blocks.map((b, i) => (
          <div key={b.id}>
            {editingContent ? (
              <form
                action={saveBlock}
                className="space-y-3 border-t border-sand-line py-3 first:border-0"
              >
                <input type="hidden" name="id" value={b.id} />
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-ink-soft">
                    Label
                  </span>
                  <input
                    name="label"
                    defaultValue={b.label ?? ""}
                    maxLength={200}
                    className="field text-sm"
                    placeholder="Optional heading"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-ink-soft">
                    {b.kind === "list"
                      ? "Items (one per line)"
                      : b.kind === "text"
                        ? "Text"
                        : "Value"}
                  </span>
                  {b.kind === "text" || b.kind === "list" ? (
                    <textarea
                      name="value"
                      defaultValue={b.value}
                      rows={b.kind === "list" ? 5 : 4}
                      maxLength={4000}
                      required
                      className="field text-sm"
                    />
                  ) : (
                    <input
                      name="value"
                      defaultValue={b.value}
                      maxLength={4000}
                      required
                      className="field text-sm"
                    />
                  )}
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    name="minRole"
                    defaultValue={b.minRole}
                    className="field w-56 py-2 text-sm"
                  >
                    {VISIBILITY.map((v) => (
                      <option key={v.value} value={v.value}>
                        Visible to {v.label.toLowerCase()}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="btn btn-primary py-2">
                    Save changes
                  </button>
                </div>
              </form>
            ) : (
              <GuideBlock block={b} />
            )}
            {deletingContent ? (
              <form
                action={removeBlock}
                onSubmit={(event) => {
                  const itemName = b.label || b.value.split("\n")[0] || "this item";
                  const confirmed = window.confirm(
                    `Delete “${itemName}” from this card? This cannot be undone.`
                  );
                  if (!confirmed) event.preventDefault();
                }}
                className="pb-2"
              >
                <input type="hidden" name="id" value={b.id} />
                <button
                  type="submit"
                  className="text-xs font-medium text-rust hover:text-rust-dark"
                >
                  Delete this item
                </button>
              </form>
            ) : null}
            {arranging ? (
              <div className="flex items-center gap-2 pb-2">
                <form action={moveBlock}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="dir" value="up" />
                  <button
                    type="submit"
                    disabled={i === 0}
                    className="btn btn-quiet py-1 text-xs disabled:opacity-30"
                  >
                    Up
                  </button>
                </form>
                <form action={moveBlock}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="dir" value="down" />
                  <button
                    type="submit"
                    disabled={i === blocks.length - 1}
                    className="btn btn-quiet py-1 text-xs disabled:opacity-30"
                  >
                    Down
                  </button>
                </form>
              </div>
            ) : null}
          </div>
        ))}
        {blocks.length === 0 ? (
          <p className="py-3 text-sm text-ink-faint">Nothing here yet.</p>
        ) : null}
      </div>

    </article>
  );
}

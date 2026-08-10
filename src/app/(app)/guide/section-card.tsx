"use client";

import { useState } from "react";
import { VISIBILITY } from "@/lib/roles";
import { GuideBlock, type Block } from "@/components/guide-block";
import { AddBlock } from "./add-block";
import {
  saveSection,
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

export function SectionCard({
  section,
  blocks,
  canEdit = false,
  isFirst,
  isLast,
}: {
  section: Section;
  blocks: Block[];
  canEdit?: boolean;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [arranging, setArranging] = useState(false);

  return (
    <article className="card flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-2xl text-amber">
          {String(section.position).padStart(2, "0")}
        </p>
        {canEdit ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setArranging((v) => !v)}
              className="text-xs font-medium text-water hover:text-deep-2"
            >
              {arranging ? "Done" : "Arrange"}
            </button>
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="text-xs font-medium text-water hover:text-deep-2"
            >
              {editing ? "Cancel" : "Edit"}
            </button>
          </div>
        ) : null}
      </div>

      {editing ? (
        <form
          action={async (formData) => {
            await saveSection(formData);
            setEditing(false);
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
            <GuideBlock block={b} />
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
                <form action={removeBlock}>
                  <input type="hidden" name="id" value={b.id} />
                  <button
                    type="submit"
                    className="text-xs font-medium text-ink-faint hover:text-rust"
                  >
                    Remove
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

      {canEdit ? <AddBlock sectionId={section.id} /> : null}
    </article>
  );
}

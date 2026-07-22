"use client";

import { useState } from "react";
import { saveSection } from "./actions";

export function SectionCard({
  section,
  canEdit = true,
}: {
  section: { id: number; position: number; title: string; body: string };
  canEdit?: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <article className="card p-5">
        <form
          action={async (formData) => {
            await saveSection(formData);
            setEditing(false);
          }}
          className="space-y-3"
        >
          <input type="hidden" name="id" value={section.id} />
          <input name="title" defaultValue={section.title} className="field font-semibold" />
          <textarea name="body" defaultValue={section.body} rows={6} className="field text-sm" />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary">
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="btn btn-quiet"
            >
              Cancel
            </button>
          </div>
        </form>
      </article>
    );
  }

  return (
    <article className="card flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-2xl text-amber">
          {String(section.position).padStart(2, "0")}
        </p>
        {canEdit ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-water hover:text-deep-2"
          >
            Edit
          </button>
        ) : null}
      </div>
      <h3 className="mt-2 font-semibold">{section.title}</h3>
      <p className="mt-1 whitespace-pre-line text-sm text-ink-soft">
        {section.body}
      </p>
    </article>
  );
}

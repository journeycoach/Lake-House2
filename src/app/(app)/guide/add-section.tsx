"use client";

import { useRef, useState } from "react";
import { VISIBILITY } from "@/lib/roles";
import { addSection, moveSection, removeSection } from "./actions";

type SectionOption = {
  id: number;
  title: string;
};

export function AddSection({ sections }: { sections: SectionOption[] }) {
  const [mode, setMode] = useState<"add" | "delete" | "reorder" | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-expanded={mode === "add"}
          onClick={() =>
            setMode((current) => (current === "add" ? null : "add"))
          }
          className="btn btn-quiet"
        >
          Add a Section
        </button>
        <button
          type="button"
          aria-expanded={mode === "delete"}
          onClick={() =>
            setMode((current) => (current === "delete" ? null : "delete"))
          }
          disabled={sections.length === 0}
          className="btn border border-rust/40 bg-white text-rust hover:border-rust hover:bg-rust/5 disabled:cursor-default disabled:opacity-40"
        >
          Delete a Section
        </button>
        <button
          type="button"
          aria-expanded={mode === "reorder"}
          onClick={() =>
            setMode((current) => (current === "reorder" ? null : "reorder"))
          }
          disabled={sections.length < 2}
          className="btn btn-quiet disabled:cursor-default disabled:opacity-40"
        >
          Reorder Sections
        </button>
      </div>

      {mode === "add" ? (
        <form
          ref={formRef}
          action={async (formData) => {
            await addSection(formData);
            formRef.current?.reset();
            setMode(null);
          }}
          className="card mt-3 flex flex-wrap items-center gap-2 p-4"
        >
          <input
            name="title"
            required
            maxLength={200}
            placeholder="What is this section about?"
            className="field min-w-48 flex-1"
          />
          <select name="minRole" defaultValue="family" className="field w-56">
            {VISIBILITY.map((v) => (
              <option key={v.value} value={v.value}>
                Visible to {v.label.toLowerCase()}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary">
            Add section
          </button>
          <button
            type="button"
            onClick={() => setMode(null)}
            className="text-xs font-medium text-ink-faint hover:text-rust"
          >
            Cancel
          </button>
        </form>
      ) : null}

      {mode === "delete" ? (
        <form
          action={async (formData) => {
            await removeSection(formData);
            setMode(null);
          }}
          onSubmit={(event) => {
            const formData = new FormData(event.currentTarget);
            const sectionId = Number(formData.get("id"));
            const sectionTitle =
              sections.find((section) => section.id === sectionId)?.title ??
              "this section";
            const confirmed = window.confirm(
              `Delete “${sectionTitle}” and everything inside it? This cannot be undone.`
            );
            if (!confirmed) event.preventDefault();
          }}
          className="card mt-3 flex flex-wrap items-center gap-2 border-rust/30 bg-rust/5 p-4"
        >
          <label htmlFor="guide-section-to-delete" className="sr-only">
            Section to delete
          </label>
          <select
            id="guide-section-to-delete"
            name="id"
            defaultValue=""
            required
            className="field min-w-56 flex-1"
          >
            <option value="" disabled>
              Choose a section to delete
            </option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.title}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="btn bg-rust text-white hover:bg-rust-dark"
          >
            Delete section
          </button>
          <button
            type="button"
            onClick={() => setMode(null)}
            className="text-xs font-medium text-ink-faint hover:text-rust"
          >
            Cancel
          </button>
          <p className="w-full text-xs text-rust-dark">
            Deleting a section also removes every item inside it.
          </p>
        </form>
      ) : null}

      {mode === "reorder" ? (
        <div className="card mt-3 p-4">
          <p className="section-label">Reorder sections</p>
          <div className="mt-2 divide-y divide-sand-line">
            {sections.map((section, index) => (
              <div
                key={section.id}
                className="flex items-center gap-3 py-2 first:pt-0 last:pb-0"
              >
                <span className="min-w-0 flex-1 text-sm font-semibold">
                  {section.title}
                </span>
                <form action={moveSection}>
                  <input type="hidden" name="id" value={section.id} />
                  <input type="hidden" name="dir" value="up" />
                  <button
                    type="submit"
                    disabled={index === 0}
                    aria-label={`Move ${section.title} up`}
                    title="Move up"
                    className="btn btn-quiet min-w-10 px-3 py-1.5 text-base disabled:cursor-default disabled:opacity-30"
                  >
                    ↑
                  </button>
                </form>
                <form action={moveSection}>
                  <input type="hidden" name="id" value={section.id} />
                  <input type="hidden" name="dir" value="down" />
                  <button
                    type="submit"
                    disabled={index === sections.length - 1}
                    aria-label={`Move ${section.title} down`}
                    title="Move down"
                    className="btn btn-quiet min-w-10 px-3 py-1.5 text-base disabled:cursor-default disabled:opacity-30"
                  >
                    ↓
                  </button>
                </form>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setMode(null)}
            className="mt-3 text-xs font-medium text-ink-faint hover:text-rust"
          >
            Done
          </button>
        </div>
      ) : null}
    </div>
  );
}

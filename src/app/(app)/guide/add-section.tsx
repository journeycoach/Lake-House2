"use client";

import { useRef, useState } from "react";
import { VISIBILITY } from "@/lib/roles";
import { addSection } from "./actions";

export function AddSection() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-quiet mt-4"
      >
        Add a section
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await addSection(formData);
        formRef.current?.reset();
        setOpen(false);
      }}
      className="card mt-4 flex flex-wrap items-center gap-2 p-4"
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
        onClick={() => setOpen(false)}
        className="text-xs font-medium text-ink-faint hover:text-rust"
      >
        Cancel
      </button>
    </form>
  );
}

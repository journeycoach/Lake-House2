"use client";

import { useRef, useState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { addNote } from "./actions";
import { RichTextEditor } from "./rich-text-editor";

const TAGS = ["local tip", "house update", "for the next visit"];

export function NoteComposer() {
  const formRef = useRef<HTMLFormElement>(null);
  const [editorKey, setEditorKey] = useState(0);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        const added = await addNote(formData);
        if (!added) return;
        formRef.current?.reset();
        setEditorKey((current) => current + 1);
      }}
      className="mt-4 hidden space-y-3 border-t border-sand-line pt-4 group-open:block"
    >
      <div>
        <p className="flabel">The note</p>
        <RichTextEditor key={editorKey} />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-56">
          <label htmlFor="tag" className="flabel">
            Tag
          </label>
          <select id="tag" name="tag" className="field py-2">
            {TAGS.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>
        <SubmitButton className="btn btn-primary py-2">Share note</SubmitButton>
      </div>
    </form>
  );
}

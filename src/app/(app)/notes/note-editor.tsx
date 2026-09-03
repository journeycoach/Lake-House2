"use client";

import { SubmitButton } from "@/components/submit-button";
import { updateNote } from "./actions";
import { RichTextEditor } from "./rich-text-editor";

const TAGS = ["local tip", "house update", "for the next visit"];

export function NoteEditor({
  id,
  tag,
  initialHtml,
  cancelHtmlFor,
}: {
  id: number;
  tag: string;
  initialHtml: string;
  cancelHtmlFor: string;
}) {
  return (
    <form action={updateNote} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <RichTextEditor initialHtml={initialHtml} />
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-48">
          <label htmlFor={`tag-${id}`} className="flabel">
            Tag
          </label>
          <select id={`tag-${id}`} name="tag" defaultValue={tag} className="field py-2">
            {TAGS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <SubmitButton className="btn btn-primary py-2">Save changes</SubmitButton>
        <label
          htmlFor={cancelHtmlFor}
          className="cursor-pointer pb-2 text-xs font-medium text-ink-faint hover:text-rust"
        >
          Cancel
        </label>
      </div>
    </form>
  );
}

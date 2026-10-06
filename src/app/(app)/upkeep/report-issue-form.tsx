"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { reportIssue } from "./fixit-actions";

export function ReportIssueForm() {
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        setSaving(true);
        setError(null);
        setAdded(false);
        try {
          const file = fileRef.current?.files?.[0];
          if (file) {
            const blob = await upload(`fixit/${file.name}`, file, {
              access: "public",
              handleUploadUrl: "/api/fixit/upload",
            });
            formData.set("photoUrl", blob.url);
          }
          await reportIssue(formData);
          formRef.current?.reset();
          setAdded(true);
        } catch (caught) {
          const message = (caught as Error).message;
          setError(
            message.includes("store")
              ? "Photo storage is not set up yet."
              : message || "The issue could not be saved."
          );
        } finally {
          setSaving(false);
        }
      }}
      className="space-y-4"
    >
      <div>
        <label
          htmlFor="issuePhoto"
          className="flabel inline-flex items-center gap-2"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4 text-water"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 7.5h3l1.4-2h7.2l1.4 2h3A1.5 1.5 0 0 1 21.5 9v9A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18V9A1.5 1.5 0 0 1 4 7.5Z"
            />
            <circle cx="12" cy="13" r="3.25" />
          </svg>
          Photo (optional)
        </label>
        <input
          ref={fileRef}
          id="issuePhoto"
          type="file"
          accept="image/*"
          className="field text-sm"
        />
        <p className="mt-1 text-xs text-ink-faint">
          Please include a picture to help clarify the issue you see.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="title" className="flabel">
            What is broken
          </label>
          <input
            id="title"
            name="title"
            required
            maxLength={200}
            className="field"
            placeholder="Dock light flickers after rain"
          />
        </div>
        <div>
          <label htmlFor="location" className="flabel">
            Where
          </label>
          <input
            id="location"
            name="location"
            maxLength={200}
            className="field"
            placeholder="Dock"
          />
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-3 sm:col-span-2 sm:gap-4">
          <div className="min-w-0">
            <label htmlFor="priority" className="flabel">
              How urgent
            </label>
            <select
              id="priority"
              name="priority"
              className="field"
              defaultValue="whenever"
            >
              <option value="urgent">Urgent</option>
              <option value="soon">Soon</option>
              <option value="whenever">Whenever</option>
            </select>
          </div>
          <div className="min-w-0">
            <label htmlFor="assignedTo" className="flabel">
              Who is on it (optional)
            </label>
            <input
              id="assignedTo"
              name="assignedTo"
              maxLength={200}
              className="field"
              placeholder="Unassigned"
            />
          </div>
        </div>
      </div>
      <div>
        <label htmlFor="details" className="flabel">
          Details
        </label>
        <textarea
          id="details"
          name="details"
          rows={2}
          maxLength={4000}
          className="field"
          placeholder="Describe when it happens and what you have already checked."
        />
      </div>
      <div className="mobile-form-actions flex-wrap">
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? "Uploading and saving" : "Add to the list"}
        </button>
        {error ? (
          <p aria-live="polite" className="w-full text-sm font-medium text-rust">
            {error}
          </p>
        ) : null}
        {added && !error ? (
          <p aria-live="polite" className="w-full text-sm font-medium text-sage">
            Added.
          </p>
        ) : null}
      </div>
    </form>
  );
}

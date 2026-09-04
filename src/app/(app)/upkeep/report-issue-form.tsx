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
          const details = document.getElementById("report-an-issue");
          if (details instanceof HTMLDetailsElement) details.open = false;
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
            placeholder="Dock light is flickering"
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
        <div>
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
        <div>
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
          placeholder="Check the fixture and replace it if needed."
        />
      </div>
      <div>
        <label htmlFor="issuePhoto" className="flabel">
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
          Add a photo from your phone so everyone can see exactly what needs attention.
        </p>
      </div>
      <button type="submit" disabled={saving} className="btn btn-primary">
        {saving ? "Uploading and saving" : "Add to the list"}
      </button>
      {error ? (
        <p aria-live="polite" className="text-sm font-medium text-rust">
          {error}
        </p>
      ) : null}
      {added && !error ? (
        <p aria-live="polite" className="text-sm font-medium text-sage">
          Added.
        </p>
      ) : null}
    </form>
  );
}

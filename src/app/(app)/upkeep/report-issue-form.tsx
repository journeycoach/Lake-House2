"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { reportIssue } from "./fixit-actions";

export function ReportIssueForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const timeout = window.setTimeout(() => {
      router.replace("/upkeep?tab=fixit");
    }, 2200);
    return () => window.clearTimeout(timeout);
  }, [added, router]);

  if (added) {
    return (
      <section
        role="status"
        aria-live="polite"
        className="rounded-lh border border-sage/30 bg-sage/10 p-5 text-center sm:p-7"
      >
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-sage text-white">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m5 12.5 4.5 4L19 7"
            />
          </svg>
        </span>
        <h2 className="mt-3 font-display text-2xl text-ink">Issue submitted</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Thanks for letting everyone know. It’s been added to Property Care.
        </p>
        <p className="mt-2 text-xs text-ink-faint">Returning to Property Care…</p>
        <Link href="/upkeep?tab=fixit" className="btn btn-quiet mt-4">
          Go there now
        </Link>
      </section>
    );
  }

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
          {saving ? "Uploading and saving" : "Submit issue"}
        </button>
        {error ? (
          <p aria-live="polite" className="w-full text-sm font-medium text-rust">
            {error}
          </p>
        ) : null}
      </div>
    </form>
  );
}

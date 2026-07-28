"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { VISIBILITY } from "@/lib/roles";
import { addBlock } from "./actions";

const KINDS = [
  { value: "text", label: "Notes", placeholder: "Anything worth writing down" },
  { value: "secret", label: "Code or password", placeholder: "The code itself" },
  { value: "photo", label: "Photo", placeholder: "" },
  { value: "contact", label: "Phone number", placeholder: "512 555 0134" },
  { value: "address", label: "Address", placeholder: "1200 Lakeshore Dr, Kingsland TX" },
];

const LABEL_HINT: Record<string, string> = {
  text: "Heading (optional)",
  secret: "What is it? Wi-Fi password, door code",
  photo: "Caption (optional)",
  contact: "Whose number? Tom's Repair",
  address: "What is it? The house, the marina",
};

export function AddBlock({ sectionId }: { sectionId: number }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("text");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 self-start text-xs font-medium text-water hover:text-deep-2"
      >
        Add to this section
      </button>
    );
  }

  const current = KINDS.find((k) => k.value === kind)!;

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        setError(null);
        if (kind === "photo") {
          const file = fileRef.current?.files?.[0];
          if (!file) {
            setError("Choose a photo first.");
            return;
          }
          setUploading(true);
          try {
            const blob = await upload(file.name, file, {
              access: "public",
              handleUploadUrl: "/api/guide/upload",
            });
            formData.set("value", blob.url);
          } catch (e) {
            setUploading(false);
            setError(
              (e as Error).message.includes("store")
                ? "Photo storage is not set up yet."
                : (e as Error).message
            );
            return;
          }
          setUploading(false);
        }
        await addBlock(formData);
        formRef.current?.reset();
        setOpen(false);
      }}
      className="mt-3 space-y-3 border-t border-sand-line pt-3"
    >
      <input type="hidden" name="sectionId" value={sectionId} />
      <input type="hidden" name="kind" value={kind} />

      <div className="flex flex-wrap gap-1">
        {KINDS.map((k) => (
          <button
            key={k.value}
            type="button"
            onClick={() => setKind(k.value)}
            className={`rounded-lh px-3 py-1.5 text-xs font-medium transition-colors ${
              kind === k.value
                ? "bg-deep text-white"
                : "bg-mist text-ink-soft hover:text-ink"
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      <input
        name="label"
        maxLength={200}
        placeholder={LABEL_HINT[kind]}
        className="field text-sm"
      />

      {kind === "photo" ? (
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="field text-sm"
        />
      ) : kind === "text" ? (
        <textarea
          name="value"
          rows={3}
          maxLength={4000}
          required
          placeholder={current.placeholder}
          className="field text-sm"
        />
      ) : (
        <input
          name="value"
          maxLength={4000}
          required
          placeholder={current.placeholder}
          className="field text-sm"
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <select name="minRole" defaultValue="family" className="field w-56 py-2 text-sm">
          {VISIBILITY.map((v) => (
            <option key={v.value} value={v.value}>
              Visible to {v.label.toLowerCase()}
            </option>
          ))}
        </select>
        <button type="submit" disabled={uploading} className="btn btn-primary py-2">
          {uploading ? "Uploading" : "Add"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="text-xs font-medium text-ink-faint hover:text-rust"
        >
          Cancel
        </button>
      </div>

      {error ? (
        <p className="text-xs font-medium text-rust">{error}</p>
      ) : null}
    </form>
  );
}

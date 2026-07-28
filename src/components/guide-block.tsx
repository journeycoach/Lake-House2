"use client";

import { useEffect, useState } from "react";

export type Block = {
  id: number;
  kind: string;
  label: string | null;
  value: string;
  minRole: string;
};

function Restricted({ minRole }: { minRole: string }) {
  if (minRole === "family") return null;
  return (
    <span className="ml-2 align-middle text-xs font-medium text-ink-faint">
      {minRole === "admin" ? "admins only" : "household and up"}
    </span>
  );
}

/* Codes and passwords stay covered until asked for, so a phone handed around
   or a screen glanced at over a shoulder does not give them away. */
function Secret({ block }: { block: Block }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div className="border-t border-sand-line py-3 first:border-0">
      <p className="text-xs font-medium text-ink-faint">
        {block.label ?? "Code"}
        <Restricted minRole={block.minRole} />
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {shown ? (
          <code className="rounded-lh bg-mist px-2 py-1 font-mono text-sm">
            {block.value}
          </code>
        ) : (
          <span className="rounded-lh bg-mist px-2 py-1 font-mono text-sm tracking-widest text-ink-faint">
            {"•".repeat(Math.min(block.value.length, 12))}
          </span>
        )}
        <button
          type="button"
          onClick={() => setShown((v) => !v)}
          className="text-xs font-medium text-water hover:text-deep-2"
        >
          {shown ? "Hide" : "Show"}
        </button>
        {shown ? (
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(block.value);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="text-xs font-medium text-water hover:text-deep-2"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Photo({ block }: { block: Block }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <figure className="border-t border-sand-line py-3 first:border-0">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block w-full text-left"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.value}
            alt={block.label ?? "House guide photo"}
            loading="lazy"
            className="h-28 w-full rounded-lh object-cover sm:h-36"
          />
        </button>
        {block.label ? (
          <figcaption className="mt-1 text-xs text-ink-faint">
            {block.label}
            <Restricted minRole={block.minRole} />
          </figcaption>
        ) : null}
      </figure>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={block.label ?? "Photo"}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-deep/95 p-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.value}
            alt={block.label ?? "House guide photo"}
            className="max-h-full max-w-full rounded-lh object-contain"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close photo"
            className="absolute right-4 top-4 rounded-lh border border-white/30 px-3 py-1 text-sm text-white hover:bg-white/10"
          >
            Close
          </button>
        </div>
      ) : null}
    </>
  );
}

export function GuideBlock({ block }: { block: Block }) {
  if (block.kind === "secret") return <Secret block={block} />;
  if (block.kind === "photo") return <Photo block={block} />;

  if (block.kind === "contact") {
    const tel = block.value.replace(/[^\d+]/g, "");
    return (
      <div className="border-t border-sand-line py-3 first:border-0">
        <p className="text-xs font-medium text-ink-faint">
          {block.label ?? "Contact"}
          <Restricted minRole={block.minRole} />
        </p>
        <a
          href={`tel:${tel}`}
          className="text-sm font-semibold text-water hover:text-deep-2"
        >
          {block.value}
        </a>
      </div>
    );
  }

  if (block.kind === "address") {
    return (
      <div className="border-t border-sand-line py-3 first:border-0">
        <p className="text-xs font-medium text-ink-faint">
          {block.label ?? "Address"}
          <Restricted minRole={block.minRole} />
        </p>
        <a
          href={`https://maps.apple.com/?q=${encodeURIComponent(block.value)}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold text-water hover:text-deep-2"
        >
          {block.value}
        </a>
      </div>
    );
  }

  return (
    <div className="border-t border-sand-line py-3 first:border-0">
      {block.label ? (
        <p className="text-xs font-medium text-ink-faint">
          {block.label}
          <Restricted minRole={block.minRole} />
        </p>
      ) : null}
      <p className="whitespace-pre-line text-sm text-ink-soft">{block.value}</p>
    </div>
  );
}

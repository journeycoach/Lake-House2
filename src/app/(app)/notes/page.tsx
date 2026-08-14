import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { latestNotes } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { RichNote } from "@/components/rich-note";
import { removeNote } from "./actions";
import { NoteComposer } from "./note-composer";

export const metadata: Metadata = { title: "Family notes · Paine Pointe" };

export default async function NotesPage() {
  const user = await requireUser();
  const editor = canEdit(user.effectiveRole);
  const notes = await latestNotes();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Family notes" />

      <details
        className={`group rounded-lh border border-water/30 border-l-4 bg-water-tint p-4 ${
          editor ? "" : "hidden"
        }`}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lh bg-water text-white"
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 17 17"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11.5 2.5a1.4 1.4 0 0 1 2 2L6 12l-3 .8.8-3 7.7-7.3Z" />
                <path d="m10 4 3 3" />
              </svg>
            </span>
            <div>
              <p className="section-label text-water">Share a note</p>
              <h2 className="font-display mt-0.5 text-xl">FYI everyone</h2>
            </div>
          </div>
          <span className="flex items-center gap-2 text-sm font-semibold text-water">
            Write a note
            <svg
              aria-hidden
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform group-open:rotate-180"
            >
              <path d="m3 5 4 4 4-4" />
            </svg>
          </span>
        </summary>
        <NoteComposer />
      </details>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {notes.map((n) => (
          <article key={n.id} className="card flex flex-col p-5">
            <p className="section-label">{n.tag}</p>
            <RichNote body={n.body} className="mt-2 flex-1" />
            <div className="mt-4 flex items-center justify-between border-t border-sand-line pt-3">
              <p className="text-xs text-ink-faint">{n.authorName}</p>
              {editor && (n.authorId === user.id || user.effectiveRole === "admin") ? (
                <form action={removeNote}>
                  <input type="hidden" name="id" value={n.id} />
                  <button
                    type="submit"
                    className="text-xs font-medium text-ink-faint hover:text-rust"
                  >
                    Remove
                  </button>
                </form>
              ) : null}
            </div>
          </article>
        ))}
        {notes.length === 0 ? (
          <p className="text-sm text-ink-soft">No notes yet. Share the first one.</p>
        ) : null}
      </section>
    </div>
  );
}

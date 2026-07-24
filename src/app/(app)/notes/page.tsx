import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { latestNotes } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { addNote, removeNote } from "./actions";

export const metadata: Metadata = { title: "Family notes · The Lakehouse" };

const TAGS = ["local tip", "house update", "for the next visit"];

export default async function NotesPage() {
  const user = await requireUser();
  const editor = canEdit(user.effectiveRole);
  const notes = await latestNotes();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Family notes" />

      <section className={`card p-6 ${editor ? "" : "hidden"}`}>
        <p className="section-label">Share a note</p>
        <h2 className="font-display text-2xl mt-1 mb-4">FYI everyone</h2>
        <form action={addNote} className="space-y-4">
          <div>
            <label htmlFor="body" className="flabel">
              The note
            </label>
            <textarea
              id="body"
              name="body"
              required
              rows={3}
              className="field"
              placeholder="The lake is high this week, tie everything down."
            />
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-full sm:w-64">
              <label htmlFor="tag" className="flabel">
                Tag
              </label>
              <select id="tag" name="tag" className="field">
                {TAGS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <SubmitButton>Share note</SubmitButton>
          </div>
        </form>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {notes.map((n) => (
          <article key={n.id} className="card flex flex-col p-5">
            <p className="section-label">{n.tag}</p>
            <p className="mt-2 flex-1 text-sm">{n.body}</p>
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

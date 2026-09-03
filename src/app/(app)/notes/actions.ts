"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/lib/db";
import { getEffectiveUser, requireEditor } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { canEdit } from "@/lib/roles";
import { readText } from "@/lib/forms";
import { notePlainText, sanitizeNoteForStorage } from "@/lib/note-rich-text";

export async function addNote(formData: FormData) {
  const user = await requireEditor();
  const body = sanitizeNoteForStorage(readText(formData.get("body"), 16000));
  const tag = String(formData.get("tag") ?? "house update");
  if (!body) return false;
  await getDb().insert(schema.notes).values({
    authorName: user.name,
    authorId: user.id,
    body,
    tag,
    createdAt: new Date().toISOString(),
  });
  await logActivity(user, "shared a note", notePlainText(body).slice(0, 80));
  revalidatePath("/notes");
  revalidatePath("/");
  return true;
}

export async function updateNote(formData: FormData) {
  const user = await getEffectiveUser();
  if (!user || !canEdit(user.effectiveRole)) return;
  const id = Number(formData.get("id"));
  if (!id) return;
  const note = await getDb().query.notes.findFirst({
    where: eq(schema.notes.id, id),
  });
  if (!note) return;
  if (note.authorId !== user.id && user.effectiveRole !== "admin") return;
  const body = sanitizeNoteForStorage(readText(formData.get("body"), 16000));
  if (!body) return;
  const tag = String(formData.get("tag") ?? note.tag);
  await getDb().update(schema.notes).set({ body, tag }).where(eq(schema.notes.id, id));
  await logActivity(user, "updated a note", notePlainText(body).slice(0, 80));
  revalidatePath("/notes");
  revalidatePath("/");
}

export async function removeNote(formData: FormData) {
  const user = await getEffectiveUser();
  if (!user || !canEdit(user.effectiveRole)) return;
  const id = Number(formData.get("id"));
  const note = await getDb().query.notes.findFirst({
    where: eq(schema.notes.id, id),
  });
  if (!note) return;
  if (note.authorId !== user.id && user.effectiveRole !== "admin") return;
  await getDb().delete(schema.notes).where(eq(schema.notes.id, id));
  await logActivity(user, "removed a note", notePlainText(note.body).slice(0, 80));
  revalidatePath("/notes");
  revalidatePath("/");
}

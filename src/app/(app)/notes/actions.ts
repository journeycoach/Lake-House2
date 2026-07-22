"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { getEffectiveUser, requireEditor } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { canEdit } from "@/lib/roles";

export async function addNote(formData: FormData) {
  const user = await requireEditor();
  const body = String(formData.get("body") ?? "").trim();
  const tag = String(formData.get("tag") ?? "house update");
  if (!body) return;
  await db.insert(schema.notes).values({
    authorName: user.name,
    authorId: user.id,
    body,
    tag,
    createdAt: new Date().toISOString(),
  });
  await logActivity(user, "shared a note", body.slice(0, 80));
  revalidatePath("/notes");
  revalidatePath("/");
}

export async function removeNote(formData: FormData) {
  const user = await getEffectiveUser();
  if (!user || !canEdit(user.effectiveRole)) return;
  const id = Number(formData.get("id"));
  const note = await db.query.notes.findFirst({
    where: eq(schema.notes.id, id),
  });
  if (!note) return;
  if (note.authorId !== user.id && user.effectiveRole !== "admin") return;
  await db.delete(schema.notes).where(eq(schema.notes.id, id));
  await logActivity(user, "removed a note", note.body.slice(0, 80));
  revalidatePath("/notes");
  revalidatePath("/");
}

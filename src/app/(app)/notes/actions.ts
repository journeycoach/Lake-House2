"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { getCurrentUser, requireUser } from "@/lib/auth";

export async function addNote(formData: FormData) {
  const user = await requireUser();
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
  revalidatePath("/notes");
  revalidatePath("/");
}

export async function removeNote(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const id = Number(formData.get("id"));
  const note = await db.query.notes.findFirst({
    where: eq(schema.notes.id, id),
  });
  if (!note) return;
  if (note.authorId !== user.id && user.role !== "admin") return;
  await db.delete(schema.notes).where(eq(schema.notes.id, id));
  revalidatePath("/notes");
  revalidatePath("/");
}

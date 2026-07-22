"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function saveSection(formData: FormData) {
  await requireUser();
  const id = Number(formData.get("id"));
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!id || !title) return;
  await db
    .update(schema.guideSections)
    .set({ title, body })
    .where(eq(schema.guideSections.id, id));
  revalidatePath("/guide");
}

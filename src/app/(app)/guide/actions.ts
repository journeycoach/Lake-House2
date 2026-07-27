"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { readText } from "@/lib/forms";

export async function saveSection(formData: FormData) {
  const user = await requireEditor();
  const id = Number(formData.get("id"));
  const title = readText(formData.get("title"), 200);
  const body = readText(formData.get("body"), 4000);
  if (!id || !title) return;
  await getDb()
    .update(schema.guideSections)
    .set({ title, body })
    .where(eq(schema.guideSections.id, id));
  await logActivity(user, "edited the house guide", title);
  revalidatePath("/guide");
}

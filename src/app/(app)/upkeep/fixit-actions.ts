"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { readText } from "@/lib/forms";

export async function reportIssue(formData: FormData) {
  const user = await requireEditor();
  const title = readText(formData.get("title"), 200);
  if (!title) return;
  await getDb().insert(schema.fixit).values({
    title,
    details: readText(formData.get("details"), 4000) || null,
    location: readText(formData.get("location"), 200) || null,
    priority: String(formData.get("priority") ?? "whenever"),
    assignedTo: readText(formData.get("assignedTo"), 200) || null,
    status: "open",
    createdAt: new Date().toISOString(),
  });
  await logActivity(user, "reported an issue", title);
  revalidatePath("/upkeep");
  revalidatePath("/");
}

export async function setFixitStatus(formData: FormData) {
  const user = await requireEditor();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status")) === "done" ? "done" : "open";
  if (!id) return;
  const item = await getDb().query.fixit.findFirst({ where: eq(schema.fixit.id, id) });
  await getDb().update(schema.fixit).set({ status }).where(eq(schema.fixit.id, id));
  if (item) {
    await logActivity(
      user,
      status === "done" ? "marked a repair done" : "reopened a repair",
      item.title
    );
  }
  revalidatePath("/upkeep");
  revalidatePath("/");
}

export async function removeFixit(formData: FormData) {
  const user = await requireEditor();
  const id = Number(formData.get("id"));
  if (!id) return;
  const item = await getDb().query.fixit.findFirst({ where: eq(schema.fixit.id, id) });
  await getDb().delete(schema.fixit).where(eq(schema.fixit.id, id));
  if (item) await logActivity(user, "removed a repair", item.title);
  revalidatePath("/upkeep");
  revalidatePath("/");
}

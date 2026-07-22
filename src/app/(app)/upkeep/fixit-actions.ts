"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function reportIssue(formData: FormData) {
  const user = await requireEditor();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  await db.insert(schema.fixit).values({
    title,
    details: String(formData.get("details") ?? "").trim() || null,
    location: String(formData.get("location") ?? "").trim() || null,
    priority: String(formData.get("priority") ?? "whenever"),
    assignedTo: String(formData.get("assignedTo") ?? "").trim() || null,
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
  const item = await db.query.fixit.findFirst({ where: eq(schema.fixit.id, id) });
  await db.update(schema.fixit).set({ status }).where(eq(schema.fixit.id, id));
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
  const item = await db.query.fixit.findFirst({ where: eq(schema.fixit.id, id) });
  await db.delete(schema.fixit).where(eq(schema.fixit.id, id));
  if (item) await logActivity(user, "removed a repair", item.title);
  revalidatePath("/upkeep");
  revalidatePath("/");
}

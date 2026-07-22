"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { requireEditor } from "@/lib/auth";

export async function reportIssue(formData: FormData) {
  await requireEditor();
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
  revalidatePath("/fixit");
  revalidatePath("/");
}

export async function setFixitStatus(formData: FormData) {
  await requireEditor();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status")) === "done" ? "done" : "open";
  if (!id) return;
  await db.update(schema.fixit).set({ status }).where(eq(schema.fixit.id, id));
  revalidatePath("/fixit");
  revalidatePath("/");
}

export async function removeFixit(formData: FormData) {
  await requireEditor();
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(schema.fixit).where(eq(schema.fixit.id, id));
  revalidatePath("/fixit");
  revalidatePath("/");
}

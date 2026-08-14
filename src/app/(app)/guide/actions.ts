"use server";

import { asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { readText } from "@/lib/forms";

const KINDS = ["text", "list", "secret", "photo", "contact", "address"];

function readRole(value: unknown): string {
  const v = String(value);
  return v === "admin" || v === "household" || v === "family" ? v : "family";
}

function refresh() {
  revalidatePath("/guide");
}

/* Sections */

export async function addSection(formData: FormData) {
  const user = await requireEditor();
  const title = readText(formData.get("title"), 200);
  if (!title) return;
  const [last] = await getDb()
    .select({ p: schema.guideSections.position })
    .from(schema.guideSections)
    .orderBy(sql`${schema.guideSections.position} DESC`)
    .limit(1);
  await getDb().insert(schema.guideSections).values({
    position: (last?.p ?? 0) + 1,
    title,
    body: "",
    minRole: readRole(formData.get("minRole")),
  });
  await logActivity(user, "added a guide section", title);
  refresh();
}

export async function saveSection(formData: FormData) {
  const user = await requireEditor();
  const id = Number(formData.get("id"));
  const title = readText(formData.get("title"), 200);
  if (!id || !title) return;
  await getDb()
    .update(schema.guideSections)
    .set({ title, minRole: readRole(formData.get("minRole")) })
    .where(eq(schema.guideSections.id, id));
  await logActivity(user, "edited a guide section", title);
  refresh();
}

export async function removeSection(formData: FormData) {
  const user = await requireEditor();
  const id = Number(formData.get("id"));
  if (!id) return;
  const section = await getDb().query.guideSections.findFirst({
    where: eq(schema.guideSections.id, id),
  });
  // Blocks first: they point at the section.
  await getDb()
    .delete(schema.guideBlocks)
    .where(eq(schema.guideBlocks.sectionId, id));
  await getDb().delete(schema.guideSections).where(eq(schema.guideSections.id, id));
  await logActivity(user, "removed a guide section", section?.title ?? undefined);
  refresh();
}

export async function moveSection(formData: FormData) {
  await requireEditor();
  const id = Number(formData.get("id"));
  const dir = String(formData.get("dir"));
  if (!id) return;
  const all = await getDb()
    .select()
    .from(schema.guideSections)
    .orderBy(asc(schema.guideSections.position));
  const i = all.findIndex((s) => s.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= all.length) return;
  await getDb()
    .update(schema.guideSections)
    .set({ position: all[j].position })
    .where(eq(schema.guideSections.id, all[i].id));
  await getDb()
    .update(schema.guideSections)
    .set({ position: all[i].position })
    .where(eq(schema.guideSections.id, all[j].id));
  refresh();
}

/* Blocks */

export async function addBlock(formData: FormData) {
  const user = await requireEditor();
  const sectionId = Number(formData.get("sectionId"));
  const kind = String(formData.get("kind"));
  const value = readText(formData.get("value"), 4000);
  if (!sectionId || !KINDS.includes(kind) || !value) return;

  const [last] = await getDb()
    .select({ p: schema.guideBlocks.position })
    .from(schema.guideBlocks)
    .where(eq(schema.guideBlocks.sectionId, sectionId))
    .orderBy(sql`${schema.guideBlocks.position} DESC`)
    .limit(1);

  await getDb().insert(schema.guideBlocks).values({
    sectionId,
    position: (last?.p ?? 0) + 1,
    kind,
    label: readText(formData.get("label"), 200) || null,
    value,
    minRole: readRole(formData.get("minRole")),
  });
  await logActivity(user, "added to the house guide", kind);
  refresh();
}

export async function saveBlock(formData: FormData) {
  const user = await requireEditor();
  const id = Number(formData.get("id"));
  const value = readText(formData.get("value"), 4000);
  if (!id || !value) return;
  await getDb()
    .update(schema.guideBlocks)
    .set({
      label: readText(formData.get("label"), 200) || null,
      value,
      minRole: readRole(formData.get("minRole")),
    })
    .where(eq(schema.guideBlocks.id, id));
  await logActivity(user, "edited the house guide");
  refresh();
}

export async function removeBlock(formData: FormData) {
  const user = await requireEditor();
  const id = Number(formData.get("id"));
  if (!id) return;
  await getDb().delete(schema.guideBlocks).where(eq(schema.guideBlocks.id, id));
  await logActivity(user, "removed something from the house guide");
  refresh();
}

export async function moveBlock(formData: FormData) {
  await requireEditor();
  const id = Number(formData.get("id"));
  const dir = String(formData.get("dir"));
  if (!id) return;
  const block = await getDb().query.guideBlocks.findFirst({
    where: eq(schema.guideBlocks.id, id),
  });
  if (!block) return;
  const siblings = await getDb()
    .select()
    .from(schema.guideBlocks)
    .where(eq(schema.guideBlocks.sectionId, block.sectionId))
    .orderBy(asc(schema.guideBlocks.position));
  const i = siblings.findIndex((b) => b.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= siblings.length) return;
  await getDb()
    .update(schema.guideBlocks)
    .set({ position: siblings[j].position })
    .where(eq(schema.guideBlocks.id, siblings[i].id));
  await getDb()
    .update(schema.guideBlocks)
    .set({ position: siblings[i].position })
    .where(eq(schema.guideBlocks.id, siblings[j].id));
  refresh();
}

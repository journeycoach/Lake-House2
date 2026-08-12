"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { readText } from "@/lib/forms";

function refresh() {
  revalidatePath("/upkeep");
  revalidatePath("/calendar");
  revalidatePath("/");
}

export async function addEquipment(formData: FormData) {
  const user = await requireEditor();
  const name = readText(formData.get("name"), 200);
  if (!name) return;

  await getDb().insert(schema.equipment).values({
    name,
    category: readText(formData.get("category"), 120) || null,
    location: readText(formData.get("location"), 200) || null,
    manufacturer: readText(formData.get("manufacturer"), 200) || null,
    model: readText(formData.get("model"), 200) || null,
    serialNumber: readText(formData.get("serialNumber"), 200) || null,
    installedOn: String(formData.get("installedOn") ?? "") || null,
    warrantyUntil: String(formData.get("warrantyUntil") ?? "") || null,
    notes: readText(formData.get("notes"), 4000) || null,
    createdAt: new Date().toISOString(),
  });
  await logActivity(user, "added equipment", name);
  refresh();
}

export async function removeEquipment(formData: FormData) {
  const user = await requireEditor();
  const id = Number(formData.get("id"));
  if (!id) return;
  const item = await getDb().query.equipment.findFirst({
    where: eq(schema.equipment.id, id),
  });
  if (!item) return;
  await getDb().delete(schema.equipment).where(eq(schema.equipment.id, id));
  await logActivity(user, "removed equipment", item.name);
  refresh();
}

export async function addServiceRecord(formData: FormData) {
  const user = await requireEditor();
  const equipmentId = Number(formData.get("equipmentId"));
  const servicedOn = String(formData.get("servicedOn") ?? "");
  const serviceType = readText(formData.get("serviceType"), 200);
  if (!equipmentId || !servicedOn || !serviceType) return;

  const equipment = await getDb().query.equipment.findFirst({
    where: eq(schema.equipment.id, equipmentId),
  });
  if (!equipment) return;

  const rawCost = Number(formData.get("cost") || 0);
  const costCents = Number.isFinite(rawCost) && rawCost >= 0
    ? Math.round(rawCost * 100)
    : null;

  await getDb().insert(schema.serviceRecords).values({
    equipmentId,
    servicedOn,
    serviceType,
    provider: readText(formData.get("provider"), 200) || null,
    costCents,
    notes: readText(formData.get("notes"), 4000) || null,
    createdBy: user.name,
    createdAt: new Date().toISOString(),
  });
  await logActivity(
    user,
    "recorded equipment service",
    `${equipment.name}: ${serviceType}`
  );
  refresh();
}

export async function removeServiceRecord(formData: FormData) {
  const user = await requireEditor();
  const id = Number(formData.get("id"));
  if (!id) return;
  const record = await getDb().query.serviceRecords.findFirst({
    where: eq(schema.serviceRecords.id, id),
  });
  if (!record) return;
  await getDb()
    .delete(schema.serviceRecords)
    .where(eq(schema.serviceRecords.id, id));
  await logActivity(user, "removed an equipment service record", record.serviceType);
  refresh();
}

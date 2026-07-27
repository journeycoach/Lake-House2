"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { HOUSEHOLD_TOKENS } from "@/lib/colors";
import { readText } from "@/lib/forms";

function refresh() {
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/calendar");
}

function readRole(value: unknown): string {
  const v = String(value);
  return v === "admin" || v === "household" || v === "family" ? v : "family";
}

function readHouseholdColor(value: unknown): string {
  const color = String(value);
  return (HOUSEHOLD_TOKENS as readonly string[]).includes(color)
    ? color
    : "steel";
}

export async function addUser(formData: FormData) {
  await requireAdmin();
  const name = readText(formData.get("name"), 200);
  const email = readText(formData.get("email"), 254).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = readRole(formData.get("role"));
  const householdId = Number(formData.get("householdId") || 0) || null;
  if (!name || !email || password.length < 8) return;
  const existing = await getDb().query.users.findFirst({
    where: eq(schema.users.email, email),
  });
  if (existing) return;
  await getDb().insert(schema.users).values({
    name,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    householdId,
    createdAt: new Date().toISOString(),
  });
  refresh();
}

export async function resetPassword(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const password = String(formData.get("password") ?? "");
  if (!id || password.length < 8) return;
  await getDb()
    .update(schema.users)
    .set({ passwordHash: bcrypt.hashSync(password, 10) })
    .where(eq(schema.users.id, id));
  refresh();
}

export async function setRole(formData: FormData) {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  const role = readRole(formData.get("role"));
  if (!id || id === admin.id) return; // no self-demotion lockouts
  await getDb().update(schema.users).set({ role }).where(eq(schema.users.id, id));
  refresh();
}

export async function removeUser(formData: FormData) {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id || id === admin.id) return;
  await getDb().delete(schema.users).where(eq(schema.users.id, id));
  refresh();
}

export async function setHouseStatus(formData: FormData) {
  await requireAdmin();
  const value = readText(formData.get("value"), 200);
  if (!value) return;
  await getDb()
    .insert(schema.settings)
    .values({
      key: "house_status",
      value,
      updatedAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: schema.settings.key,
      set: { value, updatedAt: new Date().toISOString() },
    });
  revalidatePath("/", "layout");
}

export async function addHousehold(formData: FormData) {
  await requireAdmin();
  const name = readText(formData.get("name"), 200);
  const color = readHouseholdColor(formData.get("color"));
  if (!name) return;
  const existing = await getDb().query.households.findFirst({
    where: eq(schema.households.name, name),
  });
  if (existing) return;
  await getDb().insert(schema.households).values({ name, color });
  refresh();
}

export async function updateHousehold(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const name = readText(formData.get("name"), 200);
  const color = readHouseholdColor(formData.get("color"));
  if (!id || !name) return;

  const existing = await getDb().query.households.findFirst({
    where: eq(schema.households.name, name),
  });
  if (existing && existing.id !== id) return;

  await getDb()
    .update(schema.households)
    .set({ name, color })
    .where(eq(schema.households.id, id));
  refresh();
}

export async function setMemberHouseholds(formData: FormData) {
  await requireAdmin();
  const householdIds = new Set(
    (await getDb().select({ id: schema.households.id }).from(schema.households))
      .map((household) => household.id)
  );
  const userIds = [
    ...new Set(
      formData
        .getAll("userIds")
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0)
    ),
  ];

  await Promise.all(
    userIds.map((userId) => {
      const selectedId = Number(formData.get(`household-${userId}`));
      const householdId = householdIds.has(selectedId) ? selectedId : null;
      return getDb()
        .update(schema.users)
        .set({ householdId })
        .where(eq(schema.users.id, userId));
    })
  );
  refresh();
}

"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function refresh() {
  revalidatePath("/admin");
}

function readRole(value: unknown): string {
  const v = String(value);
  return v === "admin" || v === "household" || v === "family" ? v : "family";
}

export async function addUser(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
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
  const value = String(formData.get("value") ?? "").trim();
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
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "steel");
  if (!name) return;
  const existing = await getDb().query.households.findFirst({
    where: eq(schema.households.name, name),
  });
  if (existing) return;
  await getDb().insert(schema.households).values({ name, color });
  refresh();
}

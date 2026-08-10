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
  const color = readHouseholdColor(formData.get("color"));
  if (!name || !email || password.length < 8) return;
  const existing = await getDb().query.users.findFirst({
    where: eq(schema.users.email, email),
  });
  if (existing) return;
  const [household] = await getDb()
    .insert(schema.households)
    .values({ name, color })
    .onConflictDoUpdate({
      target: schema.households.name,
      set: { color },
    })
    .returning({ id: schema.households.id });
  await getDb().insert(schema.users).values({
    name,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    householdId: household.id,
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

export async function setUserColor(formData: FormData) {
  await requireAdmin();
  const userId = Number(formData.get("userId"));
  const color = readHouseholdColor(formData.get("color"));
  if (!Number.isInteger(userId) || userId < 1) return;

  const user = await getDb().query.users.findFirst({
    where: eq(schema.users.id, userId),
  });
  if (!user) return;

  if (user.householdId) {
    await getDb()
      .update(schema.households)
      .set({ color })
      .where(eq(schema.households.id, user.householdId));
  } else {
    const [household] = await getDb()
      .insert(schema.households)
      .values({ name: user.name, color })
      .onConflictDoUpdate({
        target: schema.households.name,
        set: { color },
      })
      .returning({ id: schema.households.id });
    await getDb()
      .update(schema.users)
      .set({ householdId: household.id })
      .where(eq(schema.users.id, userId));
  }
  refresh();
}

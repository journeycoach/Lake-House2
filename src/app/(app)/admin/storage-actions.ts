"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { clearHistoryBefore } from "@/lib/backup";
import { logActivity } from "@/lib/activity";

const KEEP_DAYS: Record<string, number> = {
  week: 7,
  month: 30,
  quarter: 90,
};

export async function clearHistory(formData: FormData) {
  const admin = await requireAdmin();
  const keep = String(formData.get("keep") ?? "");
  const days = KEEP_DAYS[keep];
  if (!days) return;

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const removed = await clearHistoryBefore(cutoff);

  await logActivity(
    admin,
    "cleared old history",
    `kept the last ${days} days, removed ${removed} entries`
  );
  revalidatePath("/admin");
  revalidatePath("/activity");
}

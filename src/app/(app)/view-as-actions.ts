"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";

const COOKIE = "lh_viewas";

/* Admin-only preview of a lower tier. The cookie is only ever honored for a
   real admin (checked in getEffectiveUser), so it is safe to set freely. */
export async function setViewAs(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return;
  const tier = String(formData.get("tier"));
  const store = await cookies();
  if (tier === "family" || tier === "household") {
    store.set(COOKIE, tier, { httpOnly: true, sameSite: "lax", path: "/" });
  } else {
    store.delete(COOKIE);
  }
  revalidatePath("/", "layout");
}

export async function clearViewAs() {
  const store = await cookies();
  store.delete(COOKIE);
  revalidatePath("/", "layout");
}

import "server-only";
import { db, schema } from "./db";

/* One line per meaningful action. Fire and forget from server actions. */
export async function logActivity(
  user: { id: number; name: string },
  action: string,
  detail?: string
) {
  await db.insert(schema.activityLog).values({
    userId: user.id,
    userName: user.name,
    action,
    detail: detail ?? null,
    at: new Date().toISOString(),
  });
}

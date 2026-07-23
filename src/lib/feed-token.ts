import "server-only";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { getDb, schema } from "./db";

const KEY = "calendar_feed_token";

/* One shared family token in the feed URL, created on first use. Rotating it
   (delete the settings row) invalidates every subscription at once. */
export async function getFeedToken(): Promise<string> {
  const row = await getDb().query.settings.findFirst({
    where: eq(schema.settings.key, KEY),
  });
  if (row) return row.value;
  const token = randomBytes(16).toString("hex");
  await getDb().insert(schema.settings).values({
    key: KEY,
    value: token,
    updatedAt: new Date().toISOString(),
  });
  return token;
}

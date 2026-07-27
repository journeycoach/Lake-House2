import "server-only";
import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "./db";

/*
  Single-use links for setting a password while signed out. The token is high
  entropy and random, so a plain SHA-256 of it is enough: we only ever store
  the hash, and a leaked database row cannot be turned back into a working
  link. (Password hashing needs bcrypt because passwords are low entropy and
  guessable. These are neither.)
*/

const HOUR_MS = 60 * 60 * 1000;

export type TokenPurpose = "reset" | "invite";

function hash(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createToken(
  userId: number,
  purpose: TokenPurpose,
  validForHours = 1
): Promise<string> {
  const token = crypto.randomBytes(32).toString("base64url");
  const now = Date.now();
  await getDb().insert(schema.passwordTokens).values({
    userId,
    tokenHash: hash(token),
    purpose,
    expiresAt: new Date(now + validForHours * HOUR_MS).toISOString(),
    createdAt: new Date(now).toISOString(),
  });
  return token;
}

/* Returns the user the token belongs to, or null if it is unknown, expired,
   or already spent. Does not consume it: call spendToken once the new
   password is actually saved. */
export async function readToken(token: string, purpose: TokenPurpose) {
  const row = await getDb().query.passwordTokens.findFirst({
    where: and(
      eq(schema.passwordTokens.tokenHash, hash(token)),
      eq(schema.passwordTokens.purpose, purpose)
    ),
  });
  if (!row) return null;
  if (row.usedAt) return null;
  if (new Date(row.expiresAt).getTime() < Date.now()) return null;
  return row;
}

export async function spendToken(id: number) {
  await getDb()
    .update(schema.passwordTokens)
    .set({ usedAt: new Date().toISOString() })
    .where(eq(schema.passwordTokens.id, id));
}

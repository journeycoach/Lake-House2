import { SignJWT, jwtVerify } from "jose";
import type { Role } from "./roles";
import { cookies } from "next/headers";

const COOKIE = "lh_session";
const MAX_AGE_DAYS = 30;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

export type SessionPayload = {
  uid: number;
  name: string;
  role: Role;
  // Session version at sign-in. Checked against the user's current version so
  // removing an account or changing a password kills sessions already issued.
  v: number;
};

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_DAYS}d`)
    .sign(secret());
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_DAYS * 24 * 60 * 60,
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      uid: payload.uid as number,
      name: payload.name as string,
      role: payload.role as Role,
      v: (payload.v as number) ?? 0,
    };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export { COOKIE as SESSION_COOKIE };

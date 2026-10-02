import "server-only";
import webpush from "web-push";
import { eq, inArray } from "drizzle-orm";
import { getDb, schema } from "./db";

/*
  Web Push replaces email for everything the app needs to tell a specific
  person: check-in/checkout reminders and overlap notices. There is no
  broadcast-to-everyone path; every send targets the user ids that are
  actually relevant, same as the old email recipient lists did.

  Without VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY set, sends are silently skipped
  so the app keeps working in any environment that hasn't configured push yet.
*/

export type PushPayload = {
  title: string;
  body: string;
  url?: string; // opened on notification click; defaults to "/"
};

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@paines.com";
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export type SubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

/* Saves (or refreshes) one device's subscription for a signed-in user. A
   person can have several rows, one per browser/device. */
export async function subscribeUser(
  userId: number,
  subscription: SubscriptionInput,
  userAgent?: string | null
) {
  await getDb()
    .insert(schema.pushSubscriptions)
    .values({
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: userAgent ?? null,
      createdAt: new Date().toISOString(),
    })
    .onConflictDoUpdate({
      target: schema.pushSubscriptions.endpoint,
      set: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: userAgent ?? null,
      },
    });
}

export async function unsubscribeEndpoint(endpoint: string) {
  await getDb()
    .delete(schema.pushSubscriptions)
    .where(eq(schema.pushSubscriptions.endpoint, endpoint));
}

/* Sends to every device belonging to the given users. A subscription that
   the browser has dropped (410 Gone, or 404 if the endpoint is simply
   unknown anymore) is removed so it stops being retried. */
export async function sendPushToUsers(userIds: number[], payload: PushPayload) {
  if (userIds.length === 0 || !ensureConfigured()) return;

  const subs = await getDb()
    .select()
    .from(schema.pushSubscriptions)
    .where(inArray(schema.pushSubscriptions.userId, userIds));

  const body = JSON.stringify(payload);

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body
        );
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await getDb()
            .delete(schema.pushSubscriptions)
            .where(eq(schema.pushSubscriptions.id, sub.id));
        }
      }
    })
  );
}

export async function sendPushToAdmins(payload: PushPayload) {
  const admins = await getDb()
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.role, "admin"));
  await sendPushToUsers(admins.map((a) => a.id), payload);
}

export async function sendPushToHousehold(
  householdId: number,
  payload: PushPayload
) {
  const members = await getDb()
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.householdId, householdId));
  await sendPushToUsers(members.map((m) => m.id), payload);
}

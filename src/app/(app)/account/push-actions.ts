"use server";

import { requireUser } from "@/lib/auth";
import { subscribeUser, unsubscribeEndpoint } from "@/lib/push";

export async function subscribePush(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}) {
  const user = await requireUser();
  await subscribeUser(user.id, subscription, subscription.userAgent);
}

export async function unsubscribePush(endpoint: string) {
  await requireUser();
  await unsubscribeEndpoint(endpoint);
}

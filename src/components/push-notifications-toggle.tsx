"use client";

import { useEffect, useState, useTransition } from "react";
import {
  subscribePush,
  unsubscribePush,
} from "@/app/(app)/account/push-actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

type Status = "checking" | "unsupported" | "off" | "on" | "denied";

/* Lets a person turn push notifications on or off for this browser. Each
   device subscribes independently: turning it on here only affects what
   this phone or laptop receives. */
export function PushNotificationsToggle() {
  const [status, setStatus] = useState<Status>("checking");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setStatus(sub ? "on" : "off"))
      .catch(() => setStatus("off"));
  }, []);

  function enable() {
    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          setStatus(permission === "denied" ? "denied" : "off");
          return;
        }
        const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!key) return;
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key),
        });
        const json = sub.toJSON();
        if (!json.keys?.p256dh || !json.keys?.auth) return;
        await subscribePush({
          endpoint: sub.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
          userAgent: navigator.userAgent,
        });
        setStatus("on");
      } catch {
        setStatus("off");
      }
    });
  }

  function disable() {
    startTransition(async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await unsubscribePush(sub.endpoint);
          await sub.unsubscribe();
        }
      } finally {
        setStatus("off");
      }
    });
  }

  if (status === "checking") return null;

  if (status === "unsupported") {
    return (
      <p className="text-sm text-ink-soft">
        This browser does not support push notifications here. On an iPhone,
        add Paine Pointe to your home screen first, then turn this on from
        there.
      </p>
    );
  }

  if (status === "denied") {
    return (
      <p className="text-sm text-ink-soft">
        Notifications are blocked for Paine Pointe in your browser or phone
        settings. Allow them there, then come back and turn this on.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-ink-soft">
        {status === "on"
          ? "On for this device: you'll get check-in, checkout, and overlap alerts."
          : "Get check-in, checkout, and overlap alerts on this device."}
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={status === "on" ? disable : enable}
        className={status === "on" ? "btn btn-quiet shrink-0" : "btn btn-primary shrink-0"}
      >
        {pending ? "Working" : status === "on" ? "Turn off" : "Turn on"}
      </button>
    </div>
  );
}

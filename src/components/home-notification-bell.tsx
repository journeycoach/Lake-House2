"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { BellIcon } from "./icons";

export type HomeNotification = {
  title: string;
  detail: string;
  href: string;
  urgent?: boolean;
};

export function HomeNotificationBell({
  notifications,
  variant = "light",
  align = "right",
}: {
  notifications: HomeNotification[];
  variant?: "light" | "dark";
  /** Which side of the bell the dropdown panel is anchored to. Use "left"
   *  when the bell sits near the left edge of a narrow container (like the
   *  desktop sidebar), so the panel opens rightward instead of spilling off
   *  the left edge of the viewport. */
  align?: "left" | "right";
}) {
  const hasNotifications = notifications.length > 0;
  const detailsRef = useRef<HTMLDetailsElement>(null);

  // Mirror the unread count onto the installed app's home-screen icon
  // (iOS/Android PWA badging) so it's visible without opening the app.
  useEffect(() => {
    if (!("setAppBadge" in navigator)) return;
    if (notifications.length > 0) {
      navigator.setAppBadge(notifications.length).catch(() => {});
    } else {
      navigator.clearAppBadge?.().catch(() => {});
    }
  }, [notifications.length]);

  // Close the dropdown on any click outside it (e.g. tapping a nav link),
  // since <details> only closes natively when its own summary is clicked.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const details = detailsRef.current;
      if (details?.open && !details.contains(event.target as Node)) {
        details.open = false;
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const inactiveClass =
    variant === "dark"
      ? "border-white/25 text-white hover:bg-white/10"
      : "border-sand-line bg-card text-ink-soft hover:bg-mist";

  return (
    <details ref={detailsRef} className="group relative shrink-0">
      <summary
        aria-label={
          hasNotifications
            ? `${notifications.length} notifications`
            : "Notifications"
        }
        className={`relative flex h-11 w-11 cursor-pointer list-none flex-col items-center justify-center gap-0.5 rounded-lh border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-water [&::-webkit-details-marker]:hidden ${inactiveClass}`}
      >
        <span aria-hidden="true" className="leading-none">
          <BellIcon className="h-4 w-4" />
        </span>
        <span className="text-[8px] font-semibold leading-none">Alerts</span>
        {hasNotifications ? (
          <span
            aria-hidden="true"
            className={`absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 px-1 text-[10px] font-bold leading-none text-white ${variant === "dark" ? "border-deep" : "border-card"} bg-care`}
          >
            {notifications.length > 9 ? "9+" : notifications.length}
          </span>
        ) : null}
      </summary>
      <div
        className={`absolute top-12 z-40 w-[min(20rem,calc(100vw-2rem))] rounded-lh border border-sand-line bg-card p-3 text-ink shadow-xl ${
          align === "left" ? "left-0" : "right-0"
        }`}
      >
        <p className="section-label mb-2">Notifications</p>
        {hasNotifications ? (
          <ul className="space-y-2">
            {notifications.map((notification, index) => (
              <li key={`${notification.title}-${index}`}>
                <Link
                  href={notification.href}
                  onClick={() => {
                    if (detailsRef.current) detailsRef.current.open = false;
                  }}
                  className={`block rounded-md border p-3 transition-colors hover:bg-mist ${
                    notification.urgent
                      ? "border-care/30 bg-care/5"
                      : "border-sand-line bg-white"
                  }`}
                >
                  <span className="block text-sm font-semibold">
                    {notification.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-soft">
                    {notification.detail}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-md bg-mist px-3 py-3 text-sm text-ink-soft">
            You’re all caught up.
          </p>
        )}
      </div>
    </details>
  );
}

"use client";

import Link from "next/link";
import { useRef } from "react";

export type HomeNotification = {
  title: string;
  detail: string;
  href: string;
  urgent?: boolean;
};

export function HomeNotificationBell({
  notifications,
  variant = "light",
}: {
  notifications: HomeNotification[];
  variant?: "light" | "dark";
}) {
  const hasNotifications = notifications.length > 0;
  const detailsRef = useRef<HTMLDetailsElement>(null);
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
        <span aria-hidden="true" className="text-sm leading-none">
          🔔
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
      <div className="absolute right-0 top-12 z-40 w-[min(20rem,calc(100vw-2rem))] rounded-lh border border-sand-line bg-card p-3 text-ink shadow-xl">
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

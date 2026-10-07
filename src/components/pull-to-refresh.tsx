"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

const REFRESH_DISTANCE = 76;
const MAX_PULL = 112;

export function PullToRefresh() {
  const router = useRouter();
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const startY = useRef<number | null>(null);
  const isTracking = useRef(false);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onTouchStart(event: TouchEvent) {
      if (window.scrollY > 0 || event.touches.length !== 1) return;

      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("a, button, input, select, textarea, [contenteditable='true']")
      ) {
        return;
      }

      startY.current = event.touches[0].clientY;
      isTracking.current = true;
    }

    function onTouchMove(event: TouchEvent) {
      if (!isTracking.current || startY.current === null || event.touches.length !== 1) {
        return;
      }

      const distance = event.touches[0].clientY - startY.current;
      if (distance <= 0) {
        setPullDistance(0);
        return;
      }

      // Once the gesture is clearly a downward pull, take over from the
      // browser's native refresh gesture so the app can refresh in place.
      if (distance > 8) event.preventDefault();
      setPullDistance(Math.min(distance * 0.8, MAX_PULL));
    }

    function onTouchEnd() {
      if (!isTracking.current) return;

      isTracking.current = false;
      startY.current = null;
      setPullDistance(0);

      if (pullDistance >= REFRESH_DISTANCE && !refreshing && !isPending) {
        setRefreshing(true);
        startTransition(() => router.refresh());
        if (refreshTimer.current) clearTimeout(refreshTimer.current);
        refreshTimer.current = setTimeout(() => setRefreshing(false), 3000);
      }
    }

    function onTouchCancel() {
      isTracking.current = false;
      startY.current = null;
      setPullDistance(0);
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [isPending, pullDistance, refreshing, router]);

  useEffect(
    () => () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    },
    []
  );

  const visible = pullDistance > 0 || refreshing || isPending;
  const ready = pullDistance >= REFRESH_DISTANCE;
  const message = refreshing || isPending
    ? "Refreshing…"
    : ready
      ? "Release to refresh"
      : "Pull to refresh";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed left-1/2 top-[max(8px,env(safe-area-inset-top))] z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full bg-deep px-4 py-2 text-xs font-semibold text-white shadow-lg transition-[opacity,transform] duration-150 ${
        visible ? "opacity-100" : "-translate-y-16 opacity-0"
      }`}
      style={
        visible && !refreshing && !isPending
          ? { transform: `translate(-50%, ${Math.min(pullDistance, 50)}px)` }
          : undefined
      }
    >
      <span
        aria-hidden="true"
        className={`text-base leading-none ${refreshing || isPending ? "animate-spin" : ""}`}
      >
        {refreshing || isPending ? "⟳" : "↓"}
      </span>
      {message}
    </div>
  );
}

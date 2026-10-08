"use client";

import type { ButtonHTMLAttributes } from "react";

/**
 * Drop-in replacement for <button> that fires a short vibration on tap
 * before letting the click (and any enclosing form submit) proceed as
 * normal. No-ops silently on devices/browsers without the Vibration API
 * (e.g. iOS Safari).
 */
export function HapticButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { onClick, ...rest } = props;
  return (
    <button
      {...rest}
      onClick={(event) => {
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate(10);
        }
        onClick?.(event);
      }}
    />
  );
}

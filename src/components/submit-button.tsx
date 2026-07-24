"use client";

import { useFormStatus } from "react-dom";

/*
  Submit button with immediate press feedback: the instant a server action is
  in flight the button disables and dims, so the click always shows a response
  well inside the 100ms cause-and-effect window.
*/
export function SubmitButton({
  children,
  pendingLabel,
  className = "btn btn-primary",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? (pendingLabel ?? children) : children}
    </button>
  );
}

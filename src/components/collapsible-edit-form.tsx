"use client";

import { useRef } from "react";

/*
  Wraps an edit form that lives inside a native <details> disclosure. On a
  successful submit, closes the nearest enclosing <details> so the form
  collapses back to the summary view instead of staying open.
*/
export function CollapsibleEditForm({
  action,
  children,
  className,
}: {
  action: (formData: FormData) => Promise<unknown> | unknown;
  children: React.ReactNode;
  className?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className={className}
      action={async (formData: FormData) => {
        await action(formData);
        const details = formRef.current?.closest("details");
        if (details) details.open = false;
      }}
    >
      {children}
    </form>
  );
}

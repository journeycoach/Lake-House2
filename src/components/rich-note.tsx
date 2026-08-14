import { noteDisplayHtml } from "@/lib/note-rich-text";

export function RichNote({
  body,
  className = "",
}: {
  body: string;
  className?: string;
}) {
  return (
    <div
      className={`rich-note text-sm text-ink ${className}`}
      dangerouslySetInnerHTML={{ __html: noteDisplayHtml(body) }}
    />
  );
}

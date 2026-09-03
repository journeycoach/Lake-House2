"use client";

import { useRef, useState, type ReactNode } from "react";

function ToolButton({
  title,
  children,
  onClick,
}: {
  title: string;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="flex h-8 min-w-8 items-center justify-center rounded-md border border-sand-line bg-white px-2 text-xs font-semibold text-ink-soft hover:border-water hover:bg-water-tint hover:text-deep-2"
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  initialHtml = "",
}: {
  initialHtml?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const [html, setHtml] = useState(initialHtml);
  const [hasContent, setHasContent] = useState(
    () => initialHtml.replace(/<[^>]*>/g, "").trim().length > 0
  );

  function rememberSelection() {
    const selection = window.getSelection();
    const editor = editorRef.current;
    if (
      !editor ||
      !selection ||
      selection.rangeCount === 0 ||
      !editor.contains(selection.anchorNode)
    ) {
      return;
    }
    selectionRef.current = selection.getRangeAt(0).cloneRange();
  }

  function restoreSelection() {
    const selection = window.getSelection();
    if (!selectionRef.current || !selection) return;
    selection.removeAllRanges();
    selection.addRange(selectionRef.current);
  }

  function syncEditor() {
    const editor = editorRef.current;
    if (!editor) return;
    setHtml(editor.innerHTML);
    setHasContent(Boolean(editor.textContent?.trim()));
    rememberSelection();
  }

  function runCommand(command: string, value?: string) {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand(command, false, value);
    syncEditor();
  }

  function addLink() {
    rememberSelection();
    const entered = window.prompt("Paste or type the web address");
    if (!entered) return;
    const url = /^(https?:|mailto:|tel:)/i.test(entered)
      ? entered
      : `https://${entered}`;
    runCommand("createLink", url);
  }

  return (
    <div className="overflow-hidden rounded-lh border border-sand-line bg-white focus-within:border-water focus-within:ring-2 focus-within:ring-water/10">
      <div
        role="toolbar"
        aria-label="Note formatting"
        className="flex flex-wrap items-center gap-1.5 border-b border-sand-line bg-mist/70 p-2"
      >
        <ToolButton title="Bold" onClick={() => runCommand("bold")}>
          <span className="text-sm font-bold">B</span>
        </ToolButton>
        <ToolButton title="Italic" onClick={() => runCommand("italic")}>
          <span className="text-sm italic">I</span>
        </ToolButton>
        <ToolButton title="Underline" onClick={() => runCommand("underline")}>
          <span className="text-sm underline">U</span>
        </ToolButton>
        <ToolButton title="Strikethrough" onClick={() => runCommand("strikeThrough")}>
          <span className="text-sm line-through">S</span>
        </ToolButton>

        <select
          aria-label="Text size"
          title="Text size"
          defaultValue="3"
          onMouseDown={rememberSelection}
          onChange={(event) => runCommand("fontSize", event.target.value)}
          className="h-8 rounded-md border border-sand-line bg-white px-2 text-xs font-medium text-ink-soft"
        >
          <option value="2">Small</option>
          <option value="3">Normal</option>
          <option value="5">Large</option>
          <option value="6">Title</option>
        </select>

        <label
          title="Text color"
          className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-sand-line bg-white px-2 text-xs font-medium text-ink-soft hover:border-water"
          onMouseDown={rememberSelection}
        >
          Color
          <input
            type="color"
            aria-label="Text color"
            defaultValue="#173e42"
            onChange={(event) => runCommand("foreColor", event.target.value)}
            className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
          />
        </label>

        <ToolButton title="Add link" onClick={addLink}>Link</ToolButton>
        <ToolButton title="Bulleted list" onClick={() => runCommand("insertUnorderedList")}>
          • List
        </ToolButton>
        <ToolButton title="Numbered list" onClick={() => runCommand("insertOrderedList")}>
          1. List
        </ToolButton>
        <ToolButton title="Quote" onClick={() => runCommand("formatBlock", "blockquote")}>
          Quote
        </ToolButton>
        <ToolButton title="Align left" onClick={() => runCommand("justifyLeft")}>
          Left
        </ToolButton>
        <ToolButton title="Center" onClick={() => runCommand("justifyCenter")}>
          Center
        </ToolButton>
        <ToolButton title="Undo" onClick={() => runCommand("undo")}>Undo</ToolButton>
        <ToolButton title="Redo" onClick={() => runCommand("redo")}>Redo</ToolButton>
        <ToolButton title="Clear formatting" onClick={() => runCommand("removeFormat")}>
          Clear
        </ToolButton>
      </div>

      <div className="relative">
        {!hasContent ? (
          <span className="pointer-events-none absolute left-3 top-3 text-sm text-ink-faint">
            The lake is high this week, tie everything down.
          </span>
        ) : null}
        <div
          ref={editorRef}
          contentEditable
          role="textbox"
          aria-label="The note"
          aria-multiline="true"
          aria-required="true"
          suppressContentEditableWarning
          onInput={syncEditor}
          onKeyUp={rememberSelection}
          onMouseUp={rememberSelection}
          onPaste={(event) => {
            event.preventDefault();
            document.execCommand(
              "insertText",
              false,
              event.clipboardData.getData("text/plain")
            );
            syncEditor();
          }}
          className="rich-note min-h-32 px-3 py-3 text-sm outline-none"
          {...(initialHtml ? { dangerouslySetInnerHTML: { __html: initialHtml } } : {})}
        />
      </div>
      <input type="hidden" name="body" value={html} />
    </div>
  );
}

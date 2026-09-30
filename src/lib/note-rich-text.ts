import sanitizeHtml from "sanitize-html";

const RICH_NOTE_PREFIX = "<!--paine-pointe-rich-note-->";

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "div",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "h2",
    "h3",
    "blockquote",
    "ul",
    "ol",
    "li",
    "a",
    "font",
    "center",
    "img",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt"],
    font: ["color", "size"],
    p: ["style"],
    div: ["style"],
    h2: ["style"],
    h3: ["style"],
    blockquote: ["style"],
  },
  allowedStyles: {
    "*": {
      "text-align": [/^(?:left|center|right)$/],
    },
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesAppliedToAttributes: ["href"],
  transformTags: {
    a: (_tagName, attributes) => ({
      tagName: "a",
      attribs: {
        ...attributes,
        target: "_blank",
        rel: "noopener noreferrer",
      },
    }),
  },
  exclusiveFilter: (frame) => {
    if (frame.tag !== "img") return false;
    try {
      const imageUrl = new URL(frame.attribs.src ?? "");
      return (
        imageUrl.protocol !== "https:" ||
        !imageUrl.hostname.endsWith(".blob.vercel-storage.com")
      );
    } catch {
      return true;
    }
  },
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function stripRichPrefix(value: string) {
  return value.startsWith(RICH_NOTE_PREFIX)
    ? value.slice(RICH_NOTE_PREFIX.length)
    : value;
}

export function notePlainText(value: string) {
  return sanitizeHtml(stripRichPrefix(value), {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replaceAll("&nbsp;", " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeNoteForStorage(value: string) {
  const cleanHtml = sanitizeHtml(stripRichPrefix(value), SANITIZE_OPTIONS).trim();
  if (!notePlainText(cleanHtml) && !/<img\b/i.test(cleanHtml)) return "";
  return `${RICH_NOTE_PREFIX}${cleanHtml}`;
}

export function noteDisplayHtml(value: string) {
  if (value.startsWith(RICH_NOTE_PREFIX)) {
    return sanitizeHtml(stripRichPrefix(value), SANITIZE_OPTIONS);
  }
  return escapeHtml(value).replace(/\r?\n/g, "<br>");
}

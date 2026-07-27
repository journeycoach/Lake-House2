import "server-only";

/*
  Branded shell for every message the app sends. Email clients strip external
  stylesheets and webfonts, so this is table-based with inline styles and a
  serif stack that degrades sensibly. Every message also carries a plain-text
  version, which is what most spam filters actually read.
*/

const DEEP = "#123236";
const MIST = "#eef0ea";
const CARD = "#fbfbf8";
const INK = "#1e2b2a";
const INK_SOFT = "#48605d";
const INK_FAINT = "#567069";
const RUST = "#b0552f";
const LINE = "#e6e2d4";
const SERIF = "Newsreader, Georgia, 'Times New Roman', serif";
const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

export function siteUrl(): string {
  const raw =
    process.env.SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://paines.com");
  return raw.replace(/\/$/, "");
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type EmailBlock =
  | { type: "text"; text: string }
  | { type: "button"; label: string; href: string }
  | { type: "detail"; label: string; value: string }
  | { type: "quiet"; text: string };

/* Returns both halves of the message: HTML for clients that render it, and
   plain text for those that do not. */
export function renderEmail({
  heading,
  preview,
  blocks,
}: {
  heading: string;
  preview: string;
  blocks: EmailBlock[];
}): { html: string; text: string } {
  const url = siteUrl();

  const body = blocks
    .map((b) => {
      if (b.type === "text") {
        return `<p style="margin:0 0 16px;font-family:${SANS};font-size:16px;line-height:1.6;color:${INK};">${esc(
          b.text
        )}</p>`;
      }
      if (b.type === "quiet") {
        return `<p style="margin:0 0 16px;font-family:${SANS};font-size:14px;line-height:1.6;color:${INK_FAINT};">${esc(
          b.text
        )}</p>`;
      }
      if (b.type === "detail") {
        return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px;"><tr>
<td style="font-family:${SANS};font-size:14px;color:${INK_FAINT};padding-right:8px;">${esc(
          b.label
        )}</td>
<td style="font-family:${SANS};font-size:14px;color:${INK};font-weight:600;">${esc(
          b.value
        )}</td>
</tr></table>`;
      }
      return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;"><tr>
<td style="background:${RUST};border-radius:8px;">
<a href="${esc(
        b.href
      )}" style="display:inline-block;padding:13px 24px;font-family:${SANS};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${esc(
        b.label
      )}</a>
</td></tr></table>`;
    })
    .join("\n");

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${esc(heading)}</title></head>
<body style="margin:0;padding:0;background:${MIST};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${MIST};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

<tr><td style="background:${DEEP};border-radius:8px 8px 0 0;padding:24px 32px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="padding-right:12px;">
<div style="width:40px;height:40px;border:1px solid rgba(255,255,255,0.25);border-radius:8px;text-align:center;line-height:40px;font-family:${SERIF};font-size:15px;color:#ffffff;">LH</div>
</td>
<td>
<div style="font-family:${SERIF};font-size:18px;color:#ffffff;line-height:1.2;">The Lakehouse</div>
<div style="font-family:${SANS};font-size:12px;color:rgba(255,255,255,0.55);">Our family place</div>
</td>
</tr></table>
</td></tr>

<tr><td style="background:${CARD};padding:32px;border-left:1px solid ${LINE};border-right:1px solid ${LINE};">
<h1 style="margin:0 0 16px;font-family:${SERIF};font-size:26px;line-height:1.25;font-weight:400;color:${INK};">${esc(
    heading
  )}</h1>
${body}
</td></tr>

<tr><td style="background:${CARD};border-radius:0 0 8px 8px;border:1px solid ${LINE};border-top:none;padding:20px 32px;">
<p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.6;color:${INK_FAINT};">
Sent by the family lakehouse site. <a href="${url}" style="color:${INK_SOFT};">${esc(
    url.replace(/^https?:\/\//, "")
  )}</a>
</p>
</td></tr>

</table>
</td></tr></table>
</body></html>`;

  const text = [
    heading,
    "",
    ...blocks.map((b) => {
      if (b.type === "button") return `${b.label}: ${b.href}`;
      if (b.type === "detail") return `${b.label} ${b.value}`;
      return b.text;
    }),
    "",
    "Sent by the family lakehouse site.",
    url,
  ].join("\n");

  return { html, text };
}

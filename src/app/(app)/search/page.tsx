import type { Metadata } from "next";
import { and, ilike, ne, or } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { meetsRole } from "@/lib/roles";
import { getDb, schema } from "@/lib/db";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Search · Paine Pointe" };

type Result = {
  href: string;
  title: string;
  snippet: string;
  source: string;
};

/* Notes are stored as lightweight markdown; strip the syntax so results
   read as plain text, then center the excerpt on the match. */
function excerpt(text: string, query: string, length = 160): string {
  const clean = text
    .replace(/[#*_`>[\]()~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const lower = clean.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) {
    return clean.length > length ? `${clean.slice(0, length)}…` : clean;
  }
  const start = Math.max(0, idx - 40);
  const end = Math.min(clean.length, idx + query.length + 100);
  return `${start > 0 ? "…" : ""}${clean.slice(start, end)}${end < clean.length ? "…" : ""}`;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const results: Result[] = [];

  if (q.length >= 2) {
    const like = `%${q}%`;
    const db = getDb();

    const notes = await db
      .select()
      .from(schema.notes)
      .where(ilike(schema.notes.body, like));
    for (const n of notes) {
      results.push({
        href: "/notes",
        title: `Note · ${n.tag}`,
        snippet: excerpt(n.body, q),
        source: "FYI Everyone",
      });
    }

    const sections = await db
      .select()
      .from(schema.guideSections)
      .where(
        or(
          ilike(schema.guideSections.title, like),
          ilike(schema.guideSections.body, like)
        )
      );
    for (const s of sections) {
      if (!meetsRole(user.effectiveRole, s.minRole)) continue;
      results.push({
        href: "/guide",
        title: s.title,
        snippet: excerpt(s.body || s.title, q),
        source: "House guide",
      });
    }

    const blocks = await db
      .select()
      .from(schema.guideBlocks)
      .where(
        and(
          ne(schema.guideBlocks.kind, "secret"),
          or(
            ilike(schema.guideBlocks.label, like),
            ilike(schema.guideBlocks.value, like)
          )
        )
      );
    for (const b of blocks) {
      if (!meetsRole(user.effectiveRole, b.minRole)) continue;
      // Photo values are image URLs/data URIs, not readable text — never
      // snippet from them, even on the rare label match.
      const snippetSource = b.kind === "photo" ? (b.label ?? "Photo") : b.value;
      results.push({
        href: "/guide",
        title: b.label ?? "House guide",
        snippet: excerpt(snippetSource, q),
        source: "House guide",
      });
    }

    const fixes = await db
      .select()
      .from(schema.fixit)
      .where(
        or(
          ilike(schema.fixit.title, like),
          ilike(schema.fixit.details, like),
          ilike(schema.fixit.location, like)
        )
      );
    for (const f of fixes) {
      results.push({
        href: "/upkeep",
        title: f.title,
        snippet: excerpt(
          [f.location, f.details].filter(Boolean).join(" — ") || f.title,
          q
        ),
        source: "Property care",
      });
    }

    const items = await db
      .select()
      .from(schema.checklist)
      .where(
        or(
          ilike(schema.checklist.title, like),
          ilike(schema.checklist.details, like)
        )
      );
    for (const i of items) {
      results.push({
        href: "/checklist",
        title: i.title,
        snippet: excerpt(i.details || i.title, q),
        source: "Shopping list",
      });
    }

    const equip = await db
      .select()
      .from(schema.equipment)
      .where(
        or(
          ilike(schema.equipment.name, like),
          ilike(schema.equipment.notes, like),
          ilike(schema.equipment.manufacturer, like),
          ilike(schema.equipment.model, like)
        )
      );
    for (const e of equip) {
      results.push({
        href: "/upkeep?tab=maintenance",
        title: e.name,
        snippet: excerpt(
          [e.category, e.manufacturer, e.model, e.notes]
            .filter(Boolean)
            .join(" — ") || e.name,
          q
        ),
        source: "Property care",
      });
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Search" />

      <form action="/search" method="GET" className="card p-4 sm:p-6">
        <label htmlFor="q" className="flabel">
          Search notes, the house guide, fix-it list, shopping list, and
          equipment
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            autoFocus
            placeholder="wifi password, propane, dock..."
            className="field flex-1"
          />
          <button type="submit" className="btn btn-primary shrink-0">
            Search
          </button>
        </div>
      </form>

      {q.length > 0 && q.length < 2 ? (
        <p className="mt-4 text-sm text-ink-soft">
          Keep typing — at least 2 characters.
        </p>
      ) : null}

      {q.length >= 2 ? (
        <div className="mt-4">
          <p className="text-sm text-ink-soft">
            {results.length === 0
              ? `No matches for "${q}".`
              : `${results.length} ${results.length === 1 ? "match" : "matches"} for "${q}"`}
          </p>
          <ul className="mt-3 space-y-3">
            {results.map((r, i) => (
              <li key={i} className="card p-4">
                <a href={r.href} className="block">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                    {r.source}
                  </p>
                  <p className="font-display mt-0.5 text-lg text-water hover:text-deep-2">
                    {r.title}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">{r.snippet}</p>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

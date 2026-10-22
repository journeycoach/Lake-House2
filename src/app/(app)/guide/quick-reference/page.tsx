import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { canEdit, meetsRole } from "@/lib/roles";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "../section-card";

export const metadata: Metadata = { title: "Quick Reference · Paine Pointe" };

const BackToGuide = (
  <Link href="/guide" className="btn btn-quiet">
    ← Back to House Guide
  </Link>
);

export default async function QuickReferencePage() {
  const user = await requireUser();
  const editor = canEdit(user.effectiveRole);

  const sections = await getDb()
    .select()
    .from(schema.guideSections)
    .orderBy(asc(schema.guideSections.position));

  // Matched by title the same way the main House Guide page recognizes its
  // other special cards (Arrival/Departure/Boat checklists), so renaming the
  // section back to "Quick Reference" is all it takes to reconnect this view.
  const section = sections.find(
    (s) => s.title.toLowerCase().replace(/[^a-z]/g, "") === "quickreference"
  );
  const visible = section && meetsRole(user.effectiveRole, section.minRole);

  const blocks = visible
    ? (
        await getDb()
          .select()
          .from(schema.guideBlocks)
          .where(eq(schema.guideBlocks.sectionId, section.id))
          .orderBy(asc(schema.guideBlocks.position))
      ).filter((b) => meetsRole(user.effectiveRole, b.minRole))
    : [];

  if (!visible) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Quick Reference" action={BackToGuide} />
        <section className="card p-4 sm:p-6">
          <p className="text-sm text-ink-soft">
            There is no Quick Reference card in the House Guide right now.
            {editor
              ? " Add a section titled “Quick Reference” there and it will show up here."
              : ""}
          </p>
          <Link
            href="/guide"
            className="mt-4 inline-block text-sm font-semibold text-water hover:text-deep-2"
          >
            Go to House Guide →
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Quick Reference" action={BackToGuide} />
      <SectionCard section={section} blocks={blocks} canEdit={editor} />
    </div>
  );
}

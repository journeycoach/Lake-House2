import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { canEdit, meetsRole } from "@/lib/roles";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "./section-card";
import { AddSection } from "./add-section";

export const metadata: Metadata = { title: "House guide · Paine Pointe" };

export default async function GuidePage() {
  const user = await requireUser();
  const editor = canEdit(user.effectiveRole);

  const [sections, blocks] = await Promise.all([
    getDb()
      .select()
      .from(schema.guideSections)
      .orderBy(asc(schema.guideSections.position)),
    getDb()
      .select()
      .from(schema.guideBlocks)
      .orderBy(asc(schema.guideBlocks.position)),
  ]);

  /* Restricted content is filtered out here, on the server, so anything a
     person is not allowed to see is never sent to their browser at all. */
  const visibleSections = sections.filter((s) =>
    meetsRole(user.effectiveRole, s.minRole)
  );
  const visibleBlocks = blocks.filter((b) =>
    meetsRole(user.effectiveRole, b.minRole)
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="House guide" />
      <section>
        <p className="text-sm text-ink-soft">
          Everything about arriving, lake days, emergencies, and looking after
          the house. {editor ? "Family and admins can add to it." : null}
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleSections.map((s, i) => (
            <SectionCard
              key={s.id}
              section={s}
              blocks={visibleBlocks.filter((b) => b.sectionId === s.id)}
              canEdit={editor}
              isFirst={i === 0}
              isLast={i === visibleSections.length - 1}
            />
          ))}
        </div>

        {visibleSections.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">
            Nothing in the guide yet.
          </p>
        ) : null}

        {editor ? <AddSection /> : null}
      </section>
    </div>
  );
}

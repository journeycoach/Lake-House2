import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { guideSections } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "./section-card";

export const metadata: Metadata = { title: "House guide · The Lakehouse" };

export default async function GuidePage() {
  const user = await requireUser();
  const editor = canEdit(user.effectiveRole);
  const sections = await guideSections();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="House guide" />
      <section>
        <p className="text-sm text-ink-soft">
          Practical information for arrivals, lake days, emergencies, and caring
          for the house. Anyone can edit a section.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
            <SectionCard key={s.id} section={s} canEdit={editor} />
          ))}
        </div>
      </section>
    </div>
  );
}

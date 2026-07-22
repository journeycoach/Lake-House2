import type { Metadata } from "next";
import { guideSections } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { SectionCard } from "./section-card";

export const metadata: Metadata = { title: "House guide · The Lakehouse" };

export default async function GuidePage() {
  const sections = await guideSections();

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="House guide" />
      <section>
        <p className="section-label">House guide</p>
        <h2 className="font-display text-2xl mt-1">
          Everything the family needs to know
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Practical information for arrivals, lake days, emergencies, and caring
          for the house. Anyone can edit a section.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
            <SectionCard key={s.id} section={s} />
          ))}
        </div>
      </section>
    </div>
  );
}

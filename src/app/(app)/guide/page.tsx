import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { canEdit, meetsRole } from "@/lib/roles";
import { todayISO } from "@/lib/dates";
import { allStays, staysNow, staysUpcoming } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { StayChecklistPhase } from "../calendar/stay-checklist";
import { SectionCard } from "./section-card";
import { AddSection } from "./add-section";
import { StayChecklistSetup } from "./stay-checklist-setup";

export const metadata: Metadata = { title: "House guide · Paine Pointe" };

export default async function GuidePage() {
  const user = await requireUser();
  const editor = canEdit(user.effectiveRole);
  const admin = user.effectiveRole === "admin";

  const [sections, blocks, stays, stayTemplates, stayCompletions] = await Promise.all([
    getDb()
      .select()
      .from(schema.guideSections)
      .orderBy(asc(schema.guideSections.position)),
    getDb()
      .select()
      .from(schema.guideBlocks)
      .orderBy(asc(schema.guideBlocks.position)),
    allStays(),
    getDb()
      .select()
      .from(schema.stayChecklistTemplates)
      .where(eq(schema.stayChecklistTemplates.active, 1))
      .orderBy(
        asc(schema.stayChecklistTemplates.phase),
        asc(schema.stayChecklistTemplates.position)
      ),
    getDb().select().from(schema.stayChecklistCompletions),
  ]);

  const today = todayISO();
  const checklistStay = [
    ...staysNow(stays, today),
    ...staysUpcoming(stays, today),
  ][0] ?? null;
  const completionByTemplate = new Map(
    stayCompletions
      .filter((completion) => completion.stayId === checklistStay?.id)
      .map((completion) => [completion.templateId, completion])
  );
  const arrivalItems = stayTemplates
    .filter((template) => template.phase === "checkin")
    .map((template) => {
      const completion = completionByTemplate.get(template.id);
      return {
        id: template.id,
        phase: template.phase,
        title: template.title,
        done: Boolean(completion),
        checkedBy: completion?.checkedBy ?? null,
      };
    });

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

        {admin ? <StayChecklistSetup templates={stayTemplates} /> : null}

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleSections.map((s, i) => {
            const isArrivalChecklist =
              s.title.toLowerCase().replace(/[^a-z]/g, "") ===
              "arrivalchecklist";
            return (
              <SectionCard
                key={s.id}
                section={s}
                blocks={visibleBlocks.filter((b) => b.sectionId === s.id)}
                canEdit={editor}
                isFirst={i === 0}
                isLast={i === visibleSections.length - 1}
                anchorId={isArrivalChecklist ? "arrival-check-list" : undefined}
                checklistEditHref={
                  isArrivalChecklist && admin ? "#stay-checklist-setup" : undefined
                }
                stayChecklist={
                  isArrivalChecklist ? (
                    checklistStay ? (
                      <div>
                        <p className="mb-2 text-xs text-ink-soft">
                          For <span className="font-semibold">{checklistStay.label}</span>. These check-offs reset for every reservation.
                        </p>
                        <StayChecklistPhase
                          label="Arrival steps"
                          stayId={checklistStay.id}
                          items={arrivalItems}
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-ink-soft">
                          Schedule a stay to start a fresh arrival checklist.
                        </p>
                        <Link
                          href="/calendar#plan"
                          className="mt-2 inline-block text-sm font-semibold text-water hover:text-deep-2"
                        >
                          Plan a stay
                        </Link>
                      </div>
                    )
                  ) : undefined
                }
              />
            );
          })}
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

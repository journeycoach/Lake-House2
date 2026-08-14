import type { Metadata } from "next";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { canEdit, meetsRole } from "@/lib/roles";
import { todayISO } from "@/lib/dates";
import { allStays, staysNow, staysUpcoming } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { canUpdateStayChecklist } from "@/lib/stay-checklist-access";
import { StayChecklistPhase } from "../calendar/stay-checklist";
import { SectionCard } from "./section-card";
import { AddSection } from "./add-section";

export const metadata: Metadata = { title: "House guide · Paine Pointe" };

export default async function GuidePage() {
  const user = await requireUser();
  const editor = canEdit(user.effectiveRole);
  const admin = user.effectiveRole === "admin";

  const [sections, blocks, stays, stayChecklistItems] = await Promise.all([
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
      .from(schema.stayChecklistItems)
      .orderBy(
        asc(schema.stayChecklistItems.phase),
        asc(schema.stayChecklistItems.position)
      ),
  ]);

  const today = todayISO();
  const checklistStay = [
    ...staysNow(stays, today),
    ...staysUpcoming(stays, today),
  ][0] ?? null;
  const arrivalItems = stayChecklistItems
    .filter((item) => item.stayId === checklistStay?.id && item.phase === "checkin")
    .map((item) => ({
      id: item.id,
      phase: item.phase,
      title: item.title,
      done: Boolean(item.checkedAt),
      checkedBy: item.checkedBy,
      checkedAt: item.checkedAt,
    }));
  const departureItems = stayChecklistItems
    .filter((item) => item.stayId === checklistStay?.id && item.phase === "checkout")
    .map((item) => ({
      id: item.id,
      phase: item.phase,
      title: item.title,
      done: Boolean(item.checkedAt),
      checkedBy: item.checkedBy,
      checkedAt: item.checkedAt,
    }));
  const boatItems = stayChecklistItems
    .filter((item) => item.stayId === checklistStay?.id && item.phase === "boat")
    .map((item) => ({
      id: item.id,
      phase: item.phase,
      title: item.title,
      done: Boolean(item.checkedAt),
      checkedBy: item.checkedBy,
      checkedAt: item.checkedAt,
    }));

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
          {visibleSections.map((s, i) => {
            const normalizedTitle = s.title.toLowerCase().replace(/[^a-z]/g, "");
            const isArrivalChecklist = normalizedTitle === "arrivalchecklist";
            const isDepartureChecklist =
              normalizedTitle === "departure" ||
              normalizedTitle === "departurechecklist";
            const isBoatChecklist =
              normalizedTitle === "boat" || normalizedTitle === "boatchecklist";
            const hasStayChecklist =
              isArrivalChecklist || isDepartureChecklist || isBoatChecklist;
            const showStayChecklist =
              hasStayChecklist &&
              (!isBoatChecklist || !checklistStay || boatItems.length > 0);
            const checklistType = isDepartureChecklist
              ? "departure"
              : isBoatChecklist
                ? "boat"
                : "arrival";
            const guideChecklistItems = isDepartureChecklist
              ? departureItems
              : isBoatChecklist
                ? boatItems
                : arrivalItems;
            const sectionBlocks = visibleBlocks.filter(
              (block) =>
                block.sectionId === s.id &&
                // The original Boat list is retained in the database for history,
                // but its items now appear as visit-specific checkboxes instead.
                !(showStayChecklist && isBoatChecklist && block.kind === "list")
            );
            return (
              <SectionCard
                key={s.id}
                section={s}
                blocks={sectionBlocks}
                canEdit={editor}
                isFirst={i === 0}
                isLast={i === visibleSections.length - 1}
                anchorId={isArrivalChecklist ? "arrival-check-list" : undefined}
                checklistEditHref={
                  hasStayChecklist && admin ? "/admin#stay-checklist-templates" : undefined
                }
                stayChecklist={
                  showStayChecklist ? (
                    checklistStay ? (
                      <div>
                        <p className="mb-2 text-xs text-ink-soft">
                          For <span className="font-semibold">{checklistStay.label}</span>. These check-offs reset for every reservation.
                        </p>
                        <StayChecklistPhase
                          label={`${checklistType[0].toUpperCase()}${checklistType.slice(1)} steps`}
                          items={guideChecklistItems}
                          canToggle={canUpdateStayChecklist(user, checklistStay, today)}
                        />
                        <Link
                          href={`/calendar/${checklistStay.id}/checklist`}
                          className="mt-3 inline-block text-sm font-semibold text-water hover:text-deep-2"
                        >
                          Open full visit checklist record
                        </Link>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-ink-soft">
                          Schedule a stay to start a fresh {checklistType} checklist.
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

import Link from "next/link";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { roleLabel } from "@/lib/roles";
import { addDays, todayISO } from "@/lib/dates";
import {
  allStays,
  maintenanceItems,
  openFixit,
  staysNow,
  staysUpcoming,
} from "@/lib/queries";
import { Sidebar, MobileHeader } from "@/components/nav";
import type { HomeNotification } from "@/components/home-notification-bell";
import { ServiceWorkerRegistrar } from "@/components/service-worker-registrar";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { signOut } from "@/app/signin/actions";
import { setViewAs, clearViewAs } from "./view-as-actions";

async function houseStatus(): Promise<string> {
  const row = await getDb().query.settings.findFirst({
    where: eq(schema.settings.key, "house_status"),
  });
  return row?.value ?? "Ready";
}

function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="text-xs font-medium text-white/55 hover:text-white transition-colors"
      >
        Sign out
      </button>
    </form>
  );
}

function PreviewControl() {
  return (
    <form action={setViewAs} className="flex items-center gap-2">
      <span className="text-xs text-white/55">Preview as</span>
      <button
        type="submit"
        name="tier"
        value="family"
        className="text-xs font-medium text-white/70 hover:text-white underline underline-offset-2"
      >
        Family
      </button>
      <button
        type="submit"
        name="tier"
        value="household"
        className="text-xs font-medium text-white/70 hover:text-white underline underline-offset-2"
      >
        Household
      </button>
    </form>
  );
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const [status, stays, maintenance, issues] = await Promise.all([
    houseStatus(),
    allStays(),
    maintenanceItems(),
    openFixit(),
  ]);
  const today = todayISO();
  const checklistStay = staysNow(stays, today)[0] ?? staysUpcoming(stays, today)[0];
  const stayChecklistHref = checklistStay
    ? `/calendar/${checklistStay.id}/checklist`
    : "/calendar/plan";
  const navUser = { name: user.name, role: user.effectiveRole };
  const householdStays = user.householdId
    ? stays
        .filter((stay) => stay.householdId === user.householdId && stay.end >= today)
        .sort((a, b) => a.start.localeCompare(b.start))
    : [];
  const myVisit =
    householdStays.find((stay) => stay.start <= today && today <= stay.end) ??
    householdStays[0];
  const overlappingVisits = myVisit
    ? stays.filter(
        (stay) =>
          stay.id !== myVisit.id &&
          stay.start <= myVisit.end &&
          myVisit.start <= stay.end
      )
    : [];
  const notifications: HomeNotification[] = [];
  if (myVisit && overlappingVisits.length > 0) {
    notifications.push({
      title: "Overlapping family visits",
      detail: overlappingVisits.map((stay) => stay.label).join(", "),
      href: "/calendar#upcoming-stays",
      urgent: true,
    });
  }
  if (myVisit?.start === addDays(today, 1)) {
    notifications.push({
      title: "Your stay starts tomorrow",
      detail: "Review the Stay Checklist before arriving.",
      href: `/calendar/${myVisit.id}/checklist#stay-checklist`,
    });
  }
  if (myVisit && myVisit.start <= today && myVisit.end === today) {
    notifications.push({
      title: "Check-out today",
      detail: "Finish the Leave Checklist before you go.",
      href: `/calendar/${myVisit.id}/checklist#leave-checklist`,
    });
  }
  const overdueMaintenance = maintenance.filter(
    (item) => item.nextDue && item.nextDue < today
  );
  if (overdueMaintenance.length > 0) {
    notifications.push({
      title: `${overdueMaintenance.length} overdue maintenance item${overdueMaintenance.length === 1 ? "" : "s"}`,
      detail: overdueMaintenance[0].task,
      href: "/upkeep?tab=maintenance",
      urgent: true,
    });
  }
  const urgentIssues = issues.filter((issue) => issue.priority === "urgent");
  if (urgentIssues.length > 0) {
    notifications.push({
      title: `${urgentIssues.length} urgent property issue${urgentIssues.length === 1 ? "" : "s"}`,
      detail: urgentIssues[0].title,
      href: "/upkeep?tab=fixit",
      urgent: true,
    });
  }
  const assignedToUser = [
    ...issues.map((issue) => ({
      title: issue.title,
      href: "/upkeep?tab=fixit",
      assignedTo: issue.assignedTo,
    })),
    ...maintenance.map((item) => ({
      title: item.task,
      href: "/upkeep?tab=maintenance",
      assignedTo: item.assignedTo,
    })),
  ].filter(
    (item) =>
      item.assignedTo?.trim().toLowerCase() === user.name.trim().toLowerCase()
  );
  if (assignedToUser.length > 0) {
    notifications.push({
      title: `${assignedToUser.length} item${assignedToUser.length === 1 ? "" : "s"} assigned to you`,
      detail: assignedToUser[0].title,
      href: assignedToUser[0].href,
    });
  }
  const isRealAdmin = user.role === "admin";
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA;
  const version = commitSha ? commitSha.slice(0, 7) : "Local";

  return (
    <div className="flex-1 flex flex-col">
      <ServiceWorkerRegistrar />
      <PullToRefresh />
      {user.viewingAs ? (
        <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-amber px-4 py-2 text-sm font-medium text-white">
          <span>
            Viewing as {roleLabel(user.viewingAs).toLowerCase()}. Actions are
            limited to what they can do.
          </span>
          <form action={clearViewAs}>
            <button
              type="submit"
              className="rounded-lh bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30 transition-colors"
            >
              Exit preview
            </button>
          </form>
        </div>
      ) : null}
      {user.mustChangePassword && !user.viewingAs ? (
        <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-3 bg-amber px-4 py-2 text-sm font-medium text-white">
          <span>You are still using the password you were given.</span>
          <Link
            href="/account"
            className="rounded-lh bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30 transition-colors"
          >
            Pick your own
          </Link>
        </div>
      ) : null}
      <div className="flex-1 flex flex-col lg:flex-row">
        <Sidebar
          user={navUser}
          stayChecklistHref={stayChecklistHref}
          notifications={notifications}
          status={status}
          version={version}
          signOutSlot={<SignOutButton />}
          previewSlot={
            isRealAdmin && !user.viewingAs ? <PreviewControl /> : null
          }
        />
        <MobileHeader
          user={navUser}
          stayChecklistHref={stayChecklistHref}
          notifications={notifications}
          status={status}
          version={version}
          signOutSlot={<SignOutButton />}
          previewSlot={
            isRealAdmin && !user.viewingAs ? <PreviewControl /> : null
          }
        />
        <main className="min-w-0 flex-1 p-4 pb-28 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}

import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { roleLabel } from "@/lib/roles";
import { Sidebar, MobileHeader } from "@/components/nav";
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
  const status = await houseStatus();
  const navUser = { name: user.name, role: user.effectiveRole };
  const isRealAdmin = user.role === "admin";

  return (
    <div className="flex-1 flex flex-col">
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
      <div className="flex-1 flex flex-col lg:flex-row">
        <Sidebar
          user={navUser}
          status={status}
          signOutSlot={<SignOutButton />}
          previewSlot={
            isRealAdmin && !user.viewingAs ? <PreviewControl /> : null
          }
        />
        <MobileHeader
          user={navUser}
          status={status}
          signOutSlot={<SignOutButton />}
          previewSlot={
            isRealAdmin && !user.viewingAs ? <PreviewControl /> : null
          }
        />
        <main className="flex-1 min-w-0 p-4 pb-12 lg:p-10">{children}</main>
      </div>
    </div>
  );
}

import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { Sidebar, MobileHeader } from "@/components/nav";
import { signOut } from "@/app/signin/actions";

async function houseStatus(): Promise<string> {
  const row = await db.query.settings.findFirst({
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

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const status = await houseStatus();
  const navUser = { name: user.name, role: user.role };

  return (
    <div className="flex-1 flex flex-col lg:flex-row">
      <Sidebar user={navUser} status={status} signOutSlot={<SignOutButton />} />
      <MobileHeader
        user={navUser}
        status={status}
        signOutSlot={<SignOutButton />}
      />
      <main className="flex-1 min-w-0 p-4 pb-12 lg:p-10">{children}</main>
    </div>
  );
}

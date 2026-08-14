import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { roleLabel } from "@/lib/roles";
import { PageHeader } from "@/components/page-header";
import { ProfileForm, PasswordForm } from "./account-forms";

export const metadata: Metadata = { title: "Account · Paine Pointe" };

/* Every tier gets this page: it is how each person changes their own
   password off the shared default without asking an admin. */
export default async function AccountPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Account"
        action={<span className="chip chip-whenever">{roleLabel(user.role)}</span>}
      />

      <section className="card p-4 sm:p-6">
        <p className="section-label">Your details</p>
        <h2 className="font-display text-2xl mt-1">How you appear to family</h2>
        <ProfileForm name={user.name} email={user.email} />
      </section>

      <section className="card mt-4 p-4 sm:mt-6 sm:p-6">
        <p className="section-label">Password</p>
        <h2 className="font-display text-2xl mt-1">Change your password</h2>
        <p className="mt-1 text-sm text-ink-soft">
          If you are still on the shared starting password, change it here.
        </p>
        <PasswordForm />
      </section>
    </div>
  );
}

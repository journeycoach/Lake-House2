import Link from "next/link";
import { getEffectiveUser } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { fmtLong, todayISO } from "@/lib/dates";

export async function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  const user = await getEffectiveUser();
  const editor = user ? canEdit(user.effectiveRole) : false;

  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="section-label">{fmtLong(todayISO())}</p>
        <h1 className="font-display text-3xl lg:text-4xl text-ink mt-1">
          {title}
        </h1>
      </div>
      {action ??
        (editor ? (
          <Link href="/calendar#plan" className="btn btn-primary">
            Plan a stay
          </Link>
        ) : null)}
    </div>
  );
}

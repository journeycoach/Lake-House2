import Link from "next/link";
import { fmtLong, todayISO } from "@/lib/dates";

export function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="section-label">{fmtLong(todayISO())}</p>
        <h1 className="font-display text-3xl lg:text-4xl text-ink mt-1">
          {title}
        </h1>
      </div>
      {action ?? (
        <Link href="/calendar#plan" className="btn btn-primary">
          Plan a stay
        </Link>
      )}
    </div>
  );
}

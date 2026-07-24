import { fmtLong, todayISO } from "@/lib/dates";

/*
  One primary button per screen: pages pass their own action (or none).
  The old default put "Plan a stay" on every page next to each page's own
  rust button, which made two primaries everywhere.
*/
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
      {action}
    </div>
  );
}

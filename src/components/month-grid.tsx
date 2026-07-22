import { householdVar } from "@/lib/colors";
import { iso, monthGrid } from "@/lib/dates";
import type { StayRow } from "@/lib/queries";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/*
  Color-coded month. Each household keeps one muted color everywhere.
  Desktop-and-up only; small screens get the agenda list instead, so the
  seven-column grid never has to squeeze into a phone.
*/
export function MonthGrid({
  year,
  month,
  stays,
  today,
}: {
  year: number;
  month: number;
  stays: StayRow[];
  today: string;
}) {
  const cells = monthGrid(year, month);

  function staysOn(dayIso: string): StayRow[] {
    return stays.filter((s) => s.start <= dayIso && dayIso <= s.end);
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-1">
        {DOW.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-faint"
          >
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />;
          const dayIso = iso(year, month, day);
          const dayStays = staysOn(dayIso);
          const first = dayStays[0];
          const isToday = dayIso === today;
          return (
            <div
              key={dayIso}
              className={`min-h-16 rounded-lh border p-1.5 ${
                isToday ? "border-rust" : "border-transparent"
              }`}
              style={
                first
                  ? {
                      background: `color-mix(in srgb, ${householdVar(first.color)} 14%, transparent)`,
                    }
                  : { background: "color-mix(in srgb, var(--sand) 35%, transparent)" }
              }
            >
              <span
                className={`text-sm ${isToday ? "font-bold text-rust" : "text-ink-soft"}`}
              >
                {day}
              </span>
              {dayStays.slice(0, 2).map((s) => (
                <span
                  key={s.id}
                  className="mt-0.5 flex items-center gap-1 truncate text-[10px] font-medium text-ink-soft"
                >
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: householdVar(s.color) }}
                  />
                  {s.label}
                </span>
              ))}
              {dayStays.length > 2 ? (
                <span className="text-[10px] text-ink-faint">
                  +{dayStays.length - 2} more
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HouseholdLegend({ stays }: { stays: StayRow[] }) {
  const seen = new Map<string, string>();
  for (const s of stays) if (!seen.has(s.label)) seen.set(s.label, s.color);
  if (seen.size === 0) return null;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {[...seen.entries()].map(([label, color]) => (
        <span
          key={label}
          className="flex items-center gap-1.5 text-xs text-ink-soft"
        >
          <span
            aria-hidden
            className="h-2 w-2 rounded-full"
            style={{ background: householdVar(color) }}
          />
          {label}
        </span>
      ))}
    </div>
  );
}

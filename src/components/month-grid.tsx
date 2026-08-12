import { householdVar } from "@/lib/colors";
import { iso, monthGrid } from "@/lib/dates";
import type { MaintenanceRow, StayRow } from "@/lib/queries";
import Link from "next/link";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MiniMonthGrid({
  year,
  month,
  stays,
  maintenance,
  today,
}: {
  year: number;
  month: number;
  stays: StayRow[];
  maintenance: MaintenanceRow[];
  today: string;
}) {
  const cells = monthGrid(year, month);

  return (
    <div>
      <div className="grid grid-cols-7 gap-1">
        {DOW.map((day) => (
          <span
            key={day}
            className="py-1 text-center text-[10px] font-semibold uppercase text-ink-faint"
          >
            {day.slice(0, 1)}
          </span>
        ))}
        {cells.map((day, index) => {
          if (day === null) return <span key={`empty-${index}`} />;

          const dayIso = iso(year, month, day);
          const dayStays = stays.filter(
            (stay) => stay.start <= dayIso && dayIso <= stay.end
          );
          const dayMaintenance = maintenance.filter(
            (item) => item.nextDue === dayIso
          );
          const firstStay = dayStays[0];
          const hasEvents = dayStays.length > 0 || dayMaintenance.length > 0;
          const isToday = dayIso === today;
          const eventLabels = [
            ...dayStays.map((stay) => stay.label),
            ...dayMaintenance.map((item) => `Maintenance: ${item.task}`),
          ];
          const className = `flex h-10 flex-col items-center justify-center rounded-lg border text-xs transition-colors ${
            isToday ? "border-rust font-bold text-rust" : "border-transparent"
          } ${hasEvents ? "hover:border-water" : "text-ink-soft"}`;
          const style = firstStay
            ? {
                background: `color-mix(in srgb, ${householdVar(firstStay.color)} 18%, transparent)`,
              }
            : dayMaintenance.length > 0
              ? {
                  background: "color-mix(in srgb, var(--care) 14%, transparent)",
                }
              : {
                  background: "color-mix(in srgb, var(--sand) 35%, transparent)",
                };
          const content = (
            <>
              <span>{day}</span>
              {hasEvents ? (
                <span className="mt-0.5 flex h-1.5 items-center gap-0.5" aria-hidden>
                  {firstStay ? (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: householdVar(firstStay.color) }}
                    />
                  ) : null}
                  {dayMaintenance.length > 0 ? (
                    <span className="h-1.5 w-1.5 rounded-[2px] bg-care" />
                  ) : null}
                  {dayStays.length + dayMaintenance.length > 2 ? (
                    <span className="text-[8px] leading-none text-ink-faint">+</span>
                  ) : null}
                </span>
              ) : null}
            </>
          );

          return hasEvents ? (
            <Link
              key={dayIso}
              href="#calendar-details"
              aria-label={`${dayIso}: ${eventLabels.join(", ")}. See details`}
              className={className}
              style={style}
            >
              {content}
            </Link>
          ) : (
            <span key={dayIso} className={className} style={style}>
              {content}
            </span>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-ink-soft">
        <span>Tap a marked day for details.</span>
        <Link
          href="#calendar-details"
          className="shrink-0 font-semibold text-water hover:text-deep-2"
        >
          See details
        </Link>
      </div>
    </div>
  );
}

/* Color-coded desktop month. Each household keeps one muted color everywhere. */
export function MonthGrid({
  year,
  month,
  stays,
  maintenance,
  today,
}: {
  year: number;
  month: number;
  stays: StayRow[];
  maintenance: MaintenanceRow[];
  today: string;
}) {
  const cells = monthGrid(year, month);
  const maintenanceByDate = new Map<string, MaintenanceRow[]>();
  for (const item of maintenance) {
    if (!item.nextDue) continue;
    const items = maintenanceByDate.get(item.nextDue) ?? [];
    items.push(item);
    maintenanceByDate.set(item.nextDue, items);
  }

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
          const dayMaintenance = maintenanceByDate.get(dayIso) ?? [];
          const visibleStays = dayStays.slice(0, 2);
          const visibleMaintenance = dayMaintenance.slice(0, 1);
          const hiddenCount =
            dayStays.length +
            dayMaintenance.length -
            visibleStays.length -
            visibleMaintenance.length;
          const first = dayStays[0];
          const isToday = dayIso === today;
          return (
            <div
              key={dayIso}
              className={`min-h-20 rounded-lh border p-1.5 ${
                isToday ? "border-rust" : "border-transparent"
              }`}
              style={
                first
                  ? {
                      background: `color-mix(in srgb, ${householdVar(first.color)} 14%, transparent)`,
                    }
                  : dayMaintenance.length > 0
                    ? {
                        background:
                          "color-mix(in srgb, var(--care) 10%, transparent)",
                      }
                    : {
                        background:
                          "color-mix(in srgb, var(--sand) 35%, transparent)",
                      }
              }
            >
              <span
                className={`text-sm ${isToday ? "font-bold text-rust" : "text-ink-soft"}`}
              >
                {day}
              </span>
              {visibleStays.map((s) => (
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
              {visibleMaintenance.map((item) => (
                <span
                  key={`maintenance-${item.id}`}
                  title={`Preventive care: ${item.task}`}
                  className="mt-0.5 flex items-center gap-1 truncate text-[10px] font-semibold text-care"
                >
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 shrink-0 rounded-[2px] bg-care"
                  />
                  {item.task}
                </span>
              ))}
              {hiddenCount > 0 ? (
                <span className="text-[10px] text-ink-faint">
                  +{hiddenCount} more
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HouseholdLegend({
  stays,
  showMaintenance = false,
}: {
  stays: StayRow[];
  showMaintenance?: boolean;
}) {
  const seen = new Map<string, string>();
  for (const s of stays) if (!seen.has(s.label)) seen.set(s.label, s.color);
  if (seen.size === 0 && !showMaintenance) return null;
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
      {showMaintenance ? (
        <span className="flex items-center gap-1.5 text-xs text-ink-soft">
          <span
            aria-hidden
            className="h-2 w-2 rounded-[2px] bg-care"
          />
          Preventive care
        </span>
      ) : null}
    </div>
  );
}

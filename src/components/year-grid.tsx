import Link from "next/link";
import { householdVar } from "@/lib/colors";
import { iso, monthGrid } from "@/lib/dates";
import type { StayRow } from "@/lib/queries";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/*
  Year at a glance: twelve mini months, days tinted with the household color
  when someone is up. The whole lake season reads in one look.
*/
export function YearGrid({
  year,
  stays,
  today,
}: {
  year: number;
  stays: StayRow[];
  today: string;
}) {
  function stayOn(dayIso: string): StayRow | undefined {
    return stays.find((s) => s.start <= dayIso && dayIso <= s.end);
  }

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      {MONTHS.map((name, mi) => {
        const m = mi + 1;
        const cells = monthGrid(year, m);
        return (
          <div key={m}>
            <Link
              href={`/calendar?view=month&m=${year}-${String(m).padStart(2, "0")}`}
              className="text-sm font-semibold hover:text-water transition-colors"
            >
              {name}
            </Link>
            <div className="mt-2 grid grid-cols-7 gap-px">
              {cells.map((day, i) => {
                if (day === null) return <span key={`e${i}`} className="h-5" />;
                const dayIso = iso(year, m, day);
                const stay = stayOn(dayIso);
                const isToday = dayIso === today;
                return (
                  <span
                    key={dayIso}
                    title={stay ? `${stay.label}` : undefined}
                    className={`flex h-5 items-center justify-center rounded-[4px] text-[10px] ${
                      isToday
                        ? "font-bold text-rust ring-1 ring-rust"
                        : stay
                          ? "font-medium text-white"
                          : "text-ink-faint"
                    }`}
                    style={
                      stay && !isToday
                        ? { background: householdVar(stay.color) }
                        : undefined
                    }
                  >
                    {day}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

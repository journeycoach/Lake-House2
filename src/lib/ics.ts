import { addDays } from "./dates";

/*
  Minimal iCalendar builder for stays. All-day events; DTEND is exclusive per
  RFC 5545, so a stay's last night plus one. Lines use CRLF and long lines are
  folded at 75 octets.
*/

type IcsStay = {
  id: number;
  label: string;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD, last night
  adults: number;
  kids: number;
  note: string | null;
  createdAt: string;
};

type IcsMaintenance = {
  id: number;
  task: string;
  details: string | null;
  cadence: string | null;
  nextDue: string | null;
  assignedTo: string | null;
  createdAt: string;
};

function esc(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 73) {
    out.push(rest.slice(0, 73));
    rest = " " + rest.slice(73);
  }
  out.push(rest);
  return out.join("\r\n");
}

function dateNum(iso: string): string {
  return iso.replaceAll("-", "");
}

function stamp(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}T${p(
    d.getUTCHours()
  )}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}

function event(stay: IcsStay): string[] {
  const guests = stay.adults + stay.kids;
  const desc = [
    `${stay.adults} adult${stay.adults === 1 ? "" : "s"}, ${stay.kids} kid${stay.kids === 1 ? "" : "s"}`,
    stay.note ?? "",
  ]
    .filter(Boolean)
    .join("\n");
  return [
    "BEGIN:VEVENT",
    `UID:stay-${stay.id}@lakehouse.paines`,
    `DTSTAMP:${stamp(stay.createdAt)}`,
    `DTSTART;VALUE=DATE:${dateNum(stay.start)}`,
    `DTEND;VALUE=DATE:${dateNum(addDays(stay.end, 1))}`,
    fold(`SUMMARY:${esc(`${stay.label} at Paine Pointe (${guests} guest${guests === 1 ? "" : "s"})`)}`),
    fold(`DESCRIPTION:${esc(desc)}`),
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
  ];
}

function maintenanceEvent(item: IcsMaintenance): string[] {
  if (!item.nextDue) return [];
  const desc = [
    item.details ?? "",
    item.cadence ? `Cadence: ${item.cadence}` : "",
    item.assignedTo ? `Assigned to: ${item.assignedTo}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return [
    "BEGIN:VEVENT",
    `UID:maintenance-${item.id}@lakehouse.paines`,
    `DTSTAMP:${stamp(item.createdAt)}`,
    `DTSTART;VALUE=DATE:${dateNum(item.nextDue)}`,
    `DTEND;VALUE=DATE:${dateNum(addDays(item.nextDue, 1))}`,
    fold(`SUMMARY:${esc(`Preventive care: ${item.task}`)}`),
    fold(`DESCRIPTION:${esc(desc)}`),
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
  ];
}

export function buildCalendar(
  stays: IcsStay[],
  maintenance: IcsMaintenance[] = []
): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Paine Pointe//Family Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Paine Pointe",
    "X-WR-CALDESC:Stays and preventive care at Paine Pointe",
    ...stays.flatMap(event),
    ...maintenance.flatMap(maintenanceEvent),
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}

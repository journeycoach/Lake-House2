const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/* Local date as YYYY-MM-DD. All stay math compares these strings. */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function parseISO(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

export function fmtDay(iso: string): string {
  const { m, d } = parseISO(iso);
  return `${MONTHS[m - 1]} ${d}`;
}

export function fmtRange(start: string, end: string): string {
  if (start === end) return fmtDay(start);
  const a = parseISO(start);
  const b = parseISO(end);
  if (a.y === b.y && a.m === b.m) return `${MONTHS[a.m - 1]} ${a.d}-${b.d}`;
  return `${fmtDay(start)} - ${fmtDay(end)}`;
}

export function fmtLong(iso: string): string {
  const { y, m, d } = parseISO(iso);
  const date = new Date(y, m - 1, d);
  const days = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
  ];
  return `${days[date.getDay()]}, ${MONTHS[m - 1]} ${d}`;
}

export function monthName(y: number, m: number): string {
  const full = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${full[m - 1]} ${y}`;
}

export function addDays(iso: string, days: number): string {
  const { y, m, d } = parseISO(iso);
  const date = new Date(y, m - 1, d + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

/* Grid of a month: leading nulls for offset, then day-of-month numbers. */
export function monthGrid(y: number, m: number): (number | null)[] {
  const first = new Date(y, m - 1, 1).getDay();
  const count = new Date(y, m, 0).getDate();
  const cells: (number | null)[] = Array(first).fill(null);
  for (let d = 1; d <= count; d++) cells.push(d);
  return cells;
}

export function iso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

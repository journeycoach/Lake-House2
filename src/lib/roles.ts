/*
  Three tiers:
  - family: extended family, sees everything, edits nothing
  - household: books stays and edits shared content
  - admin: household powers plus the Admin page
*/
export type Role = "family" | "household" | "admin";

export const ROLES: { value: Role; label: string }[] = [
  { value: "family", label: "Family member" },
  { value: "household", label: "Household member" },
  { value: "admin", label: "Admin" },
];

export function roleLabel(role: string): string {
  return ROLES.find((r) => r.value === role)?.label ?? role;
}

export function canEdit(role: string): boolean {
  return role === "household" || role === "admin";
}

/* Ranking for "visible to this tier and above" checks. */
const RANK: Record<string, number> = { family: 0, household: 1, admin: 2 };

export function rankOf(role: string): number {
  return RANK[role] ?? 0;
}

export function meetsRole(role: string, required: string): boolean {
  return rankOf(role) >= rankOf(required);
}

/* What a piece of content can be restricted to. Family means everyone. */
export const VISIBILITY: { value: Role; label: string }[] = [
  { value: "family", label: "Everyone" },
  { value: "household", label: "Household members and admins" },
  { value: "admin", label: "Admins only" },
];

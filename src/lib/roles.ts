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

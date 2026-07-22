/* Household color tokens map to CSS variables defined in globals.css. */
const TOKENS = ["steel", "pine", "drift", "huckle", "dusk", "reed"] as const;
export type HouseholdColor = (typeof TOKENS)[number];

export function householdVar(token: string): string {
  const t = (TOKENS as readonly string[]).includes(token) ? token : "steel";
  return `var(--hh-${t})`;
}

export const HOUSEHOLD_TOKENS = TOKENS;

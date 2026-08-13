import { todayISO } from "./dates";

type ChecklistUser = {
  householdId: number | null;
};

type ChecklistStay = {
  householdId: number | null;
  start: string;
  end: string;
};

/* A visit checklist is visible to everyone who can use the site, but only the
   household currently staying at the lake can change its progress. */
export function canUpdateStayChecklist(
  user: ChecklistUser,
  stay: ChecklistStay,
  today = todayISO()
) {
  return Boolean(
    user.householdId &&
      stay.householdId &&
      user.householdId === stay.householdId &&
      stay.start <= today &&
      stay.end >= today
  );
}

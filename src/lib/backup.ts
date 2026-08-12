import "server-only";
import { lt } from "drizzle-orm";
import { getDb, schema } from "./db";

/*
  Backup and housekeeping.

  Two kinds of data live here and they get treated very differently:

  - Content the family wrote (bookings, notes, the guide, accounts, households)
    is small, irreplaceable, and never deleted by anything in this file.
  - History (activity log, sign-in records, the mail outbox) grows forever and
    is only interesting for a while. This is the only thing clearing touches.
*/

export const CONTENT_TABLES = [
  "households",
  "users",
  "stays",
  "notes",
  "fixit",
  "checklist",
  "maintenance",
  "equipment",
  "serviceRecords",
  "stayChecklistTemplates",
  "stayChecklistCompletions",
  "guideSections",
  "settings",
] as const;

export const HISTORY_TABLES = ["activityLog", "loginEvents", "outbox"] as const;

export type BackupFile = {
  takenAt: string;
  app: "the-lakehouse";
  version: 1;
  rows: Record<string, unknown[]>;
};

export async function buildBackup(): Promise<BackupFile> {
  const db = getDb();
  const rows: Record<string, unknown[]> = {};

  for (const name of [...CONTENT_TABLES, ...HISTORY_TABLES]) {
    const table = schema[name as keyof typeof schema];
    rows[name] = await db.select().from(table as never);
  }
  // Password hashes are included on purpose: a backup you cannot sign in from
  // is not a backup. Treat the file as a secret.
  return {
    takenAt: new Date().toISOString(),
    app: "the-lakehouse",
    version: 1,
    rows,
  };
}

export function backupFilename(takenAt: string): string {
  return `lakehouse-backup-${takenAt.slice(0, 10)}.json`;
}

export type StorageReport = {
  totalRows: number;
  contentRows: number;
  historyRows: number;
  perTable: { name: string; label: string; rows: number; clearable: boolean }[];
  /* Rough fraction of a comfortable ceiling for a family app. Not a hard
     limit from the database, just the point where clearing history is worth
     a thought. */
  usage: number;
  nearlyFull: boolean;
};

const LABELS: Record<string, string> = {
  households: "Households",
  users: "Accounts",
  stays: "Bookings",
  notes: "Family notes",
  fixit: "Fix-it items",
  checklist: "Checklist items",
  maintenance: "Maintenance schedules",
  equipment: "Equipment",
  serviceRecords: "Service records",
  stayChecklistTemplates: "Stay checklist templates",
  stayChecklistCompletions: "Stay checklist check-offs",
  guideSections: "House guide",
  settings: "Settings",
  activityLog: "Activity history",
  loginEvents: "Sign-in history",
  outbox: "Sent mail",
};

const COMFORTABLE_ROWS = 50_000;

export async function storageReport(): Promise<StorageReport> {
  const db = getDb();
  const perTable: StorageReport["perTable"] = [];
  let contentRows = 0;
  let historyRows = 0;

  for (const name of CONTENT_TABLES) {
    const table = schema[name as keyof typeof schema];
    const rows = (await db.select().from(table as never)).length;
    contentRows += rows;
    perTable.push({ name, label: LABELS[name] ?? name, rows, clearable: false });
  }
  for (const name of HISTORY_TABLES) {
    const table = schema[name as keyof typeof schema];
    const rows = (await db.select().from(table as never)).length;
    historyRows += rows;
    perTable.push({ name, label: LABELS[name] ?? name, rows, clearable: true });
  }

  const totalRows = contentRows + historyRows;
  const usage = totalRows / COMFORTABLE_ROWS;
  return {
    totalRows,
    contentRows,
    historyRows,
    perTable: perTable.sort((a, b) => b.rows - a.rows),
    usage,
    nearlyFull: usage >= 0.8,
  };
}

/* Deletes history older than the cutoff. Content is never touched. */
export async function clearHistoryBefore(cutoffISO: string): Promise<number> {
  const db = getDb();
  let removed = 0;

  const a = await db
    .delete(schema.activityLog)
    .where(lt(schema.activityLog.at, cutoffISO))
    .returning({ id: schema.activityLog.id });
  removed += a.length;

  const l = await db
    .delete(schema.loginEvents)
    .where(lt(schema.loginEvents.at, cutoffISO))
    .returning({ id: schema.loginEvents.id });
  removed += l.length;

  const o = await db
    .delete(schema.outbox)
    .where(lt(schema.outbox.createdAt, cutoffISO))
    .returning({ id: schema.outbox.id });
  removed += o.length;

  return removed;
}

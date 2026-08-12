/*
  Restores a backup file produced by the Download a backup button or the
  weekly backup email.

  Run: SEED_CONFIRM=wipe npm run restore -- path/to/lakehouse-backup-2026-07-27.json

  This REPLACES everything currently in the database with the contents of the
  file, so it asks for the same confirmation the seed script does.
*/
import fs from "fs";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../src/lib/schema";

const ORDER = [
  "households",
  "users",
  "stays",
  "stayChecklistTemplates",
  "stayChecklistCompletions",
  "notes",
  "fixit",
  "checklist",
  "equipment",
  "maintenance",
  "serviceRecords",
  "guideSections",
  "settings",
  "activityLog",
  "loginEvents",
  "outbox",
  "passwordTokens",
  "accessRequests",
] as const;

async function main() {
  if (process.env.SEED_CONFIRM !== "wipe") {
    console.error(
      "Refusing to restore: this replaces everything currently in the database."
    );
    console.error(
      "If you mean it: SEED_CONFIRM=wipe npm run restore -- <backup file>"
    );
    process.exit(1);
  }

  const file = process.argv[2];
  if (!file || !fs.existsSync(file)) {
    console.error("Point me at a backup file: npm run restore -- <path>");
    process.exit(1);
  }

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const backup = JSON.parse(fs.readFileSync(file, "utf8"));
  if (backup.app !== "the-lakehouse") {
    console.error("That does not look like a lakehouse backup.");
    process.exit(1);
  }

  const db = drizzle(neon(url), { schema });

  // Children before parents, so foreign keys stay valid while clearing.
  for (const name of [...ORDER].reverse()) {
    const table = schema[name as keyof typeof schema];
    if (table) await db.delete(table as never);
  }

  let restored = 0;
  for (const name of ORDER) {
    const rows = backup.rows?.[name];
    const table = schema[name as keyof typeof schema];
    if (!table || !Array.isArray(rows) || rows.length === 0) continue;
    await db.insert(table as never).values(rows as never);
    restored += rows.length;
    console.log(`  ${name}: ${rows.length}`);
  }

  console.log(`Restored ${restored} rows from ${backup.takenAt}.`);
  console.log(
    "Note: id sequences are not reset. If new rows fail to insert, run: SELECT setval(pg_get_serial_sequence('users','id'), max(id)) FROM users; for each table."
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

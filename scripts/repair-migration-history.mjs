import pg from "pg";

const { Client } = pg;

const databaseUrl =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("A production database connection string is required.");
}

const migrations = [
  {
    name: "0003_lakehouse_operations",
    createdAt: 1786489819048,
    hash: "72ee1deca6cfbbda97cbe9055eb98a5538351490534853730e9faff306da7930",
    evidence: [
      ["equipment table", "SELECT to_regclass('public.equipment') IS NOT NULL AS present"],
      ["service records table", "SELECT to_regclass('public.service_records') IS NOT NULL AS present"],
      [
        "stay checklist completions table",
        "SELECT to_regclass('public.stay_checklist_completions') IS NOT NULL AS present",
      ],
      [
        "stay checklist templates table",
        "SELECT to_regclass('public.stay_checklist_templates') IS NOT NULL AS present",
      ],
      [
        "fix-it photo column",
        "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fixit' AND column_name = 'photo_url') AS present",
      ],
      [
        "fix-it reporter column",
        "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fixit' AND column_name = 'reported_by') AS present",
      ],
      [
        "maintenance equipment column",
        "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance' AND column_name = 'equipment_id') AS present",
      ],
      [
        "stay checklist completion index",
        "SELECT to_regclass('public.stay_checklist_completion_unique') IS NOT NULL AS present",
      ],
      [
        "default stay templates",
        "SELECT count(*) >= 9 AS present FROM public.stay_checklist_templates WHERE phase IN ('checkin', 'checkout')",
      ],
    ],
  },
  {
    name: "0004_stay_checklist_progress",
    createdAt: 1786635000262,
    hash: "67debcbc1bc9b24d65a2f37db12b2d7c622dd97165f43b0d47b7a5b9e280d3e1",
    evidence: [
      [
        "stay checklist items table",
        "SELECT to_regclass('public.stay_checklist_items') IS NOT NULL AS present",
      ],
      [
        "stay checklist item index",
        "SELECT to_regclass('public.stay_checklist_item_position_unique') IS NOT NULL AS present",
      ],
      [
        "stay checklist stay foreign key",
        "SELECT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stay_checklist_items_stay_id_stays_id_fk') AS present",
      ],
      [
        "stay checklist template foreign key",
        "SELECT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stay_checklist_items_template_id_stay_checklist_templates_id_fk') AS present",
      ],
    ],
  },
];

const client = new Client({ connectionString: databaseUrl });

async function migrationTableExists() {
  const result = await client.query(
    "SELECT to_regclass('drizzle.__drizzle_migrations') IS NOT NULL AS present",
  );
  return result.rows[0]?.present === true;
}

async function migrationIsRecorded(createdAt) {
  const result = await client.query(
    "SELECT EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations WHERE created_at = $1) AS present",
    [createdAt],
  );
  return result.rows[0]?.present === true;
}

async function inspectEvidence(evidence) {
  const results = [];

  for (const [label, query] of evidence) {
    const result = await client.query(query);
    results.push({ label, present: result.rows[0]?.present === true });
  }

  return results;
}

async function repairMigration(migration) {
  if (await migrationIsRecorded(migration.createdAt)) {
    console.log(`${migration.name} is already recorded.`);
    return;
  }

  const evidence = await inspectEvidence(migration.evidence);
  const presentCount = evidence.filter((item) => item.present).length;

  if (presentCount === 0) {
    console.log(`${migration.name} is pending and will be applied normally.`);
    return;
  }

  if (presentCount !== evidence.length) {
    const missing = evidence
      .filter((item) => !item.present)
      .map((item) => item.label)
      .join(", ");
    throw new Error(
      `${migration.name} is only partially present; refusing to baseline it. Missing: ${missing}`,
    );
  }

  await client.query(
    `INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
     SELECT $1, $2
     WHERE NOT EXISTS (
       SELECT 1 FROM drizzle.__drizzle_migrations WHERE created_at = $2
     )`,
    [migration.hash, migration.createdAt],
  );
  console.log(`${migration.name} was verified and added to migration history.`);
}

try {
  await client.connect();
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(73124014)");

  if (!(await migrationTableExists())) {
    console.log("Migration history does not exist yet; no repair is needed.");
  } else {
    for (const migration of migrations) {
      await repairMigration(migration);
    }
  }

  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  throw error;
} finally {
  await client.end();
}

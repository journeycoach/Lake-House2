import { spawnSync } from "node:child_process";

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (process.env.VERCEL_ENV === "production") {
  const migrationEnv = {
    ...process.env,
    DATABASE_URL:
      process.env.DATABASE_URL_UNPOOLED ??
      process.env.POSTGRES_URL_NON_POOLING ??
      process.env.DATABASE_URL,
  };

  console.log("Verifying production database migration history...");
  run("node", ["scripts/repair-migration-history.mjs"], migrationEnv);
  console.log("Applying pending production database migrations...");
  run("npm", ["run", "db:migrate"], migrationEnv);
} else {
  console.log("Skipping database migrations outside the Production environment.");
}

run("npm", ["run", "build"]);

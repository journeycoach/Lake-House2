import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (process.env.VERCEL_ENV === "production") {
  console.log("Applying pending production database migrations...");
  run("npm", ["run", "db:migrate"]);
} else {
  console.log("Skipping database migrations outside the Production environment.");
}

run("npm", ["run", "build"]);

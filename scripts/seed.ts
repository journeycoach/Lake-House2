/*
  Creates tables and seeds the database with the content carried over from
  the original ChatGPT-built site. Run: npm run seed
  Idempotent: wipes and re-seeds content tables. Safe before launch only.
*/
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, "lakehouse.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS households (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'family',
  household_id INTEGER REFERENCES households(id),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS stays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  household_id INTEGER REFERENCES households(id),
  start TEXT NOT NULL,
  end TEXT NOT NULL,
  adults INTEGER NOT NULL DEFAULT 0,
  kids INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_name TEXT NOT NULL,
  author_id INTEGER REFERENCES users(id),
  body TEXT NOT NULL,
  tag TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS fixit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  details TEXT,
  location TEXT,
  priority TEXT NOT NULL DEFAULT 'whenever',
  assigned_to TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS checklist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  details TEXT,
  added_by TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS maintenance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task TEXT NOT NULL,
  details TEXT,
  cadence TEXT,
  next_due TEXT,
  assigned_to TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS guide_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  detail TEXT,
  at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS login_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id),
  success INTEGER NOT NULL,
  at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  kind TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'logged',
  created_at TEXT NOT NULL
);
`);

const now = new Date().toISOString();

// wipe content tables so the seed is repeatable
for (const t of [
  "stays",
  "notes",
  "fixit",
  "checklist",
  "maintenance",
  "guide_sections",
  "households",
  "users",
]) {
  db.exec(`DELETE FROM ${t};`);
}

const insertHousehold = db.prepare(
  "INSERT INTO households (name, color) VALUES (?, ?)"
);
const hh = (name: string, color: string) =>
  Number(insertHousehold.run(name, color).lastInsertRowid);

const hhJohn2 = hh("John2", "steel");
const hhJeffAshlyn = hh("Jeff & Ashlyn", "drift");
const hhJohnJenn = hh("John & Jenn", "pine");
const hhEmma = hh("Emma", "huckle");
const hhGroup = hh("Whole family", "dusk");

// Accounts known from the original site's admin table. Default password is
// "lakehouse" until each person changes it. Admin can add the rest.
const pw = bcrypt.hashSync("lakehouse", 10);
const insertUser = db.prepare(
  "INSERT INTO users (name, email, password_hash, role, household_id, created_at) VALUES (?, ?, ?, ?, ?, ?)"
);
const uJeff = Number(
  insertUser.run("Jeff", "jeffreyraypaine@gmail.com", pw, "admin", hhJeffAshlyn, now)
    .lastInsertRowid
);
insertUser.run("Jenn", "jenniferpaine@hotmail.com", pw, "admin", hhJohnJenn, now);
const uJohn2 = Number(
  insertUser.run("John2", "johnpaine@gmail.com", pw, "admin", hhJohn2, now)
    .lastInsertRowid
);

const insertStay = db.prepare(
  "INSERT INTO stays (label, household_id, start, end, adults, kids, note, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
);
insertStay.run("John2", hhJohn2, "2026-07-21", "2026-07-22", 2, 0, "motor boatin!", uJohn2, now);
insertStay.run("Jeff & Ashlyn", hhJeffAshlyn, "2026-07-23", "2026-07-23", 2, 0, null, uJeff, now);
insertStay.run("John & Jenn", hhJohnJenn, "2026-07-24", "2026-07-27", 2, 0, "Arriving after lunch Friday", uJohn2, now);
insertStay.run("Emma", hhEmma, "2026-07-31", "2026-08-03", 2, 2, "Bringing the dog", null, now);
insertStay.run("Guys Weekend", hhGroup, "2026-08-07", "2026-08-09", 4, 0, null, null, now);

const insertNote = db.prepare(
  "INSERT INTO notes (author_name, author_id, body, tag, created_at) VALUES (?, ?, ?, ?, ?)"
);
// original site had this note duplicated; seeded once on purpose
insertNote.run(
  "John2",
  uJohn2,
  "The lake is high this week, please tie down everything on the boathouse.",
  "local tip",
  now
);
insertNote.run(
  "John2",
  uJohn2,
  "Clean sheets are folded in the hall closet. Please start used towels before you leave.",
  "for the next visit",
  now
);
insertNote.run("John Paine", uJohn2, "Start looking for a boat", "house update", now);

const insertFix = db.prepare(
  "INSERT INTO fixit (title, details, location, priority, assigned_to, status, created_at) VALUES (?, ?, ?, ?, ?, 'open', ?)"
);
insertFix.run(
  "Fix the table",
  "Table leg has fallen off so the table is laying on the floor",
  "Kitchen",
  "urgent",
  "Jeff",
  now
);
insertFix.run(
  "Upstairs screen has a tear",
  "Small tear in the lower corner.",
  "Upstairs bedroom",
  "soon",
  "John3",
  now
);
insertFix.run(
  "Dock light is flickering",
  "Check the fixture and replace it if needed.",
  "Dock",
  "whenever",
  "Dad",
  now
);

const insertCheck = db.prepare(
  "INSERT INTO checklist (title, details, added_by, done, position) VALUES (?, ?, ?, 0, ?)"
);
insertCheck.run("Paper towels", "We are almost out so get some at Costco", "John Paine", 1);
insertCheck.run("Milk", "Gallon", "John2", 2);
insertCheck.run("Propane refill", "Still needed", "John2", 3);
insertCheck.run("Life jackets", "We need to acquire enough life jackets for each person", "House", 4);

const insertMaint = db.prepare(
  "INSERT INTO maintenance (task, details, cadence, next_due, assigned_to, created_at) VALUES (?, ?, ?, ?, ?, ?)"
);
insertMaint.run(
  "Inspect dock, ladder & cleats",
  "Check for loose hardware, splinters, lighting, and water damage.",
  "Monthly during lake season",
  "2026-08-01",
  "Dad",
  now
);
insertMaint.run(
  "Service heating & cooling",
  "Replace filters and schedule professional service if performance has changed.",
  "Spring and fall",
  "2026-09-15",
  null,
  now
);

const insertGuide = db.prepare(
  "INSERT INTO guide_sections (position, title, body) VALUES (?, ?, ?)"
);
insertGuide.run(1, "Arrival", "Door code: 12345. Dont park in the street. Set the thermostat to 75 degrees. Check for leaks.");
insertGuide.run(2, "Boat", "Add life jacket locations, boat keys, fuel instructions, dock lines, weather rules, and marina contacts here.");
insertGuide.run(3, "House systems", "Wi-Fi code: OneBigFamily! Breaker panel is in the garage. Refill propane before leaving. AC repair number is: . Tom's Repair is: . Boat repair is: .");
insertGuide.run(4, "Safety & emergencies", "Add the property address, nearest urgent care, first-aid location, fire extinguishers, and emergency contacts here.");
insertGuide.run(5, "Departure checklist", "Ensure the doors and windows are closed and locked. Set the thermostat to 85 degrees. Throw linens in dryer before leaving. Take out trash. Other checkout steps here.");
insertGuide.run(6, "Property notes", "Sprinkler system notes, alarm system, electrical, internet.");

db.prepare(
  "INSERT INTO settings (key, value, updated_at) VALUES ('house_status', 'Ready', ?) ON CONFLICT(key) DO UPDATE SET value = 'Ready', updated_at = excluded.updated_at"
).run(now);

console.log("Seeded lakehouse.db with carried-over content.");

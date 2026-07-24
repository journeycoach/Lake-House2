/*
  Creates tables (via `npm run db:push`) and seeds the Neon database with the
  content carried over from the original site.

  Run: npm run seed
  Idempotent: wipes and re-seeds application content. Safe before launch only.
*/
import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/schema";

async function main() {
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

const db = drizzle(neon(databaseUrl), { schema });
const now = new Date().toISOString();

// Clear dependent tables first so foreign-key constraints remain valid.
await db.delete(schema.outbox);
await db.delete(schema.activityLog);
await db.delete(schema.loginEvents);
await db.delete(schema.stays);
await db.delete(schema.notes);
await db.delete(schema.fixit);
await db.delete(schema.checklist);
await db.delete(schema.maintenance);
await db.delete(schema.guideSections);
await db.delete(schema.settings);
await db.delete(schema.users);
await db.delete(schema.households);

const [john2Household] = await db
  .insert(schema.households)
  .values({ name: "John2", color: "steel" })
  .returning({ id: schema.households.id });
const [jeffHousehold] = await db
  .insert(schema.households)
  .values({ name: "Jeff & Ashlyn", color: "drift" })
  .returning({ id: schema.households.id });
const [johnJennHousehold] = await db
  .insert(schema.households)
  .values({ name: "John & Jenn", color: "pine" })
  .returning({ id: schema.households.id });
const [emmaHousehold] = await db
  .insert(schema.households)
  .values({ name: "Emma", color: "huckle" })
  .returning({ id: schema.households.id });
const [familyHousehold] = await db
  .insert(schema.households)
  .values({ name: "Whole family", color: "dusk" })
  .returning({ id: schema.households.id });

// Accounts known from the original site. The default password is "lakehouse"
// until each person changes it from the Admin page.
const passwordHash = bcrypt.hashSync("lakehouse", 10);
const [jeff] = await db
  .insert(schema.users)
  .values({
    name: "Jeff",
    email: "jeffreyraypaine@gmail.com",
    passwordHash,
    role: "admin",
    householdId: jeffHousehold.id,
    createdAt: now,
  })
  .returning({ id: schema.users.id });
await db.insert(schema.users).values({
  name: "Jenn",
  email: "jenniferpaine@hotmail.com",
  passwordHash,
  role: "admin",
  householdId: johnJennHousehold.id,
  createdAt: now,
});
const [john2] = await db
  .insert(schema.users)
  .values({
    name: "John2",
    email: "johnpaine@gmail.com",
    passwordHash,
    role: "admin",
    householdId: john2Household.id,
    createdAt: now,
  })
  .returning({ id: schema.users.id });

await db.insert(schema.stays).values([
  {
    label: "John2",
    householdId: john2Household.id,
    start: "2026-07-21",
    end: "2026-07-22",
    adults: 2,
    kids: 0,
    note: "motor boatin!",
    createdBy: john2.id,
    createdAt: now,
  },
  {
    label: "Jeff & Ashlyn",
    householdId: jeffHousehold.id,
    start: "2026-07-23",
    end: "2026-07-23",
    adults: 2,
    kids: 0,
    createdBy: jeff.id,
    createdAt: now,
  },
  {
    label: "John & Jenn",
    householdId: johnJennHousehold.id,
    start: "2026-07-24",
    end: "2026-07-27",
    adults: 2,
    kids: 0,
    note: "Arriving after lunch Friday",
    createdBy: john2.id,
    createdAt: now,
  },
  {
    label: "Emma",
    householdId: emmaHousehold.id,
    start: "2026-07-31",
    end: "2026-08-03",
    adults: 2,
    kids: 2,
    note: "Bringing the dog",
    createdAt: now,
  },
  {
    label: "Guys Weekend",
    householdId: familyHousehold.id,
    start: "2026-08-07",
    end: "2026-08-09",
    adults: 4,
    kids: 0,
    createdAt: now,
  },
]);

await db.insert(schema.notes).values([
  {
    authorName: "John2",
    authorId: john2.id,
    body: "The lake is high this week, please tie down everything on the boathouse.",
    tag: "local tip",
    createdAt: now,
  },
  {
    authorName: "John2",
    authorId: john2.id,
    body: "Clean sheets are folded in the hall closet. Please start used towels before you leave.",
    tag: "for the next visit",
    createdAt: now,
  },
  {
    authorName: "John Paine",
    authorId: john2.id,
    body: "Start looking for a boat",
    tag: "house update",
    createdAt: now,
  },
]);

await db.insert(schema.fixit).values([
  {
    title: "Fix the table",
    details: "Table leg has fallen off so the table is laying on the floor",
    location: "Kitchen",
    priority: "urgent",
    assignedTo: "Jeff",
    status: "open",
    createdAt: now,
  },
  {
    title: "Upstairs screen has a tear",
    details: "Small tear in the lower corner.",
    location: "Upstairs bedroom",
    priority: "soon",
    assignedTo: "John3",
    status: "open",
    createdAt: now,
  },
  {
    title: "Dock light is flickering",
    details: "Check the fixture and replace it if needed.",
    location: "Dock",
    priority: "whenever",
    assignedTo: "Dad",
    status: "open",
    createdAt: now,
  },
]);

await db.insert(schema.checklist).values([
  {
    title: "Paper towels",
    details: "We are almost out so get some at Costco",
    addedBy: "John Paine",
    done: 0,
    position: 1,
  },
  {
    title: "Milk",
    details: "Gallon",
    addedBy: "John2",
    done: 0,
    position: 2,
  },
  {
    title: "Propane refill",
    details: "Still needed",
    addedBy: "John2",
    done: 0,
    position: 3,
  },
  {
    title: "Life jackets",
    details: "We need to acquire enough life jackets for each person",
    addedBy: "House",
    done: 0,
    position: 4,
  },
]);

await db.insert(schema.maintenance).values([
  {
    task: "Inspect dock, ladder & cleats",
    details: "Check for loose hardware, splinters, lighting, and water damage.",
    cadence: "Monthly during lake season",
    nextDue: "2026-08-01",
    assignedTo: "Dad",
    createdAt: now,
  },
  {
    task: "Service heating & cooling",
    details:
      "Replace filters and schedule professional service if performance has changed.",
    cadence: "Spring and fall",
    nextDue: "2026-09-15",
    createdAt: now,
  },
]);

await db.insert(schema.guideSections).values([
  {
    position: 1,
    title: "Arrival",
    body: "Door code: 12345. Dont park in the street. Set the thermostat to 75 degrees. Check for leaks.",
  },
  {
    position: 2,
    title: "Boat",
    body: "Add life jacket locations, boat keys, fuel instructions, dock lines, weather rules, and marina contacts here.",
  },
  {
    position: 3,
    title: "House systems",
    body: "Wi-Fi code: OneBigFamily! Breaker panel is in the garage. Refill propane before leaving. AC repair number is: . Tom's Repair is: . Boat repair is: .",
  },
  {
    position: 4,
    title: "Safety & emergencies",
    body: "Add the property address, nearest urgent care, first-aid location, fire extinguishers, and emergency contacts here.",
  },
  {
    position: 5,
    title: "Departure checklist",
    body: "Ensure the doors and windows are closed and locked. Set the thermostat to 85 degrees. Throw linens in dryer before leaving. Take out trash. Other checkout steps here.",
  },
  {
    position: 6,
    title: "Property notes",
    body: "Sprinkler system notes, alarm system, electrical, internet.",
  },
]);

await db.insert(schema.settings).values({
  key: "house_status",
  value: "Ready",
  updatedAt: now,
});

console.log("Seeded Neon with carried-over LakeHouse content.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import {
  sqliteTable,
  text,
  integer,
} from "drizzle-orm/sqlite-core";

/*
  Schema notes:
  - SQLite locally. Types chosen to port cleanly to Postgres (Neon) later.
  - Dates are ISO strings (YYYY-MM-DD) so they sort and compare lexically.
  - assigned/added names are plain strings where the source site used plain
    names, so we never invent accounts for people who have none yet.
*/

export const households = sqliteTable("households", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  color: text("color").notNull(), // token: steel | pine | drift | huckle | dusk | reed
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("member"), // admin | member
  householdId: integer("household_id").references(() => households.id),
  createdAt: text("created_at").notNull(),
});

export const stays = sqliteTable("stays", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  label: text("label").notNull(), // display name: household or group ("Guys Weekend")
  householdId: integer("household_id").references(() => households.id),
  start: text("start").notNull(), // YYYY-MM-DD, first night
  end: text("end").notNull(), // YYYY-MM-DD, last night
  adults: integer("adults").notNull().default(0),
  kids: integer("kids").notNull().default(0),
  note: text("note"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: text("created_at").notNull(),
});

export const notes = sqliteTable("notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  authorName: text("author_name").notNull(),
  authorId: integer("author_id").references(() => users.id),
  body: text("body").notNull(),
  tag: text("tag").notNull(), // local tip | house update | for the next visit
  createdAt: text("created_at").notNull(),
});

export const fixit = sqliteTable("fixit", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  details: text("details"),
  location: text("location"),
  priority: text("priority").notNull().default("whenever"), // urgent | soon | whenever
  assignedTo: text("assigned_to"), // plain name
  status: text("status").notNull().default("open"), // open | done
  createdAt: text("created_at").notNull(),
});

export const checklist = sqliteTable("checklist", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  details: text("details"),
  addedBy: text("added_by").notNull(),
  done: integer("done").notNull().default(0),
  position: integer("position").notNull(),
});

export const maintenance = sqliteTable("maintenance", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  task: text("task").notNull(),
  details: text("details"),
  cadence: text("cadence"), // "Monthly during lake season"
  nextDue: text("next_due"), // YYYY-MM-DD
  assignedTo: text("assigned_to"),
  createdAt: text("created_at").notNull(),
});

export const guideSections = sqliteTable("guide_sections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  position: integer("position").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const loginEvents = sqliteTable("login_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  userId: integer("user_id").references(() => users.id),
  success: integer("success").notNull(),
  at: text("at").notNull(),
});

/* Every email the app wants to send lands here first. If RESEND_API_KEY is
   set it also actually sends. Admin can read the outbox either way. */
export const outbox = sqliteTable("outbox", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  toEmail: text("to_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  kind: text("kind").notNull(), // checkin-reminder | checkout-reminder | note | manual
  status: text("status").notNull().default("logged"), // logged | sent | failed
  createdAt: text("created_at").notNull(),
});

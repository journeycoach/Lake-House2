import {
  integer,
  pgTable,
  serial,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/*
  Schema notes:
  - PostgreSQL on Neon in every environment.
  - Dates are ISO strings (YYYY-MM-DD) so they sort and compare lexically.
  - assigned/added names are plain strings where the source site used plain
    names, so we never invent accounts for people who have none yet.
*/

export const households = pgTable("households", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").notNull(), // token: steel | pine | drift | huckle | dusk | reed
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("family"), // admin | household | family
  householdId: integer("household_id").references(() => households.id),
  createdAt: text("created_at").notNull(),
  // Set when an admin creates or approves an account, cleared once the person
  // picks their own password. Drives the "still on a starting password" banner.
  mustChangePassword: integer("must_change_password").notNull().default(0),
  // Bumped to invalidate every existing session cookie for this user.
  sessionVersion: integer("session_version").notNull().default(0),
});

export const stays = pgTable("stays", {
  id: serial("id").primaryKey(),
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

/* Admin-managed arrival/boat/departure templates are copied into each new stay. */
export const stayChecklistTemplates = pgTable("stay_checklist_templates", {
  id: serial("id").primaryKey(),
  phase: text("phase").notNull(), // checkin | boat | checkout
  title: text("title").notNull(),
  position: integer("position").notNull(),
  active: integer("active").notNull().default(1),
  createdAt: text("created_at").notNull(),
});

export const stayChecklistCompletions = pgTable(
  "stay_checklist_completions",
  {
    id: serial("id").primaryKey(),
    stayId: integer("stay_id")
      .notNull()
      .references(() => stays.id, { onDelete: "cascade" }),
    templateId: integer("template_id")
      .notNull()
      .references(() => stayChecklistTemplates.id, { onDelete: "cascade" }),
    checkedBy: text("checked_by").notNull(),
    checkedAt: text("checked_at").notNull(),
  },
  (table) => [
    uniqueIndex("stay_checklist_completion_unique").on(
      table.stayId,
      table.templateId
    ),
  ]
);

/* A frozen copy of the template for one reservation. Template edits affect
   future reservations only, while these rows preserve each visit's record. */
export const stayChecklistItems = pgTable(
  "stay_checklist_items",
  {
    id: serial("id").primaryKey(),
    stayId: integer("stay_id")
      .notNull()
      .references(() => stays.id, { onDelete: "cascade" }),
    templateId: integer("template_id").references(
      () => stayChecklistTemplates.id,
      { onDelete: "set null" }
    ),
    phase: text("phase").notNull(), // checkin | boat | checkout
    title: text("title").notNull(),
    position: integer("position").notNull(),
    checkedBy: text("checked_by"),
    checkedAt: text("checked_at"),
  },
  (table) => [
    uniqueIndex("stay_checklist_item_position_unique").on(
      table.stayId,
      table.phase,
      table.position
    ),
  ]
);

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  authorName: text("author_name").notNull(),
  authorId: integer("author_id").references(() => users.id),
  body: text("body").notNull(),
  tag: text("tag").notNull(), // local tip | house update | for the next visit
  createdAt: text("created_at").notNull(),
});

export const fixit = pgTable("fixit", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  details: text("details"),
  location: text("location"),
  priority: text("priority").notNull().default("whenever"), // urgent | soon | whenever
  assignedTo: text("assigned_to"), // plain name
  photoUrl: text("photo_url"),
  reportedBy: text("reported_by"),
  status: text("status").notNull().default("open"), // open | done
  createdAt: text("created_at").notNull(),
});

export const checklist = pgTable("checklist", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  details: text("details"),
  addedBy: text("added_by").notNull(),
  checkedBy: text("checked_by"),
  done: integer("done").notNull().default(0),
  position: integer("position").notNull(),
});

export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category"),
  location: text("location"),
  manufacturer: text("manufacturer"),
  model: text("model"),
  serialNumber: text("serial_number"),
  installedOn: text("installed_on"),
  warrantyUntil: text("warranty_until"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const serviceRecords = pgTable("service_records", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id")
    .notNull()
    .references(() => equipment.id, { onDelete: "cascade" }),
  servicedOn: text("serviced_on").notNull(),
  serviceType: text("service_type").notNull(),
  provider: text("provider"),
  costCents: integer("cost_cents"),
  notes: text("notes"),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
});

export const maintenance = pgTable("maintenance", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").references(() => equipment.id, {
    onDelete: "set null",
  }),
  task: text("task").notNull(),
  details: text("details"),
  cadence: text("cadence"), // "Monthly during lake season"
  nextDue: text("next_due"), // YYYY-MM-DD
  assignedTo: text("assigned_to"),
  createdAt: text("created_at").notNull(),
});

export const guideSections = pgTable("guide_sections", {
  id: serial("id").primaryKey(),
  position: integer("position").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  // Lowest tier that can see this section at all. "family" means everyone.
  minRole: text("min_role").notNull().default("family"),
});

/* The house guide is built from these: a section holds any number of blocks,
   each rendered by kind. Codes stay hidden until someone asks to see them,
   photos open full size, and any single block can be limited to a tier. */
export const guideBlocks = pgTable("guide_blocks", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id")
    .notNull()
    .references(() => guideSections.id),
  position: integer("position").notNull(),
  kind: text("kind").notNull(), // text | secret | photo | contact | address
  label: text("label"),
  value: text("value").notNull(),
  minRole: text("min_role").notNull().default("family"),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const loginEvents = pgTable("login_events", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  userId: integer("user_id").references(() => users.id),
  success: integer("success").notNull(),
  at: text("at").notNull(),
});

/* Who did what, when: bookings, check-offs, edits. Shown on Admin. */
export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  userName: text("user_name").notNull(),
  action: text("action").notNull(), // short verb phrase
  detail: text("detail"), // what it applied to
  at: text("at").notNull(),
});

/* Single-use tokens for setting a password without being signed in: either a
   forgotten-password reset, or the first password on a newly approved account.
   Only the hash is stored, so a leaked database row cannot be used as a link. */
export const passwordTokens = pgTable("password_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  tokenHash: text("token_hash").notNull(),
  purpose: text("purpose").notNull(), // reset | invite
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  createdAt: text("created_at").notNull(),
});

/* Someone asking to join. No account exists until an admin approves. */
export const accessRequests = pgTable("access_requests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message"),
  status: text("status").notNull().default("pending"), // pending | approved | declined
  createdAt: text("created_at").notNull(),
  decidedBy: text("decided_by"),
  decidedAt: text("decided_at"),
});

/* Every email the app wants to send lands here first. If RESEND_API_KEY is
   set it also actually sends. Admin can read the outbox either way. */
export const outbox = pgTable("outbox", {
  id: serial("id").primaryKey(),
  toEmail: text("to_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  kind: text("kind").notNull(), // checkin-reminder | checkout-reminder | overlap-notice | note | manual
  status: text("status").notNull().default("logged"), // logged | sent | failed
  createdAt: text("created_at").notNull(),
});

CREATE TABLE "equipment" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"location" text,
	"manufacturer" text,
	"model" text,
	"serial_number" text,
	"installed_on" text,
	"warranty_until" text,
	"notes" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"equipment_id" integer NOT NULL,
	"serviced_on" text NOT NULL,
	"service_type" text NOT NULL,
	"provider" text,
	"cost_cents" integer,
	"notes" text,
	"created_by" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stay_checklist_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"stay_id" integer NOT NULL,
	"template_id" integer NOT NULL,
	"checked_by" text NOT NULL,
	"checked_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stay_checklist_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"phase" text NOT NULL,
	"title" text NOT NULL,
	"position" integer NOT NULL,
	"active" integer DEFAULT 1 NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
INSERT INTO "stay_checklist_templates"
  ("phase", "title", "position", "active", "created_at")
VALUES
  ('checkin', 'Walk through the house and report any issues', 1, 1, '2026-08-11T00:00:00.000Z'),
  ('checkin', 'Set the thermostat for the stay', 2, 1, '2026-08-11T00:00:00.000Z'),
  ('checkin', 'Confirm water and utilities are ready', 3, 1, '2026-08-11T00:00:00.000Z'),
  ('checkin', 'Review lake and house safety with guests', 4, 1, '2026-08-11T00:00:00.000Z'),
  ('checkout', 'Wash dishes and wipe down the kitchen', 1, 1, '2026-08-11T00:00:00.000Z'),
  ('checkout', 'Start used towels and linens', 2, 1, '2026-08-11T00:00:00.000Z'),
  ('checkout', 'Take out trash and recycling', 3, 1, '2026-08-11T00:00:00.000Z'),
  ('checkout', 'Set the thermostat and turn off lights', 4, 1, '2026-08-11T00:00:00.000Z'),
  ('checkout', 'Lock doors and windows', 5, 1, '2026-08-11T00:00:00.000Z');
--> statement-breakpoint
ALTER TABLE "fixit" ADD COLUMN "photo_url" text;--> statement-breakpoint
ALTER TABLE "fixit" ADD COLUMN "reported_by" text;--> statement-breakpoint
ALTER TABLE "maintenance" ADD COLUMN "equipment_id" integer;--> statement-breakpoint
ALTER TABLE "service_records" ADD CONSTRAINT "service_records_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stay_checklist_completions" ADD CONSTRAINT "stay_checklist_completions_stay_id_stays_id_fk" FOREIGN KEY ("stay_id") REFERENCES "public"."stays"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stay_checklist_completions" ADD CONSTRAINT "stay_checklist_completions_template_id_stay_checklist_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."stay_checklist_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "stay_checklist_completion_unique" ON "stay_checklist_completions" USING btree ("stay_id","template_id");--> statement-breakpoint
ALTER TABLE "maintenance" ADD CONSTRAINT "maintenance_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE set null ON UPDATE no action;

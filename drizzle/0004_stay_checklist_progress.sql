CREATE TABLE "stay_checklist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"stay_id" integer NOT NULL,
	"template_id" integer,
	"phase" text NOT NULL,
	"title" text NOT NULL,
	"position" integer NOT NULL,
	"checked_by" text,
	"checked_at" text
);
--> statement-breakpoint
ALTER TABLE "stay_checklist_items" ADD CONSTRAINT "stay_checklist_items_stay_id_stays_id_fk" FOREIGN KEY ("stay_id") REFERENCES "public"."stays"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stay_checklist_items" ADD CONSTRAINT "stay_checklist_items_template_id_stay_checklist_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."stay_checklist_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
INSERT INTO "stay_checklist_items"
  ("stay_id", "template_id", "phase", "title", "position", "checked_by", "checked_at")
SELECT
  s."id",
  t."id",
  t."phase",
  t."title",
  row_number() OVER (
    PARTITION BY s."id", t."phase"
    ORDER BY t."position", t."id"
  )::integer,
  c."checked_by",
  c."checked_at"
FROM "stays" s
CROSS JOIN "stay_checklist_templates" t
LEFT JOIN "stay_checklist_completions" c
  ON c."stay_id" = s."id" AND c."template_id" = t."id"
WHERE t."active" = 1;--> statement-breakpoint
CREATE UNIQUE INDEX "stay_checklist_item_position_unique" ON "stay_checklist_items" USING btree ("stay_id","phase","position");

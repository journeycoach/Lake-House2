UPDATE "guide_sections"
SET "title" = 'Departure Check List'
WHERE regexp_replace(lower("title"), '[^a-z]', '', 'g') IN ('departure', 'departurechecklist');
--> statement-breakpoint
UPDATE "guide_sections"
SET "title" = 'Boat Check List'
WHERE regexp_replace(lower("title"), '[^a-z]', '', 'g') IN ('boat', 'boatchecklist');
--> statement-breakpoint
UPDATE "guide_sections"
SET "title" = 'Emergency Information'
WHERE regexp_replace(lower("title"), '[^a-z]', '', 'g') IN (
  'safetyemergencies',
  'emergencyinfo',
  'emergencyinformation'
);
--> statement-breakpoint
INSERT INTO "stay_checklist_templates"
  ("phase", "title", "position", "active", "created_at")
SELECT task."phase", task."title", task."position", 1, '2026-08-14T00:00:00.000Z'
FROM (
  VALUES
    ('boat', 'Fuel Level', 1),
    ('boat', 'Visually check the boat for damage', 2),
    ('boat', 'Verify LifeJacklets for each person', 3),
    ('boat', 'Report any issues you find', 4)
) AS task("phase", "title", "position")
WHERE NOT EXISTS (
  SELECT 1
  FROM "stay_checklist_templates" existing
  WHERE existing."phase" = task."phase"
    AND existing."title" = task."title"
    AND existing."active" = 1
);
--> statement-breakpoint
INSERT INTO "stay_checklist_items"
  ("stay_id", "template_id", "phase", "title", "position")
SELECT
  stay."id",
  template."id",
  template."phase",
  template."title",
  row_number() OVER (
    PARTITION BY stay."id", template."phase"
    ORDER BY template."position", template."id"
  )::integer
FROM "stays" stay
CROSS JOIN "stay_checklist_templates" template
WHERE template."phase" = 'boat'
  AND template."active" = 1
  AND NOT EXISTS (
    SELECT 1
    FROM "stay_checklist_items" existing
    WHERE existing."stay_id" = stay."id"
      AND existing."phase" = 'boat'
  );

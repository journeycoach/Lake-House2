UPDATE "guide_sections"
SET "title" = CASE
  WHEN regexp_replace(lower("title"), '[^a-z]', '', 'g') IN ('arrival', 'arrivalchecklist')
    THEN 'Arrival Checklist'
  WHEN regexp_replace(lower("title"), '[^a-z]', '', 'g') IN ('departure', 'departurechecklist')
    THEN 'Departure Checklist'
  WHEN regexp_replace(lower("title"), '[^a-z]', '', 'g') IN ('boat', 'boatchecklist')
    THEN 'Boat Checklist'
END
WHERE regexp_replace(lower("title"), '[^a-z]', '', 'g') IN (
  'arrival', 'arrivalchecklist',
  'departure', 'departurechecklist',
  'boat', 'boatchecklist'
);

/*
  Bring databases created from the committed migrations up to the schema used
  by the application. These additions previously existed only in schema.ts.

  IF NOT EXISTS keeps this safe for the original database, where the columns
  and tables already exist, while fully initializing a new empty database.
*/
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "must_change_password" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "session_version" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "guide_sections"
  ADD COLUMN IF NOT EXISTS "min_role" text DEFAULT 'family' NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "guide_blocks" (
  "id" serial PRIMARY KEY NOT NULL,
  "section_id" integer NOT NULL,
  "position" integer NOT NULL,
  "kind" text NOT NULL,
  "label" text,
  "value" text NOT NULL,
  "min_role" text DEFAULT 'family' NOT NULL,
  CONSTRAINT "guide_blocks_section_id_guide_sections_id_fk"
    FOREIGN KEY ("section_id") REFERENCES "public"."guide_sections"("id")
    ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "password_tokens" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "token_hash" text NOT NULL,
  "purpose" text NOT NULL,
  "expires_at" text NOT NULL,
  "used_at" text,
  "created_at" text NOT NULL,
  CONSTRAINT "password_tokens_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
    ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "access_requests" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "message" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "created_at" text NOT NULL,
  "decided_by" text,
  "decided_at" text
);

CREATE TABLE "reset_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"at" text NOT NULL
);

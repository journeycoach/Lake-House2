ALTER TABLE "activity_log" DROP CONSTRAINT "activity_log_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "login_events" DROP CONSTRAINT "login_events_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "notes" DROP CONSTRAINT "notes_author_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "stays" DROP CONSTRAINT "stays_created_by_users_id_fk";--> statement-breakpoint
ALTER TABLE "password_tokens" DROP CONSTRAINT "password_tokens_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_events" ADD CONSTRAINT "login_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stays" ADD CONSTRAINT "stays_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_tokens" ADD CONSTRAINT "password_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

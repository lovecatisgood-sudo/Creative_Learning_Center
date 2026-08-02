CREATE TYPE "public"."admin_role" AS ENUM('manager', 'staff');--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "display_name" text;--> statement-breakpoint
-- Existing administrators predate role-based access and must retain full
-- access through deployment. New accounts default to the least-privileged
-- staff role after the backfill is complete.
ALTER TABLE "admins" ADD COLUMN "role" "admin_role" DEFAULT 'manager' NOT NULL;--> statement-breakpoint
ALTER TABLE "admins" ALTER COLUMN "role" SET DEFAULT 'staff';--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "active" boolean DEFAULT true NOT NULL;

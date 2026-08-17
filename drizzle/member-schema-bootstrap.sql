DO $$ BEGIN
  CREATE TYPE "public"."member_token_type" AS ENUM('purchase_claim', 'email_verify', 'email_signin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."member_consent_type" AS ENUM('terms', 'privacy', 'marketing');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."member_consent_source" AS ENUM('signup', 'staff', 'email_binding');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "member_accounts" (
  "id" serial PRIMARY KEY NOT NULL,
  "parent_id" integer NOT NULL,
  "public_uid" text NOT NULL,
  "phone_normalized" text NOT NULL,
  "email_normalized" text,
  "email_verified_at" timestamp with time zone,
  "preferred_language" text DEFAULT 'th' NOT NULL,
  "session_version" integer DEFAULT 1 NOT NULL,
  "last_access_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "member_accounts_parent_id_unique" UNIQUE("parent_id"),
  CONSTRAINT "member_accounts_public_uid_unique" UNIQUE("public_uid"),
  CONSTRAINT "member_accounts_email_normalized_unique" UNIQUE("email_normalized")
);

CREATE TABLE IF NOT EXISTS "member_consents" (
  "id" serial PRIMARY KEY NOT NULL,
  "member_account_id" integer NOT NULL,
  "type" "member_consent_type" NOT NULL,
  "policy_version" text NOT NULL,
  "source" "member_consent_source" NOT NULL,
  "admin_id" integer,
  "accepted_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "member_uid_aliases" (
  "id" serial PRIMARY KEY NOT NULL,
  "member_account_id" integer NOT NULL,
  "public_uid" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "member_uid_aliases_public_uid_unique" UNIQUE("public_uid")
);

CREATE TABLE IF NOT EXISTS "member_access_tokens" (
  "id" serial PRIMARY KEY NOT NULL,
  "member_account_id" integer NOT NULL,
  "order_id" integer,
  "type" "member_token_type" NOT NULL,
  "token_hash" text NOT NULL,
  "pending_email" text,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "created_by_admin" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "member_access_tokens_token_hash_unique" UNIQUE("token_hash")
);

DO $$ BEGIN
  ALTER TABLE "member_accounts" ADD CONSTRAINT "member_accounts_parent_id_parents_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."parents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "member_uid_aliases" ADD CONSTRAINT "member_uid_aliases_member_account_id_member_accounts_id_fk" FOREIGN KEY ("member_account_id") REFERENCES "public"."member_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "member_consents" ADD CONSTRAINT "member_consents_member_account_id_member_accounts_id_fk" FOREIGN KEY ("member_account_id") REFERENCES "public"."member_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "member_consents" ADD CONSTRAINT "member_consents_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "member_access_tokens" ADD CONSTRAINT "member_access_tokens_member_account_id_member_accounts_id_fk" FOREIGN KEY ("member_account_id") REFERENCES "public"."member_accounts"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "member_access_tokens" ADD CONSTRAINT "member_access_tokens_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "member_access_tokens" ADD CONSTRAINT "member_access_tokens_created_by_admin_admins_id_fk" FOREIGN KEY ("created_by_admin") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "member_access_tokens_member_type_idx" ON "member_access_tokens" ("member_account_id", "type");
CREATE INDEX IF NOT EXISTS "member_access_tokens_expiry_idx" ON "member_access_tokens" ("expires_at");
CREATE INDEX IF NOT EXISTS "member_consents_member_idx" ON "member_consents" ("member_account_id", "accepted_at");
CREATE INDEX IF NOT EXISTS "member_accounts_phone_idx" ON "member_accounts" ("phone_normalized");

INSERT INTO "member_accounts" ("parent_id", "public_uid", "phone_normalized", "preferred_language")
SELECT
  p."id",
  'SCM-' || substr(translate(upper(md5('sccc-member-v2:' || p."id"::text)), '01', 'YZ'), 1, 4) || '-' || substr(translate(upper(md5('sccc-member-v2:' || p."id"::text)), '01', 'YZ'), 5, 4) || '-' || substr(translate(upper(md5('sccc-member-v2:' || p."id"::text)), '01', 'YZ'), 9, 4),
  regexp_replace(p."phone", '[^0-9+]', '', 'g'),
  'th'
FROM "parents" p
ON CONFLICT ("parent_id") DO NOTHING;

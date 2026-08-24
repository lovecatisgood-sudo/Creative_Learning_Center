CREATE TABLE IF NOT EXISTS "creative_member_identity_links" (
  "id" serial PRIMARY KEY NOT NULL,
  "member_account_id" integer NOT NULL UNIQUE REFERENCES "member_accounts"("id"),
  "issuer" text NOT NULL,
  "subject" text NOT NULL,
  "verified_email" text NOT NULL,
  "status" text DEFAULT 'active' NOT NULL CHECK ("status" IN ('active', 'replaced', 'removed', 'conflict')),
  "linked_source" text NOT NULL,
  "linked_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "creative_member_identity_unique" ON "creative_member_identity_links" ("issuer", "subject");
CREATE TABLE IF NOT EXISTS "creative_member_link_attempts" (
  "id" serial PRIMARY KEY NOT NULL,
  "member_account_id" integer NOT NULL REFERENCES "member_accounts"("id"),
  "status" text DEFAULT 'pending' NOT NULL CHECK ("status" IN ('pending', 'linked', 'failed')),
  "correlation_id" text NOT NULL UNIQUE,
  "error_code" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "creative_member_link_attempts_member_idx" ON "creative_member_link_attempts" ("member_account_id", "created_at" DESC);

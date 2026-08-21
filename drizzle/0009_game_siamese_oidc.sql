ALTER TABLE "game_players" ADD COLUMN IF NOT EXISTS "siamese_issuer" text;--> statement-breakpoint
ALTER TABLE "game_players" ADD COLUMN IF NOT EXISTS "siamese_subject" text;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "game_players_siamese_identity_unique" ON "game_players" USING btree ("siamese_issuer", "siamese_subject");

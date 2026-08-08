ALTER TABLE "game_players" ADD COLUMN "google_sub" text;--> statement-breakpoint
ALTER TABLE "game_players" ADD COLUMN "avatar_url" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "game_players" ADD CONSTRAINT "game_players_google_sub_unique" UNIQUE("google_sub");
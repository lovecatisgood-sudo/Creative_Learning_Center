CREATE TABLE "house_ad_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"language" text DEFAULT 'all' NOT NULL,
	"video_url" text DEFAULT '' NOT NULL,
	"poster_url" text DEFAULT '' NOT NULL,
	"cta_label" text DEFAULT '' NOT NULL,
	"destination_url" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"weight" integer DEFAULT 100 NOT NULL,
	"skip_after_seconds" integer DEFAULT 10 NOT NULL,
	"cooldown_seconds" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "house_ad_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"player_id" integer,
	"event_type" text NOT NULL,
	"placement" text DEFAULT 'game_over_restart' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "house_ad_events" ADD CONSTRAINT "house_ad_events_campaign_id_house_ad_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."house_ad_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "house_ad_events" ADD CONSTRAINT "house_ad_events_player_id_game_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."game_players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
INSERT INTO "house_ad_campaigns" ("name", "category", "language", "video_url", "cta_label", "destination_url", "active", "weight", "skip_after_seconds", "cooldown_seconds") VALUES
	('Siamese Cat Café', 'cafe', 'en', '/game-ads/siamese-cat-cafe-en.mp4', 'Visit Siamese Cat Café', 'https://siamesecat.cafe', false, 100, 10, 120),
	('Siamese Cat Creative Club', 'learning_center', 'en', '/game-ads/creative-club-en.mp4', 'Explore Creative Club', 'https://creative.siamesecat.cafe/EN/creative', false, 100, 10, 120);

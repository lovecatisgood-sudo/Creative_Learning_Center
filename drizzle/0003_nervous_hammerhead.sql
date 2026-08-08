CREATE TABLE "game_players" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" text NOT NULL,
	"display_name" text NOT NULL,
	"email" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"marketing_consent" boolean DEFAULT false NOT NULL,
	"terms_accepted_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "game_players_public_id_unique" UNIQUE("public_id"),
	CONSTRAINT "game_players_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "game_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"score" integer NOT NULL,
	"mode" text NOT NULL,
	"stage" integer NOT NULL,
	"victory" boolean DEFAULT false NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "game_runs" ADD CONSTRAINT "game_runs_player_id_game_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."game_players"("id") ON DELETE no action ON UPDATE no action;
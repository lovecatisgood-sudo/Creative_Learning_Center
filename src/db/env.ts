import { config as loadEnv } from "dotenv";

// Load env for CLI scripts (migrate/seed/create-admin) the way Next.js does:
// .env.local overrides .env. Next loads these automatically for the app itself;
// standalone tsx scripts do not, so we load them explicitly here.
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

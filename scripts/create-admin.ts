import "../src/db/env";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { admins } from "../src/db/schema";

// Usage:
//   pnpm create-admin <email> <password>
// Hashes the password (bcrypt), upserts the single admin row so it gets a real
// id for audit logging, and prints ADMIN_EMAIL / ADMIN_PASSWORD_HASH to paste
// into .env. If DATABASE_URL is unset it still prints the hash.
async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Usage: pnpm create-admin <email> <password>");
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);
  const normEmail = email.toLowerCase().trim();

  console.log("\nAdd these to your .env:");
  console.log(`ADMIN_EMAIL=${normEmail}`);
  console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);

  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL not set — skipped DB upsert (hash printed above).");
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : undefined,
  });
  const db = drizzle(pool);
  await db
    .insert(admins)
    .values({ email: normEmail, passwordHash: hash })
    .onConflictDoUpdate({ target: admins.email, set: { passwordHash: hash } });
  console.log(`Admin row upserted for ${normEmail}.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

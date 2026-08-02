import "../src/db/env";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { admins } from "../src/db/schema";
import { isAdminRole } from "../src/lib/admin-roles";

// Usage:
//   pnpm create-admin <email> <password> [manager|staff]
// Hashes the password (bcrypt) and upserts a role-based team account. Manager
// accounts also print optional bootstrap environment credentials; staff
// accounts always require the database so they cannot inherit env-manager access.
async function main() {
  const [email, password, requestedRole = "manager"] = process.argv.slice(2);
  if (!email || !password || !isAdminRole(requestedRole)) {
    console.error("Usage: pnpm create-admin <email> <password> [manager|staff]");
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);
  const normEmail = email.toLowerCase().trim();
  const role = requestedRole;

  if (role === "manager") {
    console.log("\nOptional bootstrap fallback for your .env:");
    console.log(`ADMIN_EMAIL=${normEmail}`);
    console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
  }

  if (!process.env.DATABASE_URL) {
    if (role === "staff") {
      throw new Error("DATABASE_URL is required to create a staff account");
    }
    console.log("DATABASE_URL not set — skipped DB upsert (manager bootstrap hash printed above).");
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
    .values({ email: normEmail, passwordHash: hash, role, active: true })
    .onConflictDoUpdate({ target: admins.email, set: { passwordHash: hash, role, active: true } });
  console.log(`${role} account upserted for ${normEmail}.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

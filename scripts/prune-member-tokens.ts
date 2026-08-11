import { and, isNotNull, lt, or } from "drizzle-orm";
import { db } from "../src/db";
import { memberAccessTokens } from "../src/db/schema";

async function main() {
  if (process.env.MEMBER_TOKEN_PRUNE !== "1") {
    throw new Error("Refusing to prune tokens unless MEMBER_TOKEN_PRUNE=1 is set");
  }

  const retentionDays = Number(process.env.MEMBER_TOKEN_RETENTION_DAYS || "30");
  if (!Number.isInteger(retentionDays) || retentionDays < 7 || retentionDays > 365) {
    throw new Error("MEMBER_TOKEN_RETENTION_DAYS must be an integer from 7 to 365");
  }

  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60_000);
  const deleted = await db
    .delete(memberAccessTokens)
    .where(or(
      lt(memberAccessTokens.expiresAt, cutoff),
      and(isNotNull(memberAccessTokens.usedAt), lt(memberAccessTokens.usedAt, cutoff)),
    ))
    .returning({ id: memberAccessTokens.id });

  console.log(`member-token-prune → removed ${deleted.length} token record(s) older than ${retentionDays} days`);
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});

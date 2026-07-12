import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { auditLog } from "@/db/schema";
import type * as schema from "@/db/schema";

// A drizzle transaction handle exposes the same query surface as `db`.
export type DbOrTx =
  | NodePgDatabase<typeof schema>
  | Parameters<Parameters<NodePgDatabase<typeof schema>["transaction"]>[0]>[0];

// Every mutation of money, hours, or credits writes an audit_log row (PRD §7.7).
// Always call inside the same transaction as the mutation, passing the tx handle.
export async function writeAudit(
  tx: DbOrTx,
  args: {
    adminId: number | null;
    action: string;
    entity: string;
    entityId: number | null;
    detail?: unknown;
  }
) {
  await tx.insert(auditLog).values({
    // adminId -1 marks an env-only admin (pre-seed); store null rather than a bad FK.
    adminId: args.adminId && args.adminId > 0 ? args.adminId : null,
    action: args.action,
    entity: args.entity,
    entityId: args.entityId,
    detail: (args.detail ?? null) as object | null,
  });
}

import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import {
  addonRedemptions,
  children,
  memberAccounts,
  memberConsents,
  orders,
  packageInstances,
  parents,
  products,
  sessions,
} from "@/db/schema";
import type { CurrentMember } from "@/lib/member-auth";
import { effectiveStatus } from "@/lib/product";

export type MemberPortalData = {
  member: {
    publicUid: string;
    name: string;
    phone: string;
    email: string | null;
    verified: boolean;
    access: "temporary" | "verified";
    preferredLanguage: string;
  };
  children: Array<{
    id: number;
    name: string;
    packages: Array<{
      id: number;
      nameEn: string;
      nameTh: string;
      status: "available" | "active" | "consumed" | "expired";
      hoursTotal: number;
      hoursRemaining: number;
      crayonCreditsRemaining: number;
      clayCreditsRemaining: number;
      extraHoursRemaining: number;
      expiresAt: string | null;
    }>;
    activeSession: null | {
      id: number;
      nameEn: string;
      nameTh: string;
      startedAt: string;
      plannedEndAt: string;
      hoursRemaining: number;
    };
  }>;
  history: Array<{
    kind: "purchase" | "session" | "redemption";
    id: number;
    childName: string;
    at: string;
    titleEn: string;
    titleTh: string;
    detailEn: string;
    detailTh: string;
  }>;
  consents: Array<{ type: string; policyVersion: string; acceptedAt: string }>;
};

export async function getMemberPortalData(member: CurrentMember): Promise<MemberPortalData | null> {
  const [identity] = await db
    .select({
      publicUid: memberAccounts.publicUid,
      emailNormalized: memberAccounts.emailNormalized,
      emailVerifiedAt: memberAccounts.emailVerifiedAt,
      preferredLanguage: memberAccounts.preferredLanguage,
      name: parents.name,
      phone: parents.phone,
    })
    .from(memberAccounts)
    .innerJoin(parents, eq(memberAccounts.parentId, parents.id))
    .where(and(eq(memberAccounts.id, member.id), eq(parents.id, member.parentId)))
    .limit(1);
  if (!identity) return null;

  const childRows = await db
    .select({ id: children.id, name: children.name })
    .from(children)
    .where(eq(children.parentId, member.parentId));
  const childIds = childRows.map((child) => child.id);

  const packageRows = childIds.length
    ? await db
        .select({
          id: packageInstances.id,
          childId: packageInstances.ownerChildId,
          nameEn: products.nameEn,
          nameTh: products.nameTh,
          status: packageInstances.status,
          hoursTotal: packageInstances.hoursTotal,
          hoursRemaining: packageInstances.hoursRemaining,
          crayonCreditsRemaining: packageInstances.crayonCreditsRemaining,
          clayCreditsRemaining: packageInstances.clayCreditsRemaining,
          extraHoursRemaining: packageInstances.extraHoursRemaining,
          expiresAt: packageInstances.expiresAt,
          createdAt: packageInstances.createdAt,
        })
        .from(packageInstances)
        .innerJoin(products, eq(packageInstances.productId, products.id))
        .where(inArray(packageInstances.ownerChildId, childIds))
        .orderBy(desc(packageInstances.createdAt))
    : [];

  const activeRows = childIds.length
    ? await db
        .select({
          id: sessions.id,
          childId: sessions.childId,
          nameEn: products.nameEn,
          nameTh: products.nameTh,
          startedAt: sessions.startedAt,
          plannedEndAt: sessions.plannedEndAt,
          hoursRemaining: packageInstances.hoursRemaining,
        })
        .from(sessions)
        .innerJoin(packageInstances, eq(sessions.packageInstanceId, packageInstances.id))
        .innerJoin(products, eq(packageInstances.productId, products.id))
        .where(and(inArray(sessions.childId, childIds), eq(sessions.status, "running")))
    : [];

  const purchaseRows = childIds.length
    ? await db
        .select({
          id: orders.id,
          childName: children.name,
          receiptNo: orders.receiptNo,
          totalThb: orders.totalThb,
          createdAt: orders.createdAt,
        })
        .from(orders)
        .innerJoin(children, eq(orders.childId, children.id))
        .where(and(eq(orders.parentId, member.parentId), eq(orders.status, "paid")))
        .orderBy(desc(orders.createdAt))
        .limit(100)
    : [];

  const completedRows = childIds.length
    ? await db
        .select({
          id: sessions.id,
          childName: children.name,
          productEn: products.nameEn,
          productTh: products.nameTh,
          hoursBooked: sessions.hoursBooked,
          hoursRefunded: sessions.hoursRefunded,
          endedAt: sessions.endedAt,
        })
        .from(sessions)
        .innerJoin(children, eq(sessions.childId, children.id))
        .innerJoin(packageInstances, eq(sessions.packageInstanceId, packageInstances.id))
        .innerJoin(products, eq(packageInstances.productId, products.id))
        .where(and(inArray(sessions.childId, childIds), eq(sessions.status, "completed"), isNotNull(sessions.endedAt)))
        .orderBy(desc(sessions.endedAt))
        .limit(100)
    : [];

  const redemptionRows = childIds.length
    ? await db
        .select({
          id: addonRedemptions.id,
          childName: children.name,
          type: addonRedemptions.type,
          productEn: products.nameEn,
          productTh: products.nameTh,
          redeemedAt: addonRedemptions.redeemedAt,
        })
        .from(addonRedemptions)
        .innerJoin(children, eq(addonRedemptions.childId, children.id))
        .innerJoin(packageInstances, eq(addonRedemptions.packageInstanceId, packageInstances.id))
        .innerJoin(products, eq(packageInstances.productId, products.id))
        .where(inArray(addonRedemptions.childId, childIds))
        .orderBy(desc(addonRedemptions.redeemedAt))
        .limit(100)
    : [];

  const consentRows = await db
    .select({
      type: memberConsents.type,
      policyVersion: memberConsents.policyVersion,
      acceptedAt: memberConsents.acceptedAt,
    })
    .from(memberConsents)
    .where(eq(memberConsents.memberAccountId, member.id))
    .orderBy(desc(memberConsents.acceptedAt));

  const now = new Date();
  const packagesByChild = new Map<number, MemberPortalData["children"][number]["packages"]>();
  for (const row of packageRows) {
    if (!row.childId) continue;
    const list = packagesByChild.get(row.childId) ?? [];
    list.push({
      id: row.id,
      nameEn: row.nameEn,
      nameTh: row.nameTh,
      status: effectiveStatus(row.status, row.expiresAt, now),
      hoursTotal: row.hoursTotal,
      hoursRemaining: row.hoursRemaining,
      crayonCreditsRemaining: row.crayonCreditsRemaining,
      clayCreditsRemaining: row.clayCreditsRemaining,
      extraHoursRemaining: row.extraHoursRemaining,
      expiresAt: row.expiresAt?.toISOString() ?? null,
    });
    packagesByChild.set(row.childId, list);
  }

  const activeByChild = new Map(activeRows.map((row) => [row.childId, row]));
  const history: MemberPortalData["history"] = [
    ...purchaseRows.map((row) => ({
      kind: "purchase" as const,
      id: row.id,
      childName: row.childName,
      at: row.createdAt.toISOString(),
      titleEn: "Purchase",
      titleTh: "การซื้อ",
      detailEn: `${row.receiptNo ?? `#${row.id}`} · ${row.totalThb.toLocaleString()} ฿`,
      detailTh: `${row.receiptNo ?? `#${row.id}`} · ${row.totalThb.toLocaleString()} บาท`,
    })),
    ...completedRows.map((row) => ({
      kind: "session" as const,
      id: row.id,
      childName: row.childName,
      at: (row.endedAt as Date).toISOString(),
      titleEn: row.productEn,
      titleTh: row.productTh,
      detailEn: `${Math.max(0, row.hoursBooked - row.hoursRefunded)} h used`,
      detailTh: `ใช้ ${Math.max(0, row.hoursBooked - row.hoursRefunded)} ชม.`,
    })),
    ...redemptionRows.map((row) => ({
      kind: "redemption" as const,
      id: row.id,
      childName: row.childName,
      at: row.redeemedAt.toISOString(),
      titleEn: row.productEn,
      titleTh: row.productTh,
      detailEn: row.type === "crayon" ? "Crayon credit" : row.type === "clay" ? "Clay credit" : "+1 hour",
      detailTh: row.type === "crayon" ? "สิทธิ์สีเทียน" : row.type === "clay" ? "สิทธิ์ดินปั้น" : "+1 ชั่วโมง",
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return {
    member: {
      publicUid: identity.publicUid,
      name: identity.name,
      phone: identity.phone,
      email: identity.emailNormalized,
      verified: Boolean(identity.emailNormalized && identity.emailVerifiedAt),
      access: member.access,
      preferredLanguage: identity.preferredLanguage,
    },
    children: childRows.map((child) => {
      const active = activeByChild.get(child.id);
      return {
        id: child.id,
        name: child.name,
        packages: packagesByChild.get(child.id) ?? [],
        activeSession: active
          ? {
              id: active.id,
              nameEn: active.nameEn,
              nameTh: active.nameTh,
              startedAt: active.startedAt.toISOString(),
              plannedEndAt: active.plannedEndAt.toISOString(),
              hoursRemaining: active.hoursRemaining,
            }
          : null,
      };
    }),
    history,
    consents: consentRows.map((row) => ({
      type: row.type,
      policyVersion: row.policyVersion,
      acceptedAt: row.acceptedAt.toISOString(),
    })),
  };
}

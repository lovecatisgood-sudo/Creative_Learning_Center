import assert from "node:assert/strict";
import { db } from "../src/db";
import {
  children,
  memberAccessTokens,
  memberAccounts,
  memberConsents,
  orderItems,
  orders,
  packageInstances,
  parents,
  products,
} from "../src/db/schema";
import { generateMemberUid, normalizeEmail, normalizeMemberUid, normalizePhone } from "../src/lib/member-identity";
import { getMemberPortalData } from "../src/lib/member-data";
import { getMemberReceipt } from "../src/lib/member-receipt";
import { generateAccessToken, hashAccessToken } from "../src/lib/member-tokens";
import { isTrustedMutationOrigin } from "../src/lib/request-security";

async function main() {
const url = new URL(process.env.DATABASE_URL || "postgresql://invalid/invalid");
if (process.env.MEMBER_TEST_DATABASE !== "1" || !url.pathname.toLowerCase().includes("test")) {
  throw new Error("Refusing to run member integration checks outside an explicitly marked test database");
}

assert.equal(normalizePhone("081 234 5678"), "+66812345678");
assert.equal(normalizePhone("+66 (81) 234-5678"), "+66812345678");
assert.equal(normalizePhone("bad phone"), null);
assert.equal(normalizeEmail("  Member@Example.COM "), "member@example.com");
assert.equal(normalizeEmail("not-an-email"), null);
const uid = generateMemberUid();
assert.equal(normalizeMemberUid(uid.toLowerCase().replaceAll("-", " ")), uid);
const token = generateAccessToken();
assert.equal(token.length >= 40, true);
assert.equal(hashAccessToken(token), hashAccessToken(token));
assert.notEqual(hashAccessToken(token), token);
assert.equal(isTrustedMutationOrigin(new Request("https://creative.siamesecat.cafe/api/public/signup", { method: "POST", headers: { origin: "https://creative.siamesecat.cafe" } })), true);
assert.equal(isTrustedMutationOrigin(new Request("https://creative.siamesecat.cafe/api/public/signup", { method: "POST", headers: { origin: "https://attacker.example" } })), false);

const seeded = await db.transaction(async (tx) => {
  const [parent] = await tx.insert(parents).values({ name: "Member Test", phone: "0812345678", email: null, profileComplete: true }).returning();
  const [member] = await tx.insert(memberAccounts).values({ parentId: parent.id, publicUid: uid, phoneNormalized: "+66812345678", preferredLanguage: "en" }).returning();
  await tx.insert(memberConsents).values([
    { memberAccountId: member.id, type: "terms", policyVersion: "test-v1", source: "signup" },
    { memberAccountId: member.id, type: "privacy", policyVersion: "test-v1", source: "signup" },
  ]);
  const [child] = await tx.insert(children).values({ parentId: parent.id, name: "Test Child", dob: "2020-01-01", gender: "female" }).returning();
  const [product] = await tx.insert(products).values({ sku: "MEMBER_TEST_PASS", nameEn: "Test Pass", nameTh: "แพ็กเกจทดสอบ", type: "HOUR_PASS", priceThb: 1000, grants: { hours: 10 } }).returning();
  const [order] = await tx.insert(orders).values({ parentId: parent.id, childId: child.id, status: "paid", totalThb: 1000, receiptNo: "SCCC-TEST-0001" }).returning();
  const [item] = await tx.insert(orderItems).values({ orderId: order.id, productId: product.id, qty: 1, unitPriceThb: 1000, lineTotalThb: 1000 }).returning();
  await tx.insert(packageInstances).values({ orderItemId: item.id, productId: product.id, ownerChildId: child.id, status: "available", hoursTotal: 10, hoursRemaining: 7 });
  await tx.insert(memberAccessTokens).values({ memberAccountId: member.id, orderId: order.id, type: "purchase_claim", tokenHash: hashAccessToken(generateAccessToken()), expiresAt: new Date(Date.now() + 60_000) });
  return { parent, member, child, order };
});

const current = {
  id: seeded.member.id,
  parentId: seeded.parent.id,
  publicUid: seeded.member.publicUid,
  emailNormalized: null,
  emailVerifiedAt: null,
  preferredLanguage: "en",
  access: "temporary" as const,
};
const portal = await getMemberPortalData(current);
assert.ok(portal);
assert.equal(portal.member.publicUid, uid);
assert.equal(portal.children.length, 1);
assert.equal(portal.children[0].packages[0].hoursRemaining, 7);
assert.equal(portal.children[0].packages[0].status, "available");
assert.equal(portal.consents.length, 2);

const receipt = await getMemberReceipt(current, seeded.order.id);
assert.ok(receipt);
assert.equal(receipt.totalThb, 1000);
assert.equal(receipt.items[0].nameEn, "Test Pass");

const [otherParent] = await db.insert(parents).values({ name: "Other Member", phone: "0899999999", profileComplete: true }).returning();
const [otherMember] = await db.insert(memberAccounts).values({ parentId: otherParent.id, publicUid: generateMemberUid(), phoneNormalized: "+66899999999" }).returning();
const crossFamilyReceipt = await getMemberReceipt({ ...current, id: otherMember.id, parentId: otherParent.id, publicUid: otherMember.publicUid }, seeded.order.id);
assert.equal(crossFamilyReceipt, null);

let duplicateParentBlocked = false;
try {
  await db.insert(memberAccounts).values({ parentId: seeded.parent.id, publicUid: generateMemberUid(), phoneNormalized: "+66810000000" });
} catch (error) {
  const candidate = error as { code?: string; cause?: { code?: string } };
  duplicateParentBlocked = candidate.code === "23505" || candidate.cause?.code === "23505";
}
assert.equal(duplicateParentBlocked, true);

console.log("member-system → identity, ownership, package, receipt, consent, token, and uniqueness checks passed");
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});

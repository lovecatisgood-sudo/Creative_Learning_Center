import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import {
  addonRedemptions,
  admins,
  children,
  orderItems,
  orders,
  packageInstances,
  parents,
  products,
  sessions,
} from "../src/db/schema";
import { createPaidOrder, OrderError } from "../src/lib/orders";
import { CURRENT_PRODUCT_CATALOG } from "../src/lib/product-catalog";

async function expectOrderError(run: () => Promise<unknown>, message: RegExp) {
  let caught: unknown;
  try {
    await run();
  } catch (error) {
    caught = error;
  }
  assert.ok(caught instanceof OrderError, "expected an OrderError");
  assert.match((caught as Error).message, message);
}

async function seedRunningSession(opts: {
  adminId: number;
  childId: number;
  parentId: number;
  productId: number;
  receiptNo: string;
}) {
  const [order] = await db.insert(orders).values({
    createdByAdmin: opts.adminId,
    childId: opts.childId,
    parentId: opts.parentId,
    status: "paid",
    totalThb: 1,
    receiptNo: opts.receiptNo,
  }).returning();
  const [item] = await db.insert(orderItems).values({
    orderId: order.id,
    productId: opts.productId,
    qty: 1,
    unitPriceThb: 1,
    lineTotalThb: 1,
  }).returning();
  const [instance] = await db.insert(packageInstances).values({
    orderItemId: item.id,
    productId: opts.productId,
    ownerChildId: opts.childId,
    status: "active",
    hoursTotal: 1,
    hoursRemaining: 0,
  }).returning();
  const startedAt = new Date("2026-08-11T03:00:00.000Z");
  const plannedEndAt = new Date("2026-08-11T04:00:00.000Z");
  const [session] = await db.insert(sessions).values({
    packageInstanceId: instance.id,
    childId: opts.childId,
    hoursBooked: 1,
    startedAt,
    plannedEndAt,
    status: "running",
  }).returning();
  return { session, plannedEndAt };
}

async function main() {
  const url = new URL(process.env.DATABASE_URL || "postgresql://invalid/invalid");
  if (process.env.CATALOG_TEST_DATABASE !== "1" || !url.pathname.toLowerCase().includes("test")) {
    throw new Error("Refusing to run catalogue integration checks outside an explicitly marked test database");
  }

  const [admin] = await db.insert(admins).values({
    email: "catalog-test@example.invalid",
    passwordHash: "not-used-in-catalog-test",
    role: "manager",
  }).returning();
  const [parent] = await db.insert(parents).values({ name: "Catalogue Test", phone: "0800000000" }).returning();
  const [child] = await db.insert(children).values({ parentId: parent.id, name: "Catalogue Child" }).returning();
  const migratedProducts = await db.select().from(products);
  const productBySku = new Map(migratedProducts.map((product) => [product.sku, product]));
  for (const expected of CURRENT_PRODUCT_CATALOG) {
    const actual = productBySku.get(expected.sku);
    assert.ok(actual, `migration did not create ${expected.sku}`);
    assert.equal(actual.active, true);
    assert.equal(actual.priceThb, expected.priceThb);
    assert.deepEqual(actual.grants, expected.grants);
  }
  const [inactive] = await db.insert(products).values({
    sku: "RETIRED_TEST_PRODUCT",
    nameEn: "Retired test product",
    nameTh: "สินค้าทดสอบที่เลิกใช้",
    type: "ADDON",
    priceThb: 999,
    grants: { receiptOnly: true },
    active: false,
  }).returning();

  await expectOrderError(() => createPaidOrder({
    adminId: admin.id,
    childId: child.id,
    lines: [{ sku: inactive.sku, qty: 1 }],
    method: "cash",
    proofPhotoPath: "catalog-test-proof.jpg",
  }), /Unknown SKU/);

  await expectOrderError(() => createPaidOrder({
    adminId: admin.id,
    childId: child.id,
    lines: [{ sku: "PLAYROOM_EXTRA_1H", qty: 1 }],
    method: "cash",
    proofPhotoPath: "catalog-test-proof.jpg",
  }), /requires a running Kids Playroom session/);

  const afterSchool = await seedRunningSession({
    adminId: admin.id,
    childId: child.id,
    parentId: parent.id,
    productId: productBySku.get("AFTERSCHOOL_ENTRY_1H")!.id,
    receiptNo: "SCCC-CATALOG-AFTER",
  });
  await expectOrderError(() => createPaidOrder({
    adminId: admin.id,
    childId: child.id,
    lines: [{ sku: "PLAYROOM_EXTRA_1H", qty: 1 }],
    method: "cash",
    proofPhotoPath: "catalog-test-proof.jpg",
    extendSessionId: afterSchool.session.id,
  }), /only to a running Kids Playroom entry/);

  const playroom = await seedRunningSession({
    adminId: admin.id,
    childId: child.id,
    parentId: parent.id,
    productId: productBySku.get("PLAYROOM_ENTRY_1H")!.id,
    receiptNo: "SCCC-CATALOG-PLAYROOM",
  });
  const result = await createPaidOrder({
    adminId: admin.id,
    childId: child.id,
    lines: [{ sku: "PLAYROOM_EXTRA_1H", qty: 1 }],
    method: "cash",
    proofPhotoPath: "catalog-test-proof.jpg",
    extendSessionId: playroom.session.id,
  });
  assert.equal(result.extendApplied, true);
  const [paidOrder] = await db.select().from(orders).where(eq(orders.id, result.orderId)).limit(1);
  assert.equal(paidOrder.totalThb, 80);
  const [extendedSession] = await db.select().from(sessions).where(eq(sessions.id, playroom.session.id)).limit(1);
  assert.equal(extendedSession.plannedEndAt.getTime(), playroom.plannedEndAt.getTime() + 60 * 60_000);
  const redemptions = await db.select().from(addonRedemptions).where(eq(addonRedemptions.sessionId, playroom.session.id));
  assert.equal(redemptions.length, 1);
  assert.equal(redemptions[0].type, "extra_hour");

  console.log("catalog-system → active products, 80 THB extension, and Playroom-only session guards verified");
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});

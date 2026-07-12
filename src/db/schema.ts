import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  date,
} from "drizzle-orm/pg-core";

// ─── Enums ──────────────────────────────────────────────────────────────────
export const genderEnum = pgEnum("gender", ["male", "female"]);
export const productTypeEnum = pgEnum("product_type", [
  "TIMED_ENTRY",
  "ADDON",
  "BUNDLE",
  "HOUR_PASS",
]);
export const orderStatusEnum = pgEnum("order_status", [
  "draft",
  "awaiting_payment",
  "paid",
  "void",
]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "promptpay",
  "bank",
  "cash",
]);
export const instanceStatusEnum = pgEnum("instance_status", [
  "available",
  "active",
  "consumed",
  "expired",
]);
export const sessionStatusEnum = pgEnum("session_status", [
  "running",
  "completed",
]);
export const redemptionTypeEnum = pgEnum("redemption_type", [
  "crayon",
  "clay",
  "extra_hour",
]);

// ─── Tables (PRD §5) ────────────────────────────────────────────────────────
export const parents = pgTable("parents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  profileComplete: boolean("profile_complete").default(true).notNull(),
});

export const children = pgTable("children", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").references(() => parents.id),
  name: text("name").notNull(),
  dob: date("dob"),
  gender: genderEnum("gender"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  notes: text("notes"),
});

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameTh: text("name_th").notNull(),
  type: productTypeEnum("type").notNull(),
  priceThb: integer("price_thb").notNull(),
  grants: jsonb("grants").$type<ProductGrants>().notNull(),
  active: boolean("active").default(true).notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  createdByAdmin: integer("created_by_admin").references(() => admins.id),
  parentId: integer("parent_id").references(() => parents.id),
  childId: integer("child_id").references(() => children.id),
  status: orderStatusEnum("status").default("draft").notNull(),
  totalThb: integer("total_thb").notNull(),
  receiptNo: text("receipt_no").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  qty: integer("qty").notNull(),
  unitPriceThb: integer("unit_price_thb").notNull(),
  lineTotalThb: integer("line_total_thb").notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  method: paymentMethodEnum("method").notNull(),
  amountThb: integer("amount_thb").notNull(),
  proofPhotoPath: text("proof_photo_path").notNull(),
  confirmedByAdmin: integer("confirmed_by_admin").references(() => admins.id),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
});

export const packageInstances = pgTable("package_instances", {
  id: serial("id").primaryKey(),
  orderItemId: integer("order_item_id").references(() => orderItems.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  ownerChildId: integer("owner_child_id").references(() => children.id),
  ownerParentId: integer("owner_parent_id").references(() => parents.id),
  status: instanceStatusEnum("status").default("available").notNull(),
  hoursTotal: integer("hours_total").default(0).notNull(),
  hoursRemaining: integer("hours_remaining").default(0).notNull(),
  crayonCreditsRemaining: integer("crayon_credits_remaining").default(0).notNull(),
  clayCreditsRemaining: integer("clay_credits_remaining").default(0).notNull(),
  extraHoursRemaining: integer("extra_hours_remaining").default(0).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  packageInstanceId: integer("package_instance_id")
    .references(() => packageInstances.id)
    .notNull(),
  childId: integer("child_id").references(() => children.id).notNull(),
  hoursBooked: integer("hours_booked").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  plannedEndAt: timestamp("planned_end_at", { withTimezone: true }).notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  hoursRefunded: integer("hours_refunded").default(0).notNull(),
  status: sessionStatusEnum("status").default("running").notNull(),
});

export const addonRedemptions = pgTable("addon_redemptions", {
  id: serial("id").primaryKey(),
  packageInstanceId: integer("package_instance_id")
    .references(() => packageInstances.id)
    .notNull(),
  childId: integer("child_id").references(() => children.id).notNull(),
  type: redemptionTypeEnum("type").notNull(),
  sessionId: integer("session_id").references(() => sessions.id),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }).defaultNow().notNull(),
  adminId: integer("admin_id").references(() => admins.id),
});

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => admins.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: integer("entity_id"),
  detail: jsonb("detail"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Shared types ───────────────────────────────────────────────────────────
export type ProductGrants = {
  hours?: number;
  crayonSessions?: number;
  claySessions?: number;
  extendOnly?: boolean;
  shareable?: boolean;
};

export type Product = typeof products.$inferSelect;
export type Parent = typeof parents.$inferSelect;
export type Child = typeof children.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type PackageInstance = typeof packageInstances.$inferSelect;
export type Session = typeof sessions.$inferSelect;

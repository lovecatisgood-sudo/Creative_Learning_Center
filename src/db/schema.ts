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
  uniqueIndex,
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
export const blogCategoryEnum = pgEnum("blog_category", [
  "parenting-guides",
  "kid-learning-material",
  "club-news-updates",
  "faq",
]);
export const adminRoleEnum = pgEnum("admin_role", ["manager", "staff"]);
export const memberTokenTypeEnum = pgEnum("member_token_type", [
  "purchase_claim",
  "email_verify",
  "email_signin",
]);
export const memberConsentTypeEnum = pgEnum("member_consent_type", [
  "terms",
  "privacy",
  "marketing",
]);
export const memberConsentSourceEnum = pgEnum("member_consent_source", [
  "signup",
  "staff",
  "email_binding",
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
  displayName: text("display_name"),
  role: adminRoleEnum("role").default("staff").notNull(),
  active: boolean("active").default(true).notNull(),
});

// Public member identity is intentionally separate from the guardian CRM row.
// publicUid is a lookup reference, never an authentication secret. Email stays
// nullable until the member chooses to bind it and is not trusted until
// emailVerifiedAt is set.
export const memberAccounts = pgTable("member_accounts", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").references(() => parents.id).notNull().unique(),
  publicUid: text("public_uid").notNull().unique(),
  phoneNormalized: text("phone_normalized").notNull(),
  emailNormalized: text("email_normalized").unique(),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  preferredLanguage: text("preferred_language").default("th").notNull(),
  sessionVersion: integer("session_version").default(1).notNull(),
  lastAccessAt: timestamp("last_access_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const creativeMemberIdentityLinks = pgTable("creative_member_identity_links", {
  id: serial("id").primaryKey(),
  memberAccountId: integer("member_account_id").references(() => memberAccounts.id).notNull().unique(),
  issuer: text("issuer").notNull(),
  subject: text("subject").notNull(),
  verifiedEmail: text("verified_email").notNull(),
  status: text("status").default("active").notNull(),
  linkedSource: text("linked_source").notNull(),
  linkedAt: timestamp("linked_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  identityUnique: uniqueIndex("creative_member_identity_unique").on(table.issuer, table.subject),
}));

export const creativeMemberLinkAttempts = pgTable("creative_member_link_attempts", {
  id: serial("id").primaryKey(),
  memberAccountId: integer("member_account_id").references(() => memberAccounts.id).notNull(),
  status: text("status").default("pending").notNull(),
  correlationId: text("correlation_id").notNull().unique(),
  errorCode: text("error_code"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const memberUidAliases = pgTable("member_uid_aliases", {
  id: serial("id").primaryKey(),
  memberAccountId: integer("member_account_id")
    .references(() => memberAccounts.id)
    .notNull(),
  publicUid: text("public_uid").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const memberConsents = pgTable("member_consents", {
  id: serial("id").primaryKey(),
  memberAccountId: integer("member_account_id")
    .references(() => memberAccounts.id)
    .notNull(),
  type: memberConsentTypeEnum("type").notNull(),
  policyVersion: text("policy_version").notNull(),
  source: memberConsentSourceEnum("source").notNull(),
  adminId: integer("admin_id").references(() => admins.id),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }).defaultNow().notNull(),
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

export const memberAccessTokens = pgTable("member_access_tokens", {
  id: serial("id").primaryKey(),
  memberAccountId: integer("member_account_id")
    .references(() => memberAccounts.id)
    .notNull(),
  orderId: integer("order_id").references(() => orders.id),
  type: memberTokenTypeEnum("type").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  pendingEmail: text("pending_email"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdByAdmin: integer("created_by_admin").references(() => admins.id),
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

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  category: blogCategoryEnum("category").notNull(),
  titleTh: text("title_th").default("").notNull(),
  summaryTh: text("summary_th").default("").notNull(),
  bodyTh: text("body_th").default("").notNull(),
  seoTitleTh: text("seo_title_th").default("").notNull(),
  seoDescriptionTh: text("seo_description_th").default("").notNull(),
  titleEn: text("title_en").default("").notNull(),
  summaryEn: text("summary_en").default("").notNull(),
  bodyEn: text("body_en").default("").notNull(),
  seoTitleEn: text("seo_title_en").default("").notNull(),
  seoDescriptionEn: text("seo_description_en").default("").notNull(),
  coverImageUrl: text("cover_image_url").default("").notNull(),
  coverImageAltTh: text("cover_image_alt_th").default("").notNull(),
  coverImageAltEn: text("cover_image_alt_en").default("").notNull(),
  publishedTh: boolean("published_th").default(false).notNull(),
  publishedEn: boolean("published_en").default(false).notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const gamePlayers = pgTable("game_players", {
  id: serial("id").primaryKey(),
  publicId: text("public_id").notNull().unique(),
  googleSub: text("google_sub").unique(),
  siameseIssuer: text("siamese_issuer"),
  siameseSubject: text("siamese_subject"),
  displayName: text("display_name").notNull(),
  email: text("email").notNull().unique(),
  avatarUrl: text("avatar_url").default("").notNull(),
  language: text("language").default("en").notNull(),
  marketingConsent: boolean("marketing_consent").default(false).notNull(),
  termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  siameseIdentityUnique: uniqueIndex("game_players_siamese_identity_unique").on(table.siameseIssuer, table.siameseSubject),
}));

export const gameRuns = pgTable("game_runs", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => gamePlayers.id).notNull(),
  score: integer("score").notNull(),
  mode: text("mode").notNull(),
  stage: integer("stage").notNull(),
  victory: boolean("victory").default(false).notNull(),
  language: text("language").default("en").notNull(),
  durationSeconds: integer("duration_seconds").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const houseAdCampaigns = pgTable("house_ad_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").default("other").notNull(),
  language: text("language").default("all").notNull(),
  videoUrl: text("video_url").default("").notNull(),
  posterUrl: text("poster_url").default("").notNull(),
  ctaLabel: text("cta_label").default("").notNull(),
  destinationUrl: text("destination_url").default("").notNull(),
  active: boolean("active").default(false).notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  weight: integer("weight").default(100).notNull(),
  skipAfterSeconds: integer("skip_after_seconds").default(10).notNull(),
  cooldownSeconds: integer("cooldown_seconds").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const houseAdEvents = pgTable("house_ad_events", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => houseAdCampaigns.id).notNull(),
  playerId: integer("player_id").references(() => gamePlayers.id),
  eventType: text("event_type").notNull(),
  placement: text("placement").default("game_over_restart").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Shared types ───────────────────────────────────────────────────────────
export type ProductGrants = {
  hours?: number;
  crayonSessions?: number;
  claySessions?: number;
  extendOnly?: boolean;
  shareable?: boolean;
  receiptOnly?: boolean;
};

export type Product = typeof products.$inferSelect;
export type Parent = typeof parents.$inferSelect;
export type Child = typeof children.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type PackageInstance = typeof packageInstances.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type GamePlayer = typeof gamePlayers.$inferSelect;
export type GameRun = typeof gameRuns.$inferSelect;
export type HouseAdCampaign = typeof houseAdCampaigns.$inferSelect;
export type HouseAdEvent = typeof houseAdEvents.$inferSelect;

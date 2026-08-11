import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

const catalog = read("src/lib/product-catalog.ts");
const signup = read("src/lib/program-options.ts");
const migration = read("drizzle/0008_replace_playgroup_with_playroom.sql");
const nextConfig = read("next.config.mjs");
const sitemap = read("src/app/sitemap.ts");
const terms = `${read("src/content/legal/terms.md")}\n${read("src/content/legal/terms.th.md")}`;
const sellClient = read("src/app/admin/(app)/sell/SellClient.tsx");
const productGrid = read("src/components/sell/ProductGrid.tsx");
const sessionDetail = read("src/app/admin/(app)/session/[id]/SessionDetailClient.tsx");
const orders = read("src/lib/orders.ts");

const products = [
  ["PLAYROOM_ENTRY_1H", 149],
  ["PLAYROOM_ENTRY_2H", 249],
  ["PLAYROOM_EXTRA_1H", 80],
  ["PLAYROOM_EXTRA_ADULT_1H", 50],
  ["PLAYROOM_CRAYON_ACTIVITY", 45],
  ["PLAYROOM_CLAY_SMALL", 69],
  ["PLAYROOM_CLAY_LARGE", 99],
  ["AFTERSCHOOL_ENTRY_1H", 199],
  ["AFTERSCHOOL_ENTRY_2H", 300],
  ["AFTERSCHOOL_HALF_DAY_4H", 599],
  ["MEAL_AFTERSCHOOL", 299],
];

for (const [sku, price] of products) {
  const catalogProduct = new RegExp(
    `sku: "${sku}"[\\s\\S]*?priceThb: ${price}(?:,|\\n)`,
  );
  const migrationProduct = new RegExp(
    `\\('${sku}',[\\s\\S]*?, ${price}, '[^']*'::jsonb, true\\)`,
  );
  if (!catalogProduct.test(catalog)) {
    throw new Error(`Catalog is missing ${sku} at ${price} THB`);
  }
  if (!migrationProduct.test(migration)) {
    throw new Error(`Migration is missing ${sku} at ${price} THB`);
  }
}

if (!migration.includes('WHERE "sku" NOT IN (')) {
  throw new Error("Migration must deactivate every product outside the current catalogue");
}
for (const [currentSku] of products) {
  const retirementBlock = migration.split("--> statement-breakpoint")[0];
  if (!retirementBlock.includes(`'${currentSku}'`)) {
    throw new Error(`Migration retirement allowlist is missing ${currentSku}`);
  }
}

for (const staleSignup of ["playgroup-half-day", "playgroup-weekday-full", "playgroup-saturday-pass", "playgroup-sunday-pass"]) {
  if (signup.includes(staleSignup)) throw new Error(`Signup still exposes ${staleSignup}`);
}

for (const requirement of [
  "one accompanying adult",
  "one coloring sheet",
  "must stay on the premises",
  "149 THB",
  "249 THB",
  "299 THB",
]) {
  if (!terms.includes(requirement)) throw new Error(`Terms are missing: ${requirement}`);
}

if (!nextConfig.includes('{ source: "/little-explorer-program", destination: "/playgroup", permanent: true }')) {
  throw new Error("Little Explorer does not permanently redirect to Kids Playroom");
}
for (const redirect of [
  '{ source: "/memberships", destination: "/playgroup", permanent: true }',
  '{ source: "/EN/memberships", destination: "/EN/playgroup", permanent: true }',
]) {
  if (!nextConfig.includes(redirect)) throw new Error(`Retired route does not redirect directly: ${redirect}`);
}
if (sitemap.includes('{ path: "/little-explorer-program"')) {
  throw new Error("Retired Little Explorer route remains in the sitemap");
}

for (const slug of [
  "first-playgroup-one-hour-two-hours-half-day",
  "things-to-do-kids-near-mega-bangna",
  "kids-club-playgroup-bangkok-which-fits-your-day",
  "after-school-care-bangna-working-parents",
]) {
  if (!migration.includes(`WHERE "slug" = '${slug}'`)) {
    throw new Error(`Migration does not update published article: ${slug}`);
  }
}

const kidsClubUpdate = migration
  .split("--> statement-breakpoint")
  .find((statement) => statement.includes("WHERE \"slug\" = 'kids-club-playgroup-bangkok-which-fits-your-day'"));
if (
  !kidsClubUpdate ||
  !kidsClubUpdate.includes('"body_en" = replace(regexp_replace(') ||
  !kidsClubUpdate.includes('"body_th" = replace(regexp_replace(')
) {
  throw new Error("Kids-club article migration must apply both section and heading replacements");
}

for (const [file, source] of [
  ["SellClient", sellClient],
  ["ProductGrid", productGrid],
]) {
  if (!source.includes('"PLAYROOM_EXTRA_1H"')) throw new Error(`${file} does not use PLAYROOM_EXTRA_1H`);
  if (/"EXTRA_1H"/.test(source)) throw new Error(`${file} still uses the retired EXTRA_1H SKU`);
}
if (!sessionDetail.includes('{t("addOneHour")} (80 ฿)')) {
  throw new Error("Running-session UI does not show the 80 THB extension price");
}
if (!sessionDetail.includes('s.productSku.startsWith("PLAYROOM_ENTRY_")')) {
  throw new Error("After School sessions are not protected from the Playroom extension action");
}
for (const guard of [
  "eq(products.active, true)",
  'inArray(products.sku, ["PLAYROOM_ENTRY_1H", "PLAYROOM_ENTRY_2H"])',
  "A Playroom additional hour requires a running Kids Playroom session",
]) {
  if (!orders.includes(guard)) throw new Error(`Order validation is missing: ${guard}`);
}

console.log("playroom-menu: catalogue, admin sale guards, migration, signup, legal, blog and redirects verified");

import { existsSync, readFileSync } from "node:fs";

const required = [
  "MEMBER_SYSTEM_PRD_V2.md",
  "drizzle/0007_siamese_cat_members.sql",
  "drizzle/member-schema-bootstrap.sql",
  "src/app/member/page.tsx",
  "src/app/member/MemberPortalClient.tsx",
  "src/app/api/member/me/route.ts",
  "src/app/api/public/member/claim/route.ts",
  "src/app/api/public/member/verify/route.ts",
  "src/app/api/public/member/signin/route.ts",
  "src/app/api/admin/members/merge/route.ts",
  "src/lib/member-auth.ts",
  "src/lib/member-data.ts",
  "src/lib/member-tokens.ts",
];
const failures = [];
for (const file of required) if (!existsSync(file)) failures.push(`missing ${file}`);

const read = (file) => readFileSync(file, "utf8");
const layout = read("src/app/layout.tsx");
if (!layout.includes('pathname.startsWith("/member")') || !layout.includes('pathname.startsWith("/EN/member")')) failures.push("member pages are not excluded from analytics");

const config = read("next.config.mjs");
for (const value of ["/member/:path*", "/EN/member/:path*", "private, no-cache, no-store", "no-referrer"]) {
  if (!config.includes(value)) failures.push(`member response security header missing: ${value}`);
}

const session = read("src/lib/member-session.ts");
if (!session.includes('cookieName: MEMBER_SESSION_COOKIE') || !session.includes('sameSite: "lax"') || !session.includes("httpOnly: true") || !session.includes("secure: process.env.NODE_ENV")) failures.push("member cookie protections incomplete");
if (session.includes("process.env.SESSION_SECRET")) failures.push("member auth falls back to the admin session secret");

const tokens = read("src/lib/member-tokens.ts");
if (!tokens.includes("randomBytes(32)") || !tokens.includes('createHash("sha256")')) failures.push("member token entropy/hash contract missing");
const links = read("src/lib/member-links.ts");
const receipt = read("src/app/admin/(app)/receipt/[id]/ReceiptClient.tsx");
const claimRoute = read("src/app/api/admin/members/[id]/claim/route.ts");
if (!links.includes("/member/verify#token=") || !receipt.includes("/member/claim#token=") || !claimRoute.includes("/member/claim#token=")) failures.push("member secrets are not confined to URL fragments");

const memberData = read("src/lib/member-data.ts");
const memberReceipt = read("src/lib/member-receipt.ts");
if (!memberData.includes("member.parentId") || !memberReceipt.includes("eq(orders.parentId, member.parentId)")) failures.push("member data ownership scope missing");
if (memberData.includes("proofPhotoPath") || memberReceipt.includes("proofPhotoPath")) failures.push("member response exposes payment proof data");

const memberApi = read("src/app/api/member/me/route.ts");
if (!memberApi.includes('Cache-Control": "private, no-store"')) failures.push("member API is cacheable");
const css = read("src/app/globals.css");
const signup = read("src/app/signup/page.tsx");
const bottomNav = read("src/components/BottomNav.tsx");
if (!css.includes("env(safe-area-inset-bottom)") || !bottomNav.includes("safe-bottom")) failures.push("safe-area support incomplete");
if (!signup.includes("min-[380px]:grid-cols-2")) failures.push("narrow signup fields do not stack");

const migration = read("drizzle/0007_siamese_cat_members.sql");
for (const value of ["member_accounts", "member_access_tokens", "member_consents", "member_uid_aliases", "ON CONFLICT (\"parent_id\") DO NOTHING"]) {
  if (!migration.includes(value)) failures.push(`migration contract missing ${value}`);
}
const bootstrap = read("drizzle/member-schema-bootstrap.sql");
const server = read("server.js");
const packageJson = JSON.parse(read("package.json"));
const memberSchema = read("src/lib/member-schema.ts");
const healthRoute = read("src/app/api/public/health/route.ts");
for (const value of ["member_accounts", "member_access_tokens", "member_consents", "member_uid_aliases", 'ON CONFLICT ("parent_id") DO NOTHING']) {
  if (!bootstrap.includes(value)) failures.push(`member bootstrap contract missing ${value}`);
}
if (/\b(?:drop\s+(?:table|column)|truncate\s+table|delete\s+from)\b/i.test(bootstrap)) failures.push("member bootstrap contains a destructive SQL operation");
if (!server.includes("member-schema-bootstrap.sql") || !server.includes('process.env.MEMBER_SCHEMA_READY = "1"')) failures.push("production startup does not enforce member schema readiness");
if (packageJson.scripts?.start !== "node server.js") failures.push("default production start command bypasses schema readiness");
if (!memberSchema.includes("ensureMemberSchemaReady") || !memberSchema.includes("member-schema-bootstrap.sql")) failures.push("application runtime cannot recover member schema independently of host startup");
if (!healthRoute.includes("await ensureMemberSchemaReady()")) failures.push("production health endpoint does not enforce member readiness");

const env = read(".env.example");
for (const variable of ["MEMBER_SESSION_SECRET", "APP_ORIGIN", "TERMS_VERSION", "PRIVACY_VERSION"]) {
  if (!env.includes(`${variable}=`)) failures.push(`.env.example missing ${variable}`);
}

if (failures.length) {
  console.error("member:release failed");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("member:release → privacy, auth, ownership, migration, and mobile contracts verified");

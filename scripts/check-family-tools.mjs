import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SITE = "https://creative.siamesecat.cafe";
const ROUTINE_PATH = "/tools/kids-routine-chart";
const POLAROID_PATH = "/tools/polaroid-generator";
const ROUTINE_OG_IMAGE = `${SITE}${ROUTINE_PATH}/assets/og-kids-routine-chart.png`;

const pages = [
  { language: "th", file: "tools.html", url: `${SITE}/tools`, counterpart: `${SITE}/EN/tools`, defaultUrl: `${SITE}/tools`, heading: "เครื่องมือออนไลน์เล็ก ๆ สำหรับชีวิตครอบครัว", toolHubPath: "/tools" },
  { language: "en", file: "EN/tools.html", url: `${SITE}/EN/tools`, counterpart: `${SITE}/tools`, defaultUrl: `${SITE}/tools`, heading: "Practical browser tools for family life", toolHubPath: "/EN/tools" },
  { language: "th", file: "tools/kids-routine-chart.html", url: `${SITE}${ROUTINE_PATH}`, counterpart: `${SITE}/EN${ROUTINE_PATH}`, defaultUrl: `${SITE}${ROUTINE_PATH}`, heading: "ตารางกิจวัตรประจำวันเด็กแบบภาพ", toolHubPath: "/tools" },
  { language: "en", file: "EN/tools/kids-routine-chart.html", url: `${SITE}/EN${ROUTINE_PATH}`, counterpart: `${SITE}${ROUTINE_PATH}`, defaultUrl: `${SITE}${ROUTINE_PATH}`, heading: "Kids Visual Routine Chart", toolHubPath: "/EN/tools" },
  { language: "th", file: "tools/polaroid-generator.html", url: `${SITE}${POLAROID_PATH}`, counterpart: `${SITE}/EN${POLAROID_PATH}`, defaultUrl: `${SITE}${POLAROID_PATH}`, heading: "สร้างรูปโพลารอยด์สวย ๆ ในไม่กี่วินาที", toolHubPath: "/tools" },
  { language: "en", file: "EN/tools/polaroid-generator.html", url: `${SITE}/EN${POLAROID_PATH}`, counterpart: `${SITE}${POLAROID_PATH}`, defaultUrl: `${SITE}${POLAROID_PATH}`, heading: "Make a beautiful Polaroid photo in seconds", toolHubPath: "/EN/tools" },
];

for (const page of pages) {
  const htmlPath = join(ROOT, "public", "main-site", page.file);
  if (!existsSync(htmlPath)) throw new Error(`Missing generated tools page: ${page.file}`);
  const html = readFileSync(htmlPath, "utf8");
  if (!html.includes(`<html lang="${page.language}">`)) throw new Error(`${page.file} has the wrong document language`);
  if (!html.includes(`<link rel="canonical" href="${page.url}">`)) throw new Error(`${page.file} has the wrong canonical`);
  if (!html.includes(`hreflang="${page.language}" href="${page.url}"`)) throw new Error(`${page.file} is missing its self hreflang`);
  if (!html.includes(`hreflang="${page.language === "en" ? "th" : "en"}" href="${page.counterpart}"`)) throw new Error(`${page.file} is missing its reciprocal hreflang`);
  if (!html.includes(`hreflang="x-default" href="${page.defaultUrl}"`)) throw new Error(`${page.file} is missing its x-default`);
  if (!html.includes('content="index,follow,max-image-preview:large')) throw new Error(`${page.file} has the wrong robots policy`);
  if ((html.match(/<h1\b/g) ?? []).length !== 1 || !html.includes(`<h1>${page.heading}</h1>`)) throw new Error(`${page.file} needs one correct H1`);
  const header = html.match(/<header\b[\s\S]*?<\/header>/)?.[0] ?? "";
  if (!header.includes(`href="${page.toolHubPath}"`) || !header.includes('aria-current="page"')) throw new Error(`${page.file} must visibly link to the active tools hub in its header`);
  if (html.includes("Siamese Cat Dev") || html.includes("skinny-filter") || html.includes("🐾")) throw new Error(`${page.file} contains an excluded, unrelated, or unapproved placeholder asset`);
  if (html.includes("polaroid-og.webp")) throw new Error(`${page.file} contains an unapproved social image`);
  if (page.file.includes("kids-routine-chart") && (!html.includes(`property="og:image" content="${ROUTINE_OG_IMAGE}"`) || !html.includes(`name="twitter:image" content="${ROUTINE_OG_IMAGE}"`))) {
    throw new Error(`${page.file} has an invalid routine-chart social image URL`);
  }
  if (html.includes('/tools/kids-routine-chart/morning/') || html.includes('/tools/kids-routine-chart/after-school/') || html.includes('/tools/kids-routine-chart/bedtime/') || html.includes('/tools/kids-routine-chart/weekend/')) {
    throw new Error(`${page.file} exposes duplicate preset URLs`);
  }
  if ((html.match(new RegExp(`gtag\\('config','G-MK27QPPWH5'\\)`, "g")) ?? []).length !== 1) throw new Error(`${page.file} must contain one analytics configuration`);
  const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!jsonLd.length) throw new Error(`${page.file} is missing JSON-LD`);
  for (const [, block] of jsonLd) JSON.parse(block);
  for (const [, image] of html.matchAll(/(<img\b[^>]*>)/g)) {
    if (!/\bwidth="\d+"/.test(image) || !/\bheight="\d+"/.test(image)) throw new Error(`${page.file} contains an image without intrinsic dimensions`);
  }
}

for (const file of ["app.js", "styles.css", "creative-club-logo.webp", "creative-club-play-area.webp", "siamese-cat-cafe-logo.png", "og-kids-routine-chart.png", "icon-32.png", "icon-192.png"]) {
  if (!existsSync(join(ROOT, "public", "tools", "kids-routine-chart", "assets", file))) throw new Error(`Missing routine-tool asset: ${file}`);
}
for (const file of ["app.js", "site.css", "logo-circle.webp"]) {
  if (!existsSync(join(ROOT, "public", "tools", "polaroid-generator", "assets", file))) throw new Error(`Missing Polaroid-tool asset: ${file}`);
}

const routineScript = readFileSync(join(ROOT, "public", "tools", "kids-routine-chart", "assets", "app.js"), "utf8");
if (!routineScript.includes("tool_export_png") || !routineScript.includes("tool_print") || !routineScript.includes("new URLSearchParams")) {
  throw new Error("Routine tool is missing its export, print, or preset analytics behavior");
}
const polaroidScript = readFileSync(join(ROOT, "public", "tools", "polaroid-generator", "assets", "app.js"), "utf8");
if (!polaroidScript.includes("tool_image_loaded") || !polaroidScript.includes("tool_export_png") || polaroidScript.includes("🐾")) {
  throw new Error("Polaroid tool is missing private-use analytics behavior or still contains an unapproved placeholder");
}

console.log("family-tools → bilingual metadata, assets, privacy behavior, and analytics verified");

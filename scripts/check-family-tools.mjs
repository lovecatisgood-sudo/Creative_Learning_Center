import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SITE = "https://creative.siamesecat.cafe";
const ROUTINE_PATH = "/tools/kids-routine-chart";
const POLAROID_PATH = "/tools/polaroid-generator";
const CAT_PASSPORT_PATH = "/tools/cat-passport";
const CAT_FOOD_CALCULATOR_PATH = "/tools/cat-food-calculator";
const SKINNY_FILTER_PATH = "/tools/skinny-filter";
const ROUTINE_OG_IMAGE = `${SITE}${ROUTINE_PATH}/assets/og-kids-routine-chart.png`;

const pages = [
  { language: "th", file: "tools.html", url: `${SITE}/tools`, counterpart: `${SITE}/EN/tools`, defaultUrl: `${SITE}/tools`, heading: "เครื่องมือออนไลน์เล็ก ๆ สำหรับชีวิตครอบครัว", toolHubPath: "/tools" },
  { language: "en", file: "EN/tools.html", url: `${SITE}/EN/tools`, counterpart: `${SITE}/tools`, defaultUrl: `${SITE}/tools`, heading: "Practical browser tools for family life", toolHubPath: "/EN/tools" },
  { language: "th", file: "tools/kids-routine-chart.html", url: `${SITE}${ROUTINE_PATH}`, counterpart: `${SITE}/EN${ROUTINE_PATH}`, defaultUrl: `${SITE}${ROUTINE_PATH}`, heading: "ตารางกิจวัตรประจำวันเด็กแบบภาพ", toolHubPath: "/tools" },
  { language: "en", file: "EN/tools/kids-routine-chart.html", url: `${SITE}/EN${ROUTINE_PATH}`, counterpart: `${SITE}${ROUTINE_PATH}`, defaultUrl: `${SITE}${ROUTINE_PATH}`, heading: "Kids Visual Routine Chart", toolHubPath: "/EN/tools" },
  { language: "th", file: "tools/polaroid-generator.html", url: `${SITE}${POLAROID_PATH}`, counterpart: `${SITE}/EN${POLAROID_PATH}`, defaultUrl: `${SITE}${POLAROID_PATH}`, heading: "สร้างรูปโพลารอยด์สวย ๆ ในไม่กี่วินาที", toolHubPath: "/tools" },
  { language: "en", file: "EN/tools/polaroid-generator.html", url: `${SITE}/EN${POLAROID_PATH}`, counterpart: `${SITE}${POLAROID_PATH}`, defaultUrl: `${SITE}${POLAROID_PATH}`, heading: "Make a beautiful Polaroid photo in seconds", toolHubPath: "/EN/tools" },
  { language: "th", file: "tools/cat-passport.html", url: `${SITE}${CAT_PASSPORT_PATH}`, counterpart: `${SITE}/EN${CAT_PASSPORT_PATH}`, defaultUrl: `${SITE}${CAT_PASSPORT_PATH}`, toolHubPath: "/tools" },
  { language: "en", file: "EN/tools/cat-passport.html", url: `${SITE}/EN${CAT_PASSPORT_PATH}`, counterpart: `${SITE}${CAT_PASSPORT_PATH}`, defaultUrl: `${SITE}${CAT_PASSPORT_PATH}`, toolHubPath: "/EN/tools" },
  { language: "th", file: "tools/cat-food-calculator.html", url: `${SITE}${CAT_FOOD_CALCULATOR_PATH}`, counterpart: `${SITE}/EN${CAT_FOOD_CALCULATOR_PATH}`, defaultUrl: `${SITE}${CAT_FOOD_CALCULATOR_PATH}`, toolHubPath: "/tools" },
  { language: "en", file: "EN/tools/cat-food-calculator.html", url: `${SITE}/EN${CAT_FOOD_CALCULATOR_PATH}`, counterpart: `${SITE}${CAT_FOOD_CALCULATOR_PATH}`, defaultUrl: `${SITE}${CAT_FOOD_CALCULATOR_PATH}`, toolHubPath: "/EN/tools" },
  { language: "th", file: "tools/skinny-filter.html", url: `${SITE}${SKINNY_FILTER_PATH}`, counterpart: `${SITE}/EN${SKINNY_FILTER_PATH}`, defaultUrl: `${SITE}${SKINNY_FILTER_PATH}`, toolHubPath: "/tools" },
  { language: "en", file: "EN/tools/skinny-filter.html", url: `${SITE}/EN${SKINNY_FILTER_PATH}`, counterpart: `${SITE}${SKINNY_FILTER_PATH}`, defaultUrl: `${SITE}${SKINNY_FILTER_PATH}`, toolHubPath: "/EN/tools" },
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
  if ((html.match(/<h1\b/g) ?? []).length !== 1 || (page.heading && !html.includes(`<h1>${page.heading}</h1>`))) throw new Error(`${page.file} needs one correct H1`);
  const header = html.match(/<header\b[\s\S]*?<\/header>/)?.[0] ?? "";
  if (!header.includes(`href="${page.toolHubPath}"`) || !header.includes('aria-current="page"')) throw new Error(`${page.file} must visibly link to the active tools hub in its header`);
  if (html.includes("Siamese Cat Dev") || html.includes("Siamese Cat Creative Tools") || html.includes("djai.academy") || html.includes("🐾")) throw new Error(`${page.file} contains an excluded, unrelated, or unapproved placeholder asset`);
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
for (const file of ["app.js", "styles.css", "charlie-cat.webp", "siamese-cat-cafe-logo.png"]) {
  if (!existsSync(join(ROOT, "public", "tools", "cat-passport", "assets", file))) throw new Error(`Missing cat-passport asset: ${file}`);
}
for (const file of ["calculator.js", "calculator.css", "creative-club-logo.webp", "og-en.jpg", "og-th.jpg"]) {
  if (!existsSync(join(ROOT, "public", "tools", "cat-food-calculator", "assets", file))) throw new Error(`Missing cat-food-calculator asset: ${file}`);
}
for (const file of ["app.js", "styles.css", "creative-club-logo.png", "siamese-cat-cafe-logo.png"]) {
  if (!existsSync(join(ROOT, "public", "tools", "skinny-filter", "assets", file))) throw new Error(`Missing photo-reshape asset: ${file}`);
}
if (!existsSync(join(ROOT, "public", "tools", "shared", "navigation.css"))) throw new Error("Missing shared tool navigation stylesheet");

const routineScript = readFileSync(join(ROOT, "public", "tools", "kids-routine-chart", "assets", "app.js"), "utf8");
if (!routineScript.includes("tool_export_png") || !routineScript.includes("tool_print") || !routineScript.includes("new URLSearchParams")) {
  throw new Error("Routine tool is missing its export, print, or preset analytics behavior");
}
const polaroidScript = readFileSync(join(ROOT, "public", "tools", "polaroid-generator", "assets", "app.js"), "utf8");
if (!polaroidScript.includes("tool_image_loaded") || !polaroidScript.includes("tool_export_png") || polaroidScript.includes("🐾")) {
  throw new Error("Polaroid tool is missing private-use analytics behavior or still contains an unapproved placeholder");
}
const passportScript = readFileSync(join(ROOT, "public", "tools", "cat-passport", "assets", "app.js"), "utf8");
if (!passportScript.includes("toDataURL") || !passportScript.includes("toBlob") || !passportScript.includes("drawSquare") || !passportScript.includes("drawStory") || passportScript.includes("fetch(")) throw new Error("Cat passport is missing local-only export behavior or its format-specific layouts");
const calculatorScript = readFileSync(join(ROOT, "public", "tools", "cat-food-calculator", "assets", "calculator.js"), "utf8");
if (!calculatorScript.includes("70 * Math.pow(kg, 0.75)") || !calculatorScript.includes("appetiteWarning") || calculatorScript.includes("fetch(")) throw new Error("Cat food calculator is missing its estimate formula or urgent-care safeguard");
const reshapeScript = readFileSync(join(ROOT, "public", "tools", "skinny-filter", "assets", "app.js"), "utf8");
if (!reshapeScript.includes("MEDIAPIPE_MODULE") || !reshapeScript.includes("toBlob") || !reshapeScript.includes("MAX_FILE_BYTES")) throw new Error("Photo reshape tool is missing its local editor safeguards");
for (const path of [CAT_PASSPORT_PATH, CAT_FOOD_CALCULATOR_PATH, SKINNY_FILTER_PATH]) {
  if (!readFileSync(join(ROOT, "public", "main-site", "tools.html"), "utf8").includes(`href="${path}"`)) throw new Error(`${path} is missing from the Thai tools hub`);
  if (!readFileSync(join(ROOT, "public", "main-site", "EN", "tools.html"), "utf8").includes(`href="/EN${path}"`)) throw new Error(`${path} is missing from the English tools hub`);
}
for (const file of ["tools.html", "EN/tools.html"]) {
  const html = readFileSync(join(ROOT, "public", "main-site", file), "utf8");
  if (html.includes("a printable kids routine chart and a private Polaroid photo maker")) throw new Error(`${file} still describes only the original two tools`);
}

console.log("family-tools → bilingual metadata, assets, privacy behavior, and analytics verified");

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SITE = "https://creative.siamesecat.cafe";
const TOOL_PATH = "/tools/kids-routine-chart";
const pages = [
  { language: "th", file: "tools.html", url: `${SITE}/tools`, counterpart: `${SITE}/EN/tools`, defaultUrl: `${SITE}/tools`, heading: "เครื่องมือเล็ก ๆ สำหรับกิจวัตรครอบครัว" },
  { language: "en", file: "EN/tools.html", url: `${SITE}/EN/tools`, counterpart: `${SITE}/tools`, defaultUrl: `${SITE}/tools`, heading: "A practical tool for family routines" },
  { language: "th", file: "tools/kids-routine-chart.html", url: `${SITE}${TOOL_PATH}`, counterpart: `${SITE}/EN${TOOL_PATH}`, defaultUrl: `${SITE}${TOOL_PATH}`, heading: "ตารางกิจวัตรประจำวันเด็กแบบภาพ" },
  { language: "en", file: "EN/tools/kids-routine-chart.html", url: `${SITE}/EN${TOOL_PATH}`, counterpart: `${SITE}${TOOL_PATH}`, defaultUrl: `${SITE}${TOOL_PATH}`, heading: "Kids Visual Routine Chart" },
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
  if (html.includes("Siamese Cat Dev") || html.includes("skinny-filter")) throw new Error(`${page.file} contains an excluded or unrelated tool`);
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

const script = readFileSync(join(ROOT, "public", "tools", "kids-routine-chart", "assets", "app.js"), "utf8");
if (!script.includes("tool_export_png") || !script.includes("tool_print") || !script.includes("new URLSearchParams")) {
  throw new Error("Routine tool is missing its export, print, or preset analytics behavior");
}
console.log("family-tools → bilingual metadata, assets, preset consolidation, and analytics verified");

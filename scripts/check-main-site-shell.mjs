import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), "public/main-site");
const expectedNav = {
  th: ["ภายในคลับ", "ครีเอทีฟคลับ", "เพลย์กรุ๊ป", "โปรแกรม Little Explorer", "สมาชิก", "แผนมื้ออาหาร", "FAQ", "ติดต่อเรา"],
  en: ["Inside the Club", "Creative Club", "Playgroup", "Little Explorer Program", "Membership", "Meal Plans", "FAQ", "Contact Us"],
};

function extract(html, tag) {
  const match = html.match(new RegExp(`<${tag}\\b[\\s\\S]*?</${tag}>`));
  if (!match) throw new Error(`Missing <${tag}>`);
  return match[0];
}

function normalizeHeader(header) {
  return header
    .replace(/\sactive(?=[" ])/g, "")
    .replace(/(<a class="lang-toggle"[^>]*href=")[^"]+/, "$1LANGUAGE_SWITCH");
}

function labels(header) {
  return [...header.matchAll(/<a[^>]*data-nav="[^"]+"[^>]*>([\s\S]*?)<\/a>/g)]
    .map(([, value]) => value.replace(/<[^>]+>/g, "").replace("⌄", "").trim());
}

for (const language of ["th", "en"]) {
  const directory = language === "th" ? ROOT : join(ROOT, "EN");
  const files = readdirSync(directory).filter((file) => file.endsWith(".html"));
  const pages = files.map((file) => ({ file, html: readFileSync(join(directory, file), "utf8") }));
  const reference = pages.find(({ file }) => file === "membership.html");
  if (!reference) throw new Error(`Missing ${language} membership reference page`);

  const referenceHeader = normalizeHeader(extract(reference.html, "header"));
  const referenceFooter = extract(reference.html, "footer");

  for (const page of pages) {
    const header = extract(page.html, "header");
    const footer = extract(page.html, "footer");
    if (normalizeHeader(header) !== referenceHeader) {
      throw new Error(`${language}/${page.file} header differs from membership.html`);
    }
    if (footer !== referenceFooter) {
      throw new Error(`${language}/${page.file} footer differs from membership.html`);
    }
    if (JSON.stringify(labels(header)) !== JSON.stringify(expectedNav[language])) {
      throw new Error(`${language}/${page.file} has incorrect navigation labels`);
    }
  }
}

console.log("main-site:shell → shared header, footer, labels and links verified");

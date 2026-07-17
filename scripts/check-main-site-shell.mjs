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
    if (!footer.includes('href="https://siamesecat.cafe/"')) {
      throw new Error(`${language}/${page.file} is missing the Siamese Cat Cafe footer link`);
    }
    if (!footer.includes(language === "en" ? 'href="/EN/contact"' : 'href="/contact"')) {
      throw new Error(`${language}/${page.file} is missing the Contact Us footer link`);
    }
    const structuredMatch = page.html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (!structuredMatch) {
      throw new Error(`${language}/${page.file} is missing JSON-LD structured data`);
    }
    const structured = JSON.parse(structuredMatch[1]);
    const business = structured["@graph"]?.find((item) => item["@type"] === "LocalBusiness");
    if (business?.name !== "Siamese Cat Creative Club" || business?.legalName !== "Siamese Cat Cafe Co., Ltd. (Thailand)" || business?.address?.addressCountry !== "TH") {
      throw new Error(`${language}/${page.file} has incomplete LocalBusiness structured data`);
    }
    if (!page.html.includes('<link rel="canonical"') || !page.html.includes('hreflang="th"') || !page.html.includes('hreflang="en"') || !page.html.includes('hreflang="x-default"')) {
      throw new Error(`${language}/${page.file} is missing canonical or language metadata`);
    }
    if (page.html.includes("logo-circle.png")) {
      throw new Error(`${language}/${page.file} still references the oversized PNG logo`);
    }
    for (const [, image] of page.html.matchAll(/(<img\b[^>]*>)/g)) {
      if (!/\bwidth="\d+"/.test(image) || !/\bheight="\d+"/.test(image)) {
        throw new Error(`${language}/${page.file} contains an image without intrinsic dimensions`);
      }
    }
    const shouldIndex = !["404.html", "thank-you.html"].includes(page.file);
    const expectedRobots = shouldIndex ? 'content="index,follow,max-image-preview:large"' : 'content="noindex,nofollow"';
    if (!page.html.includes(expectedRobots)) {
      throw new Error(`${language}/${page.file} has the wrong robots policy`);
    }
  }

  const prefix = language === "en" ? "/EN" : "";
  const playgroup = pages.find(({ file }) => file === "playgroup.html")?.html ?? "";
  const dinner = pages.find(({ file }) => file === "dinner.html")?.html ?? "";
  const contact = pages.find(({ file }) => file === "contact.html")?.html ?? "";
  if (!playgroup.includes(`href="${prefix}/membership"`)) {
    throw new Error(`${language}/playgroup.html pass link does not open Membership`);
  }
  if (!dinner.includes('<a class="cafe-logo-panel" href="https://siamesecat.cafe/"')) {
    throw new Error(`${language}/dinner.html café logo is not linked`);
  }
  if (!contact.includes("data-contact-form") || !contact.includes("https://wa.me/66952413028")) {
    throw new Error(`${language}/contact.html is missing its form or WhatsApp contact`);
  }
}

console.log("main-site:shell → shared header, footer, labels and links verified");

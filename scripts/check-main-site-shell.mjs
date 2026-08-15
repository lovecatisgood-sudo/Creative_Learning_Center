import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), "public/main-site");
const GOOGLE_ANALYTICS_ID = "G-MK27QPPWH5";
const GOOGLE_ADSENSE_SELLER_RECORD = "google.com, pub-3624708289866566, DIRECT, f08c47fec0942fa0\n";
const expectedNav = {
  th: ["ภายในคลับ", "ครีเอทีฟคลับ", "Kids Playroom", "สมาชิก", "แผนมื้ออาหาร", "บล็อก", "คำถามจากพ่อแม่", "การเล่นและพัฒนาการ", "เรื่องจากในคลับ", "ชีวิตหลังเลิกเรียน", "FAQ หลัก", "เครื่องมือฟรี", "ติดต่อเรา"],
  en: ["Inside the Club", "Creative Club", "Kids Playroom", "Membership", "Meal Plans", "Blog", "Parent Questions", "Play & Development", "Inside the Club", "After School", "Main FAQ", "Free Tools", "Contact Us"],
};

const adsTxt = readFileSync(join(process.cwd(), "public/ads.txt"), "utf8");
if (adsTxt !== GOOGLE_ADSENSE_SELLER_RECORD) {
  throw new Error("public/ads.txt is missing or does not exactly match the authorized AdSense seller record");
}

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
    .map(([, value]) => value.replace(/<[^>]+>/g, "").replaceAll("&amp;", "&").replace("⌄", "").trim());
}

for (const language of ["th", "en"]) {
  const directory = language === "th" ? ROOT : join(ROOT, "EN");
  // The family-tools generator owns tools.html and validates its different,
  // intentionally compact shell in check-family-tools.mjs.
  const files = readdirSync(directory).filter((file) => file.endsWith(".html") && file !== "tools.html");
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
    const analyticsLoader = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`;
    if (!page.html.includes(analyticsLoader) || !page.html.includes(`gtag('config', '${GOOGLE_ANALYTICS_ID}')`)) {
      throw new Error(`${language}/${page.file} is missing Google Analytics`);
    }
    if (page.html.split(analyticsLoader).length !== 2) {
      throw new Error(`${language}/${page.file} contains duplicate Google Analytics tags`);
    }
    if (page.html.includes("pagead2.googlesyndication.com")) throw new Error(`${language}/${page.file} unexpectedly contains advertising code`);
    if (page.html.includes("logo-circle.png")) {
      throw new Error(`${language}/${page.file} still references the oversized PNG logo`);
    }
    for (const [, image] of page.html.matchAll(/(<img\b[^>]*>)/g)) {
      if (!/\bwidth="\d+"/.test(image) || !/\bheight="\d+"/.test(image)) {
        throw new Error(`${language}/${page.file} contains an image without intrinsic dimensions`);
      }
    }
    const shouldIndex = !["404.html", "thank-you.html"].includes(page.file);
    const expectedRobots = shouldIndex ? 'content="index,follow,max-image-preview:large"' : 'content="noindex,follow"';
    if (!page.html.includes(expectedRobots)) {
      throw new Error(`${language}/${page.file} has the wrong robots policy`);
    }
  }

  const prefix = language === "en" ? "/EN" : "";
  const playgroup = pages.find(({ file }) => file === "playgroup.html")?.html ?? "";
  const dinner = pages.find(({ file }) => file === "dinner.html")?.html ?? "";
  const contact = pages.find(({ file }) => file === "contact.html")?.html ?? "";
  const home = pages.find(({ file }) => file === "index.html")?.html ?? "";
  const expectedPrices = language === "en"
    ? ["149 THB", "249 THB", "80 THB", "50 THB", "45 THB", "69 THB", "99 THB"]
    : ["149 บาท", "249 บาท", "80 บาท", "50 บาท", "45 บาท", "69 บาท", "99 บาท"];
  for (const price of expectedPrices) {
    if (!playgroup.includes(price)) throw new Error(`${language}/playgroup.html is missing ${price}`);
  }
  if (!playgroup.includes(language === "en" ? "must stay on the premises" : "ต้องอยู่ภายในสถานที่")) {
    throw new Error(`${language}/playgroup.html is missing the parent-on-premises rule`);
  }
  for (const retired of ["18,000 THB", "9,200 THB", "1,500 THB", "999 THB", "Meal Care Value — 250 THB"]) {
    if (playgroup.includes(retired)) throw new Error(`${language}/playgroup.html contains retired offer: ${retired}`);
  }
  if (!dinner.includes('<a class="cafe-logo-panel" href="https://siamesecat.cafe/"')) {
    throw new Error(`${language}/dinner.html café logo is not linked`);
  }
  if (!contact.includes("data-contact-form") || !contact.includes("https://wa.me/66952413028")) {
    throw new Error(`${language}/contact.html is missing its form or WhatsApp contact`);
  }
  if (!home.includes("data-home-blog-grid") || !home.includes(`${prefix}/blog?category=parenting-guides`)) {
    throw new Error(`${language}/index.html is missing the published-blog feed or category links`);
  }
}

const appLayout = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");
const middleware = readFileSync(join(process.cwd(), "src/middleware.ts"), "utf8");
const publicBlogShell = readFileSync(join(process.cwd(), "src/components/blog/PublicBlogShell.tsx"), "utf8");
if (!appLayout.includes(GOOGLE_ANALYTICS_ID) || !appLayout.includes("isCustomerPage")) {
  throw new Error("Next.js public routes are missing guarded Google Analytics");
}
if (!appLayout.includes('pathname.startsWith("/admin")') || !appLayout.includes('pathname.startsWith("/api")')) {
  throw new Error("Google Analytics is not excluded from admin and API routes");
}
if (!middleware.includes('requestHeaders.set("x-sccc-pathname", pathname)')) {
  throw new Error("Middleware is not forwarding the pathname to the analytics guard");
}
const blogToolsItem = '{ key: "tools", href: "/tools", th: "เครื่องมือฟรี", en: "Free Tools" },';
if (publicBlogShell.split(blogToolsItem).length !== 2) {
  throw new Error("Blog header is missing its single localized Free Tools navigation item");
}
if (!publicBlogShell.includes('href={local(item.href)}')) {
  throw new Error("Blog header does not localize navigation links");
}

const GAME_ROOT = join(process.cwd(), "game-assets/cat-vs-dog");
const gamePages = {
  landing: readFileSync(join(GAME_ROOT, "index.html"), "utf8"),
  en: readFileSync(join(GAME_ROOT, "en/index.html"), "utf8"),
  th: readFileSync(join(GAME_ROOT, "th/index.html"), "utf8"),
};
const gameUrls = {
  landing: "https://creative.siamesecat.cafe/game/cat-vs-dog/",
  en: "https://creative.siamesecat.cafe/game/cat-vs-dog/en/",
  th: "https://creative.siamesecat.cafe/game/cat-vs-dog/th/",
};

for (const [name, html] of Object.entries(gamePages)) {
  if (!html.includes(`<link rel="canonical" href="${gameUrls[name]}">`)) {
    throw new Error(`Game ${name} page has the wrong canonical URL`);
  }
  for (const language of ["en", "th"]) {
    if (!html.includes(`hreflang="${language}" href="${gameUrls[language]}"`)) {
      throw new Error(`Game ${name} page is missing its ${language} alternate URL`);
    }
  }
  if (!html.includes(`hreflang="x-default" href="${gameUrls.landing}"`)) {
    throw new Error(`Game ${name} page is missing its default alternate URL`);
  }
  if (html.includes("siamesecatcafe.com") || html.includes("game.siamesecatcafe.com")) {
    throw new Error(`Game ${name} page still references an obsolete host`);
  }
}

if (!gamePages.landing.includes("GAME_URL = { en:'en/', th:'th/' }")) {
  throw new Error("Game landing page does not use deployment-relative language URLs");
}
if (!gamePages.landing.includes("new Audio('assets/audio/default.mp3')")) {
  throw new Error("Game landing page does not use its bundled soundtrack");
}

console.log("main-site:shell → shared header, footer, labels and links verified");

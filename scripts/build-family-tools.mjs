import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SITE = "https://creative.siamesecat.cafe";
const ROOT = process.cwd();
const OUTPUT = join(ROOT, "public");
const ANALYTICS_ID = "G-MK27QPPWH5";

const ROUTINE_PATH = "/tools/kids-routine-chart";
const POLAROID_PATH = "/tools/polaroid-generator";
const CAT_PASSPORT_PATH = "/tools/cat-passport";
const CAT_FOOD_CALCULATOR_PATH = "/tools/cat-food-calculator";
const SKINNY_FILTER_PATH = "/tools/skinny-filter";
const ROUTINE_SOURCE = join(ROOT, "tools-source", "kids-routine-chart");
const POLAROID_SOURCE = join(ROOT, "tools-source", "polaroid-generator");
const CAT_PASSPORT_SOURCE = join(ROOT, "tools-source", "cat-passport");
const CAT_FOOD_CALCULATOR_SOURCE = join(ROOT, "tools-source", "cat-food-calculator");
const SKINNY_FILTER_SOURCE = join(ROOT, "tools-source", "skinny-filter");
const TOOL_PATHS = [ROUTINE_PATH, POLAROID_PATH, CAT_PASSPORT_PATH, CAT_FOOD_CALCULATOR_PATH, SKINNY_FILTER_PATH];
const DEFAULT_SOCIAL_IMAGE = `${SITE}/landing/og-siamese-cat-creative-club.jpg`;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pageUrl(language, path) {
  return `${SITE}${language === "en" ? "/EN" : ""}${path}`;
}

function routeFor(language, path) {
  return language === "en" ? `/EN${path}` : path;
}

function analytics() {
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_ID}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ANALYTICS_ID}');</script>`;
}

const TOOL_NAVIGATION_CSS = `
.tool-navigation{position:sticky;top:0;z-index:80;background:rgba(255,250,242,.96);border-bottom:1px solid rgba(66,46,32,.14);backdrop-filter:blur(14px)}
.tool-navigation__inner{width:min(1180px,calc(100% - 32px));min-height:72px;margin:auto;display:flex;align-items:center;gap:18px}
.tool-navigation__brand{display:flex;align-items:center;gap:10px;color:#302720;text-decoration:none;min-width:max-content}.tool-navigation__brand img{width:48px;height:48px;border-radius:50%;object-fit:cover}.tool-navigation__brand strong{display:block;font:700 16px/1.15 Georgia,serif}.tool-navigation__brand span{display:block;margin-top:3px;color:#6a5a50;font-size:11px}
.tool-navigation__links{display:flex;align-items:center;gap:3px;margin-left:auto;overflow-x:auto;scrollbar-width:none}.tool-navigation__links::-webkit-scrollbar{display:none}.tool-navigation__links a{white-space:nowrap;color:#4d4037;text-decoration:none;padding:8px 10px;border-radius:999px;font-size:13px;font-weight:700}.tool-navigation__links a:hover,.tool-navigation__links a:focus-visible,.tool-navigation__links a[aria-current="page"]{background:#e4f2ea;color:#1d6247;outline:none}.tool-navigation__language{color:#1d6247!important;border:1px solid rgba(29,98,71,.24);background:#fffaf2}
@media(max-width:860px){.tool-navigation__inner{flex-wrap:wrap;gap:7px;padding:10px 0}.tool-navigation__links{order:3;flex:0 0 100%;width:100%;margin-left:0;padding:0 0 3px}.tool-navigation__brand span{display:none}.tool-navigation__links a{padding:7px 9px}}
`;

function toolNavigation(language, path) {
  const isEnglish = language === "en";
  const home = isEnglish ? "/EN" : "/";
  const inside = isEnglish ? "/EN/inside" : "/inside";
  const creative = isEnglish ? "/EN/creative" : "/creative";
  const playgroup = isEnglish ? "/EN/playgroup" : "/playgroup";
  const blog = isEnglish ? "/EN/blog" : "/blog";
  const contact = isEnglish ? "/EN/contact" : "/contact";
  const tools = routeFor(language, "/tools");
  const alternate = routeFor(isEnglish ? "th" : "en", path);
  return `<header class="tool-navigation"><div class="tool-navigation__inner"><a class="tool-navigation__brand" href="${home}"><img src="/tools/kids-routine-chart/assets/creative-club-logo.webp" width="48" height="48" alt="Siamese Cat Creative Club"><span><strong>Siamese Cat Creative Club</strong><span>${isEnglish ? "Flexible • Creative • Caring" : "ยืดหยุ่น • สร้างสรรค์ • ใส่ใจ"}</span></span></a><nav class="tool-navigation__links" aria-label="${isEnglish ? "Main navigation" : "เมนูหลัก"}"><a href="${inside}">${isEnglish ? "Inside the Club" : "ภายในคลับ"}</a><a href="${creative}">${isEnglish ? "Creative Club" : "ครีเอทีฟคลับ"}</a><a href="${playgroup}">${isEnglish ? "Kids Playroom" : "Kids Playroom"}</a><a href="${blog}">${isEnglish ? "Blog" : "บล็อก"}</a><a href="${tools}" aria-current="page">${isEnglish ? "Free Tools" : "เครื่องมือฟรี"}</a><a href="${contact}">${isEnglish ? "Contact" : "ติดต่อเรา"}</a><a class="tool-navigation__language" href="${alternate}" hreflang="${isEnglish ? "th" : "en"}" lang="${isEnglish ? "th" : "en"}">${isEnglish ? "ไทย" : "English"}</a></nav></div></header>`;
}

function removeDevLinks(html) {
  return html
    .replace(/<article class="brand-card">[\s\S]*?<\/article>/g, (card) => (
      card.includes("Siamese Cat Dev") || card.includes("djai.academy") ? "" : card
    ))
    .replace(/<a\b[^>]*href="https:\/\/www\.djai\.academy\/siamese_cat\/dev(?:\/en)?\/"[^>]*>[\s\S]*?<\/a>/g, "")
    .replaceAll("Siamese Cat Dev", "")
    .replace(/เชื่อมผู้ใช้ไปยัง Siamese Cat Cafe\s+และพัฒนาโดย\s*<\/p>/g, "เชื่อมผู้ใช้ไปยัง Siamese Cat Cafe.</p>")
    .replace(/connects visitors with Siamese Cat Cafe,\s+and is built by\s*\.?\s*<\/p>/g, "connects visitors with Siamese Cat Cafe.</p>")
    .replace(/[ \t]+\n/g, "\n");
}

function setSocialImage(html) {
  const og = `<meta property="og:image" content="${DEFAULT_SOCIAL_IMAGE}">`;
  const twitter = `<meta name="twitter:image" content="${DEFAULT_SOCIAL_IMAGE}">`;
  html = html.includes('property="og:image"')
    ? html.replace(/<meta property="og:image" content="[^"]*">/g, og)
    : html.replace("</head>", `${og}</head>`);
  return html.includes('name="twitter:image"')
    ? html.replace(/<meta name="twitter:image" content="[^"]*">/g, twitter)
    : html.replace("</head>", `${twitter}</head>`);
}

function addMissingImageDimensions(html) {
  return html.replace(/<img\b[^>]*>/g, (image) => {
    if (/\bwidth="\d+"/.test(image) && /\bheight="\d+"/.test(image)) return image;
    return image.replace(/\/?>(?=$)/, ' width="96" height="96">');
  });
}

function finishImportedTool(html, language, path, name) {
  const thisUrl = pageUrl(language, path);
  const otherUrl = pageUrl(language === "en" ? "th" : "en", path);
  html = normalizeToolUrls(html);
  html = html.replace(/<link rel="alternate" hreflang="x-default" href="[^"]*">/, `<link rel="alternate" hreflang="x-default" href="${pageUrl("th", path)}">`);
  html = removeDevLinks(html)
    .replaceAll("Siamese Cat Creative Tools", "Siamese Cat Creative Club")
    .replace(/"creator"\s*:\s*\{\s*"@type"\s*:\s*"Organization"\s*,\s*"name"\s*:\s*"[^"]*"\s*,\s*"url"\s*:\s*"https:\/\/www\.djai\.academy\/siamese_cat\/dev(?:\/en)?\/"\s*\}/g, `"creator":{"@type":"Organization","name":"Siamese Cat Creative Club","url":"${pageUrl(language, "")}"}`)
    .replace(/"dateModified"\s*:\s*"2026-08-08"/g, '"dateModified":"2026-08-09"')
    .replace(/<header\b[\s\S]*?<\/header>/, toolNavigation(language, path))
    .replace("</head>", `<link rel="stylesheet" href="/tools/shared/navigation.css">${analytics()}</head>`);
  html = setSocialImage(html);
  if (!html.includes(`<link rel="canonical" href="${thisUrl}">`)) throw new Error(`Wrong canonical produced for ${language} ${name}`);
  if (!html.includes(`hreflang="${language === "en" ? "th" : "en"}" href="${otherUrl}"`)) throw new Error(`Missing reciprocal alternate for ${language} ${name}`);
  if (!html.includes('class="tool-navigation"')) throw new Error(`Missing shared tool navigation for ${language} ${name}`);
  if (html.includes("Siamese Cat Dev")) throw new Error(`Unapproved developer cross-link remains in ${language} ${name}`);
  return addMissingImageDimensions(html);
}

function transformCatPassport(language) {
  const thaiUrl = pageUrl("th", CAT_PASSPORT_PATH);
  const englishUrl = pageUrl("en", CAT_PASSPORT_PATH);
  let html = readFileSync(join(CAT_PASSPORT_SOURCE, "templates", `${language}.html`), "utf8")
    .replaceAll(`${SITE}/th/tools/cat-passport/`, thaiUrl)
    .replaceAll(`${SITE}/tools/cat-passport/`, englishUrl)
    .replaceAll("../../../assets/", "/tools/cat-passport/assets/")
    .replaceAll("../../assets/", "/tools/cat-passport/assets/")
    .replaceAll('data-base="../../../"', 'data-base="/tools/cat-passport/"')
    .replaceAll('data-base="../../"', 'data-base="/tools/cat-passport/"')
    .replaceAll("Siamese Cat Creative Tools", "Siamese Cat Creative Club")
    .replaceAll("🐾 ", "")
    .replaceAll("🐾", "");
  html = finishImportedTool(html, language, CAT_PASSPORT_PATH, "cat passport");
  return html
    .replaceAll('src="/tools/cat-passport/assets/siamese-cat-cafe-logo.png" alt=', 'src="/tools/cat-passport/assets/siamese-cat-cafe-logo.png" width="96" height="96" alt=')
    .replaceAll('src="/tools/cat-passport/assets/charlie-cat.webp" alt=', 'src="/tools/cat-passport/assets/charlie-cat.webp" width="480" height="480" alt=');
}

function transformCatFoodCalculator(language) {
  const thaiUrl = pageUrl("th", CAT_FOOD_CALCULATOR_PATH);
  const englishUrl = pageUrl("en", CAT_FOOD_CALCULATOR_PATH);
  let html = readFileSync(join(CAT_FOOD_CALCULATOR_SOURCE, "templates", `${language}.html`), "utf8")
    .replaceAll(`${SITE}/tools/calculator/pet-food/`, thaiUrl)
    .replaceAll(`${SITE}/EN/tools/calculator/pet-food/`, englishUrl)
    .replaceAll("/assets/tools/cat-food-calculator/", "/tools/cat-food-calculator/assets/");
  return finishImportedTool(html, language, CAT_FOOD_CALCULATOR_PATH, "cat food calculator");
}

function photoSafetyNotice(language) {
  return `<section class="section"><div class="container"><span class="section-kicker">${language === "en" ? "Responsible use" : "การใช้อย่างรับผิดชอบ"}</span><h2>${language === "en" ? "Keep editing private and consensual" : "แก้ไขภาพอย่างเป็นส่วนตัวและได้รับความยินยอม"}</h2><p class="section-intro">${language === "en" ? "Use photos you own or have permission to edit. This is an adult portrait editor: do not use it on children’s photos. Your selected image stays in your browser; optional pose detection is processed on your device." : "ใช้เฉพาะรูปที่คุณเป็นเจ้าของหรือได้รับอนุญาตให้แก้ไข เครื่องมือนี้สำหรับภาพบุคคลของผู้ใหญ่เท่านั้น ไม่ควรใช้กับรูปเด็ก รูปที่เลือกอยู่ในเบราว์เซอร์ของคุณ และการตรวจจับท่าทางแบบเลือกใช้จะประมวลผลบนอุปกรณ์"}</p></div></section>`;
}

function transformSkinnyFilter(language) {
  let html = readFileSync(join(SKINNY_FILTER_SOURCE, "templates", `${language}.html`), "utf8")
    .replaceAll("./assets/", "/tools/skinny-filter/assets/")
    .replaceAll("../../../tools/skinny-filter/assets/", "/tools/skinny-filter/assets/")
    .replace("</main>", `${photoSafetyNotice(language)}</main>`);
  return finishImportedTool(html, language, SKINNY_FILTER_PATH, "photo reshape tool");
}

function normalizeToolUrls(html) {
  for (const path of TOOL_PATHS) {
    for (const language of ["th", "en"]) {
      const url = pageUrl(language, path);
      // Normalize a trailing slash only when it terminates the tool URL.  A
      // broader replacement also strips the slash before `/assets/...`, which
      // breaks the routine chart's Open Graph and Twitter image URLs.
      html = html.replace(new RegExp(`${escapeRegExp(url)}/(?=[\"'#\\s<])`, "g"), url);
    }
    html = html
      .replaceAll(`href="${path}/"`, `href="${path}"`)
      .replaceAll(`href="/EN${path}/"`, `href="/EN${path}"`);
  }
  return html
    .replaceAll('href="/tools/"', 'href="/tools"')
    .replaceAll('href="/EN/tools/"', 'href="/EN/tools"')
    .replaceAll('href="/EN/"', 'href="/EN"');
}

function routineFamilyLinks(language) {
  const isEnglish = language === "en";
  const club = isEnglish ? "/EN/creative" : "/creative";
  const cafe = isEnglish ? "https://siamesecat.cafe/" : "https://siamesecat.cafe/th/";
  return `<section class="network"><span class="eyebrow">${isEnglish ? "Siamese Cat family" : "เครือ Siamese Cat"}</span><h2>${isEnglish ? "A practical tool, connected to a real place" : "เครื่องมือออนไลน์ที่เชื่อมกับพื้นที่จริง"}</h2><div class="network-grid"><a class="network-card" href="${club}"><img src="/tools/kids-routine-chart/assets/creative-club-logo.webp" width="96" height="96" alt="Siamese Cat Creative Club"><h3>Siamese Cat Creative Club</h3><p>${isEnglish ? "Explore a parent-accompanied Kids Playroom and separate after-school support near Mega Bangna." : "ดู Kids Playroom ที่ผู้ปกครองอยู่ด้วยและบริการดูแลหลังเลิกเรียนแยกใกล้ Mega Bangna"}</p></a><a class="network-card" href="${cafe}"><img src="/tools/kids-routine-chart/assets/siamese-cat-cafe-logo.png" width="320" height="320" alt="Siamese Cat Café"><h3>Siamese Cat Café</h3><p>${isEnglish ? "Visit Siamese Cat Café." : "เยี่ยมชม Siamese Cat Café"}</p></a></div></section>`;
}

function polaroidFamilyLinks(language) {
  const isEnglish = language === "en";
  const club = isEnglish ? "/EN/creative" : "/creative";
  const cafe = isEnglish ? "https://siamesecat.cafe/" : "https://siamesecat.cafe/th/";
  return `<section class="section"><div class="wrap"><span class="section-kicker">${isEnglish ? "Make a real memory" : "สร้างความทรงจำจริง"}</span><h2>${isEnglish ? "A simple frame for the photos you already love" : "กรอบเล็ก ๆ สำหรับรูปที่คุณชอบอยู่แล้ว"}</h2><div class="brand-grid"><a class="brand-card" href="${club}"><h3>Siamese Cat Creative Club</h3><p>${isEnglish ? "Explore a parent-accompanied Kids Playroom and separate after-school support for families around Bangna." : "ดู Kids Playroom ที่ผู้ปกครองอยู่ด้วยและบริการดูแลหลังเลิกเรียนแยกสำหรับครอบครัวแถวบางนา"}</p><span class="linkline">${isEnglish ? "Explore the Creative Club →" : "ดูครีเอทีฟคลับ →"}</span></a><a class="brand-card" href="${cafe}" rel="noopener"><h3>Siamese Cat Café</h3><p>${isEnglish ? "Turn a photo you took at the café into a keepsake frame directly in your browser." : "นำรูปที่คุณถ่ายจากคาเฟ่มาใส่กรอบเก็บความทรงจำได้ทันทีในเบราว์เซอร์"}</p><span class="linkline">${isEnglish ? "Visit the café →" : "เยี่ยมชมคาเฟ่ →"}</span></a></div></div></section>`;
}

function transformRoutine(language) {
  const languagePath = language === "en" ? "en" : "th";
  const thaiUrl = pageUrl("th", ROUTINE_PATH);
  const englishUrl = pageUrl("en", ROUTINE_PATH);
  const thisUrl = language === "en" ? englishUrl : thaiUrl;
  const otherUrl = language === "en" ? thaiUrl : englishUrl;
  let html = readFileSync(join(ROUTINE_SOURCE, "templates", `${languagePath}.html`), "utf8");

  for (const preset of ["morning", "after-school", "bedtime", "weekend"]) {
    html = html.replaceAll(`${routeFor(language, ROUTINE_PATH)}/${preset}/`, `${routeFor(language, ROUTINE_PATH)}?preset=${preset}`);
  }
  html = normalizeToolUrls(html)
    .replace('sameAs":["https://siamesecat.cafe/th/","https://www.djai.academy/siamese_cat/dev/"]', 'sameAs":["https://siamesecat.cafe/th/"]')
    .replace('sameAs":["https://siamesecat.cafe/","https://www.djai.academy/siamese_cat/dev/en/"]', 'sameAs":["https://siamesecat.cafe/"]')
    .replace(/<section class="network">[\s\S]*?<\/section>/, routineFamilyLinks(language))
    .replace(/ · <a href="https:\/\/www\.djai\.academy\/siamese_cat\/dev(?:\/en)?\/">Siamese Cat Dev<\/a>/, "")
    .replaceAll('src="/tools/kids-routine-chart/assets/creative-club-logo.webp" alt=', 'src="/tools/kids-routine-chart/assets/creative-club-logo.webp" width="96" height="96" alt=')
    .replaceAll('src="/tools/kids-routine-chart/assets/siamese-cat-cafe-logo.png" alt=', 'src="/tools/kids-routine-chart/assets/siamese-cat-cafe-logo.png" width="320" height="320" alt=')
    .replace("</head>", `${analytics()}\n</head>`);

  if (!html.includes(`<link rel="canonical" href="${thisUrl}">`)) throw new Error(`Wrong canonical produced for ${language} routine tool`);
  if (!html.includes(`hreflang="${language === "en" ? "th" : "en"}" href="${otherUrl}"`)) throw new Error(`Missing reciprocal alternate for ${language} routine tool`);
  return html;
}

function polishPolaroidCopy(html, language) {
  const isEnglish = language === "en";
  return html
    .replace(/<section class="section"><div class="wrap"><span class="section-kicker">(?:From the Siamese Cat family|จากครอบครัว Siamese Cat)<\/span>[\s\S]*?<\/section>/, polaroidFamilyLinks(language))
    .replace(/<a href="https:\/\/www\.djai\.academy\/siamese_cat\/dev(?:\/en)?\/">Siamese Cat Dev<\/a>/g, "")
    .replace(isEnglish ? "Flexible small-group programs for children plus lightweight creative web tools for families, creators and builders." : "สองโปรแกรมกลุ่มเล็กแบบยืดหยุ่นสำหรับเด็ก และชุดเครื่องมือสร้างสรรค์บนเว็บสำหรับครอบครัว ครีเอเตอร์ และ builders", isEnglish ? "Parent-accompanied Kids Playroom, separate after-school support and practical family tools." : "Kids Playroom ที่ผู้ปกครองอยู่ด้วย บริการดูแลหลังเลิกเรียนแยก และเครื่องมือออนไลน์สำหรับครอบครัว")
    .replaceAll('<div class="feature-icon">🔒</div>', '<div class="feature-icon">Private</div>')
    .replaceAll('<div class="feature-icon">⚡</div>', '<div class="feature-icon">Fast</div>')
    .replaceAll('<div class="feature-icon">🖼️</div>', '<div class="feature-icon">PNG</div>')
    .replaceAll('🔒 ', "");
}

function transformPolaroid(language) {
  const languagePath = language === "en" ? "en" : "th";
  const thaiUrl = pageUrl("th", POLAROID_PATH);
  const englishUrl = pageUrl("en", POLAROID_PATH);
  const thisUrl = language === "en" ? englishUrl : thaiUrl;
  const otherUrl = language === "en" ? thaiUrl : englishUrl;
  let html = readFileSync(join(POLAROID_SOURCE, "templates", `${languagePath}.html`), "utf8");
  html = html
    .replaceAll(`${SITE}${POLAROID_PATH}/assets/polaroid-og.webp`, `${SITE}/landing/og-siamese-cat-creative-club.jpg`);
  html = normalizeToolUrls(html)
    .replaceAll(`${SITE}${POLAROID_PATH}/`, `${SITE}${POLAROID_PATH}`)
    .replaceAll(`${SITE}/EN${POLAROID_PATH}/`, `${SITE}/EN${POLAROID_PATH}`);
  html = polishPolaroidCopy(html, language).replace("</head>", `${analytics()}\n</head>`);

  if (!html.includes(`<link rel="canonical" href="${thisUrl}">`)) throw new Error(`Wrong canonical produced for ${language} polaroid tool`);
  if (!html.includes(`hreflang="${language === "en" ? "th" : "en"}" href="${otherUrl}"`)) throw new Error(`Missing reciprocal alternate for ${language} polaroid tool`);
  if (html.includes("🐾") || html.includes("Siamese Cat Dev") || html.includes("polaroid-og.webp")) throw new Error(`Unapproved placeholder or off-brand asset remains in ${language} polaroid tool`);
  return html;
}

function hub(language) {
  const isEnglish = language === "en";
  const current = pageUrl(language, "/tools");
  const thai = pageUrl("th", "/tools");
  const english = pageUrl("en", "/tools");
  const home = isEnglish ? "/EN" : "/";
  const creative = isEnglish ? "/EN/creative" : "/creative";
  const playgroup = isEnglish ? "/EN/playgroup" : "/playgroup";
  const contact = isEnglish ? "/EN/contact" : "/contact";
  const routineUrl = routeFor(language, ROUTINE_PATH);
  const polaroidUrl = routeFor(language, POLAROID_PATH);
  const cafe = isEnglish ? "https://siamesecat.cafe/" : "https://siamesecat.cafe/th/";
  const title = isEnglish ? "Free Family Tools | Siamese Cat Creative Club" : "เครื่องมือฟรีสำหรับครอบครัว | Siamese Cat Creative Club";
  const description = isEnglish ? "Practical browser tools from Siamese Cat Creative Club: family planning, keepsakes, cat care estimates and private photo editing." : "เครื่องมือออนไลน์จาก Siamese Cat Creative Club สำหรับครอบครัว ของที่ระลึก การประเมินการดูแลแมว และการแก้ไขภาพส่วนตัว";
  const heading = isEnglish ? "Practical browser tools for family life" : "เครื่องมือออนไลน์เล็ก ๆ สำหรับชีวิตครอบครัว";
  const text = isEnglish ? "Plan a routine, create a keepsake, make a cat card, estimate food portions or edit a photo. Every tool works in your browser without an account." : "จัดตารางกิจวัตร สร้างของที่ระลึก ทำบัตรแมว ประเมินปริมาณอาหาร หรือแก้ไขภาพ ทุกเครื่องมือใช้ได้ในเบราว์เซอร์โดยไม่ต้องสมัครบัญชี";
  const routineName = isEnglish ? "Kids Visual Routine Chart" : "ตารางกิจวัตรเด็กแบบภาพ";
  const routineText = isEnglish ? "Build, reorder, print or download a child-friendly routine chart. It stays in this browser." : "จัดลำดับกิจกรรม พิมพ์ หรือดาวน์โหลดตารางกิจวัตรที่เด็กดูเข้าใจง่าย ข้อมูลอยู่ในเบราว์เซอร์นี้";
  const polaroidName = isEnglish ? "Polaroid Photo Maker" : "เครื่องทำรูปโพลารอยด์";
  const polaroidText = isEnglish ? "Add your photo, adjust the frame and download a PNG. Your image stays on your device." : "เพิ่มรูป ปรับกรอบ แล้วดาวน์โหลด PNG โดยรูปของคุณยังอยู่บนอุปกรณ์";
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", "@id": `${current}#webpage`, url: current, name: title, description, inLanguage: language, isPartOf: { "@id": `${SITE}/#website` } },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Siamese Cat Creative Club", item: pageUrl(language, "") }, { "@type": "ListItem", position: 2, name: isEnglish ? "Tools" : "เครื่องมือ", item: current }] },
    ],
  }).replace(/</g, "\\u003c");
  return `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="description" content="${description}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${current}"><link rel="alternate" hreflang="th" href="${thai}"><link rel="alternate" hreflang="en" href="${english}"><link rel="alternate" hreflang="x-default" href="${thai}"><meta property="og:type" content="website"><meta property="og:site_name" content="Siamese Cat Creative Club"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${current}"><meta property="og:image" content="${SITE}/tools/kids-routine-chart/assets/og-kids-routine-chart.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}"><meta name="twitter:image" content="${SITE}/tools/kids-routine-chart/assets/og-kids-routine-chart.png"><meta name="theme-color" content="#347a5a"><link rel="icon" type="image/png" sizes="32x32" href="/tools/kids-routine-chart/assets/icon-32.png"><link rel="stylesheet" href="/tools/kids-routine-chart/assets/styles.css"><script type="application/ld+json">${schema}</script>${analytics()}</head><body><a class="skip-link" href="#tool-list">${isEnglish ? "Skip to tools" : "ข้ามไปยังเครื่องมือ"}</a><header class="site-header"><div class="wrap header-row"><a class="brand" href="${home}"><img src="/tools/kids-routine-chart/assets/creative-club-logo.webp" width="96" height="96" alt="Siamese Cat Creative Club"><span class="brand-copy"><strong>Siamese Cat Creative Club</strong><span>${isEnglish ? "Flexible • Creative • Caring" : "ยืดหยุ่น • สร้างสรรค์ • ใส่ใจ"}</span></span></a><button class="nav-toggle" type="button" aria-expanded="false" aria-controls="main-nav">☰</button><nav class="main-nav" id="main-nav" aria-label="${isEnglish ? "Main navigation" : "เมนูหลัก"}"><a href="${creative}">${isEnglish ? "Creative Club" : "ครีเอทีฟคลับ"}</a><a href="${playgroup}">${isEnglish ? "Kids Playroom" : "Kids Playroom"}</a><a href="${routeFor(language, "/tools")}" aria-current="page">${isEnglish ? "Free tools" : "เครื่องมือฟรี"}</a><a href="${contact}">${isEnglish ? "Contact" : "ติดต่อเรา"}</a><a class="lang-pill" href="${isEnglish ? thai : english}" hreflang="${isEnglish ? "th" : "en"}">${isEnglish ? "ไทย" : "English"}</a></nav></div></header><main><section class="hero"><div class="wrap"><span class="eyebrow">${isEnglish ? "Free family tools" : "เครื่องมือฟรีสำหรับครอบครัว"}</span><h1>${heading}</h1><p>${text}</p></div></section><section class="network" id="tool-list"><div class="wrap"><span class="eyebrow">${isEnglish ? "Available now" : "เริ่มใช้ได้แล้ว"}</span><h2>${isEnglish ? "Choose the tool that fits the moment" : "เลือกเครื่องมือที่ตรงกับช่วงเวลาของคุณ"}</h2><div class="network-grid"><a class="network-card" href="${routineUrl}"><img src="/tools/kids-routine-chart/assets/creative-club-logo.webp" width="96" height="96" alt="Siamese Cat Creative Club"><h3>${routineName}</h3><p>${routineText}</p><strong>${isEnglish ? "Open routine chart →" : "เปิดตารางกิจวัตร →"}</strong></a><a class="network-card" href="${polaroidUrl}"><span class="eyebrow">${isEnglish ? "Private browser tool" : "เครื่องมือส่วนตัวในเบราว์เซอร์"}</span><h3>${polaroidName}</h3><p>${polaroidText}</p><strong>${isEnglish ? "Make a Polaroid →" : "สร้างรูปโพลารอยด์ →"}</strong></a><a class="network-card" href="${cafe}"><img src="/tools/kids-routine-chart/assets/siamese-cat-cafe-logo.png" width="320" height="320" alt="Siamese Cat Café"><h3>Siamese Cat Café</h3><p>${isEnglish ? "Visit the Café after exploring the Club’s family resources." : "เยี่ยมชม Siamese Cat Café หลังจากดูแหล่งข้อมูลสำหรับครอบครัวของคลับ"}</p></a></div></div></section></main><footer class="site-footer"><div class="wrap"><div class="footer-grid"><div class="footer-brand"><img src="/tools/kids-routine-chart/assets/creative-club-logo.webp" width="96" height="96" alt="Siamese Cat Creative Club"><div><strong>Siamese Cat Creative Club</strong><p>${isEnglish ? "Parent-accompanied Kids Playroom and separate after-school support near Mega Bangna." : "Kids Playroom ที่ผู้ปกครองอยู่ด้วยและบริการดูแลหลังเลิกเรียนแยกใกล้ Mega Bangna"}</p><a class="btn btn-secondary btn-small" href="${cafe}">${isEnglish ? "Visit Siamese Cat Café →" : "เยี่ยมชม Siamese Cat Café →"}</a></div></div><div class="footer-col"><h3>${isEnglish ? "Programs" : "โปรแกรม"}</h3><a href="${creative}">${isEnglish ? "Creative Club" : "ครีเอทีฟคลับ"}</a><a href="${playgroup}">${isEnglish ? "Kids Playroom" : "Kids Playroom"}</a></div><div class="footer-col"><h3>${isEnglish ? "Resources" : "แหล่งข้อมูล"}</h3><a href="${routineUrl}">${routineName}</a><a href="${polaroidUrl}">${polaroidName}</a><a href="${contact}">${isEnglish ? "Contact" : "ติดต่อเรา"}</a></div></div><div class="footer-bottom"><span>© 2026 Siamese Cat Creative Club</span><span><a href="${isEnglish ? "/EN/privacy" : "/privacy"}">${isEnglish ? "Privacy & PDPA" : "ความเป็นส่วนตัวและ PDPA"}</a> · <a href="${isEnglish ? "/EN/terms" : "/terms"}">${isEnglish ? "Service terms" : "เงื่อนไขบริการ"}</a></span></div></div></footer><script>const toggle=document.querySelector('.nav-toggle'),nav=document.querySelector('.main-nav');toggle?.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open))})</script></body></html>`;
}

function expandedHub(language) {
  const isEnglish = language === "en";
  const cafe = isEnglish ? "https://siamesecat.cafe/" : "https://siamesecat.cafe/th/";
  const passportUrl = routeFor(language, CAT_PASSPORT_PATH);
  const calculatorUrl = routeFor(language, CAT_FOOD_CALCULATOR_PATH);
  const reshapeUrl = routeFor(language, SKINNY_FILTER_PATH);
  const cards = `<a class="network-card" href="${passportUrl}"><span class="eyebrow">${isEnglish ? "Café keepsake" : "ของที่ระลึกจากคาเฟ่"}</span><h3>${isEnglish ? "Cat Passport Maker" : "เครื่องทำพาสปอร์ตแมว"}</h3><p>${isEnglish ? "Make a playful cat passport or ID, then download a shareable PNG in your browser." : "สร้างพาสปอร์ตหรือบัตรประจำตัวแมวแบบสนุก ๆ แล้วดาวน์โหลด PNG ได้ในเบราว์เซอร์"}</p><strong>${isEnglish ? "Make a cat passport →" : "สร้างพาสปอร์ตแมว →"}</strong></a><a class="network-card" href="${calculatorUrl}"><span class="eyebrow">${isEnglish ? "Cat care estimate" : "ประเมินการดูแลแมว"}</span><h3>${isEnglish ? "Cat Food & Calorie Estimate" : "เครื่องประเมินอาหารและแคลอรีแมว"}</h3><p>${isEnglish ? "Turn food-label energy into a transparent starting estimate; not a substitute for veterinary advice." : "แปลงพลังงานจากฉลากอาหารเป็นค่าประเมินเริ่มต้นอย่างโปร่งใส ไม่ใช่คำแนะนำแทนสัตวแพทย์"}</p><strong>${isEnglish ? "Open calculator →" : "เปิดเครื่องคำนวณ →"}</strong></a><a class="network-card" href="${reshapeUrl}"><span class="eyebrow">${isEnglish ? "Private adult editor" : "ตัวแก้ไขส่วนตัวสำหรับผู้ใหญ่"}</span><h3>${isEnglish ? "Photo Reshape Tool" : "เครื่องมือปรับรูปทรงในภาพ"}</h3><p>${isEnglish ? "A private, on-device portrait editor with manual controls and optional pose detection." : "ตัวแก้ไขภาพบุคคลบนอุปกรณ์ พร้อมการควบคุมแบบแมนนวลและการตรวจจับท่าทางแบบเลือกใช้"}</p><strong>${isEnglish ? "Open photo editor →" : "เปิดเครื่องมือแก้ไขภาพ →"}</strong></a>`;
  return hub(language)
    .replace(`<a class="network-card" href="${cafe}">`, `${cards}<a class="network-card" href="${cafe}">`);
}

function copyAssets(source, target) {
  mkdirSync(target, { recursive: true });
  cpSync(join(source, "assets"), target, { recursive: true });
}

function copyCatPassportAssets() {
  const target = join(OUTPUT, "tools", "cat-passport", "assets");
  copyAssets(CAT_PASSPORT_SOURCE, target);
  const script = join(target, "app.js");
  writeFileSync(script, readFileSync(script, "utf8").replaceAll("Siamese Cat Creative Tools", "Siamese Cat Creative Club"));
}

mkdirSync(join(OUTPUT, "main-site", "tools"), { recursive: true });
mkdirSync(join(OUTPUT, "main-site", "EN", "tools"), { recursive: true });
copyAssets(ROUTINE_SOURCE, join(OUTPUT, "tools", "kids-routine-chart", "assets"));
copyAssets(POLAROID_SOURCE, join(OUTPUT, "tools", "polaroid-generator", "assets"));
copyCatPassportAssets();
copyAssets(CAT_FOOD_CALCULATOR_SOURCE, join(OUTPUT, "tools", "cat-food-calculator", "assets"));
copyAssets(SKINNY_FILTER_SOURCE, join(OUTPUT, "tools", "skinny-filter", "assets"));
mkdirSync(join(OUTPUT, "tools", "shared"), { recursive: true });
writeFileSync(join(OUTPUT, "tools", "shared", "navigation.css"), TOOL_NAVIGATION_CSS);

writeFileSync(join(OUTPUT, "main-site", "tools.html"), expandedHub("th"));
writeFileSync(join(OUTPUT, "main-site", "EN", "tools.html"), expandedHub("en"));
writeFileSync(join(OUTPUT, "main-site", "tools", "kids-routine-chart.html"), transformRoutine("th"));
writeFileSync(join(OUTPUT, "main-site", "EN", "tools", "kids-routine-chart.html"), transformRoutine("en"));
writeFileSync(join(OUTPUT, "main-site", "tools", "polaroid-generator.html"), transformPolaroid("th"));
writeFileSync(join(OUTPUT, "main-site", "EN", "tools", "polaroid-generator.html"), transformPolaroid("en"));
writeFileSync(join(OUTPUT, "main-site", "tools", "cat-passport.html"), transformCatPassport("th"));
writeFileSync(join(OUTPUT, "main-site", "EN", "tools", "cat-passport.html"), transformCatPassport("en"));
writeFileSync(join(OUTPUT, "main-site", "tools", "cat-food-calculator.html"), transformCatFoodCalculator("th"));
writeFileSync(join(OUTPUT, "main-site", "EN", "tools", "cat-food-calculator.html"), transformCatFoodCalculator("en"));
writeFileSync(join(OUTPUT, "main-site", "tools", "skinny-filter.html"), transformSkinnyFilter("th"));
writeFileSync(join(OUTPUT, "main-site", "EN", "tools", "skinny-filter.html"), transformSkinnyFilter("en"));

console.log("family-tools → wrote bilingual tools hub and five browser-based tools");

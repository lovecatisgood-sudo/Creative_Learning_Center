import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SITE = "https://creative.siamesecat.cafe";
const ROOT = process.cwd();
const OUTPUT = join(ROOT, "public");
const ANALYTICS_ID = "G-MK27QPPWH5";

const ROUTINE_PATH = "/tools/kids-routine-chart";
const POLAROID_PATH = "/tools/polaroid-generator";
const ROUTINE_SOURCE = join(ROOT, "tools-source", "kids-routine-chart");
const POLAROID_SOURCE = join(ROOT, "tools-source", "polaroid-generator");

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

function normalizeToolUrls(html) {
  for (const path of [ROUTINE_PATH, POLAROID_PATH]) {
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
  return `<section class="network"><span class="eyebrow">${isEnglish ? "Siamese Cat family" : "เครือ Siamese Cat"}</span><h2>${isEnglish ? "A practical tool, connected to a real place" : "เครื่องมือออนไลน์ที่เชื่อมกับพื้นที่จริง"}</h2><div class="network-grid"><a class="network-card" href="${club}"><img src="/tools/kids-routine-chart/assets/creative-club-logo.webp" width="96" height="96" alt="Siamese Cat Creative Club"><h3>Siamese Cat Creative Club</h3><p>${isEnglish ? "Explore small-group playgroup and after-school support near Mega Bangna." : "ดูเพลย์กรุ๊ปและการดูแลหลังเลิกเรียนแบบกลุ่มเล็กใกล้ Mega Bangna"}</p></a><a class="network-card" href="${cafe}"><img src="/tools/kids-routine-chart/assets/siamese-cat-cafe-logo.png" width="320" height="320" alt="Siamese Cat Café"><h3>Siamese Cat Café</h3><p>${isEnglish ? "Visit Siamese Cat Café." : "เยี่ยมชม Siamese Cat Café"}</p></a></div></section>`;
}

function polaroidFamilyLinks(language) {
  const isEnglish = language === "en";
  const club = isEnglish ? "/EN/creative" : "/creative";
  const cafe = isEnglish ? "https://siamesecat.cafe/" : "https://siamesecat.cafe/th/";
  return `<section class="section"><div class="wrap"><span class="section-kicker">${isEnglish ? "Make a real memory" : "สร้างความทรงจำจริง"}</span><h2>${isEnglish ? "A simple frame for the photos you already love" : "กรอบเล็ก ๆ สำหรับรูปที่คุณชอบอยู่แล้ว"}</h2><div class="brand-grid"><a class="brand-card" href="${club}"><h3>Siamese Cat Creative Club</h3><p>${isEnglish ? "Explore small-group play, playgroup and after-school support for families around Bangna." : "ดูรายละเอียดเพลย์กรุ๊ปและการดูแลหลังเลิกเรียนแบบกลุ่มเล็กสำหรับครอบครัวแถวบางนา"}</p><span class="linkline">${isEnglish ? "Explore the Creative Club →" : "ดูครีเอทีฟคลับ →"}</span></a><a class="brand-card" href="${cafe}" rel="noopener"><h3>Siamese Cat Café</h3><p>${isEnglish ? "Turn a photo you took at the café into a keepsake frame directly in your browser." : "นำรูปที่คุณถ่ายจากคาเฟ่มาใส่กรอบเก็บความทรงจำได้ทันทีในเบราว์เซอร์"}</p><span class="linkline">${isEnglish ? "Visit the café →" : "เยี่ยมชมคาเฟ่ →"}</span></a></div></div></section>`;
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
    .replace(isEnglish ? "Flexible small-group programs for children plus lightweight creative web tools for families, creators and builders." : "สองโปรแกรมกลุ่มเล็กแบบยืดหยุ่นสำหรับเด็ก และชุดเครื่องมือสร้างสรรค์บนเว็บสำหรับครอบครัว ครีเอเตอร์ และ builders", isEnglish ? "Small-group play, after-school support and a small collection of practical family tools." : "เพลย์กรุ๊ป การดูแลหลังเลิกเรียนแบบกลุ่มเล็ก และเครื่องมือออนไลน์ที่ใช้ได้จริงสำหรับครอบครัว")
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
  const description = isEnglish ? "Practical browser tools for families from Siamese Cat Creative Club: a printable kids routine chart and a private Polaroid photo maker." : "เครื่องมือออนไลน์ที่ใช้ได้จริงสำหรับครอบครัวจาก Siamese Cat Creative Club: ตารางกิจวัตรเด็กแบบพิมพ์ได้และเครื่องทำรูปโพลารอยด์ที่ประมวลผลบนอุปกรณ์";
  const heading = isEnglish ? "Practical browser tools for family life" : "เครื่องมือออนไลน์เล็ก ๆ สำหรับชีวิตครอบครัว";
  const text = isEnglish ? "Use a visual routine chart or turn a photo into a keepsake Polaroid. Both tools work in your browser without an account." : "จัดตารางกิจวัตรแบบภาพ หรือเปลี่ยนรูปให้เป็นโพลารอยด์เก็บความทรงจำ ทั้งสองเครื่องมือใช้ได้ในเบราว์เซอร์โดยไม่ต้องสมัครบัญชี";
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
  return `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="description" content="${description}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${current}"><link rel="alternate" hreflang="th" href="${thai}"><link rel="alternate" hreflang="en" href="${english}"><link rel="alternate" hreflang="x-default" href="${thai}"><meta property="og:type" content="website"><meta property="og:site_name" content="Siamese Cat Creative Club"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${current}"><meta property="og:image" content="${SITE}/tools/kids-routine-chart/assets/og-kids-routine-chart.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}"><meta name="twitter:image" content="${SITE}/tools/kids-routine-chart/assets/og-kids-routine-chart.png"><meta name="theme-color" content="#347a5a"><link rel="icon" type="image/png" sizes="32x32" href="/tools/kids-routine-chart/assets/icon-32.png"><link rel="stylesheet" href="/tools/kids-routine-chart/assets/styles.css"><script type="application/ld+json">${schema}</script>${analytics()}</head><body><a class="skip-link" href="#tool-list">${isEnglish ? "Skip to tools" : "ข้ามไปยังเครื่องมือ"}</a><header class="site-header"><div class="wrap header-row"><a class="brand" href="${home}"><img src="/tools/kids-routine-chart/assets/creative-club-logo.webp" width="96" height="96" alt="Siamese Cat Creative Club"><span class="brand-copy"><strong>Siamese Cat Creative Club</strong><span>${isEnglish ? "Flexible • Creative • Caring" : "ยืดหยุ่น • สร้างสรรค์ • ใส่ใจ"}</span></span></a><button class="nav-toggle" type="button" aria-expanded="false" aria-controls="main-nav">☰</button><nav class="main-nav" id="main-nav" aria-label="${isEnglish ? "Main navigation" : "เมนูหลัก"}"><a href="${creative}">${isEnglish ? "Creative Club" : "ครีเอทีฟคลับ"}</a><a href="${playgroup}">${isEnglish ? "Playgroup" : "เพลย์กรุ๊ป"}</a><a href="${routeFor(language, "/tools")}" aria-current="page">${isEnglish ? "Free tools" : "เครื่องมือฟรี"}</a><a href="${contact}">${isEnglish ? "Contact" : "ติดต่อเรา"}</a><a class="lang-pill" href="${isEnglish ? thai : english}" hreflang="${isEnglish ? "th" : "en"}">${isEnglish ? "ไทย" : "English"}</a></nav></div></header><main><section class="hero"><div class="wrap"><span class="eyebrow">${isEnglish ? "Free family tools" : "เครื่องมือฟรีสำหรับครอบครัว"}</span><h1>${heading}</h1><p>${text}</p></div></section><section class="network" id="tool-list"><div class="wrap"><span class="eyebrow">${isEnglish ? "Available now" : "เริ่มใช้ได้แล้ว"}</span><h2>${isEnglish ? "Choose the tool that fits the moment" : "เลือกเครื่องมือที่ตรงกับช่วงเวลาของคุณ"}</h2><div class="network-grid"><a class="network-card" href="${routineUrl}"><img src="/tools/kids-routine-chart/assets/creative-club-logo.webp" width="96" height="96" alt="Siamese Cat Creative Club"><h3>${routineName}</h3><p>${routineText}</p><strong>${isEnglish ? "Open routine chart →" : "เปิดตารางกิจวัตร →"}</strong></a><a class="network-card" href="${polaroidUrl}"><span class="eyebrow">${isEnglish ? "Private browser tool" : "เครื่องมือส่วนตัวในเบราว์เซอร์"}</span><h3>${polaroidName}</h3><p>${polaroidText}</p><strong>${isEnglish ? "Make a Polaroid →" : "สร้างรูปโพลารอยด์ →"}</strong></a><a class="network-card" href="${cafe}"><img src="/tools/kids-routine-chart/assets/siamese-cat-cafe-logo.png" width="320" height="320" alt="Siamese Cat Café"><h3>Siamese Cat Café</h3><p>${isEnglish ? "Visit the Café after exploring the Club’s family resources." : "เยี่ยมชม Siamese Cat Café หลังจากดูแหล่งข้อมูลสำหรับครอบครัวของคลับ"}</p></a></div></div></section></main><footer class="site-footer"><div class="wrap"><div class="footer-grid"><div class="footer-brand"><img src="/tools/kids-routine-chart/assets/creative-club-logo.webp" width="96" height="96" alt="Siamese Cat Creative Club"><div><strong>Siamese Cat Creative Club</strong><p>${isEnglish ? "Small-group playgroup and after-school support near Mega Bangna." : "เพลย์กรุ๊ปและดูแลหลังเลิกเรียนแบบกลุ่มเล็กใกล้ Mega Bangna"}</p><a class="btn btn-secondary btn-small" href="${cafe}">${isEnglish ? "Visit Siamese Cat Café →" : "เยี่ยมชม Siamese Cat Café →"}</a></div></div><div class="footer-col"><h3>${isEnglish ? "Programs" : "โปรแกรม"}</h3><a href="${creative}">${isEnglish ? "Creative Club" : "ครีเอทีฟคลับ"}</a><a href="${playgroup}">${isEnglish ? "Playgroup" : "เพลย์กรุ๊ป"}</a></div><div class="footer-col"><h3>${isEnglish ? "Resources" : "แหล่งข้อมูล"}</h3><a href="${routineUrl}">${routineName}</a><a href="${polaroidUrl}">${polaroidName}</a><a href="${contact}">${isEnglish ? "Contact" : "ติดต่อเรา"}</a></div></div><div class="footer-bottom"><span>© 2026 Siamese Cat Creative Club</span><span><a href="${isEnglish ? "/EN/privacy" : "/privacy"}">${isEnglish ? "Privacy & PDPA" : "ความเป็นส่วนตัวและ PDPA"}</a> · <a href="${isEnglish ? "/EN/terms" : "/terms"}">${isEnglish ? "Service terms" : "เงื่อนไขบริการ"}</a></span></div></div></footer><script>const toggle=document.querySelector('.nav-toggle'),nav=document.querySelector('.main-nav');toggle?.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open))})</script></body></html>`;
}

function copyAssets(source, target) {
  mkdirSync(target, { recursive: true });
  cpSync(join(source, "assets"), target, { recursive: true });
}

mkdirSync(join(OUTPUT, "main-site", "tools"), { recursive: true });
mkdirSync(join(OUTPUT, "main-site", "EN", "tools"), { recursive: true });
copyAssets(ROUTINE_SOURCE, join(OUTPUT, "tools", "kids-routine-chart", "assets"));
copyAssets(POLAROID_SOURCE, join(OUTPUT, "tools", "polaroid-generator", "assets"));

writeFileSync(join(OUTPUT, "main-site", "tools.html"), hub("th"));
writeFileSync(join(OUTPUT, "main-site", "EN", "tools.html"), hub("en"));
writeFileSync(join(OUTPUT, "main-site", "tools", "kids-routine-chart.html"), transformRoutine("th"));
writeFileSync(join(OUTPUT, "main-site", "EN", "tools", "kids-routine-chart.html"), transformRoutine("en"));
writeFileSync(join(OUTPUT, "main-site", "tools", "polaroid-generator.html"), transformPolaroid("th"));
writeFileSync(join(OUTPUT, "main-site", "EN", "tools", "polaroid-generator.html"), transformPolaroid("en"));

console.log("family-tools → wrote bilingual tools hub, kids routine chart, and Polaroid generator");

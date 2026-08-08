import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SITE = "https://creative.siamesecat.cafe";
const ROOT = process.cwd();
const SOURCE = join(ROOT, "tools-source", "kids-routine-chart");
const ASSETS = join(SOURCE, "assets");
const OUTPUT = join(ROOT, "public");
const TOOL_PATH = "/tools/kids-routine-chart";
const ANALYTICS_ID = "G-MK27QPPWH5";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pageUrl(language, path) {
  return `${SITE}${language === "en" ? "/EN" : ""}${path}`;
}

function analytics() {
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_ID}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ANALYTICS_ID}');</script>`;
}

function familyLinks(language) {
  const isEnglish = language === "en";
  const club = isEnglish ? "/EN/creative" : "/creative";
  const cafe = isEnglish ? "https://siamesecat.cafe/" : "https://siamesecat.cafe/th/";
  return `<section class="network"><span class="eyebrow">${isEnglish ? "Siamese Cat family" : "เครือ Siamese Cat"}</span><h2>${isEnglish ? "A practical tool, connected to a real place" : "เครื่องมือออนไลน์ที่เชื่อมกับพื้นที่จริง"}</h2><div class="network-grid"><a class="network-card" href="${club}"><img src="/tools/kids-routine-chart/assets/creative-club-logo.webp" alt="Siamese Cat Creative Club"><h3>Siamese Cat Creative Club</h3><p>${isEnglish ? "Explore small-group playgroup and after-school support near Mega Bangna." : "ดูเพลย์กรุ๊ปและการดูแลหลังเลิกเรียนแบบกลุ่มเล็กใกล้ Mega Bangna"}</p></a><a class="network-card" href="${cafe}"><img src="/tools/kids-routine-chart/assets/siamese-cat-cafe-logo.png" alt="Siamese Cat Café"><h3>Siamese Cat Café</h3><p>${isEnglish ? "Visit Siamese Cat Café." : "เยี่ยมชม Siamese Cat Café"}</p></a></div></section>`;
}

function routeFor(language) {
  return language === "en" ? `/EN${TOOL_PATH}` : TOOL_PATH;
}

function transformTool(language) {
  const languagePath = language === "en" ? "en" : "th";
  const thaiUrl = pageUrl("th", TOOL_PATH);
  const englishUrl = pageUrl("en", TOOL_PATH);
  const thisUrl = language === "en" ? englishUrl : thaiUrl;
  const otherUrl = language === "en" ? thaiUrl : englishUrl;
  let html = readFileSync(join(SOURCE, "templates", `${languagePath}.html`), "utf8");

  for (const url of [thaiUrl, englishUrl]) {
    html = html.replace(new RegExp(`${escapeRegExp(url)}/(?=[\"'<,])`, "g"), url);
  }
  for (const [preset, label] of Object.entries({
    morning: language === "en" ? "Morning" : "ตอนเช้า",
    "after-school": language === "en" ? "After School" : "หลังเลิกเรียน",
    bedtime: language === "en" ? "Bedtime" : "ก่อนนอน",
    weekend: language === "en" ? "Weekend" : "วันหยุด",
  })) {
    const route = `${routeFor(language)}?preset=${preset}`;
    html = html.replaceAll(`${routeFor(language)}/${preset}/`, route);
    html = html.replaceAll(`>${label}</a>`, `>${label}</a>`);
  }
  html = html
    .replaceAll('href="/EN/"', 'href="/EN"')
    .replaceAll('href="/tools/kids-routine-chart/"', 'href="/tools/kids-routine-chart"')
    .replaceAll('href="/EN/tools/kids-routine-chart/"', 'href="/EN/tools/kids-routine-chart"')
    .replace('sameAs":["https://siamesecat.cafe/th/","https://www.djai.academy/siamese_cat/dev/"]', 'sameAs":["https://siamesecat.cafe/th/"]')
    .replace('sameAs":["https://siamesecat.cafe/","https://www.djai.academy/siamese_cat/dev/en/"]', 'sameAs":["https://siamesecat.cafe/"]')
    .replace(/<section class="network">[\s\S]*?<\/section>/, familyLinks(language))
    .replace(/ · <a href="https:\/\/www\.djai\.academy\/siamese_cat\/dev(?:\/en)?\/">Siamese Cat Dev<\/a>/, "")
    .replaceAll('src="/tools/kids-routine-chart/assets/creative-club-logo.webp" alt=', 'src="/tools/kids-routine-chart/assets/creative-club-logo.webp" width="96" height="96" alt=')
    .replaceAll('src="/tools/kids-routine-chart/assets/siamese-cat-cafe-logo.png" alt=', 'src="/tools/kids-routine-chart/assets/siamese-cat-cafe-logo.png" width="320" height="320" alt=')
    .replace("</head>", `${analytics()}\n</head>`);

  if (!html.includes(`<link rel="canonical" href="${thisUrl}">`)) {
    throw new Error(`Wrong canonical produced for ${language} routine tool`);
  }
  if (!html.includes(`hreflang=\"${language === "en" ? "th" : "en"}\" href=\"${otherUrl}\"`)) {
    throw new Error(`Missing reciprocal alternate for ${language} routine tool`);
  }
  return html;
}

function hub(language) {
  const isEnglish = language === "en";
  const base = "/tools";
  const current = pageUrl(language, base);
  const thai = pageUrl("th", "/tools");
  const english = pageUrl("en", "/tools");
  const langSwitch = isEnglish ? thai : english;
  const home = isEnglish ? "/EN" : "/";
  const creative = isEnglish ? "/EN/creative" : "/creative";
  const playgroup = isEnglish ? "/EN/playgroup" : "/playgroup";
  const contact = isEnglish ? "/EN/contact" : "/contact";
  const toolUrl = routeFor(language);
  const cafe = isEnglish ? "https://siamesecat.cafe/" : "https://siamesecat.cafe/th/";
  const title = isEnglish ? "Free Family Tools | Siamese Cat Creative Club" : "เครื่องมือฟรีสำหรับครอบครัว | Siamese Cat Creative Club";
  const description = isEnglish
    ? "A focused set of practical browser tools for families from Siamese Cat Creative Club, starting with a printable kids routine chart."
    : "เครื่องมือออนไลน์ที่ใช้ได้จริงสำหรับครอบครัวจาก Siamese Cat Creative Club เริ่มด้วยตารางกิจวัตรเด็กแบบพิมพ์ได้";
  const heading = isEnglish ? "A practical tool for family routines" : "เครื่องมือเล็ก ๆ สำหรับกิจวัตรครอบครัว";
  const text = isEnglish
    ? "One useful browser tool at a time. Start with a visual routine chart for mornings, after school, bedtime and weekends—then print or download it without creating an account."
    : "เริ่มจากเครื่องมือที่ใช้ได้จริงทีละอย่าง ลองทำตารางกิจวัตรแบบภาพสำหรับตอนเช้า หลังเลิกเรียน ก่อนนอน และวันหยุด แล้วพิมพ์หรือดาวน์โหลดได้โดยไม่ต้องสมัครบัญชี";
  const toolName = isEnglish ? "Kids Visual Routine Chart" : "ตารางกิจวัตรเด็กแบบภาพ";
  const toolText = isEnglish
    ? "Build, reorder, print or download a child-friendly routine chart. The routine stays in this browser."
    : "จัดลำดับกิจกรรม พิมพ์ หรือดาวน์โหลดตารางกิจวัตรที่เด็กดูเข้าใจง่าย ข้อมูลอยู่ในเบราว์เซอร์นี้";
  const toolCta = isEnglish ? "Open routine chart →" : "เปิดตารางกิจวัตร →";
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", "@id": `${current}#webpage`, url: current, name: title, description, inLanguage: language, isPartOf: { "@id": `${SITE}/#website` } },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Siamese Cat Creative Club", item: pageUrl(language, "") }, { "@type": "ListItem", position: 2, name: isEnglish ? "Tools" : "เครื่องมือ", item: current }] },
    ],
  }).replace(/</g, "\\u003c");
  return `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="description" content="${description}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${current}"><link rel="alternate" hreflang="th" href="${thai}"><link rel="alternate" hreflang="en" href="${english}"><link rel="alternate" hreflang="x-default" href="${thai}"><meta property="og:type" content="website"><meta property="og:site_name" content="Siamese Cat Creative Club"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${current}"><meta property="og:image" content="${SITE}/tools/kids-routine-chart/assets/og-kids-routine-chart.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}"><meta name="twitter:image" content="${SITE}/tools/kids-routine-chart/assets/og-kids-routine-chart.png"><meta name="theme-color" content="#347a5a"><link rel="icon" type="image/png" sizes="32x32" href="/tools/kids-routine-chart/assets/icon-32.png"><link rel="stylesheet" href="/tools/kids-routine-chart/assets/styles.css"><script type="application/ld+json">${schema}</script>${analytics()}</head><body><a class="skip-link" href="#tool-list">${isEnglish ? "Skip to tools" : "ข้ามไปยังเครื่องมือ"}</a><header class="site-header"><div class="wrap header-row"><a class="brand" href="${home}"><img src="/tools/kids-routine-chart/assets/creative-club-logo.webp" width="96" height="96" alt="Siamese Cat Creative Club"><span class="brand-copy"><strong>Siamese Cat Creative Club</strong><span>${isEnglish ? "Flexible • Creative • Caring" : "ยืดหยุ่น • สร้างสรรค์ • ใส่ใจ"}</span></span></a><button class="nav-toggle" type="button" aria-expanded="false" aria-controls="main-nav">☰</button><nav class="main-nav" id="main-nav" aria-label="${isEnglish ? "Main navigation" : "เมนูหลัก"}"><a href="${creative}">${isEnglish ? "Creative Club" : "ครีเอทีฟคลับ"}</a><a href="${playgroup}">${isEnglish ? "Playgroup" : "เพลย์กรุ๊ป"}</a><a href="${toolUrl}" aria-current="page">${isEnglish ? "Free tools" : "เครื่องมือฟรี"}</a><a href="${contact}">${isEnglish ? "Contact" : "ติดต่อเรา"}</a><a class="lang-pill" href="${langSwitch}" hreflang="${isEnglish ? "th" : "en"}">${isEnglish ? "ไทย" : "English"}</a></nav></div></header><main><section class="hero"><div class="wrap"><span class="eyebrow">${isEnglish ? "Free family tools" : "เครื่องมือฟรีสำหรับครอบครัว"}</span><h1>${heading}</h1><p>${text}</p></div></section><section class="network" id="tool-list"><div class="wrap"><span class="eyebrow">${isEnglish ? "Available now" : "เริ่มใช้ได้แล้ว"}</span><h2>${isEnglish ? "Start with the routine that fits your day" : "เริ่มจากกิจวัตรที่ตรงกับวันของคุณ"}</h2><div class="network-grid"><a class="network-card" href="${toolUrl}"><img src="/tools/kids-routine-chart/assets/creative-club-logo.webp" width="96" height="96" alt="Siamese Cat Creative Club"><h3>${toolName}</h3><p>${toolText}</p><strong>${toolCta}</strong></a><a class="network-card" href="${cafe}"><img src="/tools/kids-routine-chart/assets/siamese-cat-cafe-logo.png" width="320" height="320" alt="Siamese Cat Café"><h3>Siamese Cat Café</h3><p>${isEnglish ? "Visit the Café after exploring the Club’s family resources." : "เยี่ยมชม Siamese Cat Café หลังจากดูแหล่งข้อมูลสำหรับครอบครัวของคลับ"}</p></a></div></div></section></main><footer class="site-footer"><div class="wrap"><div class="footer-grid"><div class="footer-brand"><img src="/tools/kids-routine-chart/assets/creative-club-logo.webp" width="96" height="96" alt="Siamese Cat Creative Club"><div><strong>Siamese Cat Creative Club</strong><p>${isEnglish ? "Small-group playgroup and after-school support near Mega Bangna." : "เพลย์กรุ๊ปและดูแลหลังเลิกเรียนแบบกลุ่มเล็กใกล้ Mega Bangna"}</p><a class="btn btn-secondary btn-small" href="${cafe}">${isEnglish ? "Visit Siamese Cat Café →" : "เยี่ยมชม Siamese Cat Café →"}</a></div></div><div class="footer-col"><h3>${isEnglish ? "Programs" : "โปรแกรม"}</h3><a href="${creative}">${isEnglish ? "Creative Club" : "ครีเอทีฟคลับ"}</a><a href="${playgroup}">${isEnglish ? "Playgroup" : "เพลย์กรุ๊ป"}</a></div><div class="footer-col"><h3>${isEnglish ? "Resources" : "แหล่งข้อมูล"}</h3><a href="${toolUrl}">${toolName}</a><a href="${contact}">${isEnglish ? "Contact" : "ติดต่อเรา"}</a></div></div><div class="footer-bottom"><span>© 2026 Siamese Cat Creative Club</span><span><a href="${isEnglish ? "/EN/privacy" : "/privacy"}">${isEnglish ? "Privacy & PDPA" : "ความเป็นส่วนตัวและ PDPA"}</a> · <a href="${isEnglish ? "/EN/terms" : "/terms"}">${isEnglish ? "Service terms" : "เงื่อนไขบริการ"}</a></span></div></div></footer><script>const toggle=document.querySelector('.nav-toggle'),nav=document.querySelector('.main-nav');toggle?.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open))})</script></body></html>`;
}

mkdirSync(join(OUTPUT, "main-site", "tools"), { recursive: true });
mkdirSync(join(OUTPUT, "main-site", "EN", "tools"), { recursive: true });
mkdirSync(join(OUTPUT, "tools", "kids-routine-chart"), { recursive: true });
cpSync(ASSETS, join(OUTPUT, "tools", "kids-routine-chart", "assets"), { recursive: true });
writeFileSync(join(OUTPUT, "main-site", "tools.html"), hub("th"));
writeFileSync(join(OUTPUT, "main-site", "EN", "tools.html"), hub("en"));
writeFileSync(join(OUTPUT, "main-site", "tools", "kids-routine-chart.html"), transformTool("th"));
writeFileSync(join(OUTPUT, "main-site", "EN", "tools", "kids-routine-chart.html"), transformTool("en"));

console.log("family-tools → wrote bilingual tools hub and kids routine chart");

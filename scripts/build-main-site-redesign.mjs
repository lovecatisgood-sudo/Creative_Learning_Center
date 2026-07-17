import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "public/main-site");
const SHELL_VERSION = "20260717-seo-performance-v5";
const ASSET_VERSION = SHELL_VERSION;
const MAP_URL = "https://maps.app.goo.gl/XpYHkxenRu6gLvnFA";
const CAFE_URL = "https://siamesecat.cafe/";
const CONTACT_URL = "/contact";
const PUBLIC_ROUTES = new Set([
  "/",
  "/inside",
  "/playgroup",
  "/creative",
  "/little-explorer-program",
  "/membership",
  "/dinner",
  "/contact",
  "/faq",
  "/first-visit",
  "/thank-you",
  "/signup",
  "/signup/success",
  "/terms",
  "/privacy",
]);

let currentLanguage = "th";

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function text(en, th = en) {
  const selected = currentLanguage === "th"
    ? th.replaceAll("Meal Care Add-On", "บริการเสริมมื้ออาหาร").replaceAll("Meal Care", "การดูแลมื้ออาหาร")
    : en;
  return esc(selected);
}

function localizedRoute(href, language = currentLanguage) {
  if (!href.startsWith("/")) return href;
  const url = new URL(href, "https://creative.siamesecat.cafe");
  if (!PUBLIC_ROUTES.has(url.pathname)) return href;
  const localizedPath = language === "en"
    ? url.pathname === "/" ? "/EN" : `/EN${url.pathname}`
    : url.pathname;
  return `${localizedPath}${url.search}${url.hash}`;
}

function localizeDocumentLinks(html, language) {
  return html
    .replace(/href="([^"]+)"/g, (match, href) => `href="${esc(localizedRoute(href, language))}"`)
    .replaceAll('href="language-switch', 'href="');
}

function attrs(attrs) {
  return Object.entries(attrs)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => ` ${key}="${esc(value)}"`)
    .join("");
}

const IMAGE_DATA = {
  "environment-cat-cafe-dinner.webp": { width: 447, height: 447, variants: [320] },
  "environment-creative-room.webp": { width: 900, height: 1200, variants: [480, 720] },
  "environment-entrance-pickup.webp": { width: 900, height: 1200, variants: [480, 720] },
  "environment-play-area.webp": { width: 900, height: 1200, variants: [480, 720] },
  "environment-shop-front.webp": { width: 900, height: 1200, variants: [480, 720] },
  "siamese-cat-cafe-logo.webp": { width: 447, height: 447, variants: [320] },
};

function assetUrl(file) {
  return `/main-site/assets/${file}?v=${ASSET_VERSION}`;
}

function imageTag({ file, alt, className, eager = false, sizes = "(max-width: 760px) calc(100vw - 24px), 520px" }) {
  const image = IMAGE_DATA[file];
  if (!image) throw new Error(`Missing image metadata for ${file}`);
  const srcset = [
    ...(image.variants ?? []).map((width) => `${assetUrl(file.replace(/\.webp$/, `-${width}.webp`))} ${width}w`),
    `${assetUrl(file)} ${image.width}w`,
  ].join(", ");
  return `<img class="${className}" src="${assetUrl(file)}" srcset="${srcset}" sizes="${sizes}" width="${image.width}" height="${image.height}" alt="${alt}" loading="${eager ? "eager" : "lazy"}" decoding="async"${eager ? ' fetchpriority="high"' : ""}>`;
}

function brandLogo({ lazy = false } = {}) {
  return `<img class="brand-logo-img" src="${assetUrl("logo-circle-96.webp")}" width="96" height="96" alt="${text("Siamese Cat Creative Club circle logo", "โลโก้ Siamese Cat Creative Club")}" loading="${lazy ? "lazy" : "eager"}" decoding="async">`;
}

function structuredData({ canonicalUrl, pageTitle, pageDescription }) {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": "https://creative.siamesecat.cafe/#business",
        name: "Siamese Cat Creative Club",
        legalName: "Siamese Cat Cafe Co., Ltd. (Thailand)",
        url: "https://creative.siamesecat.cafe/",
        image: "https://creative.siamesecat.cafe/landing/og-siamese-cat-creative-club.jpg",
        logo: "https://creative.siamesecat.cafe/main-site/assets/logo-circle.webp",
        telephone: "+66 80 480 3802",
        email: "Cafe@siamesecat.cafe",
        priceRange: "199-18,000 THB",
        address: {
          "@type": "PostalAddress",
          streetAddress: "46/27 Bang Na-Trat Frontage Road",
          addressLocality: "Bang Kaeo",
          addressRegion: "Samut Prakan",
          postalCode: "10540",
          addressCountry: "TH",
        },
        parentOrganization: {
          "@type": "Organization",
          name: "Siamese Cat Cafe Co., Ltd. (Thailand)",
          url: CAFE_URL,
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://creative.siamesecat.cafe/#website",
        url: "https://creative.siamesecat.cafe/",
        name: "Siamese Cat Creative Club",
        inLanguage: ["th", "en"],
        publisher: { "@id": "https://creative.siamesecat.cafe/#business" },
      },
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: pageTitle,
        description: pageDescription,
        inLanguage: currentLanguage,
        isPartOf: { "@id": "https://creative.siamesecat.cafe/#website" },
        about: { "@id": "https://creative.siamesecat.cafe/#business" },
      },
    ],
  };
  return JSON.stringify(graph).replace(/</g, "\\u003c");
}

const nav = [
  { key: "inside", href: "/inside", en: "Inside the Club", th: "ภายในคลับ" },
  {
    key: "creative",
    href: "/creative",
    en: "Creative Club",
    th: "ครีเอทีฟคลับ",
    children: [
      { key: "playgroup", href: "/playgroup", en: "Playgroup", th: "เพลย์กรุ๊ป" },
    ],
  },
  { key: "little-explorer-program", href: "/little-explorer-program", en: "Little Explorer Program", th: "โปรแกรม Little Explorer" },
  {
    key: "membership",
    href: "/membership",
    en: "Membership",
    th: "สมาชิก",
    children: [
      { key: "dinner", href: "/dinner", en: "Meal Plans", th: "แผนมื้ออาหาร" },
    ],
  },
  { key: "faq", href: "/faq", en: "FAQ", th: "FAQ" },
];

function navItem(item, active) {
  const childActive = item.children?.some((child) => child.key === active);
  const activeClass = item.key === active || childActive ? " active" : "";
  if (!item.children) {
    return `<a data-nav="${item.key}" class="nav-link${activeClass}" href="${item.href}">${text(item.en, item.th)}</a>`;
  }
  return `<div class="nav-dropdown${activeClass}">
        <a data-nav="${item.key}" class="nav-link nav-parent${activeClass}" href="${item.href}" aria-haspopup="true">${text(item.en, item.th)}<span class="nav-caret" aria-hidden="true">⌄</span></a>
        <div class="nav-submenu" aria-label="${text(`${item.en} pages`, `หน้าในเมนู ${item.th}`)}">
          ${item.children.map((child) => `<a data-nav="${child.key}" class="nav-submenu-link${child.key === active ? " active" : ""}" href="${child.href}">${text(child.en, child.th)}</a>`).join("\n          ")}
        </div>
      </div>`;
}

function header(active, canonicalPath) {
  const switchHref = currentLanguage === "th"
    ? localizedRoute(canonicalPath, "en")
    : localizedRoute(canonicalPath, "th");
  return `<header class="site-header" data-shell-version="${SHELL_VERSION}">
  <div class="container header-inner">
    <a class="brand" href="/" aria-label="${text("Siamese Cat Creative Club home", "หน้าหลัก Siamese Cat Creative Club")}">
      <span class="brand-mark">${brandLogo()}</span>
      <span class="brand-text"><strong>Siamese Cat Creative Club</strong><span>${text("Flexible • Creative • Caring", "ยืดหยุ่น • สร้างสรรค์ • ใส่ใจ")}</span></span>
    </a>
    <nav class="main-nav" aria-label="${text("Primary navigation", "เมนูหลัก")}">
      ${nav.map((item) => navItem(item, active)).join("\n      ")}
      <a data-nav="contact" class="btn btn-primary${active === "contact" ? " active" : ""}" href="${CONTACT_URL}">${text("Contact Us", "ติดต่อเรา")}</a>
    </nav>
    <div class="header-actions">
      <a class="lang-toggle" data-language-switch href="language-switch${switchHref}" hreflang="${currentLanguage === "th" ? "en" : "th"}" aria-label="${currentLanguage === "th" ? "English - เปลี่ยนเป็นภาษาอังกฤษ" : "ไทย - Switch to Thai"}">${currentLanguage === "th" ? "English" : "ไทย"}</a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-label="${text("Open navigation", "เปิดเมนู")}"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>`;
}

function footer() {
  return `<footer class="site-footer" data-shell-version="${SHELL_VERSION}">
  <div class="container">
    <div class="footer-grid">
      <div>
        <div class="brand" style="color:#fff8ed;margin-bottom:18px"><span class="brand-mark">${brandLogo({ lazy: true })}</span><span class="brand-text"><strong>Siamese Cat Creative Club</strong><span style="color:rgba(255,248,237,.7)">${text("Near Mega Bangna", "ใกล้เมกาบางนา")}</span></span></div>
        <p style="max-width:480px;color:rgba(255,248,237,.76)">${text("Two flexible small-group programs for children: daytime playgroup care and after-school explorer support with play, homework, creativity, meal care and pickup routines.", "สองโปรแกรมกลุ่มเล็กแบบยืดหยุ่นสำหรับเด็ก ทั้งเพลย์กรุ๊ปช่วงกลางวัน และโปรแกรมหลังเลิกเรียน พร้อมการเล่น การบ้าน ความสร้างสรรค์ มื้ออาหาร และการรอรับกลับ")}</p>
        <a class="footer-cafe-link" href="${CAFE_URL}">${text("Visit Siamese Cat Cafe", "เยี่ยมชม Siamese Cat Cafe")}</a>
      </div>
      <div>
        <div class="footer-title">${text("Explore", "สำรวจ")}</div>
        <div class="footer-links">
          ${nav.map((item) => `<a href="${item.href}">${text(item.en, item.th)}</a>${item.children?.map((child) => `<a class="footer-sublink" href="${child.href}">${text(child.en, child.th)}</a>`).join("") ?? ""}`).join("")}
          <a href="${CONTACT_URL}">${text("Contact Us", "ติดต่อเรา")}</a>
          <a href="/first-visit">${text("First Session", "เริ่มครั้งแรก")}</a>
        </div>
      </div>
      <div>
        <div class="footer-title">${text("Visit us", "แวะมาหาเรา")}</div>
        <div class="footer-links"><span>${text("46/27 Bang Na-Trat Frontage Road, Bang Kaeo", "46/27 ถนนคู่ขนานบางนา-ตราด บางแก้ว")}</span><span>${text("Weekdays 3-8 PM for after-school support", "หลังเลิกเรียนวันธรรมดา 15:00-20:00")}</span><span>${text("Playgroup times by confirmed booking", "เวลาเพลย์กรุ๊ปตามการจองที่ยืนยันแล้ว")}</span><a href="${MAP_URL}" target="_blank" rel="noreferrer">${text("Get directions", "ดูเส้นทาง")}</a><a href="mailto:Cafe@siamesecat.cafe">Cafe@siamesecat.cafe</a><a href="tel:+66804803802" data-phone>${text("+66 80 480 3802", "+66 80 480 3802")}</a></div>
      </div>
    </div>
    <div class="footer-bottom"><span>© <span data-year></span> Siamese Cat Creative Club</span><span><a href="/privacy">${text("Privacy & PDPA", "ความเป็นส่วนตัวและ PDPA")}</a> · <a href="/terms">${text("Service terms", "เงื่อนไขบริการ")}</a></span></div>
  </div>
</footer>
<div class="mobile-cta"><a class="btn btn-primary" href="${CONTACT_URL}">${text("Contact Us", "ติดต่อเรา")}</a></div>
<div id="site-toast" class="toast" role="status" aria-live="polite"></div>`;
}

function layout({ page, titleEn, titleTh, description, descriptionTh, body, active = page, extraHead = "", indexable = true }) {
  const canonicalPath = page === "home" ? "/" : `/${page}`;
  const localizedPath = localizedRoute(canonicalPath);
  const canonicalUrl = `https://creative.siamesecat.cafe${localizedPath}`;
  const thaiUrl = `https://creative.siamesecat.cafe${localizedRoute(canonicalPath, "th")}`;
  const englishUrl = `https://creative.siamesecat.cafe${localizedRoute(canonicalPath, "en")}`;
  const pageTitle = currentLanguage === "th" ? titleTh : titleEn;
  const pageDescription = currentLanguage === "th" ? descriptionTh : description;
  return `<!doctype html>
<html lang="${currentLanguage}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="${esc(pageDescription)}">
<meta name="theme-color" content="#fff9f0">
<meta name="robots" content="${indexable ? "index,follow,max-image-preview:large" : "noindex,nofollow"}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Siamese Cat Creative Club">
<meta property="og:locale" content="${currentLanguage === "th" ? "th_TH" : "en_US"}">
<meta property="og:locale:alternate" content="${currentLanguage === "th" ? "en_US" : "th_TH"}">
<meta property="og:title" content="${esc(pageTitle)}">
<meta property="og:description" content="${esc(pageDescription)}">
<meta property="og:url" content="${esc(canonicalUrl)}">
<meta property="og:image" content="https://creative.siamesecat.cafe/landing/og-siamese-cat-creative-club.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Siamese Cat Creative Club">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(pageTitle)}">
<meta name="twitter:description" content="${esc(pageDescription)}">
<meta name="twitter:image" content="https://creative.siamesecat.cafe/landing/og-siamese-cat-creative-club.jpg">
<title>${esc(pageTitle)}</title>
<link rel="canonical" href="${esc(canonicalUrl)}">
<link rel="alternate" hreflang="th" href="${esc(thaiUrl)}">
<link rel="alternate" hreflang="en" href="${esc(englishUrl)}">
<link rel="alternate" hreflang="x-default" href="${esc(thaiUrl)}">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="/main-site/assets/styles.css?v=${ASSET_VERSION}">
${extraHead}
<script type="application/ld+json">${structuredData({ canonicalUrl, pageTitle, pageDescription })}</script>
</head>
<body data-page="${esc(page)}" data-language="${currentLanguage}" data-source="WEB-${page.toUpperCase()}">
<a class="skip-link" href="#main">${text("Skip to content", "ข้ามไปยังเนื้อหา")}</a>
${header(active, canonicalPath)}
<main id="main">
${body}
</main>
${footer()}
<script src="/main-site/assets/app.js?v=${ASSET_VERSION}" defer></script>
</body>
</html>
`;
}

function priceCard({ tag, title, price, desc, items = [], href = "/signup", cta = "Book this option", featured = false, tone = "blue" }) {
  const localizedPrice = currentLanguage === "th" ? price.replaceAll("THB", "บาท") : price;
  return `<article class="card plan-card ${featured ? "featured" : "hover"}">
    <span class="card-tag ${tone}">${tag}</span>
    <h3>${title}</h3>
    <div class="price">${localizedPrice}</div>
    <p class="best-for">${desc}</p>${items.length ? `\n    <ul class="check-list">${items.map((item) => `<li>${item}</li>`).join("")}</ul>` : ""}
    <div class="plan-actions"><a class="btn btn-primary btn-block" href="${href}">${cta}</a></div>
  </article>`;
}

function detailsList(items) {
  return `<ul class="check-list">${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function buildPages(language) {
currentLanguage = language;

const sharedDetails = [
  text("Parent registration is required before joining.", "ต้องลงทะเบียนผู้ปกครองก่อนเข้าร่วม"),
  text("Children must be healthy before attending. Please rest at home for fever, strong coughing or contagious symptoms.", "เด็กต้องมีสุขภาพพร้อมก่อนมา หากมีไข้ ไอมาก หรืออาการติดต่อ ควรพักที่บ้าน"),
  text("This is supervised small-group care, not private one-on-one nanny service.", "เป็นการดูแลแบบกลุ่มเล็กที่มีทีมงานดูแล ไม่ใช่บริการพี่เลี้ยงส่วนตัวแบบตัวต่อตัว"),
  text("Children under 3 may need a parent or guardian to stay, depending on comfort and safety.", "เด็กอายุต่ำกว่า 3 ปีอาจต้องมีผู้ปกครองอยู่ด้วย ขึ้นอยู่กับความพร้อมและความปลอดภัย"),
  text("Socks are not required in the kids' play area, but socks are required for the cat room.", "ในโซนเด็กไม่จำเป็นต้องใส่ถุงเท้า แต่ห้องแมวต้องใส่ถุงเท้า"),
  text("Advance booking is recommended, especially weekends, holidays and evening pickup times.", "แนะนำให้จองล่วงหน้า โดยเฉพาะวันหยุด ช่วงปิดเทอม และช่วงรับกลับตอนเย็น"),
];

const home = layout({
  page: "home",
  active: "home",
  titleEn: "Siamese Cat Creative Club | Playgroup & After-School Care Near Mega Bangna",
  titleTh: "Siamese Cat Creative Club | เพลย์กรุ๊ปและดูแลหลังเลิกเรียนใกล้เมกาบางนา",
  description: "Flexible small-group playgroup and after-school care programs near Mega Bangna.",
  descriptionTh: "เพลย์กรุ๊ปและโปรแกรมดูแลหลังเลิกเรียนแบบกลุ่มเล็กที่ยืดหยุ่น ใกล้เมกาบางนา",
  body: `<section class="hero">
  <div class="container hero-grid">
    <div class="hero-copy reveal visible">
      <span class="eyebrow">${text("Playgroup • After school • Meal care", "เพลย์กรุ๊ป • หลังเลิกเรียน • มื้ออาหาร")}</span>
      <h1>${text("Flexible care for curious children and busy families", "การดูแลแบบยืดหยุ่นสำหรับเด็กช่างสำรวจและครอบครัวที่มีตารางแน่น")}</h1>
      <p class="lead">${text("Choose Little Explorer Playgroup for daytime or weekend care, or After School Explorer for play, homework, creative time, dinner and pickup support after school.", "เลือก Little Explorer Playgroup สำหรับช่วงกลางวันหรือวันหยุด หรือ After School Explorer สำหรับการเล่น การบ้าน เวลาสร้างสรรค์ อาหารเย็น และการรอรับกลับหลังเลิกเรียน")}</p>
      <div class="hero-actions"><a class="btn btn-primary" href="/little-explorer-program">${text("View Packages", "ดูแพ็กเกจ")}</a><a class="btn btn-secondary" href="/playgroup">${text("Little Explorer Playgroup", "Little Explorer Playgroup")}</a><a class="btn btn-secondary" href="/creative">${text("Creative Club", "ครีเอทีฟคลับ")}</a></div>
      <p class="small" style="margin-top:14px">${text("Booking is recommended. Access depends on confirmed capacity and child readiness.", "แนะนำให้จองล่วงหน้า การเข้าใช้ขึ้นอยู่กับจำนวนที่นั่งที่ยืนยันและความพร้อมของเด็ก")}</p>
    </div>
    <div class="hero-art reveal visible" data-delay="1"><div class="gallery-item environment-card" style="width:min(100%,520px);min-height:520px">${imageTag({ file: "environment-play-area.webp", className: "environment-photo", alt: text("Children playing inside Siamese Cat Creative Club", "เด็กกำลังเล่นภายใน Siamese Cat Creative Club"), eager: true })}<div class="caption"><strong>${text("Little Explorer Playgroup in the kids' play area", "Little Explorer Playgroup ในโซนเด็ก")}</strong></div></div></div>
  </div>
</section>
<section class="utility-row"><div class="container pill-row"><span class="info-pill"><span class="dot"></span>${text("Small-group supervision", "ดูแลแบบกลุ่มเล็ก")}</span><span class="info-pill"><span class="dot"></span>${text("Clear package pricing", "ราคาแพ็กเกจชัดเจน")}</span><span class="info-pill"><span class="dot"></span>${text("Meal care available", "มีบริการดูแลมื้ออาหาร")}</span><span class="info-pill"><span class="dot"></span>${text("Animal visits when available", "พบสัตว์เมื่อพร้อมให้บริการ")}</span></div></section>
<section class="section fawn"><div class="container"><div class="section-head"><span class="eyebrow">${text("Choose your program", "เลือกโปรแกรม")}</span><h2>${text("Two service paths for different family schedules", "สองบริการสำหรับตารางครอบครัวที่ต่างกัน")}</h2><p class="kicker">${text("Pick Playgroup for daytime or weekend care. Pick After School Explorer for after-school play, homework, dinner and pickup support.", "เลือกเพลย์กรุ๊ปสำหรับช่วงกลางวันหรือวันหยุด และเลือก After School Explorer สำหรับหลังเลิกเรียน การบ้าน อาหารเย็น และรอรับกลับ")}</p></div><div class="two-col section-grid">
<article class="card soft-mint hover"><span class="card-tag green">${text("Little Explorer Playgroup", "Little Explorer Playgroup")}</span><h3>${text("Daytime and weekend playgroup care", "เพลย์กรุ๊ปช่วงกลางวันและวันหยุด")}</h3><p>${text("For children who need flexible supervised play, creative activities, full-day care or regular weekend care.", "สำหรับเด็กที่ต้องการการเล่นแบบมีทีมงานดูแล กิจกรรมสร้างสรรค์ การดูแลเต็มวัน หรือวันหยุดเป็นประจำ")}</p>${detailsList([text("1 hour / 199 THB and 2 hours / 300 THB", "1 ชั่วโมง / 199 บาท และ 2 ชั่วโมง / 300 บาท"), text("Weekday half-day / 599 THB and weekday full-day / 999 THB", "ครึ่งวันธรรมดา / 599 บาท และเต็มวันธรรมดา / 999 บาท"), text("Saturday or Sunday full-day / 1,500 THB", "เต็มวันเสาร์หรืออาทิตย์ / 1,500 บาท"), text("Regular playgroup passes available", "มีบัตรเหมารอบสำหรับเพลย์กรุ๊ป")])}<a class="btn btn-primary" href="/playgroup">${text("See Playgroup Packages", "ดูแพ็กเกจเพลย์กรุ๊ป")}</a></article>
<article class="card soft-blue hover"><span class="card-tag blue">${text("After School Explorer", "After School Explorer")}</span><h3>${text("After-school care, homework and pickup support", "ดูแลหลังเลิกเรียน การบ้าน และรอรับกลับ")}</h3><p>${text("For school-age children who need a safe place after school with play, quiet focus, creative time, dinner care and pickup support.", "สำหรับเด็กวัยเรียนที่ต้องการพื้นที่ปลอดภัยหลังเลิกเรียน พร้อมการเล่น มุมโฟกัส กิจกรรมสร้างสรรค์ อาหารเย็น และการรอรับกลับ")}</p>${detailsList([text("1 hour / 199 THB and 2 hours / 300 THB", "1 ชั่วโมง / 199 บาท และ 2 ชั่วโมง / 300 บาท"), text("Weekday after-school half-day / 599 THB", "หลังเลิกเรียนครึ่งวันธรรมดา / 599 บาท"), text("Dinner & pickup support by session", "ดูแลอาหารเย็นและรอรับกลับตามเซสชัน"), text("Meal Care Add-On / 299 THB", "บริการเสริมมื้ออาหาร / 299 บาท")])}<a class="btn btn-primary" href="/creative">${text("See After School Explorer", "ดู After School Explorer")}</a></article>
</div></div></section>
<section class="section"><div class="container"><div class="section-head center"><span class="eyebrow">${text("Daily rhythm", "จังหวะประจำวัน")}</span><h2>${text("A calm routine from arrival to pickup", "กิจวัตรอบอุ่นตั้งแต่มาถึงจนรับกลับ")}</h2></div><div class="paw-timeline reveal"><div class="paw-step"><div class="paw-node">1</div><div><h3>${text("Arrive & settle", "มาถึงและปรับตัว")}</h3><p class="small">${text("Wash hands, put bags away and get comfortable.", "ล้างมือ วางกระเป๋า และค่อย ๆ ปรับตัว")}</p></div></div><div class="paw-step"><div class="paw-node">2</div><div><h3>${text("Play or focus", "เล่นหรือโฟกัส")}</h3><p class="small">${text("Playgroup children explore. After-school children may do homework or quiet focus.", "เด็กเพลย์กรุ๊ปได้สำรวจ เด็กหลังเลิกเรียนอาจทำการบ้านหรือกิจกรรมเงียบ")}</p></div></div><div class="paw-step"><div class="paw-node">3</div><div><h3>${text("Create & explore", "สร้างสรรค์และสำรวจ")}</h3><p class="small">${text("Drawing, Lego, clay, reading, soft play, outdoor play or animal visits when available.", "วาดรูป เลโก้ ดินปั้น อ่านหนังสือ เล่นนุ่ม ๆ เล่นกลางแจ้ง หรือพบสัตว์เมื่อพร้อม")}</p></div></div><div class="paw-step"><div class="paw-node">4</div><div><h3>${text("Meal & pickup", "มื้ออาหารและรับกลับ")}</h3><p class="small">${text("Meal care can be arranged for longer sessions or after-school evening pickup.", "สามารถจัดบริการดูแลมื้ออาหารสำหรับเซสชันยาวหรือรอรับช่วงเย็น")}</p></div></div></div></div></section>
<section class="section"><div class="container"><div class="cta-band reveal"><div><span class="eyebrow" style="color:#b8d9c2">${text("Ready to plan?", "พร้อมวางแผน?")}</span><h2>${text("Choose a program, then register once", "เลือกโปรแกรม แล้วลงทะเบียนครั้งเดียว")}</h2><p class="muted">${text("The team can confirm the best session after parent registration.", "ทีมงานจะช่วยยืนยันเซสชันที่เหมาะสมหลังผู้ปกครองลงทะเบียน")}</p></div><div class="cta-actions"><a class="btn btn-light" href="/signup">${text("Parent Signup", "ลงทะเบียนผู้ปกครอง")}</a><a class="btn btn-line" href="tel:+66804803802">${text("Call us", "โทรหาเรา")}</a></div></div></div></section>`
});

function sessionMenuCards(program) {
  const playgroup = program === "playgroup";
  const actionHref = playgroup ? null : CONTACT_URL;
  const actionLabel = text("Contact Us", "ติดต่อเรา");
  const cards = [
    priceCard({ tag: text("Short visit", "มาเล่นสั้น ๆ"), title: playgroup ? text("1-Hour Playroom Entry", "เข้าเล่น 1 ชั่วโมง") : text("1-Hour After School Playroom Entry", "เข้าเล่นหลังเลิกเรียน 1 ชั่วโมง"), price: "199 THB", desc: playgroup ? text("A flexible short visit with playroom access, toys, soft play, drawing and simple indoor activities.", "ตัวเลือกสั้นและยืดหยุ่น พร้อมโซนเล่น ของเล่น โซนนุ่ม วาดรูป และกิจกรรมในร่มง่าย ๆ") : text("A short after-school option for playroom time or supervised waiting before pickup or dinner.", "ตัวเลือกสั้นหลังเลิกเรียน สำหรับเล่นในโซนเด็กหรือรอรับกลับและมื้อเย็นแบบมีทีมงานดูแล"), href: actionHref ?? "/signup?program=playgroup-1h", cta: playgroup ? text("Request 1 hour", "ขอจอง 1 ชั่วโมง") : actionLabel }),
    priceCard({ tag: text("More time", "เวลามากขึ้น"), title: playgroup ? text("2-Hour Playgroup Session", "เพลย์กรุ๊ป 2 ชั่วโมง") : text("2-Hour After School Explorer", "หลังเลิกเรียน 2 ชั่วโมง"), price: "300 THB", desc: playgroup ? text("More time to settle in, explore the playroom, draw and join simple creative play.", "มีเวลาปรับตัว สำรวจโซนเล่น วาดรูป และร่วมกิจกรรมสร้างสรรค์ง่าย ๆ") : text("Time to settle after school, play, draw, read, rest or complete a quiet activity without feeling rushed.", "มีเวลาปรับตัวหลังเลิกเรียน เล่น วาดรูป อ่านหนังสือ พัก หรือทำกิจกรรมเงียบโดยไม่เร่งรีบ"), href: actionHref ?? "/signup?program=playgroup-2h", cta: playgroup ? text("Request 2 hours", "ขอจอง 2 ชั่วโมง") : actionLabel, tone: "green" }),
    priceCard({ tag: text("Weekday value", "คุ้มค่าวันธรรมดา"), title: playgroup ? text("Weekday Half-Day Playgroup", "เพลย์กรุ๊ปครึ่งวันธรรมดา") : text("Weekday After School Half-Day", "หลังเลิกเรียนครึ่งวันธรรมดา"), price: "599 THB", desc: playgroup ? text("Four hours of supervised playgroup care. Total parent value is up to 1,046 THB including 250 THB meal-care value, saving up to 447 THB.", "เพลย์กรุ๊ปแบบมีทีมงานดูแล 4 ชั่วโมง มูลค่ารวมสูงสุด 1,046 บาท รวมมูลค่าดูแลมื้ออาหาร 250 บาท ประหยัดสูงสุด 447 บาท") : text("Four hours of after-school care with play, creative activity, homework support and quiet focus. Saves 197 THB versus four separate 1-hour entries, before meal care.", "ดูแลหลังเลิกเรียน 4 ชั่วโมง พร้อมเล่น กิจกรรมสร้างสรรค์ ดูแลการบ้าน และมุมสงบ ประหยัด 197 บาทเมื่อเทียบกับ 1 ชั่วโมง 4 ครั้ง ก่อนเพิ่มบริการมื้ออาหาร"), href: actionHref ?? "/signup?program=playgroup-half-day", cta: playgroup ? text("Request 4 hours", "ขอจอง 4 ชั่วโมง") : actionLabel, featured: true, tone: "coral" }),
  ];
  if (playgroup) {
    cards.push(
      priceCard({ tag: text("Weekday full day", "เต็มวันวันธรรมดา"), title: text("Weekday Full-Day Playgroup", "เพลย์กรุ๊ปเต็มวันธรรมดา"), price: "999 THB", desc: text("Up to 8 hours of supervised playgroup care. Total parent value is up to 1,842 THB including 250 THB meal-care value, saving up to 843 THB.", "เพลย์กรุ๊ปแบบมีทีมงานดูแลสูงสุด 8 ชั่วโมง มูลค่ารวมสูงสุด 1,842 บาท รวมมูลค่าดูแลมื้ออาหาร 250 บาท ประหยัดสูงสุด 843 บาท"), href: "/signup?program=playgroup-weekday-full", cta: text("Request weekday full day", "ขอจองเต็มวันธรรมดา"), tone: "blue" }),
      priceCard({ tag: text("Weekend", "วันหยุด"), title: text("Saturday Full-Day Playgroup", "เพลย์กรุ๊ปเต็มวันเสาร์"), price: "1,500 THB", desc: text("Structured weekend play, creative time, simple learning and meal care.", "การเล่นวันหยุดแบบมีโครงสร้าง เวลาสร้างสรรค์ การเรียนรู้ง่าย ๆ และการดูแลมื้ออาหาร"), href: "/signup?program=playgroup-saturday-full", cta: text("Request Saturday", "ขอจองวันเสาร์"), tone: "green" }),
      priceCard({ tag: text("Weekend", "วันหยุด"), title: text("Sunday Full-Day Playgroup", "เพลย์กรุ๊ปเต็มวันอาทิตย์"), price: "1,500 THB", desc: text("A full Sunday of supervised play, creativity, simple learning and meal care.", "วันอาทิตย์เต็มวัน พร้อมการเล่น กิจกรรมสร้างสรรค์ การเรียนรู้ง่าย ๆ และการดูแลมื้ออาหารโดยมีทีมงานดูแล"), href: "/signup?program=playgroup-sunday-full", cta: text("Request Sunday", "ขอจองวันอาทิตย์"), tone: "green" })
    );
  } else {
    cards.push(
      priceCard({ tag: text("Evening routine", "ช่วงเย็น"), title: text("After School Dinner & Pickup", "อาหารเย็นและรอรับกลับ"), price: text("By session", "ตามเซสชัน"), desc: text("Play, quiet activity time and meal care before parents arrive.", "เล่น ทำกิจกรรมเงียบ และดูแลมื้ออาหารก่อนผู้ปกครองมารับ"), href: actionHref, cta: actionLabel, tone: "blue" }),
      priceCard({ tag: text("Meal add-on", "เพิ่มมื้ออาหาร"), title: text("Meal Care Add-On", "บริการเสริมมื้ออาหาร"), price: "299 THB", desc: text("One child-friendly food item and one drink, with staff support during mealtime.", "อาหารเด็ก 1 รายการและเครื่องดื่ม 1 แก้ว พร้อมทีมงานช่วยดูแลระหว่างทาน"), href: actionHref, cta: actionLabel, tone: "green" })
    );
  }
  return cards.join("");
}

const playgroup = layout({
  page: "playgroup",
  titleEn: "Little Explorer Playgroup | Siamese Cat Creative Club",
  titleTh: "Little Explorer Playgroup | Siamese Cat Creative Club",
  description: "Flexible playgroup sessions, full-day childcare support and regular passes near Mega Bangna.",
  descriptionTh: "เพลย์กรุ๊ปแบบยืดหยุ่น การดูแลเต็มวัน และบัตรเหมารอบ ใกล้เมกาบางนา",
  body: `<section class="hero"><div class="container hero-grid"><div class="hero-copy reveal visible"><span class="eyebrow">${text("Play • Learn • Create • Explore", "เล่น • เรียนรู้ • สร้างสรรค์ • สำรวจ")}</span><h1>${text("Little Explorer Playgroup", "Little Explorer Playgroup")}</h1><p class="lead">${text("A flexible play and care program for children who love indoor play, creative activities, reading, Lego, outdoor play and supervised animal visits when available.", "โปรแกรมเล่นและดูแลแบบยืดหยุ่นสำหรับเด็กที่ชอบเล่นในร่ม กิจกรรมสร้างสรรค์ อ่านหนังสือ เลโก้ เล่นกลางแจ้ง และพบสัตว์แบบมีทีมงานดูแลเมื่อพร้อม")}</p><div class="hero-actions"><a class="btn btn-primary" href="#sessions">${text("View Sessions", "ดูเซสชัน")}</a><a class="btn btn-secondary" href="/membership">${text("View Passes", "ดูบัตรเหมารอบ")}</a></div><p class="small" style="margin-top:14px">${text("This is supervised small-group playgroup care, not one-on-one nanny service.", "เป็นเพลย์กรุ๊ปแบบกลุ่มเล็กที่มีทีมงานดูแล ไม่ใช่บริการพี่เลี้ยงตัวต่อตัว")}</p></div><div class="hero-art reveal visible"><div class="gallery-item environment-card" style="width:min(100%,520px);min-height:520px">${imageTag({ file: "environment-play-area.webp", className: "environment-photo", alt: text("Kids' play area", "โซนเล่นสำหรับเด็ก"), eager: true })}<div class="caption"><strong>${text("Play, create and explore", "เล่น สร้างสรรค์ และสำรวจ")}</strong></div></div></div></div></section>
<section id="sessions" class="section fawn"><div class="container"><div class="section-head"><span class="eyebrow">${text("Playgroup session menu", "เมนูเพลย์กรุ๊ป")}</span><h2>${text("Flexible sessions from 1 hour to full day", "เซสชันยืดหยุ่นตั้งแต่ 1 ชั่วโมงถึงเต็มวัน")}</h2></div><div class="plan-grid">${sessionMenuCards("playgroup")}</div></div></section>
<section id="membership-options" class="section"><div class="container"><div class="cta-band"><div><span class="eyebrow" style="color:#b8d9c2">${text("Membership", "สมาชิก")}</span><h2>${text("Planning regular visits?", "วางแผนมาใช้บริการเป็นประจำ?")}</h2><p class="muted">${text("View the separate Membership page for weekday and weekend passes.", "ดูบัตรวันธรรมดาและวันหยุดได้ในหน้าสมาชิกโดยเฉพาะ")}</p></div><div class="cta-actions"><a class="btn btn-light" href="/membership">${text("View Membership", "ดูสมาชิก")}</a></div></div></div></section>
<section class="section mint"><div class="container two-col section-grid"><div><span class="eyebrow">${text("Meal care", "ดูแลมื้ออาหาร")}</span><h2>${text("Meal Care Value — 250 THB", "มูลค่าดูแลมื้ออาหาร — 250 บาท")}</h2><p class="kicker">${text("For longer playgroup sessions, children can enjoy a child-friendly meal and drink from the cafe menu with staff support during mealtime.", "สำหรับเซสชันเพลย์กรุ๊ปที่นานขึ้น เด็กสามารถรับอาหารเด็กและเครื่องดื่มจากเมนูคาเฟ่ พร้อมทีมงานช่วยดูแลระหว่างทาน")}</p><a class="btn btn-secondary" href="/dinner">${text("See meal details", "ดูรายละเอียดมื้ออาหาร")}</a></div><div class="card">${detailsList([text("Parents should share allergies, food restrictions or special eating habits in advance.", "ผู้ปกครองควรแจ้งอาการแพ้ ข้อจำกัดอาหาร หรือพฤติกรรมการทานล่วงหน้า"), text("Meal availability depends on the available kids' meal selection.", "เมนูขึ้นอยู่กับรายการอาหารเด็กที่พร้อมให้บริการ"), text("Staff remind and support children while eating.", "ทีมงานช่วยเตือนและดูแลระหว่างทานอาหาร")])}</div></div></section>
<section class="section"><div class="container"><div class="section-head"><span class="eyebrow">${text("Activities included", "กิจกรรมที่อาจได้ทำ")}</span><h2>${text("A balanced mix of play, creativity and gentle learning", "สมดุลระหว่างการเล่น ความสร้างสรรค์ และการเรียนรู้ง่าย ๆ")}</h2></div><div class="activity-grid"><article class="card activity-card"><h3>${text("Indoor play", "เล่นในร่ม")}</h3><p>${text("Toys, soft play, movement and free exploration.", "ของเล่น โซนนุ่ม การเคลื่อนไหว และการสำรวจอิสระ")}</p></article><article class="card activity-card"><h3>${text("Creative projects", "งานสร้างสรรค์")}</h3><p>${text("Drawing, coloring, clay, Lego and simple projects.", "วาดรูป ระบายสี ดินปั้น เลโก้ และโปรเจกต์ง่าย ๆ")}</p></article><article class="card activity-card"><h3>${text("Reading & quiet time", "อ่านหนังสือและเวลาสงบ")}</h3><p>${text("Reading corner, rest time and calm focus.", "มุมอ่านหนังสือ เวลาพัก และการโฟกัสอย่างสงบ")}</p></article><article class="card activity-card"><h3>${text("Outdoor play", "เล่นกลางแจ้ง")}</h3><p>${text("Garden play or water fun when staff, weather and schedule allow.", "เล่นสวนหรือกิจกรรมน้ำเมื่อทีมงาน สภาพอากาศ และตารางพร้อม")}</p></article><article class="card activity-card"><h3>${text("Animal visits", "พบสัตว์")}</h3><p>${text("Cats, rabbits or turtles when available, always guided by staff.", "แมว กระต่าย หรือเต่าเมื่อพร้อมให้บริการ โดยมีทีมงานดูแลเสมอ")}</p></article></div></div></section>
<section class="section mint"><div class="container two-col section-grid"><div><span class="eyebrow">${text("Why families choose Playgroup", "เหตุผลที่ครอบครัวเลือกเพลย์กรุ๊ป")}</span><h2>${text("Flexible care for short visits, full days and regular routines", "การดูแลยืดหยุ่น ทั้งมาเล่นสั้น เต็มวัน และมาเป็นประจำ")}</h2><p class="kicker">${text("Children enjoy social play, creative activities and gentle learning while parents choose a session length that fits the day.", "เด็กได้เล่นกับเพื่อน ทำกิจกรรมสร้างสรรค์ และเรียนรู้อย่างเป็นธรรมชาติ ขณะที่ผู้ปกครองเลือกระยะเวลาที่เหมาะกับแต่ละวัน")}</p></div><div class="card">${detailsList([text("Short 1-hour and 2-hour visits", "ตัวเลือกสั้น 1 ชั่วโมงและ 2 ชั่วโมง"), text("Half-day and full-day weekday support", "ดูแลครึ่งวันและเต็มวันธรรมดา"), text("Weekend full-day care and regular passes", "ดูแลเต็มวันวันหยุดและบัตรเหมารอบ")])}</div></div></section>
<section class="section fawn"><div class="container"><div class="section-head"><span class="eyebrow">${text("Important details", "รายละเอียดสำคัญ")}</span><h2>${text("Before joining playgroup", "ก่อนเข้าร่วมเพลย์กรุ๊ป")}</h2></div><div class="card">${detailsList(sharedDetails)}</div></div></section>`
});

const creative = layout({
  page: "creative",
  titleEn: "After School Explorer Program | Siamese Cat Creative Club",
  titleTh: "โปรแกรม After School Explorer | Siamese Cat Creative Club",
  description: "After-school care with play, homework support, creative activities, dinner support and pickup routines.",
  descriptionTh: "ดูแลหลังเลิกเรียน พร้อมการเล่น ดูแลการบ้าน กิจกรรมสร้างสรรค์ มื้อเย็น และรอผู้ปกครองมารับ",
  body: `<section class="hero"><div class="container hero-grid"><div class="hero-copy reveal visible"><span class="eyebrow">${text("Play • Homework • Create • Dinner • Pickup", "เล่น • การบ้าน • สร้างสรรค์ • อาหารเย็น • รับกลับ")}</span><h1>${text("After School Explorer Program", "โปรแกรม After School Explorer")}</h1><p class="lead">${text("A safe, fun and meaningful place after school. Children can play, finish simple homework, enjoy creative activities, have dinner and wait comfortably for pickup.", "พื้นที่ปลอดภัย สนุก และมีความหมายหลังเลิกเรียน เด็กได้เล่น ทำการบ้านง่าย ๆ ทำกิจกรรมสร้างสรรค์ ทานอาหารเย็น และรอรับกลับอย่างสบายใจ")}</p><div class="hero-actions"><a class="btn btn-primary" href="${CONTACT_URL}">${text("Contact Us", "ติดต่อเรา")}</a></div><p class="small" style="margin-top:14px">${text("This is supervised small-group after-school support, not private one-on-one nanny service.", "เป็นโปรแกรมหลังเลิกเรียนแบบกลุ่มเล็กที่มีทีมงานดูแล ไม่ใช่บริการพี่เลี้ยงส่วนตัวแบบตัวต่อตัว")}</p></div><div class="hero-art reveal visible"><div class="gallery-item environment-card" style="width:min(100%,520px);min-height:520px">${imageTag({ file: "environment-creative-room.webp", className: "environment-photo", alt: text("The Creative Club activity room", "ห้องกิจกรรมครีเอทีฟคลับ"), eager: true })}<div class="caption"><strong>${text("A real space to settle, focus and create", "พื้นที่จริงสำหรับพัก โฟกัส และสร้างสรรค์")}</strong></div></div></div></div></section>
<section id="sessions" class="section fawn"><div class="container"><div class="section-head"><span class="eyebrow">${text("After School Explorer menu", "เมนู After School Explorer")}</span><h2>${text("Short care, longer care, dinner and pickup support", "ดูแลสั้น ดูแลยาว อาหารเย็น และรอรับกลับ")}</h2></div><div class="plan-grid">${sessionMenuCards("creative")}</div></div></section>
<section class="section fawn"><div class="container"><div class="section-head"><span class="eyebrow">${text("What children can do after school", "เด็กทำอะไรได้บ้างหลังเลิกเรียน")}</span><h2>${text("Homework, creativity, play and time to recharge", "การบ้าน ความสร้างสรรค์ การเล่น และเวลาพักใจ")}</h2><p class="kicker">${text("Activities vary by child age, session length, staff schedule and weather.", "กิจกรรมแตกต่างกันตามอายุเด็ก ระยะเวลาเซสชัน ตารางทีมงาน และสภาพอากาศ")}</p></div><div class="activity-grid"><article class="card activity-card"><h3>${text("Homework & reading", "การบ้านและอ่านหนังสือ")}</h3><p>${text("A calm place for simple homework, reading and quiet focus with staff support.", "พื้นที่สงบสำหรับการบ้านง่าย ๆ อ่านหนังสือ และโฟกัส โดยมีทีมงานช่วยดูแล")}</p></article><article class="card activity-card"><h3>${text("Creative activities", "กิจกรรมสร้างสรรค์")}</h3><p>${text("Drawing, coloring, clay, Lego, crafts and small projects.", "วาดรูป ระบายสี ดินปั้น เลโก้ งานประดิษฐ์ และโปรเจกต์เล็ก ๆ")}</p></article><article class="card activity-card"><h3>${text("Play & recharge", "เล่นและเติมพลัง")}</h3><p>${text("Indoor toys, soft play, group activities or outdoor garden play when available.", "ของเล่นในร่ม โซนนุ่ม กิจกรรมกลุ่ม หรือเล่นสวนเมื่อพร้อม")}</p></article><article class="card activity-card"><h3>${text("Quiet time", "เวลาสงบ")}</h3><p>${text("Children can rest and settle after the school day without being rushed.", "เด็กได้พักและปรับตัวหลังวันเรียนโดยไม่ต้องเร่งรีบ")}</p></article><article class="card activity-card"><h3>${text("Animal visits", "พบสัตว์")}</h3><p>${text("Supervised visits with cats, rabbits or turtles when available.", "พบแมว กระต่าย หรือเต่าแบบมีทีมงานดูแลเมื่อพร้อม")}</p></article></div></div></section>
<section class="section mint"><div class="container"><div class="section-head center"><span class="eyebrow">${text("Suggested after-school flow", "ตัวอย่างลำดับหลังเลิกเรียน")}</span><h2>${text("A calm routine between school and home", "กิจวัตรสงบระหว่างโรงเรียนและบ้าน")}</h2></div><div class="paw-timeline reveal"><div class="paw-step"><div class="paw-node">1</div><div><h3>${text("Arrive & settle", "มาถึงและปรับตัว")}</h3><p class="small">${text("Put down bags, wash hands and take a short break.", "วางกระเป๋า ล้างมือ และพักสั้น ๆ")}</p></div></div><div class="paw-step"><div class="paw-node">2</div><div><h3>${text("Homework or quiet focus", "การบ้านหรือโฟกัสเงียบ")}</h3><p class="small">${text("Staff support the environment, reminders and basic clarification where appropriate.", "ทีมงานช่วยจัดบรรยากาศ เตือน และอธิบายเบื้องต้นเมื่อเหมาะสม")}</p></div></div><div class="paw-step"><div class="paw-node">3</div><div><h3>${text("Create & play", "สร้างสรรค์และเล่น")}</h3><p class="small">${text("Drawing, coloring, clay, Lego, reading, indoor play or outdoor play when available.", "วาดรูป ระบายสี ดินปั้น เลโก้ อ่านหนังสือ เล่นในร่มหรือกลางแจ้งเมื่อพร้อม")}</p></div></div><div class="paw-step"><div class="paw-node">4</div><div><h3>${text("Dinner & pickup", "อาหารเย็นและรับกลับ")}</h3><p class="small">${text("Meal care can be requested in advance before parent pickup.", "สามารถขอบริการดูแลมื้ออาหารล่วงหน้าก่อนผู้ปกครองรับกลับ")}</p></div></div></div></div></section>
<section class="section"><div class="container two-col section-grid"><div><span class="eyebrow">${text("Why parents choose After School Explorer", "เหตุผลที่ผู้ปกครองเลือก After School Explorer")}</span><h2>${text("More than a place to wait for pickup", "มากกว่าพื้นที่รอผู้ปกครองมารับ")}</h2><p class="kicker">${text("Children can rest, complete simple homework, create, play and eat before going home. Parents get flexible timing, clear options and a supervised routine.", "เด็กได้พัก ทำการบ้านง่าย ๆ สร้างสรรค์ เล่น และทานอาหารก่อนกลับบ้าน ผู้ปกครองได้เวลาที่ยืดหยุ่น ตัวเลือกชัดเจน และกิจวัตรที่มีทีมงานดูแล")}</p></div><div class="card">${detailsList([text("Useful for working parents and busy family schedules", "เหมาะกับผู้ปกครองที่ทำงานและครอบครัวที่มีตารางแน่น"), text("Homework support without claiming private tutoring", "ช่วยดูแลการบ้านโดยไม่ใช่การสอนพิเศษตัวต่อตัว"), text("Dinner and evening pickup support available", "มีตัวเลือกดูแลมื้อเย็นและรอรับกลับช่วงเย็น")])}</div></div></section>
<section class="section fawn"><div class="container"><div class="section-head"><span class="eyebrow">${text("Important details", "รายละเอียดสำคัญ")}</span><h2>${text("Before joining After School Explorer", "ก่อนเข้าร่วม After School Explorer")}</h2></div><div class="card">${detailsList([...sharedDetails, text("Meal care should be requested in advance when possible.", "ควรแจ้งบริการดูแลมื้ออาหารล่วงหน้าเมื่อเป็นไปได้"), text("Staff support homework monitoring and quiet focus, but this is not formal one-on-one tutoring.", "ทีมงานช่วยดูแลการบ้านและมุมโฟกัส แต่ไม่ใช่การสอนพิเศษตัวต่อตัว")])}</div></div></section>`
});

const littleExplorerProgram = layout({
  page: "little-explorer-program",
  titleEn: "Little Explorer Program | Siamese Cat Creative Club",
  titleTh: "โปรแกรม Little Explorer | Siamese Cat Creative Club",
  description: "Little Explorer Program sessions for flexible daytime and weekend playgroup care near Mega Bangna.",
  descriptionTh: "เซสชันโปรแกรม Little Explorer สำหรับเพลย์กรุ๊ปช่วงกลางวันและวันหยุดแบบยืดหยุ่น ใกล้เมกาบางนา",
  body: `<section class="hero" style="min-height:560px"><div class="container hero-grid"><div class="hero-copy reveal visible"><span class="eyebrow">${text("Play • Learn • Create • Explore", "เล่น • เรียนรู้ • สร้างสรรค์ • สำรวจ")}</span><h1>${text("Little Explorer Program", "โปรแกรม Little Explorer")}</h1><p class="lead">${text("Flexible Little Explorer sessions for short playtime, half-day care, full-day weekday care and weekend care. Children can play, create, read and explore with small-group supervision.", "เซสชัน Little Explorer แบบยืดหยุ่น ทั้งมาเล่นระยะสั้น ครึ่งวัน เต็มวันธรรมดา และวันหยุด เด็กได้เล่น สร้างสรรค์ อ่านหนังสือ และสำรวจโดยมีทีมงานดูแลแบบกลุ่มเล็ก")}</p><div class="hero-actions"><a class="btn btn-primary" href="${CONTACT_URL}">${text("Contact Us", "ติดต่อเรา")}</a><a class="btn btn-secondary" href="/playgroup">${text("Playgroup Details", "รายละเอียดเพลย์กรุ๊ป")}</a></div></div><div class="hero-art reveal visible"><div class="gallery-item environment-card" style="width:min(100%,520px);min-height:520px">${imageTag({ file: "environment-play-area.webp", className: "environment-photo", alt: text("Children's play area", "โซนเล่นสำหรับเด็ก"), eager: true })}<div class="caption"><strong>${text("Little Explorer sessions for every schedule", "เซสชัน Little Explorer สำหรับหลายรูปแบบตารางเวลา")}</strong></div></div></div></div></section>
<section class="section fawn"><div class="container"><div class="section-head"><span class="eyebrow">${text("Little Explorer Program", "โปรแกรม Little Explorer")}</span><h2>${text("Session menu", "เมนูเซสชัน")}</h2><p class="kicker">${text("Choose the session length that fits your family's day.", "เลือกระยะเวลาเซสชันให้เหมาะกับตารางของครอบครัว")}</p></div><div class="plan-grid">${sessionMenuCards("playgroup")}</div></div></section>
<section class="section"><div class="container two-col section-grid"><div><span class="eyebrow">${text("Program details", "รายละเอียดโปรแกรม")}</span><h2>${text("A clear path from first visit to regular care", "ตัวเลือกชัดเจนตั้งแต่ครั้งแรกจนถึงการมาเป็นประจำ")}</h2><p class="kicker">${text("Read the Playgroup page for activities and joining details. Families planning regular visits can compare passes on the separate Membership page.", "อ่านรายละเอียดกิจกรรมและการเข้าร่วมได้ในหน้าเพลย์กรุ๊ป ส่วนครอบครัวที่วางแผนมาเป็นประจำสามารถเปรียบเทียบบัตรได้ในหน้าสมาชิก")}</p></div><div class="card">${detailsList([text("1-hour and 2-hour sessions", "เซสชัน 1 ชั่วโมงและ 2 ชั่วโมง"), text("Weekday half-day and full-day care", "ดูแลครึ่งวันและเต็มวันธรรมดา"), text("Saturday and Sunday full-day care", "ดูแลเต็มวันเสาร์และอาทิตย์")])}<div class="hero-actions"><a class="btn btn-secondary" href="/playgroup">${text("View Playgroup", "ดูเพลย์กรุ๊ป")}</a><a class="btn btn-secondary" href="/membership">${text("View Membership", "ดูสมาชิก")}</a></div></div></div></section>`
});

const membership = layout({
  page: "membership",
  titleEn: "Membership | Siamese Cat Creative Club",
  titleTh: "สมาชิก | Siamese Cat Creative Club",
  description: "Membership passes for regular Little Explorer Playgroup and After School Explorer families.",
  descriptionTh: "บัตรสมาชิกสำหรับครอบครัวที่ใช้บริการ Little Explorer Playgroup และ After School Explorer เป็นประจำ",
  body: `<section class="hero" style="min-height:560px"><div class="container hero-grid"><div class="hero-copy reveal visible"><span class="eyebrow">${text("Membership", "สมาชิก")}</span><h1>${text("Membership options for regular families", "ตัวเลือกสมาชิกสำหรับครอบครัวที่มาเป็นประจำ")}</h1><p class="lead">${text("Choose a Playgroup pass for regular weekday or weekend care. After School Explorer passes are arranged with the team around the child's weekly routine, pickup time and meal needs.", "เลือกบัตรเพลย์กรุ๊ปสำหรับการดูแลวันธรรมดาหรือวันหยุดเป็นประจำ ส่วนบัตร After School Explorer จะจัดร่วมกับทีมงานตามตารางประจำสัปดาห์ เวลารับกลับ และความต้องการมื้ออาหารของเด็ก")}</p><div class="hero-actions"><a class="btn btn-primary" href="${CONTACT_URL}">${text("Contact Us", "ติดต่อเรา")}</a></div></div><div class="hero-art reveal visible"><div class="card soft-mint"><h3>${text("Two distinct membership paths", "สมาชิกสองรูปแบบที่แยกชัดเจน")}</h3>${detailsList([text("Little Explorer Playgroup: priced weekday and weekend passes", "Little Explorer Playgroup: บัตรวันธรรมดาและวันหยุดพร้อมราคาชัดเจน"), text("After School Explorer: regular passes arranged to fit the child's routine", "After School Explorer: บัตรสำหรับมาเป็นประจำที่จัดให้ตรงกับกิจวัตรของเด็ก")])}</div></div></div></section>
<section class="section fawn"><div class="container"><div class="section-head"><span class="eyebrow">${text("Little Explorer Playgroup", "Little Explorer Playgroup")}</span><h2>${text("Playgroup memberships", "สมาชิกเพลย์กรุ๊ป")}</h2><p class="kicker">${text("For families who need regular full-day weekday or weekend playgroup care.", "สำหรับครอบครัวที่ต้องการเพลย์กรุ๊ปเต็มวันธรรมดาหรือวันหยุดเป็นประจำ")}</p></div><div class="plan-grid">${priceCard({ tag: text("20 sessions", "20 ครั้ง"), title: text("Weekday Full-Day Pass", "บัตรเต็มวันธรรมดา"), price: "18,000 THB", desc: text("20 weekday full-day sessions with meal-care value. Effective price 900 THB per session; save 1,980 THB.", "เต็มวันธรรมดา 20 ครั้ง พร้อมมูลค่าดูแลมื้ออาหาร เฉลี่ย 900 บาทต่อครั้ง ประหยัด 1,980 บาท"), href: CONTACT_URL, cta: text("Contact Us", "ติดต่อเรา"), featured: true, tone: "coral" })}${priceCard({ tag: text("8 sessions", "8 ครั้ง"), title: text("Saturday Full-Day Pass", "บัตรเต็มวันเสาร์"), price: "9,200 THB", desc: text("8 Saturday full-day sessions with meal-care value. Effective price 1,150 THB per session; save 2,800 THB.", "เต็มวันเสาร์ 8 ครั้ง พร้อมมูลค่าดูแลมื้ออาหาร เฉลี่ย 1,150 บาทต่อครั้ง ประหยัด 2,800 บาท"), href: CONTACT_URL, cta: text("Contact Us", "ติดต่อเรา"), tone: "green" })}${priceCard({ tag: text("8 sessions", "8 ครั้ง"), title: text("Sunday Full-Day Pass", "บัตรเต็มวันอาทิตย์"), price: "9,200 THB", desc: text("8 Sunday full-day sessions with meal-care value. Effective price 1,150 THB per session; save 2,800 THB.", "เต็มวันอาทิตย์ 8 ครั้ง พร้อมมูลค่าดูแลมื้ออาหาร เฉลี่ย 1,150 บาทต่อครั้ง ประหยัด 2,800 บาท"), href: CONTACT_URL, cta: text("Contact Us", "ติดต่อเรา"), tone: "green" })}</div></div></section>
<section class="section"><div class="container"><div class="section-head"><span class="eyebrow">${text("After School Explorer", "After School Explorer")}</span><h2>${text("After-school memberships", "สมาชิกหลังเลิกเรียน")}</h2><p class="kicker">${text("The team confirms the schedule, pickup routine and meal support before arranging a regular pass.", "ทีมงานจะยืนยันตาราง กิจวัตรรับกลับ และบริการมื้ออาหารก่อนจัดบัตรสำหรับมาเป็นประจำ")}</p></div><div class="plan-grid">${priceCard({ tag: text("Weekday routine", "กิจวัตรวันธรรมดา"), title: text("Weekday After School Pass", "บัตรดูแลหลังเลิกเรียนวันธรรมดา"), price: text("By arrangement", "จัดตามข้อตกลง"), desc: text("For regular supervised play, homework focus, creative activities and meal care if added.", "สำหรับการเล่นหลังเลิกเรียน การบ้าน กิจกรรมสร้างสรรค์ และการดูแลมื้ออาหารหากต้องการ"), href: CONTACT_URL, cta: text("Contact Us", "ติดต่อเรา"), tone: "blue" })}${priceCard({ tag: text("Focus + create", "โฟกัส + สร้างสรรค์"), title: text("Homework & Creative Pass", "บัตรการบ้านและกิจกรรมสร้างสรรค์"), price: text("By arrangement", "จัดตามข้อตกลง"), desc: text("For children who benefit from calm homework or reading time before creative play.", "เหมาะกับเด็กที่ต้องการเวลาเงียบสำหรับการบ้านหรืออ่านหนังสือก่อนเล่นสร้างสรรค์"), href: CONTACT_URL, cta: text("Contact Us", "ติดต่อเรา"), tone: "green" })}${priceCard({ tag: text("Late pickup", "รับกลับเย็น"), title: text("Dinner & Late Pickup Pass", "บัตรมื้อเย็นและรับกลับช่วงค่ำ"), price: text("By arrangement", "จัดตามข้อตกลง"), desc: text("For working parents who regularly need dinner support and evening pickup care.", "เหมาะกับผู้ปกครองที่ต้องการดูแลมื้ออาหารและรอรับกลับช่วงเย็นเป็นประจำ"), href: CONTACT_URL, cta: text("Contact Us", "ติดต่อเรา"), featured: true, tone: "coral" })}</div></div></section>`
});

const dinner = layout({
  page: "dinner",
  titleEn: "Meal Plans | Siamese Cat Creative Club",
  titleTh: "แผนมื้ออาหาร | Siamese Cat Creative Club",
  description: "Meal care options for Little Explorer Playgroup and After School Explorer Program.",
  descriptionTh: "ตัวเลือกดูแลมื้ออาหารสำหรับ Little Explorer Playgroup และโปรแกรม After School Explorer",
  body: `<section class="hero" style="min-height:560px"><div class="container hero-grid"><div class="hero-copy reveal visible"><span class="eyebrow">${text("Meal Plans", "แผนมื้ออาหาร")}</span><h1>${text("Meal Plans", "แผนมื้ออาหาร")}</h1><p class="lead">${text("Children staying for longer sessions can enjoy a child-friendly meal and drink with staff support during mealtime.", "เด็กที่อยู่เซสชันนานขึ้นสามารถทานอาหารเด็กและเครื่องดื่ม พร้อมทีมงานช่วยดูแลระหว่างมื้ออาหาร")}</p><div class="hero-actions"><a class="btn btn-primary" href="/signup">${text("Request Meal Care", "ขอเพิ่มบริการมื้ออาหาร")}</a><a class="btn btn-secondary" href="/little-explorer-program">${text("Little Explorer Program", "โปรแกรม Little Explorer")}</a></div></div><div class="hero-art reveal visible"><div class="cafe-brand-hero"><a class="cafe-logo-panel" href="${CAFE_URL}" aria-label="${text("Visit Siamese Cat Cafe website", "ไปยังเว็บไซต์ Siamese Cat Cafe")}">${imageTag({ file: "siamese-cat-cafe-logo.webp", className: "cafe-logo-image", alt: "Siamese Cat Cafe", eager: true, sizes: "320px" })}</a><div class="cafe-brand-pills"><span class="info-pill">${text("Child-friendly meals", "อาหารที่เหมาะกับเด็ก")}</span><span class="info-pill">${text("Cafe drinks", "เครื่องดื่มจากคาเฟ่")}</span></div></div></div></div></section>
<section class="section fawn"><div class="container"><div class="section-head"><span class="eyebrow">${text("Meal care by program", "ดูแลมื้ออาหารตามโปรแกรม")}</span><h2>${text("Choose the meal option that matches the booked program", "เลือกตัวเลือกมื้ออาหารให้ตรงกับโปรแกรมที่จอง")}</h2></div><div class="plan-grid">${priceCard({ tag: text("Playgroup", "เพลย์กรุ๊ป"), title: text("Meal Care Value", "มูลค่าดูแลมื้ออาหาร"), price: "250 THB", desc: text("For longer playgroup sessions, counted as parent value and based on the available kids' meal selection.", "สำหรับเพลย์กรุ๊ปเซสชันยาว คิดเป็นมูลค่าที่ผู้ปกครองได้รับ ขึ้นอยู่กับเมนูเด็กที่พร้อมให้บริการ"), href: "/playgroup", cta: text("See Playgroup", "ดูเพลย์กรุ๊ป"), tone: "green" })}${priceCard({ tag: text("After school", "หลังเลิกเรียน"), title: text("Meal Care Add-On", "บริการเสริมมื้ออาหาร"), price: "299 THB", desc: text("One child-friendly food item and one drink, with staff supporting the child during mealtime.", "อาหารเด็ก 1 รายการและเครื่องดื่ม 1 แก้ว พร้อมทีมงานช่วยดูแลระหว่างทาน"), href: "/creative", cta: text("See Creative Club", "ดูครีเอทีฟคลับ"), featured: true, tone: "coral" })}${priceCard({ tag: text("Required", "สำคัญ"), title: text("Allergy and food notes", "อาการแพ้และข้อจำกัดอาหาร"), price: text("Tell us early", "แจ้งล่วงหน้า"), desc: text("Parents should inform staff about allergies, food restrictions or special eating habits before the session.", "ผู้ปกครองควรแจ้งอาการแพ้ ข้อจำกัดอาหาร หรือพฤติกรรมการทานก่อนเซสชัน"), href: "/signup", cta: text("Register details", "ลงทะเบียนข้อมูล"), tone: "blue" })}</div></div></section>
<section class="section"><div class="container"><div class="section-head center"><span class="eyebrow">${text("Mealtime flow", "ขั้นตอนมื้ออาหาร")}</span><h2>${text("Simple support before pickup", "ดูแลง่าย ๆ ก่อนรับกลับ")}</h2></div><div class="paw-timeline reveal"><div class="paw-step"><div class="paw-node">1</div><div><h3>${text("Request meal care", "แจ้ง Meal Care")}</h3><p class="small">${text("Ask in advance when possible.", "แจ้งล่วงหน้าเมื่อเป็นไปได้")}</p></div></div><div class="paw-step"><div class="paw-node">2</div><div><h3>${text("Share food notes", "แจ้งข้อมูลอาหาร")}</h3><p class="small">${text("Allergies, restrictions and eating habits matter.", "อาการแพ้ ข้อจำกัด และพฤติกรรมการทานเป็นข้อมูลสำคัญ")}</p></div></div><div class="paw-step"><div class="paw-node">3</div><div><h3>${text("Eat with support", "ทานพร้อมการดูแล")}</h3><p class="small">${text("Staff remind, support and keep children comfortable.", "ทีมงานช่วยเตือน ดูแล และให้เด็กสบายใจ")}</p></div></div><div class="paw-step"><div class="paw-node">4</div><div><h3>${text("Ready for pickup", "พร้อมรับกลับ")}</h3><p class="small">${text("Useful for longer care or evening pickup.", "เหมาะกับการดูแลยาวหรือรอรับช่วงเย็น")}</p></div></div></div></div></section>`
});

const inside = layout({
  page: "inside",
  titleEn: "Inside the Club | Siamese Cat Creative Club",
  titleTh: "ภายในคลับ | Siamese Cat Creative Club",
  description: "Spaces, safety routines and activities for children at Siamese Cat Creative Club.",
  descriptionTh: "พื้นที่ กิจวัตรด้านความปลอดภัย และกิจกรรมสำหรับเด็กที่ Siamese Cat Creative Club",
  body: `<section class="hero" style="min-height:560px"><div class="container hero-grid"><div class="hero-copy reveal visible"><span class="eyebrow">${text("Inside the Club", "ภายในคลับ")}</span><h1>${text("A real space for play, focus, meals and pickup", "พื้นที่จริงสำหรับเล่น โฟกัส มื้ออาหาร และรอรับกลับ")}</h1><p class="lead">${text("Children are guided through supervised areas based on the service booked: playroom time, creative tables, quiet focus, meal support and animal visits when available.", "เด็กจะใช้พื้นที่ตามบริการที่จอง เช่น โซนเล่น โต๊ะสร้างสรรค์ มุมโฟกัส ดูแลมื้ออาหาร และพบสัตว์เมื่อพร้อมให้บริการ")}</p><div class="hero-actions"><a class="btn btn-primary" href="/playgroup">${text("Playgroup", "เพลย์กรุ๊ป")}</a><a class="btn btn-secondary" href="/creative">${text("Creative Club", "ครีเอทีฟคลับ")}</a></div></div><div class="hero-art reveal visible"><div class="gallery-item environment-card" style="width:min(100%,520px);min-height:520px">${imageTag({ file: "environment-creative-room.webp", className: "environment-photo", alt: text("Creative room", "ห้องกิจกรรมสร้างสรรค์"), eager: true })}<div class="caption"><strong>${text("Creative and calm activity space", "พื้นที่กิจกรรมสร้างสรรค์และสงบ")}</strong></div></div></div></div></section>
<section class="section fawn"><div class="container"><div class="section-head"><span class="eyebrow">${text("What children may do", "เด็กอาจได้ทำอะไร")}</span><h2>${text("Activities depend on age, schedule, weather and session length", "กิจกรรมขึ้นอยู่กับอายุ ตาราง สภาพอากาศ และระยะเวลาเซสชัน")}</h2></div><div class="activity-grid"><article class="card activity-card"><h3>${text("Indoor playroom", "โซนเล่นในร่ม")}</h3><p>${text("Toys, soft play and simple group play.", "ของเล่น โซนนุ่ม และการเล่นกลุ่มง่าย ๆ")}</p></article><article class="card activity-card"><h3>${text("Creative tables", "โต๊ะสร้างสรรค์")}</h3><p>${text("Drawing, coloring, clay, Lego and small projects.", "วาดรูป ระบายสี ดินปั้น เลโก้ และโปรเจกต์เล็ก ๆ")}</p></article><article class="card activity-card"><h3>${text("Quiet focus", "มุมโฟกัส")}</h3><p>${text("Homework monitoring, reading and rest.", "ดูแลการบ้าน อ่านหนังสือ และพักผ่อน")}</p></article><article class="card activity-card"><h3>${text("Meal support", "ดูแลมื้ออาหาร")}</h3><p>${text("Meal care for longer stays or evening pickup.", "Meal Care สำหรับอยู่ยาวหรือรอรับช่วงเย็น")}</p></article><article class="card activity-card"><h3>${text("Animal visits", "พบสัตว์")}</h3><p>${text("Cats, rabbits or turtles when available, with gentle staff guidance.", "แมว กระต่าย หรือเต่าเมื่อพร้อม พร้อมทีมงานแนะนำอย่างอ่อนโยน")}</p></article></div></div></section>
<section class="section"><div class="container"><div class="section-head"><span class="eyebrow">${text("The environment", "บรรยากาศ")}</span><h2>${text("Designed for flexible care, not a fixed classroom", "ออกแบบเพื่อการดูแลแบบยืดหยุ่น ไม่ใช่ห้องเรียนตายตัว")}</h2></div><div class="gallery-grid environment-gallery"><article class="gallery-item large environment-card environment-shop">${imageTag({ file: "environment-shop-front.webp", className: "environment-photo", alt: text("Shop front", "ด้านหน้าร้าน") })}<div class="caption"><strong>${text("Near Mega Bangna", "ใกล้เมกาบางนา")}</strong></div></article><article class="gallery-item environment-card environment-creative">${imageTag({ file: "environment-creative-room.webp", className: "environment-photo", alt: text("Creative room", "ห้องสร้างสรรค์") })}<div class="caption"><strong>${text("Creative room", "ห้องสร้างสรรค์")}</strong></div></article><article class="gallery-item environment-card environment-play">${imageTag({ file: "environment-play-area.webp", className: "environment-photo", alt: text("Play area", "โซนเล่น") })}<div class="caption"><strong>${text("Play area", "โซนเล่น")}</strong></div></article><article class="gallery-item environment-card environment-entrance">${imageTag({ file: "environment-entrance-pickup.webp", className: "environment-photo", alt: text("Entrance and pickup", "ทางเข้าและจุดรับกลับ") })}<div class="caption"><strong>${text("Pickup process", "ขั้นตอนรับกลับ")}</strong></div></article><article class="gallery-item environment-card environment-cafe">${imageTag({ file: "environment-cat-cafe-dinner.webp", className: "environment-photo", alt: text("Cafe dinner", "มื้ออาหารจากคาเฟ่"), sizes: "(max-width: 760px) calc(100vw - 24px), 360px" })}<div class="caption"><strong>${text("Meal care", "ดูแลมื้ออาหาร")}</strong></div></article></div></div></section>`
});

const firstVisit = layout({
  page: "first-visit",
  titleEn: "First Session | Siamese Cat Creative Club",
  titleTh: "เริ่มครั้งแรก | Siamese Cat Creative Club",
  description: "Choose a first visit for Little Explorer Playgroup or After School Explorer.",
  descriptionTh: "เลือกการมาใช้บริการครั้งแรกสำหรับ Little Explorer Playgroup หรือ After School Explorer",
  body: `<section class="hero" style="min-height:560px"><div class="container hero-grid"><div class="hero-copy reveal visible"><span class="eyebrow">${text("Start here", "เริ่มที่นี่")}</span><h1>${text("Plan your child’s first visit", "วางแผนการมาใช้บริการครั้งแรก")}</h1><p class="lead">${text("Choose a Playgroup first visit for daytime care, or choose After School Explorer for after-school care and pickup support.", "เลือกเพลย์กรุ๊ปสำหรับการดูแลช่วงกลางวัน หรือเลือก After School Explorer สำหรับการดูแลหลังเลิกเรียนและรอรับกลับ")}</p><div class="hero-actions"><a class="btn btn-primary" href="/signup">${text("Register first", "ลงทะเบียนก่อน")}</a><a class="btn btn-secondary" href="/little-explorer-program">${text("Compare packages", "เทียบแพ็กเกจ")}</a></div></div><div class="hero-art reveal visible"><div class="card soft-mint"><h3>${text("First visit choices", "ตัวเลือกสำหรับครั้งแรก")}</h3>${detailsList([text("Playgroup: 1 hour / 199 THB or 2 hours / 300 THB.", "เพลย์กรุ๊ป: 1 ชั่วโมง / 199 บาท หรือ 2 ชั่วโมง / 300 บาท"), text("Playgroup weekday half-day: 4 hours / 599 THB.", "เพลย์กรุ๊ปครึ่งวันธรรมดา: 4 ชั่วโมง / 599 บาท"), text("After School Explorer: 1 hour / 199 THB, 2 hours / 300 THB, or 4-hour half-day / 599 THB.", "After School Explorer: 1 ชั่วโมง / 199 บาท, 2 ชั่วโมง / 300 บาท หรือครึ่งวัน 4 ชั่วโมง / 599 บาท")])}</div></div></div></section>`
});

const contact = layout({
  page: "contact",
  titleEn: "Contact Us | Siamese Cat Creative Club",
  titleTh: "ติดต่อเรา | Siamese Cat Creative Club",
  description: "Contact Siamese Cat Creative Club about Playgroup, Creative Club, Membership or Meal Plans near Mega Bangna.",
  descriptionTh: "ติดต่อ Siamese Cat Creative Club เพื่อสอบถามเพลย์กรุ๊ป ครีเอทีฟคลับ สมาชิก หรือแผนมื้ออาหาร ใกล้เมกาบางนา",
  body: `<section class="hero" style="min-height:560px"><div class="container hero-grid"><div class="hero-copy reveal visible"><span class="eyebrow">${text("Contact Us", "ติดต่อเรา")}</span><h1>${text("Tell us how we can help", "บอกเราได้เลยว่าต้องการให้ช่วยเรื่องใด")}</h1><p class="lead">${text("Send your question or tell us which service you are interested in. Our team will reply using the phone number or email you provide.", "ส่งคำถามหรือแจ้งบริการที่สนใจ ทีมงานจะติดต่อกลับทางเบอร์โทรหรืออีเมลที่คุณให้ไว้")}</p><div class="hero-actions"><a class="btn btn-line" href="https://wa.me/66952413028" target="_blank" rel="noopener">${text("WhatsApp Us", "ติดต่อทาง WhatsApp")}</a><a class="btn btn-secondary" href="mailto:Cafe@siamesecat.cafe">Cafe@siamesecat.cafe</a></div></div><div class="hero-art reveal visible"><div class="gallery-item environment-card" style="width:min(100%,520px);min-height:520px">${imageTag({ file: "environment-shop-front.webp", className: "environment-photo", alt: text("Siamese Cat Creative Club entrance", "ทางเข้า Siamese Cat Creative Club"), eager: true })}<div class="caption"><strong>${text("Near Mega Bangna", "ใกล้เมกาบางนา")}</strong></div></div></div></div></section>
<section class="section fawn"><div class="container booking-layout"><aside class="contact-panel"><div class="card contact-method-card"><span class="eyebrow">${text("Direct contact", "ช่องทางติดต่อโดยตรง")}</span><h2>${text("Reach our team", "ติดต่อทีมงาน")}</h2><div class="contact-method-list"><a href="https://wa.me/66952413028" target="_blank" rel="noopener"><strong>WhatsApp</strong><span>+660952413028</span></a><a href="mailto:Cafe@siamesecat.cafe"><strong>${text("Email", "อีเมล")}</strong><span>Cafe@siamesecat.cafe</span></a><a href="tel:+66804803802"><strong>${text("Telephone", "โทรศัพท์")}</strong><span>+66 80 480 3802</span></a><a href="${CAFE_URL}"><strong>Siamese Cat Cafe</strong><span>siamesecat.cafe</span></a></div></div></aside>
<form class="card form-card" data-contact-form novalidate><div class="section-head"><span class="eyebrow">${text("Send an inquiry", "ส่งคำถาม")}</span><h2>${text("Contact form", "แบบฟอร์มติดต่อ")}</h2><p>${text("Service selection is optional. Contact details and your message are required.", "ไม่จำเป็นต้องเลือกบริการ แต่กรุณากรอกข้อมูลติดต่อและข้อความ")}</p></div><div class="form-grid"><div class="field"><label for="contact-name">${text("Name", "ชื่อ")} *</label><input id="contact-name" name="name" type="text" autocomplete="name" maxlength="120" required><span class="field-error"></span></div><div class="field"><label for="contact-phone">${text("Contact number", "เบอร์ติดต่อ")} *</label><input id="contact-phone" name="phone" type="tel" autocomplete="tel" maxlength="30" required><span class="field-error"></span></div><div class="field full"><label for="contact-email">${text("Email", "อีเมล")} *</label><input id="contact-email" name="email" type="email" autocomplete="email" maxlength="254" required><span class="field-error"></span></div><div class="field full"><label for="contact-service">${text("Service of interest (optional)", "บริการที่สนใจ (ไม่บังคับ)")}</label><select id="contact-service" name="service"><option value="">${text("No service selected", "ยังไม่เลือกบริการ")}</option><option value="little-explorer-program">${text("Little Explorer Program", "โปรแกรม Little Explorer")}</option><option value="playgroup">${text("Playgroup", "เพลย์กรุ๊ป")}</option><option value="creative-club">${text("Creative Club / After School Explorer", "ครีเอทีฟคลับ / After School Explorer")}</option><option value="membership">${text("Membership", "สมาชิก")}</option><option value="meal-plans">${text("Meal Plans", "แผนมื้ออาหาร")}</option></select><span class="field-error"></span></div><div class="field full"><label for="contact-message">${text("Your inquiry", "คำถามของคุณ")} *</label><textarea id="contact-message" name="message" minlength="10" maxlength="3000" required></textarea><span class="field-error"></span></div><div class="field contact-honeypot" aria-hidden="true"><label for="contact-website">Website</label><input id="contact-website" name="website" type="text" tabindex="-1" autocomplete="off"></div><label class="consent-row field full"><input name="consent" type="checkbox" required><span>${text("I agree that Siamese Cat Creative Club may use these details to respond to my inquiry.", "ฉันยินยอมให้ Siamese Cat Creative Club ใช้ข้อมูลนี้เพื่อตอบคำถามของฉัน")} <a class="text-link" href="/privacy">${text("Privacy Policy", "นโยบายความเป็นส่วนตัว")}</a><span class="field-error"></span></span></label></div><button class="btn btn-primary" type="submit">${text("Send Inquiry", "ส่งคำถาม")}</button><p class="form-status" role="status" aria-live="polite"></p></form></div></section>
<section class="section"><div class="container"><div class="section-head"><span class="eyebrow">${text("Find us", "แผนที่")}</span><h2>${text("Visit Siamese Cat Creative Club", "เดินทางมายัง Siamese Cat Creative Club")}</h2><p class="kicker">${text("46/27 Bang Na-Trat Frontage Road, Bang Kaeo, Samut Prakan 10540", "46/27 ถนนคู่ขนานบางนา-ตราด ตำบลบางแก้ว สมุทรปราการ 10540")}</p></div><div class="contact-map"><iframe title="${text("Google Map showing Siamese Cat Creative Club", "แผนที่ Google แสดง Siamese Cat Creative Club")}" src="https://www.google.com/maps?q=46%2F27%20Bang%20Na-Trat%20Frontage%20Road%2C%20Bang%20Kaeo%2C%20Samut%20Prakan%2010540&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div><div class="hero-actions" style="margin-top:20px"><a class="btn btn-secondary" href="${MAP_URL}" target="_blank" rel="noopener">${text("Open in Google Maps", "เปิดใน Google Maps")}</a></div></div></section>`
});

const faq = layout({
  page: "faq",
  titleEn: "FAQ | Siamese Cat Creative Club",
  titleTh: "คำถามที่พบบ่อย | Siamese Cat Creative Club",
  description: "Frequently asked questions about Playgroup, Creative Club, meal care and booking.",
  descriptionTh: "คำถามที่พบบ่อยเกี่ยวกับเพลย์กรุ๊ป ครีเอทีฟคลับ การดูแลมื้ออาหาร และการจอง",
  body: `<section class="section fawn"><div class="narrow"><span class="eyebrow">${text("FAQ", "คำถามที่พบบ่อย")}</span><h1>${text("Good to know before booking", "ข้อมูลควรรู้ก่อนจอง")}</h1><p class="kicker">${text("Answers for Little Explorer Playgroup, After School Explorer, meal care and booking.", "คำตอบเกี่ยวกับ Little Explorer Playgroup, After School Explorer, Meal Care และการจอง")}</p>
  <div class="faq-category"><h2>${text("Programs", "โปรแกรม")}</h2><div class="faq-list">
    <details class="faq-item" open><summary>${text("What is the difference between Playgroup and Creative Club?", "เพลย์กรุ๊ปกับครีเอทีฟคลับต่างกันอย่างไร?")}</summary><div class="faq-answer"><p>${text("Little Explorer Playgroup is for daytime or weekend playgroup care. After School Explorer Program is for after-school routines with homework, creative activity, dinner support and pickup.", "Little Explorer Playgroup เหมาะกับการดูแลช่วงกลางวันหรือวันหยุด ส่วนโปรแกรม After School Explorer เหมาะกับกิจวัตรหลังเลิกเรียน เช่น การบ้าน กิจกรรมสร้างสรรค์ อาหารเย็น และรอรับกลับ")}</p></div></details>
    <details class="faq-item"><summary>${text("Is this private nanny care?", "เป็นบริการพี่เลี้ยงส่วนตัวหรือไม่?")}</summary><div class="faq-answer"><p>${text("No. Little Explorer Playgroup and After School Explorer are supervised small-group programs, not one-on-one nanny service.", "ไม่ใช่ Little Explorer Playgroup และ After School Explorer เป็นการดูแลแบบกลุ่มเล็กที่มีทีมงานดูแล ไม่ใช่บริการพี่เลี้ยงตัวต่อตัว")}</p></div></details>
    <details class="faq-item"><summary>${text("Is this tutoring?", "เป็นการสอนพิเศษหรือไม่?")}</summary><div class="faq-answer"><p>${text("No. Staff can support homework monitoring, reminders, reading and quiet focus, but this is not formal private tutoring.", "ไม่ใช่ ทีมงานช่วยดูแลการบ้าน เตือน อ่านหนังสือ และมุมโฟกัสได้ แต่ไม่ใช่การสอนพิเศษแบบตัวต่อตัว")}</p></div></details>
  </div></div>
  <div class="faq-category"><h2>${text("Prices and meal care", "ราคาและ Meal Care")}</h2><div class="faq-list">
    <details class="faq-item" open><summary>${text("What are the Playgroup prices?", "ราคาเพลย์กรุ๊ปเท่าไร?")}</summary><div class="faq-answer"><p>${text("Little Explorer Playgroup starts at 199 THB for 1 hour and 300 THB for 2 hours. Weekday half-day is 599 THB, weekday full-day is 999 THB, and weekend full-day is 1,500 THB.", "Little Explorer Playgroup เริ่มที่ 199 บาทสำหรับ 1 ชั่วโมง และ 300 บาทสำหรับ 2 ชั่วโมง ครึ่งวันธรรมดา 599 บาท เต็มวันธรรมดา 999 บาท และเต็มวันวันหยุด 1,500 บาท")}</p></div></details>
    <details class="faq-item"><summary>${text("What are the After School Explorer prices?", "ราคา After School Explorer คือเท่าไร?")}</summary><div class="faq-answer"><p>${text("After School Explorer starts at 199 THB for 1 hour and 300 THB for 2 hours. Weekday after-school half-day is 599 THB. Meal Care Add-On is 299 THB.", "After School Explorer เริ่มที่ 199 บาทสำหรับ 1 ชั่วโมง และ 300 บาทสำหรับ 2 ชั่วโมง หลังเลิกเรียนครึ่งวันธรรมดา 599 บาท และ Meal Care Add-On 299 บาท")}</p></div></details>
    <details class="faq-item"><summary>${text("How does meal care work?", "บริการดูแลมื้ออาหารเป็นอย่างไร?")}</summary><div class="faq-answer"><p>${text("Playgroup uses a 250 THB meal-care value for longer-session value. After-school meal care is a 299 THB add-on with one child-friendly food item and one drink.", "เพลย์กรุ๊ปใช้มูลค่าดูแลมื้ออาหาร 250 บาทในการคำนวณความคุ้มค่าของเซสชันยาว ส่วนหลังเลิกเรียนมีบริการเสริมมื้ออาหาร 299 บาท รวมอาหารเด็ก 1 รายการและเครื่องดื่ม 1 แก้ว")}</p></div></details>
  </div></div>
  <div class="faq-category"><h2>${text("Safety and booking", "ความปลอดภัยและการจอง")}</h2><div class="faq-list">
    <details class="faq-item" open><summary>${text("Do children need to be healthy before attending?", "เด็กต้องสุขภาพพร้อมก่อนมาไหม?")}</summary><div class="faq-answer"><p>${text("Yes. If a child is sick, has fever, strong coughing or contagious symptoms, parents should let the child rest at home.", "ต้องพร้อม หากเด็กป่วย มีไข้ ไอมาก หรือมีอาการติดต่อ ผู้ปกครองควรให้พักที่บ้าน")}</p></div></details>
    <details class="faq-item"><summary>${text("Can children under 3 join?", "เด็กอายุต่ำกว่า 3 ปีเข้าร่วมได้ไหม?")}</summary><div class="faq-answer"><p>${text("Children under 3 may need a parent or guardian to stay, depending on the child's comfort and safety.", "เด็กอายุต่ำกว่า 3 ปีอาจต้องมีผู้ปกครองอยู่ด้วย ขึ้นอยู่กับความพร้อมและความปลอดภัยของเด็ก")}</p></div></details>
    <details class="faq-item"><summary>${text("Are socks required?", "ต้องใส่ถุงเท้าไหม?")}</summary><div class="faq-answer"><p>${text("Socks are not required inside the kids' play area, but socks are required if entering the cat room.", "ในโซนเด็กไม่จำเป็นต้องใส่ถุงเท้า แต่ต้องใส่ถุงเท้าหากเข้าห้องแมว")}</p></div></details>
    <details class="faq-item"><summary>${text("Are animal visits always included?", "พบสัตว์ได้ทุกครั้งไหม?")}</summary><div class="faq-answer"><p>${text("No. Cat, rabbit or turtle visits depend on availability, staff schedule, child readiness and animal welfare. All interaction is supervised.", "ไม่เสมอไป การพบแมว กระต่าย หรือเต่าขึ้นอยู่กับความพร้อม ตารางทีมงาน ความพร้อมของเด็ก และสวัสดิภาพสัตว์ โดยมีทีมงานดูแลเสมอ")}</p></div></details>
    <details class="faq-item"><summary>${text("Is advance booking required?", "ต้องจองล่วงหน้าหรือไม่?")}</summary><div class="faq-answer"><p>${text("Advance booking is strongly recommended, especially weekends, holidays and evening pickup times.", "แนะนำให้จองล่วงหน้าอย่างยิ่ง โดยเฉพาะวันหยุด ช่วงปิดเทอม และเวลารอรับกลับช่วงเย็น")}</p></div></details>
  </div></div>
</div></section>`
});

const thankYou = layout({
  page: "thank-you",
  indexable: false,
  titleEn: "Request Received | Siamese Cat Creative Club",
  titleTh: "ได้รับคำขอแล้ว | Siamese Cat Creative Club",
  description: "Thank you for contacting Siamese Cat Creative Club.",
  descriptionTh: "ขอบคุณที่ติดต่อ Siamese Cat Creative Club",
  body: `<section class="success-wrap"><div class="narrow"><div class="success-icon">✓</div><span class="eyebrow">${text("Request received", "ได้รับคำขอแล้ว")}</span><h1 style="font-size:clamp(42px,7vw,68px)">${text("Thank you. Our team will review the request.", "ขอบคุณ ทีมงานจะตรวจสอบคำขอของคุณ")}</h1><p class="kicker" style="margin-inline:auto">${text("This is not yet a confirmed reservation. The visit becomes confirmed after the team replies with an accepted date and time.", "ขณะนี้ยังไม่ถือว่าเป็นการจองที่ยืนยัน การมาใช้บริการจะยืนยันเมื่อทีมงานตอบกลับพร้อมวันและเวลาที่รับได้")}</p><div class="hero-actions" style="justify-content:center"><a class="btn btn-secondary" href="/little-explorer-program">${text("Review Packages", "ดูแพ็กเกจ")}</a><a class="btn btn-secondary" href="/">${text("Return Home", "กลับหน้าหลัก")}</a></div></div></section>`
});

const notFound = layout({
  page: "404",
  indexable: false,
  titleEn: "Page Not Found | Siamese Cat Creative Club",
  titleTh: "ไม่พบหน้า | Siamese Cat Creative Club",
  description: "The requested page could not be found.",
  descriptionTh: "ไม่พบหน้าที่คุณต้องการ",
  body: `<section class="success-wrap"><div class="narrow"><span class="eyebrow">404</span><h1 style="font-size:clamp(48px,8vw,86px)">${text("We couldn't find this page", "ไม่พบหน้านี้")}</h1><p class="kicker" style="margin-inline:auto">${text("Explore Little Explorer Playgroup, After School Explorer, packages and meal care from the main pages.", "ดู Little Explorer Playgroup, After School Explorer, แพ็กเกจ และ Meal Care ได้จากหน้าหลัก")}</p><div class="hero-actions" style="justify-content:center"><a class="btn btn-primary" href="/little-explorer-program">${text("View Packages", "ดูแพ็กเกจ")}</a><a class="btn btn-secondary" href="/">${text("Return Home", "กลับหน้าหลัก")}</a></div></div></section>`
});

const pages = {
  "index.html": home,
  "playgroup.html": playgroup,
  "creative.html": creative,
  "little-explorer-program.html": littleExplorerProgram,
  "membership.html": membership,
  "dinner.html": dinner,
  "inside.html": inside,
  "first-visit.html": firstVisit,
  "contact.html": contact,
  "faq.html": faq,
  "thank-you.html": thankYou,
  "404.html": notFound,
};

return pages;
}

for (const language of ["th", "en"]) {
  const languageOut = language === "th" ? OUT : join(OUT, "EN");
  mkdirSync(languageOut, { recursive: true });
  const pages = buildPages(language);
  for (const [file, html] of Object.entries(pages)) {
    writeFileSync(join(languageOut, file), localizeDocumentLinks(html, language));
  }
}

console.log("Wrote 24 localized main-site pages.");

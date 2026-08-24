import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const OUT = join(process.cwd(), "public/main-site");
const SHELL_VERSION = "20260808-seo-v1";
const ASSET_VERSION = SHELL_VERSION;
const CODING_CSS_VERSION = "20260823-hero-alignment-v2";
const MAP_URL = "https://maps.app.goo.gl/XpYHkxenRu6gLvnFA";
const CAFE_URL = "https://siamesecat.cafe/";
const CONTACT_URL = "/contact";
const GOOGLE_ANALYTICS_ID = "G-MK27QPPWH5";
const BLOG_CATEGORIES = [
  { key: "parenting-guides", en: "Parent Questions", th: "คำถามจากพ่อแม่" },
  { key: "kid-learning-material", en: "Play & Development", th: "การเล่นและพัฒนาการ" },
  { key: "club-news-updates", en: "Inside the Club", th: "เรื่องจากในคลับ" },
  { key: "faq", en: "After School", th: "ชีวิตหลังเลิกเรียน" },
];
const PUBLIC_ROUTES = new Set([
  "/",
  "/inside",
  "/playgroup",
  "/creative",
  "/coding-with-ai",
  "/coding-with-ai/car-maze",
  "/coding-with-ai/cat-vs-dog",
  "/little-explorer-program",
  "/membership",
  "/dinner",
  "/contact",
  "/blog",
  "/faq",
  "/first-visit",
  "/about",
  "/editorial-process",
  "/thank-you",
  "/signup",
  "/signup/success",
  "/terms",
  "/privacy",
  "/tools",
  "/tools/kids-routine-chart",
  "/tools/polaroid-generator",
  "/tools/cat-passport",
  "/tools/cat-food-calculator",
  "/tools/skinny-filter",
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
    .replaceAll('href="language-switch', 'href="')
    .replaceAll("<h3>Two distinct membership paths</h3>", "<h2>Two distinct membership paths</h2>")
    .replaceAll("<h3>สมาชิกสองรูปแบบที่แยกชัดเจน</h3>", "<h2>สมาชิกสองรูปแบบที่แยกชัดเจน</h2>")
    .replaceAll("<h3>First visit choices</h3>", "<h2>First visit choices</h2>")
    .replaceAll("<h3>ตัวเลือกสำหรับครั้งแรก</h3>", "<h2>ตัวเลือกสำหรับครั้งแรก</h2>");
}

function attrs(attrs) {
  return Object.entries(attrs)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => ` ${key}="${esc(value)}"`)
    .join("");
}

const IMAGE_DATA = {
  "coding-with-ai-hero.webp": { width: 1568, height: 1003 },
  "instructor-djai.webp": { width: 912, height: 1440 },
  "siamese-cat-dev-logo.webp": { width: 900, height: 764 },
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
        telephone: "+66952413028",
        email: "Cafe@siamesecat.cafe",
        priceRange: "45-599 THB",
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
        geo: { "@type": "GeoCoordinates", latitude: 13.6427544, longitude: 100.6691261 },
        hasMap: MAP_URL,
        areaServed: ["Bang Kaeo", "Bangna", "Bang Phli", "Samut Prakan"],
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
      { key: "playgroup", href: "/playgroup", en: "Kids Playroom", th: "Kids Playroom" },
      { key: "coding-with-ai", href: "/coding-with-ai", en: "Coding with AI", th: "เรียนโค้ดด้วย AI" },
    ],
  },
  {
    key: "membership",
    href: "/membership",
    en: "Membership",
    th: "สมาชิก",
    children: [
      { key: "dinner", href: "/dinner", en: "Meal Plans", th: "แผนมื้ออาหาร" },
    ],
  },
  {
    key: "blog",
    href: "/blog",
    en: "Blog",
    th: "บล็อก",
    children: [
      ...BLOG_CATEGORIES.map((category) => ({
        key: `blog-${category.key}`,
        href: `/blog?category=${category.key}`,
        en: category.en,
        th: category.th,
      })),
      { key: "faq-page", href: "/faq", en: "Main FAQ", th: "FAQ หลัก" },
    ],
  },
  { key: "tools", href: "/tools", en: "Free Tools", th: "เครื่องมือฟรี" },
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
  const programNav = nav.filter((item) => ["inside", "creative", "membership"].includes(item.key));
  const blogNav = nav.find((item) => item.key === "blog");
  return `<footer class="site-footer" data-shell-version="${SHELL_VERSION}">
  <div class="container">
    <div class="footer-grid">
      <div>
        <div class="brand" style="color:#fff8ed;margin-bottom:18px"><span class="brand-mark">${brandLogo({ lazy: true })}</span><span class="brand-text"><strong>Siamese Cat Creative Club</strong><span style="color:rgba(255,248,237,.7)">${text("Near Mega Bangna", "ใกล้เมกาบางนา")}</span></span></div>
        <p style="max-width:480px;color:rgba(255,248,237,.76)">${text("A parent-accompanied Kids Playroom with optional creative activities, plus separate After School Explorer care with homework, meals and pickup support.", "Kids Playroom ที่ผู้ปกครองอยู่ดูแลเด็ก พร้อมกิจกรรมสร้างสรรค์เสริม และบริการ After School Explorer แยกต่างหากสำหรับการบ้าน มื้ออาหาร และรอรับกลับ")}</p>
        <a class="footer-cafe-link" href="${CAFE_URL}">${text("Visit Siamese Cat Cafe", "เยี่ยมชม Siamese Cat Cafe")}</a>
      </div>
      <div class="footer-navigation">
        <div>
          <div class="footer-title">${text("Programs", "โปรแกรม")}</div>
          <div class="footer-links">
            ${programNav.map((item) => `<a href="${item.href}">${text(item.en, item.th)}</a>${item.children?.map((child) => `<a class="footer-sublink" href="${child.href}">${text(child.en, child.th)}</a>`).join("") ?? ""}`).join("")}
          </div>
        </div>
        <div>
          <div class="footer-title">${text("Resources", "แหล่งข้อมูล")}</div>
          <div class="footer-links footer-resource-links">
            <a href="${blogNav.href}">${text(blogNav.en, blogNav.th)}</a>
            ${blogNav.children.map((child) => `<a class="footer-sublink" href="${child.href}">${text(child.en, child.th)}</a>`).join("")}
            <a href="/tools">${text("Free Tools", "เครื่องมือฟรี")}</a>
            <a href="${CONTACT_URL}">${text("Contact Us", "ติดต่อเรา")}</a>
            <a href="/first-visit">${text("First Session", "เริ่มครั้งแรก")}</a>
            <a href="/about">${text("About the Club", "เกี่ยวกับคลับ")}</a>
            <a href="/editorial-process">${text("Editorial Process", "กระบวนการจัดทำเนื้อหา")}</a>
          </div>
        </div>
      </div>
      <div class="footer-visit">
        <div class="footer-title">${text("Visit us", "แวะมาหาเรา")}</div>
        <address class="footer-links"><span>${text("46/27 Bang Na-Trat Frontage Road, Bang Kaeo", "46/27 ถนนคู่ขนานบางนา-ตราด บางแก้ว")}</span><span>${text("Weekdays 3-8 PM for after-school support", "หลังเลิกเรียนวันธรรมดา 15:00-20:00")}</span><span>${text("Kids Playroom entry by confirmed availability", "เข้าใช้ Kids Playroom ตามรอบและจำนวนที่ยืนยัน")}</span><a href="${MAP_URL}" target="_blank" rel="noreferrer">${text("Get directions", "ดูเส้นทาง")}</a><a href="mailto:Cafe@siamesecat.cafe">Cafe@siamesecat.cafe</a><a href="tel:+66952413028" data-phone>${text("+66 095 241 3028", "+66 095 241 3028")}</a></address>
      </div>
    </div>
    <div class="footer-bottom"><span>© <span data-year></span> Siamese Cat Creative Club</span><span><a href="/privacy">${text("Privacy & PDPA", "ความเป็นส่วนตัวและ PDPA")}</a> · <a href="/terms">${text("Service terms", "เงื่อนไขบริการ")}</a></span></div>
  </div>
</footer>
<div class="mobile-cta"><a class="btn btn-primary" href="${CONTACT_URL}">${text("Contact Us", "ติดต่อเรา")}</a></div>
<div id="site-toast" class="toast" role="status" aria-live="polite"></div>`;
}

function layout({ page, titleEn, titleTh, description, descriptionTh, body, active = page, extraHead = "", indexable = true, follow = true, ogImage = "https://creative.siamesecat.cafe/landing/og-siamese-cat-creative-club.jpg", ogImageWidth = 1200, ogImageHeight = 630, ogImageAlt = "Siamese Cat Creative Club" }) {
  const canonicalPath = page === "home" ? "/" : `/${page}`;
  const localizedPath = localizedRoute(canonicalPath);
  const canonicalUrl = `https://creative.siamesecat.cafe${localizedPath}`;
  const thaiUrl = `https://creative.siamesecat.cafe${localizedRoute(canonicalPath, "th")}`;
  const englishUrl = `https://creative.siamesecat.cafe${localizedRoute(canonicalPath, "en")}`;
  const pageAssetVersion = page.startsWith("coding-with-ai") ? CODING_CSS_VERSION : ASSET_VERSION;
  const pageTitle = currentLanguage === "th" ? titleTh : titleEn;
  const pageDescription = currentLanguage === "th" ? descriptionTh : description;
  return `<!doctype html>
<html lang="${currentLanguage}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="${esc(pageDescription)}">
<meta name="theme-color" content="#fff9f0">
<meta name="robots" content="${indexable ? "index,follow,max-image-preview:large" : `noindex,${follow ? "follow" : "nofollow"}`}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Siamese Cat Creative Club">
<meta property="og:locale" content="${currentLanguage === "th" ? "th_TH" : "en_US"}">
<meta property="og:locale:alternate" content="${currentLanguage === "th" ? "en_US" : "th_TH"}">
<meta property="og:title" content="${esc(pageTitle)}">
<meta property="og:description" content="${esc(pageDescription)}">
<meta property="og:url" content="${esc(canonicalUrl)}">
<meta property="og:image" content="${esc(ogImage)}">
<meta property="og:image:width" content="${esc(ogImageWidth)}">
<meta property="og:image:height" content="${esc(ogImageHeight)}">
<meta property="og:image:alt" content="${esc(ogImageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(pageTitle)}">
<meta name="twitter:description" content="${esc(pageDescription)}">
<meta name="twitter:image" content="${esc(ogImage)}">
<title>${esc(pageTitle)}</title>
<link rel="canonical" href="${esc(canonicalUrl)}">
<link rel="alternate" hreflang="th" href="${esc(thaiUrl)}">
<link rel="alternate" hreflang="en" href="${esc(englishUrl)}">
<link rel="alternate" hreflang="x-default" href="${esc(thaiUrl)}">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="/main-site/assets/styles.css?v=${pageAssetVersion}">
${extraHead}
<script async src="https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${GOOGLE_ANALYTICS_ID}');
</script>
<script type="application/ld+json">${structuredData({ canonicalUrl, pageTitle, pageDescription })}</script>
</head>
<body data-page="${esc(page)}" data-language="${currentLanguage}" data-source="WEB-${page.toUpperCase()}">
<a class="skip-link" href="#main">${text("Skip to content", "ข้ามไปยังเนื้อหา")}</a>
${header(active, canonicalPath)}
<main id="main">
${body}
</main>
${footer()}
<script src="/main-site/assets/app.js?v=${pageAssetVersion}" defer></script>
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
  text("For Kids Playroom visits, an accompanying parent or guardian must remain on the premises and remains responsible for the child while staff guide activities.", "สำหรับ Kids Playroom ผู้ปกครองต้องอยู่ภายในสถานที่และยังคงรับผิดชอบดูแลเด็ก ขณะที่ทีมงานช่วยแนะนำกิจกรรม"),
  text("After School Explorer is a separate supervised care service with its own prices, booking and pickup routine.", "After School Explorer เป็นบริการดูแลแยกต่างหาก มีราคา การจอง และขั้นตอนรับกลับของตนเอง"),
  text("Socks are not required in the kids' play area, but socks are required for the cat room.", "ในโซนเด็กไม่จำเป็นต้องใส่ถุงเท้า แต่ห้องแมวต้องใส่ถุงเท้า"),
  text("Advance booking is recommended, especially weekends, holidays and evening pickup times.", "แนะนำให้จองล่วงหน้า โดยเฉพาะวันหยุด ช่วงปิดเทอม และช่วงรับกลับตอนเย็น"),
];

const home = layout({
  page: "home",
  active: "home",
  titleEn: "Kids Playroom & After-School Care in Bangna | Siamese Cat",
  titleTh: "Kids Playroom และดูแลหลังเลิกเรียน บางนา | Siamese Cat",
  description: "Parent-accompanied Kids Playroom entry from 149 THB and separate After School Explorer care near Mega Bangna.",
  descriptionTh: "Kids Playroom ที่ผู้ปกครองอยู่ด้วย เริ่ม 149 บาท และบริการ After School Explorer แยกต่างหาก ใกล้เมกาบางนา",
  body: `<section class="hero">
  <div class="container hero-grid">
    <div class="hero-copy reveal visible">
      <span class="eyebrow">${text("Kids Playroom • Creative activities • After school", "Kids Playroom • กิจกรรมสร้างสรรค์ • หลังเลิกเรียน")}</span>
      <h1>${text("Kids Playroom and after-school care near Mega Bangna", "Kids Playroom และดูแลหลังเลิกเรียน ใกล้เมกาบางนา")}</h1>
      <p class="lead">${text("Choose the parent-accompanied Kids Playroom for flexible play and optional creative activities, or After School Explorer for homework, dinner and pickup support after school.", "เลือก Kids Playroom ที่ผู้ปกครองอยู่ด้วยสำหรับการเล่นและกิจกรรมสร้างสรรค์เสริม หรือเลือก After School Explorer สำหรับการบ้าน อาหารเย็น และรอรับกลับหลังเลิกเรียน")}</p>
      <div class="hero-actions"><a class="btn btn-primary" href="/playgroup">${text("View Playroom Menu", "ดูเมนู Playroom")}</a><a class="btn btn-secondary" href="/creative">${text("After School Explorer", "After School Explorer")}</a></div>
      <p class="small" style="margin-top:14px">${text("Booking is recommended. Access depends on confirmed capacity and child readiness.", "แนะนำให้จองล่วงหน้า การเข้าใช้ขึ้นอยู่กับจำนวนที่นั่งที่ยืนยันและความพร้อมของเด็ก")}</p>
    </div>
    <div class="hero-art reveal visible" data-delay="1"><div class="gallery-item environment-card" style="width:min(100%,520px);min-height:520px">${imageTag({ file: "environment-play-area.webp", className: "environment-photo", alt: text("Children playing inside Siamese Cat Creative Club", "เด็กกำลังเล่นภายใน Siamese Cat Creative Club"), eager: true })}<div class="caption"><strong>${text("Kids Playroom & Creative Activities", "Kids Playroom และกิจกรรมสร้างสรรค์")}</strong></div></div></div>
  </div>
</section>
<section class="utility-row"><div class="container pill-row"><span class="info-pill"><span class="dot"></span>${text("One adult included per child entry", "รวมผู้ใหญ่ 1 คนต่อค่าเข้าเด็ก 1 คน")}</span><span class="info-pill"><span class="dot"></span>${text("One coloring sheet included", "รวมกระดาษระบายสี 1 แผ่น")}</span><span class="info-pill"><span class="dot"></span>${text("Parent or guardian stays on premises", "ผู้ปกครองอยู่ภายในสถานที่")}</span></div></section>
<section class="section fawn"><div class="container"><div class="section-head"><span class="eyebrow">${text("Choose your service", "เลือกบริการ")}</span><h2>${text("Two services with different supervision rules", "สองบริการที่มีกติกาการดูแลต่างกัน")}</h2><p class="kicker">${text("Kids Playroom is parent-accompanied. After School Explorer remains the separate care option for school-age routines and pickup support.", "Kids Playroom ต้องมีผู้ปกครองอยู่ด้วย ส่วน After School Explorer ยังคงเป็นบริการดูแลแยกสำหรับกิจวัตรหลังเลิกเรียนและรอรับกลับ")}</p></div><div class="two-col section-grid">
<article class="card soft-mint hover"><span class="card-tag green">${text("Kids Playroom", "Kids Playroom")}</span><h3>${text("Playroom entry and creative activities", "ค่าเข้า Playroom และกิจกรรมสร้างสรรค์")}</h3><p>${text("A flexible parent-accompanied visit with playroom access. Staff guide activities, but the accompanying adult remains responsible for the child.", "การเข้าเล่นแบบยืดหยุ่นโดยมีผู้ปกครองอยู่ด้วย ทีมงานช่วยแนะนำกิจกรรม แต่ผู้ใหญ่ที่มาด้วยยังคงรับผิดชอบดูแลเด็ก")}</p>${detailsList([text("1 hour / 149 THB or 2 hours / 249 THB", "1 ชั่วโมง / 149 บาท หรือ 2 ชั่วโมง / 249 บาท"), text("Additional hour / 80 THB after an initial entry", "เพิ่มเวลา 1 ชั่วโมง / 80 บาท หลังซื้อค่าเข้า"), text("Additional adult / 50 THB per hour", "ผู้ใหญ่เพิ่มเติม / 50 บาทต่อชั่วโมง"), text("Crayon and soft-clay activities from 45 THB", "กิจกรรมสีเทียนและดินปั้นนิ่ม เริ่ม 45 บาท")])}<a class="btn btn-primary" href="/playgroup">${text("See Playroom Menu", "ดูเมนู Playroom")}</a></article>
<article class="card soft-blue hover"><span class="card-tag blue">${text("After School Explorer", "After School Explorer")}</span><h3>${text("After-school care, homework and pickup support", "ดูแลหลังเลิกเรียน การบ้าน และรอรับกลับ")}</h3><p>${text("For school-age children who need a safe place after school with play, quiet focus, creative time, dinner care and pickup support.", "สำหรับเด็กวัยเรียนที่ต้องการพื้นที่ปลอดภัยหลังเลิกเรียน พร้อมการเล่น มุมโฟกัส กิจกรรมสร้างสรรค์ อาหารเย็น และการรอรับกลับ")}</p>${detailsList([text("1 hour / 199 THB and 2 hours / 300 THB", "1 ชั่วโมง / 199 บาท และ 2 ชั่วโมง / 300 บาท"), text("Weekday after-school half-day / 599 THB", "หลังเลิกเรียนครึ่งวันธรรมดา / 599 บาท"), text("Dinner & pickup support by session", "ดูแลอาหารเย็นและรอรับกลับตามเซสชัน"), text("Meal Care Add-On / 299 THB", "บริการเสริมมื้ออาหาร / 299 บาท")])}<a class="btn btn-primary" href="/creative">${text("See After School Explorer", "ดู After School Explorer")}</a></article>
</div></div></section>
<section class="section"><div class="container"><div class="section-head center"><span class="eyebrow">${text("Two clear experiences", "สองประสบการณ์ที่แยกชัดเจน")}</span><h2>${text("Play together, or arrange after-school care", "เล่นด้วยกัน หรือจัดบริการดูแลหลังเลิกเรียน")}</h2></div><div class="paw-timeline reveal"><div class="paw-step"><div class="paw-node">1</div><div><h3>${text("Choose the service", "เลือกบริการ")}</h3><p class="small">${text("Kids Playroom is parent-accompanied; After School Explorer is separate care.", "Kids Playroom มีผู้ปกครองอยู่ด้วย ส่วน After School Explorer เป็นบริการดูแลแยก")}</p></div></div><div class="paw-step"><div class="paw-node">2</div><div><h3>${text("Choose the time", "เลือกเวลา")}</h3><p class="small">${text("Playroom entry is one or two hours. After School also offers a four-hour weekday option.", "Playroom มีค่าเข้า 1 หรือ 2 ชั่วโมง ส่วน After School มีตัวเลือกวันธรรมดา 4 ชั่วโมงด้วย")}</p></div></div><div class="paw-step"><div class="paw-node">3</div><div><h3>${text("Play or create", "เล่นหรือสร้างสรรค์")}</h3><p class="small">${text("Use the playroom and choose optional crayon or soft-clay activities.", "ใช้โซนเล่นและเลือกกิจกรรมสีเทียนหรือดินปั้นนิ่มเสริมได้")}</p></div></div><div class="paw-step"><div class="paw-node">4</div><div><h3>${text("Stay or pick up", "อยู่ด้วยหรือมารับ")}</h3><p class="small">${text("Playroom adults stay on site. After School follows its confirmed pickup routine.", "ผู้ใหญ่ของ Playroom อยู่ภายในสถานที่ ส่วน After School ใช้ขั้นตอนรับกลับที่ยืนยันไว้")}</p></div></div></div></div></section>
<section class="section paper home-blog" data-home-blog><div class="container"><div class="blog-list-heading"><div><span class="eyebrow">${text("From the club", "บทความจากคลับ")}</span><h2>${text("Latest from our family blog", "บทความล่าสุดจากบล็อกครอบครัว")}</h2><p class="kicker">${text("Parenting guidance, learning materials, club news and practical answers for families.", "คำแนะนำสำหรับผู้ปกครอง สื่อการเรียนรู้ ข่าวสารจากคลับ และคำตอบที่นำไปใช้ได้จริงสำหรับครอบครัว")}</p></div><a class="btn btn-secondary" href="/blog">${text("View all articles", "ดูบทความทั้งหมด")}</a></div><nav class="home-blog-categories" aria-label="${text("Blog categories", "หมวดหมู่บทความ")}"><a href="/blog">${text("All articles", "บทความทั้งหมด")}</a>${BLOG_CATEGORIES.map((category) => `<a href="/blog?category=${category.key}">${text(category.en, category.th)}</a>`).join("")}</nav><div class="blog-grid home-blog-grid" data-home-blog-grid aria-live="polite"><p class="home-blog-status" data-home-blog-status>${text("Loading published articles…", "กำลังโหลดบทความที่เผยแพร่…")}</p></div><noscript><p><a class="text-link" href="/blog">${text("View all published articles", "ดูบทความที่เผยแพร่ทั้งหมด")}</a></p></noscript></div></section>
<section class="section"><div class="container"><div class="cta-band reveal"><div><span class="eyebrow" style="color:#b8d9c2">${text("Ready to plan?", "พร้อมวางแผน?")}</span><h2>${text("Choose a program, then register once", "เลือกโปรแกรม แล้วลงทะเบียนครั้งเดียว")}</h2><p class="muted">${text("The team can confirm the best session after parent registration.", "ทีมงานจะช่วยยืนยันเซสชันที่เหมาะสมหลังผู้ปกครองลงทะเบียน")}</p></div><div class="cta-actions"><a class="btn btn-light" href="/signup">${text("Parent Signup", "ลงทะเบียนผู้ปกครอง")}</a><a class="btn btn-line" href="tel:+66952413028">${text("Call us", "โทรหาเรา")}</a></div></div></div></section>`
});

function sessionMenuCards(program) {
  const playgroup = program === "playgroup";
  const actionHref = playgroup ? null : CONTACT_URL;
  const actionLabel = text("Contact Us", "ติดต่อเรา");
  if (playgroup) {
    return [
      priceCard({ tag: text("Per child", "ต่อเด็ก 1 คน"), title: text("1-Hour Kids Playroom Entry", "Kids Playroom 1 ชั่วโมง"), price: "149 THB", desc: text("Includes one accompanying adult and one coloring sheet. The parent or guardian stays on the premises.", "รวมผู้ใหญ่ที่มาด้วย 1 คนและกระดาษระบายสี 1 แผ่น ผู้ปกครองต้องอยู่ภายในสถานที่"), href: "/signup?program=playroom-1h", cta: text("Request 1 hour", "ขอจอง 1 ชั่วโมง") }),
      priceCard({ tag: text("Per child", "ต่อเด็ก 1 คน"), title: text("2-Hour Kids Playroom Entry", "Kids Playroom 2 ชั่วโมง"), price: "249 THB", desc: text("Includes one accompanying adult and one coloring sheet, with more time for play and exploration.", "รวมผู้ใหญ่ที่มาด้วย 1 คนและกระดาษระบายสี 1 แผ่น พร้อมเวลาเล่นและสำรวจมากขึ้น"), href: "/signup?program=playroom-2h", cta: text("Request 2 hours", "ขอจอง 2 ชั่วโมง"), featured: true, tone: "green" }),
      priceCard({ tag: text("After initial entry", "หลังซื้อค่าเข้า"), title: text("Additional Hour", "เพิ่มเวลา 1 ชั่วโมง"), price: "80 THB", desc: text("Available only after purchasing an initial one-hour or two-hour child entry, subject to capacity.", "ซื้อเพิ่มได้หลังจากซื้อค่าเข้าเด็ก 1 หรือ 2 ชั่วโมงแล้ว และขึ้นอยู่กับจำนวนที่รองรับได้"), href: "/signup?program=playroom-extra-hour", cta: text("Ask to extend", "ขอเพิ่มเวลา"), tone: "coral" }),
      priceCard({ tag: text("Per hour", "ต่อชั่วโมง"), title: text("Additional Adult", "ผู้ใหญ่เพิ่มเติม"), price: "50 THB", desc: text("One adult is already included with each child entry. This fee applies to each additional adult.", "ค่าเข้าเด็กแต่ละคนรวมผู้ใหญ่ 1 คนแล้ว ค่านี้สำหรับผู้ใหญ่ที่เพิ่มเข้ามาแต่ละคน"), href: "/signup?program=playroom-extra-adult", cta: text("Add an adult", "เพิ่มผู้ใหญ่"), tone: "blue" }),
      priceCard({ tag: text("Optional activity", "กิจกรรมเสริม"), title: text("Crayon Activity", "กิจกรรมสีเทียน"), price: "45 THB", desc: text("A separate staff-guided crayon activity using additional activity materials; the included coloring sheet remains free.", "กิจกรรมสีเทียนแยกต่างหากที่ทีมงานช่วยแนะนำและมีวัสดุกิจกรรมเพิ่มเติม โดยกระดาษระบายสีที่รวมกับค่าเข้ายังคงไม่มีค่าใช้จ่าย"), href: "/signup?program=playroom-crayon", cta: text("Request activity", "ขอกิจกรรม"), tone: "green" }),
      priceCard({ tag: text("Optional activity", "กิจกรรมเสริม"), title: text("Small Soft-Clay Figure", "ฟิกเกอร์ดินปั้นนิ่มขนาดเล็ก"), price: "69 THB", desc: text("A small soft-clay figure activity. Ask staff about the figures and materials currently available.", "กิจกรรมฟิกเกอร์ดินปั้นนิ่มขนาดเล็ก สอบถามทีมงานเกี่ยวกับแบบและวัสดุที่พร้อมให้บริการ"), href: "/signup?program=playroom-clay-small", cta: text("Request small figure", "ขอฟิกเกอร์เล็ก"), tone: "green" }),
      priceCard({ tag: text("Optional activity", "กิจกรรมเสริม"), title: text("Large Soft-Clay Figure", "ฟิกเกอร์ดินปั้นนิ่มขนาดใหญ่"), price: "99 THB", desc: text("A large soft-clay figure activity. Ask staff about the figures and materials currently available.", "กิจกรรมฟิกเกอร์ดินปั้นนิ่มขนาดใหญ่ สอบถามทีมงานเกี่ยวกับแบบและวัสดุที่พร้อมให้บริการ"), href: "/signup?program=playroom-clay-large", cta: text("Request large figure", "ขอฟิกเกอร์ใหญ่"), tone: "coral" }),
    ].join("");
  }
  const cards = [
    priceCard({ tag: text("Short visit", "มาใช้บริการสั้น ๆ"), title: text("1-Hour After School Explorer", "After School Explorer 1 ชั่วโมง"), price: "199 THB", desc: text("A short after-school option for supervised play or waiting before pickup or dinner.", "ตัวเลือกสั้นหลังเลิกเรียน สำหรับเล่นหรือรอรับกลับและมื้อเย็นแบบมีทีมงานดูแล"), href: actionHref, cta: actionLabel }),
    priceCard({ tag: text("More time", "เวลามากขึ้น"), title: text("2-Hour After School Explorer", "After School Explorer 2 ชั่วโมง"), price: "300 THB", desc: text("Time to settle after school, play, draw, read, rest or complete a quiet activity.", "มีเวลาปรับตัวหลังเลิกเรียน เล่น วาดรูป อ่านหนังสือ พัก หรือทำกิจกรรมเงียบ"), href: actionHref, cta: actionLabel, tone: "green" }),
    priceCard({ tag: text("Weekday option", "ตัวเลือกวันธรรมดา"), title: text("4-Hour After School Explorer", "After School Explorer 4 ชั่วโมง"), price: "599 THB", desc: text("Four hours with play, creative activity, homework support and quiet focus. Meal care is separate.", "ดูแล 4 ชั่วโมง พร้อมเล่น กิจกรรมสร้างสรรค์ ดูแลการบ้าน และมุมสงบ โดยบริการมื้ออาหารคิดแยก"), href: actionHref, cta: actionLabel, featured: true, tone: "coral" }),
  ];
  cards.push(
      priceCard({ tag: text("Evening routine", "ช่วงเย็น"), title: text("After School Dinner & Pickup", "อาหารเย็นและรอรับกลับ"), price: text("By session", "ตามเซสชัน"), desc: text("Play, quiet activity time and meal care before parents arrive.", "เล่น ทำกิจกรรมเงียบ และดูแลมื้ออาหารก่อนผู้ปกครองมารับ"), href: actionHref, cta: actionLabel, tone: "blue" }),
      priceCard({ tag: text("Meal add-on", "เพิ่มมื้ออาหาร"), title: text("Meal Care Add-On", "บริการเสริมมื้ออาหาร"), price: "299 THB", desc: text("One child-friendly food item and one drink, with staff support during mealtime.", "อาหารเด็ก 1 รายการและเครื่องดื่ม 1 แก้ว พร้อมทีมงานช่วยดูแลระหว่างทาน"), href: actionHref, cta: actionLabel, tone: "green" })
  );
  return cards.join("");
}

const playgroup = layout({
  page: "playgroup",
  titleEn: "Kids Playroom & Creative Activities Near Mega Bangna",
  titleTh: "Kids Playroom และกิจกรรมสร้างสรรค์ ใกล้ Mega Bangna",
  description: "Parent-accompanied Kids Playroom entry from 149 THB, with optional crayon and soft-clay activities near Mega Bangna.",
  descriptionTh: "Kids Playroom ที่ผู้ปกครองอยู่ด้วย เริ่ม 149 บาท พร้อมกิจกรรมสีเทียนและดินปั้นนิ่มเสริม ใกล้เมกาบางนา",
  body: `<section class="hero"><div class="container hero-grid"><div class="hero-copy reveal visible"><span class="eyebrow">${text("Formerly Little Explorer Playgroup", "เดิมชื่อ Little Explorer Playgroup")}</span><h1>${text("Kids Playroom & Creative Activities", "Kids Playroom และกิจกรรมสร้างสรรค์")}</h1><p class="lead">${text("A flexible playroom visit for children accompanied by a parent or guardian. Staff guide activities, but the accompanying adult remains responsible for the child and must stay on the premises.", "พื้นที่เล่นแบบยืดหยุ่นสำหรับเด็กที่มากับผู้ปกครอง ทีมงานช่วยแนะนำกิจกรรม แต่ผู้ใหญ่ที่มาด้วยยังคงรับผิดชอบดูแลเด็กและต้องอยู่ภายในสถานที่")}</p><div class="hero-actions"><a class="btn btn-primary" href="#sessions">${text("View Playroom Menu", "ดูเมนู Playroom")}</a><a class="btn btn-secondary" href="/signup?program=playroom-general">${text("Register Interest", "ลงทะเบียนความสนใจ")}</a></div><p class="small" style="margin-top:14px">${text("Prices are per child. Each child entry includes one accompanying adult and one coloring sheet.", "ราคาคิดต่อเด็ก 1 คน ค่าเข้าเด็กแต่ละคนรวมผู้ใหญ่ที่มาด้วย 1 คนและกระดาษระบายสี 1 แผ่น")}</p></div><div class="hero-art reveal visible"><div class="gallery-item environment-card" style="width:min(100%,520px);min-height:520px">${imageTag({ file: "environment-play-area.webp", className: "environment-photo", alt: text("Kids' play area", "โซนเล่นสำหรับเด็ก"), eager: true })}<div class="caption"><strong>${text("Play, create and explore together", "เล่น สร้างสรรค์ และสำรวจไปด้วยกัน")}</strong></div></div></div></div></section>
<section id="sessions" class="section fawn"><div class="container"><div class="section-head"><span class="eyebrow">${text("New Playroom menu", "เมนู Playroom ใหม่")}</span><h2>${text("Entry, extra time and optional creative activities", "ค่าเข้า เวลาเพิ่มเติม และกิจกรรมสร้างสรรค์เสริม")}</h2><p class="kicker">${text("The additional-hour price is available only after an initial entry. One adult and one coloring sheet are included per child entry.", "ราคาเพิ่มเวลาใช้ได้หลังซื้อค่าเข้าแล้วเท่านั้น ค่าเข้าเด็กแต่ละคนรวมผู้ใหญ่ 1 คนและกระดาษระบายสี 1 แผ่น")}</p></div><div class="plan-grid">${sessionMenuCards("playgroup")}</div></div></section>
<section class="section mint"><div class="container two-col section-grid"><div><span class="eyebrow">${text("Clear supervision", "กติกาการดูแลที่ชัดเจน")}</span><h2>${text("Staff guide activities; parents stay responsible", "ทีมงานแนะนำกิจกรรม ผู้ปกครองยังคงดูแลเด็ก")}</h2><p class="kicker">${text("This is a parent-accompanied Playroom, not drop-off care. The parent or guardian must remain on the premises throughout the visit.", "Kids Playroom ไม่ใช่บริการฝากเด็ก ผู้ปกครองต้องอยู่ภายในสถานที่ตลอดการใช้บริการ")}</p></div><div class="card">${detailsList([text("One adult included per child entry", "รวมผู้ใหญ่ 1 คนต่อค่าเข้าเด็ก 1 คน"), text("One coloring sheet included", "รวมกระดาษระบายสี 1 แผ่น"), text("Additional adult: 50 THB per hour", "ผู้ใหญ่เพิ่มเติม: 50 บาทต่อชั่วโมง"), text("Optional crayon and soft-clay activities are priced separately", "กิจกรรมสีเทียนและดินปั้นนิ่มเสริมคิดราคาแยก")])}</div></div></section>
<section class="section"><div class="container"><div class="section-head"><span class="eyebrow">${text("Playroom and add-on activities", "Playroom และกิจกรรมเสริม")}</span><h2>${text("Playroom access with optional creative choices", "เข้าใช้โซนเล่น พร้อมตัวเลือกสร้างสรรค์เสริม")}</h2></div><div class="activity-grid"><article class="card activity-card"><h3>${text("Indoor play", "เล่นในร่ม")}</h3><p>${text("Toys, soft play, movement and free exploration are part of Playroom access.", "ของเล่น โซนนุ่ม การเคลื่อนไหว และการสำรวจอิสระเป็นส่วนหนึ่งของค่าเข้า Playroom")}</p></article><article class="card activity-card"><h3>${text("Included coloring", "ระบายสีที่รวมแล้ว")}</h3><p>${text("Each child entry includes one coloring sheet.", "ค่าเข้าเด็กแต่ละคนรวมกระดาษระบายสี 1 แผ่น")}</p></article><article class="card activity-card"><h3>${text("Optional crayon activity", "กิจกรรมสีเทียนเสริม")}</h3><p>${text("A separate staff-guided activity with additional materials is 45 THB.", "กิจกรรมแยกที่ทีมงานช่วยแนะนำพร้อมวัสดุเพิ่มเติม ราคา 45 บาท")}</p></article><article class="card activity-card"><h3>${text("Optional soft clay", "ดินปั้นนิ่มเสริม")}</h3><p>${text("Small and large soft-clay figure activities are 69 THB and 99 THB.", "กิจกรรมฟิกเกอร์ดินปั้นนิ่มขนาดเล็กและใหญ่ ราคา 69 บาทและ 99 บาท")}</p></article><article class="card activity-card"><h3>${text("Other play", "การเล่นอื่น ๆ")}</h3><p>${text("Reading, Lego, outdoor play or animal visits may be available depending on staff, weather and animal welfare.", "อาจมีการอ่าน เลโก้ เล่นกลางแจ้ง หรือพบสัตว์ ขึ้นอยู่กับทีมงาน สภาพอากาศ และสวัสดิภาพสัตว์")}</p></article></div></div></section>
<section class="section mint"><div class="container two-col section-grid"><div><span class="eyebrow">${text("Choose your visit", "เลือกเวลาที่เหมาะ")}</span><h2>${text("Start with one or two hours, then extend if space allows", "เริ่ม 1 หรือ 2 ชั่วโมง แล้วเพิ่มเวลาได้หากมีพื้นที่")}</h2><p class="kicker">${text("Choose an initial entry based on your child's energy and your family's schedule. Ask staff before extending the visit.", "เลือกค่าเข้าครั้งแรกตามพลังของเด็กและตารางครอบครัว แล้วสอบถามทีมงานก่อนเพิ่มเวลา")}</p></div><div class="card">${detailsList([text("1-hour entry: 149 THB per child", "ค่าเข้า 1 ชั่วโมง: 149 บาทต่อเด็ก"), text("2-hour entry: 249 THB per child", "ค่าเข้า 2 ชั่วโมง: 249 บาทต่อเด็ก"), text("Additional hour after entry: 80 THB", "เพิ่มเวลา 1 ชั่วโมงหลังซื้อค่าเข้า: 80 บาท")])}</div></div></section>
<section class="section fawn"><div class="container"><div class="section-head"><span class="eyebrow">${text("Important details", "รายละเอียดสำคัญ")}</span><h2>${text("Before using the Kids Playroom", "ก่อนใช้ Kids Playroom")}</h2></div><div class="card">${detailsList(sharedDetails)}</div></div></section>`
});

const creative = layout({
  page: "creative",
  titleEn: "After-School Care in Bangna Near Mega Bangna | Siamese Cat",
  titleTh: "ดูแลเด็กหลังเลิกเรียน บางนา ใกล้ Mega Bangna | Siamese Cat",
  description: "After-school care with play, homework support, creative activities, dinner support and pickup routines.",
  descriptionTh: "ดูแลหลังเลิกเรียน พร้อมการเล่น ดูแลการบ้าน กิจกรรมสร้างสรรค์ มื้อเย็น และรอผู้ปกครองมารับ",
  body: `<section class="hero"><div class="container hero-grid"><div class="hero-copy reveal visible"><span class="eyebrow">${text("Play • Homework • Create • Dinner • Pickup", "เล่น • การบ้าน • สร้างสรรค์ • อาหารเย็น • รับกลับ")}</span><h1>${text("After School Explorer Program", "โปรแกรม After School Explorer")}</h1><p class="lead">${text("A safe, fun and meaningful place after school. Children can play, finish simple homework, enjoy creative activities, have dinner and wait comfortably for pickup.", "พื้นที่ปลอดภัย สนุก และมีความหมายหลังเลิกเรียน เด็กได้เล่น ทำการบ้านง่าย ๆ ทำกิจกรรมสร้างสรรค์ ทานอาหารเย็น และรอรับกลับอย่างสบายใจ")}</p><div class="hero-actions"><a class="btn btn-primary" href="${CONTACT_URL}">${text("Contact Us", "ติดต่อเรา")}</a></div><p class="small" style="margin-top:14px">${text("This is supervised small-group after-school support, not private one-on-one nanny service.", "เป็นโปรแกรมหลังเลิกเรียนแบบกลุ่มเล็กที่มีทีมงานดูแล ไม่ใช่บริการพี่เลี้ยงส่วนตัวแบบตัวต่อตัว")}</p></div><div class="hero-art reveal visible"><div class="gallery-item environment-card" style="width:min(100%,520px);min-height:520px">${imageTag({ file: "environment-creative-room.webp", className: "environment-photo", alt: text("The Creative Club activity room", "ห้องกิจกรรมครีเอทีฟคลับ"), eager: true })}<div class="caption"><strong>${text("A real space to settle, focus and create", "พื้นที่จริงสำหรับพัก โฟกัส และสร้างสรรค์")}</strong></div></div></div></div></section>
<section id="sessions" class="section fawn"><div class="container"><div class="section-head"><span class="eyebrow">${text("After School Explorer menu", "เมนู After School Explorer")}</span><h2>${text("Short care, longer care, dinner and pickup support", "ดูแลสั้น ดูแลยาว อาหารเย็น และรอรับกลับ")}</h2></div><div class="plan-grid">${sessionMenuCards("creative")}</div></div></section>
<section class="section fawn"><div class="container"><div class="section-head"><span class="eyebrow">${text("What children can do after school", "เด็กทำอะไรได้บ้างหลังเลิกเรียน")}</span><h2>${text("Homework, creativity, play and time to recharge", "การบ้าน ความสร้างสรรค์ การเล่น และเวลาพักใจ")}</h2><p class="kicker">${text("Activities vary by child age, session length, staff schedule and weather.", "กิจกรรมแตกต่างกันตามอายุเด็ก ระยะเวลาเซสชัน ตารางทีมงาน และสภาพอากาศ")}</p></div><div class="activity-grid"><article class="card activity-card"><h3>${text("Homework & reading", "การบ้านและอ่านหนังสือ")}</h3><p>${text("A calm place for simple homework, reading and quiet focus with staff support.", "พื้นที่สงบสำหรับการบ้านง่าย ๆ อ่านหนังสือ และโฟกัส โดยมีทีมงานช่วยดูแล")}</p></article><article class="card activity-card"><h3>${text("Creative activities", "กิจกรรมสร้างสรรค์")}</h3><p>${text("Drawing, coloring, clay, Lego, crafts and small projects.", "วาดรูป ระบายสี ดินปั้น เลโก้ งานประดิษฐ์ และโปรเจกต์เล็ก ๆ")}</p></article><article class="card activity-card"><h3>${text("Play & recharge", "เล่นและเติมพลัง")}</h3><p>${text("Indoor toys, soft play, group activities or outdoor garden play when available.", "ของเล่นในร่ม โซนนุ่ม กิจกรรมกลุ่ม หรือเล่นสวนเมื่อพร้อม")}</p></article><article class="card activity-card"><h3>${text("Quiet time", "เวลาสงบ")}</h3><p>${text("Children can rest and settle after the school day without being rushed.", "เด็กได้พักและปรับตัวหลังวันเรียนโดยไม่ต้องเร่งรีบ")}</p></article><article class="card activity-card"><h3>${text("Animal visits", "พบสัตว์")}</h3><p>${text("Supervised visits with cats, rabbits or turtles when available.", "พบแมว กระต่าย หรือเต่าแบบมีทีมงานดูแลเมื่อพร้อม")}</p></article></div></div></section>
<section class="section mint"><div class="container"><div class="section-head center"><span class="eyebrow">${text("Suggested after-school flow", "ตัวอย่างลำดับหลังเลิกเรียน")}</span><h2>${text("A calm routine between school and home", "กิจวัตรสงบระหว่างโรงเรียนและบ้าน")}</h2></div><div class="paw-timeline reveal"><div class="paw-step"><div class="paw-node">1</div><div><h3>${text("Arrive & settle", "มาถึงและปรับตัว")}</h3><p class="small">${text("Put down bags, wash hands and take a short break.", "วางกระเป๋า ล้างมือ และพักสั้น ๆ")}</p></div></div><div class="paw-step"><div class="paw-node">2</div><div><h3>${text("Homework or quiet focus", "การบ้านหรือโฟกัสเงียบ")}</h3><p class="small">${text("Staff support the environment, reminders and basic clarification where appropriate.", "ทีมงานช่วยจัดบรรยากาศ เตือน และอธิบายเบื้องต้นเมื่อเหมาะสม")}</p></div></div><div class="paw-step"><div class="paw-node">3</div><div><h3>${text("Create & play", "สร้างสรรค์และเล่น")}</h3><p class="small">${text("Drawing, coloring, clay, Lego, reading, indoor play or outdoor play when available.", "วาดรูป ระบายสี ดินปั้น เลโก้ อ่านหนังสือ เล่นในร่มหรือกลางแจ้งเมื่อพร้อม")}</p></div></div><div class="paw-step"><div class="paw-node">4</div><div><h3>${text("Dinner & pickup", "อาหารเย็นและรับกลับ")}</h3><p class="small">${text("Meal care can be requested in advance before parent pickup.", "สามารถขอบริการดูแลมื้ออาหารล่วงหน้าก่อนผู้ปกครองรับกลับ")}</p></div></div></div></div></section>
<section class="section"><div class="container two-col section-grid"><div><span class="eyebrow">${text("Why parents choose After School Explorer", "เหตุผลที่ผู้ปกครองเลือก After School Explorer")}</span><h2>${text("More than a place to wait for pickup", "มากกว่าพื้นที่รอผู้ปกครองมารับ")}</h2><p class="kicker">${text("Children can rest, complete simple homework, create, play and eat before going home. Parents get flexible timing, clear options and a supervised routine.", "เด็กได้พัก ทำการบ้านง่าย ๆ สร้างสรรค์ เล่น และทานอาหารก่อนกลับบ้าน ผู้ปกครองได้เวลาที่ยืดหยุ่น ตัวเลือกชัดเจน และกิจวัตรที่มีทีมงานดูแล")}</p></div><div class="card">${detailsList([text("Useful for working parents and busy family schedules", "เหมาะกับผู้ปกครองที่ทำงานและครอบครัวที่มีตารางแน่น"), text("Homework support without claiming private tutoring", "ช่วยดูแลการบ้านโดยไม่ใช่การสอนพิเศษตัวต่อตัว"), text("Dinner and evening pickup support available", "มีตัวเลือกดูแลมื้อเย็นและรอรับกลับช่วงเย็น")])}</div></div></section>
<section class="section fawn"><div class="container"><div class="section-head"><span class="eyebrow">${text("Important details", "รายละเอียดสำคัญ")}</span><h2>${text("Before joining After School Explorer", "ก่อนเข้าร่วม After School Explorer")}</h2></div><div class="card">${detailsList([...sharedDetails, text("Meal care should be requested in advance when possible.", "ควรแจ้งบริการดูแลมื้ออาหารล่วงหน้าเมื่อเป็นไปได้"), text("Staff support homework monitoring and quiet focus, but this is not formal one-on-one tutoring.", "ทีมงานช่วยดูแลการบ้านและมุมโฟกัส แต่ไม่ใช่การสอนพิเศษตัวต่อตัว")])}</div></div></section>`
});

// Retained only as a generator key for old static deployments. Next.js
// permanently redirects both localized public URLs to the rewritten Playroom.
const littleExplorerProgram = playgroup;

const membership = layout({
  page: "membership",
  titleEn: "Membership | Siamese Cat Creative Club",
  titleTh: "สมาชิก | Siamese Cat Creative Club",
  description: "After School Explorer plans arranged around each child's weekday routine, pickup time and meal needs.",
  descriptionTh: "แผน After School Explorer ที่จัดตามกิจวัตรวันธรรมดา เวลารับกลับ และความต้องการมื้ออาหารของเด็กแต่ละคน",
  body: `<section class="hero" style="min-height:560px"><div class="container hero-grid"><div class="hero-copy reveal visible"><span class="eyebrow">${text("After School plans", "แผน After School")}</span><h1>${text("Regular plans for After School Explorer", "แผนสำหรับใช้ After School Explorer เป็นประจำ")}</h1><p class="lead">${text("Playroom memberships have been retired. After School Explorer passes remain available and are arranged with the team around the child's weekly routine, pickup time and meal needs.", "ยกเลิกสมาชิก Playroom แล้ว ส่วนบัตร After School Explorer ยังคงมีให้บริการ โดยทีมงานจะจัดตามตารางประจำสัปดาห์ เวลารับกลับ และความต้องการมื้ออาหารของเด็ก")}</p><div class="hero-actions"><a class="btn btn-primary" href="${CONTACT_URL}">${text("Arrange an After School plan", "จัดแผน After School")}</a><a class="btn btn-secondary" href="/creative">${text("See After School prices", "ดูราคา After School")}</a></div></div><div class="hero-art reveal visible"><div class="card soft-mint"><h2>${text("One membership path", "สมาชิกสำหรับบริการเดียว")}</h2>${detailsList([text("After School Explorer plans are arranged to fit the child's routine", "แผน After School Explorer จัดให้ตรงกับกิจวัตรของเด็ก"), text("Kids Playroom visits use the published entry and add-on menu without memberships", "Kids Playroom ใช้ราคาค่าเข้าและกิจกรรมเสริมที่ประกาศ โดยไม่มีสมาชิก")])}</div></div></div></section>
<section class="section"><div class="container"><div class="section-head"><span class="eyebrow">${text("After School Explorer", "After School Explorer")}</span><h2>${text("After-school memberships", "สมาชิกหลังเลิกเรียน")}</h2><p class="kicker">${text("The team confirms the schedule, pickup routine and meal support before arranging a regular pass.", "ทีมงานจะยืนยันตาราง กิจวัตรรับกลับ และบริการมื้ออาหารก่อนจัดบัตรสำหรับมาเป็นประจำ")}</p></div><div class="plan-grid">${priceCard({ tag: text("Weekday routine", "กิจวัตรวันธรรมดา"), title: text("Weekday After School Pass", "บัตรดูแลหลังเลิกเรียนวันธรรมดา"), price: text("By arrangement", "จัดตามข้อตกลง"), desc: text("For regular supervised play, homework focus, creative activities and meal care if added.", "สำหรับการเล่นหลังเลิกเรียน การบ้าน กิจกรรมสร้างสรรค์ และการดูแลมื้ออาหารหากต้องการ"), href: CONTACT_URL, cta: text("Contact Us", "ติดต่อเรา"), tone: "blue" })}${priceCard({ tag: text("Focus + create", "โฟกัส + สร้างสรรค์"), title: text("Homework & Creative Pass", "บัตรการบ้านและกิจกรรมสร้างสรรค์"), price: text("By arrangement", "จัดตามข้อตกลง"), desc: text("For children who benefit from calm homework or reading time before creative play.", "เหมาะกับเด็กที่ต้องการเวลาเงียบสำหรับการบ้านหรืออ่านหนังสือก่อนเล่นสร้างสรรค์"), href: CONTACT_URL, cta: text("Contact Us", "ติดต่อเรา"), tone: "green" })}${priceCard({ tag: text("Late pickup", "รับกลับเย็น"), title: text("Dinner & Late Pickup Pass", "บัตรมื้อเย็นและรับกลับช่วงค่ำ"), price: text("By arrangement", "จัดตามข้อตกลง"), desc: text("For working parents who regularly need dinner support and evening pickup care.", "เหมาะกับผู้ปกครองที่ต้องการดูแลมื้ออาหารและรอรับกลับช่วงเย็นเป็นประจำ"), href: CONTACT_URL, cta: text("Contact Us", "ติดต่อเรา"), featured: true, tone: "coral" })}</div></div></section>`
});

const dinner = layout({
  page: "dinner",
  titleEn: "Meal Plans | Siamese Cat Creative Club",
  titleTh: "แผนมื้ออาหาร | Siamese Cat Creative Club",
  description: "After School Explorer Meal Care Add-On with one child-friendly food item and one drink.",
  descriptionTh: "บริการเสริมมื้ออาหาร After School Explorer พร้อมอาหารเด็ก 1 รายการและเครื่องดื่ม 1 แก้ว",
  body: `<section class="hero" style="min-height:560px"><div class="container hero-grid"><div class="hero-copy reveal visible"><span class="eyebrow">${text("After School meal care", "มื้ออาหาร After School")}</span><h1>${text("Meal Care for After School Explorer", "Meal Care สำหรับ After School Explorer")}</h1><p class="lead">${text("The 299 THB Meal Care Add-On is available for After School Explorer. Kids Playroom entry does not include a meal-care value.", "บริการเสริม Meal Care ราคา 299 บาทมีสำหรับ After School Explorer ส่วนค่าเข้า Kids Playroom ไม่รวมมูลค่ามื้ออาหาร")}</p><div class="hero-actions"><a class="btn btn-primary" href="/signup?program=creative-meal">${text("Request Meal Care", "ขอเพิ่ม Meal Care")}</a><a class="btn btn-secondary" href="/creative">${text("See After School Explorer", "ดู After School Explorer")}</a></div></div><div class="hero-art reveal visible"><div class="cafe-brand-hero"><a class="cafe-logo-panel" href="${CAFE_URL}" aria-label="${text("Visit Siamese Cat Cafe website", "ไปยังเว็บไซต์ Siamese Cat Cafe")}">${imageTag({ file: "siamese-cat-cafe-logo.webp", className: "cafe-logo-image", alt: "Siamese Cat Cafe", eager: true, sizes: "320px" })}</a><div class="cafe-brand-pills"><span class="info-pill">${text("Child-friendly meals", "อาหารที่เหมาะกับเด็ก")}</span><span class="info-pill">${text("Cafe drinks", "เครื่องดื่มจากคาเฟ่")}</span></div></div></div></div></section>
<section class="section fawn"><div class="container"><div class="section-head"><span class="eyebrow">${text("After School Explorer", "After School Explorer")}</span><h2>${text("One clear meal add-on", "บริการเสริมมื้ออาหารที่ชัดเจน")}</h2></div><div class="plan-grid">${priceCard({ tag: text("After school", "หลังเลิกเรียน"), title: text("Meal Care Add-On", "บริการเสริมมื้ออาหาร"), price: "299 THB", desc: text("One child-friendly food item and one drink, with staff supporting the child during mealtime.", "อาหารเด็ก 1 รายการและเครื่องดื่ม 1 แก้ว พร้อมทีมงานช่วยดูแลระหว่างทาน"), href: "/creative", cta: text("See After School Explorer", "ดู After School Explorer"), featured: true, tone: "coral" })}${priceCard({ tag: text("Required", "สำคัญ"), title: text("Allergy and food notes", "อาการแพ้และข้อจำกัดอาหาร"), price: text("Tell us early", "แจ้งล่วงหน้า"), desc: text("Parents should inform staff about allergies, food restrictions or special eating habits before the session.", "ผู้ปกครองควรแจ้งอาการแพ้ ข้อจำกัดอาหาร หรือพฤติกรรมการทานก่อนเซสชัน"), href: "/signup", cta: text("Register details", "ลงทะเบียนข้อมูล"), tone: "blue" })}</div></div></section>
<section class="section"><div class="container"><div class="section-head center"><span class="eyebrow">${text("Mealtime flow", "ขั้นตอนมื้ออาหาร")}</span><h2>${text("Simple support before pickup", "ดูแลง่าย ๆ ก่อนรับกลับ")}</h2></div><div class="paw-timeline reveal"><div class="paw-step"><div class="paw-node">1</div><div><h3>${text("Request meal care", "แจ้ง Meal Care")}</h3><p class="small">${text("Ask in advance when possible.", "แจ้งล่วงหน้าเมื่อเป็นไปได้")}</p></div></div><div class="paw-step"><div class="paw-node">2</div><div><h3>${text("Share food notes", "แจ้งข้อมูลอาหาร")}</h3><p class="small">${text("Allergies, restrictions and eating habits matter.", "อาการแพ้ ข้อจำกัด และพฤติกรรมการทานเป็นข้อมูลสำคัญ")}</p></div></div><div class="paw-step"><div class="paw-node">3</div><div><h3>${text("Eat with support", "ทานพร้อมการดูแล")}</h3><p class="small">${text("Staff remind, support and keep children comfortable.", "ทีมงานช่วยเตือน ดูแล และให้เด็กสบายใจ")}</p></div></div><div class="paw-step"><div class="paw-node">4</div><div><h3>${text("Ready for pickup", "พร้อมรับกลับ")}</h3><p class="small">${text("Useful for longer care or evening pickup.", "เหมาะกับการดูแลยาวหรือรอรับช่วงเย็น")}</p></div></div></div></div></section>`
});

const inside = layout({
  page: "inside",
  titleEn: "Kids Activity Space Near Mega Bangna | Inside the Club",
  titleTh: "พื้นที่กิจกรรมเด็ก ใกล้ Mega Bangna | ภายในคลับ",
  description: "Spaces, safety routines and activities for children at Siamese Cat Creative Club.",
  descriptionTh: "พื้นที่ กิจวัตรด้านความปลอดภัย และกิจกรรมสำหรับเด็กที่ Siamese Cat Creative Club",
  body: `<section class="hero" style="min-height:560px"><div class="container hero-grid"><div class="hero-copy reveal visible"><span class="eyebrow">${text("Inside the Club", "ภายในคลับ")}</span><h1>${text("A real space for play, focus, meals and pickup", "พื้นที่จริงสำหรับเล่น โฟกัส มื้ออาหาร และรอรับกลับ")}</h1><p class="lead">${text("Children are guided through supervised areas based on the service booked: playroom time, creative tables, quiet focus, meal support and animal visits when available.", "เด็กจะใช้พื้นที่ตามบริการที่จอง เช่น โซนเล่น โต๊ะสร้างสรรค์ มุมโฟกัส ดูแลมื้ออาหาร และพบสัตว์เมื่อพร้อมให้บริการ")}</p><div class="hero-actions"><a class="btn btn-primary" href="/playgroup">${text("Playgroup", "เพลย์กรุ๊ป")}</a><a class="btn btn-secondary" href="/creative">${text("Creative Club", "ครีเอทีฟคลับ")}</a></div></div><div class="hero-art reveal visible"><div class="gallery-item environment-card" style="width:min(100%,520px);min-height:520px">${imageTag({ file: "environment-creative-room.webp", className: "environment-photo", alt: text("Creative room", "ห้องกิจกรรมสร้างสรรค์"), eager: true })}<div class="caption"><strong>${text("Creative and calm activity space", "พื้นที่กิจกรรมสร้างสรรค์และสงบ")}</strong></div></div></div></div></section>
<section class="section fawn"><div class="container"><div class="section-head"><span class="eyebrow">${text("What children may do", "เด็กอาจได้ทำอะไร")}</span><h2>${text("Activities depend on age, schedule, weather and session length", "กิจกรรมขึ้นอยู่กับอายุ ตาราง สภาพอากาศ และระยะเวลาเซสชัน")}</h2></div><div class="activity-grid"><article class="card activity-card"><h3>${text("Indoor playroom", "โซนเล่นในร่ม")}</h3><p>${text("Toys, soft play and simple group play.", "ของเล่น โซนนุ่ม และการเล่นกลุ่มง่าย ๆ")}</p></article><article class="card activity-card"><h3>${text("Creative tables", "โต๊ะสร้างสรรค์")}</h3><p>${text("Drawing, coloring, clay, Lego and small projects.", "วาดรูป ระบายสี ดินปั้น เลโก้ และโปรเจกต์เล็ก ๆ")}</p></article><article class="card activity-card"><h3>${text("Quiet focus", "มุมโฟกัส")}</h3><p>${text("Homework monitoring, reading and rest.", "ดูแลการบ้าน อ่านหนังสือ และพักผ่อน")}</p></article><article class="card activity-card"><h3>${text("Meal support", "ดูแลมื้ออาหาร")}</h3><p>${text("Meal care for longer stays or evening pickup.", "Meal Care สำหรับอยู่ยาวหรือรอรับช่วงเย็น")}</p></article><article class="card activity-card"><h3>${text("Animal visits", "พบสัตว์")}</h3><p>${text("Cats, rabbits or turtles when available, with gentle staff guidance.", "แมว กระต่าย หรือเต่าเมื่อพร้อม พร้อมทีมงานแนะนำอย่างอ่อนโยน")}</p></article></div></div></section>
<section class="section"><div class="container"><div class="section-head"><span class="eyebrow">${text("The environment", "บรรยากาศ")}</span><h2>${text("Designed for flexible care, not a fixed classroom", "ออกแบบเพื่อการดูแลแบบยืดหยุ่น ไม่ใช่ห้องเรียนตายตัว")}</h2></div><div class="gallery-grid environment-gallery"><article class="gallery-item large environment-card environment-shop">${imageTag({ file: "environment-shop-front.webp", className: "environment-photo", alt: text("Shop front", "ด้านหน้าร้าน") })}<div class="caption"><strong>${text("Near Mega Bangna", "ใกล้เมกาบางนา")}</strong></div></article><article class="gallery-item environment-card environment-creative">${imageTag({ file: "environment-creative-room.webp", className: "environment-photo", alt: text("Creative room", "ห้องสร้างสรรค์") })}<div class="caption"><strong>${text("Creative room", "ห้องสร้างสรรค์")}</strong></div></article><article class="gallery-item environment-card environment-play">${imageTag({ file: "environment-play-area.webp", className: "environment-photo", alt: text("Play area", "โซนเล่น") })}<div class="caption"><strong>${text("Play area", "โซนเล่น")}</strong></div></article><article class="gallery-item environment-card environment-entrance">${imageTag({ file: "environment-entrance-pickup.webp", className: "environment-photo", alt: text("Entrance and pickup", "ทางเข้าและจุดรับกลับ") })}<div class="caption"><strong>${text("Pickup process", "ขั้นตอนรับกลับ")}</strong></div></article><article class="gallery-item environment-card environment-cafe">${imageTag({ file: "environment-cat-cafe-dinner.webp", className: "environment-photo", alt: text("Cafe dinner", "มื้ออาหารจากคาเฟ่"), sizes: "(max-width: 760px) calc(100vw - 24px), 360px" })}<div class="caption"><strong>${text("Meal care", "ดูแลมื้ออาหาร")}</strong></div></article></div></div></section>`
});

const firstVisit = layout({
  page: "first-visit",
  titleEn: "First Kids Playroom Visit in Bangna | What to Expect",
  titleTh: "มา Kids Playroom ครั้งแรก บางนา | เตรียมตัวอย่างไร",
  description: "Plan a parent-accompanied Kids Playroom visit or arrange separate After School Explorer care.",
  descriptionTh: "วางแผนมา Kids Playroom โดยมีผู้ปกครองอยู่ด้วย หรือจัดบริการ After School Explorer แยกต่างหาก",
  body: `<section class="hero" style="min-height:560px"><div class="container hero-grid"><div class="hero-copy reveal visible"><span class="eyebrow">${text("Start here", "เริ่มที่นี่")}</span><h1>${text("Plan your child’s first visit", "วางแผนการมาใช้บริการครั้งแรก")}</h1><p class="lead">${text("Choose a one-hour or two-hour Kids Playroom entry and stay with your child, or contact the team about separate After School Explorer care and pickup support.", "เลือกค่าเข้า Kids Playroom 1 หรือ 2 ชั่วโมงและอยู่กับเด็ก หรือสอบถามทีมงานเกี่ยวกับบริการ After School Explorer และรอรับกลับแยกต่างหาก")}</p><div class="hero-actions"><a class="btn btn-primary" href="/signup">${text("Register first", "ลงทะเบียนก่อน")}</a><a class="btn btn-secondary" href="/playgroup">${text("View Playroom menu", "ดูเมนู Playroom")}</a></div></div><div class="hero-art reveal visible"><div class="card soft-mint"><h2>${text("First visit choices", "ตัวเลือกสำหรับครั้งแรก")}</h2>${detailsList([text("Kids Playroom: 1 hour / 149 THB or 2 hours / 249 THB per child.", "Kids Playroom: 1 ชั่วโมง / 149 บาท หรือ 2 ชั่วโมง / 249 บาทต่อเด็ก"), text("Each child entry includes one adult and one coloring sheet.", "ค่าเข้าเด็กแต่ละคนรวมผู้ใหญ่ 1 คนและกระดาษระบายสี 1 แผ่น"), text("The accompanying parent or guardian stays on the premises.", "ผู้ปกครองที่มาด้วยต้องอยู่ภายในสถานที่"), text("After School Explorer remains 199 / 300 / 599 THB for 1, 2 or 4 hours.", "After School Explorer ยังคงราคา 199 / 300 / 599 บาท สำหรับ 1, 2 หรือ 4 ชั่วโมง")])}</div></div></div></section>`
});

const contact = layout({
  page: "contact",
  titleEn: "Contact & Directions Near Mega Bangna | Siamese Cat",
  titleTh: "ติดต่อและเส้นทาง ใกล้ Mega Bangna | Siamese Cat",
  description: "Contact Siamese Cat Creative Club about Kids Playroom, creative activities, After School Explorer plans or Meal Care near Mega Bangna.",
  descriptionTh: "ติดต่อ Siamese Cat Creative Club เพื่อสอบถาม Kids Playroom กิจกรรมสร้างสรรค์ แผน After School Explorer หรือ Meal Care ใกล้เมกาบางนา",
  body: `<section class="hero" style="min-height:560px"><div class="container hero-grid"><div class="hero-copy reveal visible"><span class="eyebrow">${text("Contact Us", "ติดต่อเรา")}</span><h1>${text("Tell us how we can help", "บอกเราได้เลยว่าต้องการให้ช่วยเรื่องใด")}</h1><p class="lead">${text("Send your question or tell us which service you are interested in. Our team will reply using the phone number or email you provide.", "ส่งคำถามหรือแจ้งบริการที่สนใจ ทีมงานจะติดต่อกลับทางเบอร์โทรหรืออีเมลที่คุณให้ไว้")}</p><div class="hero-actions"><a class="btn btn-line" href="https://wa.me/66952413028" target="_blank" rel="noopener">${text("WhatsApp Us", "ติดต่อทาง WhatsApp")}</a><a class="btn btn-secondary" href="mailto:Cafe@siamesecat.cafe">Cafe@siamesecat.cafe</a></div></div><div class="hero-art reveal visible"><div class="gallery-item environment-card" style="width:min(100%,520px);min-height:520px">${imageTag({ file: "environment-shop-front.webp", className: "environment-photo", alt: text("Siamese Cat Creative Club entrance", "ทางเข้า Siamese Cat Creative Club"), eager: true })}<div class="caption"><strong>${text("Near Mega Bangna", "ใกล้เมกาบางนา")}</strong></div></div></div></div></section>
<section class="section fawn"><div class="container booking-layout"><aside class="contact-panel"><div class="card contact-method-card"><span class="eyebrow">${text("Direct contact", "ช่องทางติดต่อโดยตรง")}</span><h2>${text("Reach our team", "ติดต่อทีมงาน")}</h2><div class="contact-method-list"><a href="https://wa.me/66952413028" target="_blank" rel="noopener"><strong>WhatsApp</strong><span>+66 095 241 3028</span></a><a href="mailto:Cafe@siamesecat.cafe"><strong>${text("Email", "อีเมล")}</strong><span>Cafe@siamesecat.cafe</span></a><a href="tel:+66952413028"><strong>${text("Telephone", "โทรศัพท์")}</strong><span>+66 095 241 3028</span></a><a href="${CAFE_URL}"><strong>Siamese Cat Cafe</strong><span>siamesecat.cafe</span></a></div></div></aside>
<form class="card form-card" data-contact-form novalidate><div class="section-head"><span class="eyebrow">${text("Send an inquiry", "ส่งคำถาม")}</span><h2>${text("Contact form", "แบบฟอร์มติดต่อ")}</h2><p>${text("Service selection is optional. Contact details and your message are required.", "ไม่จำเป็นต้องเลือกบริการ แต่กรุณากรอกข้อมูลติดต่อและข้อความ")}</p></div><div class="form-grid"><div class="field"><label for="contact-name">${text("Name", "ชื่อ")} *</label><input id="contact-name" name="name" type="text" autocomplete="name" maxlength="120" required><span class="field-error"></span></div><div class="field"><label for="contact-phone">${text("Contact number", "เบอร์ติดต่อ")} *</label><input id="contact-phone" name="phone" type="tel" autocomplete="tel" maxlength="30" required><span class="field-error"></span></div><div class="field full"><label for="contact-email">${text("Email", "อีเมล")} *</label><input id="contact-email" name="email" type="email" autocomplete="email" maxlength="254" required><span class="field-error"></span></div><div class="field full"><label for="contact-service">${text("Service of interest (optional)", "บริการที่สนใจ (ไม่บังคับ)")}</label><select id="contact-service" name="service"><option value="">${text("No service selected", "ยังไม่เลือกบริการ")}</option><option value="playgroup">${text("Kids Playroom & Creative Activities", "Kids Playroom และกิจกรรมสร้างสรรค์")}</option><option value="creative-club">${text("After School Explorer", "After School Explorer")}</option><option value="membership">${text("After School plans", "แผน After School")}</option><option value="meal-plans">${text("After School Meal Care", "Meal Care หลังเลิกเรียน")}</option><option value="coding-ai-en">${text("Coding with AI course in English", "คอร์ส Coding with AI ภาษาอังกฤษ")}</option><option value="coding-ai-th">${text("Coding with AI course in Thai", "คอร์ส Coding with AI ภาษาไทย")}</option></select><span class="field-error"></span></div><div class="field full"><label for="contact-message">${text("Your inquiry", "คำถามของคุณ")} *</label><textarea id="contact-message" name="message" minlength="10" maxlength="3000" required></textarea><span class="field-error"></span></div><div class="field contact-honeypot" aria-hidden="true"><label for="contact-website">Website</label><input id="contact-website" name="website" type="text" tabindex="-1" autocomplete="off"></div><label class="consent-row field full"><input name="consent" type="checkbox" required><span>${text("I agree that Siamese Cat Creative Club may use these details to respond to my inquiry.", "ฉันยินยอมให้ Siamese Cat Creative Club ใช้ข้อมูลนี้เพื่อตอบคำถามของฉัน")} <a class="text-link" href="/privacy">${text("Privacy Policy", "นโยบายความเป็นส่วนตัว")}</a><span class="field-error"></span></span></label></div><button class="btn btn-primary" type="submit">${text("Send Inquiry", "ส่งคำถาม")}</button><p class="form-status" role="status" aria-live="polite"></p></form></div></section>
<section class="section"><div class="container"><div class="section-head"><span class="eyebrow">${text("Find us", "แผนที่")}</span><h2>${text("Visit Siamese Cat Creative Club", "เดินทางมายัง Siamese Cat Creative Club")}</h2><p class="kicker">${text("46/27 Bang Na-Trat Frontage Road, Bang Kaeo, Samut Prakan 10540", "46/27 ถนนคู่ขนานบางนา-ตราด ตำบลบางแก้ว สมุทรปราการ 10540")}</p></div><div class="contact-map"><iframe title="${text("Google Map showing Siamese Cat Creative Club", "แผนที่ Google แสดง Siamese Cat Creative Club")}" src="https://www.google.com/maps?q=46%2F27%20Bang%20Na-Trat%20Frontage%20Road%2C%20Bang%20Kaeo%2C%20Samut%20Prakan%2010540&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div><div class="hero-actions" style="margin-top:20px"><a class="btn btn-secondary" href="${MAP_URL}" target="_blank" rel="noopener">${text("Open in Google Maps", "เปิดใน Google Maps")}</a></div></div></section>`
});

const faq = layout({
  page: "faq",
  titleEn: "FAQ | Siamese Cat Creative Club",
  titleTh: "คำถามที่พบบ่อย | Siamese Cat Creative Club",
  description: "Frequently asked questions about Kids Playroom, creative activities, parent supervision and After School Explorer.",
  descriptionTh: "คำถามที่พบบ่อยเกี่ยวกับ Kids Playroom กิจกรรมสร้างสรรค์ การดูแลโดยผู้ปกครอง และ After School Explorer",
  body: `<section class="section fawn"><div class="narrow"><span class="eyebrow">${text("FAQ", "คำถามที่พบบ่อย")}</span><h1>${text("Good to know before booking", "ข้อมูลควรรู้ก่อนจอง")}</h1><p class="kicker">${text("Answers about Kids Playroom entry, creative activities, parent supervision and separate After School Explorer care.", "คำตอบเกี่ยวกับค่าเข้า Kids Playroom กิจกรรมสร้างสรรค์ การดูแลโดยผู้ปกครอง และบริการ After School Explorer ที่แยกต่างหาก")}</p>
  <div class="faq-category"><h2>${text("Programs", "โปรแกรม")}</h2><div class="faq-list">
    <details class="faq-item" open><summary>${text("What is the difference between Kids Playroom and After School Explorer?", "Kids Playroom กับ After School Explorer ต่างกันอย่างไร?")}</summary><div class="faq-answer"><p>${text("Kids Playroom is a parent-accompanied visit: staff guide activities while the accompanying adult stays responsible for the child. After School Explorer is separate supervised after-school care with homework, dinner and pickup support.", "Kids Playroom เป็นการมาใช้บริการพร้อมผู้ปกครอง ทีมงานช่วยแนะนำกิจกรรม ขณะที่ผู้ใหญ่ที่มาด้วยยังคงดูแลเด็ก ส่วน After School Explorer เป็นบริการดูแลหลังเลิกเรียนแยกต่างหาก พร้อมการบ้าน อาหารเย็น และรอรับกลับ")}</p></div></details>
    <details class="faq-item"><summary>${text("Can I leave my child in the Kids Playroom?", "ฝากเด็กไว้ใน Kids Playroom ได้ไหม?")}</summary><div class="faq-answer"><p>${text("No. A parent or guardian must remain on the premises and remains responsible for the child throughout the Playroom visit.", "ไม่ได้ ผู้ปกครองต้องอยู่ภายในสถานที่และยังคงรับผิดชอบดูแลเด็กตลอดการใช้ Playroom")}</p></div></details>
    <details class="faq-item"><summary>${text("Is this tutoring?", "เป็นการสอนพิเศษหรือไม่?")}</summary><div class="faq-answer"><p>${text("No. Staff can support homework monitoring, reminders, reading and quiet focus, but this is not formal private tutoring.", "ไม่ใช่ ทีมงานช่วยดูแลการบ้าน เตือน อ่านหนังสือ และมุมโฟกัสได้ แต่ไม่ใช่การสอนพิเศษแบบตัวต่อตัว")}</p></div></details>
  </div></div>
  <div class="faq-category"><h2>${text("Prices and meal care", "ราคาและ Meal Care")}</h2><div class="faq-list">
    <details class="faq-item" open><summary>${text("What are the Kids Playroom prices?", "ราคา Kids Playroom เท่าไร?")}</summary><div class="faq-answer"><p>${text("Entry is 149 THB for 1 hour or 249 THB for 2 hours per child. An additional hour after initial entry is 80 THB. One adult and one coloring sheet are included; each additional adult is 50 THB per hour.", "ค่าเข้าต่อเด็กคือ 149 บาทสำหรับ 1 ชั่วโมง หรือ 249 บาทสำหรับ 2 ชั่วโมง เพิ่มเวลา 1 ชั่วโมงหลังซื้อค่าเข้า 80 บาท รวมผู้ใหญ่ 1 คนและกระดาษระบายสี 1 แผ่น ผู้ใหญ่เพิ่มเติมคนละ 50 บาทต่อชั่วโมง")}</p></div></details>
    <details class="faq-item"><summary>${text("What are the After School Explorer prices?", "ราคา After School Explorer คือเท่าไร?")}</summary><div class="faq-answer"><p>${text("After School Explorer starts at 199 THB for 1 hour and 300 THB for 2 hours. Weekday after-school half-day is 599 THB. Meal Care Add-On is 299 THB.", "After School Explorer เริ่มที่ 199 บาทสำหรับ 1 ชั่วโมง และ 300 บาทสำหรับ 2 ชั่วโมง หลังเลิกเรียนครึ่งวันธรรมดา 599 บาท และ Meal Care Add-On 299 บาท")}</p></div></details>
    <details class="faq-item"><summary>${text("What do the creative activity prices cover?", "ราคากิจกรรมสร้างสรรค์มีอะไรบ้าง?")}</summary><div class="faq-answer"><p>${text("The optional crayon activity is 45 THB and is separate from the included coloring sheet. Small and large soft-clay figure activities are 69 THB and 99 THB. Ask staff about the materials and figures currently available.", "กิจกรรมสีเทียนเสริมราคา 45 บาท แยกจากกระดาษระบายสีที่รวมกับค่าเข้า กิจกรรมฟิกเกอร์ดินปั้นนิ่มขนาดเล็กและใหญ่ราคา 69 บาทและ 99 บาท โปรดสอบถามทีมงานเกี่ยวกับวัสดุและแบบที่พร้อมให้บริการ")}</p></div></details>
  </div></div>
  <div class="faq-category"><h2>${text("Safety and booking", "ความปลอดภัยและการจอง")}</h2><div class="faq-list">
    <details class="faq-item" open><summary>${text("Do children need to be healthy before attending?", "เด็กต้องสุขภาพพร้อมก่อนมาไหม?")}</summary><div class="faq-answer"><p>${text("Yes. If a child is sick, has fever, strong coughing or contagious symptoms, parents should let the child rest at home.", "ต้องพร้อม หากเด็กป่วย มีไข้ ไอมาก หรือมีอาการติดต่อ ผู้ปกครองควรให้พักที่บ้าน")}</p></div></details>
    <details class="faq-item"><summary>${text("Does a parent need to stay?", "ผู้ปกครองต้องอยู่ด้วยไหม?")}</summary><div class="faq-answer"><p>${text("Yes for every Kids Playroom visit. The accompanying parent or guardian must remain on the premises. After School Explorer has a separate confirmed care and pickup process.", "ต้องอยู่ด้วยทุกครั้งสำหรับ Kids Playroom ผู้ปกครองที่มาด้วยต้องอยู่ภายในสถานที่ ส่วน After School Explorer มีขั้นตอนดูแลและรับกลับที่ยืนยันแยกต่างหาก")}</p></div></details>
    <details class="faq-item"><summary>${text("Are socks required?", "ต้องใส่ถุงเท้าไหม?")}</summary><div class="faq-answer"><p>${text("Socks are not required inside the kids' play area, but socks are required if entering the cat room.", "ในโซนเด็กไม่จำเป็นต้องใส่ถุงเท้า แต่ต้องใส่ถุงเท้าหากเข้าห้องแมว")}</p></div></details>
    <details class="faq-item"><summary>${text("Are animal visits always included?", "พบสัตว์ได้ทุกครั้งไหม?")}</summary><div class="faq-answer"><p>${text("No. Cat, rabbit or turtle visits depend on availability, staff schedule, child readiness and animal welfare. All interaction is supervised.", "ไม่เสมอไป การพบแมว กระต่าย หรือเต่าขึ้นอยู่กับความพร้อม ตารางทีมงาน ความพร้อมของเด็ก และสวัสดิภาพสัตว์ โดยมีทีมงานดูแลเสมอ")}</p></div></details>
    <details class="faq-item"><summary>${text("Is advance booking required?", "ต้องจองล่วงหน้าหรือไม่?")}</summary><div class="faq-answer"><p>${text("Advance booking is strongly recommended, especially weekends, holidays and evening pickup times.", "แนะนำให้จองล่วงหน้าอย่างยิ่ง โดยเฉพาะวันหยุด ช่วงปิดเทอม และเวลารอรับกลับช่วงเย็น")}</p></div></details>
  </div></div>
</div></section>`
});

const codingGamesSection = `<section class="coding-section coding-games coding-games--proof" aria-labelledby="student-projects-title"><div class="container"><div class="coding-section__intro"><span class="coding-eyebrow">${text("Real student work", "ผลงานจริงของนักเรียน")}</span><h2 id="student-projects-title">${text("Games built by our students", "เกมที่สร้างโดยนักเรียนของเรา")}</h2><p>${text("Our students planned, built and tested these playable projects with instructor guidance and a responsible AI-assisted workflow.", "นักเรียนของเราได้วางแผน สร้าง และทดสอบโปรเจกต์ที่เล่นได้จริงเหล่านี้ โดยมีผู้สอนคอยแนะนำและใช้ AI อย่างมีขั้นตอน")}</p></div><div class="coding-game-grid">
<article class="coding-game coding-game--maze"><div class="coding-game__media coding-game__media--maze"><img src="/game/learn_python/assets/game-logo-car-maze-learn-python-v2.webp" width="220" height="220" alt="Car Maze: Learn Python" loading="lazy" decoding="async"></div><div class="coding-game__body"><h3>Car Maze: Learn Python</h3><p class="coding-game__summary">${text("A bilingual, 58-mission game where players write Python commands to guide a car through puzzle worlds.", "เกมสองภาษา 58 ภารกิจที่ให้ผู้เล่นเขียนคำสั่ง Python เพื่อพารถผ่านโลกปริศนา")}</p><dl class="coding-game__facts"><div><dt>${text("Use case", "ใช้ทำอะไร")}</dt><dd>${text("Make sequences, conditions, loops, functions and debugging visible through immediate movement and feedback.", "ทำให้ลำดับคำสั่ง เงื่อนไข ลูป ฟังก์ชัน และการแก้บั๊กมองเห็นได้จากการเคลื่อนไหวและผลลัพธ์ทันที")}</dd></div><div><dt>${text("Built with", "สร้างด้วย")}</dt><dd>${text("Python learning tasks inside a React and JavaScript browser app.", "โจทย์เรียนรู้ Python ภายในเว็บแอป React และ JavaScript")}</dd></div><div><dt>${text("Why", "สร้างขึ้นทำไม")}</dt><dd>${text("To turn abstract code into a concrete problem children can plan, run, inspect and improve.", "เพื่อเปลี่ยนโค้ดที่เป็นนามธรรมให้เป็นโจทย์ที่เด็กวางแผน รัน สังเกต และปรับปรุงได้")}</dd></div></dl><div class="coding-game__actions"><a class="coding-button coding-button--primary" href="/coding-with-ai/car-maze">${text("Read the project story", "อ่านเรื่องราวโปรเจกต์")}</a><a class="coding-text-link" href="/game/learn_python/${currentLanguage}/">${text("Play the game", "เล่นเกม")}</a></div></div></article>
<article class="coding-game coding-game--catdog"><div class="coding-game__media coding-game__media--catdog"><img src="/game/cat-vs-dog/assets/img/logo.png" width="640" height="361" alt="Siamese Cat vs Dog 1986" loading="lazy" decoding="async"></div><div class="coding-game__body"><h3>Siamese Cat vs Dog 1986</h3><p class="coding-game__summary">${text("A bilingual retro browser arcade game with a jetpack Siamese cat, enemy waves, scoring, levels and boss battles.", "เกมอาร์เคดเรโทรสองภาษาบนเบราว์เซอร์ มีแมววิเชียรมาศติดเจ็ตแพ็ก ฝูงศัตรู คะแนน ด่าน และบอส")}</p><dl class="coding-game__facts"><div><dt>${text("Use case", "ใช้ทำอะไร")}</dt><dd>${text("Show how input, movement, collisions, game state, difficulty, sound and feedback work together in a complete game.", "แสดงให้เห็นว่าการควบคุม การเคลื่อนที่ การชน สถานะเกม ระดับความยาก เสียง และผลตอบสนองทำงานร่วมกันอย่างไร")}</dd></div><div><dt>${text("Built with", "สร้างด้วย")}</dt><dd>${text("Plain HTML, CSS and JavaScript with an HTML5 Canvas game engine.", "HTML, CSS และ JavaScript แบบไม่ใช้เฟรมเวิร์ก พร้อมเอนจินเกมบน HTML5 Canvas")}</dd></div><div><dt>${text("Why", "สร้างขึ้นทำไม")}</dt><dd>${text("To learn how a creative idea becomes a responsive, bilingual product with real systems and testing.", "เพื่อเรียนรู้ว่าไอเดียสร้างสรรค์พัฒนาเป็นผลิตภัณฑ์สองภาษาที่ตอบสนองได้ พร้อมระบบจริงและการทดสอบได้อย่างไร")}</dd></div></dl><div class="coding-game__actions"><a class="coding-button coding-button--primary" href="/coding-with-ai/cat-vs-dog">${text("Read the project story", "อ่านเรื่องราวโปรเจกต์")}</a><a class="coding-text-link" href="/game/cat-vs-dog/${currentLanguage}/">${text("Play the game", "เล่นเกม")}</a></div></div></article>
</div></div></section>`;

const codingWithAi = layout({
  page: "coding-with-ai",
  active: "coding-with-ai",
  titleEn: "AI Coding Classes for Kids in Bangna | Ages 6+",
  titleTh: "คอร์สเขียนโค้ดด้วย AI สำหรับเด็ก 6 ปีขึ้นไป บางนา",
  description: "A 12-lesson, in-person AI coding course for kids aged 6+. Plan, design and build a first game or mini app. Free 30-minute readiness trial.",
  descriptionTh: "คอร์สเขียนโค้ดด้วย AI แบบเรียนที่สถานที่จริง 12 บท สำหรับเด็ก 6 ปีขึ้นไป วางแผน ออกแบบ และสร้างเกมหรือมินิแอป ทดลองเรียนฟรี 30 นาที",
  ogImage: "https://creative.siamesecat.cafe/main-site/assets/coding-with-ai-hero.webp",
  ogImageWidth: 1568,
  ogImageHeight: 1003,
  ogImageAlt: text("A child planning and building a game with a coding instructor", "เด็กวางแผนและสร้างเกมกับผู้สอนเขียนโค้ด"),
  extraHead: `<link rel="preload" as="image" href="${assetUrl("coding-with-ai-hero.webp")}"><link rel="stylesheet" href="/main-site/assets/coding-with-ai.css?v=${CODING_CSS_VERSION}">`,
  body: `<div class="coding-page">
<section class="coding-hero" aria-labelledby="coding-title"><div class="coding-hero__visual">${imageTag({ file: "coding-with-ai-hero.webp", className: "coding-hero__image", alt: text("Illustration of a child turning a game sketch and flowchart into a playable maze game with guidance from an instructor", "ภาพเด็กเปลี่ยนแบบร่างเกมและผังงานให้เป็นเกมเขาวงกตที่เล่นได้ โดยมีผู้สอนคอยแนะนำ"), eager: true, sizes: "100vw" })}</div><div class="container coding-hero__content"><div class="coding-hero__copy"><span class="coding-eyebrow">${text("In-person course for ages 6+", "คอร์สเรียนที่สถานที่จริง สำหรับเด็ก 6 ปีขึ้นไป")}</span><h1 id="coding-title">${text("Teach your child to think before AI writes", "ให้ลูกคิดเป็น ก่อนให้ AI ช่วยเขียน")}</h1><p>${text("A 12-lesson, in-person course where children plan, design and build their first game or mini app with guided AI.", "คอร์ส 12 บทที่เด็กจะได้คิด วางแผน ออกแบบ และสร้างเกมหรือมินิแอปแรกของตัวเอง โดยใช้ AI อย่างมีผู้สอนดูแล")}</p><div class="coding-actions"><a class="coding-button coding-button--primary" href="/contact?service=${currentLanguage === "en" ? "coding-ai-en" : "coding-ai-th"}" data-course-interest>${text("Register for the free trial", "ลงทะเบียนทดลองเรียนฟรี")}</a><a class="coding-button coding-button--secondary" href="#course-plan">${text("View the 12-lesson plan", "ดูแผนการเรียน 12 บท")}</a></div></div></div></section>

<section class="coding-facts" aria-label="${text("Course facts", "ข้อมูลคอร์ส")}"><div class="container coding-facts__grid"><div><strong>12</strong><span>${text("guided lessons", "บทเรียนแบบมีผู้สอน")}</span></div><div><strong>90</strong><span>${text("minutes per lesson", "นาทีต่อบทเรียน")}</span></div><div><strong>6+</strong><span>${text("readiness assessed individually", "ประเมินความพร้อมเป็นรายบุคคล")}</span></div><div><strong>30</strong><span>${text("minute free trial", "นาทีทดลองเรียนฟรี")}</span></div></div></section>

${codingGamesSection}

<section class="coding-section coding-benefits coding-benefits--compact"><div class="container"><div class="coding-section__intro"><h2>${text("AI can write code. Your child still needs to think.", "AI เขียนโค้ดได้ แต่ลูกยังต้องคิดเป็น")}</h2><p>${text("The lasting advantage is not memorising syntax. It is learning how to turn a vague idea into a clear system, test it and improve it.", "ข้อได้เปรียบที่อยู่กับเด็กไม่ใช่การท่องจำคำสั่ง แต่คือการเปลี่ยนไอเดียที่ยังไม่ชัดให้เป็นระบบ ทดลอง และปรับปรุงจนใช้งานได้")}</p></div><div class="coding-benefit-grid"><article class="coding-benefit coding-benefit--wide"><h3>${text("From “I have an idea” to “Here is my plan”", "จาก “หนูมีไอเดีย” เป็น “นี่คือแผนของหนู”")}</h3><p>${text("Children practise defining a goal, breaking it into smaller jobs and deciding what must happen first. That planning habit helps far beyond a computer screen.", "เด็กฝึกตั้งเป้าหมาย แบ่งงานใหญ่เป็นงานย่อย และเลือกว่าสิ่งใดต้องทำก่อน นิสัยการวางแผนนี้นำไปใช้ได้ไกลกว่าหน้าจอคอมพิวเตอร์")}</p></article><article class="coding-benefit"><h3>${text("Make logic visible", "มองเห็นตรรกะ")}</h3><p>${text("Conditions, loops and variables make cause and effect concrete: if this changes, what should happen next?", "เงื่อนไข การทำซ้ำ และตัวแปรทำให้เหตุและผลชัดเจนขึ้น ถ้าสิ่งนี้เปลี่ยน ขั้นต่อไปควรเกิดอะไร")}</p></article><article class="coding-benefit coding-benefit--accent"><h3>${text("Use mistakes as information", "ใช้ความผิดพลาดเป็นข้อมูล")}</h3><p>${text("Debugging teaches children to pause, inspect evidence, change one thing and test again instead of guessing.", "การแก้บั๊กฝึกให้เด็กหยุดดูหลักฐาน เปลี่ยนทีละจุด และทดสอบใหม่ แทนการเดาสุ่ม")}</p></article><article class="coding-benefit"><h3>${text("Direct AI, do not obey it", "สั่ง AI อย่างมีเหตุผล ไม่เชื่อตามทันที")}</h3><p>${text("Students learn to give context, question an answer and check whether generated code matches their own design.", "เด็กเรียนรู้การให้ข้อมูลที่จำเป็น ตั้งคำถามกับคำตอบ และตรวจว่าโค้ดจาก AI ตรงกับแบบที่ตัวเองวางไว้หรือไม่")}</p></article></div></div></section>

<section class="coding-section coding-curriculum" id="course-plan"><div class="container"><div class="coding-section__intro"><h2>${text("Twelve lessons from logic to launch", "12 บท จากตรรกะสู่ผลงานที่เล่นได้")}</h2><p>${text("Every lesson adds a tool the child needs for the final project. The sequence can be paced to the learner's readiness.", "แต่ละบทเพิ่มเครื่องมือที่เด็กต้องใช้ในโปรเจกต์สุดท้าย โดยผู้สอนปรับจังหวะให้เหมาะกับความพร้อมของผู้เรียน")}</p></div><div class="coding-chapters"><article class="coding-chapter"><span>${text("Think in systems", "คิดเป็นระบบ")}</span><h3>${text("Define the problem", "กำหนดปัญหา")}</h3><ol><li>${text("Goals, inputs, outputs and limits", "เป้าหมาย ข้อมูลเข้า ผลลัพธ์ และข้อจำกัด")}</li><li>${text("Algorithms and clear sequences", "อัลกอริทึมและลำดับที่ชัดเจน")}</li><li>${text("Decisions with conditions", "การตัดสินใจด้วยเงื่อนไข")}</li></ol></article><article class="coding-chapter coding-chapter--blue"><span>${text("Build the logic", "สร้างตรรกะ")}</span><h3>${text("Write reusable code", "เขียนโค้ดที่นำกลับมาใช้ได้")}</h3><ol start="4"><li>${text("Loops and useful repetition", "ลูปและการทำซ้ำอย่างมีประโยชน์")}</li><li>${text("Variables, data and changing state", "ตัวแปร ข้อมูล และสถานะที่เปลี่ยนไป")}</li><li>${text("Functions and reusable behaviours", "ฟังก์ชันและพฤติกรรมที่ใช้ซ้ำได้")}</li></ol></article><article class="coding-chapter coding-chapter--yellow"><span>${text("Architect the idea", "ออกแบบสถาปัตยกรรม")}</span><h3>${text("Plan before building", "วางแผนก่อนลงมือ")}</h3><ol start="7"><li>${text("Screens, user flow and game rules", "หน้าจอ เส้นทางผู้ใช้ และกติกาเกม")}</li><li>${text("Scope, components and task planning", "ขอบเขต องค์ประกอบ และแผนงาน")}</li><li>${text("Interface design and clear feedback", "การออกแบบหน้าจอและการตอบสนองที่เข้าใจง่าย")}</li></ol></article><article class="coding-chapter coding-chapter--dark"><span>${text("Create with AI", "สร้างร่วมกับ AI")}</span><h3>${text("Build, test and present", "สร้าง ทดสอบ และนำเสนอ")}</h3><ol start="10"><li>${text("Ask AI with context and constraints", "สั่ง AI ด้วยบริบทและข้อจำกัด")}</li><li>${text("Debug, test and improve the project", "แก้บั๊ก ทดสอบ และพัฒนาผลงาน")}</li><li>${text("Finish and explain a first game or mini app", "ทำเกมหรือมินิแอปแรกให้เสร็จและอธิบายแนวคิดได้")}</li></ol></article></div></div></section>

<section class="coding-section coding-instructor"><div class="container">${currentLanguage === "en" ? `<div class="coding-instructor__grid"><div class="coding-instructor__art">${imageTag({ file: "siamese-cat-dev-logo.webp", className: "coding-instructor__logo", alt: "Siamese Cat Dev", sizes: "(max-width: 760px) 80vw, 420px" })}</div><div class="coding-instructor__copy"><h2>English lessons by Siamese Cat Dev</h2><p>The course is taught in English. A child should be able to follow everyday instructions, describe a simple idea and ask for help when stuck. Perfect grammar is not required.</p><p>The free trial checks the part that an age label cannot: whether the child can follow the logic, stay with a problem and communicate well enough to benefit from the session.</p></div></div>` : `<div class="coding-instructor__grid coding-instructor__grid--thai"><div class="coding-instructor__art coding-instructor__portrait">${imageTag({ file: "instructor-djai.webp", className: "coding-instructor__photo", alt: "Mr. A from Djai.academy", sizes: "(max-width: 760px) 80vw, 420px" })}</div><div class="coding-instructor__copy"><h2>คลาสภาษาไทยสอนโดย Mr. A จาก Djai.academy</h2><p>สำหรับครอบครัวที่ต้องการเรียนเป็นภาษาไทย หน้านี้เปิดรับลงทะเบียนความสนใจสำหรับคลาสของ Mr. A โดยเนื้อหายังคงเน้นให้เด็กคิด วางแผน ออกแบบ และลงมือสร้างผลงานของตัวเอง</p><p>การทดลองเรียนช่วยประเมินสิ่งที่อายุอย่างเดียวบอกไม่ได้ คือเด็กตามตรรกะได้หรือไม่ อยู่กับโจทย์ได้นานพอหรือไม่ และสื่อสารเมื่อเจอปัญหาได้เพียงใด</p></div></div>`}</div></section>

<section class="coding-section coding-pricing" id="trial"><div class="container"><div class="coding-pricing__intro"><h2>${text("Start with a free readiness trial", "เริ่มด้วยการทดลองเพื่อดูความพร้อมฟรี")}</h2><p>${text("A younger child may be ready; an older child may need a different pace. We use a short real lesson before admission instead of guessing from age alone.", "เด็กอายุน้อยอาจพร้อมเรียน ขณะที่เด็กที่โตกว่าอาจต้องการจังหวะต่างกัน เราจึงใช้บทเรียนสั้นจริงก่อนรับเข้าเรียน แทนการตัดสินจากอายุเพียงอย่างเดียว")}</p></div><div class="coding-price-layout"><article class="coding-trial"><span>${text("First meeting", "ครั้งแรก")}</span><strong>${text("30 minutes free", "ฟรี 30 นาที")}</strong><p>${text("Meet the instructor, try a real logic task and assess whether the child is ready for the course. Children younger than seven are welcome to try.", "พบผู้สอน ลองโจทย์ตรรกะจริง และประเมินว่าเด็กพร้อมกับคอร์สหรือไม่ เด็กอายุต่ำกว่า 7 ปีก็ทดลองได้")}</p><a class="coding-button coding-button--light coding-button--trial" href="/contact?service=${currentLanguage === "en" ? "coding-ai-en" : "coding-ai-th"}" data-course-interest>${text("Register interest", "ลงทะเบียนความสนใจ")}</a></article><div class="coding-price-options"><article><span>${text("Flexible", "เลือกเป็นครั้ง")}</span><h3>${text("Single lesson", "เรียนรายครั้ง")}</h3><strong>${text("2,000 THB", "2,000 บาท")}</strong><p>${text("One 90-minute in-person session.", "เรียนที่สถานที่จริง 90 นาที 1 ครั้ง")}</p></article><article class="coding-price-options__package"><span>${text("Full programme", "แพ็กเกจเต็มหลักสูตร")}</span><h3>${text("12-lesson package", "แพ็กเกจ 12 บท")}</h3><p><del>${text("24,000 THB", "24,000 บาท")}</del></p><strong>${text("18,000 THB", "18,000 บาท")}</strong><p>${text("Save 6,000 THB compared with twelve individual lessons.", "ประหยัด 6,000 บาท เมื่อเทียบกับการซื้อแยก 12 ครั้ง")}</p></article></div></div></div></section>

<section class="coding-section coding-evidence"><div class="narrow"><h2>${text("A useful practice, not a magic brain shortcut", "เป็นการฝึกที่มีประโยชน์ ไม่ใช่ทางลัดวิเศษของสมอง")}</h2><p class="coding-evidence__lead">${text("Planning, working memory, mental flexibility and self-control are part of what researchers call executive function. Coding gives children repeated opportunities to hold a plan in mind, follow rules, resist guessing and revise after feedback.", "การวางแผน ความจำใช้งาน ความยืดหยุ่นทางความคิด และการควบคุมตนเองเป็นส่วนหนึ่งของทักษะที่นักวิจัยเรียกว่า executive function การเขียนโค้ดเปิดโอกาสให้เด็กฝึกจำแผน ทำตามกติกา ไม่เดาสุ่ม และปรับงานจากผลที่เห็น")}</p><details class="coding-evidence__details"><summary>${text("Read the research note", "อ่านหมายเหตุด้านงานวิจัย")}</summary><div class="coding-evidence__content"><p>${text("Controlled studies with young children have reported improvements in some planning, inhibition, computational-thinking or executive-function measures after structured coding activities. The evidence is promising, but it does not mean every child will get the same result, and this course does not promise a cognitive or academic outcome.", "งานวิจัยแบบมีกลุ่มควบคุมในเด็กเล็กรายงานผลดีขึ้นในตัวชี้วัดบางด้าน เช่น การวางแผน การยับยั้งชั่งใจ การคิดเชิงคำนวณ หรือ executive function หลังทำกิจกรรมโค้ดอย่างเป็นระบบ หลักฐานมีแนวโน้มที่ดี แต่ไม่ได้หมายความว่าเด็กทุกคนจะได้ผลเหมือนกัน และคอร์สนี้ไม่รับประกันผลลัพธ์ด้านสติปัญญาหรือการเรียน")}</p><div class="coding-source-links"><a href="https://developingchild.harvard.edu/resources/inbriefs/inbrief-executive-function/" target="_blank" rel="noreferrer">${text("Harvard: executive function", "Harvard: executive function")}</a><a href="https://pubmed.ncbi.nlm.nih.gov/31920786/" target="_blank" rel="noreferrer">${text("Primary-grades coding study", "งานวิจัยโค้ดในเด็กประถมต้น")}</a><a href="https://link.springer.com/article/10.1186/s40594-024-00525-z" target="_blank" rel="noreferrer">${text("Preschool programming trial", "งานทดลองเขียนโปรแกรมในเด็กปฐมวัย")}</a><a href="https://www.unesco.org/en/articles/ai-competency-framework-students" target="_blank" rel="noreferrer">${text("UNESCO AI competencies", "กรอบทักษะ AI ของ UNESCO")}</a></div></div></details></div></section>

</div>`
});

const carMazeProject = layout({
  page: "coding-with-ai/car-maze",
  active: "coding-with-ai",
  titleEn: "Car Maze Student Coding Project | Python Game",
  titleTh: "โปรเจกต์นักเรียน Car Maze | เกมเรียนรู้ Python",
  description: "How our students built Car Maze with instructor guidance: its Python learning use case, React and JavaScript web technology, design decisions and testing process.",
  descriptionTh: "เบื้องหลังนักเรียนสร้าง Car Maze โดยมีผู้สอนแนะนำ ทั้งโจทย์การเรียน Python เทคโนโลยี React และ JavaScript การออกแบบ และการทดสอบ",
  ogImage: "https://creative.siamesecat.cafe/game/learn_python/assets/world-1-driving-school-concept-v3.png",
  ogImageWidth: 1024,
  ogImageHeight: 1024,
  ogImageAlt: text("Car Maze Python learning game world", "โลกในเกมเรียนรู้ Python ชื่อ Car Maze"),
  extraHead: `<link rel="stylesheet" href="/main-site/assets/coding-with-ai.css?v=${CODING_CSS_VERSION}">`,
  body: `<div class="coding-page coding-project-page">
<section class="coding-project-hero"><div class="container"><nav class="coding-breadcrumb" aria-label="${text("Breadcrumb", "เส้นทางหน้าเว็บ")}"><a href="/coding-with-ai">${text("Coding with AI", "เรียนโค้ดด้วย AI")}</a><span aria-hidden="true">/</span><span>Car Maze</span></nav><div class="coding-project-hero__grid"><div><span class="coding-eyebrow">${text("Student project with instructor guidance", "โปรเจกต์นักเรียนที่มีผู้สอนแนะนำ")}</span><h1>Car Maze: Learn Python</h1><p>${text("A bilingual browser game that turns Python commands into visible movement across 58 missions and seven puzzle worlds.", "เกมสองภาษาบนเบราว์เซอร์ที่เปลี่ยนคำสั่ง Python ให้เป็นการเคลื่อนไหวที่มองเห็นได้ ผ่าน 58 ภารกิจในโลกปริศนา 7 แห่ง")}</p><div class="coding-actions"><a class="coding-button coding-button--primary" href="/game/learn_python/${currentLanguage}/">${text("Play Car Maze", "เล่น Car Maze")}</a><a class="coding-button coding-button--secondary" href="#how-it-was-built">${text("How it was built", "ดูวิธีสร้าง")}</a></div></div><div class="coding-project-hero__media"><img src="/game/learn_python/assets/world-1-driving-school-concept-v3.webp" width="1024" height="1024" alt="${text("Driving School puzzle world in Car Maze", "โลกปริศนา Driving School ในเกม Car Maze")}" loading="eager" decoding="async" fetchpriority="high"></div></div></div></section>

<section class="coding-project-section"><div class="container coding-project-overview"><div><span class="coding-eyebrow">${text("What it is", "เกมนี้คืออะไร")}</span><h2>${text("A coding lesson that behaves like a game", "บทเรียนเขียนโค้ดที่เล่นเหมือนเกม")}</h2></div><div class="coding-project-prose"><p>${text("Players study the road, choose a goal and write a small program that moves the car. Running the code makes the result visible immediately, so a wrong turn becomes something to inspect rather than a hidden mistake.", "ผู้เล่นสังเกตเส้นทาง เลือกเป้าหมาย และเขียนโปรแกรมขนาดเล็กเพื่อควบคุมรถ เมื่อรันโค้ด ผลลัพธ์จะปรากฏทันที ทำให้การเลี้ยวผิดเป็นสิ่งที่ย้อนดูและแก้ไขได้ ไม่ใช่ข้อผิดพลาดที่มองไม่เห็น")}</p><p>${text("The missions progress from ordered commands to conditions, loops, functions and more complex problem solving. The Python environment is deliberately limited for learning and safety; it is not a general-purpose Python runtime.", "ภารกิจค่อย ๆ พัฒนาจากการเรียงคำสั่ง ไปสู่เงื่อนไข ลูป ฟังก์ชัน และการแก้ปัญหาที่ซับซ้อนขึ้น สภาพแวดล้อม Python ถูกจำกัดไว้เพื่อการเรียนรู้และความปลอดภัย ไม่ใช่ Python runtime สำหรับใช้งานทั่วไป")}</p></div></div></section>

<section class="coding-project-section coding-project-section--tint" id="how-it-was-built"><div class="container"><div class="coding-project-heading"><span class="coding-eyebrow">${text("How it was built", "สร้างอย่างไร")}</span><h2>${text("One learning problem, several connected systems", "หนึ่งโจทย์การเรียนรู้ หลายระบบที่ต้องทำงานร่วมกัน")}</h2></div><dl class="coding-project-specs"><div><dt>${text("Learning language", "ภาษาที่ใช้เรียน")}</dt><dd>${text("Python commands for movement, decisions, repetition and reusable functions.", "คำสั่ง Python สำหรับการเคลื่อนที่ การตัดสินใจ การทำซ้ำ และฟังก์ชันที่นำกลับมาใช้ได้")}</dd></div><div><dt>${text("Application", "ตัวแอปพลิเคชัน")}</dt><dd>${text("A React and JavaScript browser interface with a separate execution worker, progress storage and installable PWA support.", "อินเทอร์เฟซบนเบราว์เซอร์ด้วย React และ JavaScript มี execution worker แยก ระบบบันทึกความคืบหน้า และรองรับการติดตั้งแบบ PWA")}</dd></div><div><dt>${text("Content system", "ระบบเนื้อหา")}</dt><dd>${text("Fifty-eight missions across seven worlds, with goals, obstacles, hints, replay and bilingual explanations.", "58 ภารกิจใน 7 โลก พร้อมเป้าหมาย สิ่งกีดขวาง คำใบ้ การย้อนดู และคำอธิบายสองภาษา")}</dd></div><div><dt>${text("Quality work", "การตรวจคุณภาพ")}</dt><dd>${text("The students tested valid and invalid solutions, progress recovery, both languages, mobile layouts and safe execution limits with instructor review.", "นักเรียนทดสอบทั้งคำตอบที่ถูกและผิด การกู้คืนความคืบหน้า สองภาษา หน้าจอมือถือ และขีดจำกัดการรันอย่างปลอดภัย โดยมีผู้สอนช่วยตรวจทาน")}</dd></div></dl></div></section>

<section class="coding-project-section"><div class="container coding-project-process"><div class="coding-project-heading"><span class="coding-eyebrow">${text("Guided AI workflow", "กระบวนการใช้ AI แบบมีผู้สอน")}</span><h2>${text("The students remained responsible for the decisions", "นักเรียนยังเป็นผู้รับผิดชอบการตัดสินใจ")}</h2><p>${text("AI could suggest or draft a small piece, but the project still required a clear rule, useful context, testing and a human decision about whether the result belonged in the game.", "AI สามารถเสนอหรือร่างงานชิ้นเล็กได้ แต่โปรเจกต์ยังต้องมีกติกาที่ชัด บริบทที่เพียงพอ การทดสอบ และการตัดสินใจของมนุษย์ว่าผลลัพธ์นั้นควรอยู่ในเกมหรือไม่")}</p></div><ol><li><strong>${text("Define the mission", "กำหนดภารกิจ")}</strong><span>${text("State the goal, allowed commands and success condition before asking AI for help.", "ระบุเป้าหมาย คำสั่งที่ใช้ได้ และเงื่อนไขความสำเร็จก่อนขอให้ AI ช่วย")}</span></li><li><strong>${text("Build one system at a time", "สร้างทีละระบบ")}</strong><span>${text("Separate movement, code execution, mission data, hints and progress so each part can be understood and checked.", "แยกการเคลื่อนที่ การรันโค้ด ข้อมูลภารกิจ คำใบ้ และความคืบหน้า เพื่อให้เข้าใจและตรวจสอบแต่ละส่วนได้")}</span></li><li><strong>${text("Run and observe", "รันและสังเกต")}</strong><span>${text("Compare what the program was meant to do with what the car actually did.", "เปรียบเทียบสิ่งที่โปรแกรมควรทำกับสิ่งที่รถทำจริง")}</span></li><li><strong>${text("Debug and explain", "แก้บั๊กและอธิบาย")}</strong><span>${text("Fix the cause, retest nearby missions and explain why the change works.", "แก้ที่สาเหตุ ทดสอบภารกิจใกล้เคียงอีกครั้ง และอธิบายว่าเหตุใดการแก้ไขจึงได้ผล")}</span></li></ol></div></section>

<section class="coding-project-section coding-project-why"><div class="container"><div><span class="coding-eyebrow">${text("Why this project", "ทำไมจึงสร้างโปรเจกต์นี้")}</span><h2>${text("Because code becomes easier to discuss when children can see it act", "เพราะโค้ดพูดคุยได้ง่ายขึ้นเมื่อเด็กเห็นมันทำงาน")}</h2><p>${text("Car Maze gives a concrete use case for planning, sequencing and debugging. It also demonstrates the central course principle: AI may help write, but the student must define the problem, judge the output and improve the system.", "Car Maze ทำให้การวางแผน การเรียงลำดับ และการแก้บั๊กมีโจทย์ใช้งานที่ชัดเจน และแสดงหลักสำคัญของคอร์สว่า AI อาจช่วยเขียนได้ แต่นักเรียนต้องกำหนดปัญหา ตัดสินผลลัพธ์ และปรับปรุงระบบเอง")}</p></div><a class="coding-button coding-button--primary" href="/contact?service=${currentLanguage === "en" ? "coding-ai-en" : "coding-ai-th"}" data-course-interest>${text("Book the free readiness trial", "จองทดลองดูความพร้อมฟรี")}</a></div></section>
</div>`
});

const catVsDogProject = layout({
  page: "coding-with-ai/cat-vs-dog",
  active: "coding-with-ai",
  titleEn: "Cat vs Dog 1986 Student Game Project",
  titleTh: "โปรเจกต์เกมนักเรียน Siamese Cat vs Dog 1986",
  description: "How our students built Siamese Cat vs Dog 1986 with instructor guidance using HTML, CSS, JavaScript and HTML5 Canvas, and what the project teaches.",
  descriptionTh: "เบื้องหลังนักเรียนสร้าง Siamese Cat vs Dog 1986 โดยมีผู้สอนแนะนำ ด้วย HTML, CSS, JavaScript และ HTML5 Canvas พร้อมสิ่งที่ได้เรียนรู้",
  ogImage: "https://creative.siamesecat.cafe/game/cat-vs-dog/assets/img/logo.png",
  ogImageWidth: 640,
  ogImageHeight: 361,
  ogImageAlt: "Siamese Cat vs Dog 1986",
  extraHead: `<link rel="stylesheet" href="/main-site/assets/coding-with-ai.css?v=${CODING_CSS_VERSION}">`,
  body: `<div class="coding-page coding-project-page">
<section class="coding-project-hero coding-project-hero--catdog"><div class="container"><nav class="coding-breadcrumb" aria-label="${text("Breadcrumb", "เส้นทางหน้าเว็บ")}"><a href="/coding-with-ai">${text("Coding with AI", "เรียนโค้ดด้วย AI")}</a><span aria-hidden="true">/</span><span>Cat vs Dog 1986</span></nav><div class="coding-project-hero__grid"><div><span class="coding-eyebrow">${text("Student project with instructor guidance", "โปรเจกต์นักเรียนที่มีผู้สอนแนะนำ")}</span><h1>Siamese Cat vs Dog 1986</h1><p>${text("A bilingual, mobile-friendly retro arcade game built for the browser with original characters, levels, scoring, sound and responsive controls.", "เกมอาร์เคดเรโทรสองภาษาที่รองรับมือถือ สร้างสำหรับเบราว์เซอร์ พร้อมตัวละคร ด่าน คะแนน เสียง และการควบคุมที่ตอบสนอง")}</p><div class="coding-actions"><a class="coding-button coding-button--primary" href="/game/cat-vs-dog/${currentLanguage}/">${text("Play Cat vs Dog", "เล่น Cat vs Dog")}</a><a class="coding-button coding-button--secondary" href="#how-it-was-built">${text("How it was built", "ดูวิธีสร้าง")}</a></div></div><div class="coding-project-hero__media coding-project-hero__media--logo"><img src="/game/cat-vs-dog/assets/img/logo.png" width="640" height="361" alt="Siamese Cat vs Dog 1986" loading="eager" decoding="async" fetchpriority="high"></div></div></div></section>

<section class="coding-project-section"><div class="container coding-project-overview"><div><span class="coding-eyebrow">${text("What it is", "เกมนี้คืออะไร")}</span><h2>${text("A complete arcade game, not a coding exercise", "เกมอาร์เคดที่สมบูรณ์ ไม่ใช่แค่แบบฝึกเขียนโค้ด")}</h2></div><div class="coding-project-prose"><p>${text("The player pilots a jetpack Siamese cat through waves of mutant alien dogs. The game combines movement, attacks, collisions, pickups, difficulty modes, stage progression, boss battles, score saving and player feedback.", "ผู้เล่นบังคับแมววิเชียรมาศติดเจ็ตแพ็กผ่านฝูงสุนัขเอเลียนกลายพันธุ์ เกมรวมการเคลื่อนที่ การโจมตี การชน ไอเท็ม ระดับความยาก การผ่านด่าน การต่อสู้กับบอส การบันทึกคะแนน และผลตอบสนองต่อผู้เล่น")}</p><p>${text("Its use case is to show students what happens when a small creative idea grows into a product whose systems must remain consistent on phones and computers, in Thai and English.", "โจทย์ของเกมคือให้นักเรียนเห็นว่าเมื่อไอเดียสร้างสรรค์เล็ก ๆ เติบโตเป็นผลิตภัณฑ์ ระบบต่าง ๆ ต้องทำงานสอดคล้องกันทั้งบนโทรศัพท์และคอมพิวเตอร์ ในภาษาไทยและอังกฤษ")}</p></div></div></section>

<section class="coding-project-section coding-project-section--tint" id="how-it-was-built"><div class="container"><div class="coding-project-heading"><span class="coding-eyebrow">${text("How it was built", "สร้างอย่างไร")}</span><h2>${text("A lightweight browser game with no gameplay framework", "เกมเบราว์เซอร์น้ำหนักเบาที่ไม่ใช้เฟรมเวิร์กเกม")}</h2></div><dl class="coding-project-specs"><div><dt>${text("Programming", "การเขียนโปรแกรม")}</dt><dd>${text("Plain JavaScript manages the game loop, input, movement, collisions, enemies, levels, scoring, audio and saved state.", "JavaScript แบบไม่ใช้เฟรมเวิร์กจัดการ game loop การควบคุม การเคลื่อนที่ การชน ศัตรู ด่าน คะแนน เสียง และสถานะที่บันทึกไว้")}</dd></div><div><dt>${text("Rendering", "การแสดงผล")}</dt><dd>${text("HTML5 Canvas draws the responsive portrait game, while CSS provides the surrounding interface and mobile layout.", "HTML5 Canvas วาดเกมแนวตั้งที่ปรับตามหน้าจอ ส่วน CSS ดูแลอินเทอร์เฟซรอบเกมและเลย์เอาต์มือถือ")}</dd></div><div><dt>${text("Content", "เนื้อหา")}</dt><dd>${text("Original pixel art, characters, story, sound effects and music support separate Thai and English editions.", "พิกเซลอาร์ต ตัวละคร เรื่องราว เอฟเฟกต์เสียง และดนตรีต้นฉบับรองรับเวอร์ชันภาษาไทยและอังกฤษแยกกัน")}</dd></div><div><dt>${text("Browser features", "ความสามารถของเบราว์เซอร์")}</dt><dd>${text("Touch and pointer input, responsive scaling, localStorage saves, Web Audio, visibility handling and Web Share fallbacks make the game work without an installation.", "การควบคุมแบบสัมผัสและพอยน์เตอร์ การปรับขนาดตามหน้าจอ localStorage, Web Audio, การจัดการเมื่อสลับหน้าจอ และ Web Share ช่วยให้เล่นได้โดยไม่ต้องติดตั้ง")}</dd></div></dl></div></section>

<section class="coding-project-section"><div class="container coding-project-process"><div class="coding-project-heading"><span class="coding-eyebrow">${text("Guided AI workflow", "กระบวนการใช้ AI แบบมีผู้สอน")}</span><h2>${text("Complexity was divided into decisions students could test", "แบ่งความซับซ้อนเป็นการตัดสินใจที่นักเรียนทดสอบได้")}</h2><p>${text("Instructor guidance kept the project focused on systems and evidence. AI assistance could accelerate a draft, but students still had to understand the rule, connect it safely to the game and test the result during real play.", "ผู้สอนช่วยให้โปรเจกต์มุ่งที่ระบบและหลักฐาน การใช้ AI ช่วยให้ร่างงานได้เร็วขึ้น แต่นักเรียนยังต้องเข้าใจกติกา เชื่อมต่อกับเกมอย่างปลอดภัย และทดสอบผลลัพธ์ระหว่างการเล่นจริง")}</p></div><ol><li><strong>${text("Define the player experience", "กำหนดประสบการณ์ผู้เล่น")}</strong><span>${text("Describe the controls, challenge, feedback and win or loss conditions before implementation.", "อธิบายการควบคุม ความท้าทาย ผลตอบสนอง และเงื่อนไขชนะหรือแพ้ก่อนลงมือเขียน")}</span></li><li><strong>${text("Model the state", "ออกแบบสถานะเกม")}</strong><span>${text("Track the player, enemies, projectiles, score, health, stage and difficulty as explicit data.", "ติดตามผู้เล่น ศัตรู กระสุน คะแนน พลังชีวิต ด่าน และระดับความยากเป็นข้อมูลที่ชัดเจน")}</span></li><li><strong>${text("Connect art and rules", "เชื่อมงานภาพกับกติกา")}</strong><span>${text("Make every sprite, sound and effect communicate something the player needs to know.", "ทำให้สไปรต์ เสียง และเอฟเฟกต์ทุกชิ้นสื่อสารสิ่งที่ผู้เล่นจำเป็นต้องรู้")}</span></li><li><strong>${text("Test on real devices", "ทดสอบบนอุปกรณ์จริง")}</strong><span>${text("Check touch input, resizing, audio, difficulty, bilingual text and long play sessions, then repair the causes of failures.", "ตรวจการสัมผัส การปรับขนาด เสียง ระดับความยาก ข้อความสองภาษา และการเล่นต่อเนื่อง แล้วแก้ที่สาเหตุของปัญหา")}</span></li></ol></div></section>

<section class="coding-project-section coding-project-why"><div class="container"><div><span class="coding-eyebrow">${text("Why this project", "ทำไมจึงสร้างโปรเจกต์นี้")}</span><h2>${text("Because finishing a game teaches more than generating code", "เพราะการทำเกมให้เสร็จสอนมากกว่าการสร้างโค้ด")}</h2><p>${text("The project required creative direction, system architecture, programming, asset integration, bilingual UX and repeated testing. It demonstrates why students need judgment and persistence even when AI can help produce individual pieces.", "โปรเจกต์นี้ต้องใช้การกำหนดทิศทางสร้างสรรค์ สถาปัตยกรรมระบบ การเขียนโปรแกรม การรวมแอสเซ็ต UX สองภาษา และการทดสอบซ้ำ จึงแสดงให้เห็นว่าแม้ AI ช่วยสร้างงานแต่ละส่วนได้ นักเรียนยังต้องมีวิจารณญาณและความพยายาม")}</p></div><a class="coding-button coding-button--primary" href="/contact?service=${currentLanguage === "en" ? "coding-ai-en" : "coding-ai-th"}" data-course-interest>${text("Book the free readiness trial", "จองทดลองดูความพร้อมฟรี")}</a></div></section>
</div>`
});

const about = layout({
  page: "about",
  titleEn: "About Siamese Cat Creative Club in Bangna",
  titleTh: "เกี่ยวกับ Siamese Cat Creative Club บางนา",
  description: "Meet the team and learn how the parent-accompanied Kids Playroom differs from After School Explorer care near Mega Bangna.",
  descriptionTh: "รู้จักทีมงานและความแตกต่างระหว่าง Kids Playroom ที่ผู้ปกครองอยู่ด้วยกับบริการ After School Explorer ใกล้เมกาบางนา",
  body: `<section class="hero" style="min-height:560px"><div class="container hero-grid"><div class="hero-copy reveal visible"><span class="eyebrow">${text("About the club", "เกี่ยวกับคลับ")}</span><h1>${text("A practical place for family play and after-school routines", "พื้นที่สำหรับครอบครัวเล่นด้วยกันและกิจวัตรหลังเลิกเรียน")}</h1><p class="lead">${text("Siamese Cat Creative Club operates in Bang Kaeo near Mega Bangna. We offer a parent-accompanied Kids Playroom and a separate supervised After School Explorer service.", "Siamese Cat Creative Club อยู่ที่บางแก้ว ใกล้เมกาบางนา เรามี Kids Playroom ที่ผู้ปกครองอยู่ด้วย และบริการ After School Explorer แบบมีทีมงานดูแลแยกต่างหาก")}</p><div class="hero-actions"><a class="btn btn-primary" href="/inside">${text("See the real space", "ดูพื้นที่จริง")}</a><a class="btn btn-secondary" href="/contact">${text("Contact the team", "ติดต่อทีมงาน")}</a></div></div><div class="hero-art reveal visible"><div class="gallery-item environment-card" style="width:min(100%,520px);min-height:520px">${imageTag({ file: "environment-shop-front.webp", className: "environment-photo", alt: text("Entrance to Siamese Cat Creative Club in Bang Kaeo", "ทางเข้า Siamese Cat Creative Club ที่บางแก้ว"), eager: true })}<div class="caption"><strong>${text("46/27 Bang Na-Trat Frontage Road", "46/27 ถนนคู่ขนานบางนา-ตราด")}</strong></div></div></div></div></section>
<section class="section fawn"><div class="container"><div class="section-head"><span class="eyebrow">${text("What we do", "สิ่งที่เราทำ")}</span><h2>${text("Two services with different responsibilities", "สองบริการที่มีความรับผิดชอบต่างกัน")}</h2></div><div class="grid-2"><article class="card soft-mint"><h3>${text("Kids Playroom & Creative Activities", "Kids Playroom และกิจกรรมสร้างสรรค์")}</h3><p>${text("One-hour and two-hour parent-accompanied entry, with optional extra time, additional adults, crayon activities and soft-clay figures.", "ค่าเข้า 1 หรือ 2 ชั่วโมงโดยมีผู้ปกครองอยู่ด้วย พร้อมตัวเลือกเพิ่มเวลา เพิ่มผู้ใหญ่ กิจกรรมสีเทียน และฟิกเกอร์ดินปั้นนิ่ม")}</p><a class="text-link" href="/playgroup">${text("See the Playroom menu", "ดูเมนู Playroom")} →</a></article><article class="card soft-blue"><h3>After School Explorer</h3><p>${text("A separate weekday care routine for school-age children with time to settle, complete simple homework, play, create, eat and wait for pickup.", "บริการดูแลวันธรรมดาแยกสำหรับเด็กวัยเรียน ให้มีเวลาพัก ทำการบ้านง่าย ๆ เล่น สร้างสรรค์ ทานอาหาร และรอรับกลับ")}</p><a class="text-link" href="/creative">${text("See after-school care", "ดูการดูแลหลังเลิกเรียน")} →</a></article></div></div></section>
<section class="section paper"><div class="narrow"><div class="section-head"><span class="eyebrow">${text("Clear boundaries", "ขอบเขตที่ชัดเจน")}</span><h2>${text("What families should know", "สิ่งที่ครอบครัวควรรู้")}</h2></div>${detailsList(sharedDetails)}<p class="kicker">${text("We publish operational information from our own service and separate it from claims that require an external expert source. Our editorial process explains how content is researched and reviewed.", "เราเผยแพร่ข้อมูลการให้บริการจากการดำเนินงานจริง และแยกออกจากข้อมูลที่ต้องอ้างอิงผู้เชี่ยวชาญภายนอก อ่านวิธีค้นคว้าและตรวจสอบได้ในหน้ากระบวนการจัดทำเนื้อหา")}</p><a class="btn btn-secondary" href="/editorial-process">${text("Read our editorial process", "อ่านกระบวนการจัดทำเนื้อหา")}</a></div></section>`
});

const editorialProcess = layout({
  page: "editorial-process",
  titleEn: "Editorial Process | Siamese Cat Creative Club",
  titleTh: "กระบวนการจัดทำเนื้อหา | Siamese Cat Creative Club",
  description: "How Siamese Cat Creative Club researches, checks, updates and publishes practical content for families around Bangna.",
  descriptionTh: "วิธีที่ Siamese Cat Creative Club ค้นคว้า ตรวจสอบ อัปเดต และเผยแพร่เนื้อหาสำหรับครอบครัวย่านบางนา",
  body: `<section class="section fawn"><div class="narrow"><span class="eyebrow">${text("Editorial process", "กระบวนการจัดทำเนื้อหา")}</span><h1>${text("How we create and check our family guides", "เราสร้างและตรวจสอบบทความสำหรับครอบครัวอย่างไร")}</h1><p class="kicker">${text("Our goal is practical accuracy, not publishing volume. Each article should answer a real parent question and add something that comes from our location, service or first-hand operations.", "เป้าหมายคือข้อมูลที่ถูกต้องและนำไปใช้ได้ ไม่ใช่จำนวนบทความ ทุกบทความต้องตอบคำถามจริงของผู้ปกครอง และเพิ่มข้อมูลจากพื้นที่ บริการ หรือการดำเนินงานของเรา")}</p>
<div class="faq-category"><h2>${text("Before publication", "ก่อนเผยแพร่")}</h2>${detailsList([text("We define the reader, search intent and decision the page should support.", "เราระบุผู้อ่าน เจตนาการค้นหา และการตัดสินใจที่หน้าควรช่วย"), text("Operational statements are checked against current program pages, prices and service terms.", "ข้อมูลการให้บริการตรวจสอบกับหน้าโปรแกรม ราคา และเงื่อนไขปัจจุบัน"), text("Health, development, nutrition and safety claims require an appropriate primary or authoritative source.", "ข้ออ้างด้านสุขภาพ พัฒนาการ โภชนาการ และความปลอดภัยต้องมีแหล่งข้อมูลต้นทางหรือแหล่งที่น่าเชื่อถือ"), text("Thai and English versions are localized for natural reading rather than translated word for word.", "ภาษาไทยและอังกฤษปรับให้เป็นธรรมชาติ ไม่แปลแบบคำต่อคำ"), text("A team member reviews facts, links, headings, images, metadata and the call to action before publishing.", "ทีมงานตรวจข้อเท็จจริง ลิงก์ หัวข้อ รูปภาพ เมทาดาทา และคำเชิญชวนก่อนเผยแพร่")])}</div>
<div class="faq-category"><h2>${text("Use of AI tools", "การใช้เครื่องมือ AI")}</h2><p>${text("AI tools may assist research organization, drafting, translation and editing. We do not publish unreviewed generated text. Service facts, prices and policies must come from verified project data, and unsupported information is removed or held for verification.", "เครื่องมือ AI อาจช่วยจัดระเบียบงานวิจัย ร่าง แปล และแก้ไข แต่เราไม่เผยแพร่ข้อความที่สร้างขึ้นโดยไม่ตรวจสอบ ข้อมูลบริการ ราคา และนโยบายต้องมาจากข้อมูลโครงการที่ยืนยันแล้ว และข้อมูลที่ไม่มีหลักฐานจะถูกตัดออกหรือพักไว้เพื่อตรวจสอบ")}</p></div>
<div class="faq-category"><h2>${text("Corrections and updates", "การแก้ไขและอัปเดต")}</h2><p>${text("We update articles when packages, prices, policies or reliable external guidance changes. If you find an error, contact the team with the page URL and the detail that needs review.", "เราอัปเดตบทความเมื่อแพ็กเกจ ราคา นโยบาย หรือคำแนะนำจากแหล่งที่น่าเชื่อถือเปลี่ยน หากพบข้อผิดพลาด โปรดส่ง URL ของหน้าและรายละเอียดที่ต้องตรวจสอบให้ทีมงาน")}</p><a class="btn btn-primary" href="/contact">${text("Report a correction", "แจ้งข้อมูลที่ต้องแก้ไข")}</a></div></div></section>`
});

const thankYou = layout({
  page: "thank-you",
  indexable: false,
  titleEn: "Request Received | Siamese Cat Creative Club",
  titleTh: "ได้รับคำขอแล้ว | Siamese Cat Creative Club",
  description: "Thank you for contacting Siamese Cat Creative Club.",
  descriptionTh: "ขอบคุณที่ติดต่อ Siamese Cat Creative Club",
  body: `<section class="success-wrap"><div class="narrow"><div class="success-icon">✓</div><span class="eyebrow">${text("Request received", "ได้รับคำขอแล้ว")}</span><h1 style="font-size:clamp(42px,7vw,68px)">${text("Thank you. Our team will review the request.", "ขอบคุณ ทีมงานจะตรวจสอบคำขอของคุณ")}</h1><p class="kicker" style="margin-inline:auto">${text("This is not yet a confirmed reservation. The visit becomes confirmed after the team replies with an accepted date and time.", "ขณะนี้ยังไม่ถือว่าเป็นการจองที่ยืนยัน การมาใช้บริการจะยืนยันเมื่อทีมงานตอบกลับพร้อมวันและเวลาที่รับได้")}</p><div class="hero-actions" style="justify-content:center"><a class="btn btn-secondary" href="/playgroup">${text("Review Playroom Menu", "ดูเมนู Playroom")}</a><a class="btn btn-secondary" href="/">${text("Return Home", "กลับหน้าหลัก")}</a></div></div></section>`
});

const notFound = layout({
  page: "404",
  indexable: false,
  titleEn: "Page Not Found | Siamese Cat Creative Club",
  titleTh: "ไม่พบหน้า | Siamese Cat Creative Club",
  description: "The requested page could not be found.",
  descriptionTh: "ไม่พบหน้าที่คุณต้องการ",
  body: `<section class="success-wrap"><div class="narrow"><span class="eyebrow">404</span><h1 style="font-size:clamp(48px,8vw,86px)">${text("We couldn't find this page", "ไม่พบหน้านี้")}</h1><p class="kicker" style="margin-inline:auto">${text("Explore Kids Playroom, creative activities and After School Explorer from the main pages.", "ดู Kids Playroom กิจกรรมสร้างสรรค์ และ After School Explorer ได้จากหน้าหลัก")}</p><div class="hero-actions" style="justify-content:center"><a class="btn btn-primary" href="/playgroup">${text("View Playroom Menu", "ดูเมนู Playroom")}</a><a class="btn btn-secondary" href="/">${text("Return Home", "กลับหน้าหลัก")}</a></div></div></section>`
});

const pages = {
  "index.html": home,
  "playgroup.html": playgroup,
  "creative.html": creative,
  "coding-with-ai.html": codingWithAi,
  "coding-with-ai/car-maze.html": carMazeProject,
  "coding-with-ai/cat-vs-dog.html": catVsDogProject,
  "little-explorer-program.html": littleExplorerProgram,
  "membership.html": membership,
  "dinner.html": dinner,
  "inside.html": inside,
  "first-visit.html": firstVisit,
  "contact.html": contact,
  "faq.html": faq,
  "about.html": about,
  "editorial-process.html": editorialProcess,
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
    const outputFile = join(languageOut, file);
    mkdirSync(dirname(outputFile), { recursive: true });
    writeFileSync(outputFile, localizeDocumentLinks(html, language));
  }
}

console.log("Wrote 34 localized main-site pages.");

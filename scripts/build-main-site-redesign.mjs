import { writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "public/main-site");

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function text(en, th = en) {
  return `<span data-en="${esc(en)}" data-th="${esc(th)}">${esc(en)}</span>`;
}

function attrs(attrs) {
  return Object.entries(attrs)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => ` ${key}="${esc(value)}"`)
    .join("");
}

const nav = [
  ["inside", "/inside", "Inside the Club", "ภายในคลับ"],
  ["creative", "/creative", "Creative Club", "Creative Club"],
  ["playgroup", "/playgroup", "Playgroup", "เพลย์กรุ๊ป"],
  ["memberships", "/memberships", "Packages", "แพ็กเกจ"],
  ["dinner", "/dinner", "Meal Care", "มื้ออาหาร"],
  ["faq", "/faq", "FAQ", "คำถามที่พบบ่อย"],
];

function header(active) {
  return `<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="/" aria-label="Siamese Cat Creative Club home">
      <span class="brand-mark"><img class="brand-logo-img" src="/main-site/assets/logo-circle.png" alt="Siamese Cat Creative Club circle logo"></span>
      <span class="brand-text"><strong>Siamese Cat Creative Club</strong><span>Flexible • Creative • Caring</span></span>
    </a>
    <nav class="main-nav" aria-label="Primary navigation">
      ${nav.map(([key, href, en, th]) => `<a data-nav="${key}"${key === active ? ' class="active"' : ""} href="${href}">${text(en, th)}</a>`).join("\n      ")}
      <a data-nav="book" class="btn btn-primary" href="/signup">${text("Book a Visit", "จองวันทดลอง")} <span class="paw">🐾</span></a>
    </nav>
    <div class="header-actions">
      <button class="lang-toggle" type="button" aria-label="Switch language">TH</button>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-label="Open navigation"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>`;
}

function footer() {
  return `<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <div class="brand" style="color:#fff8ed;margin-bottom:18px"><span class="brand-mark"><img class="brand-logo-img" src="/main-site/assets/logo-circle.png" alt="Siamese Cat Creative Club circle logo"></span><span class="brand-text"><strong>Siamese Cat Creative Club</strong><span style="color:rgba(255,248,237,.7)">Near Mega Bangna</span></span></div>
        <p style="max-width:480px;color:rgba(255,248,237,.76)">${text("Two flexible small-group programs for children: daytime playgroup care and after-school explorer support with play, homework, creativity, meal care and pickup routines.", "สองโปรแกรมกลุ่มเล็กแบบยืดหยุ่นสำหรับเด็ก ทั้งเพลย์กรุ๊ปช่วงกลางวัน และโปรแกรมหลังเลิกเรียน พร้อมการเล่น การบ้าน ความสร้างสรรค์ มื้ออาหาร และการรอรับกลับ")}</p>
      </div>
      <div>
        <div class="footer-title">${text("Explore", "สำรวจ")}</div>
        <div class="footer-links">
          ${nav.map(([, href, en, th]) => `<a href="${href}">${text(en, th)}</a>`).join("")}
          <a href="/first-visit">${text("First Session", "เริ่มครั้งแรก")}</a>
        </div>
      </div>
      <div>
        <div class="footer-title">${text("Visit us", "แวะมาหาเรา")}</div>
        <div class="footer-links"><span>${text("Near Mega Bangna, Samut Prakan", "ใกล้เมกาบางนา สมุทรปราการ")}</span><span>${text("Weekdays 3-8 PM for after-school support", "หลังเลิกเรียนวันธรรมดา 15:00-20:00")}</span><span>${text("Playgroup times by booking", "เวลาเพลย์กรุ๊ปตามการจอง")}</span><a href="#" data-line data-ref="WEB-FOOTER">LINE</a><a href="tel:+66804803802" data-phone>${text("+66-0804803802", "+66-0804803802")}</a></div>
      </div>
    </div>
    <div class="footer-bottom"><span>© <span data-year></span> Siamese Cat Creative Club</span><span><a href="/privacy">${text("Privacy & PDPA", "ความเป็นส่วนตัวและ PDPA")}</a> · <a href="/faq">${text("Service terms", "เงื่อนไขบริการ")}</a></span></div>
  </div>
</footer>
<div class="mobile-cta"><a class="btn btn-primary" href="/signup">${text("Book a Visit", "จองวันทดลอง")}</a><a class="btn btn-line" href="#" data-line data-ref="WEB-MOBILE">LINE</a></div>
<div id="site-toast" class="toast" role="status" aria-live="polite"></div>`;
}

function layout({ page, titleEn, titleTh, description, body, active = page, extraHead = "" }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#fff9f0">
<title>${esc(titleEn)}</title>
<link rel="stylesheet" href="/main-site/assets/styles.css">
${extraHead}
</head>
<body data-page="${esc(page)}" data-source="WEB-${page.toUpperCase()}" data-title-en="${esc(titleEn)}" data-title-th="${esc(titleTh)}">
<a class="skip-link" href="#main">Skip to content</a>
${header(active)}
<main id="main">
${body}
</main>
${footer()}
<script src="/main-site/assets/app.js"></script>
</body>
</html>
`;
}

function priceCard({ tag, title, price, desc, items = [], href = "/signup", cta = "Book this option", featured = false, tone = "blue" }) {
  return `<article class="card plan-card ${featured ? "featured" : "hover"}">
    <span class="card-tag ${tone}">${tag}</span>
    <h3>${title}</h3>
    <div class="price">${price}</div>
    <p class="best-for">${desc}</p>${items.length ? `\n    <ul class="check-list">${items.map((item) => `<li>${item}</li>`).join("")}</ul>` : ""}
    <div class="plan-actions"><a class="btn btn-primary btn-block" href="${href}">${cta}</a></div>
  </article>`;
}

function detailsList(items) {
  return `<ul class="check-list">${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

const sharedDetails = [
  text("Parent registration is required before joining.", "ต้องลงทะเบียนผู้ปกครองก่อนเข้าร่วม"),
  text("Children must be healthy before attending. Please rest at home for fever, strong coughing or contagious symptoms.", "เด็กต้องมีสุขภาพพร้อมก่อนมา หากมีไข้ ไอมาก หรืออาการติดต่อ ควรพักที่บ้าน"),
  text("This is supervised small-group care, not private one-on-one nanny service.", "เป็นการดูแลแบบกลุ่มเล็กที่มีทีมงานดูแล ไม่ใช่บริการพี่เลี้ยงส่วนตัวแบบตัวต่อตัว"),
  text("Children under 3 may need a parent or guardian to stay, depending on comfort and safety.", "เด็กอายุต่ำกว่า 3 ปีอาจต้องมีผู้ปกครองอยู่ด้วย ขึ้นอยู่กับความพร้อมและความปลอดภัย"),
  text("Socks are not required in the kids' play area, but socks are required for the cat room.", "ในโซนเด็กไม่จำเป็นต้องใส่ถุงเท้า แต่ห้องแมวต้องใส่ถุงเท้า"),
  text("Advance booking is recommended, especially weekends, holidays and evening pickup times.", "แนะนำให้จองล่วงหน้า โดยเฉพาะวันหยุด ช่วงปิดเทอม และช่วงรับกลับตอนเย็น"),
];

function programsIntro() {
  return `<section class="section">
  <div class="container">
    <div class="section-head center">
      <span class="eyebrow">${text("Choose by family routine", "เลือกตามจังหวะครอบครัว")}</span>
      <h2>${text("Two clear programs, one caring space", "สองโปรแกรมชัดเจน ในพื้นที่ดูแลเดียวกัน")}</h2>
      <p class="kicker">${text("Use Playgroup for daytime and weekend care. Use Creative Club for after-school routines, homework, dinner and pickup support.", "เลือก Playgroup สำหรับการดูแลช่วงกลางวันและวันหยุด เลือก Creative Club สำหรับกิจวัตรหลังเลิกเรียน การบ้าน อาหารเย็น และการรอรับกลับ")}</p>
    </div>
    <div class="two-col section-grid">
      <article class="card soft-mint hover">
        <span class="card-tag green">${text("Daytime and weekend", "กลางวันและวันหยุด")}</span>
        <h3>${text("Little Explorer Playgroup", "Little Explorer Playgroup")}</h3>
        <p>${text("Flexible small-group play and care for children who want to play, learn, create and explore in a warm supervised environment.", "เพลย์กรุ๊ปแบบกลุ่มเล็กที่ยืดหยุ่น ให้เด็กได้เล่น เรียนรู้ สร้างสรรค์ และสำรวจในสภาพแวดล้อมอบอุ่นที่มีทีมงานดูแล")}</p>
        ${detailsList([
          text("1-hour, 2-hour, half-day and full-day sessions", "มีตัวเลือก 1 ชั่วโมง 2 ชั่วโมง ครึ่งวัน และเต็มวัน"),
          text("Weekday and weekend full-day options", "มีตัวเลือกเต็มวันทั้งวันธรรมดาและวันหยุด"),
          text("Regular full-day passes for weekday, Saturday or Sunday", "มีบัตรเหมาสำหรับครอบครัวที่มาเป็นประจำ"),
        ])}
        <a class="btn btn-primary" href="/playgroup">${text("Explore Playgroup", "ดูเพลย์กรุ๊ป")}</a>
      </article>
      <article class="card soft-blue hover">
        <span class="card-tag blue">${text("After school", "หลังเลิกเรียน")}</span>
        <h3>${text("After School Explorer Program", "After School Explorer Program")}</h3>
        <p>${text("A safe, meaningful place after school where children can play, finish homework, create, eat dinner and wait comfortably for pickup.", "พื้นที่ปลอดภัยและมีความหมายหลังเลิกเรียน ให้เด็กได้เล่น ทำการบ้าน สร้างสรรค์ ทานอาหารเย็น และรอผู้ปกครองรับกลับอย่างสบายใจ")}</p>
        ${detailsList([
          text("Short playroom entry or longer after-school session", "เลือกเข้าเล่นสั้น ๆ หรืออยู่หลังเลิกเรียนนานขึ้นได้"),
          text("Homework, quiet focus, creative activities and play", "มีการบ้าน มุมโฟกัส กิจกรรมสร้างสรรค์ และการเล่น"),
          text("Meal care add-on and late pickup support", "เพิ่ม Meal Care และการรอรับกลับช่วงเย็นได้"),
        ])}
        <a class="btn btn-primary" href="/creative">${text("Explore Creative Club", "ดู Creative Club")}</a>
      </article>
    </div>
  </div>
</section>`;
}

const home = layout({
  page: "home",
  active: "home",
  titleEn: "Siamese Cat Creative Club | Playgroup & After-School Care Near Mega Bangna",
  titleTh: "Siamese Cat Creative Club | เพลย์กรุ๊ปและดูแลหลังเลิกเรียนใกล้เมกาบางนา",
  description: "Flexible small-group playgroup and after-school care programs near Mega Bangna.",
  body: `<section class="hero">
  <div class="container hero-grid">
    <div class="hero-copy reveal visible">
      <span class="eyebrow">${text("Playgroup • After school • Meal care", "เพลย์กรุ๊ป • หลังเลิกเรียน • มื้ออาหาร")}</span>
      <h1>${text("Flexible care for curious children and busy families", "การดูแลแบบยืดหยุ่นสำหรับเด็กช่างสำรวจและครอบครัวที่มีตารางแน่น")}</h1>
      <p class="lead">${text("Choose Little Explorer Playgroup for daytime or weekend care, or After School Explorer for play, homework, creative time, dinner and pickup support after school.", "เลือก Little Explorer Playgroup สำหรับช่วงกลางวันหรือวันหยุด หรือ After School Explorer สำหรับการเล่น การบ้าน เวลาสร้างสรรค์ อาหารเย็น และการรอรับกลับหลังเลิกเรียน")}</p>
      <div class="hero-actions"><a class="btn btn-primary" href="/memberships">${text("View Packages", "ดูแพ็กเกจ")}</a><a class="btn btn-secondary" href="/playgroup">${text("Little Explorer Playgroup", "Little Explorer Playgroup")}</a><a class="btn btn-secondary" href="/creative">${text("Creative Club", "Creative Club")}</a></div>
      <p class="small" style="margin-top:14px">${text("Booking is recommended. Access depends on confirmed capacity and child readiness.", "แนะนำให้จองล่วงหน้า การเข้าใช้ขึ้นอยู่กับจำนวนที่นั่งที่ยืนยันและความพร้อมของเด็ก")}</p>
    </div>
    <div class="hero-art reveal visible" data-delay="1"><div class="gallery-item environment-card" style="width:min(100%,520px);min-height:520px"><img class="environment-photo" src="/main-site/assets/environment-play-area.webp" alt="Children playing inside Siamese Cat Creative Club"><div class="caption"><strong>${text("Little Explorer Playgroup in the kids' play area", "Little Explorer Playgroup ในโซนเด็ก")}</strong></div></div></div>
  </div>
</section>
<section class="utility-row"><div class="container pill-row"><span class="info-pill"><span class="dot"></span>${text("Small-group supervision", "ดูแลแบบกลุ่มเล็ก")}</span><span class="info-pill"><span class="dot"></span>${text("Clear package pricing", "ราคาแพ็กเกจชัดเจน")}</span><span class="info-pill"><span class="dot"></span>${text("Meal care available", "มีบริการดูแลมื้ออาหาร")}</span><span class="info-pill"><span class="dot"></span>${text("Animal visits when available", "พบสัตว์เมื่อพร้อมให้บริการ")}</span></div></section>
${programsIntro()}
<section class="section fawn"><div class="container"><div class="section-head"><span class="eyebrow">${text("Choose your program", "เลือกโปรแกรม")}</span><h2>${text("Two service paths for different family schedules", "สองบริการสำหรับตารางครอบครัวที่ต่างกัน")}</h2><p class="kicker">${text("Pick Playgroup for daytime or weekend care. Pick After School Explorer for after-school play, homework, dinner and pickup support.", "เลือก Playgroup สำหรับช่วงกลางวันหรือวันหยุด เลือก After School Explorer สำหรับหลังเลิกเรียน การบ้าน อาหารเย็น และรอรับกลับ")}</p></div><div class="two-col section-grid">
<article class="card soft-mint hover"><span class="card-tag green">${text("Little Explorer Playgroup", "Little Explorer Playgroup")}</span><h3>${text("Daytime and weekend playgroup care", "เพลย์กรุ๊ปช่วงกลางวันและวันหยุด")}</h3><p>${text("For children who need flexible supervised play, creative activities, full-day care or regular weekend care.", "สำหรับเด็กที่ต้องการการเล่นแบบมีทีมงานดูแล กิจกรรมสร้างสรรค์ การดูแลเต็มวัน หรือวันหยุดเป็นประจำ")}</p>${detailsList([text("1 hour / 199 THB and 2 hours / 300 THB", "1 ชั่วโมง / 199 บาท และ 2 ชั่วโมง / 300 บาท"), text("Weekday half-day / 599 THB and weekday full-day / 999 THB", "ครึ่งวันธรรมดา / 599 บาท และเต็มวันธรรมดา / 999 บาท"), text("Saturday or Sunday full-day / 1,500 THB", "เต็มวันเสาร์หรืออาทิตย์ / 1,500 บาท"), text("Regular playgroup passes available", "มีบัตรเหมารอบสำหรับ Playgroup")])}<a class="btn btn-primary" href="/playgroup">${text("See Playgroup Packages", "ดูแพ็กเกจ Playgroup")}</a></article>
<article class="card soft-blue hover"><span class="card-tag blue">${text("After School Explorer", "After School Explorer")}</span><h3>${text("After-school care, homework and pickup support", "ดูแลหลังเลิกเรียน การบ้าน และรอรับกลับ")}</h3><p>${text("For school-age children who need a safe place after school with play, quiet focus, creative time, dinner care and pickup support.", "สำหรับเด็กวัยเรียนที่ต้องการพื้นที่ปลอดภัยหลังเลิกเรียน พร้อมการเล่น มุมโฟกัส กิจกรรมสร้างสรรค์ อาหารเย็น และการรอรับกลับ")}</p>${detailsList([text("1 hour / 199 THB and 2 hours / 300 THB", "1 ชั่วโมง / 199 บาท และ 2 ชั่วโมง / 300 บาท"), text("Weekday after-school half-day / 599 THB", "หลังเลิกเรียนครึ่งวันธรรมดา / 599 บาท"), text("Dinner & pickup support by session", "ดูแลอาหารเย็นและรอรับกลับตามเซสชัน"), text("Meal Care Add-On / 299 THB", "Meal Care Add-On / 299 บาท")])}<a class="btn btn-primary" href="/creative">${text("See After School Explorer", "ดู After School Explorer")}</a></article>
</div></div></section>
<section class="section"><div class="container"><div class="section-head center"><span class="eyebrow">${text("Daily rhythm", "จังหวะประจำวัน")}</span><h2>${text("A calm routine from arrival to pickup", "กิจวัตรอบอุ่นตั้งแต่มาถึงจนรับกลับ")}</h2></div><div class="paw-timeline reveal"><div class="paw-step"><div class="paw-node">1</div><div><h3>${text("Arrive & settle", "มาถึงและปรับตัว")}</h3><p class="small">${text("Wash hands, put bags away and get comfortable.", "ล้างมือ วางกระเป๋า และค่อย ๆ ปรับตัว")}</p></div></div><div class="paw-step"><div class="paw-node">2</div><div><h3>${text("Play or focus", "เล่นหรือโฟกัส")}</h3><p class="small">${text("Playgroup children explore. After-school children may do homework or quiet focus.", "เด็กเพลย์กรุ๊ปได้สำรวจ เด็กหลังเลิกเรียนอาจทำการบ้านหรือกิจกรรมเงียบ")}</p></div></div><div class="paw-step"><div class="paw-node">3</div><div><h3>${text("Create & explore", "สร้างสรรค์และสำรวจ")}</h3><p class="small">${text("Drawing, Lego, clay, reading, soft play, outdoor play or animal visits when available.", "วาดรูป เลโก้ ดินปั้น อ่านหนังสือ เล่นนุ่ม ๆ เล่นกลางแจ้ง หรือพบสัตว์เมื่อพร้อม")}</p></div></div><div class="paw-step"><div class="paw-node">4</div><div><h3>${text("Meal & pickup", "มื้ออาหารและรับกลับ")}</h3><p class="small">${text("Meal care can be arranged for longer sessions or after-school evening pickup.", "สามารถจัด Meal Care สำหรับเซสชันยาวหรือรอรับช่วงเย็น")}</p></div></div></div></div></section>
<section class="section"><div class="container"><div class="cta-band reveal"><div><span class="eyebrow" style="color:#b8d9c2">${text("Ready to plan?", "พร้อมวางแผน?")}</span><h2>${text("Choose a program, then register once", "เลือกโปรแกรม แล้วลงทะเบียนครั้งเดียว")}</h2><p class="muted">${text("The team can confirm the best session after parent registration.", "ทีมงานจะช่วยยืนยันเซสชันที่เหมาะสมหลังผู้ปกครองลงทะเบียน")}</p></div><div class="cta-actions"><a class="btn btn-light" href="/signup">${text("Open Signup", "เปิดหน้าลงทะเบียน")}</a><a class="btn btn-line" href="#" data-line data-ref="WEB-HOME-FINAL">LINE</a></div></div></div></section>`
});

function sessionMenuCards(program) {
  const playgroup = program === "playgroup";
  const cards = [
    priceCard({ tag: text("Short visit", "มาเล่นสั้น ๆ"), title: playgroup ? text("1-Hour Playroom Entry", "เข้าเล่น 1 ชั่วโมง") : text("1-Hour After School Playroom Entry", "เข้าเล่นหลังเลิกเรียน 1 ชั่วโมง"), price: "199 THB", desc: text("A short flexible option for quick playtime, waiting time or a light session.", "ตัวเลือกสั้นและยืดหยุ่นสำหรับเล่นเร็ว ๆ รอรับ หรือกิจกรรมเบา ๆ"), href: playgroup ? "/signup?program=playgroup-1h" : "/signup?program=creative-1h", cta: text("Request 1 hour", "ขอจอง 1 ชั่วโมง") }),
    priceCard({ tag: text("More time", "เวลามากขึ้น"), title: playgroup ? text("2-Hour Playgroup Session", "เพลย์กรุ๊ป 2 ชั่วโมง") : text("2-Hour After School Explorer", "หลังเลิกเรียน 2 ชั่วโมง"), price: "300 THB", desc: text("Enough time to settle in, play, draw, read and enjoy simple guided activities.", "มีเวลาปรับตัว เล่น วาดรูป อ่านหนังสือ และเข้าร่วมกิจกรรมง่าย ๆ"), href: playgroup ? "/signup?program=playgroup-2h" : "/signup?program=creative-2h", cta: text("Request 2 hours", "ขอจอง 2 ชั่วโมง"), tone: "green" }),
    priceCard({ tag: text("Weekday value", "คุ้มค่าวันธรรมดา"), title: playgroup ? text("Weekday Half-Day Playgroup", "เพลย์กรุ๊ปครึ่งวันธรรมดา") : text("Weekday After School Half-Day", "หลังเลิกเรียนครึ่งวันธรรมดา"), price: "599 THB", desc: text("Four hours of supervised small-group care, creative activity, play and quiet focus.", "ดูแลแบบกลุ่มเล็ก 4 ชั่วโมง พร้อมกิจกรรมสร้างสรรค์ การเล่น และมุมโฟกัส"), href: playgroup ? "/signup?program=playgroup-half-day" : "/signup?program=creative-half-day", cta: text("Request 4 hours", "ขอจอง 4 ชั่วโมง"), featured: true, tone: "coral" }),
  ];
  if (playgroup) {
    cards.push(
      priceCard({ tag: text("Weekday full day", "เต็มวันวันธรรมดา"), title: text("Weekday Full-Day Playgroup", "เพลย์กรุ๊ปเต็มวันธรรมดา"), price: "999 THB", desc: text("Up to 8 hours of playgroup care with extended play, creative activities and meal-care value.", "เพลย์กรุ๊ปสูงสุด 8 ชั่วโมง พร้อมการเล่น กิจกรรมสร้างสรรค์ และมูลค่า Meal Care"), href: "/signup?program=playgroup-weekday-full", cta: text("Request weekday full day", "ขอจองเต็มวันธรรมดา"), tone: "blue" }),
      priceCard({ tag: text("Weekend", "วันหยุด"), title: text("Saturday Full-Day Playgroup", "เพลย์กรุ๊ปเต็มวันเสาร์"), price: "1,500 THB", desc: text("Structured weekend play, creative time, simple learning and meal care.", "การเล่นวันหยุดแบบมีโครงสร้าง เวลาสร้างสรรค์ การเรียนรู้ง่าย ๆ และ Meal Care"), href: "/signup?program=playgroup-saturday-full", cta: text("Request Saturday", "ขอจองวันเสาร์"), tone: "green" }),
      priceCard({ tag: text("Weekend", "วันหยุด"), title: text("Sunday Full-Day Playgroup", "เพลย์กรุ๊ปเต็มวันอาทิตย์"), price: "1,500 THB", desc: text("A full Sunday for children who love to play, create and explore safely.", "วันอาทิตย์เต็มวันสำหรับเด็กที่ชอบเล่น สร้างสรรค์ และสำรวจอย่างปลอดภัย"), href: "/signup?program=playgroup-sunday-full", cta: text("Request Sunday", "ขอจองวันอาทิตย์"), tone: "green" })
    );
  } else {
    cards.push(
      priceCard({ tag: text("Evening routine", "ช่วงเย็น"), title: text("After School Dinner & Pickup", "อาหารเย็นและรอรับกลับ"), price: text("By session", "ตามเซสชัน"), desc: text("Play, quiet activity time and meal care before parents arrive.", "เล่น ทำกิจกรรมเงียบ และดูแลมื้ออาหารก่อนผู้ปกครองมารับ"), href: "/dinner", cta: text("See meal care", "ดู Meal Care"), tone: "blue" }),
      priceCard({ tag: text("Meal add-on", "เพิ่มมื้ออาหาร"), title: text("Meal Care Add-On", "Meal Care Add-On"), price: "299 THB", desc: text("One child-friendly food item and one drink, with staff support during mealtime.", "อาหารเด็ก 1 รายการและเครื่องดื่ม 1 แก้ว พร้อมทีมงานช่วยดูแลระหว่างทาน"), href: "/dinner", cta: text("Add meal care", "เพิ่ม Meal Care"), tone: "green" })
    );
  }
  return cards.join("");
}

const playgroup = layout({
  page: "playgroup",
  titleEn: "Little Explorer Playgroup | Siamese Cat Creative Club",
  titleTh: "Little Explorer Playgroup | Siamese Cat Creative Club",
  description: "Flexible playgroup sessions, full-day childcare support and regular passes near Mega Bangna.",
  body: `<section class="hero"><div class="container hero-grid"><div class="hero-copy reveal visible"><span class="eyebrow">${text("Play • Learn • Create • Explore", "เล่น • เรียนรู้ • สร้างสรรค์ • สำรวจ")}</span><h1>${text("Little Explorer Playgroup", "Little Explorer Playgroup")}</h1><p class="lead">${text("A flexible play and care program for children who love indoor play, creative activities, reading, Lego, outdoor play and supervised animal visits when available.", "โปรแกรมเล่นและดูแลแบบยืดหยุ่นสำหรับเด็กที่ชอบเล่นในร่ม กิจกรรมสร้างสรรค์ อ่านหนังสือ เลโก้ เล่นกลางแจ้ง และพบสัตว์แบบมีทีมงานดูแลเมื่อพร้อม")}</p><div class="hero-actions"><a class="btn btn-primary" href="#sessions">${text("View Sessions", "ดูเซสชัน")}</a><a class="btn btn-secondary" href="#passes">${text("View Passes", "ดูบัตรเหมารอบ")}</a></div><p class="small" style="margin-top:14px">${text("This is supervised small-group playgroup care, not one-on-one nanny service.", "เป็นเพลย์กรุ๊ปแบบกลุ่มเล็กที่มีทีมงานดูแล ไม่ใช่บริการพี่เลี้ยงตัวต่อตัว")}</p></div><div class="hero-art reveal visible"><div class="gallery-item environment-card" style="width:min(100%,520px);min-height:520px"><img class="environment-photo" src="/main-site/assets/environment-play-area.webp" alt="Kids play area"><div class="caption"><strong>${text("Play, create and explore", "เล่น สร้างสรรค์ และสำรวจ")}</strong></div></div></div></div></section>
<section id="sessions" class="section fawn"><div class="container"><div class="section-head"><span class="eyebrow">${text("Playgroup session menu", "เมนูเพลย์กรุ๊ป")}</span><h2>${text("Flexible sessions from 1 hour to full day", "เซสชันยืดหยุ่นตั้งแต่ 1 ชั่วโมงถึงเต็มวัน")}</h2></div><div class="plan-grid">${sessionMenuCards("playgroup")}</div></div></section>
<section id="passes" class="section"><div class="container"><div class="section-head"><span class="eyebrow">${text("For regular families", "สำหรับครอบครัวที่มาเป็นประจำ")}</span><h2>${text("Playgroup passes", "บัตรเหมารอบเพลย์กรุ๊ป")}</h2><p class="kicker">${text("Passes are recommended for families who want better value and easier planning.", "เหมาะสำหรับครอบครัวที่ต้องการความคุ้มค่าและวางแผนง่ายขึ้น")}</p></div><div class="plan-grid">${priceCard({ tag: text("Weekday", "วันธรรมดา"), title: text("20-Session Weekday Full-Day Pass", "บัตรเต็มวันธรรมดา 20 ครั้ง"), price: "18,000 THB", desc: text("Effective price: 900 THB per full-day session. Saves 1,980 THB versus 20 separate weekday full days.", "เฉลี่ย 900 บาทต่อครั้ง ประหยัด 1,980 บาทเมื่อเทียบกับการซื้อเต็มวันธรรมดา 20 ครั้ง"), href: "/signup?plan=playgroup-weekday-pass", cta: text("Ask about this pass", "สอบถามบัตรนี้"), featured: true, tone: "coral" })}${priceCard({ tag: text("Saturday", "วันเสาร์"), title: text("8-Session Saturday Full-Day Pass", "บัตรเต็มวันเสาร์ 8 ครั้ง"), price: "9,200 THB", desc: text("Effective price: 1,150 THB per Saturday. Saves 2,800 THB versus 8 separate Saturdays.", "เฉลี่ย 1,150 บาทต่อวันเสาร์ ประหยัด 2,800 บาทเมื่อเทียบกับการซื้อ 8 ครั้ง"), href: "/signup?plan=saturday-pass", cta: text("Ask about Saturday pass", "สอบถามบัตรวันเสาร์"), tone: "green" })}${priceCard({ tag: text("Sunday", "วันอาทิตย์"), title: text("8-Session Sunday Full-Day Pass", "บัตรเต็มวันอาทิตย์ 8 ครั้ง"), price: "9,200 THB", desc: text("Effective price: 1,150 THB per Sunday. Saves 2,800 THB versus 8 separate Sundays.", "เฉลี่ย 1,150 บาทต่อวันอาทิตย์ ประหยัด 2,800 บาทเมื่อเทียบกับการซื้อ 8 ครั้ง"), href: "/signup?plan=sunday-pass", cta: text("Ask about Sunday pass", "สอบถามบัตรวันอาทิตย์"), tone: "green" })}</div></div></section>
<section class="section mint"><div class="container two-col section-grid"><div><span class="eyebrow">${text("Meal care", "Meal Care")}</span><h2>${text("Meal Care Value — 250 THB", "มูลค่า Meal Care — 250 บาท")}</h2><p class="kicker">${text("For longer playgroup sessions, children can enjoy a child-friendly meal and drink from the cafe menu with staff support during mealtime.", "สำหรับเซสชันเพลย์กรุ๊ปที่นานขึ้น เด็กสามารถรับอาหารเด็กและเครื่องดื่มจากเมนูคาเฟ่ พร้อมทีมงานช่วยดูแลระหว่างทาน")}</p><a class="btn btn-secondary" href="/dinner">${text("See meal details", "ดูรายละเอียดมื้ออาหาร")}</a></div><div class="card">${detailsList([text("Parents should share allergies, food restrictions or special eating habits in advance.", "ผู้ปกครองควรแจ้งอาการแพ้ ข้อจำกัดอาหาร หรือพฤติกรรมการทานล่วงหน้า"), text("Meal availability depends on the available kids' meal selection.", "เมนูขึ้นอยู่กับรายการอาหารเด็กที่พร้อมให้บริการ"), text("Staff remind and support children while eating.", "ทีมงานช่วยเตือนและดูแลระหว่างทานอาหาร")])}</div></div></section>
<section class="section"><div class="container"><div class="section-head"><span class="eyebrow">${text("Activities included", "กิจกรรมที่อาจได้ทำ")}</span><h2>${text("A balanced mix of play, creativity and gentle learning", "สมดุลระหว่างการเล่น ความสร้างสรรค์ และการเรียนรู้ง่าย ๆ")}</h2></div><div class="activity-grid"><article class="card activity-card"><h3>${text("Indoor play", "เล่นในร่ม")}</h3><p>${text("Toys, soft play, movement and free exploration.", "ของเล่น โซนนุ่ม การเคลื่อนไหว และการสำรวจอิสระ")}</p></article><article class="card activity-card"><h3>${text("Creative projects", "งานสร้างสรรค์")}</h3><p>${text("Drawing, coloring, clay, Lego and simple projects.", "วาดรูป ระบายสี ดินปั้น เลโก้ และโปรเจกต์ง่าย ๆ")}</p></article><article class="card activity-card"><h3>${text("Reading & quiet time", "อ่านหนังสือและเวลาสงบ")}</h3><p>${text("Reading corner, rest time and calm focus.", "มุมอ่านหนังสือ เวลาพัก และการโฟกัสอย่างสงบ")}</p></article><article class="card activity-card"><h3>${text("Outdoor play", "เล่นกลางแจ้ง")}</h3><p>${text("Garden play or water fun when staff, weather and schedule allow.", "เล่นสวนหรือกิจกรรมน้ำเมื่อทีมงาน สภาพอากาศ และตารางพร้อม")}</p></article><article class="card activity-card"><h3>${text("Animal visits", "พบสัตว์")}</h3><p>${text("Cats, rabbits or turtles when available, always guided by staff.", "แมว กระต่าย หรือเต่าเมื่อพร้อมให้บริการ โดยมีทีมงานดูแลเสมอ")}</p></article></div></div></section>
<section class="section fawn"><div class="container"><div class="section-head"><span class="eyebrow">${text("Important details", "รายละเอียดสำคัญ")}</span><h2>${text("Before joining playgroup", "ก่อนเข้าร่วมเพลย์กรุ๊ป")}</h2></div><div class="card">${detailsList(sharedDetails)}</div></div></section>`
});

const creative = layout({
  page: "creative",
  titleEn: "After School Explorer Program | Siamese Cat Creative Club",
  titleTh: "After School Explorer Program | Siamese Cat Creative Club",
  description: "After-school care with play, homework support, creative activities, dinner support and pickup routines.",
  body: `<section class="hero"><div class="container hero-grid"><div class="hero-copy reveal visible"><span class="eyebrow">${text("Play • Homework • Create • Dinner • Pickup", "เล่น • การบ้าน • สร้างสรรค์ • อาหารเย็น • รับกลับ")}</span><h1>${text("After School Explorer Program", "After School Explorer Program")}</h1><p class="lead">${text("A safe, fun and meaningful place after school. Children can play, finish simple homework, enjoy creative activities, have dinner and wait comfortably for pickup.", "พื้นที่ปลอดภัย สนุก และมีความหมายหลังเลิกเรียน เด็กได้เล่น ทำการบ้านง่าย ๆ ทำกิจกรรมสร้างสรรค์ ทานอาหารเย็น และรอรับกลับอย่างสบายใจ")}</p><div class="hero-actions"><a class="btn btn-primary" href="#sessions">${text("View After-School Menu", "ดูเมนูหลังเลิกเรียน")}</a><a class="btn btn-secondary" href="/dinner">${text("Meal Care", "Meal Care")}</a></div><p class="small" style="margin-top:14px">${text("This is supervised small-group after-school support, not private one-on-one nanny service.", "เป็นโปรแกรมหลังเลิกเรียนแบบกลุ่มเล็กที่มีทีมงานดูแล ไม่ใช่บริการพี่เลี้ยงส่วนตัวแบบตัวต่อตัว")}</p></div><div class="hero-art reveal visible"><div class="gallery-item environment-card" style="width:min(100%,520px);min-height:520px"><img class="environment-photo" src="/main-site/assets/inside-story-2-homework.webp" alt="Homework and quiet focus"><div class="caption"><strong>${text("After school, settled and supported", "หลังเลิกเรียนอย่างมีจังหวะและการดูแล")}</strong></div></div></div></div></section>
<section id="sessions" class="section fawn"><div class="container"><div class="section-head"><span class="eyebrow">${text("After School Explorer menu", "เมนู After School Explorer")}</span><h2>${text("Short care, longer care, dinner and pickup support", "ดูแลสั้น ดูแลยาว อาหารเย็น และรอรับกลับ")}</h2></div><div class="plan-grid">${sessionMenuCards("creative")}</div></div></section>
<section class="section"><div class="container"><div class="section-head"><span class="eyebrow">${text("Regular after-school passes", "บัตรสำหรับมาเป็นประจำหลังเลิกเรียน")}</span><h2>${text("For families building a weekly routine", "สำหรับครอบครัวที่ต้องการกิจวัตรประจำสัปดาห์")}</h2><p class="kicker">${text("These passes are configured with the team so the schedule, pickup pattern and meal needs match the child.", "บัตรเหล่านี้จัดรายละเอียดร่วมกับทีมงาน เพื่อให้ตรงกับตารางรับกลับและความต้องการมื้ออาหารของเด็ก")}</p></div><div class="plan-grid">${priceCard({ tag: text("Weekday routine", "กิจวัตรวันธรรมดา"), title: text("Weekday After School Pass", "Weekday After School Pass"), price: text("By arrangement", "จัดตามข้อตกลง"), desc: text("For regular supervised play, homework focus, creative activities and meal care if added.", "สำหรับการเล่นหลังเลิกเรียน การบ้าน กิจกรรมสร้างสรรค์ และ Meal Care หากต้องการ"), href: "/signup?plan=weekday-after-school-pass", cta: text("Ask about this pass", "สอบถามบัตรนี้"), tone: "blue" })}${priceCard({ tag: text("Focus + create", "โฟกัส + สร้างสรรค์"), title: text("Homework & Creative Pass", "Homework & Creative Pass"), price: text("By arrangement", "จัดตามข้อตกลง"), desc: text("For children who benefit from calm homework or reading time before creative play.", "เหมาะกับเด็กที่ต้องการเวลาเงียบสำหรับการบ้านหรืออ่านหนังสือก่อนเล่นสร้างสรรค์"), href: "/signup?plan=homework-creative-pass", cta: text("Ask about this pass", "สอบถามบัตรนี้"), tone: "green" })}${priceCard({ tag: text("Late pickup", "รับกลับเย็น"), title: text("Dinner & Late Pickup Pass", "Dinner & Late Pickup Pass"), price: text("By arrangement", "จัดตามข้อตกลง"), desc: text("For working parents who regularly need dinner support and evening pickup care.", "เหมาะกับผู้ปกครองที่ต้องการ Meal Care และการรอรับกลับช่วงเย็นเป็นประจำ"), href: "/signup?plan=dinner-late-pickup-pass", cta: text("Ask about this pass", "สอบถามบัตรนี้"), featured: true, tone: "coral" })}</div></div></section>
<section class="section mint"><div class="container"><div class="section-head center"><span class="eyebrow">${text("Suggested after-school flow", "ตัวอย่างลำดับหลังเลิกเรียน")}</span><h2>${text("A calm routine between school and home", "กิจวัตรสงบระหว่างโรงเรียนและบ้าน")}</h2></div><div class="paw-timeline reveal"><div class="paw-step"><div class="paw-node">1</div><div><h3>${text("Arrive & settle", "มาถึงและปรับตัว")}</h3><p class="small">${text("Put down bags, wash hands and take a short break.", "วางกระเป๋า ล้างมือ และพักสั้น ๆ")}</p></div></div><div class="paw-step"><div class="paw-node">2</div><div><h3>${text("Homework or quiet focus", "การบ้านหรือโฟกัสเงียบ")}</h3><p class="small">${text("Staff support the environment, reminders and basic clarification where appropriate.", "ทีมงานช่วยจัดบรรยากาศ เตือน และอธิบายเบื้องต้นเมื่อเหมาะสม")}</p></div></div><div class="paw-step"><div class="paw-node">3</div><div><h3>${text("Create & play", "สร้างสรรค์และเล่น")}</h3><p class="small">${text("Drawing, coloring, clay, Lego, reading, indoor play or outdoor play when available.", "วาดรูป ระบายสี ดินปั้น เลโก้ อ่านหนังสือ เล่นในร่มหรือกลางแจ้งเมื่อพร้อม")}</p></div></div><div class="paw-step"><div class="paw-node">4</div><div><h3>${text("Dinner & pickup", "อาหารเย็นและรับกลับ")}</h3><p class="small">${text("Meal care can be requested in advance before parent pickup.", "สามารถขอ Meal Care ล่วงหน้าก่อนผู้ปกครองรับกลับ")}</p></div></div></div></div></section>
<section class="section fawn"><div class="container"><div class="section-head"><span class="eyebrow">${text("Important details", "รายละเอียดสำคัญ")}</span><h2>${text("Before joining After School Explorer", "ก่อนเข้าร่วม After School Explorer")}</h2></div><div class="card">${detailsList([...sharedDetails, text("Meal care should be requested in advance when possible.", "ควรแจ้ง Meal Care ล่วงหน้าเมื่อเป็นไปได้"), text("Staff support homework monitoring and quiet focus, but this is not formal one-on-one tutoring.", "ทีมงานช่วยดูแลการบ้านและมุมโฟกัส แต่ไม่ใช่การสอนพิเศษตัวต่อตัว")])}</div></div></section>`
});

const memberships = layout({
  page: "memberships",
  titleEn: "Packages & Passes | Siamese Cat Creative Club",
  titleTh: "แพ็กเกจและบัตรเหมารอบ | Siamese Cat Creative Club",
  description: "Packages for Little Explorer Playgroup and After School Explorer Program.",
  body: `<section class="hero" style="min-height:560px"><div class="container hero-grid"><div class="hero-copy reveal visible"><span class="eyebrow">${text("Packages & passes", "แพ็กเกจและบัตรเหมารอบ")}</span><h1>${text("Playgroup Packages and After School Explorer Packages", "แพ็กเกจ Playgroup และแพ็กเกจ After School Explorer")}</h1><p class="lead">${text("Review Playgroup options for daytime and weekend care, then After School Explorer options for after-school routines and pickup support.", "ดูตัวเลือก Playgroup สำหรับกลางวันและวันหยุด จากนั้นดู After School Explorer สำหรับกิจวัตรหลังเลิกเรียนและรอรับกลับ")}</p><div class="hero-actions"><a class="btn btn-primary" href="/signup">${text("Register Interest", "ลงทะเบียนความสนใจ")}</a><a class="btn btn-secondary" href="/playgroup">${text("Playgroup Details", "รายละเอียด Playgroup")}</a><a class="btn btn-secondary" href="/creative">${text("After-School Details", "รายละเอียดหลังเลิกเรียน")}</a></div></div><div class="hero-art reveal visible"><div class="card soft-mint"><span class="eyebrow">${text("Quick choice", "เลือกเร็ว")}</span><h3>${text("Need daytime or weekend care?", "ต้องการช่วงกลางวันหรือวันหยุด?")}</h3><p>${text("Use the Little Explorer Playgroup section.", "ดูส่วน Little Explorer Playgroup")}</p><h3>${text("Need after-school pickup support?", "ต้องการดูแลหลังเลิกเรียนและรอรับ?")}</h3><p>${text("Use the After School Explorer section.", "ดูส่วน After School Explorer")}</p></div></div></div></section>
<section class="section fawn"><div class="container"><div class="section-head"><span class="eyebrow">${text("Little Explorer Playgroup", "Little Explorer Playgroup")}</span><h2>${text("Playgroup session prices", "ราคาเซสชันเพลย์กรุ๊ป")}</h2></div><div class="plan-grid">${sessionMenuCards("playgroup")}</div></div></section>
<section class="section"><div class="container"><div class="section-head"><span class="eyebrow">${text("Playgroup passes", "บัตรเหมารอบเพลย์กรุ๊ป")}</span><h2>${text("For regular weekday or weekend care", "สำหรับการดูแลวันธรรมดาหรือวันหยุดเป็นประจำ")}</h2></div><div class="plan-grid">${priceCard({ tag: text("20 sessions", "20 ครั้ง"), title: text("Weekday Full-Day Pass", "บัตรเต็มวันธรรมดา"), price: "18,000 THB", desc: text("20 weekday full-day sessions. Effective price 900 THB per session.", "เต็มวันธรรมดา 20 ครั้ง เฉลี่ย 900 บาทต่อครั้ง"), href: "/signup?plan=playgroup-weekday-pass", cta: text("Ask about pass", "สอบถามบัตร"), featured: true, tone: "coral" })}${priceCard({ tag: text("8 sessions", "8 ครั้ง"), title: text("Saturday Full-Day Pass", "บัตรเต็มวันเสาร์"), price: "9,200 THB", desc: text("8 Saturday full-day sessions. Effective price 1,150 THB per session.", "เต็มวันเสาร์ 8 ครั้ง เฉลี่ย 1,150 บาทต่อครั้ง"), href: "/signup?plan=saturday-pass", cta: text("Ask about pass", "สอบถามบัตร"), tone: "green" })}${priceCard({ tag: text("8 sessions", "8 ครั้ง"), title: text("Sunday Full-Day Pass", "บัตรเต็มวันอาทิตย์"), price: "9,200 THB", desc: text("8 Sunday full-day sessions. Effective price 1,150 THB per session.", "เต็มวันอาทิตย์ 8 ครั้ง เฉลี่ย 1,150 บาทต่อครั้ง"), href: "/signup?plan=sunday-pass", cta: text("Ask about pass", "สอบถามบัตร"), tone: "green" })}</div></div></section>
<section class="section fawn"><div class="container"><div class="section-head"><span class="eyebrow">${text("After School Explorer", "After School Explorer")}</span><h2>${text("After-school session prices", "ราคาเซสชันหลังเลิกเรียน")}</h2></div><div class="plan-grid">${sessionMenuCards("creative")}</div></div></section>
<section class="section"><div class="container"><div class="cta-band"><div><h2>${text("Not sure which package fits?", "ยังไม่แน่ใจว่าแพ็กเกจไหนเหมาะ?")}</h2><p class="muted">${text("Register once and tell the team your preferred timing. Staff can confirm the best option and capacity.", "ลงทะเบียนครั้งเดียวและแจ้งเวลาที่ต้องการ ทีมงานจะช่วยยืนยันตัวเลือกและจำนวนที่นั่ง")}</p></div><div class="cta-actions"><a class="btn btn-light" href="/signup">${text("Open Signup", "เปิดหน้าลงทะเบียน")}</a><a class="btn btn-line" href="#" data-line data-ref="WEB-PACKAGES">LINE</a></div></div></div></section>`
});

const dinner = layout({
  page: "dinner",
  titleEn: "Meal Care & Dinner Support | Siamese Cat Creative Club",
  titleTh: "Meal Care และอาหารเย็น | Siamese Cat Creative Club",
  description: "Meal care options for Little Explorer Playgroup and After School Explorer Program.",
  body: `<section class="hero" style="min-height:560px"><div class="container hero-grid"><div class="hero-copy reveal visible"><span class="eyebrow">${text("Meal care", "Meal Care")}</span><h1>${text("Meal Care & Dinner Support", "Meal Care และดูแลมื้ออาหาร")}</h1><p class="lead">${text("Children staying for longer sessions can enjoy a child-friendly meal and drink with staff support during mealtime.", "เด็กที่อยู่เซสชันนานขึ้นสามารถทานอาหารเด็กและเครื่องดื่ม พร้อมทีมงานช่วยดูแลระหว่างมื้ออาหาร")}</p><div class="hero-actions"><a class="btn btn-primary" href="/signup">${text("Request Meal Care", "ขอ Meal Care")}</a><a class="btn btn-secondary" href="/memberships">${text("View Packages", "ดูแพ็กเกจ")}</a></div></div><div class="hero-art reveal visible"><div class="gallery-item environment-card" style="width:min(100%,520px);min-height:520px"><img class="environment-photo" src="/main-site/assets/environment-cat-cafe-dinner.webp" alt="Cafe dinner"><div class="caption"><strong>${text("Cafe meal support", "ดูแลมื้ออาหารจากคาเฟ่")}</strong></div></div></div></div></section>
<section class="section fawn"><div class="container"><div class="section-head"><span class="eyebrow">${text("Two meal-care rules", "กฎ Meal Care สองแบบ")}</span><h2>${text("Meal support depends on the selected program", "Meal Care ขึ้นอยู่กับโปรแกรมที่เลือก")}</h2></div><div class="plan-grid">${priceCard({ tag: text("Playgroup", "เพลย์กรุ๊ป"), title: text("Meal Care Value", "มูลค่า Meal Care"), price: "250 THB", desc: text("For longer playgroup sessions, counted as parent value and based on the available kids' meal selection.", "สำหรับเพลย์กรุ๊ปเซสชันยาว คิดเป็นมูลค่าที่ผู้ปกครองได้รับ ขึ้นอยู่กับเมนูเด็กที่พร้อมให้บริการ"), href: "/playgroup", cta: text("See Playgroup", "ดูเพลย์กรุ๊ป"), tone: "green" })}${priceCard({ tag: text("After school", "หลังเลิกเรียน"), title: text("Meal Care Add-On", "Meal Care Add-On"), price: "299 THB", desc: text("One child-friendly food item and one drink, with staff supporting the child during mealtime.", "อาหารเด็ก 1 รายการและเครื่องดื่ม 1 แก้ว พร้อมทีมงานช่วยดูแลระหว่างทาน"), href: "/creative", cta: text("See Creative Club", "ดู Creative Club"), featured: true, tone: "coral" })}${priceCard({ tag: text("Required", "สำคัญ"), title: text("Allergy and food notes", "อาการแพ้และข้อจำกัดอาหาร"), price: text("Tell us early", "แจ้งล่วงหน้า"), desc: text("Parents should inform staff about allergies, food restrictions or special eating habits before the session.", "ผู้ปกครองควรแจ้งอาการแพ้ ข้อจำกัดอาหาร หรือพฤติกรรมการทานก่อนเซสชัน"), href: "/signup", cta: text("Register details", "ลงทะเบียนข้อมูล"), tone: "blue" })}</div></div></section>
<section class="section"><div class="container"><div class="section-head center"><span class="eyebrow">${text("Mealtime flow", "ขั้นตอนมื้ออาหาร")}</span><h2>${text("Simple support before pickup", "ดูแลง่าย ๆ ก่อนรับกลับ")}</h2></div><div class="paw-timeline reveal"><div class="paw-step"><div class="paw-node">1</div><div><h3>${text("Request meal care", "แจ้ง Meal Care")}</h3><p class="small">${text("Ask in advance when possible.", "แจ้งล่วงหน้าเมื่อเป็นไปได้")}</p></div></div><div class="paw-step"><div class="paw-node">2</div><div><h3>${text("Share food notes", "แจ้งข้อมูลอาหาร")}</h3><p class="small">${text("Allergies, restrictions and eating habits matter.", "อาการแพ้ ข้อจำกัด และพฤติกรรมการทานเป็นข้อมูลสำคัญ")}</p></div></div><div class="paw-step"><div class="paw-node">3</div><div><h3>${text("Eat with support", "ทานพร้อมการดูแล")}</h3><p class="small">${text("Staff remind, support and keep children comfortable.", "ทีมงานช่วยเตือน ดูแล และให้เด็กสบายใจ")}</p></div></div><div class="paw-step"><div class="paw-node">4</div><div><h3>${text("Ready for pickup", "พร้อมรับกลับ")}</h3><p class="small">${text("Useful for longer care or evening pickup.", "เหมาะกับการดูแลยาวหรือรอรับช่วงเย็น")}</p></div></div></div></div></section>`
});

const inside = layout({
  page: "inside",
  titleEn: "Inside the Club | Siamese Cat Creative Club",
  titleTh: "ภายในคลับ | Siamese Cat Creative Club",
  description: "Spaces, safety routines and activities for children at Siamese Cat Creative Club.",
  body: `<section class="hero" style="min-height:560px"><div class="container hero-grid"><div class="hero-copy reveal visible"><span class="eyebrow">${text("Inside the Club", "ภายในคลับ")}</span><h1>${text("A real space for play, focus, meals and pickup", "พื้นที่จริงสำหรับเล่น โฟกัส มื้ออาหาร และรอรับกลับ")}</h1><p class="lead">${text("Children are guided through supervised areas based on the service booked: playroom time, creative tables, quiet focus, meal support and animal visits when available.", "เด็กจะใช้พื้นที่ตามบริการที่จอง เช่น โซนเล่น โต๊ะสร้างสรรค์ มุมโฟกัส ดูแลมื้ออาหาร และพบสัตว์เมื่อพร้อมให้บริการ")}</p><div class="hero-actions"><a class="btn btn-primary" href="/playgroup">${text("Playgroup", "Playgroup")}</a><a class="btn btn-secondary" href="/creative">${text("Creative Club", "Creative Club")}</a></div></div><div class="hero-art reveal visible"><div class="gallery-item environment-card" style="width:min(100%,520px);min-height:520px"><img class="environment-photo" src="/main-site/assets/environment-creative-room.webp" alt="Creative room"><div class="caption"><strong>${text("Creative and calm activity space", "พื้นที่กิจกรรมสร้างสรรค์และสงบ")}</strong></div></div></div></div></section>
<section class="section fawn"><div class="container"><div class="section-head"><span class="eyebrow">${text("What children may do", "เด็กอาจได้ทำอะไร")}</span><h2>${text("Activities depend on age, schedule, weather and session length", "กิจกรรมขึ้นอยู่กับอายุ ตาราง สภาพอากาศ และระยะเวลาเซสชัน")}</h2></div><div class="activity-grid"><article class="card activity-card"><h3>${text("Indoor playroom", "โซนเล่นในร่ม")}</h3><p>${text("Toys, soft play and simple group play.", "ของเล่น โซนนุ่ม และการเล่นกลุ่มง่าย ๆ")}</p></article><article class="card activity-card"><h3>${text("Creative tables", "โต๊ะสร้างสรรค์")}</h3><p>${text("Drawing, coloring, clay, Lego and small projects.", "วาดรูป ระบายสี ดินปั้น เลโก้ และโปรเจกต์เล็ก ๆ")}</p></article><article class="card activity-card"><h3>${text("Quiet focus", "มุมโฟกัส")}</h3><p>${text("Homework monitoring, reading and rest.", "ดูแลการบ้าน อ่านหนังสือ และพักผ่อน")}</p></article><article class="card activity-card"><h3>${text("Meal support", "ดูแลมื้ออาหาร")}</h3><p>${text("Meal care for longer stays or evening pickup.", "Meal Care สำหรับอยู่ยาวหรือรอรับช่วงเย็น")}</p></article><article class="card activity-card"><h3>${text("Animal visits", "พบสัตว์")}</h3><p>${text("Cats, rabbits or turtles when available, with gentle staff guidance.", "แมว กระต่าย หรือเต่าเมื่อพร้อม พร้อมทีมงานแนะนำอย่างอ่อนโยน")}</p></article></div></div></section>
<section class="section"><div class="container"><div class="section-head"><span class="eyebrow">${text("The environment", "บรรยากาศ")}</span><h2>${text("Designed for flexible care, not a fixed classroom", "ออกแบบเพื่อการดูแลแบบยืดหยุ่น ไม่ใช่ห้องเรียนตายตัว")}</h2></div><div class="gallery-grid environment-gallery"><article class="gallery-item large environment-card environment-shop"><img class="environment-photo" src="/main-site/assets/environment-shop-front.webp" alt="Shop front"><div class="caption"><strong>${text("Near Mega Bangna", "ใกล้เมกาบางนา")}</strong></div></article><article class="gallery-item environment-card environment-creative"><img class="environment-photo" src="/main-site/assets/environment-creative-room.webp" alt="Creative room"><div class="caption"><strong>${text("Creative room", "ห้องสร้างสรรค์")}</strong></div></article><article class="gallery-item environment-card environment-play"><img class="environment-photo" src="/main-site/assets/environment-play-area.webp" alt="Play area"><div class="caption"><strong>${text("Play area", "โซนเล่น")}</strong></div></article><article class="gallery-item environment-card environment-entrance"><img class="environment-photo" src="/main-site/assets/environment-entrance-pickup.webp" alt="Entrance and pickup"><div class="caption"><strong>${text("Pickup process", "ขั้นตอนรับกลับ")}</strong></div></article><article class="gallery-item environment-card environment-cafe"><img class="environment-photo" src="/main-site/assets/environment-cat-cafe-dinner.webp" alt="Cafe dinner"><div class="caption"><strong>${text("Meal care", "Meal Care")}</strong></div></article></div></div></section>`
});

const firstVisit = layout({
  page: "first-visit",
  titleEn: "First Session | Siamese Cat Creative Club",
  titleTh: "เริ่มครั้งแรก | Siamese Cat Creative Club",
  description: "Choose a first visit for Little Explorer Playgroup or After School Explorer.",
  body: `<section class="hero" style="min-height:560px"><div class="container hero-grid"><div class="hero-copy reveal visible"><span class="eyebrow">${text("Start here", "เริ่มที่นี่")}</span><h1>${text("Plan your child’s first visit", "วางแผนการมาใช้บริการครั้งแรก")}</h1><p class="lead">${text("Choose a Playgroup first visit for daytime care, or choose After School Explorer for after-school care and pickup support.", "เลือก Playgroup สำหรับการดูแลช่วงกลางวัน หรือเลือก After School Explorer สำหรับการดูแลหลังเลิกเรียนและรอรับกลับ")}</p><div class="hero-actions"><a class="btn btn-primary" href="/signup">${text("Register first", "ลงทะเบียนก่อน")}</a><a class="btn btn-secondary" href="/memberships">${text("Compare packages", "เทียบแพ็กเกจ")}</a></div></div><div class="hero-art reveal visible"><div class="card soft-mint"><h3>${text("First visit choices", "ตัวเลือกสำหรับครั้งแรก")}</h3>${detailsList([text("Playgroup: 1 hour / 199 THB or 2 hours / 300 THB.", "Playgroup: 1 ชั่วโมง / 199 บาท หรือ 2 ชั่วโมง / 300 บาท"), text("Playgroup weekday half-day: 4 hours / 599 THB.", "Playgroup ครึ่งวันธรรมดา: 4 ชั่วโมง / 599 บาท"), text("After School Explorer: 1 hour / 199 THB, 2 hours / 300 THB, or 4-hour half-day / 599 THB.", "After School Explorer: 1 ชั่วโมง / 199 บาท, 2 ชั่วโมง / 300 บาท หรือครึ่งวัน 4 ชั่วโมง / 599 บาท")])}</div></div></div></section>`
});

const faq = layout({
  page: "faq",
  titleEn: "FAQ | Siamese Cat Creative Club",
  titleTh: "คำถามที่พบบ่อย | Siamese Cat Creative Club",
  description: "Frequently asked questions about Playgroup, Creative Club, meal care and booking.",
  body: `<section class="section fawn"><div class="narrow"><span class="eyebrow">${text("FAQ", "คำถามที่พบบ่อย")}</span><h1>${text("Good to know before booking", "ข้อมูลควรรู้ก่อนจอง")}</h1><p class="kicker">${text("Answers for Little Explorer Playgroup, After School Explorer, meal care and booking.", "คำตอบเกี่ยวกับ Little Explorer Playgroup, After School Explorer, Meal Care และการจอง")}</p>
  <div class="faq-category"><h2>${text("Programs", "โปรแกรม")}</h2><div class="faq-list">
    <details class="faq-item" open><summary>${text("What is the difference between Playgroup and Creative Club?", "Playgroup กับ Creative Club ต่างกันอย่างไร?")}</summary><div class="faq-answer"><p>${text("Little Explorer Playgroup is for daytime or weekend playgroup care. After School Explorer Program is for after-school routines with homework, creative activity, dinner support and pickup.", "Little Explorer Playgroup เหมาะกับการดูแลช่วงกลางวันหรือวันหยุด ส่วน After School Explorer Program เหมาะกับกิจวัตรหลังเลิกเรียน เช่น การบ้าน กิจกรรมสร้างสรรค์ อาหารเย็น และรอรับกลับ")}</p></div></details>
    <details class="faq-item"><summary>${text("Is this private nanny care?", "เป็นบริการพี่เลี้ยงส่วนตัวหรือไม่?")}</summary><div class="faq-answer"><p>${text("No. Little Explorer Playgroup and After School Explorer are supervised small-group programs, not one-on-one nanny service.", "ไม่ใช่ Little Explorer Playgroup และ After School Explorer เป็นการดูแลแบบกลุ่มเล็กที่มีทีมงานดูแล ไม่ใช่บริการพี่เลี้ยงตัวต่อตัว")}</p></div></details>
    <details class="faq-item"><summary>${text("Is this tutoring?", "เป็นการสอนพิเศษหรือไม่?")}</summary><div class="faq-answer"><p>${text("No. Staff can support homework monitoring, reminders, reading and quiet focus, but this is not formal private tutoring.", "ไม่ใช่ ทีมงานช่วยดูแลการบ้าน เตือน อ่านหนังสือ และมุมโฟกัสได้ แต่ไม่ใช่การสอนพิเศษแบบตัวต่อตัว")}</p></div></details>
  </div></div>
  <div class="faq-category"><h2>${text("Prices and meal care", "ราคาและ Meal Care")}</h2><div class="faq-list">
    <details class="faq-item" open><summary>${text("What are the Playgroup prices?", "ราคา Playgroup คือเท่าไร?")}</summary><div class="faq-answer"><p>${text("Little Explorer Playgroup starts at 199 THB for 1 hour and 300 THB for 2 hours. Weekday half-day is 599 THB, weekday full-day is 999 THB, and weekend full-day is 1,500 THB.", "Little Explorer Playgroup เริ่มที่ 199 บาทสำหรับ 1 ชั่วโมง และ 300 บาทสำหรับ 2 ชั่วโมง ครึ่งวันธรรมดา 599 บาท เต็มวันธรรมดา 999 บาท และเต็มวันวันหยุด 1,500 บาท")}</p></div></details>
    <details class="faq-item"><summary>${text("What are the After School Explorer prices?", "ราคา After School Explorer คือเท่าไร?")}</summary><div class="faq-answer"><p>${text("After School Explorer starts at 199 THB for 1 hour and 300 THB for 2 hours. Weekday after-school half-day is 599 THB. Meal Care Add-On is 299 THB.", "After School Explorer เริ่มที่ 199 บาทสำหรับ 1 ชั่วโมง และ 300 บาทสำหรับ 2 ชั่วโมง หลังเลิกเรียนครึ่งวันธรรมดา 599 บาท และ Meal Care Add-On 299 บาท")}</p></div></details>
    <details class="faq-item"><summary>${text("How does meal care work?", "Meal Care ทำงานอย่างไร?")}</summary><div class="faq-answer"><p>${text("Playgroup uses a 250 THB meal-care value for longer-session value. After-school meal care is a 299 THB add-on with one child-friendly food item and one drink.", "Playgroup ใช้มูลค่า Meal Care 250 บาทในความคุ้มค่าของเซสชันยาว ส่วนหลังเลิกเรียนมี Meal Care Add-On 299 บาท รวมอาหารเด็ก 1 รายการและเครื่องดื่ม 1 แก้ว")}</p></div></details>
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
  titleEn: "Request Received | Siamese Cat Creative Club",
  titleTh: "ได้รับคำขอแล้ว | Siamese Cat Creative Club",
  description: "Thank you for contacting Siamese Cat Creative Club.",
  body: `<section class="success-wrap"><div class="narrow"><div class="success-icon">✓</div><span class="eyebrow">${text("Request received", "ได้รับคำขอแล้ว")}</span><h1 style="font-size:clamp(42px,7vw,68px)">${text("Thank you. Our team will review the request.", "ขอบคุณ ทีมงานจะตรวจสอบคำขอของคุณ")}</h1><p class="kicker" style="margin-inline:auto">${text("This is not yet a confirmed reservation. The visit becomes confirmed after the team replies with an accepted date and time.", "ขณะนี้ยังไม่ถือว่าเป็นการจองที่ยืนยัน การมาใช้บริการจะยืนยันเมื่อทีมงานตอบกลับพร้อมวันและเวลาที่รับได้")}</p><div class="hero-actions" style="justify-content:center"><a class="btn btn-secondary" href="/memberships">${text("Review Packages", "ดูแพ็กเกจ")}</a><a class="btn btn-secondary" href="/">${text("Return Home", "กลับหน้าหลัก")}</a></div></div></section>`
});

const notFound = layout({
  page: "404",
  titleEn: "Page Not Found | Siamese Cat Creative Club",
  titleTh: "ไม่พบหน้า | Siamese Cat Creative Club",
  description: "The requested page could not be found.",
  body: `<section class="success-wrap"><div class="narrow"><span class="eyebrow">404</span><h1 style="font-size:clamp(48px,8vw,86px)">${text("We couldn't find this page", "ไม่พบหน้านี้")}</h1><p class="kicker" style="margin-inline:auto">${text("Explore Little Explorer Playgroup, After School Explorer, packages and meal care from the main pages.", "ดู Little Explorer Playgroup, After School Explorer, แพ็กเกจ และ Meal Care ได้จากหน้าหลัก")}</p><div class="hero-actions" style="justify-content:center"><a class="btn btn-primary" href="/memberships">${text("View Packages", "ดูแพ็กเกจ")}</a><a class="btn btn-secondary" href="/">${text("Return Home", "กลับหน้าหลัก")}</a></div></div></section>`
});

const pages = {
  "index.html": home,
  "playgroup.html": playgroup,
  "creative.html": creative,
  "memberships.html": memberships,
  "dinner.html": dinner,
  "inside.html": inside,
  "first-visit.html": firstVisit,
  "faq.html": faq,
  "thank-you.html": thankYou,
  "404.html": notFound,
};

for (const [file, html] of Object.entries(pages)) {
  writeFileSync(join(OUT, file), html);
}

console.log(`Wrote ${Object.keys(pages).length} main-site pages.`);

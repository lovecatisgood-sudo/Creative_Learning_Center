(() => {
  const language = document.documentElement.lang.startsWith("th") ? "th" : "en";
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const canvas = $("#cardCanvas");
  const context = canvas.getContext("2d");
  const logo = new Image();
  const sample = new Image();
  const base = document.body.dataset.base || "";

  logo.src = `${base}assets/siamese-cat-cafe-logo.png`;
  sample.src = `${base}assets/charlie-cat.webp`;

  const copy = {
    en: {
      passport: "CAT PASSPORT",
      republic: "SIAMESE CAT REPUBLIC",
      nickname: "Nickname",
      birthday: "DOB",
      sex: "SEX",
      breed: "BREED / NATIONALITY",
      title: "OFFICIAL TITLE",
      id: "MEOW ID",
      footer: "Made with Siamese Cat Creative Club",
      hotel: "SIAMESE CAT HOTEL",
      guest: "GUEST CARD",
      guestType: "GUEST TYPE",
      cafe: "SIAMESE CAT CAFÉ",
      member: "MEMBER CARD",
      memberStatus: "MEMBER STATUS",
      thai: "KINGDOM OF SIAMESE CATS",
      royal: "ROYAL SIAMESE CERTIFICATE",
      vintage: "VINTAGE 1986 CAT ID",
    },
    th: {
      passport: "พาสปอร์ตแมว",
      republic: "สาธารณรัฐแมวสยาม",
      nickname: "ชื่อเล่น",
      birthday: "วันเกิด",
      sex: "เพศ",
      breed: "สายพันธุ์ / สัญชาติ",
      title: "ตำแหน่งอย่างเป็นทางการ",
      id: "รหัสเหมียว",
      footer: "สร้างด้วย Siamese Cat Creative Club",
      hotel: "SIAMESE CAT HOTEL",
      guest: "บัตรแขกกิตติมศักดิ์",
      guestType: "ประเภทแขก",
      cafe: "SIAMESE CAT CAFÉ",
      member: "บัตรสมาชิก",
      memberStatus: "สถานะสมาชิก",
      thai: "ราชอาณาจักรแมวสยาม",
      royal: "ประกาศนียบัตรราชวงศ์แมวสยาม",
      vintage: "บัตรแมววินเทจ 1986",
    },
  }[language];

  const themes = {
    classic: { background: "#f7efdf", header: "#122a47", accent: "#c8a15a", ink: "#172c47" },
    thai: { background: "#f5ead4", header: "#7d1719", accent: "#d8aa4c", ink: "#501819" },
    vintage: { background: "#ead8b2", header: "#194f50", accent: "#ce7559", ink: "#3a2b22" },
    royal: { background: "#21122f", header: "#34104b", accent: "#d5ad52", ink: "#f0d987" },
    hotel: { background: "#fbf3e5", header: "#0e4e4b", accent: "#c79b47", ink: "#174d4a" },
    cafe: { background: "#fff4e4", header: "#8b542e", accent: "#70c6a9", ink: "#3c2c22" },
  };

  const formats = {
    landscape: { width: 1536, height: 1024, draw: drawLandscape },
    square: { width: 1080, height: 1080, draw: drawSquare },
    story: { width: 1080, height: 1920, draw: drawStory },
  };

  let selectedPhoto = null;
  let selectedPhotoUrl = null;
  let selectedTheme = "classic";
  const requestedFormat = new URLSearchParams(window.location.search).get("format");
  let selectedFormat = Object.hasOwn(formats, requestedFormat) ? requestedFormat : "landscape";

  function value(id, fallback = "") {
    return ($(`#${id}`)?.value || fallback).trim();
  }

  function catDetails() {
    const thai = language === "th";
    return {
      name: value("name", thai ? "ชาร์ลี" : "CHARLIE"),
      nickname: value("nickname", thai ? "จอมป่วน" : "Chaos"),
      birthday: value("birthday", thai ? "17 พ.ค." : "17 MAY"),
      sex: value("sex", thai ? "ชาย" : "MALE"),
      breed: value("breed", thai ? "วิเชียรมาศ" : "Siamese"),
      personality: value("personality", thai ? "มืออาชีพด้านความป่วน" : "PROFESSIONAL TROUBLEMAKER"),
      id: value("catid", "MEOW-1986-001"),
    };
  }

  function heading() {
    if (selectedTheme === "thai") return { main: copy.thai, sub: copy.passport };
    if (selectedTheme === "vintage") return { main: copy.republic, sub: copy.vintage };
    if (selectedTheme === "royal") return { main: copy.republic, sub: copy.royal };
    if (selectedTheme === "hotel") return { main: copy.hotel, sub: copy.guest };
    if (selectedTheme === "cafe") return { main: copy.cafe, sub: copy.member };
    return { main: copy.republic, sub: copy.passport };
  }

  function roundedRect(x, y, width, height, radius, fill, stroke, strokeWidth = 2) {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
    if (fill) {
      context.fillStyle = fill;
      context.fill();
    }
    if (stroke) {
      context.strokeStyle = stroke;
      context.lineWidth = strokeWidth;
      context.stroke();
    }
  }

  function text(textValue, x, y, size, color, weight = "700", align = "left", family = "Georgia") {
    context.save();
    context.fillStyle = color;
    context.font = `${weight} ${size}px ${family}`;
    context.textAlign = align;
    context.fillText(textValue, x, y);
    context.restore();
  }

  function fitText(textValue, x, y, maximumWidth, preferredSize, color, weight = "700", align = "left", family = "Georgia", minimumSize = 15) {
    context.save();
    let size = preferredSize;
    context.font = `${weight} ${size}px ${family}`;
    while (context.measureText(textValue).width > maximumWidth && size > minimumSize) {
      size -= 1;
      context.font = `${weight} ${size}px ${family}`;
    }
    context.fillStyle = color;
    context.textAlign = align;
    context.fillText(textValue, x, y);
    context.restore();
  }

  function cover(image, x, y, width, height) {
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    if (!sourceWidth || !sourceHeight) return;
    const scale = Math.max(width / sourceWidth, height / sourceHeight);
    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;
    context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
  }

  function drawCardBase(card, palette) {
    context.fillStyle = palette.background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    roundedRect(card.x, card.y, card.width, card.height, card.radius, palette.background, palette.ink, 8);
    roundedRect(card.x + 14, card.y + 14, card.width - 28, card.height - 28, Math.max(18, card.radius - 10), null, palette.accent, 4);
  }

  function drawHeader(card, headerHeight, palette, headingOffset = 0, logoSize = 94) {
    const headingText = heading();
    const headerX = card.x + 18;
    const headerY = card.y + 18;
    const headerWidth = card.width - 36;
    roundedRect(headerX, headerY, headerWidth, headerHeight, 18, palette.header);
    if (logo.complete && logo.naturalWidth) context.drawImage(logo, card.x + 45, card.y + 37, logoSize, logoSize);
    const center = card.x + card.width / 2 + headingOffset;
    fitText(headingText.main, center, card.y + Math.min(headerHeight - 78, 95), card.width - 340, 55, palette.accent, "800", "center");
    fitText(headingText.sub, center, card.y + Math.min(headerHeight - 28, 145), card.width - 360, 26, selectedTheme === "royal" ? palette.ink : "#fff1d8", "700", "center", "Arial");
  }

  function drawPhotoFrame(photo, palette) {
    roundedRect(photo.x - 12, photo.y - 12, photo.width + 24, photo.height + 24, 28, "#f6ead6", palette.accent, 5);
    context.save();
    context.beginPath();
    context.roundRect(photo.x, photo.y, photo.width, photo.height, 20);
    context.clip();
    cover(selectedPhoto || sample, photo.x, photo.y, photo.width, photo.height);
    context.restore();
  }

  function drawDetailsLeftAligned({ x, y, width, palette, scale = 1 }) {
    const details = catDetails();
    const s = scale;
    const nameSize = 76 * s;
    const labelSize = Math.max(15, 18 * s);
    const valueSize = Math.max(22, 32 * s);
    const smallValueSize = Math.max(20, 28 * s);
    const titleLabel = selectedTheme === "hotel" ? copy.guestType : selectedTheme === "cafe" ? copy.memberStatus : copy.title;

    fitText(details.name.toUpperCase(), x, y, width, nameSize, palette.ink, "900", "left", "Georgia", Math.max(28, 44 * s));
    text(`${copy.nickname}: ${details.nickname}`, x, y + 58 * s, Math.max(20, 28 * s), palette.ink, "600", "left", "Arial");

    context.strokeStyle = palette.accent;
    context.lineWidth = Math.max(2, 3 * s);
    context.beginPath();
    context.moveTo(x, y + 85 * s);
    context.lineTo(x + width, y + 85 * s);
    context.stroke();

    const row = y + 145 * s;
    text(copy.birthday, x, row, labelSize, palette.accent, "800", "left", "Arial");
    fitText(details.birthday, x, row + 38 * s, width * 0.45, valueSize, palette.ink, "800", "left", "Georgia", 18);
    text(copy.sex, x + width * 0.53, row, labelSize, palette.accent, "800", "left", "Arial");
    fitText(details.sex, x + width * 0.53, row + 38 * s, width * 0.47, valueSize, palette.ink, "800", "left", "Georgia", 18);
    text(copy.breed, x, row + 105 * s, labelSize, palette.accent, "800", "left", "Arial");
    fitText(details.breed, x, row + 143 * s, width, smallValueSize, palette.ink, "800", "left", "Georgia", 18);
    text(titleLabel, x, row + 218 * s, labelSize, palette.accent, "800", "left", "Arial");

    const boxY = row + 238 * s;
    const boxHeight = 94 * s;
    roundedRect(x, boxY, width, boxHeight, 18, selectedTheme === "royal" ? palette.header : "rgba(255,255,255,.5)", palette.accent, 3);
    fitText(details.personality.toUpperCase(), x + width / 2, boxY + boxHeight * 0.64, width - 28, Math.max(23, 40 * s), palette.ink, "900", "center", "Georgia", 17);
    text(copy.id, x, row + 380 * s, Math.max(14, 17 * s), palette.accent, "800", "left", "Arial");
    fitText(details.id, x, row + 423 * s, width, Math.max(22, 38 * s), palette.ink, "900", "left", "Georgia", 18);
  }

  function drawDetailsCentered({ x, y, width, palette }) {
    const details = catDetails();
    const center = x + width / 2;
    const titleLabel = selectedTheme === "hotel" ? copy.guestType : selectedTheme === "cafe" ? copy.memberStatus : copy.title;

    fitText(details.name.toUpperCase(), center, y, width - 70, 70, palette.ink, "900", "center", "Georgia", 32);
    text(`${copy.nickname}: ${details.nickname}`, center, y + 52, 27, palette.ink, "600", "center", "Arial");
    context.strokeStyle = palette.accent;
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(x + 30, y + 78);
    context.lineTo(x + width - 30, y + 78);
    context.stroke();

    const firstColumn = x + 42;
    const secondColumn = x + width * 0.56;
    text(copy.birthday, firstColumn, y + 128, 18, palette.accent, "800", "left", "Arial");
    fitText(details.birthday, firstColumn, y + 165, width * 0.38, 32, palette.ink, "800", "left", "Georgia", 18);
    text(copy.sex, secondColumn, y + 128, 18, palette.accent, "800", "left", "Arial");
    fitText(details.sex, secondColumn, y + 165, width * 0.34, 32, palette.ink, "800", "left", "Georgia", 18);
    text(copy.breed, center, y + 230, 18, palette.accent, "800", "center", "Arial");
    fitText(details.breed, center, y + 267, width - 90, 32, palette.ink, "800", "center", "Georgia", 18);
    text(titleLabel, center, y + 322, 18, palette.accent, "800", "center", "Arial");
    roundedRect(x + 34, y + 342, width - 68, 104, 20, selectedTheme === "royal" ? palette.header : "rgba(255,255,255,.5)", palette.accent, 3);
    fitText(details.personality.toUpperCase(), center, y + 408, width - 110, 39, palette.ink, "900", "center", "Georgia", 18);
    text(copy.id, center, y + 498, 17, palette.accent, "800", "center", "Arial");
    fitText(details.id, center, y + 539, width - 90, 38, palette.ink, "900", "center", "Georgia", 18);
  }

  function drawFooter(card, palette, height = 58) {
    const footerY = card.y + card.height - height - 30;
    roundedRect(card.x + 20, footerY, card.width - 40, height, 16, palette.header);
    fitText(copy.footer, card.x + card.width / 2, footerY + height * 0.66, card.width - 140, 23, selectedTheme === "cafe" ? "#fff5e7" : palette.accent, "700", "center", "Georgia", 14);
  }

  function drawLandscape(palette) {
    const card = { x: 46, y: 46, width: canvas.width - 92, height: canvas.height - 92, radius: 36 };
    drawCardBase(card, palette);
    drawHeader(card, 175, palette, 60);
    const photo = { x: card.x + 62, y: card.y + 233, width: Math.min(card.width * 0.37, 500), height: Math.min(card.height - 325, 600) };
    drawPhotoFrame(photo, palette);
    const detailsX = photo.x + photo.width + 62;
    drawDetailsLeftAligned({ x: detailsX, y: photo.y + 45, width: card.x + card.width - 62 - detailsX, palette });
    drawFooter(card, palette);
  }

  function drawSquare(palette) {
    const card = { x: 46, y: 46, width: canvas.width - 92, height: canvas.height - 92, radius: 34 };
    drawCardBase(card, palette);
    drawHeader(card, 154, palette, 42, 84);
    const photo = { x: card.x + 60, y: card.y + 214, width: 350, height: 455 };
    drawPhotoFrame(photo, palette);
    const detailsX = photo.x + photo.width + 50;
    drawDetailsLeftAligned({ x: detailsX, y: card.y + 248, width: card.x + card.width - 58 - detailsX, palette, scale: 0.92 });
    drawFooter(card, palette, 54);
  }

  function drawStory(palette) {
    const card = { x: 44, y: 58, width: canvas.width - 88, height: canvas.height - 116, radius: 38 };
    drawCardBase(card, palette);
    drawHeader(card, 178, palette, 56, 108);
    const photo = { x: card.x + 62, y: card.y + 252, width: card.width - 124, height: 680 };
    drawPhotoFrame(photo, palette);
    drawDetailsCentered({ x: card.x + 54, y: photo.y + photo.height + 112, width: card.width - 108, palette });
    drawFooter(card, palette, 60);
  }

  function draw() {
    const format = formats[selectedFormat];
    canvas.width = format.width;
    canvas.height = format.height;
    format.draw(themes[selectedTheme]);
  }

  function requestDraw() {
    requestAnimationFrame(draw);
  }

  $$("input").forEach((input) => input.addEventListener("input", requestDraw));
  $$(".theme").forEach((button) => {
    button.addEventListener("click", () => {
      selectedTheme = button.dataset.theme;
      $$(".theme").forEach((themeButton) => themeButton.classList.toggle("active", themeButton === button));
      requestDraw();
    });
  });

  $("#photoInput").addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (selectedPhotoUrl) URL.revokeObjectURL(selectedPhotoUrl);
    selectedPhotoUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      selectedPhoto = image;
      requestDraw();
    };
    image.src = selectedPhotoUrl;
  });

  $("#randomTitle").addEventListener("click", () => {
    const titles = language === "th"
      ? ["ซีอีโอฝ่ายงีบ", "หัวหน้าตรวจขนม", "ผู้จัดการกล่องประจำบ้าน", "ราชาแห่งโต๊ะกาแฟ", "ผู้เชี่ยวชาญซูมมี่ตีสาม"]
      : ["CEO OF NAPPING", "CHIEF SNACK INSPECTOR", "REGIONAL BOX MANAGER", "COFFEE TABLE KING", "3AM ZOOMIES EXPERT"];
    $("#personality").value = titles[Math.floor(Math.random() * titles.length)];
    requestDraw();
  });

  $("#newId").addEventListener("click", () => {
    $("#catid").value = `MEOW-1986-${String(Math.floor(1 + Math.random() * 9999)).padStart(4, "0")}`;
    requestDraw();
  });

  $("#format").addEventListener("change", (event) => {
    selectedFormat = event.target.value;
    requestDraw();
  });

  $("#format").value = selectedFormat;

  $("#download").addEventListener("click", () => {
    draw();
    const link = document.createElement("a");
    link.download = `siamese-cat-${selectedTheme}-${selectedFormat}.png`;
    link.href = canvas.toDataURL("image/png", 1);
    link.click();
  });

  $("#share").addEventListener("click", async () => {
    draw();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 0.95));
    if (!blob) return;
    const file = new File([blob], "my-cat-passport.png", { type: "image/png" });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      navigator.share({ files: [file], title: "My Siamese Cat ID" }).catch(() => {});
    } else {
      $("#download").click();
    }
  });

  logo.onload = requestDraw;
  sample.onload = requestDraw;
  requestDraw();
})();

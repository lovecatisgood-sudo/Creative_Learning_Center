// Lightweight key-based dictionary (no i18n framework, per PRD §2). Thai is the
// default; every user-visible string lives here so nothing is hardcoded in JSX.
// User-entered data (names, notes) is never translated.

export type Lang = "th" | "en";

export const dict = {
  // ── App-wide ──
  shopName: { th: "Siamese Cat Creative Club", en: "Siamese Cat Creative Club" },
  langToggle: { th: "EN", en: "ไทย" }, // shows the OTHER language
  thb: { th: "บาท", en: "THB" },
  cancel: { th: "ยกเลิก", en: "Cancel" },
  save: { th: "บันทึก", en: "Save" },
  confirm: { th: "ยืนยัน", en: "Confirm" },
  back: { th: "กลับ", en: "Back" },
  loading: { th: "กำลังโหลด…", en: "Loading…" },
  required: { th: "จำเป็นต้องกรอก", en: "This field is required" },
  quickAddFailed: { th: "เพิ่มไม่สำเร็จ", en: "Couldn't add" },
  signupFailed: { th: "ลงทะเบียนไม่สำเร็จ กรุณาลองใหม่", en: "Registration failed, please try again" },
  invalidPhone: { th: "เบอร์โทรไม่ถูกต้อง", en: "Invalid phone number" },
  dobFuture: { th: "วันเกิดต้องไม่เป็นอนาคต", en: "Date of birth can't be in the future" },

  // ── Bottom nav ──
  navSessions: { th: "เซสชัน", en: "Sessions" },
  navSearch: { th: "ค้นหา", en: "Search" },
  navSell: { th: "ขาย", en: "Sell" },
  navOverview: { th: "ภาพรวม", en: "Overview" },
  navInquiries: { th: "คำถาม", en: "Inquiries" },
  navBlog: { th: "บล็อก", en: "Blog" },

  // ── Login (A0) ──
  loginTitle: { th: "เข้าสู่ระบบพนักงาน", en: "Staff login" },
  email: { th: "อีเมล", en: "Email" },
  password: { th: "รหัสผ่าน", en: "Password" },
  logIn: { th: "เข้าสู่ระบบ", en: "Log in" },
  logOut: { th: "ออกจากระบบ", en: "Log out" },
  loginError: { th: "อีเมลหรือรหัสผ่านไม่ถูกต้อง", en: "Email or password is incorrect." },

  // ── Signup (P1/P2) ──
  signupTitle: { th: "ลงทะเบียนผู้ปกครอง", en: "Parent signup" },
  signupSubtitle: { th: "ลงทะเบียนผู้ปกครองและเด็ก", en: "Register a parent and child" },
  parentSection: { th: "ข้อมูลผู้ปกครอง", en: "Parent details" },
  parentName: { th: "ชื่อผู้ปกครอง", en: "Parent's name" },
  contactNumber: { th: "เบอร์ติดต่อ", en: "Contact number" },
  emailOptional: { th: "อีเมล (ไม่บังคับ)", en: "Email (optional)" },
  childSection: { th: "ข้อมูลบุตร", en: "Child details" },
  childName: { th: "ชื่อบุตร", en: "Child's name" },
  dob: { th: "วันเกิด", en: "Date of birth" },
  gender: { th: "เพศ", en: "Gender" },
  male: { th: "ชาย", en: "Male" },
  female: { th: "หญิง", en: "Female" },
  addChild: { th: "เพิ่มบุตร", en: "Add another child" },
  removeChild: { th: "ลบ", en: "Remove" },
  consent: {
    th: "ข้าพเจ้ายอมรับ ข้อกำหนดและเงื่อนไข และ นโยบายความเป็นส่วนตัว",
    en: "I acknowledge the Terms & Conditions and Privacy Policy",
  },
  termsLink: { th: "ข้อกำหนดและเงื่อนไข", en: "Terms & Conditions" },
  privacyLink: { th: "นโยบายความเป็นส่วนตัว", en: "Privacy Policy" },
  register: { th: "ลงทะเบียน", en: "Register" },
  registerSuccess: { th: "ลงทะเบียนสำเร็จ", en: "Registration successful" },
  showStaff: { th: "กรุณาแสดงหน้าจอนี้ให้พนักงาน", en: "Please show this screen to our staff" },
  duplicatePhoneWarn: {
    th: "เบอร์นี้เคยลงทะเบียนแล้ว — พนักงานจะช่วยตรวจสอบ",
    en: "This number is already registered — staff will help resolve.",
  },
  registerAnother: { th: "ลงทะเบียนเพิ่ม", en: "Register another" },

  // ── Search (A2) ──
  searchPlaceholder: { th: "ชื่อบุตร ผู้ปกครอง หรือเบอร์โทร…", en: "Child, parent, or phone…" },
  searchHint: { th: "พิมพ์อย่างน้อย 2 ตัวอักษร", en: "Type at least 2 characters" },
  noResults: { th: "ไม่พบข้อมูล", en: "No matches" },
  quickAddChild: { th: "เพิ่มเด็กด่วน", en: "Quick add child" },
  profileIncomplete: { th: "ข้อมูลไม่ครบ", en: "PROFILE INCOMPLETE" },
  inSession: { th: "กำลังเล่น", en: "in session" },
  parentLabel: { th: "ผู้ปกครอง", en: "Parent" },

  // ── Quick add (A2b) ──
  quickAddTitle: { th: "เพิ่มเด็กด่วน", en: "Quick add child" },
  contactPhone: { th: "เบอร์ติดต่อ", en: "Contact phone" },
  createAndOpen: { th: "สร้างและเปิด", en: "Create & open" },

  // ── Child page (A3) ──
  childPageEdit: { th: "แก้ไข", en: "Edit" },
  ageYears: { th: "ปี", en: "yrs" },
  noParentYet: { th: "ยังไม่มีข้อมูลผู้ปกครอง", en: "No parent details yet" },
  addParentDetails: { th: "＋ เพิ่มข้อมูลผู้ปกครอง", en: "＋ Add parent details" },
  sectionActiveSession: { th: "เซสชันที่กำลังเล่น", en: "Active session" },
  sectionPackages: { th: "แพ็กเกจ", en: "Packages" },
  sectionHistory: { th: "ประวัติ", en: "History" },
  noPackages: { th: "ยังไม่มีแพ็กเกจ", en: "No packages yet" },
  noHistory: { th: "ยังไม่มีประวัติ", en: "No history yet" },
  sell: { th: "ขาย", en: "Sell" },
  startPackage: { th: "เริ่ม", en: "Start" },
  redeem: { th: "ใช้สิทธิ์", en: "Redeem" },
  consumeExtraHour: { th: "ใช้ +1 ชม.", en: "Consume +1h" },

  // ── Add / complete parent sheet ──
  completeProfileTitle: { th: "กรอกข้อมูลผู้ปกครอง", en: "Complete parent details" },
  linkExistingParent: { th: "เชื่อมกับผู้ปกครองเดิม (ค้นจากเบอร์)", en: "Link to existing parent by phone" },
  saveProfile: { th: "บันทึกข้อมูล", en: "Save details" },

  // ── Status chips ──
  chipAvailable: { th: "พร้อมใช้", en: "AVAILABLE" },
  chipActive: { th: "กำลังใช้", en: "ACTIVE" },
  chipConsumed: { th: "ใช้แล้ว", en: "CONSUMED" },
  chipExpired: { th: "หมดอายุ", en: "EXPIRED" },
  chipOverdue: { th: "เกินเวลา", en: "OVERDUE" },
  chipFamily: { th: "ครอบครัว", en: "FAMILY" },

  // ── Package remaining-credit summary ──
  hoursShort: { th: "ชม.", en: "hrs" },
  crayonShort: { th: "สีเทียน", en: "crayon" },
  clayShort: { th: "ดินปั้น", en: "clay" },
  expShort: { th: "หมดอายุ", en: "exp" },

  // ── Sell / cart (A4) ──
  sellingTo: { th: "ขายให้", en: "Selling to" },
  chooseChild: { th: "เลือกเด็กก่อนเริ่มขาย", en: "Choose a child to start selling" },
  change: { th: "เปลี่ยน", en: "Change" },
  secEntry: { th: "เข้าเล่น", en: "Entry" },
  secAddons: { th: "กิจกรรมสร้างสรรค์", en: "Creative add-ons" },
  secPackages: { th: "แพ็กเกจ", en: "Packages" },
  secPasses: { th: "บัตรเล่น", en: "Play passes" },
  captionPlay: { th: "ใช้ระหว่างเล่น", en: "consume during play" },
  captionTimer: { th: "ใช้กับเวลาที่กำลังเดิน", en: "consume on a running timer" },
  extraNeedsSession: { th: "ต้องมีเซสชันที่กำลังเล่น", en: "needs a running session" },
  checkout: { th: "ชำระเงิน", en: "Checkout" },
  itemsCount: { th: "รายการ", en: "items" },

  // ── Checkout (A5) ──
  methodPromptpay: { th: "พร้อมเพย์", en: "PromptPay" },
  methodBank: { th: "โอนธนาคาร", en: "Bank transfer" },
  methodCash: { th: "เงินสด", en: "Cash" },
  scanToPay: { th: "สแกนเพื่อจ่าย", en: "Scan to pay" },
  tapToEnlarge: { th: "แตะเพื่อขยายเต็มจอ", en: "Tap to enlarge" },
  bankNameLabel: { th: "ธนาคาร", en: "Bank" },
  accountName: { th: "ชื่อบัญชี", en: "Account name" },
  accountNumber: { th: "เลขที่บัญชี", en: "Account number" },
  copy: { th: "คัดลอก", en: "Copy" },
  copied: { th: "คัดลอกแล้ว", en: "Copied" },
  collect: { th: "เก็บเงิน", en: "Collect" },
  takePhoto: { th: "📷 ถ่ายรูปสลิป / เงินสด", en: "📷 Take photo of slip / cash" },
  retake: { th: "ถ่ายใหม่", en: "Retake" },
  proofRequired: { th: "ต้องแนบรูปหลักฐานก่อนยืนยัน", en: "A proof photo is required before confirming" },
  extendNotApplied: {
    th: "ไม่สามารถต่อเวลาได้ (เซสชันสิ้นสุดแล้ว) — เพิ่มเป็นเครดิตแทน",
    en: "Couldn't extend (session ended) — added as a credit instead",
  },
  confirmPayment: { th: "ยืนยันรับชำระเงิน", en: "Confirm payment received" },
  confirmSheetTitle: { th: "ยืนยันการชำระเงิน", en: "Confirm payment" },
  via: { th: "ผ่าน", en: "via" },
  uploading: { th: "กำลังอัปโหลด…", en: "Uploading…" },
  promptpayNotConfigured: { th: "ยังไม่ได้ตั้งค่าพร้อมเพย์", en: "PromptPay is not configured" },

  // ── Receipt (A6) ──
  receipt: { th: "ใบเสร็จ", en: "Receipt" },
  receiptNo: { th: "เลขที่", en: "No." },
  dateTime: { th: "วันที่/เวลา", en: "Date/time" },
  item: { th: "รายการ", en: "Item" },
  qty: { th: "จำนวน", en: "Qty" },
  price: { th: "ราคา", en: "Price" },
  total: { th: "รวมทั้งสิ้น", en: "Total" },
  paymentMethod: { th: "วิธีชำระเงิน", en: "Payment method" },
  print: { th: "พิมพ์", en: "Print" },
  saveImage: { th: "บันทึกรูป", en: "Save as image" },
  startNow: { th: "เริ่มแพ็กเกจตอนนี้", en: "Start a package now" },
  viewProof: { th: "ดูรูปหลักฐาน", en: "View proof photo" },
  paymentProof: { th: "หลักฐานการชำระเงิน", en: "Payment proof" },
  done: { th: "เสร็จสิ้น", en: "Done" },
  thankYou: { th: "ขอบคุณค่ะ", en: "Thank you" },

  // ── Sessions dashboard (A1) ──
  sessionsEmpty: { th: "ยังไม่มีเด็กเช็คอิน เริ่มแพ็กเกจจากหน้าเด็ก", en: "No children checked in. Start a package from a child's page." },
  start: { th: "เริ่ม", en: "Start" },
  pickup: { th: "รับกลับ", en: "Pickup" },
  overdue: { th: "เกินเวลา", en: "OVERDUE" },

  // ── Start config (A7) ──
  startTitle: { th: "เริ่มแพ็กเกจ", en: "Start package" },
  startConfirmTimed: { th: "เริ่มเซสชันสำหรับ", en: "Start session for" },
  pickupAt: { th: "รับกลับเวลา", en: "Pickup at" },
  hoursToUse: { th: "จำนวนชั่วโมงที่จะใช้", en: "Hours to use" },
  willRemain: { th: "จะเหลือ", en: "will remain" },
  chooseSibling: { th: "เลือกเด็กที่จะใช้บัตร", en: "Choose which child will use the pass" },
  startSession: { th: "เริ่มเซสชัน", en: "Start session" },

  // ── Pickup slip (A8) ──
  sessionStarted: { th: "เริ่มเซสชันแล้ว", en: "Session started" },
  pickupSlip: { th: "สลิปรับกลับ", en: "Pickup slip" },
  printSlip: { th: "พิมพ์สลิป", en: "Print pickup slip" },
  hoursRemaining: { th: "ชั่วโมงคงเหลือ", en: "Hours remaining" },

  // ── Session detail & end (A9) ──
  sessionDetail: { th: "รายละเอียดเซสชัน", en: "Session detail" },
  consumablesTitle: { th: "ใช้ระหว่างเซสชันนี้", en: "Consumables during this session" },
  consume: { th: "ใช้", en: "Consume" },
  left: { th: "เหลือ", en: "left" },
  addOneHour: { th: "เพิ่ม 1 ชั่วโมง", en: "Add 1 hour" },
  endSession: { th: "จบเซสชัน", en: "End session" },
  endConfirmTitle: { th: "จบเซสชัน?", en: "End session?" },
  endConfirmTimed: { th: "จบเซสชันสำหรับ", en: "End session for" },
  refundTitle: { th: "คืนชั่วโมง", en: "Refund hours" },
  refundQuestion: { th: "คืนชั่วโมงที่ไม่ได้ใช้เข้าบัตร?", en: "Refund unused hour(s) to the pass?" },
  booked: { th: "จอง", en: "Booked" },
  used: { th: "ใช้ไป", en: "used" },
  confirmEndRefund: { th: "ยืนยันจบและคืนชั่วโมง", en: "Confirm end + refund" },
  hoursRemainingOnPass: { th: "ชั่วโมงคงเหลือในบัตร", en: "hrs remaining on pass" },
  overdueBanner: { th: "เซสชันเกินเวลา — อาจขายเพิ่ม 1 ชั่วโมง", en: "Session ran over — consider selling Additional 1 Hour" },

  // ── Redeem sheet (A10) ──
  redeemTitle: { th: "ใช้สิทธิ์", en: "Redeem credit" },
  redeemCrayon: { th: "ใช้สิทธิ์สีเทียน", en: "Use crayon credit" },
  redeemClay: { th: "ใช้สิทธิ์ดินปั้น", en: "Use clay credit" },
  noActiveSessionWarn: { th: "ไม่มีเซสชันที่กำลังเล่น — ปกติใช้ระหว่างเวลาเล่น", en: "No active session — add-ons are normally used during play time" },
  redeemAnyway: { th: "ใช้เลย", en: "Redeem anyway" },
  crayonCredit: { th: "สิทธิ์สีเทียน", en: "Crayon credit" },
  clayCredit: { th: "สิทธิ์ดินปั้น", en: "Clay credit" },
  extraHourCredit: { th: "สิทธิ์ +1 ชั่วโมง", en: "+1 Hour credit" },

  // ── Overview (A11) ──
  unitDay: { th: "วัน", en: "Day" },
  unitWeek: { th: "สัปดาห์", en: "Week" },
  unitMonth: { th: "เดือน", en: "Month" },
  today: { th: "วันนี้", en: "Today" },
  yesterday: { th: "เมื่อวาน", en: "Yesterday" },
  thisWeek: { th: "สัปดาห์นี้", en: "This week" },
  thisMonth: { th: "เดือนนี้", en: "This month" },
  totalLabel: { th: "รวม", en: "Total" },
  ordersCount: { th: "ออเดอร์", en: "orders" },
  sessionsStarted: { th: "เริ่มเซสชัน", en: "sessions started" },
  creditsConsumed: { th: "ใช้สิทธิ์", en: "credits consumed" },
  noTransactions: { th: "ไม่มีรายการในช่วงนี้", en: "No transactions in this period." },
  printSummary: { th: "พิมพ์สรุป", en: "Print summary" },

  // ── Pagination / directory ──
  pagePrev: { th: "ก่อนหน้า", en: "Prev" },
  pageNext: { th: "ถัดไป", en: "Next" },
  pageOf: { th: "หน้า {a}/{b}", en: "Page {a}/{b}" },
  directoryTitle: { th: "รายชื่อ", en: "Directory" },
  noParentGroup: { th: "ยังไม่มีผู้ปกครอง", en: "No parent registered yet" },
  searchPlaceholder2: { th: "ค้นหาชื่อผู้ปกครอง / บุตร / เบอร์โทร", en: "Search parent / child / phone" },
  emptyDirectory: { th: "ยังไม่มีข้อมูล", en: "No records yet" },
  parentPageTitle: { th: "ข้อมูลผู้ปกครอง", en: "Parent" },
  childrenLabel: { th: "บุตร", en: "Children" },
  historyLabel: { th: "ประวัติการซื้อ", en: "Purchase history" },
  profileCompleteChip: { th: "ข้อมูลครบ", en: "PROFILE COMPLETE" },
  noChildrenYet: { th: "ยังไม่มีบุตร", en: "No children yet" },

  // ── Landing page ──
  landingLogoAlt: { th: "โลโก้ Siamese Cat Creative Club", en: "Siamese Cat Creative Club logo" },
  landingMetaTitle: {
    th: "Siamese Cat Creative Club — Playgroup และดูแลหลังเลิกเรียนใกล้เมกาบางนา",
    en: "Siamese Cat Creative Club — Playgroup & After-School Care Near Mega Bangna",
  },
  landingMetaDescription: {
    th: "โปรแกรมกลุ่มเล็กที่ปลอดภัยสำหรับเด็ก มี Little Explorer Playgroup, After School Explorer, Meal Care และบัตรเหมารอบสำหรับครอบครัวที่มาเป็นประจำ",
    en: "Safe small-group care for children with Little Explorer Playgroup, After School Explorer, meal care and regular family passes.",
  },

  // Hero
  landingHeroLead: {
    th: "สนามเด็กเล่นในร่มและสตูดิโอสร้างสรรค์สำหรับเด็ก ใจกลางกรุงเทพฯ",
    en: "An indoor playroom & creative studio for children, in the heart of Bangkok",
  },
  landingHeroBody: {
    th: "พื้นที่ปลอดภัยและอบอุ่นที่เด็ก ๆ ได้เล่น ทำการบ้านง่าย ๆ ทำกิจกรรมสร้างสรรค์ ทานอาหาร และรอรับกลับ โดยมีทีมงานดูแลแบบกลุ่มเล็ก",
    en: "A safe, welcoming space where children can play, finish simple homework, create, eat and wait for pickup with small-group staff supervision.",
  },
  landingHeroCue: { th: "เลื่อนลงเพื่อดูบริการของเรา ↓", en: "Scroll for our services ↓" },

  // Our Space
  landingSpaceKicker: { th: "สถานที่", en: "The place" },
  landingSpaceTitle: { th: "พื้นที่ของเรา", en: "Our Space" },
  landingSpaceIntro: {
    th: "พื้นที่เดียวที่สว่าง สะอาด และออกแบบมาเพื่อเด็ก ๆ และครอบครัว — โซนเล่น มุมโฟกัส โต๊ะสร้างสรรค์ พื้นที่มื้ออาหาร และขั้นตอนรอรับกลับที่ชัดเจน",
    en: "One bright, clean space designed around children and families: play area, quiet focus corner, creative tables, meal space and a clear pickup routine.",
  },
  landingGalleryPlayroom: { th: "โซนเล่นที่มีพี่เลี้ยงดูแล", en: "Supervised play area" },
  landingGalleryCozy: { th: "มุมพักผ่อนสำหรับผู้ปกครอง", en: "Cozy parent lounge" },
  landingGalleryStudio: { th: "สตูดิโอศิลปะและงานฝีมือ", en: "Art & craft studio" },
  landingGalleryActivity: { th: "ห้องกิจกรรมสร้างสรรค์", en: "Creative activity room" },

  // Our Services
  landingServicesKicker: { th: "สิ่งที่เรามีให้", en: "What we offer" },
  landingServicesTitle: { th: "บริการของเรา", en: "Our Services" },
  landingServicesIntro: {
    th: "มาเล่นได้บ่อยเท่าที่ต้องการ — จ่ายตามครั้งที่มา เพิ่มกิจกรรมสร้างสรรค์ หรือเลือกแพ็กเกจที่รวมทั้งสองอย่างไว้ด้วยกัน",
    en: "Come as often as you like — pay per visit, add a creative activity, or choose a bundle that combines both.",
  },
  svcPlayTitle: { th: "เข้าเล่นแบบมีพี่เลี้ยงดูแล", en: "Supervised Play" },
  svcPlayBody: {
    th: "เข้ามาเล่นในสนามเด็กเล่นในร่มที่ปลอดภัยและมีพี่เลี้ยงดูแล ไม่ต้องสมัครสมาชิก จ่ายตามชั่วโมงและอยู่ได้นานตามต้องการ",
    en: "Drop in to our safe, supervised indoor playroom — no membership needed. Pay by the hour and stay as long as you like.",
  },
  priceHour1Name: { th: "เข้าเล่น 1 ชั่วโมง", en: "1 Hour of Play" },
  priceHour1Value: { th: "฿199", en: "฿199" },
  priceHour2Name: { th: "เข้าเล่น 2 ชั่วโมง", en: "2 Hours of Play" },
  priceHour2Value: { th: "฿300", en: "฿300" },
  priceExtraHourName: { th: "เพิ่มเวลา 1 ชั่วโมง", en: "Add an extra hour" },
  priceExtraHourValue: { th: "฿100", en: "฿100" },
  svcCreativeTitle: { th: "After School Explorer", en: "After School Explorer" },
  svcCreativeBody: {
    th: "โปรแกรมหลังเลิกเรียนที่รวมการเล่น การบ้าน กิจกรรมสร้างสรรค์ มื้ออาหาร และการรอรับกลับตามเวลาที่จอง",
    en: "After-school support with play, homework, creative time, meal care and pickup routines by booked session.",
  },
  actCrayonName: { th: "ครึ่งวันหลังเลิกเรียน", en: "After-school half-day" },
  actCrayonValue: { th: "฿599", en: "฿599" },
  actCrayonDesc: { th: "ดูแล 4 ชั่วโมง พร้อมเล่น สร้างสรรค์ และโฟกัสเงียบ", en: "4 hours with play, creativity and quiet focus" },
  actClayName: { th: "Meal Care หลังเลิกเรียน", en: "After-school meal care" },
  actClayValue: { th: "฿299", en: "฿299" },
  actClayDesc: { th: "อาหารเด็ก 1 รายการและเครื่องดื่ม 1 แก้ว พร้อมทีมงานดูแล", en: "One child-friendly food item and one drink with staff support" },
  bundleTitle: { th: "เซสชัน Playgroup", en: "Playgroup Sessions" },
  bundleBody: {
    th: "ตัวเลือกเพลย์กรุ๊ปตั้งแต่ 1 ชั่วโมง ครึ่งวัน ไปจนถึงเต็มวันธรรมดาและวันหยุด",
    en: "Playgroup options from 1 hour and half-day through weekday and weekend full-day care.",
  },
  bundle1Name: { th: "เข้าเล่น 1 ชั่วโมง", en: "1-Hour Entry" },
  bundle1Value: { th: "฿199", en: "฿199" },
  bundle2Name: { th: "เซสชัน 2 ชั่วโมง", en: "2-Hour Session" },
  bundle2Value: { th: "฿300", en: "฿300" },
  bundle3Name: { th: "เต็มวันวันธรรมดา", en: "Weekday Full-Day" },
  bundle3Value: { th: "฿999", en: "฿999" },
  bundle4Name: { th: "เต็มวันเสาร์หรืออาทิตย์", en: "Weekend Full-Day" },
  bundle4Value: { th: "฿1,500", en: "฿1,500" },

  // Passes & Family Membership
  landingPassesKicker: { th: "มาเป็นประจำ", en: "For regulars" },
  landingPassesTitle: { th: "บัตรเหมารอบเพลย์กรุ๊ป", en: "Playgroup Passes" },
  landingPassesIntro: {
    th: "สำหรับครอบครัวที่ต้องการดูแลวันธรรมดาหรือวันหยุดเป็นประจำ พร้อมราคาต่อครั้งที่คุ้มขึ้น",
    en: "For families who need regular weekday or weekend care with better per-session value.",
  },
  pass1Title: { th: "บัตรเต็มวันธรรมดา 20 ครั้ง", en: "20-Session Weekday Full-Day Pass" },
  pass1Price: { th: "฿18,000", en: "฿18,000" },
  pass1Desc: {
    th: "เต็มวันธรรมดา 20 ครั้ง เฉลี่ย 900 บาทต่อครั้ง สำหรับครอบครัวที่ต้องการดูแลวันธรรมดาเป็นประจำ",
    en: "20 weekday full-day sessions at an effective 900 THB per session for regular weekday care.",
  },
  pass2Tag: { th: "คุ้มค่าที่สุด", en: "Best value" },
  pass2Title: { th: "บัตรเต็มวันเสาร์หรืออาทิตย์ 8 ครั้ง", en: "8-Session Weekend Full-Day Pass" },
  pass2Price: { th: "฿9,200", en: "฿9,200" },
  pass2Desc: {
    th: "เต็มวันเสาร์หรืออาทิตย์ 8 ครั้ง เฉลี่ย 1,150 บาทต่อครั้ง สำหรับการดูแลวันหยุดเป็นประจำ",
    en: "8 Saturday or Sunday full-day sessions at an effective 1,150 THB per session.",
  },

  // Visit us / contact
  visitKicker: { th: "แวะมาหาเรา", en: "Visit us" },
  visitTitle: { th: "มาหาเราได้ที่นี่", en: "Come find us" },
  visitIntro: {
    th: "แวะมาทักทาย โทรสอบถาม หรือดูเส้นทางไปยังสตูดิโอของเราได้เลย",
    en: "Drop by, give us a call, or get directions to our studio.",
  },
  visitPhoneLabel: { th: "โทรศัพท์", en: "Phone" },
  visitEmailLabel: { th: "อีเมล", en: "Email" },
  visitAddressLabel: { th: "ที่อยู่", en: "Address" },
  visitPhoneValue: { th: "+66-0804803802", en: "+66-0804803802" },
  visitEmailValue: { th: "Cafe@siamesecat.cafe", en: "Cafe@siamesecat.cafe" },
  visitAddressValue: {
    th: "46/27, 46/27 ถนนบางนา-ตราด (คู่ขนาน) ต.บางแก้ว อ.บางพลี จ.สมุทรปราการ 10540",
    en: "46/27, 46/27 Bang Na-Trat Frontage Rd, Bang Kaeo, Samut Prakan 10540",
  },
  visitMapTitle: {
    th: "แผนที่ Google แสดงที่ตั้งของ Siamese Cat Creative Club",
    en: "Google Map showing the location of Siamese Cat Creative Club",
  },
  visitOpenMap: { th: "เปิดใน Google Maps", en: "Open in Google Maps" },

  // Footer
  landingFooterTagline: {
    th: "สนามเด็กเล่นในร่มและกิจกรรมสร้างสรรค์สำหรับเด็ก · กรุงเทพฯ",
    en: "Indoor kids playroom & creative activities · Bangkok",
  },
  footerTerms: { th: "ข้อกำหนดและเงื่อนไข", en: "Terms of Service" },
  footerPrivacy: { th: "นโยบายความเป็นส่วนตัว", en: "Privacy Policy" },

  // Legal pages (chrome only — policy body is English, as provided by the owner)
  legalBackToHome: { th: "กลับหน้าหลัก", en: "Back to home" },
  legalThaiNote: {
    th: "เอกสารฉบับนี้จัดทำเป็นภาษาอังกฤษ ฉบับภาษาไทยกำลังจัดเตรียม",
    en: "This document is provided in English. A Thai version is coming soon.",
  },
  termsPageTitle: { th: "ข้อกำหนดและเงื่อนไข", en: "Terms of Service" },
  privacyPageTitle: { th: "นโยบายความเป็นส่วนตัว", en: "Privacy Policy" },
} satisfies Record<string, Record<Lang, string>>;

export type DictKey = keyof typeof dict;

export function t(key: DictKey, lang: Lang): string {
  return dict[key][lang];
}

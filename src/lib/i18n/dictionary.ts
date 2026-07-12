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

  // ── Bottom nav ──
  navSessions: { th: "เซสชัน", en: "Sessions" },
  navSearch: { th: "ค้นหา", en: "Search" },
  navSell: { th: "ขาย", en: "Sell" },
  navOverview: { th: "ภาพรวม", en: "Overview" },

  // ── Login (A0) ──
  loginTitle: { th: "เข้าสู่ระบบพนักงาน", en: "Staff login" },
  email: { th: "อีเมล", en: "Email" },
  password: { th: "รหัสผ่าน", en: "Password" },
  logIn: { th: "เข้าสู่ระบบ", en: "Log in" },
  logOut: { th: "ออกจากระบบ", en: "Log out" },
  loginError: { th: "อีเมลหรือรหัสผ่านไม่ถูกต้อง", en: "Email or password is incorrect." },

  // ── Signup (P1/P2) ──
  signupTitle: { th: "ลงทะเบียนสมาชิก", en: "Member registration" },
  signupSubtitle: { th: "Member registration", en: "ลงทะเบียนสมาชิก" },
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
  bankNameLabel: { th: "ธนาคาร", en: "Bank" },
  accountName: { th: "ชื่อบัญชี", en: "Account name" },
  accountNumber: { th: "เลขที่บัญชี", en: "Account number" },
  copy: { th: "คัดลอก", en: "Copy" },
  copied: { th: "คัดลอกแล้ว", en: "Copied" },
  collect: { th: "เก็บเงิน", en: "Collect" },
  takePhoto: { th: "📷 ถ่ายรูปสลิป / เงินสด", en: "📷 Take photo of slip / cash" },
  retake: { th: "ถ่ายใหม่", en: "Retake" },
  proofRequired: { th: "ต้องแนบรูปหลักฐานก่อนยืนยัน", en: "A proof photo is required before confirming" },
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
} satisfies Record<string, Record<Lang, string>>;

export type DictKey = keyof typeof dict;

export function t(key: DictKey, lang: Lang): string {
  return dict[key][lang];
}

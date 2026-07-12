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
} satisfies Record<string, Record<Lang, string>>;

export type DictKey = keyof typeof dict;

export function t(key: DictKey, lang: Lang): string {
  return dict[key][lang];
}

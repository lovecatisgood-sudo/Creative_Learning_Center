"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { dict, type DictKey, type Lang } from "@/lib/i18n/dictionary";
import { PublicLanguageLink } from "@/components/PublicLanguageLink";
import { Logo } from "@/components/Logo";
import {
  AFTERSCHOOL_INTEREST_OPTIONS,
  PLAN_QUERY_TO_INTEREST,
  PLAYROOM_INTEREST_OPTIONS,
  PROGRAM_INTEREST_OPTIONS,
} from "@/lib/program-options";

type ChildForm = { name: string; dob: string; gender: "male" | "female" | "" };

function emptyChild(): ChildForm {
  return { name: "", dob: "", gender: "" };
}

const PHONE_RE = /^[0-9+\-\s]{6,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isPlausiblePhone(phone: string): boolean {
  if (!PHONE_RE.test(phone)) return false;
  return (phone.match(/\d/g) ?? []).length >= 6;
}

// Today's date as YYYY-MM-DD in the browser's local time — good enough for a
// same-day DOB check (the server re-checks against Bangkok time).
function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function SignupPageContent({ language }: { language: Lang }) {
  const lang = language;
  const t = (key: DictKey) => dict[key][lang];
  const router = useRouter();

  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [programInterest, setProgramInterest] = useState("");
  const [kids, setKids] = useState<ChildForm[]>([emptyChild()]);
  const [consent, setConsent] = useState(false);
  const [membershipChoice, setMembershipChoice] = useState<"connect" | "skip">("connect");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  // Point at the app's own public policy pages (publicly reachable — middleware
  // only gates /admin). Opened in a new tab so the in-progress form isn't lost.
  const languagePrefix = lang === "en" ? "/EN" : "";
  const homeUrl = lang === "en" ? "/EN" : "/";
  const termsUrl = `${languagePrefix}/terms`;
  const privacyUrl = `${languagePrefix}/privacy`;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("plan") || params.get("program") || "";
    const mapped = PLAN_QUERY_TO_INTEREST[raw] || raw;
    if (PROGRAM_INTEREST_OPTIONS.some(([value]) => value === mapped)) setProgramInterest(mapped);
    window.gtag?.("event", "signup_start", { page_language: lang, selected_program: mapped || "not_selected" });
  }, [lang]);

  function setKid(i: number, patch: Partial<ChildForm>) {
    setKids((prev) => prev.map((k, idx) => (idx === i ? { ...k, ...patch } : k)));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!parentName.trim()) e.parentName = t("required");
    if (!phone.trim()) e.phone = t("required");
    else if (!isPlausiblePhone(phone.trim())) e.phone = t("invalidPhone");
    if (email.trim() && !EMAIL_RE.test(email.trim())) e.email = label("อีเมลไม่ถูกต้อง", "Invalid email address");
    const today = todayISO();
    kids.forEach((k, i) => {
      if (!k.name.trim()) e[`child_${i}_name`] = t("required");
      if (!k.dob) e[`child_${i}_dob`] = t("required");
      else if (k.dob > today) e[`child_${i}_dob`] = t("dobFuture");
      if (!k.gender) e[`child_${i}_gender`] = t("required");
    });
    if (!consent) e.consent = t("required");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setBusy(true);
    let res: Response;
    try {
      res = await fetch("/api/public/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentName, phone, email, programInterest, consent, membershipChoice, language: lang, children: kids }),
      });
    } catch {
      setBusy(false);
      window.gtag?.("event", "signup_failed", { page_language: lang, failure_type: "network" });
      setErrors((prev) => ({ ...prev, form: t("signupFailed") }));
      return;
    }
    setBusy(false);
    if (res.ok) {
      const data = await res.json();
      window.gtag?.("event", "signup_complete", { page_language: lang, selected_program: programInterest || "not_selected" });
      // Stash the summary for the success screen (no PII in the URL).
      sessionStorage.setItem(
        "sccc_signup_result",
        JSON.stringify({
          parentName: data.parentName,
          memberUid: data.memberUid || null,
          childNames: data.childNames,
          duplicatePhone: data.duplicatePhone,
          membershipConnection: data.membershipConnection || membershipChoice,
        })
      );
      if (data.membershipStartUrl) {
        window.location.assign(data.membershipStartUrl);
      } else {
        router.push(`${languagePrefix}/signup/success${membershipChoice === "connect" ? "?membership=pending" : "?membership=skipped"}`);
      }
    } else {
      const body = await res.json().catch(() => null);
      window.gtag?.("event", "signup_failed", { page_language: lang, failure_type: res.status >= 500 ? "server" : "validation" });
      setErrors((prev) => ({ ...prev, form: (body?.error as string) || t("signupFailed") }));
    }
  }

  const label = (th: string, en: string) => (lang === "th" ? th : en);

  // Inputs default to a 48px-tall .field (shared, app-wide class); trimming to
  // the 44px touch-target floor here via inline style (not by editing .field,
  // which other screens rely on) buys back vertical rhythm for this one form.
  const compactField = { paddingTop: 10, paddingBottom: 10 };

  return (
    <div className="min-h-screen bg-paper pb-16">
      <header className="flex items-center justify-between px-4 py-1">
        <Link href={homeUrl} className="flex items-center gap-2" aria-label={label("กลับหน้าหลัก", "Back to home")}>
          <Logo size={28} alt="" />
          <div>
            <div className="text-[13px] font-extrabold leading-tight text-ink">
              {process.env.NEXT_PUBLIC_SHOP_NAME || t("shopName")}
            </div>
            <div className="text-xs leading-tight text-meta">{label("สมัครสมาชิก Siamese Cat", "Siamese Cat Member")}</div>
          </div>
        </Link>
        <PublicLanguageLink language={lang} path="/signup" />
      </header>

      <div className="px-4 pb-2 pt-1">
        <h1 className="text-xl font-extrabold text-brown">{label("สมัครสมาชิก Siamese Cat", "Become a Siamese Cat Member")}</h1>
        <p className="text-sm text-meta">{label("รับรหัสสมาชิกเพื่อดูแพ็กเกจและประวัติการใช้งาน", "Get a Member ID to view packages and usage")}</p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-1.5 px-4">
        {/* Parent card */}
        <section className="rounded-xl border border-line bg-card p-2">
          <h2 className="mb-1 text-[13px] font-bold text-ink">{t("parentSection")}</h2>
          <div className="flex flex-col gap-1.5">
            <Field label={label("ชื่อผู้ปกครอง", "Parent's name")} error={errors.parentName} required>
              <input
                className="field"
                style={compactField}
                value={parentName}
                autoComplete="name"
                onChange={(e) => setParentName(e.target.value)}
              />
            </Field>
            <Field label={label("เบอร์ติดต่อ", "Contact number")} error={errors.phone} required>
              <input
                className="field"
                style={compactField}
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
            <Field label={label("อีเมล (ผูกภายหลังได้)", "Email (can be bound later)")} error={errors.email}>
              <input
                className="field"
                style={compactField}
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-teal/30 bg-tealbg p-3">
          <h2 className="text-[13px] font-extrabold text-tealdeep">
            {label("เชื่อมต่อ Siamese Cat Member", "Connect your Siamese Cat Member")}
          </h2>
          <p className="mt-1 text-[12px] leading-snug text-meta">
            {label(
              "ใช้บัญชีเดียวกับเกมและบริการ Siamese Cat ผ่าน Google หรืออีเมล การเชื่อมต่อนี้ไม่สร้างแพ็กเกจหรือสิทธิ์ชำระเงิน",
              "Use one identity across approved Siamese Cat products through Google or email. Connecting does not create packages or paid access.",
            )}
          </p>
          <div className="mt-2 grid gap-2 min-[380px]:grid-cols-2">
            <button
              type="button"
              onClick={() => setMembershipChoice("connect")}
              className={`min-h-[48px] rounded-xl border-2 px-3 text-left text-[12px] font-bold ${membershipChoice === "connect" ? "border-teal bg-card text-tealdeep" : "border-line bg-card text-ink"}`}
            >
              <span className="block text-[13px]">{label("เชื่อมต่อด้วย Google หรืออีเมล", "Connect with Google or email")}</span>
              <span className="font-normal text-meta">{label("หลังจากบันทึกแบบฟอร์มนี้", "After this form is safely saved")}</span>
            </button>
            <button
              type="button"
              onClick={() => setMembershipChoice("skip")}
              className={`min-h-[48px] rounded-xl border-2 px-3 text-left text-[12px] font-bold ${membershipChoice === "skip" ? "border-teal bg-card text-tealdeep" : "border-line bg-card text-ink"}`}
            >
              <span className="block text-[13px]">{label("ดำเนินการต่อโดยไม่เชื่อมต่อ", "Continue without membership")}</span>
              <span className="font-normal text-meta">{label("เชื่อมต่อภายหลังได้", "You can connect later")}</span>
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-line bg-card p-2">
          <h2 className="mb-1 text-[13px] font-bold text-ink">{label("โปรแกรมหรือแพ็กเกจที่สนใจ", "Program or package interest")}</h2>
          <Field label={label("เลือกถ้าทราบแล้ว", "Select if known")}>
            <select
              className="field"
              style={compactField}
              value={programInterest}
              onChange={(e) => setProgramInterest(e.target.value)}
            >
              <option value="">{label("ให้ทีมงานช่วยแนะนำ", "Let the team recommend")}</option>
              <optgroup label={label("Kids Playroom และกิจกรรมสร้างสรรค์", "Kids Playroom & Creative Activities")}>
                {PLAYROOM_INTEREST_OPTIONS.map(([value, en, th]) => (
                  <option key={value} value={value}>
                    {lang === "th" ? th : en}
                  </option>
                ))}
              </optgroup>
              <optgroup label={label("After School Explorer", "After School Explorer")}>
                {AFTERSCHOOL_INTEREST_OPTIONS.map(([value, en, th]) => (
                  <option key={value} value={value}>
                    {lang === "th" ? th : en}
                  </option>
                ))}
              </optgroup>
            </select>
          </Field>
        </section>

        {/* Child cards */}
        {kids.map((kid, i) => (
          <section key={i} className="rounded-xl border border-line bg-card p-2">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-[13px] font-bold text-ink">
                {t("childSection")} {kids.length > 1 ? i + 1 : ""}
              </h2>
              {kids.length > 1 && (
                <button
                  type="button"
                  onClick={() => setKids((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-[13px] font-semibold text-danger"
                >
                  ✕ {t("removeChild")}
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
                <Field label={label("ชื่อบุตร", "Child's name")} error={errors[`child_${i}_name`]} required>
                  <input
                    className="field"
                    style={compactField}
                    value={kid.name}
                    onChange={(e) => setKid(i, { name: e.target.value })}
                  />
                </Field>
                <Field label={label("วันเกิด", "Date of birth")} error={errors[`child_${i}_dob`]} required>
                  <input
                    className="field"
                    style={compactField}
                    type="date"
                    value={kid.dob}
                    onChange={(e) => setKid(i, { dob: e.target.value })}
                  />
                </Field>
              </div>
              <Field label={label("เพศ", "Gender")} error={errors[`child_${i}_gender`]} required>
                <div className="grid grid-cols-2 gap-2">
                  <GenderButton active={kid.gender === "male"} onClick={() => setKid(i, { gender: "male" })}>
                    {label("ชาย", "Male")}
                  </GenderButton>
                  <GenderButton active={kid.gender === "female"} onClick={() => setKid(i, { gender: "female" })}>
                    {label("หญิง", "Female")}
                  </GenderButton>
                </div>
              </Field>
            </div>
          </section>
        ))}

        <button
          type="button"
          onClick={() => setKids((prev) => [...prev, emptyChild()])}
          className="btn-ghost border-dashed !min-h-[44px]"
        >
          ＋ {label("เพิ่มบุตร", "Add another child")}
        </button>

        {/* Consent */}
        <label className="flex items-start gap-2 rounded-xl border border-line bg-card p-2">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-teal"
          />
          <span className="text-[12px] leading-snug text-ink">
            {label("ข้าพเจ้ายอมรับ", "I acknowledge the")}{" "}
            <a href={termsUrl} target="_blank" rel="noreferrer" className="font-semibold text-tealdeep underline">
              {t("termsLink")}
            </a>{" "}
            {lang === "th" ? "และ" : "and"}{" "}
            <a href={privacyUrl} target="_blank" rel="noreferrer" className="font-semibold text-tealdeep underline">
              {t("privacyLink")}
            </a>
            {errors.consent && <span className="mt-1 block text-[13px] font-semibold text-danger">{errors.consent}</span>}
          </span>
        </label>

        {errors.form && (
          <div
            role="alert"
            className="rounded-xl border border-danger/40 bg-dangerbg p-2 text-[13px] font-semibold text-danger"
          >
            ⚠ {errors.form}
          </div>
        )}
      </form>

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-app border-t border-line bg-paper/95 p-2 pb-[max(.5rem,env(safe-area-inset-bottom))] backdrop-blur">
        <button onClick={submit} disabled={busy} className="btn-primary !min-h-[44px]">
          {busy ? t("loading") : label("สร้างรหัสสมาชิก", "Create Member ID")}
        </button>
      </div>
    </div>
  );
}

export default function SignupPage() {
  const pathname = usePathname();
  return <SignupPageContent language={pathname.startsWith("/EN/") ? "en" : "th"} />;
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-0.5 block text-[13px] font-semibold leading-tight text-meta">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      {children}
      {error && <p className="mt-0.5 text-[13px] font-semibold text-danger">{error}</p>}
    </div>
  );
}

function GenderButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex min-h-[44px] items-center justify-center rounded-xl border-2 px-2 text-[13px] font-semibold transition " +
        (active ? "border-teal bg-tealbg text-tealdeep" : "border-line bg-card text-ink")
      }
    >
      {children}
    </button>
  );
}

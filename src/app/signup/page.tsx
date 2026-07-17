"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { LangToggle } from "@/components/LangToggle";
import { Logo } from "@/components/Logo";

type ChildForm = { name: string; dob: string; gender: "male" | "female" | "" };

function emptyChild(): ChildForm {
  return { name: "", dob: "", gender: "" };
}

const PHONE_RE = /^[0-9+\-\s]{6,20}$/;
function isPlausiblePhone(phone: string): boolean {
  if (!PHONE_RE.test(phone)) return false;
  return (phone.match(/\d/g) ?? []).length >= 6;
}

const PLAYGROUP_INTEREST_OPTIONS = [
  ["playgroup-general", "Little Explorer Playgroup", "Little Explorer Playgroup"],
  ["playgroup-1h", "Playgroup - 1 hour / 199 THB", "Playgroup - 1 ชั่วโมง / 199 บาท"],
  ["playgroup-2h", "Playgroup - 2 hours / 300 THB", "Playgroup - 2 ชั่วโมง / 300 บาท"],
  ["playgroup-half-day", "Playgroup - weekday half-day / 599 THB", "Playgroup - ครึ่งวันธรรมดา / 599 บาท"],
  ["playgroup-weekday-full", "Playgroup - weekday full-day / 999 THB", "Playgroup - เต็มวันธรรมดา / 999 บาท"],
  ["playgroup-saturday-full", "Playgroup - Saturday full-day / 1,500 THB", "Playgroup - เต็มวันเสาร์ / 1,500 บาท"],
  ["playgroup-sunday-full", "Playgroup - Sunday full-day / 1,500 THB", "Playgroup - เต็มวันอาทิตย์ / 1,500 บาท"],
  ["playgroup-weekday-pass", "Playgroup - 20-session weekday pass / 18,000 THB", "Playgroup - บัตรวันธรรมดา 20 ครั้ง / 18,000 บาท"],
  ["playgroup-saturday-pass", "Playgroup - 8-session Saturday pass / 9,200 THB", "Playgroup - บัตรวันเสาร์ 8 ครั้ง / 9,200 บาท"],
  ["playgroup-sunday-pass", "Playgroup - 8-session Sunday pass / 9,200 THB", "Playgroup - บัตรวันอาทิตย์ 8 ครั้ง / 9,200 บาท"],
] as const;

const AFTERSCHOOL_INTEREST_OPTIONS = [
  ["creative-general", "After School Explorer Program", "After School Explorer Program"],
  ["creative-1h", "After School Explorer - 1 hour / 199 THB", "After School Explorer - 1 ชั่วโมง / 199 บาท"],
  ["creative-2h", "After School Explorer - 2 hours / 300 THB", "After School Explorer - 2 ชั่วโมง / 300 บาท"],
  ["creative-half-day", "After School Explorer - 4-hour half-day / 599 THB", "After School Explorer - ครึ่งวัน 4 ชั่วโมง / 599 บาท"],
  ["creative-meal", "After School Explorer - meal care add-on / 299 THB", "After School Explorer - Meal Care / 299 บาท"],
  ["creative-weekday-pass", "After School Explorer - weekday pass", "After School Explorer - บัตรวันธรรมดา"],
  ["creative-homework-pass", "After School Explorer - homework & creative pass", "After School Explorer - Homework & Creative Pass"],
  ["creative-dinner-pickup-pass", "After School Explorer - dinner & late pickup pass", "After School Explorer - Dinner & Late Pickup Pass"],
] as const;

const INTEREST_OPTIONS = [...PLAYGROUP_INTEREST_OPTIONS, ...AFTERSCHOOL_INTEREST_OPTIONS] as const;

const PLAN_QUERY_TO_INTEREST: Record<string, string> = {
  "1h": "playgroup-1h",
  "2h": "playgroup-2h",
  "4h": "playgroup-half-day",
  "weekday-full-day": "playgroup-weekday-full",
  "saturday-full-day": "playgroup-saturday-full",
  "sunday-full-day": "playgroup-sunday-full",
  "playgroup-weekday-pass": "playgroup-weekday-pass",
  "saturday-pass": "playgroup-saturday-pass",
  "sunday-pass": "playgroup-sunday-pass",
  "weekday-after-school-pass": "creative-weekday-pass",
  "homework-creative-pass": "creative-homework-pass",
  "dinner-late-pickup-pass": "creative-dinner-pickup-pass",
};

// Today's date as YYYY-MM-DD in the browser's local time — good enough for a
// same-day DOB check (the server re-checks against Bangkok time).
function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function SignupPage() {
  const { t, lang } = useLang();
  const router = useRouter();

  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [programInterest, setProgramInterest] = useState("");
  const [kids, setKids] = useState<ChildForm[]>([emptyChild()]);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  // Point at the app's own public policy pages (publicly reachable — middleware
  // only gates /admin). Opened in a new tab so the in-progress form isn't lost.
  const termsUrl = "/terms";
  const privacyUrl = "/privacy";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("plan") || params.get("program") || "";
    const mapped = PLAN_QUERY_TO_INTEREST[raw] || raw;
    if (INTEREST_OPTIONS.some(([value]) => value === mapped)) setProgramInterest(mapped);
  }, []);

  function setKid(i: number, patch: Partial<ChildForm>) {
    setKids((prev) => prev.map((k, idx) => (idx === i ? { ...k, ...patch } : k)));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!parentName.trim()) e.parentName = t("required");
    if (!phone.trim()) e.phone = t("required");
    else if (!isPlausiblePhone(phone.trim())) e.phone = t("invalidPhone");
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
        body: JSON.stringify({ parentName, phone, email, programInterest, consent, children: kids }),
      });
    } catch {
      setBusy(false);
      setErrors((prev) => ({ ...prev, form: t("signupFailed") }));
      return;
    }
    setBusy(false);
    if (res.ok) {
      const data = await res.json();
      // Stash the summary for the success screen (no PII in the URL).
      sessionStorage.setItem(
        "sccc_signup_result",
        JSON.stringify({
          parentName: data.parentName,
          childNames: data.childNames,
          duplicatePhone: data.duplicatePhone,
        })
      );
      router.push("/signup/success");
    } else {
      const body = await res.json().catch(() => null);
      setErrors((prev) => ({ ...prev, form: (body?.error as string) || t("signupFailed") }));
    }
  }

  const label = (th: string, en: string) => (lang === "th" ? `${th} / ${en}` : `${en} / ${th}`);

  // Inputs default to a 48px-tall .field (shared, app-wide class); trimming to
  // the 44px touch-target floor here via inline style (not by editing .field,
  // which other screens rely on) buys back vertical rhythm for this one form.
  const compactField = { paddingTop: 10, paddingBottom: 10 };

  return (
    <div className="min-h-screen bg-paper pb-16">
      <header className="flex items-center justify-between px-4 py-1">
        <Link href="/" className="flex items-center gap-2" aria-label={label("กลับหน้าหลัก", "Back to home")}>
          <Logo size={28} />
          <div>
            <div className="text-[13px] font-extrabold leading-tight text-ink">
              {process.env.NEXT_PUBLIC_SHOP_NAME || t("shopName")}
            </div>
            <div className="text-[10px] leading-tight text-meta">{label("ลงทะเบียนผู้ปกครอง", "Parent registration")}</div>
          </div>
        </Link>
        <LangToggle />
      </header>

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
                onChange={(e) => setParentName(e.target.value)}
              />
            </Field>
            <Field label={label("เบอร์ติดต่อ", "Contact number")} error={errors.phone} required>
              <input
                className="field"
                style={compactField}
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
            <Field label={label("อีเมล", "Email")}>
              <input
                className="field"
                style={compactField}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
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
              <optgroup label={label("Little Explorer Playgroup", "Little Explorer Playgroup")}>
                {PLAYGROUP_INTEREST_OPTIONS.map(([value, en, th]) => (
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
              <div className="grid grid-cols-2 gap-2">
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

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-app border-t border-line bg-paper/95 p-2 backdrop-blur">
        <button onClick={submit} disabled={busy} className="btn-primary !min-h-[44px]">
          {busy ? t("loading") : label("ลงทะเบียน", "Register")}
        </button>
      </div>
    </div>
  );
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

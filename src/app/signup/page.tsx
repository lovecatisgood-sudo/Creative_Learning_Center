"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { LangToggle } from "@/components/LangToggle";
import { Logo } from "@/components/Logo";

type ChildForm = { name: string; dob: string; gender: "male" | "female" | "" };

function emptyChild(): ChildForm {
  return { name: "", dob: "", gender: "" };
}

export default function SignupPage() {
  const { t, lang } = useLang();
  const router = useRouter();

  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [kids, setKids] = useState<ChildForm[]>([emptyChild()]);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const termsUrl = process.env.NEXT_PUBLIC_TERMS_URL || "#";
  const privacyUrl = process.env.NEXT_PUBLIC_PRIVACY_URL || "#";

  function setKid(i: number, patch: Partial<ChildForm>) {
    setKids((prev) => prev.map((k, idx) => (idx === i ? { ...k, ...patch } : k)));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!parentName.trim()) e.parentName = t("required");
    if (!phone.trim()) e.phone = t("required");
    kids.forEach((k, i) => {
      if (!k.name.trim()) e[`child_${i}_name`] = t("required");
      if (!k.dob) e[`child_${i}_dob`] = t("required");
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
    const res = await fetch("/api/public/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentName, phone, email, consent, children: kids }),
    });
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
      setErrors({ form: t("required") });
    }
  }

  const label = (th: string, en: string) => (lang === "th" ? `${th} / ${en}` : `${en} / ${th}`);

  return (
    <div className="min-h-screen bg-paper pb-24">
      <header className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <Logo size={44} />
          <div>
            <div className="text-lg font-extrabold leading-tight text-ink">
              {process.env.NEXT_PUBLIC_SHOP_NAME || t("shopName")}
            </div>
            <div className="text-[13px] text-meta">{label("ลงทะเบียนสมาชิก", "Member registration")}</div>
          </div>
        </div>
        <LangToggle />
      </header>

      <form onSubmit={submit} className="flex flex-col gap-5 px-5">
        {/* Parent card */}
        <section className="rounded-2xl border border-line bg-card p-4">
          <h2 className="mb-3 text-base font-bold text-ink">{t("parentSection")}</h2>
          <div className="flex flex-col gap-3">
            <Field label={label("ชื่อผู้ปกครอง", "Parent's name")} error={errors.parentName} required>
              <input className="field" value={parentName} onChange={(e) => setParentName(e.target.value)} />
            </Field>
            <Field label={label("เบอร์ติดต่อ", "Contact number")} error={errors.phone} required>
              <input className="field" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </Field>
            <Field label={label("อีเมล", "Email")}>
              <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
          </div>
        </section>

        {/* Child cards */}
        {kids.map((kid, i) => (
          <section key={i} className="rounded-2xl border border-line bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-ink">
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
            <div className="flex flex-col gap-3">
              <Field label={label("ชื่อบุตร", "Child's name")} error={errors[`child_${i}_name`]} required>
                <input className="field" value={kid.name} onChange={(e) => setKid(i, { name: e.target.value })} />
              </Field>
              <Field label={label("วันเกิด", "Date of birth")} error={errors[`child_${i}_dob`]} required>
                <input className="field" type="date" value={kid.dob} onChange={(e) => setKid(i, { dob: e.target.value })} />
              </Field>
              <Field label={label("เพศ", "Gender")} error={errors[`child_${i}_gender`]} required>
                <div className="grid grid-cols-2 gap-3">
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
          className="btn-ghost border-dashed"
        >
          ＋ {label("เพิ่มบุตร", "Add another child")}
        </button>

        {/* Consent */}
        <label className="flex items-start gap-3 rounded-2xl border border-line bg-card p-4">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 accent-teal"
          />
          <span className="text-[13px] leading-relaxed text-ink">
            {label("ข้าพเจ้ายอมรับ", "I acknowledge the")}{" "}
            <a href={termsUrl} target="_blank" rel="noreferrer" className="font-semibold text-tealdeep underline">
              {t("termsLink")}
            </a>{" "}
            {lang === "th" ? "และ" : "and"}{" "}
            <a href={privacyUrl} target="_blank" rel="noreferrer" className="font-semibold text-tealdeep underline">
              {t("privacyLink")}
            </a>
            {errors.consent && <span className="mt-1 block font-semibold text-danger">{errors.consent}</span>}
          </span>
        </label>
      </form>

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-app border-t border-line bg-paper/95 p-4 backdrop-blur">
        <button onClick={submit} disabled={busy} className="btn-primary">
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
      <label className="mb-1 block text-[13px] font-semibold text-meta">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-[13px] font-semibold text-danger">{error}</p>}
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
        "flex min-h-[48px] items-center justify-center rounded-xl border-2 px-3 text-base font-semibold transition " +
        (active ? "border-teal bg-tealbg text-tealdeep" : "border-line bg-card text-ink")
      }
    >
      {children}
    </button>
  );
}

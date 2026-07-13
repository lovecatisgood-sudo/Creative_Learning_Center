"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { Sheet } from "./Sheet";

// A2b — two-field quick add. Creates the child + stub parent and hands back the
// new child id so the caller can open the child page.
export function QuickAddSheet({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (childId: number) => void;
}) {
  const { t } = useLang();
  const [childName, setChildName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    if (!childName.trim() || !phone.trim()) {
      setError(t("required"));
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/children/quick", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childName, phone }),
    });
    setBusy(false);
    if (res.ok) {
      const data = await res.json();
      onCreated(data.childId);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || t("quickAddFailed"));
    }
  }

  return (
    <Sheet title={t("quickAddTitle")} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-[13px] font-semibold text-meta">
            {t("childName")} <span className="text-danger">*</span>
          </label>
          <input className="field" autoFocus value={childName} onChange={(e) => setChildName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-[13px] font-semibold text-meta">
            {t("contactPhone")} <span className="text-danger">*</span>
          </label>
          <input className="field" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        {error && <p className="text-[13px] font-semibold text-danger">{error}</p>}
        <button className="btn-primary mt-1" onClick={create} disabled={busy}>
          {busy ? t("loading") : t("createAndOpen")}
        </button>
      </div>
    </Sheet>
  );
}

"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { Sheet } from "./Sheet";

// A2b / A3 — complete a fast-created child's parent details, or link to an
// existing parent by phone. Two tabs in one sheet.
export function CompleteParentSheet({
  childId,
  onClose,
  onSaved,
}: {
  childId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useLang();
  const [tab, setTab] = useState<"complete" | "link">("complete");
  const [parentName, setParentName] = useState("");
  const [email, setEmail] = useState("");
  const [linkPhone, setLinkPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    const body =
      tab === "complete"
        ? { mode: "complete", parentName, email }
        : { mode: "link", linkPhone };
    if (tab === "complete" && !parentName.trim()) {
      setError(t("required"));
      setBusy(false);
      return;
    }
    if (tab === "link" && !linkPhone.trim()) {
      setError(t("required"));
      setBusy(false);
      return;
    }
    const res = await fetch(`/api/admin/children/${childId}/parent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (res.ok) {
      onSaved();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error === "No matching parent" ? t("noResults") : t("required"));
    }
  }

  return (
    <Sheet title={t("completeProfileTitle")} onClose={onClose}>
      <div className="mb-4 flex rounded-xl border border-line bg-card p-1">
        <TabBtn active={tab === "complete"} onClick={() => setTab("complete")}>
          {t("saveProfile")}
        </TabBtn>
        <TabBtn active={tab === "link"} onClick={() => setTab("link")}>
          {t("linkExistingParent")}
        </TabBtn>
      </div>

      {tab === "complete" ? (
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-meta">
              {t("parentName")} <span className="text-danger">*</span>
            </label>
            <input className="field" autoFocus value={parentName} onChange={(e) => setParentName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-meta">{t("emailOptional")}</label>
            <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-[13px] font-semibold text-meta">
            {t("contactPhone")} <span className="text-danger">*</span>
          </label>
          <input className="field" inputMode="tel" value={linkPhone} onChange={(e) => setLinkPhone(e.target.value)} />
        </div>
      )}

      {error && <p className="mt-2 text-[13px] font-semibold text-danger">{error}</p>}
      <button className="btn-primary mt-4" onClick={save} disabled={busy}>
        {busy ? t("loading") : t("save")}
      </button>
    </Sheet>
  );
}

function TabBtn({
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
      onClick={onClick}
      className={
        "flex-1 rounded-lg px-2 py-2 text-[13px] font-bold transition " +
        (active ? "bg-brown text-cream" : "text-meta")
      }
    >
      {children}
    </button>
  );
}

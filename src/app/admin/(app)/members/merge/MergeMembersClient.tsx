"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AppBar } from "@/components/AppBar";
import { LogoutButton } from "@/components/LogoutButton";

export function MergeMembersClient() {
  const router = useRouter();
  const [sourceUid, setSourceUid] = useState("");
  const [targetUid, setTargetUid] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/admin/members/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceUid, targetUid, confirmed }),
    });
    const body = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) return setError(body?.error || "Merge failed");
    router.push(`/admin/parent/${body.parentId}`);
    router.refresh();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-paper">
      <AppBar title="Merge Siamese Cat Members" right={<LogoutButton />} />
      <main className="min-h-0 flex-1 overflow-y-auto p-4">
        <form onSubmit={submit} className="mx-auto max-w-lg rounded-2xl border border-line bg-card p-5">
          <p className="mb-4 text-sm text-meta">The source member is absorbed into the target. Children, orders, consents, and legacy Member IDs are preserved. This action is audited.</p>
          <Field label="Source Member ID (duplicate)"><input className="field font-mono uppercase" required value={sourceUid} onChange={(event) => setSourceUid(event.target.value)} /></Field>
          <Field label="Target Member ID (keep)"><input className="field font-mono uppercase" required value={targetUid} onChange={(event) => setTargetUid(event.target.value)} /></Field>
          <label className="flex items-start gap-2 rounded-xl bg-dangerbg p-3 text-sm font-semibold text-danger"><input type="checkbox" className="mt-0.5 h-5 w-5" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>I verified the guardian and children and understand the source record will be merged.</span></label>
          {error && <p role="alert" className="mt-3 text-sm font-semibold text-danger">{error}</p>}
          <button className="btn-primary mt-4" disabled={!confirmed || busy}>{busy ? "Merging…" : "Merge members"}</button>
        </form>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="mb-4 block"><span className="mb-1 block text-sm font-bold text-meta">{label}</span>{children}</label>;
}

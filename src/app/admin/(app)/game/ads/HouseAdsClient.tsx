"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Campaign = {
  id: number;
  name: string;
  category: string;
  language: string;
  videoUrl: string;
  posterUrl: string;
  ctaLabel: string;
  destinationUrl: string;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  weight: number;
  skipAfterSeconds: number;
  cooldownSeconds: number;
  updatedAt: string;
};

type CampaignForm = Omit<Campaign, "id" | "updatedAt" | "startsAt" | "endsAt"> & {
  startsAt: string;
  endsAt: string;
};

const EMPTY: CampaignForm = {
  name: "",
  category: "coding_course",
  language: "all",
  videoUrl: "",
  posterUrl: "",
  ctaLabel: "Learn more",
  destinationUrl: "",
  active: false,
  startsAt: "",
  endsAt: "",
  weight: 100,
  skipAfterSeconds: 10,
  cooldownSeconds: 0,
};

export function HouseAdsClient() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<Record<number, Record<string, number>>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CampaignForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/game/ads", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load campaigns");
      setCampaigns(data.campaigns);
      setStats(data.stats);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => void load(), [load]);

  function edit(campaign: Campaign) {
    setEditingId(campaign.id);
    setForm({
      ...campaign,
      startsAt: toLocalInput(campaign.startsAt),
      endsAt: toLocalInput(campaign.endsAt),
    });
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset() {
    setEditingId(null);
    setForm(EMPTY);
    setMessage("");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const url = editingId ? `/api/admin/game/ads/${editingId}` : "/api/admin/game/ads";
      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
          endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save campaign");
      setMessage(editingId ? "Campaign updated." : "Campaign created as configured.");
      setEditingId(null);
      setForm(EMPTY);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save campaign");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(campaign: Campaign) {
    setMessage("");
    try {
      const response = await fetch(`/api/admin/game/ads/${campaign.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...campaign, active: !campaign.active }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to change campaign status");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to change campaign status");
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-ink">House ad campaigns</h1>
            <p className="mt-1 max-w-2xl text-sm text-meta">Manage café and Creative Club videos shown when a player restarts after game over. Players can continue after 10 seconds.</p>
          </div>
          <Link href="/admin/game" className="rounded-xl border border-line bg-card px-4 py-2 text-sm font-bold text-ink shadow-sm">Back to game dashboard</Link>
        </header>

        <form onSubmit={save} className="rounded-2xl border border-line bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="text-lg font-extrabold text-ink">{editingId ? "Edit campaign" : "Add campaign"}</h2><p className="text-sm text-meta">Save without activating while the video is being prepared.</p></div>
            {editingId && <button type="button" onClick={reset} className="text-sm font-bold text-tealdeep underline">Cancel edit</button>}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Campaign name"><input required maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Children's coding course" /></Field>
            <Field label="Business category"><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}><option value="coding_course">Coding course</option><option value="cafe">Café</option><option value="learning_center">Learning center</option><option value="other">Other</option></select></Field>
            <Field label="Audience language"><select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className={inputClass}><option value="all">English + Thai</option><option value="en">English only</option><option value="th">Thai only</option></select></Field>
            <Field label="Video URL" hint="720×1280 MP4 (H.264), site path or HTTPS URL"><input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} className={inputClass} placeholder="/game-ads/coding-course.mp4" /></Field>
            <Field label="Poster image URL" hint="Optional portrait preview"><input value={form.posterUrl} onChange={(e) => setForm({ ...form, posterUrl: e.target.value })} className={inputClass} placeholder="/game-ads/coding-course-poster.jpg" /></Field>
            <Field label="Destination URL"><input value={form.destinationUrl} onChange={(e) => setForm({ ...form, destinationUrl: e.target.value })} className={inputClass} placeholder="https://siamesecat.cafe/coding" /></Field>
            <Field label="Call-to-action button"><input maxLength={80} value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} className={inputClass} placeholder="Learn more" /></Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Weight"><input type="number" min={1} max={10000} value={form.weight} onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })} className={inputClass} /></Field>
              <Field label="Skip after (seconds)"><input type="number" min={10} max={300} value={form.skipAfterSeconds} onChange={(e) => setForm({ ...form, skipAfterSeconds: Number(e.target.value) })} className={inputClass} /></Field>
              <Field label="Cooldown"><input type="number" min={0} max={86400} value={form.cooldownSeconds} onChange={(e) => setForm({ ...form, cooldownSeconds: Number(e.target.value) })} className={inputClass} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Starts (optional)"><input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} className={inputClass} /></Field>
              <Field label="Ends (optional)"><input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} className={inputClass} /></Field>
            </div>
          </div>
          <label className="mt-4 flex items-start gap-3 rounded-xl bg-brown/5 p-3 text-sm font-semibold text-ink"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="mt-0.5 h-5 w-5" /><span>Active — eligible to play in the game. A video URL is required before activation.</span></label>
          <div className="mt-4 flex flex-wrap items-center gap-3"><button disabled={saving} className="rounded-xl bg-tealdeep px-5 py-2.5 text-sm font-extrabold text-white disabled:opacity-60">{saving ? "Saving…" : editingId ? "Save changes" : "Create campaign"}</button>{message && <p role="status" className="text-sm font-bold text-meta">{message}</p>}</div>
        </form>

        <section className="space-y-3" aria-label="Campaigns">
          {loading && <div className="rounded-2xl border border-line bg-card p-8 text-center text-meta">Loading campaigns…</div>}
          {!loading && campaigns.length === 0 && <div className="rounded-2xl border border-line bg-card p-8 text-center text-meta">No house-ad campaigns yet.</div>}
          {campaigns.map((campaign) => {
            const values = stats[campaign.id] ?? {};
            return <article key={campaign.id} className="rounded-2xl border border-line bg-card p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-extrabold text-ink">{campaign.name}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${campaign.active ? "bg-tealbg text-tealdeep" : "bg-brown/10 text-meta"}`}>{campaign.active ? "Active" : "Draft / paused"}</span></div><p className="mt-1 text-sm capitalize text-meta">{campaign.category.replaceAll("_", " ")} · {campaign.language === "all" ? "English + Thai" : campaign.language.toUpperCase()}</p></div><div className="flex gap-2"><button onClick={() => edit(campaign)} className="rounded-xl border border-line px-3 py-2 text-sm font-bold text-ink">Edit</button><button onClick={() => toggle(campaign)} className="rounded-xl bg-brown px-3 py-2 text-sm font-bold text-white">{campaign.active ? "Pause" : "Activate"}</button></div></div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5"><Stat label="Impressions" value={values.impression ?? 0} /><Stat label="Completed" value={values.completed ?? 0} /><Stat label="Clicks" value={values.click ?? 0} /><Stat label="Skipped" value={values.skipped ?? 0} /><Stat label="Errors" value={values.error ?? 0} /></div>
              <p className="mt-3 break-all text-xs text-meta">{campaign.videoUrl || "No video attached yet"}</p>
            </article>;
          })}
        </section>
      </div>
    </div>
  );
}

const inputClass = "mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-tealdeep";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label className="block text-sm font-bold text-ink">{label}{children}{hint && <span className="mt-1 block text-xs font-normal text-meta">{hint}</span>}</label>;
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl bg-brown/5 p-3"><div className="text-xs font-bold uppercase tracking-wide text-meta">{label}</div><div className="mt-1 text-xl font-extrabold text-ink">{value.toLocaleString()}</div></div>;
}

function toLocalInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

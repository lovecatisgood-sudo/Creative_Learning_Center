import { count, desc, eq, max } from "drizzle-orm";
import Link from "next/link";
import { AppBar } from "@/components/AppBar";
import { db } from "@/db";
import { gamePlayers, gameRuns } from "@/db/schema";
import { requireManagerPage } from "@/lib/admin-page-auth";

export const dynamic = "force-dynamic";

export default async function GameDashboardPage() {
  await requireManagerPage();

  const [[playerTotal], [runTotal], [marketingTotal], [bestScore], players, recentRuns] = await Promise.all([
    db.select({ value: count() }).from(gamePlayers),
    db.select({ value: count() }).from(gameRuns),
    db.select({ value: count() }).from(gamePlayers).where(eq(gamePlayers.marketingConsent, true)),
    db.select({ value: max(gameRuns.score) }).from(gameRuns),
    db
      .select({
        id: gamePlayers.id,
        displayName: gamePlayers.displayName,
        email: gamePlayers.email,
        language: gamePlayers.language,
        marketingConsent: gamePlayers.marketingConsent,
        createdAt: gamePlayers.createdAt,
        updatedAt: gamePlayers.updatedAt,
      })
      .from(gamePlayers)
      .orderBy(desc(gamePlayers.createdAt))
      .limit(100),
    db
      .select({
        id: gameRuns.id,
        displayName: gamePlayers.displayName,
        email: gamePlayers.email,
        score: gameRuns.score,
        mode: gameRuns.mode,
        stage: gameRuns.stage,
        victory: gameRuns.victory,
        language: gameRuns.language,
        durationSeconds: gameRuns.durationSeconds,
        createdAt: gameRuns.createdAt,
      })
      .from(gameRuns)
      .innerJoin(gamePlayers, eq(gameRuns.playerId, gamePlayers.id))
      .orderBy(desc(gameRuns.createdAt))
      .limit(100),
  ]);

  const formatDate = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-cream">
      <AppBar title="Game Dashboard" />
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-5">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div><h1 className="text-2xl font-extrabold text-ink">Cat vs Dog players</h1>
            <p className="mt-1 text-sm text-meta">Registration, email collection and recent game runs</p></div>
            <Link href="/admin/game/ads" className="rounded-xl bg-tealdeep px-4 py-2.5 text-sm font-extrabold text-white shadow-sm">Manage game ads</Link>
          </header>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Game metrics">
            <Metric label="Registered players" value={playerTotal.value.toLocaleString()} />
            <Metric label="Recorded runs" value={runTotal.value.toLocaleString()} />
            <Metric label="Email opt-ins" value={marketingTotal.value.toLocaleString()} />
            <Metric label="Best score" value={Number(bestScore.value ?? 0).toLocaleString()} />
          </section>

          <section className="rounded-2xl border border-line bg-card shadow-sm" aria-labelledby="players-title">
            <div className="border-b border-line px-4 py-3">
              <h2 id="players-title" className="text-lg font-extrabold text-ink">Latest registrations</h2>
              <p className="text-sm text-meta">Newest 100 player profiles</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-brown/5 text-xs uppercase tracking-wide text-meta">
                  <tr><th className="px-4 py-3">Player</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Language</th><th className="px-4 py-3">Marketing</th><th className="px-4 py-3">Registered</th><th className="px-4 py-3">Last activity</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {players.map((player) => (
                    <tr key={player.id}>
                      <td className="px-4 py-3 font-bold text-ink">{player.displayName}</td>
                      <td className="px-4 py-3"><a className="font-semibold text-tealdeep underline" href={`mailto:${player.email}`}>{player.email}</a></td>
                      <td className="px-4 py-3 uppercase text-meta">{player.language}</td>
                      <td className="px-4 py-3"><Status yes={player.marketingConsent} yesText="Opted in" noText="No" /></td>
                      <td className="px-4 py-3 text-meta">{formatDate.format(player.createdAt)}</td>
                      <td className="px-4 py-3 text-meta">{formatDate.format(player.updatedAt)}</td>
                    </tr>
                  ))}
                  {players.length === 0 && <tr><td className="px-4 py-8 text-center text-meta" colSpan={6}>No game registrations yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-card shadow-sm" aria-labelledby="runs-title">
            <div className="border-b border-line px-4 py-3">
              <h2 id="runs-title" className="text-lg font-extrabold text-ink">Recent runs</h2>
              <p className="text-sm text-meta">Latest 100 completed games</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-brown/5 text-xs uppercase tracking-wide text-meta">
                  <tr><th className="px-4 py-3">Player</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Mode</th><th className="px-4 py-3">Stage</th><th className="px-4 py-3">Result</th><th className="px-4 py-3">Duration</th><th className="px-4 py-3">Played</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {recentRuns.map((run) => (
                    <tr key={run.id}>
                      <td className="px-4 py-3"><span className="block font-bold text-ink">{run.displayName}</span><span className="text-xs text-meta">{run.email}</span></td>
                      <td className="px-4 py-3 text-base font-extrabold text-tealdeep">{run.score.toLocaleString()}</td>
                      <td className="px-4 py-3 capitalize text-meta">{run.mode}</td>
                      <td className="px-4 py-3 text-meta">{run.stage}</td>
                      <td className="px-4 py-3"><Status yes={run.victory} yesText="Victory" noText="Game over" /></td>
                      <td className="px-4 py-3 text-meta">{formatDuration(run.durationSeconds)}</td>
                      <td className="px-4 py-3 text-meta">{formatDate.format(run.createdAt)}</td>
                    </tr>
                  ))}
                  {recentRuns.length === 0 && <tr><td className="px-4 py-8 text-center text-meta" colSpan={7}>No completed runs yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-line bg-card p-4 shadow-sm"><div className="text-xs font-bold uppercase tracking-wide text-meta">{label}</div><div className="mt-2 text-2xl font-extrabold text-ink">{value}</div></div>;
}

function Status({ yes, yesText, noText }: { yes: boolean; yesText: string; noText: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${yes ? "bg-tealbg text-tealdeep" : "bg-brown/10 text-meta"}`}>{yes ? yesText : noText}</span>;
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { gamePlayers, gameRuns } from "@/db/schema";
import { getRoyaltyFeatureConfig } from "@/lib/game-features";
import { getCurrentGamePlayer } from "@/lib/game-session";

const MODES = new Set(["easy", "normal", "hard"]);

export async function POST(req: Request) {
  if (!getRoyaltyFeatureConfig().enabled) {
    return NextResponse.json({ error: "Royalty scores are not available" }, { status: 503 });
  }
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const score = Number(body.score);
  const stage = Number(body.stage);
  const durationSeconds = Math.round(Number(body.durationSeconds) || 0);
  const mode = String(body.mode ?? "");
  const language = body.language === "th" ? "th" : "en";

  if (!Number.isSafeInteger(score) || score < 0 || score > 2_000_000_000) {
    return NextResponse.json({ error: "Invalid score" }, { status: 422 });
  }
  if (!Number.isSafeInteger(stage) || stage < 1 || stage > 10_000 || !MODES.has(mode)) {
    return NextResponse.json({ error: "Invalid run" }, { status: 422 });
  }
  if (durationSeconds < 0 || durationSeconds > 86_400) {
    return NextResponse.json({ error: "Invalid duration" }, { status: 422 });
  }

  try {
    const player = await getCurrentGamePlayer();
    if (!player) return NextResponse.json({ error: "Sign in to save this score" }, { status: 401 });

    await db.transaction(async (tx) => {
      await tx.insert(gameRuns).values({
        playerId: player.id,
        score,
        mode,
        stage,
        victory: body.victory === true,
        language,
        durationSeconds,
      });
      await tx.update(gamePlayers).set({ updatedAt: new Date() }).where(eq(gamePlayers.id, player.id));
    });

    const ranking = await db.execute(sql`
      with best_scores as (
        select player_id, max(score)::int as best_score
        from ${gameRuns}
        group by player_id
      ), ranked as (
        select player_id, best_score,
          dense_rank() over (order by best_score desc)::int as rank
        from best_scores
      )
      select best_score, rank from ranked where player_id = ${player.id}
    `);
    const current = ranking.rows[0] as { best_score?: number; rank?: number } | undefined;

    return NextResponse.json(
      { ok: true, personalBest: Number(current?.best_score ?? score), rank: Number(current?.rank ?? 1) },
      { status: 201, headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error("Game score save failed", error);
    return NextResponse.json({ error: "Unable to save score" }, { status: 500 });
  }
}

import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { gamePlayers, gameRuns } from "@/db/schema";
import { getGameLoginConfig } from "@/lib/game-features";
import { getCurrentGamePlayer } from "@/lib/game-session";

export async function GET() {
  if (!getGameLoginConfig().enabled) {
    return NextResponse.json(
      { leaders: [], personal: null, enabled: false },
      { headers: { "cache-control": "no-store" } },
    );
  }
  try {
    const player = await getCurrentGamePlayer();
    const result = await db.execute(sql`
      with best_scores as (
        select player_id, max(score)::int as best_score
        from ${gameRuns}
        group by player_id
      ), ranked as (
        select player_id, best_score,
          dense_rank() over (order by best_score desc)::int as rank
        from best_scores
      )
      select ranked.rank, ranked.best_score, ${gamePlayers.displayName} as display_name
      from ranked
      inner join ${gamePlayers} on ${gamePlayers.id} = ranked.player_id
      order by ranked.rank asc, ranked.player_id asc
      limit 10
    `);

    let personal: { rank: number; bestScore: number } | null = null;
    if (player) {
      const own = await db.execute(sql`
        with best_scores as (
          select player_id, max(score)::int as best_score
          from ${gameRuns}
          group by player_id
        ), ranked as (
          select player_id, best_score,
            dense_rank() over (order by best_score desc)::int as rank
          from best_scores
        )
        select rank, best_score from ranked where player_id = ${player.id}
      `);
      const row = own.rows[0] as { rank?: number; best_score?: number } | undefined;
      if (row) personal = { rank: Number(row.rank), bestScore: Number(row.best_score) };
    }

    return NextResponse.json(
      {
        leaders: result.rows.map((row) => ({
          rank: Number(row.rank),
          displayName: String(row.display_name),
          bestScore: Number(row.best_score),
        })),
        personal,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error("Game leaderboard failed", error);
    return NextResponse.json(
      { error: "Leaderboard is temporarily unavailable", leaders: null, personal: null },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}

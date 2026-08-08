import { NextResponse } from "next/server";
import { getCurrentGamePlayer, getGameSession } from "@/lib/game-session";

export async function GET() {
  try {
    const player = await getCurrentGamePlayer();
    return NextResponse.json(
      player
        ? {
            authenticated: true,
            player: {
              publicId: player.publicId,
              displayName: player.displayName,
              avatarUrl: player.avatarUrl,
            },
          }
        : { authenticated: false, player: null },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error("Game session lookup failed", error);
    return NextResponse.json({ authenticated: false, player: null }, { headers: { "cache-control": "no-store" } });
  }
}

export async function DELETE() {
  const session = await getGameSession();
  session.destroy();
  return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}

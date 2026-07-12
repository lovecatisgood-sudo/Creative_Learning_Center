import { getRunningSessions } from "@/lib/sessions";
import { SessionsClient } from "./SessionsClient";

// A1 — Sessions dashboard. Server-renders the initial running sessions; the
// client polls every 30s and ticks countdowns each second.
export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const sessions = await getRunningSessions();
  return <SessionsClient initialSessions={sessions} />;
}

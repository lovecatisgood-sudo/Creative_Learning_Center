import { SessionsClient } from "./SessionsClient";

// A1 — Sessions (home). Live dashboard of running sessions is built in M4;
// M1 ships the shell + empty state so the app boots and auth is verifiable.
export default function SessionsPage() {
  return <SessionsClient />;
}

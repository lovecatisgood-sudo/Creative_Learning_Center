// All display times are Asia/Bangkok (UTC+7); the DB stores UTC. Bangkok has no
// DST, so a fixed +7h offset is exact and avoids an Intl dependency in hot paths.
export const BKK_OFFSET_MS = 7 * 60 * 60 * 1000;

// Returns the given UTC instant as a Date whose UTC fields read as Bangkok wall
// time — use only for extracting Y/M/D/H components, never for storage.
export function toBkk(date: Date): Date {
  return new Date(date.getTime() + BKK_OFFSET_MS);
}

// YYYYMMDD in Bangkok time, for receipt numbering (SCCC-YYYYMMDD-####).
export function bkkDateStamp(date: Date): string {
  const b = toBkk(date);
  const y = b.getUTCFullYear();
  const m = String(b.getUTCMonth() + 1).padStart(2, "0");
  const d = String(b.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

// Format an instant as HH:mm in Bangkok time.
export function bkkTimeHm(date: Date): string {
  const b = toBkk(date);
  return `${String(b.getUTCHours()).padStart(2, "0")}:${String(b.getUTCMinutes()).padStart(2, "0")}`;
}

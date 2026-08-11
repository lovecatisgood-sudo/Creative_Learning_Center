import { randomBytes } from "crypto";

const UID_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function generateMemberUid(): string {
  const bytes = randomBytes(12);
  let value = "";
  for (let index = 0; index < 12; index++) {
    value += UID_ALPHABET[bytes[index] % UID_ALPHABET.length];
  }
  return `SCM-${value.slice(0, 4)}-${value.slice(4, 8)}-${value.slice(8, 12)}`;
}

export function normalizeMemberUid(value: string): string {
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = compact.startsWith("SCM") ? compact.slice(3) : compact;
  if (body.length !== 12 || ![...body].every((character) => UID_ALPHABET.includes(character))) return "";
  return `SCM-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}`;
}

export function normalizeEmail(value: string): string | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized.length > 254 || !EMAIL_RE.test(normalized)) return null;
  return normalized;
}

// Thailand is the shop default. Preserve explicit international numbers and
// canonicalize local 0-prefixed numbers to E.164-style +66 for matching.
export function normalizePhone(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || !/^[0-9+()\-\s.]+$/.test(trimmed)) return null;
  let digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("0066")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = `66${digits.slice(1)}`;
  if (digits.length < 8 || digits.length > 15) return null;
  return `+${digits}`;
}

export function maskEmail(value: string): string {
  const [local, domain] = value.split("@");
  if (!local || !domain) return "";
  return `${local.slice(0, 1)}${"•".repeat(Math.min(4, Math.max(1, local.length - 1)))}@${domain}`;
}

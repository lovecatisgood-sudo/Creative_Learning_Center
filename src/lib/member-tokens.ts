import { createHash, randomBytes } from "crypto";

export function generateAccessToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashAccessToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function expiresFromNow(minutes: number, now = new Date()): Date {
  return new Date(now.getTime() + minutes * 60_000);
}

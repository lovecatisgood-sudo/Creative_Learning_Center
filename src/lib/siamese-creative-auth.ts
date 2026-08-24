import type { SiameseCatClientOptions } from "@siamesecat/member-auth";

function enabled(name: string): boolean {
  return String(process.env[name] ?? "").trim().toLowerCase() === "true";
}

export function getSiameseCreativeAuthConfig(): SiameseCatClientOptions & { enabled: boolean; transactionSecret: string } {
  const issuer = String(process.env.SIAMESE_OIDC_ISSUER ?? "https://id.siamesecat.cafe").trim().replace(/\/$/, "");
  const clientId = String(process.env.SIAMESE_CREATIVE_CLIENT_ID ?? "").trim();
  const clientSecret = String(process.env.SIAMESE_CREATIVE_CLIENT_SECRET ?? "").trim();
  const transactionSecret = String(process.env.SIAMESE_CREATIVE_TRANSACTION_SECRET ?? "").trim();
  const environment = String(process.env.SIAMESE_CREATIVE_AUTH_ENV ?? (issuer.startsWith("http://") ? "development" : "production"));
  const url = new URL(issuer);
  const loopback = url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (environment === "production" && issuer !== "https://id.siamesecat.cafe") throw new Error("Production Creative membership issuer must be https://id.siamesecat.cafe");
  if (environment === "staging" && issuer !== "https://id-staging.siamesecat.cafe") throw new Error("Staging Creative membership issuer must be https://id-staging.siamesecat.cafe");
  if (process.env.NODE_ENV === "production" && environment === "development") throw new Error("Production cannot use development Creative membership auth");
  if (!loopback && !issuer.startsWith("https://")) throw new Error("Creative membership issuer must use HTTPS except for local development");
  return {
    enabled: enabled("SIAMESE_CREATIVE_AUTH_ENABLED") && Boolean(clientId && clientSecret && transactionSecret.length >= 32),
    issuer,
    clientId,
    clientSecret,
    transactionSecret,
    allowInsecureLocalIssuer: loopback && process.env.NODE_ENV !== "production",
    allowStagingIssuer: environment === "staging",
  };
}

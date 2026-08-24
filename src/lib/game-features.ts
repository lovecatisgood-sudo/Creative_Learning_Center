function enabled(name: string) {
  return String(process.env[name] ?? "").trim().toLowerCase() === "true";
}

// Compatibility-only configuration for the established direct-Google API.
// New game UI uses the shared provider, but this remains operational until
// both production replacements and their rollback journeys have passed.
export function getGoogleGameLoginConfig() {
  const googleClientId = String(process.env.GOOGLE_CLIENT_ID ?? "").trim();
  return {
    enabled: enabled("GAME_LOGIN_ENABLED") && Boolean(googleClientId),
    googleClientId,
  };
}

export type SiameseGameAuthTarget = "cat-vs-dog" | "car-maze";

export function siameseGameAuthTarget(value: string | null | undefined): SiameseGameAuthTarget {
  return value === "car-maze" ? "car-maze" : "cat-vs-dog";
}

export function getSiameseGameTransactionSecret() {
  const transactionSecret = String(process.env.SIAMESE_GAME_TRANSACTION_SECRET ?? "").trim();
  if (transactionSecret.length < 32) throw new Error("SIAMESE_GAME_TRANSACTION_SECRET must contain at least 32 characters");
  return transactionSecret;
}

export function getSiameseGameLoginConfig(target: SiameseGameAuthTarget = "cat-vs-dog") {
  const issuer = String(process.env.SIAMESE_OIDC_ISSUER ?? "https://id.siamesecat.cafe").trim().replace(/\/$/, "");
  const authEnvironment = String(process.env.SIAMESE_GAME_AUTH_ENV ?? "").trim() || (issuer.startsWith("http://") ? "development" : "production");
  const clientId = String(
    (target === "car-maze" ? process.env.SIAMESE_CAR_MAZE_CLIENT_ID : process.env.SIAMESE_CAT_VS_DOG_CLIENT_ID)
      || "",
  ).trim();
  const clientSecret = String(
    (target === "car-maze" ? process.env.SIAMESE_CAR_MAZE_CLIENT_SECRET : process.env.SIAMESE_CAT_VS_DOG_CLIENT_SECRET)
      || "",
  ).trim();
  const transactionSecret = String(process.env.SIAMESE_GAME_TRANSACTION_SECRET ?? "").trim();
  const schemaReady = process.env.SIAMESE_GAME_SCHEMA_READY !== "0";
  const configured = Boolean(clientId && clientSecret && transactionSecret.length >= 32 && schemaReady);
  const localIssuer = (() => {
    try {
      const url = new URL(issuer);
      return url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    } catch {
      return false;
    }
  })();
  if (!["development", "staging", "production"].includes(authEnvironment)) {
    throw new Error("SIAMESE_GAME_AUTH_ENV must be development, staging, or production");
  }
  if (authEnvironment === "staging" && issuer !== "https://id-staging.siamesecat.cafe") {
    throw new Error("Staging Siamese Cat issuer must be exactly https://id-staging.siamesecat.cafe");
  }
  if (authEnvironment === "production" && issuer !== "https://id.siamesecat.cafe") {
    throw new Error("Production Siamese Cat issuer must be exactly https://id.siamesecat.cafe");
  }
  if (authEnvironment === "development" && !localIssuer && issuer !== "https://id.siamesecat.cafe") {
    throw new Error("Development Siamese Cat auth must use loopback or exactly https://id.siamesecat.cafe");
  }
  if (process.env.NODE_ENV === "production" && authEnvironment === "development") {
    throw new Error("A deployed game must use staging or production Siamese Cat auth");
  }
  if (enabled("SIAMESE_GAME_AUTH_ENABLED") && authEnvironment !== "development" && process.env.NODE_ENV !== "production") {
    throw new Error("Enabled staging or production Siamese Cat auth requires NODE_ENV=production");
  }
  if (!issuer.startsWith("https://") && !localIssuer) {
    throw new Error("Siamese Cat issuer must use HTTPS except on localhost");
  }
  return {
    enabled: enabled("SIAMESE_GAME_AUTH_ENABLED") && configured,
    issuer,
    clientId,
    clientSecret,
    transactionSecret,
    target,
    authEnvironment,
    allowInsecureLocalIssuer: localIssuer && process.env.NODE_ENV !== "production",
    allowStagingIssuer: authEnvironment === "staging" && issuer === "https://id-staging.siamesecat.cafe",
  };
}

// Score and leaderboard availability follows the active game identity system.
export function getGameLoginConfig() {
  return getSiameseGameLoginConfig("cat-vs-dog");
}

export function houseAdsEnabled() {
  return enabled("HOUSE_ADS_ENABLED");
}

export function houseAdFillPercent() {
  const value = Number(process.env.HOUSE_AD_FILL_PERCENT ?? 35);
  if (!Number.isFinite(value)) return 35;
  return Math.max(0, Math.min(100, value));
}

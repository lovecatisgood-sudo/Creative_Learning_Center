function enabled(name: string) {
  return String(process.env[name] ?? "").trim().toLowerCase() === "true";
}

export function getGameLoginConfig() {
  const googleClientId = String(process.env.GOOGLE_CLIENT_ID ?? "").trim();
  return {
    enabled: enabled("GAME_LOGIN_ENABLED") && Boolean(googleClientId),
    googleClientId,
  };
}

export function houseAdsEnabled() {
  return enabled("HOUSE_ADS_ENABLED");
}

export function houseAdFillPercent() {
  const value = Number(process.env.HOUSE_AD_FILL_PERCENT ?? 35);
  if (!Number.isFinite(value)) return 35;
  return Math.max(0, Math.min(100, value));
}

function enabled(name: string) {
  return String(process.env[name] ?? "").trim().toLowerCase() === "true";
}

export function getRoyaltyFeatureConfig() {
  const googleClientId = String(process.env.GOOGLE_CLIENT_ID ?? "").trim();
  const campaignUrl = String(process.env.ROYALTY_CAMPAIGN_URL ?? "").trim();
  return {
    enabled: enabled("ROYALTY_LEADERBOARD_ENABLED") && Boolean(googleClientId) && Boolean(campaignUrl),
    googleClientId,
    campaignUrl,
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

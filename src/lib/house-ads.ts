export const HOUSE_AD_CATEGORIES = ["coding_course", "cafe", "learning_center", "other"] as const;
export const HOUSE_AD_LANGUAGES = ["all", "en", "th"] as const;
export const HOUSE_AD_EVENTS = ["impression", "completed", "click", "skipped", "error"] as const;

export class HouseAdValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HouseAdValidationError";
  }
}

function cleanText(value: unknown, label: string, max: number, required = false) {
  const text = String(value ?? "").trim();
  if (required && !text) throw new HouseAdValidationError(`${label} is required`);
  if (text.length > max) throw new HouseAdValidationError(`${label} is too long`);
  return text;
}

function safeUrl(value: unknown, label: string, required = false) {
  const url = cleanText(value, label, 2_000, required);
  if (!url) return "";
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:") return url;
  } catch {}
  throw new HouseAdValidationError(`${label} must be an HTTPS URL or a site-relative path`);
}

function integer(value: unknown, label: string, min: number, max: number) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new HouseAdValidationError(`${label} must be between ${min} and ${max}`);
  }
  return number;
}

function optionalDate(value: unknown, label: string) {
  if (value === undefined || value === null || value === "") return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new HouseAdValidationError(`${label} is invalid`);
  return date;
}

export function parseHouseAdCampaignInput(body: unknown) {
  if (!body || typeof body !== "object") throw new HouseAdValidationError("Invalid request");
  const value = body as Record<string, unknown>;
  const category = String(value.category ?? "other");
  const language = String(value.language ?? "all");
  if (!HOUSE_AD_CATEGORIES.includes(category as (typeof HOUSE_AD_CATEGORIES)[number])) {
    throw new HouseAdValidationError("Invalid category");
  }
  if (!HOUSE_AD_LANGUAGES.includes(language as (typeof HOUSE_AD_LANGUAGES)[number])) {
    throw new HouseAdValidationError("Invalid language");
  }

  const videoUrl = safeUrl(value.videoUrl, "Video URL");
  const active = value.active === true;
  if (active && !videoUrl) throw new HouseAdValidationError("Add a video before activating this campaign");

  const startsAt = optionalDate(value.startsAt, "Start date");
  const endsAt = optionalDate(value.endsAt, "End date");
  if (startsAt && endsAt && endsAt <= startsAt) {
    throw new HouseAdValidationError("End date must be after start date");
  }

  return {
    name: cleanText(value.name, "Campaign name", 120, true),
    category,
    language,
    videoUrl,
    posterUrl: safeUrl(value.posterUrl, "Poster URL"),
    ctaLabel: cleanText(value.ctaLabel, "Button label", 80),
    destinationUrl: safeUrl(value.destinationUrl, "Destination URL"),
    active,
    startsAt,
    endsAt,
    weight: integer(value.weight ?? 100, "Weight", 1, 10_000),
    skipAfterSeconds: integer(value.skipAfterSeconds ?? 10, "Skip time", 10, 300),
    cooldownSeconds: integer(value.cooldownSeconds ?? 0, "Cooldown", 0, 86_400),
  };
}

export function houseAdId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new HouseAdValidationError("Invalid campaign id");
  return id;
}

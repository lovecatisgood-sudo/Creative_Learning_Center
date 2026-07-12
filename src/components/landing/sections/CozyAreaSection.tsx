"use client";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { Slide } from "@/components/landing/Slide";
import { landingImages } from "@/lib/landing/images";

export function CozyAreaSection() {
  const { t } = useLang();
  return (
    <Slide id="cozy" image={landingImages.cozy} imageAlt={t("landingCozyAlt")}>
      <h2>{t("landingCozyTitle")}</h2>
      <p>{t("landingCozyBody")}</p>
    </Slide>
  );
}

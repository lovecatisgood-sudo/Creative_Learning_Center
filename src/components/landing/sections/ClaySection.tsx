"use client";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { Slide } from "@/components/landing/Slide";
import { landingImages } from "@/lib/landing/images";

export function ClaySection() {
  const { t } = useLang();
  return (
    <Slide id="clay" image={landingImages.clay} imageAlt={t("landingClayAlt")}>
      <h2>{t("landingClayTitle")}</h2>
      <p>{t("landingClayBody")}</p>
    </Slide>
  );
}

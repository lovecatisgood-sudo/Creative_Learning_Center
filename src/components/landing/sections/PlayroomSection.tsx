"use client";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { Slide } from "@/components/landing/Slide";
import { landingImages } from "@/lib/landing/images";

export function PlayroomSection() {
  const { t } = useLang();
  return (
    <Slide id="playroom" image={landingImages.playroom} imageAlt={t("landingPlayroomAlt")}>
      <h2>{t("landingPlayroomTitle")}</h2>
      <p>{t("landingPlayroomBody")}</p>
    </Slide>
  );
}

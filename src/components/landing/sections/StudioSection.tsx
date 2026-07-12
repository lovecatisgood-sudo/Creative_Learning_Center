"use client";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { Slide } from "@/components/landing/Slide";
import { landingImages } from "@/lib/landing/images";

export function StudioSection() {
  const { t } = useLang();
  return (
    <Slide id="studio" image={landingImages.studio} imageAlt={t("landingStudioAlt")}>
      <h2>{t("landingStudioTitle")}</h2>
      <p>{t("landingStudioBody")}</p>
    </Slide>
  );
}

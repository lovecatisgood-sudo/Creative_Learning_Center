"use client";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { Slide } from "@/components/landing/Slide";
import { landingImages } from "@/lib/landing/images";

export function PassesSection() {
  const { t } = useLang();
  return (
    <Slide id="passes" image={landingImages.passes} imageAlt={t("landingPassesAlt")}>
      <h2>{t("landingPassesTitle")}</h2>
      <p>{t("landingPassesBody")}</p>
      <div>
        <span className="landing-price">{t("landingPass30")}</span>
        <span className="landing-price">{t("landingPass60")}</span>
      </div>
    </Slide>
  );
}

"use client";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { Slide } from "@/components/landing/Slide";
import { landingImages } from "@/lib/landing/images";

export function HeroSection() {
  const { t } = useLang();
  return (
    <Slide id="hero" image={landingImages.hero} imageAlt={t("landingHeroAlt")} priority>
      <h1>{t("shopName")}</h1>
      <p>{t("landingTagline")}</p>
      <span className="landing-hero-cue">{t("landingHeroCue")} ↓</span>
    </Slide>
  );
}

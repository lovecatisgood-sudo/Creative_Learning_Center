"use client";
import { useLang } from "@/lib/i18n/LanguageProvider";
import { LangToggle } from "@/components/LangToggle";
import { landingImages } from "@/lib/landing/images";

// Fixed, transparent header over the hero: brand logo + the shared TH/EN toggle.
export function LandingHeader() {
  const { t } = useLang();
  const logo = landingImages.logo;
  return (
    <header className="landing-header">
      <span className="landing-header__brand">
        <img src={logo.src} width={40} height={40} alt={t("landingLogoAlt")} className="landing-header__logo" />
        <span className="landing-header__name">{t("shopName")}</span>
      </span>
      <LangToggle dark />
    </header>
  );
}

"use client";

import { useLang } from "@/lib/i18n/LanguageProvider";
import { LangToggle } from "@/components/LangToggle";
import { landingImages } from "@/lib/landing/images";
import { ResponsiveImage } from "./ResponsiveImage";
import { RevealOnScroll } from "./RevealOnScroll";

// Full v2 landing page markup, ported 1:1 from the approved dist-landing/index.html
// static mock. Class names (wrap, hero, kicker, sec, gallery, g-card, svc, pass, …)
// match the ported CSS in globals.css under the `.landing-v2` scope. Every
// user-visible string goes through t() — no hardcoded display text.
export function LandingClient() {
  const { t } = useLang();
  const gallerySizes = "(min-width:900px) 540px, 90vw";

  return (
    <div className="landing-v2">
      <header>
        <span className="brand">
          <ResponsiveImage image={landingImages.logo} alt={t("landingLogoAlt")} sizes="38px" />
          <b>{t("shopName")}</b>
        </span>
        <LangToggle />
      </header>

      <section className="hero">
        <ResponsiveImage
          image={landingImages.hero}
          alt={t("landingHeroLead")}
          priority
          className="hero-bg"
        />
        <div className="hero-inner">
          <h1>{t("shopName")}</h1>
          <p className="lead">
            <span>{t("landingHeroLead")}</span>
          </p>
          <p className="body">
            <span>{t("landingHeroBody")}</span>
          </p>
          <span className="cue">{t("landingHeroCue")}</span>
        </div>
      </section>

      <section className="block">
        <RevealOnScroll className="wrap">
          <div className="kicker">{t("landingSpaceKicker")}</div>
          <h2 className="sec">
            <span>{t("landingSpaceTitle")}</span>
          </h2>
          <p className="intro">
            <span>{t("landingSpaceIntro")}</span>
          </p>
          <div className="gallery">
            <figure className="g-card">
              <ResponsiveImage
                image={landingImages.playroom}
                alt={t("landingGalleryPlayroom")}
                sizes={gallerySizes}
                className="g-img"
              />
              <figcaption>
                <span>{t("landingGalleryPlayroom")}</span>
              </figcaption>
            </figure>
            <figure className="g-card">
              <ResponsiveImage
                image={landingImages.cozy}
                alt={t("landingGalleryCozy")}
                sizes={gallerySizes}
                className="g-img"
              />
              <figcaption>
                <span>{t("landingGalleryCozy")}</span>
              </figcaption>
            </figure>
            <figure className="g-card">
              <ResponsiveImage
                image={landingImages.studio}
                alt={t("landingGalleryStudio")}
                sizes={gallerySizes}
                className="g-img"
              />
              <figcaption>
                <span>{t("landingGalleryStudio")}</span>
              </figcaption>
            </figure>
            <figure className="g-card">
              <ResponsiveImage
                image={landingImages.passes}
                alt={t("landingGalleryActivity")}
                sizes={gallerySizes}
                className="g-img"
              />
              <figcaption>
                <span>{t("landingGalleryActivity")}</span>
              </figcaption>
            </figure>
          </div>
        </RevealOnScroll>
      </section>

      <section className="block" style={{ background: "var(--tealbg)" }}>
        <RevealOnScroll className="wrap">
          <div className="kicker">{t("landingServicesKicker")}</div>
          <h2 className="sec">
            <span>{t("landingServicesTitle")}</span>
          </h2>
          <p className="intro">
            <span>{t("landingServicesIntro")}</span>
          </p>
          <div className="services">
            <div className="svc">
              <h3>
                <span>{t("svcPlayTitle")}</span>
              </h3>
              <p>
                <span>{t("svcPlayBody")}</span>
              </p>
              <ul className="prices">
                <li>
                  <span className="pr-name">
                    <span>{t("priceHour1Name")}</span>
                  </span>
                  <span className="pr-price">{t("priceHour1Value")}</span>
                </li>
                <li>
                  <span className="pr-name">
                    <span>{t("priceHour2Name")}</span>
                  </span>
                  <span className="pr-price">{t("priceHour2Value")}</span>
                </li>
                <li>
                  <span className="pr-name">
                    <span>{t("priceExtraHourName")}</span>
                  </span>
                  <span className="pr-price">{t("priceExtraHourValue")}</span>
                </li>
              </ul>
            </div>

            <div className="svc has-photo">
              <ResponsiveImage
                image={landingImages.clay}
                alt={t("svcCreativeTitle")}
                sizes={gallerySizes}
                className="svc-photo"
              />
              <div className="svc-photo-body">
                <h3>
                  <span>{t("svcCreativeTitle")}</span>
                </h3>
                <p>
                  <span>{t("svcCreativeBody")}</span>
                </p>
                <ul className="acts">
                  <li>
                    <div className="ai-head">
                      <span className="pr-name">
                        <span>{t("actCrayonName")}</span>
                      </span>
                      <span className="pr-price">{t("actCrayonValue")}</span>
                    </div>
                    <p className="ai-desc">
                      <span>{t("actCrayonDesc")}</span>
                    </p>
                  </li>
                  <li>
                    <div className="ai-head">
                      <span className="pr-name">
                        <span>{t("actClayName")}</span>
                      </span>
                      <span className="pr-price">{t("actClayValue")}</span>
                    </div>
                    <p className="ai-desc">
                      <span>{t("actClayDesc")}</span>
                    </p>
                  </li>
                </ul>
              </div>
            </div>

            <div className="svc wide">
              <h3>
                <span>{t("bundleTitle")}</span>
              </h3>
              <p>
                <span>{t("bundleBody")}</span>
              </p>
              <ul className="bundles">
                <li>
                  <span className="pr-name">
                    <span>{t("bundle1Name")}</span>
                  </span>
                  <span className="pr-price">{t("bundle1Value")}</span>
                </li>
                <li>
                  <span className="pr-name">
                    <span>{t("bundle2Name")}</span>
                  </span>
                  <span className="pr-price">{t("bundle2Value")}</span>
                </li>
                <li>
                  <span className="pr-name">
                    <span>{t("bundle3Name")}</span>
                  </span>
                  <span className="pr-price">{t("bundle3Value")}</span>
                </li>
                <li>
                  <span className="pr-name">
                    <span>{t("bundle4Name")}</span>
                  </span>
                  <span className="pr-price">{t("bundle4Value")}</span>
                </li>
              </ul>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      <section className="block passes">
        <RevealOnScroll className="wrap">
          <div className="kicker">{t("landingPassesKicker")}</div>
          <h2 className="sec">
            <span>{t("landingPassesTitle")}</span>
          </h2>
          <p className="intro">
            <span>{t("landingPassesIntro")}</span>
          </p>
          <div className="pass-grid">
            <div className="pass">
              <h3>
                <span>{t("pass1Title")}</span>
              </h3>
              <div className="price">{t("pass1Price")}</div>
              <p>
                <span>{t("pass1Desc")}</span>
              </p>
            </div>
            <div className="pass featured">
              <span className="tag">{t("pass2Tag")}</span>
              <h3>
                <span>{t("pass2Title")}</span>
              </h3>
              <div className="price">{t("pass2Price")}</div>
              <p>
                <span>{t("pass2Desc")}</span>
              </p>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      <footer>
        <span className="fbrand">
          <ResponsiveImage image={landingImages.logo} alt="" sizes="34px" />
          <span>{t("shopName")}</span>
        </span>
        <div>
          <small>{t("landingFooterTagline")}</small>
        </div>
      </footer>
    </div>
  );
}

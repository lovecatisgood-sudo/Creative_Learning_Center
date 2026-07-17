import type { Metadata } from "next";
import { dict } from "@/lib/i18n/dictionary";
import { CREATIVE_URL, OG_IMAGE } from "@/lib/landing/site";
import { Jsonld } from "@/components/landing/Jsonld";
import { LandingClient } from "@/components/landing/LandingClient";
import { MainSiteShell } from "@/components/main-site/MainSiteShell";

// Metadata is Thai (the default/indexed language).
export const metadata: Metadata = {
  title: dict.landingMetaTitle.th,
  description: dict.landingMetaDescription.th,
  keywords: [
    "สนามเด็กเล่นในร่ม", "สนามเด็กเล่น กรุงเทพ", "กิจกรรมเด็ก", "ปั้นดินเบา", "ระบายสีเด็ก",
    "indoor playroom bangkok", "kids creative studio", "children playground bangkok",
  ],
  alternates: { canonical: CREATIVE_URL },
  openGraph: {
    type: "website",
    url: CREATIVE_URL,
    siteName: "Siamese Cat Creative Club",
    title: dict.landingMetaTitle.th,
    description: dict.landingMetaDescription.th,
    locale: "th_TH",
    alternateLocale: ["en_US"],
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Siamese Cat Creative Club" }],
  },
  twitter: {
    card: "summary_large_image",
    title: dict.landingMetaTitle.th,
    description: dict.landingMetaDescription.th,
    images: [OG_IMAGE],
  },
  robots: { index: true, follow: true },
};

export default function LandingPage() {
  return (
    <>
      <Jsonld />
      <MainSiteShell>
        <LandingClient showChrome={false} />
      </MainSiteShell>
    </>
  );
}

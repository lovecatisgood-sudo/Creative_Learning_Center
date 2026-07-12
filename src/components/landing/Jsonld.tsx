import { SITE_URL, OG_IMAGE } from "@/lib/landing/site";

// LocalBusiness structured data. address/geo/openingHours/telephone are
// intentionally omitted until the owner provides real Google Business Profile
// details (tracked in the design spec §10) — never ship placeholder data.
export function Jsonld() {
  const data = {
    "@context": "https://schema.org",
    "@type": "ChildCare",
    name: "Siamese Cat Creative Club",
    description:
      "A safe supervised indoor children's playroom with art, crayon and soft-clay activities in central Bangkok.",
    url: SITE_URL,
    image: `${SITE_URL}${OG_IMAGE}`,
    logo: `${SITE_URL}/landing/siamese-cat-creative-club-logo-512.webp`,
    priceRange: "฿฿",
    areaServed: "Bangkok",
    makesOffer: [
      { "@type": "Offer", name: "1 Hour of Play", price: "199", priceCurrency: "THB" },
      { "@type": "Offer", name: "2 Hours of Play", price: "300", priceCurrency: "THB" },
      { "@type": "Offer", name: "Crayon Drawing Session", price: "59", priceCurrency: "THB" },
      { "@type": "Offer", name: "Soft-Clay Statue", price: "150", priceCurrency: "THB" },
      { "@type": "Offer", name: "30-Hour Creative Play Pass", price: "3599", priceCurrency: "THB" },
      { "@type": "Offer", name: "60-Hour Creative Family Pass", price: "5999", priceCurrency: "THB" },
    ],
    // TODO(owner): add address/telephone/openingHours once the Google Business
    // Profile is live — omit them entirely until then so no placeholder data ships.
    // address: { "@type": "PostalAddress", streetAddress: "…", addressLocality: "Bangkok", addressCountry: "TH" },
    // telephone: "+66-…",
    // openingHours: "Mo-Su 10:00-19:00",
  };
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
  );
}

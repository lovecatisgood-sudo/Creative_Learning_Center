import { CREATIVE_URL, SITE_URL, OG_IMAGE } from "@/lib/landing/site";

// LocalBusiness structured data. Address + telephone are the owner's real
// details; openingHours is intentionally omitted until confirmed (never ship
// placeholder hours).
export function Jsonld() {
  const data = {
    "@context": "https://schema.org",
    "@type": "ChildCare",
    name: "Siamese Cat Creative Club",
    description:
      "A parent-accompanied Kids Playroom with creative activities and a separate After School Explorer service near Mega Bangna.",
    url: CREATIVE_URL,
    image: `${SITE_URL}${OG_IMAGE}`,
    logo: `${SITE_URL}/landing/siamese-cat-creative-club-logo-512.webp`,
    priceRange: "฿฿",
    areaServed: "Bangkok",
    makesOffer: [
      { "@type": "Offer", name: "Kids Playroom — 1-Hour Entry", price: "149", priceCurrency: "THB" },
      { "@type": "Offer", name: "Kids Playroom — 2-Hour Entry", price: "249", priceCurrency: "THB" },
      { "@type": "Offer", name: "Kids Playroom — Additional Hour", price: "80", priceCurrency: "THB" },
      { "@type": "Offer", name: "Kids Playroom — Additional Adult per Hour", price: "50", priceCurrency: "THB" },
      { "@type": "Offer", name: "Kids Playroom — Crayon Activity", price: "45", priceCurrency: "THB" },
      { "@type": "Offer", name: "Kids Playroom — Small Soft-Clay Figure", price: "69", priceCurrency: "THB" },
      { "@type": "Offer", name: "Kids Playroom — Large Soft-Clay Figure", price: "99", priceCurrency: "THB" },
      { "@type": "Offer", name: "After School Explorer — 1 Hour", price: "199", priceCurrency: "THB" },
      { "@type": "Offer", name: "After School Explorer — 2 Hours", price: "300", priceCurrency: "THB" },
      { "@type": "Offer", name: "After School Explorer — 4-Hour Weekday Option", price: "599", priceCurrency: "THB" },
      { "@type": "Offer", name: "After School Meal Care Add-On", price: "299", priceCurrency: "THB" },
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "46/27 Bang Na-Trat Frontage Rd",
      addressLocality: "Bang Kaeo",
      addressRegion: "Samut Prakan",
      postalCode: "10540",
      addressCountry: "TH",
    },
    telephone: "+66952413028",
    geo: {
      "@type": "GeoCoordinates",
      latitude: 13.6427544,
      longitude: 100.6691261,
    },
    hasMap: "https://maps.app.goo.gl/XpYHkxenRu6gLvnFA",
    // openingHours intentionally omitted until the owner confirms them.
  };
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
  );
}

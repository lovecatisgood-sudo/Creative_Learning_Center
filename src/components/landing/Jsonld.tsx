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
      "A safe supervised small-group playgroup and after-school care space for children near Mega Bangna.",
    url: CREATIVE_URL,
    image: `${SITE_URL}${OG_IMAGE}`,
    logo: `${SITE_URL}/landing/siamese-cat-creative-club-logo-512.webp`,
    priceRange: "฿฿",
    areaServed: "Bangkok",
    makesOffer: [
      { "@type": "Offer", name: "1 Hour of Play", price: "199", priceCurrency: "THB" },
      { "@type": "Offer", name: "2 Hours of Play", price: "300", priceCurrency: "THB" },
      { "@type": "Offer", name: "Weekday Half-Day Care", price: "599", priceCurrency: "THB" },
      { "@type": "Offer", name: "Weekday Full-Day Playgroup", price: "999", priceCurrency: "THB" },
      { "@type": "Offer", name: "Weekend Full-Day Playgroup", price: "1500", priceCurrency: "THB" },
      { "@type": "Offer", name: "20-Session Weekday Full-Day Pass", price: "18000", priceCurrency: "THB" },
      { "@type": "Offer", name: "8-Session Weekend Full-Day Pass", price: "9200", priceCurrency: "THB" },
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
    telephone: "+66804803802",
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

import { SITE_URL, OG_IMAGE } from "@/lib/landing/site";

// LocalBusiness structured data. address/geo/openingHours/telephone are
// PLACEHOLDERS — fill them when the owner provides Google Business Profile
// details (tracked in the design spec §10).
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
    // TODO(owner): replace placeholders once Google Business Profile is live.
    address: {
      "@type": "PostalAddress",
      streetAddress: "PLACEHOLDER — shop address",
      addressLocality: "Bangkok",
      addressCountry: "TH",
    },
    // telephone: "+66-PLACEHOLDER",
    // openingHours: "Mo-Su 10:00-19:00",
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

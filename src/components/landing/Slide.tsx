import { ResponsiveImage } from "./ResponsiveImage";
import { RevealOnScroll } from "./RevealOnScroll";
import type { LandingImage } from "@/lib/landing/images";

// One full-screen snap section: photo fills the slide (cover), copy sits in a
// rounded card. On desktop the card relaxes to a centered column via max-width.
export function Slide({
  id,
  image,
  imageAlt,
  priority = false,
  children,
}: {
  id: string;
  image: LandingImage;
  imageAlt: string;
  priority?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="landing-slide">
      <div className="landing-slide__media">
        <ResponsiveImage image={image} alt={imageAlt} priority={priority} className="landing-slide__img" />
        <div className="landing-slide__scrim" />
      </div>
      <RevealOnScroll className="landing-slide__card">{children}</RevealOnScroll>
    </section>
  );
}

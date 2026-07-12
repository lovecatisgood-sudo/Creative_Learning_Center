import type { LandingImage } from "@/lib/landing/images";

export function ResponsiveImage({
  image,
  alt,
  priority = false,
  className = "",
  sizes = "100vw",
}: {
  image: LandingImage;
  alt: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
}) {
  return (
    <img
      src={image.src}
      srcSet={image.srcset}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      // fetchpriority is valid HTML; cast avoids older React type gaps.
      {...(priority ? ({ fetchpriority: "high" } as Record<string, string>) : {})}
      decoding="async"
      className={className}
    />
  );
}

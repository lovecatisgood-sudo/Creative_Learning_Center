import type { LandingImage } from "@/lib/landing/images";

export function ResponsiveImage({
  image,
  alt,
  priority = false,
  className = "",
}: {
  image: LandingImage;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <img
      src={image.src}
      srcSet={image.srcset}
      sizes="(min-width: 768px) 50vw, 100vw"
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

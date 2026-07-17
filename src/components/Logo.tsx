/* eslint-disable @next/next/no-img-element */

// The 96px WebP covers 2x density for every current header use without loading
// the multi-megabyte source artwork.
export function Logo({ size = 40, alt = "Siamese Cat Creative Club" }: { size?: number; alt?: string }) {
  return (
    <img
      src="/main-site/assets/logo-circle-96.webp"
      alt={alt}
      width={size}
      height={size}
      decoding="async"
      className="rounded-full object-contain"
      style={{ width: size, height: size }}
    />
  );
}

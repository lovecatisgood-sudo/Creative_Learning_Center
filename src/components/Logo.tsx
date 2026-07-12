/* eslint-disable @next/next/no-img-element */

// Circle badge logo. Falls back gracefully if the asset is absent (V1 allows a
// text header per PRD §9). Served from /public/logo.png.
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <img
      src="/logo.png"
      alt="Siamese Cat Creative Club"
      width={size}
      height={size}
      className="rounded-full object-contain"
      style={{ width: size, height: size }}
    />
  );
}

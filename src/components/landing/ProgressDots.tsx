"use client";
import { useEffect, useState } from "react";

// Decorative right-edge dots showing which slide is in view. aria-hidden — the
// sections themselves are the real navigation landmarks.
export function ProgressDots({ count }: { count: number }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>(".landing-slide"));
    if (!sections.length || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = sections.indexOf(e.target as HTMLElement);
            if (i >= 0) setActive(i);
          }
        }
      },
      { threshold: 0.6 },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);
  return (
    <div className="landing-dots" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className={`landing-dot ${i === active ? "is-active" : ""}`} />
      ))}
    </div>
  );
}

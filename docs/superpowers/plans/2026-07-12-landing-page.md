# Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public, Thai-default, SEO-optimized marketing landing page at `/` — six full-screen "slideshow" sections showcasing the shop's real services — reusing the existing brand tokens and i18n.

**Architecture:** New `src/app/(landing)/` route group renders the page full-width; the existing 480px `.app-frame` wrapper moves from the root layout into new `/signup` and `/admin` layouts so the POS is unchanged. Sections are thin client components pulling bilingual copy from the existing i18n dictionary; a header, a scroll-reveal wrapper, and progress dots are also client components. A one-time `sharp` script converts `assets/*` into responsive, SEO-named WebP files in `public/landing/` plus a typed manifest that components import.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind (existing tokens), Baloo 2 font (already loaded), `sharp` (new devDependency), CSS scroll-snap, IntersectionObserver, Next metadata routes (`sitemap.ts`, `robots.ts`), JSON-LD.

## Global Constraints

- **No hardcoded display text.** Every user-visible string goes in `src/lib/i18n/dictionary.ts` (TH + EN) and is rendered via `t("key")`. User-entered data is never translated. (CLAUDE.md / PRD §2)
- **Thai is the default language.** Server-rendered HTML is Thai; English is a client-side toggle persisted in localStorage. Thai is the indexed version.
- **Client/server split.** Never import a db-touching module (`src/lib/packages.ts`, `src/db/*`, anything importing `pg`) into any `"use client"` file or the landing tree. Import types with `import type`. (CLAUDE.md)
- **Brand tokens only** (from `tailwind.config.ts`): `paper #FBF1DE`, `card #FFFAF0`, `ink #33200D`, `meta #8A6F52`, `line #E8D9BC`, `brown #5F2B00`, `amber #E98C1D`, `amber-ink #3A1E00`, `teal #3FD0A7`, `tealdeep #1F8A6B`. Display font `font-display` (Baloo 2).
- **Prices are verbatim from the seeded catalog** (PRD §4 / `src/db/seed.ts`): Entry 1h ฿199, 2h ฿300; Crayon ฿59; Clay ฿150; 30-Hour Pass ฿3,599; 60-Hour Family Pass ฿5,999.
- **No unit-test harness exists.** Verify each task by `pnpm build` (typecheck+lint) and by driving `pnpm dev` and inspecting rendered HTML/behavior. Never claim a step passed without running it.
- **Do not run `pnpm dev` and `pnpm build` against the same `.next` concurrently.** If chunks corrupt: `rm -rf .next && pnpm build`. (CLAUDE.md)
- **Domain:** `https://creative-club.siamesecat.cafe` (lowercased host; browsers treat host case-insensitively). Use as canonical/OG base URL, overridable via `NEXT_PUBLIC_SITE_URL`.
- **Deferred (do NOT build this round):** the "Visit Us" location/contact/CTA section and the `/admin`→`/signup/admin` remap. Ship no register/book CTA buttons this round.

---

### Task 1: Image optimization pipeline + typed manifest

Convert `assets/*` into responsive, SEO-named WebP in `public/landing/`, generate OG image + favicons, and emit a typed manifest components import.

**Files:**
- Create: `scripts/optimize-landing-images.mjs`
- Create (generated, committed): `public/landing/*.webp`, `public/landing/og-siamese-cat-creative-club.jpg`, `public/favicon-32.png`, `public/favicon-16.png`, `public/apple-touch-icon.png`
- Create (generated, committed): `src/lib/landing/images.ts`
- Modify: `package.json` (add `sharp` devDependency + `images:landing` script)

**Interfaces:**
- Produces: `src/lib/landing/images.ts` exporting `type LandingImage = { src: string; srcset: string; width: number; height: number; widths: number[] }` and `const landingImages: Record<LandingImageKey, LandingImage>` where `LandingImageKey` is `"hero" | "playroom" | "cozy" | "studio" | "clay" | "passes" | "logo"`. Consumed by Task 4 (`ResponsiveImage`) and Task 5 (sections).

- [ ] **Step 1: Add sharp and the npm script**

Run:
```bash
pnpm add -D sharp
```
Then in `package.json` `"scripts"`, add:
```json
"images:landing": "node scripts/optimize-landing-images.mjs"
```

- [ ] **Step 2: Write the generation script**

Create `scripts/optimize-landing-images.mjs`:
```js
// Converts assets/* into responsive, SEO-named WebP under public/landing/,
// builds an OG image + favicons, and writes a typed manifest the app imports.
// Idempotent: safe to re-run. Never upscales beyond a source's intrinsic width.
import sharp from "sharp";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(root, "assets");
const OUT = path.join(root, "public", "landing");
const PUBLIC = path.join(root, "public");
const MANIFEST = path.join(root, "src", "lib", "landing", "images.ts");
const TARGET_WIDTHS = [480, 768, 1080, 1440];

// logical key -> source file + SEO-rich output basename
const IMAGES = [
  { key: "hero",     file: "environment-shop-front.webp",      base: "siamese-cat-creative-club-shop-front-bangkok" },
  { key: "playroom", file: "play_room.jpg",                    base: "supervised-indoor-childrens-playroom-bangkok" },
  { key: "cozy",     file: "Cozy_area.jpeg",                   base: "cozy-family-lounge-area" },
  { key: "studio",   file: "artroom.jpg",                      base: "kids-art-and-crayon-creative-studio" },
  { key: "clay",     file: "Clay_Statues.webp",                base: "soft-clay-statue-making-activity-for-kids" },
  { key: "passes",   file: "environment-creative-room.webp",   base: "childrens-creative-activity-room-bangkok" },
];

async function run() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  await mkdir(path.dirname(MANIFEST), { recursive: true });

  const manifest = {};

  for (const img of IMAGES) {
    const input = path.join(SRC, img.file);
    const meta = await sharp(input).metadata();
    const srcW = meta.width;
    const srcH = meta.height;
    // widths <= source width, plus the source width itself, unique + sorted
    const widths = [...new Set(TARGET_WIDTHS.filter((w) => w < srcW).concat(srcW))].sort((a, b) => a - b);
    const srcsetParts = [];
    let largest = null;
    for (const w of widths) {
      const h = Math.round((srcH / srcW) * w);
      const out = `${img.base}-${w}.webp`;
      await sharp(input).resize({ width: w }).webp({ quality: 80, effort: 6 }).toFile(path.join(OUT, out));
      srcsetParts.push(`/landing/${out} ${w}w`);
      largest = { w, h, out };
    }
    manifest[img.key] = {
      src: `/landing/${largest.out}`,
      srcset: srcsetParts.join(", "),
      width: largest.w,
      height: largest.h,
      widths,
    };
    console.log(`${img.key}: ${widths.length} sizes (${widths.join(", ")})`);
  }

  // Logo -> two sizes (for header + JSON-LD/OG)
  const logoSrc = path.join(SRC, "shop_logo.webp");
  for (const w of [256, 512]) {
    await sharp(logoSrc).resize({ width: w }).webp({ quality: 90 }).toFile(path.join(OUT, `siamese-cat-creative-club-logo-${w}.webp`));
  }
  manifest.logo = {
    src: `/landing/siamese-cat-creative-club-logo-512.webp`,
    srcset: `/landing/siamese-cat-creative-club-logo-256.webp 256w, /landing/siamese-cat-creative-club-logo-512.webp 512w`,
    width: 512, height: 512, widths: [256, 512],
  };

  // OG social image (1200x630): shop front cover + logo composited bottom-left
  const logoBuf = await sharp(logoSrc).resize({ width: 240 }).png().toBuffer();
  await sharp(path.join(SRC, "environment-shop-front.webp"))
    .resize({ width: 1200, height: 630, position: "attention" })
    .composite([{ input: logoBuf, gravity: "southwest", top: 360, left: 40 }])
    .jpeg({ quality: 82 })
    .toFile(path.join(OUT, "og-siamese-cat-creative-club.jpg"));

  // Favicons / apple-touch (PNG; Next metadata references these)
  await sharp(logoSrc).resize(16, 16).png().toFile(path.join(PUBLIC, "favicon-16.png"));
  await sharp(logoSrc).resize(32, 32).png().toFile(path.join(PUBLIC, "favicon-32.png"));
  await sharp(logoSrc).resize(180, 180).png().toFile(path.join(PUBLIC, "apple-touch-icon.png"));

  // Typed manifest
  const keys = Object.keys(manifest);
  const body =
`// GENERATED by scripts/optimize-landing-images.mjs — do not edit by hand.
// Run \`pnpm images:landing\` to regenerate.
export type LandingImageKey = ${keys.map((k) => `"${k}"`).join(" | ")};
export type LandingImage = { src: string; srcset: string; width: number; height: number; widths: number[] };
export const landingImages: Record<LandingImageKey, LandingImage> = ${JSON.stringify(manifest, null, 2)} as const;
`;
  await writeFile(MANIFEST, body, "utf8");
  console.log(`Wrote ${MANIFEST}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 3: Generate the images and manifest**

Run:
```bash
pnpm images:landing
```
Expected: logs `hero: N sizes ...` for each image and `Wrote .../images.ts`. No errors.

- [ ] **Step 4: Verify outputs exist and are reasonably sized**

Run:
```bash
ls -la public/landing/ && du -h public/landing/*-1080.webp 2>/dev/null; head -20 src/lib/landing/images.ts
```
Expected: WebP files at multiple widths per image, an `og-*.jpg`, favicon PNGs in `public/`, and a manifest with all 7 keys (`hero,playroom,cozy,studio,clay,passes,logo`). Each `-1080.webp` well under ~200KB.

- [ ] **Step 5: Commit**

```bash
git add scripts/optimize-landing-images.mjs package.json pnpm-lock.yaml public/landing src/lib/landing/images.ts public/favicon-16.png public/favicon-32.png public/apple-touch-icon.png
git commit -m "Add landing image pipeline: responsive WebP + typed manifest"
```

---

### Task 2: app-frame layout refactor (POS unchanged, landing free)

Move the 480px column wrapper out of the root layout into `/signup` and `/admin` so the landing can be full-width without altering the POS.

**Files:**
- Modify: `src/app/layout.tsx` (remove the `.app-frame` wrapper div)
- Create: `src/app/signup/layout.tsx`
- Create: `src/app/admin/layout.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing importable; establishes that `/` (and the future `(landing)` group) render without the 480px cap while `/signup/*` and `/admin/*` keep it.

- [ ] **Step 1: Remove the wrapper from the root layout**

In `src/app/layout.tsx`, change the body content from:
```tsx
        <LanguageProvider>
          <div className="app-frame">{children}</div>
        </LanguageProvider>
```
to:
```tsx
        <LanguageProvider>{children}</LanguageProvider>
```

- [ ] **Step 2: Add the signup layout**

Create `src/app/signup/layout.tsx`:
```tsx
// The public registration flow keeps the phone-width column the whole POS uses.
export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <div className="app-frame">{children}</div>;
}
```

- [ ] **Step 3: Add the admin layout**

Create `src/app/admin/layout.tsx`:
```tsx
// Wraps both /admin/login and the authenticated /admin/(app) subtree in the
// phone-width column. Auth still happens in (app)/layout.tsx + route handlers.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="app-frame">{children}</div>;
}
```

- [ ] **Step 4: Verify the POS is visually unchanged**

Run `pnpm dev`, then load `http://localhost:3000/signup` and `http://localhost:3000/admin/login`. Expected: both still render as a centered 480px column on a wide window, identical to before. (Root `/` still redirects to `/admin` until Task 5 replaces it — fine here.)

- [ ] **Step 5: Build check + commit**

```bash
pnpm build
git add src/app/layout.tsx src/app/signup/layout.tsx src/app/admin/layout.tsx
git commit -m "Move app-frame column into POS layouts so landing can go full-width"
```
Expected: build passes.

---

### Task 3: i18n — landing dictionary block

Add every landing string (headings, body, alt text, misc) in Thai + English.

**Files:**
- Modify: `src/lib/i18n/dictionary.ts` (append landing keys before the closing `}` of `dict`)

**Interfaces:**
- Produces: dictionary keys consumed by Tasks 4 & 5 via `t()`. Keys (all present in both `th` and `en`):
  `landingTagline, landingHeroCue, landingHeroAlt, landingPlayroomTitle, landingPlayroomBody, landingPlayroomAlt, landingCozyTitle, landingCozyBody, landingCozyAlt, landingStudioTitle, landingStudioBody, landingStudioAlt, landingClayTitle, landingClayBody, landingClayAlt, landingPassesTitle, landingPassesBody, landingPass30, landingPass60, landingPassesAlt, landingLogoAlt, landingMetaTitle, landingMetaDescription`.

- [ ] **Step 1: Append the landing keys**

In `src/lib/i18n/dictionary.ts`, add inside the `dict` object (e.g. just before its closing brace):
```ts
  // ── Landing page ──
  landingTagline: {
    th: "สนามเด็กเล่นสร้างสรรค์ในร่ม ใจกลางกรุงเทพฯ",
    en: "A creative indoor playroom for kids, in the heart of Bangkok",
  },
  landingHeroCue: { th: "เลื่อนลงเพื่อสำรวจ", en: "Scroll to explore" },
  landingHeroAlt: {
    th: "หน้าร้าน Siamese Cat Creative Club กรุงเทพฯ",
    en: "Siamese Cat Creative Club shop front in Bangkok",
  },
  landingPlayroomTitle: { th: "สนามเด็กเล่นในร่มที่ปลอดภัย", en: "A safe, supervised indoor playroom" },
  landingPlayroomBody: {
    th: "พื้นที่เล่นสะอาดและปลอดภัย มีพี่เลี้ยงดูแลตลอดเวลา เลือกเข้าเล่นแบบรายชั่วโมงได้ตามสะดวก — 1 ชั่วโมง 199 บาท หรือ 2 ชั่วโมง 300 บาท",
    en: "A clean, safe play space with staff supervising at all times. Drop in by the hour — 1 hour ฿199 or 2 hours ฿300.",
  },
  landingPlayroomAlt: {
    th: "เด็ก ๆ กำลังเล่นในสนามเด็กเล่นในร่มที่มีพี่เลี้ยงดูแล",
    en: "Children playing in the supervised indoor playroom",
  },
  landingCozyTitle: { th: "มุมพักผ่อนสบายสำหรับครอบครัว", en: "A cozy corner for the whole family" },
  landingCozyBody: {
    th: "มุมนั่งเล่นแสนสบายให้คุณพ่อคุณแม่ได้พักผ่อน จิบเครื่องดื่ม และมองเห็นลูก ๆ เล่นได้อย่างสบายใจ",
    en: "A comfortable lounge where parents can relax, enjoy a drink, and keep an easy eye on the kids.",
  },
  landingCozyAlt: { th: "มุมพักผ่อนสบาย ๆ สำหรับครอบครัว", en: "Cozy family lounge area" },
  landingStudioTitle: { th: "ห้องศิลปะและระบายสี", en: "The art & crayon studio" },
  landingStudioBody: {
    th: "ปลดปล่อยจินตนาการกับกิจกรรมศิลปะและระบายสีเทียน เหมาะสำหรับเสริมสร้างพัฒนาการและความคิดสร้างสรรค์ เริ่มต้นเพียง 59 บาท",
    en: "Spark imagination with art and crayon activities that build creativity and fine motor skills. From just ฿59.",
  },
  landingStudioAlt: { th: "ห้องกิจกรรมศิลปะและระบายสีสำหรับเด็ก", en: "Kids art and crayon creative studio" },
  landingClayTitle: { th: "กิจกรรมปั้นดินเบา", en: "Make your own soft-clay statue" },
  landingClayBody: {
    th: "กิจกรรมปั้นดินเบาสุดพิเศษ ให้เด็ก ๆ สร้างสรรค์ผลงานชิ้นเล็ก ๆ และนำกลับบ้านเป็นของที่ระลึก ราคา 150 บาทต่อชิ้น",
    en: "Our signature hands-on clay activity — kids sculpt a little masterpiece and take it home as a keepsake. ฿150 per statue.",
  },
  landingClayAlt: { th: "ผลงานปั้นดินเบาของเด็ก ๆ", en: "Children's soft-clay statue creations" },
  landingPassesTitle: { th: "แพ็กเกจและบัตรสมาชิกครอบครัว", en: "Hour passes & family membership" },
  landingPassesBody: {
    th: "มาเล่นบ่อยคุ้มกว่า! เลือกแพ็กเกจชั่วโมงที่ใช้ได้หลายครั้ง พร้อมกิจกรรมสร้างสรรค์รวมอยู่ในแพ็กเกจ",
    en: "Come often and save. Multi-visit hour passes that bundle in creative activities.",
  },
  landingPass30: { th: "แพ็กเกจ 30 ชั่วโมง — 3,599 บาท", en: "30-Hour Creative Play Pass — ฿3,599" },
  landingPass60: {
    th: "แพ็กเกจครอบครัว 60 ชั่วโมง — 5,999 บาท (แชร์กันได้ทั้งครอบครัว)",
    en: "60-Hour Family Pass — ฿5,999 (shareable across the family)",
  },
  landingPassesAlt: { th: "ห้องกิจกรรมสร้างสรรค์สำหรับเด็ก", en: "Children's creative activity room" },
  landingLogoAlt: { th: "โลโก้ Siamese Cat Creative Club", en: "Siamese Cat Creative Club logo" },
  landingMetaTitle: {
    th: "Siamese Cat Creative Club — สนามเด็กเล่นและกิจกรรมสร้างสรรค์ในร่ม กรุงเทพฯ",
    en: "Siamese Cat Creative Club — Indoor Kids Playroom & Creative Studio, Bangkok",
  },
  landingMetaDescription: {
    th: "สนามเด็กเล่นในร่มที่ปลอดภัย พร้อมกิจกรรมศิลปะ ระบายสี และปั้นดินเบาสำหรับเด็ก ใจกลางกรุงเทพฯ มีพี่เลี้ยงดูแล เข้าเล่นรายชั่วโมงหรือซื้อแพ็กเกจครอบครัว",
    en: "A safe supervised indoor children's playroom with art, crayon and soft-clay activities in central Bangkok. Drop in by the hour or buy a family pass.",
  },
```

- [ ] **Step 2: Typecheck**

Run:
```bash
pnpm build
```
Expected: build passes (dictionary is typed; a missing `th`/`en` pair would error).

- [ ] **Step 3: Commit**

```bash
git add src/lib/i18n/dictionary.ts
git commit -m "Add landing-page i18n strings (TH default + EN)"
```

---

### Task 4: Landing shared components + CSS

Presentational and client helpers used by all sections.

**Files:**
- Create: `src/components/landing/ResponsiveImage.tsx`
- Create: `src/components/landing/Slide.tsx`
- Create: `src/components/landing/RevealOnScroll.tsx`
- Create: `src/components/landing/LandingHeader.tsx`
- Create: `src/components/landing/ProgressDots.tsx`
- Modify: `src/app/globals.css` (append landing scroll-snap + reveal styles)

**Interfaces:**
- Consumes: `landingImages` (Task 1), the i18n hook + `LangToggle` from the existing i18n system, `dict` keys (Task 3).
- Produces:
  - `ResponsiveImage({ image: LandingImage, alt: string, priority?: boolean, className?: string })` — renders `<img>` with `srcset`/`sizes`/`width`/`height`.
  - `Slide({ id, image, imageAlt, priority?, children })` — full-screen `<section>` with background photo + overlaid copy card; `children` is the copy.
  - `RevealOnScroll({ children, className? })` — `"use client"` wrapper that adds `.is-visible` when scrolled into view.
  - `LandingHeader()` — `"use client"` fixed logo + `LangToggle`.
  - `ProgressDots({ count })` — `"use client"` decorative slide indicators.

- [ ] **Step 0: Confirm the real i18n API (do this first)**

Read `src/lib/i18n/LanguageProvider.tsx` and `src/components/LangToggle.tsx`. Record the actual hook export name and its return shape (does it return `{ t }`, `{ t, lang }`, or a bare `t`?) and `LangToggle`'s import path. In every landing client component below, use the REAL names. The examples below assume a `useI18n()` hook returning `{ t }` and a named `LangToggle` — if the codebase differs (e.g. `useLang`, `useTranslation`, default export), substitute the real API. Do not invent an API.

- [ ] **Step 1: ResponsiveImage (server component)**

Create `src/components/landing/ResponsiveImage.tsx`:
```tsx
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
```

- [ ] **Step 2: Slide (server component)**

Create `src/components/landing/Slide.tsx`:
```tsx
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
```

- [ ] **Step 3: RevealOnScroll (client component)**

Create `src/components/landing/RevealOnScroll.tsx`:
```tsx
"use client";
import { useEffect, useRef, useState } from "react";

// Progressive enhancement: content is fully rendered/visible without JS; this
// only adds a class to animate it in when it enters the viewport.
export function RevealOnScroll({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) { setVisible(true); io.disconnect(); }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`landing-reveal ${visible ? "is-visible" : ""} ${className}`}>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: LandingHeader (client component)**

Create `src/components/landing/LandingHeader.tsx` (adjust the i18n import to the real API from Step 0):
```tsx
"use client";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { LangToggle } from "@/components/LangToggle";
import { landingImages } from "@/lib/landing/images";

// Fixed, transparent header over the hero: brand logo + the shared TH/EN toggle.
export function LandingHeader() {
  const { t } = useI18n();
  const logo = landingImages.logo;
  return (
    <header className="landing-header">
      <span className="landing-header__brand">
        <img src={logo.src} width={40} height={40} alt={t("landingLogoAlt")} className="landing-header__logo" />
        <span className="landing-header__name">{t("shopName")}</span>
      </span>
      <LangToggle />
    </header>
  );
}
```

- [ ] **Step 5: ProgressDots (client component)**

Create `src/components/landing/ProgressDots.tsx`:
```tsx
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
```

- [ ] **Step 6: Append landing CSS**

Append to `src/app/globals.css`:
```css
/* ─── Landing page (marketing) ───────────────────────────────────────────── */
.landing-scroll {
  height: 100svh;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
  background: var(--paper);
}
.landing-slide {
  position: relative;
  min-height: 100svh;
  scroll-snap-align: start;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
}
.landing-slide__media { position: absolute; inset: 0; }
.landing-slide__img { width: 100%; height: 100%; object-fit: cover; }
.landing-slide__scrim {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(51,32,13,0.78) 0%, rgba(51,32,13,0.28) 45%, rgba(51,32,13,0.12) 100%);
}
.landing-slide__card {
  position: relative;
  margin: 0 1rem 8vh;
  max-width: 640px;
  background: rgba(255,250,240,0.94);
  border: 1px solid var(--line);
  border-radius: 1.25rem;
  padding: 1.5rem 1.5rem 1.75rem;
  box-shadow: 0 12px 40px rgba(51,32,13,0.28);
}
.landing-slide__card h1,
.landing-slide__card h2 {
  font-family: "Baloo 2", ui-rounded, system-ui, sans-serif;
  color: var(--ink);
  line-height: 1.1;
  margin: 0 0 0.5rem;
}
.landing-slide__card h1 { font-size: clamp(1.9rem, 7vw, 3rem); }
.landing-slide__card h2 { font-size: clamp(1.5rem, 6vw, 2.4rem); }
.landing-slide__card p { color: #4a2f16; font-size: 1.05rem; line-height: 1.5; margin: 0.35rem 0 0; }
.landing-price { display: inline-block; margin-top: 0.85rem; padding: 0.4rem 0.9rem; border-radius: 999px;
  background: #E98C1D; color: #3A1E00; font-weight: 700; font-size: 0.98rem; }
.landing-price + .landing-price { margin-left: 0.5rem; }

.landing-reveal { opacity: 1; transform: none; }
@media (prefers-reduced-motion: no-preference) {
  .landing-reveal { opacity: 0; transform: translateY(24px); transition: opacity .6s ease, transform .6s ease; }
  .landing-reveal.is-visible { opacity: 1; transform: none; }
}

.landing-header {
  position: fixed; top: 0; left: 0; right: 0; z-index: 20;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.75rem 1rem;
  background: linear-gradient(to bottom, rgba(51,32,13,0.45), rgba(51,32,13,0));
}
.landing-header__brand { display: flex; align-items: center; gap: 0.5rem; }
.landing-header__logo { border-radius: 999px; }
.landing-header__name { color: #FFFAF0; font-family: "Baloo 2", sans-serif; font-weight: 700; font-size: 0.95rem;
  text-shadow: 0 1px 4px rgba(0,0,0,0.5); }

.landing-hero-cue { position: absolute; bottom: 2.5vh; left: 0; right: 0; text-align: center;
  color: #FFFAF0; font-size: 0.9rem; opacity: 0.9; text-shadow: 0 1px 4px rgba(0,0,0,0.5); animation: landingBob 1.8s ease-in-out infinite; }
@keyframes landingBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
@media (prefers-reduced-motion: reduce) { .landing-hero-cue { animation: none; } }

.landing-dots { position: fixed; right: 0.6rem; top: 50%; transform: translateY(-50%); z-index: 20;
  display: flex; flex-direction: column; gap: 0.5rem; }
.landing-dot { width: 8px; height: 8px; border-radius: 999px; background: rgba(255,250,240,0.55); transition: all .25s; }
.landing-dot.is-active { background: #E98C1D; height: 20px; }

@media (min-width: 768px) {
  .landing-slide { align-items: center; }
  .landing-slide__card { margin-bottom: 0; margin-left: 6vw; align-self: center; }
  .landing-slide__scrim { background: linear-gradient(to right, rgba(51,32,13,0.72) 0%, rgba(51,32,13,0.25) 55%, rgba(51,32,13,0) 100%); }
}
```

- [ ] **Step 7: Typecheck + commit**

```bash
pnpm build
git add src/components/landing src/app/globals.css
git commit -m "Add landing shared components + scroll-snap styles"
```
Expected: build passes. (The page isn't wired yet; components compile.)

---

### Task 5: Section components + page assembly

Assemble the six sections and the landing page/layout; replace the root redirect.

**Files:**
- Create: `src/components/landing/sections/HeroSection.tsx`
- Create: `src/components/landing/sections/PlayroomSection.tsx`
- Create: `src/components/landing/sections/CozyAreaSection.tsx`
- Create: `src/components/landing/sections/StudioSection.tsx`
- Create: `src/components/landing/sections/ClaySection.tsx`
- Create: `src/components/landing/sections/PassesSection.tsx`
- Create: `src/app/(landing)/layout.tsx`
- Create: `src/app/(landing)/page.tsx`
- Delete: `src/app/page.tsx` (root redirect — replaced by the `(landing)` group's `/` route)

**Interfaces:**
- Consumes: `Slide`, `LandingHeader`, `ProgressDots` (Task 4), `landingImages` (Task 1), i18n (Task 3/Task 4 Step 0).
- Produces: the `/` route.

IMPORTANT — server vs client copy: `t()` comes from a client context, so any section calling the hook must be `"use client"`. Sections stay thin (text only); images come from the client-safe manifest (no db imports), so the client bundle stays clean. Use the real hook name confirmed in Task 4 Step 0 consistently.

- [ ] **Step 1: HeroSection**

Create `src/components/landing/sections/HeroSection.tsx`:
```tsx
"use client";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { Slide } from "@/components/landing/Slide";
import { landingImages } from "@/lib/landing/images";

export function HeroSection() {
  const { t } = useI18n();
  return (
    <Slide id="hero" image={landingImages.hero} imageAlt={t("landingHeroAlt")} priority>
      <h1>{t("shopName")}</h1>
      <p>{t("landingTagline")}</p>
      <span className="landing-hero-cue">{t("landingHeroCue")} ↓</span>
    </Slide>
  );
}
```

- [ ] **Step 2: PlayroomSection**

Create `src/components/landing/sections/PlayroomSection.tsx`:
```tsx
"use client";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { Slide } from "@/components/landing/Slide";
import { landingImages } from "@/lib/landing/images";

export function PlayroomSection() {
  const { t } = useI18n();
  return (
    <Slide id="playroom" image={landingImages.playroom} imageAlt={t("landingPlayroomAlt")}>
      <h2>{t("landingPlayroomTitle")}</h2>
      <p>{t("landingPlayroomBody")}</p>
    </Slide>
  );
}
```

- [ ] **Step 3: CozyAreaSection**

Create `src/components/landing/sections/CozyAreaSection.tsx`:
```tsx
"use client";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { Slide } from "@/components/landing/Slide";
import { landingImages } from "@/lib/landing/images";

export function CozyAreaSection() {
  const { t } = useI18n();
  return (
    <Slide id="cozy" image={landingImages.cozy} imageAlt={t("landingCozyAlt")}>
      <h2>{t("landingCozyTitle")}</h2>
      <p>{t("landingCozyBody")}</p>
    </Slide>
  );
}
```

- [ ] **Step 4: StudioSection**

Create `src/components/landing/sections/StudioSection.tsx`:
```tsx
"use client";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { Slide } from "@/components/landing/Slide";
import { landingImages } from "@/lib/landing/images";

export function StudioSection() {
  const { t } = useI18n();
  return (
    <Slide id="studio" image={landingImages.studio} imageAlt={t("landingStudioAlt")}>
      <h2>{t("landingStudioTitle")}</h2>
      <p>{t("landingStudioBody")}</p>
    </Slide>
  );
}
```

- [ ] **Step 5: ClaySection**

Create `src/components/landing/sections/ClaySection.tsx`:
```tsx
"use client";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { Slide } from "@/components/landing/Slide";
import { landingImages } from "@/lib/landing/images";

export function ClaySection() {
  const { t } = useI18n();
  return (
    <Slide id="clay" image={landingImages.clay} imageAlt={t("landingClayAlt")}>
      <h2>{t("landingClayTitle")}</h2>
      <p>{t("landingClayBody")}</p>
    </Slide>
  );
}
```

- [ ] **Step 6: PassesSection**

Create `src/components/landing/sections/PassesSection.tsx`:
```tsx
"use client";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { Slide } from "@/components/landing/Slide";
import { landingImages } from "@/lib/landing/images";

export function PassesSection() {
  const { t } = useI18n();
  return (
    <Slide id="passes" image={landingImages.passes} imageAlt={t("landingPassesAlt")}>
      <h2>{t("landingPassesTitle")}</h2>
      <p>{t("landingPassesBody")}</p>
      <div>
        <span className="landing-price">{t("landingPass30")}</span>
        <span className="landing-price">{t("landingPass60")}</span>
      </div>
    </Slide>
  );
}
```

- [ ] **Step 7: Landing layout**

Create `src/app/(landing)/layout.tsx`:
```tsx
// Full-width shell for the marketing site (no 480px app-frame). The scroll-snap
// container lives in the page so the header/dots can sit fixed over it.
export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 8: Landing page**

Create `src/app/(landing)/page.tsx`:
```tsx
import { LandingHeader } from "@/components/landing/LandingHeader";
import { ProgressDots } from "@/components/landing/ProgressDots";
import { HeroSection } from "@/components/landing/sections/HeroSection";
import { PlayroomSection } from "@/components/landing/sections/PlayroomSection";
import { CozyAreaSection } from "@/components/landing/sections/CozyAreaSection";
import { StudioSection } from "@/components/landing/sections/StudioSection";
import { ClaySection } from "@/components/landing/sections/ClaySection";
import { PassesSection } from "@/components/landing/sections/PassesSection";

export default function LandingPage() {
  return (
    <>
      <LandingHeader />
      <ProgressDots count={6} />
      <main className="landing-scroll">
        <HeroSection />
        <PlayroomSection />
        <CozyAreaSection />
        <StudioSection />
        <ClaySection />
        <PassesSection />
      </main>
    </>
  );
}
```

- [ ] **Step 9: Remove the old root redirect**

Delete `src/app/page.tsx`:
```bash
git rm src/app/page.tsx
```
(The `(landing)` route group now owns `/`. Two files resolving to `/` is a Next.js build error, so this deletion is required.)

- [ ] **Step 10: Verify the page renders and behaves**

Run `pnpm build` then `pnpm start` (or `pnpm dev`), load `http://localhost:3000/`:
- All six sections present; scrolling snaps section by section.
- Thai copy by default; header TH/EN toggle flips every heading/paragraph and persists across reload.
- Images load (Network → `.webp`, correct width variant for viewport).
- `/signup` and `/admin/login` still render as the 480px POS column.

Confirm SSR'd Thai content (proves indexable):
```bash
curl -s http://localhost:3000/ | grep -o 'สนามเด็กเล่น[^<]*' | head -1
```
Expected: prints Thai hero/section text.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "Build landing page: six showcase sections at /"
```

---

### Task 6: SEO — metadata, JSON-LD, sitemap, robots, icons

Make the page rank/index well and share cleanly.

**Files:**
- Create: `src/lib/landing/site.ts` (site constants)
- Create: `src/components/landing/Jsonld.tsx`
- Modify: `src/app/(landing)/page.tsx` (add `metadata` + render `<Jsonld/>`)
- Modify: `src/app/layout.tsx` (add `metadataBase` + default icons)
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`

**Interfaces:**
- Consumes: dictionary objects `dict.landingMetaTitle`, `dict.landingMetaDescription` (Task 3); `landingImages` (Task 1).
- Produces: `SITE_URL`, `OG_IMAGE` from `src/lib/landing/site.ts`, consumed by sitemap/robots/JSON-LD/metadata.

- [ ] **Step 1: Site constants**

Create `src/lib/landing/site.ts`:
```ts
// Canonical site origin. Host is lowercased (browsers treat it case-insensitively);
// override per-environment with NEXT_PUBLIC_SITE_URL.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://creative-club.siamesecat.cafe").replace(/\/$/, "");
export const OG_IMAGE = "/landing/og-siamese-cat-creative-club.jpg";
```

- [ ] **Step 2: JSON-LD component**

Create `src/components/landing/Jsonld.tsx`:
```tsx
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
```

- [ ] **Step 3: Page metadata + render JSON-LD**

In `src/app/(landing)/page.tsx`, add above the component:
```tsx
import type { Metadata } from "next";
import { dict } from "@/lib/i18n/dictionary";
import { SITE_URL, OG_IMAGE } from "@/lib/landing/site";
import { Jsonld } from "@/components/landing/Jsonld";

// Metadata is Thai (the default/indexed language).
export const metadata: Metadata = {
  title: dict.landingMetaTitle.th,
  description: dict.landingMetaDescription.th,
  keywords: [
    "สนามเด็กเล่นในร่ม", "สนามเด็กเล่น กรุงเทพ", "กิจกรรมเด็ก", "ปั้นดินเบา", "ระบายสีเด็ก",
    "indoor playroom bangkok", "kids creative studio", "children playground bangkok",
  ],
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Siamese Cat Creative Club",
    title: dict.landingMetaTitle.th,
    description: dict.landingMetaDescription.th,
    locale: "th_TH",
    alternateLocale: ["en_US"],
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Siamese Cat Creative Club" }],
  },
  twitter: {
    card: "summary_large_image",
    title: dict.landingMetaTitle.th,
    description: dict.landingMetaDescription.th,
    images: [OG_IMAGE],
  },
  robots: { index: true, follow: true },
};
```
Then render `<Jsonld />` as the first child inside the returned fragment (before `<LandingHeader/>`).

NOTE: `dict` is a plain data object (no db import) — safe to import into this server component. Do not import the client i18n hook here.

- [ ] **Step 4: metadataBase + icons in the root layout**

In `src/app/layout.tsx`, extend the exported `metadata` (keep the existing `viewport` export unchanged):
```tsx
import { SITE_URL } from "@/lib/landing/site";
// ...
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: process.env.NEXT_PUBLIC_SHOP_NAME || "Siamese Cat Creative Club",
  description: "Point-of-sale & session management",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};
```

- [ ] **Step 5: sitemap + robots**

Create `src/app/sitemap.ts`:
```ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/landing/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/signup`, changeFrequency: "yearly", priority: 0.5 },
  ];
}
```

Create `src/app/robots.ts`:
```ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/landing/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
```

- [ ] **Step 6: Verify SEO output**

Run `pnpm build` then `pnpm start`; then:
```bash
curl -s http://localhost:3000/ | grep -iE '<title>|og:image|application/ld\+json|name="description"' | head
curl -s http://localhost:3000/robots.txt
curl -s http://localhost:3000/sitemap.xml
curl -s http://localhost:3000/ | grep -o '<h1' | wc -l   # expect 1
```
Expected: Thai `<title>` + meta description; one JSON-LD script; OG tags; `robots.txt` disallows `/admin` + `/api` and lists the sitemap; `sitemap.xml` lists `/` and `/signup`; exactly one `<h1>`.

- [ ] **Step 7: Commit**

```bash
git add src/lib/landing/site.ts src/components/landing/Jsonld.tsx "src/app/(landing)/page.tsx" src/app/layout.tsx src/app/sitemap.ts src/app/robots.ts
git commit -m "Add landing SEO: metadata, JSON-LD, sitemap, robots, icons"
```

---

### Task 7: Docs + final regression pass

Document the new command/architecture and verify nothing regressed.

**Files:**
- Modify: `CLAUDE.md` (Commands + Architecture notes)
- Modify: `DEPLOY.md` (regenerate images step)
- Modify: memory `sccc-build-state.md` + `MEMORY.md`

- [ ] **Step 1: Update CLAUDE.md**

Under Commands add:
```bash
pnpm images:landing            # regenerate responsive landing WebP + manifest from assets/
```
Under Architecture add a note: `src/app/(landing)/*` is the public marketing page at `/`; the 480px `.app-frame` now lives in `src/app/signup/layout.tsx` + `src/app/admin/layout.tsx` (not the root layout); landing images are generated static WebP in `public/landing/` with a typed manifest at `src/lib/landing/images.ts`.

- [ ] **Step 2: Update DEPLOY.md**

Add a note (before the build step) that committed `public/landing/*` means a normal deploy needs no image step; if assets change, run `pnpm images:landing` (requires the `sharp` devDependency installed).

- [ ] **Step 3: Final regression sweep**

Run:
```bash
rm -rf .next && pnpm build
```
Then `pnpm start` (in background; kill by PID after) and verify in one pass:
- `/` — 6 sections, snap scroll, TH default, EN toggle persists, images load.
- `/signup` — renders as before (480px column).
- `/admin/login` — renders as before; logging in reaches the dashboard (`/admin`).
- Lighthouse (Chrome devtools) on `/` mobile: SEO ≥ 95, no CLS from images. Record the score.
- `curl -s http://localhost:3000/ | grep 'สนามเด็กเล่น'` returns Thai text.
Cross-check `WALKTHROUGH.md`: the "loads in Thai by default on /signup and /admin" item still holds.

- [ ] **Step 4: Commit docs**

```bash
git add CLAUDE.md DEPLOY.md
git commit -m "Document landing page: images:landing command + architecture"
```

- [ ] **Step 5: Update memory**

Update `memory/sccc-build-state.md` (new HEAD, landing page shipped) and note deferred items: Visit-Us section (needs Google Map + contacts) and `/admin`→`/signup/admin` remap. Keep `MEMORY.md` index consistent.

---

## Self-Review

**Spec coverage:**
- §2 scope (6 sections; deferred Visit + remap) → Tasks 3–6 build 6 sections; no CTA/Visit; remap untouched. ✓
- §3 brand tokens → Global Constraints + Task 4 CSS. ✓
- §4.1 routing/app-frame refactor → Task 2 + Task 5 (delete root redirect, `(landing)` group). ✓
- §4.2 scroll-snap + progressive-enhancement reveal → Task 4 CSS + RevealOnScroll. ✓
- §4.3 component layout → Tasks 4–6 (matches the file list; `Jsonld` in Task 6). ✓
- §4.4 six sections w/ images+copy → Tasks 1,3,5. ✓
- §5 image pipeline + typed manifest + OG + favicons → Task 1. ✓
- §5.4 on-page SEO (metadata, JSON-LD, sitemap, robots, semantic headings) → Task 6. ✓
- §6 i18n block → Task 3. ✓
- §7 edge cases (no-JS, CLS, 100svh, missing-image guard via manifest, POS regression) → Tasks 1,2,4,5,7. ✓
- §8 verification → each task's verify step + Task 7 sweep. ✓

**Placeholder scan:** The only intentional placeholders are the JSON-LD address/telephone/hours — explicitly deferred per spec §10 and clearly commented. No "TBD/implement later" in code steps.

**Type consistency:** `LandingImageKey` = `hero|playroom|cozy|studio|clay|passes|logo` used identically in Task 1 manifest and Task 5 sections. `landingImages.<key>` references match generated keys. i18n keys in Task 3 match every `t("...")` call in Tasks 4–5. `SITE_URL`/`OG_IMAGE` defined once (Task 6 Step 1) and reused.

**Open risk to confirm during execution:** the exact i18n hook/export name (`useI18n` vs `useLang`/`useTranslation`) and `LangToggle`'s import path/props. Task 4 Step 0 requires reading the real files first and applying the confirmed name everywhere — the one deliberate "verify the real API" instruction, not an invented signature.

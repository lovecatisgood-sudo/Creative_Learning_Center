# Landing Page — Design

**Date:** 2026-07-12
**Status:** Approved (design), ready for implementation plan
**Author:** Claude + owner

## 1. Purpose

Add a public marketing landing page for **Siamese Cat Creative Club** (a
supervised children's playroom + creative activity space in Bangkok) at the site
root `/`. It showcases the shop's real services as a mobile-first, section-by-section
"slideshow", is Thai by default with an English toggle, and is engineered for a
high SEO score so it ranks and indexes well.

The landing page shares the domain with the existing POS:

```
/              → Landing page (this spec)
/signup        → Parent registration (existing, unchanged this round)
/admin         → Admin dashboard (existing; remap to /signup/admin is a DEFERRED follow-up)
```

## 2. Scope

### In scope (this round)
- 6 full-screen showcase sections with real bilingual copy and one real photo each.
- Mobile-first vertical scroll-snap "slideshow" behaviour; responsive desktop layout.
- Image optimization pipeline: source assets → responsive, SEO-named WebP.
- On-page SEO: metadata, Open Graph/Twitter, `LocalBusiness` JSON-LD, semantic
  headings, OG/social image, favicon/apple-touch icons.
- Reuse the existing Thai-default i18n (LanguageProvider + dictionary + LangToggle);
  add a `landing.*` key block.
- Small layout refactor so the landing renders full-width while the POS keeps its
  480px phone column.

### Deferred (explicit owner decision — NOT this round)
- **"Visit Us" section** (section 7): location, embedded Google Map, contact
  channels, and the primary register/book CTA. Waits until the owner creates the
  Google Business Profile and provides the map link + contacts. Register CTA
  buttons ship **with** this section, not before.
- **POS URL remap** `/admin` → `/signup/admin`. Confirmed as the eventual
  end-state, but sequenced as a separate follow-up; it does not block the landing
  going live. `/api/admin/*` and `/signup` are unaffected either way.

### Out of scope
- Any change to POS business logic, DB schema, or the registration flow.
- A CMS/editable content system — copy lives in the i18n dictionary.
- Separate per-language URLs (`/en`, `/th`). Language is a client toggle
  (localStorage), matching the existing POS; Thai is the server-rendered, indexed
  default.

## 3. Brand & visual direction

"Warm & playful" — which is already the app's identity. Reuse existing tokens
(`tailwind.config.ts`) so the landing feels native:

- Background: **paper** `#FBF1DE` / **card** `#FFFAF0`
- Text: **ink** `#33200D`, meta `#8A6F52`
- Accents: **amber** `#E98C1D` (primary action) + **teal** `#3FD0A7` (secondary)
- Deep frame: **brown** `#5F2B00`
- Display font: **Baloo 2** (already loaded in `globals.css`)

Rounded shapes, generous type, friendly tone. Accent colors are drawn from the
logo (regal Siamese cat painting).

## 4. Architecture

### 4.1 Routing & layout
- Landing at `/` inside a new route group **`src/app/(landing)/`** with its own
  `layout.tsx` (full-bleed, no 480px cap) and `page.tsx`.
- The current `src/app/page.tsx` (redirects `/` → `/admin`) is **replaced** by the
  landing. Staff reach the dashboard by navigating to `/admin` directly (or via the
  future `/signup/admin`).
- **app-frame refactor:** the root `src/app/layout.tsx` currently wraps *all*
  children in `<div class="app-frame">` (480px column). Move that wrapper OUT of
  the root layout and into the POS subtrees so only the POS is column-constrained:
  - New `src/app/signup/layout.tsx` → wraps children in `.app-frame`.
  - New `src/app/admin/layout.tsx` → wraps children in `.app-frame` (covers both
    `/admin/login` and the nested `/admin/(app)` layout).
  - Root layout keeps only `<html><body><LanguageProvider>{children}</Provider>`.
- Net effect: landing is full-width; `/signup` and `/admin` render exactly as
  before (verify visually).

### 4.2 Slideshow mechanics (no JS library)
- A scroll container: `scroll-snap-type: y mandatory`, `height: 100svh`,
  `overflow-y: auto`, `scroll-behavior: smooth`.
- Each `<section>`: `min-height: 100svh`, `scroll-snap-align: start`.
- Section entrance animation (fade + rise) via a small `IntersectionObserver`
  client hook, applied as **progressive enhancement**: all copy/images are present
  in the DOM and fully visible without JS (SEO + no-JS safe). CSS handles the
  animated state only when JS toggles a class.
- Optional slim vertical progress dots (client component); non-essential, hidden
  from a11y tree, purely decorative.
- **Desktop (≥768px):** each slide becomes a centered two-column grid (photo +
  copy, max-width ~1100px). Same snap. Mobile stays full-bleed photo with an
  overlaid copy card.

### 4.3 Component layout
```
src/app/(landing)/
  layout.tsx           # full-width shell; sets landing <html lang> stays "th"
  page.tsx             # server component: renders <LandingHeader/> + all sections
src/components/landing/
  LandingHeader.tsx    # "use client" — logo + LangToggle, transparent over hero
  Slide.tsx            # presentational full-screen section wrapper (image + copy slot)
  ResponsiveImage.tsx  # <picture> with srcset/sizes, width/height, alt, lazy/eager
  RevealOnScroll.tsx   # "use client" — IntersectionObserver reveal wrapper
  ProgressDots.tsx     # "use client" — optional slide indicator
  sections/
    HeroSection.tsx
    PlayroomSection.tsx
    CozyAreaSection.tsx
    StudioSection.tsx
    ClaySection.tsx
    PassesSection.tsx
  Jsonld.tsx           # renders LocalBusiness JSON-LD <script>
```
Section components are server components that pull copy via `t()`. Only the
header, reveal wrapper, and dots are `"use client"`. No db-touching module is
imported anywhere in the landing tree (client-safe).

### 4.4 The 6 sections

| # | Section | Image source | h2 focus (TH / EN) | Copy angle |
|---|---------|--------------|--------------------|------------|
| 1 | Hero | `environment-shop-front` + `shop_logo` | Brand + tagline | "สนามเด็กเล่นสร้างสรรค์ในร่ม กรุงเทพฯ / Creative indoor playroom for kids in Bangkok" — one `<h1>`, warm welcome, scroll cue. No CTA yet. |
| 2 | The Playroom | `play_room` | สนามเด็กเล่นในร่มที่ปลอดภัย / Safe supervised indoor playroom | Supervised safe play; 1h ฿199 / 2h ฿300 mention. |
| 3 | Cozy Area | `Cozy_area` | มุมพักผ่อนสบายสำหรับครอบครัว / Cozy family lounge | Comfortable rest space for parents & little ones. |
| 4 | Creative Studio | `artroom` (fallback `environment-creative-room`) | ห้องศิลปะและระบายสี / Kids art & crayon studio | Crayon/painting creative activities (฿59). |
| 5 | Soft-Clay Statues | `Clay_Statues` | กิจกรรมปั้นดินเบา / Soft-clay statue making | Signature hands-on craft (฿150); keepsake to take home. |
| 6 | Passes & Family Membership | `environment-creative-room` | แพ็กเกจและบัตรสมาชิกครอบครัว / Hour passes & family membership | 30-Hour Pass ฿3,599; 60-Hour shareable Family Pass ฿5,999; value story. |

Copy is real, concise, benefit-led, bilingual — never lorem, never keyword-stuffed.
Prices reflect the seeded catalog (PRD §4). One `<h1>` total (hero); every other
section uses `<h2>`.

## 5. Image + SEO pipeline

### 5.1 Assets (source)
`assets/`: `artroom.jpg`, `Cozy_area.jpeg`, `play_room.jpg` (JPEG, 1200×1600);
`Clay_Statues.webp`, `environment-creative-room.webp`, `environment-shop-front.webp`
(WebP, 900×1200); `shop_logo.webp` (512×512). Portrait ~3:4.

### 5.2 Generation script
- `scripts/optimize-landing-images.mjs` using **sharp** (add as devDependency).
- For each source image → emit WebP at widths **480 / 768 / 1080 / 1440** into
  `public/landing/` with descriptive, keyword-rich, kebab-case filenames, e.g.:
  - `play_room` → `supervised-indoor-childrens-playroom-bangkok-{w}.webp`
  - `Cozy_area` → `cozy-family-lounge-area-{w}.webp`
  - `artroom` → `kids-art-and-crayon-creative-studio-{w}.webp`
  - `Clay_Statues` → `soft-clay-statue-making-activity-for-kids-{w}.webp`
  - `environment-creative-room` → `childrens-creative-activity-room-bangkok-{w}.webp`
  - `environment-shop-front` → `siamese-cat-creative-club-shop-front-bangkok-{w}.webp`
  - `shop_logo` → `siamese-cat-creative-club-logo-{256,512}.webp`
- WebP quality ~80, `effort` high; never upscale beyond source width (cap widths at
  source). Preserve aspect ratio; record intrinsic width/height for the `<img>`.
- Also generate:
  - **OG/social image** `public/landing/og-siamese-cat-creative-club.jpg`
    (1200×630, logo + shop front composite, JPEG for max platform support).
  - **Favicons**: `public/favicon.ico` + `public/apple-touch-icon.png` (180×180)
    from the logo. (Confirm no existing favicon is clobbered.)
- The script also writes a **typed manifest** `src/lib/landing/images.ts` mapping
  each logical image key → `{ src, widths, width, height, alt-key }`. Components
  import from this manifest, so a renamed/missing output is a **TypeScript/build
  error**, not a silent broken `<img>`. The manifest is generated, committed, and
  regenerated by the script.
- Idempotent (safe to re-run). New command **`pnpm images:landing`** in
  `package.json` + documented in CLAUDE.md/DEPLOY.md. Outputs are committed static
  files so Google crawls them directly (not proxied through `/_next/image`).

### 5.3 Serving
- `ResponsiveImage.tsx` renders a `<picture>`/`<img>` with `srcset` (the width
  variants), a sensible `sizes` (`100vw` mobile, `~50vw` desktop column), explicit
  `width`/`height` (zero CLS), `alt` in the active language (from dictionary),
  `loading="eager"` + `fetchpriority="high"` for the hero, `loading="lazy"` for the
  rest, `decoding="async"`.

### 5.4 On-page SEO
- `(landing)/layout.tsx` (or `page.tsx`) `metadata`: TH `<title>` (~55 chars) and
  `description` (~150 chars) with primary keywords; `alternates`/`canonical`;
  `openGraph` (title, description, `og:image`, locale `th_TH`, `en_US` alt);
  `twitter` summary_large_image; `robots` index/follow; `keywords`.
- `LocalBusiness` **JSON-LD** (`Jsonld.tsx`): `@type` `ChildCare`/`AmusementPark`-style
  business, name, description, image, `priceRange`, `areaServed` Bangkok, with
  `address`/`geo`/`openingHours`/`telephone` as **clearly-commented placeholders**
  to be filled when the owner provides them.
- Semantic structure: single `<h1>`, section `<h2>`s, descriptive `alt`, `lang`
  attributes correct, meaningful link text.
- `app/sitemap.ts` and `app/robots.ts` (Next metadata routes) including `/` and
  `/signup`. `themeColor` already set.
- Because Thai is server-rendered by default, the indexed content is Thai (matches
  the owner's requirement). EN is a client enhancement.

## 6. i18n

- Extend `src/lib/i18n/dictionary.ts` with a `landing.*` block: every headline,
  paragraph, alt text, and CTA label in both `th` and `en`. No hardcoded display
  strings in JSX (project rule).
- `LandingHeader` uses the existing `LangToggle`. `t()` from the existing
  LanguageProvider. Thai default; EN persists in localStorage per device (same as
  POS). Prices/format via existing helpers where relevant.

## 7. Error handling & edge cases

- **No JS:** all sections/images/copy render and are readable; only entrance
  animation and dots are lost (progressive enhancement).
- **Slow network:** hero eager + prioritized; others lazy. Explicit dimensions
  prevent layout shift.
- **Missing generated image:** components import the generated typed manifest
  (`src/lib/landing/images.ts`), so a missing/renamed output surfaces as a
  TypeScript/build error rather than a silent broken image.
- **iOS `100vh` jitter:** use `100svh`/`100dvh` with a fallback.
- **app-frame refactor regressions:** POS pages must look/behave identically —
  explicitly verified after the refactor.

## 8. Verification

No unit-test harness in this repo (per CLAUDE.md); verify by driving the running
app and inspecting output:
- `pnpm images:landing` produces all expected files at all widths; spot-check sizes
  (each ≤ ~150KB at 1080) and that they're valid WebP.
- `pnpm build` passes (typecheck + lint) — no db module pulled into client bundle.
- `pnpm dev`: `/` renders all 6 sections; scroll-snaps section by section on a
  mobile viewport; TH default, EN toggle flips every string and persists on reload;
  images load with correct `srcset`.
- `/signup` and `/admin` (login + an authed screen) render identically to before
  the app-frame refactor.
- SEO checks: view-source shows Thai content in initial HTML, one `<h1>`, `<h2>`s,
  meta description, OG tags, JSON-LD present and valid; Lighthouse SEO score high
  (target ≥ 95) and no CLS from images.
- Cross-check against `WALKTHROUGH.md` that no existing acceptance criterion broke.

## 9. Deployment notes

- Nginx already allows `client_max_body_size 12M` (fine). Static `public/landing/*`
  served directly. Add `pnpm images:landing` to the build/setup docs (run before
  `pnpm build` if regenerating). OG/favicon paths absolute from domain root.
- Domain: `Creative_Club.Siamesecat.cafe`. JSON-LD/OG `url` uses that host
  (placeholder until DNS/HTTPS live).

## 10. Deferred follow-ups (tracked, not this round)

1. **Visit Us section (#7)** — map embed + contacts + register CTA, once the owner
   supplies the Google Map link and contact channels. Fills the JSON-LD
   address/geo/hours/telephone placeholders too.
2. **POS remap** `/admin` → `/signup/admin` — move `src/app/admin/*`, update
   `src/middleware.ts` matchers + login redirect + `getAdminId` redirect target +
   any internal links; `/api/admin/*` may stay. Its own spec/plan.

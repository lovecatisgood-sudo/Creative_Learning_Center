// Full-width shell for the marketing site (no 480px app-frame). The scroll-snap
// container lives in the page so the header/dots can sit fixed over it.
export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href="/main-site/assets/styles.css" />
      <noscript>
        <style>{`.landing-v2 .reveal{opacity:1 !important;transform:none !important}`}</style>
      </noscript>
      {children}
    </>
  );
}

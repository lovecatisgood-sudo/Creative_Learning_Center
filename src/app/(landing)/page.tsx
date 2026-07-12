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

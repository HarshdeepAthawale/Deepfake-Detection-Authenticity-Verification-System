import { HeroSection } from "@/components/landing/hero-section"
import { StatsBar } from "@/components/landing/stats-bar"
import { FeaturesGrid } from "@/components/landing/features-grid"
import { HowItWorks } from "@/components/landing/how-it-works"
import { CTASection } from "@/components/landing/cta-section"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      <HeroSection />
      <StatsBar />
      <FeaturesGrid />
      <HowItWorks />
      <CTASection />
    </div>
  )
}

import { Hero } from "./landing/Hero";
import { WorkflowShowcase } from "./landing/WorkflowTimeline";
import { ComparisonSection } from "./landing/ComparisonSection";
import { ValueProps } from "./landing/ValueProps";
import { Features } from "./landing/Features";
import { SocialProof } from "./landing/SocialProof";
import { CTA } from "./landing/CTA";
import { Footer } from "./landing/Footer";
import { HeaderLinks } from "./landing/HeaderLinks";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#e7ebed]">
      <HeaderLinks />
      <Hero />
      <WorkflowShowcase />
      <ComparisonSection />
      <ValueProps />
      <Features />
      <SocialProof />
      <CTA />
      <Footer />
    </div>
  );
}

// Section order:
// 1. Hero - MVP wordplay, contract-focused hook
// 2. WorkflowShowcase - Quote → Contract → Change Order flow (core differentiator)
// 3. ComparisonSection - ERP pain points, why we're different
// 4. ValueProps - Tier 1-3 benefits (contract-aware, small teams, no lock-in)
// 5. Features - Detailed capabilities
// 6. SocialProof - Trust builders
// 7. CTA - Final call to action


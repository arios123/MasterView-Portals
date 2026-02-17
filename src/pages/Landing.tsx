import { Hero } from "./landing/Hero";
import { Features } from "./landing/Features";
import { CTA } from "./landing/CTA";
import { Footer } from "./landing/Footer";
import { HeaderLinks } from "./landing/HeaderLinks";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white animate-fade-in-up">
      <HeaderLinks />
      <Hero />
      <Features />
      <CTA />
      <Footer />
    </div>
  );
}


import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Play, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

export function Hero() {
  const navigate = useNavigate();

  const benefits = [
    "One workflow from quote to contract to change order",
    "Learn the system in under 30 minutes",
    "No ERP complexity or consultants needed"
  ];

  // Animated text state and logic
  const animatedWords = ["contracts", "change orders", "estimates"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedWord, setDisplayedWord] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Typewriter effect for rotating words
  useEffect(() => {
    const currentWord = animatedWords[currentWordIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayedWord.length < currentWord.length) {
          setDisplayedWord(currentWord.slice(0, displayedWord.length + 1));
        } else {
          // Wait before starting to delete
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (displayedWord.length > 0) {
          setDisplayedWord(displayedWord.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % animatedWords.length);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [displayedWord, isDeleting, currentWordIndex]);

  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-b from-[#e7ebed] via-white to-white overflow-hidden pt-8">
      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-grid opacity-50" />
      
      {/* Subtle gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-[#a6dbeb]/40 rounded-full blur-3xl -top-40 -right-40 animate-pulse-soft" />
        <div className="absolute w-[400px] h-[400px] bg-[#e7ebed]/60 rounded-full blur-3xl bottom-0 left-0 animate-pulse-soft animation-delay-1000" />
      </div>

      {/* Architectural lines */}
      <div className="absolute top-32 left-8 w-px h-40 bg-gradient-to-b from-transparent via-[#cfcfcf] to-transparent opacity-60 hidden lg:block" />
      <div className="absolute top-48 left-12 w-20 h-px bg-gradient-to-r from-[#cfcfcf] to-transparent opacity-60 hidden lg:block" />
      <div className="absolute bottom-32 right-8 w-px h-32 bg-gradient-to-b from-transparent via-[#cfcfcf] to-transparent opacity-60 hidden lg:block" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side - Copy */}
          <div className="max-w-xl">
            <h1 className="font-serif text-5xl sm:text-5xl lg:text-6xl font-bold text-[#0B294b] leading-[1.1] tracking-tight mb-0 opacity-0 animate-fade-in-up animation-delay-100">
              <span className="block">
                Your <span className="gradient-text-animated-landing">MVP</span> of managing
              </span>
              <span className="gradient-text-animated-landing inline-block min-w-[280px] text-left leading-[1.15] pb-[0.02em] overflow-visible">
                {displayedWord}
                <span className="animate-blink ml-0.5">|</span>
              </span>
            </h1>
            
            <div className="mt-14">
            <p className="hidden lg:block text-lg sm:text-xl text-[#617b5d] leading-relaxed mb-8 opacity-0 animate-fade-in-up animation-delay-200">
              One connected workflow from building estimates to signed contracts to adding change orders. 
              Built for contract-based businesses who want structure without the complexity.
            </p>

            {/* Benefits list */}
            <ul className="space-y-3 mb-10 opacity-0 animate-fade-in-up animation-delay-300">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3 text-[#0B294b]">
                  <CheckCircle2 className="w-5 h-5 text-[#2b8ac4] flex-shrink-0" />
                  <span className="text-base">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 opacity-0 animate-fade-in-up animation-delay-400">
              <Button
                size="lg"
                className="text-base px-8 py-6 rounded-xl bg-[#2b8ac4] hover:bg-[#46b7d7] text-white transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                onClick={() => navigate("/register")}
              >
                Start free trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="text-base px-8 py-6 rounded-xl bg-white text-[#0B294b] border-[#cfcfcf] hover:bg-[#e7ebed] hover:border-[#8b8b8b] transition-all duration-200"
                onClick={() => window.open('https://demo.masterviewportals.com', '_blank')}
              >
                <Play className="mr-2 h-4 w-4" />
                See live demo
              </Button>
            </div>

            <p className="mt-5 text-sm text-[#8b8b8b] opacity-0 animate-fade-in-up animation-delay-500">
              Free for 30 days. Export your data anytime.
            </p>
            </div>
          </div>

          {/* Right side - Visual (hidden on mobile) */}
          <div className="hidden lg:block relative lg:pl-8 opacity-0 animate-fade-in-up animation-delay-300">
            {/* Main product preview card */}
            <div className="relative">
              {/* Glass card behind */}
              <div className="absolute -inset-4 glass rounded-3xl transform rotate-2 opacity-60" />
              
              {/* Main preview */}
              <div className="relative bg-white rounded-2xl shadow-smooth-lg border border-[#cfcfcf] overflow-hidden">
                {/* Header bar */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[#e7ebed] border-b border-[#cfcfcf]">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#cfcfcf]" />
                    <div className="w-3 h-3 rounded-full bg-[#cfcfcf]" />
                    <div className="w-3 h-3 rounded-full bg-[#cfcfcf]" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 bg-white rounded-md text-xs text-[#8b8b8b] border border-[#cfcfcf]">
                      app.masterviewportals.com
                    </div>
                  </div>
                </div>

                {/* Content preview */}
                <div className="p-6 space-y-4">
                  {/* Project header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs text-[#8b8b8b] mb-1">Active Contract</div>
                      <div className="text-lg font-semibold text-[#0B294b]">Commercial Buildout</div>
                      <div className="text-sm text-[#8b8b8b]">Apex Properties LLC</div>
                    </div>
                    <div className="px-3 py-1.5 bg-[#a6dbeb]/30 text-[#0B294b] text-xs font-medium rounded-full">
                      In Progress
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-4 py-4 border-y border-[#cfcfcf]">
                    <div>
                      <div className="text-2xl font-bold text-[#0B294b]">$48,250</div>
                      <div className="text-xs text-[#8b8b8b]">Contract Value</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#0B294b]">3</div>
                      <div className="text-xs text-[#8b8b8b]">Change Orders</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-[#0B294b]">68%</div>
                      <div className="text-xs text-[#8b8b8b]">Collected</div>
                    </div>
                  </div>

                  {/* Recent items */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-[#e7ebed] rounded-lg">
                      <div className="w-8 h-8 rounded-lg bg-[#a6dbeb]/40 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-[#2b8ac4]" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#0B294b]">Change Order #3 Approved</div>
                        <div className="text-xs text-[#8b8b8b]">Scope addition • +$2,400 • Contract updated</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-[#e7ebed] rounded-lg">
                      <div className="w-8 h-8 rounded-lg bg-[#96ab94]/30 flex items-center justify-center">
                        <span className="text-xs font-medium text-[#617b5d]">$</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#0B294b]">Payment Received</div>
                        <div className="text-xs text-[#8b8b8b]">Milestone 2 • $12,000</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -left-6 top-1/4 glass-subtle rounded-xl p-4 shadow-smooth hidden lg:block animate-float">
                <div className="text-xs text-[#8b8b8b] mb-1">Original Scope</div>
                <div className="text-lg font-semibold text-[#0B294b]">$45,850</div>
              </div>

              <div className="absolute -right-4 bottom-1/4 glass-subtle rounded-xl p-4 shadow-smooth hidden lg:block animate-float animation-delay-500">
                <div className="text-xs text-[#8b8b8b] mb-1">Change Orders</div>
                <div className="text-lg font-semibold text-[#96ab94]">+$2,400</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


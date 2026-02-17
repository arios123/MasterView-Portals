import { ArrowRight, CheckCircle2, Users, FileText, Zap, LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Step data structure for the AnimatedSteps component
 */
interface Step {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
  metrics: Array<{ value: string; label: string }>;
}

// Progress line component
function ProgressLine({
  isActive,
  isComplete,
}: {
  isActive: boolean;
  isComplete: boolean;
}) {
  return (
    <div className="relative w-full h-1 bg-[#cfcfcf] rounded-full overflow-hidden">
      <div
        className={`absolute inset-y-0 left-0 bg-gradient-to-r from-[#2b8ac4] to-[#46b7d7] rounded-full transition-all duration-1000 ease-out ${
          isComplete ? "w-full" : isActive ? "w-1/2 animate-pulse" : "w-0"
        }`}
      />
    </div>
  );
}

// Step card component
function StepCard({
  step,
  index,
  totalSteps,
  isActive,
  isComplete,
  onClick,
}: {
  step: Step;
  index: number;
  totalSteps: number;
  isActive: boolean;
  isComplete: boolean;
  onClick: () => void;
}) {
  const Icon = step.icon;
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), index * 200);
        }
      },
      { threshold: 0.3 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [index]);

  return (
    <div
      ref={cardRef}
      className={`relative cursor-pointer transition-all duration-500 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      onClick={onClick}
    >
      {/* Connection line for desktop */}
      {index < totalSteps - 1 && (
        <div className="hidden lg:block absolute top-12 left-full w-full h-px z-0">
          <div className="relative w-full h-full px-4">
            <div className="w-full h-full bg-[#cfcfcf] rounded-full">
              <div
                className={`h-full bg-gradient-to-r from-[#2b8ac4] to-[#46b7d7] rounded-full transition-all duration-700 ease-out`}
                style={{ width: isComplete ? "100%" : "0%" }}
              />
            </div>
            {/* Animated dot */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gradient-to-r from-[#2b8ac4] to-[#46b7d7] shadow-lg transition-all duration-700 ease-out ${
                isComplete ? "opacity-100" : "opacity-0"
              }`}
              style={{ left: isComplete ? "calc(100% - 6px)" : "0" }}
            />
          </div>
        </div>
      )}

      <div
        className={`relative p-6 lg:p-8 rounded-2xl border-2 transition-all duration-300 ${
          isActive
            ? `border-transparent bg-gradient-to-br from-[#a6dbeb]/30 to-[#e7ebed] shadow-lg scale-105`
            : isComplete
            ? "border-[#cfcfcf] bg-white shadow-sm"
            : "border-[#cfcfcf] bg-white/50 hover:bg-white hover:border-[#8b8b8b] hover:shadow-sm"
        }`}
      >
        {/* Step number */}
        <div className="flex items-center justify-between mb-6">
          <div
            className={`flex items-center gap-3 transition-colors duration-300 ${
              isActive || isComplete ? "text-[#0B294b]" : "text-[#8b8b8b]"
            }`}
          >
            <span className="text-sm font-mono tracking-wider">{step.number}</span>
            <div className="w-8 h-px bg-current opacity-30" />
          </div>

          {/* Status indicator */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
              isComplete
                ? "bg-gradient-to-br from-[#96ab94] to-[#617b5d] text-white"
                : isActive
                ? `bg-gradient-to-br from-[#2b8ac4] to-[#46b7d7] text-white`
                : "bg-[#e7ebed] text-[#8b8b8b]"
            }`}
          >
            {isComplete ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <span className="text-xs font-bold">{index + 1}</span>
            )}
          </div>
        </div>

        {/* Icon */}
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${
            isActive
              ? `bg-gradient-to-br from-[#2b8ac4] to-[#46b7d7] text-white shadow-lg`
              : "bg-[#e7ebed] text-[#8b8b8b]"
          }`}
        >
          <Icon className="w-8 h-8" />
        </div>

        {/* Content */}
        <h3
          className={`font-serif text-xl font-semibold mb-3 transition-colors duration-300 ${
            isActive ? "text-[#0B294b]" : "text-[#0B294b]"
          }`}
        >
          {step.title}
        </h3>

        <p className="text-[#617b5d] leading-relaxed mb-6">{step.description}</p>

        {/* Metrics */}
        <div
          className={`grid grid-cols-2 gap-4 pt-4 border-t transition-all duration-300 ${
            isActive ? "border-[#cfcfcf]" : "border-[#cfcfcf]"
          }`}
        >
          {step.metrics.map((metric, i) => (
            <div key={i}>
              <div
                className={`text-lg font-bold transition-colors duration-300 ${
                  isActive ? "text-[#0B294b]" : "text-[#0B294b]"
                }`}
              >
                {metric.value}
              </div>
              <div className="text-xs text-[#8b8b8b]">{metric.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const steps: Step[] = [
  {
    number: "01",
    title: "Set up your workspace",
    description: "Create your workspace and invite your team. Set up roles and permissions that match how you actually work — usually done in under an hour.",
    icon: Users,
    metrics: [
      { value: "< 1hr", label: "Setup time" },
      { value: "No consultants", label: "Required" }
    ]
  },
  {
    number: "02",
    title: "Create your first quote",
    description: "Add a client, build your quote with line items and materials, and turn it into a branded proposal. When approved, generate the contract with one click.",
    icon: FileText,
    metrics: [
      { value: "5 min", label: "First quote" },
      { value: "One click", label: "To contract" }
    ]
  },
  {
    number: "03",
    title: "Manage scope and get paid",
    description: "When scope changes (and it will), create change orders that update your contract automatically. Track payments against milestones. Everything stays connected.",
    icon: Zap,
    metrics: [
      { value: "Automatic", label: "Contract updates" },
      { value: "Full history", label: "Of changes" }
    ]
  }
];

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto-advance steps
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <section
      ref={sectionRef}
      className="py-24 lg:py-32 relative overflow-hidden bg-white"
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 w-px h-20 bg-gradient-to-b from-[#cfcfcf] to-transparent" />

        {/* Animated circles */}
        <div className="absolute top-40 right-20 w-64 h-64 bg-[#a6dbeb]/30 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-20 left-20 w-48 h-48 bg-[#96ab94]/20 rounded-full blur-3xl animate-pulse-soft animation-delay-1000" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-16 lg:mb-20">
          <h2
            className={`font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0B294b] leading-tight mb-6 transition-all duration-700 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            From signup to managing contracts
            <span className="block text-[#8b8b8b] mt-2">in three steps</span>
          </h2>

          <p
            className={`text-lg text-[#617b5d] leading-relaxed transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            No consultants. No month-long implementations. 
            Most teams are sending quotes and generating contracts within their first week.
          </p>
        </div>

        {/* Progress bar for mobile */}
        <div className="lg:hidden mb-8">
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div key={index} className="flex-1">
                <ProgressLine
                  isActive={index === activeStep}
                  isComplete={index < activeStep}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Steps grid */}
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-0">
            {steps.map((step, index) => (
              <StepCard
                key={index}
                step={step}
                index={index}
                totalSteps={steps.length}
                isActive={index === activeStep}
                isComplete={index < activeStep}
                onClick={() => setActiveStep(index)}
              />
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div
          className={`mt-16 lg:mt-20 text-center transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "800ms" }}
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 bg-[#e7ebed] rounded-2xl">
            <p className="text-[#617b5d]">
              Ready to see it in action?
            </p>
            <a 
              href="https://demo.masterviewportals.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#2b8ac4] text-white rounded-xl font-medium hover:bg-[#46b7d7] transition-colors"
            >
              Try the live demo
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

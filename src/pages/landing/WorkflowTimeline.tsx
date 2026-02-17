import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect, useLayoutEffect } from "react";
import { 
  MessageSquare,
  FileText,
  FileCheck,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  LucideIcon
} from "lucide-react";

export interface WorkflowStep {
  icon: LucideIcon;
  title: string;
  description: string;
  details: string;
  color: string;
}

const defaultWorkflowSteps: WorkflowStep[] = [
  {
    icon: MessageSquare,
    title: "Client & Project Setup",
    description: "Capture the details",
    details: "Add client information, define project scope, and set up your workspace. Everything starts organized.",
    color: "bg-[#2b8ac4]"
  },
  {
    icon: FileText,
    title: "Quote & Proposal",
    description: "Build and send",
    details: "Create detailed quotes with line items, labor, and materials. Show your company's catalog to your clients.",
    color: "bg-[#46b7d7]"
  },
  {
    icon: FileCheck,
    title: "Contract Generation",
    description: "One click to contract",
    details: "Turn approved quotes into branded contracts instantly. Client info, line items, totals, and payment schedules merge automatically.",
    color: "bg-[#2b8ac4]"
  },
  {
    icon: RefreshCw,
    title: "Change Orders",
    description: "Change in plans, handled",
    details: "When scope changes (and it will), create change orders that update the contract automatically. Totals recalculate.",
    color: "bg-[#96ab94]"
  }
];

interface WorkflowTimelineProps {
  /** Scroll-driven progress 0–1; line fills blue from top by this amount */
  progress: number;
  className?: string;
}

function WorkflowTimeline({ progress, className = "" }: WorkflowTimelineProps) {
  const heightPercent = Math.min(100, Math.max(0, progress * 100));
  return (
    <div className={`absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 ${className}`.trim()}>
      {/* Background line (gray) */}
      <div className="absolute inset-0 bg-[#cfcfcf]" />
      {/* Progress line (blue) – height driven by scroll */}
      <motion.div
        className="absolute top-0 left-0 w-full bg-gradient-to-b from-[#2b8ac4] to-[#46b7d7]"
        initial={false}
        animate={{ height: `${heightPercent}%` }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      />
    </div>
  );
}

/** Mobile only: y positions for horizontal segments (spacer centers), in same units as viewBox height */
interface MobileZigzagLineProps extends WorkflowTimelineProps {
  /** [centerY1, centerY2, centerY3] and totalHeight for measured path; if missing uses default 25,50,75 in 0–100 */
  pathY?: [number, number, number] | null;
  pathHeight?: number;
}

/** Horizontal segment length in viewBox x units (96 - 4) */
const MOBILE_ZIGZAG_H = 92;

/** Mobile only: vertical progress → path distance d. No snap until you reach the horizontal; then the entire horizontal distance is drawn at once. */
function progressToPathDistance(p: number, y1: number, y2: number, y3: number, viewH: number): number {
  const v = Math.min(viewH, Math.max(0, p * viewH));
  if (v < y1) return v; // first vertical only
  if (v < y2) return MOBILE_ZIGZAG_H + v; // past first horizontal → full cross, then second vertical
  if (v < y3) return 2 * MOBILE_ZIGZAG_H + v; // past second horizontal → full cross, then third vertical
  return 3 * MOBILE_ZIGZAG_H + v; // past third horizontal → full cross, then final vertical
}

/** Mobile only: one continuous zigzag line in the margin zones (right → left → right → left) */
function MobileZigzagLine({ progress, pathY, pathHeight }: MobileZigzagLineProps) {
  const p = Math.min(1, Math.max(0, progress));
  const useMeasured = pathY != null && pathHeight != null && pathHeight > 0;
  const y1 = useMeasured ? pathY[0] : 25;
  const y2 = useMeasured ? pathY[1] : 50;
  const y3 = useMeasured ? pathY[2] : 75;
  const viewH = useMeasured ? pathHeight : 100;
  const pathD = `M 96 0 L 96 ${y1} L 4 ${y1} L 4 ${y2} L 96 ${y2} L 96 ${y3} L 4 ${y3} L 4 ${viewH}`;
  const totalPath = viewH + 3 * MOBILE_ZIGZAG_H;
  const d = useMeasured
    ? Math.min(totalPath, Math.max(0, progressToPathDistance(p, y1, y2, y3, viewH)))
    : p * totalPath;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox={`0 0 100 ${viewH}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="mobileZigzagBlue" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2b8ac4" />
          <stop offset="100%" stopColor="#46b7d7" />
        </linearGradient>
      </defs>
      <path
        d={pathD}
        fill="none"
        stroke="#cfcfcf"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={pathD}
        fill="none"
        stroke="url(#mobileZigzagBlue)"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={totalPath}
        strokeDasharray={`${d} ${totalPath - d}`}
      />
    </svg>
  );
}

/** Mobile only: full-width step card with icon in top-right */
function MobileStepCard({
  step,
  index,
  isActive,
  isCompleted,
  onClick,
}: {
  step: WorkflowStep;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  onClick: () => void;
}) {
  const Icon = step.icon;

  return (
    <motion.div
      onClick={onClick}
      className={`
        relative w-full cursor-pointer rounded-2xl border-2 p-5 pr-14 transition-all duration-300
        ${isActive
          ? "bg-white border-[#2b8ac4] shadow-lg"
          : isCompleted
            ? "bg-white/80 border-[#96ab94]/40"
            : "bg-white/50 border-[#cfcfcf]"
        }
      `}
    >
      {/* Icon in top-right of card */}
      <div className="absolute top-4 right-4">
        <motion.div
          animate={{ scale: isActive ? 1.1 : 1 }}
          className={`
            w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
            ${isActive ? step.color + " text-white" : isCompleted ? "bg-[#96ab94] text-white" : "bg-[#cfcfcf] text-[#8b8b8b]"}
          `}
        >
          {isCompleted && !isActive ? (
            <CheckCircle2 className="w-6 h-6" />
          ) : (
            <Icon className="w-6 h-6" />
          )}
        </motion.div>
      </div>

      <div className="text-xs font-semibold text-[#8b8b8b] mb-1">STEP {index + 1}</div>
      <h3 className="text-lg font-semibold text-[#0B294b] mb-1">{step.title}</h3>
      <p className="text-sm text-[#617b5d] mb-3">{step.description}</p>

      <motion.div
        initial={false}
        animate={{ height: isActive ? "auto" : 0, opacity: isActive ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <p className="text-sm text-[#617b5d] pt-3 border-t border-[#cfcfcf]">
          {step.details}
        </p>
      </motion.div>
    </motion.div>
  );
}

interface WorkflowStepCardProps {
  step: WorkflowStep;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  alignment: "left" | "right";
}

function WorkflowStepCard({ 
  step, 
  index, 
  isActive, 
  isCompleted,
  alignment 
}: WorkflowStepCardProps) {
  const Icon = step.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: alignment === "left" ? -30 : 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={`relative flex items-center gap-8 ${alignment === "right" ? "flex-row-reverse text-right" : ""}`}
    >
      {/* Content Card */}
      <div className={`flex-1 ${alignment === "right" ? "pr-8" : "pl-8"}`}>
        <motion.div
          whileHover={{ y: -4 }}
          className={`
            relative p-6 rounded-2xl border transition-all duration-300
            ${isActive 
              ? "bg-white border-[#a6dbeb] shadow-lg" 
              : isCompleted
                ? "bg-white/80 border-[#96ab94]/30"
                : "bg-white/50 border-[#cfcfcf]"
            }
          `}
        >
          {/* Completed checkmark */}
          {isCompleted && !isActive && (
            <div className="absolute -top-2 -right-2">
              <div className="w-6 h-6 rounded-full bg-[#96ab94] flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
          
          {/* Step number */}
          <div className="text-xs font-semibold text-[#8b8b8b] mb-2">
            STEP {index + 1}
          </div>
          
          <h3 className={`text-xl font-semibold mb-1 ${isActive ? "text-[#0B294b]" : "text-[#0B294b]"}`}>
            {step.title}
          </h3>
          <p className="text-sm text-[#617b5d] mb-3">{step.description}</p>
          
          {/* Expanded details */}
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: isActive ? "auto" : 0, 
              opacity: isActive ? 1 : 0 
            }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-[#617b5d] pt-3 border-t border-[#cfcfcf]">
              {step.details}
            </p>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Center Node */}
      <div className="relative z-10">
        <motion.div
          animate={{
            scale: isActive ? 1.2 : 1,
            boxShadow: isActive ? "0 0 20px rgba(43, 138, 196, 0.4)" : "0 0 0px rgba(43, 138, 196, 0)"
          }}
          className={`
            w-14 h-14 rounded-full flex items-center justify-center transition-colors duration-300
            ${isActive 
              ? step.color + " text-white" 
              : isCompleted 
                ? "bg-[#96ab94] text-white"
                : "bg-[#cfcfcf] text-[#8b8b8b]"
            }
          `}
        >
          <Icon className="w-6 h-6" />
        </motion.div>
      </div>
      
      {/* Spacer for opposite side */}
      <div className="flex-1" />
    </motion.div>
  );
}

interface HighlightItem {
  label: string;
  description: string;
}

interface WorkflowShowcaseProps {
  // Header customization
  badgeText?: string;
  title?: string;
  titleHighlight?: string;
  description?: string;
  
  // Workflow steps
  steps?: WorkflowStep[];
  
  // Auto-progress settings
  autoProgress?: boolean;
  autoProgressInterval?: number; // in milliseconds
  
  // Bottom highlights
  highlights?: HighlightItem[];
  
  // Styling
  backgroundColor?: string;
  showDecorativeLines?: boolean;
  showProgressDots?: boolean;
}

export function WorkflowShowcase({
  badgeText = "One Connected Workflow",
  title = "From estimate to signed contract",
  titleHighlight = "to approved changes",
  description = "Most tools stop at 'quote sent.' We connect the entire flow — so your contracts stay accurate as scope evolves.",
  steps = defaultWorkflowSteps,
  autoProgress = true,
  autoProgressInterval = 3000,
  highlights = [
    { label: "Contracts Update Automatically", description: "Change orders flow into your contract" },
    { label: "Totals Recalculate Instantly", description: "No manual math or spreadsheets" },
    { label: "Full Audit Trail", description: "See what changed, when, and who did it" }
  ],
  backgroundColor = "bg-[#e7ebed]",
  showDecorativeLines = true,
  showProgressDots = true,
}: WorkflowShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mobileColumnRef = useRef<HTMLDivElement>(null);
  const mobileSvgContainerRef = useRef<HTMLDivElement>(null);
  const mobileCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const spacerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ignoreScrollUpdatesUntilRef = useRef(0);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [mobilePathY, setMobilePathY] = useState<[number, number, number] | null>(null);
  const [mobilePathHeight, setMobilePathHeight] = useState<number>(0);

  // Scroll-driven timeline: blue line progress follows viewport center (unless we just clicked a step)
  useEffect(() => {
    const updateProgress = () => {
      if (Date.now() < ignoreScrollUpdatesUntilRef.current) return;
      const viewportCenter = window.scrollY + window.innerHeight / 2;
      const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;

      if (isMobile) {
        // Mobile: progress = vertical scroll through the zigzag section only (path area), not dots/highlights
        const sectionEl = mobileSvgContainerRef.current ?? mobileColumnRef.current;
        if (!sectionEl) return;
        const rect = sectionEl.getBoundingClientRect();
        const sectionTop = rect.top + window.scrollY;
        const sectionHeight = rect.height;
        const progress = (viewportCenter - sectionTop) / (sectionHeight || 1);
        const clamped = Math.min(1, Math.max(0, progress));
        setScrollProgress(clamped);
        const stepIndex = Math.min(
          steps.length - 1,
          Math.floor(clamped * steps.length)
        );
        setActiveStep(stepIndex);
      } else {
        const el = timelineRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const timelineTop = rect.top + window.scrollY;
        const timelineHeight = el.offsetHeight;
        const progress = (viewportCenter - timelineTop) / (timelineHeight || 1);
        const clamped = Math.min(1, Math.max(0, progress));
        setScrollProgress(clamped);
        const stepIndex = Math.min(
          steps.length - 1,
          Math.floor(clamped * steps.length)
        );
        setActiveStep(stepIndex);
      }
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [steps.length]);

  const handleStepClick = (index: number) => {
    setActiveStep(index);
    setScrollProgress((index + 1) / steps.length);
    ignoreScrollUpdatesUntilRef.current = Date.now() + 1800;
    const el = stepRefs.current[index];
    if (el) {
      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const viewportCenter = window.innerHeight / 2;
        const elementCenter = rect.top + rect.height / 2;
        const scrollDelta = elementCenter - viewportCenter;
        window.scrollTo({
          top: window.scrollY + scrollDelta,
          behavior: "smooth",
        });
      });
    }
  };

  // Mobile: center horizontal segments in visual gaps; measure relative to SVG container so path matches exactly
  const updateMobilePath = () => {
    const svgContainer = mobileSvgContainerRef.current;
    if (!svgContainer) return;
    const spacers = spacerRefs.current;
    if (spacers.length < 3 || !spacers[0] || !spacers[1] || !spacers[2]) return;
    const containerRect = svgContainer.getBoundingClientRect();
    const toY = (clientY: number) => clientY - containerRect.top;
    const getCenterY = (el: HTMLDivElement) => {
      const r = el.getBoundingClientRect();
      return toY(r.top + r.height / 2);
    };
    let y1 = getCenterY(spacers[0]);
    let y2 = getCenterY(spacers[1]);
    let y3 = getCenterY(spacers[2]);
    const cards = mobileCardRefs.current;
    if (cards[0] && cards[1] && cards[2] && cards[3]) {
      const r0 = cards[0].getBoundingClientRect();
      const r1 = cards[1].getBoundingClientRect();
      const r2 = cards[2].getBoundingClientRect();
      const r3 = cards[3].getBoundingClientRect();
      const gap1 = toY((r0.bottom + r1.top) / 2);
      const gap3 = toY((r2.bottom + r3.top) / 2);
      y1 = gap1 < y2 ? Math.max(0, gap1) : Math.max(0, y2 - 0.01);
      y3 = gap3 > y2 ? Math.min(containerRect.height, gap3) : y2 + 0.01;
    }
    setMobilePathHeight(containerRect.height);
    setMobilePathY([y1, y2, y3]);
  };

  useLayoutEffect(() => {
    updateMobilePath();
    const el = mobileSvgContainerRef.current ?? mobileColumnRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => updateMobilePath());
    ro.observe(el);
    return () => ro.disconnect();
  }, [activeStep]);

  // During step expand (300ms), update path every frame so the line moves with the box (fixes step 1 snap on mobile)
  useEffect(() => {
    let cancelled = false;
    const start = performance.now();
    const durationMs = 400;
    const tick = () => {
      if (cancelled) return;
      updateMobilePath();
      if (performance.now() - start < durationMs) {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
    return () => {
      cancelled = true;
    };
  }, [activeStep]);


  return (
    <section ref={containerRef} className={`relative py-24 md:py-32 ${backgroundColor} overflow-hidden`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 arch-pattern opacity-50" />
      
      {/* Decorative Lines */}
      {showDecorativeLines && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <motion.line
            x1="10%"
            y1="20%"
            x2="30%"
            y2="20%"
            stroke="#2b8ac4"
            strokeWidth="1"
            strokeOpacity="0.1"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2, delay: 0.5 }}
          />
          <motion.line
            x1="70%"
            y1="80%"
            x2="90%"
            y2="80%"
            stroke="#2b8ac4"
            strokeWidth="1"
            strokeOpacity="0.1"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2, delay: 0.8 }}
          />
        </svg>
      )}
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#cfcfcf] shadow-sm mb-6"
          >
            <ArrowRight className="w-4 h-4 text-[#2b8ac4]" />
            <span className="text-sm font-medium text-[#0B294b]">
              {badgeText}
            </span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#0B294b] mb-6 leading-tight"
          >
            {title}{" "}
            <span className="text-gradient-warm">{titleHighlight}</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg text-[#617b5d] max-w-2xl mx-auto"
          >
            {description}
          </motion.p>
        </div>
        
        {/* Workflow Timeline */}
        <div ref={timelineRef} className="relative max-w-4xl mx-auto">
          {/* Mobile: zigzag line + step cards; spacers keep gaps so line stays between boxes when one expands */}
          <div className="lg:hidden relative py-4">
            <div ref={mobileSvgContainerRef} className="absolute inset-0 z-0">
              <MobileZigzagLine
                progress={scrollProgress}
                pathY={mobilePathY}
                pathHeight={mobilePathHeight}
              />
            </div>
            <div ref={mobileColumnRef} className="relative z-10 flex flex-col gap-0">
              {steps.flatMap((step, index) => {
                const card = (
                  <div
                    key={step.title}
                    ref={(el) => {
                      stepRefs.current[index] = el;
                      mobileCardRefs.current[index] = el;
                    }}
                    className={`shrink-0 ${index % 2 === 0 ? "mr-12" : "ml-12"}`}
                  >
                    <MobileStepCard
                      step={step}
                      index={index}
                      isActive={activeStep === index}
                      isCompleted={index < activeStep}
                      onClick={() => handleStepClick(index)}
                    />
                  </div>
                );
                const spacer =
                  index < steps.length - 1 ? (
                    <div
                      key={`spacer-${index}`}
                      ref={(el) => { spacerRefs.current[index] = el; }}
                      className="shrink-0 min-h-8"
                      aria-hidden
                    />
                  ) : null;
                return spacer ? [card, spacer] : [card];
              })}
            </div>
          </div>

          {/* Desktop: vertical line + alternating left/right step cards */}
          <div className="hidden lg:block relative">
            <WorkflowTimeline progress={scrollProgress} />
            <div className="space-y-8 py-8">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  ref={(el) => { stepRefs.current[index] = el; }}
                  onClick={() => handleStepClick(index)}
                  className="cursor-pointer"
                >
                  <WorkflowStepCard
                    step={step}
                    index={index}
                    isActive={activeStep === index}
                    isCompleted={index < activeStep}
                    alignment={index % 2 === 0 ? "left" : "right"}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Progress Dots */}
        {showProgressDots && (
          <div className="flex justify-center gap-2 mt-12">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => handleStepClick(index)}
                className={`
                  w-2 h-2 rounded-full transition-all duration-300
                  ${activeStep === index 
                    ? "w-8 bg-[#2b8ac4]" 
                    : index < activeStep
                      ? "bg-[#96ab94]"
                      : "bg-[#cfcfcf] hover:bg-[#a6dbeb]"
                  }
                `}
              />
            ))}
          </div>
        )}
        
        {/* Bottom Highlight */}
        {highlights && highlights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mt-20 grid md:grid-cols-3 gap-6"
          >
            {highlights.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center p-6 bg-white rounded-2xl border border-[#cfcfcf] shadow-sm"
              >
                <div className="w-10 h-10 rounded-full bg-[#a6dbeb]/40 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2b8ac4]" />
                </div>
                <h4 className="font-semibold text-[#0B294b] mb-1">{item.label}</h4>
                <p className="text-sm text-[#8b8b8b]">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

export { defaultWorkflowSteps };

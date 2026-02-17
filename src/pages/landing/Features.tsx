import { Calendar, Package, Users, ArrowRight, Layers } from "lucide-react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { allFeatures, type Feature } from "./featuresData";

const LANDING_FEATURES_COUNT = 6;
const landingFeatures = allFeatures.slice(0, LANDING_FEATURES_COUNT);

// Landing-only card: desktop vertical layout (icon, title, description, Learn more)
function FeatureCard({ feature, index, isActive, onClick }: { 
  feature: Feature; 
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = feature.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onClick={onClick}
      className={`
        relative cursor-pointer group
        p-6 rounded-2xl border transition-all duration-300
        ${isActive 
          ? 'bg-white border-[#2b8ac4] shadow-lg shadow-[#2b8ac4]/10' 
          : 'bg-white/50 border-[#cfcfcf] hover:bg-white hover:border-[#a6dbeb] hover:shadow-md'
        }
      `}
    >
      {/* Active Indicator */}
      {isActive && (
        <motion.div
          layoutId="activeFeature"
          className="absolute inset-0 rounded-2xl border-2 border-[#2b8ac4]"
          transition={{ duration: 0.3 }}
        />
      )}
      
      <div className="relative">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl ${isActive ? 'bg-[#a6dbeb]/40' : 'bg-[#e7ebed]'} flex items-center justify-center mb-4 transition-colors`}>
          <Icon className={`w-6 h-6 ${isActive ? 'text-[#2b8ac4]' : 'text-[#0B294b]'} transition-colors`} />
        </div>
        
        {/* Content */}
        <h3 className={`text-lg font-semibold mb-2 transition-colors ${isActive ? 'text-[#2b8ac4]' : 'text-[#0B294b] group-hover:text-[#2b8ac4]'}`}>
          {feature.title}
        </h3>
        <p className="text-sm text-[#617b5d]">{feature.description}</p>
        
        {/* Expand Arrow */}
        <div className={`mt-4 flex items-center gap-1 text-sm font-medium transition-colors ${isActive ? 'text-[#2b8ac4]' : 'text-[#8b8b8b] group-hover:text-[#2b8ac4]'}`}>
          Learn more
          <ArrowRight className={`w-4 h-4 transition-transform ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'}`} />
        </div>
      </div>
    </motion.div>
  );
}

// Landing-only detail panel
function FeatureDetails({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  
  return (
    <motion.div
      key={feature.title}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="sticky top-32"
    >
      <div className="bg-white rounded-3xl border border-[#cfcfcf] shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#a6dbeb]/30 p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-white/80 backdrop-blur flex items-center justify-center shadow-sm">
              <Icon className="w-8 h-8 text-[#2b8ac4]" />
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-[#0B294b]">{feature.title}</h3>
              <p className="text-[#617b5d]">{feature.description}</p>
            </div>
          </div>
        </div>
        
        {/* Details */}
        <div className="p-8">
          <h4 className="text-sm font-semibold text-[#8b8b8b] uppercase tracking-wider mb-4">
            What's included
          </h4>
          <ul className="space-y-4">
            {feature.details.map((detail, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="mt-1 w-5 h-5 rounded-full bg-[#a6dbeb]/40 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-[#2b8ac4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-[#0B294b]">{detail}</span>
              </motion.li>
            ))}
          </ul>
          
          {/* Preview Area */}
          <div className="mt-8 p-6 bg-[#e7ebed] rounded-2xl border border-[#cfcfcf]">
            <div className="aspect-video bg-gradient-to-br from-[#e7ebed] to-[#a6dbeb]/30 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <Layers className="w-12 h-12 text-[#2b8ac4] mx-auto mb-2 opacity-50" />
                <span className="text-sm text-[#8b8b8b]">Feature Preview</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const additionalFeatures = [
  { icon: Calendar, title: "Project Calendar", description: "Scheduling and timelines" },
  { icon: Users, title: "Client Management", description: "Profiles and history" },
  { icon: Package, title: "Materials Library", description: "Pricing and inventory" }
];

export function Features() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [activeFeature, setActiveFeature] = useState(0);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  const title = "Everything you need to manage contracts and changes.";
  const subtitle = "contracts and changes.";
  const titleParts = title.split(subtitle);

  return (
    <section ref={containerRef} className="relative py-24 lg:py-32 bg-[#e7ebed] overflow-hidden">
      {/* Background Elements */}
      <motion.div 
        style={{ y: backgroundY }}
        className="absolute inset-0 blueprint-grid-landing"
      />
      
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#a6dbeb]/30 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#e7ebed] rounded-full blur-3xl opacity-60" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 lg:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#a6dbeb]/40 border border-[#a6dbeb] mb-6"
          >
            <Layers className="w-4 h-4 text-[#2b8ac4]" />
            <span className="text-sm font-medium text-[#0B294b]">
              Everything You Need
            </span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0B294b] leading-tight mb-6"
          >
            {titleParts[0]}
            <span className="text-gradient-features">{subtitle}</span>
            {titleParts[1] || ""}
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg text-[#617b5d] leading-relaxed max-w-2xl mx-auto"
          >
            Core features designed for contract-based work — 
            from first estimate to final payment.
          </motion.p>
        </div>
        
        {/* Features Grid + Detail View */}
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Mobile only: 3x2 grid of small tiles (icon + title); tap to show details below — first 6 only */}
          <div className="lg:hidden grid grid-cols-3 gap-3">
            {landingFeatures.map((feature, index) => {
              const Icon = feature.icon;
              const isActive = activeFeature === index;
              return (
                <button
                  key={feature.title}
                  type="button"
                  onClick={() => setActiveFeature(index)}
                  className={`
                    flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all min-h-[88px]
                    ${isActive
                      ? "bg-white border-[#2b8ac4] shadow-md shadow-[#2b8ac4]/10"
                      : "bg-white/80 border-[#cfcfcf] hover:border-[#a6dbeb] hover:bg-white"
                    }
                  `}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? "bg-[#a6dbeb]/40" : "bg-[#e7ebed]"}`}>
                    <Icon className={`w-5 h-5 ${isActive ? "text-[#2b8ac4]" : "text-[#0B294b]"}`} />
                  </div>
                  <span className={`text-xs font-semibold text-center leading-tight line-clamp-2 ${isActive ? "text-[#2b8ac4]" : "text-[#0B294b]"}`}>
                    {feature.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Desktop: Features Grid (big cards) — first 6 only */}
          <div className="hidden lg:grid lg:col-span-3 grid-cols-2 gap-4">
            {landingFeatures.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                feature={feature}
                index={index}
                isActive={activeFeature === index}
                onClick={() => setActiveFeature(index)}
              />
            ))}
          </div>
          
          {/* Detail Panel (desktop) */}
          <div className="lg:col-span-2 hidden lg:block">
            <FeatureDetails feature={landingFeatures[activeFeature]} />
          </div>
        </div>
        
        {/* Mobile Detail View (shows when a tile is selected) */}
        <div className="lg:hidden mt-6">
          <FeatureDetails feature={landingFeatures[activeFeature]} />
        </div>

        {/* Additional features row */}
        <div className="max-w-4xl mx-auto mt-16">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 lg:gap-8">
            <span className="text-sm text-[#8b8b8b]">Also included:</span>
            <div className="flex flex-wrap justify-center gap-4">
              {additionalFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div 
                    key={index}
                    className="flex items-center gap-3 px-5 py-3 bg-white rounded-xl border border-[#cfcfcf] shadow-sm"
                  >
                    <Icon className="w-5 h-5 text-[#8b8b8b]" />
                    <div>
                      <div className="text-sm font-medium text-[#0B294b]">{feature.title}</div>
                      <div className="text-xs text-[#8b8b8b]">{feature.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* View all link */}
        <div className="text-center mt-12">
          <a 
            href="/product/galaxy-of-features" 
            className="inline-flex items-center gap-2 text-sm font-medium text-[#2b8ac4] hover:text-[#46b7d7] transition-colors"
          >
            View all features
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}


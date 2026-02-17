import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Layers } from "lucide-react";
import { useState } from "react";
import type { Feature } from "./featuresData";

/** Compact card for product page side columns (many items). */
function ProductFeatureCard({
  feature,
  index,
  isActive,
  onClick,
}: {
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
      transition={{ duration: 0.5, delay: index * 0.05 }}
      onClick={onClick}
      className={`
        relative cursor-pointer group
        p-4 rounded-2xl border transition-all duration-300
        ${isActive
          ? "bg-white border-[#2b8ac4] shadow-lg shadow-[#2b8ac4]/10"
          : "bg-white/50 border-[#cfcfcf] hover:bg-white hover:border-[#a6dbeb] hover:shadow-md"
        }
      `}
    >
      {isActive && (
        <motion.div
          layoutId="activeProductFeature"
          className="absolute inset-0 rounded-2xl border-2 border-[#2b8ac4]"
          transition={{ duration: 0.3 }}
        />
      )}
      <div className="relative flex items-start gap-3">
        <div
          className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-colors ${isActive ? "bg-[#a6dbeb]/40" : "bg-[#e7ebed]"}`}
        >
          <Icon
            className={`w-5 h-5 ${isActive ? "text-[#2b8ac4]" : "text-[#0B294b]"} transition-colors`}
          />
        </div>
        <div className="flex flex-col min-w-0">
          <h3
            className={`
              text-sm font-semibold transition-colors
              ${isActive ? "text-[#2b8ac4]" : "text-[#0B294b] group-hover:text-[#2b8ac4]"}
            `}
          >
            {feature.title}
          </h3>
          <p className="mt-0.5 text-xs text-[#617b5d] leading-snug line-clamp-2">
            {feature.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/** Detail panel for product page (full "What's included" + preview area). */
function ProductFeatureDetails({ feature }: { feature: Feature }) {
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
        <div className="p-8">
          <h4 className="text-sm font-semibold text-[#8b8b8b] uppercase tracking-wider mb-4">
            What&apos;s included
          </h4>
          <ul className="space-y-4">
            {feature.details.map((detail, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-start gap-3"
              >
                <div className="mt-1 w-5 h-5 rounded-full bg-[#a6dbeb]/40 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3 h-3 text-[#2b8ac4]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-[#0B294b]">{detail}</span>
              </motion.li>
            ))}
          </ul>
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

interface ProductFeaturesSectionProps {
  features: Feature[];
}

/** Product page feature grid: mobile accordion + desktop 3-column (left cards | detail | right cards). */
export function ProductFeaturesSection({ features }: ProductFeaturesSectionProps) {
  const [activeFeature, setActiveFeature] = useState(0);
  const half = Math.ceil(features.length / 2);

  return (
    <>
      {/* Mobile: accordion list */}
      <div className="lg:hidden flex flex-col gap-2">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          const isActive = activeFeature === index;
          return (
            <div
              key={feature.title}
              className={`rounded-xl border-2 overflow-hidden transition-colors bg-white/80 ${isActive ? "border-[#2b8ac4] shadow-md shadow-[#2b8ac4]/10" : "border-[#cfcfcf]"}`}
            >
              <button
                type="button"
                onClick={() => setActiveFeature(isActive ? -1 : index)}
                className={`
                  w-full flex items-center gap-3 p-4 text-left transition-colors
                  ${isActive ? "bg-white border-[#2b8ac4]" : "hover:bg-white"}
                `}
              >
                <div
                  className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${isActive ? "bg-[#a6dbeb]/40" : "bg-[#e7ebed]"}`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-[#2b8ac4]" : "text-[#0B294b]"}`}
                  />
                </div>
                <span
                  className={`flex-1 font-semibold text-sm ${isActive ? "text-[#2b8ac4]" : "text-[#0B294b]"}`}
                >
                  {feature.title}
                </span>
                <motion.span
                  animate={{ rotate: isActive ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0 text-[#8b8b8b]"
                >
                  <ChevronDown className="w-5 h-5" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden border-t border-[#e7ebed]"
                  >
                    <div className="p-4 pt-2 bg-white space-y-3">
                      <p className="text-sm text-[#617b5d]">{feature.description}</p>
                      <div>
                        <p className="text-xs font-semibold text-[#8b8b8b] uppercase tracking-wider mb-2">
                          What&apos;s included
                        </p>
                        <ul className="space-y-2">
                          {feature.details.map((detail, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-[#0B294b]"
                            >
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#2b8ac4] shrink-0" />
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Desktop: 3-column layout */}
      <div className="hidden lg:block w-screen max-w-none relative left-1/2 -translate-x-1/2">
        <div className="grid grid-cols-[minmax(220px,280px)_minmax(380px,2fr)_minmax(220px,280px)] gap-6 lg:gap-8 w-full min-w-0 max-w-[2000px] mx-auto items-start px-4">
          <div className="flex flex-col gap-4">
            {features.slice(0, half).map((feature, i) => (
              <ProductFeatureCard
                key={feature.title}
                feature={feature}
                index={i}
                isActive={activeFeature === i}
                onClick={() => setActiveFeature(i)}
              />
            ))}
          </div>
          <div className="flex justify-center min-w-0">
            <ProductFeatureDetails
              feature={features[activeFeature >= 0 ? activeFeature : 0]}
            />
          </div>
          <div className="flex flex-col gap-4">
            {features.slice(half).map((feature, i) => {
              const index = i + half;
              return (
                <ProductFeatureCard
                  key={feature.title}
                  feature={feature}
                  index={index}
                  isActive={activeFeature === index}
                  onClick={() => setActiveFeature(index)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

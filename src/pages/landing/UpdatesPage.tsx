import { Sparkles, Calendar, Rocket, CheckCircle2, FileText, RefreshCw, Shield, Zap } from "lucide-react";
import { HeaderLinks } from "./HeaderLinks";
import { Footer } from "./Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface Update {
  date: string;
  version?: string;
  title: string;
  description: string;
  type: "feature" | "improvement" | "fix" | "announcement";
  items?: string[];
}

const updates: Update[] = [
  {
    date: "February 16, 2026",
    version: "v1.0.0",
    title: "We're Live",
    description: "MasterView Portals launched today. Built for contract-based and growing teams who need structure without the complexity—or the premium price tag.",
    type: "announcement",
    items: [
      "Quote builder with contract generation",
      "Change order tracking",
      "Payment management",
      "Client portal",
      "Workspace-based access control",
      "Materials library",
      "Document generation"
    ]
  }
];

const typeConfig = {
  feature: { icon: Rocket, color: "bg-[#a6dbeb]/40", textColor: "text-[#2b8ac4]", borderColor: "border-[#a6dbeb]" },
  improvement: { icon: Zap, color: "bg-[#96ab94]/30", textColor: "text-[#617b5d]", borderColor: "border-[#96ab94]" },
  fix: { icon: Shield, color: "bg-[#e7ebed]", textColor: "text-[#8b8b8b]", borderColor: "border-[#cfcfcf]" },
  announcement: { icon: Sparkles, color: "bg-[#a6dbeb]/40", textColor: "text-[#2b8ac4]", borderColor: "border-[#2b8ac4]" }
};

export default function UpdatesPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#e7ebed]">
      <HeaderLinks />

      <main>
        {/* Hero + Timeline — one section, one background (orbs + pattern) to bottom of content, not footer */}
        <section className="relative min-h-screen overflow-hidden bg-[#e7ebed] pb-16">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute w-[600px] h-[600px] bg-[#a6dbeb]/40 rounded-full blur-3xl -top-40 -right-40 animate-pulse-soft" />
            <div className="absolute w-[500px] h-[500px] bg-[#a6dbeb]/25 rounded-full blur-3xl top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse-soft animation-delay-500" />
            <div className="absolute w-[400px] h-[400px] bg-[#e7ebed]/60 rounded-full blur-3xl bottom-0 left-0 animate-pulse-soft animation-delay-1000" />
          </div>
          <motion.div
            style={{ y: backgroundY }}
            className="absolute inset-0 z-[1] isometric-pattern opacity-70 pointer-events-none"
          />

          {/* Hero title */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center updates-text-halo"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#a6dbeb]/40 border border-[#a6dbeb] mb-6"
              >
                <Sparkles className="w-4 h-4 text-[#2b8ac4]" />
                <span className="text-sm font-medium text-[#0B294b]">
                  Product Updates
                </span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0B294b] leading-tight mb-6"
              >
                What's new
                <span className="block text-[#2b8ac4]">and what's next</span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-lg sm:text-xl text-[#617b5d] leading-relaxed max-w-3xl mx-auto"
              >
                Stay up to date with the latest features, improvements, and fixes we're building 
                for contract-based businesses.
              </motion.p>
            </motion.div>
          </div>

          {/* Timeline — same section, no new background */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-24 relative z-10">
            <div className="max-w-4xl mx-auto">
              {/* Timeline line */}
              <div className="absolute left-8 md:left-1/2 md:-translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-[#2b8ac4] via-[#a6dbeb] to-transparent opacity-30" />

              <div className="space-y-12">
                {updates.map((update, index) => {
                  const config = typeConfig[update.type];
                  const Icon = config.icon;
                  const isEven = index % 2 === 0;

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className={`relative flex flex-col md:flex-row gap-6 md:gap-8 ${
                        isEven ? 'md:flex-row-reverse' : ''
                      }`}
                    >
                      {/* Timeline dot */}
                      <div className="absolute left-8 md:left-1/2 md:-translate-x-1/2 -translate-y-1 w-4 h-4 rounded-full bg-[#2b8ac4] border-4 border-white shadow-md z-10" />

                      {/* Date badge */}
                      <div className={`flex-shrink-0 w-32 md:w-40 updates-text-halo ${isEven ? 'md:text-right' : ''}`}>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e7ebed] border border-[#cfcfcf]">
                          <Calendar className="w-3 h-3 text-[#8b8b8b]" />
                          <span className="text-xs font-medium text-[#0B294b]">{update.date}</span>
                        </div>
                        {update.version && (
                          <p className="text-xs text-[#8b8b8b] mt-1">{update.version}</p>
                        )}
                      </div>

                      {/* Update card */}
                      <div className="flex-1 ml-12 md:ml-0">
                        <Card className={`border-2 transition-all duration-300 hover:shadow-lg ${
                          index === 0 
                            ? 'border-[#2b8ac4] bg-gradient-to-br from-white to-[#a6dbeb]/10' 
                            : 'border-[#cfcfcf] bg-white hover:border-[#a6dbeb]'
                        }`}>
                          <CardHeader>
                            <div className="flex items-start gap-4">
                              <div className={`w-12 h-12 rounded-xl ${config.color} flex items-center justify-center flex-shrink-0`}>
                                <Icon className={`w-6 h-6 ${config.textColor}`} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <CardTitle className="text-xl font-serif text-[#0B294b]">{update.title}</CardTitle>
                                  {index === 0 && (
                                    <span className="px-2 py-0.5 text-xs font-semibold bg-[#2b8ac4] text-white rounded-full">
                                      New
                                    </span>
                                  )}
                                </div>
                                <CardDescription className="text-[#617b5d] leading-relaxed">
                                  {update.description}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          {update.items && update.items.length > 0 && (
                            <CardContent>
                              <ul className="space-y-2">
                                {update.items.map((item, itemIndex) => (
                                  <motion.li
                                    key={itemIndex}
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.3, delay: itemIndex * 0.05 }}
                                    className="flex items-start gap-3"
                                  >
                                    <CheckCircle2 className="w-4 h-4 text-[#2b8ac4] flex-shrink-0 mt-0.5" />
                                    <span className="text-sm text-[#617b5d]">{item}</span>
                                  </motion.li>
                                ))}
                              </ul>
                            </CardContent>
                          )}
                        </Card>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

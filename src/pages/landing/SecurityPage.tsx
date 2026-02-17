import { Shield, Lock, Database, HardDrive, RefreshCw, Eye, Server, CheckCircle2 } from "lucide-react";
import { HeaderLinks } from "./HeaderLinks";
import { Footer } from "./Footer";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";

export default function SecurityPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const featuresScrollRef = useRef<HTMLDivElement>(null);
  const measuresScrollRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeMobileFeature, setActiveMobileFeature] = useState(0);
  const [activeMobileMeasure, setActiveMobileMeasure] = useState(0);

  const handleFeaturesScroll = () => {
    if (!featuresScrollRef.current) return;
    const scrollLeft = featuresScrollRef.current.scrollLeft;
    const cardWidth = featuresScrollRef.current.offsetWidth * 0.85 + 16; // 85vw + gap
    const index = Math.round(scrollLeft / cardWidth);
    setActiveMobileFeature(index);
  };

  const handleMeasuresScroll = () => {
    if (!measuresScrollRef.current) return;
    const scrollLeft = measuresScrollRef.current.scrollLeft;
    const cardWidth = measuresScrollRef.current.offsetWidth * 0.70 + 12; // 70vw + gap
    const index = Math.round(scrollLeft / cardWidth);
    setActiveMobileMeasure(index);
  };
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  const securityFeatures = [
    {
      icon: Lock,
      title: "End-to-End Encryption",
      shortDesc: "TLS 1.3 & AES-256",
      description: "All data in transit is protected by industry-standard TLS 1.3 encryption protocols. Data at rest is encrypted using AES-256 encryption.",
      highlights: ["TLS 1.3 in transit", "AES-256 at rest", "Zero plaintext storage"],
    },
    {
      icon: Database,
      title: "Row-Level Security",
      shortDesc: "Hand-crafted RLS policies",
      description: "Our database implements hand-crafted Row-Level Security (RLS) policies that have been meticulously reviewed and tested multiple times.",
      highlights: ["Manual policy audits", "Per-user isolation", "Defense in depth"],
    },
    {
      icon: Server,
      title: "Network Isolation",
      shortDesc: "Firewalls & private networks",
      description: "Our infrastructure operates behind advanced network firewalls with strict ingress and egress rules. Database connections are isolated within private networks.",
      highlights: ["Strict firewall rules", "Private subnets", "Encrypted pools"],
    },
    {
      icon: Eye,
      title: "Audit Logging",
      shortDesc: "Complete activity trail",
      description: "Every database operation, authentication attempt, and access request is logged with detailed metadata including timestamps and user identifiers.",
      highlights: ["Full request logs", "Forensic analysis", "Real-time alerts"],
    }
  ];

  const backupFeatures = [
    {
      icon: HardDrive,
      title: "Off-Grid Backups",
      description: "Air-gapped backups stored in physically secure locations, completely off the network for maximum protection against digital threats.",
    },
    {
      icon: RefreshCw,
      title: "Weekly Snapshots",
      description: "Automated weekly backups with multiple restore points, enabling quick rollback to any point within the retention window.",
    }
  ];

  const additionalMeasures = [
    { title: "Role-Based Access Control", desc: "Fine-grained permissions at app and database levels" },
    { title: "Secure Authentication", desc: "OAuth 2.0, JWT tokens, optional MFA" },
    { title: "Rate Limiting", desc: "Protection against brute force attacks" },
    { title: "Regular Audits", desc: "Continuous monitoring and patching" },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-[#e7ebed]">
      <HeaderLinks />

      <main>
        <section className="relative overflow-hidden bg-[#e7ebed]">
          <motion.div
            style={{ y: backgroundY }}
            className="absolute inset-0 bg-grid opacity-30"
          />
          {/* Network mesh texture - right 40% of page */}
          <div 
            className="absolute top-0 right-0 bottom-0 w-[40%] network-mesh opacity-[0.85] pointer-events-none"
            style={{ 
              maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0) 100%)',
              WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0) 100%)'
            }}
          />
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute w-[600px] h-[600px] bg-[#a6dbeb]/40 rounded-full blur-3xl -top-40 -right-40 animate-pulse-soft" />
            <div className="absolute w-[500px] h-[500px] bg-[#a6dbeb]/25 rounded-full blur-3xl top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse-soft animation-delay-500" />
            <div className="absolute w-[400px] h-[400px] bg-[#e7ebed]/60 rounded-full blur-3xl bottom-0 left-0 animate-pulse-soft animation-delay-1000" />
          </div>

          {/* Hero */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#a6dbeb]/40 border border-[#a6dbeb] mb-6"
              >
                <Shield className="w-4 h-4 text-[#2b8ac4]" />
                <span className="text-sm font-medium text-[#2b8ac4]">Security</span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0B294b] leading-tight mb-4"
              >
                Enterprise-Grade <span className="text-[#2b8ac4]">Security</span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-base sm:text-lg text-[#617b5d] leading-relaxed max-w-2xl mx-auto"
              >
                Your data is protected by enterprise-grade security measures, carefully crafted access controls, and comprehensive backup strategies.
              </motion.p>
            </motion.div>
          </div>

          {/* Security Features - Horizontal scroll on mobile, interactive on desktop */}
          <div className="relative z-10 py-8">
            {/* Mobile: Horizontal scrolling cards */}
            <div className="md:hidden">
              <div 
                ref={featuresScrollRef}
                onScroll={handleFeaturesScroll}
                className="flex gap-4 overflow-x-auto pb-4 px-4 snap-x snap-mandatory scrollbar-hide"
              >
                {securityFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={index}
                      className="flex-shrink-0 w-[85vw] snap-center"
                    >
                      <div className="bg-white rounded-2xl border border-[#cfcfcf] p-5 h-full shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-[#a6dbeb]/40 flex items-center justify-center">
                            <Icon className="w-6 h-6 text-[#2b8ac4]" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-[#0B294b] text-base">{feature.title}</h3>
                            <p className="text-xs text-[#8b8b8b]">{feature.shortDesc}</p>
                          </div>
                        </div>
                        <p className="text-sm text-[#617b5d] leading-relaxed mb-4">{feature.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {feature.highlights.map((h, i) => (
                            <span key={i} className="text-xs px-2 py-1 bg-[#e7ebed] rounded-full text-[#0B294b]">
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-center gap-2 mt-2">
                {securityFeatures.map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                      activeMobileFeature === i ? 'bg-[#2b8ac4]' : 'bg-[#cfcfcf]'
                    }`} 
                  />
                ))}
              </div>
            </div>

            {/* Desktop: Interactive left-right layout */}
            <div className="hidden md:block container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-5 gap-8 items-start">
                  {/* Left: Feature selector */}
                  <div className="col-span-2 space-y-3">
                    {securityFeatures.map((feature, index) => {
                      const Icon = feature.icon;
                      const isActive = activeFeature === index;
                      return (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, x: -30 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                          onClick={() => setActiveFeature(index)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                            isActive 
                              ? "bg-white border-[#2b8ac4] shadow-lg shadow-[#2b8ac4]/10" 
                              : "bg-white/50 border-[#cfcfcf] hover:bg-white hover:border-[#a6dbeb]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                              isActive ? "bg-[#a6dbeb]/40" : "bg-[#e7ebed]"
                            }`}>
                              <Icon className={`w-5 h-5 transition-colors ${isActive ? "text-[#2b8ac4]" : "text-[#0B294b]"}`} />
                            </div>
                            <div>
                              <h3 className={`font-semibold text-sm transition-colors ${isActive ? "text-[#2b8ac4]" : "text-[#0B294b]"}`}>
                                {feature.title}
                              </h3>
                              <p className="text-xs text-[#8b8b8b]">{feature.shortDesc}</p>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Right: Feature detail */}
                  <div className="col-span-3">
                    <motion.div
                      key={activeFeature}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-2xl border border-[#cfcfcf] shadow-xl p-8"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-xl bg-[#a6dbeb]/40 flex items-center justify-center">
                          {(() => {
                            const Icon = securityFeatures[activeFeature].icon;
                            return <Icon className="w-7 h-7 text-[#2b8ac4]" />;
                          })()}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-[#0B294b]">{securityFeatures[activeFeature].title}</h3>
                          <p className="text-sm text-[#8b8b8b]">{securityFeatures[activeFeature].shortDesc}</p>
                        </div>
                      </div>
                      <p className="text-[#617b5d] leading-relaxed mb-6">{securityFeatures[activeFeature].description}</p>
                      <div className="space-y-2">
                        {securityFeatures[activeFeature].highlights.map((h, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.1 }}
                            className="flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4 text-[#2b8ac4]" />
                            <span className="text-sm text-[#0B294b]">{h}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Data Protection - Alternating layout */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-serif text-2xl sm:text-3xl font-bold text-[#0B294b] text-center mb-12"
            >
              Data Protection & Backups
            </motion.h2>

            <div className="max-w-4xl mx-auto space-y-6">
              {backupFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.15 }}
                    className="flex flex-col sm:flex-row items-start gap-4 p-5 bg-white rounded-2xl border border-[#cfcfcf] shadow-sm"
                  >
                    <div className="w-14 h-14 rounded-xl bg-[#a6dbeb]/40 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-7 h-7 text-[#2b8ac4]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-[#0B294b] mb-2">{feature.title}</h3>
                      <p className="text-sm text-[#617b5d] leading-relaxed">{feature.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Privacy Commitment - Full width banner */}
          <div className="relative z-10 py-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mx-4 sm:mx-6 lg:mx-8"
            >
              <div className="max-w-4xl mx-auto bg-gradient-to-r from-[#0B294b] via-[#1a4a6e] to-[#2b8ac4] rounded-2xl p-6 sm:p-10 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-8 h-8" />
                    <h3 className="font-serif text-xl sm:text-2xl font-bold">Our Privacy Commitment</h3>
                  </div>
                  <p className="text-white/90 text-lg font-medium mb-3">
                    We do not sell your information. Period.
                  </p>
                  <p className="text-white/80 text-sm leading-relaxed">
                    Your data belongs to you. We treat it with the same respect and protection we expect for our own. 
                    This isn't just a policy—it's a fundamental principle.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Additional Measures - Horizontal scroll on mobile, grid on desktop */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-16 relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-serif text-2xl sm:text-3xl font-bold text-[#0B294b] text-center mb-8"
            >
              Additional Security Measures
            </motion.h2>

            {/* Mobile: Horizontal scroll */}
            <div className="md:hidden">
              <div 
                ref={measuresScrollRef}
                onScroll={handleMeasuresScroll}
                className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4"
              >
                {additionalMeasures.map((measure, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-[70vw] snap-center bg-white rounded-xl border border-[#cfcfcf] p-4"
                  >
                    <h4 className="font-semibold text-sm text-[#0B294b] mb-2">{measure.title}</h4>
                    <p className="text-xs text-[#617b5d] leading-relaxed">{measure.desc}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-2 mt-2">
                {additionalMeasures.map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                      activeMobileMeasure === i ? 'bg-[#2b8ac4]' : 'bg-[#cfcfcf]'
                    }`} 
                  />
                ))}
              </div>
            </div>

            {/* Desktop: 2x2 grid with stagger */}
            <div className="hidden md:grid grid-cols-2 gap-4 max-w-3xl mx-auto">
              {additionalMeasures.map((measure, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, y: 0, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-xl border border-[#cfcfcf] p-5 hover:border-[#a6dbeb] hover:shadow-md transition-all"
                >
                  <h4 className="font-semibold text-[#0B294b] mb-2">{measure.title}</h4>
                  <p className="text-sm text-[#617b5d] leading-relaxed">{measure.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

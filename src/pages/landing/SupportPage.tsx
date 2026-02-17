import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, HelpCircle, MessageSquare, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeaderLinks } from "./HeaderLinks";
import { Footer } from "./Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

const BAR_HOVER_SCALE_X = 1.7;

export default function SupportPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activePanel, setActivePanel] = useState<number | null>(null);
  const isMobile = useIsMobile();

  // Redirect authenticated users to portal support
  useEffect(() => {
    if (!loading && user) {
      navigate("/internalsupport", { replace: true });
    }
  }, [user, loading, navigate]);

  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const supportOptions = [
    {
      icon: HelpCircle,
      title: "Support & Bug Reports",
      description: "Questions about using MasterView Portals or need to report an issue? We're here to help.",
      email: "support@masterviewportals.com",
      color: "bg-[#a6dbeb]/40",
      accent: "#2b8ac4",
    },
    {
      icon: MessageSquare,
      title: "Comments, Concerns. Critiques",
      description: "Have an idea for a feature or want to share feedback? We'd love to hear from you.",
      email: "info@masterviewportals.com",
      color: "bg-[#96ab94]/30",
      accent: "#617b5d",
    }
  ];

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-[#e7ebed] flex items-center justify-center">
        <div className="text-[#617b5d]">Loading...</div>
      </div>
    );
  }

  // If user is authenticated, they'll be redirected by the effect above
  if (user) {
    return null;
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-[#e7ebed]">
      <HeaderLinks />

      <main>
        {/* Hero + Support Options — one continuous background */}
        <section className="relative overflow-visible md:overflow-hidden bg-[#e7ebed] pt-24 pb-12">
          {/* Background decorations */}
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute w-[600px] h-[600px] bg-[#a6dbeb]/40 rounded-full blur-3xl -top-40 -right-40 animate-pulse-soft" />
            <div className="absolute w-[400px] h-[400px] bg-[#e7ebed]/60 rounded-full blur-3xl bottom-0 left-0 animate-pulse-soft animation-delay-1000" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#a6dbeb]/40 border border-[#a6dbeb] mb-6"
              >
                <HelpCircle className="w-4 h-4 text-[#2b8ac4]" />
                <span className="text-sm font-medium text-[#0B294b]">
                  Support
                </span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0B294b] leading-tight mb-6"
              >
                We're here to help
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg sm:text-xl text-[#617b5d] leading-relaxed max-w-3xl mx-auto mb-16"
              >
                Have questions, need assistance, or want to share feedback? Reach out to us. 
                We're real humans who use the product daily, and we're here to help.
              </motion.p>
            </div>
          </div>

          {/* Two-part bar graph — desktop: converges at top; mobile: full viewport width so both wedges touch screen edges */}
          <div className={`relative z-10 ${isMobile ? "left-1/2 -translate-x-1/2 w-screen max-w-none" : "container mx-auto px-4 sm:px-6 lg:px-8"}`}
            style={isMobile ? { width: "100vw" } : undefined}
          >
            <div className={isMobile ? "" : "max-w-4xl mx-auto"}>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={{
                  visible: { transition: { staggerChildren: 0.15 } },
                  hidden: {},
                }}
                className={`relative flex overflow-hidden ${isMobile ? "flex-col min-h-0" : "min-h-[340px] md:min-h-[380px] rounded-b-xl shadow-xl border border-[#cfcfcf] border-b-0"}`}
              >
                {supportOptions.map((option, index) => {
                  const Icon = option.icon;
                  const isLeft = index === 0;
                  if (isMobile) {
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        className={`group relative w-full flex flex-col overflow-hidden bg-white border border-[#cfcfcf] ${index === 0 ? "" : "mt-4 border-t-0"}`}
                        style={{
                          clipPath:
                            index === 0
                              ? "polygon(0 0, 85% 0, 100% 50%, 85% 100%, 0 100%)"   // right arrow (>)
                              : "polygon(0 50%, 15% 0, 100% 0, 100% 100%, 15% 100%)", // left arrow (<)
                          background: "linear-gradient(to top, #f8fafb 0%, white 100%)",
                        }}
                      >
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                          style={{
                            background: `linear-gradient(to top, ${option.accent}12 0%, transparent 50%)`,
                          }}
                        />
                        <div
                          className={`relative z-10 flex flex-col gap-3 p-5 ${
                            isLeft ? "items-start text-left" : "items-end text-right"
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-lg ${option.color} flex items-center justify-center ${
                              isLeft ? "" : "self-end"
                            }`}
                          >
                            <Icon className="w-5 h-5 text-[#2b8ac4]" />
                          </div>
                          <h3
                            className={`text-sm font-serif font-bold text-[#0B294b] ${
                              isLeft ? "" : "text-right"
                            }`}
                          >
                            {"titleLines" in option && option.titleLines ? (
                              option.titleLines.map((line, i) => (
                                <span key={i} className="block">
                                  {line}
                                </span>
                              ))
                            ) : (
                              option.title
                            )}
                          </h3>
                          <p className="text-[#617b5d] text-xs leading-relaxed">
                            {option.description}
                          </p>
                          <a
                            href={`mailto:${option.email}`}
                            className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#2b8ac4] ${!isLeft ? "self-end" : ""}`}
                          >
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{option.email}</span>
                            <ArrowRight
                              className={`w-3.5 h-3.5 shrink-0 ${isLeft ? "" : "rotate-180"}`}
                            />
                          </a>
                        </div>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.a
                      key={index}
                      href={`mailto:${option.email}`}
                      onHoverStart={() => setActivePanel(index)}
                      onHoverEnd={() => setActivePanel(null)}
                      variants={{
                        hidden: { scaleY: 0, opacity: 0.6 },
                        visible: {
                          scaleY: 1,
                          opacity: 1,
                          transition: {
                            type: "spring",
                            stiffness: 120,
                            damping: 20,
                          },
                        },
                      }}
                      whileHover={{
                        scaleX: BAR_HOVER_SCALE_X,
                        scaleY: 1.02,
                        transition: { duration: 0.35, ease: "easeOut" },
                      }}
                      className="group relative flex-1 flex flex-col justify-end overflow-hidden border-[#cfcfcf] border-b-0 z-0 hover:z-10"
                      style={{
                        transformOrigin: isLeft ? "bottom left" : "bottom right",
                        clipPath: isLeft
                          ? "polygon(0 100%, 0 0, 50% 0, 100% 100%)"
                          : "polygon(50% 0, 100% 0, 100% 100%, 0 100%)",
                        background: "linear-gradient(to top, #f8fafb 0%, white 100%)",
                        borderRightWidth: isLeft ? 1 : 0,
                        borderLeftWidth: isLeft ? 0 : 1,
                      }}
                    >
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                          background: `linear-gradient(to top, ${option.accent}12 0%, transparent 50%)`,
                        }}
                      />
                      <motion.div
                        className={`relative z-10 p-6 md:p-8 pb-8 ${isLeft ? "pr-10 md:pr-12 text-left" : "pl-10 md:pl-12 text-right"}`}
                        style={{ transformOrigin: isLeft ? "left center" : "right center" }}
                        animate={{ scaleX: activePanel === index ? 1 / BAR_HOVER_SCALE_X : 1 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                      >
                        <div className={isLeft ? "" : "flex flex-col items-end"}>
                          <motion.div
                            className={`w-12 h-12 rounded-xl ${option.color} flex items-center justify-center mb-4 ${isLeft ? "" : "self-end"}`}
                            whileHover={{ scale: 1.1 }}
                          >
                            <Icon className="w-6 h-6 text-[#2b8ac4]" />
                          </motion.div>
                          <h3 className="text-lg md:text-xl font-serif font-bold text-[#0B294b] mb-2 group-hover:text-[#2b8ac4] transition-colors">
                            {option.title}
                          </h3>
                          <p className="text-[#617b5d] text-sm leading-relaxed mb-4 max-w-[85%]">
                            {option.description}
                          </p>
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2b8ac4] group-hover:gap-2 transition-all duration-300">
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{option.email}</span>
                            <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 ${isLeft ? "" : "rotate-180"}`} />
                          </span>
                        </div>
                      </motion.div>
                    </motion.a>
                  );
                })}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Response Time Section */}
        <section className="pt-12 pb-12 bg-[#e7ebed] relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-20" />
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto"
            >
              <Card className="bg-white border border-[#cfcfcf] shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-serif text-[#0B294b] mb-2">What to Expect</CardTitle>
                  <CardDescription className="text-lg text-[#617b5d]">
                    We're a small team, but we're committed to getting back to you quickly.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-2 h-2 rounded-full bg-[#2b8ac4] mt-2 flex-shrink-0" />
                      <div>
                        <p className="font-semibold font-serif text-[#0B294b] mb-1">Response Time</p>
                        <p className="text-[#617b5d] text-sm">
                          We typically respond within 24-48 hours during business days. For urgent issues, 
                          we'll prioritize getting back to you as soon as possible.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-2 h-2 rounded-full bg-[#2b8ac4] mt-2 flex-shrink-0" />
                      <div>
                        <p className="font-semibold font-serif text-[#0B294b] mb-1">Bug Reports</p>
                        <p className="text-[#617b5d] text-sm">
                          When reporting bugs, please include as much detail as possible: what you were doing, 
                          what happened, and any error messages you saw. Screenshots help too.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-2 h-2 rounded-full bg-[#2b8ac4] mt-2 flex-shrink-0" />
                      <div>
                        <p className="font-semibold font-serif text-[#0B294b] mb-1">Feature Requests</p>
                        <p className="text-[#617b5d] text-sm">
                          We love hearing your ideas. Tell us what problem you're trying to solve, and we'll 
                          consider it for future updates.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="pt-12 pb-24 bg-[#e7ebed]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto"
            >
              <Card className="bg-gradient-to-br from-[#0B294b] to-[#2b8ac4] text-white border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="font-serif text-3xl mb-2">Need Help Getting Started?</CardTitle>
                  <CardDescription className="text-white/90 text-lg">
                    New to MasterView Portals? Check out our documentation or start a free trial.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      size="lg" 
                      className="bg-white text-[#2b8ac4] hover:bg-[#e7ebed] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5" 
                      asChild
                    >
                      <a href="/documentation">
                        View Documentation
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </a>
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="bg-white/10 text-white border-white/30 hover:bg-white/20" 
                      asChild
                    >
                      <a href="/register">Start Free Trial</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

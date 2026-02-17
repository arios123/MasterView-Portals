import { ArrowRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeaderLinks } from "./HeaderLinks";
import { Footer } from "./Footer";
import { allFeatures } from "./featuresData";
import { ProductFeaturesSection } from "./ProductFeaturesSection";
import { Card } from "@/components/ui/card";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function ProductFeaturesPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#e7ebed]">
      <HeaderLinks />

      <main>
        <section className="relative pt-16 pb-24 lg:pt-20 lg:py-32 bg-[#e7ebed] overflow-hidden">
          <motion.div
            style={{ y: backgroundY }}
            className="absolute inset-0 blueprint-grid-landing"
          />
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#a6dbeb]/30 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#e7ebed] rounded-full blur-3xl opacity-60" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl mx-auto text-center mb-16 lg:mb-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
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
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0B294b] leading-tight mb-6"
              >
                Everything your team{" "}
                <span className="text-gradient-features">needs</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-lg text-[#617b5d] leading-relaxed max-w-2xl mx-auto"
              >
                Purpose-built workflows for contract-based work — from first estimate to project completion.
              </motion.p>
            </div>

            <ProductFeaturesSection features={allFeatures} />
          </div>
        </section>

        {/* Additional Features */}
        {/* CTA Section */}
        <section className="py-24 bg-[#e7ebed] relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-20" />
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto"
            >
              <Card className="bg-white rounded-2xl border border-[#cfcfcf] shadow-smooth-lg p-8 lg:p-12 text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <h3 className="font-serif text-3xl sm:text-4xl font-bold text-[#0B294b] mb-4">
                    Ready to get started?
                  </h3>
                  <p className="text-lg text-[#617b5d] mb-8 max-w-2xl mx-auto">
                    Start your free trial and see how contract-aware workflows can transform how you manage projects.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <Button
                      size="lg"
                      className="text-base px-8 py-6 rounded-xl bg-[#2b8ac4] hover:bg-[#46b7d7] text-white transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                      asChild
                    >
                      <a href="/register">
                        Start free trial
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </a>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="text-base px-8 py-6 rounded-xl bg-transparent text-[#0B294b] border-[#cfcfcf] hover:bg-[#e7ebed] hover:border-[#8b8b8b] transition-all duration-200"
                      asChild
                    >
                      <a href="/pricing">See pricing</a>
                    </Button>
                  </div>
                </motion.div>
              </Card>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

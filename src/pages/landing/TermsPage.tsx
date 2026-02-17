import { useState, useEffect } from "react";
import { FileText, Loader2, Sparkles } from "lucide-react";
import { HeaderLinks } from "./HeaderLinks";
import { Footer } from "./Footer";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function TermsPage() {
  const [termsContent, setTermsContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  useEffect(() => {
    // Fetch the latest terms file
    const fetchTerms = async () => {
      try {
        setLoading(true);
        let latestVersion = 1;
        let foundText: string | null = null;
        
        // Check for latest version (try up to v10)
        for (let v = 10; v >= 1; v--) {
          try {
            const url = `${window.location.origin}/terms_v${v}.txt`;
            const response = await fetch(url, {
              method: 'GET',
              headers: {
                'Accept': 'text/plain, text/*, */*',
              },
              cache: 'no-cache',
            });
            
            if (response.ok) {
              const text = await response.text();
              if (!text.trim().startsWith('<!DOCTYPE') && 
                  !text.trim().startsWith('<!doctype') && 
                  !text.trim().startsWith('<html') &&
                  text.trim().length > 0) {
                latestVersion = v;
                foundText = text;
                break;
              }
            }
          } catch (e) {
            // Continue to next version
            console.debug(`Version ${v} not found, trying next...`);
          }
        }
        
        if (!foundText) {
          throw new Error("No terms file found");
        }
        
        if (foundText.trim().startsWith('<!DOCTYPE') || 
            foundText.trim().startsWith('<!doctype') || 
            foundText.trim().startsWith('<html')) {
          console.error('Received HTML instead of text file');
          throw new Error("Terms file not found - received HTML response");
        }
        
        setTermsContent(foundText);
        setError(null);
      } catch (err: any) {
        console.error("Error loading terms:", err);
        setError(err.message || "Failed to load terms and conditions. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#e7ebed]">
      <HeaderLinks />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-[#e7ebed] pt-8 pb-24">
          {/* Background decorations */}
          <motion.div 
            style={{ y: backgroundY }}
            className="absolute inset-0 bg-grid opacity-30"
          />
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute w-[600px] h-[600px] bg-[#a6dbeb]/40 rounded-full blur-3xl -top-40 -right-40 animate-pulse-soft" />
            <div className="absolute w-[400px] h-[400px] bg-[#e7ebed]/60 rounded-full blur-3xl bottom-0 left-0 animate-pulse-soft animation-delay-1000" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
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
                <FileText className="w-4 h-4 text-[#2b8ac4]" />
                <span className="text-sm font-medium text-[#0B294b]">
                  Terms & Conditions
                </span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0B294b] leading-tight mb-6"
              >
                Terms and Conditions
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-lg sm:text-xl text-[#617b5d] leading-relaxed max-w-3xl mx-auto mb-16"
              >
                Please read our terms and conditions carefully before using our services.
              </motion.p>
            </motion.div>
          </div>

          {/* Terms content — same section, one continuous background */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto"
            >
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-[#2b8ac4]" />
                  <span className="ml-3 text-[#617b5d]">Loading terms and conditions...</span>
                </div>
              ) : error ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center"
                >
                  <p className="text-red-600">{error}</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="bg-white rounded-2xl border border-[#cfcfcf] shadow-lg p-8 lg:p-12"
                >
                  <div className="prose prose-lg max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-[#617b5d] leading-relaxed text-sm md:text-base">
                      {termsContent}
                    </pre>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Summary Section */}
        <section className="py-24 bg-[#e7ebed] relative overflow-hidden">
          <motion.div 
            style={{ y: backgroundY }}
            className="absolute inset-0 bg-grid opacity-20"
          />
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white rounded-2xl border border-[#cfcfcf] shadow-lg p-8 lg:p-12">
                <h2 className="font-serif text-3xl font-bold text-[#0B294b] mb-4">Questions?</h2>
                <p className="text-[#617b5d] leading-relaxed mb-6">
                  If you have any questions about our terms and conditions, please don't hesitate to reach out. 
                  We're here to help clarify anything that might be unclear.
                </p>
                <a 
                  href="/support"
                  className="inline-flex items-center gap-2 text-[#2b8ac4] hover:text-[#46b7d7] font-medium transition-colors"
                >
                  Contact us
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

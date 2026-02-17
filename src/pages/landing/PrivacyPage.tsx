import { useState, useEffect } from "react";
import { Shield, Loader2, Sparkles } from "lucide-react";
import { HeaderLinks } from "./HeaderLinks";
import { Footer } from "./Footer";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function PrivacyPage() {
  const [privacyContent, setPrivacyContent] = useState<string>("");
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
    // Fetch the privacy file from public/privacy.txt
    const fetchPrivacy = async () => {
      try {
        setLoading(true);
        const url = `${window.location.origin}/privacy.txt`;
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
            setPrivacyContent(text);
            setError(null);
          } else {
            throw new Error("Privacy file not found - received HTML response");
          }
        } else {
          throw new Error("Privacy file not found");
        }
      } catch (err: any) {
        console.error("Error loading privacy policy:", err);
        setError(err.message || "Failed to load privacy policy. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPrivacy();
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
                <Shield className="w-4 h-4 text-[#2b8ac4]" />
                <span className="text-sm font-medium text-[#0B294b]">
                  Privacy Policy
                </span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0B294b] leading-tight mb-6"
              >
                Your Privacy Matters
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-lg sm:text-xl text-[#617b5d] leading-relaxed max-w-3xl mx-auto mb-16"
              >
                We're committed to protecting your data. Learn how we collect, use, and protect your personal information.
              </motion.p>
            </motion.div>
          </div>

          {/* Privacy content — same section, one continuous background */}
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
                  <span className="ml-3 text-[#617b5d]">Loading privacy policy...</span>
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
                      {privacyContent}
                    </pre>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Privacy Commitment Section */}
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
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#a6dbeb]/40 flex items-center justify-center">
                    <Shield className="w-8 h-8 text-[#2b8ac4]" />
                  </div>
                  <div>
                    <h2 className="font-serif text-3xl font-bold text-[#0B294b] mb-2">Our Privacy Commitment</h2>
                    <p className="text-[#617b5d]">Simple, clear, and honest.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-[#617b5d] leading-relaxed text-lg">
                    <strong className="text-[#0B294b]">We do not sell your information.</strong> Period.
                  </p>
                  <p className="text-[#617b5d] leading-relaxed">
                    We understand the importance of data privacy because we value our own privacy. We don't like 
                    our information leaked, and we would never expect anything less from our customers. Your data 
                    belongs to you, and we treat it with the same respect and protection we expect for our own.
                  </p>
                  <p className="text-[#617b5d] leading-relaxed">
                    Your information is used solely to provide you with the services you've requested. We don't 
                    share, sell, or monetize your data in any way. This isn't just a policy—it's a fundamental 
                    principle that guides everything we do.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

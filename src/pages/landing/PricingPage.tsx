import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeaderLinks } from "./HeaderLinks";
import { Footer } from "./Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";

export default function PricingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  const monthlyPrice = 200;
  const yearlyPrice = 2000;
  const monthlyYearlyTotal = monthlyPrice * 12; // $2400
  const yearlySavings = monthlyYearlyTotal - yearlyPrice; // $400
  const savingsPercentage = Math.round((yearlySavings / monthlyYearlyTotal) * 100); // ~17%

  const [isYearly, setIsYearly] = useState(false);

  const features = [
    "Unlimited projects and clients",
    "Quote builder with one-click contract generation",
    "Change order tracking with automatic contract updates",
    "Payment tracking and milestone schedules",
    "Client portal with approvals and lookbooks",
    "Materials and inventory management",
    "Document templates and generation",
    "Custom roles & workspace permissions",
    "Team collaboration tools",
    "Full audit trail and history",
    "Export your data anytime",
    "Priority support"
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-[#e7ebed]">
      <HeaderLinks />

      <main>
        {/* One continuous section: hero + pricing cards, single background */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#e7ebed] via-white to-white pt-8 pb-24">
          <motion.div
            style={{ y: backgroundY }}
            className="absolute inset-0 bg-grid opacity-30"
          />
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute w-[600px] h-[600px] bg-[#a6dbeb]/40 rounded-full blur-3xl -top-40 -right-40 animate-pulse-soft" />
            <div className="absolute w-[400px] h-[400px] bg-[#e7ebed]/60 rounded-full blur-3xl bottom-0 left-0 animate-pulse-soft animation-delay-1000" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-6 relative z-10">
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
                <Sparkles className="w-4 h-4 text-[#2b8ac4]" />
                <span className="text-sm font-medium text-[#0B294b]">
                  Simple, Fair Pricing
                </span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0B294b] leading-tight mb-4"
              >
                One price. <span className="text-[#2b8ac4]">All features.</span>
              </motion.h1>
            </motion.div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-5xl mx-auto">
              {/* Billing Toggle */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-center gap-4 mb-12"
              >
                <span className={`text-sm font-medium ${!isYearly ? 'text-[#0B294b]' : 'text-[#8b8b8b]'}`}>
                  Monthly
                </span>
                <button
                  onClick={() => setIsYearly(!isYearly)}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    isYearly ? 'bg-[#2b8ac4]' : 'bg-[#cfcfcf]'
                  }`}
                >
                  <motion.div
                    className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md"
                    animate={{ x: isYearly ? 28 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
                <span className={`text-sm font-medium ${isYearly ? 'text-[#0B294b]' : 'text-[#8b8b8b]'}`}>
                  Yearly
                  <span className="ml-2 text-xs text-[#2b8ac4]">(Save {savingsPercentage}%)</span>
                </span>
              </motion.div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Monthly Plan */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  animate={{ scale: !isYearly ? 1.02 : 1 }}
                >
                  <Card className={`border-2 transition-all duration-300 h-full ${
                    !isYearly 
                      ? 'border-[#2b8ac4] shadow-lg bg-white' 
                      : 'border-[#cfcfcf] bg-white hover:border-[#a6dbeb]'
                  }`}>
                    <CardHeader>
                      <CardTitle className="text-2xl font-serif text-[#0B294b]">Monthly</CardTitle>
                      <CardDescription className="text-base mt-2 text-[#617b5d]">
                        Perfect for trying us out
                      </CardDescription>
                      <div className="mt-4">
                        <span className="text-5xl font-bold text-[#0B294b]">${monthlyPrice}</span>
                        <span className="text-[#8b8b8b] ml-2">/month</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        size="lg" 
                        className={`w-full mb-6 transition-all ${
                          !isYearly
                            ? 'bg-[#2b8ac4] hover:bg-[#46b7d7] text-white'
                            : 'bg-[#e7ebed] hover:bg-[#cfcfcf] text-[#0B294b]'
                        }`}
                        asChild
                      >
                        <a href="/register">
                          Try for free
                          <ArrowRight className="h-5 w-5 ml-2" />
                        </a>
                      </Button>
                      <ul className="space-y-3">
                        {features.map((feature, index) => (
                          <motion.li
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: index * 0.03 }}
                            className="flex items-start gap-3"
                          >
                            <Check className="h-5 w-5 text-[#2b8ac4] flex-shrink-0 mt-0.5" />
                            <span className="text-[#617b5d]">{feature}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Yearly Plan */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  animate={{ scale: isYearly ? 1.02 : 1 }}
                >
                  <Card className={`border-2 relative transition-all duration-300 h-full ${
                    isYearly 
                      ? 'border-[#2b8ac4] shadow-lg bg-white' 
                      : 'border-[#96ab94] bg-white hover:border-[#a6dbeb]'
                  }`}>
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="absolute -top-4 left-1/2 -translate-x-1/2"
                    >
                      <span className="bg-[#96ab94] text-white px-4 py-1 rounded-full text-sm font-semibold shadow-md">
                        Save {savingsPercentage}%
                      </span>
                    </motion.div>
                    <CardHeader>
                      <CardTitle className="text-2xl font-serif text-[#0B294b]">Yearly</CardTitle>
                      <CardDescription className="text-base mt-2 text-[#617b5d]">
                        Best value for growing teams
                      </CardDescription>
                      <div className="mt-4">
                        <span className="text-5xl font-bold text-[#0B294b]">${yearlyPrice}</span>
                        <span className="text-[#8b8b8b] ml-2">/year</span>
                      </div>
                      <p className="text-sm text-[#8b8b8b] mt-2">
                        Just ${Math.round(yearlyPrice / 12)}/month
                      </p>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        size="lg" 
                        className={`w-full mb-6 transition-all ${
                          isYearly
                            ? 'bg-[#2b8ac4] hover:bg-[#46b7d7] text-white'
                            : 'bg-[#e7ebed] hover:bg-[#cfcfcf] text-[#0B294b]'
                        }`}
                        asChild
                      >
                        <a href="/register">
                          Try for free
                          <ArrowRight className="h-5 w-5 ml-2" />
                        </a>
                      </Button>
                      <ul className="space-y-3">
                        {features.map((feature, index) => (
                          <motion.li
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: index * 0.03 }}
                            className="flex items-start gap-3"
                          >
                            <Check className="h-5 w-5 text-[#2b8ac4] flex-shrink-0 mt-0.5" />
                            <span className="text-[#617b5d]">{feature}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Start with a free trial — same section, continuous background */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0B294b] mb-6">
                Start with a free trial
              </h2>
              <p className="text-lg text-[#617b5d] mb-8 leading-relaxed">
                Test all features risk-free for 30 days. If you don't love it, cancel anytime — no questions asked, no hassle.
              </p>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="bg-[#e7ebed] border border-[#cfcfcf]">
                    <CardHeader>
                      <CardTitle className="text-xl font-serif text-[#0B294b]">Free Trial</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[#617b5d]">
                        Full access to all features for 30 days. Explore everything we offer with zero commitment.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="bg-[#e7ebed] border border-[#cfcfcf]">
                    <CardHeader>
                      <CardTitle className="text-xl font-serif text-[#0B294b]">Easy Cancellation</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[#617b5d]">
                        Cancel anytime from your account settings - just a simple click. Export your data anytime for free.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <Button 
                  size="lg" 
                  className="bg-[#2b8ac4] hover:bg-[#46b7d7] text-white text-lg px-8 py-6 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all" 
                  asChild
                >
                  <a href="/register">
                    Start Your Free Trial
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </a>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 bg-[#e7ebed] relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-20" />
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0B294b] mb-10 text-center">
                Frequently Asked Questions
              </h2>
              <div className="space-y-6">
                {[
                  {
                    question: "What's included in the free trial?",
                    answer: "Everything. You get full access to all features, unlimited projects, and all premium capabilities during your 30-day trial period."
                  },
                  {
                    question: "What happens if I cancel?",
                    answer: "You'll continue to have access until the end of your current billing period. After that, your account will be paused, and you can reactivate anytime."
                  },
                  {
                    question: "Do you offer refunds?",
                    answer: "We offer a 30-day free trial so you can test everything risk-free. If you're not satisfied within the first 30 days of paid subscription, contact us for a full refund."
                  }
                ].map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="border border-[#cfcfcf] bg-white hover:border-[#a6dbeb] transition-all">
                      <CardHeader>
                        <CardTitle className="text-lg font-serif text-[#0B294b]">{faq.question}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-[#617b5d] leading-relaxed">{faq.answer}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

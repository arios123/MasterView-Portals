import { ArrowRight, Sparkles, Users, Target, TrendingUp, Heart, Mail, Clock, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeaderLinks } from "./HeaderLinks";
import { Footer } from "./Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";

export default function AboutPage() {
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  const values = [
    {
      icon: Target,
      title: "Constant Refinement",
      description: "We're always working to refine and improve every aspect of the platform. No feature is ever 'done'—we continuously enhance based on real-world usage and feedback.",
      color: "bg-[#a6dbeb]/40"
    },
    {
      icon: Users,
      title: "Industry Partnerships",
      description: "We maintain strong partnerships with contract-based businesses. These relationships help us understand what professionals actually need day-to-day.",
      color: "bg-[#96ab94]/30"
    },
    {
      icon: TrendingUp,
      title: "Collaborative Development",
      description: "Through consistent collaboration with our partners, we ensure every feature we build addresses real challenges and provides genuine value.",
      color: "bg-[#a6dbeb]/40"
    }
  ];

  useEffect(() => {
    if (!carouselApi) return;
    setSelectedIndex(carouselApi.selectedScrollSnap());
    carouselApi.on("select", () => setSelectedIndex(carouselApi.selectedScrollSnap()));
  }, [carouselApi]);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#e7ebed]">
      <HeaderLinks />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-[#e7ebed] pt-8">
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
                <Heart className="w-4 h-4 text-[#2b8ac4]" />
                <span className="text-sm font-medium text-[#0B294b]">
                  About Us
                </span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif text-black leading-tight mb-6"
              >
                Our Story
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-lg sm:text-xl text-[#617b5d] leading-relaxed max-w-3xl mx-auto mb-16"
              >
                A family-owned and operated company, we've spent over a year building MasterView Portals 
                through close collaboration with industry partners. Many drafts later, this is what we've created.
              </motion.p>
            </motion.div>
            {/* Cards — same section, no background change */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto"
            >
              <div className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <Card className="border border-[#cfcfcf] bg-white hover:border-[#a6dbeb] transition-all">
                    <CardHeader>
                      <CardTitle className="text-2xl font-serif flex items-center gap-3 text-[#0B294b]">
                        <Heart className="h-6 w-6 text-[#2b8ac4]" />
                        Family Owned & Operated
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[#617b5d] leading-relaxed mb-4">
                        MasterView Portals is a family-owned and operated company. This isn't just a business to us—it's 
                        a passion project born from understanding the real challenges contract-based businesses face every day.
                      </p>
                      <p className="text-[#617b5d] leading-relaxed">
                        Being family-owned means we have the flexibility to truly listen to our users and respond quickly. 
                        We're not bound by corporate bureaucracy—we're driven by a genuine desire to build something 
                        that makes your work life better.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                >
                  <Card className="border border-[#cfcfcf] bg-white hover:border-[#a6dbeb] transition-all">
                    <CardHeader>
                      <CardTitle className="text-2xl font-serif flex items-center gap-3 text-[#0B294b]">
                        <Clock className="h-6 w-6 text-[#2b8ac4]" />
                        Over a Year in the Making
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-[#617b5d] leading-relaxed mb-4">
                        We've spent over a year building MasterView Portals to get to where we are today. This wasn't 
                        a rushed launch—it was a careful, deliberate process of working closely with our partners in 
                        contract-based businesses.
                      </p>
                      <p className="text-[#617b5d] leading-relaxed mb-4">
                        Through many drafts, countless iterations, and continuous refinement, we've shaped the platform 
                        into what it is today. Every feature, every workflow, and every detail has been thoughtfully considered 
                        and refined based on real-world feedback.
                      </p>
                      <p className="text-[#617b5d] leading-relaxed">
                        This journey of continuous improvement continues today. We're always refining, always listening, 
                        and always working to make the platform better.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Our Approach Section */}
        <section className="pt-6 pb-12 bg-[#e7ebed] relative overflow-hidden">
          <motion.div 
            style={{ y: backgroundY }}
            className="absolute inset-0 bg-grid opacity-20"
          />
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-[#0B294b] mb-4">
                  Our Commitment to Excellence
                </h2>
                <p className="text-lg text-[#617b5d] max-w-2xl mx-auto">
                  We believe in continuous improvement and industry collaboration to build tools that truly matter.
                </p>
              </div>

              {/* Mobile: slideshow carousel */}
              <div className="md:hidden mb-6">
                <Carousel setApi={setCarouselApi} opts={{ loop: true }} className="w-full">
                  <CarouselContent className="-ml-0">
                    {values.map((value, index) => {
                      const Icon = value.icon;
                      return (
                        <CarouselItem key={index} className="pl-0 basis-full">
                          <Card className="border border-[#cfcfcf] hover:border-[#a6dbeb] transition-all duration-300 bg-white">
                            <CardHeader>
                              <div className={`w-12 h-12 rounded-xl ${value.color} flex items-center justify-center mb-4`}>
                                <Icon className="w-6 h-6 text-[#2b8ac4]" />
                              </div>
                              <CardTitle className="text-xl font-serif text-[#0B294b]">{value.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <CardDescription className="text-[#617b5d] leading-relaxed">
                                {value.description}
                              </CardDescription>
                            </CardContent>
                          </Card>
                        </CarouselItem>
                      );
                    })}
                  </CarouselContent>
                  <div className="flex items-center justify-between mt-4 px-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full h-9 w-9 shrink-0 border-[#a6dbeb] text-[#2b8ac4] hover:bg-[#a6dbeb]/20"
                      onClick={() => carouselApi?.scrollPrev()}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="sr-only">Previous</span>
                    </Button>
                    <div className="flex gap-2">
                      {values.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          aria-label={`Go to slide ${index + 1}`}
                          className={`h-2 w-2 rounded-full transition-colors ${
                            index === selectedIndex ? "bg-[#2b8ac4] w-6" : "bg-[#a6dbeb]/50"
                          }`}
                          onClick={() => carouselApi?.scrollTo(index)}
                        />
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full h-9 w-9 shrink-0 border-[#a6dbeb] text-[#2b8ac4] hover:bg-[#a6dbeb]/20"
                      onClick={() => carouselApi?.scrollNext()}
                    >
                      <ChevronRight className="h-4 w-4" />
                      <span className="sr-only">Next</span>
                    </Button>
                  </div>
                </Carousel>
              </div>

              {/* Desktop: grid */}
              <div className="hidden md:grid md:grid-cols-3 gap-8 mb-6">
                {values.map((value, index) => {
                  const Icon = value.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      whileHover={{ y: -8 }}
                    >
                      <Card className="border border-[#cfcfcf] hover:border-[#a6dbeb] transition-all duration-300 bg-white h-full">
                        <CardHeader>
                          <div className={`w-12 h-12 rounded-xl ${value.color} flex items-center justify-center mb-4`}>
                            <Icon className="w-6 h-6 text-[#2b8ac4]" />
                          </div>
                          <CardTitle className="text-xl font-serif text-[#0B294b]">{value.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="text-[#617b5d] leading-relaxed">
                            {value.description}
                          </CardDescription>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Contact & Custom Features Section */}
        <section className="pt-0 pb-12 bg-[#e7ebed] relative overflow-hidden">
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
              <Card className="bg-white border-2 border-[#2b8ac4] shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-serif flex items-center gap-3 text-[#0B294b]">
                    <Mail className="h-6 w-6 text-[#2b8ac4]" />
                    We're Always Open to Your Ideas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[#617b5d] leading-relaxed mb-4">
                    If you run a contract-based business and need something specific, we want to hear from you. 
                    We're always open to feedback and custom feature requests. Our goal is simple: 
                    <strong className="text-[#0B294b]"> we're here to make your lives easier.</strong>
                  </p>
                  <p className="text-[#617b5d] leading-relaxed mb-6">
                    If you have a specific need or an idea for a feature that would help your workflow, 
                    don't hesitate to reach out. Email us at{" "}
                    <a 
                      href="mailto:info@masterviewportals.com" 
                      className="text-[#2b8ac4] hover:text-[#46b7d7] font-semibold underline"
                    >
                      info@masterviewportals.com
                    </a>
                    {" "}and we can go from there. We're happy to work on integrating new aspects 
                    that would benefit you and other contract-based businesses.
                  </p>
                  <div className="bg-[#a6dbeb]/20 border border-[#a6dbeb] rounded-lg p-4">
                    <p className="text-[#617b5d] text-sm">
                      <strong className="text-[#0B294b]">Your feedback drives our development.</strong> 
                      {" "}Whether it's a small tweak or a major new feature, we take every request seriously 
                      and work with you to make it happen. That's the advantage of being a family-owned company—we 
                      can move quickly and prioritize what matters most to our users.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="pt-0 pb-24 bg-[#e7ebed]">
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
                  <CardTitle className="text-3xl font-serif mb-2">Experience the Difference</CardTitle>
                  <CardDescription className="text-white/90 text-lg">
                    Join contract-based businesses who trust MasterView Portals to power their projects.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      size="lg" 
                      className="bg-white text-[#2b8ac4] hover:bg-[#e7ebed] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5" 
                      asChild
                    >
                      <a href="/register">
                        Start your free trial
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </a>
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="bg-white/10 text-white border-white/30 hover:bg-white/20" 
                      asChild
                    >
                      <a href="/product/galaxy-of-features">Explore features</a>
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

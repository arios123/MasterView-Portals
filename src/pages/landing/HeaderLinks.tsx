import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useIsMobile } from "@/hooks/use-mobile";
import { navigationSections } from "./navigationData";
import { motion, AnimatePresence } from "framer-motion";

export function HeaderLinks() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();

  const isDocsPage = location.pathname.startsWith("/documentation");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open (mobile only)
  useEffect(() => {
    if (!isMobile) return;
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isMobile, mobileMenuOpen]);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isMobile && mobileMenuOpen
          ? "bg-[#e7ebed] border-b border-[#cfcfcf] shadow-smooth py-3"
          : isDocsPage
            ? scrolled
              ? "bg-[#e7ebed] border-b border-[#cfcfcf] shadow-smooth py-3"
              : "bg-[#e7ebed] py-5"
            : scrolled 
              ? "glass shadow-smooth py-3"
              : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo — on mobile keep above full-screen menu (z-50) */}
        <Link 
          to="/" 
          className={`flex items-center gap-2 group ${isMobile ? "relative z-50" : ""}`}
        >
          <img
            src="/MVP.png"
            alt="MasterView"
            className="h-12 w-auto"
          />
          <span className={`flex flex-col leading-tight text-lg font-semibold font-serif transition-colors ${
            scrolled ? "text-[#0B294b]" : "text-[#0B294b]"
          }`}>
            <span>MasterView</span>
            <span>Portals</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        {!isMobile && (
          <>
            <nav className="flex items-center gap-1">
              {navigationSections.filter((s) => ["Product", "Company", "Tutorials"].includes(s.title)).map((section) => (
                <div
                  key={section.title}
                  className="relative"
                  onMouseEnter={() => setOpenSection(section.title)}
                  onMouseLeave={() => setOpenSection(null)}
                >
                  <button
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      scrolled 
                        ? "text-[#0B294b] hover:text-[#2b8ac4] hover:bg-[#e7ebed]/80" 
                        : "text-[#0B294b] hover:text-[#2b8ac4] hover:bg-white/50"
                    }`}
                  >
                    {section.title}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${
                      openSection === section.title ? "rotate-180" : ""
                    }`} />
                  </button>
                  
                  {/* Dropdown */}
                  <div
                    className={`absolute left-0 top-full pt-2 transition-all duration-200 ${
                      openSection === section.title 
                        ? "opacity-100 translate-y-0 pointer-events-auto" 
                        : "opacity-0 -translate-y-2 pointer-events-none"
                    }`}
                  >
                    <div className="glass rounded-xl shadow-smooth-lg min-w-[200px] py-2">
                      {section.links.map((link) => (
                        <a
                          key={link.label}
                          href={link.href}
                          className="block px-4 py-2.5 text-sm text-[#617b5d] hover:text-[#0B294b] hover:bg-[#e7ebed]/80 transition-colors"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              
              <a
                href="/pricing"
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  scrolled 
                    ? "text-[#0B294b] hover:text-[#2b8ac4] hover:bg-[#e7ebed]/80" 
                    : "text-[#0B294b] hover:text-[#2b8ac4] hover:bg-white/50"
                }`}
              >
                Pricing
              </a>
              
              <a
                href="https://demo.masterviewportals.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  scrolled 
                    ? "text-[#0B294b] hover:text-[#2b8ac4] hover:bg-[#e7ebed]/80" 
                    : "text-[#0B294b] hover:text-[#2b8ac4] hover:bg-white/50"
                }`}
              >
                Live Demo
              </a>
            </nav>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <a
                href="/login"
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  scrolled 
                    ? "text-[#0B294b] hover:text-[#2b8ac4]" 
                    : "text-[#0B294b] hover:text-[#2b8ac4]"
                }`}
              >
                Sign in
              </a>
              <a
                href="/register"
                className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-[#2b8ac4] text-white hover:bg-[#46b7d7] transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Start free trial
              </a>
            </div>
          </>
        )}

        {/* Mobile Navigation — header bar (Sign in + hamburger) stays above full-screen menu (z-50) */}
        {isMobile && (
          <>
            <div className="flex items-center gap-2 relative z-50">
              <a
                href="/login"
                className="px-3 py-2 text-sm font-medium text-[#0B294b] hover:text-[#2b8ac4] transition-colors"
              >
                Sign in
              </a>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="relative flex items-center justify-center w-10 h-10 rounded-xl text-[#0B294b] hover:bg-[#e7ebed]/80 active:scale-95 transition-transform touch-manipulation"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
              >
                {/* Animated hamburger → X: three bars morph with spring */}
                <div className="relative w-5 h-5">
                  <motion.span
                    className="absolute left-0 top-0.5 w-5 h-0.5 rounded-full bg-[#0B294b] origin-center"
                    animate={
                      mobileMenuOpen
                        ? { rotate: 45, y: 7 }
                        : { rotate: 0, y: 0 }
                    }
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 26,
                    }}
                  />
                  <motion.span
                    className="absolute left-0 top-1/2 w-5 h-0.5 rounded-full bg-[#0B294b] origin-center -translate-y-1/2"
                    animate={
                      mobileMenuOpen
                        ? { opacity: 0, scaleX: 0 }
                        : { opacity: 1, scaleX: 1 }
                    }
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 26,
                    }}
                  />
                  <motion.span
                    className="absolute left-0 bottom-0.5 w-5 h-0.5 rounded-full bg-[#0B294b] origin-center"
                    animate={
                      mobileMenuOpen
                        ? { rotate: -45, y: -7 }
                        : { rotate: 0, y: 0 }
                    }
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 26,
                    }}
                  />
                </div>
              </button>
            </div>

            {/* Full-screen menu overlay — same background theme, below header (z-40; header z-50) */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-40 flex flex-col bg-[#e7ebed]"
                  style={{ top: 0, left: 0, right: 0, bottom: 0 }}
                >
                  {/* Same background theme as landing */}
                  <div className="absolute inset-0 blueprint-grid-landing opacity-30 pointer-events-none" />
                  <div className="absolute top-0 right-0 w-96 h-96 bg-[#a6dbeb]/30 rounded-full blur-3xl opacity-50 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#e7ebed] rounded-full blur-3xl opacity-60 pointer-events-none" />

                  {/* Content: padding-top to sit below header (header stays on top) */}
                  <div className="relative flex-1 flex flex-col min-h-0 pt-20 pb-6">
                    <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05, duration: 0.25 }}
                      >
                        <Accordion type="single" collapsible className="w-full">
                          {navigationSections.map((section) => (
                            <AccordionItem
                              key={section.title}
                              value={section.title}
                              className="border-[#cfcfcf]"
                            >
                              <AccordionTrigger className="text-[#0B294b] hover:text-[#2b8ac4] py-3 text-base">
                                {section.title}
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="space-y-1 pb-2">
                                  {section.links.map((link) => (
                                    <a
                                      key={link.label}
                                      href={link.href}
                                      onClick={() => setMobileMenuOpen(false)}
                                      className="block px-3 py-2.5 text-sm text-[#617b5d] hover:text-[#0B294b] hover:bg-[#e7ebed] rounded-lg transition-colors"
                                    >
                                      {link.label}
                                    </a>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </motion.div>
                    </div>
                    {/* Bottom: Pricing, Live Demo, Start free trial */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.25 }}
                      className="shrink-0 p-4 pt-3 border-t border-[#cfcfcf] bg-[#e7ebed]/80 space-y-2"
                    >
                      <a
                        href="/pricing"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full px-4 py-3 text-base font-medium text-[#0B294b] hover:text-[#2b8ac4] hover:bg-white/60 rounded-xl transition-colors text-center"
                      >
                        Pricing
                      </a>
                      <a
                        href="https://demo.masterviewportals.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full px-4 py-3 text-base font-medium text-[#0B294b] hover:text-[#2b8ac4] hover:bg-white/60 rounded-xl transition-colors text-center"
                      >
                        Live Demo
                      </a>
                      <a
                        href="/register"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full px-4 py-3.5 rounded-xl text-base font-semibold bg-[#2b8ac4] text-white hover:bg-[#46b7d7] transition-colors text-center shadow-sm"
                      >
                        Start free trial
                      </a>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </header>
  );
}

